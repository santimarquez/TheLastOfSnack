export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(","),
  turnTimeoutSec: parseInt(process.env.TURN_TIMEOUT_SEC ?? "20", 10),
  speedMode: process.env.SPEED_MODE === "true",
  minPlayers: 4,
  maxPlayers: 8,
  roomCodeLength: 8,
  reconnectTokenTtlMs: 24 * 60 * 60 * 1000,
  rateLimitMessagesPerSec: 10,
} as const;
