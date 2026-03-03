import type { Room } from "../state/types.js";
import * as RoomManager from "../rooms/RoomManager.js";
import { createShuffledDeck, dealHands, drawCard as drawFromDeck } from "./DeckSystem.js";
import { assignRoles } from "./IdentityAssignment.js";
import { initTurnOrder, getCurrentPlayerId, advanceTurn } from "./TurnSystem.js";
import {
  resolveCard,
  getWinnerBySnackPoints,
} from "./CardResolutionEngine.js";
import { cancelTurnTimer, startTurnTimer, getExpiresAt, cancelAllForRoom } from "./TimerSystem.js";
import { buildGameStateView } from "./EventBroadcasting.js";
import { AVATAR_URLS, PLACEHOLDER_AVATAR_URL } from "./avatars.js";
import { config } from "../config.js";

/** Send to all in room. If payloadFn is provided, call it per playerId and send that payload to that player's socket only. */
export type BroadcastFn = (
  roomCode: string,
  event: string,
  payloadOrPayloadFn: unknown | ((forPlayerId: string) => unknown)
) => void;

let broadcastFn: BroadcastFn | null = null;
let onBotTurnCheck: ((roomCode: string) => void) | null = null;

export function setBroadcast(broadcast: BroadcastFn): void {
  broadcastFn = broadcast;
}

export function setOnBotTurnCheck(fn: (roomCode: string) => void): void {
  onBotTurnCheck = fn;
}

function scheduleBotTurnIfNeeded(roomCode: string): void {
  onBotTurnCheck?.(roomCode);
}

function broadcast(roomCode: string, event: string, payload: unknown): void {
  broadcastFn?.(roomCode, event, payload);
}

export function canStartGame(room: Room): { ok: true } | { error: string } {
  if (room.gameState.phase !== "lobby") return { error: "Game already started" };
  const count = room.players.length;
  if (count < config.minPlayers) return { error: `Need at least ${config.minPlayers} players` };
  if (count > config.maxPlayers) return { error: `Max ${config.maxPlayers} players` };
  return { ok: true };
}

export function startGame(
  roomCode: string,
  hostPlayerId: string,
  settings?: { speedMode?: boolean }
): { ok: true } | { error: string } {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostPlayerId) return { error: "Only host can start" };
  const check = canStartGame(room);
  if ("error" in check) return check;

  if (settings?.speedMode !== undefined) {
    room.settings.speedMode = settings.speedMode;
    room.settings.turnTimeoutSec = settings.speedMode ? 20 : 60;
  }

  room.gameState.phase = "assigning";
  assignRoles(room.players);
  const deck = createShuffledDeck(room.players.length);
  const { hands, remainingDeck } = dealHands(deck, room.players.length);
  room.players.forEach((p, i) => (p.hand = hands[i] ?? []));
  room.gameState.deck = remainingDeck;
  room.gameState.discardPile = [];
  room.gameState.eliminationsByPlayerId = {};
  initTurnOrder(room);
  room.gameState.phase = "playing";
  room.gameState.currentTurnIndex = 0;
  room.gameState.gameStartedAt = Date.now();
  room.gameState.turnStartedAt = Date.now();
  room.gameState.currentTurnDrawn = false;
  const timeoutSec = room.settings.turnTimeoutSec;
  const currentId = getCurrentPlayerId(room);
  const currentPlayer = currentId ? room.players.find((p) => p.id === currentId) : null;
  if (currentId && !currentPlayer?.isBot) {
    startTurnTimer(roomCode, currentId, timeoutSec, () => onTurnTimeout(roomCode));
  }

  broadcastToRoomPerPlayer(roomCode, "game_started", (room, playerId) => ({ gameState: buildGameStateView(room, playerId) }));
  scheduleBotTurnIfNeeded(roomCode);
  return { ok: true };
}

function broadcastToRoomPerPlayer(roomCode: string, event: string, payloadFn: (room: Room, playerId: string) => unknown): void {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return;
  broadcast(roomCode, event, (forPlayerId: string) => payloadFn(room, forPlayerId));
}

export function playCard(
  roomCode: string,
  playerId: string,
  cardId: string,
  targetId?: string,
  discardedCardIds?: string[]
): { ok: true; result: import("./CardResolutionEngine.js").ResolutionResult } | { error: string } {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "playing") return { error: "Not in play" };
  if (room.gameState.eliminationAnimationLock) return { error: "Game paused during elimination animation" };
  const currentId = getCurrentPlayerId(room);
  if (currentId !== playerId) return { error: "Not your turn" };
  if (!room.gameState.currentTurnDrawn) return { error: "Draw a card first" };

  const result = resolveCard(room, playerId, cardId, targetId, discardedCardIds);
  if ("error" in result) return { error: result.error };

  cancelTurnTimer(roomCode, playerId);

  broadcastToRoomPerPlayer(roomCode, "card_played", (r, forPlayerId) => {
    const payload: Record<string, unknown> = {
      playerId,
      cardId,
      outcome: result.outcome,
      gameState: buildGameStateView(r, forPlayerId),
    };
    if (targetId) payload.targetId = targetId;
    if (forPlayerId === playerId) {
      if (result.saltReveal) {
        payload.revealNotification = { type: "salt", ...result.saltReveal };
      } else if (result.peekReveal) {
        payload.revealNotification = { type: "peek", ...result.peekReveal };
      }
    }
    return payload;
  });

  if (result.eliminated?.length) {
    if (!room.gameState.eliminationsByPlayerId) room.gameState.eliminationsByPlayerId = {};
    room.gameState.eliminationsByPlayerId[playerId] =
      (room.gameState.eliminationsByPlayerId[playerId] ?? 0) + result.eliminated.length;
    room.gameState.eliminationAnimationLock = true;
    const cardType = result.eliminationCardType ?? "eliminate";
    result.eliminated.forEach((id) => {
      const eliminatedPlayer = room.players.find((p) => p.id === id);
      const revealed = eliminatedPlayer?.role;
      const snackId = revealed?.id;
      const displayName = eliminatedPlayer?.displayName ?? "?";
      const avatarUrl = eliminatedPlayer?.avatarId
        ? AVATAR_URLS[eliminatedPlayer.avatarId] ?? PLACEHOLDER_AVATAR_URL
        : PLACEHOLDER_AVATAR_URL;
      broadcastToRoomPerPlayer(roomCode, "player_eliminated", (r, forPlayerId) => ({
        playerId: id,
        revealedRole: revealed,
        cardType,
        snackId: snackId ?? null,
        displayName,
        avatarUrl,
        gameState: buildGameStateView(r, forPlayerId),
      }));
    });
    if (result.revealed) {
      broadcastToRoomPerPlayer(roomCode, "room_updated", (r, forPlayerId) => ({
        players: buildGameStateView(r, forPlayerId).players,
        gameState: buildGameStateView(r, forPlayerId),
      }));
    }
    const animMs = config.eliminationAnimationMs;
    setTimeout(() => {
      finishEliminationAndAdvance(roomCode, result);
    }, animMs);
    return { ok: true, result };
  }

  if (result.revealed) {
    broadcastToRoomPerPlayer(roomCode, "room_updated", (r, forPlayerId) => ({
      players: buildGameStateView(r, forPlayerId).players,
      gameState: buildGameStateView(r, forPlayerId),
    }));
  }

  const winnerId = getWinnerBySnackPoints(room);
  if (winnerId) {
    room.gameState.phase = "ended";
    room.gameState.winnerId = winnerId;
    room.gameState.gameEndedAt = Date.now();
    broadcastToRoomPerPlayer(roomCode, "game_ended", (r, forPlayerId) => ({
      winnerId,
      gameState: buildGameStateView(r, forPlayerId),
    }));
    return { ok: true, result };
  }

  advanceTurn(room);
  room.gameState.turnStartedAt = Date.now();
  room.gameState.currentTurnDrawn = false;
  const nextId = getCurrentPlayerId(room);
  const nextPlayer = nextId ? room.players.find((p) => p.id === nextId) : null;
  if (nextId && !nextPlayer?.isBot) {
    startTurnTimer(roomCode, nextId, room.settings.turnTimeoutSec, () => onTurnTimeout(roomCode));
  }
  broadcastToRoomPerPlayer(roomCode, "turn_started", (r, forPlayerId) => ({
    currentPlayerId: nextId,
    expiresAt: getExpiresAt(r.settings.turnTimeoutSec),
    gameState: buildGameStateView(r, forPlayerId),
  }));
  scheduleBotTurnIfNeeded(roomCode);

  return { ok: true, result };
}

function finishEliminationAndAdvance(
  roomCode: string,
  result: import("./CardResolutionEngine.js").ResolutionResult
): void {
  const room = RoomManager.getRoom(roomCode);
  if (!room || room.gameState.phase !== "playing") return;
  room.gameState.eliminationAnimationLock = false;

  const winnerId = getWinnerBySnackPoints(room);
  if (winnerId) {
    room.gameState.phase = "ended";
    room.gameState.winnerId = winnerId;
    room.gameState.gameEndedAt = Date.now();
    broadcastToRoomPerPlayer(roomCode, "game_ended", (r, forPlayerId) => ({
      winnerId,
      gameState: buildGameStateView(r, forPlayerId),
    }));
    return;
  }

  advanceTurn(room);
  room.gameState.turnStartedAt = Date.now();
  room.gameState.currentTurnDrawn = false;
  const nextId = getCurrentPlayerId(room);
  const nextPlayer = nextId ? room.players.find((p) => p.id === nextId) : null;
  if (nextId && !nextPlayer?.isBot) {
    startTurnTimer(roomCode, nextId, room.settings.turnTimeoutSec, () => onTurnTimeout(roomCode));
  }
  broadcastToRoomPerPlayer(roomCode, "turn_started", (r, forPlayerId) => ({
    currentPlayerId: nextId,
    expiresAt: getExpiresAt(r.settings.turnTimeoutSec),
    gameState: buildGameStateView(r, forPlayerId),
  }));
  scheduleBotTurnIfNeeded(roomCode);
}

export function endTurn(roomCode: string, playerId: string): { ok: true } | { error: string } {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "playing") return { error: "Not in play" };
  if (room.gameState.eliminationAnimationLock) return { error: "Game paused during elimination animation" };
  const currentId = getCurrentPlayerId(room);
  if (currentId !== playerId) return { error: "Not your turn" };
  if (!room.gameState.currentTurnDrawn) return { error: "Draw a card first" };

  cancelTurnTimer(roomCode, playerId);
  const winnerId = getWinnerBySnackPoints(room);
  if (winnerId) {
    room.gameState.phase = "ended";
    room.gameState.winnerId = winnerId;
    room.gameState.gameEndedAt = Date.now();
    broadcastToRoomPerPlayer(roomCode, "game_ended", (r, forPlayerId) => ({
      winnerId,
      gameState: buildGameStateView(r, forPlayerId),
    }));
    return { ok: true };
  }
  advanceTurn(room);
  room.gameState.turnStartedAt = Date.now();
  room.gameState.currentTurnDrawn = false;
  const nextId = getCurrentPlayerId(room);
  const nextPlayer = nextId ? room.players.find((p) => p.id === nextId) : null;
  if (nextId && !nextPlayer?.isBot) {
    startTurnTimer(roomCode, nextId, room.settings.turnTimeoutSec, () => onTurnTimeout(roomCode));
  }
  broadcastToRoomPerPlayer(roomCode, "turn_started", (r, forPlayerId) => ({
    currentPlayerId: nextId,
    expiresAt: getExpiresAt(r.settings.turnTimeoutSec),
    gameState: buildGameStateView(r, forPlayerId),
  }));
  scheduleBotTurnIfNeeded(roomCode);
  return { ok: true };
}

export function drawCard(roomCode: string, playerId: string): { ok: true } | { error: string } {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "playing") return { error: "Not in play" };
  if (room.gameState.eliminationAnimationLock) return { error: "Game paused during elimination animation" };
  const currentId = getCurrentPlayerId(room);
  if (currentId !== playerId) return { error: "Not your turn" };
  if (room.gameState.currentTurnDrawn) return { error: "Already drew this turn" };
  if (room.gameState.deck.length === 0) return { error: "Deck is empty" };

  const result = drawFromDeck(room.gameState.deck);
  if (!result) return { error: "Deck is empty" };
  room.gameState.deck = result.remaining;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.hand.push(result.card);
  room.gameState.currentTurnDrawn = true;

  broadcastToRoomPerPlayer(roomCode, "card_drawn", (r, forPlayerId) => ({
    playerId,
    gameState: buildGameStateView(r, forPlayerId),
  }));
  scheduleBotTurnIfNeeded(roomCode);
  return { ok: true };
}

function onTurnTimeout(roomCode: string): void {
  const room = RoomManager.getRoom(roomCode);
  if (!room || room.gameState.phase !== "playing" || room.gameState.eliminationAnimationLock) return;
  const currentId = getCurrentPlayerId(room);
  if (!currentId) return;
  const winnerId = getWinnerBySnackPoints(room);
  if (winnerId) {
    room.gameState.phase = "ended";
    room.gameState.winnerId = winnerId;
    room.gameState.gameEndedAt = Date.now();
    broadcastToRoomPerPlayer(roomCode, "game_ended", (r, forPlayerId) => ({
      winnerId,
      gameState: buildGameStateView(r, forPlayerId),
    }));
    return;
  }
  advanceTurn(room);
  room.gameState.turnStartedAt = Date.now();
  room.gameState.currentTurnDrawn = false;
  const nextId = getCurrentPlayerId(room);
  const nextPlayer = nextId ? room.players.find((p) => p.id === nextId) : null;
  if (nextId && !nextPlayer?.isBot) {
    startTurnTimer(roomCode, nextId, room.settings.turnTimeoutSec, () => onTurnTimeout(roomCode));
  }
  broadcastToRoomPerPlayer(roomCode, "turn_started", (r, forPlayerId) => ({
    currentPlayerId: nextId,
    expiresAt: getExpiresAt(r.settings.turnTimeoutSec),
    gameState: buildGameStateView(r, forPlayerId),
  }));
  scheduleBotTurnIfNeeded(roomCode);
}

export function restartGame(roomCode: string, hostPlayerId: string): { ok: true } | { error: string } {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.hostId !== hostPlayerId) return { error: "Only host can restart" };
  if (room.gameState.phase !== "ended") return { error: "Game not ended" };

  room.gameState = {
    phase: "lobby",
    turnOrder: [],
    currentTurnIndex: 0,
    deck: [],
    eliminatedPlayerIds: [],
    winnerId: null,
    revealedRoles: {},
    revealedCategories: {},
    discardPile: [],
    eliminationsByPlayerId: {},
  };
  room.players.forEach((p) => {
    p.role = null;
    p.hand = [];
    p.status = "active";
  });
  cancelAllForRoom(roomCode);

  broadcastToRoomPerPlayer(roomCode, "room_updated", (r, forPlayerId) => ({
    players: buildGameStateView(r, forPlayerId).players,
    gameState: buildGameStateView(r, forPlayerId),
  }));
  return { ok: true };
}

export { buildGameStateView };
