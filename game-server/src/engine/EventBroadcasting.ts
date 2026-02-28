import type { Room } from "../state/types.js";
import type { GameStateView, PlayerView } from "../state/types.js";
import { AVATAR_URLS } from "./avatars.js";

export function buildGameStateView(room: Room, forPlayerId: string | null): GameStateView {
  const { gameState } = room;
  const players: PlayerView[] = room.players.map((p) => {
    const view: PlayerView = {
      id: p.id,
      displayName: p.displayName,
      status: p.status,
      isHost: p.isHost,
      joinedAt: p.joinedAt,
      isBot: p.isBot,
    };
    if (p.id === forPlayerId) {
      view.role = p.role ?? undefined;
      view.hand = p.hand.length > 0 ? p.hand : undefined;
    }
    const isSelf = p.id === forPlayerId;
    const isRevealed = Boolean(gameState.revealedRoles[p.id]);
    const isPeeked = Boolean(forPlayerId && gameState.peekedRoles?.[forPlayerId]?.[p.id]);
    const inLobby = gameState.phase === "lobby";
    const inGame = gameState.phase === "playing" || gameState.phase === "ended";
    if (p.avatarId && (inLobby || inGame || isSelf || isRevealed || isPeeked)) {
      const url = AVATAR_URLS[p.avatarId];
      if (url) view.avatarUrl = url;
    }
    if (inLobby && p.avatarId) view.avatarId = p.avatarId;
    if (isPeeked && gameState.peekedRoles?.[forPlayerId!]?.[p.id]) {
      view.role = gameState.peekedRoles[forPlayerId!][p.id];
    }
    return view;
  });

  return {
    phase: gameState.phase,
    turnOrder: gameState.turnOrder,
    currentTurnIndex: gameState.currentTurnIndex,
    deckCount: gameState.deck.length,
    eliminatedPlayerIds: [...gameState.eliminatedPlayerIds],
    winnerId: gameState.winnerId,
    lastAction: gameState.lastAction,
    turnStartedAt: gameState.turnStartedAt,
    turnTimeoutSec: room.settings.turnTimeoutSec,
    currentTurnDrawn: gameState.currentTurnDrawn,
    revealedRoles: { ...gameState.revealedRoles },
    revealedCategories: gameState.revealedCategories ? { ...gameState.revealedCategories } : undefined,
    peekedRoles: forPlayerId && gameState.peekedRoles?.[forPlayerId] ? { ...gameState.peekedRoles[forPlayerId] } : undefined,
    shieldedPlayerIds: gameState.shieldedPlayerIds ? [...gameState.shieldedPlayerIds] : undefined,
    discardPile: gameState.discardPile ? [...gameState.discardPile] : undefined,
    players,
  };
}
