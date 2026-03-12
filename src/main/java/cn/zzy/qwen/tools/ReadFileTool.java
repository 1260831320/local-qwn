package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

@Component
public class ReadFileTool extends WorkspaceSupport implements Tool {

    public ReadFileTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "read_file";
    }

    @Override
    public String description() {
        return "Read a UTF-8 text file under the workspace. Argument: path.";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            ReadFileArgs args = ReadFileArgs.from(arguments);
            Path path = resolveRegularFile(args.path());
            LimitedText content = readTextWithLimits(path, MAX_READ_BYTES, MAX_READ_LINES, MAX_READ_CHARACTERS);
            return new ToolResult(name(), true, content.text());
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private record ReadFileArgs(String path) {
        private static ReadFileArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "path");
            return new ReadFileArgs(ToolArguments.requiredNonBlank(arguments, "path"));
        }
    }
}
