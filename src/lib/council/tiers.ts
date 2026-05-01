import { getFreeModels } from "./openrouter-catalogue";

// =============================================================================
// Vendor + tier resolver
// =============================================================================
//
// The existing UI is free-tier only. The programmatic path (deliberate(),
// CLI, the Loop) needs the option to use stronger models when stakes
// warrant it. This module abstracts vendor families and tiers behind a
// resolver so callers don't pin specific OpenRouter slugs in their code —
// slugs evolve monthly; vendor+tier is stable.
//
// Free path is the default. Paid is double-gated: both `allowPaid: true` on
// the call *and* `OPENROUTER_ALLOW_PAID=true` in the environment. This
// makes accidental paid invocation impossible.

export const VENDOR_LIST = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "qwen",
  "meta",
  "mistral",
  "nvidia",
] as const;
export type Vendor = (typeof VENDOR_LIST)[number];

export const TIER_LIST = ["flagship", "reasoning", "fast", "free"] as const;
export type Tier = (typeof TIER_LIST)[number];

type PaidTier = Exclude<Tier, "free">;

/**
 * Curated paid OpenRouter slug priorities per vendor × tier.
 * First match wins. Slugs change — refresh against
 * https://openrouter.ai/api/v1/models when a model is deprecated.
 * This map is config, not code: editing it is the upgrade path.
 */
const PAID_PRIORITY: Record<Vendor, Partial<Record<PaidTier, string[]>>> = {
  anthropic: {
    flagship: ["anthropic/claude-opus-4", "anthropic/claude-3.7-sonnet"],
    reasoning: ["anthropic/claude-opus-4"],
    fast: ["anthropic/claude-haiku-4"],
  },
  openai: {
    flagship: ["openai/gpt-4o"],
    reasoning: ["openai/o3", "openai/o3-mini"],
    fast: ["openai/gpt-4o-mini"],
  },
  google: {
    flagship: ["google/gemini-2.5-pro"],
    reasoning: ["google/gemini-2.5-pro"],
    fast: ["google/gemini-2.5-flash"],
  },
  deepseek: {
    flagship: ["deepseek/deepseek-chat-v3-0324"],
    reasoning: ["deepseek/deepseek-r1"],
    fast: ["deepseek/deepseek-chat"],
  },
  qwen: {
    flagship: ["qwen/qwen3-next-80b-a3b-instruct"],
    reasoning: ["qwen/qwq-32b-preview"],
    fast: ["qwen/qwen-2.5-7b-instruct"],
  },
  meta: {
    flagship: ["meta-llama/llama-3.3-70b-instruct"],
    fast: ["meta-llama/llama-3.2-3b-instruct"],
  },
  mistral: {
    flagship: ["mistralai/mistral-large"],
    fast: ["mistralai/mistral-small"],
  },
  nvidia: {
    flagship: ["nvidia/nemotron-3-super-120b-a12b"],
  },
};

/**
 * Free OpenRouter slug priorities per vendor. Resolved live against the
 * catalogue (a `:free` slug may disappear if the provider drops it).
 */
const FREE_PRIORITY: Record<Vendor, string[]> = {
  anthropic: [],
  openai: ["openai/gpt-oss-120b:free", "openai/gpt-oss-20b:free"],
  google: ["google/gemma-4-31b-it:free", "google/gemma-3-27b-it:free"],
  deepseek: ["deepseek/deepseek-chat-v3-0324:free"],
  qwen: [
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "qwen/qwen3-coder:free",
  ],
  meta: [
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
  ],
  mistral: [],
  nvidia: ["nvidia/nemotron-3-super-120b-a12b:free"],
};

export type ResolveOptions = {
  vendor: Vendor;
  tier: Tier;
  /** Default false. Both this AND `OPENROUTER_ALLOW_PAID=true` must hold for paid resolution. */
  allowPaid?: boolean;
};

export class NoSlugAvailableError extends Error {
  constructor(
    public readonly vendor: Vendor,
    public readonly tier: Tier,
    msg: string,
  ) {
    super(msg);
    this.name = "NoSlugAvailableError";
  }
}

/**
 * Resolve vendor+tier to an OpenRouter slug.
 * Falls back to free if paid is disabled or no paid slug is configured.
 */
export async function resolveByTier(opts: ResolveOptions): Promise<string> {
  const { vendor, tier, allowPaid = false } = opts;
  const paidGate = process.env.OPENROUTER_ALLOW_PAID === "true";
  const paidEnabled = allowPaid && paidGate;

  if (paidEnabled && tier !== "free") {
    const slugs = PAID_PRIORITY[vendor]?.[tier as PaidTier] ?? [];
    if (slugs.length > 0) return slugs[0];
    // Fall through to free fallback when no paid slug is configured
  }

  const free = await getFreeModels();
  const candidates = FREE_PRIORITY[vendor] ?? [];
  for (const slug of candidates) {
    if (free.some((m) => m.id === slug)) return slug;
  }

  throw new NoSlugAvailableError(
    vendor,
    tier,
    `No model available for vendor=${vendor} tier=${tier} ` +
      `(allowPaid=${allowPaid}, paidGate=${paidGate}). ` +
      `Vendor has ${candidates.length} free candidate(s); none currently in catalogue.`,
  );
}

/**
 * Vendors that have at least one configured slug for the given tier
 * (paid OR free fallback). Useful for council seat composition.
 */
export function vendorsWithSlug(tier: Tier): Vendor[] {
  return VENDOR_LIST.filter((v) => {
    const hasFree = (FREE_PRIORITY[v]?.length ?? 0) > 0;
    if (tier === "free") return hasFree;
    const hasPaid =
      (PAID_PRIORITY[v]?.[tier as PaidTier]?.length ?? 0) > 0;
    return hasPaid || hasFree;
  });
}

/** Read-only view of the paid priority map (e.g. for UI display). */
export function getPaidSlugs(vendor: Vendor, tier: PaidTier): readonly string[] {
  return PAID_PRIORITY[vendor]?.[tier] ?? [];
}

/** Read-only view of the free priority list. */
export function getFreeSlugs(vendor: Vendor): readonly string[] {
  return FREE_PRIORITY[vendor] ?? [];
}
