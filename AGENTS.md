# AGENTS.md

Guidance for coding agents working in this repository.

## Project at a glance

- App: **The Last of the Snacks** (multiplayer party game).
- Monorepo with npm workspaces:
  - `frontend/` - Next.js 14 + React + TypeScript.
  - `game-server/` - Fastify + WebSockets + TypeScript (ESM).
  - `shared/` - shared types/constants package consumed by frontend and server.
- Build dependency order: `shared` -> `game-server` -> `frontend`.

## Core architecture rules

1. Use shared contracts from `@last-of-snack/shared` for cross-package types.
2. Validate all client WebSocket payloads on the server (Zod schemas).
3. Host-only actions must stay enforced server-side:
   - Start game
   - Lobby settings changes
4. Lobby settings are server-owned state and must be broadcast in room updates.
5. Keep WebSocket URL behavior consistent:
   - Env override if configured
   - Otherwise same-origin
   - `localhost:3000` dev special-case should connect to `ws://localhost:4000/ws`

## Frontend conventions

- App Router files live in `frontend/src/app/`.
- Use `"use client"` for components using hooks/browser APIs.
- Global client state uses Zustand (`frontend/src/store/`).
- Styling uses CSS Modules.
- i18n uses `useTranslations()` and JSON messages under `frontend/src/i18n/messages/`.
- Any new translation key must be added to both:
  - `frontend/src/i18n/messages/en.json`
  - `frontend/src/i18n/messages/es.json`

## Game server conventions

- Entry point: `game-server/src/index.ts`.
- Game logic in `game-server/src/engine/`.
- Room/state management in `game-server/src/rooms/` and `game-server/src/state/`.
- Keep ESM import style compatible with compile output (explicit `.js` extensions where required).

## Dev and verification workflow

Use these from repo root:

- Install deps: `npm install`
- Dev (frontend + server): `npm run dev`
- Build all: `npm run build`
- Test all: `npm test`
- Lint: `npm run lint`

When touching shared contracts or cross-package behavior:

1. Build `shared` first.
2. Then build/test server and frontend dependents.
3. Verify room creation + websocket flow locally.

## Environment expectations

- Local default ports: frontend `3000`, game-server `4000`.
- Docker local uses nginx on `3080`.
- For containerized frontend-to-server API proxy, `GAME_SERVER_HTTP` should target `http://game-server:4000`.
- In production behind reverse proxy, prefer same-origin API/WS and avoid unnecessary public server URL overrides.

## Documentation upkeep

After notable behavior or architecture changes:

1. Update `ai/context/RECENT_CHANGES.md`.
2. Add/update docs in `ai/docs/` as needed.
3. Keep this file aligned with current conventions.

## Practical editing guidelines

- Prefer small, focused changes.
- Do not silently change gameplay rules without updating related docs/types.
- Preserve backward compatibility for event payload shapes unless intentionally versioned.
- If you add new WebSocket message types, update:
  - validation schemas,
  - server handlers,
  - shared types,
  - client handling paths.

