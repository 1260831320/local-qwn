# local-qwn

`local-qwn` is a local Qwen agent project for controlled development workflows.

It is built on `Java 17 + Spring Boot 3` and provides guarded file tools, request-level backend routing, session context, and a patch confirmation flow. The goal is not to expose a fully unrestricted autonomous agent, but to build a practical, auditable local execution layer first.

## Current Capabilities

- Chat API: `POST /api/chat`
  - session-aware context
  - request-level backend selection
  - request-level model profile selection
- Runtime health API: `GET /api/health`
  - reports Spring Boot, Ollama, and OpenVINO reachability
  - reports the active machine profile and primary backend
- Runtime options API: `GET /api/runtime/options`
  - returns available backends, model profiles, and auto-routing hints
- Docs API: `GET /api/docs/{lang}`
  - reads the bilingual project README directly from the repository
- Patch apply API: `POST /api/patch/apply`
  - applies only a previously previewed patch for the same session
- Session reset API: `POST /api/session/{sessionId}/clear`
- Browser workspace
  - welcome page
  - chat page
  - docs page
  - tool traces, patch preview, patch history, and health panels

## Model Backends and Routing

The project currently supports:

- `ollama`
- `openvino`

Selection priority:

1. explicit `modelProfile`
2. explicit `backend`
3. automatic request classification

The current auto strategy is intentionally simple:

- coding, debugging, and tool-planning requests prefer the coding profile
- lightweight writing, organizing, and translation requests prefer the lightweight profile
- if the selected backend is unavailable, the app attempts a configured fallback backend

## Registered Tools

- `list_files`
- `read_file`
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## Safety Boundary

The current implementation stays conservative on purpose:

- all file operations are limited to the configured workspace root
- `write_file` is create-only and will not overwrite existing files
- `patch_file` requires a matching `preview_patch_file` in the same turn
- search, file reading, and patch preview are protected by truncation and path guardrails
- raw shell execution is not enabled

## Project Layout

- `src/main/java/cn/zzy/qwen/controller`
  - HTTP API entry points
- `src/main/java/cn/zzy/qwen/service`
  - agent orchestration, backend calls, health, session state, docs loading
- `src/main/java/cn/zzy/qwen/tools`
  - controlled tools and workspace boundary enforcement
- `src/main/resources/static`
  - frontend pages, styles, and browser interaction logic
- `src/main/resources/machines`
  - shared and machine-specific runtime configuration

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
- docs API: `http://localhost:8080/api/docs/en`

## Prerequisites

- Java 17
- at least one local backend ready to use
  - Ollama: recommended `qwen2.5-coder:14b`
  - OpenVINO: validated lightweight model plus Python entry script

Example:

```bash
ollama pull qwen2.5-coder:14b
```

## Configuration

The project uses shared config plus machine-profile overrides:

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

### English docs

```bash
curl http://localhost:8080/api/docs/en
```

## Test

### Windows

```powershell
.\mvnw.cmd test
```

### macOS / Linux

```bash
./mvnw test
```

## Branch Flow

Recommended collaboration model:

- `master`
  - stable release branch
- `develop`
  - daily integration branch
- `feature/<task>`
  - short-lived task branches

Suggested flow:

1. branch from `develop`
2. implement and validate in the feature branch
3. merge back into `develop`
4. promote stable work into `master`

## Near-Term Focus

- persist session history and pending patch state
- replace text-only patch preview payloads with structured diff data
- keep improving the unified welcome, docs, and chat experience
- continue refining request-level routing and cross-backend fallback behavior

