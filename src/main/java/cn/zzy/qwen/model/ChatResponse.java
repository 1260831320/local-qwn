package cn.zzy.qwen.model;

import java.util.List;

public record ChatResponse(
        String answer,
        List<String> steps,
        List<String> toolsUsed,
        PendingPatch pendingPatch,
        String backend,
        String modelProfile,
        String model,
        String selectionMode,
        String selectionReason,
        boolean fallbackUsed
) {
}
