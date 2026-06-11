import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { isBrandFlagEnabled } from "@/lib/feature-flags/server";
import { createBatchInvoice, sendInvoiceEmail } from "@/lib/billing/invoices";
import { validateChipQuantity, addOrderTotals, MINIMUM_ORDER } from "@/lib/billing/limits";
import { NextResponse } from "next/server";
import type { BatchType } from "@/types/database";

const ALLOWED_INDUSTRIES = new Set(["fashion", "arts", "collectibles", "jewellery", "electronics", "other"]);
const BATCH_TYPES = new Set<BatchType>(["tags", "cards", "mixed"]);
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

  if (batchType !== "cards" && (isNaN(tagsQty) || tagsQty < MINIMUM_ORDER || tagsQty > MAX_QTY)) {
    return NextResponse.json({ error: `Tag quantity must be between ${MINIMUM_ORDER} and ${MAX_QTY}` }, { status: 400 });
  }
  if (batchType !== "tags" && (isNaN(cardsQty) || cardsQty < MINIMUM_ORDER || cardsQty > MAX_QTY)) {
    return NextResponse.json({ error: `Card quantity must be between ${MINIMUM_ORDER} and ${MAX_QTY}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Lifetime chip-limit enforcement ──────────────────────────────────────
  // Limits apply on every plan state, including trials, using the override when
  // set. A brand with no subscription yet has no known plan, so nothing to
  // enforce (their order proceeds and is invoiced as before).
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("tags_ordered_total, cards_ordered_total, tag_limit_override, card_limit_override, plans(name, tag_limit, card_limit)")
    .eq("company_id", user.id)
    .maybeSingle();

  const sub = subRow as
    | {
        tags_ordered_total: number;
        cards_ordered_total: number;
        tag_limit_override: number | null;
        card_limit_override: number | null;
        plans: { name: string; tag_limit: number | null; card_limit: number | null } | null;
      }
    | null;

  if (sub) {
    const planName = sub.plans?.name ?? "current";
    if (tagsQty > 0) {
      const v = validateChipQuantity(tagsQty, sub.tag_limit_override, sub.plans?.tag_limit, sub.tags_ordered_total, planName, "tag");
      if (!v.ok) return NextResponse.json({ error: v.error, upgrade_required: v.upgradeRequired }, { status: v.status });
    }
    if (cardsQty > 0) {
      const v = validateChipQuantity(cardsQty, sub.card_limit_override, sub.plans?.card_limit, sub.cards_ordered_total, planName, "card");
      if (!v.ok) return NextResponse.json({ error: v.error, upgrade_required: v.upgradeRequired }, { status: v.status });
    }
  }

  const { data: batch, error } = await admin
    .from("tag_batches")
    .insert({
      company_id: user.id,
      industry,
      batch_size: tagsQty,
      cards_quantity: cardsQty,
      batch_type: batchType,
      status: "pending",
      notes: notes?.trim() || null,
      batch_name: batch_name?.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !batch) { log.error("company/batch-request", "Insert failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }

  // Increment lifetime totals (these never reset). Done as soon as the order is
  // placed, regardless of payment — the limit counts orders, not fulfilment.
  if (sub) {
    const { error: incErr } = await admin
      .from("subscriptions")
      .update(addOrderTotals(sub, tagsQty, cardsQty))
      .eq("company_id", user.id);
    if (incErr) log.error("company/batch-request", "Total increment failed", incErr);
  }

  // Auto-invoice the chip order: price from the brand's volume tiers, apply any
  // active BATCH discount, generate a Paystack link, set 'awaiting_payment'.
  // Best-effort — a billing failure must not lose the brand's order.
  try {
    const invoice = await createBatchInvoice(admin, batch.id, user.id);
    await sendInvoiceEmail(admin, invoice.id, "batch");
  } catch (err) {
    log.error("company/batch-request", "Batch invoicing failed", err);
  }

  return NextResponse.json({ success: true });
}
