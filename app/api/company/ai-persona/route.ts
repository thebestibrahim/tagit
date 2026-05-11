import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { ai_enabled, ai_persona_name, ai_persona_prompt, ai_persona_voice_id, elevenlabs_api_key } = body;

  const { error } = await supabase
    .from("companies")
    .update({
      ai_enabled: Boolean(ai_enabled),
      ai_persona_name: ai_persona_name || null,
      ai_persona_prompt: ai_persona_prompt || null,
      ai_persona_voice_id: ai_persona_voice_id || "21m00Tcm4TlvDq8ikWAM",
      elevenlabs_api_key: elevenlabs_api_key || null,
    } as never)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
