"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/context";
import { getGuestDisplayName } from "@/i18n/context";
import { getOrCreateCreatorId } from "@/utils/creatorId";
import { Analytics, JOIN_METHOD_KEY } from "@/lib/analytics";
import { AVATAR_URLS } from "@/constants/avatars";
import styles from "./page.module.css";

const DISPLAY_NAME_STORAGE_KEY = "last-of-snack-display-name";
const ROOMS_PAGE_SIZE = 12;

type FilterMode = "all" | "speed" | "suspicion";

export interface RoomSummary {
  code: string;
  name?: string;
  isPrivate: boolean;
  maxPlayers: number;
  playerCount: number;
  phase: string;
  speedMode?: boolean;
  suspicionMeter?: boolean;
  createdAt: number;
  creatorDisplayName?: string;
  creatorAvatarId?: string | null;
}

function getStoredDisplayName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? "";
}

function isRoomCode(value: string): boolean {
  const s = value.trim().toUpperCase().replace(/\s/g, "").slice(0, 8);
  return s.length === 8 && /^[A-Z0-9]{8}$/.test(s);
}

export default function ArenasPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [creating, setCreating] = useState(false);
  const [quickJoining, setQuickJoining] = useState(false);
  const [privateCodeByRoom, setPrivateCodeByRoom] = useState<Record<string, string>>({});

  const fetchRooms = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter === "speed") params.set("speedMode", "true");
        if (filter === "suspicion") params.set("suspicionMeter", "true");
        params.set("page", String(page));
        params.set("limit", String(ROOMS_PAGE_SIZE));
        const res = await fetch(`/api/rooms?${params}`);
        const data = (await res.json()) as { rooms?: RoomSummary[]; total?: number };
        setRooms(data.rooms ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!silent) {
          setRooms([]);
          setTotal(0);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filter, page]
  );

  useEffect(() => {
    void fetchRooms(false);
  }, [fetchRooms]);

  useEffect(() => {
    Analytics.openArenasView();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => void fetchRooms(true), 8000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const displayName = getStoredDisplayName() || getGuestDisplayName(t);

  const handleCreateRoom = async () => {
    setJoinError("");
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, creatorId: getOrCreateCreatorId() }),
      });
      const data = (await res.json()) as { roomCode?: string; reconnectToken?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create room");
      if (data.roomCode) {
        Analytics.arenaCreated("arenas");
        sessionStorage.setItem(JOIN_METHOD_KEY, "create");
        sessionStorage.setItem(`reconnect_${(data.roomCode ?? "").toUpperCase()}`, data.reconnectToken ?? "");
        router.push(`/room/${data.roomCode}?displayName=${encodeURIComponent(displayName)}`);
      }
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : t("arenas.errorCreate"));
    } finally {
      setCreating(false);
    }
  };

  const handleQuickJoin = () => {
    const publicRooms = rooms.filter((r) => !r.isPrivate && r.playerCount < r.maxPlayers && r.phase === "lobby");
    if (publicRooms.length === 0) {
      setJoinError(t("arenas.noPublicRooms"));
      return;
    }
    setQuickJoining(true);
    setJoinError("");
    sessionStorage.setItem(JOIN_METHOD_KEY, "quick_join");
    const room = publicRooms[Math.floor(Math.random() * publicRooms.length)];
    router.push(`/room/${room.code}?displayName=${encodeURIComponent(displayName)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    const raw = searchInput.trim().toUpperCase().replace(/\s/g, "").slice(0, 8);
    if (isRoomCode(raw)) {
      const code = raw.length === 8 ? raw : "";
      if (code) {
        sessionStorage.setItem(JOIN_METHOD_KEY, "code");
        router.push(`/room/${code}?displayName=${encodeURIComponent(displayName)}`);
      }
      return;
    }
    const match = rooms.find(
      (r) =>
        r.code.toUpperCase().includes(raw) ||
        (r.name && r.name.toUpperCase().includes(searchInput.trim().toUpperCase()))
    );
    if (match) {
      sessionStorage.setItem(JOIN_METHOD_KEY, "list");
      router.push(`/room/${match.code}?displayName=${encodeURIComponent(displayName)}`);
    } else setJoinError(t("arenas.roomNotFound"));
  };

  const handleJoinByCode = (code: string) => {
    const c = code.trim().toUpperCase().replace(/\s/g, "").slice(0, 8);
    if (c.length !== 8) {
      setJoinError(t("home.errorRoomCodeLength"));
      return;
    }
    setJoinError("");
    sessionStorage.setItem(JOIN_METHOD_KEY, "code");
    router.push(`/room/${c}?displayName=${encodeURIComponent(displayName)}`);
  };

  const totalPages = Math.max(1, Math.ceil(total / ROOMS_PAGE_SIZE));

  return (
    <div className={styles.wrapper}>
      <div className={styles.bgRedGradient} aria-hidden />
      <div className={styles.pattern} aria-hidden />
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <span className={`material-symbols-outlined ${styles.logoIconSymbol}`} aria-hidden>
                restaurant
              </span>
            </div>
            <h2 className={styles.logoText}>{t("common.appName")}</h2>
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              {t("arenas.home")}
            </Link>
            <Link href="/how-to-play" className={styles.navLink}>
              {t("home.howToPlay")}
            </Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.heroActions}>
            <div className={styles.heroText}>
              <div className={styles.heroLabel}>
                <span className="material-symbols-outlined">restaurant</span>
                <span>{t("arenas.kitchenLobby")}</span>
              </div>
              <h1 className={styles.heroTitle}>
                {t("arenas.open")} <span className={styles.accent}>{t("arenas.arenas")}</span>
              </h1>
              <p className={styles.heroDesc}>{t("arenas.heroDesc")}</p>
            </div>
            <div className={styles.heroButtons}>
              <button
                type="button"
                className={styles.btnCreateRoom}
                onClick={handleCreateRoom}
                disabled={creating}
              >
                <span className="material-symbols-outlined">add_circle</span>
                {t("arenas.createRoom")}
              </button>
              <button
                type="button"
                className={styles.btnQuickJoin}
                onClick={handleQuickJoin}
                disabled={quickJoining || loading || rooms.length === 0}
              >
                <span className="material-symbols-outlined">bolt</span>
                {t("arenas.quickJoin")}
              </button>
            </div>
          </div>

          <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden>
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t("arenas.searchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label={t("arenas.searchPlaceholder")}
              />
            </div>
            <div className={styles.filterRow}>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "all" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("all")}
              >
                <span className="material-symbols-outlined">grid_view</span>
                {t("arenas.allModes")}
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "speed" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("speed")}
              >
                <span className="material-symbols-outlined">timer</span>
                {t("arenas.speedMode")}
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${filter === "suspicion" ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter("suspicion")}
              >
                <span className="material-symbols-outlined">visibility</span>
                {t("arenas.suspicion")}
              </button>
            </div>
          </form>

          {joinError && (
            <p className={styles.error} role="alert">
              {joinError}
            </p>
          )}

          {loading ? (
            <p className={styles.loading}>{t("arenas.loading")}</p>
          ) : (
            <div className={styles.roomGrid}>
              {rooms.map((room) => {
                const status =
                  room.isPrivate
                    ? "private"
                    : room.playerCount >= room.maxPlayers - 1
                      ? "almostFull"
                      : room.playerCount >= room.maxPlayers * 0.75
                        ? "highStakes"
                        : "recruiting";
                const modeParts: string[] = [];
                if (room.speedMode) modeParts.push(t("arenas.modeSpeed"));
                if (room.suspicionMeter) modeParts.push(t("arenas.modeSuspicion"));
                if (modeParts.length === 0) modeParts.push(t("arenas.modeNormal"));
                const modeLabel = modeParts.join(" • ");
                return (
                  <div key={room.code} className={styles.roomCard}>
                    <div className={styles.roomCardDecor} aria-hidden>
                      <span className="material-symbols-outlined">lunch_dining</span>
                    </div>
                    <div className={styles.roomCardTop}>
                      <span className={`${styles.roomBadge} ${styles[`roomBadge_${status}`]}`}>
                        {t(`arenas.badge_${status}`)}
                      </span>
                      <span className={styles.roomPlayerCount}>
                        {room.isPrivate && (
                          <span className="material-symbols-outlined">lock</span>
                        )}
                        {!room.isPrivate && (
                          <span className="material-symbols-outlined">groups</span>
                        )}
                        {room.playerCount}/{room.maxPlayers}
                      </span>
                    </div>
                    <h3 className={styles.roomTitle}>
                      {room.name || t("arenas.defaultArenaName")}
                    </h3>
                    <p className={styles.roomMode}>
                      <span className={styles.roomModeDot} />
                      {modeLabel}
                    </p>
                    {(room.creatorDisplayName || room.creatorAvatarId) && (
                      <div className={styles.roomCreator}>
                        {room.creatorAvatarId && AVATAR_URLS[room.creatorAvatarId] && (
                          <img
                            src={AVATAR_URLS[room.creatorAvatarId]}
                            alt=""
                            className={styles.roomCreatorAvatar}
                          />
                        )}
                        {room.creatorDisplayName && (
                          <span className={styles.roomCreatorName}>
                            {room.creatorDisplayName}
                          </span>
                        )}
                      </div>
                    )}
                    {room.isPrivate ? (
                      <div className={styles.roomPrivateJoin}>
                        <input
                          type="text"
                          className={styles.privateCodeInput}
                          placeholder={t("arenas.enterCode")}
                          value={privateCodeByRoom[room.code] ?? ""}
                          onChange={(e) =>
                            setPrivateCodeByRoom((prev) => ({
                              ...prev,
                              [room.code]: e.target.value.toUpperCase().slice(0, 8),
                            }))
                          }
                          maxLength={8}
                          aria-label={t("arenas.enterCode")}
                        />
                        <button
                          type="button"
                          className={styles.btnJoin}
                          onClick={() =>
                            handleJoinByCode(privateCodeByRoom[room.code] || room.code)
                          }
                        >
                          {t("arenas.joinGame")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnJoin}
                        onClick={() => handleJoinByCode(room.code)}
                        disabled={room.phase !== "lobby" || room.playerCount >= room.maxPlayers}
                      >
                        {t("arenas.joinGame")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.footerRow}>
            <Link href="/" className={styles.backLink}>
              <span className="material-symbols-outlined">arrow_back</span>
              {t("arenas.backToLanding")}
            </Link>
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label={t("arenas.prevPage")}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageBtn} ${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label={t("arenas.nextPage")}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <p className={styles.scanning}>
              {t("arenas.scanning")} <span className={styles.scanningPulse}>{t("arenas.newSnacks")}</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
