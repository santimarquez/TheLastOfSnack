"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import type { GameStateView, PlayerView, RoundResult } from "@last-of-snack/shared";
import styles from "./GameEndScreen.module.css";

function getShareUrl(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_SITE_URL ?? "https://thelastofsnack.com";
  return window.location.origin;
}

const REVEAL_INTERVAL_MS = 1200;
const REVEAL_TRANSITION_MS = 1000;

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface RoundEndScreenProps {
  send: SendFn;
  /** True when phase === "ended" (after round 3). */
  isFinalRound: boolean;
}

/** Snack points formula: base 50 + 10/elimination + 1 per 10s survived + 20 for last snack standing */
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

/** Compute accumulated stats from roundResults for all players (by player id). */
function getAccumulatedStats(
  players: PlayerView[],
  roundResults: RoundResult[] | undefined
): Map<
  string,
  { totalEliminations: number; totalSurvivalMs: number; totalSnackPoints: number }
> {
  const map = new Map<
    string,
    { totalEliminations: number; totalSurvivalMs: number; totalSnackPoints: number }
  >();
  for (const p of players) {
    map.set(p.id, { totalEliminations: 0, totalSurvivalMs: 0, totalSnackPoints: 0 });
  }
  if (!roundResults?.length) return map;

  for (const rr of roundResults) {
    const gameStartedAt = rr.gameStartedAt;
    const gameEndedAt = rr.gameEndedAt;
    for (const p of players) {
      const elims = rr.eliminationsByPlayerId[p.id] ?? 0;
      const eliminatedAt = rr.eliminatedAt[p.id];
      const isWinner = p.id === rr.winnerId;
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

/** Top 3 players by total Snack Points (first = index 0). */
function getTop3BySnackPoints(
  players: PlayerView[],
  accumulated: Map<string, { totalSnackPoints: number }>
): [PlayerView | null, PlayerView | null, PlayerView | null] {
  const sorted = [...players].sort(
    (a, b) => (accumulated.get(b.id)?.totalSnackPoints ?? 0) - (accumulated.get(a.id)?.totalSnackPoints ?? 0)
  );
  return [sorted[0] ?? null, sorted[1] ?? null, sorted[2] ?? null];
}

export function RoundEndScreen({ send, isFinalRound }: RoundEndScreenProps) {
  const { t } = useTranslations();
  const { gameState, playerId, isHost } = useGameStore();
  const { muted, toggleMuted } = useSoundStore();
  const winnerId = gameState?.winnerId ?? null;
  const players = gameState?.players ?? [];
  const winner = winnerId ? players.find((p) => p.id === winnerId) : null;
  const winnerName = winner?.displayName ?? t("gameEnd.winnerNameFallback");
  const currentRound = gameState?.currentRound ?? 1;
  const roundResults = gameState?.roundResults ?? [];

  const accumulated = getAccumulatedStats(players, roundResults);
  const [first, second, third] = getTop3BySnackPoints(players, accumulated);
  const winnerAcc = winnerId ? accumulated.get(winnerId) : null;
  const winnerEliminations = winnerAcc?.totalEliminations ?? 0;
  const winnerSurvivalMs = winnerAcc?.totalSurvivalMs ?? 0;
  const winnerSnackPoints = winnerAcc?.totalSnackPoints ?? 0;

  const [podiumRevealStep, setPodiumRevealStep] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const title = t("gameEnd.shareTitle");
    const text = isFinalRound ? t("gameEnd.shareTextFinal") : t("gameEnd.shareText", { round: String(currentRound) });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
    }
    const copyText = isFinalRound
      ? t("gameEnd.shareCopyTextFinal", { url })
      : t("gameEnd.shareCopyText", { round: String(currentRound), url });
    try {
      await navigator.clipboard?.writeText(copyText);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [t, isFinalRound, currentRound]);

  useEffect(() => {
    if (!isFinalRound) return;
    const t1 = setTimeout(() => setPodiumRevealStep(1), 1 * REVEAL_INTERVAL_MS);
    const t2 = setTimeout(() => setPodiumRevealStep(2), 2 * REVEAL_INTERVAL_MS);
    const t3 = setTimeout(() => setPodiumRevealStep(3), 3 * REVEAL_INTERVAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFinalRound]);

  function handlePlayAgain() {
    if (isHost) send("restart", {});
  }

  function handleContinue() {
    if (isHost) send("start_next_round", {});
  }

  const nextRound = (currentRound + 1) as 1 | 2 | 3;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.actions}>
          {MUSIC_ENABLED && (
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={muted ? t("common.unmute") : t("common.mute")}
              onClick={toggleMuted}
            >
              <span className="material-symbols-outlined">
                {muted ? "volume_off" : "volume_up"}
              </span>
            </button>
          )}
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
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.heroCard}>
          <div className={styles.heroBg} aria-hidden />
          <div className={styles.heroInner}>
            {isFinalRound ? (
              <>
                <h1
                  className={`${styles.podiumTitle} ${podiumRevealStep >= 3 ? styles.podiumReveal : ""}`}
                  aria-hidden={podiumRevealStep < 3}
                >
                  {t("gameEnd.podiumTitle")}
                </h1>
                {winner && (
                  <p
                    className={`${styles.podiumSubtitle} ${podiumRevealStep >= 3 ? styles.podiumReveal : ""}`}
                    aria-hidden={podiumRevealStep < 3}
                  >
                    {t("gameEnd.winnerSubtitleFinal", { name: winner.displayName ?? winnerName })}
                  </p>
                )}
                <div className={styles.podiumRow}>
                  {second && (
                    <div
                      className={`${styles.podiumCol} ${styles.podiumCol2nd} ${podiumRevealStep >= 0 ? styles.podiumReveal : ""}`}
                      aria-hidden={podiumRevealStep < 0}
                    >
                      <div className={styles.podiumHead}>
                        {second.avatarUrl ? (
                          <img src={second.avatarUrl} alt="" className={styles.podiumAvatar} />
                        ) : (
                          <span className={styles.podiumAvatarFallback}>
                            {(second.displayName?.[0] ?? "?").toUpperCase()}
                          </span>
                        )}
                        <span className={`material-symbols-outlined ${styles.podiumMedal2nd}`} aria-hidden>military_tech</span>
                        <span className={styles.podiumName2nd}>
                          {second.displayName}
                          {second.id === playerId ? ` ${t("gameEnd.you")}` : ""}
                        </span>
                      </div>
                      <div className={`${styles.podiumPlatform} ${styles.podiumPlatform2nd}`}>
                        <span className={styles.podiumNumber}>2</span>
                      </div>
                    </div>
                  )}
                  {first && (
                    <div
                      className={`${styles.podiumCol} ${styles.podiumCol1st} ${podiumRevealStep >= 2 ? styles.podiumReveal : ""}`}
                      aria-hidden={podiumRevealStep < 2}
                    >
                      <div className={styles.podiumHead}>
                        {first.avatarUrl ? (
                          <img src={first.avatarUrl} alt="" className={styles.podiumAvatar} />
                        ) : (
                          <span className={styles.podiumAvatarFallback}>
                            {(first.displayName?.[0] ?? "?").toUpperCase()}
                          </span>
                        )}
                        <span className={`material-symbols-outlined ${styles.podiumMedal1st}`} aria-hidden>workspace_premium</span>
                        <span className={styles.podiumName1st}>
                          {first.displayName}
                          {first.id === playerId ? ` ${t("gameEnd.you")}` : ""}
                        </span>
                      </div>
                      <div className={`${styles.podiumPlatform} ${styles.podiumPlatform1st}`}>
                        <span className={styles.podiumNumber}>1</span>
                      </div>
                    </div>
                  )}
                  {third && (
                    <div
                      className={`${styles.podiumCol} ${styles.podiumCol3rd} ${podiumRevealStep >= 1 ? styles.podiumReveal : ""}`}
                      aria-hidden={podiumRevealStep < 1}
                    >
                      <div className={styles.podiumHead}>
                        {third.avatarUrl ? (
                          <img src={third.avatarUrl} alt="" className={styles.podiumAvatar} />
                        ) : (
                          <span className={styles.podiumAvatarFallback}>
                            {(third.displayName?.[0] ?? "?").toUpperCase()}
                          </span>
                        )}
                        <span className={`material-symbols-outlined ${styles.podiumMedal3rd}`} aria-hidden>military_tech</span>
                        <span className={styles.podiumName3rd}>
                          {third.displayName}
                          {third.id === playerId ? ` ${t("gameEnd.you")}` : ""}
                        </span>
                      </div>
                      <div className={`${styles.podiumPlatform} ${styles.podiumPlatform3rd}`}>
                        <span className={styles.podiumNumber}>3</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
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
                  <p className={styles.winnerBanner}>
                    {t("gameEnd.roundComplete", { round: String(currentRound) })}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className={styles.decorIcon} data-position="top-left" aria-hidden>
            <span className="material-symbols-outlined">celebration</span>
          </div>
          <div className={styles.decorIcon} data-position="bottom-right" aria-hidden>
            <span className="material-symbols-outlined">star</span>
          </div>
          <div className={styles.decorIcon} data-position="left" aria-hidden>
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("gameEnd.eliminations")}</span>
            <span className={styles.statValue}>{winnerEliminations}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("gameEnd.timeSurvived")}</span>
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
            {isFinalRound ? t("gameEnd.finalResults") : t("gameEnd.matchResults")}
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
                  const isRoundWinner = p.id === winnerId;
                  const acc = accumulated.get(p.id) ?? {
                    totalEliminations: 0,
                    totalSurvivalMs: 0,
                    totalSnackPoints: 0,
                  };
                  return (
                    <tr
                      key={p.id}
                      className={isRoundWinner ? styles.rowWinner : ""}
                    >
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
                      <td>{acc.totalEliminations}</td>
                      <td>{formatSurvivalTime(acc.totalSurvivalMs)}</td>
                      <td>{acc.totalSnackPoints}</td>
                      <td className={styles.achievementsCell}>
                        <div className={styles.achievements}>
                          {(() => {
                            let survivorShown = false;
                            return roundResults.map((rr, idx) => {
                              const survived = rr.eliminatedAt[p.id] == null;
                              const showSurvivor = survived && !survivorShown;
                              if (survived) survivorShown = true;
                              return (
                                <span key={idx} className={styles.achievementsRound}>
                                  {showSurvivor ? (
                                    <span className={styles.badgePrimary}>
                                      {t("gameEnd.badgeSurvivor")}
                                    </span>
                                  ) : survived ? (
                                    <span className={styles.badgeNeutral}>·</span>
                                  ) : (
                                    <span className={styles.badgeNeutral}>—</span>
                                  )}
                                </span>
                              );
                            });
                          })()}
                          {winnerId === p.id && (
                            <span className={styles.achievementsRound}>
                              <span className={styles.badgeAmber}>
                                {t("gameEnd.badgeMvp")}
                              </span>
                            </span>
                          )}
                          {roundResults.length === 0 && winnerId !== p.id && (
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
          {isFinalRound ? (
            <>
              <button
                type="button"
                className={styles.btnPlayAgain}
                onClick={handlePlayAgain}
                disabled={!isHost}
                title={
                  isHost
                    ? t("gameEnd.playAgainTitle")
                    : t("gameEnd.playAgainTitleHostOnly")
                }
              >
                <span className="material-symbols-outlined">replay</span>
                {t("gameEnd.playAgain")}
              </button>
              <Link href="/" className={styles.btnBackToLobby}>
                <span className="material-symbols-outlined">home</span>
                {t("gameEnd.backToLobby")}
              </Link>
            </>
          ) : (
            <button
              type="button"
              className={styles.btnPlayAgain}
              onClick={handleContinue}
              disabled={!isHost}
              title={
                isHost
                  ? t("gameEnd.continueToRound", { round: String(nextRound) })
                  : t("gameEnd.playAgainTitleHostOnly")
              }
            >
              <span className="material-symbols-outlined">play_arrow</span>
              {t("gameEnd.continueToRound", { round: String(nextRound) })}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
