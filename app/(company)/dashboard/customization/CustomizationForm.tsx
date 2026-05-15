"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Save, Smartphone, Upload, X, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
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
};

const FONT_OPTIONS = [
  { value: "body",    label: "Inter Tight — clean & modern" },
  { value: "display", label: "Instrument Serif — elegant & italic" },
  { value: "mono",    label: "JetBrains Mono — technical & precise" },
];

const FONT_CSS: Record<string, string> = {
  body:    "system-ui,-apple-system,sans-serif",
  display: "'Instrument Serif',Georgia,serif",
  mono:    "'JetBrains Mono',monospace",
};

const TEMPLATES = [
  { value: "classic",   label: "Classic",   desc: "Full product card with fields grid" },
  { value: "minimal",   label: "Minimal",   desc: "Photo, name, and key facts only" },
  { value: "editorial", label: "Editorial", desc: "Large type, story-first layout" },
];

function ScanPagePreview({
  companyName,
  logoUrl,
  primary,
  secondary,
  accent,
  textColor,
  font,
  headerText,
  template,
}: {
  companyName: string;
  logoUrl: string | null;
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  font: string;
  headerText: string;
  template: string;
}) {
  const fontFamily = FONT_CSS[font] ?? FONT_CSS.body;

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "9/16",
        maxHeight: "580px",
        borderRadius: "28px",
        overflow: "hidden",
        border: "8px solid #1A1612",
        boxShadow: "0 0 0 2px #2E2A1E, 0 24px 64px rgba(0,0,0,0.4)",
        backgroundColor: secondary,
        fontFamily,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Notch */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "80px", height: "20px", backgroundColor: "#1A1612", borderRadius: "0 0 14px 14px", zIndex: 10 }} />

      {/* Header */}
      <div
        style={{
          backgroundColor: primary,
          padding: "28px 14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {logoUrl && (
            <Image
              src={logoUrl}
              alt=""
              width={22}
              height={22}
              style={{ borderRadius: 3, objectFit: "contain", opacity: 0.9, flexShrink: 0 }}
            />
          )}
          <span style={{ fontSize: "13px", fontWeight: 700, color: textColor, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            {headerText || companyName}
          </span>
        </div>
        <span style={{ fontSize: "8px", fontWeight: 600, color: accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Tagit
        </span>
      </div>

      {/* Verified strip */}
      <div style={{ margin: "0 10px", padding: "6px 10px", backgroundColor: "rgba(45,106,79,0.18)", borderRadius: "0 0 8px 8px", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        <Shield size={8} color="#4ADE80" strokeWidth={2.5} />
        <span style={{ fontSize: "8px", fontWeight: 600, color: "#4ADE80" }}>Verified Authentic</span>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "8px", color: "#4ADE80", opacity: 0.6 }}>TGT-XXXX</span>
      </div>

      {/* Content area — varies by template */}
      {template === "classic" && (
        <div style={{ margin: "10px 10px 0", padding: "12px", backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #E8E2D5", flexShrink: 0 }}>
          <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "6px", backgroundColor: secondary, marginBottom: "8px", border: "1px solid #E8E2D5" }} />
          <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "#0A0A0B", letterSpacing: "-0.01em" }}>Sample Product</p>
          <p style={{ margin: 0, fontSize: "9px", color: "#6E6E73" }}>NGN 150,000</p>
          <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", backgroundColor: "#E8E2D5", borderRadius: "4px", overflow: "hidden" }}>
            {[["Material", "Full-grain leather"], ["Made in", "Lagos, NG"]].map(([k, v]) => (
              <div key={k} style={{ padding: "6px 8px", backgroundColor: "#FAFAF8" }}>
                <p style={{ margin: "0 0 1px", fontSize: "7px", color: "#9E9EA3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</p>
                <p style={{ margin: 0, fontSize: "9px", color: "#1F1F22", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {template === "minimal" && (
        <div style={{ margin: "10px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "10px", backgroundColor: "#E8E2D5", overflow: "hidden", marginBottom: "12px" }} />
          <p style={{ margin: "0 0 4px", fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "18px", fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>
            Sample Product
          </p>
          <p style={{ margin: 0, fontSize: "9px", color: "#9E9EA3", fontFamily: "monospace", letterSpacing: "0.04em" }}>NGN 150,000</p>
        </div>
      )}

      {template === "editorial" && (
        <div style={{ margin: "16px 14px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ margin: "0 0 4px", fontFamily: "monospace", fontSize: "8px", color: accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>Fashion</p>
          <p style={{ margin: "0 0 10px", fontFamily: "'Instrument Serif',Georgia,serif", fontSize: "24px", fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Sample<br />Product
          </p>
          <p style={{ margin: 0, fontSize: "10px", color: "#6E6E73", lineHeight: 1.65, letterSpacing: "-0.003em" }}>
            Crafted from full-grain leather, this piece embodies the spirit of Lagos craftsmanship.
          </p>
        </div>
      )}

      {/* Claim CTA */}
      <div style={{ margin: "auto 10px 10px", padding: "10px 12px", borderRadius: "8px", backgroundColor: primary, flexShrink: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: "10px", fontWeight: 600, color: textColor }}>Claim ownership</p>
        <p style={{ margin: 0, fontSize: "8px", color: accent, lineHeight: 1.4 }}>Register this item to your name.</p>
      </div>
    </div>
  );
}

export default function CustomizationForm({ company }: { company: Company }) {
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    brand_primary_color:   company.brand_primary_color   || "#0A0A0B",
    brand_secondary_color: company.brand_secondary_color || "#FAFAF8",
    brand_accent_color:    company.brand_accent_color    || "#B8945D",
    brand_text_color:      company.brand_text_color      || "#FAFAF8",
    brand_font:            company.brand_font            || "body",
    brand_template:        company.brand_template        || "classic",
    brand_story:           company.brand_story ?? "",
    custom_header_text:    company.custom_header_text ?? "",
    social_instagram:      (company.social_links as Record<string, string>)?.instagram ?? "",
    social_website:        (company.social_links as Record<string, string>)?.website ?? "",
    social_twitter:        (company.social_links as Record<string, string>)?.twitter ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    const json = await res.json();
    setLogoUploading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Logo upload failed.");
      return;
    }
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
    if (!res.ok) {
      toast.error(json.error ?? "Failed to save.");
      setLoading(false);
      return;
    }
    toast.success("Brand settings saved.");
    setLoading(false);
  }

  const colorFields = [
    { key: "brand_primary_color",   label: "Header / Brand",    hint: "Background of the header bar" },
    { key: "brand_text_color",      label: "Header text",       hint: "Text and logo on the header" },
    { key: "brand_secondary_color", label: "Page background",   hint: "Main page background colour" },
    { key: "brand_accent_color",    label: "Accent",            hint: "Links, highlights, CTA elements" },
  ];

  return (
    <div className="lg:grid lg:gap-10" style={{ gridTemplateColumns: "1fr 260px" }}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 min-w-0">

        {/* Logo */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Brand logo</h2>
          <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
            Shown in the header of every scan page. PNG or SVG recommended.
          </p>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div style={{ position: "relative", width: 64, height: 64 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- blob URL from file input, incompatible with next/image */}
              <img
                  src={logoPreview}
                  alt="Logo"
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: "contain", border: "1px solid var(--color-cream)", backgroundColor: "#fff" }}
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-alert)",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={10} color="#fff" />
                </button>
              </div>
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  border: "2px dashed var(--color-stone)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--color-smoke)",
                }}
              >
                <Upload size={18} style={{ color: "var(--color-mist)" }} />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                style={{
                  fontSize: "var(--text-body-sm)",
                  backgroundColor: "var(--color-linen)",
                  color: "var(--color-graphite)",
                  border: "1px solid var(--color-cream)",
                  cursor: logoUploading ? "not-allowed" : "pointer",
                }}
              >
                {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {logoUploading ? "Uploading…" : logoPreview ? "Replace logo" : "Upload logo"}
              </button>
              <p className="mt-1.5" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                PNG, JPG, WebP or SVG · max 2 MB
              </p>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Colours</h2>
          <p className="mb-5" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
            Define your full colour palette — header, background, text, and accents separately.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {colorFields.map(({ key, label, hint }) => (
              <div key={key}>
                <p className="font-medium mb-1" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{label}</p>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="color"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => set(key, e.target.value)}
                    style={{ width: 36, height: 36, border: "1px solid var(--color-stone)", borderRadius: "var(--radius-sm)", padding: 2, cursor: "pointer", backgroundColor: "transparent" }}
                  />
                  <Input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => set(key, e.target.value)}
                    maxLength={7}
                    style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)", fontFamily: "var(--font-jetbrains-mono)" }}
                  />
                </div>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>{hint}</p>
              </div>
            ))}
          </div>

          {/* Swatch bar */}
          <div className="mt-5 rounded-lg overflow-hidden flex" style={{ height: 28, border: "1px solid var(--color-cream)" }}>
            <div style={{ flex: 1, backgroundColor: form.brand_primary_color }} />
            <div style={{ flex: 1, backgroundColor: form.brand_text_color }} />
            <div style={{ flex: 1, backgroundColor: form.brand_secondary_color }} />
            <div style={{ flex: 1, backgroundColor: form.brand_accent_color }} />
          </div>
        </section>

        {/* Template */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Page template</h2>
          <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
            Choose the layout style for your scan pages.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("brand_template", t.value)}
                style={{
                  padding: "14px 12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${form.brand_template === t.value ? "var(--color-gold)" : "var(--color-cream)"}`,
                  backgroundColor: form.brand_template === t.value ? "var(--color-soft-gold)" : "var(--color-smoke)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <p className="font-semibold mb-1" style={{ fontSize: "var(--text-body-sm)", color: form.brand_template === t.value ? "var(--color-deep-gold)" : "var(--color-charcoal)" }}>
                  {t.label}
                </p>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.45 }}>
                  {t.desc}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Typography</h2>
          <div className="grid gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("brand_font", opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${form.brand_font === opt.value ? "var(--color-gold)" : "var(--color-cream)"}`,
                  backgroundColor: form.brand_font === opt.value ? "var(--color-soft-gold)" : "var(--color-smoke)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: form.brand_font === opt.value ? "var(--color-deep-gold)" : "var(--color-charcoal)",
                    fontFamily: FONT_CSS[opt.value],
                    minWidth: 28,
                    fontStyle: opt.value === "display" ? "italic" : "normal",
                  }}
                >
                  Aa
                </span>
                <span style={{ fontSize: "var(--text-body-sm)", color: form.brand_font === opt.value ? "var(--color-deep-gold)" : "var(--color-graphite)" }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Brand content */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Brand content</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                Custom header text
                <span className="ml-1" style={{ color: "var(--color-mist)", fontWeight: 400 }}>(shown at top of scan page)</span>
              </Label>
              <Input
                type="text"
                value={form.custom_header_text}
                onChange={(e) => set("custom_header_text", e.target.value)}
                placeholder="e.g. Crafted in Lagos. Worn worldwide."
                style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }}
              />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Brand story</Label>
              <textarea
                value={form.brand_story}
                onChange={(e) => set("brand_story", e.target.value)}
                placeholder="The story behind your brand — shown on product scan pages."
                rows={4}
                style={{
                  width: "100%",
                  border: "1px solid var(--color-stone)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-onyx)",
                  backgroundColor: "var(--color-pearl)",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </section>

        {/* Social links */}
        <section className="rounded-2xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <h2 className="font-semibold mb-1" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>Social & web links</h2>
          <p className="mb-4" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
            Appear as tappable buttons at the bottom of every scan page.
          </p>
          <div className="space-y-4">
            {[
              { key: "social_website",   label: "Website",     placeholder: "https://yourbrand.com" },
              { key: "social_instagram", label: "Instagram",   placeholder: "https://instagram.com/yourbrand" },
              { key: "social_twitter",   label: "X / Twitter", placeholder: "https://x.com/yourbrand" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>{label}</Label>
                <Input
                  type="url"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }}
                />
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
          style={{
            fontSize: "var(--text-body-sm)",
            backgroundColor: loading ? "var(--color-stone)" : "var(--color-onyx)",
            color: "var(--color-pearl)",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {loading ? "Saving…" : "Save brand settings"}
        </button>
      </form>

      {/* Sticky live preview */}
      <div className="hidden lg:block">
        <div style={{ position: "sticky", top: "24px" }}>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={13} style={{ color: "var(--color-gold)" }} />
            <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-slate)" }}>
              Live preview
            </p>
          </div>
          <ScanPagePreview
            companyName={company.name}
            logoUrl={logoPreview}
            primary={form.brand_primary_color}
            secondary={form.brand_secondary_color}
            accent={form.brand_accent_color}
            textColor={form.brand_text_color}
            font={form.brand_font}
            headerText={form.custom_header_text}
            template={form.brand_template}
          />
          <p className="mt-3 text-center" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
            Updates live as you edit · save to publish
          </p>
        </div>
      </div>
    </div>
  );
}
