import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendTrialWelcomeEmail } from "@/lib/email";
import { getEffectivePrice } from "@/lib/billing/pricing";
import { buildSubscriptionConfig } from "@/lib/billing/configure";
import { createSubscriptionInvoice, sendInvoiceEmail } from "@/lib/billing/invoices";
import { APP_URL } from "@/lib/email";
import type { BillingInterval, VolumeTier } from "@/types/database";

const INTERVALS = new Set<BillingInterval>(["monthly", "quarterly", "annually"]);

// POST /api/admin/billing/[companyId]/configure — set plan, interval, custom
// price, trial, and custom chip pricing for a brand.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const {
    plan_id,
    billing_interval,
    custom_monthly_price,
    tag_limit_override,
    card_limit_override,
    trial_days,
    tag_tiers,
    card_tiers,
  } = body as {
    plan_id: string;
    billing_interval: BillingInterval;
    custom_monthly_price?: number | null;
    tag_limit_override?: number | null;
    card_limit_override?: number | null;
    trial_days?: number;
    tag_tiers?: VolumeTier[];
    card_tiers?: VolumeTier[];
  };

  if (!plan_id || !INTERVALS.has(billing_interval)) {
    return NextResponse.json({ error: "Invalid plan or interval." }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: company }, { data: plan }, { data: existing }] = await Promise.all([
    admin.from("companies").select("name, email").eq("id", companyId).single(),
    admin.from("plans").select("name, monthly_price").eq("id", plan_id).single(),
    admin.from("subscriptions").select("id, status, trial_ends_at, current_period_end").eq("company_id", companyId).maybeSingle(),
  ]);

  if (!company || !plan) {
    return NextResponse.json({ error: "Company or plan not found." }, { status: 404 });
  }

  const now = new Date();

  // All "what to write" logic lives in buildSubscriptionConfig (unit-tested):
  // new setup, trial set/clear, and mid-cycle plan/price/limit edits.
  const { payload: subPayload, isNewTrial, needsFirstInvoice } = buildSubscriptionConfig(
    existing,
    {
      companyId,
      planId: plan_id,
      billingInterval: billing_interval,
      customMonthlyPrice: custom_monthly_price,
      tagLimitOverride: tag_limit_override,
      cardLimitOverride: card_limit_override,
      trialDays: trial_days,
    },
    now
  );
  const trialDays = trial_days ?? 0;
  const trialEndsAt = subPayload.trial_ends_at as string | null;

  const { data: subscription, error: subErr } = await admin
    .from("subscriptions")
    .upsert(subPayload as never, { onConflict: "company_id" })
    .select("*")
    .single();
  if (subErr) {
    log.error("admin/billing/configure", "Upsert subscription failed", subErr);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Custom chip pricing (only when provided).
  if (tag_tiers || card_tiers) {
    const pricingPayload: Record<string, unknown> = { company_id: companyId, updated_at: now.toISOString() };
    if (tag_tiers) pricingPayload.tag_tiers = tag_tiers;
    if (card_tiers) pricingPayload.card_tiers = card_tiers;
    const { error: priceErr } = await admin
      .from("brand_pricing")
      .upsert(pricingPayload as never, { onConflict: "company_id" });
    if (priceErr) log.error("admin/billing/configure", "Upsert pricing failed", priceErr);
  }

  // Brand-new, no-trial setup: raise the first invoice immediately and email it
  // with the payment link. The subscription stays `past_due` until that invoice
  // is settled (which flips it to `active` and advances the period). This is
  // what turns "active with no commitment" into "awaiting first payment".
  if (needsFirstInvoice) {
    try {
      const invoice = await createSubscriptionInvoice(admin, subscription.id);
      await sendInvoiceEmail(admin, invoice.id, "subscription");
    } catch (err) {
      log.error("admin/billing/configure", "First invoice generation failed", err);
    }
  }

  if (isNewTrial && company.email) {
    const firstInvoiceAmount = getEffectivePrice(plan.monthly_price, (subPayload.custom_monthly_price as number | null) ?? null, billing_interval);
    await sendTrialWelcomeEmail(company.email, {
      companyName: company.name,
      planName: plan.name,
      trialDays,
      trialEndsAt: trialEndsAt!,
      firstInvoiceAmount,
      dashboardUrl: `${APP_URL}/dashboard/features`,
    }).catch((err) => log.error("admin/billing/configure", "Trial welcome email failed", err));
  }

  return NextResponse.json({ subscription });
}
