import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Award, ExternalLink, ShieldCheck } from "lucide-react";
import type { CompanyStatus } from "@/types/database";
import ClaimReviewActions from "./ClaimReviewActions";

type ClaimDetail = {
  id: string;
  tag_id: string;
  claimant_name: string;
  claimant_email: string;
  claim_ip: string | null;
  claim_location: string | null;
  status: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  expires_at: string;
};

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data: companyData } = await supabase
    .from("companies")
    .select("id, status")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; status: CompanyStatus } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  const { data: claimData } = await supabase
    .from("ownership_claims")
    .select("id, tag_id, claimant_name, claimant_email, claim_ip, claim_location, status, reviewed_at, rejection_reason, created_at, expires_at")
    .eq("id", id)
    .single();

  if (!claimData) notFound();
  const claim = claimData as ClaimDetail;

  // Verify claim belongs to this company's tag
  const { data: tagData } = await supabase
    .from("tags")
    .select("id, short_id, status, company_id")
    .eq("id", claim.tag_id)
    .single();

  const tag = tagData as { id: string; short_id: string; status: string; company_id: string } | null;
  if (!tag || tag.company_id !== company.id) notFound();

  const [
    { data: tagProductData },
    { data: ownershipData },
    { data: certData },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tags")
      .select("products(id, name, retail_price, currency)")
      .eq("id", claim.tag_id)
      .single(),
    supabase
      .from("ownership_records")
      .select("id, owner_name, owner_email, acquisition_type, acquired_at, sale_price, currency")
      .eq("tag_id", claim.tag_id)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select("id, cert_number, cert_type, template, issued_to_name, issued_at")
      .eq("tag_id", claim.tag_id)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rawProd = (tagProductData as { products: unknown } | null)?.products;
  const product = (Array.isArray(rawProd) ? rawProd[0] : rawProd) as { id: string; name: string; retail_price: number | null; currency: string } | null;

  const ownership = ownershipData as {
    id: string;
    owner_name: string;
    owner_email: string;
    acquisition_type: string;
    acquired_at: string;
    sale_price: number | null;
    currency: string;
  } | null;

  const cert = certData as {
    id: string;
    cert_number: string;
    cert_type: string;
    template: string;
    issued_to_name: string;
    issued_at: string;
  } | null;

  // A claim must be MANUALLY approved (or rejected) within 24h. There is no
  // auto-confirm. Past `expires_at` the claim lapses: it can no longer be
  // approved, and the item becomes claimable again.
  const isPending = claim.status === "pending";
  const expired = claim.expires_at != null && new Date(claim.expires_at) < new Date();
  const canReview = isPending && !expired;

  const statusStyle = {
    pending:  { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
    approved: { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
    rejected: { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
    expired:  { bg: "var(--color-linen)",         color: "var(--color-slate)" },
  };
  const displayStatus = expired && isPending ? "expired" : claim.status;
  const badge = statusStyle[displayStatus as keyof typeof statusStyle] ?? statusStyle.expired;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/ownership"
        className="inline-flex items-center gap-1.5 mb-6"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}
      >
        <ArrowLeft size={14} />
        Back to ownership
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-micro font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-gold)" }}>
            Claim #{claim.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="font-display" style={{ fontSize: "28px", color: "var(--color-charcoal)", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            {product?.name ?? "Unknown product"}
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Submitted {format(new Date(claim.created_at), "MMMM d, yyyy 'at' HH:mm")}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-body-sm font-medium capitalize mt-1 shrink-0"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {displayStatus}
        </span>
      </div>

      {/* Claimant + Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Claimant */}
        <div
          className="p-5 rounded-xl"
          style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
        >
          <p className="text-micro font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-slate)" }}>
            Claimant
          </p>
          <p className="font-semibold mb-0.5" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body)" }}>
            {claim.claimant_name}
          </p>
          <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            {claim.claimant_email}
          </p>
          {(claim.claim_ip || claim.claim_location) && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-cream)" }}>
              {claim.claim_ip && (
                <p style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                  IP: {claim.claim_ip}
                </p>
              )}
              {claim.claim_location && (
                <p style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                  Location: {claim.claim_location}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Product */}
        <div
          className="p-5 rounded-xl"
          style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
        >
          <p className="text-micro font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-slate)" }}>
            Product
          </p>
          <p className="font-semibold mb-0.5" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body)" }}>
            {product?.name ?? "—"}
          </p>
          {product?.retail_price && (
            <p className="mb-2" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              {product.currency} {product.retail_price.toLocaleString()}
            </p>
          )}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-cream)" }}>
            <p className="mb-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
              Tag ID
            </p>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.08em" }}>
                {tag.short_id}
              </span>
              {product?.id && (
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="inline-flex items-center gap-1"
                  style={{ color: "var(--color-gold)", fontSize: "var(--text-caption)" }}
                >
                  View product <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ownership Record — shown when claim was approved and record exists */}
      {ownership && (
        <div
          className="p-5 rounded-xl mb-4"
          style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} style={{ color: "var(--color-verified)" }} />
            <p className="text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              Ownership record
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Registered owner</p>
              <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                {ownership.owner_name}
              </p>
              <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-caption)" }}>
                {ownership.owner_email}
              </p>
            </div>
            <div>
              <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Acquisition</p>
              <p className="font-medium capitalize" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                {ownership.acquisition_type}
              </p>
              <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-caption)" }}>
                {format(new Date(ownership.acquired_at), "MMM d, yyyy")}
              </p>
            </div>
            {ownership.sale_price && (
              <div>
                <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Sale price</p>
                <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                  {ownership.currency} {ownership.sale_price.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificate — shown when one has been issued */}
      {cert && (
        <div
          className="p-5 rounded-xl mb-4"
          style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-3">
              <Award size={14} style={{ color: "var(--color-gold)" }} />
              <p className="text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
                Certificate of authenticity
              </p>
            </div>
            <Link
              href={`/certificate/${cert.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 mb-3"
              style={{ color: "var(--color-gold)", fontSize: "var(--text-caption)", fontWeight: 500 }}
            >
              View certificate <ExternalLink size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            <div>
              <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Cert number</p>
              <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)", fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.04em" }}>
                {cert.cert_number}
              </p>
            </div>
            <div>
              <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Type</p>
              <p className="font-medium capitalize" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                {cert.cert_type}
              </p>
            </div>
            <div>
              <p className="mb-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>Issued</p>
              <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                {format(new Date(cert.issued_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div
        className="p-5 rounded-xl mb-4"
        style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
      >
        <p className="text-micro font-medium uppercase tracking-wider mb-4" style={{ color: "var(--color-slate)" }}>
          Timeline
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-graphite)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
              Claim submitted — {format(new Date(claim.created_at), "MMM d, yyyy 'at' HH:mm")}
            </span>
          </div>
          {claim.reviewed_at && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: claim.status === "approved" ? "var(--color-verified)" : "var(--color-alert)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                {claim.status === "approved" ? "Approved" : "Rejected"} — {format(new Date(claim.reviewed_at), "MMM d, yyyy 'at' HH:mm")}
              </span>
            </div>
          )}
          {cert && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-gold)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                Certificate issued ({cert.cert_number}) — {format(new Date(cert.issued_at), "MMM d, yyyy 'at' HH:mm")}
              </span>
            </div>
          )}
          {isPending && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: expired ? "var(--color-alert)" : "var(--color-gold)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
                {claim.expires_at
                  ? expired
                    ? <>Review window closed {format(new Date(claim.expires_at), "MMM d, yyyy 'at' HH:mm")} — this claim has expired and can no longer be approved.</>
                    : <>Approve or reject before {format(new Date(claim.expires_at), "MMM d, yyyy 'at' HH:mm")} — the claim expires after that.</>
                  : "Approve or reject this claim."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {claim.status === "rejected" && claim.rejection_reason && (
        <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: "var(--color-alert-tint)", border: "1px solid #F0C0C0" }}>
          <p className="text-micro font-medium uppercase tracking-wider mb-2" style={{ color: "var(--color-alert)" }}>
            Rejection reason
          </p>
          <p style={{ color: "var(--color-alert)", fontSize: "var(--text-body-sm)" }}>
            {claim.rejection_reason}
          </p>
        </div>
      )}

      {/* Review actions */}
      {canReview && (
        <ClaimReviewActions claimId={claim.id} />
      )}
    </div>
  );
}
