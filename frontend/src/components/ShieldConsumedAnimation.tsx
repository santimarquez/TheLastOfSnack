"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getCardMeta } from "@/config/cards";
import styles from "./GameTable.module.css";

const AVATAR_SELECTOR = (playerId: string) => `[data-player-avatar="${playerId}"]`;
const DISCARD_SELECTOR = "[data-discard-pile]";

const FLY_DURATION_MS = 600;

export function ShieldConsumedAnimation({
  targetPlayerId,
  onComplete,
}: {
  targetPlayerId: string;
  onComplete: () => void;
}) {
  const [state, setState] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const avatarEl = document.querySelector(AVATAR_SELECTOR(targetPlayerId));
      const discardEl = document.querySelector(DISCARD_SELECTOR);
      if (!avatarEl || !discardEl) {
        onComplete();
        return;
      }
      const avatarRect = avatarEl.getBoundingClientRect();
      const discardRect = discardEl.getBoundingClientRect();
      const size = 36;
      const startX = avatarRect.left + avatarRect.width / 2 - size / 2;
      const startY = avatarRect.top + avatarRect.height / 2 - size / 2;
      const endX = discardRect.left + discardRect.width / 2 - 40;
      const endY = discardRect.top + discardRect.height / 2 - 45;
      setState({ startX, startY, endX, endY });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [targetPlayerId, onComplete]);

  useLayoutEffect(() => {
    if (!state) return;
    const t = setTimeout(onComplete, FLY_DURATION_MS);
    return () => clearTimeout(t);
  }, [state, onComplete]);

  if (!state || typeof document === "undefined") return null;

  const meta = getCardMeta("foil_wrap");
  const dx = state.endX - state.startX;
  const dy = state.endY - state.startY;

  return createPortal(
    <div
      className={styles.shieldConsumedFlying}
      style={
        {
          left: state.startX,
          top: state.startY,
          width: 36,
          height: 40,
          "--shield-fly-dx": `${dx}px`,
          "--shield-fly-dy": `${dy}px`,
          "--shield-fly-duration": `${FLY_DURATION_MS}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.shieldConsumedFlyingBg}
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
