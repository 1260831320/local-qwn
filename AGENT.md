# Project AGENT

## Purpose

This project is the first controlled "limbs" layer for a local Qwen model.

The local model layer is now pluggable instead of Ollama-only.
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
  - `Ollama` backend
  - `OpenVINO` backend via local Python process execution
  - backend routing with optional fallback
- machine-specific config:
  - shared defaults in `src/main/resources/machines/common.yml`
  - default fallback profile in `src/main/resources/machines/default.yml`
  - tracked machine overrides in `src/main/resources/machines/<profile>.yml`
  - selection order:
    - `QWEN_MACHINE_PROFILE`
    - `qwen.machine.profile`
    - `COMPUTERNAME`
    - `HOSTNAME`
    - `default`
- current tracked machine profiles:
  - `default`
  - `redmibook14`
- default coding model:
  - `qwen2.5-coder:14b`
- current verified OpenVINO profile on `redmibook14`:
  - `qwen2.5-1.5b-instruct-int4-ov`
  - preferred device: `NPU`

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
  - active backend
  - backend reachability for `ollama` and `openvino`
  - active machine profile
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
The model backend is no longer hard-wired to `OllamaClient`; `AgentService` now routes generation through a backend abstraction.
`OpenVINO` integration currently uses a verified Python entrypoint rather than Java-native bindings.

The current memory model is in-memory only.
It is useful for a single running process but not persistent across restarts.

## Next Improvements

### High Priority

1. Persist conversation sessions and pending patch state across restarts.
2. Replace plain pending patch payloads with a structured preview model instead of parsing preview text on the frontend.
3. Add an explicit UI flow for create-file confirmation so `write_file` and patch confirmation feel consistent.
4. Improve prompt instructions so Qwen emits more stable action JSON and fewer invalid tool calls.
5. Add a project summary / code map tool for larger repositories.
6. Reduce `/api/health` latency by making backend probes lighter or cached.

### Medium Priority

1. Add safe command execution with explicit whitelists and confirmation rules.
2. Add RAG over local notes and project docs.
3. Add authentication if the app is exposed beyond localhost.
4. Add streaming responses in the frontend.
5. Refine request-level backend selection after another machine profile is validated.
6. Candidate policy for later:
   - code-heavy and tool-planning requests prefer `ollama`
   - lightweight writing / office tasks can prefer `openvino`
   - keep refining this after another machine profile is validated

### Later

1. Persist frontend session IDs and patch history across browser reloads.
2. Add project-level metrics and request telemetry.
3. Add export/import for session transcripts.
4. Add multi-workspace support.

## Operating Notes

- The root `application.yml` now keeps only shared app-level settings.
- Runtime backend and workspace settings are loaded from:
  - `src/main/resources/machines/common.yml`
  - `src/main/resources/machines/default.yml`
  - `src/main/resources/machines/<profile>.yml`
- Tool workspace root should normally resolve from `${user.dir}` unless a machine profile overrides it.
- Session memory currently lives only in process memory.
- Restarting the Spring Boot app clears all chat history.
- Daily development should land on `develop` first.
- `master` is treated as the stable/release branch.
- The current OpenVINO path is validated only for local process execution through:
  - `C:/Users/12608/openvino-ai/run_genai.py`
- The current OpenVINO model is suitable for lightweight writing tasks, not a full replacement for the coding-oriented Ollama model.
- Request payloads can now optionally choose:
  - `backend`
  - `modelProfile`
- Selection priority is now:
  - explicit `modelProfile`
  - explicit `backend`
  - auto heuristic based on request type
- When a task is completed, refresh this file so completed items are removed and new workflow/project facts are recorded.

## Branch Strategy

- Keep only `master` and `develop` as long-lived branches.
- Do not create long-lived branches per device.
- Create short-lived branches per task, for example `feature/request-backend-selection`.
- If the same task moves between multiple devices, keep using the same `feature/<task>` branch on both devices.
- If two devices work on different tasks at the same time, each task gets its own feature branch from `develop`.
- Merge finished feature branches back into `develop`, then promote stable integrated work from `develop` into `master`.

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

"Persist conversation state and pending patches across restarts, then replace the current text-based pending patch payload with a structured preview model. After another machine profile is validated, refine the current request-level backend routing and task-based model selection rules."
