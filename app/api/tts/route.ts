import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { text, tag_id } = body as { text?: string; tag_id?: string };

  if (!text || !tag_id) {
    return NextResponse.json({ error: "text and tag_id required" }, { status: 400 });
  }

  // Fetch company's voice config
  const { data: tagData } = await admin
    .from("tags")
    .select("company_id")
    .eq("id", tag_id)
    .single();

  const tag = tagData as { company_id: string } | null;
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const { data: companyData } = await admin
    .from("companies")
    .select("ai_persona_voice_id, elevenlabs_api_key")
    .eq("id", tag.company_id)
    .single();

  const company = companyData as {
    ai_persona_voice_id: string | null;
    elevenlabs_api_key: string | null;
  } | null;

  const voiceId = company?.ai_persona_voice_id || "21m00Tcm4TlvDq8ikWAM";
  const apiKey = company?.elevenlabs_api_key || process.env.ELEVENLABS_API_KEY!;

  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.slice(0, 500),
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text().catch(() => "TTS error");
    return NextResponse.json({ error: err }, { status: ttsRes.status });
  }

  const audioBuffer = await ttsRes.arrayBuffer();

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioBuffer.byteLength),
    },
  });
}
