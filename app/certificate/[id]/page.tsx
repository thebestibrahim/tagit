import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Shield, CheckCircle, AlertTriangle, Tag, Calendar, Award, ArrowRight, Clock } from "lucide-react";
import LocalTime from "@/components/ui/LocalTime";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Cert = {
  id: string;
  cert_number: string;
  cert_type: "ownership" | "transfer" | "provenance";
  template: string;
  issued_to_name: string;
  issued_to_email: string;
  issued_at: string;
  tag_id: string;
  ownership_record_id: string | null;
};

type OwnerRecord = { is_current: boolean; ended_at: string | null };
type Product = { name: string; industry_fields: Record<string, string> };
type Tag = { short_id: string; company_id: string; token: string };
type Company = {
  name: string;
  logo_url: string | null;
  brand_primary_color: string;
  brand_accent_color: string;
};

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: certData } = await admin
    .from("certificates")
    .select("id, cert_number, cert_type, template, issued_to_name, issued_to_email, issued_at, tag_id, ownership_record_id")
    .eq("id", id)
    .single();

  if (!certData) notFound();
  const cert = certData as Cert;

  const [{ data: tagData }, { data: ownerRecordData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("tags").select("short_id, company_id, token, products(name, industry_fields)").eq("id", cert.tag_id).single(),
    cert.ownership_record_id
      ? admin.from("ownership_records").select("is_current, ended_at").eq("id", cert.ownership_record_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const tagRow = tagData as (Tag & { products: Product | null }) | null;
  if (!tagRow) notFound();

  const product = tagRow.products;
  if (!product) notFound();

  const tag: Tag = { short_id: tagRow.short_id, company_id: tagRow.company_id, token: tagRow.token };
  const ownerRecord = ownerRecordData as OwnerRecord | null;

  const { data: companyData } = await admin
    .from("companies")
    .select("name, logo_url, brand_primary_color, brand_accent_color")
    .eq("id", tag.company_id)
    .single();

  const company = (companyData ?? {
    name: "Unknown Brand",
    logo_url: null,
    brand_primary_color: "#0A0A0B",
    brand_accent_color: "#B8945D",
  }) as Company;

  // Live status — checked against the ledger on every page load
  const isProvenance = cert.cert_type === "provenance";
  const isTransferred = isProvenance || ownerRecord?.is_current === false;

  const accentColor = company.brand_accent_color || "#B8945D";
  const primaryColor = company.brand_primary_color || "#0A0A0B";

  const ownerLabel =
    cert.cert_type === "transfer" ? "TRANSFERRED TO" :
    isProvenance ? "PREVIOUS OWNER" :
    "REGISTERED OWNER";

  const certTypeLabel =
    cert.cert_type === "ownership" ? "CERTIFICATE OF AUTHENTICITY" :
    cert.cert_type === "transfer" ? "CERTIFICATE OF TRANSFER" :
    "PROVENANCE RECORD";

  const ownershipTypeLabel =
    cert.cert_type === "ownership" ? "Original Owner" :
    cert.cert_type === "transfer" ? "Transfer of Ownership" :
    "Provenance Record";

  const industryHighlights = Object.entries(product.industry_fields ?? {})
    .filter(([, v]) => v)
    .slice(0, 4);

  const banner = isProvenance
    ? { bg: "#78350F", Icon: Clock, iconColor: "#FCD34D", text: "PROVENANCE RECORD — Historical ownership on the Tagit Ledger", textColor: "#FCD34D" }
    : isTransferred
    ? { bg: "#7F1D1D", Icon: AlertTriangle, iconColor: "#FCA5A5", text: "OWNERSHIP TRANSFERRED — This item has a new owner", textColor: "#FCA5A5" }
    : { bg: "#0F5132", Icon: CheckCircle, iconColor: "#4ADE80", text: "Verified on the Tagit Ownership Ledger", textColor: "#4ADE80" };

  const { Icon: BannerIcon } = banner;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF8", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Status banner */}
      <div style={{ backgroundColor: banner.bg, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <BannerIcon size={14} color={banner.iconColor} strokeWidth={2.5} />
        <span style={{ fontSize: 12, fontWeight: 600, color: banner.textColor, letterSpacing: "0.02em" }}>
          {banner.text}
        </span>
      </div>

      <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px 48px" }}>
        {/* Brand header */}
        <div
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px 16px 0 0",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {company.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt={company.name}
              style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)", padding: 4, flexShrink: 0 }}
            />
          )}
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 3 }}>
              {certTypeLabel}
            </p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              {company.name}
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Award size={28} color={isTransferred ? "#6B7280" : accentColor} strokeWidth={1.5} />
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D5",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            padding: "32px",
          }}
        >
          {/* Transferred / provenance badge */}
          {isTransferred && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: isProvenance ? "#FEF3C7" : "#FEE2E2",
                borderRadius: 20,
                padding: "5px 12px",
                marginBottom: 20,
              }}
            >
              {isProvenance
                ? <Clock size={11} color="#D97706" />
                : <AlertTriangle size={11} color="#DC2626" />}
              <span style={{ fontSize: 11, fontWeight: 700, color: isProvenance ? "#92400E" : "#991B1B", letterSpacing: "0.04em" }}>
                {isProvenance ? "PROVENANCE RECORD" : "OWNERSHIP TRANSFERRED"}
              </span>
            </div>
          )}

          {/* Cert ID pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#F5F2EC", borderRadius: 20, padding: "5px 12px", marginBottom: 24 }}>
            <Tag size={11} color="#9E9EA3" />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#4A4A4F", fontWeight: 600, letterSpacing: "0.05em" }}>
              {cert.cert_number}
            </span>
          </div>

          {/* Product */}
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9E9EA3", letterSpacing: "0.06em", fontWeight: 600 }}>
            AUTHENTICATED ITEM
          </p>
          <p style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 700, color: "#0A0A0B", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
            {product.name}
          </p>

          {/* Owner block */}
          <div style={{ backgroundColor: "#F5F2EC", borderRadius: 10, padding: "18px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.08em", fontWeight: 600 }}>
              {ownerLabel}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: "#0A0A0B" }}>
              {cert.issued_to_name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#6E6E73" }}>{cert.issued_to_email}</p>
          </div>

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { icon: <Calendar size={13} color="#9E9EA3" />, label: "Date Issued", value: <LocalTime iso={cert.issued_at} pattern="dd MMMM yyyy" /> },
              { icon: <Shield size={13} color="#9E9EA3" />, label: "Certificate Type", value: ownershipTypeLabel },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  {icon}
                  <span style={{ fontSize: 10, color: "#9E9EA3", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {label.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1F1F22" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Industry highlights */}
          {industryHighlights.length > 0 && (
            <>
              <div style={{ height: 1, backgroundColor: "#E8E2D5", marginBottom: 20 }} />
              <p style={{ margin: "0 0 12px", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.08em", fontWeight: 600 }}>
                ITEM DETAILS
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 24 }}>
                {industryHighlights.map(([key, value]) => (
                  <div key={key}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#9E9EA3", textTransform: "capitalize" }}>
                      {key.replace(/_/g, " ")}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#1F1F22", fontWeight: 500 }}>{String(value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Status seal */}
          <div
            style={{
              borderRadius: 10,
              border: `1.5px solid ${isTransferred ? (isProvenance ? "#D97706" : "#DC2626") : accentColor}`,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              backgroundColor: isTransferred ? (isProvenance ? "rgba(253,230,138,0.08)" : "rgba(254,202,202,0.08)") : "transparent",
            }}
          >
            {isTransferred
              ? isProvenance
                ? <Clock size={20} color="#D97706" strokeWidth={2} style={{ flexShrink: 0 }} />
                : <AlertTriangle size={20} color="#DC2626" strokeWidth={2} style={{ flexShrink: 0 }} />
              : <CheckCircle size={20} color={accentColor} strokeWidth={2} style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#0A0A0B" }}>
                {isProvenance
                  ? "Permanent provenance record"
                  : isTransferred
                  ? "This item has a new owner"
                  : "Authenticity confirmed"}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#6E6E73", lineHeight: 1.5 }}>
                {isProvenance
                  ? "This record permanently confirms your previous ownership. It cannot be altered or removed from the Tagit Ownership Ledger."
                  : isTransferred
                  ? "Ownership of this item has been transferred. This certificate is now a historical record and cannot be used to claim ownership."
                  : "This certificate is cryptographically recorded on the Tagit Ownership Ledger and cannot be duplicated or forged."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#0A0A0B" }}>Tagit</p>
              <p style={{ margin: 0, fontSize: 10, color: "#9E9EA3" }}>Identity infrastructure for luxury goods</p>
            </div>
            {!isProvenance && (
              <a
                href={`/v/${tag.token}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", backgroundColor: "#0A0A0B", color: "#FAFAF8",
                  borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}
              >
                View item
                <ArrowRight size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
