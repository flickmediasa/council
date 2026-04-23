"use client";
import { Card } from "@/components/ui/card";
import type { Verdict } from "@/lib/council/schema";

export function VerdictPanel({ verdict }: { verdict: Verdict | undefined }) {
  if (!verdict) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
        Waiting for the Chair…
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="p-4">
        <h4 className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Consensus
        </h4>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {verdict.consensus}
        </p>
      </Card>
      <Card className="p-4">
        <h4 className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Disagreements
        </h4>
        {verdict.disagreements.length === 0 ? (
          <p className="text-sm text-muted-foreground">None noted.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm">
            {verdict.disagreements.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-4">
        <h4 className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Risks
        </h4>
        {verdict.risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">None noted.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm">
            {verdict.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="border-foreground/30 bg-card/80 p-4 md:col-span-2">
        <h4 className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Recommendation
        </h4>
        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">
          {verdict.recommendation}
        </p>
      </Card>
    </div>
  );
}
