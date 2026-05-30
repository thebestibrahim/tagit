import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") return null;
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const admin = createAdminClient();

  const { data: flag, error: flagError } = await admin
    .from("feature_flags")
    .select("id")
    .eq("key", key)
    .single();

  if (flagError || !flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  const { data: overrides, error } = await admin
    .from("feature_flag_overrides")
    .select("*")
    .eq("flag_id", (flag as { id: string }).id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ overrides: overrides ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const body = await request.json();
  const { entity_id, entity_type = "brand", enabled, reason } = body;

  if (!entity_id || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "entity_id and enabled are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: flag, error: flagError } = await admin
    .from("feature_flags")
    .select("id")
    .eq("key", key)
    .single();

  if (flagError || !flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  const flagId = (flag as { id: string }).id;

  const { data: override, error } = await admin
    .from("feature_flag_overrides")
    .upsert(
      { flag_id: flagId, entity_type, entity_id, enabled, reason: reason ?? null, created_by: user.id },
      { onConflict: "flag_id,entity_type,entity_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("feature_flag_audit").insert({
    flag_id: flagId,
    flag_key: key,
    action: "override_added",
    old_value: null,
    new_value: { entity_type, entity_id, enabled, reason: reason ?? null },
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ override }, { status: 201 });
}
