package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qwen.machine")
public record MachineProperties(String profile, String requestedProfile) {
}
