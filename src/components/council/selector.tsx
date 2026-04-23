"use client";
import { useMemo } from "react";
import { MODES } from "@/lib/council/modes";
import type { ModeId } from "@/lib/council/schema";
import { ModeTabs } from "./mode-tabs";
import { SeatCard } from "./seat-card";
import { ChairCard } from "./chair-card";
import { ComingSoonChips } from "./coming-soon-chips";

export type SelectorValue = {
  modeId: ModeId;
  seatOverrides: Record<string, string>;
  chairOverride?: string;
};

export function Selector({
  value,
  onChange,
}: {
  value: SelectorValue;
  onChange: (v: SelectorValue) => void;
}) {
  const mode = useMemo(() => MODES[value.modeId], [value.modeId]);

  const setMode = (modeId: ModeId) =>
    onChange({ modeId, seatOverrides: {}, chairOverride: undefined });

  const swapSeat = (seatId: string) => (modelId: string) =>
    onChange({
      ...value,
      seatOverrides: { ...value.seatOverrides, [seatId]: modelId },
    });

  const swapChair = (modelId: string) =>
    onChange({ ...value, chairOverride: modelId });

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-muted-foreground">
          Pick your council
        </h2>
        <ComingSoonChips />
      </div>
      <ModeTabs value={value.modeId} onChange={setMode} />
      <p className="text-sm text-muted-foreground">{mode.description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {mode.seats.map((s) => (
          <SeatCard
            key={s.id}
            role={s.role}
            brief={s.roleBrief}
            modelId={value.seatOverrides[s.id] ?? s.preferredModels[0]}
            editable
            onSwap={swapSeat(s.id)}
          />
        ))}
      </div>
      <div className="mx-auto w-full max-w-md">
        <ChairCard
          modelId={value.chairOverride ?? mode.chair.preferredModels[0]}
          editable
          onSwap={swapChair}
        />
      </div>
    </section>
  );
}
