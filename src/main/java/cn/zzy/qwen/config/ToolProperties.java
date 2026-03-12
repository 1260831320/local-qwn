package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qwen.tools")
public record ToolProperties(String workspaceRoot) {
}
