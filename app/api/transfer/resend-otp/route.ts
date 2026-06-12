import { createAdminClient } from "@/lib/supabase/admin";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { log } from "@/lib/logger";
import { getSiblingTagIds } from "@/lib/tags";
import { normalizeEmail } from "@/lib/utils";

const admin = createAdminClient();

// Re-send the identity code from step 1. No transfer_request exists yet, so the
// owner is re-verified from the tag group rather than from a transfer row.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tag_id, owner_email: rawOwnerEmail } = body as { tag_id?: string; owner_email?: string };

  if (!tag_id || !rawOwnerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const owner_email = normalizeEmail(rawOwnerEmail);

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
    .select("owner_email")
    .in("tag_id", siblingIds)
    .eq("is_current", true)
    .single();

  const ownerRecord = ownerData as { owner_email: string } | null;
  if (!ownerRecord || ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match current owner" }, { status: 403 });
  }

  // Rate limit: max 5 OTP sends per email per 15 minutes
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("otp_codes")
    .select("*", { count: "exact", head: true })
    .eq("email", owner_email)
    .eq("purpose", "transfer")
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= 5) {
    return NextResponse.json({ error: "Too many requests. Try again in 15 minutes." }, { status: 429 });
  }

  // Invalidate previous unused OTPs for this email+purpose
  await admin
    .from("otp_codes")
    .update({ is_used: true })
    .eq("email", owner_email)
    .eq("purpose", "transfer")
    .eq("is_used", false);

  const code = randomInt(100000, 1000000).toString();
  const code_hash = await hash(code, 10);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await admin.from("otp_codes").insert({
    email: owner_email,
    code_hash,
    purpose: "transfer",
    attempts: 0,
    is_used: false,
    expires_at,
  });

  let emailSent = false;
  let emailError: string | null = null;
  try {
    await sendOtpEmail(owner_email, code, "transfer");
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    log.error("transfer", "OTP resend email failed", { owner_email, error: emailError });
  }

  return NextResponse.json({ success: true, emailSent, emailError });
}
