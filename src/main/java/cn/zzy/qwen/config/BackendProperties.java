package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "qwen.backend")
public record BackendProperties(
        @DefaultValue("ollama") String type,
        @DefaultValue("") String fallbackType
) {
}
