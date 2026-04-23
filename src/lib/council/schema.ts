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
