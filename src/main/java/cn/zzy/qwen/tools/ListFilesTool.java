package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ListFilesTool extends WorkspaceSupport implements Tool {

    public ListFilesTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "list_files";
    }

    @Override
    public String description() {
        return "List files under a relative workspace path. Argument: path.";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            ListFilesArgs args = ListFilesArgs.from(arguments);
            Path path = resolveExistingPath(args.path());
            if (Files.isRegularFile(path)) {
                return new ToolResult(name(), true, describePath(path).toString());
            }
            if (!Files.isDirectory(path)) {
                return new ToolResult(name(), false, "Not a directory: " + args.path());
            }

            List<Path> listed;
            try (var stream = Files.list(path)) {
                listed = stream.sorted().limit(MAX_LIST_ENTRIES + 1L).toList();
            }
            boolean truncated = listed.size() > MAX_LIST_ENTRIES;
            if (truncated) {
                listed = listed.subList(0, MAX_LIST_ENTRIES);
            }

            String output = listed.stream()
                    .map(this::describePath)
                    .map(Path::toString)
                    .collect(Collectors.joining(System.lineSeparator()));
            if (truncated) {
                output += System.lineSeparator() + System.lineSeparator()
                        + "[truncated to first " + MAX_LIST_ENTRIES + " entries]";
            }
            return new ToolResult(name(), true, output.isBlank() ? "(empty)" : output);
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private Path describePath(Path path) {
        Path relative = workspaceRoot().relativize(path);
        return path.toFile().isDirectory() ? Path.of(relative + "/") : relative;
    }

    private record ListFilesArgs(String path) {
        private static ListFilesArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "path");
            return new ListFilesArgs(ToolArguments.optionalNonBlank(arguments, "path", "."));
        }
    }
}
