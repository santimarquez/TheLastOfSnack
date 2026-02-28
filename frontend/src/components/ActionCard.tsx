"use client";

import { useTranslations } from "@/i18n/context";
import { getCardMeta } from "@/config/cards";
import type { Card } from "@last-of-snack/shared";
import styles from "./ActionCard.module.css";

export interface CardDragData {
  cardId: string;
  type: string;
  requiresTarget: boolean;
  requiresDiscardCards?: number;
}

export const CARD_DRAG_TYPE = "application/x-last-of-snack-card";

interface ActionCardProps {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** When true, card is draggable. onDragStart receives data for drop handlers. */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, data: CardDragData) => void;
  onDragEnd?: () => void;
}

export function ActionCard({ card, playable, onClick, disabled, draggable, onDragStart, onDragEnd }: ActionCardProps) {
  const { t } = useTranslations();
  const meta = getCardMeta(card.type);
  const titleKey = `cards.${card.type}.title`;
  const actionKey = `cards.${card.type}.action`;
  const title = t(titleKey) !== titleKey ? t(titleKey) : card.type;
  const action = t(actionKey) !== actionKey ? t(actionKey) : card.type;

  const hasImage = Boolean(meta.imageUrl);

  const handleDragStart = (e: React.DragEvent) => {
    if (!onDragStart || !playable) return;
    const data: CardDragData = {
      cardId: card.id,
      type: card.type,
      requiresTarget: meta.requiresTarget,
      requiresDiscardCards: meta.requiresDiscardCards,
    };
    e.dataTransfer.setData(CARD_DRAG_TYPE, JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
    onDragStart(e, data);
  };

  return (
    <button
      type="button"
      className={`${styles.card} ${playable ? styles.cardPlayable : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={action}
      draggable={draggable && playable && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={styles.cardBg}
        style={hasImage ? { backgroundImage: `url(${meta.imageUrl})` } : undefined}
      />
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <div className={styles.cardDescBox}>
          <p className={styles.cardDesc}>{action}</p>
        </div>
      </div>
    </button>
  );
}
