package cn.zzy.qwen.model;

import java.util.List;

public record SessionSnapshotResponse(
        String sessionId,
        boolean hasContent,
        List<ConversationMessage> messages,
        PendingPatch pendingPatch
) {
}
