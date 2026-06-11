"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira } from "@/lib/billing/pricing";
import type { SubscriptionStatus } from "@/types/database";

export interface BrandRow {
  company_id: string;
  company_name: string;
  plan_name: string;
  status: SubscriptionStatus;
  billing_interval: string;
  next_billing_date: string | null;
  monthly_value: number;
  has_discount: boolean;
  overdue_amount: number;
}

const FILTERS: { key: "all" | SubscriptionStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trialing", label: "Trial" },
  { key: "past_due", label: "Past Due" },
  { key: "suspended", label: "Suspended" },
];

const STATUS_STYLE: Record<SubscriptionStatus, { dot: string; color: string; label: string }> = {
  trialing: { dot: "#B8945D", color: "var(--color-deep-gold)", label: "Trial" },
  active: { dot: "#16A34A", color: "#166534", label: "Active" },
  past_due: { dot: "#DC2626", color: "#991B1B", label: "Past due" },
  suspended: { dot: "#6B7280", color: "#374151", label: "Suspended" },
  cancelled: { dot: "#9CA3AF", color: "#6B7280", label: "Cancelled" },
};

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function BrandsTable({ brands }: { brands: BrandRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | SubscriptionStatus>("all");

  const rows = brands.filter((b) => filter === "all" || b.status === filter);

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="text-micro font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: filter === f.key ? "var(--color-charcoal)" : "var(--color-pearl)",
              color: filter === f.key ? "var(--color-pearl)" : "var(--color-slate)",
              border: "1px solid var(--color-cream)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)" }}>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr] gap-3 px-5 py-3 text-micro font-semibold uppercase tracking-wider" style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-mist)" }}>
          <span>Brand</span><span>Plan</span><span>Status</span><span>Next invoice</span><span>Value</span><span>Discount</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-body-sm" style={{ color: "var(--color-mist)", backgroundColor: "var(--color-pearl)" }}>No brands in this view.</p>
        ) : (
          rows.map((b) => {
            const st = STATUS_STYLE[b.status];
            return (
              <button
                key={b.company_id}
                onClick={() => router.push(`/admin/companies/${b.company_id}#billing`)}
                className="w-full grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr] gap-3 px-5 py-3.5 items-center text-left hover:bg-[var(--color-smoke)] transition-colors"
                style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
              >
                <span className="font-medium truncate" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{b.company_name}</span>
                <span className="truncate" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>{b.plan_name}</span>
                <span className="inline-flex items-center gap-1.5" style={{ color: st.color, fontSize: "var(--text-body-sm)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />{st.label}
                </span>
                <span style={{ color: b.overdue_amount > 0 ? "#991B1B" : "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                  {b.overdue_amount > 0 ? `Overdue ${formatNaira(b.overdue_amount)}` : fmtDate(b.next_billing_date)}
                </span>
                <span className="tabular-nums" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>{formatNaira(b.monthly_value)}</span>
                <span style={{ color: b.has_discount ? "var(--color-gold)" : "var(--color-mist)", fontSize: "var(--text-body-sm)" }}>{b.has_discount ? "Yes" : "—"}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
