# The last of snack

Trust no one. Season aggressively.

A real-time, browser-based, turn-based hidden-role card game for 4–8 players.

## Quick start (development)

```bash
npm install
npm run build -w @last-of-snack/shared
npm run dev
```

- Frontend: http://localhost:3000
- Game server: http://localhost:4000

Set `NEXT_PUBLIC_GAME_SERVER_HTTP=http://localhost:4000` when running frontend and game-server separately so the browser uses the game server for both create-room and WebSocket. If unset, the frontend uses same-origin `/api/rooms` (Next.js proxies to the game server); the game server must still be running for room creation and play.

## Docker (single VPS)

```bash
docker compose up --build
```

- With NGINX: http://localhost (port 80)
- Frontend only: http://localhost:3000 (set `NEXT_PUBLIC_GAME_SERVER_HTTP=http://localhost:4000` for API/WS)
- Game server: port 4000

## Scripts

- `npm run dev` – run frontend and game-server in development
- `npm run build` – build shared, game-server, and frontend
- `npm run dev:server` – game-server only
- `npm run dev:frontend` – Next.js only

## Environment

- **Game server:** `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`, `TURN_TIMEOUT_SEC`, `SPEED_MODE`
- **Frontend:** `NEXT_PUBLIC_GAME_SERVER_HTTP` (optional; when unset, create-room is sent to `/api/rooms`, which proxies to the game server). WebSocket still needs the game server URL when not same-origin, so set this for local dev with separate processes.
