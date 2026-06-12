import { createAdminClient } from "@/lib/supabase/admin";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { log } from "@/lib/logger";
import { getSiblingTagIds } from "@/lib/tags";
import { normalizeEmail } from "@/lib/utils";

const admin = createAdminClient();

// Step 1 of the transfer flow: verify the requester IS the current owner and
// email them a one-time code. No recipient details are collected yet and no
// transfer_request row is created — that happens at /finalize once the owner's
// identity is confirmed. This keeps the owner check up front so a sender never
// fills in recipient + price only to be told their email is wrong.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tag_id, owner_email: rawOwnerEmail } = body as {
    tag_id?: string;
    owner_email?: string;
  };

  if (!tag_id || !rawOwnerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const owner_email = normalizeEmail(rawOwnerEmail);

  // Rate limit: max 3 code requests per email in 15 minutes
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("otp_codes")
    .select("*", { count: "exact", head: true })
    .eq("email", owner_email)
    .eq("purpose", "transfer")
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json({ error: "Too many requests. Try again soon." }, { status: 429 });
  }

  // Tag must be owned (or already transferred onward) to be transferable.
  const { data: tagData } = await admin
    .from("tags")
    .select("id, status, product_id")
    .eq("id", tag_id)
    .single();

  const tag = tagData as { id: string; status: string; product_id: string | null } | null;
  if (!tag || !["owned", "transferred"].includes(tag.status)) {
    return NextResponse.json({ error: "Tag is not available for transfer" }, { status: 409 });
  }

  // Ownership is unified across the product's tag group — resolve the current
  // owner from any sibling tag so a transfer can be initiated from any chip.
  const siblingIds = await getSiblingTagIds(admin, tag);
  const { data: ownerData } = await admin
    .from("ownership_records")
    .select("id, owner_email")
    .in("tag_id", siblingIds)
    .eq("is_current", true)
    .single();

  const ownerRecord = ownerData as { id: string; owner_email: string } | null;
  if (!ownerRecord) {
    return NextResponse.json({ error: "No ownership record found" }, { status: 404 });
  }

  if (ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match current owner" }, { status: 403 });
  }

  // Invalidate any prior unused codes, then issue a fresh one.
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
    log.error("transfer", "OTP email failed", { owner_email, error: emailError });
  }

  return NextResponse.json({ success: true, emailSent, emailError });
}
