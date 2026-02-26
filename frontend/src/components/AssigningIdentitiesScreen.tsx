"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./AssigningIdentitiesScreen.module.css";

interface AssigningIdentitiesScreenProps {
  roomCode: string;
  onComplete?: () => void;
}

function formatMatchId(code: string): string {
  const clean = code.replace(/\s/g, "").toUpperCase().slice(0, 8);
  if (clean.length < 8) return `#${clean}-SNACK`;
  return `#${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export function AssigningIdentitiesScreen({ roomCode, onComplete }: AssigningIdentitiesScreenProps) {
  const { t } = useTranslations();
  const setShowSettingsHelpModal = useGameStore((s) => s.setShowSettingsHelpModal);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }
  }, [progress, onComplete]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoWrap}>
          <span className={styles.logoIcon} aria-hidden>
            <span className="material-symbols-outlined">restaurant_menu</span>
          </span>
          <h2 className={styles.logoText}>{t("common.appName")}</h2>
        </Link>
        <div className={styles.arenaStatus}>
          <span className={styles.arenaLabel}>{t("assigning.arenaStatus")}</span>
          <span className={styles.arenaValue}>{t("assigning.matchmaking")}</span>
        </div>
        <button type="button" className={styles.iconBtn} aria-label={t("common.settings")} onClick={() => setShowSettingsHelpModal(true, "settings")}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span className={styles.titleRed}>{t("assigning.titleAssigning")}</span> {t("assigning.titleIdentities")}
          </h1>
          <p className={styles.subtitle}>{t("assigning.subtitle")}</p>
        </div>

        <div className={styles.cardsRow}>
          <div className={styles.card} data-side="left">
            <span className="material-symbols-outlined">help</span>
            <div className={styles.cardLine} />
          </div>
          <div className={`${styles.card} ${styles.cardCenter}`}>
            <span className="material-symbols-outlined">casino</span>
            <span className={styles.cardDealing}>{t("assigning.dealing")}</span>
            <span className={styles.cardChaos}>{t("assigning.chaos")}</span>
          </div>
          <div className={styles.card} data-side="right">
            <span className="material-symbols-outlined">help</span>
            <div className={styles.cardLine} />
          </div>
        </div>

        <div className={styles.bottomBlock}>
          <div className={styles.griddleBlock}>
            <span className={styles.griddleLabel}>{t("assigning.griddleLabel")}</span>
            <span className={styles.griddleValue}>{t("assigning.griddleValue")}</span>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressPct}>{Math.round(progress)}%</span>
          </div>
          <p className={styles.flavorText}>
            <span className="material-symbols-outlined">shield</span>
            {t("assigning.flavorText")}
          </p>
        </div>
      </div>

      <footer className={styles.footer}>
        <span className={styles.matchId}>{t("assigning.matchId")}: {formatMatchId(roomCode)}</span>
      </footer>
    </main>
  );
}
