package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "qwen.openvino")
public record OpenVinoProperties(
        String pythonExe,
        String scriptPath,
        String modelDir,
        @DefaultValue("NPU") String device,
        @DefaultValue("180") int maxNewTokens,
        @DefaultValue("180") int timeoutSeconds,
        @DefaultValue("Reply with OK.") String healthPrompt
) {
}
