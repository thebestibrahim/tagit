import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function checkAdmin() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") return null;
  return user;
}

export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: flags, error } = await admin
    .from("feature_flags")
    .select("*, feature_flag_overrides(id)")
    .order("key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = flags?.map(f => ({
    ...f,
    override_count: (f.feature_flag_overrides as { id: string }[] | null)?.length ?? 0,
    feature_flag_overrides: undefined,
  }));

  return NextResponse.json({ flags: result });
}

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { key, name, description, environments } = body;

  if (!key || !name) {
    return NextResponse.json({ error: "key and name are required" }, { status: 400 });
  }
  if (!/^[a-z0-9_]+$/.test(key)) {
    return NextResponse.json({ error: "Key must be lowercase letters, numbers, and underscores only" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: flag, error } = await admin
    .from("feature_flags")
    .insert({
      key,
      name,
      description: description ?? null,
      enabled: false,
      rollout_percentage: 0,
      environments: environments ?? ["production", "staging"],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A flag with this key already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("feature_flag_audit").insert({
    flag_id: (flag as { id: string }).id,
    flag_key: key,
    action: "created",
    old_value: null,
    new_value: { key, name, enabled: false, rollout_percentage: 0 },
    performed_by: user.id,
    performed_by_email: user.email,
    ip_address: null,
  });

  return NextResponse.json({ flag }, { status: 201 });
}
