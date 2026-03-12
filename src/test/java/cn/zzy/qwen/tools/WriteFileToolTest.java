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

class WriteFileToolTest {

    @TempDir
    Path workspace;

    @Test
    void createsNewFileInsideWorkspace() throws IOException {
        WriteFileTool tool = new WriteFileTool(new ToolProperties(workspace.toString()));

        ToolResult result = tool.execute(Map.of("path", "notes/todo.txt", "content", "hello"));

        assertThat(result.success()).isTrue();
        assertThat(Files.readString(workspace.resolve("notes/todo.txt"))).isEqualTo("hello");
    }

    @Test
    void rejectsOverwritingExistingFile() throws IOException {
        Files.writeString(workspace.resolve("demo.txt"), "before");
        WriteFileTool tool = new WriteFileTool(new ToolProperties(workspace.toString()));

        ToolResult result = tool.execute(Map.of("path", "demo.txt", "content", "after"));

        assertThat(result.success()).isFalse();
        assertThat(result.output()).contains("cannot overwrite existing files");
        assertThat(Files.readString(workspace.resolve("demo.txt"))).isEqualTo("before");
    }
}
