"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Layers, Package, Shirt, Palette, Watch, Cpu, ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MINIMUM_ORDER, type ChipUsage } from "@/lib/billing/limits";

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
  const [batchType, setBatchType] = useState<"tags" | "cards" | "mixed">("tags");
  const [industry, setIndustry] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cardsQuantity, setCardsQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [chips, setChips] = useState<{ tags: ChipUsage; cards: ChipUsage } | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  // Load the brand's lifetime chip allowance so we can show remaining counts
  // and stop an order the server would reject anyway.
  useEffect(() => {
    fetch("/api/company/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.chips) setChips(d.chips); })
      .catch(() => {});
  }, []);

  const needsTags = batchType === "tags" || batchType === "mixed";
  const needsCards = batchType === "cards" || batchType === "mixed";
  const canSubmit = !!industry && (!needsTags || !!quantity) && (!needsCards || !!cardsQuantity);

  const tagUse = chips?.tags ?? null;
  const cardUse = chips?.cards ?? null;
  // A type with a finite limit and < one minimum order left cannot be ordered.
  const tagsBlocked = !!(needsTags && tagUse && tagUse.exhausted);
  const cardsBlocked = !!(needsCards && cardUse && cardUse.exhausted);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) { toast.error("Please select an industry."); return; }

    const tagsQty = needsTags ? parseInt(quantity, 10) : 0;
    const cardsQty = needsCards ? parseInt(cardsQuantity, 10) : 0;

    if (needsTags && (!tagsQty || tagsQty < 10 || tagsQty > 10000)) {
      toast.error("Enter a tag quantity between 10 and 10,000."); return;
    }
    if (needsCards && (!cardsQty || cardsQty < 10 || cardsQty > 10000)) {
      toast.error("Enter a card quantity between 10 and 10,000."); return;
    }

    // Lifetime allowance guard (the server enforces this too).
    if (tagsBlocked || cardsBlocked) {
      setUpgradeMsg("You have reached your lifetime chip allowance. Contact Tagit to upgrade your plan to order more.");
      return;
    }
    if (needsTags && tagUse && !tagUse.unlimited && tagUse.remaining !== null && tagsQty > tagUse.remaining) {
      toast.error(`You can only order ${tagUse.remaining} more tags on your plan.`); return;
    }
    if (needsCards && cardUse && !cardUse.unlimited && cardUse.remaining !== null && cardsQty > cardUse.remaining) {
      toast.error(`You can only order ${cardUse.remaining} more cards on your plan.`); return;
    }

    setUpgradeMsg(null);
    setLoading(true);
    const res = await fetch("/api/company/batch-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry,
        batch_type: batchType,
        quantity: tagsQty,
        cards_quantity: cardsQty,
        notes,
        batch_name: batchName,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (json.upgrade_required) setUpgradeMsg(json.error);
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

        {/* Batch type */}
        <div className="space-y-3">
          <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
            What are you ordering?
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {([
              { value: "tags",  label: "Tags",  desc: "For embedding into items" },
              { value: "cards", label: "Cards", desc: "For items that cannot be embedded" },
              { value: "mixed", label: "Both",  desc: "Specify quantity of each" },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setBatchType(value)}
                style={{
                  padding: "14px 14px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${batchType === value ? "var(--color-gold)" : "var(--color-cream)"}`,
                  backgroundColor: batchType === value ? "var(--color-soft-gold)" : "var(--color-pearl)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <p className="font-semibold" style={{ fontSize: "var(--text-body-sm)", color: batchType === value ? "var(--color-deep-gold)" : "var(--color-charcoal)", marginBottom: 2 }}>
                  {label}
                </p>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.4 }}>
                  {desc}
                </p>
              </button>
            ))}
          </div>
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

        {/* Quantity — one field per medium in the batch */}
        <div className={needsTags && needsCards ? "grid grid-cols-1 gap-6 sm:grid-cols-2" : ""}>
          {needsTags && (
            <QtyField label="How many tags do you need?" value={quantity} onChange={setQuantity} hint={<AllowanceHint usage={tagUse} noun="tag" />} />
          )}
          {needsCards && (
            <QtyField label="How many cards do you need?" value={cardsQuantity} onChange={setCardsQuantity} hint={<AllowanceHint usage={cardUse} noun="card" />} />
          )}
        </div>

        {/* Upgrade nudge */}
        {upgradeMsg && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <div className="flex-1">
              <p className="font-medium mb-1" style={{ color: "#7F1D1D", fontSize: "var(--text-body-sm)" }}>Plan limit reached</p>
              <p style={{ color: "#991B1B", fontSize: "var(--text-caption)", lineHeight: 1.6 }}>{upgradeMsg}</p>
            </div>
            <Link href="/dashboard/features" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-micro font-semibold" style={{ backgroundColor: "#B91C1C", color: "#fff", textDecoration: "none" }}>
              View billing <ArrowRight size={12} />
            </Link>
          </div>
        )}

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
          disabled={loading || !canSubmit || tagsBlocked || cardsBlocked}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium w-full justify-center"
          style={{
            fontSize: "var(--text-body-sm)",
            backgroundColor: !canSubmit || loading || tagsBlocked || cardsBlocked ? "var(--color-stone)" : "var(--color-onyx)",
            color: "var(--color-pearl)",
            border: "none",
            cursor: !canSubmit || loading || tagsBlocked || cardsBlocked ? "not-allowed" : "pointer",
          }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Submitting…" : tagsBlocked || cardsBlocked ? "Plan limit reached" : "Submit batch request"}
        </button>
      </form>
    </div>
  );
}

function AllowanceHint({ usage, noun }: { usage: ChipUsage | null; noun: "tag" | "card" }) {
  if (!usage || usage.unlimited) return null;
  if (usage.exhausted) {
    return (
      <span style={{ color: "#B45309", fontSize: "var(--text-caption)" }}>
        {usage.remaining} {noun}{usage.remaining === 1 ? "" : "s"} remaining — minimum order is {MINIMUM_ORDER}. Upgrade to order more.
      </span>
    );
  }
  return (
    <span style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
      {usage.remaining?.toLocaleString()} of {usage.limit?.toLocaleString()} {noun}s remaining on your plan
    </span>
  );
}

function QtyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
        {label}
      </Label>
      {hint && <div className="-mt-1.5">{hint}</div>}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTED_QTY.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(String(q))}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${value === String(q) ? "var(--color-gold)" : "var(--color-cream)"}`,
              backgroundColor: value === String(q) ? "var(--color-soft-gold)" : "var(--color-linen)",
              color: value === String(q) ? "var(--color-deep-gold)" : "var(--color-graphite)",
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  );
}
