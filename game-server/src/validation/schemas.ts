import { z } from "zod";

const joinPayload = z.object({
  roomCode: z.string().length(8).transform((s) => s.toUpperCase()),
  displayName: z.string().min(1).max(32).transform((s) => s.trim() || "Player"),
  reconnectToken: z.string().uuid().optional(),
});

const setNamePayload = z.object({
  displayName: z.string().min(1).max(32).transform((s) => s.trim()),
});

const setAvatarPayload = z.object({
  avatarId: z.string().min(1).max(64),
});

const setLobbySettingsPayload = z.object({
  speedMode: z.boolean().optional(),
  suspicionMeter: z.boolean().optional(),
});

const playCardPayload = z.object({
  cardId: z.string().min(1),
});

const chatPayload = z.object({
  text: z.string().min(1).max(500).transform((s) => s.trim()),
});

export const clientMessageSchemas = {
  join: joinPayload,
  set_name: setNamePayload,
  set_avatar: setAvatarPayload,
  set_lobby_settings: setLobbySettingsPayload,
  start_game: z.object({ speedMode: z.boolean().optional() }),
  play_card: playCardPayload,
  chat: chatPayload,
  restart: z.object({}),
} as const;

export type ClientMessageType = keyof typeof clientMessageSchemas;

export function parseClientMessage(
  type: string,
  payload: unknown
): { type: ClientMessageType; payload: z.infer<(typeof clientMessageSchemas)[ClientMessageType]> } | { error: string } {
  const schema = clientMessageSchemas[type as ClientMessageType];
  if (!schema) return { error: `Unknown message type: ${type}` };
  const result = schema.safeParse(payload);
  if (!result.success) return { error: result.error.message };
  return { type: type as ClientMessageType, payload: result.data };
}
