import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendTransferCompleteEmail, APP_URL } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { acceptance_token } = body as { acceptance_token?: string };

  if (!acceptance_token) {
    return NextResponse.json({ error: "acceptance_token required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, tag_id, from_owner_id, to_name, to_email, sale_price, status, expires_at")
    .eq("acceptance_token", acceptance_token)
    .single();

  const transfer = transferData as {
    id: string;
    tag_id: string;
    from_owner_id: string;
    to_name: string;
    to_email: string;
    sale_price: number | null;
    status: string;
    expires_at: string;
  } | null;

  if (!transfer) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (transfer.status !== "awaiting_acceptance") {
    return NextResponse.json(
      { error: transfer.status === "completed" ? "Transfer already completed" : "Transfer is not ready for acceptance" },
      { status: 409 }
    );
  }

  if (new Date(transfer.expires_at) < new Date(now)) {
    await admin
      .from("transfer_requests")
      .update({ status: "expired" } as never)
      .eq("id", transfer.id);
    return NextResponse.json({ error: "Transfer has expired" }, { status: 410 });
  }

  // Get current owner record
  const { data: currentOwnerData } = await admin
    .from("ownership_records")
    .select("id, owner_name, owner_email")
    .eq("id", transfer.from_owner_id)
    .single();

  const currentOwner = currentOwnerData as {
    id: string;
    owner_name: string;
    owner_email: string;
  } | null;

  if (!currentOwner) {
    return NextResponse.json({ error: "Owner record not found" }, { status: 404 });
  }

  // Complete transfer in a logical sequence
  const completedAt = new Date().toISOString();

  // 1. Mark old ownership as ended
  await admin
    .from("ownership_records")
    .update({ is_current: false, ended_at: completedAt } as never)
    .eq("id", currentOwner.id);

  // 2. Create new ownership record
  const { error: insertError } = await admin.from("ownership_records").insert({
    tag_id: transfer.tag_id,
    owner_name: transfer.to_name,
    owner_email: transfer.to_email,
    acquisition_type: "transfer",
    acquired_from_id: currentOwner.id,
    sale_price: transfer.sale_price,
    is_current: true,
  } as never);

  if (insertError) {
    return NextResponse.json({ error: "Failed to create ownership record" }, { status: 500 });
  }

  // 3. Update tag status to owned
  await admin.from("tags").update({ status: "owned" } as never).eq("id", transfer.tag_id);

  // 4. Mark transfer as completed
  await admin
    .from("transfer_requests")
    .update({ status: "completed", completed_at: completedAt } as never)
    .eq("id", transfer.id);

  // Fetch product and tag token for email
  const [{ data: productData }, { data: tagData }] = await Promise.all([
    admin.from("products").select("name").eq("tag_id", transfer.tag_id).single(),
    admin.from("tags").select("token").eq("id", transfer.tag_id).single(),
  ]);

  const product = productData as { name: string } | null;
  const tagToken = (tagData as { token: string } | null)?.token ?? transfer.tag_id;
  const tagUrl = `${APP_URL}/v/${tagToken}`;

  if (product) {
    await Promise.all([
      sendTransferCompleteEmail(transfer.to_email, {
        name: transfer.to_name,
        productName: product.name,
        tagUrl,
        role: "recipient",
      }),
      sendTransferCompleteEmail(currentOwner.owner_email, {
        name: currentOwner.owner_name,
        productName: product.name,
        tagUrl,
        role: "sender",
      }),
    ]).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
