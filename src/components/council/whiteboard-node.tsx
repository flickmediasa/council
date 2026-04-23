"use client";
import { Handle, Position } from "reactflow";
import type { SeatState } from "./seat-card";

type NodeData = {
  role: string;
  modelId: string;
  state?: SeatState;
  isChair?: boolean;
};

export function WhiteboardNode({ data }: { data: NodeData }) {
  const s = data.state?.status ?? "idle";
  const ring =
    s === "thinking"
      ? "ring-2 ring-[color:var(--color-seat-thinking)] animate-pulse"
      : s === "streaming"
        ? "ring-2 ring-[color:var(--color-seat-streaming)]"
        : s === "done"
          ? "ring-1 ring-[color:var(--color-seat-done)]"
          : s === "error"
            ? "ring-2 ring-[color:var(--color-seat-error)]"
            : "ring-1 ring-[color:var(--color-seat-idle)]/40";
  return (
    <div
      className={`min-w-[160px] rounded-lg border border-border/60 bg-card p-3 text-xs ${ring}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {data.isChair ? "👑 " : ""}
          {data.role}
        </span>
      </div>
      <div
        className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground"
        title={data.modelId}
      >
        {data.modelId.split("/")[0]}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-muted" />
    </div>
  );
}
