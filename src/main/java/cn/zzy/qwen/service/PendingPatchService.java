package cn.zzy.qwen.service;

import cn.zzy.qwen.model.PendingPatch;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingPatchService {

    private final Map<String, PendingPatch> pendingPatches = new ConcurrentHashMap<>();
    private final Set<String> loadedSessions = ConcurrentHashMap.newKeySet();
    private final SessionStateStore sessionStateStore;

    public PendingPatchService(SessionStateStore sessionStateStore) {
        this.sessionStateStore = sessionStateStore;
    }

    public void save(String sessionId, PendingPatch pendingPatch) {
        pendingPatches.put(sessionId, pendingPatch);
        loadedSessions.add(sessionId);
        sessionStateStore.writePendingPatch(sessionId, pendingPatch);
    }

    public Optional<PendingPatch> find(String sessionId) {
        PendingPatch cached = pendingPatches.get(sessionId);
        if (cached != null) {
            return Optional.of(cached);
        }
        if (loadedSessions.contains(sessionId)) {
            return Optional.empty();
        }
        Optional<PendingPatch> loaded = sessionStateStore.readPendingPatch(sessionId);
        loaded.ifPresent(patch -> pendingPatches.put(sessionId, patch));
        loadedSessions.add(sessionId);
        return loaded;
    }

    public Optional<PendingPatch> find(String sessionId, String patchId) {
        return find(sessionId).filter(pendingPatch -> pendingPatch.patchId().equals(patchId));
    }

    public void clear(String sessionId) {
        pendingPatches.remove(sessionId);
        loadedSessions.remove(sessionId);
        sessionStateStore.writePendingPatch(sessionId, null);
    }
}
