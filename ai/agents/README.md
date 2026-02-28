# Agents – The Last of the Snacks

This folder holds **agent definitions** for multi-step workflows. Use them when you want Cursor (or another AI) to follow a guided sequence.

## What an agent can define

- **Goal** – e.g. “Add a new lobby setting end-to-end”.
- **Steps** – e.g. 1) Extend shared types, 2) Add Zod schema and server handling, 3) Broadcast in room_updated/joined, 4) Add frontend toggle and store sync, 5) Add i18n keys.
- **Checklist** – Tests, docs, RECENT_CHANGES update.

## Example agents (to add as needed)

- **Feature: new lobby setting** – Shared → game-server (schema, storage, broadcast) → frontend (UI, store) → i18n.
- **Feature: new card type** – Shared types + engine logic → validation + handler → frontend display + How to Play.
- **i18n pass** – Scan for hardcoded strings, add keys to en.json and es.json, replace with `t()`.

Define agents as markdown or structured files and reference them when starting a task.
