import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") return null;
  return user;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string; overrideId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key, overrideId } = await params;
  const admin = createAdminClient();

  const { data: override, error: fetchError } = await admin
    .from("feature_flag_overrides")
    .select("id, flag_id, entity_type, entity_id, enabled")
    .eq("id", overrideId)
    .single();

  if (fetchError || !override) {
    return NextResponse.json({ error: "Override not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("feature_flag_overrides")
    .delete()
    .eq("id", overrideId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("feature_flag_audit").insert({
    flag_id: (override as { flag_id: string }).flag_id,
    flag_key: key,
    action: "override_removed",
    old_value: {
      entity_type: (override as { entity_type: string }).entity_type,
      entity_id: (override as { entity_id: string }).entity_id,
      enabled: (override as { enabled: boolean }).enabled,
    },
    new_value: null,
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
