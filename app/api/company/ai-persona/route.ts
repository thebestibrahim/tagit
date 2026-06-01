import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { isBrandFlagEnabled } from "@/lib/feature-flags/server";
import type { Database } from "@/types/database";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isBrandFlagEnabled(user.id, "ai_persona"))) {
    return NextResponse.json({ error: "This feature is not available on your account." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { ai_enabled, ai_persona_name, ai_persona_prompt, ai_persona_voice_id, elevenlabs_api_key } = body;

  const update: Database["public"]["Tables"]["companies"]["Update"] = {
    ai_enabled: Boolean(ai_enabled),
    ai_persona_name: ai_persona_name || null,
    ai_persona_prompt: ai_persona_prompt || null,
    ai_persona_voice_id: ai_persona_voice_id || "21m00Tcm4TlvDq8ikWAM",
  };
  if (elevenlabs_api_key !== undefined) {
    update.elevenlabs_api_key = elevenlabs_api_key || null;
  }

  const { error } = await supabase
    .from("companies")
    .update(update)
    .eq("id", user.id);

  if (error) { log.error("company/ai-persona", "Update failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
