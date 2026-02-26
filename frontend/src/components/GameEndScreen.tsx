"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import styles from "./GameEndScreen.module.css";

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface GameEndScreenProps {
  send: SendFn;
}

export function GameEndScreen({ send }: GameEndScreenProps) {
  const { t } = useTranslations();
  const { gameState, playerId, isHost, setShowSettingsHelpModal } = useGameStore();
  const { muted, toggleMuted } = useSoundStore();
  const winnerId = gameState?.winnerId ?? null;
  const players = gameState?.players ?? [];
  const winner = winnerId ? players.find((p) => p.id === winnerId) : null;
  const winnerName = winner?.displayName ?? t("gameEnd.winnerNameFallback");

  function handlePlayAgain() {
    if (isHost) send("restart", {});
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoWrap}>
          <span className="material-symbols-outlined">restaurant_menu</span>
          <h2 className={styles.logoText}>{t("common.appName")}</h2>
        </Link>
        <div className={styles.actions}>
          {MUSIC_ENABLED && (
            <button type="button" className={styles.iconBtn} aria-label={muted ? t("common.unmute") : t("common.mute")} onClick={toggleMuted}>
              <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
            </button>
          )}
          <button type="button" className={styles.iconBtn} aria-label={t("common.settings")} onClick={() => setShowSettingsHelpModal(true, "settings")}>
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button type="button" className={styles.iconBtn} aria-label={t("common.share")}>
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.heroCard}>
          <div className={styles.heroBg} aria-hidden />
          <div className={styles.heroInner}>
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
            <h1 className={styles.victoryTitle}>
              <span className={styles.victoryTitleName}>{winnerName.toUpperCase().replace(/\s+/g, " ")}</span>{" "}
              {t("gameEnd.survived")}
            </h1>
            <p className={styles.winnerBanner}>{t("gameEnd.winner")}</p>
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
            <span className={styles.statValue}>—</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("gameEnd.timeSurvived")}</span>
            <span className={styles.statValue}>—</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t("gameEnd.snackPoints")}</span>
            <span className={styles.statValue}>—</span>
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
                  <th>{t("gameEnd.eliminated")}</th>
                  <th>{t("gameEnd.achievements")}</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const isYou = p.id === playerId;
                  const isWinner = p.id === winnerId;
                  return (
                    <tr key={p.id} className={isWinner ? styles.rowWinner : ""}>
                      <td>
                        <div className={styles.playerCell}>
                          <div className={styles.playerAvatar}>
                            {(p.displayName?.[0] ?? "?").toUpperCase()}
                          </div>
                          <span className={isYou ? styles.playerNameYou : ""}>
                            {p.displayName}
                            {isYou ? ` ${t("gameEnd.you")}` : ""}
                          </span>
                        </div>
                      </td>
                      <td>{isWinner ? t("gameEnd.winnerLabel") : t("gameEnd.eliminatedLabel")}</td>
                      <td>
                        <div className={styles.achievements}>
                          {isWinner && (
                            <>
                              <span className={styles.badgePrimary}>{t("gameEnd.badgeSurvivor")}</span>
                              <span className={styles.badgeAmber}>{t("gameEnd.badgeMvp")}</span>
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
            title={isHost ? t("gameEnd.playAgainTitle") : t("gameEnd.playAgainTitleHostOnly")}
          >
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
