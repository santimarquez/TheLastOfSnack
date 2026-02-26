"use client";

import { useTranslations } from "@/i18n/context";
import styles from "./LocaleSwitcher.module.css";

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslations();

  return (
    <div className={styles.wrapper} role="group" aria-label="Language">
      <button
        type="button"
        className={`${styles.btn} ${locale === "en" ? styles.btnActive : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        className={`${styles.btn} ${locale === "es" ? styles.btnActive : ""}`}
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
        aria-label="Español"
      >
        ES
      </button>
    </div>
  );
}
