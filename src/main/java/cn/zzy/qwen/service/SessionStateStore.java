package cn.zzy.qwen.service;

import cn.zzy.qwen.config.SessionStoreProperties;
import cn.zzy.qwen.model.ConversationMessage;
import cn.zzy.qwen.model.PatchHistoryEntry;
import cn.zzy.qwen.model.PendingPatch;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class SessionStateStore {

    private static final Logger log = LoggerFactory.getLogger(SessionStateStore.class);

    private final ObjectMapper objectMapper;
    private final Path storeDir;

    public SessionStateStore(ObjectMapper objectMapper, SessionStoreProperties properties) {
        this.objectMapper = objectMapper;
        this.storeDir = Path.of(properties.storeDir());
    }

    public synchronized List<ConversationMessage> readMessages(String sessionId) {
        return new ArrayList<>(readState(sessionId).messages());
    }

    public synchronized void writeMessages(String sessionId, List<ConversationMessage> messages) {
        SessionState current = readState(sessionId);
        writeState(sessionId, current.withMessages(messages));
    }

    public synchronized Optional<PendingPatch> readPendingPatch(String sessionId) {
        return Optional.ofNullable(readState(sessionId).pendingPatch());
    }

    public synchronized void writePendingPatch(String sessionId, PendingPatch pendingPatch) {
        SessionState current = readState(sessionId);
        writeState(sessionId, current.withPendingPatch(pendingPatch));
    }

    public synchronized List<PatchHistoryEntry> readPatchHistory(String sessionId) {
        return new ArrayList<>(readState(sessionId).patchHistory());
    }

    public synchronized void writePatchHistory(String sessionId, List<PatchHistoryEntry> patchHistory) {
        SessionState current = readState(sessionId);
        writeState(sessionId, current.withPatchHistory(patchHistory));
    }

    private SessionState readState(String sessionId) {
        Path sessionFile = sessionFile(sessionId);
        if (!Files.exists(sessionFile)) {
            return SessionState.empty(sessionId);
        }

        try {
            SessionState state = objectMapper.readValue(sessionFile.toFile(), SessionState.class);
            return state == null ? SessionState.empty(sessionId) : state.normalized(sessionId);
        } catch (IOException exception) {
            log.warn("Failed to read local session state for '{}': {}", sessionId, exception.getMessage());
            return SessionState.empty(sessionId);
        }
    }

    private void writeState(String sessionId, SessionState state) {
        Path sessionFile = sessionFile(sessionId);
        SessionState normalized = state.normalized(sessionId);

        try {
            if (normalized.isEmpty()) {
                Files.deleteIfExists(sessionFile);
                return;
            }

            Files.createDirectories(storeDir);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(sessionFile.toFile(), normalized);
        } catch (IOException exception) {
            log.warn("Failed to persist local session state for '{}': {}", sessionId, exception.getMessage());
        }
    }

    private Path sessionFile(String sessionId) {
        return storeDir.resolve(sessionFileName(sessionId));
    }

    private String sessionFileName(String sessionId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(sessionId.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed) + ".json";
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private record SessionState(
            String sessionId,
            List<ConversationMessage> messages,
            PendingPatch pendingPatch,
            List<PatchHistoryEntry> patchHistory
    ) {
        private static SessionState empty(String sessionId) {
            return new SessionState(sessionId, List.of(), null, List.of());
        }

        private SessionState normalized(String fallbackSessionId) {
            return new SessionState(
                    fallbackSessionId,
                    messages == null ? List.of() : List.copyOf(messages),
                    pendingPatch,
                    patchHistory == null ? List.of() : List.copyOf(patchHistory)
            );
        }

        private SessionState withMessages(List<ConversationMessage> nextMessages) {
            return new SessionState(sessionId, nextMessages == null ? List.of() : List.copyOf(nextMessages), pendingPatch, patchHistory);
        }

        private SessionState withPendingPatch(PendingPatch nextPendingPatch) {
            return new SessionState(sessionId, messages, nextPendingPatch, patchHistory);
        }

        private SessionState withPatchHistory(List<PatchHistoryEntry> nextPatchHistory) {
            return new SessionState(sessionId, messages, pendingPatch, nextPatchHistory == null ? List.of() : List.copyOf(nextPatchHistory));
        }

        private boolean isEmpty() {
            return (messages == null || messages.isEmpty())
                    && pendingPatch == null
                    && (patchHistory == null || patchHistory.isEmpty());
        }
    }
}
