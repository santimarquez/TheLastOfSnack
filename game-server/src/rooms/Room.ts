import type { GameState, Player, RoomSettings } from "../state/types.js";
import { config } from "../config.js";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function createInitialGameState(): GameState {
  return {
    phase: "lobby",
    turnOrder: [],
    currentTurnIndex: 0,
    deck: [],
    eliminatedPlayerIds: [],
    winnerId: null,
    revealedRoles: {},
    revealedCategories: {},
    discardPile: [],
  };
}

export function createRoomEntity(
  code: string,
  hostPlayer: Player,
  options?: Partial<RoomSettings> & { name?: string; isPrivate?: boolean; maxPlayers?: number }
): {
  code: string;
  hostId: string;
  players: Player[];
  gameState: GameState;
  createdAt: number;
  settings: RoomSettings;
  name?: string;
  isPrivate?: boolean;
  maxPlayers?: number;
} {
  const gameState = createInitialGameState();
  const speedMode = options?.speedMode ?? config.speedMode;
  const maxPlayers = Math.min(
    config.maxPlayers,
    Math.max(config.minPlayers, options?.maxPlayers ?? config.maxPlayers)
  );
  return {
    code,
    hostId: hostPlayer.id,
    players: [hostPlayer],
    gameState,
    createdAt: Date.now(),
    settings: {
      speedMode,
      suspicionMeter: options?.suspicionMeter ?? false,
      turnTimeoutSec: options?.turnTimeoutSec ?? (speedMode ? 20 : 60),
    },
    name: options?.name?.trim().slice(0, 32) || undefined,
    isPrivate: options?.isPrivate ?? false,
    maxPlayers,
  };
}

export function generateRoomCode(existingCodes: string[]): string {
  const set = new Set(existingCodes.map((c) => c.toUpperCase()));
  let code: string;
  do {
    code = "";
    for (let i = 0; i < config.roomCodeLength; i++) {
      code += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
    }
  } while (set.has(code));
  return code;
}
