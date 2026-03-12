package cn.zzy.qwen.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public class MachineConfigEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {
    private static final Logger log = LoggerFactory.getLogger(MachineConfigEnvironmentPostProcessor.class);
    private static final String DEFAULT_PROFILE = "default";
    private static final Pattern VALID_PROFILE = Pattern.compile("[a-z0-9._-]+");

    private final YamlPropertySourceLoader loader = new YamlPropertySourceLoader();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String requestedProfile = resolveRequestedProfile(environment);
        String activeProfile = DEFAULT_PROFILE;

        loadYaml(environment, "qwen-machine-common", "machines/common.yml");
        loadYaml(environment, "qwen-machine-default", "machines/default.yml");

        if (!DEFAULT_PROFILE.equals(requestedProfile)
                && loadYaml(environment, "qwen-machine-" + requestedProfile, "machines/" + requestedProfile + ".yml")) {
            activeProfile = requestedProfile;
        }

        registerMetadata(environment, activeProfile, requestedProfile);
        if (DEFAULT_PROFILE.equals(activeProfile)) {
            log.info("Loaded machine configuration profile '{}'.", activeProfile);
            if (!DEFAULT_PROFILE.equals(requestedProfile)) {
                log.info("Requested machine profile '{}' was not found; using '{}'.", requestedProfile, activeProfile);
            }
            return;
        }
        log.info("Loaded machine configuration profile '{}'.", activeProfile);
    }

    @Override
    public int getOrder() {
        return ConfigDataEnvironmentPostProcessor.ORDER + 1;
    }

    private String resolveRequestedProfile(ConfigurableEnvironment environment) {
        String requested = firstNonBlank(
                environment.getProperty("QWEN_MACHINE_PROFILE"),
                environment.getProperty("qwen.machine.profile"),
                environment.getProperty("COMPUTERNAME"),
                environment.getProperty("HOSTNAME")
        );
        if (requested == null) {
            return DEFAULT_PROFILE;
        }
        String normalized = normalizeProfile(requested);
        return normalized == null ? DEFAULT_PROFILE : normalized;
    }

    private String normalizeProfile(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        if (normalized.isBlank()) {
            return null;
        }
        if (!VALID_PROFILE.matcher(normalized).matches()) {
            log.warn("Ignoring machine profile '{}' because it contains unsupported characters.", value);
            return null;
        }
        return normalized;
    }

    private String firstNonBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate;
            }
        }
        return null;
    }

    private boolean loadYaml(ConfigurableEnvironment environment, String logicalName, String classpathLocation) {
        Resource resource = new ClassPathResource(classpathLocation);
        if (!resource.exists()) {
            return false;
        }
        try {
            List<PropertySource<?>> propertySources = loader.load(logicalName, resource);
            for (PropertySource<?> propertySource : propertySources) {
                insertAfterEnvironmentSources(environment.getPropertySources(), propertySource);
            }
            return true;
        } catch (IOException ex) {
            throw new UncheckedIOException("Failed to load machine configuration from " + classpathLocation, ex);
        }
    }

    private void registerMetadata(
            ConfigurableEnvironment environment,
            String activeProfile,
            String requestedProfile
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("qwen.machine.profile", activeProfile);
        metadata.put("qwen.machine.requested-profile", requestedProfile);
        MapPropertySource propertySource = new MapPropertySource("qwen-machine-metadata", metadata);
        MutablePropertySources propertySources = environment.getPropertySources();
        if (propertySources.contains(propertySource.getName())) {
            propertySources.replace(propertySource.getName(), propertySource);
            return;
        }
        insertAfterEnvironmentSources(propertySources, propertySource);
    }

    private void insertAfterEnvironmentSources(MutablePropertySources propertySources, PropertySource<?> propertySource) {
        if (propertySources.contains(propertySource.getName())) {
            propertySources.remove(propertySource.getName());
        }
        if (propertySources.contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
            propertySources.addAfter(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, propertySource);
            return;
        }
        if (propertySources.contains(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME)) {
            propertySources.addAfter(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME, propertySource);
            return;
        }
        propertySources.addLast(propertySource);
    }
}
