package cn.zzy.qwen.service;

import cn.zzy.qwen.config.ModelCatalogProperties;
import cn.zzy.qwen.model.ModelProfileOption;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ModelSelectionService {
    private static final Set<String> WRITING_KEYWORDS = Set.of(
            "email", "notice", "meeting", "summary", "summarize", "rewrite", "polish", "translate", "translation",
            "draft", "copywriting", "announcement", "write", "reply", "respond", "greeting", "message",
            "\u5199\u90ae\u4ef6", "\u90ae\u4ef6", "\u4f1a\u8bae\u901a\u77e5", "\u603b\u7ed3", "\u6458\u8981",
            "\u6da6\u8272", "\u6539\u5199", "\u7ffb\u8bd1", "\u901a\u77e5", "\u6587\u6848",
            "\u5199", "\u56de\u590d", "\u56de\u4fe1", "\u95ee\u5019"
    );
    private static final Set<String> CODING_KEYWORDS = Set.of(
            "code", "coding", "debug", "bug", "fix", "patch", "tool", "java", "spring", "pom.xml", "stacktrace",
            "read_file", "patch_file", "preview_patch_file", ".java", ".yml", "class", "method", "controller",
            "service", "test", "refactor", "api",
            "\u4ee3\u7801", "\u8c03\u8bd5", "\u62a5\u9519", "\u4fee\u590d", "\u8865\u4e01", "\u5de5\u5177",
            "\u8bfb\u53d6\u6587\u4ef6", "\u65b9\u6cd5", "\u7c7b", "\u63a5\u53e3", "\u6d4b\u8bd5"
    );
    private static final Set<String> TOOL_NEGATION_PATTERNS = Set.of(
            "don't call tools", "dont call tools", "don't use tools", "dont use tools", "without tools",
            "\u4e0d\u8981\u8c03\u7528\u5de5\u5177", "\u4e0d\u8981\u7528\u5de5\u5177", "\u4e0d\u7528\u5de5\u5177",
            "\u4e0d\u8981\u4f7f\u7528\u5de5\u5177"
    );

    private final ModelCatalogProperties properties;

    public ModelSelectionService(ModelCatalogProperties properties) {
        this.properties = properties;
    }

    public ResolvedModelSelection select(String userMessage, String requestedBackend, String requestedModelProfile) {
        String modelProfile = normalize(requestedModelProfile);
        if (modelProfile != null && !"auto".equals(modelProfile)) {
            return resolveProfile(modelProfile, "profile", "User selected model profile '" + modelProfile + "'.");
        }

        String backend = normalize(requestedBackend);
        if (backend != null && !"auto".equals(backend)) {
            return resolveDefaultForBackend(
                    backend,
                    "backend",
                    "User selected backend '" + backend + "' with its default profile."
            );
        }

        boolean writingTask = looksLikeWritingTask(userMessage);
        String autoProfile = writingTask ? properties.autoGeneralProfile() : properties.autoCodeProfile();
        String reason = writingTask
                ? "Auto selection preferred a lightweight writing profile."
                : "Auto selection preferred a coding and tool-planning profile.";

        if (autoProfile != null) {
            return resolveProfile(autoProfile, "auto", reason);
        }

        String fallbackBackend = properties.defaultProfileByBackend().containsKey("ollama")
                ? "ollama"
                : firstConfiguredBackend();
        return resolveDefaultForBackend(
                fallbackBackend,
                "auto",
                "Auto selection fell back to the first configured backend default profile."
        );
    }

    public ResolvedModelSelection resolveDefaultForBackend(String backend, String selectionMode, String reason) {
        String normalizedBackend = requiredBackend(backend);
        String profileId = properties.defaultProfileByBackend().get(normalizedBackend);
        if (profileId != null) {
            return resolveProfile(profileId, selectionMode, reason);
        }
        throw new IllegalArgumentException("No default model profile is configured for backend '" + normalizedBackend + "'.");
    }

    public List<ModelProfileOption> modelProfiles() {
        List<ModelProfileOption> profiles = new ArrayList<>();
        for (Map.Entry<String, ModelCatalogProperties.ModelProfileProperties> entry : properties.profiles().entrySet()) {
            ModelCatalogProperties.ModelProfileProperties profile = entry.getValue();
            profiles.add(new ModelProfileOption(
                    entry.getKey(),
                    profile.backend(),
                    profile.model(),
                    profile.displayName().isBlank() ? entry.getKey() : profile.displayName(),
                    profile.description()
            ));
        }
        profiles.sort(java.util.Comparator.comparing(ModelProfileOption::id));
        return List.copyOf(profiles);
    }

    public List<String> availableBackends() {
        LinkedHashMap<String, Boolean> backends = new LinkedHashMap<>();
        for (ModelCatalogProperties.ModelProfileProperties profile : properties.profiles().values()) {
            if (profile.backend() != null && !profile.backend().isBlank()) {
                backends.put(profile.backend(), Boolean.TRUE);
            }
        }
        backends.putIfAbsent("ollama", Boolean.TRUE);
        backends.putIfAbsent("openvino", Boolean.TRUE);
        return List.copyOf(backends.keySet());
    }

    public Map<String, String> defaultProfilesByBackend() {
        return properties.defaultProfileByBackend();
    }

    public String autoCodeProfile() {
        return properties.autoCodeProfile();
    }

    public String autoGeneralProfile() {
        return properties.autoGeneralProfile();
    }

    private ResolvedModelSelection resolveProfile(String profileId, String selectionMode, String reason) {
        String normalizedProfileId = normalize(profileId);
        ModelCatalogProperties.ModelProfileProperties profile = properties.profiles().get(normalizedProfileId);
        if (profile == null) {
            throw new IllegalArgumentException("Unknown model profile '" + profileId + "'.");
        }
        if (profile.backend() == null || profile.backend().isBlank()) {
            throw new IllegalArgumentException("Model profile '" + normalizedProfileId + "' does not declare a backend.");
        }
        if (profile.model() == null || profile.model().isBlank()) {
            throw new IllegalArgumentException("Model profile '" + normalizedProfileId + "' does not declare a model.");
        }
        return new ResolvedModelSelection(profile.backend(), profile.model(), normalizedProfileId, selectionMode, reason);
    }

    private boolean looksLikeWritingTask(String userMessage) {
        String normalized = stripToolNegations(normalizeMessage(userMessage));
        if (normalized.isBlank()) {
            return false;
        }
        int writingScore = scoreMatches(normalized, WRITING_KEYWORDS);
        int codingScore = scoreMatches(normalized, CODING_KEYWORDS);
        return writingScore > 0 && writingScore > codingScore;
    }

    private String normalizeMessage(String userMessage) {
        return userMessage == null ? "" : userMessage.toLowerCase(Locale.ROOT);
    }

    private String firstConfiguredBackend() {
        return properties.profiles().values().stream()
                .map(ModelCatalogProperties.ModelProfileProperties::backend)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse("ollama");
    }

    private int scoreMatches(String normalizedMessage, Set<String> keywords) {
        int score = 0;
        for (String keyword : keywords) {
            if (normalizedMessage.contains(keyword)) {
                score++;
            }
        }
        return score;
    }

    private String stripToolNegations(String normalizedMessage) {
        String sanitized = normalizedMessage;
        for (String pattern : TOOL_NEGATION_PATTERNS) {
            sanitized = sanitized.replace(pattern, " ");
        }
        return sanitized;
    }

    private String requiredBackend(String backend) {
        String normalized = normalize(backend);
        if (normalized == null) {
            throw new IllegalArgumentException("Backend must not be blank.");
        }
        return normalized;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
    }
}
