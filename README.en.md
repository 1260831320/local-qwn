# Hongzhi v1.0.0

`Hongzhi` is currently a local-first emotional companionship robot prototype.

It is not yet a full A22 multimodal digital human system. The current phase is focused on proving the following foundations first:

- stable local deployment and local inference
- bounded tool execution and guarded file mutation
- a usable browser workspace on ordinary hardware
- backend routing between `Ollama` and `OpenVINO`

Its long-term direction aligns with the A22 track of the 17th China College Student Service Outsourcing and Innovation Competition and will gradually evolve toward an emotional companionship virtual digital human system.

## Current Release

- version: `v1.0.0`
- description: `Emotional companionship robot prototype`
- stage: local capability validation + frontend structure consolidation

This release emphasizes:

- Chinese-first product expression
- local-first operation
- explicit safety boundaries
- README-as-source-of-truth documentation

## Current Product Surface

### Browser Workspace

The frontend is still served by `Spring Boot`, with a locally vendored `Vue 3` SPA under `src/main/resources/static`.

The current workspace contains three primary views:

- Overview
  - a blue-and-white report-style page for project positioning, workflow, constraints, backend comparison, and run guidance
- Workspace
  - chat, runtime selection, health status, trace display, patch preview, and patch confirmation
- Manual
  - direct rendering of `README.md / README.en.md`
  - heading navigation, reading progress, and chapter summary cards

### Backend APIs

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
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## Current Frontend Layout

```text
src/main/resources/static
├─ index.html
├─ styles.css
├─ app.js
├─ vendor/
│  └─ vue.global.prod.js
├─ scripts/
│  ├─ core.js
│  ├─ markdown.js
│  └─ vue/
│     └─ workspace-app.js
└─ styles/
   ├─ base.css
   ├─ welcome.css
   ├─ chat.css
   └─ docs.css
```

Notes:

- `core.js`
  - shared frontend utilities, request helpers, labels, and docs-language helpers
- `markdown.js`
  - README rendering, heading extraction, and reading-time estimation
- `workspace-app.js`
  - Vue application state, view switching, API orchestration, and scroll-linked UI state
- `styles/*.css`
  - shared theme layer plus per-view styling

## Model Backends and Routing

The project currently supports:

- `ollama`
- `openvino`

Selection priority:

1. explicit `modelProfile`
2. explicit `backend`
3. backend-side automatic routing

Current practical positioning:

- `Ollama`
  - better suited for code understanding, patching, and heavier tool-oriented tasks
- `OpenVINO`
  - better suited for lightweight local inference validation and lower-cost deployment experiments

Important limitation:

- the current `OpenVINO` path is verified and useful
- but it is still not a drop-in coding-task replacement for `Ollama`

## Safety Boundary

The repository intentionally stays conservative:

- file operations stay inside the configured workspace root
- path traversal is blocked
- `write_file` is create-only and does not overwrite existing files
- `patch_file` requires a matching preview in the same session flow
- raw shell execution is not exposed to the model

Do not weaken these boundaries for demo value.

## Runtime Requirements

- `Java 17`
- `Spring Boot 3`
- at least one local backend available
  - `Ollama`
  - or the local `OpenVINO` Python inference path

Currently validated OpenVINO details:

- wrapper: `${user.dir}/scripts/openvino/run_genai.py`
- validated machine profile: `redmibook14`
- validated model: `qwen2.5-1.5b-instruct-int4-ov`
- preferred device: `NPU`

## Quick Start

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

After startup:

- workspace UI: `http://localhost:8080`
- health API: `http://localhost:8080/api/health`
- Chinese manual: `http://localhost:8080/api/docs/zh`
- English manual: `http://localhost:8080/api/docs/en`

## Common Validation

### Frontend syntax checks

```powershell
node --check src/main/resources/static/app.js
node --check src/main/resources/static/scripts/core.js
node --check src/main/resources/static/scripts/markdown.js
node --check src/main/resources/static/scripts/vue/workspace-app.js
```

### Backend regression

```powershell
.\mvnw.cmd test
```

## Common API Examples

### Chat request

```bash
curl -X POST http://localhost:8080/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"read pom.xml\",\"sessionId\":\"demo\",\"backend\":\"auto\",\"modelProfile\":\"auto\"}"
```

### Runtime options

```bash
curl http://localhost:8080/api/runtime/options
```

### English manual

```bash
curl http://localhost:8080/api/docs/en
```

## Configuration Files

Shared and machine-specific overrides:

- `src/main/resources/application.yml`
- `src/main/resources/machines/common.yml`
- `src/main/resources/machines/default.yml`
- `src/main/resources/machines/<profile>.yml`

Common keys:

- `qwen.backend.type`
- `qwen.backend.fallback-type`
- `qwen.ollama.base-url`
- `qwen.ollama.model`
- `qwen.openvino.python-exe`
- `qwen.openvino.script-path`
- `qwen.openvino.model-dir`
- `qwen.tools.workspace-root`

## Capabilities Intentionally Reserved But Not Implemented Yet

The frontend already reserves space for these, but the current release does not fake them:

- voice-mode entry
- microphone / camera status
- digital human status area
- structured emotion-understanding / intervention output

## Near-Term Direction

- persist session history and pending patch state
- move patch preview toward structured payloads
- define cleaner contracts for `ASR / TTS / avatar / emotion-state`
- keep improving the integration of local inference, manual reading, and browser workspace workflows

## Branch Model

Recommended branch flow:

- `master`
  - stable release branch
- `develop`
  - daily integration branch
- `feature/<task>`
  - short-lived task branches

The repository is still a single-repo collaboration environment. Prefer short-lived branches from a shared base over long-lived device-specific branches.
