package cn.zzy.qwen.service;

import cn.zzy.qwen.model.AgentAction;
import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.PendingPatch;
import cn.zzy.qwen.model.PatchApplyRequest;
import cn.zzy.qwen.model.PatchApplyResponse;
import cn.zzy.qwen.model.ToolResult;
import cn.zzy.qwen.tools.ToolRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @Mock
    private ModelBackendRouter modelBackendRouter;

    @Mock
    private ToolRegistry toolRegistry;

    @Mock
    private AgentPromptFactory promptFactory;

    @Mock
    private ToolTraceFormatter toolTraceFormatter;

    @Mock
    private ConversationMemoryService conversationMemoryService;

    @Mock
    private PendingPatchService pendingPatchService;

    private AgentService agentService;
    private AgentActionParser actionParser;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        actionParser = new AgentActionParser(objectMapper);
        agentService = new AgentService(
                modelBackendRouter,
                toolRegistry,
                actionParser,
                promptFactory,
                toolTraceFormatter,
                conversationMemoryService,
                pendingPatchService
        );
    }

    @Test
    void blocksPatchWithoutPreviewInSameTurn() throws Exception {
        when(conversationMemoryService.history("s1")).thenReturn(List.of());
        when(promptFactory.buildPlanningPrompt(any(), any(), any(), any())).thenReturn("prompt");
        when(modelBackendRouter.generate("prompt")).thenReturn(
                new ModelGeneration("ollama", objectMapper.writeValueAsString(new AgentAction("tool", null, "patch_file", Map.of(
                        "path", "a.txt",
                        "search", "old",
                        "replace", "new"
                ))), false),
                new ModelGeneration("ollama", objectMapper.writeValueAsString(new AgentAction("answer", "done", null, null)), false)
        );
        when(toolTraceFormatter.format(any()))
                .thenAnswer(invocation -> ((ToolResult) invocation.getArgument(0)).output());

        ChatResponse response = agentService.chat("s1", "please edit");

        assertThat(response.toolsUsed()).containsExactly("patch_file");
        assertThat(response.steps().get(1)).contains("allowed only after a matching successful preview_patch_file");
        verify(toolRegistry, never()).execute(eq("patch_file"), anyMap());
    }

    @Test
    void allowsPatchAfterMatchingPreview() throws Exception {
        when(conversationMemoryService.history("s1")).thenReturn(List.of());
        when(promptFactory.buildPlanningPrompt(any(), any(), any(), any())).thenReturn("prompt");
        when(modelBackendRouter.generate("prompt")).thenReturn(
                new ModelGeneration("ollama", objectMapper.writeValueAsString(new AgentAction("tool", null, "preview_patch_file", Map.of(
                        "path", "a.txt",
                        "search", "old",
                        "replace", "new"
                ))), false),
                new ModelGeneration("ollama", objectMapper.writeValueAsString(new AgentAction("tool", null, "patch_file", Map.of(
                        "path", "a.txt",
                        "search", "old",
                        "replace", "new"
                ))), false),
                new ModelGeneration("ollama", objectMapper.writeValueAsString(new AgentAction("answer", "done", null, null)), false)
        );
        when(toolRegistry.execute(eq("preview_patch_file"), anyMap()))
                .thenReturn(new ToolResult("preview_patch_file", true, "preview"));
        when(toolRegistry.execute(eq("patch_file"), anyMap()))
                .thenReturn(new ToolResult("patch_file", true, "patched"));
        when(toolTraceFormatter.format(any()))
                .thenAnswer(invocation -> ((ToolResult) invocation.getArgument(0)).output());

        ChatResponse response = agentService.chat("s1", "please edit");

        assertThat(response.answer()).isEqualTo("done");
        assertThat(response.backend()).isEqualTo("ollama");
        assertThat(response.pendingPatch()).isNull();
        verify(toolRegistry).execute(eq("preview_patch_file"), anyMap());
        verify(toolRegistry).execute(eq("patch_file"), anyMap());
        verify(pendingPatchService).save(eq("s1"), any(PendingPatch.class));
        verify(pendingPatchService).clear("s1");
    }

    @Test
    void applyPatchRequiresMatchingPendingPatch() {
        when(pendingPatchService.find("s1", "p1")).thenReturn(Optional.empty());

        PatchApplyResponse response = agentService.applyPatch(new PatchApplyRequest("s1", "p1"));

        assertThat(response.success()).isFalse();
        verify(toolRegistry, never()).execute(eq("patch_file"), anyMap());
    }

    @Test
    void applyPatchUsesStoredPendingPatchPayload() {
        PendingPatch pendingPatch = new PendingPatch("p1", "a.txt", "old", "new", "preview");
        when(pendingPatchService.find("s1", "p1")).thenReturn(Optional.of(pendingPatch));
        when(toolRegistry.execute(eq("patch_file"), anyMap()))
                .thenReturn(new ToolResult("patch_file", true, "patched"));

        PatchApplyResponse response = agentService.applyPatch(new PatchApplyRequest("s1", "p1"));

        assertThat(response.success()).isTrue();
        ArgumentCaptor<Map<String, String>> captor = ArgumentCaptor.forClass(Map.class);
        verify(toolRegistry).execute(eq("patch_file"), captor.capture());
        assertThat(captor.getValue()).containsEntry("path", "a.txt");
        assertThat(captor.getValue()).containsEntry("search", "old");
        assertThat(captor.getValue()).containsEntry("replace", "new");
        verify(pendingPatchService).clear("s1");
    }

    @Test
    void applyPatchKeepsPendingPatchWhenExecutionFails() {
        PendingPatch pendingPatch = new PendingPatch("p1", "a.txt", "old", "new", "preview");
        when(pendingPatchService.find("s1", "p1")).thenReturn(Optional.of(pendingPatch));
        when(toolRegistry.execute(eq("patch_file"), anyMap()))
                .thenReturn(new ToolResult("patch_file", false, "patch failed"));

        PatchApplyResponse response = agentService.applyPatch(new PatchApplyRequest("s1", "p1"));

        assertThat(response.success()).isFalse();
        verify(pendingPatchService, never()).clear("s1");
    }
}
