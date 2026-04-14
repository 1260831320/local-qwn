package cn.zzy.qwen.model;

public record DocsResponse(
        String language,
        String title,
        String content
) {
}
