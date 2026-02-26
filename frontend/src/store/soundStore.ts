import { create } from "zustand";

const STORAGE_KEY = "last-of-snack-sound";
const DEFAULT_VOLUME = 0.1;

/** Set to true to enable background music and show volume/mute UI. */
export const MUSIC_ENABLED = false;

function loadPersisted(): { volume: number; muted: boolean } {
  if (typeof window === "undefined") return { volume: DEFAULT_VOLUME, muted: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { volume: DEFAULT_VOLUME, muted: false };
    const parsed = JSON.parse(raw) as { volume?: number; muted?: boolean };
    return {
      volume: typeof parsed.volume === "number" ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_VOLUME,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { volume: DEFAULT_VOLUME, muted: false };
  }
}

interface SoundStore {
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

const persisted = loadPersisted();

export const useSoundStore = create<SoundStore>((set, get) => ({
  volume: persisted.volume,
  muted: persisted.muted,

  setVolume: (volume) => {
    const v = Math.max(0, Math.min(1, volume));
    set({ volume: v });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: v, muted: get().muted }));
    } catch {}
  },

  setMuted: (muted) => {
    set({ muted: muted });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: get().volume, muted }));
    } catch {}
  },

  toggleMuted: () => {
    const next = !get().muted;
    set({ muted: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: get().volume, muted: next }));
    } catch {}
  },
}));

if (typeof window !== "undefined") {
  useSoundStore.setState(loadPersisted());
}
