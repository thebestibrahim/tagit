export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "crypto";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ShieldX, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { INDUSTRY_FIELDS, resolveField, inferIndustry } from "@/lib/industry-fields";
import ClaimForm from "./ClaimForm";
import ActionShell from "./ActionShell";
import VoiceWidget from "./VoiceWidget";
import CollapsibleSection from "./CollapsibleSection";
import LocalTime from "@/components/ui/LocalTime";
import ProductGallery from "@/components/consumer/ProductGallery";
import { getFlagsForConsumerPage } from "@/lib/feature-flags/server";
import { releaseExpiredClaims } from "@/lib/claims";
import { getSiblingTagIds } from "@/lib/tags";

const admin = createAdminClient();

function validateHmac(token: string, signature: string) {
  try {
    const expected = createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
      .update(token)
      .digest("hex");
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

async function logScan(tagId: string, result: string, headerStore: Awaited<ReturnType<typeof headers>>) {
  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;

  // Country/region/city are provided by Vercel's edge network (derived from the
  // request IP) — country/region level only, no GPS, no third-party GeoIP. The
  // 2-letter country code is mapped to a full name at display time. Absent in
  // local dev, so geo_location is null there.
  const country = headerStore.get("x-vercel-ip-country");
  const region = headerStore.get("x-vercel-ip-country-region");
  const city = headerStore.get("x-vercel-ip-city");
  const geo =
    country || region || city
      ? {
          country: country ?? null,
          region: region ?? null,
          city: city ? decodeURIComponent(city) : null,
        }
      : null;

  await admin.from("scan_logs").insert({
    tag_id: tagId,
    ip_address: ip,
    user_agent: userAgent,
    scan_result: result,
    geo_location: geo,
  }).then(() => {});
}

type OwnershipRecord = {
  id: string;
  owner_name: string;
  owner_email: string;
  acquisition_type: string;
  acquired_at: string;
  sale_price: number | null;
  currency: string;
  is_current: boolean;
};

type Product = {
  id: string;
  name: string;
  industry_fields: Record<string, string>;
  retail_price: number | null;
  currency: string;
  photos: string[];
};

export default async function ScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const headerStore = await headers();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tagData } = await (admin as any)
    .from("tags")
    .select("id, token, short_id, status, company_id, industry, hmac_signature, product_id")
    .eq("token", token)
    .single();

  if (!tagData) notFound();

  const tag = tagData as {
    id: string;
    token: string;
    short_id: string;
    status: string;
    company_id: string;
    industry: string;
    hmac_signature: string;
    product_id: string | null;
  };

  // HMAC is used for the "Verified Authentic" badge only — it is NOT a page gate.
  // nanoid(21) tokens have 126 bits of entropy, making them impossible to guess.
  // Blocking the page on HMAC failure silently breaks tags whenever the secret
  // rotates or a deployment race occurs, which is far worse than showing the page.
  const hmacValid = process.env.TAGIT_HMAC_SECRET
    ? validateHmac(tag.token, tag.hmac_signature)
    : false;

  // Fire scan log without blocking page render
  logScan(tag.id, hmacValid ? "valid" : "unverified", headerStore);

  // Ownership is unified across the product's tag group (multiple chips on one
  // item). Resolve the sibling tags, then expire any lapsed pending claims so a
  // scan re-offers the claim form instead of showing a stale "pending" banner.
  const siblingIds = await getSiblingTagIds(admin, tag);
  await releaseExpiredClaims(admin, siblingIds);

  // Split company into two queries — stable columns first, then migration-dependent columns.
  // This way a missing DB column (migration not yet run) never breaks the scan page.
  const [
    { data: productData },
    { data: companyBase },
    { data: companyExt },
    { data: ownershipData },
    { data: activeTransferData },
    { data: pendingClaimData },
    scanPageFlags,
  ] = await Promise.all([
    tag.product_id
      ? admin
          .from("products")
          .select("id, name, industry_fields, retail_price, currency, photos")
          .eq("id", tag.product_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("companies")
      .select("id, name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_font, brand_story, custom_header_text, social_links, ai_enabled, ai_persona_name")
      .eq("id", tag.company_id)
      .single(),
    admin
      .from("companies")
      .select("brand_text_color, brand_template")
      .eq("id", tag.company_id)
      .single()
      .then((r) => ({ data: r.error ? null : r.data })),
    // Ownership chain resolves across the whole product group, not one tag.
    admin
      .from("ownership_records")
      .select("id, owner_name, owner_email, acquisition_type, acquired_at, sale_price, currency, is_current")
      .in("tag_id", siblingIds)
      .order("acquired_at", { ascending: true }),
    // Pending transfer is derived from an awaiting_acceptance row on any sibling
    // tag — not from a tag state.
    admin
      .from("transfer_requests")
      .select("id, to_name, to_email")
      .in("tag_id", siblingIds)
      .eq("status", "awaiting_acceptance")
      .limit(1),
    // A pending first-ownership claim (any sibling tag) — the tag stays `live`
    // during the 24h manual-review window; expired ones were just released.
    admin
      .from("ownership_claims")
      .select("id")
      .in("tag_id", siblingIds)
      .eq("status", "pending")
      .limit(1),
    // brandId comes from tag.company_id — consumer is not authenticated
    getFlagsForConsumerPage(tag.company_id),
  ]);

  const product = productData as Product | null;

  const companyData = companyBase
    ? {
        ...companyBase,
        brand_text_color: (companyExt as { brand_text_color?: string } | null)?.brand_text_color ?? "#FAFAF8",
        brand_template:   (companyExt as { brand_template?: string }   | null)?.brand_template   ?? "classic",
      }
    : null;

  const company = companyData as {
    id: string;
    name: string;
    logo_url: string | null;
    brand_primary_color: string;
    brand_secondary_color: string;
    brand_accent_color: string;
    brand_text_color: string;
    brand_font: string;
    brand_template: string;
    brand_story: string | null;
    custom_header_text: string | null;
    social_links: Record<string, string>;
    ai_enabled: boolean;
    ai_persona_name: string | null;
  } | null;

  const ownershipRecords = (ownershipData ?? []) as OwnershipRecord[];
  const currentOwner = ownershipRecords.find((r) => r.is_current) ?? null;
  const activeTransfer = ((activeTransferData ?? []) as { id: string; to_name: string; to_email: string }[])[0] ?? null;
  const hasPendingClaim = ((pendingClaimData ?? []) as { id: string }[]).length > 0;

  const primary = company?.brand_primary_color || "#0A0A0B";
  const accent = company?.brand_accent_color || "#B8945D";
  const textColor = company?.brand_text_color || "#FAFAF8";

  const fontMap: Record<string, string> = {
    body: "system-ui,-apple-system,sans-serif",
    display: "'Instrument Serif',Georgia,serif",
    mono: "'JetBrains Mono',monospace",
  };
  const fontFamily = fontMap[company?.brand_font || "body"] || fontMap.body;

  return (
    <div style={{ backgroundColor: "#FAFAF8", minHeight: "100vh", fontFamily }}>
      {/* Brand header */}
      <header style={{ backgroundColor: primary }}>
        <div
          style={{
            padding: "14px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {company?.logo_url && (
              <Image
                src={company.logo_url}
                alt=""
                width={28}
                height={28}
                style={{ borderRadius: 4, objectFit: "contain", opacity: 0.9 }}
              />
            )}
            <span
              style={{
                fontFamily: "'Instrument Serif',Georgia,serif",
                fontSize: 20,
                fontStyle: "italic",
                color: textColor,
                letterSpacing: "-0.02em",
              }}
            >
              {company?.custom_header_text || company?.name || "Tagit"}
            </span>
          </div>
          <div
            style={{
              padding: "3px 10px 3px 7px",
              border: `1px solid ${accent}50`,
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: accent }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8,
                color: accent,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Tagit
            </span>
          </div>
        </div>

        {/* Verified strip */}
        <div
          style={{
            padding: "7px 20px",
            backgroundColor: hmacValid ? "rgba(45,106,79,0.22)" : "rgba(184,148,93,0.12)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {hmacValid ? (
              <ShieldCheck size={11} color="#4ADE80" strokeWidth={2.5} />
            ) : (
              <ShieldCheck size={11} color="#B8945D" strokeWidth={2.5} />
            )}
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                color: hmacValid ? "#4ADE80" : "#B8945D",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {hmacValid ? "Verified Authentic · HMAC Signed" : "Tagit Registered"}
            </span>
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: hmacValid ? "#4ADE80" : "#B8945D",
              opacity: 0.6,
              letterSpacing: "0.08em",
            }}
          >
            #{tag.short_id}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 24, paddingBottom: 96 }}>
        {/* Status edge cases. A `created`/`shipped` tag has no product yet — show
            the branded placeholder. `flagged`/`suspended` show their notices. */}
        {["created", "shipped"].includes(tag.status) && <NotRegisteredYet />}
        {tag.status === "flagged" && <FlaggedItem />}
        {tag.status === "suspended" && <SuspendedItem />}

        {product ? (
          <>
            <ProductSection
              product={product}
              industry={tag.industry}
              accent={accent}
              ownershipRecords={ownershipRecords}
              template={company?.brand_template || "classic"}
            />

            <ActionSection
              tag={tag}
              product={product}
              currentOwner={currentOwner}
              activeTransfer={activeTransfer}
              hasPendingClaim={hasPendingClaim}
              accent={accent}
              primary={primary}
            />
          </>
        ) : (
          !["created", "shipped", "flagged", "suspended"].includes(tag.status) && (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#9E9EA3" }}>No product registered to this tag yet.</p>
            </div>
          )
        )}

        {/* Social links */}
        {company && Object.values(company.social_links ?? {}).some(Boolean) && (
          <div style={{ padding: "32px 24px 0", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {company.social_links?.website && (
              <a
                href={company.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: "1px solid #E8E2D5",
                  backgroundColor: "#fff",
                  fontSize: 12,
                  color: "#1F1F22",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website
              </a>
            )}
            {company.social_links?.instagram && (
              <a
                href={company.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: "1px solid #E8E2D5",
                  backgroundColor: "#fff",
                  fontSize: 12,
                  color: "#1F1F22",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                Instagram
              </a>
            )}
            {company.social_links?.twitter && (
              <a
                href={company.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: "1px solid #E8E2D5",
                  backgroundColor: "#fff",
                  fontSize: 12,
                  color: "#1F1F22",
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "-0.003em",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.256 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                X / Twitter
              </a>
            )}
          </div>
        )}

        {/* Tagit footer */}
        <div style={{ padding: "32px 24px 0", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginBottom: 8,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D" }} />
            <span
              style={{
                fontFamily: "'Instrument Serif',Georgia,serif",
                fontSize: 15,
                fontStyle: "italic",
                color: "#0A0A0B",
                letterSpacing: "-0.02em",
              }}
            >
              Tagit
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: "#C7C7CC",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Identity Infrastructure for Physical Luxury
          </p>
        </div>
      </div>

      {company?.ai_enabled && scanPageFlags.ai_persona && (
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

function ProvenanceCollapsible({ ownershipRecords, accent }: { ownershipRecords: OwnershipRecord[]; accent: string }) {
  if (!ownershipRecords.length) return null;
  return (
    <CollapsibleSection title="Provenance" badge={String(ownershipRecords.length)} defaultOpen>
      <div style={{ padding: "4px 24px 20px" }}>
        {ownershipRecords.map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: r.is_current ? accent : "#D4D4D4", flexShrink: 0, marginTop: 4 }} />
              {i < ownershipRecords.length - 1 && (
                <div style={{ width: 1, flex: 1, backgroundColor: "#E8E2D5", margin: "4px 0" }} />
              )}
            </div>
            <div style={{ paddingBottom: i < ownershipRecords.length - 1 ? 16 : 0 }}>
              <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: r.is_current ? 600 : 500, color: r.is_current ? "#1F1F22" : "#6E6E73", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {r.owner_name}
                {r.is_current && (
                  <span style={{ fontSize: 9, padding: "2px 7px", backgroundColor: "#DCEEE3", color: "#2D6A4F", borderRadius: 99, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Current
                  </span>
                )}
              </p>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.04em" }}>
                {r.acquisition_type === "origin" ? "Brand origin" : "Transfer"} ·{" "}
                <LocalTime iso={r.acquired_at} pattern="d MMM yyyy" />
                {r.sale_price ? ` · ${r.currency} ${r.sale_price.toLocaleString()}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function ProductSection({
  product,
  industry,
  accent,
  ownershipRecords,
  template,
}: {
  product: Product;
  industry: string;
  accent: string;
  ownershipRecords: OwnershipRecord[];
  template: string;
}) {
  // Derive fields from what's actually stored — never from the tag's industry
  // alone — so content is never silently dropped when the tag's industry has no
  // schema or differs from the one the product was entered under (see resolveField).
  const stored = product.industry_fields ?? {};
  const storedKeys = Object.keys(stored).filter((k) => String(stored[k] ?? "").trim() !== "");
  const effectiveIndustry = inferIndustry(storedKeys, industry);
  const schemaKeys = (INDUSTRY_FIELDS[effectiveIndustry] ?? []).map((f) => f.key);
  // Schema-ordered keys that have values first, then any remaining stored keys.
  const orderedKeys = [
    ...schemaKeys.filter((k) => storedKeys.includes(k)),
    ...storedKeys.filter((k) => !schemaKeys.includes(k)),
  ];
  const filledFields = orderedKeys.map(resolveField);

  const priorityKeys: Record<string, string[]> = {
    fashion: ["primary_material", "made_in", "collection", "colorway", "size", "production_year"],
    arts: ["artist_name", "year_created", "medium", "edition_type", "edition_number", "dimensions"],
    collectibles: ["brand", "model_reference", "serial_number", "year", "condition_grade", "graded_by"],
  };

  const highlight = priorityKeys[effectiveIndustry] ?? [];
  const highlightFields = filledFields.filter((f) => highlight.includes(f.key)).slice(0, 6);
  const detailFields = filledFields.filter((f) => !highlight.includes(f.key) && f.type !== "textarea");
  const storyFields = filledFields.filter((f) => f.type === "textarea" && product.industry_fields[f.key]);
  const hasPhotos = (product.photos?.length ?? 0) > 0;
  const industryLabel = effectiveIndustry ? effectiveIndustry.charAt(0).toUpperCase() + effectiveIndustry.slice(1) : "Product";

  // ── MINIMAL ───────────────────────────────────────────────────────────────
  if (template === "minimal") {
    return (
      <>
        {hasPhotos && (
          <div style={{ padding: "0 24px" }}>
            <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ aspectRatio: "1/1", objectFit: "contain", padding: 20 }} />
          </div>
        )}
        <div style={{ padding: "24px 24px 0" }}>
          <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 34, fontWeight: 400, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 8px" }}>
            {product.name}
          </h1>
          {product.retail_price && (
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9E9EA3", letterSpacing: "0.06em", margin: "0 0 20px" }}>
              {product.currency} {product.retail_price.toLocaleString()}
            </p>
          )}
          {highlightFields.slice(0, 3).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {highlightFields.slice(0, 3).map((f) => (
                <div key={f.key} style={{ padding: "6px 12px", backgroundColor: "#F5F2EC", borderRadius: 99, border: "1px solid #EDE8DF" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label} </span>
                  <span style={{ fontSize: 12, color: "#1F1F22", fontWeight: 500 }}>{String(product.industry_fields[f.key])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {ownershipRecords.length > 0 && (
          <div style={{ margin: "20px 24px 0", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E8E2D5", overflow: "hidden" }}>
            <ProvenanceCollapsible ownershipRecords={ownershipRecords} accent={accent} />
          </div>
        )}
      </>
    );
  }

  // ── EDITORIAL ─────────────────────────────────────────────────────────────
  if (template === "editorial") {
    const firstStory = storyFields[0];
    return (
      <>
        <div style={{ padding: "28px 24px 0" }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: accent, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 12px" }}>
            {industryLabel}
          </p>
          <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 38, fontWeight: 400, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 20px" }}>
            {product.name}
          </h1>
          {firstStory && (
            <p style={{ fontSize: 15, color: "#4A4A4F", lineHeight: 1.78, letterSpacing: "-0.003em", margin: "0 0 24px", whiteSpace: "pre-wrap" }}>
              {String(product.industry_fields[firstStory.key])}
            </p>
          )}
          {hasPhotos && (
            <div style={{ marginBottom: 24 }}>
              <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ height: 280, objectFit: "cover" }} />
            </div>
          )}
          {highlightFields.length > 0 && (
            <div style={{ borderTop: "1px solid #F0EDE8" }}>
              {highlightFields.map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0EDE8", gap: 16 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{f.label}</span>
                  <span style={{ fontSize: 13, color: "#1F1F22", fontWeight: 500, textAlign: "right", lineHeight: 1.4 }}>{String(product.industry_fields[f.key])}</span>
                </div>
              ))}
            </div>
          )}
          {product.retail_price && (
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9E9EA3", letterSpacing: "0.06em", margin: "16px 0 0" }}>
              {product.currency} {product.retail_price.toLocaleString()}
            </p>
          )}
        </div>
        {(detailFields.length > 0 || storyFields.length > 1 || ownershipRecords.length > 0) && (
          <div style={{ margin: "24px 24px 0", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E8E2D5", overflow: "hidden" }}>
            {detailFields.length > 0 && (
              <CollapsibleSection title="Details" badge={String(detailFields.length)}>
                <div style={{ padding: "4px 24px 20px" }}>
                  {detailFields.map((f, i) => (
                    <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < detailFields.length - 1 ? "1px solid #F5F2EC" : "none", gap: 12 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{f.label}</span>
                      <span style={{ fontSize: 12, color: "#1F1F22", fontWeight: 500, textAlign: "right", lineHeight: 1.5 }}>{String(product.industry_fields[f.key])}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
            {storyFields.slice(1).map((f) => (
              <CollapsibleSection key={f.key} title={f.label}>
                <div style={{ padding: "4px 24px 20px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#4A4A4F", lineHeight: 1.78, letterSpacing: "-0.003em", whiteSpace: "pre-wrap" }}>{String(product.industry_fields[f.key])}</p>
                </div>
              </CollapsibleSection>
            ))}
            <ProvenanceCollapsible ownershipRecords={ownershipRecords} accent={accent} />
          </div>
        )}
      </>
    );
  }

  // ── CLASSIC (default) ─────────────────────────────────────────────────────
  const hasCollapsible = detailFields.length > 0 || storyFields.length > 0 || ownershipRecords.length > 0;
  return (
    <>
      {hasPhotos && (
        <div style={{ padding: "0 24px" }}>
          <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ height: 340, objectFit: "contain", padding: "16px" }} />
        </div>
      )}
      <div style={{ padding: "24px 24px 0" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: accent, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 10px" }}>
          {industryLabel}
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 30, fontWeight: 400, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 10px" }}>
          {product.name}
        </h1>
        {product.retail_price && (
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#9E9EA3", letterSpacing: "0.06em", margin: "0 0 20px" }}>
            {product.currency} {product.retail_price.toLocaleString()}
          </p>
        )}
        {highlightFields.length > 0 && (
          <div style={{ borderTop: "1px solid #F0EDE8" }}>
            {highlightFields.map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F0EDE8", gap: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: "#1F1F22", fontWeight: 500, textAlign: "right", lineHeight: 1.4 }}>{String(product.industry_fields[f.key])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {hasCollapsible && (
        <div style={{ margin: "20px 24px 0", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #E8E2D5", overflow: "hidden" }}>
          {detailFields.length > 0 && (
            <CollapsibleSection title="Details" badge={String(detailFields.length)}>
              <div style={{ padding: "4px 24px 20px" }}>
                {detailFields.map((f, i) => (
                  <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: i < detailFields.length - 1 ? "1px solid #F5F2EC" : "none", gap: 12 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0, paddingTop: 2 }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: "#1F1F22", fontWeight: 500, textAlign: "right", lineHeight: 1.5 }}>{String(product.industry_fields[f.key])}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
          {storyFields.map((f) => (
            <CollapsibleSection key={f.key} title={f.label}>
              <div style={{ padding: "4px 24px 20px" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#4A4A4F", lineHeight: 1.78, letterSpacing: "-0.003em", whiteSpace: "pre-wrap" }}>{String(product.industry_fields[f.key])}</p>
              </div>
            </CollapsibleSection>
          ))}
          <ProvenanceCollapsible ownershipRecords={ownershipRecords} accent={accent} />
        </div>
      )}
    </>
  );
}

function ActionSection({
  tag,
  product,
  currentOwner,
  activeTransfer,
  hasPendingClaim,
  accent,
  primary,
}: {
  tag: { id: string; status: string; short_id: string };
  product: { name: string };
  currentOwner: OwnershipRecord | null;
  activeTransfer: { id: string; to_name: string; to_email: string } | null;
  hasPendingClaim: boolean;
  accent: string;
  primary: string;
}) {
  // A `live` tag is claimable — unless a first-ownership claim is already
  // pending its 24h auto-confirm, in which case we show the pending banner.
  if (tag.status === "live" && !hasPendingClaim) {
    return (
      <div style={{ margin: "16px 24px 0" }}>
        <div
          style={{
            padding: "20px 24px 24px",
            backgroundColor: "#fff",
            borderRadius: 16,
            border: "1px solid #E8E2D5",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: accent,
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  color: accent,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Unclaimed
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Instrument Serif',Georgia,serif",
                fontSize: 20,
                fontStyle: "italic",
                color: "#0A0A0B",
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              Claim this piece
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#6E6E73",
                margin: 0,
                lineHeight: 1.6,
                letterSpacing: "-0.003em",
              }}
            >
              Register ownership and join the permanent provenance record.
            </p>
          </div>
          <ClaimForm
            tagId={tag.id}
            productName={product.name}
            accent={accent}
            primary={primary}
          />
        </div>
      </div>
    );
  }

  if (tag.status === "live" && hasPendingClaim) {
    return (
      <div style={{ margin: "16px 24px 0" }}>
        <div
          style={{
            padding: "18px 20px",
            backgroundColor: "#FBE8D8",
            borderRadius: 12,
            border: "1px solid #E8C99A",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <Clock size={16} color="#B85C00" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p
              style={{
                margin: "0 0 3px",
                fontSize: 13,
                fontWeight: 600,
                color: "#B85C00",
              }}
            >
              Ownership claim pending
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#8B6F3F", lineHeight: 1.55 }}>
              A claim has been submitted and confirms automatically within 24 hours
              unless the brand objects.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Owner actions for an item that has an owner (claimed → `owned`, or acquired
  // via a prior transfer → `transferred`). A pending onward transfer is derived
  // from activeTransfer, not from a tag state.
  if (["owned", "transferred"].includes(tag.status) && currentOwner) {
    return (
      <ActionShell
        tagId={tag.id}
        hasPendingTransfer={!!activeTransfer}
        currentOwner={{
          owner_name: currentOwner.owner_name,
          owner_email: currentOwner.owner_email,
          currency: currentOwner.currency,
        }}
        activeTransfer={activeTransfer}
        accent={accent}
        primary={primary}
      />
    );
  }

  return null;
}

function NotRegisteredYet() {
  return (
    <div
      style={{
        margin: "24px 24px 0",
        padding: "32px 24px",
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid #E8E2D5",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "#F5F2EC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <Clock size={18} color="#C7C7CC" />
      </div>
      <p
        style={{
          margin: "0 0 6px",
          fontFamily: "'Instrument Serif',Georgia,serif",
          fontSize: 18,
          fontStyle: "italic",
          color: "#1F1F22",
          letterSpacing: "-0.02em",
        }}
      >
        Not yet registered
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "#9E9EA3", lineHeight: 1.6 }}>
        This tag has not been registered to a product yet.
      </p>
    </div>
  );
}

function FlaggedItem() {
  return (
    <div
      style={{
        margin: "24px 24px 0",
        padding: "18px 20px",
        backgroundColor: "#F9DDDD",
        borderRadius: 12,
        border: "1px solid #F0C0C0",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <AlertTriangle size={16} color="#B85C5C" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#B85C5C" }}>
          Item flagged for review
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#8B4040", lineHeight: 1.55 }}>
          This item has been flagged and is under review.
        </p>
      </div>
    </div>
  );
}

function SuspendedItem() {
  return (
    <div
      style={{
        margin: "24px 24px 0",
        padding: "18px 20px",
        backgroundColor: "#F9DDDD",
        borderRadius: 12,
        border: "1px solid #F0C0C0",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <ShieldX size={16} color="#B85C5C" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#B85C5C" }}>
          Item suspended
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#8B4040", lineHeight: 1.55 }}>
          This item has been suspended. Contact the brand for more information.
        </p>
      </div>
    </div>
  );
}

