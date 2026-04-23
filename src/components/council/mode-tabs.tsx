"use client";
import { MODES } from "@/lib/council/modes";
import type { ModeId } from "@/lib/council/schema";

export function ModeTabs({
  value,
  onChange,
}: {
  value: ModeId;
  onChange: (v: ModeId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(MODES).map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            value === m.id
              ? "border-foreground bg-foreground text-background"
              : "border-border/60 hover:bg-muted"
          }`}
        >
          {m.name}
          {m.id === "flavour" && (
            <span className="ml-2 text-[10px] uppercase tracking-wider opacity-60">
              default
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
