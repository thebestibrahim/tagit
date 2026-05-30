import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Json } from "@/types/database";

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

  const [{ data: flag, error: flagError }, { data: audit }] = await Promise.all([
    admin
      .from("feature_flags")
      .select("*, feature_flag_overrides(*)")
      .eq("key", key)
      .single(),
    admin
      .from("feature_flag_audit")
      .select("*")
      .eq("flag_key", key)
      .order("performed_at", { ascending: false })
      .limit(50),
  ]);

  if (flagError || !flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  return NextResponse.json({ flag, audit: audit ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("feature_flags")
    .select("*")
    .eq("key", key)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  type FlagUpdate = {
    enabled?: boolean
    rollout_percentage?: number
    environments?: string[]
    name?: string
    description?: string | null
    last_updated_by?: string
  }
  const updates: FlagUpdate = { last_updated_by: user.id };
  if ("enabled" in body) updates.enabled = body.enabled as boolean;
  if ("rollout_percentage" in body) updates.rollout_percentage = body.rollout_percentage as number;
  if ("environments" in body) updates.environments = body.environments as string[];
  if ("name" in body) updates.name = body.name as string;
  if ("description" in body) updates.description = body.description as string | null;

  const { data: updated, error: updateError } = await admin
    .from("feature_flags")
    .update(updates)
    .eq("key", key)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const ip = request.headers.get("x-forwarded-for");
  const ex = existing as Record<string, unknown>;
  const changed = Object.keys(updates).filter(k => k !== "last_updated_by");

  await admin.from("feature_flag_audit").insert({
    flag_id: (existing as { id: string }).id,
    flag_key: key,
    action: "updated",
    old_value: Object.fromEntries(changed.map(k => [k, ex[k]])) as unknown as Json,
    new_value: Object.fromEntries(changed.map(k => [k, (updates as Record<string, unknown>)[k]])) as unknown as Json,
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: ip,
  });

  return NextResponse.json({ flag: updated });
}

// Soft delete — sets enabled=false, does not remove the row
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { key } = await params;
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("feature_flags")
    .select("id, enabled")
    .eq("key", key)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  await admin
    .from("feature_flags")
    .update({ enabled: false, last_updated_by: user.id })
    .eq("key", key);

  await admin.from("feature_flag_audit").insert({
    flag_id: (existing as { id: string }).id,
    flag_key: key,
    action: "disabled_via_delete",
    old_value: { enabled: (existing as { enabled: boolean }).enabled },
    new_value: { enabled: false },
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: request.headers.get("x-forwarded-for"),
  });

  return NextResponse.json({ success: true });
}
