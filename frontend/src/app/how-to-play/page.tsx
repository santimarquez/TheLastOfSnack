"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import styles from "./page.module.css";

export default function HowToPlayPage() {
  const router = useRouter();
  const { t } = useTranslations();

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoWrap}>
          <span className={styles.logoIcon}>
            <span className="material-symbols-outlined">restaurant</span>
          </span>
          <h2 className={styles.logoText}>{t("common.appName")}</h2>
        </Link>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label={t("common.goBack")}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.banner}>
          <div className={styles.bannerBg} aria-hidden />
          <span className={styles.bannerTag}>{t("howToPlay.rulebookTag")}</span>
          <h1 className={styles.bannerTitle}>{t("howToPlay.title")}</h1>
          <p className={styles.bannerSub}>
            {t("howToPlay.subtitle")}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span className={styles.sectionNum}>1</span>
            {t("howToPlay.section1Title")}
          </h2>
          <div className={styles.goalLayout}>
            <div className={styles.goalImage}>
              <span className="material-symbols-outlined">lunch_dining</span>
            </div>
            <div className={styles.goalContent}>
              <h3 className={styles.goalTitle}>{t("howToPlay.section1Headline")}</h3>
              <p className={styles.goalCopy}>
                {t("howToPlay.section1Copy")}
              </p>
              <div className={styles.goalPills}>
                <span className={styles.pill}>
                  <span className="material-symbols-outlined">favorite</span>
                  {t("howToPlay.pillKeepCrumbs")}
                </span>
                <span className={styles.pill}>
                  <span className="material-symbols-outlined">skull</span>
                  {t("howToPlay.pillCrushCookies")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span className={styles.sectionNum}>2</span>
            {t("howToPlay.section2Title")}
          </h2>
          <div className={styles.cardsGrid}>
            <div className={styles.actionCard}>
              <span className="material-symbols-outlined">bolt</span>
              <h4 className={styles.actionTitle}>{t("howToPlay.actionAttack")}</h4>
              <p className={styles.actionDesc}>
                {t("howToPlay.actionAttackDesc")}
              </p>
            </div>
            <div className={styles.actionCard}>
              <span className="material-symbols-outlined">shield</span>
              <h4 className={styles.actionTitle}>{t("howToPlay.actionDefend")}</h4>
              <p className={styles.actionDesc}>
                {t("howToPlay.actionDefendDesc")}
              </p>
            </div>
            <div className={styles.actionCard}>
              <span className="material-symbols-outlined">shopping_bag</span>
              <h4 className={styles.actionTitle}>{t("howToPlay.actionSteal")}</h4>
              <p className={styles.actionDesc}>
                {t("howToPlay.actionStealDesc")}
              </p>
            </div>
            <div className={styles.actionCard}>
              <span className="material-symbols-outlined">visibility</span>
              <h4 className={styles.actionTitle}>{t("howToPlay.actionPeek")}</h4>
              <p className={styles.actionDesc}>
                {t("howToPlay.actionPeekDesc")}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span className={styles.sectionNum}>3</span>
            {t("howToPlay.section3Title")}
          </h2>
          <div className={styles.secretBlock}>
            <span className={styles.warningIcon} aria-hidden>
              <span className="material-symbols-outlined">warning</span>
            </span>
            <p className={styles.secretQuote}>
              {t("howToPlay.secretQuote")}
            </p>
            <p className={styles.secretCopy}>
              {t("howToPlay.secretCopy")}
            </p>
            <div className={styles.weaknessExamples}>
              <div className={styles.weaknessCard}>
                <span className="material-symbols-outlined">icecream</span>
                <div>
                  <strong>{t("howToPlay.weaknessIceCream")}</strong>
                  <p>{t("howToPlay.weaknessIceCreamDesc")}</p>
                </div>
              </div>
              <div className={styles.weaknessCard}>
                <span className="material-symbols-outlined">cookie</span>
                <div>
                  <strong>{t("howToPlay.weaknessCookie")}</strong>
                  <p>{t("howToPlay.weaknessCookieDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <p className={styles.ctaText}>{t("howToPlay.ctaReady")}</p>
          <div className={styles.ctaButtons}>
            <Link href="/" className={styles.btnPrimary}>
              {t("howToPlay.startNewGame")}
            </Link>
            <button type="button" className={styles.btnSecondary} onClick={() => router.back()}>
              {t("howToPlay.goBack")}
            </button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>{t("howToPlay.footerCopy")}</p>
      </footer>
    </div>
  );
}
