# AGENTS

This file applies to `src/main/resources/static/**`.

## Frontend Mission

The frontend is the browser workspace for `Hongzhi`.
It should remain:

- Chinese-first
- local-first
- honest about implemented vs reserved capabilities
- structurally ready for future multimodal expansion
- tightly aligned with real backend contracts

Current visual direction:

- blue-white report-style workspace
- unified design language across `welcome / chat / docs`
- strong information hierarchy over decorative effects
- core-first layout that keeps the main task area above support cards

## Current Frontend Architecture

Entry files:

- `index.html`
- `app.js`

Core runtime:

- local vendor Vue runtime in `vendor/vue.global.prod.js`
- shared utilities in `scripts/core.js`
- README rendering in `scripts/markdown.js`
- app state and view logic in `scripts/vue/workspace-app.js`

Styles:

- shared imports in `styles.css`
- theme and layout in `styles/base.css`
- view styles in:
  - `styles/welcome.css`
  - `styles/chat.css`
  - `styles/docs.css`

## Frontend Rules

- preserve the same-source docs flow:
  - docs content comes from backend `GET /api/docs/{language}`
  - repository `README.md` and `README.en.md` remain the content source of truth
- preserve local-first workspace continuity:
  - keep browser-side workspace state restore local-only
  - reconnect recent conversation, pending patch, and structured patch history through backend `GET /api/session/{sessionId}` instead of hardcoded frontend snapshots
  - assume the same payload can now survive a local backend restart, so do not add duplicate browser-only shadow snapshots for core session content
  - keep patch review and recent change recall usable without leaving the workspace
- user-visible UI copy must stay user-facing:
  - avoid API names, file paths, internal architecture labels, and debugging jargon in normal page copy
  - treat `README.md` / `README.en.md` as current-version guides for end users first
- do not reintroduce a monolithic imperative SPA
- keep the left navigation, report-style sections, and unified card system coherent
- keep reading progress, outline navigation, and chapter summaries smooth and stable
- do not fake voice, camera, avatar, or emotion-analysis capabilities
- do not introduce cloud-only frontend dependencies
- prefer minimal local dependencies and static assets that work offline

## Full-Stack Integration Expectations

When frontend work depends on backend behavior:

- inspect the real controller / DTO / service flow before changing assumptions
- if the payload is wrong, fix the contract instead of hardcoding fragile UI workarounds
- if a backend change is required and the task is full-stack, make the minimal backend fix in the same task
- if the task is explicitly frontend-only, document the smallest backend request needed

## Frontend Verification

After meaningful frontend changes, run:

- `node --check src/main/resources/static/app.js`
- `node --check src/main/resources/static/scripts/core.js`
- `node --check src/main/resources/static/scripts/markdown.js`
- `node --check src/main/resources/static/scripts/vue/workspace-app.js`

If runtime behavior changes and practical verification is possible, also check:

- docs page rendering
- chat flow
- health display
- runtime option display
- patch preview / apply flow

## Frontend Handoff Notes

When handing work to another thread:

- list the exact frontend files changed
- list the backend payloads relied on
- call out any missing contract fields still blocking UI completion
