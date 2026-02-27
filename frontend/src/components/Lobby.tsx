"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import { ALL_AVATAR_IDS, AVATAR_URLS } from "@/constants/avatars";
import styles from "./Lobby.module.css";

type SendFn = (type: string, payload: Record<string, unknown>) => void;

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 4;

const WAITING_FOR_PLAYERS_KEYS = [
  "lobby.waitingForPlayers1",
  "lobby.waitingForPlayers2",
  "lobby.waitingForPlayers3",
  "lobby.waitingForPlayers4",
  "lobby.waitingForPlayers5",
] as const;

const WAITING_FOR_HOST_KEYS = [
  "lobby.waitingForHost1",
  "lobby.waitingForHost2",
  "lobby.waitingForHost3",
  "lobby.waitingForHost4",
  "lobby.waitingForHost5",
] as const;

function formatRoomCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function Lobby({ send }: { send: SendFn }) {
  const { gameState, playerId, roomCode, isHost, displayName, lobbySettings } = useGameStore();
  const { t } = useTranslations();
  const [nameInput, setNameInput] = useState(displayName || "");
  const [waitingMessageIndex, setWaitingMessageIndex] = useState(0);
  const speedMode = lobbySettings.speedMode;
  const suspicionMeter = lobbySettings.suspicionMeter;

  useEffect(() => {
    if (displayName) setNameInput(displayName);
  }, [displayName]);

  const players = gameState?.players ?? [];
  const needMorePlayers = players.length < MIN_PLAYERS;
  const waitingMessageKeys = needMorePlayers ? WAITING_FOR_PLAYERS_KEYS : WAITING_FOR_HOST_KEYS;

  useEffect(() => {
    if (isHost) return;
    const interval = setInterval(() => {
      setWaitingMessageIndex((i) => (i + 1) % waitingMessageKeys.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isHost, waitingMessageKeys.length]);

  const canStart = isHost && players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;
  const progressPct = MAX_PLAYERS > 0 ? (players.length / MAX_PLAYERS) * 100 : 0;

  const me = playerId ? players.find((p) => p.id === playerId) : null;
  const takenAvatarIds = useMemo(
    () => new Set(players.filter((p) => p.id !== playerId).map((p) => p.avatarId).filter(Boolean) as string[]),
    [players, playerId]
  );
  const availableAvatarIds = useMemo(
    () => ALL_AVATAR_IDS.filter((id) => !takenAvatarIds.has(id)),
    [takenAvatarIds]
  );

  function handleSetAvatar(avatarId: string) {
    if (!availableAvatarIds.includes(avatarId)) return;
    send("set_avatar", { avatarId });
  }

  function handleSetName() {
    const name = nameInput.trim().slice(0, 32) || t("common.player");
    send("set_name", { displayName: name });
  }

  function handleStart() {
    send("start_game", { speedMode: lobbySettings.speedMode });
  }

  function handleCopyCode() {
    void navigator.clipboard?.writeText(roomCode);
  }

  const emptySlots = Math.max(0, MAX_PLAYERS - players.length);

  return (
    <div className={styles.wrapper}>
      <div className={styles.roomHeader}>
        <div>
          <h1 className={styles.title}>{t("lobby.title")}</h1>
          <p className={styles.tagline}>{t("lobby.tagline")}</p>
        </div>
        <div className={styles.roomCodeBox}>
          <div>
            <p className={styles.roomCodeLabel}>{t("lobby.roomCode")}</p>
            <p className={styles.roomCodeValue}>{formatRoomCode(roomCode)}</p>
          </div>
          <button type="button" className={styles.copyBtn} onClick={handleCopyCode}>
            <span className="material-symbols-outlined">content_copy</span>
            {t("common.copy")}
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>{t("lobby.playersJoined")}</p>
          <div className={styles.statValueRow}>
            <p className={styles.statValue}>{players.length}/{MAX_PLAYERS}</p>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
        <div className={`${styles.togglesCard} ${!isHost ? styles.togglesCardReadOnly : ""}`}>
          <div className={styles.togglesCol}>
            <div className={styles.toggles}>
              <label className={styles.toggleWrap}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={suspicionMeter}
                  onChange={() => isHost && send("set_lobby_settings", { suspicionMeter: !suspicionMeter })}
                  disabled={!isHost}
                  aria-label={t("lobby.suspicionMeter")}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.toggleLabel}>{t("lobby.suspicionMeter")}</span>
              </label>
              <label className={styles.toggleWrap}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={speedMode}
                  onChange={() => isHost && send("set_lobby_settings", { speedMode: !speedMode })}
                  disabled={!isHost}
                  aria-label={t("lobby.speedMode")}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.toggleLabel}>{t("lobby.speedMode")}</span>
              </label>
            </div>
            {(speedMode || suspicionMeter) && (
              <div className={styles.modeDescriptions} aria-live="polite">
                {speedMode && (
                  <div className={styles.modeDescBlock}>
                    <p className={styles.modeDescTitle}>⚡ {t("lobby.speedModeDescTitle")}</p>
                    <p className={styles.modeDescBody}>{t("lobby.speedModeDescBody")}</p>
                  </div>
                )}
                {suspicionMeter && (
                  <div className={styles.modeDescBlock}>
                    <p className={styles.modeDescTitle}>👁️ {t("lobby.suspicionMeterDescTitle")}</p>
                    <p className={styles.modeDescBody}>{t("lobby.suspicionMeterDescBody")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="material-symbols-outlined material-symbols-outlined-tune">tune</span>
        </div>
      </div>

      <div className={styles.nameForm}>
        <label className={styles.nameFormLabel}>{t("common.displayName")}</label>
        <div className={styles.nameFormRow}>
          <input
            className={styles.nameInput}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t("common.yourName")}
            maxLength={32}
          />
          <button type="button" className={styles.updateBtn} onClick={handleSetName}>
            {t("common.update")}
          </button>
        </div>
      </div>

      <div className={styles.avatarSection}>
        <p className={styles.avatarSectionLabel}>{t("lobby.chooseAvatar")}</p>
        <div className={styles.avatarGrid} role="listbox" aria-label={t("lobby.chooseAvatar")}>
          {availableAvatarIds.map((avatarId) => {
            const url = AVATAR_URLS[avatarId];
            const isSelected = me?.avatarId === avatarId;
            if (!url) return null;
            return (
              <button
                key={avatarId}
                type="button"
                className={`${styles.avatarOption} ${isSelected ? styles.avatarOptionSelected : ""}`}
                onClick={() => handleSetAvatar(avatarId)}
                role="option"
                aria-selected={isSelected}
                aria-label={avatarId}
                title={avatarId}
              >
                <img src={url} alt="" className={styles.avatarOptionImg} />
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.playerGrid}>
        {players.map((p) => (
          <div
            key={p.id}
            className={`${styles.playerCard} ${p.isHost ? styles.playerCardHost : ""} ${p.id === playerId ? styles.playerCardYou : ""}`}
          >
            {p.isHost && (
              <div className={styles.hostBadge}>
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
            )}
            <div className={styles.playerAvatar}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className={styles.playerAvatarImg} />
              ) : (
                <span className="material-symbols-outlined">lunch_dining</span>
              )}
            </div>
            <p className={styles.playerName}>{p.displayName}</p>
            <p className={p.isHost ? styles.playerRoleHost : styles.playerRoleReady}>
              {p.isHost ? t("common.host") : t("common.ready")}
            </p>
          </div>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptySlot}>
            <div className={styles.emptySlotIcon}>
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <p className={styles.emptySlotText}>{t("lobby.waiting")}</p>
          </div>
        ))}
      </div>

      {isHost && (
        <div className={styles.startRow}>
          <button
            type="button"
            className={styles.startBtn}
            onClick={handleStart}
            disabled={!canStart}
          >
            {t("lobby.startGame")}
          </button>
        </div>
      )}

      {!isHost && (
        <div className={styles.waitingRow}>
          <span className={`material-symbols-outlined ${styles.waitingSpinner}`} aria-hidden>
            progress_activity
          </span>
          <p className={styles.waitingMessage} aria-live="polite">
            {needMorePlayers
              ? t(waitingMessageKeys[waitingMessageIndex], {
                  count: String(MIN_PLAYERS - players.length),
                })
              : t(waitingMessageKeys[waitingMessageIndex])}
          </p>
        </div>
      )}
    </div>
  );
}
