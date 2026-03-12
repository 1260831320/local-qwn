package cn.zzy.qwen.tools;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class ToolArguments {

    private ToolArguments() {
    }

    static void rejectUnknown(Map<String, String> arguments, String... allowedKeys) {
        if (arguments == null) {
            throw new IllegalArgumentException("Missing tool arguments.");
        }
        Set<String> allowed = Set.of(allowedKeys);
        LinkedHashSet<String> unknown = arguments.keySet().stream()
                .filter(key -> !allowed.contains(key))
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Unknown arguments: " + String.join(", ", unknown));
        }
    }

    static String required(Map<String, String> arguments, String key) {
        if (arguments == null || !arguments.containsKey(key) || arguments.get(key) == null) {
            throw new IllegalArgumentException("Missing required argument: " + key);
        }
        return arguments.get(key);
    }

    static String requiredNonBlank(Map<String, String> arguments, String key) {
        String value = required(arguments, key);
        if (value.isBlank()) {
            throw new IllegalArgumentException("Missing required argument: " + key);
        }
        return value.trim();
    }

    static String optionalNonBlank(Map<String, String> arguments, String key, String defaultValue) {
        if (arguments == null) {
            return defaultValue;
        }
        String value = arguments.get(key);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return value.trim();
    }

    static List<String> semicolonSeparatedPaths(String rawPaths, int maxItems) {
        List<String> paths = Arrays.stream(rawPaths.split(";"))
                .map(String::trim)
                .filter(path -> !path.isBlank())
                .toList();
        if (paths.isEmpty()) {
            throw new IllegalArgumentException("Missing required argument: paths");
        }
        if (paths.size() > maxItems) {
            throw new IllegalArgumentException("Too many paths. Maximum " + maxItems + " files per request.");
        }
        return paths;
    }
}
