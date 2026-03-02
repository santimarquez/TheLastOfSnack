"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import type { GameStateView, PlayerView } from "@last-of-snack/shared";
import styles from "./GameEndScreen.module.css";

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface GameEndScreenProps {
  send: SendFn;
}

/** Snack points formula: base 50 + 10/elimination + 1 per 10s survived */
function computeSnackPoints(
  _gs: GameStateView,
  _p: PlayerView,
  eliminations: number,
  survivalMs: number
): number {
  let pts = 50;
  pts += eliminations * 10;
  pts += Math.floor((Number.isFinite(survivalMs) ? survivalMs : 0) / 10_000);
  return pts;
}

function formatSurvivalTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameEndScreen({ send }: GameEndScreenProps) {
  const { t } = useTranslations();
  const { gameState, playerId, isHost } = useGameStore();
  const { muted, toggleMuted } = useSoundStore();
  const winnerId = gameState?.winnerId ?? null;
  const players = gameState?.players ?? [];
  const winner = winnerId ? players.find((p) => p.id === winnerId) : null;
  const winnerName = winner?.displayName ?? t("gameEnd.winnerNameFallback");

  const gameStartedAt = gameState?.gameStartedAt ?? 0;
  const gameEndedAt = gameState?.gameEndedAt ?? Date.now();
  const eliminationsByPlayerId = gameState?.eliminationsByPlayerId ?? {};

  const winnerEliminations = winnerId ? (eliminationsByPlayerId[winnerId] ?? 0) : 0;
  const winnerSurvivalMs = gameStartedAt ? gameEndedAt - gameStartedAt : 0;
  const winnerSnackPoints =
    gameState && winner
      ? computeSnackPoints(gameState, winner, winnerEliminations, winnerSurvivalMs)
      : 0;

  function handlePlayAgain() {
    if (isHost) send("restart", {});
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.actions}>
          {MUSIC_ENABLED && (
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={muted ? t("common.unmute") : t("common.mute")}
              onClick={toggleMuted}>
              <span className="material-symbols-outlined">
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
          )}
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t("common.share")}>
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.heroCard}>
          <div className={styles.heroBg} aria-hidden />
          <div className={styles.heroInner}>
            <div className={styles.heroWinnerRow}>
              <div className={styles.characterSpotlight}>
                <div className={styles.characterGlow} aria-hidden />
                <div className={styles.characterIcon}>
                  {winner?.avatarUrl ? (
                    <img
                      src={winner.avatarUrl}
                      alt=""
                      className={styles.characterAvatar}
                    />
                  ) : (
                    <span className="material-symbols-outlined">restaurant</span>
                  )}
                </div>
              </div>
              <div className={styles.heroWinnerText}>
                <h1 className={styles.victoryTitle}>
                  <span className={styles.victoryTitleName}>
                    {winnerName.toUpperCase().replace(/\s+/g, " ")}
                  </span>{" "}
                  {t("gameEnd.survived")}
                </h1>
                <p className={styles.winnerBanner}>{t("gameEnd.winner")}</p>
              </div>
            </div>
          </div>
          <div
            className={styles.decorIcon}
            data-position="top-left"
            aria-hidden>
            <span className="material-symbols-outlined">celebration</span>
          </div>
          <div
            className={styles.decorIcon}
            data-position="bottom-right"
            aria-hidden>
            <span className="material-symbols-outlined">star</span>
          </div>
          <div className={styles.decorIcon} data-position="left" aria-hidden>
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {t("gameEnd.eliminations")}
            </span>
            <span className={styles.statValue}>{winnerEliminations}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {t("gameEnd.timeSurvived")}
            </span>
            <span className={styles.statValue}>
              {formatSurvivalTime(winnerSurvivalMs)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("gameEnd.snackPoints")}</span>
            <span className={styles.statValue}>{winnerSnackPoints}</span>
          </div>
        </div>

        <div className={styles.resultsSection}>
          <h3 className={styles.resultsTitle}>
            <span className="material-symbols-outlined">leaderboard</span>
            {t("gameEnd.matchResults")}
          </h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("gameEnd.player")}</th>
                  <th>{t("gameEnd.eliminations")}</th>
                  <th>{t("gameEnd.timeSurvived")}</th>
                  <th>{t("gameEnd.snackPoints")}</th>
                  <th>{t("gameEnd.achievements")}</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const isYou = p.id === playerId;
                  const isWinner = p.id === winnerId;
                  const elims = p.eliminationsCount ?? eliminationsByPlayerId[p.id] ?? 0;
                  const eliminatedAt = p.eliminatedAt ?? gameState?.eliminatedAt?.[p.id];
                  const survivalMs =
                    gameStartedAt && (isWinner || eliminatedAt != null)
                      ? isWinner
                        ? gameEndedAt - gameStartedAt
                        : eliminatedAt! - gameStartedAt
                      : NaN;
                  const snackPts =
                    gameState && p
                      ? computeSnackPoints(gameState, p, elims, survivalMs)
                      : 0;
                  return (
                    <tr key={p.id} className={isWinner ? styles.rowWinner : ""}>
                      <td>
                        <div className={styles.playerCell}>
                          <div className={styles.playerAvatar}>
                            {p.avatarUrl ? (
                              <img
                                src={p.avatarUrl}
                                alt=""
                                className={styles.playerAvatarImg}
                              />
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
                      <td>{elims}</td>
                      <td>
                        {Number.isFinite(survivalMs)
                          ? formatSurvivalTime(survivalMs)
                          : "—"}
                      </td>
                      <td>{snackPts}</td>
                      <td>
                        <div className={styles.achievements}>
                          {isWinner && (
                            <>
                              <span className={styles.badgePrimary}>
                                {t("gameEnd.badgeSurvivor")}
                              </span>
                              <span className={styles.badgeAmber}>
                                {t("gameEnd.badgeMvp")}
                              </span>
                            </>
                          )}
                          {!isWinner && (
                            <span className={styles.badgeNeutral}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.buttonsRow}>
          <button
            type="button"
            className={styles.btnPlayAgain}
            onClick={handlePlayAgain}
            disabled={!isHost}
            title={
              isHost
                ? t("gameEnd.playAgainTitle")
                : t("gameEnd.playAgainTitleHostOnly")
            }>
            <span className="material-symbols-outlined">replay</span>
            {t("gameEnd.playAgain")}
          </button>
          <Link href="/" className={styles.btnBackToLobby}>
            <span className="material-symbols-outlined">home</span>
            {t("gameEnd.backToLobby")}
          </Link>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>{t("gameEnd.footerCopy")}</p>
      </footer>
    </main>
  );
}
