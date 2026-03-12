package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public abstract class WorkspaceSupport {

    protected static final int MAX_LIST_ENTRIES = 200;
    protected static final int MAX_READ_BYTES = 128 * 1024;
    protected static final int MAX_READ_LINES = 500;
    protected static final int MAX_READ_CHARACTERS = 24_000;
    protected static final int MAX_MULTI_FILE_COUNT = 6;
    protected static final int MAX_MULTI_FILE_CHARACTERS = 9_000;
    protected static final int MAX_MULTI_TOTAL_CHARACTERS = 36_000;
    protected static final int MAX_SEARCH_WALK_DEPTH = 8;
    protected static final int MAX_SEARCH_FILES = 250;
    protected static final int MAX_SEARCH_FILE_BYTES = 128 * 1024;
    protected static final int MAX_SEARCH_LINES_PER_FILE = 500;
    protected static final int MAX_SEARCH_MATCHES = 60;
    protected static final int MAX_SEARCH_QUERY_LENGTH = 200;
    protected static final int MAX_MATCH_LINE_CHARACTERS = 220;
    protected static final int MAX_PATCH_FILE_BYTES = 128 * 1024;
    protected static final int MAX_PATCH_FRAGMENT_CHARACTERS = 12_000;
    protected static final int MAX_WRITE_CHARACTERS = 32_000;

    private final Path workspaceRoot;

    protected WorkspaceSupport(ToolProperties properties) {
        this.workspaceRoot = Path.of(properties.workspaceRoot()).normalize().toAbsolutePath();
    }

    protected Path workspaceRoot() {
        return workspaceRoot;
    }

    protected Path resolvePath(String rawPath) {
        Path path = workspaceRoot.resolve(rawPath).normalize().toAbsolutePath();
        if (!path.startsWith(workspaceRoot)) {
            throw new IllegalArgumentException("Path escapes workspace root.");
        }
        return path;
    }

    protected Path resolveExistingPath(String rawPath) {
        Path path = resolvePath(rawPath);
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("Path not found: " + rawPath);
        }
        return path;
    }

    protected Path resolveRegularFile(String rawPath) {
        Path path = resolveExistingPath(rawPath);
        if (!Files.isRegularFile(path)) {
            throw new IllegalArgumentException("Not a regular file: " + rawPath);
        }
        return path;
    }

    protected LimitedText readTextWithLimits(Path path, int maxBytes, int maxLines, int maxCharacters) throws IOException {
        long size = Files.size(path);
        if (size > maxBytes) {
            throw new IllegalArgumentException(
                    "File too large to read safely: " + workspaceRoot.relativize(path) + " (" + size + " bytes)."
            );
        }

        List<String> lines = Files.readAllLines(path);
        StringBuilder builder = new StringBuilder();
        boolean truncated = false;
        int appendedLines = 0;

        for (String line : lines) {
            if (appendedLines >= maxLines) {
                truncated = true;
                break;
            }

            String next = appendedLines == 0 ? line : System.lineSeparator() + line;
            if (builder.length() + next.length() > maxCharacters) {
                int remaining = maxCharacters - builder.length();
                if (remaining > 0) {
                    builder.append(next, 0, Math.min(remaining, next.length()));
                }
                truncated = true;
                break;
            }

            builder.append(next);
            appendedLines++;
        }

        if (truncated) {
            builder.append(System.lineSeparator())
                    .append(System.lineSeparator())
                    .append("[truncated to first ")
                    .append(Math.min(Math.max(appendedLines, 1), maxLines))
                    .append(" lines / ")
                    .append(maxCharacters)
                    .append(" chars]");
        }

        return new LimitedText(builder.toString(), truncated);
    }

    protected String abbreviate(String value, int maxCharacters) {
        if (value == null || value.length() <= maxCharacters) {
            return value;
        }
        return value.substring(0, Math.max(0, maxCharacters - 3)) + "...";
    }

    protected record LimitedText(String text, boolean truncated) {
    }
}
