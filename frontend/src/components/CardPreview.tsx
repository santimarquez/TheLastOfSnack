"use client";

import { useTranslations } from "@/i18n/context";
import { getCardMeta } from "@/config/cards";
import type { Card } from "@last-of-snack/shared";
import styles from "./CardPreview.module.css";

interface CardPreviewProps {
  card: Card;
  isLeaving?: boolean;
}

export function CardPreview({ card, isLeaving = false }: CardPreviewProps) {
  const { t } = useTranslations();
  const meta = getCardMeta(card.type);
  const titleKey = `cards.${card.type}.title`;
  const actionKey = `cards.${card.type}.action`;
  const title = t(titleKey) !== titleKey ? t(titleKey) : card.type;
  const action = t(actionKey) !== actionKey ? t(actionKey) : card.type;
  const hasImage = Boolean(meta.imageUrl);

  return (
    <div
      className={`${styles.preview} ${isLeaving ? styles.previewLeaving : ""}`}
      aria-hidden
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
    </div>
  );
}
