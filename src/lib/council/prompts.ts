import type { Mode, Seat } from "./modes";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type SeatOutput = { seatId: string; role: string; text: string };

export function buildSeatMessages(args: {
  mode: Mode;
  seat: Seat;
  question: string;
  priorOutputs?: SeatOutput[];
}): ChatMessage[] {
  const { mode, seat, question, priorOutputs } = args;
  const modeFrame = `Mode: ${mode.name} — ${mode.description}`;
  const system = `${seat.systemPrompt}\n\n${modeFrame}`;

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  if (priorOutputs && priorOutputs.length > 0) {
    const priorBlock = priorOutputs
      .map((o) => `--- ${o.role} (${o.seatId}) ---\n${o.text}`)
      .join("\n\n");
    messages.push({
      role: "user",
      content: `Prior councillors have spoken:\n\n${priorBlock}\n\n--- User question ---\n${question}`,
    });
  } else {
    messages.push({ role: "user", content: question });
  }
  return messages;
}

export function buildChairMessages(args: {
  mode: Mode;
  question: string;
  outputs: SeatOutput[];
}): ChatMessage[] {
  const { mode, question, outputs } = args;
  const system = `${mode.chair.systemPrompt}\n\nMode: ${mode.name}. Synthesise the councillors below into the required structured verdict.`;
  const council = outputs
    .map((o) => `### ${o.role}\n${o.text}`)
    .join("\n\n");
  const user = `User question:\n${question}\n\nCouncil:\n${council}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
