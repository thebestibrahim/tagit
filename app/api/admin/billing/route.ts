import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { getNextBillingDate } from "@/lib/billing/pricing";

// GET /api/admin/billing — billing overview: summary cards + brands table.
export async function GET() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: subs, error } = await admin
    .from("subscriptions")
    .select("*, plans(name, monthly_price), companies(name)");
  if (error) {
    log.error("admin/billing", "Load subscriptions failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // All-time revenue = sum of payments.
  const { data: payments } = await admin.from("payments").select("amount");
  const totalRevenue = (payments ?? []).reduce((s, p) => s + p.amount, 0);

  // Active discounts to flag brands that have one.
  const { data: activeDiscounts } = await admin
    .from("discounts")
    .select("company_id")
    .eq("is_active", true);
  const discountedCompanies = new Set((activeDiscounts ?? []).map((d) => d.company_id));

  // Outstanding (overdue/sent past due) amounts per company.
  const today = new Date().toISOString().slice(0, 10);
  const { data: openInvoices } = await admin
    .from("invoices")
    .select("company_id, amount, due_date, status")
    .in("status", ["sent", "overdue"]);
  const overdueByCompany = new Map<string, number>();
  for (const inv of openInvoices ?? []) {
    if (inv.due_date < today) {
      overdueByCompany.set(inv.company_id, (overdueByCompany.get(inv.company_id) ?? 0) + inv.amount);
    }
  }

  type SubRow = (typeof subs)[number] & {
    plans: { name: string; monthly_price: number } | null;
    companies: { name: string } | null;
  };

  let mrr = 0;
  let activeBrands = 0;
  let trialingBrands = 0;
  let pastDueBrands = 0;
  let suspendedBrands = 0;

  const brands = (subs as SubRow[]).map((s) => {
    const monthlyValue = s.custom_monthly_price ?? s.plans?.monthly_price ?? 0;
    if (s.status === "active") {
      mrr += monthlyValue;
      activeBrands += 1;
    } else if (s.status === "trialing") trialingBrands += 1;
    else if (s.status === "past_due") pastDueBrands += 1;
    else if (s.status === "suspended") suspendedBrands += 1;

    const nextBilling = s.current_period_end
      ? s.current_period_end
      : s.trial_ends_at
      ? s.trial_ends_at
      : getNextBillingDate(new Date(), s.billing_interval).toISOString();

    return {
      company_id: s.company_id,
      company_name: s.companies?.name ?? "—",
      plan_name: s.plans?.name ?? "—",
      status: s.status,
      billing_interval: s.billing_interval,
      next_billing_date: nextBilling,
      monthly_value: monthlyValue,
      has_discount: discountedCompanies.has(s.company_id),
      overdue_amount: overdueByCompany.get(s.company_id) ?? 0,
    };
  });

  return NextResponse.json({
    summary: {
      mrr,
      total_revenue: totalRevenue,
      active_brands: activeBrands,
      trialing_brands: trialingBrands,
      past_due_brands: pastDueBrands,
      suspended_brands: suspendedBrands,
    },
    brands,
  });
}
