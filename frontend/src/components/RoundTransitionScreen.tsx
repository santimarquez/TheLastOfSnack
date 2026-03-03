"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/context";
import styles from "./RoundTransitionScreen.module.css";

const TRANSITION_DURATION_MS = 4500;
const IMAGE_URL =
  "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/c41e7396-3168-473d-969d-f83664373f00/public";

interface RoundTransitionScreenProps {
  roundNumber: 1 | 2 | 3;
  snacksRemaining: number;
  changeSinceLastRound?: number;
  heatLevel?: string;
  heatSpike?: string;
  arenaCondition?: string;
  onComplete: () => void;
}

export function RoundTransitionScreen({
  roundNumber,
  snacksRemaining,
  changeSinceLastRound,
  heatLevel = "EXTREME",
  heatSpike = "+15%",
  arenaCondition = "PREPPING CRUNCH",
  onComplete,
}: RoundTransitionScreenProps) {
  const { t } = useTranslations();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / TRANSITION_DURATION_MS) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onComplete, 150);
      return () => clearTimeout(t);
    }
  }, [progress, onComplete]);

  const changeText =
    changeSinceLastRound != null && roundNumber > 1
      ? t("roundTransition.changeSinceRound", {
          count: String(Math.abs(changeSinceLastRound)),
          round: String(roundNumber - 1),
        })
      : null;

  return (
    <main className={styles.main}>
      <div className={styles.bgDecor} aria-hidden>
        <div className={styles.bgBlur1} />
        <div className={styles.bgBlur2} />
        <div className={styles.grainOverlay} />
      </div>
      <div className={styles.bgIcons} aria-hidden>
        <span className="material-symbols-outlined">local_fire_department</span>
        <span className="material-symbols-outlined">shutter_speed</span>
      </div>

      <header className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <h2 className={styles.logoText}>{t("roundTransition.gameTitle")}</h2>
        </div>
        <div className={styles.liveBadge}>
          <span className="material-symbols-outlined">local_fire_department</span>
          <span>{t("roundTransition.liveArena")}</span>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.phaseBadge}>
          {t("roundTransition.eliminationPhase")}
        </div>
        <h1 className={styles.roundTitle}>
          {t("roundTransition.roundLabel")}{" "}
          <span className={styles.roundNum}>{roundNumber}</span>
        </h1>
        <div className={styles.subtitleRow}>
          <span className={styles.subtitleLine} />
          <p className={styles.subtitle}>
            {t(`roundTransition.seasoningRound${roundNumber}`)}
          </p>
          <span className={styles.subtitleLine} />
        </div>

        <div className={styles.visualCard}>
          <div className={styles.visualGradient} />
          <img
            src={IMAGE_URL}
            alt=""
            className={styles.visualImg}
          />
          <div className={styles.visualIcon}>
            <span className="material-symbols-outlined">fireplace</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <div>
              <span className={styles.tempLabel}>
                {t("roundTransition.temperature")}
              </span>
              <span className={styles.tempStatus}>
                {t("roundTransition.heatingUp")}
              </span>
            </div>
            <span className={styles.progressPct}>{Math.round(progress)}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            >
              <div className={styles.progressShine} />
            </div>
          </div>
          <div className={styles.progressFooter}>
            <div className={styles.progressItem}>
              <span className="material-symbols-outlined">fork_spoon</span>
              <span>{t("roundTransition.addingHeat")}</span>
            </div>
            <div className={styles.progressItem}>
              <span className="material-symbols-outlined">skull</span>
              <span>
                {t("roundTransition.remainCount", { count: String(snacksRemaining) })}
              </span>
            </div>
            <div className={styles.progressItem}>
              <span className="material-symbols-outlined">timer</span>
              <span>{t("roundTransition.ready")}</span>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>{t("roundTransition.snacksRemaining")}</span>
              <span className="material-symbols-outlined">group</span>
            </div>
            <div className={styles.statValue}>
              <span className={styles.statNum}>{snacksRemaining}</span>
              {changeText && (
                <span className={styles.statChange}>{changeText}</span>
              )}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>{t("roundTransition.heatLevel")}</span>
              <span className="material-symbols-outlined">
                local_fire_department
              </span>
            </div>
            <div className={styles.statValue}>
              <span className={`${styles.statNum} ${styles.statNumPrimary}`}>
                {heatLevel}
              </span>
              <span className={styles.statSpike}>{heatSpike}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span>{t("roundTransition.arenaCondition")}</span>
              <span className="material-symbols-outlined">cloud_sync</span>
            </div>
            <div className={styles.statValue}>
              <span className={styles.statNum}>{arenaCondition}</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
