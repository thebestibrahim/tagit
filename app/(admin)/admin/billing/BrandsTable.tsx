"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CreditCard } from "lucide-react";
import { formatNaira } from "@/lib/billing/pricing";
import type { SubscriptionStatus } from "@/types/database";

type RowStatus = SubscriptionStatus | "unconfigured";

export interface BrandRow {
  company_id: string;
  company_name: string;
  plan_name: string;
  status: RowStatus;
  billing_interval: string;
  next_billing_date: string | null;
  monthly_value: number;
  has_discount: boolean;
  overdue_amount: number;
}

const FILTERS: { key: "all" | RowStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unconfigured", label: "Not set up" },
  { key: "trialing", label: "Trial" },
  { key: "active", label: "Active" },
  { key: "past_due", label: "Past Due" },
  { key: "suspended", label: "Suspended" },
];

const STATUS_STYLE: Record<RowStatus, { bg: string; color: string; label: string }> = {
  unconfigured: { bg: "var(--color-cream)", color: "var(--color-slate)", label: "Not set up" },
  trialing: { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)", label: "Trial" },
  active: { bg: "#ECFDF5", color: "#065F46", label: "Active" },
  past_due: { bg: "#FEF2F2", color: "#991B1B", label: "Past due" },
  suspended: { bg: "#F3F4F6", color: "#374151", label: "Suspended" },
  cancelled: { bg: "#F3F4F6", color: "#6B7280", label: "Cancelled" },
};

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BrandsTable({ brands }: { brands: BrandRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | RowStatus>("all");

  const rows = brands.filter((b) => filter === "all" || b.status === filter);

  return (
    <div>
      {/* Filter — pill group, matching the Companies page */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-cream)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-1.5 rounded-md text-body-sm font-medium transition-colors"
              style={{
                backgroundColor: filter === f.key ? "var(--color-pearl)" : "transparent",
                color: filter === f.key ? "var(--color-charcoal)" : "var(--color-slate)",
                fontSize: "var(--text-body-sm)",
                boxShadow: filter === f.key ? "var(--shadow-sm)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}>
        {rows.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No brands in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Brand", "Plan", "Status", "Next invoice", "Value", "Discount", ""].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => {
                const st = STATUS_STYLE[b.status];
                const isOverdue = b.overdue_amount > 0;
                return (
                  <tr
                    key={b.company_id}
                    onClick={() => router.push(`/admin/companies/${b.company_id}#billing`)}
                    className="cursor-pointer hover:brightness-[0.985] transition"
                    style={{ backgroundColor: "var(--color-pearl)", borderBottom: i < rows.length - 1 ? "1px solid var(--color-cream)" : "none" }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{b.company_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>{b.plan_name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-micro font-medium whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: isOverdue ? "#991B1B" : "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {isOverdue ? `Overdue ${formatNaira(b.overdue_amount)}` : fmtDate(b.next_billing_date)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="tabular-nums" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {b.status === "unconfigured" ? "—" : formatNaira(b.monthly_value)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: b.has_discount ? "var(--color-deep-gold)" : "var(--color-mist)", fontSize: "var(--text-body-sm)" }}>{b.has_discount ? "Yes" : "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {b.status === "unconfigured" ? "Set up" : "Manage"} <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
