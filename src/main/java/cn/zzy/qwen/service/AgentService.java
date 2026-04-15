package cn.zzy.qwen.service;

import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.AgentAction;
import cn.zzy.qwen.model.ChatRequest;
import cn.zzy.qwen.model.ConversationMessage;
import cn.zzy.qwen.model.PendingPatch;
import cn.zzy.qwen.model.PatchApplyRequest;
import cn.zzy.qwen.model.PatchApplyResponse;
import cn.zzy.qwen.model.SessionSnapshotResponse;
import cn.zzy.qwen.model.ToolResult;
import cn.zzy.qwen.tools.ToolRegistry;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AgentService {
    private static final int MAX_TOOL_STEPS = 4;

    private final ModelBackendRouter modelBackendRouter;
    private final ToolRegistry toolRegistry;
    private final AgentActionParser actionParser;
    private final AgentPromptFactory promptFactory;
    private final ToolTraceFormatter toolTraceFormatter;
    private final ConversationMemoryService conversationMemoryService;
    private final PendingPatchService pendingPatchService;
    private final ModelSelectionService modelSelectionService;

    public AgentService(
            ModelBackendRouter modelBackendRouter,
            ToolRegistry toolRegistry,
            AgentActionParser actionParser,
            AgentPromptFactory promptFactory,
            ToolTraceFormatter toolTraceFormatter,
            ConversationMemoryService conversationMemoryService,
            PendingPatchService pendingPatchService,
            ModelSelectionService modelSelectionService
    ) {
        this.modelBackendRouter = modelBackendRouter;
        this.toolRegistry = toolRegistry;
        this.actionParser = actionParser;
        this.promptFactory = promptFactory;
        this.toolTraceFormatter = toolTraceFormatter;
        this.conversationMemoryService = conversationMemoryService;
        this.pendingPatchService = pendingPatchService;
        this.modelSelectionService = modelSelectionService;
    }

    public ChatResponse chat(ChatRequest request) {
        String sessionId = request.sessionId();
        String userMessage = request.message();
        List<String> steps = new ArrayList<>();
        List<String> toolsUsed = new ArrayList<>();
        StringBuilder transcript = new StringBuilder();
        PendingPatch pendingPatch = null;
        PendingPatch approvedPatchForTurn = null;
        List<ConversationMessage> history = conversationMemoryService.history(sessionId);
        ResolvedModelSelection activeSelection = modelSelectionService.select(
                userMessage,
                request.backend(),
                request.modelProfile()
        );
        boolean fallbackUsed = false;

        steps.add(formatSelectionStep("request", activeSelection));

        for (int i = 0; i < MAX_TOOL_STEPS; i++) {
            ModelGeneration generation = modelBackendRouter.generate(
                    promptFactory.buildPlanningPrompt(userMessage, transcript.toString(), toolRegistry, history),
                    activeSelection
            );
            activeSelection = generation.selection();
            fallbackUsed = fallbackUsed || generation.fallbackUsed();
            if (generation.fallbackUsed()) {
                steps.add(formatSelectionStep("fallback", activeSelection));
            }
            String modelOutput = generation.response();
            steps.add("model[" + (i + 1) + "][" + activeSelection.backend() + "/" + activeSelection.modelProfile() + "]: "
                    + modelOutput);

            AgentAction action = actionParser.parse(modelOutput);
            if (action == null) {
                conversationMemoryService.append(sessionId, "user", userMessage);
                conversationMemoryService.append(sessionId, "assistant", modelOutput);
                return buildResponse(modelOutput, steps, toolsUsed, pendingPatch, generation, fallbackUsed);
            }

            if ("answer".equalsIgnoreCase(action.type())) {
                String answer = (action.answer() == null || action.answer().isBlank()) ? modelOutput : action.answer();
                conversationMemoryService.append(sessionId, "user", userMessage);
                conversationMemoryService.append(sessionId, "assistant", answer);
                return buildResponse(answer, steps, toolsUsed, pendingPatch, generation, fallbackUsed);
            }

            if (!"tool".equalsIgnoreCase(action.type()) || action.tool() == null || action.arguments() == null) {
                String answer = "The model returned an invalid action format.";
                conversationMemoryService.append(sessionId, "user", userMessage);
                conversationMemoryService.append(sessionId, "assistant", answer);
                return buildResponse(answer, steps, toolsUsed, pendingPatch, generation, fallbackUsed);
            }

            ToolResult result = executeToolAction(action, approvedPatchForTurn);
            toolsUsed.add(result.tool());
            String toolStep = toolTraceFormatter.format(result);
            steps.add(toolStep);
            if (transcript.length() > 0) {
                transcript.append(System.lineSeparator());
            }
            transcript.append(toolStep);
            if ("preview_patch_file".equals(result.tool()) && result.success()) {
                pendingPatch = new PendingPatch(
                        UUID.randomUUID().toString(),
                        action.arguments().get("path"),
                        action.arguments().get("search"),
                        action.arguments().getOrDefault("replace", ""),
                        result.output()
                );
                approvedPatchForTurn = pendingPatch;
                pendingPatchService.save(sessionId, pendingPatch);
            }
            if ("patch_file".equals(result.tool()) && result.success()) {
                pendingPatch = null;
                approvedPatchForTurn = null;
                pendingPatchService.clear(sessionId);
            }
        }

        ModelGeneration fallbackGeneration = modelBackendRouter.generate(
                promptFactory.buildFallbackPrompt(userMessage, transcript.toString()),
                activeSelection
        );
        fallbackUsed = fallbackUsed || fallbackGeneration.fallbackUsed();
        if (fallbackGeneration.fallbackUsed()) {
            steps.add(formatSelectionStep("fallback", fallbackGeneration.selection()));
        }
        String answer = fallbackGeneration.response();
        steps.add("final[" + fallbackGeneration.backend() + "/" + fallbackGeneration.modelProfile() + "]: " + answer);
        conversationMemoryService.append(sessionId, "user", userMessage);
        conversationMemoryService.append(sessionId, "assistant", answer);
        return buildResponse(answer, steps, toolsUsed, pendingPatch, fallbackGeneration, fallbackUsed);
    }

    public PatchApplyResponse applyPatch(PatchApplyRequest request) {
        PendingPatch pendingPatch = pendingPatchService.find(request.sessionId(), request.patchId())
                .orElse(null);
        if (pendingPatch == null) {
            return new PatchApplyResponse(false, "No matching pending patch was found for this session.");
        }
        ToolResult result = toolRegistry.execute("patch_file", java.util.Map.of(
                "path", pendingPatch.path(),
                "search", pendingPatch.search(),
                "replace", pendingPatch.replace()
        ));
        if (result.success()) {
            pendingPatchService.clear(request.sessionId());
        }
        return new PatchApplyResponse(result.success(), result.output());
    }

    public SessionSnapshotResponse sessionSnapshot(String sessionId) {
        List<ConversationMessage> history = conversationMemoryService.history(sessionId);
        Optional<PendingPatch> pendingPatch = pendingPatchService.find(sessionId);
        boolean hasContent = !history.isEmpty() || pendingPatch.isPresent();
        return new SessionSnapshotResponse(
                sessionId,
                hasContent,
                history,
                pendingPatch.orElse(null)
        );
    }

    public void clearSession(String sessionId) {
        conversationMemoryService.clear(sessionId);
        pendingPatchService.clear(sessionId);
    }

    private ToolResult executeToolAction(AgentAction action, PendingPatch approvedPatchForTurn) {
        if (!"patch_file".equals(action.tool())) {
            return toolRegistry.execute(action.tool(), action.arguments());
        }
        if (approvedPatchForTurn == null || !samePatch(action.arguments(), approvedPatchForTurn)) {
            return new ToolResult(
                    "patch_file",
                    false,
                    "patch_file is allowed only after a matching successful preview_patch_file in the same chat turn."
            );
        }
        return toolRegistry.execute(action.tool(), action.arguments());
    }

    private boolean samePatch(Map<String, String> arguments, PendingPatch pendingPatch) {
        return pendingPatch.path().equals(arguments.get("path"))
                && pendingPatch.search().equals(arguments.get("search"))
                && pendingPatch.replace().equals(arguments.getOrDefault("replace", ""));
    }

    private ChatResponse buildResponse(
            String answer,
            List<String> steps,
            List<String> toolsUsed,
            PendingPatch pendingPatch,
            ModelGeneration generation,
            boolean fallbackUsed
    ) {
        return new ChatResponse(
                answer,
                steps,
                toolsUsed,
                pendingPatch,
                generation.backend(),
                generation.modelProfile(),
                generation.model(),
                generation.selectionMode(),
                generation.selectionReason(),
                fallbackUsed
        );
    }

    private String formatSelectionStep(String phase, ResolvedModelSelection selection) {
        return "selection[" + phase + "]: backend=" + selection.backend()
                + ", profile=" + selection.modelProfile()
                + ", model=" + selection.model()
                + ", mode=" + selection.selectionMode()
                + ", reason=" + selection.selectionReason();
    }
}
