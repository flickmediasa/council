"use client";
import { Card } from "@/components/ui/card";
import { Crown } from "lucide-react";
import { ModelSwapPopover } from "./model-swap-popover";
import type { Verdict } from "@/lib/council/schema";

export type ChairState = {
  status: "idle" | "thinking" | "done" | "error";
  model?: string;
  verdict?: Verdict;
  error?: string;
};

export function ChairCard({
  modelId,
  chairState,
  editable,
  onSwap,
}: {
  modelId: string;
  chairState?: ChairState;
  editable?: boolean;
  onSwap?: (modelId: string) => void;
}) {
  const status = chairState?.status ?? "idle";
  const ring =
    status === "thinking"
      ? "ring-2 ring-[color:var(--color-seat-thinking)] animate-pulse"
      : status === "done"
        ? "ring-1 ring-[color:var(--color-seat-done)]"
        : status === "error"
          ? "ring-2 ring-[color:var(--color-seat-error)]"
          : "ring-1 ring-[color:var(--color-seat-idle)]/40";

  const body = (
    <Card className={`flex flex-col gap-2 p-5 transition-all ${ring}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Crown className="h-4 w-4" /> The Chair
        </div>
        <div
          className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          title={modelId}
        >
          {modelId.split("/")[0]}
        </div>
      </div>
      {chairState?.error && (
        <div className="text-xs text-[color:var(--color-seat-error)]">
          {chairState.error}
        </div>
      )}
      {status === "thinking" && (
        <div className="text-xs text-muted-foreground">Synthesising…</div>
      )}
    </Card>
  );

  return editable && onSwap ? (
    <ModelSwapPopover current={modelId} onPick={onSwap}>
      <div className="cursor-pointer transition-transform hover:-translate-y-0.5">
        {body}
      </div>
    </ModelSwapPopover>
  ) : (
    body
  );
}
