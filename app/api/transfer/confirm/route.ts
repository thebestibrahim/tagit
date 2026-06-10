import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { sendTransferAcceptanceEmail, APP_URL } from "@/lib/email";
import { normalizeEmail } from "@/lib/utils";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { transfer_id, email: rawEmail, code } = body as {
    transfer_id?: string;
    email?: string;
    code?: string;
  };

  if (!transfer_id || !rawEmail || !code) {
    return NextResponse.json({ error: "transfer_id, email and code required" }, { status: 400 });
  }

  const email = normalizeEmail(rawEmail);

  // Verify OTP server-side before doing anything with the transfer
  const now = new Date().toISOString();
  const { data: otps } = await admin
    .from("otp_codes")
    .select("id, code_hash, attempts, is_used, expires_at")
    .eq("email", email)
    .eq("purpose", "transfer")
    .eq("is_used", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1);

  const otp = (otps ?? [])[0] as {
    id: string;
    code_hash: string;
    attempts: number;
    is_used: boolean;
    expires_at: string;
  } | undefined;

  if (!otp) {
    return NextResponse.json({ error: "No valid code found. Request a new one." }, { status: 400 });
  }

  if (otp.attempts >= 5) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 400 });
  }

  const valid = await compare(code, otp.code_hash);

  if (!valid) {
    await admin
      .from("otp_codes")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  // Mark OTP used
  await admin.from("otp_codes").update({ is_used: true }).eq("id", otp.id);

  // Now fetch and validate the transfer
  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, tag_id, from_owner_id, to_name, to_email, sale_price, acceptance_token, status")
    .eq("id", transfer_id)
    .single();

  const transfer = transferData as {
    id: string;
    tag_id: string;
    from_owner_id: string;
    to_name: string;
    to_email: string;
    sale_price: number | null;
    acceptance_token: string;
    status: string;
  } | null;

  if (!transfer || transfer.status !== "otp_pending") {
    return NextResponse.json({ error: "Transfer not found or already processed" }, { status: 404 });
  }

  // Update transfer to awaiting_acceptance. The acceptance window starts now —
  // when the recipient is actually emailed the link — not at initiate time
  // (the OTP step has its own short expiry). Give the recipient 7 days.
  const acceptanceExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from("transfer_requests")
    .update({ status: "awaiting_acceptance", expires_at: acceptanceExpiresAt })
    .eq("id", transfer_id);

  // The tag stays in its current ownership stage (`owned`/`transferred`). The
  // pending transfer is derived from this awaiting_acceptance row, not stored
  // on the tag — so there is no transient tag state to set here.

  // Get current owner info and product name for acceptance email
  const [{ data: ownerData }, { data: tagProductData }] = await Promise.all([
    admin.from("ownership_records").select("owner_name").eq("id", transfer.from_owner_id).single(),
    admin.from("tags").select("product_id, products(name, companies(name))").eq("id", transfer.tag_id).single(),
  ]);

  const owner = ownerData as { owner_name: string } | null;
  const product = (tagProductData as { product_id: string | null; products: { name: string; companies: { name: string } } | null } | null)?.products ?? null;

  const acceptanceUrl = `${APP_URL}/v/transfer/${transfer.acceptance_token}`;

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await sendTransferAcceptanceEmail(transfer.to_email, {
      recipientName: transfer.to_name,
      productName: product?.name ?? "your item",
      fromName: owner?.owner_name ?? "the current owner",
      companyName: (product?.companies as { name: string } | null)?.name ?? "the brand",
      acceptanceUrl,
      salePrice: transfer.sale_price ?? undefined,
    });
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email delivery failed";
    log.error("transfer/confirm", "Acceptance email failed", emailError);
  }

  return NextResponse.json({ success: true, acceptanceUrl, emailSent, emailError });
}
