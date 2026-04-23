"use client";
import { Card } from "@/components/ui/card";
import { ModelSwapPopover } from "./model-swap-popover";

export type SeatState = {
  status: "idle" | "thinking" | "streaming" | "done" | "error";
  role?: string;
  model?: string;
  text: string;
  error?: string;
};

export function SeatCard({
  role,
  brief,
  modelId,
  seatState,
  editable,
  onSwap,
}: {
  role: string;
  brief: string;
  modelId: string;
  seatState?: SeatState;
  editable?: boolean;
  onSwap?: (modelId: string) => void;
}) {
  const status = seatState?.status ?? "idle";
  const ring =
    status === "thinking"
      ? "ring-2 ring-[color:var(--color-seat-thinking)] animate-pulse"
      : status === "streaming"
        ? "ring-2 ring-[color:var(--color-seat-streaming)]"
        : status === "done"
          ? "ring-1 ring-[color:var(--color-seat-done)]"
          : status === "error"
            ? "ring-2 ring-[color:var(--color-seat-error)]"
            : "ring-1 ring-[color:var(--color-seat-idle)]/40";

  const provider = modelId.split("/")[0];

  const body = (
    <Card
      className={`flex h-full flex-col gap-2 p-4 transition-all ${ring}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{role}</div>
        <div
          className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          title={modelId}
        >
          {provider}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{brief}</div>
      {seatState?.text && (
        <div className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed">
          {seatState.text}
        </div>
      )}
      {seatState?.error && (
        <div className="mt-1 text-xs text-[color:var(--color-seat-error)]">
          {seatState.error}
        </div>
      )}
    </Card>
  );

  return editable && onSwap ? (
    <ModelSwapPopover current={modelId} onPick={onSwap}>
      <div className="h-full cursor-pointer transition-transform hover:-translate-y-0.5">
        {body}
      </div>
    </ModelSwapPopover>
  ) : (
    body
  );
}
