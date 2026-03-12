package cn.zzy.qwen.service;

import cn.zzy.qwen.model.ConversationMessage;
import cn.zzy.qwen.tools.ToolRegistry;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AgentPromptFactory {

    public String buildPlanningPrompt(
            String userMessage,
            String transcript,
            ToolRegistry toolRegistry,
            List<ConversationMessage> history
    ) {
        return """
                You are a local coding assistant with controlled tools for a Java project.
                You must decide the next best action.

                Available tools:
                %s

                Rules:
                1. If you already have enough information, return JSON:
                   {"type":"answer","answer":"..."}
                2. If you need a tool, return JSON:
                   {"type":"tool","tool":"tool_name","arguments":{"key":"value"}}
                3. Return only one JSON object.
                4. Do not wrap JSON in markdown.
                5. Prefer the minimum number of tool calls.
                6. You must call preview_patch_file before patch_file for the same patch in the same turn.
                7. If a patch preview was created, either answer with the preview summary or call patch_file with the exact same arguments.
                8. When you answer the user, prefer Chinese unless the user explicitly asks for another language.

                User request:
                %s

                Conversation history:
                %s

                Previous work:
                %s
                """.formatted(
                toolRegistry.describeTools(),
                userMessage,
                formatHistory(history),
                transcript.isBlank() ? "(none)" : transcript
        );
    }

    public String buildFallbackPrompt(String userMessage, String transcript) {
        return """
                You are a local coding assistant.
                The tool budget has been exhausted.
                Answer in Chinese unless the user explicitly requests another language.

                User request:
                %s

                Work log:
                %s

                Give the best final answer you can based on the available tool results.
                """.formatted(userMessage, transcript);
    }

    private String formatHistory(List<ConversationMessage> history) {
        if (history == null || history.isEmpty()) {
            return "(none)";
        }
        return history.stream()
                .map(message -> message.role() + ": " + message.content())
                .reduce((left, right) -> left + System.lineSeparator() + right)
                .orElse("(none)");
    }
}
