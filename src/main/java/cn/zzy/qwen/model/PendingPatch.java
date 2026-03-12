package cn.zzy.qwen.model;

public record PendingPatch(String patchId, String path, String search, String replace, String preview) {
}
