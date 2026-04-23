"use client";
import { MODES } from "@/lib/council/modes";
import type { ModeId } from "@/lib/council/schema";
import type { SelectorValue } from "./selector";
import type { CouncilRunState } from "@/hooks/use-council-run";
import { SeatCard } from "./seat-card";
import { ChairCard } from "./chair-card";
import { VerdictPanel } from "./verdict-panel";

export function TheatreView({
  modeId,
  selector,
  state,
}: {
  modeId: ModeId;
  selector: SelectorValue;
  state: CouncilRunState;
}) {
  const mode = MODES[modeId];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {mode.seats.map((s) => (
          <SeatCard
            key={s.id}
            role={s.role}
            brief={s.roleBrief}
            modelId={selector.seatOverrides[s.id] ?? s.preferredModels[0]}
            seatState={state.seats[s.id]}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <ChairCard
          modelId={
            selector.chairOverride ?? mode.chair.preferredModels[0]
          }
          chairState={state.chair}
        />
        <VerdictPanel verdict={state.chair.verdict} />
      </div>
    </div>
  );
}
