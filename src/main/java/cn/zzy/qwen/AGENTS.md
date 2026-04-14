# AGENTS

This file applies to `src/main/java/cn/zzy/qwen/**`.

## Backend Mission

The backend is the contract and runtime core behind the `Hongzhi` browser workspace.
It should remain:

- local-first
- safety-bounded
- predictable for frontend integration
- explicit in routing, tool use, and file mutation behavior

## Backend Responsibilities

Primary responsibilities in this subtree:

- controller contracts
- DTOs and response payloads
- agent orchestration
- model selection and backend routing
- health reporting
- docs loading
- patch preview / patch apply safety
- session state and persistence evolution

## Backend Rules

- preserve existing safety boundaries around workspace file operations
- keep payload shapes explicit and easy for frontend consumption
- avoid hidden behavior changes in controller responses
- keep route selection, fallback, and failure reasons inspectable
- prefer additive or backward-compatible changes where practical
- do not weaken patch trust boundaries for convenience

## Full-Stack Integration Expectations

This repository is now developed in front-back integration mode.

When backend work affects the browser workspace:

- update controllers, DTOs, and tests together
- inspect the frontend adapter assumptions in `src/main/resources/static/**`
- make the minimal frontend wiring adjustment in the same task if that is required to finish integration cleanly
- avoid cosmetic frontend rewrites from backend tasks unless necessary for validation

Important shared surfaces:

- `POST /api/chat`
- `GET /api/health`
- `GET /api/runtime/options`
- `GET /api/docs/{language}`
- `POST /api/patch/apply`
- `POST /api/session/{sessionId}/clear`

## Backend Verification

After meaningful backend changes, run:

- `.\mvnw.cmd test`

If runtime behavior changed and practical verification is possible, also check:

- `GET /api/health`
- affected endpoint payloads
- the corresponding frontend flow if the task was integration-facing

## Backend Handoff Notes

When handing work to another thread:

- list exact controller / DTO / service files changed
- summarize the contract impact
- mention whether frontend assumptions were updated
- mention any follow-up migration or persistence work still pending
