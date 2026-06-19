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
  type PublicProduct,
  type BrandPalette,
} from "@/lib/brand-page";
import { getPublicBrandPage } from "@/lib/brand-page-data";
import { BrandHeader, BrandFooter } from "./brand-chrome";

// Catch-all single-segment route. Static top-level routes (/dashboard, /admin,
// /auth, /v, /certificate, /privacy, /terms, /api, …) always take priority in
// the App Router, so this only resolves for genuine brand slugs. Unknown or
// unpublished slugs 404 (we never reveal which slugs exist).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicBrandPage(slug);
  if (!page) return { title: "Not found" };

  const { brand } = page;
  const title = `${brand.name} on Tagit`;
  const description = brand.bio || `Verified luxury pieces by ${brand.name}.`;
  const images = brand.logo_url ? [brand.logo_url] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: "summary", title, description, images },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublicBrandPage(slug);
  if (!page) notFound();

  const { brand, products } = page;
  const { palette } = brand;
  const baseFont = resolveBaseFont(brand.baseFont);

  return (
    <main style={{ backgroundColor: palette.background, minHeight: "100vh", fontFamily: baseFont }}>
      <BrandHeader brand={brand} palette={palette} />
      <Hero brand={brand} palette={palette} />

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 104px" }}>
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: palette.textSecondary,
            marginBottom: 32,
          }}
        >
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>

        {products.length === 0 ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: palette.textSecondary }}>
            New pieces arriving soon.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(var(--brand-cols, 3), minmax(0, 1fr))",
              columnGap: 28,
              rowGap: 64,
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                palette={palette}
                whatsapp={brand.whatsapp_number}
                slug={brand.slug}
              />
            ))}
          </div>
        )}
      </section>

      <BrandFooter palette={palette} />

      {/* Responsive grid columns: 3 desktop / 2 tablet / 1 mobile + interaction polish. */}
      <style>{`
        :root { --brand-cols: 3; }
        @media (max-width: 900px) { :root { --brand-cols: 2; } }
        @media (max-width: 560px) { :root { --brand-cols: 1; } }

        .brand-card-media { transition: box-shadow 320ms ease; }
        .brand-card-link:hover .brand-card-media { box-shadow: 0 22px 48px -28px rgba(0,0,0,0.4); }
        .brand-card-name { transition: color 200ms ease; }
        .brand-card-link:hover .brand-card-name { color: ${palette.accent}; }

        .brand-cta { transition: opacity 200ms ease, transform 200ms ease; }
        .brand-cta:hover { opacity: 0.9; }
        .brand-cta:active { transform: translateY(1px); }

        .brand-card-link:focus-visible,
        .brand-cta:focus-visible { outline: 2px solid ${palette.accent}; outline-offset: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .brand-card-media, .group img { transition: none !important; }
        }
      `}</style>
    </main>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
function Hero({
  brand,
  palette,
}: {
  brand: { name: string; bio: string | null; logo_url: string | null };
  palette: BrandPalette;
}) {
  return (
    <section
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "84px 24px 64px",
        textAlign: "center",
      }}
    >
      {brand.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary brand logo dimensions, height-constrained
        <img
          src={brand.logo_url}
          alt={brand.name}
          style={{ maxHeight: 84, width: "auto", margin: "0 auto 30px", objectFit: "contain" }}
        />
      )}
      <h1
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 300,
          fontSize: "clamp(40px, 7.5vw, 72px)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: palette.textPrimary,
          margin: 0,
          overflowWrap: "anywhere",
          hyphens: "auto",
        }}
      >
        {brand.name}
      </h1>

      {brand.bio && (
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 15,
            lineHeight: 1.7,
            color: palette.textSecondary,
            maxWidth: 480,
            margin: "22px auto 0",
            overflowWrap: "anywhere",
            whiteSpace: "pre-line",
          }}
        >
          {brand.bio}
        </p>
      )}

      {/* Thin gold rule, rotated. */}
      <div
        style={{
          width: 44,
          height: 1,
          backgroundColor: palette.accent,
          margin: "40px auto 0",
          transform: "rotate(-30deg)",
        }}
      />
    </section>
  );
}

// ── Product card ────────────────────────────────────────────────────────────
function ProductCard({
  product,
  palette,
  whatsapp,
  slug,
}: {
  product: PublicProduct;
  palette: BrandPalette;
  whatsapp: string | null;
  slug: string;
}) {
  const available = product.status === "available";
  const enquiryUrl = available ? whatsappEnquiryUrl(whatsapp, product.name, slug) : null;

  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      {/* Whole card (image + meta) links to the product detail page. */}
      <Link href={`/${slug}/${product.id}`} className="group brand-card-link" style={{ textDecoration: "none", display: "block" }}>
        <div className="brand-card-media" style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", backgroundColor: palette.divider }}>
          {product.photo ? (
            <Image
              src={product.photo}
              alt={product.name}
              fill
              sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
              className="transition-transform duration-[450ms] ease-out group-hover:scale-[1.03]"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: palette.textSecondary, textTransform: "uppercase" }}>
                No image
              </span>
            </div>
          )}

          {/* Status badge, overlaid top-left. */}
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontFamily: FONT_MONO,
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 9px",
              borderRadius: 2,
              backgroundColor: available ? palette.accent : palette.background,
              color: available ? palette.onAccent : palette.textSecondary,
              boxShadow: available ? "none" : `inset 0 0 0 1px ${palette.divider}`,
            }}
          >
            {available ? "Available" : "Owned"}
          </span>
        </div>

        <h3
          className="brand-card-name"
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.15,
            color: palette.textPrimary,
            margin: "16px 0 0",
            overflowWrap: "anywhere",
            hyphens: "auto",
          }}
        >
          {product.name}
        </h3>

        <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500, color: palette.textPrimary, margin: "8px 0 0" }}>
          {product.price != null ? formatCurrency(product.price, product.currency) : "Price on request"}
        </p>

        {product.edition && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.1em", color: palette.accent, margin: "8px 0 0" }}>
            {product.edition}
          </p>
        )}
      </Link>

      {enquiryUrl && (
        <a
          href={enquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-cta"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            marginTop: 16,
            padding: "13px 18px",
            fontFamily: FONT_BODY,
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: palette.onAccent,
            backgroundColor: palette.accent,
            borderRadius: 2,
            textDecoration: "none",
          }}
        >
          Enquire about this piece →
        </a>
      )}
    </article>
  );
}
