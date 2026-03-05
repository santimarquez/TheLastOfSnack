const CREATOR_ID_KEY = "last_of_snack_creator_id";

/** Stable id per browser for "one room per creator". Used when creating a room so the server can close any previous room by this creator. */
export function getOrCreateCreatorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CREATOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CREATOR_ID_KEY, id);
  }
  return id;
}
