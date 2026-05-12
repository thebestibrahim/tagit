"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";

type Company = { id: string; name: string; industry: string };

const BATCH_SIZES = [50, 100, 250, 500, 1000];

const INDUSTRY_LABELS: Record<string, string> = {
  fashion:      "Fashion & Apparel",
  arts:         "Art & Photography",
  collectibles: "Collectibles & Memorabilia",
};

export default function NewBatchForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_id: "",
    industry: "",
    batch_size: 100,
    notes: "",
  });

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCompanyChange(companyId: string) {
    const company = companies.find((c) => c.id === companyId);
    setForm((f) => ({
      ...f,
      company_id: companyId,
      industry: company?.industry ?? "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_id) { toast.error("Select a company."); return; }

    setLoading(true);

    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Batch generation failed.");
      setLoading(false);
      return;
    }

    toast.success(`${form.batch_size} tags generated successfully.`);
    router.push("/admin/batches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Company
        </Label>
        <select
          value={form.company_id}
          onChange={(e) => handleCompanyChange(e.target.value)}
          required
          style={{
            width: "100%",
            border: "1px solid var(--color-stone)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
            fontSize: "var(--text-body-sm)",
            color: form.company_id ? "var(--color-onyx)" : "var(--color-mist)",
            backgroundColor: "var(--color-pearl)",
            outline: "none",
          }}
        >
          <option value="" disabled>Select a company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Industry (auto-filled, read-only) */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Industry
        </Label>
        <div
          className="px-3 py-2.5 rounded-md text-body-sm"
          style={{
            border: "1px solid var(--color-cream)",
            backgroundColor: "var(--color-smoke)",
            color: form.industry ? "var(--color-graphite)" : "var(--color-mist)",
            fontSize: "var(--text-body-sm)",
          }}
        >
          {form.industry ? INDUSTRY_LABELS[form.industry] ?? form.industry : "Auto-filled from company"}
        </div>
      </div>

      {/* Batch size */}
      <div className="space-y-2">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Batch size
        </Label>
        <div className="flex gap-2 flex-wrap">
          {BATCH_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => set("batch_size", size)}
              style={{
                padding: "8px 20px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-body-sm)",
                fontWeight: 500,
                border: `1px solid ${form.batch_size === size ? "var(--color-onyx)" : "var(--color-stone)"}`,
                backgroundColor: form.batch_size === size ? "var(--color-onyx)" : "var(--color-pearl)",
                color: form.batch_size === size ? "var(--color-pearl)" : "var(--color-graphite)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {size.toLocaleString()}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={10000}
            placeholder="Custom"
            value={BATCH_SIZES.includes(form.batch_size) ? "" : form.batch_size}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) set("batch_size", val);
            }}
            style={{
              width: 90,
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 500,
              border: `1px solid ${!BATCH_SIZES.includes(form.batch_size) ? "var(--color-onyx)" : "var(--color-stone)"}`,
              backgroundColor: !BATCH_SIZES.includes(form.batch_size) ? "var(--color-onyx)" : "var(--color-pearl)",
              color: !BATCH_SIZES.includes(form.batch_size) ? "var(--color-pearl)" : "var(--color-graphite)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Notes <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span>
        </Label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. Spring 2026 collection, Lagos flagship store"
          rows={2}
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

      {/* Summary */}
      {form.company_id && (
        <div
          className="rounded-lg px-4 py-3 text-body-sm"
          style={{ backgroundColor: "var(--color-soft-gold)", color: "var(--color-deep-gold)" }}
        >
          This will generate <strong>{form.batch_size.toLocaleString()}</strong> unique NFC tags, each with a signed HMAC URL token.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.company_id}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-body-sm transition-colors"
        style={{
          backgroundColor: loading || !form.company_id ? "var(--color-stone)" : "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading || !form.company_id ? "not-allowed" : "pointer",
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
        {loading ? `Generating ${form.batch_size.toLocaleString()} tags…` : "Generate batch"}
      </button>
    </form>
  );
}
