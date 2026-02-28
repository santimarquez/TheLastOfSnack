import { randomUUID } from "crypto";
import * as store from "../state/store.js";
import type { Player, Room } from "../state/types.js";
import { createRoomEntity, generateRoomCode } from "./Room.js";
import { config } from "../config.js";
import { ALL_AVATAR_IDS } from "../engine/avatars.js";

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

export function createRoom(displayName: string): { room: Room; player: Player; reconnectToken: string } | { error: string } {
  const name = displayName.trim().slice(0, 32) || "Player";
  if (name.toLowerCase().includes("host")) return { error: "Name cannot contain the word 'host'" };
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
  const room = createRoomEntity(code, player) as Room;
  store.setRoom(code, room);
  player.avatarId = pickLobbyAvatar(room.players, null);
  const reconnectToken = generateReconnectToken(player.id, code);
  player.reconnectToken = reconnectToken;
  return { room, player, reconnectToken };
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
  if (room.players.length >= config.maxPlayers) return { error: "Room is full" };

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
  room.players.splice(index, 1);
  room.players.forEach((p) => (p.socketId = p.socketId ?? null));

  let newHostId: string | undefined;
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
    newHostId = room.hostId;
  }
  if (room.players.length === 0) {
    store.deleteRoom(roomCode);
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
  if (room.players.length >= config.maxPlayers) return { error: "Room is full" };

  const botCount = room.players.filter((p) => (p as { isBot?: boolean }).isBot).length;
  const displayName = `Bot ${botCount + 1}`;

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

export function setLobbySettings(
  roomCode: string,
  playerId: string,
  settings: { speedMode?: boolean; suspicionMeter?: boolean }
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
  return true;
}
