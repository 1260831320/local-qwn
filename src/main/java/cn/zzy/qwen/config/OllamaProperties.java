package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qwen.ollama")
public record OllamaProperties(String baseUrl, String model, int timeoutSeconds) {
}
