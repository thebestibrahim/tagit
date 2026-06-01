import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authClient = await createServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("brand_inquiries")
    .update({ status: "declined" })
    .eq("id", id);

  if (error) {
    log.error("admin/inquiries/decline", "Status update failed", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
