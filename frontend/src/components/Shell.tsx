"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import styles from "./Shell.module.css";

export function Shell() {
  const { t } = useTranslations();
  const setShowSettingsHelpModal = useGameStore((s) => s.setShowSettingsHelpModal);
  const { muted, toggleMuted } = useSoundStore();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoWrap}>
        <div className={styles.logoIcon}>
          <span className={`material-symbols-outlined ${styles.logoIconSymbol}`} aria-hidden>
            bakery_dining
          </span>
        </div>
        <h2 className={styles.logoText}>{t("common.appName")}</h2>
      </Link>
      <div className={styles.actions}>
        <LocaleSwitcher />
        {MUSIC_ENABLED && (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={muted ? t("common.unmute") : t("common.mute")}
            onClick={toggleMuted}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {muted ? "volume_off" : "volume_up"}
            </span>
          </button>
        )}
        <button type="button" className={styles.iconBtn} aria-label={t("common.settings")} onClick={() => setShowSettingsHelpModal(true, "settings")}>
          <span className="material-symbols-outlined" aria-hidden>settings</span>
        </button>
        <button type="button" className={styles.iconBtn} aria-label={t("common.help")} onClick={() => setShowSettingsHelpModal(true, "how-to-play")}>
          <span className="material-symbols-outlined" aria-hidden>help</span>
        </button>
      </div>
    </header>
  );
}
