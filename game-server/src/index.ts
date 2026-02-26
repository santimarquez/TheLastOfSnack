import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { randomUUID } from "crypto";
import { config } from "./config.js";
import * as RoomManager from "./rooms/RoomManager.js";
import * as GameEngine from "./engine/GameEngine.js";
import * as broadcast from "./websocket/broadcast.js";
import { handleMessage, handleClose } from "./websocket/handler.js";

const sockets = new Map<string, import("ws").WebSocket>();

const fastify = Fastify({ logger: config.nodeEnv !== "production" });

await fastify.register(fastifyWebsocket, {
  options: { clientTracking: true },
});

GameEngine.setBroadcast(broadcast.createBroadcast(sockets));

fastify.get("/health", async () => ({ status: "ok" }));

fastify.post<{ Body: { displayName?: string } }>("/rooms", async (req, reply) => {
  const displayName = req.body?.displayName ?? "Player";
  const { room, player, reconnectToken } = RoomManager.createRoom(displayName);
  return reply.send({ roomCode: room.code, reconnectToken });
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
