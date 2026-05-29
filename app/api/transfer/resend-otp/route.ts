import { createAdminClient } from "@/lib/supabase/admin";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { log } from "@/lib/logger";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { transfer_id, owner_email } = body as { transfer_id?: string; owner_email?: string };

  if (!transfer_id || !owner_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify transfer exists and is still in OTP-pending state
  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, from_owner_id, status")
    .eq("id", transfer_id)
    .single();

  const transfer = transferData as { id: string; from_owner_id: string; status: string } | null;
  if (!transfer || transfer.status !== "otp_pending") {
    return NextResponse.json({ error: "Transfer not found or already processed" }, { status: 404 });
  }

  // Verify owner email matches
  const { data: ownerData } = await admin
    .from("ownership_records")
    .select("owner_email")
    .eq("id", transfer.from_owner_id)
    .single();

  const ownerRecord = ownerData as { owner_email: string } | null;
  if (!ownerRecord || ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match owner" }, { status: 403 });
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

  // Create new OTP
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
