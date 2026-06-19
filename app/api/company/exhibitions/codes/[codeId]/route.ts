import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// PATCH — toggle a code active/inactive. Toggling to inactive takes effect on
// the very next public request: the public route re-reads status every time and
// there is no caching that could serve a stale active state.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const { codeId } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { status } = body as { status?: string };
  if (status !== "active" && status !== "inactive") {
    return NextResponse.json({ error: "status must be 'active' or 'inactive'." }, { status: 400 });
  }

  const admin = createAdminClient() as Admin;

  const { data: code } = await admin
    .from("info_codes")
    .select("id, status")
    .eq("id", codeId)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!code) return NextResponse.json({ error: "Info code not found." }, { status: 404 });

  // A revoked code is permanently dead — it can never be toggled back on.
  if ((code as { status: string }).status === "revoked") {
    return NextResponse.json({ error: "This code has been revoked and cannot be changed." }, { status: 409 });
  }

  const { error } = await admin
    .from("info_codes")
    .update({
      status,
      deactivated_at: status === "inactive" ? new Date().toISOString() : null,
    })
    .eq("id", codeId)
    .eq("company_id", user.id);

  if (error) return NextResponse.json({ error: error.message ?? "Failed to update code." }, { status: 500 });

  return NextResponse.json({ id: codeId, status });
}
