package cn.zzy.qwen.service;

import java.util.Map;

public record BackendHealthReport(
        String primaryBackend,
        String fallbackBackend,
        Map<String, String> statuses,
        String message
) {
}
