package cn.zzy.qwen.controller;

import cn.zzy.qwen.model.ChatRequest;
import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.HealthResponse;
import cn.zzy.qwen.model.PatchApplyRequest;
import cn.zzy.qwen.model.PatchApplyResponse;
import cn.zzy.qwen.service.AgentService;
import cn.zzy.qwen.service.HealthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final AgentService agentService;
    private final HealthService healthService;

    public ChatController(AgentService agentService, HealthService healthService) {
        this.agentService = agentService;
        this.healthService = healthService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return healthService.health();
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return agentService.chat(request.sessionId(), request.message());
    }

    @PostMapping("/patch/apply")
    public PatchApplyResponse applyPatch(@Valid @RequestBody PatchApplyRequest request) {
        return agentService.applyPatch(request);
    }

    @PostMapping("/session/{sessionId}/clear")
    public Map<String, String> clearSession(@PathVariable String sessionId) {
        agentService.clearSession(sessionId);
        return Map.of("status", "cleared");
    }
}
