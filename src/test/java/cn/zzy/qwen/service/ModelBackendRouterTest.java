package cn.zzy.qwen.service;

import cn.zzy.qwen.config.BackendProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ModelBackendRouterTest {

    @Test
    void usesConfiguredPrimaryBackend() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("ollama", true, "ollama-ok", null),
                        new StubBackend("openvino", true, "openvino-ok", null)
                ),
                new BackendProperties("openvino", "")
        );

        ModelGeneration generation = router.generate("hello");

        assertThat(generation.backend()).isEqualTo("openvino");
        assertThat(generation.response()).isEqualTo("openvino-ok");
        assertThat(generation.fallbackUsed()).isFalse();
    }

    @Test
    void fallsBackWhenPrimaryFails() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", true, null, new RuntimeException("npu offline")),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama")
        );

        ModelGeneration generation = router.generate("hello");

        assertThat(generation.backend()).isEqualTo("ollama");
        assertThat(generation.response()).isEqualTo("ollama-ok");
        assertThat(generation.fallbackUsed()).isTrue();
    }

    @Test
    void failsWhenPrimaryIsNotConfigured() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", false, "unused", null),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama")
        );

        assertThatThrownBy(() -> router.generate("hello"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not fully configured");
    }

    @Test
    void healthReportMarksFallbackAvailability() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", true, null, new RuntimeException("compile failed")),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama")
        );

        BackendHealthReport report = router.healthReport();

        assertThat(report.primaryBackend()).isEqualTo("openvino");
        assertThat(report.fallbackBackend()).isEqualTo("ollama");
        assertThat(report.statuses()).containsEntry("openvino", "down");
        assertThat(report.statuses()).containsEntry("ollama", "up");
        assertThat(report.message()).contains("Fallback backend 'ollama' is reachable.");
    }

    private static final class StubBackend implements ModelBackend {
        private final String backendName;
        private final boolean configured;
        private final String response;
        private final RuntimeException failure;

        private StubBackend(String backendName, boolean configured, String response, RuntimeException failure) {
            this.backendName = backendName;
            this.configured = configured;
            this.response = response;
            this.failure = failure;
        }

        @Override
        public String backendName() {
            return backendName;
        }

        @Override
        public String generate(String prompt) {
            if (failure != null) {
                throw failure;
            }
            return response;
        }

        @Override
        public void checkHealth() {
            if (failure != null) {
                throw failure;
            }
        }

        @Override
        public boolean isConfigured() {
            return configured;
        }
    }
}
