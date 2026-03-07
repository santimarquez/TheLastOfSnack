/**
 * Centralized sound playback for The Last of the Snacks.
 * - Overlapping sounds allowed, max 4 simultaneous
 * - When limit reached, oldest lowest-priority sound is stopped
 * - Volume by category; respects global mute/volume from soundStore
 * - Optional pitch variation to avoid repetition
 */

import { getSoundPath, getSoundCategory, isRegisteredSound, type SoundCategory } from "./soundRegistry";
import { useSoundStore } from "@/store/soundStore";

const MAX_SIMULTANEOUS = 4;
const PITCH_MIN = 0.95;
const PITCH_MAX = 1.05;

/** Lower = evicted first when at capacity */
const CATEGORY_PRIORITY: Record<SoundCategory, number> = {
  ui: 0,
  targeting: 1,
  cards: 2,
  eliminations: 3,
  events: 4,
};

interface ActiveSound {
  el: HTMLAudioElement;
  soundName: string;
  category: SoundCategory;
  priority: number;
  startedAt: number;
}

let active: ActiveSound[] = [];
const categoryVolumes: Record<SoundCategory, number> = {
  ui: 1,
  targeting: 1,
  cards: 1,
  eliminations: 1,
  events: 1,
};

function getMasterVolume(): number {
  if (typeof window === "undefined") return 0;
  const { volume, muted } = useSoundStore.getState();
  if (muted) return 0;
  return Math.max(0, Math.min(1, volume));
}

function evictOne(): void {
  if (active.length < MAX_SIMULTANEOUS) return;
  const sorted = [...active].sort(
    (a, b) => a.priority - b.priority || a.startedAt - b.startedAt
  );
  const toRemove = sorted[0];
  toRemove.el.pause();
  toRemove.el.src = "";
  active = active.filter((s) => s !== toRemove);
}

function removeFromActive(el: HTMLAudioElement): void {
  active = active.filter((s) => s.el !== el);
}

function playInternal(soundName: string, randomPitch: boolean): void {
  if (typeof window === "undefined") return;
  if (!isRegisteredSound(soundName)) return;

  const path = getSoundPath(soundName);
  const category = getSoundCategory(soundName);
  if (!path || !category) return;

  const master = getMasterVolume();
  if (master <= 0) return;

  evictOne();

  const audio = new Audio(path);
  const categoryVol = categoryVolumes[category] ?? 1;
  audio.volume = Math.max(0, Math.min(1, master * categoryVol));

  if (randomPitch) {
    const t = Math.random();
    audio.playbackRate = PITCH_MIN + t * (PITCH_MAX - PITCH_MIN);
  } else {
    audio.playbackRate = 1;
  }

  const startedAt = Date.now();
  const priority = CATEGORY_PRIORITY[category];

  active.push({ el: audio, soundName, category, priority, startedAt });

  audio.addEventListener("ended", () => removeFromActive(audio));
  audio.addEventListener("error", () => removeFromActive(audio));
  audio.play().catch(() => removeFromActive(audio));
}

export const SoundManager = {
  /**
   * Play a sound by name. Uses fixed pitch.
   * No-op if sound not registered, muted, or path missing.
   */
  play(soundName: string): void {
    playInternal(soundName, false);
  },

  /**
   * Play with random playbackRate in [0.95, 1.05] to reduce repetition.
   */
  playRandomPitch(soundName: string): void {
    playInternal(soundName, true);
  },

  /**
   * Stop all instances of this sound name currently playing.
   */
  stop(soundName: string): void {
    active.filter((s) => s.soundName === soundName).forEach((s) => {
      s.el.pause();
      s.el.src = "";
    });
    active = active.filter((s) => s.soundName !== soundName);
  },

  /**
   * Set volume multiplier for a category (0–1). Applied on next play.
   */
  setVolume(category: SoundCategory, value: number): void {
    categoryVolumes[category] = Math.max(0, Math.min(1, value));
  },

  /**
   * Mute all SFX by delegating to global sound store.
   */
  muteAll(): void {
    useSoundStore.getState().setMuted(true);
  },

  /**
   * Unmute all SFX by delegating to global sound store.
   */
  unmuteAll(): void {
    useSoundStore.getState().setMuted(false);
  },
};
