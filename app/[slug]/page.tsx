import Image from "next/image";
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
      <PageHeader brand={brand} palette={palette} />
      <Hero brand={brand} palette={palette} />

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 96px" }}>
        <p
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: palette.textSecondary,
            marginBottom: 20,
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
              gap: 2,
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

      <Footer palette={palette} />

      {/* Responsive grid columns: 3 desktop / 2 tablet / 1 mobile. */}
      <style>{`
        :root { --brand-cols: 3; }
        @media (max-width: 900px) { :root { --brand-cols: 2; } }
        @media (max-width: 560px) { :root { --brand-cols: 1; } }
      `}</style>
    </main>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
function PageHeader({
  brand,
  palette,
}: {
  brand: { name: string };
  palette: BrandPalette;
}) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: palette.background,
        borderBottom: `1px solid ${palette.divider}`,
        backdropFilter: "saturate(180%) blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Image src="/tagit-icon.svg" alt="Tagit" width={20} height={20} style={{ opacity: 0.9 }} />
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: palette.textPrimary,
          }}
        >
          {brand.name}
        </span>
      </div>
    </header>
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
        padding: "72px 24px 56px",
        textAlign: "center",
      }}
    >
      {brand.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary brand logo dimensions, height-constrained
        <img
          src={brand.logo_url}
          alt={brand.name}
          style={{ maxHeight: 80, width: "auto", margin: "0 auto 28px", objectFit: "contain" }}
        />
      )}
      <h1
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 300,
          fontSize: "clamp(52px, 8vw, 72px)",
          lineHeight: 1.02,
          letterSpacing: "-0.01em",
          color: palette.textPrimary,
          margin: 0,
        }}
      >
        {brand.name}
      </h1>

      {brand.bio && (
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 14,
            lineHeight: 1.7,
            color: palette.textSecondary,
            maxWidth: 480,
            margin: "20px auto 0",
          }}
        >
          {brand.bio}
        </p>
      )}

      {/* Thin gold rule, rotated. */}
      <div
        style={{
          width: 40,
          height: 1,
          backgroundColor: palette.accent,
          margin: "36px auto 0",
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
      {/* Image, 4:5, subtle zoom on hover (CSS only). */}
      <div className="group" style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", backgroundColor: palette.divider }}>
        {product.photo ? (
          <Image
            src={product.photo}
            alt={product.name}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
            className="transition-transform duration-[400ms] ease-out group-hover:scale-[1.02]"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: "0.14em", color: palette.textSecondary, textTransform: "uppercase" }}>
              No image
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 4px 28px" }}>
        {/* Status badge */}
        <span
          style={{
            display: "inline-block",
            fontFamily: FONT_MONO,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: 2,
            marginBottom: 10,
            backgroundColor: available ? palette.badgeBg : palette.divider,
            color: available ? palette.badgeText : palette.textSecondary,
          }}
        >
          {available ? "Available" : "Owned"}
        </span>

        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.15,
            color: palette.textPrimary,
            margin: 0,
          }}
        >
          {product.name}
        </h3>

        {product.price != null && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: palette.textSecondary, margin: "6px 0 0" }}>
            {formatCurrency(product.price, product.currency)}
          </p>
        )}

        {product.edition && (
          <p style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.1em", color: palette.accent, margin: "8px 0 0" }}>
            {product.edition}
          </p>
        )}

        {enquiryUrl && (
          <a
            href={enquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              fontFamily: FONT_BODY,
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: palette.accent,
              textDecoration: "none",
              marginTop: 14,
              borderBottom: `1px solid ${palette.accent}`,
              paddingBottom: 2,
            }}
          >
            Enquire about this piece →
          </a>
        )}
      </div>
    </article>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────
function Footer({ palette }: { palette: BrandPalette }) {
  return (
    <footer style={{ borderTop: `1px solid ${palette.divider}`, padding: "40px 24px 56px" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/tagit-icon.svg" alt="Tagit" width={16} height={16} style={{ opacity: 0.5 }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.textSecondary }}>
            Verified by Tagit
          </span>
        </div>
        <a
          href="https://tagitlux.com"
          style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.05em", color: palette.textSecondary, opacity: 0.6, textDecoration: "none" }}
        >
          tagitlux.com
        </a>
      </div>
    </footer>
  );
}
