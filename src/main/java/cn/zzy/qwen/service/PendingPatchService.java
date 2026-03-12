package cn.zzy.qwen.service;

import cn.zzy.qwen.model.PendingPatch;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingPatchService {

    private final Map<String, PendingPatch> pendingPatches = new ConcurrentHashMap<>();

    public void save(String sessionId, PendingPatch pendingPatch) {
        pendingPatches.put(sessionId, pendingPatch);
    }

    public Optional<PendingPatch> find(String sessionId) {
        return Optional.ofNullable(pendingPatches.get(sessionId));
    }

    public Optional<PendingPatch> find(String sessionId, String patchId) {
        return find(sessionId).filter(pendingPatch -> pendingPatch.patchId().equals(patchId));
    }

    public void clear(String sessionId) {
        pendingPatches.remove(sessionId);
    }
}
