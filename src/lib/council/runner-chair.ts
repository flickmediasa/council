import { generateText, Output } from "ai";
import type { Mode } from "./modes";
import type { CouncilEvent } from "@/lib/sse";
import { buildChairMessages, type SeatOutput } from "./prompts";
import { VerdictSchema, type Verdict } from "./schema";
import { openrouter, resolveModel } from "./openrouter";

export async function* runChair(args: {
  mode: Mode;
  question: string;
  outputs: SeatOutput[];
  chairOverride?: string;
}): AsyncGenerator<CouncilEvent, Verdict | null> {
  const { mode, question, outputs, chairOverride } = args;
  try {
    const modelId =
      chairOverride ?? (await resolveModel(mode.chair.preferredModels));
    yield { t: "chair_start", model: modelId };
    const [sys, user] = buildChairMessages({ mode, question, outputs });

    const result = await generateText({
      model: openrouter(modelId),
      output: Output.object({ schema: VerdictSchema }),
      system: sys.content,
      messages: [{ role: "user", content: user.content }],
    });

    const verdict = result.output as Verdict;
    yield { t: "chair_done", verdict };
    return verdict;
  } catch (err) {
    yield { t: "error", message: `Chair failed: ${(err as Error).message}` };
    return null;
  }
}
