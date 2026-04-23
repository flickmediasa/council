import { getFreeModels } from "@/lib/council/openrouter-catalogue";

export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await getFreeModels();
    return Response.json({ ok: true, freeModelCount: models.length });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
