"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./ChatPanel.module.css";

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface ChatPanelProps {
  send: SendFn;
  variant?: "lobby" | "game";
}

export function ChatPanel({ send, variant = "lobby" }: ChatPanelProps) {
  const { t } = useTranslations();
  const { chatMessages, gameState, playerId } = useGameStore();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [chatMessages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, 500);
    if (!text) return;
    send("chat", { text });
    setInput("");
  }

  const players = gameState?.players ?? [];
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  return (
    <section className={`${styles.wrapper} ${variant === "game" ? styles.wrapperGame : ""}`}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.headerIcon}`}>forum</span>
        <h3 className={styles.headerTitle}>
          {variant === "game" ? t("chatPanel.chatEmotes") : t("chatPanel.kitchenChat")}
        </h3>
      </div>
      {variant === "game" && (
        <p className={styles.subtitle}>{t("chatPanel.trashTalkEnabled")}</p>
      )}
      <div className={styles.list} ref={listRef}>
        {chatMessages.length === 0 && (
          <p className={styles.placeholder}>{t("chatPanel.noMessages")}</p>
        )}
        {chatMessages.map((msg, i) => {
          const isOwn = msg.playerId === playerId;
          const sender = getPlayer(msg.playerId);
          const isHost = sender?.isHost ?? false;
          const avatarUrl = sender?.avatarUrl;
          return (
            <div
              key={i}
              className={`${styles.messageWrap} ${isOwn ? styles.messageWrapOwn : ""}`}
            >
              <div className={styles.messageAvatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className={styles.messageAvatarImg} />
                ) : (
                  <span className="material-symbols-outlined">lunch_dining</span>
                )}
              </div>
              <div className={styles.messageContent}>
                <p className={isHost ? styles.senderNameHost : styles.senderName}>
                  {msg.displayName}
                  {isHost ? ` ${t("chatPanel.hostSuffix")}` : ""}
                </p>
                <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : ""}`}>
                  <p className={styles.bubbleText}>{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {variant === "game" && (
        <div className={styles.emotes}>
          <button type="button" className={styles.emoteBtn}>
            <span className="material-symbols-outlined">balance</span>
            <span>{t("chatPanel.emoteSalty")}</span>
          </button>
          <button type="button" className={`${styles.emoteBtn} ${styles.emoteBtnPrimary}`}>
            <span className="material-symbols-outlined">local_fire_department</span>
            <span>{t("chatPanel.emoteSpicy")}</span>
          </button>
          <button type="button" className={styles.emoteBtn}>
            <span className="material-symbols-outlined">skillet</span>
            <span>{t("chatPanel.emoteRaw")}</span>
          </button>
          <button type="button" className={styles.emoteBtn}>
            <span className="material-symbols-outlined">fire_hydrant</span>
            <span>{t("chatPanel.emoteBurned")}</span>
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPanel.placeholder")}
          maxLength={500}
          aria-label={t("chatPanel.placeholder")}
        />
        <button type="submit" className={styles.sendBtn} aria-label={t("chatPanel.sendLabel")}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </section>
  );
}
