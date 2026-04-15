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

Current release target:

- `v1.0.5`

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
- top sticky navigation + collapsible left-side support area + right-side main content
- three primary views:
  - `welcome`
  - `chat`
  - `docs`
- core-first page layout:
  - keep the primary task area above secondary status / configuration content
- user-facing docs tone:
  - `README.md` and `README.en.md` should read as current-version guides in the docs view
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

## Frontend Copy Rules

- user-visible frontend copy must prefer user-facing language over developer-facing wording
- avoid exposing API names, file paths, internal architecture labels, or debugging jargon in normal UI copy unless the task explicitly requires it
- when `README.md` / `README.en.md` are updated for the docs view, treat them as end-user-facing manuals first

## Versioning Rules

Use a stable three-part version scheme:

- format:
  - `MAJOR.MINOR.PATCH`
- git tag format:
  - `vMAJOR.MINOR.PATCH`
- current example:
  - `v1.0.5`

Meaning of each number:

- `MAJOR`
  - increase when there is a breaking release boundary
  - use this for incompatible API / DTO / config changes, major workflow rewrites, large architectural resets, or a clearly new product phase
  - examples:
    - `1.2.4 -> 2.0.0`
    - docs payload changes in a non-backward-compatible way
    - patch / session / runtime contract changes that require coordinated upgrade
- `MINOR`
  - increase when there is a backward-compatible but meaningful new capability
  - use this for new user-facing modules, new pages, new endpoints, new local model/backend capability, major UX additions, or a release that noticeably expands what users can do
  - examples:
    - `1.0.5 -> 1.1.0`
    - add a new browser workspace area
    - add a new supported local engine path without breaking existing flows
- `PATCH`
  - increase for backward-compatible fixes and polish
  - use this for bug fixes, copy cleanup, layout tuning, visual refinements, safe docs updates, regression fixes, tests, and small compatibility-safe adjustments
  - examples:
    - `1.0.5 -> 1.0.6`
    - fix docs title encoding
    - tighten chat layout or remove developer-facing wording

Decision rule:

- if one release contains multiple change types, use the highest-impact bump
- do not bump `MINOR` or `MAJOR` only because files changed a lot; bump based on user-visible scope and compatibility impact
- docs-only or AGENTS-only updates usually stay in `PATCH`
- frontend + backend coordinated work can still be `PATCH` if it only fixes or refines an existing flow without expanding scope

Recommended release classification for this repository:

- `PATCH`
  - UI copy cleanup
  - layout optimization
  - health / runtime display fixes
  - docs rendering fixes
  - safe test additions
  - README / AGENTS synchronization
- `MINOR`
  - a new core workflow in `welcome / chat / docs`
  - a new endpoint or tool capability exposed to users
  - a new local inference path or clearly expanded supported machine/runtime capability
  - a new reserved area becoming actually usable
- `MAJOR`
  - breaking contract changes across frontend/backend
  - a release baseline reset
  - a substantial product-direction shift that changes the main usage model

Push-time rule:

- before a release commit, tag, or push, Codex should give a suggested next version number unless the user already specified one
- the suggestion should include one short reason tied to these rules
- once the version is chosen, keep it consistent across:
  - `pom.xml`
  - `README.md`
  - `README.en.md`
  - `AGENTS.md` current release target when needed
  - static asset version stamps when used
  - git tag

Suggestion examples:

- current `v1.0.5`, layout/copy fix only:
  - suggest `v1.0.6`
- current `v1.0.5`, add a new usable docs interaction:
  - suggest `v1.1.0`
- current `v1.0.5`, break existing runtime-options payload:
  - suggest `v2.0.0`

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
