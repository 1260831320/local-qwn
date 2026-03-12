package cn.zzy.qwen.service;

import cn.zzy.qwen.config.ModelCatalogProperties;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ModelSelectionServiceTest {

    private final ModelSelectionService service = new ModelSelectionService(new ModelCatalogProperties(
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
                            "Coding and tool-planning profile"
                    ),
                    "openvino-lite", new ModelCatalogProperties.ModelProfileProperties(
                            "openvino",
                            "C:/models/qwen-lite",
                            "OpenVINO Lite",
                            "Lightweight writing profile"
                    )
            )
    ));

    @Test
    void manualProfileOverridesBackendSelection() {
        ResolvedModelSelection selection = service.select("write an email", "ollama", "openvino-lite");

        assertThat(selection.backend()).isEqualTo("openvino");
        assertThat(selection.modelProfile()).isEqualTo("openvino-lite");
        assertThat(selection.selectionMode()).isEqualTo("profile");
    }

    @Test
    void manualBackendUsesBackendDefaultProfile() {
        ResolvedModelSelection selection = service.select("hello", "openvino", null);

        assertThat(selection.backend()).isEqualTo("openvino");
        assertThat(selection.modelProfile()).isEqualTo("openvino-lite");
        assertThat(selection.selectionMode()).isEqualTo("backend");
    }

    @Test
    void autoWritingSelectionUsesGeneralProfile() {
        ResolvedModelSelection selection = service.select("Please summarize this meeting note.", null, null);

        assertThat(selection.backend()).isEqualTo("openvino");
        assertThat(selection.modelProfile()).isEqualTo("openvino-lite");
        assertThat(selection.selectionMode()).isEqualTo("auto");
    }

    @Test
    void autoCodingSelectionUsesCodeProfile() {
        ResolvedModelSelection selection = service.select("Read pom.xml and fix the Java bug.", null, null);

        assertThat(selection.backend()).isEqualTo("ollama");
        assertThat(selection.modelProfile()).isEqualTo("ollama-coder");
        assertThat(selection.selectionMode()).isEqualTo("auto");
    }

    @Test
    void unknownProfileIsRejected() {
        assertThatThrownBy(() -> service.select("hello", null, "missing-profile"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown model profile");
    }
}
