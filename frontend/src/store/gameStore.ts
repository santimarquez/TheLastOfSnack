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

interface GameStore {
  roomCode: string;
  playerId: string | null;
  displayName: string;
  reconnectToken: string | null;
  isHost: boolean;
  gameState: GameStateView | null;
  lobbySettings: LobbySettings;
  chatMessages: ChatMessage[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  error: string | null;
  showEliminationModal: boolean;
  showAssigningTransition: boolean;
  showSettingsHelpModal: boolean;
  settingsHelpModalTab: "settings" | "how-to-play";
  joinFailed: boolean;
  /** When another player draws, we show a card flying from deck to their avatar. */
  drawAnimation: { playerId: string } | null;
  /** When Buffet is played, cards fly from deck to each active player. */
  buffetAnimation: { playerIds: string[] } | null;
  /** Salt/Peek result notification - only for the player who used the card. */
  cardRevealNotification:
    | { type: "salt"; targetDisplayName: string; category: string }
    | { type: "peek"; targetDisplayName: string; snackName: string }
    | null;
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
    options?: { revealNotification?: GameStore["cardRevealNotification"]; outcome?: string }
  ) => void;
  clearBuffetAnimation: () => void;
  clearCardRevealNotification: () => void;
  setCardDrawn: (drawnByPlayerId: string, gameState: GameStateView) => void;
  clearDrawAnimation: () => void;
  setPlayerEliminated: (playerId: string, revealedRole: unknown, gameState: GameStateView) => void;
  setGameEnded: (winnerId: string | null, gameState: GameStateView) => void;
  addChat: (msg: ChatMessage) => void;
  setStateSync: (gameState: GameStateView) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setError: (error: string | null) => void;
  setShowEliminationModal: (show: boolean) => void;
  setShowAssigningTransition: (show: boolean) => void;
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
  connectionStatus: "disconnected",
  error: null,
  showEliminationModal: false,
  showAssigningTransition: false,
  showSettingsHelpModal: false,
  settingsHelpModalTab: "settings",
  joinFailed: false,
  drawAnimation: null,
  buffetAnimation: null,
  cardRevealNotification: null,

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

  setGameStarted: (gameState) => set({ gameState, showAssigningTransition: true }),

  setTurnStarted: (_, __, gameState) => set({ gameState }),

  setCardPlayed: (_, __, gameState, options) =>
    set((s) => {
      const eliminated = new Set(gameState.eliminatedPlayerIds ?? []);
      const buffetPlayerIds =
        options?.outcome === "buffet"
          ? (gameState.players ?? [])
              .filter((p) => p.status === "active" && !eliminated.has(p.id))
              .map((p) => p.id)
          : null;
      return {
        gameState,
        ...(options?.revealNotification != null
          ? { cardRevealNotification: options.revealNotification }
          : {}),
        ...(buffetPlayerIds != null && buffetPlayerIds.length > 0
          ? { buffetAnimation: { playerIds: buffetPlayerIds } }
          : {}),
      };
    }),

  clearBuffetAnimation: () => set({ buffetAnimation: null }),

  clearCardRevealNotification: () => set({ cardRevealNotification: null }),

  setCardDrawn: (drawnByPlayerId, gameState) =>
    set((s) => ({
      gameState,
      drawAnimation:
        s.playerId !== drawnByPlayerId ? { playerId: drawnByPlayerId } : null,
    })),

  clearDrawAnimation: () => set({ drawAnimation: null }),

  setPlayerEliminated: (eliminatedPlayerId, _revealedRole, gameState) =>
    set((s) => ({
      gameState,
      showEliminationModal: s.playerId === eliminatedPlayerId ? true : s.showEliminationModal,
    })),

  setGameEnded: (_, gameState) => set({ gameState }),

  addChat: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages.slice(-99), msg],
    })),

  setStateSync: (gameState) => set({ gameState }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (error) => set({ error }),

  setShowEliminationModal: (show) => set({ showEliminationModal: show }),

  setShowAssigningTransition: (show) => set({ showAssigningTransition: show }),

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
      connectionStatus: "disconnected",
      error: null,
      showEliminationModal: false,
      showAssigningTransition: false,
      showSettingsHelpModal: false,
      settingsHelpModalTab: "settings",
      joinFailed: false,
      drawAnimation: null,
      buffetAnimation: null,
      cardRevealNotification: null,
    }),
}));
