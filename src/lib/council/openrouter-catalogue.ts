export type FreeModel = {
  id: string;
  context_length: number;
  pricing: { prompt: string; completion: string };
};

const CHAIR_PRIORITY = [
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

let cache: { at: number; models: FreeModel[] } | null = null;
const TTL_MS = 5 * 60 * 1000;

export function clearCatalogueCache() {
  cache = null;
}

export async function getFreeModels(): Promise<FreeModel[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.models;
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`OpenRouter models fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: FreeModel[] };
  const models = (json.data ?? []).filter(
    (m) => m.pricing?.prompt === "0" && m.pricing?.completion === "0",
  );
  cache = { at: Date.now(), models };
  return models;
}

export function pickChairDefault(models: FreeModel[]): string {
  for (const id of CHAIR_PRIORITY) {
    if (models.some((m) => m.id === id)) return id;
  }
  const widest = [...models].sort((a, b) => b.context_length - a.context_length)[0];
  if (!widest) throw new Error("No free models available on OpenRouter");
  return widest.id;
}

export function firstFreeMatch(preferred: string[], models: FreeModel[]): string {
  for (const id of preferred) if (models.some((m) => m.id === id)) return id;
  return pickChairDefault(models);
}
