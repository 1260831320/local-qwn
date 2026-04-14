package cn.zzy.qwen.model;

import java.util.List;
import java.util.Map;

public record RuntimeOptionsResponse(
        String machineProfile,
        String configuredBackend,
        String configuredFallbackBackend,
        String autoCodeProfile,
        String autoGeneralProfile,
        Map<String, String> defaultProfilesByBackend,
        List<String> availableBackends,
        List<ModelProfileOption> modelProfiles
) {
}
