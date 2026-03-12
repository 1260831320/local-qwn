package cn.zzy.qwen.model;

public record ToolResult(String tool, boolean success, String output) {
}
