package cn.zzy.qwen.service;

import cn.zzy.qwen.config.SessionStoreProperties;
import cn.zzy.qwen.model.PatchHistoryEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PatchHistoryServiceTest {

    @TempDir
    Path tempDir;

    private PatchHistoryService createService() {
        return new PatchHistoryService(new SessionStateStore(new ObjectMapper(), new SessionStoreProperties(tempDir.toString())));
    }

    @Test
    void keepsNewestEntriesFirst() {
        PatchHistoryService service = createService();
        PatchHistoryEntry first = new PatchHistoryEntry("1", "pending", "a.txt", "preview", "old", "new", "preview-1", "2026-04-15T10:00:00+08:00");
        PatchHistoryEntry second = new PatchHistoryEntry("2", "applied", "a.txt", "patched", "old", "new", "preview-1", "2026-04-15T10:05:00+08:00");

        service.append("s1", first);
        service.append("s1", second);

        List<PatchHistoryEntry> history = service.history("s1");
        assertThat(history).containsExactly(second, first);
    }

    @Test
    void limitsHistorySize() {
        PatchHistoryService service = createService();

        for (int i = 0; i < 10; i++) {
            service.append("s1", new PatchHistoryEntry(
                    String.valueOf(i),
                    i % 2 == 0 ? "pending" : "applied",
                    "a.txt",
                    "message-" + i,
                    "old-" + i,
                    "new-" + i,
                    "preview-" + i,
                    "2026-04-15T10:0" + i + ":00+08:00"
            ));
        }

        List<PatchHistoryEntry> history = service.history("s1");
        assertThat(history).hasSize(8);
        assertThat(history.get(0).id()).isEqualTo("9");
        assertThat(history.get(7).id()).isEqualTo("2");
    }
}
