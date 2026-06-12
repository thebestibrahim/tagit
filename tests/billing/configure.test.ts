import { describe, it, expect } from "vitest";
import { buildSubscriptionConfig, type ConfigureInput } from "@/lib/billing/configure";

const NOW = new Date("2026-06-12T00:00:00Z");

function input(over: Partial<ConfigureInput> = {}): ConfigureInput {
  return {
    companyId: "c1",
    planId: "plan-atelier",
    billingInterval: "monthly",
    customMonthlyPrice: null,
    tagLimitOverride: null,
    cardLimitOverride: null,
    ...over,
  };
}

describe("buildSubscriptionConfig", () => {
  it("creates an active subscription when none exists and no trial given", () => {
    const r = buildSubscriptionConfig(null, input(), NOW);
    expect(r.action).toBe("create");
    expect(r.payload.status).toBe("active");
    expect(r.payload.current_period_start).toBe(NOW.toISOString());
    expect(r.isNewTrial).toBe(false);
  });

  it("starts a trial when trialDays > 0 on a new subscription", () => {
    const r = buildSubscriptionConfig(null, input({ trialDays: 14 }), NOW);
    expect(r.action).toBe("start_trial");
    expect(r.payload.status).toBe("trialing");
    expect(r.isNewTrial).toBe(true);
    expect(r.payload.trial_ends_at).toBe(new Date(NOW.getTime() + 14 * 86400000).toISOString());
    expect(r.payload.current_period_end).toBe(r.payload.trial_ends_at);
  });

  it("does NOT re-flag isNewTrial when the brand is already trialing", () => {
    const r = buildSubscriptionConfig({ status: "trialing" }, input({ trialDays: 7 }), NOW);
    expect(r.isNewTrial).toBe(false);
    expect(r.payload.status).toBe("trialing");
  });

  it("mid-cycle plan change preserves the period (no status/period writes)", () => {
    const r = buildSubscriptionConfig({ status: "active" }, input({ planId: "plan-maison" }), NOW);
    expect(r.action).toBe("update_mid_cycle");
    expect(r.payload.plan_id).toBe("plan-maison");
    // Period/status untouched so the current cycle is preserved.
    expect(r.payload).not.toHaveProperty("status");
    expect(r.payload).not.toHaveProperty("current_period_start");
    expect(r.payload).not.toHaveProperty("current_period_end");
    expect(r.payload).not.toHaveProperty("trial_ends_at");
  });

  it("clearing the trial (trialDays 0) on a trialing brand activates it", () => {
    const r = buildSubscriptionConfig({ status: "trialing" }, input({ trialDays: 0 }), NOW);
    expect(r.action).toBe("activate");
    expect(r.payload.status).toBe("active");
    expect(r.payload.trial_ends_at).toBeNull();
    expect(r.payload.current_period_start).toBe(NOW.toISOString());
  });

  it("normalises money and limits: 0 / blank → null, floors values", () => {
    const r = buildSubscriptionConfig(
      { status: "active" },
      input({ customMonthlyPrice: 0, tagLimitOverride: 0, cardLimitOverride: 50 }),
      NOW
    );
    expect(r.payload.custom_monthly_price).toBeNull();
    expect(r.payload.tag_limit_override).toBe(0); // 0 is a real override (no chips)
    expect(r.payload.card_limit_override).toBe(50);
  });

  it("keeps a custom price when provided", () => {
    const r = buildSubscriptionConfig(null, input({ customMonthlyPrice: 12000000 }), NOW);
    expect(r.payload.custom_monthly_price).toBe(12000000);
  });

  it("always writes plan, interval and overrides", () => {
    const r = buildSubscriptionConfig({ status: "active" }, input({ billingInterval: "quarterly", tagLimitOverride: 100 }), NOW);
    expect(r.payload.plan_id).toBe("plan-atelier");
    expect(r.payload.billing_interval).toBe("quarterly");
    expect(r.payload.tag_limit_override).toBe(100);
  });
});
