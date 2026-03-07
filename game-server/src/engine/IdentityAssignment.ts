import type { Player, Snack } from "../state/types.js";
import { ALL_SNACKS } from "@last-of-snack/shared";
import { AVATAR_IDS_BY_SNACK, ALL_AVATAR_IDS } from "./avatars.js";

export function assignRoles(players: Player[]): void {
  const pool = ALL_SNACKS.filter((s) => !s.isLastSnack);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const roles = shuffled.slice(0, players.length) as Snack[];
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
  // last has no avatars in AVATAR_IDS_BY_SNACK; assign an unused avatar so everyone has one
  const used = new Set(
    players.map((p) => p.avatarId).filter(Boolean) as string[],
  );
  const available = ALL_AVATAR_IDS.filter((id) => !used.has(id)).sort(
    () => Math.random() - 0.5,
  );
  let idx = 0;
  players.forEach((p) => {
    if (!p.avatarId && available[idx] != null) {
      p.avatarId = available[idx];
      used.add(available[idx]);
      idx++;
    }
  });
}
