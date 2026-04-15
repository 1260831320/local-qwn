# Hongzhi v1.0.5

Hongzhi is a local-first intelligent workspace.

This release focuses on four things:

- a Chinese-first workspace for reading, chatting, and status checking
- practical local use on ordinary PCs
- preview-first, confirm-before-apply changes
- clear messaging about what is available now and what is still reserved

## What You Can Do

- read the current guide and jump between sections quickly
- ask questions in the workspace and review the response flow
- switch the response engine and response mode when needed
- review pending changes before applying them

## Three Main Views

### Overview

- see what the current release can do
- follow a simple recommended usage flow
- compare the available response modes

### Workspace

- keep the conversation at the top
- view service status and preferences on the same page
- preview changes before applying them

### Manual

- read in Chinese or English
- use chapter summaries, navigation, and reading progress
- jump back to the workspace with a question at any time

## How To Start

1. Start the app.

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS / Linux:

```bash
./mvnw spring-boot:run
```

2. Open `http://localhost:8080` in your browser
3. Start from Overview or Manual, then move to Workspace
4. Review any change preview before applying it

## Current Release

- version: `v1.0.5`
- product form: local-first intelligent workspace
- focus: core-first layout, user-facing copy, bilingual manual reading

## Local Experience Principles

- local-first operation
- privacy-friendly design
- clear visible status
- preview-first change confirmation

## Available Engines

This release currently supports two local response engines:

- `Ollama`
- `OpenVINO`

General guidance:

- choose `Ollama` for more complex questions and fuller answers
- choose `OpenVINO` for lighter local usage and lower resource cost

## Reserved But Not Open Yet

The following areas are still placeholders in this release:

- voice mode
- microphone / camera connection
- digital avatar expression
- emotion suggestion output

## What Changed In v1.0.5

- Overview, Workspace, and Manual now prioritize core content first
- the persistent left banner can collapse to free more space
- frontend copy is now user-facing instead of developer-facing
- the homepage and browser icon now use the new logo
- the bilingual manual now matches the current release tone

## Reminder

- this release is still being refined
- if a service is unavailable, the UI will show it directly
- no file change is applied before confirmation
