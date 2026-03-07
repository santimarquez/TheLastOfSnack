"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./ChatPanel.module.css";

const TYPING_THROTTLE_MS = 1200;
const TYPING_EXPIRE_MS = 3500;

type SendFn = (type: string, payload: Record<string, unknown>) => void;

interface ChatPanelProps {
  send: SendFn;
  variant?: "lobby" | "game";
  /** Called when collapse state changes. Use to resize parent sidebar/column. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** When true, collapsed bar shows icon only (narrow sidebar). */
  sidebarCompact?: boolean;
}

export function ChatPanel({ send, variant = "lobby", onCollapsedChange, sidebarCompact }: ChatPanelProps) {
  const { t } = useTranslations();
  const { chatMessages, chatTyping, gameState, playerId, setChatTyping, clearChatTyping } = useGameStore();
  const [input, setInput] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const typingSentAtRef = useRef<number>(0);

  const isGameVariant = variant === "game";

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [chatMessages]);

  /* Sync initial collapsed state to parent so gameSidebar has collapsed class when chat is collapsed. */
  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      lastSeenCountRef.current = chatMessages.length;
      setUnreadCount(0);
      return;
    }
    const newMessages = chatMessages.slice(lastSeenCountRef.current);
    const fromOthers = newMessages.filter((m) => m.playerId !== playerId).length;
    if (fromOthers > 0) setUnreadCount((prev) => prev + fromOthers);
    lastSeenCountRef.current = chatMessages.length;
  }, [chatMessages, isCollapsed, playerId]);

  // Throttled "typing" indicator: send chat_typing when user types
  useEffect(() => {
    if (!input.trim()) return;
    const now = Date.now();
    if (now - typingSentAtRef.current < TYPING_THROTTLE_MS) return;
    typingSentAtRef.current = now;
    send("chat_typing", {});
  }, [input, send]);

  // Expire typing indicators after TYPING_EXPIRE_MS
  useEffect(() => {
    const entries = Object.entries(chatTyping).filter(([id]) => id !== playerId);
    if (entries.length === 0) return;
    const timeouts = entries.map(([id]) =>
      setTimeout(() => clearChatTyping(id), TYPING_EXPIRE_MS)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [chatTyping, playerId, clearChatTyping]);

  const EMOJI_QUICK = ["😀", "😂", "🔥", "👍", "👀", "🙈", "😱", "🎉", "🍕", "🥤"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim().slice(0, 500);
    if (!text) return;
    send("chat", { text });
    setInput("");
  }

  function insertEmoji(emoji: string) {
    setInput((prev) => (prev + emoji).slice(0, 500));
  }

  function openChat() {
    setIsCollapsed(false);
    setUnreadCount(0);
    lastSeenCountRef.current = chatMessages.length;
    onCollapsedChange?.(false);
  }

  function handleCollapse() {
    lastSeenCountRef.current = chatMessages.length;
    setIsCollapsed(true);
    onCollapsedChange?.(true);
  }

  const players = gameState?.players ?? [];
  const getPlayer = (id: string) => players.find((p) => p.id === id);

  if (isGameVariant) {
    return (
      <div className={styles.chatContainer}>
        <section
          className={`${styles.wrapper} ${styles.wrapperGame} ${isCollapsed ? styles.collapsedHidden : ""}`}
          aria-hidden={isCollapsed}
        >
          <div className={styles.header}>
            <span className={`material-symbols-outlined ${styles.headerIcon}`}>forum</span>
            <h3 className={styles.headerTitle}>{t("chatPanel.chat")}</h3>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={handleCollapse}
              aria-label={t("chatPanel.hideChat")}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <p className={styles.subtitle}>{t("chatPanel.trashTalkEnabled")}</p>
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
            {Object.entries(chatTyping)
              .filter(([id]) => id !== playerId)
              .slice(0, 1)
              .map(([id, name]) => (
                <p key={id} className={styles.typingIndicator} aria-live="polite">
                  {t("chatPanel.writing", { name })}
                </p>
              ))}
          </div>
          <div className={styles.emojiRow}>
            {EMOJI_QUICK.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={styles.emojiBtn}
                onClick={() => insertEmoji(emoji)}
                aria-label={t("chatPanel.insertEmoji", { emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
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
        <div
          className={`${styles.collapsedBar} ${!isCollapsed ? styles.collapsedHidden : ""} ${sidebarCompact ? styles.collapsedBarCompact : ""}`}
          aria-hidden={!isCollapsed}
        >
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={openChat}
            aria-label={t("chatPanel.showChat")}
          >
            <span className="material-symbols-outlined">forum</span>
            <span className={styles.toggleBtnLabel}>{t("chatPanel.chat")}</span>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge} aria-label={t("chatPanel.unreadCount", { count: String(unreadCount) })}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* Lobby variant: same collapsible pattern as game */
  return (
    <div className={styles.chatContainer}>
      <section
        className={`${styles.wrapper} ${styles.wrapperLobby} ${isCollapsed ? styles.collapsedHidden : ""}`}
        aria-hidden={isCollapsed}
      >
        <div className={styles.header}>
          <span className={`material-symbols-outlined ${styles.headerIcon}`}>forum</span>
          <h3 className={styles.headerTitle}>{t("chatPanel.kitchenChat")}</h3>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={handleCollapse}
            aria-label={t("chatPanel.hideChat")}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
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
          {Object.entries(chatTyping)
            .filter(([id]) => id !== playerId)
            .slice(0, 1)
            .map(([id, name]) => (
              <p key={id} className={styles.typingIndicator} aria-live="polite">
                {t("chatPanel.writing", { name })}
              </p>
            ))}
        </div>
        <div className={styles.emojiRow}>
          {EMOJI_QUICK.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={styles.emojiBtn}
              onClick={() => insertEmoji(emoji)}
              aria-label={t("chatPanel.insertEmoji", { emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
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
      <div
        className={`${styles.collapsedBar} ${styles.collapsedBarLobby} ${!isCollapsed ? styles.collapsedHidden : ""} ${sidebarCompact ? styles.collapsedBarCompact : ""}`}
        aria-hidden={!isCollapsed}
      >
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={openChat}
          aria-label={t("chatPanel.showChat")}
        >
          <span className="material-symbols-outlined">forum</span>
          <span className={styles.toggleBtnLabel}>{t("chatPanel.chat")}</span>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge} aria-label={t("chatPanel.unreadCount", { count: String(unreadCount) })}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
