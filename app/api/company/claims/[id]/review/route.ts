import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendClaimRejectedEmail } from "@/lib/email";
import { confirmClaim } from "@/lib/claims";

const admin = createAdminClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: companyData } = await authClient
    .from("companies")
    .select("id, status")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; status: string } | null;

  if (!company || company.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, rejection_reason } = body as { action?: string; rejection_reason?: string };

  if (!["approve", "reject"].includes(action ?? "")) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const { data: claimData } = await admin
    .from("ownership_claims")
    .select("id, tag_id, claimant_name, claimant_email, status")
    .eq("id", id)
    .single();

  const claim = claimData as {
    id: string;
    tag_id: string;
    claimant_name: string;
    claimant_email: string;
    status: string;
  } | null;

  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Claim has already been reviewed" }, { status: 409 });
  }

  // Authorize: the claim's tag must belong to this company.
  const { data: tagData } = await admin
    .from("tags")
    .select("id, company_id")
    .eq("id", claim.tag_id)
    .single();

  const tag = tagData as { id: string; company_id: string } | null;
  if (!tag || tag.company_id !== company.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ── Approve early (before the 24h auto-confirm) ──
  // Shares the exact path the auto-confirm cron uses: atomic confirm_claim RPC
  // + certificate issuance/email. Idempotent against a concurrent auto-confirm.
  if (action === "approve") {
    const { confirmed } = await confirmClaim(admin, claim.id, user.id);
    if (!confirmed) {
      return NextResponse.json({ error: "Claim has already been reviewed" }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  }

  // ── Reject ── tag stays `live` so the item can be claimed again.
  const now = new Date().toISOString();
  await admin.from("ownership_claims").update({
    status: "rejected",
    reviewed_by: user.id,
    reviewed_at: now,
    rejection_reason: rejection_reason ?? null,
  }).eq("id", id);

  // tag remains `live`; no status change needed on reject.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tagProductData } = await (admin as any)
    .from("tags")
    .select("products(name)")
    .eq("id", claim.tag_id)
    .single();

  const rawProd = (tagProductData as { products: unknown } | null)?.products;
  const product = (Array.isArray(rawProd) ? rawProd[0] : rawProd) as { name: string } | null;

  if (product) {
    await sendClaimRejectedEmail(claim.claimant_email, {
      claimantName: claim.claimant_name,
      productName: product.name,
      reason: rejection_reason,
    }).catch((err) => log.error("company/claims/review", "Email failed", err));
  }

  return NextResponse.json({ success: true });
}
