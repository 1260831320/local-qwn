package cn.zzy.qwen.tools;

import cn.zzy.qwen.config.ToolProperties;
import cn.zzy.qwen.model.ToolResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ReadFileToolTest {

    @TempDir
    Path workspace;

    @Test
    void truncatesLargeTextResponses() throws IOException {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 700; i++) {
            builder.append("line-").append(i).append(System.lineSeparator());
        }
        Files.writeString(workspace.resolve("big.txt"), builder.toString());
        ReadFileTool tool = new ReadFileTool(new ToolProperties(workspace.toString()));

        ToolResult result = tool.execute(Map.of("path", "big.txt"));

        assertThat(result.success()).isTrue();
        assertThat(result.output()).contains("[truncated to first");
    }
}
