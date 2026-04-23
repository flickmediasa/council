"use client";
import { useCallback, useReducer } from "react";
import type { CouncilEvent } from "@/lib/sse";
import type { Verdict, CouncilRequest } from "@/lib/council/schema";
import type { SeatState } from "@/components/council/seat-card";
import type { ChairState } from "@/components/council/chair-card";

type State = {
  running: boolean;
  seats: Record<string, SeatState>;
  chair: ChairState;
  globalError?: string;
};

const initialState: State = {
  running: false,
  seats: {},
  chair: { status: "idle" },
};

type Action =
  | { type: "START" }
  | { type: "EVENT"; event: CouncilEvent }
  | { type: "FINISH" }
  | { type: "FAIL"; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { ...initialState, running: true };
    case "FINISH":
      return { ...state, running: false };
    case "FAIL":
      return { ...state, running: false, globalError: action.message };
    case "EVENT": {
      const e = action.event;
      switch (e.t) {
        case "seat_start":
          return {
            ...state,
            seats: {
              ...state.seats,
              [e.seatId]: {
                status: "thinking",
                role: e.role,
                model: e.model,
                text: "",
              },
            },
          };
        case "seat_delta": {
          const prev = state.seats[e.seatId] ?? { status: "streaming", text: "" };
          return {
            ...state,
            seats: {
              ...state.seats,
              [e.seatId]: {
                ...prev,
                status: "streaming",
                text: prev.text + e.text,
              },
            },
          };
        }
        case "seat_done": {
          const prev = state.seats[e.seatId];
          return {
            ...state,
            seats: {
              ...state.seats,
              [e.seatId]: { ...(prev ?? { text: "" }), status: "done" },
            },
          };
        }
        case "seat_error": {
          const prev = state.seats[e.seatId];
          return {
            ...state,
            seats: {
              ...state.seats,
              [e.seatId]: {
                ...(prev ?? { text: "" }),
                status: "error",
                error: e.message,
              },
            },
          };
        }
        case "chair_start":
          return { ...state, chair: { status: "thinking", model: e.model } };
        case "chair_done":
          return {
            ...state,
            chair: { ...state.chair, status: "done", verdict: e.verdict },
          };
        case "error":
          return {
            ...state,
            globalError: e.message,
            chair: { ...state.chair, status: "error", error: e.message },
          };
        case "done":
          return { ...state, running: false };
      }
    }
  }
}

export function useCouncilRun() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const run = useCallback(async (req: CouncilRequest) => {
    dispatch({ type: "START" });
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok || !res.body) {
        dispatch({ type: "FAIL", message: `HTTP ${res.status}` });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(chunk.slice(5).trim()) as CouncilEvent;
            dispatch({ type: "EVENT", event: ev });
          } catch {
            // swallow malformed chunks
          }
        }
      }
      dispatch({ type: "FINISH" });
    } catch (err) {
      dispatch({ type: "FAIL", message: (err as Error).message });
    }
  }, []);

  return { state, run };
}

export type { State as CouncilRunState, Verdict };
