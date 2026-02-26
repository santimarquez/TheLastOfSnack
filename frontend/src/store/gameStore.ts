import { create } from "zustand";
import type { GameStateView, PlayerView } from "@last-of-snack/shared";

export interface ChatMessage {
  playerId: string;
  displayName: string;
  text: string;
  isSpectator?: boolean;
}

interface GameStore {
  roomCode: string;
  playerId: string | null;
  displayName: string;
  reconnectToken: string | null;
  isHost: boolean;
  gameState: GameStateView | null;
  chatMessages: ChatMessage[];
  connectionStatus: "disconnected" | "connecting" | "connected";
  error: string | null;
  showEliminationModal: boolean;
  showAssigningTransition: boolean;
  showSettingsHelpModal: boolean;
  settingsHelpModalTab: "settings" | "how-to-play";
  joinFailed: boolean;
  setJoined: (data: {
    playerId: string;
    roomCode: string;
    isHost: boolean;
    reconnectToken: string;
    gameState: GameStateView;
  }) => void;
  setRoomUpdated: (players: PlayerView[], gameState: GameStateView) => void;
  setGameStarted: (gameState: GameStateView) => void;
  setTurnStarted: (currentPlayerId: string, expiresAt: number, gameState: GameStateView) => void;
  setCardPlayed: (playerId: string, cardId: string, gameState: GameStateView) => void;
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
  players: [],
});

export const useGameStore = create<GameStore>((set) => ({
  roomCode: "",
  playerId: null,
  displayName: "",
  reconnectToken: null,
  isHost: false,
  gameState: null,
  chatMessages: [],
  connectionStatus: "disconnected",
  error: null,
  showEliminationModal: false,
  showAssigningTransition: false,
  showSettingsHelpModal: false,
  settingsHelpModalTab: "settings",
  joinFailed: false,

  setJoined: (data) =>
    set({
      playerId: data.playerId,
      roomCode: data.roomCode,
      isHost: data.isHost,
      reconnectToken: data.reconnectToken,
      gameState: data.gameState,
      displayName: data.gameState.players?.find((p) => p.id === data.playerId)?.displayName ?? "",
      connectionStatus: "connected",
      error: null,
      joinFailed: false,
    }),

  setRoomUpdated: (players, gameState) =>
    set({
      gameState: { ...gameState, players },
    }),

  setGameStarted: (gameState) => set({ gameState, showAssigningTransition: true }),

  setTurnStarted: (_, __, gameState) => set({ gameState }),

  setCardPlayed: (_, __, gameState) => set({ gameState }),

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
      chatMessages: [],
      connectionStatus: "disconnected",
      error: null,
      showEliminationModal: false,
      showAssigningTransition: false,
      showSettingsHelpModal: false,
      settingsHelpModalTab: "settings",
      joinFailed: false,
    }),
}));
