import { createAdminClient } from "@/lib/supabase/admin";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/utils";

const admin = createAdminClient();

// Step 2 of the transfer flow: verify the one-time code emailed at /initiate.
// On success the OTP is consumed and its id is returned as a short-lived
// verification proof — the client passes it to /finalize, which re-checks it
// before creating the transfer. No transfer_request exists at this point.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email: rawEmail, code } = body as {
    email?: string;
    code?: string;
  };

  if (!rawEmail || !code) {
    return NextResponse.json({ error: "email and code required" }, { status: 400 });
  }

  const email = normalizeEmail(rawEmail);

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

  // Consume the code. Its id is the bearer proof for /finalize (random UUID,
  // returned only to this verified client, single-use, ~30 min window there).
  await admin.from("otp_codes").update({ is_used: true }).eq("id", otp.id);

  return NextResponse.json({ success: true, verification: otp.id });
}
