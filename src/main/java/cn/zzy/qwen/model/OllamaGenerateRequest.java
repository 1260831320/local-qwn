package cn.zzy.qwen.model;

public record OllamaGenerateRequest(String model, String prompt, boolean stream) {
}
