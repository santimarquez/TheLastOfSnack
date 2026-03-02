"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getCardMeta } from "@/config/cards";
import styles from "./GameTable.module.css";

const AVATAR_SELECTOR = (playerId: string) =>
  `[data-player-avatar="${playerId}"]`;
const DISCARD_SELECTOR = "[data-discard-pile]";

const FLY_DURATION_MS = 700;

export function CardPlayedAnimation({
  cardType,
  playerId,
  destination,
  startRect,
  onComplete,
}: {
  cardType: string;
  playerId: string;
  destination: "discard" | "avatar";
  startRect?: { left: number; top: number; width: number; height: number } | null;
  onComplete: () => void;
}) {
  const [state, setState] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    cardW: number;
    cardH: number;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      let startX: number;
      let startY: number;
      let cardW: number;
      let cardH: number;

      if (startRect) {
        startX = startRect.left;
        startY = startRect.top;
        cardW = startRect.width;
        cardH = startRect.height;
      } else {
        const avatarEl = document.querySelector(AVATAR_SELECTOR(playerId));
        if (!avatarEl) {
          onComplete();
          return;
        }
        const r = avatarEl.getBoundingClientRect();
        startX = r.left + r.width / 2 - 64;
        startY = r.top + r.height / 2 - 72;
        cardW = 80;
        cardH = 90;
      }

      let endX: number;
      let endY: number;

      if (destination === "avatar") {
        const avatarEl = document.querySelector(AVATAR_SELECTOR(playerId));
        if (!avatarEl) {
          onComplete();
          return;
        }
        const r = avatarEl.getBoundingClientRect();
        const size = 36;
        endX = r.left + r.width / 2 - size / 2;
        endY = r.top + r.height / 2 - size / 2;
      } else {
        const discardEl = document.querySelector(DISCARD_SELECTOR);
        if (!discardEl) {
          onComplete();
          return;
        }
        const r = discardEl.getBoundingClientRect();
        endX = r.left + r.width / 2 - 40;
        endY = r.top + r.height / 2 - 45;
      }

      setState({
        startX,
        startY,
        endX,
        endY,
        cardW,
        cardH,
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [playerId, destination, startRect, onComplete]);

  useLayoutEffect(() => {
    if (!state) return;
    const t = setTimeout(onComplete, FLY_DURATION_MS);
    return () => clearTimeout(t);
  }, [state, onComplete]);

  if (!state || typeof document === "undefined") return null;

  const meta = getCardMeta(cardType);
  const dx = state.endX - state.startX;
  const dy = state.endY - state.startY;
  const scaleEnd = destination === "avatar" ? 36 / state.cardW : 0.8;

  return createPortal(
    <div
      className={styles.cardPlayedFlying}
      style={
        {
          left: state.startX,
          top: state.startY,
          width: state.cardW,
          height: state.cardH,
          "--card-fly-dx": `${dx}px`,
          "--card-fly-dy": `${dy}px`,
          "--card-fly-duration": `${FLY_DURATION_MS}ms`,
          "--card-fly-scale-end": scaleEnd,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.cardPlayedFlyingBg}
        style={
          meta.imageUrl
            ? { backgroundImage: `url(${meta.imageUrl})` }
            : { backgroundColor: "var(--slate-800)" }
        }
      />
    </div>,
    document.body
  );
}
