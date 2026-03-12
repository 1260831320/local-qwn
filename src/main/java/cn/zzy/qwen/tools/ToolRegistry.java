package cn.zzy.qwen.tools;

import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ToolRegistry {

    private final Map<String, Tool> tools;

    public ToolRegistry(List<Tool> tools) {
        this.tools = tools.stream().collect(Collectors.toMap(Tool::name, tool -> tool));
    }

    public String describeTools() {
        return tools.values().stream()
                .map(tool -> "- " + tool.name() + ": " + tool.description())
                .sorted()
                .collect(Collectors.joining(System.lineSeparator()));
    }

    public ToolResult execute(String toolName, Map<String, String> arguments) {
        Tool tool = tools.get(toolName);
        if (tool == null) {
            return new ToolResult(toolName, false, "Unknown tool: " + toolName);
        }
        return tool.execute(arguments);
    }
}
