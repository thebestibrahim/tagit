import type { BillingInterval } from "@/types/database";

// Pure logic for what an admin "Save configuration" writes to a subscription.
// Extracted so the behaviour (especially mid-cycle plan changes vs trial setup)
// is unit-testable and identical across call sites.

export interface ConfigureInput {
  companyId: string;
  planId: string;
  billingInterval: BillingInterval;
  customMonthlyPrice?: number | null;
  tagLimitOverride?: number | null;
  cardLimitOverride?: number | null;
  // undefined/null => leave trial/status/period untouched (a mid-cycle edit).
  trialDays?: number | null;
}

export interface ExistingSub {
  status: string;
}

export interface ConfigureResult {
  payload: Record<string, unknown>;
  isNewTrial: boolean;
  // What effectively happens, for messaging/telemetry.
  action: "create" | "start_trial" | "activate" | "update_mid_cycle";
}

function normMoney(v: number | null | undefined): number | null {
  return v === undefined || v === null || v === 0 ? null : v;
}

function normLimit(v: number | null | undefined): number | null {
  return v === undefined || v === null || (v as unknown) === "" ? null : Math.max(0, Math.floor(Number(v)));
}

export function buildSubscriptionConfig(
  existing: ExistingSub | null,
  input: ConfigureInput,
  now: Date = new Date()
): ConfigureResult {
  const customPrice = normMoney(input.customMonthlyPrice);

  // Trial scheduling is only (re)applied when trialDays is explicitly provided.
  // A mid-cycle edit (plan/price/limits) omits it and the period is preserved.
  const trialProvided = input.trialDays !== undefined && input.trialDays !== null;
  const trialDays = trialProvided ? Math.max(0, Math.floor(input.trialDays as number)) : 0;
  const isNewTrial = trialProvided && trialDays > 0 && (!existing || existing.status !== "trialing");
  const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000).toISOString() : null;

  const payload: Record<string, unknown> = {
    company_id: input.companyId,
    plan_id: input.planId,
    billing_interval: input.billingInterval,
    custom_monthly_price: customPrice,
    tag_limit_override: normLimit(input.tagLimitOverride),
    card_limit_override: normLimit(input.cardLimitOverride),
    updated_at: now.toISOString(),
  };

  let action: ConfigureResult["action"];

  if (trialProvided) {
    // Admin set or cleared a trial: reset scheduling accordingly.
    Object.assign(payload, {
      status: trialDays > 0 ? "trialing" : "active",
      trial_starts_at: trialDays > 0 ? now.toISOString() : null,
      trial_ends_at: trialEndsAt,
      current_period_start: trialDays > 0 ? null : now.toISOString(),
      current_period_end: trialDays > 0 ? trialEndsAt : null,
    });
    action = trialDays > 0 ? "start_trial" : existing ? "activate" : "create";
  } else if (!existing) {
    // New subscription, no trial specified: start an active period now.
    Object.assign(payload, {
      status: "active",
      current_period_start: now.toISOString(),
    });
    action = "create";
  } else {
    // Existing subscription, plan/price/limits change only — period preserved,
    // new pricing takes effect on the next invoice.
    action = "update_mid_cycle";
  }

  return { payload, isNewTrial, action };
}
