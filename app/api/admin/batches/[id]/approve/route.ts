import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildTagRecords } from "@/lib/tag-gen";
import type { BatchType } from "@/types/database";

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
    .select("id, company_id, industry, batch_size, cards_quantity, batch_type, status")
    .eq("id", batchId)
    .single();

  if (fetchError || !batchData) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const batch = batchData as {
    id: string; company_id: string; industry: string;
    batch_size: number; cards_quantity: number; batch_type: BatchType; status: string;
  };

  if (batch.status !== "pending") {
    return NextResponse.json({ error: "This batch has already been processed." }, { status: 400 });
  }

  const records = [
    ...buildTagRecords({ count: batch.batch_size ?? 0,     company_id: batch.company_id, industry: batch.industry, batch_id: batchId, medium: "tag" }),
    ...buildTagRecords({ count: batch.cards_quantity ?? 0, company_id: batch.company_id, industry: batch.industry, batch_id: batchId, medium: "card" }),
  ];

  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const { error } = await admin.from("tags").insert(records.slice(i, i + chunkSize));
    if (error) {
      log.error("admin/batches/approve", "Tag insert failed", error);
      return NextResponse.json({ error: "Tag generation failed" }, { status: 500 });
    }
  }

  const { error: updateError } = await admin
    .from("tag_batches")
    .update({ status: "generated" })
    .eq("id", batchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: records.length });
}
