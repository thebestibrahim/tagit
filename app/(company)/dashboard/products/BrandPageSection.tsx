"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy, Check, ExternalLink, Pencil, Globe } from "lucide-react";
import { validateSlug } from "@/lib/brand-page";

const BIO_MAX = 280;

export default function BrandPageSection({
  initialSlug,
  initialBio,
  initialEnabled,
}: {
  initialSlug: string | null;
  initialBio: string | null;
  initialEnabled: boolean;
}) {
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [bio, setBio] = useState(initialBio ?? "");
  const [savedBio, setSavedBio] = useState(initialBio ?? "");

  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftSlug, setDraftSlug] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://tagitlux.com";
  const host = origin.replace(/^https?:\/\//, "");
  const fullUrl = slug ? `${origin}/${slug}` : "";

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/company/page/generate", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) { toast.error(json.error ?? "Could not generate your page."); return; }
    setSlug(json.slug);
    setEnabled(true);
    toast.success("Your brand page is live.");
  }

  function startEditing() {
    setDraftSlug(slug ?? "");
    setEditing(true);
  }

  async function handleSaveSlug() {
    const v = validateSlug(draftSlug);
    if (!v.valid) { toast.error(v.error); return; }
    if (v.slug === slug) { setEditing(false); return; }
    setSavingSlug(true);
    const res = await fetch("/api/company/page/slug", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: v.slug }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingSlug(false);
    if (!res.ok) { toast.error(json.error ?? "Could not update your slug."); return; }
    setSlug(json.slug);
    setEditing(false);
    toast.success("Link updated.");
  }

  async function handleSaveBio() {
    if (bio.length > BIO_MAX) { toast.error(`Bio must be ${BIO_MAX} characters or fewer.`); return; }
    setSavingBio(true);
    const res = await fetch("/api/company/page", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_bio: bio }),
    });
    const json = await res.json().catch(() => ({}));
    setSavingBio(false);
    if (!res.ok) { toast.error(json.error ?? "Could not save your bio."); return; }
    setSavedBio(bio);
    toast.success("Bio saved.");
  }

  async function togglePublished(next: boolean) {
    setEnabled(next);
    const res = await fetch("/api/company/page", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_enabled: next }),
    });
    if (!res.ok) { setEnabled(!next); toast.error("Could not update visibility."); return; }
    toast.success(next ? "Page published." : "Page hidden.");
  }

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  const secondaryBtn = "inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-colors";
  const secondaryStyle = { backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", fontSize: "var(--text-caption)", textDecoration: "none" };

  return (
    <div
      className="rounded-xl mb-6 overflow-hidden"
      style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)", backgroundColor: "var(--color-pearl)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6 pb-5">
        <div className="flex items-start gap-3.5">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 40, height: 40, borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-soft-gold)" }}
          >
            <Globe size={19} style={{ color: "var(--color-deep-gold)" }} />
          </div>
          <div>
            <h3 style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h4)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Your brand page
            </h3>
            <p className="mt-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
              A public showcase of your products. Share the link anywhere.
            </p>
          </div>
        </div>

        {slug && (
          <span
            className="inline-flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full font-medium"
            style={{
              fontSize: "var(--text-caption)",
              backgroundColor: enabled ? "rgba(21,128,61,0.08)" : "var(--color-linen)",
              color: enabled ? "#15803D" : "var(--color-slate)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: enabled ? "#15803D" : "var(--color-mist)" }} />
            {enabled ? "Live" : "Hidden"}
          </span>
        )}
      </div>

      <div className="px-6 pb-6">
        {!slug ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-body-sm)", opacity: generating ? 0.6 : 1 }}
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            {generating ? "Generating…" : "Generate page"}
          </button>
        ) : (
          <>
            {/* Link card */}
            <div
              className="rounded-lg"
              style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}
            >
              {editing ? (
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <span style={{ color: "var(--color-mist)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)" }}>
                    {host}/
                  </span>
                  <input
                    autoFocus
                    value={draftSlug}
                    onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveSlug(); if (e.key === "Escape") setEditing(false); }}
                    placeholder="your-slug"
                    className="flex-1 px-3 py-2 rounded-md outline-none"
                    style={{ border: "1px solid var(--color-stone)", backgroundColor: "var(--color-pearl)", color: "var(--color-onyx)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", minWidth: 160 }}
                  />
                  <button
                    onClick={handleSaveSlug}
                    disabled={savingSlug}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-caption)" }}
                  >
                    {savingSlug ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 rounded-md font-medium"
                    style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 pl-4">
                  <a
                    href={`/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate"
                    style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
                    title={`${host}/${slug}`}
                  >
                    <span style={{ color: "var(--color-mist)" }}>{host}/</span>
                    <span style={{ color: "var(--color-charcoal)", fontWeight: 500 }}>{slug}</span>
                  </a>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleCopy} className={secondaryBtn + " hover:opacity-90"} style={secondaryStyle}>
                      {copied ? <Check size={13} style={{ color: "#15803D" }} /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <a
                      href={`/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-caption)", textDecoration: "none" }}
                    >
                      <ExternalLink size={13} /> View
                    </a>
                  </div>
                </div>
              )}
            </div>

            {!editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 mt-2.5 font-medium transition-colors"
                style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}
              >
                <Pencil size={12} /> Edit slug
              </button>
            )}

            {/* Bio */}
            <div className="mt-6">
              <label className="block mb-2 font-semibold uppercase" style={{ color: "var(--color-slate)", fontSize: "var(--text-micro)", letterSpacing: "0.08em" }}>
                Page bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={2}
                placeholder="A short line about your brand, shown under your name."
                className="w-full px-3.5 py-3 rounded-lg outline-none resize-none transition-colors focus:border-[var(--color-gold)]"
                style={{ border: "1px solid var(--color-stone)", backgroundColor: "var(--color-pearl)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)", lineHeight: 1.5 }}
              />
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  {bio.length}/{BIO_MAX}
                </span>
                <button
                  onClick={handleSaveBio}
                  disabled={savingBio || bio === savedBio}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: bio === savedBio ? "var(--color-linen)" : "var(--color-onyx)", color: bio === savedBio ? "var(--color-mist)" : "var(--color-pearl)", fontSize: "var(--text-caption)", cursor: bio === savedBio ? "default" : "pointer" }}
                >
                  {savingBio ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save bio
                </button>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-5" style={{ borderTop: "1px solid var(--color-cream)" }}>
              <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                {enabled ? "Your page is live and public." : "Your page is hidden. Visitors see a 404."}
              </span>
              <button
                onClick={() => togglePublished(!enabled)}
                className="px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90 shrink-0"
                style={secondaryStyle}
              >
                {enabled ? "Hide page" : "Publish page"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
