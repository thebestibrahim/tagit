import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Shield, CheckCircle, Tag, Calendar, Award, ArrowRight } from "lucide-react";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Cert = {
  id: string;
  cert_number: string;
  cert_type: "ownership" | "transfer";
  template: string;
  issued_to_name: string;
  issued_to_email: string;
  issued_at: string;
  tag_id: string;
};

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
    .select("id, cert_number, cert_type, template, issued_to_name, issued_to_email, issued_at, tag_id")
    .eq("id", id)
    .single();

  if (!certData) notFound();

  const cert = certData as Cert;

  const [{ data: productData }, { data: tagData }] = await Promise.all([
    admin.from("products").select("name, industry_fields").eq("tag_id", cert.tag_id).single(),
    admin.from("tags").select("short_id, company_id, token").eq("id", cert.tag_id).single(),
  ]);

  if (!productData || !tagData) notFound();

  const product = productData as Product;
  const tag = tagData as Tag;

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

  const isTransfer = cert.cert_type === "transfer";
  const accentColor = company.brand_accent_color || "#B8945D";
  const primaryColor = company.brand_primary_color || "#0A0A0B";

  const industryHighlights = Object.entries(product.industry_fields ?? {})
    .filter(([, v]) => v)
    .slice(0, 4);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAFAF8",
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}
    >
      {/* Top verified banner */}
      <div
        style={{
          backgroundColor: "#0F5132",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <CheckCircle size={14} color="#4ADE80" strokeWidth={2.5} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#4ADE80",
            letterSpacing: "0.02em",
          }}
        >
          Verified on the Tagit Ownership Ledger
        </span>
      </div>

      {/* Main card */}
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: "0 16px 48px",
        }}
      >
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
              style={{
                width: 44,
                height: 44,
                objectFit: "contain",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: 4,
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 3,
              }}
            >
              {isTransfer ? "CERTIFICATE OF TRANSFER" : "CERTIFICATE OF AUTHENTICITY"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              {company.name}
            </p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Award size={28} color={accentColor} strokeWidth={1.5} />
          </div>
        </div>

        {/* White body */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E2D5",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            padding: "32px",
          }}
        >
          {/* Cert ID pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#F5F2EC",
              borderRadius: 20,
              padding: "5px 12px",
              marginBottom: 24,
            }}
          >
            <Tag size={11} color="#9E9EA3" />
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "#4A4A4F",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              {cert.cert_number}
            </span>
          </div>

          {/* Product name */}
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 11,
              color: "#9E9EA3",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            AUTHENTICATED ITEM
          </p>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: 26,
              fontWeight: 700,
              color: "#0A0A0B",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </p>

          {/* Owner block */}
          <div
            style={{
              backgroundColor: "#F5F2EC",
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 10,
                color: "#9E9EA3",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {isTransfer ? "TRANSFERRED TO" : "REGISTERED OWNER"}
            </p>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 18,
                fontWeight: 700,
                color: "#0A0A0B",
              }}
            >
              {cert.issued_to_name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#6E6E73" }}>
              {cert.issued_to_email}
            </p>
          </div>

          {/* Details grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              {
                icon: <Calendar size={13} color="#9E9EA3" />,
                label: "Date Issued",
                value: format(new Date(cert.issued_at), "dd MMMM yyyy"),
              },
              {
                icon: <Shield size={13} color="#9E9EA3" />,
                label: "Ownership Type",
                value: isTransfer ? "Transfer" : "Original Owner",
              },
            ].map(({ icon, label, value }) => (
              <div key={label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                  }}
                >
                  {icon}
                  <span
                    style={{
                      fontSize: 10,
                      color: "#9E9EA3",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    {label.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1F1F22" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Industry highlights */}
          {industryHighlights.length > 0 && (
            <>
              <div
                style={{
                  height: 1,
                  backgroundColor: "#E8E2D5",
                  marginBottom: 20,
                }}
              />
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 10,
                  color: "#9E9EA3",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                ITEM DETAILS
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px 16px",
                  marginBottom: 24,
                }}
              >
                {industryHighlights.map(([key, value]) => (
                  <div key={key}>
                    <p
                      style={{
                        margin: "0 0 2px",
                        fontSize: 10,
                        color: "#9E9EA3",
                        textTransform: "capitalize",
                      }}
                    >
                      {key.replace(/_/g, " ")}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#1F1F22",
                        fontWeight: 500,
                      }}
                    >
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Verified seal */}
          <div
            style={{
              borderRadius: 10,
              border: `1.5px solid ${accentColor}`,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <CheckCircle size={20} color={accentColor} strokeWidth={2} style={{ flexShrink: 0 }} />
            <div>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0A0A0B",
                }}
              >
                Authenticity confirmed
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#6E6E73", lineHeight: 1.5 }}>
                This certificate is cryptographically recorded on the Tagit Ownership
                Ledger and cannot be duplicated or forged.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0A0A0B",
                }}
              >
                Tagit
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#9E9EA3" }}>
                Identity infrastructure for luxury goods
              </p>
            </div>
            <a
              href={`/v/${tag.token}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                backgroundColor: "#0A0A0B",
                color: "#FAFAF8",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View item
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
