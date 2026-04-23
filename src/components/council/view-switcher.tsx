"use client";
import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/toggle";

const KEY = "council-view";
export type View = "theatre" | "whiteboard";

export function useView(): [View, (v: View) => void] {
  const [view, setView] = useState<View>("theatre");
  useEffect(() => {
    const v = localStorage.getItem(KEY) as View | null;
    if (v === "theatre" || v === "whiteboard") setView(v);
  }, []);
  const update = (v: View) => {
    localStorage.setItem(KEY, v);
    setView(v);
  };
  return [view, update];
}

export function ViewSwitcher() {
  const [view, setView] = useView();
  return (
    <div className="flex gap-1 rounded-md border p-1">
      <Toggle
        pressed={view === "theatre"}
        onPressedChange={() => setView("theatre")}
        size="sm"
        variant="outline"
      >
        Theatre
      </Toggle>
      <Toggle
        pressed={view === "whiteboard"}
        onPressedChange={() => setView("whiteboard")}
        size="sm"
        variant="outline"
      >
        Whiteboard
      </Toggle>
    </div>
  );
}
