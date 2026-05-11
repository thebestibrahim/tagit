export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Shield, ShieldX, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { INDUSTRY_FIELDS } from "@/lib/industry-fields";
import ClaimForm from "./ClaimForm";
import TransferForm from "./TransferForm";
import VoiceWidget from "./VoiceWidget";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function validateHmac(token: string, signature: string) {
  const expected = createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
    .update(token)
    .digest("hex");
  return expected === signature;
}

async function logScan(tagId: string, result: string, headerStore: Awaited<ReturnType<typeof headers>>) {
  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  await admin.from("scan_logs").insert({
    tag_id: tagId,
    ip_address: ip,
    user_agent: userAgent,
    scan_result: result,
  } as never).then(() => {});
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const headerStore = await headers();

  // Fetch tag
  const { data: tagData } = await admin
    .from("tags")
    .select("id, token, short_id, status, company_id, industry, hmac_signature")
    .eq("token", token)
    .single();

  if (!tagData) {
    notFound();
  }

  const tag = tagData as {
    id: string;
    token: string;
    short_id: string;
    status: string;
    company_id: string;
    industry: string;
    hmac_signature: string;
  };

  const hmacValid = validateHmac(tag.token, tag.hmac_signature);

  if (!hmacValid) {
    await logScan(tag.id, "invalid_hmac", headerStore);
    return <InvalidPage />;
  }

  await logScan(tag.id, "valid", headerStore);

  // Fetch product
  const { data: productData } = await admin
    .from("products")
    .select("id, name, industry_fields, retail_price, currency, photos")
    .eq("tag_id", tag.id)
    .single();

  const product = productData as {
    id: string;
    name: string;
    industry_fields: Record<string, string>;
    retail_price: number | null;
    currency: string;
    photos: string[];
  } | null;

  // Fetch company
  const { data: companyData } = await admin
    .from("companies")
    .select("id, name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_font, brand_story, custom_header_text, social_links, ai_enabled, ai_persona_name")
    .eq("id", tag.company_id)
    .single();

  const company = companyData as {
    id: string;
    name: string;
    logo_url: string | null;
    brand_primary_color: string;
    brand_secondary_color: string;
    brand_accent_color: string;
    brand_font: string;
    brand_story: string | null;
    custom_header_text: string | null;
    social_links: Record<string, string>;
    ai_enabled: boolean;
    ai_persona_name: string | null;
  } | null;

  // Fetch ownership records
  const { data: ownershipData } = await admin
    .from("ownership_records")
    .select("id, owner_name, owner_email, acquisition_type, acquired_at, sale_price, currency, is_current")
    .eq("tag_id", tag.id)
    .order("acquired_at", { ascending: true });

  const ownershipRecords = (ownershipData ?? []) as {
    id: string;
    owner_name: string;
    owner_email: string;
    acquisition_type: string;
    acquired_at: string;
    sale_price: number | null;
    currency: string;
    is_current: boolean;
  }[];

  const currentOwner = ownershipRecords.find((r) => r.is_current) ?? null;

  const primary = company?.brand_primary_color || "#0A0A0B";
  const secondary = company?.brand_secondary_color || "#FAFAF8";
  const accent = company?.brand_accent_color || "#B8945D";

  const fontMap: Record<string, string> = {
    body: "system-ui,-apple-system,sans-serif",
    display: "'Instrument Serif',Georgia,serif",
    mono: "'JetBrains Mono',monospace",
  };
  const fontFamily = fontMap[company?.brand_font || "body"] || fontMap.body;

  return (
    <div style={{ backgroundColor: secondary, minHeight: "100vh", fontFamily }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: primary,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "contain" }}
            />
          ) : null}
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: secondary,
              letterSpacing: "-0.01em",
            }}
          >
            {company?.custom_header_text || company?.name || "Tagit"}
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: accent,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Tagit
        </span>
      </header>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 0 48px" }}>
        {/* Verification badge */}
        <div
          style={{
            margin: "0 20px",
            padding: "12px 16px",
            backgroundColor: "#DCEEE3",
            borderRadius: "0 0 12px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Shield size={16} color="#2D6A4F" strokeWidth={2} />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#2D6A4F" }}>
            Verified by Tagit
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: "11px",
              color: "#2D6A4F",
              letterSpacing: "0.05em",
            }}
          >
            {tag.short_id}
          </span>
        </div>

        {/* Tag status states */}
        {["created", "written", "shipped"].includes(tag.status) && (
          <NotRegisteredYet />
        )}

        {tag.status === "flagged" && <FlaggedItem />}
        {tag.status === "suspended" && <SuspendedItem />}

        {/* Product section */}
        {product && (
          <ProductSection
            product={product}
            industry={tag.industry}
            accent={accent}
            primary={primary}
            secondary={secondary}
          />
        )}

        {/* Provenance */}
        {ownershipRecords.length > 0 && (
          <ProvenanceSection records={ownershipRecords} accent={accent} />
        )}

        {/* Action section */}
        {product && (
          <ActionSection
            tag={tag}
            product={product}
            currentOwner={currentOwner}
            accent={accent}
            primary={primary}
            secondary={secondary}
          />
        )}

        {/* Tagit footer */}
        <div style={{ margin: "32px 20px 0", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#9E9EA3", margin: 0 }}>
            Authenticated by{" "}
            <span style={{ fontWeight: "600", color: "#6E6E73" }}>Tagit</span>
            {" "}— Identity infrastructure for luxury
          </p>
        </div>
      </div>

      {/* AI Voice Widget */}
      {company?.ai_enabled && (
        <VoiceWidget
          tagId={tag.id}
          personaName={company.ai_persona_name || "Assistant"}
          accentColor={accent}
          primaryColor={primary}
        />
      )}
    </div>
  );
}

function ProductSection({
  product,
  industry,
  accent,
  primary,
  secondary,
}: {
  product: {
    name: string;
    industry_fields: Record<string, string>;
    retail_price: number | null;
    currency: string;
    photos: string[];
  };
  industry: string;
  accent: string;
  primary: string;
  secondary: string;
}) {
  const fields = INDUSTRY_FIELDS[industry] ?? [];
  const filledFields = fields.filter(
    (f) => product.industry_fields[f.key] && String(product.industry_fields[f.key]).trim() !== ""
  );

  const priorityKeys: Record<string, string[]> = {
    fashion: ["primary_material", "made_in", "collection", "colorway", "size", "production_year"],
    arts: ["artist_name", "year_created", "medium", "edition_type", "edition_number", "dimensions"],
    collectibles: ["brand", "model_reference", "serial_number", "year", "condition_grade", "graded_by"],
  };

  const highlight = priorityKeys[industry] ?? [];
  const highlightFields = filledFields.filter((f) => highlight.includes(f.key));
  const otherFields = filledFields.filter((f) => !highlight.includes(f.key) && f.type !== "textarea");
  const storyFields = filledFields.filter((f) => f.type === "textarea");

  const photo = product.photos?.[0];

  return (
    <div style={{ margin: "20px" }}>
      {/* Product name */}
      <div
        style={{
          padding: "24px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          border: "1px solid #E8E2D5",
          marginBottom: "12px",
        }}
      >
        {photo && (
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "16px",
              backgroundColor: "#F5F2EC",
            }}
          >
            <img
              src={photo}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "26px",
            fontWeight: "700",
            color: "#0A0A0B",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </h1>

        {product.retail_price && (
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#6E6E73" }}>
            {product.currency} {product.retail_price.toLocaleString()}
          </p>
        )}

        {/* Key details grid */}
        {highlightFields.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              backgroundColor: "#E8E2D5",
              borderRadius: "8px",
              overflow: "hidden",
              marginTop: "16px",
            }}
          >
            {highlightFields.map((f) => (
              <div
                key={f.key}
                style={{
                  padding: "12px",
                  backgroundColor: "#FAFAF8",
                }}
              >
                <p style={{ margin: "0 0 2px", fontSize: "10px", color: "#9E9EA3", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {f.label}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#1F1F22", fontWeight: "500" }}>
                  {String(product.industry_fields[f.key])}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* More details */}
      {otherFields.length > 0 && (
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #E8E2D5",
            marginBottom: "12px",
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: "700", color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Details
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {otherFields.map((f) => (
                <tr key={f.key} style={{ borderBottom: "1px solid #F5F2EC" }}>
                  <td style={{ padding: "8px 0", fontSize: "12px", color: "#9E9EA3", width: "45%" }}>
                    {f.label}
                  </td>
                  <td style={{ padding: "8px 0", fontSize: "13px", color: "#1F1F22", fontWeight: "500" }}>
                    {String(product.industry_fields[f.key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Story / textarea fields */}
      {storyFields.map((f) =>
        product.industry_fields[f.key] ? (
          <div
            key={f.key}
            style={{
              padding: "20px 24px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #E8E2D5",
              marginBottom: "12px",
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "700", color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {f.label}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#4A4A4F", lineHeight: 1.6 }}>
              {String(product.industry_fields[f.key])}
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}

function ProvenanceSection({
  records,
  accent,
}: {
  records: {
    id: string;
    owner_name: string;
    acquisition_type: string;
    acquired_at: string;
    sale_price: number | null;
    currency: string;
    is_current: boolean;
  }[];
  accent: string;
}) {
  return (
    <div
      style={{
        margin: "0 20px 12px",
        padding: "20px 24px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #E8E2D5",
      }}
    >
      <p style={{ margin: "0 0 16px", fontSize: "11px", fontWeight: "700", color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Provenance
      </p>
      <div style={{ position: "relative" }}>
        {records.map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: "12px", marginBottom: i < records.length - 1 ? "0" : "0" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: r.is_current ? accent : "#C7C7CC",
                  flexShrink: 0,
                  marginTop: "4px",
                }}
              />
              {i < records.length - 1 && (
                <div style={{ width: "1px", flex: 1, backgroundColor: "#E8E2D5", margin: "4px 0" }} />
              )}
            </div>
            <div style={{ paddingBottom: i < records.length - 1 ? "16px" : "0" }}>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: "600", color: "#1F1F22" }}>
                {r.owner_name}
                {r.is_current && (
                  <span style={{ marginLeft: "6px", fontSize: "10px", padding: "1px 6px", backgroundColor: "#DCEEE3", color: "#2D6A4F", borderRadius: "99px", fontWeight: "600" }}>
                    Current
                  </span>
                )}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#9E9EA3" }}>
                {r.acquisition_type === "origin" ? "Original owner" : "Transfer"} ·{" "}
                {new Date(r.acquired_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {r.sale_price ? ` · ${r.currency} ${r.sale_price.toLocaleString()}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionSection({
  tag,
  product,
  currentOwner,
  accent,
  primary,
  secondary,
}: {
  tag: { id: string; status: string; short_id: string };
  product: { name: string };
  currentOwner: {
    id: string;
    owner_name: string;
    owner_email: string;
  } | null;
  accent: string;
  primary: string;
  secondary: string;
}) {
  const claimableStatuses = ["embedded", "activated", "unowned"];

  if (claimableStatuses.includes(tag.status)) {
    return (
      <div style={{ margin: "0 20px" }}>
        <ClaimForm tagId={tag.id} productName={product.name} accent={accent} primary={primary} />
      </div>
    );
  }

  if (tag.status === "claim_pending") {
    return (
      <div
        style={{
          margin: "0 20px",
          padding: "20px 24px",
          backgroundColor: "#FBE8D8",
          borderRadius: "12px",
          border: "1px solid #D4B68A",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Clock size={18} color="#B85C00" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "#B85C00" }}>
              Ownership claim pending
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#8B6F3F" }}>
              A claim is currently under review by the brand. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tag.status === "owned" && currentOwner) {
    return (
      <div style={{ margin: "0 20px" }}>
        <TransferForm
          tagId={tag.id}
          productName={product.name}
          currentOwnerEmail={currentOwner.owner_email}
          currentOwnerName={currentOwner.owner_name}
          accent={accent}
          primary={primary}
        />
      </div>
    );
  }

  if (tag.status === "transfer_pending") {
    return (
      <div
        style={{
          margin: "0 20px",
          padding: "20px 24px",
          backgroundColor: "#FBE8D8",
          borderRadius: "12px",
          border: "1px solid #D4B68A",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Clock size={18} color="#B85C00" style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "#B85C00" }}>
              Transfer in progress
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#8B6F3F" }}>
              Ownership of this item is currently being transferred.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function NotRegisteredYet() {
  return (
    <div
      style={{
        margin: "20px",
        padding: "24px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #E8E2D5",
        textAlign: "center",
      }}
    >
      <Clock size={32} color="#C7C7CC" style={{ margin: "0 auto 12px" }} />
      <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#1F1F22" }}>
        Not yet registered
      </p>
      <p style={{ margin: 0, fontSize: "13px", color: "#9E9EA3", lineHeight: 1.5 }}>
        This tag has not been registered to a product yet. If you recently purchased this item, please try again soon.
      </p>
    </div>
  );
}

function FlaggedItem() {
  return (
    <div
      style={{
        margin: "20px",
        padding: "20px 24px",
        backgroundColor: "#F9DDDD",
        borderRadius: "12px",
        border: "1px solid #F0C0C0",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <AlertTriangle size={18} color="#B85C5C" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "#B85C5C" }}>
            Item flagged for review
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#8B4040" }}>
            This item has been flagged and is under review.
          </p>
        </div>
      </div>
    </div>
  );
}

function SuspendedItem() {
  return (
    <div
      style={{
        margin: "20px",
        padding: "20px 24px",
        backgroundColor: "#F9DDDD",
        borderRadius: "12px",
        border: "1px solid #F0C0C0",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <ShieldX size={18} color="#B85C5C" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "#B85C5C" }}>
            Item suspended
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#8B4040" }}>
            This item has been suspended. Please contact the brand for more information.
          </p>
        </div>
      </div>
    </div>
  );
}

function InvalidPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "360px", textAlign: "center" }}>
        <ShieldX size={48} color="#B85C5C" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "700", color: "#0A0A0B" }}>
          Authentication failed
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#6E6E73", lineHeight: 1.6 }}>
          This tag could not be authenticated. It may have been tampered with or is not a genuine Tagit tag.
        </p>
        <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#9E9EA3" }}>Powered by Tagit</p>
      </div>
    </div>
  );
}
