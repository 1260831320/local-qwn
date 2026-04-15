package cn.zzy.qwen.service;

import cn.zzy.qwen.config.SessionStoreProperties;
import cn.zzy.qwen.model.ConversationMessage;
import cn.zzy.qwen.model.PatchHistoryEntry;
import cn.zzy.qwen.model.PendingPatch;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LocalSessionPersistenceTest {

    @TempDir
    Path tempDir;

    @Test
    void restoresConversationPendingPatchAndHistoryAcrossNewServiceInstances() {
        SessionStateStore firstStore = new SessionStateStore(new ObjectMapper(), new SessionStoreProperties(tempDir.toString()));
        ConversationMemoryService firstConversationService = new ConversationMemoryService(firstStore);
        PendingPatchService firstPendingPatchService = new PendingPatchService(firstStore);
        PatchHistoryService firstPatchHistoryService = new PatchHistoryService(firstStore);

        PendingPatch pendingPatch = new PendingPatch("p1", "docs.txt", "old", "new", "preview");
        PatchHistoryEntry historyEntry = new PatchHistoryEntry(
                "h1",
                "pending",
                "docs.txt",
                "已生成变更预览，等待确认。",
                "old",
                "new",
                "preview",
                "2026-04-15T17:00:00+08:00"
        );

        firstConversationService.append("s1", "user", "hello");
        firstConversationService.append("s1", "assistant", "hi");
        firstPendingPatchService.save("s1", pendingPatch);
        firstPatchHistoryService.append("s1", historyEntry);

        SessionStateStore secondStore = new SessionStateStore(new ObjectMapper(), new SessionStoreProperties(tempDir.toString()));
        ConversationMemoryService secondConversationService = new ConversationMemoryService(secondStore);
        PendingPatchService secondPendingPatchService = new PendingPatchService(secondStore);
        PatchHistoryService secondPatchHistoryService = new PatchHistoryService(secondStore);

        assertThat(secondConversationService.history("s1")).containsExactly(
                new ConversationMessage("user", "hello"),
                new ConversationMessage("assistant", "hi")
        );
        assertThat(secondPendingPatchService.find("s1")).contains(pendingPatch);
        assertThat(secondPatchHistoryService.history("s1")).containsExactly(historyEntry);
    }

    @Test
    void clearsStoredSessionStateWhenAllSectionsAreRemoved() throws Exception {
        SessionStateStore firstStore = new SessionStateStore(new ObjectMapper(), new SessionStoreProperties(tempDir.toString()));
        ConversationMemoryService firstConversationService = new ConversationMemoryService(firstStore);
        PendingPatchService firstPendingPatchService = new PendingPatchService(firstStore);
        PatchHistoryService firstPatchHistoryService = new PatchHistoryService(firstStore);

        firstConversationService.append("s1", "user", "hello");
        firstPendingPatchService.save("s1", new PendingPatch("p1", "docs.txt", "old", "new", "preview"));
        firstPatchHistoryService.append("s1", new PatchHistoryEntry(
                "h1",
                "applied",
                "docs.txt",
                "变更已应用。",
                "old",
                "new",
                "preview",
                "2026-04-15T17:05:00+08:00"
        ));

        firstConversationService.clear("s1");
        firstPendingPatchService.clear("s1");
        firstPatchHistoryService.clear("s1");

        SessionStateStore secondStore = new SessionStateStore(new ObjectMapper(), new SessionStoreProperties(tempDir.toString()));
        ConversationMemoryService secondConversationService = new ConversationMemoryService(secondStore);
        PendingPatchService secondPendingPatchService = new PendingPatchService(secondStore);
        PatchHistoryService secondPatchHistoryService = new PatchHistoryService(secondStore);

        assertThat(secondConversationService.history("s1")).isEmpty();
        assertThat(secondPendingPatchService.find("s1")).isEmpty();
        assertThat(secondPatchHistoryService.history("s1")).isEmpty();
        assertThat(listStoredFiles()).isEmpty();
    }

    private List<Path> listStoredFiles() throws Exception {
        try (var paths = java.nio.file.Files.list(tempDir)) {
            return paths.toList();
        }
    }
}
