# Recent Changes – The Last of the Snacks

*(Chronological log of notable changes and decisions. Newest at top.)*

---

## AI agent–guided setup

- Added and updated **.cursorrules**, **CURSOR.md**, **CURSOR_QUICK_START.md**, and **ai/README.md** for this repo (replacing prior Astro/santimarquez content).
- Created **ai/context/** with PROJECT_STRUCTURE.md, TECH_STACK.md, COMMON_PATTERNS.md, CODING_STANDARDS.md, RECENT_CHANGES.md.
- Created **ai/docs/**, **ai/skills/**, **ai/agents/**, **ai/prompts/** with README placeholders to support an AI-agent–guided workflow.

---

## Product and branding

- **App name:** “The Last of the Snacks” (hero line: “The Last Of The” + “Snacks”). All user-facing strings and metadata updated from “The Last of Snack” to “The Last of the Snacks”.
- **i18n:** EN (default) and ES; keys like `common.appName`, `common.heroTitleLine1` / `heroTitleLine2`, `home.footerCopy`, etc.

---

## Lobby and game settings

- **Lobby settings** (speedMode, suspicionMeter) stored on server; synced to all clients via `room_updated` and `joined` with `lobbySettings` in payload.
- **Host-only:** Only host can call `set_lobby_settings` and `start_game`.
- **Default speed mode:** Off (60s turns); when speed mode on, turn timeout 20s.
- **Turn timer:** `turnTimeoutSec` in room settings and in GameStateView for client countdown.

---

## WebSocket and API

- **WebSocket URL:** If `NEXT_PUBLIC_GAME_SERVER_HTTP` set → use it (http→ws) + `/ws`. Else if host is `localhost:3000` (local dev) → `ws://localhost:4000/ws`. Else same-origin `ws://` or `wss://` + host + `/ws`. Logic in `useGameSocket.ts` (`getWsUrl`).
- **Room creation:** POST to same-origin `/api/rooms`; Next.js API route proxies to `GAME_SERVER_HTTP` (e.g. `http://game-server:4000` in Docker). On proxy failure, return 502 and “Failed to create room”.
- **Production:** Do not set `NEXT_PUBLIC_GAME_SERVER_HTTP` when behind nginx/Traefik so client uses same-origin for API and WebSocket.

---

## Frontend and UX

- **OG/social:** OG image and Twitter card use CTA section image; metadata in `layout.tsx`; `NEXT_PUBLIC_SITE_URL` for production base URL.
- **useGoodConnection:** Types fixed (connection typed as `EventTarget & { … }`; inside check use a local `c = nav.connection` and guard so TypeScript is satisfied).
- **Music:** Gated by `MUSIC_ENABLED` in soundStore; when false, BackgroundMusic does not run and music-related UI (mute, settings audio) is hidden.

---

## DevOps

- **Docker Compose:** nginx as single entrypoint; frontend and game-server behind nginx. Default compose exposes nginx on port **3080** (or as configured).
- **Production:** `docker-compose.prod.yml` adds Traefik; no host ports; set `TRAEFIK_*` and optionally `ALLOWED_ORIGINS` in `.env`. `.env.example` documents Traefik and optional app vars.

---

*When making future changes, add a short entry here and keep the list in reverse chronological order.*
