import Image from "next/image";
import Link from "next/link";
import { FONT_DISPLAY, FONT_MONO, type BrandPalette } from "@/lib/brand-page";

// Shared sticky header + footer for the brand page and product detail page.
// The header leads with the BRAND's own logo/name; the footer carries the small
// "Verified by Tagit" trust mark (the page's whole value proposition).

export function BrandHeader({
  brand,
  palette,
}: {
  brand: { name: string; slug: string; logo_url: string | null };
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
      <Link
        href={`/${brand.slug}`}
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
        }}
      >
        {brand.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary brand logo dimensions
          <img
            src={brand.logo_url}
            alt={brand.name}
            style={{ height: 26, width: "auto", objectFit: "contain" }}
          />
        )}
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 16,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: palette.textPrimary,
          }}
        >
          {brand.name}
        </span>
      </Link>
    </header>
  );
}

export function BrandFooter({ palette }: { palette: BrandPalette }) {
  return (
    <footer style={{ borderTop: `1px solid ${palette.divider}`, padding: "48px 24px 64px" }}>
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
          <Image src="/tagit-icon.svg" alt="Tagit" width={16} height={16} style={{ opacity: 0.55 }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.textSecondary }}>
            Verified by Tagit
          </span>
        </div>
        <a
          href="https://tagitlux.com"
          style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.05em", color: palette.textSecondary, opacity: 0.7, textDecoration: "none" }}
        >
          tagitlux.com
        </a>
      </div>
    </footer>
  );
}
