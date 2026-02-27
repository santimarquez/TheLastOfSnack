"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./GameTable.module.css";

function useIsHost() {
  return useGameStore((s) => s.isHost);
}

type SendFn = (type: string, payload: Record<string, unknown>) => void;

/** Order players so "me" is at bottom (index n/2). */
function orderPlayersForArena<T>(items: T[], meIndex: number): T[] {
  if (meIndex < 0 || items.length === 0) return items;
  const n = items.length;
  const others = items.filter((_, i) => i !== meIndex);
  const me = items[meIndex];
  const mid = Math.floor(n / 2);
  return [...others.slice(0, mid), me, ...others.slice(mid)];
}

export function GameTable({ send }: { send: SendFn }) {
  const { t } = useTranslations();
  const { gameState, playerId } = useGameStore();
  const isHost = useIsHost();
  const phase = gameState?.phase ?? "lobby";
  const me = gameState?.players?.find((p) => p.id === playerId);
  const players = gameState?.players ?? [];
  const meIndex = players.findIndex((p) => p.id === playerId);
  const orderedPlayers = orderPlayersForArena(players, meIndex >= 0 ? meIndex : 0);
  const currentPlayerId =
    phase === "playing" && gameState?.turnOrder?.length
      ? gameState.turnOrder[gameState.currentTurnIndex]
      : null;
  const isMyTurn = currentPlayerId === playerId;
  const turnStartedAt = gameState?.turnStartedAt ?? 0;
  const turnTimeoutSec = gameState?.turnTimeoutSec ?? 60;

  const myHand = me?.hand ?? [];
  const myRole = me?.role;
  const revealedRoles = gameState?.revealedRoles ?? {};
  const deckCount = gameState?.deckCount ?? 0;
  const currentPlayer = currentPlayerId
    ? players.find((p) => p.id === currentPlayerId)
    : null;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "playing" || !isMyTurn) return;
    const interval = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, isMyTurn]);

  // Timer: remaining seconds
  const elapsed = (Date.now() - turnStartedAt) / 1000;
  const remainingSec = Math.max(0, Math.min(turnTimeoutSec, Math.floor(turnTimeoutSec - elapsed)));
  const timerPct = turnTimeoutSec > 0 ? (remainingSec / turnTimeoutSec) * 100 : 0;

  return (
    <>
      <section className={styles.arenaSection}>
        <div className={styles.arenaBg} />
        <div className={styles.arenaCircle}>
          <div className={styles.arenaInnerDashed} />
          <div className={styles.discardPile}>
            <div className={styles.discardCard}>
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <span className={styles.discardLabel}>{t("gameTable.discardPile")}</span>
          </div>
          {orderedPlayers.map((p, i) => {
            const n = orderedPlayers.length;
            const isYou = p.id === playerId;
            const isCurrent = p.id === currentPlayerId;
            const angle = 90 - (360 / n) * i;
            return (
              <div
                key={p.id}
                className={`${styles.playerSlot} ${isYou ? styles.playerSlotYou : ""} ${isCurrent ? styles.playerSlotCurrent : ""} ${p.status === "spectator" ? styles.playerSlotOut : ""}`}
                style={{
                  ["--slot-angle" as string]: `${angle}deg`,
                }}
              >
                {isCurrent && isYou && (
                  <div className={styles.yourTurnBadge}>{t("gameTable.yourTurn")}</div>
                )}
                {isCurrent && !isYou && (
                  <div className={styles.theirTurnBadge}>
                    {t("gameTable.waitingForTurn", { name: p.displayName })}
                  </div>
                )}
                <div className={styles.playerAvatar}>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className={styles.playerAvatarImg} />
                  ) : (
                    <span className="material-symbols-outlined">lunch_dining</span>
                  )}
                </div>
                <span className={styles.playerSlotName}>
                  {isYou ? t("gameTable.you") : p.displayName}
                </span>
                {revealedRoles[p.id] && (
                  <span className={styles.playerSlotRole}>{revealedRoles[p.id].name}</span>
                )}
                {p.status === "spectator" && <span className={styles.playerSlotOutLabel}>{t("gameTable.out")}</span>}
              </div>
            );
          })}
        </div>
      </section>

      <footer className={styles.hud}>
        <div className={styles.hudLeft}>
          <div className={styles.secretCard}>
            <span className={styles.hudLabel}>{t("gameTable.secretIdentity")}</span>
            <div className={styles.secretCardInner}>
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className={styles.secretCardAvatar} />
              ) : (
                <span className="material-symbols-outlined">restaurant</span>
              )}
              <p className={styles.secretCardName}>{myRole?.name ?? "?"}</p>
            </div>
          </div>
          <div className={styles.weaknessCard}>
            <span className={styles.hudLabelWeakness}>{t("gameTable.weakness")}</span>
            <div className={styles.weaknessContent}>
              {myRole?.weakness && myRole?.eliminatedBy ? (
                <>
                  <span className={styles.weaknessName}>{myRole.weakness}</span>
                  <span className={styles.weaknessEliminatedBy}>{myRole.eliminatedBy}</span>
                </>
              ) : (
                <span className={styles.weaknessName}>—</span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.hudDivider} />
        {isMyTurn ? (
          <>
            <div className={styles.handSection}>
              <div className={styles.handCards}>
                {myHand.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.card} ${styles.cardPlayable}`}
                    onClick={() => send("play_card", { cardId: c.id })}
                    disabled={phase !== "playing"}
                    title={c.type}
                  >
                    <div className={styles.cardIcon}>
                      <span className="material-symbols-outlined">restaurant_menu</span>
                    </div>
                    <h3 className={styles.cardTitle}>{c.type}</h3>
                    <p className={styles.cardDesc}>{c.type} {t("gameTable.cardTypeSuffix")}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.hudRight}>
              <div className={styles.timerWrap}>
                <svg className={styles.timerSvg} viewBox="0 0 80 80">
                  <circle className={styles.timerBg} cx="40" cy="40" r="34" />
                  <circle
                    className={styles.timerFill}
                    cx="40"
                    cy="40"
                    r="34"
                    style={{
                      strokeDasharray: 213.6,
                      strokeDashoffset: 213.6 - (213.6 * timerPct) / 100,
                    }}
                  />
                </svg>
                <div className={styles.timerText}>
                  <span className={styles.timerNum}>{remainingSec}</span>
                  <span className={styles.timerUnit}>{t("gameTable.timerUnit")}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.endTurnBtn}
                disabled={phase !== "playing"}
                title={t("gameTable.endTurnTitle")}
              >
                <span>{t("gameTable.endTurn")}</span>
                <span className="material-symbols-outlined">double_arrow</span>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.waitingForTurn}>
            <div className={styles.waitingAvatar}>
              {currentPlayer?.avatarUrl ? (
                <img src={currentPlayer.avatarUrl} alt="" className={styles.waitingAvatarImg} />
              ) : (
                <span className="material-symbols-outlined">lunch_dining</span>
              )}
            </div>
            <p className={styles.waitingText}>
              {currentPlayer
                ? t("gameTable.waitingForTurn", { name: currentPlayer.displayName })
                : t("gameTable.notYourTurnTitle")}
            </p>
          </div>
        )}
      </footer>
    </>
  );
}
