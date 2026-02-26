import { useState, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

/**
 * Returns whether the connection is good enough for background music.
 * Don't play music when: in a room and disconnected/connecting, or when
 * Network Information API reports slow connection / data saver.
 */
export function useGoodConnection(): boolean {
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const roomCode = useGameStore((s) => s.roomCode);
  const [networkOk, setNetworkOk] = useState(true);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean; downlink?: number } }).connection;
    if (!conn) {
      setNetworkOk(true);
      return;
    }
    function check() {
      const saveData = conn.saveData === true;
      const slow = conn.effectiveType === "slow-2g" || conn.effectiveType === "2g";
      const lowDownlink = typeof conn.downlink === "number" && conn.downlink < 0.4;
      setNetworkOk(!saveData && !slow && !lowDownlink);
    }
    check();
    conn.addEventListener?.("change", check);
    return () => conn.removeEventListener?.("change", check);
  }, []);

  const inRoom = Boolean(roomCode);
  const wsOk = !inRoom || connectionStatus === "connected";
  return networkOk && wsOk;
}
