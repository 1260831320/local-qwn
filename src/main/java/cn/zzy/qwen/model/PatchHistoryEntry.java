package cn.zzy.qwen.model;

public record PatchHistoryEntry(
        String id,
        String status,
        String path,
        String message,
        String search,
        String replace,
        String preview,
        String createdAt
) {
}
