"use client";
import { useEffect, useRef, useState } from "react";
import { Selector, type SelectorValue } from "@/components/council/selector";
import { QuestionInput } from "@/components/council/question-input";
import { TheatreView } from "@/components/council/theatre-view";
import { WhiteboardView } from "@/components/council/whiteboard-view";
import { useCouncilRun } from "@/hooks/use-council-run";
import { useTts } from "@/hooks/use-tts";
import { useMuted } from "@/components/council/mute-toggle";
import { useView } from "@/components/council/view-switcher";

export default function Home() {
  const [sel, setSel] = useState<SelectorValue>({
    modeId: "flavour",
    seatOverrides: {},
  });
  const [question, setQuestion] = useState("");
  const { state, run } = useCouncilRun();
  const { speak } = useTts();
  const { muted } = useMuted();
  const [view] = useView();
  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    const r = state.chair.verdict?.recommendation;
    if (r && lastSpokenRef.current !== r) {
      lastSpokenRef.current = r;
      speak(r, muted);
    }
  }, [state.chair.verdict, muted, speak]);

  const handleAsk = () => {
    run({
      modeId: sel.modeId,
      question,
      overrides: {
        seats: Object.keys(sel.seatOverrides).length
          ? sel.seatOverrides
          : undefined,
        chair: sel.chairOverride,
      },
    });
  };

  const started =
    state.running ||
    Object.keys(state.seats).length > 0 ||
    state.chair.status !== "idle";

  return (
    <div className="flex flex-col gap-8">
      {!started && (
        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-mono text-4xl font-semibold tracking-tighter sm:text-5xl">
            Ask your council
          </h1>
          <p className="mx-auto max-w-xl text-balance text-sm text-muted-foreground">
            Five free LLMs deliberate, then the Chair distils a structured verdict.
            Pick your roster below and ask by voice or text.
          </p>
        </div>
      )}

      {!started && <Selector value={sel} onChange={setSel} />}

      <QuestionInput
        value={question}
        onChange={setQuestion}
        onSubmit={handleAsk}
        disabled={state.running}
      />

      {state.globalError && (
        <div className="rounded-md border border-[color:var(--color-seat-error)] bg-card/50 p-3 text-sm">
          {state.globalError}
        </div>
      )}

      {started &&
        (view === "theatre" ? (
          <TheatreView modeId={sel.modeId} selector={sel} state={state} />
        ) : (
          <WhiteboardView
            modeId={sel.modeId}
            selector={sel}
            state={state}
            question={question}
          />
        ))}
    </div>
  );
}
