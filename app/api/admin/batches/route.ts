import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { buildTagRecords } from "@/lib/tag-gen";
import type { BatchType } from "@/types/database";

const BATCH_TYPES = new Set<BatchType>(["tags", "cards", "mixed"]);

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const { company_id, industry, notes, batch_name } = body;
  const batch_type: BatchType = BATCH_TYPES.has(body.batch_type) ? body.batch_type : "tags";

  // Quantities depend on the batch type. Cards-only batches carry zero tags.
  const tagsQty  = batch_type === "cards" ? 0 : Number(body.batch_size ?? 0);
  const cardsQty = batch_type === "tags"  ? 0 : Number(body.cards_quantity ?? 0);

  if (!company_id || !industry) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  for (const [label, qty] of [["Tags", tagsQty], ["Cards", cardsQty]] as const) {
    if (!Number.isInteger(qty) || qty < 0 || qty > 10000) {
      return NextResponse.json({ error: `${label} quantity must be between 0 and 10,000.` }, { status: 400 });
    }
  }
  if (tagsQty + cardsQty < 1) {
    return NextResponse.json({ error: "A batch must contain at least one tag or card." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: batchData, error: batchError } = await admin
    .from("tag_batches")
    .insert({
      company_id,
      industry,
      batch_size: tagsQty,
      cards_quantity: cardsQty,
      batch_type,
      notes: notes ?? null,
      batch_name: batch_name?.trim() || null,
      created_by: user.id,
      status: "pending" as const,
    })
    .select("id")
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  const batchId = (batchData as { id: string }).id;

  const records = [
    ...buildTagRecords({ count: tagsQty,  company_id, industry, batch_id: batchId, medium: "tag" }),
    ...buildTagRecords({ count: cardsQty, company_id, industry, batch_id: batchId, medium: "card" }),
  ];

  // Insert in chunks of 500 to avoid request size limits
  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await admin.from("tags").insert(chunk);
    if (error) {
      await admin.from("tag_batches").delete().eq("id", batchId);
      log.error("admin/batches", "Tag insert failed", error);
      return NextResponse.json({ error: "Tag generation failed" }, { status: 500 });
    }
  }

  await admin
    .from("tag_batches")
    .update({ status: "generated" as const })
    .eq("id", batchId);

  return NextResponse.json({ success: true, batch_id: batchId, count: tagsQty + cardsQty });
}
