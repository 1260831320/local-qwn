# local-qwn

`local-qwn` is a local Qwen agent project built with Java 17, Spring Boot 3, and Ollama.

The goal is not to expose an unrestricted autonomous agent. Instead, this project builds a controlled and auditable execution layer for local model-assisted development workflows.

It currently includes:

- chat APIs
- controlled file tools
- patch preview and confirmation
- health checks with UI status
- session memory and execution traces

## Features

- `POST /api/chat`
  - runs a bounded multi-step agent loop against a local Ollama model
- `GET /api/health`
  - checks both Spring Boot and Ollama reachability
- `POST /api/patch/apply`
  - applies only the pending previewed patch for the same session
- `POST /api/session/{sessionId}/clear`
  - clears session memory and pending patch state
- browser UI
  - chat panel, tool trace, health state, patch preview, and patch history

Registered tools:

- `list_files`
- `read_file`
- `read_many_files`
- `search_in_files`
- `write_file`
- `preview_patch_file`
- `patch_file`

## Safety Model

This project intentionally stays conservative.

- all file operations are restricted to the configured workspace root
- `patch_file` requires a matching `preview_patch_file` in the same chat turn
- `write_file` is create-only and refuses overwriting existing files
- read, search, and patch flows include file-size, traversal, and truncation guardrails
- raw shell execution is not enabled

## Architecture

High-level flow:

`Browser UI -> Spring Boot API -> Agent Loop -> Tool Registry -> Workspace / Ollama`

Main modules:

- `src/main/java/cn/zzy/qwen/controller`
  - REST entry points
- `src/main/java/cn/zzy/qwen/service`
  - agent orchestration, Ollama integration, health, memory, pending patch state
- `src/main/java/cn/zzy/qwen/tools`
  - controlled file tools and workspace boundary enforcement
- `src/main/resources/static`
  - frontend HTML, CSS, and JavaScript

## Requirements

- Java 17
- Ollama
- a local model such as:

```bash
ollama pull qwen2.5-coder:14b
```

## Configuration

Default configuration file:

- `src/main/resources/application.yml`

Important keys:

- `qwen.ollama.base-url`
- `qwen.ollama.model`
- `qwen.ollama.timeout-seconds`
- `qwen.tools.workspace-root`

If the project directory moves, update `workspace-root`.

## Run

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

After startup:

- UI: `http://localhost:8080`
- health endpoint: `http://localhost:8080/api/health`

## API Example

### Chat request

```bash
curl -X POST http://localhost:8080/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"read pom.xml\",\"sessionId\":\"demo\"}"
```

### Health check

```bash
curl http://localhost:8080/api/health
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

## Branch Strategy

This repository currently uses:

- `master`
  - stable release branch
- `develop`
  - active development and multi-terminal sync branch

Recommended workflow:

1. land new changes in `develop`
2. sync and validate across terminals on `develop`
3. merge into `master` after the work is stable

## Roadmap

- persist session history and pending patch state
- replace text-based patch preview payloads with structured diff data
- add a stronger project summary / code map capability
- consider whitelisted shell execution, RAG, and streaming later

## Contributing

Contributions are welcome.

When sending changes, prefer including:

- a short change summary
- API impact
- test results
- whether any safety boundary changed
