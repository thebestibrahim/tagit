import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendTransferAcceptanceEmail, APP_URL } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { transfer_id } = body as { transfer_id?: string };

  if (!transfer_id) {
    return NextResponse.json({ error: "transfer_id required" }, { status: 400 });
  }

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

  // Get current owner info and product name
  const [{ data: ownerData }, { data: productData }] = await Promise.all([
    admin.from("ownership_records").select("owner_name").eq("id", transfer.from_owner_id).single(),
    admin.from("products").select("name, companies(name)").eq("tag_id", transfer.tag_id).single(),
  ]);

  const owner = ownerData as { owner_name: string } | null;
  const product = productData as { name: string; companies: { name: string } } | null;

  // Send acceptance email
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
