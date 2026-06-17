import { describe, it, expect } from "vitest";
import {
  billingCyclePosition,
  buildBillingTimeline,
  billingKeyDates,
  pickOpenInvoice,
  type TimelineSub,
  type TimelineInvoice,
} from "@/lib/billing/lifecycle";

const NOW = new Date("2026-06-17T00:00:00Z");

function sub(over: Partial<TimelineSub> = {}): TimelineSub {
  return {
    status: "active",
    billing_interval: "monthly",
    created_at: "2026-05-01T00:00:00Z",
    trial_starts_at: null,
    trial_ends_at: null,
    current_period_start: "2026-06-01T00:00:00Z",
    current_period_end: "2026-07-01T00:00:00Z",
    ...over,
  };
}

function inv(over: Partial<TimelineInvoice> = {}): TimelineInvoice {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    type: "subscription",
    amount: 2500000,
    status: "paid",
    created_at: "2026-06-01T00:00:00Z",
    due_date: "2026-06-15",
    paid_at: "2026-06-03T10:00:00Z",
    suspended_at: null,
    ...over,
  };
}

describe("billingCyclePosition", () => {
  it("reports trialing with the first-invoice date", () => {
    const p = billingCyclePosition(
      { status: "trialing", trial_ends_at: "2026-06-20T00:00:00Z", current_period_end: null },
      null,
      NOW
    );
    expect(p.state).toBe("trialing");
    expect(p.next).toContain("First invoice issues");
  });

  it("flags an overdue first invoice with a suspension date", () => {
    const open = { id: "a", status: "sent", due_date: "2026-06-10", created_at: "2026-05-27T00:00:00Z", amount: 2500000 };
    const p = billingCyclePosition({ status: "past_due", trial_ends_at: null, current_period_end: null }, open, NOW);
    expect(p.headline).toContain("overdue");
    expect(p.suspendsAt).toBe("2026-07-01"); // due + 21 days
    expect(p.tone).toBe("warn");
  });
});

describe("pickOpenInvoice", () => {
  it("prefers the oldest open invoice and ignores paid ones", () => {
    const open = pickOpenInvoice([
      { id: "paid", status: "paid", due_date: "2026-06-01", created_at: "x", amount: 1 },
      { id: "new", status: "sent", due_date: "2026-06-20", created_at: "x", amount: 1 },
      { id: "old", status: "overdue", due_date: "2026-06-05", created_at: "x", amount: 1 },
    ]);
    expect(open?.id).toBe("old");
  });
});

describe("buildBillingTimeline", () => {
  it("emits trial, invoice, payment and renewal events in chronological order", () => {
    const events = buildBillingTimeline(
      sub({ trial_starts_at: "2026-05-01T00:00:00Z", trial_ends_at: "2026-05-15T00:00:00Z" }),
      [inv()],
      NOW
    );
    const kinds = events.map((e) => e.kind);
    expect(kinds).toEqual(["trial_start", "trial_end", "invoice", "payment", "scheduled"]);
    // sorted ascending by date
    const dates = events.map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
    // future renewal flagged upcoming
    expect(events.at(-1)?.upcoming).toBe(true);
  });

  it("adds a suspension event when an invoice was suspended", () => {
    const events = buildBillingTimeline(
      sub({ status: "suspended", current_period_end: null }),
      [inv({ status: "overdue", paid_at: null, suspended_at: "2026-06-12T00:00:00Z" })],
      NOW
    );
    expect(events.some((e) => e.kind === "suspended" && e.tone === "danger")).toBe(true);
  });

  it("uses 'created' when there is no trial", () => {
    const events = buildBillingTimeline(sub(), [], NOW);
    expect(events[0].kind).toBe("created");
  });
});

describe("billingKeyDates", () => {
  it("surfaces trial window, renewal and last payment", () => {
    const dates = billingKeyDates(sub({ trial_starts_at: "2026-05-01T00:00:00Z", trial_ends_at: "2026-05-15T00:00:00Z" }), [inv()]);
    const byLabel = Object.fromEntries(dates.map((d) => [d.label, d.value]));
    expect(byLabel["Trial period"]).toContain("→");
    expect(byLabel["Renews on"]).toBeTruthy();
    expect(byLabel["Last payment"]).not.toBe("None yet");
  });

  it("says 'No trial' and 'None yet' when applicable", () => {
    const dates = billingKeyDates(sub(), [inv({ paid_at: null, status: "sent" })]);
    const byLabel = Object.fromEntries(dates.map((d) => [d.label, d.value]));
    expect(byLabel["Trial period"]).toBe("No trial");
    expect(byLabel["Last payment"]).toBe("None yet");
  });
});
