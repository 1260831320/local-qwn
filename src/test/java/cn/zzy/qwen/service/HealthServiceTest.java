package cn.zzy.qwen.service;

import cn.zzy.qwen.config.MachineProperties;
import cn.zzy.qwen.model.HealthResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthServiceTest {

    @Mock
    private ModelBackendRouter modelBackendRouter;

    private HealthService healthService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        healthService = new HealthService(modelBackendRouter, new MachineProperties("default", "redmibook14"));
    }

    @Test
    void reportsHealthyWhenOllamaIsReachable() {
        when(modelBackendRouter.healthReport()).thenReturn(new BackendHealthReport(
                "ollama",
                null,
                Map.of("ollama", "up", "openvino", "disabled"),
                "Primary backend 'ollama' is reachable."
        ));

        HealthResponse response = healthService.health();

        assertThat(response.status()).isEqualTo("healthy");
        assertThat(response.spring()).isEqualTo("up");
        assertThat(response.backend()).isEqualTo("ollama");
        assertThat(response.ollama()).isEqualTo("up");
        assertThat(response.openvino()).isEqualTo("disabled");
        assertThat(response.machineProfile()).isEqualTo("default");
    }

    @Test
    void reportsDegradedWhenPrimaryIsDown() {
        when(modelBackendRouter.healthReport()).thenReturn(new BackendHealthReport(
                "openvino",
                "ollama",
                Map.of("ollama", "up", "openvino", "down"),
                "Primary backend 'openvino' is down: connection refused. Fallback backend 'ollama' is reachable."
        ));

        HealthResponse response = healthService.health();

        assertThat(response.status()).isEqualTo("degraded");
        assertThat(response.spring()).isEqualTo("up");
        assertThat(response.backend()).isEqualTo("openvino");
        assertThat(response.ollama()).isEqualTo("up");
        assertThat(response.openvino()).isEqualTo("down");
        assertThat(response.machineProfile()).isEqualTo("default");
        assertThat(response.message()).contains("connection refused");
    }
}
