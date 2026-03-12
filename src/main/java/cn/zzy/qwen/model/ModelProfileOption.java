package cn.zzy.qwen.model;

public record ModelProfileOption(
        String id,
        String backend,
        String model,
        String displayName,
        String description
) {
}
