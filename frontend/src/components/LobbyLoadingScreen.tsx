"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@/i18n/context";
import { useGameStore } from "@/store/gameStore";
import styles from "./LobbyLoadingScreen.module.css";

const MIN_DISPLAY_MS = 3000;
const TIP_COUNT = 10;

function formatRoomCode(code: string): string {
  if (!code || code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function LobbyLoadingScreen({ roomCode }: { roomCode: string }) {
  const { t } = useTranslations();
  const setShowSettingsHelpModal = useGameStore((s) => s.setShowSettingsHelpModal);
  const [progress, setProgress] = useState(0);
  const tipIndex = useMemo(() => Math.floor(Math.random() * TIP_COUNT) + 1, []);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / MIN_DISPLAY_MS) * 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <h2 className={styles.logoText}>{t("common.appName")}</h2>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.roomCodeBox}>
            <span className={styles.roomCodeLabel}>{t("lobby.roomCode")}</span>
            <span className={styles.roomCodeValue}>{formatRoomCode(roomCode)}</span>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t("common.settings")}
            onClick={() => setShowSettingsHelpModal(true, "settings")}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.bgLayer} aria-hidden>
          <div className={styles.bgGradient} />
          <div
            className={styles.bgImage}
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop')`,
            }}
          />
        </div>
        <div className={styles.glow} aria-hidden />
        <div className={styles.mascotLeft} aria-hidden>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyGccnD-q4j8UKBWQeuOlu0rF1_GFqRBuoTdKw-5I1PeID_Dv6XJS-yJxRMErNnY7matwP3WzchZu4Q83JoUXzwcp7P_Z2j5OTA5Y1_NQxYFS4XCNmgZwgDI4wituAiIWq4J1H6lp2lLegsSmUxOto4T32l0XTPy5kPxtyZaEZKbORgvRA3b_L9XT6Fblvshptb0-5cS5O6Wvq9bFUIluwW8_o0jyhxraannjqICYfc-x83NXP4KwEwTeFVEl3hun0TfKouLLqGhw"
            alt=""
          />
        </div>
        <div className={styles.mascotRight} aria-hidden>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHPggiIXR66BODfzf21UZt5ejPCijOyPDlbfkGV1MRhzDsEOAftCnKA4prtSx2hCo135VjN9awaYmxiTIn1isE64w8BOOkRqpCqUUnk8k9AFtjo5TJgXLPffJ2hr0H106GRiYewmj-5af4U4op2FAU-zRzn4PJd9fV9CVBISCYoPhBNGBoNgZ4JXoQkqCkznBTCFaw7BunrbSRjDPiYORV0PHyH76LgjRcoe71LcFuYEQIFTRhVVZ2aFWB7aMQGkaGOEbh9RzwwkM"
            alt=""
          />
        </div>

        <div className={styles.content}>
          <div className={styles.heroIcon}>
            <div className={styles.heroIconGlow} />
            <div className={styles.heroIconCircle}>
              <span className="material-symbols-outlined">outdoor_grill</span>
            </div>
          </div>
          <h1 className={styles.title}>{t("lobbyLoading.preparingArena")}</h1>
          <div className={styles.subtitle}>
            <p>{t("lobbyLoading.enteringKitchen")}</p>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <div className={styles.progressStatus}>
                <span className={styles.pingDot} />
                <p>{t("lobbyLoading.connecting")}</p>
              </div>
              <p className={styles.progressPct}>{Math.round(progress)}%</p>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              >
                <div className={styles.progressPattern} />
              </div>
            </div>
            <div className={styles.progressFooter}>
              <p>{t("lobbyLoading.loadingAssets")}</p>
              <div className={styles.dots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <div className={styles.roomCodeMobile}>
            <span className={styles.roomCodeLabel}>{t("lobby.roomCode")}</span>
            <span className={styles.roomCodeValue}>{formatRoomCode(roomCode)}</span>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.proTip}>
          <div className={styles.proTipIcon}>
            <span className="material-symbols-outlined">lightbulb</span>
          </div>
          <p>
            <span className={styles.proTipLabel}>{t("lobbyLoading.proTipLabel")}</span>{" "}
            {t(`lobbyLoading.tip${tipIndex}`)}
          </p>
        </div>
      </footer>
    </div>
  );
}
