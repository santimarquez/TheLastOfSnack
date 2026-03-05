"use client";

import { useTranslations } from "@/i18n/context";
import { Analytics } from "@/lib/analytics";
import styles from "./LocaleSwitcher.module.css";

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslations();

  const handleLocale = (newLocale: "en" | "es") => {
    if (newLocale === locale) return;
    setLocale(newLocale);
    Analytics.localeChanged(newLocale);
  };

  return (
    <div className={styles.wrapper} role="group" aria-label="Language">
      <button
        type="button"
        className={`${styles.btn} ${locale === "en" ? styles.btnActive : ""}`}
        onClick={() => handleLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        className={`${styles.btn} ${locale === "es" ? styles.btnActive : ""}`}
        onClick={() => handleLocale("es")}
        aria-pressed={locale === "es"}
        aria-label="Español"
      >
        ES
      </button>
    </div>
  );
}
