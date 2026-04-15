package cn.zzy.qwen.service;

import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.AgentAction;
import cn.zzy.qwen.model.ChatRequest;
import cn.zzy.qwen.model.ConversationMessage;
import cn.zzy.qwen.model.PatchHistoryEntry;
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
import java.time.OffsetDateTime;

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
    private final PatchHistoryService patchHistoryService;
    private final ModelSelectionService modelSelectionService;

    public AgentService(
            ModelBackendRouter modelBackendRouter,
            ToolRegistry toolRegistry,
            AgentActionParser actionParser,
            AgentPromptFactory promptFactory,
            ToolTraceFormatter toolTraceFormatter,
            ConversationMemoryService conversationMemoryService,
            PendingPatchService pendingPatchService,
            PatchHistoryService patchHistoryService,
            ModelSelectionService modelSelectionService
    ) {
        this.modelBackendRouter = modelBackendRouter;
        this.toolRegistry = toolRegistry;
        this.actionParser = actionParser;
        this.promptFactory = promptFactory;
        this.toolTraceFormatter = toolTraceFormatter;
        this.conversationMemoryService = conversationMemoryService;
        this.pendingPatchService = pendingPatchService;
        this.patchHistoryService = patchHistoryService;
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
                patchHistoryService.append(sessionId, createPatchHistoryEntry(
                        "pending",
                        pendingPatch,
                        "已生成变更预览，等待确认。"
                ));
            }
            if ("patch_file".equals(result.tool()) && result.success()) {
                if (approvedPatchForTurn != null) {
                    patchHistoryService.append(sessionId, createPatchHistoryEntry(
                            "applied",
                            approvedPatchForTurn,
                            result.output()
                    ));
                }
                pendingPatch = null;
                approvedPatchForTurn = null;
                pendingPatchService.clear(sessionId);
            } else if ("patch_file".equals(result.tool()) && approvedPatchForTurn != null) {
                patchHistoryService.append(sessionId, createPatchHistoryEntry(
                        "failed",
                        approvedPatchForTurn,
                        result.output()
                ));
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
            patchHistoryService.append(request.sessionId(), createPatchHistoryEntry(
                    "applied",
                    pendingPatch,
                    result.output()
            ));
            pendingPatchService.clear(request.sessionId());
        } else {
            patchHistoryService.append(request.sessionId(), createPatchHistoryEntry(
                    "failed",
                    pendingPatch,
                    result.output()
            ));
        }
        return new PatchApplyResponse(result.success(), result.output());
    }

    public SessionSnapshotResponse sessionSnapshot(String sessionId) {
        List<ConversationMessage> history = conversationMemoryService.history(sessionId);
        Optional<PendingPatch> pendingPatch = pendingPatchService.find(sessionId);
        List<PatchHistoryEntry> patchHistory = patchHistoryService.history(sessionId);
        boolean hasContent = !history.isEmpty() || pendingPatch.isPresent() || !patchHistory.isEmpty();
        return new SessionSnapshotResponse(
                sessionId,
                hasContent,
                history,
                pendingPatch.orElse(null),
                patchHistory
        );
    }

    public void clearSession(String sessionId) {
        conversationMemoryService.clear(sessionId);
        pendingPatchService.clear(sessionId);
        patchHistoryService.clear(sessionId);
    }

    private PatchHistoryEntry createPatchHistoryEntry(String status, PendingPatch patch, String message) {
        return new PatchHistoryEntry(
                UUID.randomUUID().toString(),
                status,
                patch.path(),
                message == null || message.isBlank() ? defaultPatchHistoryMessage(status) : message,
                patch.search(),
                patch.replace(),
                patch.preview(),
                OffsetDateTime.now().toString()
        );
    }

    private String defaultPatchHistoryMessage(String status) {
        return switch (status) {
            case "pending" -> "已生成变更预览，等待确认。";
            case "applied" -> "变更已应用。";
            case "failed" -> "变更应用失败。";
            default -> "变更状态已更新。";
        };
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
