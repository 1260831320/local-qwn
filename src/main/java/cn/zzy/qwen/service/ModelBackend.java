package cn.zzy.qwen.service;

public interface ModelBackend {

    String backendName();

    String generate(BackendGenerationRequest request);

    void checkHealth();

    boolean isConfigured();
}
