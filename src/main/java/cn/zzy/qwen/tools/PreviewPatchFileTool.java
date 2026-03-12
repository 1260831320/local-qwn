package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@Component
public class PreviewPatchFileTool extends WorkspaceSupport implements Tool {

    public PreviewPatchFileTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "preview_patch_file";
    }

    @Override
    public String description() {
        return "Preview exactly one unique text replacement in a workspace file without writing it. Arguments: path, search, replace.";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            PatchArgs args = PatchArgs.from(arguments);
            Path path = resolveRegularFile(args.path());
            LimitedText content = readTextWithLimits(path, MAX_PATCH_FILE_BYTES, Integer.MAX_VALUE, Integer.MAX_VALUE);
            int first = content.text().indexOf(args.search());
            if (first < 0) {
                return new ToolResult(name(), false, "Search fragment not found.");
            }
            int second = content.text().indexOf(args.search(), first + args.search().length());
            if (second >= 0) {
                return new ToolResult(name(), false, "Search fragment is not unique. Refine the search text.");
            }

            int lineNumber = lineNumberOf(content.text(), first);
            String preview = """
                    FILE: %s
                    LINE: %s
                    --- SEARCH ---
                    %s
                    --- REPLACE ---
                    %s
                    """.formatted(workspaceRoot().relativize(path), lineNumber, args.search(), args.replace());
            return new ToolResult(name(), true, preview);
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private int lineNumberOf(String content, int startIndex) {
        int lines = 1;
        for (int i = 0; i < startIndex; i++) {
            if (content.charAt(i) == '\n') {
                lines++;
            }
        }
        return lines;
    }

    private record PatchArgs(String path, String search, String replace) {
        private static PatchArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "path", "search", "replace");
            String path = ToolArguments.requiredNonBlank(arguments, "path");
            String search = ToolArguments.required(arguments, "search");
            String replace = ToolArguments.required(arguments, "replace");
            if (search.isBlank()) {
                throw new IllegalArgumentException("Missing required argument: search");
            }
            if (search.length() > MAX_PATCH_FRAGMENT_CHARACTERS || replace.length() > MAX_PATCH_FRAGMENT_CHARACTERS) {
                throw new IllegalArgumentException(
                        "Patch fragments too large. Maximum " + MAX_PATCH_FRAGMENT_CHARACTERS + " characters each."
                );
            }
            return new PatchArgs(path, search, replace);
        }
    }
}
