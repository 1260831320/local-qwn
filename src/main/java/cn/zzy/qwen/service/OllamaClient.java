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
public class OllamaClient {

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

    public String generate(String prompt) {
        OllamaGenerateResponse response = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new OllamaGenerateRequest(properties.model(), prompt, false))
                .retrieve()
                .body(OllamaGenerateResponse.class);
        return response == null || response.response() == null ? "" : response.response().trim();
    }

    public void checkHealth() {
        restClient.get()
                .uri("/api/tags")
                .retrieve()
                .toBodilessEntity();
    }
}
