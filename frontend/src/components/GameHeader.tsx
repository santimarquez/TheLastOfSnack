"use client";

import Link from "next/link";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import styles from "./GameHeader.module.css";

interface GameHeaderProps {
  playersCount: number;
  maxPlayers: number;
  deckCount: number;
}

export function GameHeader({ playersCount, maxPlayers, deckCount }: GameHeaderProps) {
  const { t } = useTranslations();
  const setShowSettingsHelpModal = useGameStore((s) => s.setShowSettingsHelpModal);
  const { muted, toggleMuted } = useSoundStore();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoWrap}>
        <span className={`material-symbols-outlined ${styles.logoIcon}`}>restaurant_menu</span>
        <h1 className={styles.title}>{t("common.appName")}</h1>
      </Link>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className="material-symbols-outlined">groups</span>
          <span>{t("gameHeader.players")}: {playersCount}/{maxPlayers}</span>
        </div>
        <div className={styles.statDeck}>
          <span className="material-symbols-outlined">style</span>
          <span>{t("gameHeader.deck")}: {deckCount}</span>
        </div>
      </div>
      <div className={styles.actions}>
        <LocaleSwitcher />
        {MUSIC_ENABLED && (
          <button type="button" className={styles.iconBtn} aria-label={muted ? t("common.unmute") : t("common.mute")} onClick={toggleMuted}>
            <span className="material-symbols-outlined">{muted ? "volume_off" : "volume_up"}</span>
          </button>
        )}
        <button type="button" className={styles.iconBtn} aria-label={t("common.settings")} onClick={() => setShowSettingsHelpModal(true, "settings")}>
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button type="button" className={styles.iconBtn} aria-label={t("common.help")} onClick={() => setShowSettingsHelpModal(true, "how-to-play")}>
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>
    </header>
  );
}
