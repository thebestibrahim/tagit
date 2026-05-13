"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Layers, Package, Shirt, Palette, Watch, Cpu } from "lucide-react";
import { Label } from "@/components/ui/label";

const INDUSTRIES = [
  { value: "fashion",      label: "Fashion",      desc: "Bags, shoes, garments, accessories",   icon: Shirt },
  { value: "jewellery",    label: "Jewellery",     desc: "Rings, necklaces, watches, bracelets", icon: Watch },
  { value: "arts",         label: "Art & Prints",  desc: "Paintings, prints, sculpture, photos", icon: Palette },
  { value: "collectibles", label: "Collectibles",  desc: "Cards, memorabilia, graded items",     icon: Package },
  { value: "electronics",  label: "Electronics",   desc: "Devices, components, tech items",      icon: Cpu },
  { value: "other",        label: "Other",         desc: "Any product not listed above",         icon: Layers },
];

const SUGGESTED_QTY = [25, 50, 100, 250, 500, 1000];

export default function BatchRequestPage() {
  const router = useRouter();
  const [batchName, setBatchName] = useState("");
  const [industry, setIndustry] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) { toast.error("Please select an industry."); return; }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 10 || qty > 10000) { toast.error("Enter a quantity between 10 and 10,000."); return; }

    setLoading(true);
    const res = await fetch("/api/company/batch-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, quantity: qty, notes, batch_name: batchName }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Failed to submit request.");
      return;
    }
    toast.success("Batch request submitted! We'll be in touch shortly.");
    router.push("/dashboard/batches");
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/batches"
        className="inline-flex items-center gap-2 mb-8"
        style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} />
        Back to batches
      </Link>

      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Inventory
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Request a batch
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Tell us what you need and we&apos;ll have your tags ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Batch name */}
        <div className="space-y-1.5">
          <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            Batch name <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span>
          </Label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. Spring 2026 Collection, Lagos Flagship Launch"
            maxLength={80}
            style={{
              width: "100%",
              border: "1px solid var(--color-stone)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-onyx)",
              backgroundColor: "var(--color-pearl)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Industry */}
        <div className="space-y-3">
          <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            What type of products are these tags for?
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INDUSTRIES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setIndustry(value)}
                style={{
                  padding: "14px 14px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${industry === value ? "var(--color-gold)" : "var(--color-cream)"}`,
                  backgroundColor: industry === value ? "var(--color-soft-gold)" : "var(--color-pearl)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={18} style={{ color: industry === value ? "var(--color-gold)" : "var(--color-slate)", marginBottom: 8 }} />
                <p className="font-semibold" style={{ fontSize: "var(--text-body-sm)", color: industry === value ? "var(--color-deep-gold)" : "var(--color-charcoal)", marginBottom: 2 }}>
                  {label}
                </p>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.4 }}>
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-3">
          <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            How many tags do you need?
          </Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_QTY.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(String(q))}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: `1px solid ${quantity === String(q) ? "var(--color-gold)" : "var(--color-cream)"}`,
                  backgroundColor: quantity === String(q) ? "var(--color-soft-gold)" : "var(--color-linen)",
                  color: quantity === String(q) ? "var(--color-deep-gold)" : "var(--color-graphite)",
                  fontSize: "var(--text-body-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {q.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Or enter a custom quantity (10–10,000)"
            min={10}
            max={10000}
            style={{
              width: "100%",
              border: "1px solid var(--color-stone)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-onyx)",
              backgroundColor: "var(--color-pearl)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            Additional notes <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span>
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. We need these by end of March for a launch event. Prefer small packaging."
            rows={3}
            maxLength={500}
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

        {/* Info */}
        <div
          className="flex gap-3 rounded-xl px-4 py-4"
          style={{ backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-champagne)" }}
        >
          <Layers size={16} style={{ color: "var(--color-deep-gold)", marginTop: 2, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-deep-gold)", lineHeight: 1.65 }}>
            Once submitted, the Tagit team will review your request and contact you to confirm details, pricing, and timeline. Most batches ship within 5–10 business days.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !industry || !quantity}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium w-full justify-center"
          style={{
            fontSize: "var(--text-body-sm)",
            backgroundColor: !industry || !quantity || loading ? "var(--color-stone)" : "var(--color-onyx)",
            color: "var(--color-pearl)",
            border: "none",
            cursor: !industry || !quantity || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Submitting…" : "Submit batch request"}
        </button>
      </form>
    </div>
  );
}
