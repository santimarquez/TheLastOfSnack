/**
 * Sound registration map for The Last of the Snacks.
 * Drop audio files in public/sounds/{category}/ as {soundName}.mp3.
 * Paths are built at runtime; missing files are ignored.
 */

export type SoundCategory =
  | "ui"
  | "targeting"
  | "cards"
  | "eliminations"
  | "events";

const CATEGORY_SUBDIRS: Record<SoundCategory, string> = {
  ui: "ui",
  targeting: "targeting",
  cards: "cards",
  eliminations: "eliminations",
  events: "events",
};

export interface SoundDef {
  category: SoundCategory;
  /** Actual filename (e.g. "card_drop.wav"). Defaults to "{soundName}.mp3" */
  file?: string;
}

/** Registry: sound name -> category. Path = /sounds/{subdir}/{file ?? name.mp3} */
export const SOUND_REGISTRY: Record<string, SoundDef> = {
  // UI (custom files from Downloads)
  card_drag: { category: "ui", file: "card_drag.mp3" },
  card_drop: { category: "ui", file: "card_drop.wav" },
  draw_card: { category: "ui", file: "draw_card.mp3" },
  invalid_action: { category: "ui", file: "invalid_action.ogg" },
  turn_start: { category: "ui", file: "turn_start.wav" },

  // Targeting
  target_select: { category: "targeting" },
  target_confirm: { category: "targeting" },

  // Card effects (match card types for SoundManager.play(card.type))
  microwave: { category: "cards" },
  freeze: { category: "cards" },
  salt: { category: "cards" },
  double_salt: { category: "cards" },
  trade_seats: { category: "cards" },
  peek: { category: "cards" },
  foil_wrap: { category: "cards" },
  shake: { category: "cards" },
  spoil: { category: "cards" },
  buffet: { category: "cards" },
  trash: { category: "cards" },
  soggy_steam: { category: "cards" },

  // Eliminations
  elimination_heat: { category: "eliminations" },
  elimination_freeze: { category: "eliminations" },
  elimination_spoil: { category: "eliminations" },
  elimination_shake: { category: "eliminations" },
  elimination_soggy: { category: "eliminations" },

  // Game events (custom files from Downloads)
  round_start: { category: "events", file: "round_start.m4a" },
  final_two_players: { category: "events" },
  victory: { category: "events", file: "victory.mp3.wav" },
};

/** Build public URL for a sound. File at public/sounds/{subdir}/{file ?? soundName.mp3} */
export function getSoundPath(soundName: string): string | null {
  const def = SOUND_REGISTRY[soundName];
  if (!def) return null;
  const subdir = CATEGORY_SUBDIRS[def.category];
  const filename = def.file ?? `${soundName}.mp3`;
  return `/sounds/${subdir}/${filename}`;
}

export function getSoundCategory(soundName: string): SoundCategory | null {
  return SOUND_REGISTRY[soundName]?.category ?? null;
}

export function isRegisteredSound(soundName: string): boolean {
  return soundName in SOUND_REGISTRY;
}
