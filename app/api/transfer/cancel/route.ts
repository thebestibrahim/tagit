import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { transfer_id, owner_email } = body as { transfer_id?: string; owner_email?: string };

  if (!transfer_id || !owner_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, tag_id, from_owner_id, status")
    .eq("id", transfer_id)
    .single();

  const transfer = transferData as {
    id: string;
    tag_id: string;
    from_owner_id: string;
    status: string;
  } | null;

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (!["otp_pending", "awaiting_acceptance"].includes(transfer.status)) {
    return NextResponse.json({ error: "Transfer cannot be cancelled" }, { status: 409 });
  }

  // Verify the requester is the current owner
  const { data: ownerData } = await admin
    .from("ownership_records")
    .select("owner_email")
    .eq("id", transfer.from_owner_id)
    .single();

  const ownerRecord = ownerData as { owner_email: string } | null;
  if (!ownerRecord || ownerRecord.owner_email.toLowerCase() !== owner_email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match current owner" }, { status: 403 });
  }

  // Cancel the transfer and restore tag status to owned
  const [{ error: cancelError }] = await Promise.all([
    admin
      .from("transfer_requests")
      .update({ status: "cancelled" })
      .eq("id", transfer_id),
    admin
      .from("tags")
      .update({ status: "owned" })
      .eq("id", transfer.tag_id),
    // Invalidate any unused OTPs for this owner
    admin
      .from("otp_codes")
      .update({ is_used: true })
      .eq("email", owner_email)
      .eq("purpose", "transfer")
      .eq("is_used", false),
  ]);

  if (cancelError) {
    log.error("transfer", "Cancel failed", { transfer_id, error: cancelError });
    return NextResponse.json({ error: "Failed to cancel transfer" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
