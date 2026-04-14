package cn.zzy.qwen.service;

public record ResolvedModelSelection(
        String backend,
        String model,
        String modelProfile,
        String selectionMode,
        String selectionReason
) {
}
