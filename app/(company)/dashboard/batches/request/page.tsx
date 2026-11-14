"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MINIMUM_ORDER, type ChipUsage } from "@/lib/billing/limits";

// Industry selection was removed from the batch request flow (it was a required
// field causing avoidable friction/bugs). Orders now default to "other"; the
// column is still populated so nothing downstream changes. To bring the picker
// back, restore the INDUSTRIES list + the commented "Industry" block below.
const DEFAULT_INDUSTRY = "other";

const SUGGESTED_QTY = [25, 50, 100, 250, 500, 1000];

export default function BatchRequestPage() {
  const router = useRouter();
  const [batchName, setBatchName] = useState("");
  const [batchType, setBatchType] = useState<"tags" | "cards" | "mixed">("tags");
  const industry = DEFAULT_INDUSTRY; // industry picker removed — see note above
  const [quantity, setQuantity] = useState("");
  const [cardsQuantity, setCardsQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [chips, setChips] = useState<{ tags: ChipUsage; cards: ChipUsage } | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);

  // Load the brand's lifetime tag allowance so we can show remaining counts
  // and stop an order the server would reject anyway.
  useEffect(() => {
    fetch("/api/company/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.chips) setChips(d.chips); })
      .catch(() => {});
  }, []);

  const needsTags = batchType === "tags" || batchType === "mixed";
  const needsCards = batchType === "cards" || batchType === "mixed";
  const canSubmit = (!needsTags || !!quantity) && (!needsCards || !!cardsQuantity);

  const tagUse = chips?.tags ?? null;
  const cardUse = chips?.cards ?? null;
  // A type with a finite limit and < one minimum order left cannot be ordered.
  const tagsBlocked = !!(needsTags && tagUse && tagUse.exhausted);
  const cardsBlocked = !!(needsCards && cardUse && cardUse.exhausted);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      setUpgradeMsg("You have reached your lifetime tag and card allowance. Contact Tagit to upgrade your plan to order more.");
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
        <h1 className="page-title">
          Request a batch
        </h1>
        <p className="page-desc">
          Tell us what you need and we&apos;ll have your tags ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Batch name */}
        <div className="space-y-1.5">
          <Label className="cz-label">
            Batch name <span style={{ color: "var(--app-body)", fontWeight: 400 }}>(optional)</span>
          </Label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. Spring 2026 Collection, Lagos Flagship Launch"
            maxLength={80}
            className="app-input"
          />
        </div>

        {/* Batch type */}
        <div className="space-y-3">
          <Label className="cz-label">
            What are you ordering?
          </Label>
          <div role="radiogroup" aria-label="What are you ordering?" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {([
              { value: "tags",  label: "Tags",  desc: "Set inside the piece itself" },
              { value: "cards", label: "Cards", desc: "Travel with pieces a tag can't go into" },
              { value: "mixed", label: "Both",  desc: "Choose how many of each" },
            ] as const).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={batchType === value}
                onClick={() => setBatchType(value)}
                className={`app-choice ${batchType === value ? "is-on" : ""}`}
              >
                <span className="block text-body-sm font-semibold mb-0.5" style={{ color: "var(--color-onyx)" }}>{label}</span>
                <span className="block text-caption" style={{ color: "var(--app-body)", lineHeight: 1.4 }}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Industry picker removed — orders default to "other". See note at top. */}

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
            <Link href="/dashboard/features" className="ov-btn" style={{ backgroundColor: "#9b2c2c" }}>
              View billing
            </Link>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="cz-label">
            Additional notes <span style={{ color: "var(--app-body)", fontWeight: 400 }}>(optional)</span>
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. We need these by end of March for a launch event. Prefer small packaging."
            rows={3}
            maxLength={500}
            className="cz-textarea"
          />
        </div>

        <div className="pt-2" style={{ borderTop: "1px solid var(--app-edge)" }}>
          <p className="text-caption mt-5 mb-4" style={{ color: "var(--app-body)", maxWidth: "60ch", lineHeight: 1.6 }}>
            We&apos;ll confirm the details, price and timing with you before anything is made. Most batches ship in 5 to 10 working days.
          </p>
          <button
            type="submit"
            disabled={loading || !canSubmit || tagsBlocked || cardsBlocked}
            className="ov-btn w-full justify-center disabled:cursor-not-allowed disabled:bg-[#9e9ea3]"
            style={{ height: 46 }}
          >
            {loading && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {loading ? "Sending request" : tagsBlocked || cardsBlocked ? "Plan limit reached" : "Send batch request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AllowanceHint({ usage, noun }: { usage: ChipUsage | null; noun: "tag" | "card" }) {
  if (!usage || usage.unlimited) return null;
  if (usage.exhausted) {
    return (
      <span style={{ color: "#B45309", fontSize: "var(--text-caption)" }}>
        {usage.remaining} {noun}{usage.remaining === 1 ? "" : "s"} left on your plan, and the smallest order is {MINIMUM_ORDER}. Upgrade to order more.
      </span>
    );
  }
  return (
    <span style={{ color: "var(--app-body)", fontSize: "var(--text-caption)" }}>
      {usage.remaining?.toLocaleString()} of {usage.limit?.toLocaleString()} {noun}s left on your plan
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
      <Label className="cz-label">
        {label}
      </Label>
      {hint && <div className="-mt-1.5">{hint}</div>}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTED_QTY.map((q) => (
          <button
            key={q}
            type="button"
            aria-pressed={value === String(q)}
            onClick={() => onChange(String(q))}
            className={`app-chip ${value === String(q) ? "is-on" : ""}`}
          >
            {q.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type a number from 10 to 10,000"
        min={10}
        max={10000}
        className="app-input"
      />
    </div>
  );
}
