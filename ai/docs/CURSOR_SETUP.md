# Cursor Setup – The Last of the Snacks

This repo is set up for **AI-agent–guided development** with Cursor.

## Files that give Cursor context

| File | Role |
|------|------|
| **.cursorrules** | Main guidelines: stack, architecture, WebSocket/API, env, i18n, file locations |
| **CURSOR.md** | Short project context, structure tree, WebSocket/API summary, run/deploy, tips |
| **CURSOR_QUICK_START.md** | Example prompts and key paths |
| **ai/README.md** | Overview of the `ai/` folder (context, docs, skills, agents, prompts) |
| **ai/context/** | PROJECT_STRUCTURE, TECH_STACK, COMMON_PATTERNS, CODING_STANDARDS, RECENT_CHANGES |

## How to use

1. **Open the repo in Cursor** – Cursor will load `.cursorrules` automatically.
2. **For a quick overview** – Read `CURSOR.md` or ask: “What is this project and how is it structured?”
3. **For implementation patterns** – Point Cursor at `ai/context/COMMON_PATTERNS.md` or ask: “How do we add a new WebSocket message type?”
4. **For recent decisions** – Check `ai/context/RECENT_CHANGES.md`.

## Keeping context up to date

- After **structure or stack changes**: Update `ai/context/PROJECT_STRUCTURE.md` and/or `ai/context/TECH_STACK.md` and `.cursorrules`.
- After **new patterns or conventions**: Update `ai/context/COMMON_PATTERNS.md` and/or `ai/context/CODING_STANDARDS.md`.
- After **notable features or fixes**: Add an entry to `ai/context/RECENT_CHANGES.md`.
- For **new protocols or deployment**: Add a doc under `ai/docs/` and link from `ai/README.md` if useful.

## Optional: skills and agents

- **ai/skills/** – Reusable patterns (e.g. “add a Next.js page”, “add a game-server message type”). Define as markdown or structured files; reference in prompts.
- **ai/agents/** – Multi-step workflows (e.g. “add feature end-to-end”, “i18n pass”). Use when you want guided, step-by-step execution.
- **ai/prompts/** – Prompt templates for common tasks; copy and adjust when starting work.
