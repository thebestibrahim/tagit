export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import Link from "next/link";
import { readInfoCode, recordInfoScan } from "@/lib/exhibitions-server";
import { resolvePalette, resolveBaseFont, normalizePhone, type BrandColors } from "@/lib/brand-page";
import { getFlagsForConsumerPage } from "@/lib/feature-flags/server";
import InfoGallery from "./InfoGallery";
import InfoChat from "./InfoChat";

// Public exhibition info page. A calm, editorial REFERENCE placard — deliberately
// distinct from the Verified Authentic chip scan page (/v/[token]). It shows
// only the product's registration fields, never any ownership data, and carries
// no verification badges or security iconography of any kind. Every surface is
// derived from the brand's palette, so the page reads correctly in any shade.
//
// Intentionally separate from app/v/[token]: ownership-rendering code must never
// live in the same file as this page.

const DISPLAY = "'Instrument Serif', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// Relative luminance of a hex colour → decide whether the page reads as light.
function isLightHex(hex: string): boolean {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return true;
  const int = parseInt(full, 16);
  const ch = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] > 0.42;
}

// A subtly lifted card surface that works on light OR dark backgrounds.
function surfaceFor(light: boolean): string {
  return light ? "#FFFFFF" : "rgba(255,255,255,0.045)";
}

// The recurring gold lozenge motif (a small rotated square).
function Lozenge({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        transform: "rotate(45deg)",
        flexShrink: 0,
      }}
    />
  );
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await readInfoCode(token);

  if (result.status !== "active") {
    const theme: BrandColors = {
      brand_primary_color: result.theme?.brand_primary_color ?? null,
      brand_secondary_color: result.theme?.brand_secondary_color ?? null,
      brand_accent_color: result.theme?.brand_accent_color ?? null,
      brand_text_color: result.theme?.brand_text_color ?? null,
    };
    return (
      <ExpiredState
        brandSlug={result.brandSlug}
        brandName={result.brandName}
        logoUrl={result.theme?.logo_url ?? null}
        palette={resolvePalette(theme)}
        fontFamily={resolveBaseFont(result.theme?.brand_font)}
      />
    );
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
  const light = isLightHex(palette.background);
  const surface = surfaceFor(light);

  const flags = await getFlagsForConsumerPage(result.companyId);
  const showChat = brand.ai_enabled && flags.ai_persona;

  const phone = normalizePhone(brand.whatsapp_number);
  const enquiryText = `Hello, I came across "${product.name}" at an exhibition by ${brand.name} and I would like to enquire about this piece.`;
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(enquiryText)}` : null;

  return (
    <div style={{ backgroundColor: palette.background, minHeight: "100vh", fontFamily }}>
      <article style={{ maxWidth: 520, margin: "0 auto", padding: "0 22px 64px" }}>
        {/* ── Top bar: brand logo + persistent reference marker ── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "26px 0 28px",
          }}
        >
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary brand logo dimensions
            <img
              src={brand.logo_url}
              alt={brand.name}
              style={{ height: 34, width: "auto", maxWidth: 160, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 22, color: palette.textPrimary, letterSpacing: "-0.02em" }}>
              {brand.name}
            </span>
          )}

          {/* Persistent, calm "Reference" marker — never a verification badge. */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 11px",
              borderRadius: 999,
              border: `1px solid ${palette.divider}`,
              backgroundColor: palette.badgeBg,
            }}
          >
            <Lozenge color={palette.accent} size={5} />
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.badgeText }}>
              Reference
            </span>
          </span>
        </header>

        {/* ── Matted hero ── */}
        {product.photos.length > 0 && (
          <InfoGallery
            photos={product.photos}
            alt={product.name}
            surface={surface}
            hairline={palette.divider}
            accent={palette.accent}
            muted={palette.textSecondary}
          />
        )}

        {/* ── Title block ── */}
        <div style={{ paddingTop: product.photos.length > 0 ? 30 : 8 }}>
          <h1
            style={{
              fontFamily: DISPLAY,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(34px, 9vw, 46px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              color: palette.textPrimary,
              margin: 0,
            }}
          >
            {product.name}
          </h1>
          <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.textSecondary }}>
            {brand.name}
          </p>
        </div>

        {/* Gold hairline with the lozenge motif */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "30px 0" }} aria-hidden>
          <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
          <Lozenge color={palette.accent} />
          <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
        </div>

        {/* ── Specs (museum placard data) ── */}
        {product.specs.length > 0 && (
          <dl style={{ margin: 0 }}>
            {product.specs.map((s, i) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "13px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${palette.divider}`,
                }}
              >
                <dt style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.textSecondary, flexShrink: 0 }}>
                  {s.label}
                </dt>
                <dd style={{ margin: 0, fontSize: 14.5, color: palette.textPrimary, textAlign: "right", lineHeight: 1.45 }}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* ── Stories (artist statement, etc.) ── */}
        {product.stories.map((s) => (
          <section key={s.key} style={{ marginTop: 40 }}>
            <p style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 14px" }}>
              <Lozenge color={palette.accent} size={5} />
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.accent }}>
                {s.label}
              </span>
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontSize: 20,
                lineHeight: 1.62,
                letterSpacing: "-0.005em",
                color: palette.textPrimary,
                whiteSpace: "pre-wrap",
              }}
            >
              {s.value}
            </p>
          </section>
        ))}

        {/* ── AI chat ── */}
        {showChat && (
          <div style={{ marginTop: 40 }}>
            <InfoChat
              token={token}
              personaName={brand.ai_persona_name || "Gallery Guide"}
              accent={palette.accent}
              textPrimary={palette.textPrimary}
              textSecondary={palette.textSecondary}
              background={palette.background}
              surface={surface}
              onAccent={palette.onAccent}
              divider={palette.divider}
            />
          </div>
        )}

        {/* ── Enquiry CTA ── */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="info-cta"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 40,
              padding: "16px 22px",
              backgroundColor: palette.accent,
              color: palette.onAccent,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 3,
            }}
          >
            Enquire about this piece →
          </a>
        )}

        {/* ── Persistent disclaimer ── */}
        <p
          style={{
            margin: "34px 0 0",
            textAlign: "center",
            fontSize: 11.5,
            lineHeight: 1.6,
            color: palette.textSecondary,
          }}
        >
          Reference information only.
          <br />
          Not a verification of authenticity.
        </p>

        {/* ── Small footer ── */}
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.7 }}>
          <Lozenge color={palette.accent} size={4} />
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: palette.textSecondary }}>
            Powered by Tagit
          </span>
        </div>
      </article>

      <style>{`
        .info-cta { transition: opacity 220ms ease, transform 220ms ease; }
        .info-cta:hover { opacity: 0.92; }
        .info-cta:active { transform: translateY(1px); }
        .info-cta:focus-visible { outline: 2px solid ${palette.accent}; outline-offset: 3px; }
      `}</style>
    </div>
  );
}

// ── Expired / inactive / unknown — palette-aware, graceful, never an error ───
function ExpiredState({
  brandSlug,
  brandName,
  logoUrl,
  palette,
  fontFamily,
}: {
  brandSlug: string | null;
  brandName: string | null;
  logoUrl: string | null;
  palette: ReturnType<typeof resolvePalette>;
  fontFamily: string;
}) {
  return (
    <div
      style={{
        backgroundColor: palette.background,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily,
      }}
    >
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary brand logo dimensions
          <img src={logoUrl} alt={brandName ?? ""} style={{ height: 32, width: "auto", maxWidth: 150, objectFit: "contain", margin: "0 auto 28px" }} />
        )}
        <div style={{ display: "inline-flex", marginBottom: 22 }}>
          <Lozenge color={palette.accent} size={7} />
        </div>
        <p
          style={{
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: 27,
            color: palette.textPrimary,
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          This code is no longer active
        </p>
        <p style={{ fontSize: 14, color: palette.textSecondary, lineHeight: 1.65, margin: 0 }}>
          The information for this piece is not available here.
        </p>

        {brandSlug && (
          <Link
            href={`/${brandSlug}`}
            className="info-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              marginTop: 28,
              padding: "13px 22px",
              borderRadius: 3,
              backgroundColor: palette.accent,
              color: palette.onAccent,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            View {brandName ? `${brandName}’s` : "the"} collection →
          </Link>
        )}

        <div style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: 0.7 }}>
          <Lozenge color={palette.accent} size={4} />
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: palette.textSecondary }}>
            Powered by Tagit
          </span>
        </div>
      </div>

      <style>{`
        .info-cta { transition: opacity 220ms ease, transform 220ms ease; }
        .info-cta:hover { opacity: 0.92; }
        .info-cta:active { transform: translateY(1px); }
        .info-cta:focus-visible { outline: 2px solid ${palette.accent}; outline-offset: 3px; }
      `}</style>
    </div>
  );
}
