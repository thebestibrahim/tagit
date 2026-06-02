import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(
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

  const { data: batchData, error: fetchError } = await admin
    .from("tag_batches")
    .select("id, status")
    .eq("id", batchId)
    .single();

  if (fetchError || !batchData) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const batch = batchData as { id: string; status: string };

  // Only a generated batch can be shipped (tags must exist first).
  if (batch.status !== "generated") {
    return NextResponse.json(
      { error: "Only a generated batch can be marked shipped." },
      { status: 409 }
    );
  }

  // Move the batch's not-yet-attached chips `created` → `shipped`. Tags that
  // already have a product (`live`) or further along are left untouched.
  const { error: tagError } = await admin
    .from("tags")
    .update({ status: "shipped" })
    .eq("batch_id", batchId)
    .eq("status", "created");

  if (tagError) {
    log.error("admin/batches/ship", "Tag status update failed", tagError);
    return NextResponse.json({ error: "Failed to update tags." }, { status: 500 });
  }

  const { error: batchError } = await admin
    .from("tag_batches")
    .update({ status: "shipped", shipped_at: new Date().toISOString() })
    .eq("id", batchId);

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
