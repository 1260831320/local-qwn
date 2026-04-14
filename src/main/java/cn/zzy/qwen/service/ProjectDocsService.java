package cn.zzy.qwen.service;

import cn.zzy.qwen.model.DocsResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

@Service
public class ProjectDocsService {

    public DocsResponse readme(String language) {
        String normalizedLanguage = normalizeLanguage(language);
        Path root = Path.of(System.getProperty("user.dir"));
        Path readmePath = "en".equals(normalizedLanguage)
                ? root.resolve("README.en.md")
                : root.resolve("README.md");
        String title = "en".equals(normalizedLanguage) ? "Project Guide" : "项目说明";
        try {
            return new DocsResponse(
                    normalizedLanguage,
                    title,
                    Files.readString(readmePath, StandardCharsets.UTF_8)
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to read documentation file: " + readmePath.getFileName(), ex);
        }
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "zh";
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        if ("zh".equals(normalized) || "zh-cn".equals(normalized) || "cn".equals(normalized)) {
            return "zh";
        }
        if ("en".equals(normalized) || "en-us".equals(normalized)) {
            return "en";
        }
        throw new IllegalArgumentException("Unsupported docs language '" + language + "'.");
    }
}
