import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendTransferAcceptanceEmail, APP_URL } from "@/lib/email";
import { log } from "@/lib/logger";
import { getSiblingTagIds } from "@/lib/tags";
import { normalizeEmail } from "@/lib/utils";

const admin = createAdminClient();

// Step 3 of the transfer flow: the owner's identity is already verified, so we
// now collect the recipient + sale price, create the transfer_request directly
// in `awaiting_acceptance`, and email the acceptance link. `verification` is the
// consumed transfer-OTP id from /confirm — proof the caller passed the code.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const {
    tag_id,
    owner_email: rawOwnerEmail,
    verification,
    recipient_name,
    recipient_email: rawRecipientEmail,
    sale_price,
    currency,
  } = body as {
    tag_id?: string;
    owner_email?: string;
    verification?: string;
    recipient_name?: string;
    recipient_email?: string;
    sale_price?: number | null;
    currency?: string;
  };

  if (!tag_id || !rawOwnerEmail || !verification || !recipient_name || !rawRecipientEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const owner_email = normalizeEmail(rawOwnerEmail);
  const recipient_email = normalizeEmail(rawRecipientEmail);

  // Validate the verification proof: a consumed transfer OTP for this email,
  // issued recently. Guards /finalize against being called without the code.
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: otpData } = await admin
    .from("otp_codes")
    .select("id, email, purpose, is_used, created_at")
    .eq("id", verification)
    .single();

  const otp = otpData as { id: string; email: string; purpose: string; is_used: boolean; created_at: string } | null;
  if (
    !otp ||
    !otp.is_used ||
    otp.purpose !== "transfer" ||
    otp.email.toLowerCase() !== owner_email.toLowerCase() ||
    otp.created_at < cutoff
  ) {
    return NextResponse.json({ error: "Verification expired. Please verify your email again." }, { status: 403 });
  }

  // Re-resolve and re-check the current owner (defense in depth).
  const { data: tagData } = await admin
    .from("tags")
    .select("id, status, product_id")
    .eq("id", tag_id)
    .single();

  const tag = tagData as { id: string; status: string; product_id: string | null } | null;
  if (!tag || !["owned", "transferred"].includes(tag.status)) {
    return NextResponse.json({ error: "Tag is not available for transfer" }, { status: 409 });
  }

  const siblingIds = await getSiblingTagIds(admin, tag);
  const { data: ownerData } = await admin
    .from("ownership_records")
    .select("id, owner_name, owner_email")
    .in("tag_id", siblingIds)
    .eq("is_current", true)
    .single();

  const ownerRecord = ownerData as { id: string; owner_name: string; owner_email: string } | null;
  if (!ownerRecord) {
    return NextResponse.json({ error: "No ownership record found" }, { status: 404 });
  }
  if (ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match current owner" }, { status: 403 });
  }

  // Country of the previous owner initiating the transfer (Vercel edge geo,
  // country level only). Powers the Resale Analytics location lists.
  const fromCountry = request.headers.get("x-vercel-ip-country");
  const acceptance_token = crypto.randomUUID();
  // The acceptance window starts now — when the recipient is emailed. 7 days.
  const acceptanceExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: transferData, error: transferError } = await admin
    .from("transfer_requests")
    .insert({
      tag_id,
      from_owner_id: ownerRecord.id,
      to_name: recipient_name,
      to_email: recipient_email,
      sale_price: sale_price ?? null,
      currency: currency ?? "NGN",
      status: "awaiting_acceptance",
      acceptance_token,
      from_country: fromCountry ?? null,
      expires_at: acceptanceExpiresAt,
    })
    .select("id")
    .single();

  if (transferError || !transferData) {
    return NextResponse.json({ error: "Failed to create transfer request" }, { status: 500 });
  }

  const transfer = transferData as { id: string };

  // Product + brand name for the acceptance email
  const { data: tagProductData } = await admin
    .from("tags")
    .select("product_id, products(name, companies(name))")
    .eq("id", tag_id)
    .single();
  const product = (tagProductData as { products: { name: string; companies: { name: string } } | null } | null)?.products ?? null;

  const acceptanceUrl = `${APP_URL}/v/transfer/${acceptance_token}`;

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await sendTransferAcceptanceEmail(recipient_email, {
      recipientName: recipient_name,
      productName: product?.name ?? "your item",
      fromName: ownerRecord.owner_name ?? "the current owner",
      companyName: (product?.companies as { name: string } | null)?.name ?? "the brand",
      acceptanceUrl,
      salePrice: sale_price ?? undefined,
    });
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email delivery failed";
    log.error("transfer/finalize", "Acceptance email failed", emailError);
  }

  return NextResponse.json({ success: true, transfer_id: transfer.id, acceptanceUrl, emailSent, emailError });
}
