import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, purpose } = body as { email?: string; purpose?: string };

  if (!email || !purpose) {
    return NextResponse.json({ error: "email and purpose required" }, { status: 400 });
  }

  if (!["claim", "transfer"].includes(purpose)) {
    return NextResponse.json({ error: "invalid purpose" }, { status: 400 });
  }

  // Rate limit: max 5 OTPs per email in 15 minutes — uses existing otp_codes table
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("otp_codes")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const code = randomInt(100000, 1000000).toString();
  const code_hash = await hash(code, 10);

  const { error } = await admin.from("otp_codes").insert({
    email,
    code_hash,
    purpose,
    attempts: 0,
    is_used: false,
  } as never);

  if (error) {
    return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 });
  }

  try {
    await sendOtpEmail(email, code, purpose as "claim" | "transfer");
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
