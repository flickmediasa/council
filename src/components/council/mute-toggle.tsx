"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

const KEY = "council-muted";

export function useMuted() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(localStorage.getItem(KEY) === "1");
  }, []);
  const toggle = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(KEY, next ? "1" : "0");
      return next;
    });
  };
  return { muted, toggle };
}

export function MuteToggle() {
  const { muted, toggle } = useMuted();
  return (
    <Toggle
      pressed={muted}
      onPressedChange={toggle}
      aria-label="Mute voice"
      variant="outline"
      size="sm"
    >
      {muted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Toggle>
  );
}
