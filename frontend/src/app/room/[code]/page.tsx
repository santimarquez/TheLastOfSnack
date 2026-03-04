"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, getGuestDisplayName } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useGameSocket } from "@/hooks/useGameSocket";
import { Shell } from "@/components/Shell";
import { GameHeader } from "@/components/GameHeader";
import { Lobby } from "@/components/Lobby";
import { GameTable } from "@/components/GameTable";
import { RoundEndScreen } from "@/components/RoundEndScreen";
import { ChatPanel } from "@/components/ChatPanel";
import { SpectatorBanner } from "@/components/SpectatorBanner";
import { EliminationModal } from "@/components/EliminationModal";
import { CardRevealNotification } from "@/components/CardRevealNotification";
import { EliminationAnimation } from "@/components/EliminationAnimation";
import { RankingTableModal } from "@/components/RankingTableModal";
import { AssigningIdentitiesScreen } from "@/components/AssigningIdentitiesScreen";
import { SettingsHelpModal } from "@/components/SettingsHelpModal";
import { ConnectionLostScreen } from "@/components/ConnectionLostScreen";
import { LobbyLoadingScreen } from "@/components/LobbyLoadingScreen";
import { RoundTransitionScreen } from "@/components/RoundTransitionScreen";
import styles from "./page.module.css";

const LOADING_MIN_MS = 3000;

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const roomCode = (params?.code as string) ?? "";
  const displayName = searchParams?.get("displayName") ?? "";
  /** Only set when non-empty so we don't close the socket when roomCode flickers to "" during hydration. */
  const [stableRoomCode, setStableRoomCode] = useState("");
  useEffect(() => {
    if (roomCode?.trim()) setStableRoomCode((prev) => roomCode.trim());
  }, [roomCode]);
  const reconnectToken = useMemo(
    () => (typeof window !== "undefined" ? sessionStorage.getItem(`reconnect_${roomCode}`) : null),
    [roomCode]
  );
  const name = displayName?.trim() || getGuestDisplayName(t);

  const { gameState, playerId, connectionStatus, error, setError, showEliminationModal, setShowEliminationModal, showAssigningTransition, setShowAssigningTransition, showRoundTransition, setShowRoundTransition, roundTransitionRound, showSettingsHelpModal, setShowSettingsHelpModal, settingsHelpModalTab, joinFailed } = useGameStore();
  const { send, connect } = useGameSocket(stableRoomCode, name, reconnectToken);

  useEffect(() => {
    if (playerId && reconnectToken) {
      sessionStorage.setItem(`reconnect_${roomCode}`, reconnectToken);
    }
  }, [playerId, reconnectToken, roomCode]);

  const phase = gameState?.phase ?? "lobby";
  const me = gameState?.players?.find((p) => p.id === playerId);
  const isSpectator = me?.status === "spectator" || me?.status === "eliminated";
  const showConnectionLost = connectionStatus === "disconnected" || joinFailed;
  const hasJoined = !!playerId && !!gameState;

  const loadStartRef = useRef<number | null>(null);
  const [loadingMinElapsed, setLoadingMinElapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lobbyChatCollapsed, setLobbyChatCollapsed] = useState(true);

  /* In round end / final results view, sidebar is collapsed by default. */
  useEffect(() => {
    if (phase === "round_ended" || phase === "ended") setSidebarCollapsed(true);
  }, [phase]);

  useEffect(() => {
    if (!roomCode?.trim() || showConnectionLost) return;
    if (loadStartRef.current === null) loadStartRef.current = Date.now();
    const elapsed = Date.now() - (loadStartRef.current ?? 0);
    if (elapsed >= LOADING_MIN_MS) {
      setLoadingMinElapsed(true);
      return;
    }
    const remaining = LOADING_MIN_MS - elapsed;
    const t = setTimeout(() => setLoadingMinElapsed(true), remaining);
    return () => clearTimeout(t);
  }, [roomCode, showConnectionLost]);

  const showLoadingScreen =
    !showConnectionLost && (!hasJoined || !loadingMinElapsed);

  return (
    <main className={styles.main}>
      {showConnectionLost ? (
        <ConnectionLostScreen
          roomCode={roomCode}
          displayName={name}
          onRejoin={connect}
          showConnectionCrisis={connectionStatus === "disconnected" && error !== "KICKED"}
          showNotFound={joinFailed}
          kickedMessage={error === "KICKED" ? "kicked" : error}
        />
      ) : showLoadingScreen ? (
        <LobbyLoadingScreen roomCode={stableRoomCode || roomCode} />
      ) : (
        <>
      {phase === "lobby" ? <Shell /> : phase === "assigning" ? null : phase === "playing" && (showAssigningTransition || showRoundTransition) ? null : (
        <GameHeader
          playersCount={gameState?.players?.length ?? 0}
          maxPlayers={8}
          deckCount={gameState?.deckCount ?? 0}
        />
      )}
      {error && (
        <div className={styles.errorBar} role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {(connectionStatus === "connected" || hasJoined) && (
        <>
          {phase === "lobby" ? (
            <div className={styles.lobbyLayout}>
              <div className={styles.lobbyColumn}>
                <Lobby send={send} />
              </div>
              <div className={`${styles.chatColumn} ${lobbyChatCollapsed ? styles.chatColumnCollapsed : ""}`}>
                <ChatPanel
                  send={send}
                  onCollapsedChange={setLobbyChatCollapsed}
                  sidebarCompact={lobbyChatCollapsed}
                />
              </div>
            </div>
          ) : phase === "assigning" || (phase === "playing" && showAssigningTransition && !showRoundTransition) ? (
            <AssigningIdentitiesScreen
              roomCode={roomCode}
              onComplete={
                phase === "playing" && showAssigningTransition
                  ? () => setShowRoundTransition(true, 1)
                  : undefined
              }
            />
          ) : phase === "playing" && showRoundTransition ? (
            <RoundTransitionScreen
              roundNumber={roundTransitionRound}
              snacksRemaining={gameState?.players?.filter((p) => p.status !== "eliminated" && p.status !== "spectator").length ?? 0}
              onComplete={() => {
                send("round_transition_complete", {});
                setShowRoundTransition(false);
                setShowAssigningTransition(false);
              }}
            />
          ) : phase === "round_ended" || phase === "ended" ? (
            <div className={`${styles.gameLayout} ${styles.gameLayoutEnded}`}>
              <div className={styles.gameMain}>
                <RoundEndScreen
                  send={send}
                  isFinalRound={phase === "ended"}
                />
              </div>
              <aside
                className={`${styles.gameSidebar} ${styles.gameSidebarEnded} ${sidebarCollapsed ? styles.gameSidebarCollapsed : ""}`}
              >
                <ChatPanel
                  send={send}
                  variant="game"
                  onCollapsedChange={setSidebarCollapsed}
                  sidebarCompact={sidebarCollapsed}
                />
              </aside>
            </div>
          ) : (
            <div className={styles.gameLayout}>
              {isSpectator && <SpectatorBanner />}
              <div className={styles.gameMain}>
                <GameTable send={send} />
              </div>
              <aside
                className={`${styles.gameSidebar} ${sidebarCollapsed ? styles.gameSidebarCollapsed : ""}`}
              >
                <ChatPanel
                  send={send}
                  variant="game"
                  onCollapsedChange={setSidebarCollapsed}
                  sidebarCompact={sidebarCollapsed}
                />
              </aside>
            </div>
          )}
        </>
      )}
      {showEliminationModal && (
        <EliminationModal onClose={() => setShowEliminationModal(false)} />
      )}
      <CardRevealNotification />
      <EliminationAnimation />
      <RankingTableModal />
      {showSettingsHelpModal && (
        <SettingsHelpModal
          onClose={() => setShowSettingsHelpModal(false)}
          initialTab={settingsHelpModalTab}
          send={connectionStatus === "connected" || hasJoined ? send : undefined}
          canLeaveGame
        />
      )}
      <div className={styles.footerBar} aria-hidden />
        </>
      )}
    </main>
  );
}
