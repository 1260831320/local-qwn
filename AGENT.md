# Project AGENT

## Purpose

This project is the first controlled "limbs" layer for a local Qwen model.

The local model remains in `Ollama`.
This Java project adds:

- a REST API
- a tool registry
- controlled file tools
- a foundation for future local agent behavior

## Current Architecture

- Runtime:
  - Java 17
  - Spring Boot 3
- Model backend:
  - local Ollama
  - expected endpoint: `http://127.0.0.1:11434`
- default model:
  - `qwen2.5-coder:14b`

## Implemented Capabilities

### Chat Endpoint

- `POST /api/chat`
- body:

```json
{
  "message": "read pom.xml",
  "sessionId": "browser-session-id"
}
```

### Health Endpoint

- `GET /api/health`
- should report both:
  - Spring Boot process health
  - Ollama backend reachability
- frontend should visualize:
  - checking
  - healthy
  - degraded
  - failed

### Patch Apply Endpoint

- `POST /api/patch/apply`
- applies only the currently pending previewed patch for the same session
- must not accept arbitrary patch payloads outside the pending preview contract
- keeps the pending patch if apply fails so the user can retry after inspection

### Session Clear Endpoint

- `POST /api/session/{sessionId}/clear`

### Web UI

- `/`
- browser chat panel served by Spring Boot static resources
- includes:
  - local chat composer
  - health check button
  - suggested prompts
  - execution trace viewer
  - tools-used chips per request
  - new session button
  - patch preview panel with apply action

### Registered Tools

- `list_files`
- `read_file`
- `write_file`
- `search_in_files`
- `read_many_files`
- `patch_file`
- `preview_patch_file`

All tools are restricted to the configured workspace root.
`patch_file` is intentionally more sensitive than the other tools and must remain constrained by explicit server-side rules.
`write_file` is now create-only for new files and refuses overwriting existing files.

### Conversation Memory

- session-aware chat requests
- frontend generates and keeps a `sessionId`
- backend stores recent conversation history in memory
- recent `user / assistant` messages are fed back into the planning prompt
- session can be cleared from the frontend

## Safety Boundary

Tool access is intentionally limited:

- all file operations are constrained to the workspace root
- path traversal outside the root is blocked
- model-driven file modification is allowed, but only under explicit server-side constraints
- preview and apply must stay consistent with the same patch payload and session
- no raw shell execution is implemented yet

This is deliberate.
Do not add unrestricted shell access before adding explicit allowlists and confirmation logic.

## Current Agent Loop

The project now uses a bounded multi-step loop:

1. send the user request plus tool descriptions to the model
2. expect one JSON action:
   - answer
   - tool
3. execute the tool if requested
4. append the tool result to the transcript
5. repeat up to a fixed tool budget
6. produce a final answer if the budget is exhausted

This is still intentionally conservative and should remain bounded.

Prompt construction and tool trace formatting are now separated from `AgentService` to keep the orchestration layer slimmer.
Action parsing now uses a tolerant JSON parser that can recover from fenced or slightly malformed model output.
Read and search tools now enforce file-size, line-count, and output truncation guardrails.

The current memory model is in-memory only.
It is useful for a single running process but not persistent across restarts.

## Next Improvements

### High Priority

1. Persist conversation sessions and pending patch state across restarts.
2. Replace plain pending patch payloads with a structured preview model instead of parsing preview text on the frontend.
3. Add an explicit UI flow for create-file confirmation so `write_file` and patch confirmation feel consistent.
4. Improve prompt instructions so Qwen emits more stable action JSON and fewer invalid tool calls.
5. Add a project summary / code map tool for larger repositories.

### Medium Priority

1. Add safe command execution with explicit whitelists and confirmation rules.
2. Add RAG over local notes and project docs.
3. Add authentication if the app is exposed beyond localhost.
4. Add streaming responses in the frontend.

### Later

1. Persist frontend session IDs and patch history across browser reloads.
2. Add project-level metrics and request telemetry.
3. Add export/import for session transcripts.
4. Add multi-workspace support.

## Operating Notes

- Tool workspace root is configured in:
  - `src/main/resources/application.yml`
- If the project folder moves, update:
  - `qwen.tools.workspace-root`
- Session memory currently lives only in process memory.
- Restarting the Spring Boot app clears all chat history.
- Daily development should land on `develop` first.
- `master` is treated as the stable/release branch.
- When a task is completed, refresh this file so completed items are removed and new workflow/project facts are recorded.

## How To Run

Windows:

```bash
mvnw.cmd spring-boot:run
```

macOS / Linux:

```bash
./mvnw spring-boot:run
```

Then test:

```bash
curl http://localhost:8080/api/health
```

```bash
curl -X POST http://localhost:8080/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"list files in the project root\",\"sessionId\":\"demo\"}"
```

Then open:

```text
http://localhost:8080
```

Example multi-turn flow to verify memory:

1. ask: `看看我的项目哪里需要改进`
2. ask: `中文回答`
3. ask: `继续展开第二点`

If memory is working, the assistant should keep context across those turns.

## Resume Instruction

When continuing work on this project, the next best step is:

"Persist conversation state and pending patches across restarts, then replace the current text-based pending patch payload with a structured preview model so the frontend no longer parses preview text."
