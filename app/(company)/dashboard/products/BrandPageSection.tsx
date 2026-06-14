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

  const cardStyle = {
    border: "1px solid var(--color-cream)",
    boxShadow: "var(--shadow-sm)",
    backgroundColor: "var(--color-pearl)",
  };

  return (
    <div className="rounded-xl p-6 mb-6" style={cardStyle}>
      <div className="flex items-center gap-2 mb-1">
        <Globe size={15} style={{ color: "var(--color-deep-gold)" }} />
        <h2 className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
          Your brand page
        </h2>
      </div>
      <p className="mb-4" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
        A public showcase of your products. Share the link anywhere.
      </p>

      {!slug ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium"
          style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-body-sm)", opacity: generating ? 0.6 : 1 }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          {generating ? "Generating…" : "Generate page →"}
        </button>
      ) : (
        <>
          {/* URL row */}
          {editing ? (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span style={{ color: "var(--color-slate)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)" }}>
                {host}/
              </span>
              <input
                autoFocus
                value={draftSlug}
                onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveSlug(); if (e.key === "Escape") setEditing(false); }}
                placeholder="your-slug"
                className="px-3 py-1.5 rounded-lg outline-none"
                style={{ border: "1px solid var(--color-stone)", backgroundColor: "var(--color-pearl)", color: "var(--color-onyx)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", minWidth: 200 }}
              />
              <button
                onClick={handleSaveSlug}
                disabled={savingSlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-caption)" }}
              >
                {savingSlug ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", fontSize: "var(--text-caption)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: "var(--color-charcoal)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
              >
                {host}/{slug}
              </a>
              <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", fontSize: "var(--text-caption)" }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", fontSize: "var(--text-caption)", textDecoration: "none" }}>
                <ExternalLink size={13} /> View
              </a>
              <button onClick={startEditing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "transparent", color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                <Pencil size={13} /> Edit slug
              </button>
            </div>
          )}

          {/* Bio */}
          <div className="mt-5">
            <label className="block mb-1.5 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              Page bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={2}
              placeholder="A short line about your brand, shown under your name."
              className="w-full px-3 py-2 rounded-lg outline-none resize-none"
              style={{ border: "1px solid var(--color-stone)", backgroundColor: "var(--color-pearl)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>
                {bio.length}/{BIO_MAX}
              </span>
              <button
                onClick={handleSaveBio}
                disabled={savingBio || bio === savedBio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: bio === savedBio ? "var(--color-linen)" : "var(--color-onyx)", color: bio === savedBio ? "var(--color-mist)" : "var(--color-pearl)", fontSize: "var(--text-caption)", cursor: bio === savedBio ? "default" : "pointer" }}
              >
                {savingBio ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save bio
              </button>
            </div>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid var(--color-cream)" }}>
            <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
              {enabled ? "Your page is live and public." : "Your page is hidden. Visitors see a 404."}
            </span>
            <button
              onClick={() => togglePublished(!enabled)}
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", fontSize: "var(--text-caption)" }}
            >
              {enabled ? "Hide page" : "Publish page"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
