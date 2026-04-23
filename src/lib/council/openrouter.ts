import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getFreeModels, firstFreeMatch } from "./openrouter-catalogue";

export const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://council-lovat.vercel.app",
    "X-Title": "Council",
  },
});

export async function resolveModel(preferred: string[]): Promise<string> {
  const models = await getFreeModels();
  return firstFreeMatch(preferred, models);
}
