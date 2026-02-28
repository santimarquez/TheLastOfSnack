import type { Room } from "../state/types.js";
import { eliminatePlayer } from "./SpectatorHandler.js";
import { drawCard } from "./DeckSystem.js";

/** Remove one shield/protection from target. Returns true if blocked. */
function consumeShield(room: Room, targetId: string): boolean {
  const arr = room.gameState.shieldedPlayerIds;
  if (!arr?.length) return false;
  const idx = arr.indexOf(targetId);
  if (idx < 0) return false;
  arr.splice(idx, 1);
  return true;
}

export interface ResolutionResult {
  eliminated?: string[];
  revealed?: { playerId: string };
  blocked?: { targetId: string };
  outcome?: string;
  /** Salt: notify only the player who used it (target is Sweet or Savory) */
  saltReveal?: { targetDisplayName: string; category: string };
  /** Peek: notify only the player who used it (target's snack name) */
  peekReveal?: { targetDisplayName: string; snackName: string };
}

export function resolveCard(
  room: Room,
  playerId: string,
  cardId: string,
  targetId?: string,
  discardedCardIds?: string[]
): ResolutionResult | { error: string } {
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return { error: "Card not in hand" };

  const card = player.hand[cardIndex];
  player.hand.splice(cardIndex, 1);

  if (!room.gameState.discardPile) room.gameState.discardPile = [];
  room.gameState.discardPile.push(card);

  const result: ResolutionResult = { outcome: "played" };

  switch (card.type) {
    case "microwave": {
      if (!targetId) return { error: "Microwave requires a target" };
      const target = room.players.find((p) => p.id === targetId);
      if (!target) return { error: "Target not found" };
      if (target.status !== "active") return { error: "Target is not active" };
      if (target.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, target.id)) {
        result.blocked = { targetId: target.id };
        result.outcome = "blocked";
      } else {
        const weakness = target.role?.weakness?.toLowerCase();
        if (weakness === "heat") {
          eliminatePlayer(room, target.id);
          result.eliminated = [target.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "freeze": {
      if (!targetId) return { error: "Freeze requires a target" };
      const freezeTarget = room.players.find((p) => p.id === targetId);
      if (!freezeTarget) return { error: "Target not found" };
      if (freezeTarget.status !== "active") return { error: "Target is not active" };
      if (freezeTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, freezeTarget.id)) {
        result.blocked = { targetId: freezeTarget.id };
        result.outcome = "blocked";
      } else {
        const freezeWeakness = freezeTarget.role?.weakness?.toLowerCase();
        if (freezeWeakness === "cold") {
          eliminatePlayer(room, freezeTarget.id);
          result.eliminated = [freezeTarget.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "salt": {
      if (!targetId) return { error: "Salt requires a target" };
      const saltTarget = room.players.find((p) => p.id === targetId);
      if (!saltTarget) return { error: "Target not found" };
      if (saltTarget.status !== "active") return { error: "Target is not active" };
      if (saltTarget.id === playerId) return { error: "Cannot target yourself" };
      const category = saltTarget.role?.category;
      if (category) {
        if (!room.gameState.revealedCategories) room.gameState.revealedCategories = {};
        room.gameState.revealedCategories[saltTarget.id] = category;
        result.revealed = { playerId: saltTarget.id };
        result.outcome = "revealed";
        result.saltReveal = { targetDisplayName: saltTarget.displayName, category };
      }
      break;
    }
    case "double_salt": {
      const donutPlayer = room.players.find((p) => p.status === "active" && p.role?.id === "donut");
      if (donutPlayer) {
        eliminatePlayer(room, donutPlayer.id);
        result.eliminated = [donutPlayer.id];
        result.outcome = "eliminated";
      }
      break;
    }
    case "shake": {
      const tacoPlayer = room.players.find((p) => p.status === "active" && p.role?.id === "taco");
      if (tacoPlayer) {
        if (consumeShield(room, tacoPlayer.id)) {
          result.blocked = { targetId: tacoPlayer.id };
          result.outcome = "blocked";
        } else {
          eliminatePlayer(room, tacoPlayer.id);
          result.eliminated = [tacoPlayer.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "spoil": {
      const burgerPlayer = room.players.find((p) => p.status === "active" && p.role?.id === "burger");
      if (burgerPlayer) {
        if (consumeShield(room, burgerPlayer.id)) {
          result.blocked = { targetId: burgerPlayer.id };
          result.outcome = "blocked";
        } else {
          eliminatePlayer(room, burgerPlayer.id);
          result.eliminated = [burgerPlayer.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "buffet": {
      const active = room.players.filter((p) => p.status === "active");
      let deck = room.gameState.deck;
      for (const p of active) {
        const drawn = drawCard(deck);
        if (!drawn) break;
        deck = drawn.remaining;
        p.hand.push(drawn.card);
      }
      room.gameState.deck = deck;
      result.outcome = "buffet";
      break;
    }
    case "trash": {
      if (!discardedCardIds || discardedCardIds.length !== 2) return { error: "Trash requires selecting 2 cards to discard" };
      const ids = new Set(discardedCardIds);
      if (ids.size !== 2) return { error: "Must select 2 different cards" };
      if (!room.gameState.discardPile) room.gameState.discardPile = [];
      for (const id of ids) {
        const idx = player.hand.findIndex((c) => c.id === id);
        if (idx === -1) return { error: "Selected card not in hand" };
        const discarded = player.hand[idx];
        player.hand.splice(idx, 1);
        room.gameState.discardPile.push(discarded);
      }
      result.outcome = "trash";
      break;
    }
    case "trade_seats": {
      const swapTarget = room.players.find((p) => p.id === targetId);
      if (!swapTarget) return { error: "Target not found" };
      if (swapTarget.status !== "active") return { error: "Target is not active" };
      if (swapTarget.id === playerId) return { error: "Cannot target yourself" };
      const playerRole = player.role;
      const playerAvatar = player.avatarId;
      player.role = swapTarget.role;
      player.avatarId = swapTarget.avatarId;
      swapTarget.role = playerRole;
      swapTarget.avatarId = playerAvatar;
      result.outcome = "swapped";
      break;
    }
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
    case "foil_wrap": {
      if (!room.gameState.shieldedPlayerIds) room.gameState.shieldedPlayerIds = [];
      room.gameState.shieldedPlayerIds.push(playerId);
      result.outcome = "shielded";
      break;
    }
    case "peek": {
      if (!targetId) return { error: "Peek requires a target" };
      const peekTarget = room.players.find((p) => p.id === targetId);
      if (!peekTarget) return { error: "Target not found" };
      if (peekTarget.status !== "active") return { error: "Target is not active" };
      if (peekTarget.id === playerId) return { error: "Cannot target yourself" };
      if (peekTarget.role) {
        if (!room.gameState.peekedRoles) room.gameState.peekedRoles = {};
        if (!room.gameState.peekedRoles[playerId]) room.gameState.peekedRoles[playerId] = {};
        room.gameState.peekedRoles[playerId][peekTarget.id] = peekTarget.role;
        result.peekReveal = {
          targetDisplayName: peekTarget.displayName,
          snackName: peekTarget.role.name,
        };
      }
      result.outcome = "peeked";
      break;
    }
    case "season":
    case "swap":
    default:
      result.outcome = "played";
  }

  room.gameState.lastAction = {
    type: "card_played",
    playerId,
    cardId: card.id,
    ...(targetId && { targetId }),
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
