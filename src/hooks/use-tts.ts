"use client";
import { useCallback, useEffect, useRef } from "react";

export function useTts() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioRef.current = new Audio();
  }, []);

  const speak = useCallback(async (text: string, muted: boolean) => {
    if (muted || !text.trim() || !audioRef.current) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      await audioRef.current.play().catch(() => undefined);
    } catch {
      // silent degrade
    }
  }, []);

  return { speak };
}
