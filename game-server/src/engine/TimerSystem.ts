type TimerCallback = () => void;

const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function startTurnTimer(roomCode: string, playerId: string, timeoutSec: number, onExpire: TimerCallback): void {
  const key = `${roomCode}:${playerId}`;
  cancelTurnTimer(roomCode, playerId);
  activeTimers.set(
    key,
    setTimeout(() => {
      activeTimers.delete(key);
      onExpire();
    }, timeoutSec * 1000)
  );
}

export function cancelTurnTimer(roomCode: string, playerId: string): void {
  const key = `${roomCode}:${playerId}`;
  const t = activeTimers.get(key);
  if (t) {
    clearTimeout(t);
    activeTimers.delete(key);
  }
}

export function cancelAllForRoom(roomCode: string): void {
  for (const [key, t] of activeTimers) {
    if (key.startsWith(roomCode + ":")) {
      clearTimeout(t);
      activeTimers.delete(key);
    }
  }
}

export function getExpiresAt(timeoutSec: number): number {
  return Date.now() + timeoutSec * 1000;
}
