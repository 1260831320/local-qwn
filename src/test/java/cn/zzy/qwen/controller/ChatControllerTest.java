package cn.zzy.qwen.controller;

import cn.zzy.qwen.model.ChatRequest;
import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.DocsResponse;
import cn.zzy.qwen.model.HealthResponse;
import cn.zzy.qwen.model.PendingPatch;
import cn.zzy.qwen.model.PatchApplyResponse;
import cn.zzy.qwen.model.PatchHistoryEntry;
import cn.zzy.qwen.model.RuntimeOptionsResponse;
import cn.zzy.qwen.model.SessionSnapshotResponse;
import cn.zzy.qwen.service.AgentService;
import cn.zzy.qwen.service.HealthService;
import cn.zzy.qwen.service.ProjectDocsService;
import cn.zzy.qwen.service.RuntimeOptionsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AgentService agentService;

    @MockBean
    private HealthService healthService;

    @MockBean
    private RuntimeOptionsService runtimeOptionsService;

    @MockBean
    private ProjectDocsService projectDocsService;

    @Test
    void healthReturnsServicePayload() throws Exception {
        when(healthService.health()).thenReturn(new HealthResponse("healthy", "up", "ollama", "up", "disabled", "default", "ok"));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.spring").value("up"))
                .andExpect(jsonPath("$.backend").value("ollama"))
                .andExpect(jsonPath("$.ollama").value("up"))
                .andExpect(jsonPath("$.openvino").value("disabled"))
                .andExpect(jsonPath("$.machineProfile").value("default"));
    }

    @Test
    void chatReturnsAgentResponse() throws Exception {
        PendingPatch pendingPatch = new PendingPatch("p1", "a.txt", "old", "new", "preview");
        when(agentService.chat(any(ChatRequest.class))).thenReturn(
                new ChatResponse(
                        "hi",
                        List.of("step"),
                        List.of("read_file"),
                        pendingPatch,
                        "ollama",
                        "ollama-coder",
                        "qwen2.5-coder:14b",
                        "auto",
                        "Auto selection preferred a coding and tool-planning profile.",
                        false
                )
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"hello","sessionId":"s1","backend":"auto","modelProfile":"auto"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("hi"))
                .andExpect(jsonPath("$.backend").value("ollama"))
                .andExpect(jsonPath("$.modelProfile").value("ollama-coder"))
                .andExpect(jsonPath("$.toolsUsed[0]").value("read_file"))
                .andExpect(jsonPath("$.pendingPatch.patchId").value("p1"));
    }

    @Test
    void chatRejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":" ","sessionId":"s1"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void chatReturnsBadRequestForInvalidModelProfile() throws Exception {
        when(agentService.chat(any(ChatRequest.class)))
                .thenThrow(new IllegalArgumentException("Unknown model profile 'bad-profile'."));

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"hello","sessionId":"s1","modelProfile":"bad-profile"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown model profile 'bad-profile'."));
    }

    @Test
    void runtimeOptionsReturnsServicePayload() throws Exception {
        when(runtimeOptionsService.runtimeOptions()).thenReturn(new RuntimeOptionsResponse(
                "redmibook14",
                "openvino",
                "ollama",
                "ollama-coder",
                "openvino-lite",
                Map.of("ollama", "ollama-coder", "openvino", "openvino-lite"),
                List.of("ollama", "openvino"),
                List.of()
        ));

        mockMvc.perform(get("/api/runtime/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.machineProfile").value("redmibook14"))
                .andExpect(jsonPath("$.configuredBackend").value("openvino"))
                .andExpect(jsonPath("$.configuredFallbackBackend").value("ollama"))
                .andExpect(jsonPath("$.autoGeneralProfile").value("openvino-lite"));
    }

    @Test
    void docsReturnsReadmePayload() throws Exception {
        when(projectDocsService.readme("zh")).thenReturn(new DocsResponse("zh", "项目说明", "# Hello"));

        mockMvc.perform(get("/api/docs/zh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.language").value("zh"))
                .andExpect(jsonPath("$.title").value("项目说明"))
                .andExpect(jsonPath("$.content").value("# Hello"));
    }

    @Test
    void applyPatchReturnsServicePayload() throws Exception {
        when(agentService.applyPatch(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new PatchApplyResponse(true, "patched"));

        mockMvc.perform(post("/api/patch/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sessionId":"s1","patchId":"p1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("patched"));
    }

    @Test
    void sessionSnapshotReturnsServicePayload() throws Exception {
        PendingPatch pendingPatch = new PendingPatch("p1", "a.txt", "old", "new", "preview");
        when(agentService.sessionSnapshot("s1")).thenReturn(new SessionSnapshotResponse(
                "s1",
                true,
                List.of(
                        new cn.zzy.qwen.model.ConversationMessage("user", "hello"),
                        new cn.zzy.qwen.model.ConversationMessage("assistant", "hi")
                ),
                pendingPatch,
                List.of(new PatchHistoryEntry("h1", "applied", "a.txt", "patched", "old", "new", "preview", "2026-04-15T10:00:00+08:00"))
        ));

        mockMvc.perform(get("/api/session/s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value("s1"))
                .andExpect(jsonPath("$.hasContent").value(true))
                .andExpect(jsonPath("$.messages[0].role").value("user"))
                .andExpect(jsonPath("$.messages[1].content").value("hi"))
                .andExpect(jsonPath("$.pendingPatch.patchId").value("p1"))
                .andExpect(jsonPath("$.patchHistory[0].status").value("applied"));
    }

    @Test
    void clearSessionReturnsClearedStatus() throws Exception {
        mockMvc.perform(post("/api/session/demo/clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cleared"));

        verify(agentService).clearSession("demo");
    }
}
