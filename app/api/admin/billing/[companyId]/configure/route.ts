import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendTrialWelcomeEmail } from "@/lib/email";
import { getEffectivePrice } from "@/lib/billing/pricing";
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
    admin.from("subscriptions").select("id, status, trial_ends_at").eq("company_id", companyId).maybeSingle(),
  ]);

  if (!company || !plan) {
    return NextResponse.json({ error: "Company or plan not found." }, { status: 404 });
  }

  const now = new Date();

  const customPrice =
    custom_monthly_price === undefined || custom_monthly_price === null || custom_monthly_price === 0
      ? null
      : custom_monthly_price;

  // Trial scheduling is only (re)applied when trial_days is explicitly sent.
  // A pricing-only save omits it, so an in-progress trial is never disturbed.
  const trialProvided = trial_days !== undefined && trial_days !== null;
  const trialDays = trialProvided ? Math.max(0, Math.floor(trial_days as number)) : 0;
  const isNewTrial = trialProvided && trialDays > 0 && (!existing || existing.status !== "trialing");
  const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000).toISOString() : null;

  // Blank override → null (fall back to the plan's lifetime limit).
  const normLimit = (v: number | null | undefined) =>
    v === undefined || v === null || (v as unknown) === "" ? null : Math.max(0, Math.floor(Number(v)));

  // Base fields always written.
  const subPayload: Record<string, unknown> = {
    company_id: companyId,
    plan_id,
    billing_interval,
    custom_monthly_price: customPrice,
    tag_limit_override: normLimit(tag_limit_override),
    card_limit_override: normLimit(card_limit_override),
    updated_at: now.toISOString(),
  };

  if (trialProvided) {
    // Admin explicitly set (or cleared) the trial: reset scheduling accordingly.
    Object.assign(subPayload, {
      status: trialDays > 0 ? "trialing" : "active",
      trial_starts_at: trialDays > 0 ? now.toISOString() : null,
      trial_ends_at: trialEndsAt,
      current_period_start: trialDays > 0 ? null : now.toISOString(),
      current_period_end: trialDays > 0 ? trialEndsAt : null,
    });
  } else if (!existing) {
    // New subscription, no trial specified: start an active period now.
    Object.assign(subPayload, {
      status: "active",
      current_period_start: now.toISOString(),
    });
  }
  // else: existing subscription, no trial field → leave status/trial/period as-is.

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

  if (isNewTrial && company.email) {
    const firstInvoiceAmount = getEffectivePrice(plan.monthly_price, customPrice, billing_interval);
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
