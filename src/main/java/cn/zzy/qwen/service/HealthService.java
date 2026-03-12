package cn.zzy.qwen.service;

import cn.zzy.qwen.model.HealthResponse;
import org.springframework.stereotype.Service;

@Service
public class HealthService {

    private final OllamaClient ollamaClient;

    public HealthService(OllamaClient ollamaClient) {
        this.ollamaClient = ollamaClient;
    }

    public HealthResponse health() {
        String spring = "up";
        try {
            ollamaClient.checkHealth();
            return new HealthResponse("healthy", spring, "up", "Spring Boot and Ollama are reachable.");
        } catch (RuntimeException ex) {
            String message = ex.getMessage() == null || ex.getMessage().isBlank()
                    ? "Ollama health check failed."
                    : ex.getMessage();
            return new HealthResponse("degraded", spring, "down", message);
        }
    }
}
