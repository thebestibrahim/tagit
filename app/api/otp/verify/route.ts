import { createAdminClient } from "@/lib/supabase/admin";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, code, purpose } = body as {
    email?: string;
    code?: string;
    purpose?: string;
  };

  if (!email || !code || !purpose) {
    return NextResponse.json({ error: "email, code and purpose required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: otps } = await admin
    .from("otp_codes")
    .select("id, code_hash, attempts, is_used, expires_at")
    .eq("email", email)
    .eq("purpose", purpose)
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
    return NextResponse.json(
      { error: "No valid code found. Request a new one." },
      { status: 400 }
    );
  }

  if (otp.attempts >= 5) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 400 }
    );
  }

  const valid = await compare(code, otp.code_hash);

  if (!valid) {
    await admin
      .from("otp_codes")
      .update({ attempts: otp.attempts + 1 })
      .eq("id", otp.id);

    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await admin
    .from("otp_codes")
    .update({ is_used: true })
    .eq("id", otp.id);

  return NextResponse.json({ success: true });
}
