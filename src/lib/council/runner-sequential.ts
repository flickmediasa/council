import { streamText } from "ai";
import type { Mode, Seat } from "./modes";
import type { CouncilEvent } from "@/lib/sse";
import { buildSeatMessages, type SeatOutput } from "./prompts";
import { openrouter, resolveModel } from "./openrouter";
import type { RunInput } from "./runner-parallel";

async function resolveSeatModel(
  seat: Seat,
  overrides?: RunInput["overrides"],
): Promise<string> {
  const override = overrides?.seats?.[seat.id];
  if (override) return override;
  return resolveModel(seat.preferredModels);
}

export async function* runSequential(
  input: RunInput,
): AsyncGenerator<CouncilEvent, SeatOutput[]> {
  const { mode, question, overrides } = input;
  const outputs: SeatOutput[] = [];
  for (const seat of mode.seats) {
    try {
      const modelId = await resolveSeatModel(seat, overrides);
      yield { t: "seat_start", seatId: seat.id, role: seat.role, model: modelId };
      const [sys, user] = buildSeatMessages({
        mode,
        seat,
        question,
        priorOutputs: outputs,
      });
      const result = streamText({
        model: openrouter(modelId),
        system: sys.content,
        messages: [{ role: "user", content: user.content }],
      });
      let full = "";
      for await (const delta of result.textStream) {
        full += delta;
        yield { t: "seat_delta", seatId: seat.id, text: delta };
      }
      yield { t: "seat_done", seatId: seat.id };
      outputs.push({ seatId: seat.id, role: seat.role, text: full });
    } catch (err) {
      yield {
        t: "seat_error",
        seatId: seat.id,
        message: (err as Error).message,
      };
    }
  }
  return outputs;
}
