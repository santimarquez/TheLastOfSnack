"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./ConnectionLostScreen.module.css";

interface ConnectionLostScreenProps {
  roomCode: string;
  displayName: string;
  onRejoin: () => void;
  showConnectionCrisis?: boolean;
  showNotFound?: boolean;
}

export function ConnectionLostScreen({
  roomCode,
  displayName,
  onRejoin,
  showConnectionCrisis = true,
  showNotFound = true,
}: ConnectionLostScreenProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const { setShowSettingsHelpModal, setJoinFailed, reset } = useGameStore();
  const [newCodeInput, setNewCodeInput] = useState("");

  function handleExitToPantry() {
    reset();
    router.push("/");
  }

  function handleEnterNewCode(e: React.FormEvent) {
    e.preventDefault();
    const code = newCodeInput.trim().toUpperCase().replace(/\s/g, "").replace(/-/g, "").slice(0, 8);
    if (code.length < 8) return;
    setJoinFailed(false);
    router.push(`/room/${code}?displayName=${encodeURIComponent(displayName || t("common.player"))}`);
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoWrap}>
          <span className={styles.logoIcon} aria-hidden>
            <span className="material-symbols-outlined">restaurant_menu</span>
          </span>
          <h2 className={styles.logoText}>{t("common.appName")}</h2>
        </Link>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={t("common.settings")}
          onClick={() => setShowSettingsHelpModal(true, "settings")}
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <div className={styles.content}>
        {showConnectionCrisis && (
          <section className={styles.crisisCard}>
            <div className={styles.crisisIconWrap}>
              <span className="material-symbols-outlined">link_off</span>
            </div>
            <p className={styles.crisisSub}>{t("connectionLost.crisisSub")}</p>
            <h1 className={styles.crisisTitle}>{t("connectionLost.crisisTitle")}</h1>
            <p className={styles.crisisCopy}>
              {t("connectionLost.crisisCopy")}
            </p>
            <div className={styles.crisisActions}>
              <button type="button" className={styles.btnRejoin} onClick={onRejoin}>
                <span className="material-symbols-outlined">refresh</span>
                {t("connectionLost.rejoinBattle")}
              </button>
              <button type="button" className={styles.btnExit} onClick={handleExitToPantry}>
                {t("connectionLost.exitToPantry")}
              </button>
            </div>
          </section>
        )}

        <div className={styles.lowerRow}>
          {showNotFound && (
            <section className={styles.notFoundCard}>
              <p className={styles.notFoundLabel}>
                <span className="material-symbols-outlined">notifications</span>
                {t("connectionLost.notFoundLabel")}
              </p>
              <h2 className={styles.notFoundTitle}>
                {t("connectionLost.notFoundTitle")} <span className={styles.notFoundHighlight}>{t("connectionLost.notFoundHighlight")}</span>
              </h2>
              <p className={styles.notFoundCopy}>
                {t("connectionLost.notFoundCopy")}
              </p>
              <form onSubmit={handleEnterNewCode} className={styles.codeForm}>
                <label htmlFor="room-code-input" className={styles.codeLabel}>
                  {t("connectionLost.kitchenAccessCode")}
                </label>
                <div className={styles.codeRow}>
                  <input
                    id="room-code-input"
                    type="text"
                    className={styles.codeInput}
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    placeholder={t("connectionLost.enterNewRoomCode")}
                    maxLength={8}
                    aria-label={t("home.roomCodeLabel")}
                  />
                  <button type="submit" className={styles.codeBtn}>
                    {t("common.enter")}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
                <p className={styles.codeHint}>
                  {t("connectionLost.codeHint")}
                </p>
              </form>
            </section>
          )}

          <section className={styles.emptyCard}>
            <div className={styles.emptyBadge}>{t("connectionLost.emptyBadge")}</div>
            <div className={styles.emptyIcon}>
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <div className={styles.emptyLines} aria-hidden />
          </section>
        </div>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerCopy}>{t("connectionLost.footerCopy")}</p>
        <div className={styles.footerLinks}>
          <button type="button" className={styles.footerLink} onClick={() => setShowSettingsHelpModal(true, "how-to-play")}>
            {t("connectionLost.helpCenter")}
          </button>
          <button type="button" className={styles.footerLink} onClick={() => setShowSettingsHelpModal(true, "how-to-play")}>
            {t("connectionLost.recipeGuide")}
          </button>
          <button type="button" className={styles.footerLink} onClick={() => setShowSettingsHelpModal(true, "settings")}>
            {t("connectionLost.contactChef")}
          </button>
        </div>
      </footer>
    </main>
  );
}
