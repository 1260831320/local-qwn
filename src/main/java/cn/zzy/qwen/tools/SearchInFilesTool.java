package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Component
public class SearchInFilesTool extends WorkspaceSupport implements Tool {

    public SearchInFilesTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "search_in_files";
    }

    @Override
    public String description() {
        return "Search text in workspace files. Arguments: query, path(optional).";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            SearchArgs args = SearchArgs.from(arguments);
            SearchScope scope = collectSearchScope(args.path());
            SearchSummary summary = search(scope.files(), args.query());

            List<String> outputLines = new ArrayList<>(summary.matches());
            if (outputLines.isEmpty()) {
                outputLines.add("(no matches)");
            }
            if (scope.truncated()) {
                outputLines.add("");
                outputLines.add("[directory walk limited to first " + MAX_SEARCH_FILES + " files]");
            }
            if (summary.skippedLargeFiles() > 0) {
                outputLines.add("");
                outputLines.add("[skipped " + summary.skippedLargeFiles()
                        + " large files over " + MAX_SEARCH_FILE_BYTES + " bytes]");
            }
            if (summary.lineLimitedFiles() > 0) {
                outputLines.add("");
                outputLines.add("[scanned only first " + MAX_SEARCH_LINES_PER_FILE + " lines in "
                        + summary.lineLimitedFiles() + " files]");
            }
            if (summary.matchLimitReached()) {
                outputLines.add("");
                outputLines.add("[truncated to first " + MAX_SEARCH_MATCHES + " matches]");
            }

            String output = String.join(System.lineSeparator(), outputLines);
            return new ToolResult(name(), true, output);
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private SearchScope collectSearchScope(String rawPath) throws IOException {
        Path target = resolveExistingPath(rawPath);
        if (Files.isRegularFile(target)) {
            return new SearchScope(List.of(target), false);
        }
        if (!Files.isDirectory(target)) {
            throw new IllegalArgumentException("Not a searchable path: " + rawPath);
        }
        try (Stream<Path> stream = Files.walk(target, MAX_SEARCH_WALK_DEPTH)) {
            List<Path> candidates = stream.filter(Files::isRegularFile)
                    .limit(MAX_SEARCH_FILES + 1L)
                    .toList();
            boolean truncated = candidates.size() > MAX_SEARCH_FILES;
            if (truncated) {
                candidates = candidates.subList(0, MAX_SEARCH_FILES);
            }
            return new SearchScope(candidates, truncated);
        }
    }

    private SearchSummary search(List<Path> files, String query) throws IOException {
        List<String> matches = new ArrayList<>();
        int skippedLargeFiles = 0;
        int lineLimitedFiles = 0;
        boolean matchLimitReached = false;

        for (Path path : files) {
            if (matches.size() >= MAX_SEARCH_MATCHES) {
                matchLimitReached = true;
                break;
            }
            if (Files.size(path) > MAX_SEARCH_FILE_BYTES) {
                skippedLargeFiles++;
                continue;
            }

            List<String> lines = Files.readAllLines(path);
            int limit = Math.min(lines.size(), MAX_SEARCH_LINES_PER_FILE);
            if (lines.size() > MAX_SEARCH_LINES_PER_FILE) {
                lineLimitedFiles++;
            }

            for (int index = 0; index < limit; index++) {
                if (!lines.get(index).contains(query)) {
                    continue;
                }
                matches.add(workspaceRoot().relativize(path)
                        + ":" + (index + 1)
                        + ": "
                        + abbreviate(lines.get(index).trim(), MAX_MATCH_LINE_CHARACTERS));
                if (matches.size() >= MAX_SEARCH_MATCHES) {
                    matchLimitReached = true;
                    break;
                }
            }
        }

        return new SearchSummary(matches, skippedLargeFiles, lineLimitedFiles, matchLimitReached);
    }

    private record SearchArgs(String query, String path) {
        private static SearchArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "query", "path");
            String query = ToolArguments.requiredNonBlank(arguments, "query");
            if (query.length() > MAX_SEARCH_QUERY_LENGTH) {
                throw new IllegalArgumentException("Query too long. Maximum " + MAX_SEARCH_QUERY_LENGTH + " characters.");
            }
            return new SearchArgs(query, ToolArguments.optionalNonBlank(arguments, "path", "."));
        }
    }

    private record SearchScope(List<Path> files, boolean truncated) {
    }

    private record SearchSummary(
            List<String> matches,
            int skippedLargeFiles,
            int lineLimitedFiles,
            boolean matchLimitReached
    ) {
    }
}
