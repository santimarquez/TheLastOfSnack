# AI Agent Infrastructure – The Last of the Snacks

This folder provides structured context, docs, skills, and prompts so Cursor (and other AI assistants) can work effectively on this repository.

## Purpose

- **Context** – Canonical project structure, tech stack, patterns, and coding standards.
- **Docs** – Setup and feature documentation (e.g. Cursor setup, message protocol).
- **Skills** – Reusable patterns (e.g. “add a Next.js page”, “add a game-server message type”).
- **Agents** – Specialized workflows (e.g. “add feature end-to-end”, “i18n pass”).
- **Prompts** – Prompt templates for common tasks.

## Folder Layout

| Folder | Purpose |
|--------|--------|
| **context/** | Source-of-truth files read by AI for project context |
| **docs/** | Human- and AI-readable documentation |
| **skills/** | Reusable skill definitions (patterns, steps) |
| **agents/** | Agent definitions and workflows |
| **prompts/** | Prompt templates |

## Context Files (`ai/context/`)

These files are the primary context for AI. Keep them up to date when the project evolves.

| File | Contents |
|------|----------|
| **PROJECT_STRUCTURE.md** | Folder layout, conventions, where frontend vs game-server vs shared code lives |
| **TECH_STACK.md** | Next.js 14, React 18, Zustand, Fastify, WebSockets, shared TS, Node, Docker, nginx, Traefik |
| **COMMON_PATTERNS.md** | Next App Router, API proxy, Zustand store, useGameSocket, getWsUrl, game-server message handling, lobby settings sync |
| **CODING_STANDARDS.md** | TypeScript strict, naming, formatting (2 spaces), ESM for game-server |
| **RECENT_CHANGES.md** | Short log of recent changes and decisions (name, speed mode, lobby settings, WebSocket URL, 502 fix, OG image, etc.) |

**Usage:** When asking Cursor to implement a feature, it can rely on these files for structure and patterns. After notable changes, update **RECENT_CHANGES.md** (and other context files if structure or stack changes).

## Docs (`ai/docs/`)

- **CURSOR_SETUP.md** (optional) – How this repo is configured for Cursor (rules, context, quick start).
- Other feature or protocol docs (e.g. message protocol, deployment) can live here.

## Skills (`ai/skills/`)

Skills encode repeatable patterns, e.g.:

- Add a new Next.js page (App Router) with the same layout/i18n pattern.
- Add a new client message type (Zod schema, handler, broadcast).
- Add i18n keys (en + es, namespace convention).

Place skill definitions (e.g. `SKILL.md` or JSON) here. Cursor can reference them when performing similar tasks.

## Agents (`ai/agents/`)

Agents define multi-step workflows, e.g.:

- “Add feature X” (shared types → game-server → frontend → i18n).
- “i18n pass” (scan for hardcoded strings, add keys, replace with `t()`).

Place agent definitions here. Used when you want a guided, step-by-step execution.

## Prompts (`ai/prompts/`)

Templates for common prompts, e.g.:

- “Add a new lobby setting that the host can toggle”
- “Add a new card type and wire it in How to Play”

Copy, adjust, and paste into Cursor when starting a task.

## Navigation Quick Reference

| I want to… | Look at |
|------------|--------|
| Understand folder layout | `ai/context/PROJECT_STRUCTURE.md` |
| See tech versions and choices | `ai/context/TECH_STACK.md` |
| Follow implementation patterns | `ai/context/COMMON_PATTERNS.md` |
| Check naming/formatting | `ai/context/CODING_STANDARDS.md` |
| See what changed recently | `ai/context/RECENT_CHANGES.md` |
| Configure Cursor for this repo | `.cursorrules`, `CURSOR.md`, `CURSOR_QUICK_START.md` |
| Run / deploy | `CURSOR.md` (Run & Deploy), `.env.example` |

## Maintenance

- **After adding a feature:** Update `RECENT_CHANGES.md`; add or update `ai/docs/` if there is new protocol or setup.
- **After changing structure or stack:** Update `PROJECT_STRUCTURE.md` and/or `TECH_STACK.md` and `.cursorrules`.
- **When establishing a new pattern:** Document it in `COMMON_PATTERNS.md` and consider adding a skill in `ai/skills/`.

---

**Repo:** The Last of the Snacks  
**Root context:** `.cursorrules`, `CURSOR.md`  
**Quick start:** `CURSOR_QUICK_START.md`
