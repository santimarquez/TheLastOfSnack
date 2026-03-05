# Google Analytics 4 events – The Last of the Snacks

Events are sent via `window.gtag('event', name, params)` when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. All events use snake_case names and snake_case parameter keys for GA4.

## Event list

### Lobby & discovery

| Event               | When | Parameters |
|---------------------|------|------------|
| `arena_created`     | User created a new room | `method`: "home" \| "arenas" |
| `arena_joined`      | User joined a room (first time, not reconnect) | `method`: "code" \| "quick_join" \| "list" \| "create" |
| `open_arenas_view`  | User viewed the Open Arenas page | — |
| `lobby_left`        | User left the lobby (navigated away) | `phase`: "lobby" |
| `player_kicked`     | User was removed by the host | — |
| `room_closed`       | Room was closed by the host (e.g. creator made a new room) | — |

### Game flow

| Event               | When | Parameters |
|---------------------|------|------------|
| `game_started`      | Host started the game | `player_count`, `speed_mode` (bool) |
| `round_started`     | A round began | `round`: 1 \| 2 \| 3 |
| `round_concluded`   | Round ended | `round`, `survivors_count` |
| `game_ended`        | Game over | `has_winner` (bool), `winner_count`, `total_rounds` |
| `player_eliminated` | A player was eliminated | `round` |

### Engagement

| Event                 | When | Parameters |
|-----------------------|------|------------|
| `how_to_play_opened`  | User opened How to play / Settings modal | `tab`: "settings" \| "how-to-play" |
| `locale_changed`      | User switched language | `locale`: "en" \| "es" |
| `reconnected`         | User reconnected with token (rejoined same room) | — |
| `connection_lost`     | Connection lost (no retry or error) | `reason` (optional): "closed" \| "error" |

## Implementation

- **Lib:** `frontend/src/lib/analytics.ts` – `track()`, `Analytics.*` helpers, `JOIN_METHOD_KEY` for passing join method to the room page.
- **Calls:** Home page, Arenas page, Room page (cleanup), `useGameSocket`, `SettingsHelpModal`, `LocaleSwitcher`.
