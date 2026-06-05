import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { isBrandFlagEnabled } from "@/lib/feature-flags/server";
import { NextResponse } from "next/server";
import type { BatchType } from "@/types/database";

const ALLOWED_INDUSTRIES = new Set(["fashion", "arts", "collectibles", "jewellery", "electronics", "other"]);
const BATCH_TYPES = new Set<BatchType>(["tags", "cards", "mixed"]);
const MIN_QTY = 10;
const MAX_QTY = 10000;

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isBrandFlagEnabled(user.id, "bulk_tag_creation"))) {
    return NextResponse.json({ error: "This feature is not available on your account." }, { status: 403 });
  }

  const body = await request.json();
  const { industry, quantity, cards_quantity, notes, batch_name } = body;
  const batchType: BatchType = BATCH_TYPES.has(body.batch_type) ? body.batch_type : "tags";

  if (!ALLOWED_INDUSTRIES.has(industry)) {
    return NextResponse.json({ error: "Invalid industry" }, { status: 400 });
  }

  // Each medium present in the batch needs a valid quantity; absent media are 0.
  const tagsQty  = batchType === "cards" ? 0 : parseInt(quantity, 10);
  const cardsQty = batchType === "tags"  ? 0 : parseInt(cards_quantity, 10);

  if (batchType !== "cards" && (isNaN(tagsQty) || tagsQty < MIN_QTY || tagsQty > MAX_QTY)) {
    return NextResponse.json({ error: `Tag quantity must be between ${MIN_QTY} and ${MAX_QTY}` }, { status: 400 });
  }
  if (batchType !== "tags" && (isNaN(cardsQty) || cardsQty < MIN_QTY || cardsQty > MAX_QTY)) {
    return NextResponse.json({ error: `Card quantity must be between ${MIN_QTY} and ${MAX_QTY}` }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("tag_batches").insert({
    company_id: user.id,
    industry,
    batch_size: tagsQty,
    cards_quantity: cardsQty,
    batch_type: batchType,
    status: "pending",
    notes: notes?.trim() || null,
    batch_name: batch_name?.trim() || null,
    created_by: user.id,
  });

  if (error) { log.error("company/batch-request", "Insert failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }

  return NextResponse.json({ success: true });
}
