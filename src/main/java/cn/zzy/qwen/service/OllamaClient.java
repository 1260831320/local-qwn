package cn.zzy.qwen.service;

import cn.zzy.qwen.config.OllamaProperties;
import cn.zzy.qwen.model.OllamaGenerateRequest;
import cn.zzy.qwen.model.OllamaGenerateResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
public class OllamaClient implements ModelBackend {

    private final RestClient restClient;
    private final OllamaProperties properties;

    public OllamaClient(OllamaProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        Duration timeout = Duration.ofSeconds(Math.max(properties.timeoutSeconds(), 1));
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public String backendName() {
        return "ollama";
    }

    @Override
    public String generate(String prompt) {
        validateConfigured();
        OllamaGenerateResponse response = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new OllamaGenerateRequest(properties.model(), prompt, false))
                .retrieve()
                .body(OllamaGenerateResponse.class);
        return response == null || response.response() == null ? "" : response.response().trim();
    }

    @Override
    public void checkHealth() {
        validateConfigured();
        restClient.get()
                .uri("/api/tags")
                .retrieve()
                .toBodilessEntity();
    }

    @Override
    public boolean isConfigured() {
        return hasText(properties.baseUrl()) && hasText(properties.model());
    }

    private void validateConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException("Ollama backend is not fully configured.");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
