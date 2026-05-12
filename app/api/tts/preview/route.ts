import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VOICE_IDS = new Set([
  "21m00Tcm4TlvDq8ikWAM",
  "pNInz6obpgDQGcFmaJgB",
  "AZnzlk1XvdvUeBnXmlld",
  "TxGEqnHWrfWFTfGW9XjX",
  "EXAVITQu4vr4xnSDxMaL",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { voice_id } = body as { voice_id?: string };

  if (!voice_id) return NextResponse.json({ error: "voice_id required" }, { status: 400 });

  if (!ALLOWED_VOICE_IDS.has(voice_id)) {
    return NextResponse.json({ error: "Invalid voice_id" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const text = "Hello, I'm your brand's voice assistant. How can I help you today?";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "TTS failed" }, { status: res.status });

  const audio = await res.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg", "Content-Length": String(audio.byteLength) },
  });
}
