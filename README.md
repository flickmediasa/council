# Council

A fun experiment: multiple free OpenRouter LLMs deliberate as a council while a Chair synthesises a structured verdict. Watch it live in Theatre or Whiteboard view. Ask by voice, listen to the answer.

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill in keys
pnpm dev
```

Required: `OPENROUTER_API_KEY`. Optional: `ELEVENLABS_API_KEY` (voice output degrades gracefully if missing).

## Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Vercel AI SDK (OpenAI-compatible → OpenRouter) · ElevenLabs · React Flow · Vercel.

See `docs/superpowers/specs/2026-04-23-council-design.md` for the design and `docs/superpowers/plans/2026-04-23-council.md` for the implementation plan.
