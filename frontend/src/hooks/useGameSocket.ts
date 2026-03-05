"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore, type LobbySettings, type ActionLogEntry } from "@/store/gameStore";
import { Analytics, JOIN_METHOD_KEY } from "@/lib/analytics";

const getWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_GAME_SERVER_HTTP;
  if (base) {
    return base.replace(/^http/, "ws") + "/ws";
  }
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const isLocalDev = host === "localhost:3000" || host.startsWith("localhost:3000");
    if (isLocalDev) {
      return "ws://localhost:4000/ws";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }
  return "ws://localhost:4000/ws";
};

const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000;

export function useGameSocket(roomCode: string, displayName: string, reconnectToken: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByCleanupRef = useRef(false);
  const kickedRef = useRef(false);
  /** Keep join payload in a ref so we don't reconnect when only displayName/reconnectToken changes (e.g. after hydration). */
  const joinPayloadRef = useRef({ displayName, reconnectToken });
  joinPayloadRef.current = { displayName, reconnectToken };

  const {
    setJoined,
    setRoomUpdated,
    setGameStarted,
    setTurnStarted,
    setCardPlayed,
    setCardDrawn,
    setPlayerEliminated,
    setGameEnded,
    setShowRoundTransition,
    addChat,
    setStateSync,
    addActionLogEntry,
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
    kickedRef.current = false;
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
        case "kicked":
          kickedRef.current = true;
          Analytics.playerKicked();
          setError("KICKED");
          setJoinFailed(true);
          setConnectionStatus("disconnected");
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(`reconnect_${roomCode}`);
          }
          break;
        case "room_closed":
          kickedRef.current = true;
          Analytics.roomClosed();
          setError(p.reason === "timeout" ? "ROOM_CLOSED_TIMEOUT" : "ROOM_CLOSED");
          setJoinFailed(true);
          setConnectionStatus("disconnected");
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(`reconnect_${roomCode}`);
          }
          break;
        case "joined": {
          const reconnected = p.reconnected as boolean | undefined;
          if (reconnected) {
            Analytics.reconnected();
          } else if (typeof sessionStorage !== "undefined") {
            const method = (sessionStorage.getItem(JOIN_METHOD_KEY) ?? "code") as "code" | "quick_join" | "list" | "create";
            Analytics.arenaJoined(method);
            sessionStorage.removeItem(JOIN_METHOD_KEY);
          }
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
        }
        case "room_updated":
          setRoomUpdated(
            (p.players as import("@last-of-snack/shared").PlayerView[]) ?? [],
            (p.gameState as import("@last-of-snack/shared").GameStateView)!,
            p.lobbySettings as LobbySettings | undefined
          );
          break;
        case "game_started": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const players = gs?.players ?? [];
          const speedMode = gs?.turnTimeoutSec === 20;
          Analytics.gameStarted(players.length, speedMode);
          setGameStarted(gs!);
          const order = gs?.turnOrder ?? [];
          const idx = (gs?.currentTurnIndex ?? 0) % Math.max(1, order.length);
          const firstId = order[idx];
          const firstName = firstId ? players.find((pl: { id: string }) => pl.id === firstId)?.displayName : undefined;
          if (firstName) {
            addActionLogEntry({
              id: `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              kind: "turn",
              playerName: firstName,
            });
          }
          break;
        }
        case "turn_started": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const players = gs?.players ?? [];
          const currentId = p.currentPlayerId as string;
          const playerName = players.find((pl: { id: string }) => pl.id === currentId)?.displayName ?? "?";
          addActionLogEntry({
            id: `turn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            kind: "turn",
            playerName,
          });
          setTurnStarted(
            currentId,
            p.expiresAt as number,
            gs
          );
          break;
        }
        case "card_played": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const players = gs?.players ?? [];
          const cardId = p.cardId as string;
          const outcome = p.outcome as string | undefined;
          const pile = gs?.discardPile ?? [];
          const card = pile.find((c: { id: string }) => c.id === cardId);
          const cardType =
            outcome === "shielded"
              ? "foil_wrap"
              : (card as { type?: string } | undefined)?.type ?? "card";
          const playerName = players.find((pl: { id: string }) => pl.id === (p.playerId as string))?.displayName ?? "?";
          const targetId = (p as { targetId?: string }).targetId;
          const targetName = targetId ? players.find((pl: { id: string }) => pl.id === targetId)?.displayName : undefined;
          const entry: ActionLogEntry = targetName
            ? { id: `play-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "play_target", playerName, targetName, cardType }
            : { id: `play-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "play", playerName, cardType };
          addActionLogEntry(entry);
          const revealNotification = p.revealNotification as
            | { type: "salt"; targetDisplayName: string; category: string }
            | { type: "peek"; targetDisplayName: string; snackName: string }
            | undefined;
          let startRect: { left: number; top: number; width: number; height: number } | undefined;
          if (typeof document !== "undefined") {
            const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardEl) {
              const r = cardEl.getBoundingClientRect();
              startRect = { left: r.left, top: r.top, width: r.width, height: r.height };
            }
          }
          setCardPlayed(
            p.playerId as string,
            cardId,
            gs,
            {
              revealNotification,
              outcome: p.outcome as string | undefined,
              targetId: (p as { targetId?: string }).targetId,
              cardType,
              startRect,
            }
          );
          break;
        }
        case "card_drawn": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const players = gs?.players ?? [];
          const playerName = players.find((pl: { id: string }) => pl.id === (p.playerId as string))?.displayName ?? "?";
          addActionLogEntry({
            id: `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            kind: "draw",
            playerName,
          });
          setCardDrawn(
            p.playerId as string,
            gs
          );
          break;
        }
        case "player_eliminated": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const round = (gs?.currentRound ?? 1) as number;
          Analytics.playerEliminated(round);
          const players = gs?.players ?? [];
          const eliminatedId = p.playerId as string;
          const role = p.revealedRole as { name?: string } | undefined;
          const playerName = players.find((pl: { id: string }) => pl.id === eliminatedId)?.displayName ?? (p.displayName as string) ?? "?";
          addActionLogEntry({
            id: `elim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            kind: "eliminated",
            playerName,
            roleName: role?.name ?? "?",
          });
          setPlayerEliminated(eliminatedId, p.revealedRole, gs, {
            cardType: p.cardType as string | undefined,
            snackId: (p.snackId as string | null) ?? undefined,
            displayName: (p.displayName as string) ?? playerName,
            avatarUrl: p.avatarUrl as string | undefined,
          });
          break;
        }
        case "round_ended": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const winnerId = p.winnerId as string | null;
          const players = gs?.players ?? [];
          const eliminated = new Set(gs?.eliminatedPlayerIds ?? []);
          const survivorsCount = players.filter((pl: { id: string }) => !eliminated.has(pl.id)).length;
          const round = (gs?.currentRound ?? 1) as number;
          Analytics.roundConcluded(round, survivorsCount);
          const winnerName = winnerId ? players.find((pl: { id: string }) => pl.id === winnerId)?.displayName : undefined;
          addActionLogEntry(
            winnerName
              ? { id: `end-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "game_over_winner", winnerName }
              : { id: `end-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "game_over_draw" }
          );
          setGameEnded(winnerId ?? null, gs);
          break;
        }
        case "game_ended": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const winnerId = p.winnerId as string | null;
          const players = gs?.players ?? [];
          const totalRounds = (gs?.roundResults?.length ?? gs?.currentRound ?? 3) as number;
          Analytics.gameEnded(!!winnerId, winnerId ? 1 : 0, totalRounds);
          const winnerName = winnerId ? players.find((pl: { id: string }) => pl.id === winnerId)?.displayName : undefined;
          addActionLogEntry(
            winnerName
              ? { id: `end-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "game_over_winner", winnerName }
              : { id: `end-${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: "game_over_draw" }
          );
          setGameEnded(winnerId ?? null, gs);
          break;
        }
        case "round_started": {
          const gs = p.gameState as import("@last-of-snack/shared").GameStateView;
          const round = (p.round as 1 | 2 | 3) ?? 2;
          Analytics.roundStarted(round);
          setStateSync(gs);
          setShowRoundTransition(true, round);
          break;
        }
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
      if (kickedRef.current) {
        kickedRef.current = false;
        return;
      }
      const willRetry = retryCount.current < MAX_RETRIES && !!roomCode?.trim();
      if (willRetry) {
        setConnectionStatus("connecting");
        const delay = INITIAL_BACKOFF * Math.pow(2, retryCount.current);
        retryCount.current += 1;
        retryTimeout.current = setTimeout(() => connect(), delay);
      } else {
        setConnectionStatus("disconnected");
        Analytics.connectionLost("closed");
      }
    };

    ws.onerror = () => {
      if (!closedByCleanupRef.current) {
        setError("Connection error");
        Analytics.connectionLost("error");
      }
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
