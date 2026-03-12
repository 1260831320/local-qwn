package cn.zzy.qwen.service;

import cn.zzy.qwen.model.HealthResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class HealthServiceTest {

    @Mock
    private OllamaClient ollamaClient;

    @InjectMocks
    private HealthService healthService;

    @Test
    void reportsHealthyWhenOllamaIsReachable() {
        HealthResponse response = healthService.health();

        assertThat(response.status()).isEqualTo("healthy");
        assertThat(response.spring()).isEqualTo("up");
        assertThat(response.ollama()).isEqualTo("up");
    }

    @Test
    void reportsDegradedWhenOllamaIsDown() {
        doThrow(new RuntimeException("connection refused")).when(ollamaClient).checkHealth();

        HealthResponse response = healthService.health();

        assertThat(response.status()).isEqualTo("degraded");
        assertThat(response.spring()).isEqualTo("up");
        assertThat(response.ollama()).isEqualTo("down");
        assertThat(response.message()).contains("connection refused");
    }
}
