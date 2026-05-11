import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendClaimApprovedEmail, sendClaimRejectedEmail, APP_URL } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: companyData } = await authClient
    .from("companies")
    .select("id, name, status")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; name: string; status: string } | null;
  if (!company || company.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, rejection_reason } = body as { action?: string; rejection_reason?: string };

  if (!["approve", "reject"].includes(action ?? "")) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Fetch claim and verify it belongs to this company
  const { data: claimData } = await admin
    .from("ownership_claims")
    .select("id, tag_id, claimant_name, claimant_email, status")
    .eq("id", id)
    .single();

  const claim = claimData as {
    id: string;
    tag_id: string;
    claimant_name: string;
    claimant_email: string;
    status: string;
  } | null;

  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Claim has already been reviewed" }, { status: 409 });
  }

  // Verify tag belongs to this company
  const { data: tagData } = await admin
    .from("tags")
    .select("id, company_id, token")
    .eq("id", claim.tag_id)
    .single();

  const tag = tagData as { id: string; company_id: string; token: string } | null;
  if (!tag || tag.company_id !== company.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date().toISOString();

  // Fetch product
  const { data: productData } = await admin
    .from("products")
    .select("name")
    .eq("tag_id", claim.tag_id)
    .single();

  const product = productData as { name: string } | null;

  if (action === "approve") {
    // Create ownership record
    const { error: ownerError } = await admin.from("ownership_records").insert({
      tag_id: claim.tag_id,
      owner_name: claim.claimant_name,
      owner_email: claim.claimant_email,
      acquisition_type: "origin",
      is_current: true,
    } as never);

    if (ownerError) {
      return NextResponse.json({ error: "Failed to create ownership record" }, { status: 500 });
    }

    // Update tag status to owned
    await admin.from("tags").update({ status: "owned", activated_at: now } as never).eq("id", claim.tag_id);

    // Update claim status
    await admin.from("ownership_claims").update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: now,
    } as never).eq("id", id);

    // Email claimant
    const tagUrl = `${APP_URL}/v/${tag.token}`;
    if (product) {
      await sendClaimApprovedEmail(claim.claimant_email, {
        claimantName: claim.claimant_name,
        productName: product.name,
        companyName: company.name,
        tagUrl,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  }

  // Reject
  await admin.from("ownership_claims").update({
    status: "rejected",
    reviewed_by: user.id,
    reviewed_at: now,
    rejection_reason: rejection_reason ?? null,
  } as never).eq("id", id);

  // Reset tag status back to embedded (claimable again)
  await admin.from("tags").update({ status: "embedded" } as never).eq("id", claim.tag_id);

  // Email claimant
  if (product) {
    await sendClaimRejectedEmail(claim.claimant_email, {
      claimantName: claim.claimant_name,
      productName: product.name,
      reason: rejection_reason,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
