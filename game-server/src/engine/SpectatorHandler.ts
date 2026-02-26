import type { Room } from "../state/types.js";

export function eliminatePlayer(room: Room, playerId: string): void {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return;
  player.status = "spectator";
  if (!room.gameState.eliminatedPlayerIds.includes(playerId)) {
    room.gameState.eliminatedPlayerIds.push(playerId);
  }
}

export function isEliminated(room: Room, playerId: string): boolean {
  return room.gameState.eliminatedPlayerIds.includes(playerId);
}
