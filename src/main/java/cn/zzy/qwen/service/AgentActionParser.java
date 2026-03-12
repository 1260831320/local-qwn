package cn.zzy.qwen.service;

import cn.zzy.qwen.model.AgentAction;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Component
public class AgentActionParser {

    private final ObjectMapper actionMapper;

    public AgentActionParser(ObjectMapper objectMapper) {
        this.actionMapper = objectMapper.copy()
                .configure(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature(), true)
                .configure(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature(), true)
                .configure(JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES.mappedFeature(), true);
    }

    public AgentAction parse(String content) {
        if (content == null || content.isBlank()) {
            return null;
        }
        for (String candidate : extractCandidates(content)) {
            AgentAction action = tryParse(candidate);
            if (action != null) {
                return action;
            }
        }
        return null;
    }

    private AgentAction tryParse(String candidate) {
        try {
            return actionMapper.readValue(candidate, AgentAction.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    private List<String> extractCandidates(String content) {
        String trimmed = content.trim();
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        candidates.add(trimmed);
        candidates.add(stripCodeFence(trimmed));
        candidates.addAll(extractBalancedObjects(trimmed));
        return candidates.stream()
                .filter(candidate -> candidate != null && !candidate.isBlank())
                .toList();
    }

    private String stripCodeFence(String content) {
        if (!content.startsWith("```")) {
            return content;
        }
        int firstLineBreak = content.indexOf('\n');
        int lastFence = content.lastIndexOf("```");
        if (firstLineBreak < 0 || lastFence <= firstLineBreak) {
            return content;
        }
        return content.substring(firstLineBreak + 1, lastFence).trim();
    }

    private List<String> extractBalancedObjects(String content) {
        List<String> objects = new ArrayList<>();
        int depth = 0;
        int start = -1;
        boolean inString = false;
        boolean escaping = false;

        for (int i = 0; i < content.length(); i++) {
            char current = content.charAt(i);
            if (escaping) {
                escaping = false;
                continue;
            }
            if (current == '\\' && inString) {
                escaping = true;
                continue;
            }
            if (current == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (current == '{') {
                if (depth == 0) {
                    start = i;
                }
                depth++;
                continue;
            }
            if (current == '}' && depth > 0) {
                depth--;
                if (depth == 0 && start >= 0) {
                    objects.add(content.substring(start, i + 1));
                    start = -1;
                }
            }
        }
        return objects;
    }
}
