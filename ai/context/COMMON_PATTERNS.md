# Common Patterns – The Last of the Snacks

## Next.js App Router

- **Pages:** `frontend/src/app/page.tsx` (home), `room/[code]/page.tsx` (room), `how-to-play/page.tsx`.
- **Layout:** `layout.tsx` wraps app; metadata (title, description, OG) set in layout or page.
- **API route:** `app/api/rooms/route.ts` – POST proxies to `GAME_SERVER_HTTP` (e.g. `http://game-server:4000`) for room creation; no client-side WebSocket URL here.
- **Client components:** Use `"use client"` for components that use hooks (useState, useEffect, useGameStore, useGameSocket).

## API Proxy (Room Creation)

- Browser POSTs to same-origin `/api/rooms`.
- Next.js route reads `process.env.GAME_SERVER_HTTP ?? "http://localhost:4000"`, forwards to `${GAME_SERVER}/rooms`.
- Returns JSON and status from game-server; on fetch error returns 502 and `{ error: "Failed to create room" }`.
- In Docker, frontend must have `GAME_SERVER_HTTP=http://game-server:4000` so the proxy works.

## WebSocket URL (`getWsUrl`)

- If `NEXT_PUBLIC_GAME_SERVER_HTTP` is set: use it, replace `http` with `ws`, append `/ws`.
- Else if `window.location.host` is `localhost:3000`: use `ws://localhost:4000/ws` (Next dev does not proxy `/ws`).
- Else: same-origin `ws://` or `wss://` + host + `/ws`.
- Implemented in `frontend/src/hooks/useGameSocket.ts`; used by the hook only (no standalone export needed for current usage).

## Zustand Store (`gameStore`)

- **State:** roomCode, playerId, displayName, reconnectToken, isHost, gameState (GameStateView | null), lobbySettings (speedMode, suspicionMeter), chatMessages, connectionStatus, error, UI flags (showEliminationModal, showAssigningTransition, showSettingsHelpModal, joinFailed).
- **Updates:** Setters like `setJoined`, `setRoomUpdated`, `setGameStarted`, `setTurnStarted`, `setCardPlayed`, `setPlayerEliminated`, `setGameEnded`, `addChat`, `setStateSync`, `setConnectionStatus`, `setError`, `setJoinFailed`, plus UI setters and `reset`.
- **Lobby settings:** Always synced from server (joined, room_updated); client does not persist them independently.
- **Initial lobby settings:** `{ speedMode: false, suspicionMeter: false }`.

## useGameSocket

- **Params:** roomCode, displayName, reconnectToken.
- **Behavior:** Connects to `getWsUrl()`, sends `join` on open with roomCode, displayName, optional reconnectToken. Listens for: joined, room_updated, game_started, turn_started, card_played, player_eliminated, game_ended, chat, state_sync, error. On error with code `JOIN_FAILED` and message “Room not found” or “Room no longer exists”, sets joinFailed. Retries with backoff on close (max 5).
- **Returns:** `{ send, connect }`. Use `send("set_name", { displayName })`, `send("set_avatar", { avatarId })`, `send("set_lobby_settings", { speedMode?, suspicionMeter? })`, `send("start_game", { speedMode? })`, `send("play_card", { cardId })`, `send("chat", { text })`, `send("restart", {})`.

## Game Server Message Handling

- **Incoming:** JSON `{ type, payload }`. Validate with `parseClientMessage(type, payload)` (Zod); on unknown type or validation failure return structured error.
- **Client message types:** join, set_name, set_avatar, set_lobby_settings, start_game, play_card, chat, restart.
- **Authorization:** Only host can call `set_lobby_settings` and `start_game`; enforce in RoomManager/GameEngine.
- **Outgoing:** Emit events: joined, room_updated, game_started, turn_started, card_played, player_eliminated, game_ended, chat, state_sync, error. Include `lobbySettings` in `joined` and `room_updated` when applicable.

## Lobby Settings Sync

- Server stores room settings (e.g. speedMode, suspicionMeter); turn timeout derived (e.g. 20s speed, 60s normal).
- On join and on any lobby change, server sends `room_updated` (and `joined` for new join) with `lobbySettings` in payload.
- Frontend stores in `gameStore.lobbySettings` and uses for UI (toggles, timer display). Host changes via `set_lobby_settings`.

## i18n

- **Keys:** Namespaced, e.g. `common.appName`, `home.heroTitleLine1`, `lobby.*`, `game.*`. Add to both `en.json` and `es.json`.
- **Usage:** `useTranslations()` and `t("key")` in client components.
- **App name in copy:** “The Last of the Snacks”; hero line split as title line 1 + title line 2 in i18n.

## Adding a New Client Message Type

1. Add Zod schema in `game-server/src/validation/schemas.ts` and add to `clientMessageSchemas`.
2. In WebSocket handler, handle the new type after parsing; enforce host-only if required.
3. Update room/engine state and broadcast as needed (e.g. room_updated).
4. On frontend, call `send("new_type", { ... })` where appropriate; handle any new event in `useGameSocket` and update `gameStore` if needed.
5. If the type is part of room or game state, extend shared types in `shared/src/types.ts` and use in both server and client.
