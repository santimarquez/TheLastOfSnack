import type { Snack } from "./types.js";

/**
 * Single source of truth for all playable snack identities.
 * Used for role assignment (game-server) and for UI (frontend weakness table, etc.).
 * When adding a new snack, add it here and it will be included in the identity pool.
 */
export const ALL_SNACKS: Snack[] = [
  {
    id: "pizza",
    name: "🍕 Pizza",
    isLastSnack: false,
    category: "Savory",
    weakness: "Cold",
    eliminatedBy: "❄️ Freeze",
  },
  {
    id: "sushi",
    name: "🍣 Sushi",
    isLastSnack: false,
    category: "Savory",
    weakness: "Heat",
    eliminatedBy: "🔥 Microwave",
  },
  {
    id: "donut",
    name: "🍩 Donut",
    isLastSnack: false,
    category: "Sweet",
    weakness: "Salt",
    eliminatedBy: "🧂 Double Salt",
  },
  {
    id: "ice_cream",
    name: "🍦 Ice Cream",
    isLastSnack: false,
    category: "Sweet",
    weakness: "Heat",
    eliminatedBy: "🔥 Microwave",
  },
  {
    id: "burger",
    name: "🍔 Burger",
    isLastSnack: false,
    category: "Savory",
    weakness: "Mold",
    eliminatedBy: "🦠 Spoil",
  },
  {
    id: "taco",
    name: "🌮 Taco",
    isLastSnack: false,
    category: "Savory",
    weakness: "Shake",
    eliminatedBy: "🌪️ Shake",
  },
  {
    id: "fries",
    name: "🍟 Fries",
    isLastSnack: false,
    category: "Savory",
    weakness: "Soggy",
    eliminatedBy: "💧 Steam",
  },
];

/** Snack ids in display order (for weakness table, etc.). */
export const ALL_SNACK_IDS = ALL_SNACKS.map((s) => s.id);
