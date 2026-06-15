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
  current_period_end?: string | null;
}

export interface ConfigureResult {
  payload: Record<string, unknown>;
  isNewTrial: boolean;
  // A brand-new, no-trial setup: the caller must raise the first invoice and
  // email it. The subscription is parked in `past_due` (awaiting payment) and
  // only becomes `active` once that invoice is settled.
  needsFirstInvoice: boolean;
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

  // A positive trialDays starts/restarts a trial. Anything else (0, null, or
  // omitted) means "no trial": for an existing subscription that is a mid-cycle
  // edit (period preserved); for a brand-new one it activates immediately but
  // requires the first invoice to be paid first.
  const trialProvided = input.trialDays !== undefined && input.trialDays !== null;
  const trialDays = trialProvided ? Math.max(0, Math.floor(input.trialDays as number)) : 0;
  const isTrial = trialDays > 0;
  const trialEndsAt = isTrial ? new Date(now.getTime() + trialDays * 86400000).toISOString() : null;

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
  let isNewTrial = false;
  let needsFirstInvoice = false;

  if (isTrial) {
    // Start (or restart) a free trial. First invoice is raised when it ends.
    Object.assign(payload, {
      status: "trialing",
      trial_starts_at: now.toISOString(),
      trial_ends_at: trialEndsAt,
      current_period_start: null,
      current_period_end: trialEndsAt,
    });
    action = "start_trial";
    isNewTrial = !existing || existing.status !== "trialing";
  } else if (existing && existing.current_period_end && existing.status !== "trialing") {
    // No trial on a healthy EXISTING subscription => mid-cycle edit. Never touch
    // status/period/trial here, so an active brand's billing window is
    // preserved (the new plan/price applies on the next invoice). This is the
    // fix for the bug where re-saving wiped current_period_end to null.
    action = "update_mid_cycle";
  } else if (existing && existing.status !== "trialing") {
    // Existing non-trial sub with NO billing period — i.e. the legacy
    // "active with no commitment" state (never invoiced). Re-saving repairs it:
    // park in past_due and raise the first invoice, same as a fresh no-trial
    // setup. (Trialing subs are left untouched by the mid-cycle clauses above.)
    Object.assign(payload, {
      status: "past_due",
      trial_starts_at: null,
      trial_ends_at: null,
      current_period_start: now.toISOString(),
      current_period_end: null,
    });
    action = "activate";
    needsFirstInvoice = true;
  } else if (existing) {
    // Existing trialing sub, no trial change => leave the trial running.
    action = "update_mid_cycle";
  } else {
    // Brand-new subscription, no trial: activate now but make payment a
    // precondition. Park it in `past_due` with an open period; the caller
    // raises + emails the first invoice, and settling it flips to `active`.
    Object.assign(payload, {
      status: "past_due",
      trial_starts_at: null,
      trial_ends_at: null,
      current_period_start: now.toISOString(),
      current_period_end: null,
    });
    action = "create";
    needsFirstInvoice = true;
  }

  return { payload, isNewTrial, needsFirstInvoice, action };
}
