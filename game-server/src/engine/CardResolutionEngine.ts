import type { Room } from "../state/types.js";
import { eliminatePlayer } from "./SpectatorHandler.js";
import { drawCard } from "./DeckSystem.js";

/** Remove one shield/protection from target. Returns true if blocked. */
function consumeShield(room: Room, targetId: string): boolean {
  const arr = room.gameState.shieldedPlayerIds;
  if (!arr?.length) return false;
  const idx = arr.indexOf(targetId);
  if (idx < 0) return false;
  const shieldedCards = room.gameState.shieldedCards;
  if (shieldedCards?.length && idx < shieldedCards.length) {
    const consumedCard = shieldedCards.splice(idx, 1)[0];
    if (consumedCard && room.gameState.discardPile) room.gameState.discardPile.push(consumedCard);
  }
  arr.splice(idx, 1);
  return true;
}

export interface ResolutionResult {
  eliminated?: string[];
  /** Card type that caused elimination (for animation) */
  eliminationCardType?: string;
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
  const isFoilWrap = card.type === "foil_wrap";
  const deferDiscardForTrash = card.type === "trash";
  if (!isFoilWrap && !deferDiscardForTrash) room.gameState.discardPile.push(card);

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
      if (consumeShield(room, saltTarget.id)) {
        result.blocked = { targetId: saltTarget.id };
        result.outcome = "blocked";
        break;
      }
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
      if (!targetId) return { error: "Double Salt requires a target" };
      const doubleSaltTarget = room.players.find((p) => p.id === targetId);
      if (!doubleSaltTarget) return { error: "Target not found" };
      if (doubleSaltTarget.status !== "active") return { error: "Target is not active" };
      if (doubleSaltTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, doubleSaltTarget.id)) {
        result.blocked = { targetId: doubleSaltTarget.id };
        result.outcome = "blocked";
      } else if (doubleSaltTarget.role?.id === "donut") {
        eliminatePlayer(room, doubleSaltTarget.id);
        result.eliminated = [doubleSaltTarget.id];
        result.outcome = "eliminated";
      }
      break;
    }
    case "shake": {
      if (!targetId) return { error: "Shake requires a target" };
      const shakeTarget = room.players.find((p) => p.id === targetId);
      if (!shakeTarget) return { error: "Target not found" };
      if (shakeTarget.status !== "active") return { error: "Target is not active" };
      if (shakeTarget.id === playerId) return { error: "Cannot target yourself" };
      if (shakeTarget.role?.id === "taco") {
        if (consumeShield(room, shakeTarget.id)) {
          result.blocked = { targetId: shakeTarget.id };
          result.outcome = "blocked";
        } else {
          eliminatePlayer(room, shakeTarget.id);
          result.eliminated = [shakeTarget.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "steam": {
      if (!targetId) return { error: "Steam requires a target" };
      const steamTarget = room.players.find((p) => p.id === targetId);
      if (!steamTarget) return { error: "Target not found" };
      if (steamTarget.status !== "active") return { error: "Target is not active" };
      if (steamTarget.id === playerId) return { error: "Cannot target yourself" };
      if (steamTarget.role?.id === "fries") {
        if (consumeShield(room, steamTarget.id)) {
          result.blocked = { targetId: steamTarget.id };
          result.outcome = "blocked";
        } else {
          eliminatePlayer(room, steamTarget.id);
          result.eliminated = [steamTarget.id];
          result.outcome = "eliminated";
        }
      }
      break;
    }
    case "spoil": {
      if (!targetId) return { error: "Spoil requires a target" };
      const spoilTarget = room.players.find((p) => p.id === targetId);
      if (!spoilTarget) return { error: "Target not found" };
      if (spoilTarget.status !== "active") return { error: "Target is not active" };
      if (spoilTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, spoilTarget.id)) {
        result.blocked = { targetId: spoilTarget.id };
        result.outcome = "blocked";
      } else if (spoilTarget.role?.id === "burger") {
        eliminatePlayer(room, spoilTarget.id);
        result.eliminated = [spoilTarget.id];
        result.outcome = "eliminated";
      }
      break;
    }
    case "buffet": {
      const active = room.players.filter((p) => p.status === "active");
      // Player who played gets a card too: put them first so they're not skipped if deck runs out
      const caster = active.find((p) => p.id === playerId);
      const others = active.filter((p) => p.id !== playerId);
      const ordered = caster ? [caster, ...others] : active;
      let deck = room.gameState.deck;
      for (const p of ordered) {
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
      if (!targetId) return { error: "Trash requires a target" };
      const trashTarget = room.players.find((p) => p.id === targetId);
      if (!trashTarget) return { error: "Target not found" };
      if (trashTarget.status !== "active") return { error: "Target is not active" };
      if (trashTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, trashTarget.id)) {
        result.blocked = { targetId: trashTarget.id };
        result.outcome = "blocked";
        room.gameState.discardPile!.push(card);
        break;
      }
      const toDiscard = 2;
      const hand = trashTarget.hand;
      if (hand.length < toDiscard) return { error: "Target has fewer than 2 cards to discard" };
      if (!room.gameState.discardPile) room.gameState.discardPile = [];
      for (let i = 0; i < toDiscard && hand.length > 0; i++) {
        const idx = Math.floor(Math.random() * hand.length);
        const discarded = hand.splice(idx, 1)[0];
        if (discarded) room.gameState.discardPile.push(discarded);
      }
      room.gameState.discardPile.push(card);
      result.outcome = "trash";
      break;
    }
    case "trade_seats": {
      if (!targetId) return { error: "Trade Seats requires a target" };
      const swapTarget = room.players.find((p) => p.id === targetId);
      if (!swapTarget) return { error: "Target not found" };
      if (swapTarget.status !== "active") return { error: "Target is not active" };
      if (swapTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, swapTarget.id)) {
        result.blocked = { targetId: swapTarget.id };
        result.outcome = "blocked";
        break;
      }
      const playerRole = player.role;
      const playerAvatar = player.avatarId;
      player.role = swapTarget.role;
      player.avatarId = swapTarget.avatarId;
      swapTarget.role = playerRole;
      swapTarget.avatarId = playerAvatar;
      // Salt-revealed category moves with the identity: swap revealedCategories for the two players
      if (room.gameState.revealedCategories) {
        const a = room.gameState.revealedCategories[player.id];
        const b = room.gameState.revealedCategories[swapTarget.id];
        if (a !== undefined) room.gameState.revealedCategories[swapTarget.id] = a;
        else delete room.gameState.revealedCategories[swapTarget.id];
        if (b !== undefined) room.gameState.revealedCategories[player.id] = b;
        else delete room.gameState.revealedCategories[player.id];
      }
      // Clear peeked data for both players since identities changed
      if (room.gameState.peekedRoles) {
        for (const viewerId of Object.keys(room.gameState.peekedRoles)) {
          delete room.gameState.peekedRoles[viewerId][player.id];
          delete room.gameState.peekedRoles[viewerId][swapTarget.id];
        }
      }
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
      if (!room.gameState.shieldedCards) room.gameState.shieldedCards = [];
      room.gameState.shieldedPlayerIds.push(playerId);
      room.gameState.shieldedCards.push(card);
      result.outcome = "shielded";
      break;
    }
    case "peek": {
      if (!targetId) return { error: "Peek requires a target" };
      const peekTarget = room.players.find((p) => p.id === targetId);
      if (!peekTarget) return { error: "Target not found" };
      if (peekTarget.status !== "active") return { error: "Target is not active" };
      if (peekTarget.id === playerId) return { error: "Cannot target yourself" };
      if (consumeShield(room, peekTarget.id)) {
        result.blocked = { targetId: peekTarget.id };
        result.outcome = "blocked";
        break;
      }
      if (peekTarget.role) {
        if (!room.gameState.peekedRoles) room.gameState.peekedRoles = {};
        if (!room.gameState.peekedRoles[playerId]) room.gameState.peekedRoles[playerId] = {};
        room.gameState.peekedRoles[playerId][peekTarget.id] = peekTarget.role;
      }
      result.peekReveal = {
        targetDisplayName: peekTarget.displayName,
        snackName: peekTarget.role?.name ?? "?",
      };
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
  if (result.eliminated?.length) result.eliminationCardType = card.type;
  return result;
}

/** Snack points formula: 50 + 10*eliminations + 1 per 10s survived */
function computeSnackPoints(
  room: Room,
  playerId: string,
  gameEndedAt: number
): number {
  const gs = room.gameState;
  const eliminations = gs.eliminationsByPlayerId?.[playerId] ?? 0;
  const gameStartedAt = gs.gameStartedAt ?? gameEndedAt;
  const eliminatedAt = gs.eliminatedAt?.[playerId];
  const survivalMs = eliminatedAt != null
    ? eliminatedAt - gameStartedAt
    : gameEndedAt - gameStartedAt;
  let pts = 50;
  pts += eliminations * 10;
  pts += Math.floor((Number.isFinite(survivalMs) ? survivalMs : 0) / 10_000);
  return pts;
}

/**
 * Round winner: last snack standing wins. If more than one standing, highest Snack points wins.
 */
export function getWinnerBySnackPoints(room: Room): string | null {
  const gs = room.gameState;
  const standing = room.players.filter(
    (p) => !gs.eliminatedPlayerIds.includes(p.id)
  );
  const deckEmpty = gs.deck.length === 0;
  const allEliminated = room.players.length > 0 && standing.length === 0;

  if (standing.length === 1) return standing[0]!.id;
  if (!deckEmpty && !allEliminated) return null;

  const gameEndedAt = Date.now();
  let bestId: string | null = null;
  let bestPts = -1;
  for (const p of room.players) {
    const pts = computeSnackPoints(room, p.id, gameEndedAt);
    if (pts > bestPts) {
      bestPts = pts;
      bestId = p.id;
    }
  }
  return bestId;
}

/** Compute snack points for one player in one round from RoundResult. */
function computeSnackPointsFromRoundResult(
  room: Room,
  playerId: string,
  rr: { eliminationsByPlayerId?: Record<string, number>; eliminatedAt?: Record<string, number>; gameStartedAt: number; gameEndedAt: number; winnerId: string }
): number {
  const eliminations = rr.eliminationsByPlayerId?.[playerId] ?? 0;
  const eliminatedAt = rr.eliminatedAt?.[playerId];
  const isWinner = rr.winnerId === playerId;
  const survivalMs = isWinner
    ? rr.gameEndedAt - rr.gameStartedAt
    : eliminatedAt != null
      ? eliminatedAt - rr.gameStartedAt
      : 0;
  let pts = 50;
  pts += eliminations * 10;
  pts += Math.floor((Number.isFinite(survivalMs) ? survivalMs : 0) / 10_000);
  if (isWinner) pts += 20;
  return pts;
}

/**
 * Match winner (3 rounds): player with most total Snack points across all roundResults.
 * Use when phase goes to "ended" after round 3.
 */
export function getMatchWinnerByTotalSnackPoints(room: Room): string | null {
  const roundResults = room.gameState.roundResults;
  if (!roundResults?.length) return getWinnerBySnackPoints(room);
  let bestId: string | null = null;
  let bestTotal = -1;
  for (const p of room.players) {
    let total = 0;
    for (const rr of roundResults) {
      total += computeSnackPointsFromRoundResult(room, p.id, rr);
    }
    if (total > bestTotal) {
      bestTotal = total;
      bestId = p.id;
    }
  }
  return bestId;
}
