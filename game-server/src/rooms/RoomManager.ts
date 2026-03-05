import { randomUUID } from "crypto";
import * as store from "../state/store.js";
import type { Player, Room, RoomSummary } from "../state/types.js";
import { createRoomEntity, generateRoomCode } from "./Room.js";
import { config } from "../config.js";
import { ALL_AVATAR_IDS } from "../engine/avatars.js";

/** Same names as frontend room.guestName0..7 (en); used for bot display names. */
const GUEST_NAME_POOL = [
  "CrunchCookie",
  "SpicyTaco",
  "SneakySushi",
  "SaltyChip",
  "DramaNacho",
  "CheesyPretzel",
  "NinjaNoodle",
  "ToastedMarshmallow",
];

const RECONNECT_TOKENS = new Map<string, { playerId: string; roomCode: string; expiresAt: number }>();

/** Pick an avatar ID not yet used by other players in the room (for lobby display). */
function pickLobbyAvatar(players: Player[], forPlayerId: string | null): string | null {
  const used = new Set(
    players.filter((p) => p.id !== forPlayerId && p.avatarId).map((p) => p.avatarId as string)
  );
  const available = ALL_AVATAR_IDS.filter((id) => !used.has(id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function generateReconnectToken(playerId: string, roomCode: string): string {
  const token = randomUUID();
  RECONNECT_TOKENS.set(token, {
    playerId,
    roomCode: roomCode.toUpperCase(),
    expiresAt: Date.now() + config.reconnectTokenTtlMs,
  });
  return token;
}

export function validateReconnectToken(token: string): { playerId: string; roomCode: string } | null {
  const entry = RECONNECT_TOKENS.get(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return { playerId: entry.playerId, roomCode: entry.roomCode };
}

/** Remove all reconnect tokens for a player in a room (e.g. when they are kicked). */
function invalidateReconnectTokensForPlayer(playerId: string, roomCode: string): void {
  const code = roomCode.toUpperCase();
  for (const [token, entry] of RECONNECT_TOKENS.entries()) {
    if (entry.playerId === playerId && entry.roomCode === code) RECONNECT_TOKENS.delete(token);
  }
}

const KICK_ROOM_HIDE_MS = 5 * 60 * 1000;

/** Room code -> creator id (client-supplied). Used to close previous rooms when same creator makes a new one. */
const CREATOR_BY_ROOM = new Map<string, string>();

function deleteRoomAndCreator(roomCode: string): void {
  store.deleteRoom(roomCode);
  CREATOR_BY_ROOM.delete(roomCode.toUpperCase());
}

/** Close all rooms owned by this creatorId; invalidate tokens and return socket IDs to notify. */
function closeRoomsByCreator(creatorId: string): string[] {
  const all = store.getAllRooms();
  const toClose = all.filter((room) => CREATOR_BY_ROOM.get(room.code) === creatorId);
  const socketIds: string[] = [];
  for (const room of toClose) {
    const code = room.code.toUpperCase();
    for (const p of room.players) {
      if (p.socketId) socketIds.push(p.socketId);
      invalidateReconnectTokensForPlayer(p.id, code);
    }
    deleteRoomAndCreator(code);
  }
  return socketIds;
}

export function createRoom(
  displayName: string,
  options?: { name?: string; isPrivate?: boolean; maxPlayers?: number; speedMode?: boolean; suspicionMeter?: boolean },
  creatorId?: string
): { room: Room; player: Player; reconnectToken: string; closedRoomSocketIds?: string[] } | { error: string } {
  const name = displayName.trim().slice(0, 32) || "Player";
  if (name.toLowerCase().includes("host")) return { error: "Name cannot contain the word 'host'" };

  const closedRoomSocketIds = creatorId ? closeRoomsByCreator(creatorId) : undefined;

  const player: Player = {
    id: randomUUID(),
    displayName: name,
    socketId: null,
    role: null,
    hand: [],
    status: "active",
    isHost: true,
    joinedAt: Date.now(),
  };
  const existingCodes = store.getAllRoomCodes();
  const code = generateRoomCode(existingCodes);
  const room = createRoomEntity(code, player, options) as Room;
  store.setRoom(code, room);
  if (creatorId) CREATOR_BY_ROOM.set(code, creatorId);
  player.avatarId = pickLobbyAvatar(room.players, null);
  const reconnectToken = generateReconnectToken(player.id, code);
  player.reconnectToken = reconnectToken;
  return { room, player, reconnectToken, closedRoomSocketIds };
}

export function getRoom(roomCode: string): Room | undefined {
  return store.getRoom(roomCode);
}

export function joinRoom(
  roomCode: string,
  displayName: string,
  reconnectToken?: string
): { room: Room; player: Player; reconnectToken: string; reconnected: boolean } | { error: string } {
  const code = roomCode.toUpperCase();
  let room = store.getRoom(code);

  if (reconnectToken) {
    const validated = validateReconnectToken(reconnectToken);
    if (validated && validated.roomCode === code) {
      if (!room) return { error: "Room no longer exists" };
      const player = room.players.find((p) => p.id === validated.playerId);
      if (!player) return { error: "Player not found in room" };
      const newToken = generateReconnectToken(player.id, code);
      player.reconnectToken = newToken;
      return { room, player, reconnectToken: newToken, reconnected: true };
    }
  }

  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "lobby") return { error: "Game already started" };
  const maxPlayers = room.maxPlayers ?? config.maxPlayers;
  if (room.players.length >= maxPlayers) return { error: "Room is full" };

  const name = displayName.trim().slice(0, 32) || "Player";
  if (name.toLowerCase().includes("host")) return { error: "Name cannot contain the word 'host'" };
  const nameLower = name.toLowerCase();
  const duplicate = room.players.some((p) => p.displayName.toLowerCase() === nameLower);
  if (duplicate) return { error: "Someone in this room already has that name" };

  const player: Player = {
    id: randomUUID(),
    displayName: name,
    socketId: null,
    role: null,
    hand: [],
    status: "active",
    isHost: false,
    joinedAt: Date.now(),
  };
  room.players.push(player);
  player.avatarId = pickLobbyAvatar(room.players, player.id);
  const token = generateReconnectToken(player.id, code);
  player.reconnectToken = token;
  return { room, player, reconnectToken: token, reconnected: false };
}

export function leaveRoom(roomCode: string, playerId: string): { room: Room; newHostId?: string } | null {
  const room = store.getRoom(roomCode);
  if (!room) return null;
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) return null;
  invalidateReconnectTokensForPlayer(playerId, roomCode);
  room.players.splice(index, 1);
  room.players.forEach((p) => (p.socketId = p.socketId ?? null));

  let newHostId: string | undefined;
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
    newHostId = room.hostId;
  }
  if (room.players.length === 0) {
    deleteRoomAndCreator(roomCode);
    return null;
  }
  return { room, newHostId };
}

export function setPlayerSocket(roomCode: string, playerId: string, socketId: string): void {
  const room = store.getRoom(roomCode);
  if (!room) return;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.socketId = socketId;
}

export function clearPlayerSocket(roomCode: string, playerId: string): void {
  const room = store.getRoom(roomCode);
  if (!room) return;
  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.socketId = null;
    if (room.gameState.phase === "playing" || room.gameState.phase === "ended") {
      player.status = "disconnected";
    }
  }
}

export function setPlayerDisplayName(
  roomCode: string,
  playerId: string,
  displayName: string
): true | { error: string } {
  const room = store.getRoom(roomCode);
  if (!room || room.gameState.phase !== "lobby") return { error: "Can only change name in lobby" };
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "Player not found" };
  const name = displayName.trim().slice(0, 32);
  if (!name) return { error: "Display name is required" };
  if (name.toLowerCase().includes("host")) return { error: "Name cannot contain the word 'host'" };
  const nameLower = name.toLowerCase();
  const duplicate = room.players.some((p) => p.id !== playerId && p.displayName.toLowerCase() === nameLower);
  if (duplicate) return { error: "Someone in this room already has that name" };
  player.displayName = name;
  return true;
}

export function setPlayerAvatar(roomCode: string, playerId: string, avatarId: string): boolean {
  const room = store.getRoom(roomCode);
  if (!room || room.gameState.phase !== "lobby") return false;
  if (!ALL_AVATAR_IDS.includes(avatarId)) return false;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return false;
  const takenByOther = room.players.some((p) => p.id !== playerId && p.avatarId === avatarId);
  if (takenByOther) return false;
  player.avatarId = avatarId;
  return true;
}

export function addBot(
  roomCode: string,
  hostPlayerId: string
): { room: Room; player: Player } | { error: string } {
  const room = store.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "lobby") return { error: "Game already started" };
  if (room.hostId !== hostPlayerId) return { error: "Only host can add bots" };
  const maxPlayers = room.maxPlayers ?? config.maxPlayers;
  if (room.players.length >= maxPlayers) return { error: "Room is full" };

  const usedNames = new Set(room.players.map((p) => p.displayName.toLowerCase()));
  const available = GUEST_NAME_POOL.filter((name) => !usedNames.has(name.toLowerCase()));
  if (available.length === 0) return { error: "No available names in pool for another bot" };

  const displayName = available[Math.floor(Math.random() * available.length)];

  const player: Player = {
    id: randomUUID(),
    displayName,
    socketId: null,
    role: null,
    hand: [],
    status: "active",
    isHost: false,
    joinedAt: Date.now(),
    isBot: true,
  };

  room.players.push(player);
  player.avatarId = pickLobbyAvatar(room.players, player.id);
  return { room, player };
}

export function removeBot(
  roomCode: string,
  hostPlayerId: string,
  botPlayerId: string
): { room: Room } | { error: string } {
  const room = store.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "lobby") return { error: "Game already started" };
  if (room.hostId !== hostPlayerId) return { error: "Only host can remove bots" };

  const index = room.players.findIndex((p) => p.id === botPlayerId);
  if (index === -1) return { error: "Player not found" };
  const player = room.players[index];
  if (!player.isBot) return { error: "Can only remove bots" };

  room.players.splice(index, 1);
  return { room };
}

/**
 * Kick a human player from the room. Only the host can kick. Returns the kicked player's socketId
 * so the handler can notify and close their connection.
 */
export function kickPlayer(
  roomCode: string,
  hostPlayerId: string,
  targetPlayerId: string
): { room: Room; kickedSocketId: string | null } | { error: string } {
  const room = store.getRoom(roomCode);
  if (!room) return { error: "Room not found" };
  if (room.gameState.phase !== "lobby") return { error: "Game already started" };
  if (room.hostId !== hostPlayerId) return { error: "Only host can kick players" };
  if (targetPlayerId === hostPlayerId) return { error: "Cannot kick yourself" };

  const index = room.players.findIndex((p) => p.id === targetPlayerId);
  if (index === -1) return { error: "Player not found" };
  const player = room.players[index];
  if (player.isBot) return { error: "Use remove bot to remove bots" };

  invalidateReconnectTokensForPlayer(player.id, roomCode);
  room.hiddenFromListUntil = Date.now() + KICK_ROOM_HIDE_MS;
  const kickedSocketId = player.socketId ?? null;
  room.players.splice(index, 1);
  return { room, kickedSocketId };
}

export function setLobbySettings(
  roomCode: string,
  playerId: string,
  settings: {
    speedMode?: boolean;
    suspicionMeter?: boolean;
    isPrivate?: boolean;
    maxPlayers?: number;
  }
): boolean {
  const room = store.getRoom(roomCode);
  if (!room || room.gameState.phase !== "lobby") return false;
  if (room.hostId !== playerId) return false;
  if (settings.speedMode !== undefined) {
    room.settings.speedMode = settings.speedMode;
    room.settings.turnTimeoutSec = settings.speedMode ? 20 : 60;
  }
  if (settings.suspicionMeter !== undefined) {
    room.settings.suspicionMeter = settings.suspicionMeter;
  }
  if (settings.isPrivate !== undefined) {
    room.isPrivate = settings.isPrivate;
  }
  if (settings.maxPlayers !== undefined) {
    const n = Math.min(config.maxPlayers, Math.max(config.minPlayers, settings.maxPlayers));
    if (room.players.length <= n) room.maxPlayers = n;
  }
  return true;
}

/** Close lobby rooms that have been idle past lobbyTimeoutMs; return their socket IDs for notification. */
export function closeStaleLobbyRooms(): { roomCode: string; socketIds: string[] }[] {
  const now = Date.now();
  const all = store.getAllRooms();
  const result: { roomCode: string; socketIds: string[] }[] = [];
  for (const room of all) {
    if (room.gameState.phase !== "lobby") continue;
    if (now - room.createdAt < config.lobbyTimeoutMs) continue;
    const socketIds = room.players.map((p) => p.socketId).filter(Boolean) as string[];
    for (const p of room.players) invalidateReconnectTokensForPlayer(p.id, room.code);
    deleteRoomAndCreator(room.code);
    result.push({ roomCode: room.code, socketIds });
  }
  return result;
}

export interface ListRoomsQuery {
  speedMode?: boolean;
  suspicionMeter?: boolean;
  page?: number;
  limit?: number;
}

export function listRooms(query: ListRoomsQuery = {}): { rooms: RoomSummary[]; total: number } {
  const now = Date.now();
  const all = store.getAllRooms();
  const { speedMode, suspicionMeter, page = 1, limit = 12 } = query;
  let list = all.filter(
    (room) =>
      room.gameState.phase === "lobby" &&
      (room.hiddenFromListUntil == null || room.hiddenFromListUntil <= now)
  );
  if (speedMode !== undefined) {
    list = list.filter((r) => r.settings.speedMode === speedMode);
  }
  if (suspicionMeter !== undefined) {
    list = list.filter((r) => r.settings.suspicionMeter === suspicionMeter);
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  const total = list.length;
  const start = (page - 1) * limit;
  const rooms = list.slice(start, start + limit).map((room): RoomSummary => ({
    code: room.code,
    name: room.name,
    isPrivate: room.isPrivate ?? false,
    maxPlayers: room.maxPlayers ?? config.maxPlayers,
    playerCount: room.players.length,
    phase: room.gameState.phase,
    speedMode: room.settings.speedMode,
    suspicionMeter: room.settings.suspicionMeter,
    createdAt: room.createdAt,
  }));
  return { rooms, total };
}
