import type { Room } from "../state/types.js";
import * as RoomManager from "../rooms/RoomManager.js";
import * as GameEngine from "./GameEngine.js";
import { getCurrentPlayerId } from "./TurnSystem.js";

/** Card metadata for bot decisions. Bots only know public info + own hand. */
const CARD_META: Record<string, { requiresTarget: boolean; requiresDiscardCards?: number }> = {
  microwave: { requiresTarget: true },
  freeze: { requiresTarget: true },
  salt: { requiresTarget: true },
  double_salt: { requiresTarget: true },
  shake: { requiresTarget: true },
  steam: { requiresTarget: true },
  spoil: { requiresTarget: true },
  buffet: { requiresTarget: false },
  trash: { requiresTarget: true },
  trade_seats: { requiresTarget: true },
  foil_wrap: { requiresTarget: false },
  peek: { requiresTarget: true },
};

const BOT_DRAW_DELAY_MS = 800;
/** Wait 3 seconds after drawing before playing or ending turn. */
const BOT_DELAY_AFTER_DRAW_MS = 3000;
/** When only bots remain, use shorter delays so the game finishes quickly. */
const BOT_DELAY_AFTER_DRAW_MS_BOTS_ONLY = 600;
const BOT_DRAW_DELAY_MS_BOTS_ONLY = 300;

export function runBotTurn(roomCode: string): void {
  const room = RoomManager.getRoom(roomCode);
  if (!room || room.gameState.phase !== "playing" || room.gameState.eliminationAnimationLock || room.gameState.roundTransitionLock) return;

  const currentId = getCurrentPlayerId(room);
  if (!currentId) return;

  const player = room.players.find((p) => p.id === currentId);
  if (!player?.isBot) return;

  const { gameState } = room;
  const activeHumans = room.players.filter(
    (p) => p.status === "active" && !gameState.eliminatedPlayerIds.includes(p.id) && !p.isBot
  );
  const botsOnly = activeHumans.length === 0;
  const drawDelayMs = botsOnly ? BOT_DRAW_DELAY_MS_BOTS_ONLY : BOT_DRAW_DELAY_MS;
  const afterDrawDelayMs = botsOnly ? BOT_DELAY_AFTER_DRAW_MS_BOTS_ONLY : BOT_DELAY_AFTER_DRAW_MS;

  if (!gameState.currentTurnDrawn) {
    if (room.gameState.deck.length === 0) return;
    setTimeout(() => {
      GameEngine.drawCard(roomCode, currentId);
    }, drawDelayMs);
    return;
  }

  const hand = player.hand;
  if (hand.length === 0) {
    setTimeout(() => {
      GameEngine.endTurn(roomCode, currentId);
    }, afterDrawDelayMs);
    return;
  }

  const validTargets = room.players.filter(
    (p) => p.id !== currentId && p.status === "active" && !gameState.eliminatedPlayerIds.includes(p.id)
  );

  const playableCards = hand.filter((card) => {
    const meta = CARD_META[card.type] ?? { requiresTarget: false };
    if (meta.requiresTarget && validTargets.length === 0) return false;
    if (meta.requiresDiscardCards && hand.length <= meta.requiresDiscardCards) return false;
    return true;
  });

  const shouldPlay = playableCards.length > 0 && Math.random() < 0.7;

  if (shouldPlay && playableCards.length > 0) {
    const card = playableCards[Math.floor(Math.random() * playableCards.length)];
    const meta = CARD_META[card.type] ?? { requiresTarget: false };

    let targetId: string | undefined;
    let discardedCardIds: string[] | undefined;

    if (meta.requiresTarget && validTargets.length > 0) {
      targetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
    }
    if (meta.requiresDiscardCards && hand.length > meta.requiresDiscardCards) {
      const others = hand.filter((c) => c.id !== card.id);
      const toDiscard = meta.requiresDiscardCards;
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      discardedCardIds = shuffled.slice(0, toDiscard).map((c) => c.id);
    }

    setTimeout(() => {
      const result = GameEngine.playCard(roomCode, currentId, card.id, targetId, discardedCardIds);
      if ("error" in result) {
        GameEngine.endTurn(roomCode, currentId);
      }
    }, afterDrawDelayMs);
  } else {
    setTimeout(() => {
      GameEngine.endTurn(roomCode, currentId);
    }, afterDrawDelayMs);
  }
}
