import type { Room } from "./types.js";

const rooms = new Map<string, Room>();

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function setRoom(code: string, room: Room): void {
  rooms.set(code.toUpperCase(), room);
}

export function deleteRoom(code: string): void {
  rooms.delete(code.toUpperCase());
}

export function hasRoom(code: string): boolean {
  return rooms.has(code.toUpperCase());
}

export function getAllRoomCodes(): string[] {
  return [...rooms.keys()];
}
