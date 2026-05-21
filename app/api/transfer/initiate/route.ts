import { createClient } from "@supabase/supabase-js";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";
import { hash } from "bcryptjs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tag_id, owner_email, recipient_name, recipient_email, sale_price } = body as {
    tag_id?: string;
    owner_email?: string;
    recipient_name?: string;
    recipient_email?: string;
    sale_price?: number | null;
  };

  if (!tag_id || !owner_email || !recipient_name || !recipient_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Rate limit: max 3 transfer initiations per email in 15 minutes
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

  // Verify tag is owned and owner email matches
  const { data: tagData } = await admin
    .from("tags")
    .select("id, status")
    .eq("id", tag_id)
    .single();

  const tag = tagData as { id: string; status: string } | null;
  if (!tag || tag.status !== "owned") {
    return NextResponse.json({ error: "Tag is not available for transfer" }, { status: 409 });
  }

  const { data: ownerData } = await admin
    .from("ownership_records")
    .select("id, owner_email")
    .eq("tag_id", tag_id)
    .eq("is_current", true)
    .single();

  const ownerRecord = ownerData as { id: string; owner_email: string } | null;
  if (!ownerRecord) {
    return NextResponse.json({ error: "No ownership record found" }, { status: 404 });
  }

  if (ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match current owner" }, { status: 403 });
  }

  // Create transfer request in draft state
  const acceptance_token = crypto.randomUUID();
  const { data: transferData, error: transferError } = await admin
    .from("transfer_requests")
    .insert({
      tag_id,
      from_owner_id: ownerRecord.id,
      to_name: recipient_name,
      to_email: recipient_email,
      sale_price: sale_price ?? null,
      status: "otp_pending",
      acceptance_token,
    } as never)
    .select("id")
    .single();

  if (transferError || !transferData) {
    return NextResponse.json({ error: "Failed to create transfer request" }, { status: 500 });
  }

  // Send OTP to current owner
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
  } as never);

  try {
    await sendOtpEmail(owner_email, code, "transfer");
  } catch {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }

  const transfer = transferData as { id: string };
  return NextResponse.json({ success: true, transfer_id: transfer.id });
}
