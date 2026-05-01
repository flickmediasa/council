import { z } from "zod";

export const VerdictSchema = z.object({
  consensus: z.string().min(1),
  disagreements: z.array(z.string()),
  risks: z.array(z.string()),
  recommendation: z.string().min(1),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const ModeIdSchema = z.enum([
  "perspectives",
  "skills",
  "flavour",
  "debate",
]);
export type ModeId = z.infer<typeof ModeIdSchema>;

export const CouncilRequestSchema = z.object({
  modeId: ModeIdSchema,
  question: z.string().min(1).max(4000),
  overrides: z
    .object({
      seats: z.record(z.string(), z.string()).optional(),
      chair: z.string().optional(),
    })
    .optional(),
});
export type CouncilRequest = z.infer<typeof CouncilRequestSchema>;

// =============================================================================
// v2 — programmatic decision primitive
// =============================================================================
//
// The original schema above (Verdict, CouncilRequest) drives the existing
// theatre / whiteboard UI: free-text question in, four-section verdict out.
// The schemas below add a parallel programmatic surface — a typed Issue,
// stakes-aware escalation, and structured per-seat outputs — for callers
// (CLI, the Loop, agent-army primitives) that need an audit-grade decision
// rather than a streamed reading-room experience. Both surfaces coexist.

/**
 * Stakes drives Judge selection.
 *   low / med / high → single rotating Judge.
 *   critical         → dual-Judge with escalate-on-disagreement.
 */
export const StakesSchema = z.enum(["low", "med", "high", "critical"]);
export type Stakes = z.infer<typeof StakesSchema>;

/** Discrete decision an Issue resolves to. `escalate` punts to a human. */
export const VerdictOutcomeSchema = z.enum([
  "approve",
  "reject",
  "abstain",
  "escalate",
]);
export type VerdictOutcome = z.infer<typeof VerdictOutcomeSchema>;

/** A discrete choice the council may select among. */
export const OptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
});
export type Option = z.infer<typeof OptionSchema>;

/** Resource referenced from an Issue (e.g. a draft email, a schema diff). */
export const AttachmentSchema = z.object({
  kind: z.string().min(1),
  ref: z.string().min(1),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/** Typed decision request handed to the Council. */
export const IssueSchema = z.object({
  context: z.string().min(1),
  decision: z.string().min(1),
  options: z.array(OptionSchema).default([]),
  constraints: z.array(z.string()).default([]),
  stakes: StakesSchema.default("med"),
  attachments: z.array(AttachmentSchema).default([]),
});
export type Issue = z.infer<typeof IssueSchema>;

/**
 * Per-seat structured output (programmatic path).
 * The UI path still streams free text; this is for the deliberate() flow.
 */
export const SeatResponseSchema = z.object({
  outcome: VerdictOutcomeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  dissent_flags: z.array(z.string()).default([]),
});
export type SeatResponse = z.infer<typeof SeatResponseSchema>;

/**
 * Extended verdict — adds outcome, confidence, and escalation semantics
 * over the original VerdictSchema. Returned by deliberate().
 */
export const VerdictV2Schema = z.object({
  outcome: VerdictOutcomeSchema,
  confidence: z.number().min(0).max(1),
  consensus: z.string().min(1),
  disagreements: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendation: z.string().min(1),
  selected_option_id: z.string().optional(),
  escalation_reason: z.string().optional(),
});
export type VerdictV2 = z.infer<typeof VerdictV2Schema>;
