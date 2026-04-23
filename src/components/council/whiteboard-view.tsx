"use client";
import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { MODES } from "@/lib/council/modes";
import type { ModeId } from "@/lib/council/schema";
import type { SelectorValue } from "./selector";
import type { CouncilRunState } from "@/hooks/use-council-run";
import { WhiteboardNode } from "./whiteboard-node";
import { VerdictPanel } from "./verdict-panel";

const nodeTypes = { seat: WhiteboardNode };

export function WhiteboardView({
  modeId,
  selector,
  state,
  question,
}: {
  modeId: ModeId;
  selector: SelectorValue;
  state: CouncilRunState;
  question: string;
}) {
  const mode = MODES[modeId];

  const { nodes, edges } = useMemo(() => {
    const y0 = 30;
    const gap = 110;
    const seatCount = mode.seats.length;
    const middleY = y0 + gap * ((seatCount - 1) / 2);
    const n: Node[] = [];
    const e: Edge[] = [];

    n.push({
      id: "question",
      position: { x: 0, y: middleY },
      data: { label: question.slice(0, 80) || "Your question" },
      type: "input",
      style: {
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        fontSize: 12,
        padding: 8,
        width: 180,
      },
    });

    mode.seats.forEach((s, i) => {
      const id = `seat-${s.id}`;
      n.push({
        id,
        position: { x: 280, y: y0 + gap * i },
        data: {
          role: s.role,
          modelId: selector.seatOverrides[s.id] ?? s.preferredModels[0],
          state: state.seats[s.id],
        },
        type: "seat",
      });
      if (mode.pattern === "parallel") {
        e.push({
          id: `q-${id}`,
          source: "question",
          target: id,
          animated: state.seats[s.id]?.status === "thinking",
        });
        e.push({
          id: `${id}-chair`,
          source: id,
          target: "chair",
          animated: state.chair.status === "thinking",
        });
      } else {
        const prev = i === 0 ? "question" : `seat-${mode.seats[i - 1].id}`;
        e.push({
          id: `${prev}-${id}`,
          source: prev,
          target: id,
          animated: state.seats[s.id]?.status === "thinking",
        });
        if (i === mode.seats.length - 1) {
          e.push({
            id: `${id}-chair`,
            source: id,
            target: "chair",
            animated: state.chair.status === "thinking",
          });
        }
      }
    });

    n.push({
      id: "chair",
      position: { x: 580, y: middleY },
      data: {
        role: mode.chair.role,
        modelId: selector.chairOverride ?? mode.chair.preferredModels[0],
        state: {
          status: state.chair.status,
          text: "",
          error: state.chair.error,
        } as SeatState | undefined,
        isChair: true,
      },
      type: "seat",
    });
    return { nodes: n, edges: e };
  }, [mode, selector, state, question]);

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[520px] w-full rounded-xl border border-border/60 bg-card/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          className="!bg-transparent"
        >
          <Background color="var(--muted-foreground)" gap={20} size={1} />
          <Controls className="!bg-card !border-border" />
        </ReactFlow>
      </div>
      <VerdictPanel verdict={state.chair.verdict} />
    </div>
  );
}

type SeatState = import("./seat-card").SeatState;
