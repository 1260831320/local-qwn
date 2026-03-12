package cn.zzy.qwen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AgentAction(String type, String answer, String tool, Map<String, String> arguments) {
}
