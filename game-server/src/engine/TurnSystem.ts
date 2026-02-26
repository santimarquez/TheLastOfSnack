import type { Room } from "../state/types.js";

export function getCurrentPlayerId(room: Room): string | null {
  const { gameState } = room;
  if (gameState.phase !== "playing" || gameState.turnOrder.length === 0) return null;
  const activeOrder = gameState.turnOrder.filter((id) => !gameState.eliminatedPlayerIds.includes(id));
  if (activeOrder.length === 0) return null;
  const index = gameState.currentTurnIndex % activeOrder.length;
  return activeOrder[index] ?? null;
}

export function advanceTurn(room: Room): void {
  const { gameState } = room;
  const activeOrder = gameState.turnOrder.filter((id) => !gameState.eliminatedPlayerIds.includes(id));
  if (activeOrder.length === 0) return;
  gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
  let next = gameState.turnOrder[gameState.currentTurnIndex];
  while (gameState.eliminatedPlayerIds.includes(next)) {
    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
    next = gameState.turnOrder[gameState.currentTurnIndex];
  }
}

export function initTurnOrder(room: Room): void {
  const order = room.players.map((p) => p.id).sort(() => Math.random() - 0.5);
  room.gameState.turnOrder = order;
  room.gameState.currentTurnIndex = 0;
}
