"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CARD_BACK_IMAGE_URL } from "@/config/cards";
import styles from "./GameTable.module.css";

const DECK_SELECTOR = "[data-deck-source]";
const AVATAR_SELECTOR = (playerId: string) => `[data-player-avatar="${playerId}"]`;

const FLY_DURATION_MS = 1200;
const STAGGER_MS = 120;

export function BuffetCardFlying({
  playerIds,
  onComplete,
}: {
  playerIds: string[];
  onComplete: () => void;
}) {
  const [cards, setCards] = useState<
    Array<{
      playerId: string;
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
      if (cancelled) return;
      const deckEl = document.querySelector(DECK_SELECTOR);
      if (!deckEl) {
        onComplete();
        return;
      }
      const deckRect = deckEl.getBoundingClientRect();
      const cardW = deckRect.width;
      const cardH = deckRect.height;
      const startX = deckRect.left + deckRect.width / 2 - cardW / 2;
      const startY = deckRect.top + deckRect.height / 2 - cardH / 2;

      const results: typeof cards = [];
      for (let i = 0; i < playerIds.length; i++) {
        const avatarEl = document.querySelector(AVATAR_SELECTOR(playerIds[i]));
        if (!avatarEl) continue;
        const avatarRect = avatarEl.getBoundingClientRect();
        const endX = avatarRect.left + avatarRect.width / 2 - cardW / 2;
        const endY = avatarRect.top + avatarRect.height / 2 - cardH / 2;
        results.push({
          playerId: playerIds[i],
          startX,
          startY,
          dx: endX - startX,
          dy: endY - startY,
          cardW,
          cardH,
          delayMs: i * STAGGER_MS,
        });
      }
      setCards(results);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [playerIds, onComplete]);

  useLayoutEffect(() => {
    if (cards.length === 0) return;
    const totalMs = FLY_DURATION_MS + (cards.length - 1) * STAGGER_MS;
    const t = setTimeout(onComplete, totalMs);
    return () => clearTimeout(t);
  }, [cards.length, onComplete]);

  if (cards.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <>
      {cards.map((c) => (
        <div
          key={c.playerId}
          className={styles.drawCardFlying}
          style={
            {
              left: c.startX,
              top: c.startY,
              "--fly-dx": `${c.dx}px`,
              "--fly-dy": `${c.dy}px`,
              "--fly-duration": `${FLY_DURATION_MS}ms`,
              "--fly-card-w": `${c.cardW}px`,
              "--fly-card-h": `${c.cardH}px`,
              animationDelay: `${c.delayMs}ms`,
            } as React.CSSProperties
          }
        >
          <div
            className={styles.drawCardFlyingCard}
            style={{ backgroundImage: `url(${CARD_BACK_IMAGE_URL})` }}
          />
        </div>
      ))}
    </>,
    document.body
  );
}
