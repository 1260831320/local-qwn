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
- Frontend:
  - single-page browser workspace served from `src/main/resources/static`
  - three views with shared visual system:
    - welcome view
    - chat view
    - docs view
  - default entry is now the welcome view
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
  - repo-local wrapper: `${user.dir}/scripts/openvino/run_genai.py`

## Implemented Capabilities

### Chat Endpoint

- `POST /api/chat`
- body:

```json
{
  "message": "read pom.xml",
  "sessionId": "browser-session-id",
  "backend": "auto",
  "modelProfile": "auto"
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

### Runtime Options Endpoint

- `GET /api/runtime/options`
- returns:
  - current machine profile
  - configured primary backend
  - configured fallback backend
  - available backends
  - available model profiles
  - auto-routing defaults

### Docs Endpoint

- `GET /api/docs/{language}`
- currently supported:
  - `zh`
  - `en`
- reads directly from:
  - `README.md`
  - `README.en.md`
- response payload:
  - `language`
  - `title`
  - `content`

### Patch Apply Endpoint

- `POST /api/patch/apply`
- applies only the currently pending previewed patch for the same session
- must not accept arbitrary patch payloads outside the pending preview contract
- keeps the pending patch if apply fails so the user can retry after inspection

### Session Clear Endpoint

- `POST /api/session/{sessionId}/clear`

### Web UI

- `/`
- browser workspace served by Spring Boot static resources
- includes:
  - default welcome page with hero actions:
    - `开始聊天`
    - `展示文档`
  - top navigation between:
    - welcome
    - chat
    - docs
  - top health badge and health check action
  - new session action
  - chat workspace with:
    - local chat composer
    - health strip
    - runtime routing controls
    - suggested prompts
    - execution trace viewer
    - tools-used chips per request
    - patch preview panel with apply action
    - patch apply history
  - docs workspace with:
    - bilingual README viewer
    - language switch
    - generated heading outline
    - jump back into chat action
  - Chinese-first copy and labels
  - client-side markdown rendering for docs page

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
3. Refactor the browser UI code structure before the next large frontend pass:
   - split CSS by section/view instead of keeping all styles in one file
   - separate shared tokens/layout utilities from welcome/chat/docs-specific styles
   - simplify client-side page logic so view-specific behavior is easier to extend
   - it is acceptable to introduce a lightweight existing CSS package or utility layer if it reduces maintenance cost
4. Improve README rendering in the docs view:
   - make heading hierarchy visually stronger
   - improve indentation and readability for nested lists
   - keep code blocks, quotes, and section spacing more document-like
5. Add an explicit UI flow for create-file confirmation so `write_file` and patch confirmation feel consistent.
6. Improve prompt instructions so Qwen emits more stable action JSON and fewer invalid tool calls.
7. Add a project summary / code map tool for larger repositories.
8. Reduce `/api/health` latency by making backend probes lighter or cached.

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
- Current active task branch in progress:
  - `feature/request-backend-selection`
- The current OpenVINO path is validated only for local process execution through:
  - `${user.dir}/scripts/openvino/run_genai.py`
- OpenVINO prompt text is now sent over `stdin` instead of a raw command-line argument to avoid Windows encoding corruption on non-ASCII prompts.
- The current OpenVINO model is suitable for lightweight writing tasks, not a full replacement for the coding-oriented Ollama model.
- Request payloads can now optionally choose:
  - `backend`
  - `modelProfile`
- Selection priority is now:
  - explicit `modelProfile`
  - explicit `backend`
  - auto heuristic based on request type
- Request routing now attempts a configured alternate backend when the selected backend is unavailable.
- The current auto heuristic recognizes broader lightweight writing requests and ignores `don't use tools` / `不要调用工具` style phrases when classifying writing vs coding requests.
- Verified on `redmibook14` with `ollama` offline:
  - explicit `openvino-lite` requests succeed
  - auto lightweight writing requests resolve to `openvino-lite`
  - auto coding requests can fall back to `openvino-lite`
- The browser UI was recently reworked into a three-view SPA:
  - welcome view is the default entry
  - docs view loads README content through `/api/docs/{language}`
  - docs content is cached per language in the browser
  - chat view retains health, routing, trace, patch preview, and patch history
- `README.md` and `README.en.md` were both refreshed and are now intended to be the source of truth for the docs page.
- Validation completed after the latest docs/welcome-page work:
  - `node --check src/main/resources/static/app.js`
  - `./mvnw.cmd test`
  - headless Edge smoke screenshots for:
    - welcome view
    - chat view
    - docs view
- Browser-level QA was redone after the latest frontend pass; the remaining obvious frontend follow-up is no longer "do QA first", but "refactor frontend structure and improve docs rendering quality".
- Important user preference:
  - do not leave Spring Boot running on port `8080` after finishing work
  - if local runtime verification requires starting the app, stop it before handoff
- When a task is completed, refresh this file so completed items are removed and new workflow/project facts are recorded.

## Handoff Snapshot

- Recently completed:
  - real backend integration and fallback verification on `feature/request-backend-selection`
  - docs API backed by repository README files
  - bilingual `README.md` / `README.en.md` refresh
  - frontend rewrite into shared welcome/chat/docs experience
  - browser QA pass with runtime screenshots plus another round of welcome/chat/docs polish
- Key files touched in the latest frontend/docs pass:
  - `src/main/resources/static/index.html`
  - `src/main/resources/static/styles.css`
  - `src/main/resources/static/app.js`
  - `src/main/java/cn/zzy/qwen/controller/ChatController.java`
  - `src/main/java/cn/zzy/qwen/service/ProjectDocsService.java`
  - `src/main/java/cn/zzy/qwen/model/DocsResponse.java`
  - `src/test/java/cn/zzy/qwen/controller/ChatControllerTest.java`
  - `README.md`
  - `README.en.md`
- Current likely next step for a new conversation:
  - refactor the frontend code structure so shared CSS and view-specific CSS are easier to extend
  - improve README presentation quality in the docs view, especially heading hierarchy and nested list readability
  - then return to structured patch preview and session persistence

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

"Continue on `feature/request-backend-selection`. The immediate unfinished frontend tasks are: (1) refactor the SPA frontend structure, especially splitting shared CSS and view-specific CSS and simplifying page logic, optionally with a lightweight CSS package; (2) improve docs-view README rendering so title hierarchy, nested indentation, and overall document readability are stronger. Do not leave port 8080 occupied after verification. After those are done, return to structured patch preview and persisted session/pending-patch state."
