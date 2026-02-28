"use client";

import { useEffect } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./CardRevealNotification.module.css";

const AUTO_DISMISS_MS = 5000;

export function CardRevealNotification() {
  const { t } = useTranslations();
  const { cardRevealNotification, clearCardRevealNotification } = useGameStore();

  useEffect(() => {
    if (!cardRevealNotification) return;
    const t = setTimeout(clearCardRevealNotification, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [cardRevealNotification, clearCardRevealNotification]);

  if (!cardRevealNotification) return null;

  const isSalt = cardRevealNotification.type === "salt";
  const categoryLabel =
    isSalt && cardRevealNotification.category?.toLowerCase() === "sweet"
      ? t("cardReveal.sweet")
      : t("cardReveal.savory");
  const message = isSalt
    ? t("cardReveal.saltResult", {
        name: cardRevealNotification.targetDisplayName,
        category: categoryLabel,
      })
    : t("cardReveal.peekResult", {
        name: cardRevealNotification.targetDisplayName,
        snack: cardRevealNotification.snackName,
      });

  return (
    <div
      className={styles.overlay}
      role="alert"
      aria-live="polite"
      onClick={clearCardRevealNotification}
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <span className={styles.icon} aria-hidden>
          <span className="material-symbols-outlined">
            {isSalt ? "science" : "visibility"}
          </span>
        </span>
        <p className={styles.message}>{message}</p>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={clearCardRevealNotification}
          aria-label={t("common.close")}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
