# AGENTS

This file applies to `src/test/java/cn/zzy/qwen/**`.

## Test Mission

Tests in this subtree protect backend contracts, integration-facing behavior, and safety boundaries.

## Test Rules

- when controller payloads change, update controller tests
- when service routing or orchestration changes, update service tests
- when safety behavior changes, add or update targeted tests
- prefer focused contract coverage over broad snapshot-style assertions

## Full-Stack Integration Expectations

If a task changes frontend-visible backend behavior:

- do not stop at production code changes
- update the relevant tests in the same task
- keep test names and assertions readable enough for frontend and backend contributors to understand the contract

## Verification

- `.\mvnw.cmd test`
