package cn.zzy.qwen.model;

public record HealthResponse(
        String status,
        String spring,
        String backend,
        String ollama,
        String openvino,
        String machineProfile,
        String message
) {
}
