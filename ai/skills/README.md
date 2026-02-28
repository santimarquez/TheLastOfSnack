# Skills – The Last of the Snacks

This folder holds **reusable skill definitions** that encode common patterns for this repo. Cursor (or other AI tools) can use them when performing similar tasks.

## What a skill can contain

- **Steps** – e.g. “Add Zod schema in game-server/src/validation/schemas.ts”, “Add key to en.json and es.json”.
- **Conventions** – e.g. “Use `send('type', payload)` and handle the event in useGameSocket”.
- **File locations** – Where to add code for a given kind of change.

## Example skills (to add as needed)

- **Add a new Next.js page** – App Router route, layout, i18n keys, CSS Module.
- **Add a new client message type** – Zod schema, handler in game-server, optional frontend `send()` and store update.
- **Add a new lobby setting** – shared type, server storage, `set_lobby_settings` payload, `room_updated`/`joined` sync, frontend toggle and store.
- **Add i18n keys** – Namespace, key naming, en + es, usage with `useTranslations()`.

Create a `SKILL.md` (or similar) per skill and reference it in prompts or in `ai/README.md`.
