package cn.zzy.qwen.tools;

import cn.zzy.qwen.model.ToolResult;

import java.util.Map;

public interface Tool {
    String name();

    String description();

    ToolResult execute(Map<String, String> arguments);
}
