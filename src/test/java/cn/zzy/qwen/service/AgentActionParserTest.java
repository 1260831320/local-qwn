package cn.zzy.qwen.service;

import cn.zzy.qwen.model.AgentAction;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AgentActionParserTest {

    private final AgentActionParser parser = new AgentActionParser(new ObjectMapper());

    @Test
    void parsesJsonInsideMarkdownFence() {
        String content = """
                I will call a tool.
                ```json
                {"type":"tool","tool":"read_file","arguments":{"path":"pom.xml"}}
                ```
                """;

        AgentAction action = parser.parse(content);

        assertThat(action).isNotNull();
        assertThat(action.type()).isEqualTo("tool");
        assertThat(action.tool()).isEqualTo("read_file");
        assertThat(action.arguments()).containsEntry("path", "pom.xml");
    }

    @Test
    void parsesRelaxedJsonWithSingleQuotesAndTrailingComma() {
        String content = "{type:'answer', answer:'ok',}";

        AgentAction action = parser.parse(content);

        assertThat(action).isNotNull();
        assertThat(action.type()).isEqualTo("answer");
        assertThat(action.answer()).isEqualTo("ok");
    }

    @Test
    void returnsNullWhenNoJsonObjectExists() {
        assertThat(parser.parse("plain text only")).isNull();
    }
}
