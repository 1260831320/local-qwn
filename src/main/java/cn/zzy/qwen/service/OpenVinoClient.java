package cn.zzy.qwen.service;

import cn.zzy.qwen.config.OpenVinoProperties;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
public class OpenVinoClient implements ModelBackend {
    private static final int HEALTH_MAX_NEW_TOKENS = 16;

    private final OpenVinoProperties properties;

    public OpenVinoClient(OpenVinoProperties properties) {
        this.properties = properties;
    }

    @Override
    public String backendName() {
        return "openvino";
    }

    @Override
    public String generate(BackendGenerationRequest request) {
        return runCommand(
                request.prompt(),
                Math.max(properties.maxNewTokens(), 1),
                request.model()
        );
    }

    @Override
    public void checkHealth() {
        String output = runCommand(
                properties.healthPrompt(),
                Math.max(1, Math.min(properties.maxNewTokens(), HEALTH_MAX_NEW_TOKENS)),
                properties.modelDir()
        );
        if (output.isBlank()) {
            throw new IllegalStateException("OpenVINO health check returned an empty response.");
        }
    }

    @Override
    public boolean isConfigured() {
        return hasText(properties.pythonExe())
                && hasText(properties.scriptPath())
                && hasText(properties.modelDir());
    }

    private String runCommand(String prompt, int maxNewTokens, String requestedModelDir) {
        validateConfigured();
        validatePath("python executable", properties.pythonExe(), false);
        validatePath("script path", properties.scriptPath(), false);
        String modelDir = requestedModelDir == null || requestedModelDir.isBlank()
                ? properties.modelDir()
                : requestedModelDir.trim();
        validatePath("model directory", modelDir, true);

        List<String> command = new ArrayList<>();
        command.add(properties.pythonExe());
        command.add(properties.scriptPath());
        command.add(modelDir);
        if (hasText(properties.device())) {
            command.add("--device");
            command.add(properties.device());
        }
        command.add("--max-new-tokens");
        command.add(String.valueOf(maxNewTokens));

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        Path scriptParent = Path.of(properties.scriptPath()).getParent();
        if (scriptParent != null) {
            processBuilder.directory(scriptParent.toFile());
        }
        processBuilder.environment().put("PYTHONIOENCODING", "UTF-8");
        processBuilder.environment().put("PYTHONUTF8", "1");
        processBuilder.redirectErrorStream(true);

        try {
            Process process = processBuilder.start();
            writePrompt(process, prompt);
            CompletableFuture<String> outputFuture = readOutput(process.getInputStream());
            boolean finished = process.waitFor(Math.max(properties.timeoutSeconds(), 1), TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException("OpenVINO command timed out after " + properties.timeoutSeconds() + " seconds.");
            }
            String output = outputFuture.get(5, TimeUnit.SECONDS).trim();
            if (process.exitValue() != 0) {
                throw new IllegalStateException("OpenVINO command failed with exit code " + process.exitValue()
                        + ": " + abbreviate(output));
            }
            if (output.isBlank()) {
                throw new IllegalStateException("OpenVINO command returned an empty response.");
            }
            return output;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to start OpenVINO command.", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("OpenVINO command was interrupted.", ex);
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof UncheckedIOException ioException) {
                throw new IllegalStateException("Failed to read OpenVINO output.", ioException.getCause());
            }
            throw new IllegalStateException("Failed to read OpenVINO output.", cause);
        } catch (TimeoutException ex) {
            throw new IllegalStateException("Timed out while collecting OpenVINO output.", ex);
        }
    }

    private void writePrompt(Process process, String prompt) throws IOException {
        try (var stream = process.getOutputStream()) {
            stream.write((prompt == null ? "" : prompt).getBytes(StandardCharsets.UTF_8));
            stream.flush();
        }
    }

    private CompletableFuture<String> readOutput(InputStream inputStream) {
        return CompletableFuture.supplyAsync(() -> {
            try (InputStream stream = inputStream; ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                stream.transferTo(buffer);
                return buffer.toString(StandardCharsets.UTF_8);
            } catch (IOException ex) {
                throw new UncheckedIOException(ex);
            }
        });
    }

    private void validateConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenVINO backend is not fully configured.");
        }
    }

    private void validatePath(String label, String value, boolean directory) {
        Path path = Path.of(value);
        if (!Files.exists(path)) {
            throw new IllegalStateException("OpenVINO " + label + " does not exist: " + value);
        }
        if (directory && !Files.isDirectory(path)) {
            throw new IllegalStateException("OpenVINO " + label + " is not a directory: " + value);
        }
        if (!directory && Files.isDirectory(path)) {
            throw new IllegalStateException("OpenVINO " + label + " is a directory: " + value);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String abbreviate(String value) {
        String normalized = value == null ? "" : value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 320 ? normalized : normalized.substring(0, 317) + "...";
    }
}
