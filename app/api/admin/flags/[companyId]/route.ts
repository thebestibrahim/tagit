// Per-company feature flag override API used by the admin brand detail page.
// GET  — returns the current override state for each flag for this company.
// POST — sets or clears a single flag override for this company.

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { FlagKey } from "@/lib/feature-flags/types";

async function checkAdmin() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") return null;
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId } = await params;
  const admin = createAdminClient();

  const { data: overrides, error } = await admin
    .from("feature_flag_overrides")
    .select("enabled, feature_flags(key)")
    .eq("entity_type", "brand")
    .eq("entity_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (overrides ?? []).map((o) => ({
    key: (o.feature_flags as { key: FlagKey } | null)?.key ?? null,
    enabled: o.enabled,
  })).filter((o) => o.key !== null);

  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId } = await params;
  const body = await request.json();
  const { key, enabled } = body as { key: FlagKey; enabled: boolean | null };

  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  const admin = createAdminClient();

  // Resolve the flag id
  const { data: flag, error: flagError } = await admin
    .from("feature_flags")
    .select("id")
    .eq("key", key)
    .single();

  if (flagError || !flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  const flagId = (flag as { id: string }).id;
  const ip = request.headers.get("x-forwarded-for");

  if (enabled === null) {
    // Clear the override — remove the row
    await admin
      .from("feature_flag_overrides")
      .delete()
      .eq("flag_id", flagId)
      .eq("entity_type", "brand")
      .eq("entity_id", companyId);

    await admin.from("feature_flag_audit").insert({
      flag_id: flagId,
      flag_key: key,
      action: "override_cleared",
      old_value: null,
      new_value: { entity_type: "brand", entity_id: companyId },
      performed_by: user.id,
      performed_by_email: user.email,
      ip_address: ip,
    });

    return NextResponse.json({ cleared: true });
  }

  // Set or update the override
  const { error } = await admin
    .from("feature_flag_overrides")
    .upsert(
      { flag_id: flagId, entity_type: "brand", entity_id: companyId, enabled, created_by: user.id },
      { onConflict: "flag_id,entity_type,entity_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("feature_flag_audit").insert({
    flag_id: flagId,
    flag_key: key,
    action: enabled ? "override_enabled" : "override_disabled",
    old_value: null,
    new_value: { entity_type: "brand", entity_id: companyId, enabled },
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: ip,
  });

  return NextResponse.json({ success: true });
}
