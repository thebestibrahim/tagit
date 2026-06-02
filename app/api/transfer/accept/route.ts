import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendTransferCompleteEmail, sendCertificateEmail, APP_URL } from "@/lib/email";
import {
  generateCertNumber,
  generateCertificatePdf,
  fetchLogoDataUrl,
  certificateUrl,
} from "@/lib/certificate";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { acceptance_token } = body as { acceptance_token?: string };

  if (!acceptance_token) {
    return NextResponse.json({ error: "acceptance_token required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, tag_id, from_owner_id, to_name, to_email, sale_price, currency, status, expires_at")
    .eq("acceptance_token", acceptance_token)
    .single();

  const transfer = transferData as {
    id: string;
    tag_id: string;
    from_owner_id: string;
    to_name: string;
    to_email: string;
    sale_price: number | null;
    currency: string;
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

  if (transfer.expires_at != null && new Date(transfer.expires_at) < new Date(now)) {
    await admin
      .from("transfer_requests")
      .update({ status: "expired" })
      .eq("id", transfer.id);
    return NextResponse.json({ error: "Transfer has expired" }, { status: 410 });
  }

  const { data: currentOwnerData, error: ownerError } = await admin
    .from("ownership_records")
    .select("id, owner_name, owner_email, acquired_at")
    .eq("id", transfer.from_owner_id)
    .single();

  if (ownerError || !currentOwnerData) {
    log.error("transfer/accept", "Owner record lookup failed", {
      from_owner_id: transfer.from_owner_id,
      supabase_error: ownerError,
    });
    return NextResponse.json({ error: "Owner record not found", detail: ownerError?.message }, { status: 404 });
  }

  const currentOwner = currentOwnerData as {
    id: string;
    owner_name: string;
    owner_email: string;
    acquired_at: string;
  };

  const completedAt = new Date().toISOString();

  // End old ownership
  await admin
    .from("ownership_records")
    .update({ is_current: false, ended_at: completedAt })
    .eq("id", currentOwner.id);

  // Create new ownership record — capture ID
  const { data: newOwnerData, error: insertError } = await admin
    .from("ownership_records")
    .insert({
      tag_id: transfer.tag_id,
      owner_name: transfer.to_name,
      owner_email: transfer.to_email,
      acquisition_type: "transfer",
      acquired_from_id: currentOwner.id,
      sale_price: transfer.sale_price,
      currency: transfer.currency ?? "NGN",
      is_current: true,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create ownership record" }, { status: 500 });
  }

  const newOwner = newOwnerData as { id: string };

  await Promise.all([
    admin.from("tags").update({ status: "owned" }).eq("id", transfer.tag_id),
    admin.from("transfer_requests")
      .update({ status: "completed", completed_at: completedAt })
      .eq("id", transfer.id),
  ]);

  // Fetch tag (with joined product name) and company branding in parallel
  const { data: tagData } = await admin
    .from("tags")
    .select("token, short_id, company_id, product_id, products(name)")
    .eq("id", transfer.tag_id)
    .single();

  const tag = tagData as { token: string; short_id: string; company_id: string; product_id: string | null; products: { name: string } | null } | null;
  const product = tag?.products ?? null;
  const tagUrl = `${APP_URL}/v/${tag?.token ?? transfer.tag_id}`;

  // Fetch company branding
  const { data: companyData } = tag
    ? await admin
        .from("companies")
        .select("name, logo_url, signature_url, brand_primary_color, brand_accent_color, cert_template")
        .eq("id", tag.company_id)
        .single()
    : { data: null };

  const company = companyData as {
    name: string;
    logo_url: string | null;
    signature_url: string | null;
    brand_primary_color: string;
    brand_accent_color: string;
    cert_template: string | null;
  } | null;

  if (product && company && tag) {
    const certNumber = generateCertNumber();
    const template = (company.cert_template ?? "classic") as "classic" | "minimal" | "heritage";

    const { data: certRecord } = await admin
      .from("certificates")
      .insert({
        cert_number: certNumber,
        ownership_record_id: newOwner.id,
        tag_id: transfer.tag_id,
        cert_type: "transfer",
        template,
        issued_to_name: transfer.to_name,
        issued_to_email: transfer.to_email,
      })
      .select("id")
      .single();

    const certId = (certRecord as { id: string } | null)?.id ?? "";
    const verifyUrl = certificateUrl(certId);
    const [logoDataUrl, signatureDataUrl] = await Promise.all([
      fetchLogoDataUrl(company.logo_url),
      fetchLogoDataUrl(company.signature_url),
    ]);

    const pdfBuffer = await generateCertificatePdf({
      certNumber,
      certId,
      certType: "transfer",
      ownerName: transfer.to_name,
      ownerEmail: transfer.to_email,
      productName: product.name,
      companyName: company.name,
      companyLogoDataUrl: logoDataUrl,
      companySignatureDataUrl: signatureDataUrl,
      brandPrimaryColor: company.brand_primary_color,
      brandAccentColor: company.brand_accent_color,
      issuedAt: new Date(),
      tagShortId: tag.short_id,
      verifyUrl,
      fromOwnerName: currentOwner.owner_name,
      template,
    }).catch(() => null);

    // Generate provenance cert for previous owner
    const provCertNumber = generateCertNumber();
    const { data: provCertRecord } = await admin
      .from("certificates")
      .insert({
        cert_number: provCertNumber,
        ownership_record_id: currentOwner.id,
        tag_id: transfer.tag_id,
        cert_type: "provenance",
        template,
        issued_to_name: currentOwner.owner_name,
        issued_to_email: currentOwner.owner_email,
      })
      .select("id")
      .single();

    const provCertId = (provCertRecord as { id: string } | null)?.id ?? "";
    const provVerifyUrl = certificateUrl(provCertId);

    const provPdfBuffer = await generateCertificatePdf({
      certNumber: provCertNumber,
      certId: provCertId,
      certType: "provenance",
      ownerName: currentOwner.owner_name,
      ownerEmail: currentOwner.owner_email,
      productName: product.name,
      companyName: company.name,
      companyLogoDataUrl: logoDataUrl,
      companySignatureDataUrl: signatureDataUrl,
      brandPrimaryColor: company.brand_primary_color,
      brandAccentColor: company.brand_accent_color,
      issuedAt: new Date(),
      tagShortId: tag.short_id,
      verifyUrl: provVerifyUrl,
      transferredToName: transfer.to_name,
      ownedFrom: new Date(currentOwner.acquired_at),
      ownedUntil: new Date(completedAt),
      template,
    }).catch(() => null);

    await Promise.all([
      // Transfer complete emails (sender + recipient)
      sendTransferCompleteEmail(transfer.to_email, {
        name: transfer.to_name,
        productName: product.name,
        tagUrl,
        role: "recipient",
      }).catch((err) => log.error("transfer/accept", "Recipient email failed", err)),
      sendTransferCompleteEmail(currentOwner.owner_email, {
        name: currentOwner.owner_name,
        productName: product.name,
        tagUrl,
        role: "sender",
      }).catch((err) => log.error("transfer/accept", "Sender email failed", err)),
      // Transfer cert to new owner
      pdfBuffer
        ? sendCertificateEmail(transfer.to_email, {
            ownerName: transfer.to_name,
            productName: product.name,
            companyName: company.name,
            certNumber,
            certType: "transfer",
            tagUrl,
            pdfBuffer,
          }).catch((err) => log.error("transfer/accept", "Certificate email failed", err))
        : Promise.resolve(),
      // Provenance cert to previous owner
      provPdfBuffer
        ? sendCertificateEmail(currentOwner.owner_email, {
            ownerName: currentOwner.owner_name,
            productName: product.name,
            companyName: company.name,
            certNumber: provCertNumber,
            certType: "provenance",
            tagUrl,
            pdfBuffer: provPdfBuffer,
          }).catch((err) => log.error("transfer/accept", "Provenance cert email failed", err))
        : Promise.resolve(),
    ]);
  } else if (product) {
    // Fallback: send transfer complete emails without certificate
    await Promise.all([
      sendTransferCompleteEmail(transfer.to_email, {
        name: transfer.to_name,
        productName: product.name,
        tagUrl,
        role: "recipient",
      }).catch((err) => log.error("transfer/accept", "Recipient email failed", err)),
      sendTransferCompleteEmail(currentOwner.owner_email, {
        name: currentOwner.owner_name,
        productName: product.name,
        tagUrl,
        role: "sender",
      }).catch((err) => log.error("transfer/accept", "Sender email failed", err)),
    ]);
  }

  return NextResponse.json({ success: true });
}
