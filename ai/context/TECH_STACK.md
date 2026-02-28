# Tech Stack – The Last of the Snacks

## Frontend

| Technology | Version / Notes |
|------------|-----------------|
| Next.js | 14.0.4 (App Router) |
| React | 18.x |
| TypeScript | 5.x (strict) |
| Zustand | 4.x (client state) |
| Styling | CSS Modules + globals.css design tokens |
| i18n | Custom context + JSON messages (en, es) |
| Node | 20.x (for tooling and Docker) |

## Game Server

| Technology | Version / Notes |
|------------|-----------------|
| Node.js | 20.x |
| Fastify | 4.x |
| @fastify/websocket | 8.x |
| ws | 8.x |
| TypeScript | 5.x, ESM (`"type": "module"`) |
| Zod | 3.x (validation of client messages) |
| tsx | Dev: `tsx watch src/index.ts`; build: `tsc` → `node dist/index.js` |

## Shared

| Technology | Version / Notes |
|------------|-----------------|
| TypeScript | 5.x |
| Module | ESM; `main`: `dist/index.js`, `types`: `dist/index.d.ts` |
| Build | `tsc`; consumed as `@last-of-snack/shared` by frontend and game-server |

## DevOps

| Technology | Purpose |
|------------|--------|
| Docker / Docker Compose | Local and production runs |
| nginx | Single entrypoint: proxy `/` → frontend, `/ws` and `/rooms` and `/health` → game-server |
| Traefik | Production reverse proxy (docker-compose.prod.yml); no host ports |
| Env | `.env` from `.env.example`; Traefik vars, GAME_SERVER_HTTP, NEXT_PUBLIC_* |

## Key Versions Summary

- **Next.js:** 14 (App Router only).
- **React:** 18.
- **Fastify:** 4.
- **TypeScript:** 5, strict.
- **Node:** 20.
- **Zod:** 3 for server-side validation.

## Tooling

- **Monorepo:** npm workspaces (root `package.json`).
- **Build:** `npm run build` (shared → game-server → frontend).
- **Dev:** `npm run dev` (concurrently frontend + game-server); frontend :3000, game-server :4000.
