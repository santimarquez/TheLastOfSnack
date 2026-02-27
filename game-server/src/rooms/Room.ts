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
  };
}

export function createRoomEntity(
  code: string,
  hostPlayer: Player,
  settings?: Partial<RoomSettings>
): { code: string; hostId: string; players: Player[]; gameState: GameState; createdAt: number; settings: RoomSettings } {
  const gameState = createInitialGameState();
  return {
    code,
    hostId: hostPlayer.id,
    players: [hostPlayer],
    gameState,
    createdAt: Date.now(),
    settings: {
      speedMode: settings?.speedMode ?? config.speedMode,
      suspicionMeter: settings?.suspicionMeter ?? false,
      turnTimeoutSec:
        settings?.turnTimeoutSec ??
        ((settings?.speedMode ?? config.speedMode) ? 20 : 60),
    },
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
