import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { randomUUID } from "crypto";
import { config } from "./config.js";
import * as RoomManager from "./rooms/RoomManager.js";
import * as GameEngine from "./engine/GameEngine.js";
import * as BotEngine from "./engine/BotEngine.js";
import * as broadcast from "./websocket/broadcast.js";
import { sendToSocket } from "./websocket/broadcast.js";
import { handleMessage, handleClose } from "./websocket/handler.js";

const sockets = new Map<string, import("ws").WebSocket>();

const fastify = Fastify({ logger: config.nodeEnv !== "production" });

await fastify.register(fastifyWebsocket, {
  options: { clientTracking: true },
});

GameEngine.setBroadcast(broadcast.createBroadcast(sockets));
GameEngine.setOnBotTurnCheck((roomCode) => BotEngine.runBotTurn(roomCode));

fastify.get("/health", async () => ({ status: "ok" }));

fastify.post<{
  Body: {
    displayName?: string;
    name?: string;
    isPrivate?: boolean;
    maxPlayers?: number;
    speedMode?: boolean;
    suspicionMeter?: boolean;
    creatorId?: string;
  };
}>("/rooms", async (req, reply) => {
  const body = req.body ?? {};
  const displayName = body.displayName ?? "Player";
  const result = RoomManager.createRoom(
    displayName,
    {
      name: body.name,
      isPrivate: body.isPrivate,
      maxPlayers: body.maxPlayers,
      speedMode: body.speedMode,
      suspicionMeter: body.suspicionMeter,
    },
    body.creatorId
  );
  if ("error" in result) {
    return reply.status(400).send({ error: result.error });
  }
  const closedRoomSocketIds = result.closedRoomSocketIds;
  if (closedRoomSocketIds?.length) {
    for (const socketId of closedRoomSocketIds) {
      const ws = sockets.get(socketId);
      if (ws) {
        sendToSocket(ws, "room_closed", { message: "Room was closed by the host." });
        ws.close();
      }
    }
  }
  const { room, reconnectToken } = result;
  return reply.send({ roomCode: room.code, reconnectToken });
});

fastify.get<{
  Querystring: { speedMode?: string; suspicionMeter?: string; page?: string; limit?: string };
}>("/rooms", async (req, reply) => {
  const q = req.query ?? {};
  const speedMode = q.speedMode === "true" ? true : q.speedMode === "false" ? false : undefined;
  const suspicionMeter = q.suspicionMeter === "true" ? true : q.suspicionMeter === "false" ? false : undefined;
  const page = q.page ? parseInt(q.page, 10) : 1;
  const limit = q.limit ? Math.min(50, Math.max(1, parseInt(q.limit, 10))) : 12;
  const { rooms, total } = RoomManager.listRooms({
    speedMode,
    suspicionMeter,
    page: Number.isFinite(page) ? page : 1,
    limit,
  });
  return reply.send({ rooms, total });
});

fastify.get("/ws", { websocket: true }, (socket, req) => {
  const socketId = randomUUID();
  /** @fastify/websocket passes a WebSocketStream (duplex), not the raw ws; use .socket for send() and readyState */
  const rawSocket = (socket as { socket: import("ws").WebSocket }).socket;
  sockets.set(socketId, rawSocket);
  const ws = rawSocket;

  ws.on("message", (raw: Buffer | string) => {
    const rawStr = typeof raw === "string" ? raw : raw.toString("utf8");
    handleMessage(ws, socketId, rawStr, sockets);
  });

  ws.on("close", () => {
    handleClose(socketId, sockets);
    sockets.delete(socketId);
  });
});

await fastify.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Game server listening on port ${config.port}`);

setInterval(() => {
  const closed = RoomManager.closeStaleLobbyRooms();
  for (const { socketIds } of closed) {
    for (const socketId of socketIds) {
      const ws = sockets.get(socketId);
      if (ws) {
        sendToSocket(ws, "room_closed", { reason: "timeout" });
        ws.close();
      }
    }
  }
}, 60 * 1000);
