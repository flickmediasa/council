# Council — Design Spec

**Date:** 2026-04-23
**Status:** Draft → awaiting review
**Owner:** Ry Markus (Flick Media Agency)

## 1. Purpose

A personal-fun web app where multiple free LLMs (via OpenRouter) act as a **council** — each plays a complementing role — and an **orchestrator ("Chair")** synthesises their outputs into a single structured verdict. You watch the deliberation live. You can swap council members before asking. You can also talk to it.

Not a public product. No auth, no billing, no custom domain. Vercel preview URL only, not publicised. Ry's OpenRouter key is used server-side; if quota is hit, the app degrades gracefully.

## 2. Core concepts

- **Mode** — a named orchestration pattern with a default roster. Four modes: Perspectives, Skills, Flavour, Debate.
- **Seat** — one councillor: a role + a model. Each seat streams its answer live.
- **Chair** — the orchestrator. Reads all seat outputs, emits a structured verdict.
- **Verdict** — `{ consensus, disagreements[], risks[], recommendation }`.
- **Selector** — home-screen UI that lets the user pick the mode, swap any seat's model, and override the Chair before asking.

## 3. User flow

1. Arrive at `/` → Selector shows the default mode (Flavour) with its roster.
2. User picks a mode (tab), optionally swaps seats/Chair via popovers.
3. User types a question — or clicks the mic and speaks (browser STT).
4. User clicks **Ask**. Client opens SSE to `POST /api/council`.
5. Theatre view (default) lights up: each seat card pulses while thinking, streams tokens live, checkmarks when done. Parallel modes (Perspectives, Flavour) fire concurrently; sequential modes (Skills, Debate) fire in order.
6. Chair runs after the council completes, streams a structured verdict into a Chair card with four sections.
7. When Chair is done, the **recommendation** (and optionally **consensus**) is read aloud via ElevenLabs TTS, unless muted.
8. User can toggle to **Whiteboard view** (React Flow graph) at any time; view state is preserved.

## 4. Architecture

### 4.1 Runtime shape

```
Browser (Next.js App Router, RSC + client components)
  └── SSE / ─── POST /api/council ───────────▶  Next.js Route Handler (Node runtime)
                                                  │
                                                  ├─▶ OpenRouter (chat completions, N parallel/sequential)
                                                  │     via @ai-sdk/* + openai-compatible provider
                                                  └─▶ Chair: streamObject (Zod Verdict schema)

Browser (after Chair done) ───▶ POST /api/tts ─▶ ElevenLabs (Flash v2.5) ─▶ audio/mpeg
```

- **Runtime:** Node (not Edge). Justification: parallel `Promise.all` over N streams + long-running Chair synthesis.
- **Transport:** single SSE channel out of `/api/council`, multiplexing all seat token streams + Chair partial-object patches, demuxed client-side by `seatId` / `"chair"` / `"done"`.
- **No database in v1.** All config lives as typed constants in the repo. No history, no presets, no auth.

### 4.2 SSE event schema

```ts
type Event =
  | { t: 'seat_start';  seatId: string; model: string }
  | { t: 'seat_delta';  seatId: string; text: string }
  | { t: 'seat_done';   seatId: string }
  | { t: 'seat_error';  seatId: string; message: string }
  | { t: 'chair_start'; model: string }
  | { t: 'chair_delta'; patch: Partial<Verdict> }
  | { t: 'chair_done';  verdict: Verdict }
  | { t: 'done' };

type Verdict = {
  consensus: string;
  disagreements: string[];
  risks: string[];
  recommendation: string;
};
```

### 4.3 Request / response contract

```ts
// POST /api/council  (SSE response, text/event-stream)
type Request = {
  modeId: 'perspectives' | 'skills' | 'flavour' | 'debate';
  question: string;
  overrides?: {
    seats?: Record<string, string>;  // seatId → OpenRouter model ID
    chair?: string;
  };
};
```

```ts
// POST /api/tts  (streams audio/mpeg)
type TtsRequest = { text: string; voiceId?: string };
```

## 5. Council modes & rosters

Defined in `src/lib/council/modes.ts`. The exact OpenRouter free-model IDs are **finalised at implementation time** against the current free catalogue (`GET https://openrouter.ai/api/v1/models` filtered to free). The slots below describe intent; the planner substitutes the nearest free equivalent if a listed model is no longer free.

| Mode | Pattern | Seats (roles) | Chair default |
|---|---|---|---|
| **Perspectives** | parallel | Optimist, Skeptic, Pragmatist, Creative, Domain Expert | `CHAIR_DEFAULT` (see below) |
| **Skills** | sequential | Researcher → Architect → Critic → Writer → Fact-checker | `CHAIR_DEFAULT` |
| **Flavour** (default) | parallel | Llama 3.3 70B / Qwen 2.5 72B / DeepSeek V3 / Gemma / Mistral — each assigned one Perspective role | `CHAIR_DEFAULT` |
| **Debate** | sequential | Proposer → Challenger → Second Proposer → Judge (= Chair) | Judge (overrides `CHAIR_DEFAULT`) |

**`CHAIR_DEFAULT` resolution:** an ordered fallback list resolved at server start against the current free catalogue. Priority (first free match wins):
1. `deepseek/deepseek-chat-v3-0324:free`
2. `meta-llama/llama-3.3-70b-instruct:free`
3. `qwen/qwen-2.5-72b-instruct:free`
4. any free model with the largest context window

Exact slugs confirmed at plan time against `GET /api/v1/models`. If none are free, the app shows a maintenance banner on `/` explaining the free catalogue is empty — the app does not silently switch to paid.

**Seat shape:**

```ts
type Seat = {
  id: string;              // 'skeptic', 'researcher', ...
  role: string;            // "The Skeptic"
  roleBrief: string;       // shown in Selector popover
  defaultModel: string;    // e.g. 'meta-llama/llama-3.3-70b-instruct:free'
  systemPrompt: string;    // role-specific template
};
```

**System prompt assembly (three layers, server-side):**

1. Common council guardrails — stay in role, surface disagreement, be concise.
2. Mode-specific framing — "You are one of five councillors in Perspectives mode…"
3. Role-specific brief — the Skeptic's brief, etc.

**Chair prompt:** separate. Receives the user's question and all seat outputs as messages, emits the `Verdict` object via `streamObject` with the Zod schema in § 4.2.

## 6. UI

**Shared shell:** header (Council logo, mute toggle, view switcher Theatre/Whiteboard), main (Selector + input or run view), footer (tiny).

### 6.1 Selector (home)

- 4 mode pills with icons.
- Seat row of avatar-style cards — each shows role name, model name, model provider badge.
- Clicking a seat opens a searchable popover listing available free models.
- Chair card is visually distinct (crown icon), same swap UX.
- "Voice in each seat" and "Realtime talk" pills shown as disabled "Coming soon" chips — signpost for future C & D voice modes.
- Large question input below, with mic button on the right side.

### 6.2 Theatre view (default run view)

- Responsive grid of seat cards (2 cols mobile / 3 tablet / 5 desktop).
- Seat states: idle (muted) → thinking (soft pulse) → streaming (bright glow + live tokens) → done (checkmark + full text) → error (red border + message).
- Chair card spans the full width beneath, with the four `Verdict` sections populating progressively as `chair_delta` patches arrive.

### 6.3 Whiteboard view

- React Flow graph. Question node on the left, seat nodes in the middle, Chair node on the right.
- Parallel modes: fan-out edges from question → each seat → Chair.
- Sequential modes: directional chain between seats with animated dashed edges while thinking.
- Each seat node is a mini card (smaller than Theatre); clicking opens a drawer with the full text.

### 6.4 View switcher

- Top-right. Persists choice to `localStorage`. Switching during a run preserves state.

## 7. Voice

### 7.1 Input (MVP)

- Mic button uses browser `SpeechRecognition` (`webkitSpeechRecognition` for Chromium).
- Live transcript fills the text field; user presses Enter or clicks Ask.
- Unsupported browsers: button is disabled with a tooltip ("Voice input needs Chrome or Edge").

### 7.2 Output (MVP)

- After `chair_done`, the client sends `{ text: verdict.recommendation }` to `/api/tts`. The `consensus` / `disagreements` / `risks` fields are **not** spoken in MVP — the recommendation alone keeps runs under the ElevenLabs free cap (~10k chars/month ≈ 50 runs at 200 chars/verdict).
- Server calls ElevenLabs Flash v2.5 (cheapest natural voice, latency-optimised), streams audio back, client auto-plays via `<audio>` element.
- Global mute toggle in the header, persists to `localStorage`. When mute is on, no TTS request is fired.

### 7.3 Coming soon (post-v1)

- Every seat speaks with a distinct voice (theatre audio).
- Realtime conversational mode (OpenAI Realtime or equivalent). Explicitly out of scope for v1.

## 8. Error handling & fallbacks

- **Per-seat failures** don't kill the run. `seat_error` emitted; the seat is null for Chair; minimum viable council = 2 seats + Chair. If ≥ (N−2) seats fail, client offers retry.
- **OpenRouter 429 / daily quota:** exponential jitter backoff up to 2 retries per seat. Daily cap → UI banner with `x-ratelimit-reset` time.
- **Model-not-free drift:** on 402/403, substitute the mode's first free fallback, emit a replacement `seat_start`, log the swap.
- **SSE disconnect:** client shows "Connection lost"; in-flight run is not resumable; user clicks Retry.
- **ElevenLabs cap/error:** non-critical. Auto-mute toggle, banner ("Voice unavailable — showing text"). Never blocks the council flow.
- **Zod validation failure on Chair:** fall back to `{ recommendation: <raw text> }` with empty arrays, log the raw completion.

## 9. Stack

- **Framework:** Next.js 16 (App Router), TypeScript strict
- **Styling:** Tailwind CSS + shadcn/ui
- **AI SDK:** `ai` core + `@ai-sdk/react` client hooks + OpenAI-compatible provider pointed at `https://openrouter.ai/api/v1` (choice between `@openrouter/ai-sdk-provider` and `@ai-sdk/openai-compatible` made at plan time)
- **Schema:** `zod`
- **Whiteboard view:** `reactflow`
- **TTS:** `elevenlabs` npm SDK
- **State:** `useReducer` in a React context for council run state — no global state library
- **Package manager:** pnpm
- **Runtime:** Node on Vercel (not Edge)

## 10. Repo & deployment

- **GitHub:** `flickmediasa/council` (public, MIT)
- **Local path:** `/mnt/a/Flick Media Agency/Projects/council`
- **Vercel project:** `council` under team `flickmedia`
- **Branching:** work on `main`; Vercel auto-deploys previews + production
- **Commits:** conventional (`feat:`, `fix:`, `chore:`, `docs:`)
- **Pre-commit:** `pnpm lint` + `pnpm typecheck`
- **Env vars (Vercel + `.env.local`):**
  - `OPENROUTER_API_KEY` — existing global key
  - `ELEVENLABS_API_KEY` — user-provided post-registration; app degrades if missing
  - `NEXT_PUBLIC_APP_NAME=Council`
- **Copy:** British / SA English ("colour", "behaviour", "customise")
- **Health check:** `GET /api/health` → `{ ok: true, models: [...] }`

## 11. Out of scope for v1

- Auth, accounts, billing
- Conversation history / threads
- File or image attachments
- Presets ("My creative council")
- Seat-level voice output (C)
- Realtime conversational voice (D)
- Custom domain
- Paid (non-free) OpenRouter models
- Mobile-first polish — desktop Chrome is the target

## 12. Success criteria

1. Fresh clone → `pnpm install && pnpm dev` runs locally against the global `OPENROUTER_API_KEY`.
2. A question submitted in the Flavour mode returns a streaming council run where at least 3 of 5 seats complete and the Chair emits a valid `Verdict` object.
3. Theatre and Whiteboard views both render a complete run.
4. Voice input captures speech in Chrome; Chair's recommendation is spoken aloud via ElevenLabs when the key is set.
5. All of the above works on the Vercel preview URL.
6. Rate-limit failures do not crash the app; user sees a clear message and can retry.
