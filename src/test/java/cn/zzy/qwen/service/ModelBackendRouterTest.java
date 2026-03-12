package cn.zzy.qwen.service;

import cn.zzy.qwen.config.BackendProperties;
import cn.zzy.qwen.config.ModelCatalogProperties;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

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
                new BackendProperties("openvino", ""),
                selectionService()
        );

        ModelGeneration generation = router.generate("hello", selection("openvino", "openvino-lite", "ov-model"));

        assertThat(generation.backend()).isEqualTo("openvino");
        assertThat(generation.response()).isEqualTo("openvino-ok");
        assertThat(generation.fallbackUsed()).isFalse();
        assertThat(generation.modelProfile()).isEqualTo("openvino-lite");
    }

    @Test
    void fallsBackWhenPrimaryFails() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", true, null, new RuntimeException("npu offline")),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama"),
                selectionService()
        );

        ModelGeneration generation = router.generate("hello", selection("openvino", "openvino-lite", "ov-model"));

        assertThat(generation.backend()).isEqualTo("ollama");
        assertThat(generation.response()).isEqualTo("ollama-ok");
        assertThat(generation.fallbackUsed()).isTrue();
        assertThat(generation.modelProfile()).isEqualTo("ollama-coder");
        assertThat(generation.model()).isEqualTo("qwen2.5-coder:14b");
    }

    @Test
    void fallsBackToConfiguredPrimaryWhenRequestedBackendFails() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", true, "openvino-ok", null),
                        new StubBackend("ollama", true, null, new RuntimeException("ollama offline"))
                ),
                new BackendProperties("openvino", "ollama"),
                selectionService()
        );

        ModelGeneration generation = router.generate("hello", selection("ollama", "ollama-coder", "qwen2.5-coder:14b"));

        assertThat(generation.backend()).isEqualTo("openvino");
        assertThat(generation.response()).isEqualTo("openvino-ok");
        assertThat(generation.fallbackUsed()).isTrue();
        assertThat(generation.modelProfile()).isEqualTo("openvino-lite");
        assertThat(generation.model()).isEqualTo("ov-model");
    }

    @Test
    void failsWhenPrimaryIsNotConfigured() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", false, "unused", null),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama"),
                selectionService()
        );

        ModelGeneration generation = router.generate("hello", selection("openvino", "openvino-lite", "ov-model"));

        assertThat(generation.backend()).isEqualTo("ollama");
        assertThat(generation.fallbackUsed()).isTrue();
    }

    @Test
    void healthReportMarksFallbackAvailability() {
        ModelBackendRouter router = new ModelBackendRouter(
                List.of(
                        new StubBackend("openvino", true, null, new RuntimeException("compile failed")),
                        new StubBackend("ollama", true, "ollama-ok", null)
                ),
                new BackendProperties("openvino", "ollama"),
                selectionService()
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
        public String generate(BackendGenerationRequest request) {
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

    private static ModelSelectionService selectionService() {
        return new ModelSelectionService(new ModelCatalogProperties(
                "ollama-coder",
                "openvino-lite",
                Map.of(
                        "ollama", "ollama-coder",
                        "openvino", "openvino-lite"
                ),
                Map.of(
                        "ollama-coder", new ModelCatalogProperties.ModelProfileProperties(
                                "ollama",
                                "qwen2.5-coder:14b",
                                "Ollama Coder",
                                "Coding profile"
                        ),
                        "openvino-lite", new ModelCatalogProperties.ModelProfileProperties(
                                "openvino",
                                "ov-model",
                                "OpenVINO Lite",
                                "Writing profile"
                        )
                )
        ));
    }

    private static ResolvedModelSelection selection(String backend, String profile, String model) {
        return new ResolvedModelSelection(backend, model, profile, "profile", "test");
    }
}
