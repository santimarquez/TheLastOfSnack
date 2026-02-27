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
    const nav = navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean; downlink?: number } };
    const conn = nav.connection;
    if (!conn) {
      setNetworkOk(true);
      return;
    }
    function check() {
      const c = nav.connection;
      if (!c) return;
      const saveData = c.saveData === true;
      const slow = c.effectiveType === "slow-2g" || c.effectiveType === "2g";
      const lowDownlink = typeof c.downlink === "number" && c.downlink < 0.4;
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
