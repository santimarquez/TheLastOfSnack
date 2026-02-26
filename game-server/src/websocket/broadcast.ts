import type { WebSocket } from "ws";
import * as RoomManager from "../rooms/RoomManager.js";
import type { BroadcastFn } from "../engine/GameEngine.js";

const socketToRoom = new Map<string, { roomCode: string; playerId: string }>();

export function registerSocket(socketId: string, roomCode: string, playerId: string): void {
  socketToRoom.set(socketId, { roomCode, playerId });
}

export function unregisterSocket(socketId: string): void {
  socketToRoom.delete(socketId);
}

export function getRoomAndPlayer(socketId: string): { roomCode: string; playerId: string } | null {
  return socketToRoom.get(socketId) ?? null;
}

function send(ws: WebSocket, type: string, payload: unknown): void {
  if (ws.readyState !== 1) {
    return;
  }
  try {
    ws.send(JSON.stringify({ type, payload }));
  } catch {
    // ignore
  }
}

export function createBroadcast(sockets: Map<string, WebSocket>): BroadcastFn {
  return (roomCode: string, event: string, payloadOrPayloadFn: unknown | ((forPlayerId: string) => unknown)) => {
    const room = RoomManager.getRoom(roomCode);
    if (!room) return;

    const isFn = typeof payloadOrPayloadFn === "function";
    for (const p of room.players) {
      if (!p.socketId) continue;
      const ws = sockets.get(p.socketId);
      if (!ws) continue;
      const payload = isFn ? (payloadOrPayloadFn as (id: string) => unknown)(p.id) : payloadOrPayloadFn;
      send(ws, event, payload);
    }
  };
}

export function sendToSocket(ws: WebSocket, type: string, payload: unknown): void {
  send(ws, type, payload);
}
