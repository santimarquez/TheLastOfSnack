# Cursor Quick Start – The Last of the Snacks

Quick reference for using Cursor with this game repository.

## Setup

- **CURSOR.md** – Project context (this repo)
- **.cursorrules** – Guidelines (Next.js, game-server, shared, WebSocket, env, i18n)
- **ai/** – Context, docs, skills, agents, prompts

## Start Using Cursor

### Example prompts

```
Add a new lobby setting that the host can toggle and sync to all players
Add a new card type to the game and show it in the How to Play page
Add Spanish translations for the new connection-lost copy
Fix the WebSocket URL when running behind a custom domain
Add Open Graph image and Twitter card for the room page
Add a health check endpoint and wire it in nginx
Refactor the game store to split room state and UI state
Add a "rematch" flow that restarts the game with same players
Document the message protocol in ai/docs/
```

### By area

**Frontend (Next.js / React)**
- "Add a new section to the home page using the same CSS module pattern as the CTA banner"
- "Use the i18n pattern: add keys to en.json and es.json and use useTranslations"
- "Follow the gameStore pattern for new client state"

**Game server**
- "Add a new client message type and validate it with Zod in schemas.ts"
- "Broadcast room_updated with the new field in the payload"
- "Only allow the host to trigger this action"

**Shared / types**
- "Add a new field to RoomSettings and update the types in shared"
- "Export the new type from shared and use it in frontend and game-server"

**DevOps / env**
- "Add the new env var to .env.example and document it"
- "Ensure the frontend container can reach the game-server for the new API call"

**i18n**
- "Add EN and ES strings for [feature] under the [section] namespace"

## Key paths

| What | Path |
|------|------|
| App routes & layout | `frontend/src/app/` |
| Components | `frontend/src/components/` |
| Client state | `frontend/src/store/` |
| i18n messages | `frontend/src/i18n/messages/en.json`, `es.json` |
| WebSocket hook | `frontend/src/hooks/useGameSocket.ts` |
| Game engine | `game-server/src/engine/` |
| Room & validation | `game-server/src/rooms/`, `game-server/src/validation/` |
| Shared types | `shared/src/` |
| AI context | `ai/context/` |

## Docs

- **Full context:** `CURSOR.md`
- **Rules:** `.cursorrules`
- **AI guide:** `ai/README.md`
- **Cursor setup:** `ai/docs/CURSOR_SETUP.md` (if present)

---

Open Cursor and start from `CURSOR.md` and `.cursorrules` when working on this repo.
