"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useGameStore } from "@/store/gameStore";
import { useTranslations } from "@/i18n/context";
import styles from "./EliminationAnimation.module.css";

/** Must match server config.eliminationAnimationMs */
const ELIMINATION_ANIMATION_MS = 5000;

/**
 * Returns translation key for main message verb (has been cooked, frozen, etc.)
 */
function getMessageKey(cardType: string): string {
  const card = cardType.toLowerCase().replace(/-/g, "_");
  switch (card) {
    case "microwave":
      return "gameTable.eliminationHasBeenCooked";
    case "freeze":
      return "gameTable.eliminationHasBeenFrozen";
    case "double_salt":
      return "gameTable.eliminationHasBeenSalted";
    case "spoil":
      return "gameTable.eliminationHasBeenSpoiled";
    case "shake":
      return "gameTable.eliminationHasBeenShaken";
    case "steam":
      return "gameTable.eliminationHasBeenSteamed";
    default:
      return "gameTable.eliminationHasBeenEliminated";
  }
}

/**
 * Returns translation key for flavor text
 */
function getFlavorKey(cardType: string): string {
  const card = cardType.toLowerCase().replace(/-/g, "_");
  switch (card) {
    case "microwave":
      return "gameTable.eliminationFlavorMicrowave";
    case "freeze":
      return "gameTable.eliminationFlavorFreeze";
    case "double_salt":
      return "gameTable.eliminationFlavorDoubleSalt";
    case "spoil":
      return "gameTable.eliminationFlavorSpoil";
    case "shake":
      return "gameTable.eliminationFlavorShake";
    case "steam":
      return "gameTable.eliminationFlavorSteam";
    default:
      return "gameTable.eliminationFlavorGeneric";
  }
}

export function EliminationAnimation() {
  const { t } = useTranslations();
  const playerId = useGameStore((s) => s.playerId);
  const eliminationAnimation = useGameStore((s) => s.eliminationAnimation);
  const eliminationAnimationLock = useGameStore((s) => s.gameState?.eliminationAnimationLock);
  const clearEliminationAnimation = useGameStore((s) => s.clearEliminationAnimation);
  const setShowRankingModal = useGameStore((s) => s.setShowRankingModal);

  useEffect(() => {
    if (!eliminationAnimation) return;
    const id = setTimeout(clearEliminationAnimation, ELIMINATION_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [eliminationAnimation, clearEliminationAnimation]);

  useEffect(() => {
    if (eliminationAnimation && !eliminationAnimationLock) {
      clearEliminationAnimation();
    }
  }, [eliminationAnimation, eliminationAnimationLock, clearEliminationAnimation]);

  function handleDismiss() {
    clearEliminationAnimation();
  }

  function handleViewRankings() {
    setShowRankingModal(true);
    clearEliminationAnimation();
  }

  // Block interaction when server says we're in animation lock (e.g. reconnect)
  if (eliminationAnimationLock && !eliminationAnimation && typeof document !== "undefined") {
    return createPortal(
      <div
        className={styles.lockOverlay}
        role="status"
        aria-live="polite"
        aria-label={t("gameTable.eliminationInProgress")}
      >
        <span className={styles.lockMessage}>
          {t("gameTable.eliminationInProgress")}
        </span>
      </div>,
      document.body
    );
  }

  if (!eliminationAnimation || typeof document === "undefined") return null;

  const isYouEliminated = playerId === eliminationAnimation.playerId;
  /* When you are eliminated, only show EliminationModal; skip the "cooked" overlay. */
  if (isYouEliminated) return null;

  const messageKey = getMessageKey(eliminationAnimation.cardType);
  const flavorKey = getFlavorKey(eliminationAnimation.cardType);

  return createPortal(
    <div
      className={`${styles.overlay} ${styles.cameraShake} ${!isYouEliminated ? styles.overlayPositive : ""}`}
      role="alert"
      aria-live="polite"
      aria-label={`${eliminationAnimation.displayName} eliminated`}
    >
      <div className={styles.bgBlur} aria-hidden />
      <div className={styles.screenFlash} aria-hidden />
      <div className={styles.popupWrap}>
        <div className={styles.popupGlow} aria-hidden />
        <div className={styles.popup}>
          <div className={styles.popupBgDeco} aria-hidden />
          <div className={styles.avatarSection}>
            <div className={styles.avatarGlow} aria-hidden />
            <div className={styles.avatarCircle}>
              <img
                src={eliminationAnimation.avatarUrl}
                alt=""
                className={styles.avatar}
              />
              <div className={styles.avatarXEyes} aria-hidden>
                <span className="material-symbols-outlined">close</span>
                <span className="material-symbols-outlined">close</span>
              </div>
            </div>
          </div>
          <div className={styles.content}>
            <span className={styles.alertLabel}>
              {t("gameTable.eliminationAlert")}
            </span>
            <h2 className={styles.mainMessage}>
              {t(messageKey, { name: eliminationAnimation.displayName })}
            </h2>
            <p className={styles.flavorText}>
              {t(flavorKey)}
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleViewRankings}
            >
              {t("gameTable.eliminationViewRankings")}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleDismiss}
            >
              {t("gameTable.eliminationDismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
