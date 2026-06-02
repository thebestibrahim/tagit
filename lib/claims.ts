import type { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { sendClaimApprovedEmail, sendCertificateEmail, APP_URL } from "@/lib/email";
import {
  generateCertNumber,
  generateCertificatePdf,
  fetchLogoDataUrl,
  certificateUrl,
} from "@/lib/certificate";

// PRD v3.0: a consumer's first-ownership claim auto-confirms after the brand's
// review window lapses with no rejection. The brand may also approve early.
export const CLAIM_AUTO_CONFIRM_HOURS = 24;

type AdminClient = ReturnType<typeof createAdminClient>;

/** ISO timestamp at which a claim created `from` auto-confirms (now + 24h). */
export function claimAutoConfirmAt(from: Date = new Date()): string {
  return new Date(from.getTime() + CLAIM_AUTO_CONFIRM_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Confirm a pending ownership claim: create the ownership record, flip the tag
 * to `owned`, mark the claim approved — atomically via the confirm_claim RPC —
 * then issue + email the certificate. Shared by the brand early-approve route
 * and the auto-confirm cron.
 *
 * `reviewedBy` is the brand user id for an early approval, or null when the
 * cron auto-confirms on silence. Idempotent: returns { confirmed: false } if
 * the claim was already reviewed (the RPC is a no-op in that case).
 */
export async function confirmClaim(
  admin: AdminClient,
  claimId: string,
  reviewedBy: string | null = null
): Promise<{ confirmed: boolean }> {
  const { data: rpcRows, error: rpcError } = await admin.rpc("confirm_claim", {
    p_claim_id: claimId,
    p_reviewed_by: reviewedBy,
  });

  if (rpcError) {
    log.error("claims/confirm", "confirm_claim RPC failed", rpcError);
    throw new Error("Failed to confirm claim");
  }

  const result = (rpcRows ?? [])[0] as { ownership_record_id: string; tag_id: string } | undefined;
  if (!result) {
    // Already reviewed (approved/rejected) — nothing to do.
    return { confirmed: false };
  }

  // ── Side effects (cert + emails) — not part of the ownership transaction ──
  const { data: claimData } = await admin
    .from("ownership_claims")
    .select("claimant_name, claimant_email")
    .eq("id", claimId)
    .single();
  const claim = claimData as { claimant_name: string; claimant_email: string } | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tagData } = await (admin as any)
    .from("tags")
    .select("token, short_id, company_id, products(name)")
    .eq("id", result.tag_id)
    .single();

  const tag = tagData as {
    token: string;
    short_id: string;
    company_id: string;
    products: { name: string } | { name: string }[] | null;
  } | null;

  const rawProd = tag?.products;
  const product = (Array.isArray(rawProd) ? rawProd[0] : rawProd) as { name: string } | null;

  if (!claim || !tag) return { confirmed: true };

  const { data: companyData } = await admin
    .from("companies")
    .select("name, logo_url, signature_url, brand_primary_color, brand_accent_color, cert_template")
    .eq("id", tag.company_id)
    .single();

  const company = companyData as {
    name: string;
    logo_url: string | null;
    signature_url: string | null;
    brand_primary_color: string;
    brand_accent_color: string;
    cert_template: string | null;
  } | null;

  const tagUrl = `${APP_URL}/v/${tag.token}`;

  if (!product || !company) return { confirmed: true };

  const certNumber = generateCertNumber();
  const template = (company.cert_template ?? "classic") as "classic" | "minimal" | "heritage";

  const { data: certRecord } = await admin
    .from("certificates")
    .insert({
      cert_number: certNumber,
      ownership_record_id: result.ownership_record_id,
      tag_id: result.tag_id,
      cert_type: "ownership",
      template,
      issued_to_name: claim.claimant_name,
      issued_to_email: claim.claimant_email,
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
    sendClaimApprovedEmail(claim.claimant_email, {
      claimantName: claim.claimant_name,
      productName: product.name,
      companyName: company.name,
      tagUrl,
    }).catch((err) => log.error("claims/confirm", "Approval email failed", err)),
    pdfBuffer
      ? sendCertificateEmail(claim.claimant_email, {
          ownerName: claim.claimant_name,
          productName: product.name,
          companyName: company.name,
          certNumber,
          certType: "ownership",
          tagUrl,
          pdfBuffer,
        }).catch((err) => log.error("claims/confirm", "Certificate email failed", err))
      : Promise.resolve(),
  ]);

  return { confirmed: true };
}
