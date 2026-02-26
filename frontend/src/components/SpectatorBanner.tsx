"use client";

import { useTranslations } from "@/i18n/context";
import styles from "./SpectatorBanner.module.css";

export function SpectatorBanner() {
  const { t } = useTranslations();
  return (
    <div className={styles.banner} role="status">
      {t("spectatorBanner.message")}
    </div>
  );
}
