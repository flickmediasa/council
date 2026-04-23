import { NextRequest } from "next/server";
import { synthesise } from "@/lib/elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    voiceId?: string;
  };
  if (!body.text || body.text.length === 0) {
    return Response.json({ error: "text required" }, { status: 400 });
  }
  if (body.text.length > 2000) {
    return Response.json({ error: "text too long" }, { status: 413 });
  }
  const upstream = await synthesise(body.text, body.voiceId);
  if (!upstream.ok) {
    const errText = await upstream.text();
    return Response.json(
      { error: errText || upstream.statusText },
      { status: upstream.status },
    );
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}
