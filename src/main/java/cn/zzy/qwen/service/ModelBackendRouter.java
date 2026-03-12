package cn.zzy.qwen.service;

import cn.zzy.qwen.config.BackendProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
public class ModelBackendRouter {
    private static final Logger log = LoggerFactory.getLogger(ModelBackendRouter.class);

    private final Map<String, ModelBackend> backends;
    private final BackendProperties properties;
    private final ModelSelectionService modelSelectionService;

    public ModelBackendRouter(
            List<ModelBackend> backends,
            BackendProperties properties,
            ModelSelectionService modelSelectionService
    ) {
        Map<String, ModelBackend> byName = new LinkedHashMap<>();
        for (ModelBackend backend : backends) {
            byName.put(normalize(backend.backendName()), backend);
        }
        this.backends = Map.copyOf(byName);
        this.properties = properties;
        this.modelSelectionService = modelSelectionService;
    }

    public ModelGeneration generate(String prompt, ResolvedModelSelection primarySelection) {
        if (primarySelection == null) {
            throw new IllegalArgumentException("Model selection must not be null.");
        }
        RuntimeException primaryFailure;
        try {
            ModelBackend primary = requireConfiguredBackend(primarySelection.backend());
            String response = primary.generate(new BackendGenerationRequest(prompt, primarySelection.model()));
            return new ModelGeneration(primarySelection, response, false);
        } catch (RuntimeException ex) {
            primaryFailure = ex;
        }

        ModelBackend fallback = resolveConfiguredFallback(primarySelection.backend());
        if (fallback == null) {
            throw primaryFailure;
        }

        ResolvedModelSelection fallbackSelection = modelSelectionService.resolveDefaultForBackend(
                fallback.backendName(),
                "fallback",
                "Primary backend '" + primarySelection.backend() + "' failed. Falling back to backend '"
                        + fallback.backendName() + "'."
        );
        log.warn(
                "Backend '{}' failed, falling back to '{}': {}",
                primarySelection.backend(),
                fallback.backendName(),
                compactMessage(primaryFailure.getMessage())
        );
        try {
            String response = fallback.generate(new BackendGenerationRequest(prompt, fallbackSelection.model()));
            return new ModelGeneration(fallbackSelection, response, true);
        } catch (RuntimeException fallbackFailure) {
            fallbackFailure.addSuppressed(primaryFailure);
            throw fallbackFailure;
        }
    }

    public BackendHealthReport healthReport() {
        Map<String, String> statuses = new LinkedHashMap<>();
        Map<String, String> details = new LinkedHashMap<>();
        for (String backendName : orderedBackendNames()) {
            ModelBackend backend = backends.get(backendName);
            if (backend == null || !backend.isConfigured()) {
                statuses.put(backendName, "disabled");
                continue;
            }
            try {
                backend.checkHealth();
                statuses.put(backendName, "up");
            } catch (RuntimeException ex) {
                statuses.put(backendName, "down");
                details.put(backendName, compactMessage(ex.getMessage()));
            }
        }
        String primary = normalizedPrimaryBackend();
        String fallback = normalizedFallbackBackend(primary);
        return new BackendHealthReport(primary, fallback, statuses, buildHealthMessage(primary, fallback, statuses, details));
    }

    private String buildHealthMessage(
            String primary,
            String fallback,
            Map<String, String> statuses,
            Map<String, String> details
    ) {
        if (!backends.containsKey(primary)) {
            return "Configured backend '" + primary + "' is not registered.";
        }
        String primaryStatus = statuses.getOrDefault(primary, "unknown");
        if ("up".equals(primaryStatus)) {
            return "Primary backend '" + primary + "' is reachable.";
        }
        if ("disabled".equals(primaryStatus)) {
            return "Primary backend '" + primary + "' is not configured.";
        }
        String primaryDetail = details.getOrDefault(primary, "unreachable");
        if (fallback == null) {
            return "Primary backend '" + primary + "' is down: " + primaryDetail;
        }
        String fallbackStatus = statuses.getOrDefault(fallback, "unknown");
        if ("up".equals(fallbackStatus)) {
            return "Primary backend '" + primary + "' is down: " + primaryDetail
                    + ". Fallback backend '" + fallback + "' is reachable.";
        }
        if ("disabled".equals(fallbackStatus)) {
            return "Primary backend '" + primary + "' is down: " + primaryDetail
                    + ". Fallback backend '" + fallback + "' is not configured.";
        }
        String fallbackDetail = details.getOrDefault(fallback, "unreachable");
        return "Primary backend '" + primary + "' is down: " + primaryDetail
                + ". Fallback backend '" + fallback + "' is down: " + fallbackDetail;
    }

    private ModelBackend requireConfiguredBackend(String backendName) {
        ModelBackend backend = backends.get(backendName);
        if (backend == null) {
            throw new IllegalStateException("Configured backend '" + backendName + "' is not registered.");
        }
        if (!backend.isConfigured()) {
            throw new IllegalStateException("Configured backend '" + backendName + "' is not fully configured.");
        }
        return backend;
    }

    private ModelBackend resolveConfiguredFallback(String primaryBackend) {
        String fallback = normalizedFallbackBackend(primaryBackend);
        if (fallback == null) {
            return null;
        }
        ModelBackend backend = backends.get(fallback);
        if (backend == null || !backend.isConfigured()) {
            return null;
        }
        return backend;
    }

    private String normalizedPrimaryBackend() {
        String primary = normalizedRequestedBackend(properties.type());
        return primary.isBlank() ? "ollama" : primary;
    }

    private String normalizedFallbackBackend(String primaryBackend) {
        String fallback = normalizedRequestedBackend(properties.fallbackType());
        if (fallback.isBlank() || fallback.equals(primaryBackend)) {
            return null;
        }
        return fallback;
    }

    private List<String> orderedBackendNames() {
        LinkedHashSet<String> orderedNames = new LinkedHashSet<>();
        orderedNames.add("ollama");
        orderedNames.add("openvino");
        orderedNames.addAll(backends.keySet());
        return List.copyOf(orderedNames);
    }

    private String normalizedRequestedBackend(String value) {
        if (value == null) {
            return "";
        }
        return normalize(value);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String compactMessage(String message) {
        if (message == null || message.isBlank()) {
            return "unreachable";
        }
        String normalized = message.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 240 ? normalized : normalized.substring(0, 237) + "...";
    }
}
