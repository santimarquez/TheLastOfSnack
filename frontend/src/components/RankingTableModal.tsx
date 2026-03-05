"use client";

import { createPortal } from "react-dom";
import { useState, useCallback } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import type { GameStateView, PlayerView, RoundResult } from "@last-of-snack/shared";
import styles from "./GameEndScreen.module.css";

function getShareUrl(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_SITE_URL ?? "https://thelastofsnack.com";
  return window.location.origin;
}

function computeSnackPointsForRound(
  _gs: GameStateView,
  _p: PlayerView,
  eliminations: number,
  survivalMs: number,
  isLastSnackStanding: boolean
): number {
  let pts = 50;
  pts += eliminations * 10;
  pts += Math.floor((Number.isFinite(survivalMs) ? survivalMs : 0) / 10_000);
  if (isLastSnackStanding) pts += 20;
  return pts;
}

function formatSurvivalTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getAccumulatedStats(
  players: PlayerView[],
  roundResults: RoundResult[]
): Map<string, { totalEliminations: number; totalSurvivalMs: number; totalSnackPoints: number }> {
  const map = new Map<
    string,
    { totalEliminations: number; totalSurvivalMs: number; totalSnackPoints: number }
  >();
  for (const p of players) {
    map.set(p.id, { totalEliminations: 0, totalSurvivalMs: 0, totalSnackPoints: 0 });
  }
  if (!roundResults.length) return map;
  for (const rr of roundResults) {
    const gameStartedAt = rr.gameStartedAt;
    const gameEndedAt = rr.gameEndedAt;
    for (const p of players) {
      const elims = rr.eliminationsByPlayerId[p.id] ?? 0;
      const eliminatedAt = rr.eliminatedAt[p.id];
      const isWinner = rr.winnerId ? p.id === rr.winnerId : false;
      const survivalMs =
        isWinner ? gameEndedAt - gameStartedAt : eliminatedAt != null ? eliminatedAt - gameStartedAt : 0;
      const pts = computeSnackPointsForRound(
        {} as GameStateView,
        p,
        elims,
        Number.isFinite(survivalMs) ? survivalMs : 0,
        isWinner
      );
      const acc = map.get(p.id)!;
      acc.totalEliminations += elims;
      acc.totalSurvivalMs += Number.isFinite(survivalMs) ? survivalMs : 0;
      acc.totalSnackPoints += pts;
    }
  }
  return map;
}

/** Build round results including current in-progress round when phase === "playing". */
function getRoundResultsWithCurrent(gameState: GameStateView | null): RoundResult[] {
  if (!gameState) return [];
  const completed = gameState.roundResults ?? [];
  if (gameState.phase !== "playing") return completed;
  const now = Date.now();
  const gameStartedAt = gameState.gameStartedAt ?? now;
  const virtualRound: RoundResult = {
    round: (gameState.currentRound ?? 1) as 1 | 2 | 3,
    winnerId: "",
    eliminationsByPlayerId: { ...(gameState.eliminationsByPlayerId ?? {}) },
    eliminatedAt: { ...(gameState.eliminatedAt ?? {}) },
    gameStartedAt,
    gameEndedAt: now,
  };
  return [...completed, virtualRound];
}

export function RankingTableModal() {
  const { t } = useTranslations();
  const gameState = useGameStore((s) => s.gameState);
  const playerId = useGameStore((s) => s.playerId);
  const setShowRankingModal = useGameStore((s) => s.setShowRankingModal);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const title = t("gameEnd.shareTitle");
    const text = t("gameEnd.shareTextFinal");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard?.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [t]);

  const show = useGameStore((s) => s.showRankingModal);
  if (!show || typeof document === "undefined") return null;

  const players = gameState?.players ?? [];
  const roundResultsWithCurrent = getRoundResultsWithCurrent(gameState);
  const accumulated = getAccumulatedStats(players, roundResultsWithCurrent);

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ranking-modal-title"
      onClick={() => setShowRankingModal(false)}
    >
      <div
        className={styles.rankingModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 id="ranking-modal-title" style={{ margin: 0, fontSize: "1.25rem" }}>
            {t("gameEnd.matchResults")}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className={styles.shareWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={linkCopied ? t("common.linkCopied") : t("common.share")}
                onClick={handleShare}
              >
                <span className="material-symbols-outlined">share</span>
              </button>
              {linkCopied && (
                <span className={styles.shareCopied} role="status" aria-live="polite">
                  {t("common.linkCopied")}
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={t("common.close")}
              onClick={() => setShowRankingModal(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("gameEnd.player")}</th>
                <th>{t("gameEnd.eliminations")}</th>
                <th>{t("gameEnd.timeSurvived")}</th>
                <th>{t("gameEnd.snackPoints")}</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const isYou = p.id === playerId;
                const acc = accumulated.get(p.id) ?? {
                  totalEliminations: 0,
                  totalSurvivalMs: 0,
                  totalSnackPoints: 0,
                };
                return (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.playerCell}>
                        <div className={styles.playerAvatar}>
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className={styles.playerAvatarImg} />
                          ) : (
                            <span className={styles.playerAvatarInitial}>
                              {(p.displayName?.[0] ?? "?").toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className={isYou ? styles.playerNameYou : ""}>
                          {p.displayName}
                          {isYou ? ` ${t("gameEnd.you")}` : ""}
                        </span>
                      </div>
                    </td>
                    <td>{acc.totalEliminations}</td>
                    <td>{formatSurvivalTime(acc.totalSurvivalMs)}</td>
                    <td>{acc.totalSnackPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => setShowRankingModal(false)}
          style={{ marginTop: "1rem", width: "100%" }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>,
    document.body
  );
}
