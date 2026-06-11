import { createServiceClient } from "@/lib/supabase/server";
import { CreditCard } from "lucide-react";
import { formatNaira, getNextBillingDate } from "@/lib/billing/pricing";
import { BrandsTable, type BrandRow } from "./BrandsTable";
import type { SubscriptionStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const supabase = createServiceClient();

  const [{ data: subs }, { data: payments }, { data: activeDiscounts }, { data: openInvoices }] = await Promise.all([
    supabase.from("subscriptions").select("*, plans(name, monthly_price), companies(name)"),
    supabase.from("payments").select("amount"),
    supabase.from("discounts").select("company_id").eq("is_active", true),
    supabase.from("invoices").select("company_id, amount, due_date, status").in("status", ["sent", "overdue"]),
  ]);

  const totalRevenue = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const discounted = new Set((activeDiscounts ?? []).map((d) => d.company_id));

  const today = new Date().toISOString().slice(0, 10);
  const overdueByCompany = new Map<string, number>();
  for (const inv of openInvoices ?? []) {
    if (inv.due_date < today) overdueByCompany.set(inv.company_id, (overdueByCompany.get(inv.company_id) ?? 0) + inv.amount);
  }

  type Row = NonNullable<typeof subs>[number] & {
    plans: { name: string; monthly_price: number } | null;
    companies: { name: string } | null;
  };

  let mrr = 0, active = 0, trialing = 0, pastDue = 0, suspended = 0;
  const brands: BrandRow[] = (subs as Row[] | null ?? []).map((s) => {
    const monthlyValue = s.custom_monthly_price ?? s.plans?.monthly_price ?? 0;
    const status = s.status as SubscriptionStatus;
    if (status === "active") { mrr += monthlyValue; active += 1; }
    else if (status === "trialing") trialing += 1;
    else if (status === "past_due") pastDue += 1;
    else if (status === "suspended") suspended += 1;

    return {
      company_id: s.company_id,
      company_name: s.companies?.name ?? "—",
      plan_name: s.plans?.name ?? "—",
      status,
      billing_interval: s.billing_interval,
      next_billing_date: s.current_period_end ?? s.trial_ends_at ?? getNextBillingDate(new Date(), s.billing_interval).toISOString(),
      monthly_value: monthlyValue,
      has_discount: discounted.has(s.company_id),
      overdue_amount: overdueByCompany.get(s.company_id) ?? 0,
    };
  });

  const attention = pastDue + suspended;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={18} style={{ color: "var(--color-gold)" }} />
        <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>Revenue</p>
      </div>
      <h1 className="font-display mb-8" style={{ fontSize: "32px", color: "var(--color-charcoal)", letterSpacing: "-0.02em" }}>Billing Overview</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="MRR" value={formatNaira(mrr)} />
        <Card label="All time" value={formatNaira(totalRevenue)} />
        <Card label="Active" value={`${active} ${active === 1 ? "brand" : "brands"}`} />
        <Card label="Attention" value={attention === 0 ? "All clear" : `${attention} ${attention === 1 ? "issue" : "issues"}`} accent={attention > 0} sub={`${trialing} on trial`} />
      </div>

      <BrandsTable brands={brands} />
    </div>
  );
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-pearl)", border: `1px solid ${accent ? "#FECACA" : "var(--color-cream)"}` }}>
      <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-mist)" }}>{label}</p>
      <p className="font-display tabular-nums" style={{ fontSize: "22px", color: accent ? "#991B1B" : "var(--color-charcoal)" }}>{value}</p>
      {sub && <p className="text-caption mt-1" style={{ color: "var(--color-mist)" }}>{sub}</p>}
    </div>
  );
}
