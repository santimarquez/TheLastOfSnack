"use client";

import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getCardMeta } from "@/config/cards";
import { SoundManager } from "@/audio/SoundManager";
import styles from "./GameTable.module.css";

const AVATAR_SELECTOR = (playerId: string) => `[data-player-avatar="${playerId}"]`;
const DISCARD_PILE_SELECTOR = "[data-discard-pile]";

const FLY_DURATION_MS = 800;
const STAGGER_MS = 300;

export function TrashDiscardFlying({
  targetId,
  cards,
  onComplete,
}: {
  targetId: string;
  cards: Array<{ id: string; type: string }>;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<
    Array<{
      card: { id: string; type: string };
      startX: number;
      startY: number;
      dx: number;
      dy: number;
      cardW: number;
      cardH: number;
      delayMs: number;
    }>
  >([]);

  useLayoutEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled || cards.length === 0) {
        if (cards.length === 0) onComplete();
        return;
      }
      const startEl = document.querySelector(AVATAR_SELECTOR(targetId));
      const endEl = document.querySelector(DISCARD_PILE_SELECTOR);
      if (!startEl || !endEl) {
        onComplete();
        return;
      }
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();
      const cardW = Math.min(80, startRect.width * 1.2);
      const cardH = (cardW * 9) / 8;
      const startX = startRect.left + startRect.width / 2 - cardW / 2;
      const startY = startRect.top + startRect.height / 2 - cardH / 2;
      const endX = endRect.left + endRect.width / 2 - cardW / 2;
      const endY = endRect.top + endRect.height / 2 - cardH / 2;
      const results = cards.map((card, i) => ({
        card,
        startX,
        startY,
        dx: endX - startX,
        dy: endY - startY,
        cardW,
        cardH,
        delayMs: i * STAGGER_MS,
      }));
      setItems(results);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [targetId, cards, onComplete]);

  useLayoutEffect(() => {
    if (items.length === 0) return;
    const totalMs = FLY_DURATION_MS + (items.length - 1) * STAGGER_MS;
    const t = setTimeout(onComplete, totalMs);
    return () => clearTimeout(t);
  }, [items.length, onComplete]);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (items.length === 0) return;
    timeoutsRef.current = items.map((item) =>
      setTimeout(() => SoundManager.playRandomPitch("card_drop"), item.delayMs)
    );
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [items]);

  if (items.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <>
      {items.map(({ card, startX, startY, dx, dy, cardW, cardH, delayMs }) => {
        const meta = getCardMeta(card.type);
        return (
          <div
            key={card.id}
            className={styles.drawCardFlying}
            style={
              {
                left: startX,
                top: startY,
                "--fly-dx": `${dx}px`,
                "--fly-dy": `${dy}px`,
                "--fly-duration": `${FLY_DURATION_MS}ms`,
                "--fly-card-w": `${cardW}px`,
                "--fly-card-h": `${cardH}px`,
                animationDelay: `${delayMs}ms`,
              } as React.CSSProperties
            }
          >
            <div
              className={styles.drawCardFlyingCard}
              style={
                meta.imageUrl
                  ? { backgroundImage: `url(${meta.imageUrl})` }
                  : undefined
              }
            />
          </div>
        );
      })}
    </>,
    document.body
  );
}
