import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: batch } = await admin
    .from("tag_batches")
    .select("status")
    .eq("id", batchId)
    .single();

  if (!batch || (batch as { status: string }).status !== "pending") {
    return NextResponse.json({ error: "Can only decline pending requests." }, { status: 400 });
  }

  const { error } = await admin.from("tag_batches").delete().eq("id", batchId);
  if (error) { log.error("admin/batches/decline", "Delete failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }

  return NextResponse.json({ success: true });
}
