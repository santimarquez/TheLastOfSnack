# Project Structure – The Last of the Snacks

## Overview

Monorepo (npm workspaces) with three packages:

- **frontend** – Next.js 14 App Router app (React 18, Zustand, CSS Modules, i18n).
- **game-server** – Fastify HTTP + WebSocket server (Node, TypeScript ESM).
- **shared** – TypeScript package `@last-of-snack/shared` (types, constants) consumed by both.

Build order: `shared` → `game-server` → `frontend`.

## Root

| Path | Purpose |
|------|--------|
| `package.json` | Workspace root; scripts for dev/build |
| `docker-compose.yml` | Local stack: frontend, game-server, nginx (e.g. port 3080) |
| `docker-compose.prod.yml` | Production override: Traefik, no host ports |
| `nginx.conf` | Proxies `/` → frontend, `/ws` and `/rooms` → game-server, `/health` → game-server |
| `.env.example` | Documented env vars (Traefik, game-server, frontend) |
| `.cursorrules` | Cursor guidelines for this repo |
| `CURSOR.md` | Project context for AI |
| `CURSOR_QUICK_START.md` | Quick start and example prompts |
| `ai/` | AI context, docs, skills, agents, prompts |

## Frontend (`frontend/`)

| Path | Purpose |
|------|--------|
| `src/app/` | App Router: `layout.tsx`, `page.tsx`, `room/[code]/page.tsx`, `how-to-play/page.tsx`, `api/rooms/route.ts` |
| `src/components/` | React components (Lobby, GameTable, GameHeader, Shell, GameEndScreen, SettingsHelpModal, etc.) |
| `src/store/` | Zustand: `gameStore` (room, game state, lobby settings, chat, connection), `soundStore` (volume, mute, music toggle) |
| `src/hooks/` | `useGameSocket.ts` (WebSocket + message handling), `useGoodConnection.ts` |
| `src/i18n/` | i18n context and `messages/en.json`, `messages/es.json` |
| `src/app/globals.css` | Global styles and design tokens (e.g. `--primary`, `--slate-*`) |
| Component styles | CSS Modules (`.module.css`) next to components |

## Game Server (`game-server/`)

| Path | Purpose |
|------|--------|
| `src/index.ts` | Fastify app, WebSocket upgrade, route `/ws` |
| `src/config.ts` | PORT, ALLOWED_ORIGINS, turnTimeoutSec, speedMode, min/max players |
| `src/state/` | In-memory store |
| `src/rooms/` | `RoomManager.ts`, `Room.ts` (room entity, host, players, gameState, settings) |
| `src/engine/` | GameEngine, TurnSystem, CardResolutionEngine, TimerSystem, EventBroadcasting |
| `src/websocket/` | WebSocket handler, message dispatch, broadcast helpers |
| `src/validation/` | `schemas.ts` – Zod schemas for client messages (join, set_name, set_avatar, set_lobby_settings, start_game, play_card, chat, restart) |

## Shared (`shared/`)

| Path | Purpose |
|------|--------|
| `src/types.ts` | GameStateView, RoomSettings, PlayerView, Snack, Card, GamePhase, etc. |
| `src/index.ts` | Re-exports (e.g. types) |
| `dist/` | Compiled output (consumed by frontend and game-server) |

## AI (`ai/`)

| Path | Purpose |
|------|--------|
| `context/` | PROJECT_STRUCTURE.md, TECH_STACK.md, COMMON_PATTERNS.md, CODING_STANDARDS.md, RECENT_CHANGES.md |
| `docs/` | Setup and feature docs |
| `skills/` | Reusable pattern definitions |
| `agents/` | Workflow definitions |
| `prompts/` | Prompt templates |
| `README.md` | This AI infrastructure overview |

## Conventions

- **App display name:** “The Last of the Snacks”; hero line: “The Last Of The” + “Snacks”.
- **Env:** `GAME_SERVER_HTTP` (server-side, frontend → game-server in Docker); `NEXT_PUBLIC_GAME_SERVER_HTTP` (optional client override); `NEXT_PUBLIC_SITE_URL` (metadata base).
- **WebSocket:** Same-origin in production (no `NEXT_PUBLIC_GAME_SERVER_HTTP`); local dev on `localhost:3000` uses `ws://localhost:4000/ws`.
- **Lobby settings:** Stored on server; synced via `room_updated` and `joined` with `lobbySettings`; only host can set them via `set_lobby_settings`.
