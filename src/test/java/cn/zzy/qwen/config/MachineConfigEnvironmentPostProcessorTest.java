package cn.zzy.qwen.config;

import cn.zzy.qwen.QwenApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MachineConfigEnvironmentPostProcessorTest {

    private final MachineConfigEnvironmentPostProcessor postProcessor = new MachineConfigEnvironmentPostProcessor();

    @Test
    void loadsTrackedMachineProfileWhenHostMatches() {
        ConfigurableEnvironment environment = environmentWith(Map.of(
                "QWEN_MACHINE_PROFILE", "",
                "COMPUTERNAME", "REDMIBOOK14",
                "HOSTNAME", ""
        ));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(QwenApplication.class));

        assertThat(environment.getProperty("qwen.machine.profile")).isEqualTo("redmibook14");
        assertThat(environment.getProperty("qwen.machine.requested-profile")).isEqualTo("redmibook14");
        assertThat(environment.getProperty("qwen.backend.type")).isEqualTo("openvino");
        assertThat(environment.getProperty("qwen.backend.fallback-type")).isEqualTo("ollama");
        assertThat(environment.getProperty("qwen.openvino.device")).isEqualTo("NPU");
    }

    @Test
    void fallsBackToDefaultWhenRequestedProfileDoesNotExist() {
        ConfigurableEnvironment environment = environmentWith(Map.of(
                "QWEN_MACHINE_PROFILE", "",
                "COMPUTERNAME", "",
                "HOSTNAME", "unknown-host"
        ));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(QwenApplication.class));

        assertThat(environment.getProperty("qwen.machine.profile")).isEqualTo("default");
        assertThat(environment.getProperty("qwen.machine.requested-profile")).isEqualTo("unknown-host");
        assertThat(environment.getProperty("qwen.backend.type")).isEqualTo("ollama");
        assertThat(environment.getProperty("qwen.backend.fallback-type")).isEmpty();
    }

    @Test
    void explicitMachineProfileOverridesHostName() {
        ConfigurableEnvironment environment = environmentWith(Map.of(
                "QWEN_MACHINE_PROFILE", "redmibook14",
                "COMPUTERNAME", "OTHER-HOST",
                "HOSTNAME", "other-host"
        ));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(QwenApplication.class));

        assertThat(environment.getProperty("qwen.machine.profile")).isEqualTo("redmibook14");
        assertThat(environment.getProperty("qwen.machine.requested-profile")).isEqualTo("redmibook14");
    }

    private ConfigurableEnvironment environmentWith(Map<String, Object> values) {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("test-machine-env", values));
        return environment;
    }
}
