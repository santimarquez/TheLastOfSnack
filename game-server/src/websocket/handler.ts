import type { WebSocket } from "ws";
import { randomUUID } from "crypto";
import type { Room } from "../state/types.js";
import * as RoomManager from "../rooms/RoomManager.js";
import * as GameEngine from "../engine/GameEngine.js";
import { buildGameStateView } from "../engine/EventBroadcasting.js";
import { parseClientMessage } from "../validation/schemas.js";
import * as broadcast from "./broadcast.js";
import { sendToSocket } from "./broadcast.js";
import { config } from "../config.js";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function roomUpdatedPayload(room: Room, forPlayerId: string) {
  const view = buildGameStateView(room, forPlayerId);
  return {
    players: view.players,
    gameState: view,
    lobbySettings: {
      speedMode: room.settings.speedMode,
      suspicionMeter: room.settings.suspicionMeter ?? false,
    },
  };
}
const RATE_WINDOW_MS = 1000;

function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  let entry = rateLimit.get(socketId);
  if (!entry) {
    rateLimit.set(socketId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
    rateLimit.set(socketId, entry);
    return true;
  }
  entry.count++;
  return entry.count <= config.rateLimitMessagesPerSec;
}

export function handleMessage(
  ws: WebSocket,
  socketId: string,
  raw: string,
  sockets: Map<string, WebSocket>
): void {
  if (!checkRateLimit(socketId)) {
    sendToSocket(ws, "error", { code: "RATE_LIMIT", message: "Too many messages" });
    return;
  }

  let data: { type?: string; payload?: unknown };
  try {
    data = JSON.parse(raw) as { type?: string; payload?: unknown };
  } catch {
    sendToSocket(ws, "error", { code: "INVALID_JSON", message: "Invalid JSON" });
    return;
  }

  const { type, payload } = data;
  if (!type || payload === undefined) {
    sendToSocket(ws, "error", { code: "INVALID_MESSAGE", message: "Missing type or payload" });
    return;
  }

  const parsed = parseClientMessage(type, payload);
  if ("error" in parsed) {
    sendToSocket(ws, "error", { code: "VALIDATION_ERROR", message: parsed.error });
    return;
  }

  switch (parsed.type) {
    case "join": {
      const { roomCode, displayName, reconnectToken } = parsed.payload as {
        roomCode: string;
        displayName: string;
        reconnectToken?: string;
      };
      const result = reconnectToken
        ? RoomManager.joinRoom(roomCode, displayName, reconnectToken)
        : RoomManager.joinRoom(roomCode, displayName);
      if ("error" in result) {
        sendToSocket(ws, "error", { code: "JOIN_FAILED", message: result.error });
        return;
      }
      const { room, player, reconnectToken: token, reconnected } = result;
      RoomManager.setPlayerSocket(roomCode, player.id, socketId);
      broadcast.registerSocket(socketId, room.code, player.id);
      const gameState = buildGameStateView(room, player.id);
      console.log("[ws] sending joined", socketId, room.code);
      sendToSocket(ws, "joined", {
        playerId: player.id,
        roomCode: room.code,
        isHost: player.isHost,
        reconnectToken: token,
        gameState,
        lobbySettings: {
          speedMode: room.settings.speedMode,
          suspicionMeter: room.settings.suspicionMeter ?? false,
        },
      });
      if (!reconnected) {
        const broadcastFn = broadcast.createBroadcast(sockets);
        broadcastFn(room.code, "room_updated", (forPlayerId: string) => roomUpdatedPayload(room, forPlayerId));
      }
      return;
    }

    default:
      break;
  }

  const ctx = broadcast.getRoomAndPlayer(socketId);
  if (!ctx) {
    sendToSocket(ws, "error", { code: "NOT_IN_ROOM", message: "Join a room first" });
    return;
  }

  const room = RoomManager.getRoom(ctx.roomCode);
  if (!room) {
    sendToSocket(ws, "error", { code: "ROOM_GONE", message: "Room no longer exists" });
    return;
  }

  const player = room.players.find((p) => p.id === ctx.playerId);
  if (!player) {
    sendToSocket(ws, "error", { code: "PLAYER_GONE", message: "Player not in room" });
    return;
  }

  switch (parsed.type) {
    case "set_name": {
      const ok = RoomManager.setPlayerDisplayName(ctx.roomCode, ctx.playerId, (parsed.payload as { displayName: string }).displayName);
      if (!ok) {
        sendToSocket(ws, "error", { code: "INVALID_STATE", message: "Can only change name in lobby" });
        return;
      }
      const broadcastFn = broadcast.createBroadcast(sockets);
      broadcastFn(ctx.roomCode, "room_updated", (forPlayerId: string) => roomUpdatedPayload(room, forPlayerId));
      return;
    }

    case "set_avatar": {
      const avatarId = (parsed.payload as { avatarId: string }).avatarId;
      const ok = RoomManager.setPlayerAvatar(ctx.roomCode, ctx.playerId, avatarId);
      if (!ok) {
        sendToSocket(ws, "error", { code: "INVALID_AVATAR", message: "Avatar not available or invalid" });
        return;
      }
      const broadcastFn = broadcast.createBroadcast(sockets);
      broadcastFn(ctx.roomCode, "room_updated", (forPlayerId: string) => roomUpdatedPayload(room, forPlayerId));
      return;
    }

    case "set_lobby_settings": {
      const lobbyPayload = parsed.payload as { speedMode?: boolean; suspicionMeter?: boolean };
      const ok = RoomManager.setLobbySettings(ctx.roomCode, ctx.playerId, lobbyPayload);
      if (!ok) {
        sendToSocket(ws, "error", { code: "INVALID_STATE", message: "Only host can change lobby settings" });
        return;
      }
      const updatedRoom = RoomManager.getRoom(ctx.roomCode);
      if (updatedRoom) {
        const broadcastFn = broadcast.createBroadcast(sockets);
        broadcastFn(ctx.roomCode, "room_updated", (forPlayerId: string) => roomUpdatedPayload(updatedRoom, forPlayerId));
      }
      return;
    }

    case "start_game": {
      const payload = parsed.payload as { speedMode?: boolean };
      const result = GameEngine.startGame(ctx.roomCode, ctx.playerId, {
        speedMode: payload.speedMode,
      });
      if ("error" in result) {
        sendToSocket(ws, "error", { code: "START_FAILED", message: result.error });
      }
      return;
    }

    case "play_card": {
      const result = GameEngine.playCard(ctx.roomCode, ctx.playerId, (parsed.payload as { cardId: string }).cardId);
      if ("error" in result) {
        sendToSocket(ws, "error", { code: "PLAY_FAILED", message: result.error });
      }
      return;
    }

    case "chat": {
      const text = (parsed.payload as { text: string }).text;
      const broadcastFn = broadcast.createBroadcast(sockets);
      broadcastFn(ctx.roomCode, "chat", {
        playerId: ctx.playerId,
        displayName: player.displayName,
        text,
      });
      return;
    }

    case "restart": {
      const result = GameEngine.restartGame(ctx.roomCode, ctx.playerId);
      if ("error" in result) {
        sendToSocket(ws, "error", { code: "RESTART_FAILED", message: result.error });
      }
      return;
    }

    default:
      sendToSocket(ws, "error", { code: "UNKNOWN_TYPE", message: `Unknown type: ${parsed.type}` });
  }
}

export function handleClose(socketId: string, sockets: Map<string, WebSocket>): void {
  const ctx = broadcast.getRoomAndPlayer(socketId);
  broadcast.unregisterSocket(socketId);
  if (!ctx) return;
  RoomManager.clearPlayerSocket(ctx.roomCode, ctx.playerId);
  // Do not call leaveRoom on disconnect so the player can reconnect with the same token.
  const room = RoomManager.getRoom(ctx.roomCode);
  if (room) {
    const broadcastFn = broadcast.createBroadcast(sockets);
    broadcastFn(ctx.roomCode, "room_updated", (forPlayerId: string) => roomUpdatedPayload(room, forPlayerId));
  }
}
