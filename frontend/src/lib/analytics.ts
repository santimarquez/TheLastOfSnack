/**
 * Google Analytics 4 event tracking for The Last of the Snacks.
 *
 * Event list (for GA4):
 *
 * Lobby & discovery
 * - arena_created: User created a new room. Params: method ("home" | "arenas").
 * - arena_joined: User joined a room. Params: method ("code" | "quick_join" | "list" | "create").
 * - open_arenas_view: User viewed the Open Arenas page.
 * - lobby_left: User left the lobby (navigated away). Params: phase ("lobby").
 * - player_kicked: User was removed by the host.
 * - room_closed: Room was closed by the host (e.g. creator made a new room).
 *
 * Game flow
 * - game_started: Host started the game. Params: player_count, speed_mode (bool).
 * - round_started: A round began. Params: round (1 | 2 | 3).
 * - round_concluded: Round ended. Params: round, survivors_count.
 * - game_ended: Game over. Params: has_winner (bool), winner_count, total_rounds.
 * - game_restarted: Host restarted after game ended.
 * - player_eliminated: A player was eliminated. Params: round.
 *
 * Engagement
 * - how_to_play_opened: User opened How to play / Settings modal. Params: tab ("settings" | "how-to-play").
 * - locale_changed: User switched language. Params: locale ("en" | "es").
 * - reconnected: User reconnected with token (rejoined same room).
 * - connection_lost: Connection lost. Params: reason (string, optional).
 */

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: Record<string, unknown>) => void;
  }
}

export function track(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  const clean = params
    ? (Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string | number | boolean>)
    : undefined;
  window.gtag("event", eventName, clean);
}

export const Analytics = {
  arenaCreated: (method: "home" | "arenas") => track("arena_created", { method }),

  arenaJoined: (method: "code" | "quick_join" | "list" | "create") =>
    track("arena_joined", { method }),

  openArenasView: () => track("open_arenas_view"),

  lobbyLeft: () => track("lobby_left", { phase: "lobby" }),

  playerKicked: () => track("player_kicked"),

  roomClosed: () => track("room_closed"),

  gameStarted: (playerCount: number, speedMode: boolean) =>
    track("game_started", { player_count: playerCount, speed_mode: speedMode }),

  roundStarted: (round: 1 | 2 | 3) => track("round_started", { round }),

  roundConcluded: (round: number, survivorsCount: number) =>
    track("round_concluded", { round, survivors_count: survivorsCount }),

  gameEnded: (hasWinner: boolean, winnerCount: number, totalRounds: number) =>
    track("game_ended", {
      has_winner: hasWinner,
      winner_count: winnerCount,
      total_rounds: totalRounds,
    }),

  gameRestarted: () => track("game_restarted"),

  playerEliminated: (round: number) => track("player_eliminated", { round }),

  howToPlayOpened: (tab: "settings" | "how-to-play") =>
    track("how_to_play_opened", { tab }),

  localeChanged: (locale: string) => track("locale_changed", { locale }),

  reconnected: () => track("reconnected"),

  connectionLost: (reason?: string) => track("connection_lost", reason ? { reason } : undefined),
} as const;

/** Key to pass join method from navigation to room page (read in useGameSocket on first joined). */
export const JOIN_METHOD_KEY = "last_of_snack_join_method";
