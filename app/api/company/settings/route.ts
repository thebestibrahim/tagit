import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, logo_url } = body as { name?: string; logo_url?: string };

  if (name !== undefined) {
    const { error } = await admin
      .from("companies")
      .update({ name: name.trim() } as never)
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (logo_url !== undefined) {
    const { error } = await admin
      .from("companies")
      .update({ logo_url } as never)
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
