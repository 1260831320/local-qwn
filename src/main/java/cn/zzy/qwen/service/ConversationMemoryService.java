package cn.zzy.qwen.service;

import cn.zzy.qwen.model.ConversationMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConversationMemoryService {

    private static final int MAX_MESSAGES = 12;

    private final Map<String, List<ConversationMessage>> sessions = new ConcurrentHashMap<>();
    private final SessionStateStore sessionStateStore;

    public ConversationMemoryService(SessionStateStore sessionStateStore) {
        this.sessionStateStore = sessionStateStore;
    }

    public List<ConversationMessage> history(String sessionId) {
        return new ArrayList<>(sessions.computeIfAbsent(sessionId, sessionStateStore::readMessages));
    }

    public void append(String sessionId, String role, String content) {
        sessions.compute(sessionId, (key, current) -> {
            List<ConversationMessage> updated = current == null
                    ? sessionStateStore.readMessages(key)
                    : new ArrayList<>(current);
            updated.add(new ConversationMessage(role, content));
            if (updated.size() > MAX_MESSAGES) {
                updated = new ArrayList<>(updated.subList(updated.size() - MAX_MESSAGES, updated.size()));
            }
            sessionStateStore.writeMessages(key, updated);
            return updated;
        });
    }

    public void clear(String sessionId) {
        sessions.remove(sessionId);
        sessionStateStore.writeMessages(sessionId, List.of());
    }
}
