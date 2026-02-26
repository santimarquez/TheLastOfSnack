"use client";

import { useEffect, useRef } from "react";
import { useSoundStore, MUSIC_ENABLED } from "@/store/soundStore";
import { useGoodConnection } from "@/hooks/useGoodConnection";

const TRACKS = ["/audio/Song1.mp3", "/audio/Song2.mp3", "/audio/Song3.mp3", "/audio/Song4.mp3"];

export function BackgroundMusic() {
  const { volume, muted } = useSoundStore();
  const goodConnection = useGoodConnection();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const shouldPlayRef = useRef(false);

  shouldPlayRef.current = MUSIC_ENABLED && goodConnection && !muted;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    function playNext() {
      if (!shouldPlayRef.current) return;
      const src = TRACKS[indexRef.current % TRACKS.length];
      indexRef.current += 1;
      audio.src = src;
      audio.load();
      audio.volume = useSoundStore.getState().volume;
      audio.play().catch(() => {});
    }

    audio.addEventListener("ended", playNext);
    return () => {
      audio.removeEventListener("ended", playNext);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!MUSIC_ENABLED) {
      audio.pause();
      return;
    }
    audio.volume = volume;
    if (!goodConnection || muted) {
      audio.pause();
      return;
    }
    if (audio.paused) {
      if (!audio.src) {
        indexRef.current = 0;
        audio.src = TRACKS[0];
        audio.load();
      }
      audio.play().catch(() => {});
    }
  }, [goodConnection, muted, volume]);

  return null;
}
