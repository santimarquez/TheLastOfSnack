import type { Room } from "../state/types.js";
import { eliminatePlayer } from "./SpectatorHandler.js";

export interface ResolutionResult {
  eliminated?: string[];
  revealed?: { playerId: string };
  outcome?: string;
}

export function resolveCard(
  room: Room,
  playerId: string,
  cardId: string
): ResolutionResult | { error: string } {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { error: "Card not in hand" };

  const card = player.hand[cardIndex];
  player.hand.splice(cardIndex, 1);

  const result: ResolutionResult = { outcome: "played" };

  switch (card.type) {
    case "reveal": {
      if (!room.gameState.revealedRoles[playerId]) {
        room.gameState.revealedRoles[playerId] = player.role!;
      }
      result.revealed = { playerId };
      result.outcome = "revealed";
      break;
    }
    case "eliminate": {
      const active = room.players.filter(
        (p) => p.status === "active" && p.id !== playerId
      );
      if (active.length > 0) {
        const target = active[Math.floor(Math.random() * active.length)];
        eliminatePlayer(room, target.id);
        result.eliminated = [target.id];
        result.outcome = "eliminated";
      }
      break;
    }
    case "season":
    case "peek":
    case "swap":
    default:
      result.outcome = "played";
  }

  room.gameState.lastAction = {
    type: "card_played",
    playerId,
    cardId: card.id,
  };
  return result;
}

export function checkWinCondition(room: Room): string | null {
  const activeSnacks = room.players.filter(
    (p) =>
      p.status === "active" &&
      p.role &&
      !room.gameState.eliminatedPlayerIds.includes(p.id)
  );
  const lastSnacksRemaining = activeSnacks.filter((p) => p.role?.isLastSnack);
  if (lastSnacksRemaining.length === 1) return lastSnacksRemaining[0].id;
  if (activeSnacks.length === 1) return activeSnacks[0].id;
  return null;
}
