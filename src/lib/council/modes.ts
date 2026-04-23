import type { ModeId } from "./schema";

export type Seat = {
  id: string;
  role: string;
  roleBrief: string;
  preferredModels: string[];
  systemPrompt: string;
};

export type Mode = {
  id: ModeId;
  name: string;
  description: string;
  pattern: "parallel" | "sequential";
  seats: Seat[];
  chair: Seat;
};

const COMMON_GUARDRAIL = [
  "You are one voice on a council of AIs deliberating a user question.",
  "Stay tightly in your role. Be concise (< 180 words).",
  "Surface where you might disagree with other perspectives — do not hedge.",
  "Use British / South African English spellings.",
].join(" ");

function seat(
  id: string,
  role: string,
  brief: string,
  preferred: string[],
  roleDirective: string,
): Seat {
  return {
    id,
    role,
    roleBrief: brief,
    preferredModels: preferred,
    systemPrompt: `${COMMON_GUARDRAIL}\n\nYour role: ${role}. ${roleDirective}`,
  };
}

const CHAIR_PREFERRED = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "openai/gpt-oss-120b:free",
];

const CHAIR_SEAT = seat(
  "chair",
  "The Chair",
  "Synthesises the council into a structured verdict.",
  CHAIR_PREFERRED,
  "Read every councillor carefully, distil consensus, name real disagreements, surface risks, end with a clear recommendation. Do not add new opinions of your own beyond synthesis.",
);

const PERSPECTIVES_SEATS: Seat[] = [
  seat("optimist", "The Optimist", "Finds the upside, the possibility, the best-case.", CHAIR_PREFERRED, "Argue the strongest optimistic case. Do not be naive — acknowledge what would have to be true."),
  seat("skeptic", "The Skeptic", "Pokes holes in everything.", CHAIR_PREFERRED, "Assume the proposition might be wrong. State what would make it false and why it probably is false."),
  seat("pragmatist", "The Pragmatist", "Cares about what actually ships.", CHAIR_PREFERRED, "Focus on feasibility, cost, time, and the 80/20 path. Cut fluff."),
  seat("creative", "The Creative", "Generates unexpected options.", CHAIR_PREFERRED, "Offer 1–3 unconventional angles the others may miss. Be bold, not random."),
  seat("expert", "The Domain Expert", "Applies domain knowledge.", CHAIR_PREFERRED, "Answer as a careful expert in whatever domain the question is in. Call out known pitfalls."),
];

const SKILLS_SEATS: Seat[] = [
  seat("researcher", "The Researcher", "Gathers facts and sub-questions.", CHAIR_PREFERRED, "List the key facts, open questions, and information the question depends on. Do not conclude yet."),
  seat("architect", "The Architect", "Structures the answer shape.", CHAIR_PREFERRED, "Given the Researcher's facts, propose a structured approach to the answer."),
  seat("critic", "The Critic", "Challenges the structure.", CHAIR_PREFERRED, "Critique the Architect's structure. Find weak assumptions, missing cases, brittle steps."),
  seat("writer", "The Writer", "Produces a clean draft answer.", CHAIR_PREFERRED, "Write a tight answer using the Researcher's facts, the Architect's structure, and the Critic's fixes."),
  seat("factchecker", "The Fact-checker", "Verifies and caveats.", CHAIR_PREFERRED, "Review the Writer's draft. Flag claims that need citations, hedges, or are likely wrong."),
];

// Each Flavour seat prefers a *different provider family* for real flavour
// variety. Ordered lists fall back to nearest free equivalent if primary is gone.
const FLAVOUR_SEATS: Seat[] = [
  { ...PERSPECTIVES_SEATS[0], preferredModels: ["meta-llama/llama-3.3-70b-instruct:free", "nousresearch/hermes-3-llama-3.1-405b:free"] },
  { ...PERSPECTIVES_SEATS[1], preferredModels: ["qwen/qwen3-next-80b-a3b-instruct:free", "qwen/qwen3-coder:free"] },
  { ...PERSPECTIVES_SEATS[2], preferredModels: ["openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free"] },
  { ...PERSPECTIVES_SEATS[3], preferredModels: ["google/gemma-4-31b-it:free", "google/gemma-3-27b-it:free"] },
  { ...PERSPECTIVES_SEATS[4], preferredModels: ["nvidia/nemotron-3-super-120b-a12b:free", "z-ai/glm-4.5-air:free", "minimax/minimax-m2.5:free"] },
];

const DEBATE_SEATS: Seat[] = [
  seat("proposer", "The Proposer", "Argues for the proposition.", CHAIR_PREFERRED, "Make the strongest case FOR whatever the user is asking. Be direct."),
  seat("challenger", "The Challenger", "Argues against.", CHAIR_PREFERRED, "Attack the Proposer's case. Find its weakest link."),
  seat("second", "The Second Proposer", "Rebuts the Challenger.", CHAIR_PREFERRED, "Given the Proposer's case and the Challenger's attack, rebuild the case with the attack accounted for."),
];

const JUDGE_SEAT = seat(
  "judge",
  "The Judge",
  "Decides the debate.",
  CHAIR_PREFERRED,
  "Given all three debaters, render a structured verdict. You are the Chair in this mode.",
);

export const MODES: Record<ModeId, Mode> = {
  perspectives: {
    id: "perspectives",
    name: "Perspectives",
    description: "Five angles on the same question in parallel.",
    pattern: "parallel",
    seats: PERSPECTIVES_SEATS,
    chair: CHAIR_SEAT,
  },
  skills: {
    id: "skills",
    name: "Skills",
    description: "Researcher → Architect → Critic → Writer → Fact-checker.",
    pattern: "sequential",
    seats: SKILLS_SEATS,
    chair: CHAIR_SEAT,
  },
  flavour: {
    id: "flavour",
    name: "Flavour",
    description: "Five different providers, each in a different Perspective role.",
    pattern: "parallel",
    seats: FLAVOUR_SEATS,
    chair: CHAIR_SEAT,
  },
  debate: {
    id: "debate",
    name: "Debate",
    description: "Proposer vs Challenger vs Second. The Judge decides.",
    pattern: "sequential",
    seats: DEBATE_SEATS,
    chair: JUDGE_SEAT,
  },
};
