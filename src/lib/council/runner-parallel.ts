import { streamText } from "ai";
import type { Mode, Seat } from "./modes";
import type { CouncilEvent } from "@/lib/sse";
import { buildSeatMessages, type SeatOutput } from "./prompts";
import { openrouter, resolveModel } from "./openrouter";

export type RunInput = {
  mode: Mode;
  question: string;
  overrides?: { seats?: Record<string, string>; chair?: string };
};

async function resolveSeatModel(
  seat: Seat,
  overrides?: RunInput["overrides"],
): Promise<string> {
  const override = overrides?.seats?.[seat.id];
  if (override) return override;
  return resolveModel(seat.preferredModels);
}

async function* runSeat(
  mode: Mode,
  seat: Seat,
  question: string,
  overrides: RunInput["overrides"],
): AsyncGenerator<CouncilEvent, SeatOutput | null> {
  try {
    const modelId = await resolveSeatModel(seat, overrides);
    yield { t: "seat_start", seatId: seat.id, role: seat.role, model: modelId };
    const [sys, user] = buildSeatMessages({ mode, seat, question });
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
    return { seatId: seat.id, role: seat.role, text: full };
  } catch (err) {
    yield {
      t: "seat_error",
      seatId: seat.id,
      message: (err as Error).message,
    };
    return null;
  }
}

export async function* runParallel(
  input: RunInput,
): AsyncGenerator<CouncilEvent, SeatOutput[]> {
  const { mode, question, overrides } = input;
  const gens = mode.seats.map((s) => runSeat(mode, s, question, overrides));
  type Pending = {
    g: AsyncGenerator<CouncilEvent, SeatOutput | null>;
    originalIndex: number;
    promise: Promise<IteratorResult<CouncilEvent, SeatOutput | null>>;
  };
  const pending: Pending[] = gens.map((g, i) => ({
    g,
    originalIndex: i,
    promise: g.next(),
  }));
  const outputs: (SeatOutput | null)[] = new Array(mode.seats.length).fill(null);

  while (pending.length) {
    const raced = await Promise.race(
      pending.map((p, idx) =>
        p.promise.then((r) => ({ result: r, idx })),
      ),
    );
    const { result, idx } = raced;
    if (result.done) {
      outputs[pending[idx].originalIndex] = result.value ?? null;
      pending.splice(idx, 1);
    } else {
      yield result.value;
      pending[idx].promise = pending[idx].g.next();
    }
  }
  return outputs.filter((o): o is SeatOutput => !!o);
}
