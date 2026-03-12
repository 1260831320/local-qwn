package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Map;

@Component
public class WriteFileTool extends WorkspaceSupport implements Tool {

    public WriteFileTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "write_file";
    }

    @Override
    public String description() {
        return "Write UTF-8 text to a file under the workspace. Arguments: path, content.";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            WriteFileArgs args = WriteFileArgs.from(arguments);
            if (args.content().length() > MAX_WRITE_CHARACTERS) {
                return new ToolResult(name(), false, "Content too large. Maximum " + MAX_WRITE_CHARACTERS + " characters.");
            }

            Path path = resolvePath(args.path());
            if (Files.exists(path)) {
                if (!Files.isRegularFile(path)) {
                    return new ToolResult(name(), false, "Not a regular file: " + args.path());
                }
                if (Files.size(path) > MAX_PATCH_FILE_BYTES) {
                    return new ToolResult(name(), false,
                            "Existing file is too large to overwrite safely. Use a narrower patch workflow.");
                }
                String existing = Files.readString(path);
                if (existing.equals(args.content())) {
                    return new ToolResult(name(), true, "File already up to date: " + workspaceRoot().relativize(path));
                }
                return new ToolResult(
                        name(),
                        false,
                        "write_file cannot overwrite existing files. Use preview_patch_file and patch_file for modifications."
                );
            }

            Files.createDirectories(path.getParent());
            Files.writeString(path, args.content(), StandardOpenOption.CREATE_NEW);
            return new ToolResult(name(), true, "Created file: " + workspaceRoot().relativize(path));
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private record WriteFileArgs(String path, String content) {
        private static WriteFileArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "path", "content");
            return new WriteFileArgs(
                    ToolArguments.requiredNonBlank(arguments, "path"),
                    ToolArguments.required(arguments, "content")
            );
        }
    }
}
