package cn.zzy.qwen.service;

public interface ModelBackend {

    String backendName();

    String generate(String prompt);

    void checkHealth();

    boolean isConfigured();
}
