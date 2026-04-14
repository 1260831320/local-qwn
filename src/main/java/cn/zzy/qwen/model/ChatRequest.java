package cn.zzy.qwen.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
        @NotBlank @Size(max = 12_000) String message,
        @NotBlank @Size(max = 120) String sessionId,
        @Size(max = 40) String backend,
        @Size(max = 80) String modelProfile
) {
}
