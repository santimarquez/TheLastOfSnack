import type { GameStateView, PlayerView, Snack } from "./types.js";

/** Envelope for all WS messages */
export interface WSEnvelope<T = unknown> {
  type: string;
  payload: T;
}

// --- Client -> Server ---

export interface JoinPayload {
  roomCode: string;
  displayName: string;
  reconnectToken?: string;
}

export interface SetNamePayload {
  displayName: string;
}

export interface PlayCardPayload {
  cardId: string;
  targetId?: string;
}

export interface ChatPayload {
  text: string;
}

// --- Server -> Client ---

export interface JoinedPayload {
  playerId: string;
  roomCode: string;
  isHost: boolean;
  reconnectToken: string;
  gameState: GameStateView;
}

export interface RoomUpdatedPayload {
  players: PlayerView[];
  gameState: GameStateView;
}

export interface GameStartedPayload {
  gameState: GameStateView;
}

export interface TurnStartedPayload {
  currentPlayerId: string;
  expiresAt: number;
  gameState: GameStateView;
}

export interface CardPlayedPayload {
  playerId: string;
  cardId: string;
  outcome?: string;
}

export interface PlayerEliminatedPayload {
  playerId: string;
  revealedRole?: Snack;
  gameState: GameStateView;
}

export interface GameEndedPayload {
  winnerId: string | null;
  gameState: GameStateView;
}

export interface ChatMessagePayload {
  playerId: string;
  displayName: string;
  text: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface StateSyncPayload {
  gameState: GameStateView;
}
