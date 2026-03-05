"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import { ActionCard } from "@/components/ActionCard";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { CARD_META } from "@/config/cards";
import { SNACK_AVATAR_URLS } from "@/constants/avatars";
import styles from "./page.module.css";

const ACTION_CARD_TYPES = Object.keys(CARD_META) as string[];

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
        <div className={styles.headerActions}>
          <LocaleSwitcher />
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label={t("common.goBack")}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
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
              <img
                src="https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/c41e7396-3168-473d-969d-f83664373f00/public"
                alt=""
                aria-hidden
              />
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
          </div>
          <div className={styles.snackCardsGrid}>
            {[
              { id: "pizza", nameKey: "characterPizza", weaknessKey: "characterPizzaWeakness", quoteKey: "characterPizzaQuote", avatarUrl: SNACK_AVATAR_URLS.pizza },
              { id: "sushi", nameKey: "characterSushi", weaknessKey: "characterSushiWeakness", quoteKey: "characterSushiQuote", avatarUrl: SNACK_AVATAR_URLS.sushi },
              { id: "donut", nameKey: "characterDonut", weaknessKey: "characterDonutWeakness", quoteKey: "characterDonutQuote", avatarUrl: SNACK_AVATAR_URLS.donut },
              { id: "ice_cream", nameKey: "characterIceCream", weaknessKey: "characterIceCreamWeakness", quoteKey: "characterIceCreamQuote", avatarUrl: SNACK_AVATAR_URLS.ice_cream },
              { id: "burger", nameKey: "characterBurger", weaknessKey: "characterBurgerWeakness", quoteKey: "characterBurgerQuote", avatarUrl: SNACK_AVATAR_URLS.burger },
              { id: "taco", nameKey: "characterTaco", weaknessKey: "characterTacoWeakness", quoteKey: "characterTacoQuote", avatarUrl: SNACK_AVATAR_URLS.taco },
              { id: "fries", nameKey: "characterFries", weaknessKey: "characterFriesWeakness", quoteKey: "characterFriesQuote", avatarUrl: SNACK_AVATAR_URLS.fries },
            ].map((snack) => (
              <div key={snack.id} className={styles.snackCard}>
                <div className={styles.snackCardImage}>
                  <div className={styles.snackCardImageOverlay} aria-hidden />
                  <img src={snack.avatarUrl} alt="" aria-hidden />
                </div>
                <div className={styles.snackCardBody}>
                  <h3 className={styles.snackCardName}>{t(`howToPlay.${snack.nameKey}`)}</h3>
                  <div className={styles.snackCardWeakness}>
                    <div className={styles.snackCardWeaknessLabel}>
                      <span className="material-symbols-outlined" aria-hidden>skull</span>
                      <span>{t("gameTable.weakness")}:</span>
                    </div>
                    <p className={styles.snackCardWeaknessValue}>{t(`howToPlay.${snack.weaknessKey}`)}</p>
                  </div>
                </div>
                <footer className={styles.snackCardFooter}>
                  <p className={styles.snackCardQuote}>{t(`howToPlay.${snack.quoteKey}`)}</p>
                </footer>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span className={styles.sectionNum}>3</span>
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
              {t("howToPlay.actionStealDesc") && (
                <p className={styles.actionDesc}>
                  {t("howToPlay.actionStealDesc")}
                </p>
              )}
            </div>
            <div className={styles.actionCard}>
              <span className="material-symbols-outlined">visibility</span>
              <h4 className={styles.actionTitle}>{t("howToPlay.actionPeek")}</h4>
              <p className={styles.actionDesc}>
                {t("howToPlay.actionPeekDesc")}
              </p>
            </div>
          </div>
          <h3 className={styles.subsectionHead}>{t("howToPlay.actionCardsTitle")}</h3>
          <div className={styles.actionCardsGrid}>
            {ACTION_CARD_TYPES.map((type) => (
              <div key={type} className={styles.actionCardCell}>
                <ActionCard
                  card={{ id: `howto-${type}`, type }}
                  disabled
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHead}>
            <span className={styles.sectionNum}>4</span>
            {t("howToPlay.section4Title")}
          </h2>
          <div className={styles.gameOrderBlock}>
            <div className={styles.gameOrderItem}>
              <h3 className={styles.gameOrderHeadline}>{t("howToPlay.section4RoundsHeadline")}</h3>
              <p className={styles.gameOrderCopy}>{t("howToPlay.section4RoundsCopy")}</p>
            </div>
            <div className={styles.gameOrderItem}>
              <h3 className={styles.gameOrderHeadline}>{t("howToPlay.section4TurnHeadline")}</h3>
              <p className={styles.gameOrderCopy}>{t("howToPlay.section4TurnCopy")}</p>
            </div>
            <div className={styles.gameOrderItem}>
              <h3 className={styles.gameOrderHeadline}>{t("howToPlay.section4PointsHeadline")}</h3>
              <p className={styles.gameOrderCopy}>{t("howToPlay.section4PointsCopy")}</p>
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
        <p>{t("howToPlay.footerCopy", { year: String(new Date().getFullYear()) })}</p>
      </footer>
    </div>
  );
}
