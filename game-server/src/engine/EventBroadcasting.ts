import type { Room } from "../state/types.js";
import type { GameStateView, PlayerView } from "../state/types.js";
import { AVATAR_URLS, PLACEHOLDER_AVATAR_URL } from "./avatars.js";

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
    const isWinner = p.id === gameState.winnerId;
    const inLobby = gameState.phase === "lobby";
    const inGame = gameState.phase === "playing" || gameState.phase === "round_ended" || gameState.phase === "ended";
    const gameEnded = gameState.phase === "ended" || gameState.phase === "round_ended";
    // In lobby: show real avatar (players choose, no hidden identity yet).
    // In game: show real avatar when viewer is self, peeked, revealed, winner; when game ended, show all.
    if (p.avatarId && (inLobby || inGame)) {
      const showRealAvatar =
        inLobby || isSelf || isRevealed || isPeeked || isWinner || gameEnded;
      const url = showRealAvatar ? AVATAR_URLS[p.avatarId] : PLACEHOLDER_AVATAR_URL;
      if (url) view.avatarUrl = url;
    }
    if (inLobby && p.avatarId) view.avatarId = p.avatarId;
    if (isPeeked && gameState.peekedRoles?.[forPlayerId!]?.[p.id]) {
      view.role = gameState.peekedRoles[forPlayerId!][p.id];
    }
    if (gameState.eliminationsByPlayerId?.[p.id] != null) {
      view.eliminationsCount = gameState.eliminationsByPlayerId[p.id];
    }
    if (gameState.eliminatedAt?.[p.id] != null) {
      view.eliminatedAt = gameState.eliminatedAt[p.id];
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
    gameStartedAt: gameState.gameStartedAt,
    gameEndedAt: gameState.gameEndedAt,
    eliminationsByPlayerId: gameState.eliminationsByPlayerId ? { ...gameState.eliminationsByPlayerId } : undefined,
    eliminatedAt: gameState.eliminatedAt ? { ...gameState.eliminatedAt } : undefined,
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
    eliminationAnimationLock: gameState.eliminationAnimationLock,
    currentRound: gameState.currentRound,
    roundResults: gameState.roundResults ? [...gameState.roundResults] : undefined,
  };
}
