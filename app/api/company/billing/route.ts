import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getFlagsForBrand } from "@/lib/feature-flags/server";
import { getEffectivePrice } from "@/lib/billing/pricing";
import { chipUsage } from "@/lib/billing/limits";

// GET /api/company/billing — data for the combined Billing page (the page
// formerly called Features). Brand reads its own billing only.
export async function GET() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data: sub }, { data: discounts }, { data: invoices }, flags] = await Promise.all([
    admin
      .from("subscriptions")
      .select("*, plans(name, monthly_price, tag_limit, card_limit)")
      .eq("company_id", user.id)
      .maybeSingle(),
    admin.from("discounts").select("*").eq("company_id", user.id).eq("is_active", true),
    admin
      .from("invoices")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false }),
    getFlagsForBrand(user.id),
  ]);

  let subscription = null;
  let chips = null;
  if (sub) {
    const s = sub as typeof sub & {
      plans: { name: string; monthly_price: number; tag_limit: number | null; card_limit: number | null } | null;
    };
    subscription = {
      status: s.status,
      plan_name: s.plans?.name ?? "—",
      billing_interval: s.billing_interval,
      current_period_end: s.current_period_end,
      trial_ends_at: s.trial_ends_at,
      next_invoice_amount: getEffectivePrice(
        s.plans?.monthly_price ?? 0,
        s.custom_monthly_price,
        s.billing_interval
      ),
    };
    chips = {
      tags: chipUsage(s.tag_limit_override, s.plans?.tag_limit, s.tags_ordered_total),
      cards: chipUsage(s.card_limit_override, s.plans?.card_limit, s.cards_ordered_total),
    };
  }

  const list = discounts ?? [];
  const subDiscount = list.find((d) => d.type === "subscription");
  const batchDiscount = list.find((d) => d.type === "batch");

  return NextResponse.json({
    subscription,
    subscription_discount: subDiscount
      ? { percentage: subDiscount.percentage, cycles_remaining: subDiscount.duration - subDiscount.used }
      : null,
    batch_discount: batchDiscount
      ? { percentage: batchDiscount.percentage, orders_remaining: batchDiscount.duration - batchDiscount.used }
      : null,
    invoices: invoices ?? [],
    chips,
    features: flags,
  });
}
