export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { readInfoCode, recordInfoScan } from "@/lib/exhibitions-server";
import { resolvePalette, resolveBaseFont, normalizePhone } from "@/lib/brand-page";
import { getFlagsForConsumerPage } from "@/lib/feature-flags/server";
import ProductGallery from "@/components/consumer/ProductGallery";
import InfoChat from "./InfoChat";

// Public exhibition info page. A calm, editorial REFERENCE page — deliberately
// distinct from the Verified Authentic chip scan page (/v/[token]). It shows
// only the product's registration fields and never any ownership data, and it
// carries no verification badges or security iconography of any kind.
//
// This file is intentionally separate from app/v/[token]: ownership-rendering
// code must never live in the same file as this page.

export default async function InfoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await readInfoCode(token);

  // ── Expired / inactive / unknown ──────────────────────────────────────────
  if (result.status !== "active") {
    return <ExpiredState brandSlug={result.brandSlug} brandName={result.brandName} />;
  }

  // Count + log the scan (source: qr_exhibition). Fire-and-forget.
  const headerStore = await headers();
  recordInfoScan(result.codeId, result.scanCount, headerStore);

  const { product, brand } = result;
  const palette = resolvePalette({
    brand_primary_color: brand.brand_primary_color,
    brand_secondary_color: brand.brand_secondary_color,
    brand_accent_color: brand.brand_accent_color,
    brand_text_color: brand.brand_text_color,
  });
  const fontFamily = resolveBaseFont(brand.brand_font);

  const flags = await getFlagsForConsumerPage(result.companyId);
  const showChat = brand.ai_enabled && flags.ai_persona;

  const phone = normalizePhone(brand.whatsapp_number);
  const enquiryText = `Hello, I came across "${product.name}" at an exhibition by ${brand.name} and I would like to enquire about this piece.`;
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(enquiryText)}` : null;

  return (
    <div style={{ backgroundColor: palette.background, minHeight: "100vh", fontFamily }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 96px" }}>
        {/* Brand + persistent reference badge */}
        <div style={{ padding: "28px 24px 0" }}>
          {brand.logo_url && (
            <Image
              src={brand.logo_url}
              alt=""
              width={36}
              height={36}
              style={{ borderRadius: 6, objectFit: "contain", marginBottom: 16, opacity: 0.95 }}
            />
          )}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              gap: 2,
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: palette.badgeBg,
              border: `1px solid ${palette.divider}`,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: palette.badgeText,
              }}
            >
              Reference Information Only
            </span>
            <span style={{ fontSize: 11, color: palette.textSecondary }}>
              Not a verification of authenticity
            </span>
          </div>
        </div>

        {/* Photo */}
        {product.photos.length > 0 && (
          <div style={{ padding: "24px 24px 0" }}>
            <ProductGallery
              photos={product.photos}
              alt={product.name}
              accent={palette.accent}
              frame={{ height: 320, objectFit: "contain", padding: 16 }}
            />
          </div>
        )}

        {/* Name + brand */}
        <div style={{ padding: "24px 24px 0" }}>
          <h1
            style={{
              fontFamily: "'Instrument Serif',Georgia,serif",
              fontSize: 34,
              fontWeight: 400,
              fontStyle: "italic",
              color: palette.textPrimary,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              margin: "0 0 6px",
            }}
          >
            {product.name}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: palette.textSecondary }}>{brand.name}</p>
        </div>

        {/* Specs */}
        {product.specs.length > 0 && (
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ borderTop: `1px solid ${palette.divider}` }}>
              {product.specs.map((s) => (
                <div
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "10px 0",
                    borderBottom: `1px solid ${palette.divider}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: palette.textSecondary,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    {s.label}
                  </span>
                  <span style={{ fontSize: 13, color: palette.textPrimary, fontWeight: 500, textAlign: "right", lineHeight: 1.4 }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stories (artist statement, story, …) */}
        {product.stories.map((s) => (
          <div key={s.key} style={{ padding: "24px 24px 0" }}>
            <p
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                color: palette.accent,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: palette.textPrimary,
                lineHeight: 1.78,
                letterSpacing: "-0.003em",
                whiteSpace: "pre-wrap",
                opacity: 0.92,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}

        {/* AI chat — only when enabled for the brand */}
        {showChat && (
          <div style={{ padding: "28px 24px 0" }}>
            <InfoChat
              token={token}
              personaName={brand.ai_persona_name || "Gallery Guide"}
              accent={palette.accent}
              textPrimary={palette.textPrimary}
              textSecondary={palette.textSecondary}
              background={palette.background}
              onAccent={palette.onAccent}
              divider={palette.divider}
            />
          </div>
        )}

        {/* WhatsApp enquiry CTA */}
        {whatsappUrl && (
          <div style={{ padding: "20px 24px 0" }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "15px 20px",
                borderRadius: 12,
                backgroundColor: palette.accent,
                color: palette.onAccent,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Enquire About This Piece →
            </a>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "36px 24px 0", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: palette.textSecondary,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Powered by Tagit
          </p>
        </div>
      </div>
    </div>
  );
}

function ExpiredState({ brandSlug, brandName }: { brandSlug: string | null; brandName: string | null }) {
  return (
    <div
      style={{
        backgroundColor: "#FAFAF8",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}
    >
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Instrument Serif',Georgia,serif",
            fontSize: 24,
            fontStyle: "italic",
            color: "#0A0A0B",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}
        >
          This code is no longer active.
        </p>
        <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.6, margin: 0 }}>
          The information for this piece is no longer available here.
        </p>

        {brandSlug && (
          <Link
            href={`/${brandSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 24,
              padding: "12px 20px",
              borderRadius: 99,
              border: "1px solid #E8E2D5",
              backgroundColor: "#fff",
              fontSize: 13,
              color: "#1F1F22",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View {brandName ? `${brandName}'s` : "the"} full collection →
          </Link>
        )}

        <p
          style={{
            margin: "32px 0 0",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9,
            color: "#C7C7CC",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Powered by Tagit
        </p>
      </div>
    </div>
  );
}
