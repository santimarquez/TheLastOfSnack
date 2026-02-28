# Coding Standards – The Last of the Snacks

## TypeScript

- **Strict mode** enabled.
- Type all public APIs, payloads, and props; prefer `interface` for object shapes.
- Use shared types from `@last-of-snack/shared` for GameStateView, PlayerView, RoomSettings, etc., where applicable.
- **Game server:** ESM (`"type": "module"`); use `.js` extension in imports for compiled output if required by runtime.

## Naming

- **App name (display):** “The Last of the Snacks”. Hero line: “The Last Of The” + “Snacks”.
- **Variables/functions:** camelCase.
- **Components/classes:** PascalCase.
- **Files:** PascalCase for components (e.g. `GameTable.tsx`); camelCase for hooks and utils (e.g. `useGameSocket.ts`).
- **Env vars:** `GAME_SERVER_HTTP`, `NEXT_PUBLIC_GAME_SERVER_HTTP`, `NEXT_PUBLIC_SITE_URL`; see `.env.example`.

## Formatting

- **Indentation:** 2 spaces.
- **Quotes:** Prefer double for JS/TS; consistent in JSON.
- **Semicolons:** Use them in TypeScript/JavaScript.

## React / Next.js

- Use `"use client"` for components that use hooks or browser APIs.
- Prefer Zustand for global client state; avoid deep prop drilling for room/game state.
- Use CSS Modules for component-scoped styles; design tokens in `globals.css`.

## Game Server

- Validate all client payloads with Zod via `parseClientMessage`; return structured errors for unknown type or validation failure.
- Only host can start game and set lobby settings; enforce in room/game logic.
- Use shared types for game state and room settings so frontend and server stay in sync.

## i18n

- Add new keys to both `frontend/src/i18n/messages/en.json` and `es.json`.
- Use existing namespaces (common, home, lobby, game, etc.); keep keys consistent across locales.

## General

- Prefer small, focused modules.
- Document non-obvious behavior or protocol details in code or in `ai/docs/`.
- After notable changes, update `ai/context/RECENT_CHANGES.md`.
