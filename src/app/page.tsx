import { Badge } from "@/components/ui/badge";

const roles = [
  { name: "Optimist", hue: "from-sky-500/25" },
  { name: "Skeptic", hue: "from-rose-500/25" },
  { name: "Pragmatist", hue: "from-emerald-500/25" },
  { name: "Creative", hue: "from-fuchsia-500/25" },
  { name: "Expert", hue: "from-amber-500/25" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <Badge variant="outline" className="gap-2 text-xs uppercase tracking-widest">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Scaffold live · UI coming
        </Badge>
        <h1 className="font-mono text-5xl font-semibold tracking-tighter sm:text-7xl">
          Council
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Five free LLMs deliberate your question. A Chair distils the council into a
          structured verdict. You watch it happen live, and you can ask by voice.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
        {roles.map((r) => (
          <div
            key={r.name}
            className={`rounded-xl border border-border/60 bg-gradient-to-br ${r.hue} to-transparent p-5 text-sm text-muted-foreground`}
          >
            <div className="font-medium text-foreground">{r.name}</div>
            <div className="mt-1 text-xs opacity-70">idle</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-xs text-muted-foreground">
        👑&nbsp; The Chair will synthesise — coming in the next push
      </div>

      <footer className="pt-8 text-xs text-muted-foreground/70">
        <a
          href="https://github.com/flickmediasa/council"
          className="underline underline-offset-4 hover:text-foreground"
        >
          github.com/flickmediasa/council
        </a>
      </footer>
    </main>
  );
}
