import type { Player, Snack } from "../state/types.js";
import { AVATAR_IDS_BY_SNACK, ALL_AVATAR_IDS } from "./avatars.js";

/** Snacks and their weaknesses from the game design. The Last Snack is the special role. */
const SNACKS: Snack[] = [
  { id: "last", name: "The Last Snack", isLastSnack: true },
  { id: "pizza", name: "🍕 Pizza", isLastSnack: false, category: "Savory", weakness: "Cold", eliminatedBy: "❄️ Freeze" },
  { id: "sushi", name: "🍣 Sushi", isLastSnack: false, category: "Savory", weakness: "Heat", eliminatedBy: "🔥 Microwave" },
  { id: "donut", name: "🍩 Donut", isLastSnack: false, category: "Sweet", weakness: "Salt", eliminatedBy: "🧂 Double Salt" },
  { id: "ice_cream", name: "🍦 Ice Cream", isLastSnack: false, category: "Sweet", weakness: "Heat", eliminatedBy: "🔥 Microwave" },
  { id: "burger", name: "🍔 Burger", isLastSnack: false, category: "Savory", weakness: "Mold", eliminatedBy: "🦠 Spoil" },
  { id: "taco", name: "🌮 Taco", isLastSnack: false, category: "Savory", weakness: "Shake", eliminatedBy: "🌪️ Shake" },
  { id: "fries", name: "🍟 Fries", isLastSnack: false, category: "Savory", weakness: "Soggy", eliminatedBy: "💧 Steam" },
];

export function assignRoles(players: Player[]): void {
  const lastSnack = SNACKS.find((s) => s.isLastSnack)!;
  const others = SNACKS.filter((s) => !s.isLastSnack);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const roles: Snack[] = [lastSnack, ...shuffled.slice(0, players.length - 1)];
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  players.forEach((p, i) => {
    p.role = roles[i] ?? null;
  });

  // Assign unique avatars: one per player for snack types that have avatars (pizza, donut, burger, ice_cream, sushi, taco).
  const avatarIdsBySnack = { ...AVATAR_IDS_BY_SNACK };
  for (const snackId of Object.keys(avatarIdsBySnack)) {
    const withRole = players.filter((p) => p.role?.id === snackId);
    const ids = avatarIdsBySnack[snackId as keyof typeof avatarIdsBySnack];
    const shuffledIds = [...ids].sort(() => Math.random() - 0.5);
    withRole.forEach((p, idx) => {
      p.avatarId = shuffledIds[idx] ?? null;
    });
  }
  // last and fries have no avatars in AVATAR_IDS_BY_SNACK; assign an unused avatar so everyone has one
  const used = new Set(players.map((p) => p.avatarId).filter(Boolean) as string[]);
  const available = ALL_AVATAR_IDS.filter((id) => !used.has(id)).sort(() => Math.random() - 0.5);
  let idx = 0;
  players.forEach((p) => {
    if (!p.avatarId && available[idx] != null) {
      p.avatarId = available[idx];
      used.add(available[idx]);
      idx++;
    }
  });
}
