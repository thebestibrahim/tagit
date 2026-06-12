import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Internal fulfilment step: the team has finished writing each chip's link onto
// the physical tag/card. Marks the batch `generated` → `written` (Programmed).
// This is the gate that must clear before a batch can be marked shipped.
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

  // Idempotent: already-written batches are fine; anything before generation is not.
  if (batch.status === "written") {
    return NextResponse.json({ success: true });
  }
  if (batch.status !== "generated") {
    return NextResponse.json(
      { error: "Generate the chips before marking links written." },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from("tag_batches")
    .update({ status: "written" })
    .eq("id", batchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
