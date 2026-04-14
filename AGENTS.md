# AGENTS

This file applies to the entire repository.

## Mission

This repository is a local-first large-model application prototype that is evolving toward the `Hongzhi` product direction.

Near-term purpose:

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

## Current Collaboration Mode

The repository is no longer treated as a strictly split frontend-only vs backend-only workflow.

Default development mode is now:

- full-stack integration first
- contract-first when frontend and backend interact
- scoped changes instead of broad refactors
- keep visual, backend, DTO, and runtime changes aligned in the same task when needed

What this means in practice:

- a single task may touch frontend, backend, and tests together if that is the smallest correct way to finish the integration work
- do not preserve an artificial split if it slows down real front-back debugging
- still avoid unrelated rewrites; keep each task coherent and reviewable

## Nested AGENTS

Use these more specific instruction files when working in their subtrees:

- frontend:
  - `src/main/resources/static/AGENTS.md`
- backend main code:
  - `src/main/java/cn/zzy/qwen/AGENTS.md`
- backend tests:
  - `src/test/java/cn/zzy/qwen/AGENTS.md`

Root rules still apply unless a nested file narrows them.

## Strategic Constraints

These constraints stay in force unless the user explicitly changes them:

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

The frontend is served from `src/main/resources/static`.

Current architecture:

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
- tests live in `src/test/java/cn/zzy/qwen`
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

- the current OpenVINO path is useful for lightweight writing and assistant tasks
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

## Integration Rules

When a task crosses the frontend-backend boundary:

- change the smallest contract surface that solves the problem
- keep request / response DTOs explicit
- update tests when controller or service behavior changes
- keep frontend adapters aligned with real backend payloads
- avoid fake UI states for unavailable backend capabilities

Shared contract surfaces include:

- request / response DTOs
- controller endpoint shapes
- health payload
- runtime-options payload
- patch-preview / patch-apply payload
- docs payload

If a contract changes:

- update Java code and tests together
- update frontend assumptions in the same task when necessary
- reflect important new facts in `README.md`, `README.en.md`, or `AGENTS.md`

## Working Rules

- `develop` is the default integration base for new work
- `master` is the stable or release branch
- start new task work from `develop`
- create short-lived feature branches when needed for isolation or review
- do not create long-lived device-specific branches
- do not leave Spring Boot running on port `8080` after verification
- if local runtime verification starts the app, stop it before handoff
- `README.md` and `README.en.md` remain the docs-view content source of truth
- session memory is currently in-memory only unless code explicitly changes that
- when major task facts change, update the relevant `AGENTS.md`

## Verification Expectations

Minimum checks after meaningful changes:

- frontend syntax:
  - `node --check src/main/resources/static/app.js`
  - `node --check src/main/resources/static/scripts/core.js`
  - `node --check src/main/resources/static/scripts/markdown.js`
  - `node --check src/main/resources/static/scripts/vue/workspace-app.js`
- backend regression:
  - `.\mvnw.cmd test`

When a task affects runtime behavior, also verify if practical:

- `GET /api/health`
- relevant UI flow
- relevant API contract

## Resume Guidance

If a new Codex thread starts from this repository now, the best sequence is:

1. read root `AGENTS.md`
2. read the nested `AGENTS.md` for the subtree you will touch first
3. start from `develop`
4. inspect current runtime, frontend state, and active contracts before editing
5. treat the next tasks as integrated front-back work, not artificial split work
