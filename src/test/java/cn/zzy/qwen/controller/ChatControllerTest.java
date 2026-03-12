package cn.zzy.qwen.controller;

import cn.zzy.qwen.model.ChatResponse;
import cn.zzy.qwen.model.HealthResponse;
import cn.zzy.qwen.model.PendingPatch;
import cn.zzy.qwen.model.PatchApplyResponse;
import cn.zzy.qwen.service.AgentService;
import cn.zzy.qwen.service.HealthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AgentService agentService;

    @MockBean
    private HealthService healthService;

    @Test
    void healthReturnsServicePayload() throws Exception {
        when(healthService.health()).thenReturn(new HealthResponse("healthy", "up", "ollama", "up", "disabled", "default", "ok"));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.spring").value("up"))
                .andExpect(jsonPath("$.backend").value("ollama"))
                .andExpect(jsonPath("$.ollama").value("up"))
                .andExpect(jsonPath("$.openvino").value("disabled"))
                .andExpect(jsonPath("$.machineProfile").value("default"));
    }

    @Test
    void chatReturnsAgentResponse() throws Exception {
        PendingPatch pendingPatch = new PendingPatch("p1", "a.txt", "old", "new", "preview");
        when(agentService.chat("s1", "hello")).thenReturn(
                new ChatResponse("hi", List.of("step"), List.of("read_file"), pendingPatch, "ollama")
        );

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"hello","sessionId":"s1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("hi"))
                .andExpect(jsonPath("$.backend").value("ollama"))
                .andExpect(jsonPath("$.toolsUsed[0]").value("read_file"))
                .andExpect(jsonPath("$.pendingPatch.patchId").value("p1"));
    }

    @Test
    void chatRejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":" ","sessionId":"s1"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void applyPatchReturnsServicePayload() throws Exception {
        when(agentService.applyPatch(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new PatchApplyResponse(true, "patched"));

        mockMvc.perform(post("/api/patch/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sessionId":"s1","patchId":"p1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("patched"));
    }

    @Test
    void clearSessionReturnsClearedStatus() throws Exception {
        mockMvc.perform(post("/api/session/demo/clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cleared"));

        verify(agentService).clearSession("demo");
    }
}
