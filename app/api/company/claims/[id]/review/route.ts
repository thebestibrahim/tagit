import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendClaimApprovedEmail, sendClaimRejectedEmail, sendCertificateEmail, APP_URL } from "@/lib/email";
import {
  generateCertNumber,
  generateCertificatePdf,
  fetchLogoDataUrl,
} from "@/lib/certificate";

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
    .select("id, name, status, logo_url, signature_url, brand_primary_color, brand_accent_color, cert_template")
    .eq("id", user.id)
    .single();

  const company = companyData as {
    id: string;
    name: string;
    status: string;
    logo_url: string | null;
    signature_url: string | null;
    brand_primary_color: string;
    brand_accent_color: string;
    cert_template: string | null;
  } | null;

  if (!company || company.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, rejection_reason } = body as { action?: string; rejection_reason?: string };

  if (!["approve", "reject"].includes(action ?? "")) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

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

  const { data: tagData } = await admin
    .from("tags")
    .select("id, company_id, token, short_id")
    .eq("id", claim.tag_id)
    .single();

  const tag = tagData as { id: string; company_id: string; token: string; short_id: string } | null;
  if (!tag || tag.company_id !== company.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date().toISOString();

  const { data: productData } = await admin
    .from("products")
    .select("name")
    .eq("tag_id", claim.tag_id)
    .single();

  const product = productData as { name: string } | null;

  if (action === "approve") {
    // Create ownership record — capture returned ID
    const { data: ownerRecordData, error: ownerError } = await admin
      .from("ownership_records")
      .insert({
        tag_id: claim.tag_id,
        owner_name: claim.claimant_name,
        owner_email: claim.claimant_email,
        acquisition_type: "origin",
        is_current: true,
      } as never)
      .select("id")
      .single();

    if (ownerError) {
      return NextResponse.json({ error: "Failed to create ownership record" }, { status: 500 });
    }

    const ownerRecord = ownerRecordData as { id: string };

    await Promise.all([
      admin.from("tags").update({ status: "owned", activated_at: now } as never).eq("id", claim.tag_id),
      admin.from("ownership_claims").update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: now,
      } as never).eq("id", id),
    ]);

    const tagUrl = `${APP_URL}/v/${tag.token}`;

    if (product) {
      // Generate certificate
      const certNumber = generateCertNumber();
      const template = (company.cert_template ?? "classic") as "classic" | "minimal" | "heritage";

      const { data: certRecord } = await admin
        .from("certificates")
        .insert({
          cert_number: certNumber,
          ownership_record_id: ownerRecord.id,
          tag_id: claim.tag_id,
          cert_type: "ownership",
          template,
          issued_to_name: claim.claimant_name,
          issued_to_email: claim.claimant_email,
        } as never)
        .select("id")
        .single();

      const certId = (certRecord as { id: string } | null)?.id ?? "";
      const verifyUrl = `${APP_URL}/certificate/${certId}`;

      const [logoDataUrl, signatureDataUrl] = await Promise.all([
        fetchLogoDataUrl(company.logo_url),
        fetchLogoDataUrl(company.signature_url),
      ]);

      const pdfBuffer = await generateCertificatePdf({
        certNumber,
        certId,
        certType: "ownership",
        ownerName: claim.claimant_name,
        ownerEmail: claim.claimant_email,
        productName: product.name,
        companyName: company.name,
        companyLogoDataUrl: logoDataUrl,
        companySignatureDataUrl: signatureDataUrl,
        brandPrimaryColor: company.brand_primary_color,
        brandAccentColor: company.brand_accent_color,
        issuedAt: new Date(),
        tagShortId: tag.short_id,
        verifyUrl,
        template,
      }).catch(() => null);

      await Promise.all([
        // Standard approval email (no attachment)
        sendClaimApprovedEmail(claim.claimant_email, {
          claimantName: claim.claimant_name,
          productName: product.name,
          companyName: company.name,
          tagUrl,
        }).catch((err) => console.error("[claims/review] email failed:", err)),
        // Certificate email with PDF
        pdfBuffer
          ? sendCertificateEmail(claim.claimant_email, {
              ownerName: claim.claimant_name,
              productName: product.name,
              companyName: company.name,
              certNumber,
              certType: "ownership",
              tagUrl,
              pdfBuffer,
            }).catch((err) => console.error("[claims/review] email failed:", err))
          : Promise.resolve(),
      ]);
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

  await admin.from("tags").update({ status: "embedded" } as never).eq("id", claim.tag_id);

  if (product) {
    await sendClaimRejectedEmail(claim.claimant_email, {
      claimantName: claim.claimant_name,
      productName: product.name,
      reason: rejection_reason,
    }).catch((err) => console.error("[claims/review] email failed:", err));
  }

  return NextResponse.json({ success: true });
}
