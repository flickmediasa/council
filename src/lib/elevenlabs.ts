export async function synthesise(
  text: string,
  voiceId = "JBFqnCBsd6RMkjVDRZzb",
): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY not set" }),
      {
        status: 503,
        headers: { "content-type": "application/json" },
      },
    );
  }
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
}
