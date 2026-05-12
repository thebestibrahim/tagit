import { createClient } from "@supabase/supabase-js";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { sendTransferAcceptanceEmail, APP_URL } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { transfer_id, email, code } = body as {
    transfer_id?: string;
    email?: string;
    code?: string;
  };

  if (!transfer_id || !email || !code) {
    return NextResponse.json({ error: "transfer_id, email and code required" }, { status: 400 });
  }

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
      .update({ attempts: otp.attempts + 1 } as never)
      .eq("id", otp.id);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  // Mark OTP used
  await admin.from("otp_codes").update({ is_used: true } as never).eq("id", otp.id);

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

  // Update transfer to awaiting_acceptance
  await admin
    .from("transfer_requests")
    .update({ status: "awaiting_acceptance" } as never)
    .eq("id", transfer_id);

  // Update tag to transfer_pending
  await admin
    .from("tags")
    .update({ status: "transfer_pending" } as never)
    .eq("id", transfer.tag_id);

  // Get current owner info and product name for acceptance email
  const [{ data: ownerData }, { data: productData }] = await Promise.all([
    admin.from("ownership_records").select("owner_name").eq("id", transfer.from_owner_id).single(),
    admin.from("products").select("name, companies(name)").eq("tag_id", transfer.tag_id).single(),
  ]);

  const owner = ownerData as { owner_name: string } | null;
  const product = productData as { name: string; companies: { name: string } } | null;

  const acceptanceUrl = `${APP_URL}/v/transfer/${transfer.acceptance_token}`;
  if (owner && product) {
    await sendTransferAcceptanceEmail(transfer.to_email, {
      recipientName: transfer.to_name,
      productName: product.name,
      fromName: owner.owner_name,
      companyName: product.companies?.name || "the brand",
      acceptanceUrl,
      salePrice: transfer.sale_price ?? undefined,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
