# Cursor Context – The Last of the Snacks

> **Note:** This file gives Cursor quick context. For full guidelines, see `.cursorrules`.

## 🎯 Quick Context

**Purpose:** Multiplayer party game – create/join rooms, pick snack avatars, play card-based turns in real time. Last snack standing wins. Brand: "The Last of the Snacks" – trust no one, season aggressively.

**Tech Stack:**
- **Next.js 14** – App Router, React 18, TypeScript, Zustand, CSS Modules
- **Game server** – Node, Fastify, WebSockets, TypeScript (ESM)
- **Shared** – `@last-of-snack/shared` (types used by frontend + game-server)
- **i18n** – EN (default) / ES; JSON messages in `frontend/src/i18n/messages/`
- **Docker** – Compose: frontend, game-server, nginx; prod override for Traefik

## 📁 Project Structure

```
TheLastOfSnack/
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/              # App Router: layout, page, room/[code], how-to-play, api/rooms
│   │   ├── components/      # Lobby, GameTable, GameHeader, Shell, GameEndScreen, etc.
│   │   ├── store/            # Zustand: gameStore, soundStore
│   │   ├── hooks/            # useGameSocket, useGoodConnection
│   │   └── i18n/             # context + messages/en.json, es.json
│   └── Dockerfile
├── game-server/              # Fastify + WebSocket
│   ├── src/
│   │   ├── engine/           # GameEngine, TurnSystem, CardResolution, Timer, EventBroadcasting
│   │   ├── rooms/            # RoomManager, Room entity
│   │   ├── state/            # In-memory store
│   │   ├── validation/       # Zod schemas for client messages
│   │   └── websocket/        # handler, broadcast
│   └── Dockerfile
├── shared/                   # @last-of-snack/shared
│   └── src/                  # types, constants (build output in dist/)
├── ai/                       # AI agent infrastructure
│   ├── context/              # PROJECT_STRUCTURE, TECH_STACK, COMMON_PATTERNS, RECENT_CHANGES
│   ├── docs/
│   ├── skills/
│   ├── agents/
│   ├── prompts/
│   └── README.md
├── docker-compose.yml
├── docker-compose.prod.yml   # Traefik; no host ports
├── nginx.conf                # Proxies /, /ws, /rooms, /health
└── .env.example
```

## 📚 Essential Context Files

1. **`.cursorrules`** – Stack, architecture, WebSocket/API conventions, env vars, file locations
2. **`ai/README.md`** – How to use AI context, skills, and docs
3. **`ai/context/`**
   - **PROJECT_STRUCTURE.md** – Folders and where things live
   - **TECH_STACK.md** – Versions and choices
   - **COMMON_PATTERNS.md** – Next.js, game-server, i18n patterns
   - **CODING_STANDARDS.md** – Quick reference
   - **RECENT_CHANGES.md** – Latest changes and decisions

## 🔌 WebSocket & API

- **Create room:** POST to same-origin `/api/rooms`; Next.js proxies to game-server when `GAME_SERVER_HTTP` is set (e.g. `http://game-server:4000` in Docker)
- **WebSocket:** `getWsUrl()` in `useGameSocket.ts`: if `NEXT_PUBLIC_GAME_SERVER_HTTP` set → use it; else if `localhost:3000` → `ws://localhost:4000/ws`; else same-origin `ws(s)://host/ws`
- **Lobby settings:** Stored on server; synced via `room_updated` and `joined` with `lobbySettings`; host sends `set_lobby_settings`

## 🐳 Run & Deploy

- **Local dev:** `npm run dev` (frontend :3000, game-server :4000); open http://localhost:3000
- **Local Docker:** `docker compose up`; open http://localhost:3080 (nginx)
- **Production:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up`; set `TRAEFIK_*` in `.env`; leave `NEXT_PUBLIC_GAME_SERVER_HTTP` unset

## 💡 Tips for AI Assistants

- Follow `.cursorrules` for stack and conventions
- Use `ai/context/COMMON_PATTERNS.md` for implementation patterns
- Update `ai/context/RECENT_CHANGES.md` after notable changes
- When adding UI copy, add keys to both `en.json` and `es.json`
- For WebSocket or proxy issues, check env vars (GAME_SERVER_HTTP, NEXT_PUBLIC_GAME_SERVER_HTTP) and `useGameSocket.ts` / nginx

## 📞 Help & Resources

- **Full guidelines:** `.cursorrules`
- **AI guide:** `ai/README.md`
- **Context:** `ai/context/`

---

**Version:** 1.0  
**For:** Cursor AI Assistant  
**Also see:** `.cursorrules`, `ai/README.md`
