import { NextRequest } from "next/server";
import { CouncilRequestSchema } from "@/lib/council/schema";
import { MODES } from "@/lib/council/modes";
import { runParallel } from "@/lib/council/runner-parallel";
import { runSequential } from "@/lib/council/runner-sequential";
import { runChair } from "@/lib/council/runner-chair";
import { encodeEvent, type CouncilEvent } from "@/lib/sse";
import type { SeatOutput } from "@/lib/council/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let parsed: ReturnType<typeof CouncilRequestSchema.parse>;
  try {
    parsed = CouncilRequestSchema.parse(await req.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const mode = MODES[parsed.modeId];
  const runner = mode.pattern === "parallel" ? runParallel : runSequential;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (e: CouncilEvent) =>
        controller.enqueue(encoder.encode(encodeEvent(e)));

      try {
        const gen = runner({
          mode,
          question: parsed.question,
          overrides: parsed.overrides,
        });
        let outputs: SeatOutput[] = [];
        while (true) {
          const step = await gen.next();
          if (step.done) {
            outputs = step.value ?? [];
            break;
          }
          send(step.value);
        }

        if (outputs.length === 0) {
          send({ t: "error", message: "All council seats failed." });
        } else {
          const chairGen = runChair({
            mode,
            question: parsed.question,
            outputs,
            chairOverride: parsed.overrides?.chair,
          });
          while (true) {
            const step = await chairGen.next();
            if (step.done) break;
            send(step.value);
          }
        }
        send({ t: "done" });
      } catch (err) {
        send({ t: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
