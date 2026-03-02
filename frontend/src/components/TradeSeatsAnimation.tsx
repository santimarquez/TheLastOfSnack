"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PlayerView } from "@last-of-snack/shared";
import styles from "./GameTable.module.css";

const AVATAR_SELECTOR = (playerId: string) => `[data-player-avatar="${playerId}"]`;

const SWAP_DURATION_MS = 800;
const EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function TradeSeatsAnimation({
  playerId1,
  playerId2,
  players,
  onComplete,
}: {
  playerId1: string;
  playerId2: string;
  players: PlayerView[];
  onComplete: () => void;
}) {
  const [avatars, setAvatars] = useState<
    Array<{
      avatarUrl: string | null;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      size: number;
    }>
  >([]);

  useLayoutEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const el1 = document.querySelector(AVATAR_SELECTOR(playerId1));
      const el2 = document.querySelector(AVATAR_SELECTOR(playerId2));
      if (!el1 || !el2) {
        onComplete();
        return;
      }
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();
      const p1 = players.find((p) => p.id === playerId1);
      const p2 = players.find((p) => p.id === playerId2);
      // After swap: p1 has p2's avatar, p2 has p1's avatar
      // Avatar flying from pos1→pos2 shows p1's old avatar = p2's current avatar
      // Avatar flying from pos2→pos1 shows p2's old avatar = p1's current avatar
      const avatar1Url = p2?.avatarUrl ?? null;
      const avatar2Url = p1?.avatarUrl ?? null;
      const size = Math.min(rect1.width, rect1.height, rect2.width, rect2.height, 80);
      const center = (r: DOMRect) => ({
        x: r.left + r.width / 2 - size / 2,
        y: r.top + r.height / 2 - size / 2,
      });
      const c1 = center(rect1);
      const c2 = center(rect2);
      setAvatars([
        {
          avatarUrl: avatar1Url,
          startX: c1.x,
          startY: c1.y,
          endX: c2.x,
          endY: c2.y,
          size,
        },
        {
          avatarUrl: avatar2Url,
          startX: c2.x,
          startY: c2.y,
          endX: c1.x,
          endY: c1.y,
          size,
        },
      ]);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [playerId1, playerId2, players, onComplete]);

  useLayoutEffect(() => {
    if (avatars.length === 0) return;
    const t = setTimeout(onComplete, SWAP_DURATION_MS);
    return () => clearTimeout(t);
  }, [avatars.length, onComplete]);

  if (avatars.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <>
      {avatars.map((a, i) => (
        <div
          key={i}
          className={styles.tradeSeatsFlying}
          style={
            {
              left: a.startX,
              top: a.startY,
              width: a.size,
              height: a.size,
              "--swap-dx": `${a.endX - a.startX}px`,
              "--swap-dy": `${a.endY - a.startY}px`,
              "--swap-duration": `${SWAP_DURATION_MS}ms`,
              "--swap-easing": EASING,
            } as React.CSSProperties
          }
        >
          <div className={styles.tradeSeatsFlyingAvatar}>
            {a.avatarUrl ? (
              <img src={a.avatarUrl} alt="" className={styles.playerAvatarImg} />
            ) : (
              <span className="material-symbols-outlined">lunch_dining</span>
            )}
          </div>
        </div>
      ))}
    </>,
    document.body
  );
}
