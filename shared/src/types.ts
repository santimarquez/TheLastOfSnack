/** Snack role (hidden identity). Server-only for assignment; client gets only own role. */
export interface Snack {
  id: string;
  name: string;
  isLastSnack: boolean;
  /** e.g. "Savory" | "Sweet" */
  category?: string;
  /** What defeats this snack, e.g. "Cold" */
  weakness?: string;
  /** How they are eliminated, e.g. "❄️ Freeze" */
  eliminatedBy?: string;
}

/** Card definition. Client gets id + type for display; effect applied on server. */
export interface Card {
  id: string;
  type: string;
}

/** Optional suspicion system (MVP: structure only). */
export interface SuspicionSystem {
  scores: Record<string, number>;
  threshold: number;
}

/** Last action for UI animation. */
export interface LastAction {
  type: "card_played" | "player_eliminated" | "turn_advanced";
  playerId?: string;
  cardId?: string;
  targetId?: string;
}

export type GamePhase = "lobby" | "assigning" | "playing" | "ended";
export type PlayerStatus = "active" | "eliminated" | "spectator" | "disconnected";

/** Player (server model). Client view omits role and hand for other players. */
export interface Player {
  id: string;
  displayName: string;
  socketId: string | null;
  role: Snack | null;
  hand: Card[];
  status: PlayerStatus;
  isHost: boolean;
  joinedAt: number;
  reconnectToken?: string;
  /** Unique avatar id for this game (e.g. pizza_1). No two players share the same avatar. */
  avatarId?: string | null;
  /** True if this player is an AI bot */
  isBot?: boolean;
}

/** Game state (server). Client receives a view: deck count, public info, own hand/role only. */
export interface GameState {
  phase: GamePhase;
  turnOrder: string[];
  currentTurnIndex: number;
  deck: Card[];
  eliminatedPlayerIds: string[];
  winnerId: string | null;
  suspicionMeter?: SuspicionSystem;
  lastAction?: LastAction;
  turnStartedAt?: number;
  /** True when current player has drawn their mandatory card this turn */
  currentTurnDrawn?: boolean;
  /** Revealed roles (playerId -> Snack) - public after reveal */
  revealedRoles: Record<string, Snack>;
  /** Revealed categories only (playerId -> "Sweet"|"Savory") - from Salt card */
  revealedCategories?: Record<string, string>;
  /** Peeked roles: viewerId -> targetId -> Snack (private to viewer) */
  peekedRoles?: Record<string, Record<string, Snack>>;
  /** Foil Wrap protection: each occurrence = one attack blocked (stackable) */
  shieldedPlayerIds?: string[];
  /** Discarded/played cards (face up on table) */
  discardPile?: Card[];
}

/** Room settings */
export interface RoomSettings {
  turnTimeoutSec: number;
  speedMode?: boolean;
  suspicionMeter?: boolean;
}

/** Room entity */
export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  gameState: GameState;
  createdAt: number;
  settings: RoomSettings;
}

/** Client-safe player view: no role/hand for others */
export interface PlayerView {
  id: string;
  displayName: string;
  status: PlayerStatus;
  isHost: boolean;
  joinedAt: number;
  role?: Snack;
  hand?: Card[];
  /** Avatar image URL; included for self and for revealed (eliminated) players. */
  avatarUrl?: string;
  /** Avatar id (e.g. pizza_1); exposed in lobby so client can show which are taken. */
  avatarId?: string | null;
  /** True if this player is an AI bot */
  isBot?: boolean;
}

/** Client-safe game state view */
export interface GameStateView {
  phase: GamePhase;
  turnOrder: string[];
  currentTurnIndex: number;
  deckCount: number;
  eliminatedPlayerIds: string[];
  winnerId: string | null;
  lastAction?: LastAction;
  turnStartedAt?: number;
  /** Turn duration in seconds (20 for speed mode, 60 for normal). */
  turnTimeoutSec?: number;
  /** True when current player has drawn their mandatory card this turn */
  currentTurnDrawn?: boolean;
  revealedRoles: Record<string, Snack>;
  /** Revealed categories (playerId -> "Sweet"|"Savory") */
  revealedCategories?: Record<string, string>;
  /** Peeked roles (targetId -> Snack) - only for this viewer, from Peek card */
  peekedRoles?: Record<string, Snack>;
  /** Foil Wrap protection: each occurrence = one attack blocked (stackable) */
  shieldedPlayerIds?: string[];
  /** Top of discard pile (cards played/discarded, face up) */
  discardPile?: Card[];
  players: PlayerView[];
}
