package cn.zzy.qwen.service;

import cn.zzy.qwen.model.PatchHistoryEntry;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PatchHistoryService {

    private static final int MAX_ENTRIES = 8;

    private final Map<String, List<PatchHistoryEntry>> histories = new ConcurrentHashMap<>();
    private final Set<String> loadedSessions = ConcurrentHashMap.newKeySet();
    private final SessionStateStore sessionStateStore;

    public PatchHistoryService(SessionStateStore sessionStateStore) {
        this.sessionStateStore = sessionStateStore;
    }

    public List<PatchHistoryEntry> history(String sessionId) {
        if (loadedSessions.add(sessionId)) {
            histories.put(sessionId, sessionStateStore.readPatchHistory(sessionId));
        }
        return new ArrayList<>(histories.getOrDefault(sessionId, List.of()));
    }

    public void append(String sessionId, PatchHistoryEntry entry) {
        histories.compute(sessionId, (key, current) -> {
            List<PatchHistoryEntry> updated = current == null
                    ? sessionStateStore.readPatchHistory(key)
                    : new ArrayList<>(current);
            updated.add(0, entry);
            if (updated.size() > MAX_ENTRIES) {
                updated = new ArrayList<>(updated.subList(0, MAX_ENTRIES));
            }
            loadedSessions.add(key);
            sessionStateStore.writePatchHistory(key, updated);
            return updated;
        });
    }

    public void clear(String sessionId) {
        histories.remove(sessionId);
        loadedSessions.remove(sessionId);
        sessionStateStore.writePatchHistory(sessionId, List.of());
    }
}
