"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import styles from "./SettingsHelpModal.module.css";

type TabId = "settings" | "how-to-play";

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface SettingsHelpModalProps {
  onClose: () => void;
  initialTab?: TabId;
  send?: SendFn;
  canLeaveGame?: boolean;
}

export function SettingsHelpModal({
  onClose,
  initialTab = "settings",
  send,
  canLeaveGame = true,
}: SettingsHelpModalProps) {
  const router = useRouter();
  const { t } = useTranslations();
  const { displayName, gameState, playerId, reset } = useGameStore();
  const { volume, setVolume, muted, toggleMuted } = useSoundStore();
  const me = gameState?.players?.find((p) => p.id === playerId);
  const currentName = me?.displayName ?? displayName ?? "";

  const [tab, setTab] = useState<TabId>(initialTab);
  const [nameInput, setNameInput] = useState(currentName);

  const volumePercent = Math.round(volume * 100);
  const bgmEnabled = !muted;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setNameInput(currentName);
  }, [currentName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    const name = nameInput.trim().slice(0, 32) || t("common.player");
    if (send && name !== currentName) {
      send("set_name", { displayName: name });
    }
    onClose();
  }

  function handleLeaveGame() {
    if (!canLeaveGame) return;
    if (typeof window !== "undefined" && !window.confirm(t("settingsHelp.leaveConfirm"))) return;
    onClose();
    reset();
    router.push("/");
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="settings-help-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <div className={styles.modal}>
        <div className={styles.modalGlow} aria-hidden />
        <header className={styles.header}>
          <h2 id="settings-help-title" className={styles.title}>
            {t("settingsHelp.title")}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("common.close")}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === "settings" ? styles.tabActive : ""}`}
            onClick={() => setTab("settings")}
            aria-selected={tab === "settings"}
          >
            <span className="material-symbols-outlined">settings</span>
            {t("settingsHelp.settingsTab")}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "how-to-play" ? styles.tabActive : ""}`}
            onClick={() => setTab("how-to-play")}
            aria-selected={tab === "how-to-play"}
          >
            <span className="material-symbols-outlined">help</span>
            {t("settingsHelp.howToPlayTab")}
          </button>
        </div>

        <div className={styles.body}>
          {tab === "settings" ? (
            <>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>{t("settingsHelp.identitySection")}</h3>
                <div className={styles.nameRow}>
                  <input
                    type="text"
                    className={styles.nameInput}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t("common.yourName")}
                    maxLength={32}
                    aria-label={t("settingsHelp.displayNameLabel")}
                  />
                  <span className={styles.nameIcon} aria-hidden>
                    <span className="material-symbols-outlined">edit</span>
                  </span>
                </div>
              </section>

              {MUSIC_ENABLED && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>{t("settingsHelp.audioSection")}</h3>
                  <div className={styles.audioRow}>
                    <label className={styles.audioLabel}>{t("settingsHelp.masterVolume")}</label>
                    <div className={styles.sliderRow}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={volumePercent}
                        onChange={(e) => setVolume(Number(e.target.value) / 100)}
                        className={styles.slider}
                        aria-label="Master volume"
                      />
                      <span className={styles.sliderValue}>{volumePercent}%</span>
                    </div>
                  </div>
                  <div className={styles.audioRow}>
                    <label className={styles.audioLabel}>
                      <span className="material-symbols-outlined">music_note</span>
                      {t("settingsHelp.backgroundMusic")}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={bgmEnabled}
                      className={`${styles.toggle} ${bgmEnabled ? styles.toggleOn : ""}`}
                      onClick={toggleMuted}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </section>
              )}

              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} onClick={handleSave}>
                  {t("common.saveChanges")}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleLeaveGame}
                  disabled={!canLeaveGame}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  {t("common.leaveGame")}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.howToPlay}>
              <h3 className={styles.sectionTitle}>{t("settingsHelp.howToPlayTitle")}</h3>
              <ol className={styles.rulesList}>
                <li>{t("settingsHelp.rule1")}</li>
                <li>{t("settingsHelp.rule2")}</li>
                <li>{t("settingsHelp.rule3")}</li>
                <li>{t("settingsHelp.rule4")}</li>
                <li>{t("settingsHelp.rule5")}</li>
              </ol>
              <button
                type="button"
                className={styles.fullGuideBtn}
                onClick={() => {
                  onClose();
                  router.push("/how-to-play");
                }}
              >
                {t("settingsHelp.viewFullGuide")}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
