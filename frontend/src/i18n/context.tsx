"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import en from "./messages/en.json";
import es from "./messages/es.json";

export type Locale = "en" | "es";

const STORAGE_KEY = "last-of-snack-locale";

const messages: Record<Locale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  es: es as Record<string, unknown>,
};

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(str: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    str
  );
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "es") setLocaleState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale === "es" ? "es" : "en";
  }, [mounted, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      const dict = messages[locale];
      const value = getNested(dict, key);
      const str = typeof value === "string" ? value : key;
      return vars ? interpolate(str, vars) : str;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslations() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}

const GUEST_NAME_STORAGE_KEY = "last-of-snack-guest-name-index";
const GUEST_NAME_COUNT = 8;

/** Returns one of 8 translated guest names; stable per session (stored in sessionStorage). */
export function getGuestDisplayName(t: (key: string) => string): string {
  if (typeof window === "undefined") return t("room.guestName0");
  let index = 0;
  const stored = sessionStorage.getItem(GUEST_NAME_STORAGE_KEY);
  if (stored !== null) {
    const n = parseInt(stored, 10);
    if (!Number.isNaN(n) && n >= 0 && n < GUEST_NAME_COUNT) index = n;
  } else {
    index = Math.floor(Math.random() * GUEST_NAME_COUNT);
    sessionStorage.setItem(GUEST_NAME_STORAGE_KEY, String(index));
  }
  return t(`room.guestName${index}`);
}
