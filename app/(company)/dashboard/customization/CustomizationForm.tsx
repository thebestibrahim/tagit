"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Shield, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Company = {
  name: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_font: string;
  brand_story: string | null;
  custom_header_text: string | null;
  social_links: Record<string, string>;
};

const FONT_OPTIONS = [
  { value: "body",    label: "Inter Tight (default)" },
  { value: "display", label: "Instrument Serif" },
  { value: "mono",    label: "JetBrains Mono" },
];

const FONT_CSS: Record<string, string> = {
  body:    "system-ui,-apple-system,sans-serif",
  display: "'Instrument Serif',Georgia,serif",
  mono:    "'JetBrains Mono',monospace",
};

function ScanPagePreview({
  companyName,
  primary,
  secondary,
  accent,
  font,
  headerText,
}: {
  companyName: string;
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  headerText: string;
}) {
  const fontFamily = FONT_CSS[font] ?? FONT_CSS.body;

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "9/16",
        maxHeight: "600px",
        borderRadius: "28px",
        overflow: "hidden",
        border: "8px solid #1A1612",
        boxShadow: "0 0 0 2px #2E2A1E, 0 20px 60px rgba(0,0,0,0.35)",
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
        <span style={{ fontSize: "13px", fontWeight: 700, color: secondary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          {headerText || companyName}
        </span>
        <span style={{ fontSize: "8px", fontWeight: 600, color: accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Tagit
        </span>
      </div>

      {/* Verification badge */}
      <div style={{ margin: "0 10px", padding: "7px 10px", backgroundColor: "#DCEEE3", borderRadius: "0 0 8px 8px", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        <Shield size={9} color="#2D6A4F" strokeWidth={2} />
        <span style={{ fontSize: "9px", fontWeight: 600, color: "#2D6A4F" }}>Verified by Tagit</span>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "8px", color: "#2D6A4F" }}>TGT-XXXX</span>
      </div>

      {/* Product card */}
      <div style={{ margin: "10px 10px 0", padding: "12px", backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #E8E2D5", flexShrink: 0 }}>
        <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: "6px", backgroundColor: secondary, marginBottom: "8px", border: "1px solid #E8E2D5" }} />
        <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "#0A0A0B", letterSpacing: "-0.01em" }}>
          Sample Product
        </p>
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

      {/* Claim CTA */}
      <div style={{ margin: "8px 10px 0", padding: "10px 12px", borderRadius: "8px", backgroundColor: primary, flexShrink: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 600, color: secondary }}>Claim ownership</p>
        <p style={{ margin: 0, fontSize: "8px", color: accent, lineHeight: 1.4 }}>Register this item to your name and receive a certificate of authenticity.</p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", padding: "8px", textAlign: "center", flexShrink: 0 }}>
        <p style={{ fontSize: "7px", color: "#9E9EA3", margin: 0 }}>Authenticated by <span style={{ fontWeight: 600 }}>Tagit</span></p>
      </div>
    </div>
  );
}

export default function CustomizationForm({ company }: { company: Company }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand_primary_color:   company.brand_primary_color,
    brand_secondary_color: company.brand_secondary_color,
    brand_accent_color:    company.brand_accent_color,
    brand_font:            company.brand_font,
    brand_story:           company.brand_story ?? "",
    custom_header_text:    company.custom_header_text ?? "",
    social_instagram:      (company.social_links as Record<string, string>)?.instagram ?? "",
    social_website:        (company.social_links as Record<string, string>)?.website ?? "",
    social_twitter:        (company.social_links as Record<string, string>)?.twitter ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
        brand_font:            form.brand_font,
        brand_story:           form.brand_story || null,
        custom_header_text:    form.custom_header_text || null,
        social_links: {
          instagram: form.social_instagram || undefined,
          website:   form.social_website || undefined,
          twitter:   form.social_twitter || undefined,
        },
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

  return (
    <div className="lg:grid lg:gap-8" style={{ gridTemplateColumns: "1fr 280px" }}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
        {/* Colors */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            Brand colors
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "brand_primary_color",   label: "Primary" },
              { key: "brand_secondary_color", label: "Secondary" },
              { key: "brand_accent_color",    label: "Accent" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                  {label}
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => set(key, e.target.value)}
                    style={{
                      width: 36,
                      height: 36,
                      border: "1px solid var(--color-stone)",
                      borderRadius: "var(--radius-sm)",
                      padding: 2,
                      cursor: "pointer",
                      backgroundColor: "transparent",
                    }}
                  />
                  <Input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => set(key, e.target.value)}
                    maxLength={7}
                    style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)", fontFamily: "var(--font-jetbrains-mono)" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preview bar */}
          <div className="mt-5 rounded-lg overflow-hidden h-8 flex" style={{ border: "1px solid var(--color-cream)" }}>
            <div style={{ flex: 1, backgroundColor: form.brand_primary_color }} />
            <div style={{ flex: 1, backgroundColor: form.brand_secondary_color }} />
            <div style={{ flex: 1, backgroundColor: form.brand_accent_color }} />
          </div>
        </div>

        {/* Typography */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            Typography
          </h2>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Scan page font
            </Label>
            <select
              value={form.brand_font}
              onChange={(e) => set("brand_font", e.target.value)}
              style={{
                width: "100%",
                border: "1px solid var(--color-stone)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-onyx)",
                backgroundColor: "var(--color-pearl)",
                outline: "none",
              }}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand content */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            Brand content
          </h2>
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
              <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                Brand story
              </Label>
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
                }}
              />
            </div>
          </div>
        </div>

        {/* Social links */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            Social & web links
          </h2>
          <div className="space-y-4">
            {[
              { key: "social_website",   label: "Website",     placeholder: "https://yourbrand.com" },
              { key: "social_instagram", label: "Instagram",   placeholder: "https://instagram.com/yourbrand" },
              { key: "social_twitter",   label: "X / Twitter", placeholder: "https://x.com/yourbrand" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                  {label}
                </Label>
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-body-sm"
          style={{
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
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={14} style={{ color: "var(--color-gold)" }} />
            <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-slate)" }}>
              Live preview
            </p>
          </div>
          <ScanPagePreview
            companyName={company.name}
            primary={form.brand_primary_color}
            secondary={form.brand_secondary_color}
            accent={form.brand_accent_color}
            font={form.brand_font}
            headerText={form.custom_header_text}
          />
          <p className="mt-3 text-center" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
            Updates as you edit — save to publish
          </p>
        </div>
      </div>
    </div>
  );
}
