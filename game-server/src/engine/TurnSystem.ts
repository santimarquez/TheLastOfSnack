import type { Room } from "../state/types.js";

/** currentTurnIndex is an index into turnOrder. Returns the active player at that position, skipping eliminated. */
export function getCurrentPlayerId(room: Room): string | null {
  const { gameState } = room;
  if (gameState.phase !== "playing" || gameState.turnOrder.length === 0) return null;
  const eliminated = gameState.eliminatedPlayerIds;
  let idx = gameState.currentTurnIndex;
  let count = 0;
  while (count < gameState.turnOrder.length) {
    const playerId = gameState.turnOrder[idx];
    if (!eliminated.includes(playerId)) return playerId;
    idx = (idx + 1) % gameState.turnOrder.length;
    count++;
  }
  return null;
}

/** Advance to next active player in turn order, skipping eliminated. */
export function advanceTurn(room: Room): void {
  const { gameState } = room;
  if (gameState.turnOrder.length === 0) return;
  const eliminated = gameState.eliminatedPlayerIds;
  let idx = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
  let count = 0;
  while (count < gameState.turnOrder.length) {
    const playerId = gameState.turnOrder[idx];
    if (!eliminated.includes(playerId)) {
      gameState.currentTurnIndex = idx;
      return;
    }
    idx = (idx + 1) % gameState.turnOrder.length;
    count++;
  }
  gameState.currentTurnIndex = idx;
}

/** Shuffle array in place (Fisher–Yates). */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function initTurnOrder(room: Room): void {
  const order = room.players.map((p) => p.id);
  shuffle(order);
  room.gameState.turnOrder = order;
  room.gameState.currentTurnIndex = 0;
}
