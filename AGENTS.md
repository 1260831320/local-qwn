# AGENTS

This file applies to the entire repository.

## Mission

This repository is a local-first large-model application prototype that is now explicitly evolving toward the `Hongzhi` product direction.

Current near-term purpose:

- verify local deployment and local inference of large models
- verify controlled tool execution and bounded agent behavior
- verify a usable browser workspace on ordinary hardware
- verify backend routing between `Ollama` and `OpenVINO`

Long-term direction:

- codename: `Hongzhi`
- competition target: A22 of the 17th China College Student Service Outsourcing and Innovation Competition
- product direction: an emotional companionship virtual digital human and robot system

Do not claim that the repository already satisfies the full A22 scope.
Treat A22 as the architectural destination, not the current delivery state.

## Strategic Constraints

These constraints should stay in force unless the user explicitly changes them:

- local deployment first
- privacy-friendly design
- minimize cloud dependence
- ordinary-PC feasibility
- explicit fallback behavior when a backend is unavailable
- explicit safety boundaries around file mutation and tool execution

Do not introduce cloud-only dependencies, paid API lock-in, or unrestricted shell access without explicit approval.

## Current Repository State

### Runtime

- `Java 17`
- `Spring Boot 3`

### Current frontend

The frontend is still served from `src/main/resources/static`, but it is no longer a single monolithic vanilla script.

Current frontend architecture:

- entry:
  - `src/main/resources/static/index.html`
  - `src/main/resources/static/app.js`
- local vendor runtime:
  - `src/main/resources/static/vendor/vue.global.prod.js`
- shared scripts:
  - `src/main/resources/static/scripts/core.js`
  - `src/main/resources/static/scripts/markdown.js`
- Vue workspace app:
  - `src/main/resources/static/scripts/vue/workspace-app.js`
- styles:
  - `src/main/resources/static/styles.css`
  - `src/main/resources/static/styles/base.css`
  - `src/main/resources/static/styles/welcome.css`
  - `src/main/resources/static/styles/chat.css`
  - `src/main/resources/static/styles/docs.css`

Current UX shape:

- a Vue-based SPA
- left-side navigation + right-side report-style content area
- three primary views:
  - `welcome`
  - `chat`
  - `docs`
- docs view features:
  - README same-source rendering
  - heading anchors
  - outline navigation
  - chapter summary cards
  - top reading progress bar

### Current backend

- backend code lives in `src/main/java/cn/zzy/qwen`
- test code lives in `src/test/java/cn/zzy/qwen`
- machine and runtime config lives in:
  - `src/main/resources/application.yml`
  - `src/main/resources/machines/common.yml`
  - `src/main/resources/machines/default.yml`
  - `src/main/resources/machines/<profile>.yml`

### Model backends

- `Ollama`
- `OpenVINO` through local Python process execution

Current verified OpenVINO path:

- wrapper: `${user.dir}/scripts/openvino/run_genai.py`
- validated machine profile: `redmibook14`
- validated model: `qwen2.5-1.5b-instruct-int4-ov`
- preferred validated device: `NPU`

Important limitation:

- the current OpenVINO path is good for lightweight writing and assistant tasks
- it is not yet a drop-in replacement for the coding-oriented Ollama path

## Existing Product Surface

Current HTTP endpoints:

- `POST /api/chat`
- `GET /api/health`
- `GET /api/runtime/options`
- `GET /api/docs/{language}`
- `POST /api/patch/apply`
- `POST /api/session/{sessionId}/clear`

Current registered tools:

- `list_files`
- `read_file`
- `write_file`
- `search_in_files`
- `read_many_files`
- `patch_file`
- `preview_patch_file`

Safety rules already in force:

- all file operations stay inside the configured workspace root
- path traversal outside the root is blocked
- `write_file` is create-only and must not overwrite existing files
- patch preview and patch apply must stay session-consistent
- raw unrestricted shell execution is intentionally not implemented

Do not weaken these boundaries while refactoring.

## Frontend and Backend Split Guidance

The project is still a monorepo, but ownership boundaries remain strict.

### Frontend thread ownership

The frontend thread owns:

- `src/main/resources/static/**`
- browser interaction flow
- information architecture
- visual design and report-style presentation
- docs-view rendering quality
- frontend-side runtime controls
- frontend API adapters and response handling

The frontend thread may propose backend contract changes, but it must not silently rewrite backend business logic.

### Backend thread ownership

The backend thread owns:

- `src/main/java/**`
- `src/test/java/**`
- `src/main/resources/application.yml`
- `src/main/resources/machines/**`
- `scripts/openvino/**`
- API contracts
- persistence
- backend routing
- safety policy
- model integration

The backend thread should avoid cosmetic frontend rewrites except for minimal contract plumbing that is impossible to avoid.

### Shared contract surface

Changes affecting both threads must remain contract-first:

- request / response DTOs
- controller endpoint shape
- health payload
- runtime-options payload
- patch-preview payload
- docs payload

If a backend contract changes:

- update DTOs and backend tests first
- document the contract in code or a short repo doc
- keep the payload stable enough for frontend consumption

If a frontend need requires a backend change:

- request the smallest contract change that solves the problem
- avoid broad backend rewrites for presentation-only needs

## Current Engineering Priorities

### Immediate frontend priorities

1. Keep the Vue SPA structure maintainable.
2. Preserve a unified blue-white report-style visual language across `welcome / chat / docs`.
3. Keep README rendering and reading progress smooth and robust.
4. Continue reserving honest multimodal slots without faking unavailable capabilities.
5. Preserve Chinese-first product expression unless there is a strong reason not to.

### Immediate backend priorities

1. Persist conversation sessions and pending patch state across restarts.
2. Replace text-only pending patch parsing with a structured patch preview payload.
3. Add explicit create-file confirmation flow aligned with patch trust boundaries.
4. Improve prompt robustness so model action JSON is more stable.
5. Add a project summary or code-map tool.
6. Reduce `/api/health` latency where possible.

### A22-oriented architectural priorities

All new work should preserve room for:

1. clean interfaces for future `ASR`, `TTS`, avatar driving, and emotion-state modules
2. local-inference assumptions for future multimodal components
3. a psychology knowledge base and future intervention loop:
   - perception
   - cognition
   - intervention
   - re-evaluation
4. avoiding a pure text-chatbot architecture lock-in
5. extensible APIs and session-state models for future multimodal data

## Working Rules

- daily integration should ultimately land on `develop`
- `master` is the stable or release branch
- use short-lived feature branches for task work
- do not create long-lived device-specific branches
- do not leave Spring Boot running on port `8080` after verification
- if local runtime verification starts the app, stop it before handoff
- `README.md` and `README.en.md` remain the docs-view content source of truth
- session memory is currently in-memory only unless code explicitly changes that
- when major task facts change, update `AGENTS.md`

Note:

- `AGENTS.md` is the current instruction source of truth for future threads
- the legacy `AGENT.md` filename should not be reintroduced

## Verification Expectations

Minimum checks after meaningful changes:

- frontend syntax checks:
  - `node --check src/main/resources/static/app.js`
  - `node --check src/main/resources/static/scripts/core.js`
  - `node --check src/main/resources/static/scripts/markdown.js`
  - `node --check src/main/resources/static/scripts/vue/workspace-app.js`
- backend regression check on Windows:
  - `.\mvnw.cmd test`

When a task affects runtime behavior, also verify the running app if practical:

- `GET /api/health`
- the relevant UI flow
- the relevant API contract

## Resume Guidance

If a new thread continues from this repository after `v1.0.0`, the best near-term sequence is:

1. keep the current local-model validation path working
2. keep frontend and backend separation boundaries clean
3. continue stabilizing the Vue workspace and README-driven docs experience
4. return to backend session persistence and structured patch preview
5. keep shaping the system so it can later grow into the `Hongzhi` A22 emotional companionship product
