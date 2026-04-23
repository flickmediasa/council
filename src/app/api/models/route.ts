import { getFreeModels } from "@/lib/council/openrouter-catalogue";

export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await getFreeModels();
    return Response.json({ models });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
