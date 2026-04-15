# Hongzhi v1.2.0

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
- refresh the same browser and continue the recent conversation when it is still available
- review pending changes before applying them
- revisit recent applied or failed changes in the same workspace

## Three Main Views

### Overview

- see what the current release can do
- follow a simple recommended usage flow
- compare the available response modes

### Workspace

- keep the conversation at the top
- view service status and preferences on the same page
- reconnect to the recent conversation and pending change after refresh in the same browser
- preview changes before applying them
- review recent applied or failed changes without leaving the workspace

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

- version: `v1.2.0`
- product form: local-first intelligent workspace
- focus: session restore, change-history review, core-first layout, bilingual manual reading

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

## What Changed In v1.2.0

- the workspace can reconnect to the recent conversation after refresh in the same browser
- pending changes can be restored together with the recent session when still available
- recent changes are kept as a structured history and can be reviewed in the workspace
- response preferences now stay closer to the current local workspace state
- the existing core-first layout and bilingual manual continue as the default experience

## Reminder

- this release is still being refined
- if a service is unavailable, the UI will show it directly
- no file change is applied before confirmation
