"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import { ActionCard } from "@/components/ActionCard";
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
            <div className={styles.characterCards}>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.pizza} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterPizza")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterPizzaWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterPizzaQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.sushi} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterSushi")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterSushiWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterSushiQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.donut} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterDonut")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterDonutWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterDonutQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.ice_cream} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterIceCream")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterIceCreamWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterIceCreamQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.burger} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterBurger")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterBurgerWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterBurgerQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar}>
                  <img src={SNACK_AVATAR_URLS.taco} alt="" aria-hidden />
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterTaco")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterTacoWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterTacoQuote")}</p>
                </div>
              </div>
              <div className={styles.characterCard}>
                <div className={styles.characterAvatar} aria-hidden>
                  <span className={styles.characterEmoji}>🍟</span>
                </div>
                <div className={styles.characterInfo}>
                  <strong>{t("howToPlay.characterFries")}</strong>
                  <span className={styles.characterWeakness}>{t("howToPlay.characterFriesWeakness")}</span>
                  <p className={styles.characterQuote}>{t("howToPlay.characterFriesQuote")}</p>
                </div>
              </div>
            </div>
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
        <p>{t("howToPlay.footerCopy")}</p>
      </footer>
    </div>
  );
}
