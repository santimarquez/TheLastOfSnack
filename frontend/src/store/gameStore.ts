import { create } from "zustand";
import type { GameStateView, PlayerView } from "@last-of-snack/shared";

export interface ChatMessage {
  playerId: string;
  displayName: string;
  text: string;
  isSpectator?: boolean;
}

export interface LobbySettings {
  speedMode: boolean;
  suspicionMeter: boolean;
}

/** Structured entry for the game action log; formatted with i18n in the UI. */
export type ActionLogEntry =
  | { id: string; kind: "turn"; playerName: string }
  | { id: string; kind: "draw"; playerName: string }
  | { id: string; kind: "play"; playerName: string; cardType: string }
  | { id: string; kind: "play_target"; playerName: string; targetName: string; cardType: string }
  | { id: string; kind: "eliminated"; playerName: string; roleName: string }
  | { id: string; kind: "game_over_winner"; winnerName: string }
  | { id: string; kind: "game_over_draw" };

interface GameStore {
  roomCode: string;
  playerId: string | null;
  displayName: string;
  reconnectToken: string | null;
  isHost: boolean;
  gameState: GameStateView | null;
  lobbySettings: LobbySettings;
  chatMessages: ChatMessage[];
  /** Log of in-game actions (turn, draw, play, eliminated, game over). */
  actionLog: ActionLogEntry[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  error: string | null;
  showEliminationModal: boolean;
  showAssigningTransition: boolean;
  showRoundTransition: boolean;
  roundTransitionRound: 1 | 2 | 3;
  showSettingsHelpModal: boolean;
  settingsHelpModalTab: "settings" | "how-to-play";
  joinFailed: boolean;
  /** When another player draws, we show a card flying from deck to their avatar. */
  drawAnimation: { playerId: string } | null;
  /** When Buffet is played, cards fly from deck to each active player. */
  buffetAnimation: { playerIds: string[] } | null;
  /** When Trade Seats is played, two avatars animate swapping positions. */
  tradeSeatsAnimation: { playerId1: string; playerId2: string } | null;
  /** Card flying from hand to discard (or to avatar for foil_wrap). */
  cardPlayedAnimation: {
    cardId: string;
    cardType: string;
    playerId: string;
    destination: "discard" | "avatar";
    /** Captured before state update; null for other players' cards. */
    startRect?: { left: number; top: number; width: number; height: number } | null;
  } | null;
  /** Foil wrap consumed: fly from avatar to discard. */
  shieldConsumedAnimation: { targetPlayerId: string } | null;
  /** Salt/Peek result notification - only for the player who used the card. */
  cardRevealNotification:
    | { type: "salt"; targetDisplayName: string; category: string }
    | { type: "peek"; targetDisplayName: string; snackName: string }
    | null;
  /** Active elimination animation - blocks UI until cleared. */
  eliminationAnimation: {
    playerId: string;
    cardType: string;
    snackId: string | null;
    displayName: string;
    avatarUrl: string;
  } | null;
  setJoined: (data: {
    playerId: string;
    roomCode: string;
    isHost: boolean;
    reconnectToken: string;
    gameState: GameStateView;
    lobbySettings?: LobbySettings;
  }) => void;
  setRoomUpdated: (players: PlayerView[], gameState: GameStateView, lobbySettings?: LobbySettings) => void;
  setGameStarted: (gameState: GameStateView) => void;
  setTurnStarted: (currentPlayerId: string, expiresAt: number, gameState: GameStateView) => void;
  setCardPlayed: (
    playerId: string,
    cardId: string,
    gameState: GameStateView,
    options?: {
      revealNotification?: GameStore["cardRevealNotification"];
      outcome?: string;
      targetId?: string;
      cardType?: string;
      startRect?: { left: number; top: number; width: number; height: number } | null;
    }
  ) => void;
  clearBuffetAnimation: () => void;
  clearTradeSeatsAnimation: () => void;
  clearCardPlayedAnimation: () => void;
  clearShieldConsumedAnimation: () => void;
  clearCardRevealNotification: () => void;
  setCardDrawn: (drawnByPlayerId: string, gameState: GameStateView) => void;
  clearDrawAnimation: () => void;
  setPlayerEliminated: (
    playerId: string,
    revealedRole: unknown,
    gameState: GameStateView,
    options?: { cardType?: string; snackId?: string | null; displayName?: string; avatarUrl?: string }
  ) => void;
  setEliminationAnimation: (data: GameStore["eliminationAnimation"]) => void;
  clearEliminationAnimation: () => void;
  /** When true, GameTable should expand the action log (e.g. from "View Rankings" in elimination pop-up) */
  requestExpandActionLog: boolean;
  setRequestExpandActionLog: (value: boolean) => void;
  setGameEnded: (winnerId: string | null, gameState: GameStateView) => void;
  addChat: (msg: ChatMessage) => void;
  setStateSync: (gameState: GameStateView) => void;
  addActionLogEntry: (entry: ActionLogEntry) => void;
  clearActionLog: () => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setError: (error: string | null) => void;
  setShowEliminationModal: (show: boolean) => void;
  setShowAssigningTransition: (show: boolean) => void;
  setShowRoundTransition: (show: boolean, round?: 1 | 2 | 3) => void;
  setShowSettingsHelpModal: (open: boolean, tab?: "settings" | "how-to-play") => void;
  setJoinFailed: (failed: boolean) => void;
  reset: () => void;
}

const initialGameState = (): GameStateView => ({
  phase: "lobby",
  turnOrder: [],
  currentTurnIndex: 0,
  deckCount: 0,
  eliminatedPlayerIds: [],
  winnerId: null,
  revealedRoles: {},
  revealedCategories: {},
  players: [],
});

export const useGameStore = create<GameStore>((set) => ({
  roomCode: "",
  playerId: null,
  displayName: "",
  reconnectToken: null,
  isHost: false,
  gameState: null,
  lobbySettings: { speedMode: false, suspicionMeter: false },
  chatMessages: [],
  actionLog: [],
  connectionStatus: "disconnected",
  error: null,
  showEliminationModal: false,
  showAssigningTransition: false,
  showRoundTransition: false,
  roundTransitionRound: 1,
  showSettingsHelpModal: false,
  settingsHelpModalTab: "settings",
  joinFailed: false,
  drawAnimation: null,
  buffetAnimation: null,
  tradeSeatsAnimation: null,
  cardPlayedAnimation: null,
  shieldConsumedAnimation: null,
  cardRevealNotification: null,
  eliminationAnimation: null,
  requestExpandActionLog: false,

  setJoined: (data) =>
    set({
      playerId: data.playerId,
      roomCode: data.roomCode,
      isHost: data.isHost,
      reconnectToken: data.reconnectToken,
      gameState: data.gameState,
      lobbySettings: data.lobbySettings ?? { speedMode: false, suspicionMeter: false },
      displayName: data.gameState.players?.find((p) => p.id === data.playerId)?.displayName ?? "",
      connectionStatus: "connected",
      error: null,
      joinFailed: false,
    }),

  setRoomUpdated: (players, gameState, lobbySettings) =>
    set((s) => ({
      gameState: { ...gameState, players },
      ...(lobbySettings != null ? { lobbySettings } : {}),
    })),

  setGameStarted: (gameState) =>
    set({ gameState, showAssigningTransition: true, actionLog: [] }),

  setTurnStarted: (_, __, gameState) =>
    set({ gameState, eliminationAnimation: null }),

  setCardPlayed: (playerId, cardId, gameState, options) =>
    set((s) => {
      const eliminated = new Set(gameState.eliminatedPlayerIds ?? []);
      const buffetPlayerIds =
        options?.outcome === "buffet"
          ? (gameState.players ?? [])
              .filter((p) => p.status === "active" && !eliminated.has(p.id))
              .map((p) => p.id)
          : null;
      const tradeSeats =
        options?.outcome === "swapped" && options?.targetId
          ? { playerId1: playerId, playerId2: options.targetId }
          : null;
      const cardType = (options?.cardType as string) ?? "card";
      const isFoilWrap = cardType === "foil_wrap";
      const cardPlayed =
        cardId && cardType
          ? {
              cardId,
              cardType,
              playerId,
              destination: (isFoilWrap ? "avatar" : "discard") as "discard" | "avatar",
              startRect: options?.startRect ?? undefined,
            }
          : null;
      const shieldConsumed =
        options?.outcome === "blocked" && options?.targetId
          ? { targetPlayerId: options.targetId }
          : null;
      return {
        gameState,
        ...(options?.revealNotification != null
          ? { cardRevealNotification: options.revealNotification }
          : {}),
        ...(buffetPlayerIds != null && buffetPlayerIds.length > 0
          ? { buffetAnimation: { playerIds: buffetPlayerIds } }
          : {}),
        ...(tradeSeats != null ? { tradeSeatsAnimation: tradeSeats } : {}),
        ...(cardPlayed != null ? { cardPlayedAnimation: cardPlayed } : {}),
        ...(shieldConsumed != null ? { shieldConsumedAnimation: shieldConsumed } : {}),
      };
    }),

  clearBuffetAnimation: () => set({ buffetAnimation: null }),

  clearTradeSeatsAnimation: () => set({ tradeSeatsAnimation: null }),

  clearCardPlayedAnimation: () => set({ cardPlayedAnimation: null }),

  clearShieldConsumedAnimation: () => set({ shieldConsumedAnimation: null }),

  clearCardRevealNotification: () => set({ cardRevealNotification: null }),

  setCardDrawn: (drawnByPlayerId, gameState) =>
    set((s) => ({
      gameState,
      drawAnimation:
        s.playerId !== drawnByPlayerId ? { playerId: drawnByPlayerId } : null,
    })),

  clearDrawAnimation: () => set({ drawAnimation: null }),

  setPlayerEliminated: (eliminatedPlayerId, _revealedRole, gameState, options) =>
    set((s) => ({
      gameState,
      showEliminationModal: s.playerId === eliminatedPlayerId ? true : s.showEliminationModal,
      eliminationAnimation:
        options?.cardType != null && options?.displayName != null && options?.avatarUrl != null
          ? {
              playerId: eliminatedPlayerId,
              cardType: options.cardType,
              snackId: options.snackId ?? null,
              displayName: options.displayName,
              avatarUrl: options.avatarUrl,
            }
          : null,
    })),

  setEliminationAnimation: (data) => set({ eliminationAnimation: data }),

  clearEliminationAnimation: () => set({ eliminationAnimation: null }),

  setRequestExpandActionLog: (value) => set({ requestExpandActionLog: value }),

  setGameEnded: (_, gameState) =>
    set({ gameState, eliminationAnimation: null }),

  addChat: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages.slice(-99), msg],
    })),

  setStateSync: (gameState) => set({ gameState }),

  addActionLogEntry: (entry) =>
    set((s) => ({
      actionLog: [...s.actionLog.slice(-199), entry],
    })),

  clearActionLog: () => set({ actionLog: [] }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error }),

  setShowEliminationModal: (show) => set({ showEliminationModal: show }),

  setShowAssigningTransition: (show) => set({ showAssigningTransition: show }),
  setShowRoundTransition: (show, round) =>
    set((s) => ({
      showRoundTransition: show,
      ...(round != null ? { roundTransitionRound: round } : {}),
    })),

  setShowSettingsHelpModal: (open, tab) =>
    set((s) => ({
      showSettingsHelpModal: open,
      ...(open && tab != null ? { settingsHelpModalTab: tab } : {}),
    })),

  setJoinFailed: (failed) => set({ joinFailed: failed }),

  reset: () =>
    set({
      roomCode: "",
      playerId: null,
      reconnectToken: null,
      isHost: false,
      gameState: null,
      lobbySettings: { speedMode: false, suspicionMeter: false },
      chatMessages: [],
      actionLog: [],
      connectionStatus: "disconnected",
      error: null,
      showEliminationModal: false,
      showAssigningTransition: false,
      showRoundTransition: false,
      roundTransitionRound: 1,
      showSettingsHelpModal: false,
      settingsHelpModalTab: "settings",
      joinFailed: false,
      drawAnimation: null,
      buffetAnimation: null,
      tradeSeatsAnimation: null,
      cardPlayedAnimation: null,
      shieldConsumedAnimation: null,
      cardRevealNotification: null,
      eliminationAnimation: null,
      requestExpandActionLog: false,
    }),
}));
