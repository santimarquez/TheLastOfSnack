"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, getGuestDisplayName } from "@/i18n/context";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import { useGameStore } from "@/store/gameStore";
import { SettingsHelpModal } from "@/components/SettingsHelpModal";
import styles from "./page.module.css";

const GAME_SERVER =
  process.env.NEXT_PUBLIC_GAME_SERVER_HTTP ||
  (typeof window !== "undefined" ? "" : "http://localhost:4000");

const HERO_BG_IMAGE =
  "https://imagedelivery.net/F646Wun-eua00pA0NmkORQ/8fe9c7d8-6172-44cf-81ed-2a0f6ffe5f00/public";

/** Base URL for HTTP API (create room). When empty, use same-origin /api/rooms. */
const getRoomsUrl = () => (GAME_SERVER ? `${GAME_SERVER}/rooms` : "/api/rooms");

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslations();
  const { muted, toggleMuted } = useSoundStore();
  const {
    showSettingsHelpModal,
    setShowSettingsHelpModal,
    settingsHelpModalTab,
  } = useGameStore();
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    const name = displayName.trim() || getGuestDisplayName(t);
    setLoading(true);
    try {
      const res = await fetch(getRoomsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = (await res.json()) as {
        roomCode?: string;
        reconnectToken?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? t("home.errorCreateRoom"));
      }
      sessionStorage.setItem(`reconnect_${data.roomCode!}`, data.reconnectToken!);
      router.push(
        `/room/${data.roomCode}?displayName=${encodeURIComponent(name)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("home.errorCreateRoom"));
    } finally {
      setLoading(false);
    }
  }

  function handleJoin() {
    setError("");
    const code = joinCode.trim().toUpperCase().replace(/\s/g, "").slice(0, 8);
    if (code.length !== 8) {
      setError(t("home.errorRoomCodeLength"));
      return;
    }
    const name = displayName.trim() || getGuestDisplayName(t);
    router.push(`/room/${code}?displayName=${encodeURIComponent(name)}`);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.bgRedGradient} aria-hidden />
      <div className={styles.pattern} aria-hidden />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <span
                className={`material-symbols-outlined ${styles.logoIconSymbol}`}
                aria-hidden>
                restaurant
              </span>
            </div>
            <h2 className={styles.logoText}>{t("common.appName")}</h2>
          </div>
          <div className={styles.nav}>
            <LocaleSwitcher />
            {MUSIC_ENABLED && (
              <button
                type="button"
                className={styles.navIconBtn}
                aria-label={muted ? t("common.unmute") : t("common.mute")}
                onClick={toggleMuted}>
                <span className="material-symbols-outlined" aria-hidden>
                  {muted ? "volume_off" : "volume_up"}
                </span>
              </button>
            )}
            <button
              type="button"
              className={styles.navIconBtn}
              aria-label={t("common.settings")}
              onClick={() => setShowSettingsHelpModal(true, "settings")}>
              <span className="material-symbols-outlined" aria-hidden>
                settings
              </span>
            </button>
            <Link href="/how-to-play" className={styles.navLink}>
              {t("home.howToPlay")}
            </Link>
          </div>
        </header>

        {showSettingsHelpModal && (
          <SettingsHelpModal
            onClose={() => setShowSettingsHelpModal(false)}
            initialTab={settingsHelpModalTab}
          />
        )}

        <main className={styles.main}>
          <section className={styles.heroSection}>
            <img
              src={HERO_BG_IMAGE}
              alt=""
              className={styles.heroSectionBg}
              aria-hidden
            />
            <div className={styles.hero}>
              <div className={styles.heroMascots}>
                <div className={styles.mascot1} aria-hidden>
                  <span
                    className={`material-symbols-outlined ${styles.mascotIcon}`}>
                    lunch_dining
                  </span>
                </div>
                <div className={styles.mascot2} aria-hidden>
                  <span
                    className={`material-symbols-outlined ${styles.mascotIcon}`}>
                    local_pizza
                  </span>
                </div>
              </div>
              <div className={styles.heroTitleBlock}>
                <div className={styles.skullBox}>
                  <span
                    className={`material-symbols-outlined ${styles.skullIcon}`}
                    aria-hidden>
                    skull
                  </span>
                </div>
                <h1 className={styles.heroTitle}>
                  {t("common.heroTitleLine1")}
                  <br />
                  <span className={styles.heroTitleAccent}>
                    {t("common.heroTitleLine2")}
                  </span>
                </h1>
              </div>
              <p className={styles.tagline}>{t("home.tagline")}</p>

              <div className={styles.formArea}>
                <div className={styles.formInner}>
                  <div className={styles.displayNameRow}>
                    <input
                      id="display-name"
                      type="text"
                      className={styles.displayNameInput}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("common.yourName")}
                      maxLength={32}
                      aria-label={t("common.displayName")}
                    />
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.createBtn}
                      onClick={handleCreate}
                      disabled={loading}>
                      {loading ? t("home.creating") : t("home.createRoom")}
                    </button>
                    <div className={styles.joinDivider}>
                      <span className={styles.joinDividerText}>
                        {t("home.orJoinBattle")}
                      </span>
                    </div>
                    <div className={styles.joinRow}>
                      <input
                        type="text"
                        className={styles.codeInput}
                        value={joinCode}
                        onChange={(e) =>
                          setJoinCode(e.target.value.toUpperCase())
                        }
                        placeholder={t("home.roomCodePlaceholder")}
                        maxLength={8}
                        aria-label={t("home.roomCodeLabel")}
                      />
                      <button
                        type="button"
                        className={styles.joinBtn}
                        onClick={handleJoin}>
                        {t("home.join")}
                      </button>
                    </div>
                  </div>

                  {error && <p className={styles.error}>{error}</p>}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <span
                  className={`material-symbols-outlined ${styles.featureIcon}`}
                  aria-hidden>
                  restaurant_menu
                </span>
              </div>
              <h3 className={styles.featureTitle}>{t("home.feature1Title")}</h3>
              <p className={styles.featureDesc}>{t("home.feature1Desc")}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <span
                  className={`material-symbols-outlined ${styles.featureIcon}`}
                  aria-hidden>
                  swords
                </span>
              </div>
              <h3 className={styles.featureTitle}>{t("home.feature2Title")}</h3>
              <p className={styles.featureDesc}>{t("home.feature2Desc")}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <span
                  className={`material-symbols-outlined ${styles.featureIcon}`}
                  aria-hidden>
                  trophy
                </span>
              </div>
              <h3 className={styles.featureTitle}>{t("home.feature3Title")}</h3>
              <p className={styles.featureDesc}>{t("home.feature3Desc")}</p>
            </div>
          </section>

          <div className={styles.ctaBanner}>
            <div className={styles.ctaOverlay} />
            <div className={styles.ctaContent}>
              <span className={styles.ctaSub}>{t("home.ctaSub")}</span>
              <h2 className={styles.ctaTitle}>{t("home.ctaTitle")}</h2>
            </div>
          </div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerLogo}>
            <span
              className={`material-symbols-outlined ${styles.footerLogoIcon}`}
              aria-hidden>
              restaurant
            </span>
            <span className={styles.footerLogoText}>{t("common.appName")}</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">{t("home.footerPrivacy")}</a>
            <a href="#">{t("home.footerTerms")}</a>
            <a href="#">{t("home.footerSupport")}</a>
            <a href="#">{t("home.footerDiscord")}</a>
          </div>
          <p className={styles.footerCopy}>{t("home.footerCopy")}</p>
        </footer>
      </div>
    </div>
  );
}
