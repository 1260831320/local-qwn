package cn.zzy.qwen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.LinkedHashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "qwen.models")
public record ModelCatalogProperties(
        @DefaultValue("ollama-coder") String autoCodeProfile,
        @DefaultValue("ollama-coder") String autoGeneralProfile,
        Map<String, String> defaultProfileByBackend,
        Map<String, ModelProfileProperties> profiles
) {
    public ModelCatalogProperties {
        autoCodeProfile = normalizeNullable(autoCodeProfile);
        autoGeneralProfile = normalizeNullable(autoGeneralProfile);
        defaultProfileByBackend = normalizeDefaultProfiles(defaultProfileByBackend);
        profiles = normalizeProfiles(profiles);
    }

    public record ModelProfileProperties(
            String backend,
            String model,
            @DefaultValue("") String displayName,
            @DefaultValue("") String description
    ) {
        public ModelProfileProperties {
            backend = normalizeNullable(backend);
            model = model == null ? "" : model.trim();
            displayName = displayName == null ? "" : displayName.trim();
            description = description == null ? "" : description.trim();
        }
    }

    private static Map<String, String> normalizeDefaultProfiles(Map<String, String> defaults) {
        if (defaults == null || defaults.isEmpty()) {
            return Map.of();
        }
        Map<String, String> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : defaults.entrySet()) {
            String backend = normalizeNullable(entry.getKey());
            String profile = normalizeNullable(entry.getValue());
            if (backend == null || profile == null) {
                continue;
            }
            normalized.put(backend, profile);
        }
        return Map.copyOf(normalized);
    }

    private static Map<String, ModelProfileProperties> normalizeProfiles(Map<String, ModelProfileProperties> profiles) {
        if (profiles == null || profiles.isEmpty()) {
            return Map.of();
        }
        Map<String, ModelProfileProperties> normalized = new LinkedHashMap<>();
        for (Map.Entry<String, ModelProfileProperties> entry : profiles.entrySet()) {
            String profileId = normalizeNullable(entry.getKey());
            ModelProfileProperties profile = entry.getValue();
            if (profileId == null || profile == null) {
                continue;
            }
            normalized.put(profileId, profile);
        }
        return Map.copyOf(normalized);
    }

    private static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }
}
