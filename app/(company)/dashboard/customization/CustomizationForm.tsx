"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, Save, Smartphone, Upload,
  Award, Palette, Landmark, Globe2, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePanel } from "./SignaturePanel";
import { resolvePalette, resolveScanTheme, resolveBaseFont } from "@/lib/brand-page";
import {
  scanStyles as scan,
  themeVars,
  VerificationHero,
  OwnershipRecord as RecordList,
  ScanFooter,
} from "@/components/consumer/scan-chrome";
import PieceSection, { type PieceProduct } from "@/components/consumer/PieceSection";

type Company = {
  name: string;
  logo_url: string | null;
  signature_url: string | null;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_text_color: string;
  brand_font: string;
  brand_template: string;
  cert_template: string;
  brand_story: string | null;
  custom_header_text: string | null;
  social_links: Record<string, string>;
};

const FONT_OPTIONS = [
  { value: "body",    label: "Inter Tight",      sub: "Clean & modern" },
  { value: "display", label: "Instrument Serif", sub: "Elegant & italic" },
  { value: "mono",    label: "JetBrains Mono",   sub: "Technical & precise" },
];

const FONT_CSS: Record<string, string> = {
  body:    "system-ui,-apple-system,sans-serif",
  display: "'Instrument Serif',Georgia,serif",
  mono:    "'JetBrains Mono',monospace",
};

const SCAN_TEMPLATES = [
  { value: "classic",   label: "Classic",   desc: "The photo first, then the name and the facts that matter." },
  { value: "minimal",   label: "Minimal",   desc: "A square photo, the name and three key facts." },
  { value: "editorial", label: "Editorial", desc: "Large type, with your story before the photo." },
];

const CERT_TEMPLATES = [
  { value: "classic",  label: "Classic",  desc: "Gold header bar, centred seal, formal legal document" },
  { value: "minimal",  label: "Minimal",  desc: "White, left-aligned, clean modern luxury" },
  { value: "heritage", label: "Heritage", desc: "Dark brand header, ornate border, premium feel" },
];

// ─── Certificate mini-previews ──────────────────────────────────────────────

function CertPreviewClassic({ primary, accent, logoUrl, companyName }: { primary: string; accent: string; logoUrl: string | null; companyName: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1/1.41", backgroundColor: "#FAFAF8", borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ backgroundColor: accent, padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 4, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>CERTIFICATE OF AUTHENTICITY</span>
        <span style={{ fontSize: 4, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}>TAGIT</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 10px" }}>
        {logoUrl
          ? <img src={logoUrl} alt="" style={{ width: 16, height: 16, objectFit: "contain", marginBottom: 3 }} /> /* eslint-disable-line @next/next/no-img-element */
          : <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: primary, marginBottom: 3 }} />
        }
        <span style={{ fontSize: 5, fontWeight: 700, color: "#0A0A0B", marginBottom: 2 }}>{companyName}</span>
        <div style={{ width: 40, height: 1, backgroundColor: accent, marginBottom: 5 }} />
        <span style={{ fontSize: 4, color: "#6E6E73", marginBottom: 2 }}>This certifies that</span>
        <span style={{ fontSize: 7, fontWeight: 700, color: "#0A0A0B", marginBottom: 2 }}>Owner Name</span>
        <span style={{ fontSize: 4, color: "#6E6E73", marginBottom: 2 }}>is the verified owner of</span>
        <span style={{ fontSize: 6, fontWeight: 700, color: accent, marginBottom: 6 }}>Product Name</span>
        <div style={{ width: "100%", backgroundColor: "#F5F2EC", borderRadius: 4, padding: "4px 6px", marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[["CERT NO.", "TGT-2026-XX"], ["ISSUED", "16 May 2026"], ["TYPE", "Original"]].map(([l, v]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontSize: 3, color: "#9E9EA3", letterSpacing: 0.5, marginBottom: 1 }}>{l}</div>
                <div style={{ fontSize: 3.5, fontWeight: 600, color: "#0A0A0B" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 3, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>TAGIT</span>
        </div>
        <span style={{ fontSize: 3.5, color: "#6E6E73", fontStyle: "italic", marginTop: 6 }}>Authorized by {companyName}</span>
        <div style={{ width: 50, height: 0.5, backgroundColor: "#E8E2D5", marginTop: 2 }} />
      </div>
      <div style={{ borderTop: "1px solid #E8E2D5", padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 3, color: "#9E9EA3" }}>tagitlux.com/certificate/...</span>
        <div style={{ width: 14, height: 14, backgroundColor: "#0A0A0B", borderRadius: 2 }} />
      </div>
    </div>
  );
}

function CertPreviewMinimal({ accent, primary, logoUrl, companyName }: { accent: string; primary: string; logoUrl: string | null; companyName: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1/1.41", backgroundColor: "#fff", borderRadius: 6, overflow: "hidden", display: "flex", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: 4, backgroundColor: accent, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {logoUrl
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={logoUrl} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />
              : <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: primary }} />
            }
            <span style={{ fontSize: 4.5, fontWeight: 700, color: primary }}>{companyName}</span>
          </div>
          <span style={{ fontSize: 3, color: "#9E9EA3", letterSpacing: 0.5 }}>CERTIFICATE</span>
        </div>
        <div style={{ height: 1, backgroundColor: "#E8E2D5", marginBottom: 6 }} />
        <span style={{ fontSize: 3.5, color: accent, letterSpacing: 1, marginBottom: 2 }}>AUTHENTICATED ITEM</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#0A0A0B", lineHeight: 1.2, marginBottom: 2 }}>Product Name</span>
        <span style={{ fontSize: 4, color: accent, marginBottom: 6 }}>by {companyName}</span>
        <span style={{ fontSize: 3, color: "#9E9EA3", letterSpacing: 0.5, marginBottom: 2 }}>ISSUED TO</span>
        <span style={{ fontSize: 6, fontWeight: 700, color: "#0A0A0B", marginBottom: 1 }}>Owner Name</span>
        <span style={{ fontSize: 3.5, color: "#6E6E73", marginBottom: 8 }}>owner@email.com</span>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[["DATE", "16 May 2026"], ["TYPE", "Original"]].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 3, color: "#9E9EA3", marginBottom: 1 }}>{l}</div>
              <div style={{ fontSize: 3.5, fontWeight: 600, color: "#0A0A0B" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #E8E2D5", paddingTop: 4, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 3.5, color: "#6E6E73", fontStyle: "italic", display: "block", marginBottom: 2 }}>Authorized by {companyName}</span>
            <span style={{ fontSize: 4, fontWeight: 700, color: "#0A0A0B" }}>Tagit</span>
          </div>
          <div style={{ width: 14, height: 14, backgroundColor: "#0A0A0B", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

function CertPreviewHeritage({ primary, accent, logoUrl, companyName }: { primary: string; accent: string; logoUrl: string | null; companyName: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1/1.41", backgroundColor: "#FAFAF8", borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "Georgia,serif", position: "relative" }}>
      <div style={{ position: "absolute", inset: 3, border: `1px solid ${accent}`, borderRadius: 4, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 5, border: "1px solid #E8E2D5", borderRadius: 3, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ backgroundColor: primary, padding: "8px 12px", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        {logoUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={logoUrl} alt="" style={{ width: 14, height: 14, objectFit: "contain", marginBottom: 2, opacity: 0.9 }} />
          : null
        }
        <span style={{ fontSize: 5.5, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>{companyName}</span>
        <div style={{ width: 30, height: 1, backgroundColor: accent, marginTop: 3 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px" }}>
        <span style={{ fontSize: 3, color: "#9E9EA3", letterSpacing: 1.5, marginBottom: 3 }}>CERTIFICATE OF AUTHENTIC OWNERSHIP</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, marginBottom: 3, width: "100%" }}>
          <div style={{ width: "70%", height: 1, backgroundColor: accent }} />
          <div style={{ width: "70%", height: 1, backgroundColor: "#E8E2D5" }} />
        </div>
        <span style={{ fontSize: 4, color: "#6E6E73", fontStyle: "italic", marginBottom: 2 }}>This is to certify that</span>
        <span style={{ fontSize: 7.5, fontWeight: 700, color: "#0A0A0B", marginBottom: 2 }}>Owner Name</span>
        <span style={{ fontSize: 3.5, color: "#6E6E73", textAlign: "center", marginBottom: 2 }}>is the rightful and verified original owner of</span>
        <span style={{ fontSize: 5.5, fontStyle: "italic", color: accent, marginBottom: 2 }}>Product Name</span>
        <span style={{ fontSize: 3.5, color: "#9E9EA3", fontStyle: "italic", marginBottom: 5 }}>as recorded on the Tagit Ownership Ledger</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, marginBottom: 4, width: "100%" }}>
          <div style={{ width: "60%", height: 1, backgroundColor: "#E8E2D5" }} />
          <div style={{ width: "60%", height: 1, backgroundColor: accent }} />
        </div>
        <span style={{ fontSize: 3.5, color: "#6E6E73", fontStyle: "italic", marginBottom: 3 }}>{companyName}</span>
        <div style={{ width: 40, height: 0.5, backgroundColor: accent, marginBottom: 4 }} />
        <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 3, fontWeight: 700, color: accent, letterSpacing: 0.5 }}>TAGIT</span>
        </div>
      </div>
      <div style={{ backgroundColor: primary, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 3, color: accent, letterSpacing: 0.5 }}>TGT-2026-XXXXXX</span>
        <div style={{ width: 12, height: 12, backgroundColor: "#fff", borderRadius: 1, padding: 1 }}>
          <div style={{ width: "100%", height: "100%", backgroundColor: "#0A0A0B", borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Live scan page preview ─────────────────────────────────────────────────
// Not a sketch: the real scan page, built from the same components as
// /v/[token], filled with a sample piece.

const SAMPLE_PIECE: PieceProduct = {
  name: "The Atelier Tote",
  industry_fields: {
    primary_material: "Full-grain leather",
    made_in: "Lagos",
    collection: "Atelier",
    colorway: "Cognac",
    production_year: "2026",
    design_notes: "Cut and stitched by hand in our Lagos atelier, from a single hide chosen for its grain.",
  },
  retail_price: 450000,
  currency: "NGN",
  photos: [],
};

function ScanPagePreview({
  companyName, logoUrl, primary, accent, textColor, font, headerText, template,
}: {
  companyName: string; logoUrl: string | null; primary: string; secondary?: string;
  accent: string; textColor: string; font: string; headerText: string; template: string;
}) {
  const theme = resolveScanTheme({ brand_primary_color: primary, brand_accent_color: accent, brand_text_color: textColor });
  const frame: React.CSSProperties =
    template === "minimal" ? { aspectRatio: "1 / 1" } : { height: template === "editorial" ? 300 : 360 };
  const media = (
    <div style={{ ...frame, borderRadius: 16, overflow: "hidden", backgroundColor: "#F5F2EC", border: "1px solid #EDE8DF" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/bag.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
  return (
    <div className={scan.page} style={{ ...themeVars(theme, resolveBaseFont(font)), minHeight: "100%" }}>
      {/* The phone's status bar, in the page's own colour, as a real phone shows it. */}
      <div aria-hidden style={{ height: 50, backgroundColor: theme.brand }} />
      <VerificationHero
        house={headerText || companyName}
        logoUrl={logoUrl}
        verdict="Authentic"
        note={`Made by ${companyName}. Its tag's signature checks out with Tagit.`}
        meta={[<>Tag <span>X7F3C9</span></>, "Checked just now"]}
      />
      <div className={scan.column}>
        <PieceSection product={SAMPLE_PIECE} industry="fashion" accent={theme.accentInk} template={template} media={media} />
        <RecordList
          entries={[
            { id: "1", name: "Adaeze Okonkwo", meta: "First owner on 12 Feb 2026", current: false },
            { id: "2", name: "Chidinma Eze", meta: "Transferred on 3 Sep 2026", current: true },
          ]}
        />
        <section className={scan.section}>
          <div className={`${scan.panel} ${scan.panelPad} ${scan.owner}`}>
            <div>
              <p className={scan.ownerLabel}>Owned by</p>
              <p className={scan.ownerName}>Chidinma Eze</p>
            </div>
            <span className={scan.buttonQuiet}>Pass it on</span>
          </div>
        </section>
        <ScanFooter />
      </div>
    </div>
  );
}

// ─── Exhibition info-page preview ───────────────────────────────────────────
// Mirrors app/info/[token]: a calm, editorial reference placard themed by the
// same brand palette (via resolvePalette, exactly as the live page does), so the
// brand sees their colours and font on it before publishing.

function InfoPagePreview({
  companyName, logoUrl, primary, secondary, accent, textColor, font,
}: {
  companyName: string; logoUrl: string | null; primary: string; secondary: string;
  accent: string; textColor: string; font: string;
}) {
  const palette = resolvePalette({
    brand_primary_color: primary,
    brand_secondary_color: secondary,
    brand_accent_color: accent,
    brand_text_color: textColor,
  });
  const fontFamily = FONT_CSS[font] ?? FONT_CSS.body;
  const light = (() => {
    const int = parseInt(palette.background.replace("#", ""), 16);
    const ch = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] > 0.42;
  })();
  const surface = light ? "#FFFFFF" : "rgba(255,255,255,0.05)";

  return (
    <div style={{
      width: "100%", height: "100%", overflow: "hidden",
      backgroundColor: palette.background, fontFamily, position: "relative",
      display: "flex", flexDirection: "column", padding: "30px 14px 14px",
    }}>

      {/* top: logo + reference marker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {logoUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={logoUrl} alt="" style={{ height: 16, maxWidth: 70, objectFit: "contain" }} />
          : <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontStyle: "italic", fontSize: 12, color: palette.textPrimary }}>{companyName}</span>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 99, backgroundColor: palette.badgeBg, border: `1px solid ${palette.divider}` }}>
          <span style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
          <span style={{ fontSize: 7, fontWeight: 500, color: palette.badgeText }}>For reference</span>
        </span>
      </div>

      {/* photo mat */}
      <div style={{ backgroundColor: surface, border: `1px solid ${palette.divider}`, borderRadius: 4, aspectRatio: "1/1", padding: 8 }}>
        <div style={{ width: "100%", height: "100%", border: `1px solid ${palette.divider}` }} />
      </div>

      {/* title + brand */}
      <p style={{ margin: "12px 0 2px", fontFamily: "'Instrument Serif',Georgia,serif", fontStyle: "italic", fontSize: 19, lineHeight: 1.05, color: palette.textPrimary, letterSpacing: "-0.02em" }}>Sample Piece</p>
      <p style={{ margin: 0, fontSize: 8.5, color: palette.textSecondary }}>{companyName}</p>

      {/* lozenge divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
        <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
        <span style={{ width: 5, height: 5, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
      </div>

      {/* spec rows */}
      {[["Medium", "Oil on canvas"], ["Dimensions", "90 × 120 cm"]].map(([k, v], i) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${palette.divider}` }}>
          <span style={{ fontSize: 8, color: palette.textSecondary }}>{k}</span>
          <span style={{ fontSize: 9, color: palette.textPrimary }}>{v}</span>
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: 0.7 }}>
        <span style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        <span style={{ fontSize: 7, color: palette.textSecondary }}>Made with Tagit</span>
      </div>
    </div>
  );
}

// ─── Brand web page preview ─────────────────────────────────────────────────
// Mirrors app/[slug]: a centred editorial hero (logo, serif name, bio, rotated
// gold rule) over a product grid. Themed via resolvePalette, exactly like the
// live page.

function BrandWebPreview({
  companyName, logoUrl, primary, secondary, accent, textColor, font,
}: {
  companyName: string; logoUrl: string | null; primary: string; secondary: string;
  accent: string; textColor: string; font: string;
}) {
  const palette = resolvePalette({ brand_primary_color: primary, brand_secondary_color: secondary, brand_accent_color: accent, brand_text_color: textColor });
  const fontFamily = FONT_CSS[font] ?? FONT_CSS.body;
  return (
    <div style={{
      width: "100%", height: "100%", overflow: "hidden",
      backgroundColor: palette.background, fontFamily, position: "relative",
      display: "flex", flexDirection: "column", padding: "34px 16px 14px",
    }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        {logoUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={logoUrl} alt="" style={{ height: 22, maxWidth: 90, objectFit: "contain", margin: "0 auto 8px" }} />
          : null}
        <p style={{ margin: 0, fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 26, fontWeight: 300, lineHeight: 1.05, color: palette.textPrimary, letterSpacing: "-0.01em" }}>{companyName}</p>
        <p style={{ margin: "8px auto 0", maxWidth: "85%", fontSize: 8, lineHeight: 1.6, color: palette.textSecondary }}>Crafted in Lagos. Worn worldwide.</p>
        <div style={{ width: 26, height: 1, backgroundColor: palette.accent, margin: "12px auto 0", transform: "rotate(-30deg)" }} />
      </div>
      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["Sample Piece", "Atelier No. 2"].map((nm, i) => (
          <div key={nm}>
            <div style={{ width: "100%", aspectRatio: "4/5", backgroundColor: palette.divider, borderRadius: 2, position: "relative" }}>
              <span style={{ position: "absolute", top: 5, left: 5, fontFamily: "monospace", fontSize: 5, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 4px", borderRadius: 1, backgroundColor: i === 0 ? palette.accent : "transparent", color: i === 0 ? palette.onAccent : palette.textSecondary, boxShadow: i === 0 ? "none" : `inset 0 0 0 1px ${palette.divider}` }}>{i === 0 ? "Available" : "Owned"}</span>
            </div>
            <p style={{ margin: "6px 0 1px", fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 11, color: palette.textPrimary, lineHeight: 1.1 }}>{nm}</p>
            <p style={{ margin: 0, fontSize: 8, fontWeight: 500, color: palette.textPrimary }}>NGN 150,000</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QR placard (PDF) preview ───────────────────────────────────────────────
// A small museum placard mirroring lib/exhibition-label: a modern rounded QR as
// the hero, the piece name, and a quiet Powered-by line.

function FauxQr({ dark }: { dark: string }) {
  // A fixed, QR-like field of rounded modules (illustrative — not a real code).
  const pattern = [
    "001011010", "010100101", "101101011", "011010100",
    "100101101", "010110010", "101001011", "011100100", "100011010",
  ];
  return (
    <div style={{ position: "relative", width: 92, height: 92, padding: 8, backgroundColor: "#fff", borderRadius: 10, border: "1px solid #ECECEC" }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* module field */}
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(9,1fr)", gridTemplateRows: "repeat(9,1fr)", gap: 1 }}>
          {pattern.flatMap((row, r) => row.split("").map((cell, c) => {
            const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
            return <div key={`${r}-${c}`} style={{ borderRadius: 1.5, backgroundColor: cell === "1" && !corner ? dark : "transparent" }} />;
          }))}
        </div>
        {/* rounded finder eyes */}
        {[[0, 0], [0, "auto"], ["auto", 0]].map(([t, l], i) => (
          <div key={i} style={{ position: "absolute", top: t === 0 ? 0 : undefined, bottom: t === "auto" ? 0 : undefined, left: l === 0 ? 0 : undefined, right: l === "auto" ? 0 : undefined, width: "30%", height: "30%", border: `2.5px solid ${dark}`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "42%", height: "42%", backgroundColor: dark, borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacardPreview({
  companyName, logoUrl, primary, secondary, accent, textColor,
}: {
  companyName: string; logoUrl: string | null; primary: string; secondary: string; accent: string; textColor: string; font?: string;
}) {
  const palette = resolvePalette({ brand_primary_color: primary, brand_secondary_color: secondary, brand_accent_color: accent, brand_text_color: textColor });
  return (
    <div style={{
      width: "100%", aspectRatio: "1/1.414", backgroundColor: palette.background,
      borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 14px rgba(0,0,0,0.12)",
      display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 16px 14px",
    }}>
      {logoUrl
        /* eslint-disable-next-line @next/next/no-img-element */
        ? <img src={logoUrl} alt="" style={{ height: 16, maxWidth: 80, objectFit: "contain" }} />
        : <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontStyle: "italic", fontSize: 12, color: palette.textPrimary }}>{companyName}</span>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <FauxQr dark="#0B0B0C" />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 4, height: 4, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "monospace", fontSize: 6, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.accent }}>Scan for more information</span>
          <span style={{ width: 4, height: 4, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        </div>
        <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 15, color: palette.textPrimary }}>Sample Piece</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.7 }}>
        <span style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        <span style={{ fontSize: 7, color: palette.textSecondary }}>Made with Tagit</span>
      </div>
    </div>
  );
}

// ─── Tab types ──────────────────────────────────────────────────────────────

// Editing groups (what you change). Previewing is decoupled: the preview panel
// has its own surface switcher, so any surface can be previewed from any tab.
type Tab = "brand" | "scan" | "certificates";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "brand",        label: "Brand identity",  icon: <Palette size={14} /> },
  { id: "scan",         label: "Scan layout",     icon: <Smartphone size={14} /> },
  { id: "certificates", label: "Certificate",     icon: <Award size={14} /> },
];

// Surfaces you can preview. Each one is themed by the same brand settings.
type Surface = "scan" | "web" | "info" | "certificate" | "placard";

const SURFACE_META: { id: Surface; label: string; icon: React.ReactNode; kind: "phone" | "paper"; exhibition?: boolean }[] = [
  { id: "scan",        label: "Scan page",        icon: <Smartphone size={13} />, kind: "phone" },
  { id: "web",         label: "Brand web page",   icon: <Globe2 size={13} />,     kind: "phone" },
  { id: "info",        label: "Info page",        icon: <Landmark size={13} />,   kind: "phone", exhibition: true },
  { id: "certificate", label: "Certificate (PDF)", icon: <Award size={13} />,     kind: "paper" },
  { id: "placard",     label: "QR placard (PDF)", icon: <FileText size={13} />,   kind: "paper", exhibition: true },
];

// ─── Main form ──────────────────────────────────────────────────────────────

export default function CustomizationForm({ company, showExhibitions = false }: { company: Company; showExhibitions?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("brand");
  const [previewSurface, setPreviewSurface] = useState<Surface>("scan");
  const [loading, setLoading] = useState(false);

  // Exhibition-only surfaces (info page + QR placard) are hidden unless the
  // brand has the Exhibitions feature.
  const surfaces = SURFACE_META.filter((s) => !s.exhibition || showExhibitions);

  // Logo
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature
  const [signaturePreview, setSignaturePreview] = useState<string | null>(company.signature_url);

  const [form, setFormState] = useState({
    brand_primary_color:   company.brand_primary_color   || "#0A0A0B",
    brand_secondary_color: company.brand_secondary_color || "#FAFAF8",
    brand_accent_color:    company.brand_accent_color    || "#B8945D",
    brand_text_color:      company.brand_text_color      || "#FAFAF8",
    brand_font:            company.brand_font            || "body",
    brand_template:        company.brand_template        || "classic",
    cert_template:         company.cert_template         || "classic",
    brand_story:           company.brand_story ?? "",
    custom_header_text:    company.custom_header_text ?? "",
    social_instagram:      (company.social_links as Record<string, string>)?.instagram ?? "",
    social_website:        (company.social_links as Record<string, string>)?.website ?? "",
    social_twitter:        (company.social_links as Record<string, string>)?.twitter ?? "",
  });

  function set(field: string, value: string) {
    setFormState((f) => ({ ...f, [field]: value }));
  }

  // ── Logo handlers ────────────────────────────────────────────────────────

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    const json = await res.json();
    setLogoUploading(false);
    if (!res.ok) { toast.error(json.error ?? "Logo upload failed."); return; }
    setLogoPreview(json.logo_url);
    toast.success("Logo uploaded.");
  }

  async function handleRemoveLogo() {
    setLogoPreview(null);
    await fetch("/api/company/customization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: null }),
    });
  }

  // ── Signature handlers ───────────────────────────────────────────────────

  async function saveSignature(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/company/signature", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Signature upload failed."); return; }
    setSignaturePreview(json.signature_url);
    toast.success("Signature saved.");
  }

  async function handleRemoveSignature() {
    setSignaturePreview(null);
    await fetch("/api/company/customization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature_url: null }),
    });
  }

  // ── Form submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/company/customization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_primary_color:   form.brand_primary_color,
        brand_secondary_color: form.brand_secondary_color,
        brand_accent_color:    form.brand_accent_color,
        brand_text_color:      form.brand_text_color,
        brand_font:            form.brand_font,
        brand_template:        form.brand_template,
        cert_template:         form.cert_template,
        brand_story:           form.brand_story || null,
        custom_header_text:    form.custom_header_text || null,
        social_links: Object.fromEntries(
          Object.entries({
            instagram: form.social_instagram,
            website:   form.social_website,
            twitter:   form.social_twitter,
          }).filter(([, v]) => Boolean(v))
        ),
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed to save."); setLoading(false); return; }
    toast.success("Brand settings saved.");
    setLoading(false);
  }

  const colorFields = [
    { key: "brand_primary_color",   label: "Brand colour",  hint: "The verification block at the top of every scan page, and its buttons." },
    { key: "brand_text_color",      label: "Text on brand", hint: "Text over your brand colour. Your brand page uses it as its background." },
    { key: "brand_accent_color",    label: "Accent",        hint: "The seal, highlights, and the details on certificates." },
    { key: "brand_secondary_color", label: "Secondary",     hint: "Quieter text on your brand page and info pages." },
  ];

  // ── Active cert preview component ────────────────────────────────────────

  const certPreviewProps = {
    primary: form.brand_primary_color,
    accent:  form.brand_accent_color,
    logoUrl: logoPreview,
    companyName: company.name,
  };

  const activeCertPreview =
    form.cert_template === "heritage" ? <CertPreviewHeritage {...certPreviewProps} /> :
    form.cert_template === "minimal"  ? <CertPreviewMinimal  {...certPreviewProps} /> :
                                        <CertPreviewClassic  {...certPreviewProps} />;

  // Shared brand props for every previewed surface.
  const surfaceProps = {
    companyName: company.name,
    logoUrl: logoPreview,
    primary: form.brand_primary_color,
    secondary: form.brand_secondary_color,
    accent: form.brand_accent_color,
    textColor: form.brand_text_color,
    font: form.brand_font,
  };

  function renderSurface(surface: Surface) {
    switch (surface) {
      case "web":         return <BrandWebPreview {...surfaceProps} />;
      case "info":        return <InfoPagePreview {...surfaceProps} />;
      case "certificate": return activeCertPreview;
      case "placard":     return <PlacardPreview {...surfaceProps} />;
      default:            return <ScanPagePreview {...surfaceProps} headerText={form.custom_header_text} template={form.brand_template} />;
    }
  }

  const activeSurface = surfaces.find((s) => s.id === previewSurface) ?? surfaces[0];

  // The phone fills the stage: as tall as the stage allows, never wider than
  // the stage itself. Measured, because the screen content is drawn at a real
  // phone's width (390px) and zoomed to fit.
  const canvasRef = useRef<HTMLDivElement>(null);
  const [phoneWidth, setPhoneWidth] = useState(340);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const byHeight = window.matchMedia("(min-width: 1024px)").matches ? ((r.height - 40) * 390) / 844 + 20 : 360;
      setPhoneWidth(Math.round(Math.max(250, Math.min(390, byHeight, r.width - 8))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const screenWidth = phoneWidth - 20;
  const screenHeight = Math.round((screenWidth * 844) / 390);

  function renderStage() {
    if (activeSurface.kind === "paper") {
      const width = Math.min(phoneWidth + 60, 420);
      return (
        <div className="cz-paper" style={{ width }}>
          <div style={{ zoom: width / 252 }}>{renderSurface(previewSurface)}</div>
        </div>
      );
    }
    // The scan page is drawn at 390px; the smaller sketches at 232px.
    const base = previewSurface === "scan" ? 390 : 232;
    const k = screenWidth / base;
    return (
      <div className="cz-phone" style={{ width: phoneWidth }}>
        <span className="cz-island" aria-hidden />
        <div className="cz-phone-screen" style={{ height: screenHeight }} key={previewSurface}>
          <div style={{ zoom: k, width: base, height: previewSurface === "scan" ? undefined : screenHeight / k }}>
            {renderSurface(previewSurface)}
          </div>
        </div>
      </div>
    );
  }

  // A choice card (font, layout, certificate design): the chosen one is
  // outlined in ink, the same way the sign-up flow marks a choice.
  const choiceStyle = (active: boolean): React.CSSProperties => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: 8,
    border: `1px solid ${active ? "var(--color-onyx)" : "var(--input)"}`,
    boxShadow: active ? "inset 0 0 0 1px var(--color-onyx)" : "none",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "border-color 0.15s",
  });

  return (
    <form onSubmit={handleSubmit} className="cz cz-studio">

      {/* ── The stage: the live page, as a buyer will see it ───────────── */}
      <section className="cz-stage" aria-label="Live preview">
        <div className="cz-stage-bar" role="tablist" aria-label="What to preview">
          {surfaces.map((sf) => {
            const on = sf.id === activeSurface.id;
            return (
              <button
                key={sf.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPreviewSurface(sf.id)}
                className={`cz-surface ${on ? "is-on" : ""}`}
              >
                {sf.icon}
                {sf.label}
              </button>
            );
          })}
        </div>
        <div className="cz-stage-canvas" ref={canvasRef}>
          {renderStage()}
        </div>
        <p className="cz-stage-note">
          {previewSurface === "scan" ? "Scroll the phone to see the whole page. " : ""}
          Changes show as you make them, and go live when you save.
        </p>
      </section>

      {/* ── The controls ─────────────────────────────────────────────────── */}
      <div className="cz-controls">
        <div className="cz-controls-head">
          <h1 className="page-title" style={{ fontSize: 30 }}>Brand customization</h1>
          <p className="page-desc" style={{ marginTop: 4 }}>How your house looks everywhere a buyer meets it.</p>
          <div role="tablist" aria-label="What to customise" className="cz-tabs">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Show the surface the tab changes.
                    if (tab.id === "scan") setPreviewSurface("scan");
                    if (tab.id === "certificates") setPreviewSurface("certificate");
                  }}
                  className={`cz-tab ${active ? "is-active" : ""}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cz-controls-body">

          {/* ── Brand identity ─────────────────────────────────────────── */}
          {activeTab === "brand" && (
            <>
              <section className="cz-section">
                <h2 className="cz-h">Logo</h2>
                <p className="cz-p">Shown at the top of every scan page and on certificates. A PNG or SVG with a transparent background works best.</p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Your logo" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "contain", border: "1px solid var(--app-edge)", backgroundColor: "#fff", padding: 6 }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 8, border: "1px dashed var(--input)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#faf8f4" }}>
                      <Upload size={18} style={{ color: "var(--app-body)" }} aria-hidden />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoUploading} className="ov-btn ov-btn-quiet">
                        {logoUploading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
                        {logoUploading ? "Uploading" : logoPreview ? "Replace logo" : "Upload logo"}
                      </button>
                      {logoPreview && (
                        <button type="button" onClick={handleRemoveLogo} className="cz-text-btn">
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="cz-note mt-2">PNG, JPG, WebP or SVG, up to 2 MB.</p>
                  </div>
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">Colours</h2>
                <p className="cz-p">Every colour is checked for contrast on the page, so text stays readable whatever you pick.</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mt-4">
                  {colorFields.map(({ key, label, hint }) => (
                    <div key={key}>
                      <label htmlFor={`c-${key}`} className="cz-label">{label}</label>
                      <div className="cz-color">
                        <input type="color" aria-label={`${label} colour picker`} value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} />
                        <input id={`c-${key}`} type="text" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} maxLength={7} spellCheck={false} />
                      </div>
                      <p className="cz-note mt-1.5">{hint}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">Typeface</h2>
                <p className="cz-p">The typeface your scan pages are set in.</p>
                <div role="radiogroup" aria-label="Typeface" className="grid sm:grid-cols-2 gap-2 mt-4">
                  {FONT_OPTIONS.map((opt) => {
                    const active = form.brand_font === opt.value;
                    return (
                      <button key={opt.value} type="button" role="radio" aria-checked={active} onClick={() => set("brand_font", opt.value)} style={{ ...choiceStyle(active), display: "flex", alignItems: "center", gap: 14 }}>
                        <span aria-hidden style={{ fontSize: 24, lineHeight: 1, color: "var(--color-onyx)", fontFamily: FONT_CSS[opt.value], minWidth: 34, fontStyle: opt.value === "display" ? "italic" : "normal" }}>Aa</span>
                        <span>
                          <span className="block text-body-sm font-semibold" style={{ color: "var(--color-onyx)" }}>{opt.label}</span>
                          <span className="block text-caption" style={{ color: "var(--app-body)" }}>{opt.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">Words on the page</h2>
                <p className="cz-p">How your name reads on scan pages, and the story your AI guide tells buyers who ask.</p>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="cz-header" className="cz-label">Name on scan pages</Label>
                    <Input id="cz-header" type="text" value={form.custom_header_text} onChange={(e) => set("custom_header_text", e.target.value)} placeholder={company.name} />
                    <p className="cz-note mt-1.5">Leave it blank to use {company.name}.</p>
                  </div>
                  <div>
                    <Label htmlFor="cz-story" className="cz-label">Brand story</Label>
                    <textarea id="cz-story" value={form.brand_story} onChange={(e) => set("brand_story", e.target.value)} placeholder="Where your house began, and what it makes." rows={4} className="cz-textarea" />
                  </div>
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">Links</h2>
                <p className="cz-p">Shown as buttons at the foot of every scan page. Leave any of them blank to hide it.</p>
                <div className="space-y-4 mt-4">
                  {[
                    { key: "social_website",   label: "Website",   placeholder: "https://yourbrand.com" },
                    { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/yourbrand" },
                    { key: "social_twitter",   label: "X",         placeholder: "https://x.com/yourbrand" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <Label htmlFor={`cz-${key}`} className="cz-label">{label}</Label>
                      <Input id={`cz-${key}`} type="url" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── Scan layout ────────────────────────────────────────────── */}
          {activeTab === "scan" && (
            <section className="cz-section">
              <h2 className="cz-h">Page layout</h2>
              <p className="cz-p">How the piece&apos;s details are arranged on the page a buyer sees after tapping. Your colours and typeface from Brand identity apply here too.</p>
              <div role="radiogroup" aria-label="Page layout" className="grid sm:grid-cols-3 gap-2 mt-4">
                {SCAN_TEMPLATES.map((t) => {
                  const active = form.brand_template === t.value;
                  return (
                    <button key={t.value} type="button" role="radio" aria-checked={active} onClick={() => set("brand_template", t.value)} style={choiceStyle(active)}>
                      <span className="block text-body-sm font-semibold mb-1" style={{ color: "var(--color-onyx)" }}>{t.label}</span>
                      <span className="block text-caption" style={{ color: "var(--app-body)", lineHeight: 1.45 }}>{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Certificate ────────────────────────────────────────────── */}
          {activeTab === "certificates" && (
            <>
              <section className="cz-section">
                <h2 className="cz-h">Certificate design</h2>
                <p className="cz-p">
                  Each time you approve a claim or a transfer completes, the new owner is emailed a PDF certificate in your logo and colours. Choose how it looks.
                </p>
                <div role="radiogroup" aria-label="Certificate design" className="grid sm:grid-cols-3 gap-3 mt-4">
                  {CERT_TEMPLATES.map((t) => {
                    const active = form.cert_template === t.value;
                    return (
                      <button key={t.value} type="button" role="radio" aria-checked={active} onClick={() => set("cert_template", t.value)} style={{ ...choiceStyle(active), padding: 12 }}>
                        <div style={{ marginBottom: 10, borderRadius: 4, overflow: "hidden", border: "1px solid var(--app-edge)" }}>
                          {t.value === "classic"  && <CertPreviewClassic  {...certPreviewProps} />}
                          {t.value === "minimal"  && <CertPreviewMinimal  {...certPreviewProps} />}
                          {t.value === "heritage" && <CertPreviewHeritage {...certPreviewProps} />}
                        </div>
                        <span className="block text-body-sm font-semibold mb-0.5" style={{ color: "var(--color-onyx)" }}>{t.label}</span>
                        <span className="block text-caption" style={{ color: "var(--app-body)", lineHeight: 1.45 }}>{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">Signature</h2>
                <p className="cz-p">
                  Draw or upload a signature for every certificate you issue. Without one, the certificate reads &ldquo;Authorized by {company.name}&rdquo; in italic.
                </p>
                <div className="mt-4">
                  <SignaturePanel
                    companyName={company.name}
                    preview={signaturePreview}
                    onSave={saveSignature}
                    onRemove={handleRemoveSignature}
                  />
                </div>
              </section>

              <section className="cz-section">
                <h2 className="cz-h">What a certificate carries</h2>
                <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mt-4">
                  {[
                    ["Your logo and colours", "From Brand identity."],
                    ["Your signature", "Or your house name, if you haven't added one."],
                    ["The owner's name", "As recorded when the claim or transfer happened."],
                    ["The product", "Its name and details from your catalogue."],
                    ["A certificate number", "In the form TGT-2026-XXXXXX."],
                    ["A verification code", "Scanning it opens the public record."],
                  ].map(([title, sub]) => (
                    <div key={title}>
                      <dt className="text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>{title}</dt>
                      <dd className="text-caption" style={{ color: "var(--app-body)" }}>{sub}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          )}
        </div>

        <div className="cz-savebar">
          <p className="text-caption" style={{ color: "var(--app-body)" }}>Saving applies the changes on every tab.</p>
          <button type="submit" disabled={loading} className="ov-btn">
            {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Save size={14} aria-hidden />}
            {loading ? "Saving" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
