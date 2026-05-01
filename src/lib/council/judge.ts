import { generateText, Output } from "ai";
import type { Mode } from "./modes";
import type { SeatOutput } from "./prompts";
import { buildChairMessages } from "./prompts";
import {
  VerdictV2Schema,
  type VerdictV2,
  type Stakes,
} from "./schema";
import { openrouter } from "./openrouter";
import { resolveByTier, type Vendor } from "./tiers";

// =============================================================================
// Judge — programmatic Chair for the deliberate() path
// =============================================================================
//
// The existing runner-chair.ts is for the SSE/UI path: streams text deltas,
// uses a single mode-defined Chair. Judge here is for stakes-aware decisions:
//
//   stakes ∈ {low, med, high}  →  single Judge, vendor rotated by issueHash
//   stakes = critical          →  dual Judge across two vendors
//                                  agree → synthesise verdict
//                                  disagree → outcome=escalate, dissent recorded
//
// Rotation uses the issueHash so identical issues get the same vendor on
// replay — keeps audit logs reproducible. Different issues spread evenly
// across the rotation pool over time, breaking in-family synthesis bias.

/**
 * Vendors eligible to act as Judge. Anthropic / OpenAI / Google / DeepSeek /
 * Qwen — five genuinely different training corpora. Meta and Mistral could
 * join later; kept off rotation for now to match the council seat lineup.
 */
const ROTATION_VENDORS: Vendor[] = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "qwen",
];

/**
 * Deterministic vendor pick from a rotation key (typically issueHash).
 * Same key always selects the same vendor — useful for replaying
 * audited deliberations against the same configuration.
 */
function pickJudgeVendor(rotationKey: string): Vendor {
  let h = 0;
  for (let i = 0; i < rotationKey.length; i++) {
    h = (h * 31 + rotationKey.charCodeAt(i)) >>> 0;
  }
  return ROTATION_VENDORS[h % ROTATION_VENDORS.length];
}

/** Pick two distinct vendors for dual-Judge mode. */
function pickDualJudgeVendors(rotationKey: string): [Vendor, Vendor] {
  const first = pickJudgeVendor(rotationKey);
  const secondary = pickJudgeVendor(`${rotationKey}:secondary`);
  if (secondary !== first) return [first, secondary];
  const idx = ROTATION_VENDORS.indexOf(first);
  return [first, ROTATION_VENDORS[(idx + 1) % ROTATION_VENDORS.length]];
}

export type RunJudgeOptions = {
  mode: Mode;
  question: string;
  outputs: SeatOutput[];
  stakes: Stakes;
  /** Drives vendor rotation — typically the issueHash of the deliberation's Issue. */
  rotationKey: string;
  allowPaid?: boolean;
};

export type SingleJudgeRecord = {
  vendor: Vendor;
  model: string;
  raw: VerdictV2;
};

export type JudgeResult = {
  verdict: VerdictV2;
  /** Records of every Judge that ran. One entry for single mode, two for dual. */
  judges: SingleJudgeRecord[];
};

async function runSingleJudge(
  vendor: Vendor,
  args: RunJudgeOptions,
): Promise<SingleJudgeRecord> {
  const model = await resolveByTier({
    vendor,
    tier: "flagship",
    allowPaid: args.allowPaid,
  });

  const [sys, user] = buildChairMessages({
    mode: args.mode,
    question: args.question,
    outputs: args.outputs,
  });

  const result = await generateText({
    model: openrouter(model),
    output: Output.object({ schema: VerdictV2Schema }),
    system: sys.content,
    messages: [{ role: "user", content: user.content }],
  });

  return { vendor, model, raw: result.output as VerdictV2 };
}

/**
 * Run the Judge layer for a deliberation. Returns the canonical verdict
 * and the per-Judge records (for the audit log).
 */
export async function runJudge(opts: RunJudgeOptions): Promise<JudgeResult> {
  if (opts.stakes !== "critical") {
    const vendor = pickJudgeVendor(opts.rotationKey);
    const judge = await runSingleJudge(vendor, opts);
    return { verdict: judge.raw, judges: [judge] };
  }

  // Dual Judge for critical stakes
  const [vA, vB] = pickDualJudgeVendors(opts.rotationKey);
  const [a, b] = await Promise.all([
    runSingleJudge(vA, opts),
    runSingleJudge(vB, opts),
  ]);

  if (a.raw.outcome === b.raw.outcome) {
    const synthesised: VerdictV2 = {
      outcome: a.raw.outcome,
      confidence: Math.min(a.raw.confidence, b.raw.confidence),
      consensus: joinNonEmpty(a.raw.consensus, b.raw.consensus, " "),
      disagreements: dedupe([
        ...a.raw.disagreements,
        ...b.raw.disagreements,
      ]),
      risks: dedupe([...a.raw.risks, ...b.raw.risks]),
      recommendation: a.raw.recommendation,
      selected_option_id:
        a.raw.selected_option_id ?? b.raw.selected_option_id,
    };
    return { verdict: synthesised, judges: [a, b] };
  }

  // Outcome disagreement at critical stakes → escalate to human.
  const escalation: VerdictV2 = {
    outcome: "escalate",
    confidence: 0,
    consensus: `Dual Judges disagreed: ${vA} → ${a.raw.outcome}, ${vB} → ${b.raw.outcome}.`,
    disagreements: dedupe([
      ...a.raw.disagreements,
      ...b.raw.disagreements,
      `${vA} (${a.model}) recommended ${a.raw.outcome}; ${vB} (${b.model}) recommended ${b.raw.outcome}.`,
    ]),
    risks: dedupe([...a.raw.risks, ...b.raw.risks]),
    recommendation:
      "Escalate to human. Two flagship Judges from different vendors disagreed on the outcome at stakes=critical.",
    escalation_reason: `Dual-Judge disagreement: ${vA}=${a.raw.outcome} vs ${vB}=${b.raw.outcome}.`,
  };
  return { verdict: escalation, judges: [a, b] };
}

function dedupe<T>(xs: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of xs) {
    const key = JSON.stringify(x);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}

function joinNonEmpty(a: string, b: string, sep: string): string {
  if (!a) return b;
  if (!b) return a;
  if (a === b) return a;
  return `${a}${sep}${b}`;
}

// Exported only for tests — not part of the public surface.
export const __testing = {
  pickJudgeVendor,
  pickDualJudgeVendors,
  ROTATION_VENDORS,
};
