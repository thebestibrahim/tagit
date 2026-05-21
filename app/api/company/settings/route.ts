import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

const admin = createAdminClient();

export async function PATCH(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, logo_url } = body as { name?: string; logo_url?: string };

  if (name !== undefined) {
    const { error } = await admin
      .from("companies")
      .update({ name: name.trim() })
      .eq("id", user.id);
    if (error) { log.error("company/settings", "Update failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  }

  if (logo_url !== undefined) {
    const { error } = await admin
      .from("companies")
      .update({ logo_url })
      .eq("id", user.id);
    if (error) { log.error("company/settings", "Update failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  }

  return NextResponse.json({ success: true });
}
