import type { Verdict } from "./council/schema";

export type CouncilEvent =
  | { t: "seat_start"; seatId: string; role: string; model: string }
  | { t: "seat_delta"; seatId: string; text: string }
  | { t: "seat_done"; seatId: string }
  | { t: "seat_error"; seatId: string; message: string }
  | { t: "chair_start"; model: string }
  | { t: "chair_done"; verdict: Verdict }
  | { t: "error"; message: string }
  | { t: "done" };

export function encodeEvent(e: CouncilEvent): string {
  return `data: ${JSON.stringify(e)}\n\n`;
}

export function decodeLine(line: string): CouncilEvent | null {
  try {
    return JSON.parse(line) as CouncilEvent;
  } catch {
    return null;
  }
}
