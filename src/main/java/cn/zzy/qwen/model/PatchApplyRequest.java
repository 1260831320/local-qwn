package cn.zzy.qwen.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatchApplyRequest(
        @NotBlank @Size(max = 120) String sessionId,
        @NotBlank @Size(max = 120) String patchId
) {
}
