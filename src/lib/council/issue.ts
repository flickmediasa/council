import { createHash } from "node:crypto";
import type { Issue } from "./schema";

/**
 * Canonicalise an Issue to a stable JSON string suitable for hashing.
 * Arrays are sorted so logically-equivalent Issues hash identically
 * regardless of input ordering.
 */
export function canonicaliseIssue(issue: Issue): string {
  return JSON.stringify({
    context: issue.context,
    decision: issue.decision,
    options: [...(issue.options ?? [])]
      .map((o) => ({
        id: o.id,
        label: o.label,
        description: o.description ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    constraints: [...(issue.constraints ?? [])].sort(),
    stakes: issue.stakes,
    attachments: [...(issue.attachments ?? [])].sort((a, b) =>
      `${a.kind}:${a.ref}`.localeCompare(`${b.kind}:${b.ref}`),
    ),
  });
}

/**
 * Deterministic SHA-256 hash of a canonicalised Issue.
 * Two Issues that differ only in array ordering produce the same hash —
 * letting us deduplicate replays and key audit rows on issue identity.
 */
export function issueHash(issue: Issue): string {
  return createHash("sha256").update(canonicaliseIssue(issue)).digest("hex");
}
