package cn.zzy.qwen.service;

import cn.zzy.qwen.model.ToolResult;
import org.springframework.stereotype.Component;

@Component
public class ToolTraceFormatter {

    private static final int MAX_OUTPUT_LENGTH = 6000;

    public String format(ToolResult result) {
        String output = result.output() == null ? "" : result.output();
        if (output.length() > MAX_OUTPUT_LENGTH) {
            output = output.substring(0, MAX_OUTPUT_LENGTH) + System.lineSeparator() + "...<truncated>";
        }
        return "tool[" + result.tool() + " success=" + result.success() + "]:" + System.lineSeparator() + output;
    }
}
