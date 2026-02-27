"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore, type LobbySettings } from "@/store/gameStore";

const getWsUrl = () => {
  const base =
    process.env.NEXT_PUBLIC_GAME_SERVER_HTTP ||
    "http://localhost:4000";
  return base.replace(/^http/, "ws") + "/ws";
};

const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000;

export function useGameSocket(roomCode: string, displayName: string, reconnectToken: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByCleanupRef = useRef(false);
  /** Keep join payload in a ref so we don't reconnect when only displayName/reconnectToken changes (e.g. after hydration). */
  const joinPayloadRef = useRef({ displayName, reconnectToken });
  joinPayloadRef.current = { displayName, reconnectToken };

  const {
    setJoined,
    setRoomUpdated,
    setGameStarted,
    setTurnStarted,
    setCardPlayed,
    setPlayerEliminated,
    setGameEnded,
    addChat,
    setStateSync,
    setConnectionStatus,
    setError,
    setJoinFailed,
  } = useGameStore();

  const send = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
      }
    },
    []
  );

  const connect = useCallback(() => {
    if (!roomCode?.trim()) return;
    closedByCleanupRef.current = false;
    const url = getWsUrl();
    setConnectionStatus("connecting");
    setError(null);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      const { displayName: name, reconnectToken: token } = joinPayloadRef.current;
      if (!name?.trim()) return;
      send("join", {
        roomCode,
        displayName: name,
        ...(token ? { reconnectToken: token } : {}),
      });
    };

    ws.onmessage = (event) => {
      let data: { type: string; payload: unknown };
      try {
        data = JSON.parse(event.data as string) as { type: string; payload: unknown };
      } catch {
        return;
      }
      const { type, payload } = data;
      const p = payload as Record<string, unknown>;

      switch (type) {
        case "joined":
          setConnectionStatus("connected");
          setError(null);
          setJoined({
            playerId: p.playerId as string,
            roomCode: p.roomCode as string,
            isHost: p.isHost as boolean,
            reconnectToken: p.reconnectToken as string,
            gameState: p.gameState as import("@last-of-snack/shared").GameStateView,
            lobbySettings: p.lobbySettings as LobbySettings | undefined,
          });
          break;
        case "room_updated":
          setRoomUpdated(
            (p.players as import("@last-of-snack/shared").PlayerView[]) ?? [],
            (p.gameState as import("@last-of-snack/shared").GameStateView)!,
            p.lobbySettings as LobbySettings | undefined
          );
          break;
        case "game_started":
          setGameStarted((p.gameState as import("@last-of-snack/shared").GameStateView)!);
          break;
        case "turn_started":
          setTurnStarted(
            p.currentPlayerId as string,
            p.expiresAt as number,
            p.gameState as import("@last-of-snack/shared").GameStateView
          );
          break;
        case "card_played":
          setCardPlayed(
            p.playerId as string,
            p.cardId as string,
            p.gameState as import("@last-of-snack/shared").GameStateView
          );
          break;
        case "player_eliminated":
          setPlayerEliminated(
            p.playerId as string,
            p.revealedRole,
            p.gameState as import("@last-of-snack/shared").GameStateView
          );
          break;
        case "game_ended":
          setGameEnded(
            (p.winnerId as string | null) ?? null,
            p.gameState as import("@last-of-snack/shared").GameStateView
          );
          break;
        case "chat":
          addChat({
            playerId: p.playerId as string,
            displayName: p.displayName as string,
            text: p.text as string,
          });
          break;
        case "state_sync":
          setStateSync(p.gameState as import("@last-of-snack/shared").GameStateView);
          break;
        case "error": {
          const message = (p.message as string) ?? "Error";
          const code = p.code as string;
          setError(message);
          // Only show full "room not found" screen when the room is actually gone; not for "Game already started" or reconnection edge cases.
          if (code === "JOIN_FAILED" && (message === "Room not found" || message === "Room no longer exists")) {
            setJoinFailed(true);
          }
          break;
        }
        default:
          break;
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (closedByCleanupRef.current) return;
      const willRetry = retryCount.current < MAX_RETRIES && !!roomCode?.trim();
      if (willRetry) {
        setConnectionStatus("connecting");
        const delay = INITIAL_BACKOFF * Math.pow(2, retryCount.current);
        retryCount.current += 1;
        retryTimeout.current = setTimeout(() => connect(), delay);
      } else {
        setConnectionStatus("disconnected");
      }
    };

    ws.onerror = () => {
      if (!closedByCleanupRef.current) setError("Connection error");
    };
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode?.trim()) return;
    connect();
    return () => {
      closedByCleanupRef.current = true;
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomCode]);

  return {
    send,
    connect,
  };
}
