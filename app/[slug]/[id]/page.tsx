import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatCurrency } from "@/lib/billing/pricing";
import {
  resolveBaseFont,
  whatsappEnquiryUrl,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
} from "@/lib/brand-page";
import { getPublicBrandProduct } from "@/lib/brand-page-data";
import { BrandHeader, BrandFooter } from "../brand-chrome";

// Public product detail at /[slug]/[id]. 404s when the brand isn't published,
// the product isn't this brand's, or it has no live/owned tag (not public).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getPublicBrandProduct(slug, id);
  if (!data) return { title: "Not found" };

  const { brand, product } = data;
  const title = `${product.name}, ${brand.name}`;
  const description = product.description || `${product.name} by ${brand.name}, verified on Tagit.`;
  const image = product.photos[0] || brand.logo_url || undefined;

  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const data = await getPublicBrandProduct(slug, id);
  if (!data) notFound();

  const { brand, product } = data;
  const { palette } = brand;
  const baseFont = resolveBaseFont(brand.baseFont);
  const available = product.status === "available";
  const enquiryUrl = available ? whatsappEnquiryUrl(brand.whatsapp_number, product.name, brand.slug) : null;

  return (
    <main style={{ backgroundColor: palette.background, minHeight: "100vh", fontFamily: baseFont }}>
      <BrandHeader brand={brand} palette={palette} />

      <div className="pdp" style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 96px" }}>
        <Link
          href={`/${brand.slug}`}
          style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.textSecondary, textDecoration: "none" }}
        >
          ← {brand.name}
        </Link>

        <div className="pdp-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, marginTop: 28, alignItems: "start" }}>
          {/* Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {product.photos.length > 0 ? (
              product.photos.map((url, i) => (
                <div key={url} style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", backgroundColor: palette.divider }}>
                  <Image
                    src={url}
                    alt={`${product.name} — view ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 860px) 100vw, 55vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))
            ) : (
              <div style={{ width: "100%", aspectRatio: "4 / 5", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: palette.divider }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", color: palette.textSecondary, textTransform: "uppercase" }}>
                  No image
                </span>
              </div>
            )}
          </div>

          {/* Info — sticky on desktop */}
          <div className="pdp-info" style={{ position: "sticky", top: 96 }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: FONT_MONO,
                fontSize: 9,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "5px 10px",
                borderRadius: 2,
                marginBottom: 18,
                backgroundColor: available ? palette.badgeBg : "transparent",
                color: available ? palette.badgeText : palette.textSecondary,
                boxShadow: available ? "none" : `inset 0 0 0 1px ${palette.divider}`,
              }}
            >
              {available ? "Available" : "Owned"}
            </span>

            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 300, fontSize: "clamp(34px, 5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.01em", color: palette.textPrimary, margin: 0 }}>
              {product.name}
            </h1>

            <p style={{ fontFamily: FONT_BODY, fontSize: 20, fontWeight: 500, color: palette.textPrimary, margin: "18px 0 0" }}>
              {product.price != null ? formatCurrency(product.price, product.currency) : "Price on request"}
            </p>

            {product.edition && (
              <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.1em", color: palette.accent, margin: "10px 0 0" }}>
                {product.edition}
              </p>
            )}

            {product.description && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.75, color: palette.textSecondary, margin: "26px 0 0", maxWidth: 460 }}>
                {product.description}
              </p>
            )}

            {/* CTA */}
            <div style={{ marginTop: 30 }}>
              {enquiryUrl ? (
                <a
                  href={enquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: FONT_BODY,
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: palette.onAccent,
                    backgroundColor: palette.accent,
                    padding: "15px 28px",
                    borderRadius: 2,
                    textDecoration: "none",
                  }}
                >
                  Enquire about this piece →
                </a>
              ) : !available ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: palette.textSecondary, margin: 0 }}>
                  This piece has found its owner.
                </p>
              ) : null}
            </div>

            {/* Specs */}
            {product.specs.length > 0 && (
              <dl style={{ marginTop: 40, borderTop: `1px solid ${palette.divider}` }}>
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    style={{ display: "grid", gridTemplateColumns: "minmax(120px, 38%) 1fr", gap: 16, padding: "14px 0", borderBottom: `1px solid ${palette.divider}` }}
                  >
                    <dt style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.textSecondary }}>
                      {spec.label}
                    </dt>
                    <dd style={{ fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.5, color: palette.textPrimary, margin: 0 }}>
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>

      <BrandFooter palette={palette} />

      {/* Stack the two columns on smaller screens; drop the sticky panel. */}
      <style>{`
        @media (max-width: 860px) {
          .pdp-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .pdp-info { position: static !important; }
        }
      `}</style>
    </main>
  );
}
