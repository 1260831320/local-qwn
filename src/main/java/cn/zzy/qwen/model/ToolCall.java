package cn.zzy.qwen.model;

import java.util.Map;

public record ToolCall(String tool, Map<String, String> arguments) {
}
