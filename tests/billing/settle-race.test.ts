import { describe, it, expect, vi, beforeEach } from "vitest";

// Email is best-effort and external — stub it.
vi.mock("@/lib/email", () => ({
  sendPaymentConfirmedEmail: vi.fn(async () => {}),
}));

import { settleInvoice } from "@/lib/billing/settle";
import type { Invoice } from "@/types/database";

// A Supabase mock that models the ONE behaviour this guard depends on: the
// atomic `update(...).neq("status","paid")` claim only returns a row the first
// time. The second concurrent settlement sees zero rows (DB row already paid).
function mockSupabase() {
  let invoicePaidInDb = false;
  const captured = {
    paymentInserts: 0,
    subscriptionPeriodUpdates: 0,
    claims: 0,
  };

  function builder(table: string) {
    const state = { op: "select", afterSelect: false };
    const api: Record<string, unknown> = {};
    api.select = () => { state.afterSelect = true; return api; };
    api.insert = () => { state.op = "insert"; if (table === "payments") captured.paymentInserts += 1; return api; };
    api.update = () => { state.op = "update"; return api; };
    api.eq = () => api;
    api.neq = () => api;
    api.in = () => api;
    api.order = () => api;

    const resolve = () => {
      if (table === "invoices" && state.op === "update") {
        // The atomic claim: row returned only if not already paid.
        if (invoicePaidInDb) return { data: [], error: null };
        invoicePaidInDb = true;
        captured.claims += 1;
        return { data: [{ id: "inv-1" }], error: null };
      }
      if (table === "subscriptions" && state.op === "select") {
        return { data: { billing_interval: "monthly", current_period_end: "2026-06-01T00:00:00Z" }, error: null };
      }
      if (table === "subscriptions" && state.op === "update") {
        captured.subscriptionPeriodUpdates += 1;
        return { data: null, error: null };
      }
      if (table === "companies") return { data: { name: "Brand", email: "brand@test.co" }, error: null };
      if (table === "invoice_line_items") return { data: [], error: null };
      return { data: null, error: null };
    };

    api.single = async () => resolve();
    api.maybeSingle = async () => resolve();
    api.then = (res: (v: unknown) => void) => Promise.resolve(resolve()).then(res);
    return api;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { from: (t: string) => builder(t) } as any;
  return { client, captured };
}

const subscriptionInvoice = {
  id: "inv-1",
  company_id: "c1",
  type: "subscription",
  status: "sent",
  amount: 15000000,
  subtotal: 15000000,
  discount_amount: 0,
  discount_percentage: null,
  subscription_id: "s1",
  batch_id: null,
  paystack_reference: "tgt_ref_1",
  created_at: "2026-06-11T00:00:00Z",
} as unknown as Invoice;

describe("settleInvoice — concurrent settlement guard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("settles once and advances the subscription period exactly once", async () => {
    const { client, captured } = mockSupabase();
    const r = await settleInvoice(client, subscriptionInvoice, { reference: "tgt_ref_1", amount: 15000000 });
    expect(r.alreadyPaid).toBe(false);
    expect(captured.claims).toBe(1);
    expect(captured.paymentInserts).toBe(1);
    expect(captured.subscriptionPeriodUpdates).toBe(1);
  });

  it("a second settlement that lost the race is a no-op (no double period advance, no double payment)", async () => {
    const { client, captured } = mockSupabase();
    // Two settlements both arrive with a stale `status: "sent"` invoice object
    // (the webhook + the redirect callback). The DB claim must let only one win.
    const first = await settleInvoice(client, subscriptionInvoice, { reference: "tgt_ref_1", amount: 15000000 });
    const second = await settleInvoice(client, subscriptionInvoice, { reference: "callback_ref_2", amount: 15000000 });

    expect(first.alreadyPaid).toBe(false);
    expect(second.alreadyPaid).toBe(true); // lost the race
    expect(captured.claims).toBe(1);
    expect(captured.paymentInserts).toBe(1); // not 2
    expect(captured.subscriptionPeriodUpdates).toBe(1); // period advanced once, not twice
  });

  it("ignores an underpayment without marking paid", async () => {
    const { client, captured } = mockSupabase();
    const r = await settleInvoice(client, subscriptionInvoice, { reference: "tgt_ref_1", amount: 1 });
    expect(r.alreadyPaid).toBe(false);
    expect(captured.claims).toBe(0);
    expect(captured.paymentInserts).toBe(0);
  });
});
