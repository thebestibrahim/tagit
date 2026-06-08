import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { sendChipReplacedEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import type { ReplacementReason } from "@/types/database";

const admin = createAdminClient();

const REASONS = new Set<ReplacementReason>([
  "not_scanning",
  "physically_damaged",
  "missing_or_lost",
]);

type ChipRow = {
  id: string;
  short_id: string;
  medium: string;
  status: string;
  product_id: string | null;
  company_id: string;
};

const CHIP_COLUMNS = "id, short_id, medium, status, product_id, company_id";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;

  // ── 1. Authenticated ──
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { reason, replacement_short_id, old_short_id } = body as {
    reason?: string;
    replacement_short_id?: string;
    old_short_id?: string;
  };

  if (!reason || !REASONS.has(reason as ReplacementReason)) {
    return NextResponse.json({ error: "A valid reason is required." }, { status: 400 });
  }
  if (!replacement_short_id || !old_short_id) {
    return NextResponse.json(
      { error: "Both the current and replacement Short IDs are required." },
      { status: 400 }
    );
  }

  // ── 2. Product exists and belongs to this brand ──
  const { data: productData } = await admin
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .eq("company_id", user.id)
    .single();

  const product = productData as { id: string; name: string } | null;
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 403 });
  }

  // ── 2b. Resolve the chip being replaced (must be on this product & brand) ──
  // The body identifies which chip is failing; the medium of that chip is the
  // "current chip medium" the replacement must match.
  const { data: oldChipData } = await admin
    .from("tags")
    .select(CHIP_COLUMNS)
    .eq("short_id", old_short_id.trim())
    .maybeSingle();

  const oldChip = oldChipData as ChipRow | null;
  if (!oldChip || oldChip.company_id !== user.id || oldChip.product_id !== product.id) {
    return NextResponse.json(
      { error: "The chip being replaced is not linked to this product." },
      { status: 404 }
    );
  }

  // ── 3. Replacement chip Short ID exists ──
  const { data: newChipData } = await admin
    .from("tags")
    .select(CHIP_COLUMNS)
    .eq("short_id", replacement_short_id.trim())
    .maybeSingle();

  const newChip = newChipData as ChipRow | null;
  if (!newChip) {
    return NextResponse.json({ error: "Replacement Short ID not found." }, { status: 404 });
  }

  // ── 4. Replacement chip belongs to this brand ──
  if (newChip.company_id !== user.id) {
    return NextResponse.json(
      { error: "That chip is not in your inventory." },
      { status: 404 }
    );
  }

  // ── 5. Replacement medium matches the current chip medium ──
  if (newChip.medium !== oldChip.medium) {
    const need = oldChip.medium === "card" ? "card" : "tag";
    const got = newChip.medium === "card" ? "card" : "tag";
    return NextResponse.json(
      { error: `You're replacing a ${need} but ${replacement_short_id} is a ${got}. Use a ${need} from your inventory.` },
      { status: 409 }
    );
  }

  // ── 6. Replacement chip has no product attached ──
  if (newChip.product_id) {
    return NextResponse.json(
      { error: "That chip is already assigned to a product." },
      { status: 409 }
    );
  }

  // ── 7. Replacement chip is not decommissioned or flagged ──
  if (newChip.status === "decommissioned" || newChip.status === "flagged") {
    return NextResponse.json(
      { error: "That chip is decommissioned or flagged and can't be used." },
      { status: 409 }
    );
  }

  // Resolve the current owner BEFORE mutating, across the product's whole tag
  // group — ownership records are anchored to whichever chip established them.
  const { data: groupTags } = await admin
    .from("tags")
    .select("id")
    .eq("product_id", product.id);

  const groupTagIds = ((groupTags ?? []) as { id: string }[]).map((t) => t.id);

  const { data: ownerData } = groupTagIds.length
    ? await admin
        .from("ownership_records")
        .select("owner_name, owner_email")
        .in("tag_id", groupTagIds)
        .eq("is_current", true)
        .maybeSingle()
    : { data: null };

  const owner = ownerData as { owner_name: string; owner_email: string } | null;

  // ── Atomic swap: decommission old, assign new (inherits old status), audit ──
  const { data: rpcRows, error: rpcError } = await admin.rpc("replace_chip", {
    p_product_id: product.id,
    p_old_tag_id: oldChip.id,
    p_new_tag_id: newChip.id,
    p_medium: oldChip.medium,
    p_reason: reason,
    p_initiated_by: user.id,
  });

  if (rpcError) {
    log.error("company/replace-chip", "replace_chip RPC failed", rpcError);
    return NextResponse.json({ error: "Failed to replace chip." }, { status: 500 });
  }

  const result = (rpcRows ?? [])[0] as { replacement_id: string; new_status: string } | undefined;
  if (!result) {
    return NextResponse.json({ error: "Failed to replace chip." }, { status: 500 });
  }

  // ── Notify the current owner (best-effort — never breaks the replacement) ──
  if (owner) {
    try {
      const { data: companyData } = await admin
        .from("companies")
        .select("name")
        .eq("id", user.id)
        .single();
      const brandName = (companyData as { name: string } | null)?.name ?? "The brand";

      await sendChipReplacedEmail(owner.owner_email, {
        ownerName: owner.owner_name,
        productName: product.name,
        brandName,
      });

      await admin
        .from("tag_replacements")
        .update({ owner_notified: true })
        .eq("id", result.replacement_id);
    } catch (err) {
      log.error("company/replace-chip", "Owner notification failed", {
        replacement_id: result.replacement_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    success: true,
    chip: {
      id: newChip.id,
      short_id: newChip.short_id,
      medium: newChip.medium,
      status: result.new_status,
    },
  });
}
