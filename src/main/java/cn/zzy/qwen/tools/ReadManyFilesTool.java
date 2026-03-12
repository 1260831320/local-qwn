package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@Component
public class ReadManyFilesTool extends WorkspaceSupport implements Tool {

    public ReadManyFilesTool(ToolProperties properties) {
        super(properties);
    }

    @Override
    public String name() {
        return "read_many_files";
    }

    @Override
    public String description() {
        return "Read multiple UTF-8 text files. Argument: paths separated by semicolons.";
    }

    @Override
    public ToolResult execute(Map<String, String> arguments) {
        try {
            ReadManyFilesArgs args = ReadManyFilesArgs.from(arguments);
            StringBuilder output = new StringBuilder();
            boolean truncated = false;

            for (String rawPath : args.paths()) {
                String block = readFileBlock(rawPath);
                if (output.length() > 0) {
                    if (output.length() + 2 * System.lineSeparator().length() > MAX_MULTI_TOTAL_CHARACTERS) {
                        truncated = true;
                        break;
                    }
                    output.append(System.lineSeparator()).append(System.lineSeparator());
                }
                if (output.length() + block.length() > MAX_MULTI_TOTAL_CHARACTERS) {
                    int remaining = MAX_MULTI_TOTAL_CHARACTERS - output.length();
                    if (remaining > 0) {
                        output.append(block, 0, Math.min(remaining, block.length()));
                    }
                    truncated = true;
                    break;
                }
                output.append(block);
            }

            if (truncated) {
                output.append(System.lineSeparator()).append(System.lineSeparator())
                        .append("[truncated combined output to ")
                        .append(MAX_MULTI_TOTAL_CHARACTERS)
                        .append(" chars]");
            }

            return new ToolResult(name(), true, output.length() == 0 ? "(empty)" : output.toString());
        } catch (IOException | RuntimeException ex) {
            return new ToolResult(name(), false, ex.getMessage());
        }
    }

    private String readFileBlock(String rawPath) throws IOException {
        Path path = resolveRegularFile(rawPath);
        LimitedText content = readTextWithLimits(path, MAX_READ_BYTES, MAX_READ_LINES / 2, MAX_MULTI_FILE_CHARACTERS);
        return "FILE: " + workspaceRoot().relativize(path) + System.lineSeparator() + content.text();
    }

    private record ReadManyFilesArgs(List<String> paths) {
        private static ReadManyFilesArgs from(Map<String, String> arguments) {
            ToolArguments.rejectUnknown(arguments, "paths");
            String rawPaths = ToolArguments.requiredNonBlank(arguments, "paths");
            return new ReadManyFilesArgs(ToolArguments.semicolonSeparatedPaths(rawPaths, MAX_MULTI_FILE_COUNT));
        }
    }
}
