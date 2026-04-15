package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "qwen.session")
public record SessionStoreProperties(String storeDir) {
}
