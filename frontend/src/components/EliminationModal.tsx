"use client";

import { useGameStore } from "@/store/gameStore";
import { useTranslations } from "@/i18n/context";
import styles from "./EliminationModal.module.css";

interface EliminationModalProps {
  onClose: () => void;
}

export function EliminationModal({ onClose }: EliminationModalProps) {
  const { t } = useTranslations();
  const { gameState, playerId } = useGameStore();
  const me = gameState?.players?.find((p) => p.id === playerId);
  const revealedRole = playerId ? gameState?.revealedRoles?.[playerId] : undefined;
  const roleName = revealedRole?.name ?? me?.role?.name ?? "Snack";

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="elimination-title">
      <div className={styles.bgBlur} aria-hidden />
      <div className={styles.glow} aria-hidden />
      <div className={styles.scrollWrap}>
        <div className={styles.modal}>
          <header className={styles.header}>
            <div className={styles.logoWrap}>
              <span className={styles.flagIcon} aria-hidden>
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 42.44C4 42.44 14.1 36.07 24 41.17C35.07 46.86 44 42.21 44 42.21V7.01C44 7.01 35.07 11.66 24 5.97C14.1 0.88 4 7.27 4 7.27V42.44Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <h2 className={styles.logoText}>{t("common.appName")}</h2>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className={styles.body}>
            <div className={styles.titleWrap}>
              <div className={styles.titleGlow} aria-hidden />
              <h1 id="elimination-title" className={styles.title}>
                {t("eliminationModal.title")}
              </h1>
            </div>

            <div className={styles.characterCard}>
              <div className={styles.characterCardGlow} aria-hidden />
              <div className={styles.characterFrame}>
                <div className={styles.characterCircle}>
                  {me?.avatarUrl ? (
                    <img src={me.avatarUrl} alt="" className={styles.characterAvatar} />
                  ) : (
                    <span className="material-symbols-outlined">lunch_dining</span>
                  )}
                </div>
                <div className={styles.rolePill}>
                  {t("eliminationModal.theRole", { roleName })}
                </div>
                {revealedRole?.weakness && revealedRole?.eliminatedBy && (
                  <p className={styles.roleWeakness}>
                    {revealedRole.weakness} — {revealedRole.eliminatedBy}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.copy}>
              <h2 className={styles.copyTitle}>{t("eliminationModal.copyTitle")}</h2>
              <p className={styles.copyBody}>
                {t("eliminationModal.copyBody")}
              </p>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={onClose}>
                {t("eliminationModal.continueWatching")}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>
                {t("eliminationModal.viewStandings")}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerAccent}>
          <span className="material-symbols-outlined">microwave</span>
          <span>{t("eliminationModal.systemOverheat")}</span>
        </div>
      </div>
    </div>
  );
}
