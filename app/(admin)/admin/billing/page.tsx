import { createServiceClient } from "@/lib/supabase/server";
import { formatNaira, getNextBillingDate } from "@/lib/billing/pricing";
import { BrandsTable, type BrandRow } from "./BrandsTable";
import { BillingReference } from "./BillingReference";
import type { SubscriptionStatus, BillingInterval } from "@/types/database";

export const dynamic = "force-dynamic";

type SubRow = {
  company_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  custom_monthly_price: number | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  plans: { name: string; monthly_price: number } | null;
};

export default async function AdminBillingPage() {
  const supabase = createServiceClient();

  // Every approved brand is billable, whether or not it has been configured yet
  // — list them all so each can be set up from here.
  const [{ data: companies }, { data: subs }, { data: payments }, { data: activeDiscounts }, { data: openInvoices }] = await Promise.all([
    supabase.from("companies").select("id, name").eq("status", "approved").order("name", { ascending: true }),
    supabase.from("subscriptions").select("company_id, plan_id, status, billing_interval, custom_monthly_price, current_period_end, trial_ends_at, plans(name, monthly_price)"),
    supabase.from("payments").select("amount"),
    supabase.from("discounts").select("company_id").eq("is_active", true),
    supabase.from("invoices").select("company_id, amount, due_date, status").in("status", ["sent", "overdue"]),
  ]);

  const subByCompany = new Map<string, SubRow>();
  for (const s of (subs as SubRow[] | null) ?? []) subByCompany.set(s.company_id, s);

  const totalRevenue = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const discounted = new Set((activeDiscounts ?? []).map((d) => d.company_id));

  const today = new Date().toISOString().slice(0, 10);
  const overdueByCompany = new Map<string, number>();
  for (const inv of openInvoices ?? []) {
    if (inv.due_date < today) overdueByCompany.set(inv.company_id, (overdueByCompany.get(inv.company_id) ?? 0) + inv.amount);
  }

  // Pure mapping — no external mutation during the map callback.
  const brands: BrandRow[] = ((companies ?? []) as { id: string; name: string }[]).map((c) => {
    const s = subByCompany.get(c.id);
    if (!s) {
      return {
        company_id: c.id, company_name: c.name, plan_name: "—",
        status: "unconfigured", billing_interval: "—", next_billing_date: null,
        monthly_value: 0, has_discount: discounted.has(c.id), overdue_amount: overdueByCompany.get(c.id) ?? 0,
      };
    }
    return {
      company_id: c.id,
      company_name: c.name,
      plan_name: s.plans?.name ?? "—",
      status: s.status,
      billing_interval: s.billing_interval,
      next_billing_date: s.current_period_end ?? s.trial_ends_at ?? getNextBillingDate(new Date(), s.billing_interval).toISOString(),
      monthly_value: s.custom_monthly_price ?? s.plans?.monthly_price ?? 0,
      has_discount: discounted.has(c.id),
      overdue_amount: overdueByCompany.get(c.id) ?? 0,
    };
  });

  // Summary stats derived from the mapped rows.
  let mrr = 0, active = 0, trialing = 0, pastDue = 0, suspended = 0, unconfigured = 0;
  for (const b of brands) {
    if (b.status === "unconfigured") unconfigured += 1;
    else if (b.status === "active") { mrr += b.monthly_value; active += 1; }
    else if (b.status === "trialing") trialing += 1;
    else if (b.status === "past_due") pastDue += 1;
    else if (b.status === "suspended") suspended += 1;
  }

  const attention = pastDue + suspended;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Billing
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Revenue, subscriptions and per-brand billing configuration
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="MRR" value={formatNaira(mrr)} />
        <Card label="All time" value={formatNaira(totalRevenue)} />
        <Card label="Active" value={`${active} ${active === 1 ? "brand" : "brands"}`} sub={`${unconfigured} not set up`} />
        <Card label="Attention" value={attention === 0 ? "All clear" : `${attention} overdue`} accent={attention > 0} sub={`${trialing} on trial`} />
      </div>

      <BrandsTable brands={brands} />

      <BillingReference />
    </div>
  );
}

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--color-pearl)", border: `1px solid ${accent ? "#FECACA" : "var(--color-cream)"}`, boxShadow: "var(--shadow-sm)" }}>
      <p className="text-micro font-medium uppercase tracking-wider mb-2" style={{ color: "var(--color-slate)" }}>{label}</p>
      <p className="font-semibold tabular-nums" style={{ fontSize: "var(--text-h3)", color: accent ? "#991B1B" : "var(--color-charcoal)", lineHeight: 1.1 }}>{value}</p>
      {sub && <p className="text-caption mt-1.5" style={{ color: "var(--color-mist)" }}>{sub}</p>}
    </div>
  );
}
