"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CARD_BACK_IMAGE_URL } from "@/config/cards";
import styles from "./GameTable.module.css";

const DECK_SELECTOR = "[data-deck-source]";
const AVATAR_SELECTOR = (playerId: string) => `[data-player-avatar="${playerId}"]`;

const FLY_DURATION_MS = 1200;

export function DrawCardFlying({
  targetPlayerId,
  onComplete,
}: {
  targetPlayerId: string;
  onComplete: () => void;
}) {
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    cardW: number;
    cardH: number;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const deckEl = document.querySelector(DECK_SELECTOR);
      const avatarEl = document.querySelector(AVATAR_SELECTOR(targetPlayerId));
      if (!deckEl || !avatarEl) {
        onComplete();
        return;
      }
      const deckRect = deckEl.getBoundingClientRect();
      const avatarRect = avatarEl.getBoundingClientRect();
      const cardW = deckRect.width;
      const cardH = deckRect.height;
      const startX = deckRect.left + deckRect.width / 2 - cardW / 2;
      const startY = deckRect.top + deckRect.height / 2 - cardH / 2;
      const endX = avatarRect.left + avatarRect.width / 2 - cardW / 2;
      const endY = avatarRect.top + avatarRect.height / 2 - cardH / 2;
      setCoords({
        startX,
        startY,
        dx: endX - startX,
        dy: endY - startY,
        cardW,
        cardH,
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [targetPlayerId, onComplete]);

  useLayoutEffect(() => {
    if (!coords) return;
    const t = setTimeout(onComplete, FLY_DURATION_MS);
    return () => clearTimeout(t);
  }, [coords, onComplete]);

  if (!coords || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.drawCardFlying}
      style={
        {
          left: coords.startX,
          top: coords.startY,
          "--fly-dx": `${coords.dx}px`,
          "--fly-dy": `${coords.dy}px`,
          "--fly-duration": `${FLY_DURATION_MS}ms`,
          "--fly-card-w": `${coords.cardW}px`,
          "--fly-card-h": `${coords.cardH}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.drawCardFlyingCard}
        style={{ backgroundImage: `url(${CARD_BACK_IMAGE_URL})` }}
      />
    </div>,
    document.body
  );
}
