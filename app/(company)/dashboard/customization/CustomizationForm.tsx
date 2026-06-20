"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Loader2, Save, Smartphone, Upload, X, Shield,
  Award, Palette, Globe, PenLine, Landmark, Globe2, FileText, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePanel } from "./SignaturePanel";
import { resolvePalette } from "@/lib/brand-page";

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
  { value: "classic",   label: "Classic",   desc: "Full product card with fields grid" },
  { value: "minimal",   label: "Minimal",   desc: "Photo, name, and key facts only" },
  { value: "editorial", label: "Editorial", desc: "Large type, story-first layout" },
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

function ScanPagePreview({
  companyName, logoUrl, primary, secondary, accent, textColor, font, headerText, template,
}: {
  companyName: string; logoUrl: string | null; primary: string; secondary: string;
  accent: string; textColor: string; font: string; headerText: string; template: string;
}) {
  const fontFamily = FONT_CSS[font] ?? FONT_CSS.body;
  return (
    <div style={{
      width: "100%", aspectRatio: "9/16", borderRadius: 28,
      overflow: "hidden", border: "8px solid #1A1612",
      boxShadow: "0 0 0 2px #2E2A1E, 0 24px 64px rgba(0,0,0,0.4)",
      backgroundColor: secondary, fontFamily, position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 80, height: 20, backgroundColor: "#1A1612", borderRadius: "0 0 14px 14px", zIndex: 10 }} />
      <div style={{ backgroundColor: primary, padding: "28px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {logoUrl && <Image src={logoUrl} alt="" width={22} height={22} style={{ borderRadius: 3, objectFit: "contain", opacity: 0.9, flexShrink: 0 }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>{headerText || companyName}</span>
        </div>
        <span style={{ fontSize: 8, fontWeight: 600, color: accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>Tagit</span>
      </div>
      <div style={{ margin: "0 10px", padding: "6px 10px", backgroundColor: "rgba(45,106,79,0.18)", borderRadius: "0 0 8px 8px", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <Shield size={8} color="#4ADE80" strokeWidth={2.5} />
        <span style={{ fontSize: 8, fontWeight: 600, color: "#4ADE80" }}>Verified Authentic</span>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 8, color: "#4ADE80", opacity: 0.6 }}>TGT-XXXX</span>
      </div>
      {template === "classic" && (
        <div style={{ margin: "10px 10px 0", padding: 12, backgroundColor: "#fff", borderRadius: 10, border: "1px solid #E8E2D5", flexShrink: 0 }}>
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 6, backgroundColor: secondary, marginBottom: 8, border: "1px solid #E8E2D5" }} />
          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#0A0A0B" }}>Sample Product</p>
          <p style={{ margin: 0, fontSize: 9, color: "#6E6E73" }}>NGN 150,000</p>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, backgroundColor: "#E8E2D5", borderRadius: 4, overflow: "hidden" }}>
            {[["Material", "Full-grain leather"], ["Made in", "Lagos, NG"]].map(([k, v]) => (
              <div key={k} style={{ padding: "6px 8px", backgroundColor: "#FAFAF8" }}>
                <p style={{ margin: "0 0 1px", fontSize: 7, color: "#9E9EA3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</p>
                <p style={{ margin: 0, fontSize: 9, color: "#1F1F22", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {template === "minimal" && (
        <div style={{ margin: 10, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: 10, backgroundColor: "#E8E2D5", marginBottom: 12 }} />
          <p style={{ margin: "0 0 4px", fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 18, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>Sample Product</p>
          <p style={{ margin: 0, fontSize: 9, color: "#9E9EA3", fontFamily: "monospace", letterSpacing: "0.04em" }}>NGN 150,000</p>
        </div>
      )}
      {template === "editorial" && (
        <div style={{ margin: "16px 14px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ margin: "0 0 4px", fontFamily: "monospace", fontSize: 8, color: accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>Fashion</p>
          <p style={{ margin: "0 0 10px", fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 24, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Sample<br />Product</p>
          <p style={{ margin: 0, fontSize: 10, color: "#6E6E73", lineHeight: 1.65 }}>Crafted from full-grain leather, this piece embodies the spirit of Lagos craftsmanship.</p>
        </div>
      )}
      <div style={{ margin: "auto 10px 10px", padding: "10px 12px", borderRadius: 8, backgroundColor: primary, flexShrink: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 600, color: textColor }}>Claim ownership</p>
        <p style={{ margin: 0, fontSize: 8, color: accent, lineHeight: 1.4 }}>Register this item to your name.</p>
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
      width: "100%", aspectRatio: "9/16", borderRadius: 28, overflow: "hidden",
      border: "8px solid #1A1612", boxShadow: "0 0 0 2px #2E2A1E, 0 24px 64px rgba(0,0,0,0.4)",
      backgroundColor: palette.background, fontFamily, position: "relative",
      display: "flex", flexDirection: "column", padding: "22px 14px 14px",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 80, height: 18, backgroundColor: "#1A1612", borderRadius: "0 0 14px 14px", zIndex: 10 }} />

      {/* top: logo + reference marker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {logoUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={logoUrl} alt="" style={{ height: 16, maxWidth: 70, objectFit: "contain" }} />
          : <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontStyle: "italic", fontSize: 12, color: palette.textPrimary }}>{companyName}</span>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 99, backgroundColor: palette.badgeBg, border: `1px solid ${palette.divider}` }}>
          <span style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: "monospace", fontSize: 5.5, letterSpacing: "0.12em", textTransform: "uppercase", color: palette.badgeText }}>Reference</span>
        </span>
      </div>

      {/* photo mat */}
      <div style={{ backgroundColor: surface, border: `1px solid ${palette.divider}`, borderRadius: 4, aspectRatio: "1/1", padding: 8 }}>
        <div style={{ width: "100%", height: "100%", border: `1px solid ${palette.divider}` }} />
      </div>

      {/* title + brand */}
      <p style={{ margin: "12px 0 2px", fontFamily: "'Instrument Serif',Georgia,serif", fontStyle: "italic", fontSize: 19, lineHeight: 1.05, color: palette.textPrimary, letterSpacing: "-0.02em" }}>Sample Piece</p>
      <p style={{ margin: 0, fontFamily: "monospace", fontSize: 6.5, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.textSecondary }}>{companyName}</p>

      {/* lozenge divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
        <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
        <span style={{ width: 5, height: 5, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        <span style={{ flex: 1, height: 1, backgroundColor: palette.divider }} />
      </div>

      {/* spec rows */}
      {[["Medium", "Oil on canvas"], ["Dimensions", "90 × 120 cm"]].map(([k, v], i) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${palette.divider}` }}>
          <span style={{ fontFamily: "monospace", fontSize: 6, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.textSecondary }}>{k}</span>
          <span style={{ fontSize: 9, color: palette.textPrimary }}>{v}</span>
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: 0.7 }}>
        <span style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
        <span style={{ fontFamily: "monospace", fontSize: 5.5, letterSpacing: "0.18em", textTransform: "uppercase", color: palette.textSecondary }}>Powered by Tagit</span>
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
      width: "100%", aspectRatio: "9/16", borderRadius: 28, overflow: "hidden",
      border: "8px solid #1A1612", boxShadow: "0 0 0 2px #2E2A1E, 0 24px 64px rgba(0,0,0,0.4)",
      backgroundColor: palette.background, fontFamily, position: "relative",
      display: "flex", flexDirection: "column", padding: "26px 16px 14px",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 80, height: 18, backgroundColor: "#1A1612", borderRadius: "0 0 14px 14px", zIndex: 10 }} />
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
        <span style={{ fontFamily: "monospace", fontSize: 5.5, letterSpacing: "0.16em", textTransform: "uppercase", color: palette.textSecondary }}>Powered by Tagit</span>
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
    { key: "brand_primary_color",   label: "Header / Brand",  hint: "Background of the header bar on scan pages" },
    { key: "brand_text_color",      label: "Header text",     hint: "Text and logo colour on the header" },
    { key: "brand_secondary_color", label: "Page background", hint: "Main background colour of scan pages" },
    { key: "brand_accent_color",    label: "Accent",          hint: "Highlights, links, CTA buttons — also used on certificates" },
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

  // The switchable preview, shared by the desktop sticky rail and the mobile
  // block. `phone` surfaces are tall and self-framed; `paper` surfaces (the
  // PDFs) get a narrower column.
  const previewPanel = (
    <div>
      <p className="font-semibold uppercase tracking-widest mb-3" style={{ fontSize: "var(--text-micro)", color: "var(--color-slate)" }}>
        Live preview
      </p>

      {/* Surface switcher */}
      <div className="relative mb-4">
        <select
          value={previewSurface}
          onChange={(e) => setPreviewSurface(e.target.value as Surface)}
          aria-label="Choose what to preview"
          className="w-full appearance-none rounded-lg font-medium"
          style={{
            padding: "10px 36px 10px 12px",
            fontSize: "var(--text-body-sm)",
            color: "var(--color-charcoal)",
            backgroundColor: "#fff",
            border: "1px solid var(--color-cream)",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {surfaces.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-mist)", pointerEvents: "none" }} />
      </div>

      {/* The preview itself */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: activeSurface.kind === "phone" ? 232 : 252 }}>
          {renderSurface(previewSurface)}
        </div>
      </div>

      <p className="mt-3 text-center" style={{ fontSize: 10, color: "var(--color-mist)" }}>
        {activeSurface.kind === "paper" ? "Print-ready design · " : ""}Updates live · save to publish
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl"
        style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 flex-1 justify-center rounded-lg font-medium transition-all"
              style={{
                padding: "9px 16px",
                fontSize: "var(--text-body-sm)",
                backgroundColor: active ? "#FFFFFF" : "transparent",
                color: active ? "var(--color-charcoal)" : "var(--color-mist)",
                border: "none",
                cursor: "pointer",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span style={{ color: active ? "var(--color-gold)" : "var(--color-mist)" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content + persistent right panel ───────────────────────────── */}
      <div
        className="lg:grid"
        style={{ gridTemplateColumns: "1fr 240px", gap: 32, alignItems: "start" }}
      >

        {/* ── Left: tab content ─────────────────────────────────────────── */}
        <div>

          {/* ════════════════════════════════════════════════════════════
              TAB 1 — BRAND IDENTITY
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "brand" && (
            <div className="space-y-6">

              {/* Logo */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Brand logo</h2>
                <p className="mb-5" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Shown in the header of every scan page and on certificates. PNG or SVG recommended.
                </p>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div style={{ position: "relative", width: 72, height: 72 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo" style={{ width: 72, height: 72, borderRadius: 10, objectFit: "contain", border: "1px solid var(--color-cream)", backgroundColor: "#fff", padding: 6 }} />
                      <button type="button" onClick={handleRemoveLogo} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--color-alert)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={10} color="#fff" />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 10, border: "2px dashed var(--color-stone)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-smoke)" }}>
                      <Upload size={20} style={{ color: "var(--color-mist)" }} />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoUploading} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium" style={{ fontSize: "var(--text-body-sm)", backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)", cursor: logoUploading ? "not-allowed" : "pointer" }}>
                      {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {logoUploading ? "Uploading…" : logoPreview ? "Replace logo" : "Upload logo"}
                    </button>
                    <p className="mt-1.5" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>PNG, JPG, WebP or SVG · max 2 MB</p>
                  </div>
                </div>
              </section>

              {/* Colours */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Brand colours</h2>
                <p className="mb-5" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Applied across scan pages and PDF certificates. Watch the preview update live on the right.
                </p>
                <div className="grid grid-cols-2 gap-5">
                  {colorFields.map(({ key, label, hint }) => (
                    <div key={key}>
                      <p className="font-medium mb-2" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{label}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <input type="color" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} style={{ width: 38, height: 38, border: "1px solid var(--color-stone)", borderRadius: "var(--radius-sm)", padding: 2, cursor: "pointer", backgroundColor: "transparent" }} />
                        <Input type="text" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} maxLength={7} style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)", fontFamily: "var(--font-jetbrains-mono)" }} />
                      </div>
                      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>{hint}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-lg overflow-hidden flex" style={{ height: 32, border: "1px solid var(--color-cream)" }}>
                  <div style={{ flex: 1, backgroundColor: form.brand_primary_color }} />
                  <div style={{ flex: 1, backgroundColor: form.brand_text_color }} />
                  <div style={{ flex: 1, backgroundColor: form.brand_secondary_color }} />
                  <div style={{ flex: 1, backgroundColor: form.brand_accent_color }} />
                </div>
                <p className="mt-2 text-center" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>Colour palette preview</p>
              </section>

              {/* Typography */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Typography</h2>
                <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>Choose the typeface displayed on your scan pages.</p>
                <div className="grid gap-2">
                  {FONT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => set("brand_font", opt.value)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "var(--radius-md)", border: `2px solid ${form.brand_font === opt.value ? "var(--color-gold)" : "var(--color-cream)"}`, backgroundColor: form.brand_font === opt.value ? "var(--color-soft-gold)" : "var(--color-smoke)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <span style={{ fontSize: 20, color: form.brand_font === opt.value ? "var(--color-deep-gold)" : "var(--color-charcoal)", fontFamily: FONT_CSS[opt.value], minWidth: 32, fontStyle: opt.value === "display" ? "italic" : "normal" }}>Aa</span>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: "var(--text-body-sm)", fontWeight: 600, color: form.brand_font === opt.value ? "var(--color-deep-gold)" : "var(--color-charcoal)" }}>{opt.label}</p>
                        <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Brand content */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Brand content</h2>
                <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>Text shown at the top of your scan pages.</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Custom header text</Label>
                    <Input type="text" value={form.custom_header_text} onChange={(e) => set("custom_header_text", e.target.value)} placeholder="e.g. Crafted in Lagos. Worn worldwide." style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Brand story</Label>
                    <textarea value={form.brand_story} onChange={(e) => set("brand_story", e.target.value)} placeholder="The story behind your brand — shown on product scan pages." rows={4} style={{ width: "100%", border: "1px solid var(--color-stone)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: "var(--text-body-sm)", color: "var(--color-onyx)", backgroundColor: "var(--color-pearl)", resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                  </div>
                </div>
              </section>

              {/* Social links */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={14} style={{ color: "var(--color-gold)" }} />
                  <h2 className="font-semibold" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Social & web links</h2>
                </div>
                <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>Appear as tappable buttons at the bottom of every scan page.</p>
                <div className="space-y-4">
                  {[
                    { key: "social_website",   label: "Website",     placeholder: "https://yourbrand.com" },
                    { key: "social_instagram", label: "Instagram",   placeholder: "https://instagram.com/yourbrand" },
                    { key: "social_twitter",   label: "X / Twitter", placeholder: "https://x.com/yourbrand" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>{label}</Label>
                      <Input type="url" value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB 2 — SCAN PAGE
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "scan" && (
            <div className="space-y-6">
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Page layout</h2>
                <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Choose how your product information is laid out on the consumer scan page. The live preview on the right updates instantly.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {SCAN_TEMPLATES.map((t) => (
                    <button key={t.value} type="button" onClick={() => set("brand_template", t.value)} style={{ padding: "16px 12px", borderRadius: "var(--radius-md)", border: `2px solid ${form.brand_template === t.value ? "var(--color-gold)" : "var(--color-cream)"}`, backgroundColor: form.brand_template === t.value ? "var(--color-soft-gold)" : "var(--color-smoke)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <p className="font-semibold mb-1" style={{ fontSize: "var(--text-body-sm)", color: form.brand_template === t.value ? "var(--color-deep-gold)" : "var(--color-charcoal)" }}>{t.label}</p>
                      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.45 }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-cream)" }}>
                <p className="font-medium mb-1" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-deep-gold)" }}>
                  Colours & typography apply here too
                </p>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-graphite)", lineHeight: 1.6 }}>
                  Your brand colours and font from the Brand identity tab are applied automatically. Change them there and the preview on the right updates.
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              TAB 3 — CERTIFICATES
          ════════════════════════════════════════════════════════════ */}
          {activeTab === "certificates" && (
            <div className="space-y-6">

              {/* What is a certificate */}
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, var(--color-soft-gold) 0%, var(--color-pearl) 100%)", border: "1px solid var(--color-cream)" }}>
                <div className="flex items-start gap-4">
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award size={22} color="#fff" />
                  </div>
                  <div>
                    <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Certificate of Authenticity</h2>
                    <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", lineHeight: 1.65 }}>
                      Every time a customer claims ownership or receives a transfer, Tagit automatically generates a branded PDF certificate and emails it to them.
                      It includes your logo, brand colours, the owner&apos;s name, product details, a unique certificate number, and a QR code for instant verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Template picker */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Choose a certificate design</h2>
                <p className="mb-5" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Your brand logo and colours are applied automatically. The preview on the right shows the selected design live.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {CERT_TEMPLATES.map((t) => {
                    const active = form.cert_template === t.value;
                    return (
                      <button key={t.value} type="button" onClick={() => set("cert_template", t.value)} style={{ padding: "12px", borderRadius: "var(--radius-md)", border: `2px solid ${active ? "var(--color-gold)" : "var(--color-cream)"}`, backgroundColor: active ? "var(--color-soft-gold)" : "var(--color-smoke)", cursor: "pointer", textAlign: "left", transition: "all 0.15s", position: "relative" }}>
                        {active && (
                          <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", backgroundColor: "var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                        <div style={{ marginBottom: 10, borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}>
                          {t.value === "classic"  && <CertPreviewClassic  {...certPreviewProps} />}
                          {t.value === "minimal"  && <CertPreviewMinimal  {...certPreviewProps} />}
                          {t.value === "heritage" && <CertPreviewHeritage {...certPreviewProps} />}
                        </div>
                        <p className="font-semibold mb-0.5" style={{ fontSize: "var(--text-body-sm)", color: active ? "var(--color-deep-gold)" : "var(--color-charcoal)" }}>{t.label}</p>
                        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.45 }}>{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Signature */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <PenLine size={14} style={{ color: "var(--color-gold)" }} />
                  <h2 className="font-semibold" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Certificate signature</h2>
                </div>
                <p className="mb-5" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Draw or upload your signature — it appears on every certificate your brand issues.
                  If left blank, &ldquo;Authorized by {company.name}&rdquo; is shown in italic.
                </p>
                <SignaturePanel
                  companyName={company.name}
                  preview={signaturePreview}
                  onSave={saveSignature}
                  onRemove={handleRemoveSignature}
                />
              </section>

              {/* What's on the certificate */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-4" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>What every certificate includes</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Your brand logo & colours", "Applied from your Brand identity settings"],
                    ["Your authorized signature",  "Your uploaded signature or company name"],
                    ["Owner's full name & email",  "Recorded at time of claim or transfer"],
                    ["Product name & details",     "Pulled from your registered product"],
                    ["Unique certificate number",  "Format: TGT-YYYY-XXXXXX"],
                    ["QR verification code",       "Links to the public verification page"],
                  ].map(([title, sub]) => (
                    <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-smoke)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-gold)", marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p className="font-medium" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", marginBottom: 2 }}>{title}</p>
                        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* When it's sent */}
              <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
                <h2 className="font-semibold mb-4" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>When certificates are sent</h2>
                <div className="space-y-3">
                  {[
                    { label: "Ownership claim approved", desc: "You approve a claim in the Ownership tab → certificate emailed to the new owner instantly." },
                    { label: "Ownership transfer accepted", desc: "A customer completes a transfer → certificate emailed to the recipient automatically." },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4ADE80", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <p className="font-semibold mb-1" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{label}</p>
                        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.55 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

        </div>

        {/* ── Right: switchable live preview (desktop) ──────────────────── */}
        <div className="hidden lg:block">
          <div style={{ position: "sticky", top: 24 }}>
            {previewPanel}
          </div>
        </div>

      </div>

      {/* ── Mobile live preview (the rail is desktop-only) ──────────────── */}
      <div className="lg:hidden mt-8 rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
        {previewPanel}
      </div>

      {/* ── Save button ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-4">
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ fontSize: "var(--text-body-sm)", backgroundColor: loading ? "var(--color-stone)" : "var(--color-onyx)", color: "var(--color-pearl)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {loading ? "Saving…" : "Save all settings"}
        </button>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>Changes apply across all tabs when saved</p>
      </div>

    </form>
  );
}
