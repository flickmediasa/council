"use client";
import { useState } from "react";
import { Selector, type SelectorValue } from "@/components/council/selector";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [sel, setSel] = useState<SelectorValue>({
    modeId: "flavour",
    seatOverrides: {},
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex justify-center">
          <Badge variant="outline" className="gap-2 text-xs uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Selector live · Ask coming next
          </Badge>
        </div>
        <h1 className="font-mono text-4xl font-semibold tracking-tighter sm:text-5xl">
          Ask your council
        </h1>
        <p className="mx-auto max-w-xl text-balance text-sm text-muted-foreground">
          Configure the roster below. Click any seat to swap in a different
          free model. In the next push you&rsquo;ll be able to ask it a question.
        </p>
      </div>
      <Selector value={sel} onChange={setSel} />
    </div>
  );
}
