import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Paystack + email so invoice creation stays offline ──────────────────
vi.mock("@/lib/paystack", () => ({
  initializeTransaction: vi.fn(async () => ({ authorization_url: "https://paystack.test/pay/abc", access_code: "ac", reference: "ref" })),
  buildReference: vi.fn(() => "tgt_test_ref"),
}));
vi.mock("@/lib/email", () => ({
  sendBatchInvoiceEmail: vi.fn(async () => {}),
  sendSubscriptionInvoiceEmail: vi.fn(async () => {}),
}));

import { createBatchInvoice, createSubscriptionInvoice } from "@/lib/billing/invoices";

interface Captured {
  invoice: Record<string, unknown> | null;
  lineItems: Record<string, unknown>[];
  batchStatus: string | null;
}

// Fixture-driven Supabase mock supporting the chains invoices.ts uses.
function mockSupabase(fixtures: {
  batch?: Record<string, unknown>;
  pricing?: Record<string, unknown> | null;
  batchDiscount?: Record<string, unknown> | null;
  subDiscount?: Record<string, unknown> | null;
  subscription?: Record<string, unknown>;
  company?: Record<string, unknown>;
}) {
  const captured: Captured = { invoice: null, lineItems: [], batchStatus: null };

  function builder(table: string) {
    const state: { op: string; filters: Record<string, unknown>; data: Record<string, unknown> | null } = { op: "select", filters: {}, data: null };
    const api: Record<string, unknown> = {};
    api.select = () => api;
    api.insert = (d: Record<string, unknown> | Record<string, unknown>[]) => { state.op = "insert"; state.data = Array.isArray(d) ? null : d; if (Array.isArray(d) && table === "invoice_line_items") captured.lineItems.push(...d); return api; };
    api.update = (d: Record<string, unknown>) => { state.op = "update"; state.data = d; if (table === "tag_batches") captured.batchStatus = (d.status as string) ?? captured.batchStatus; return api; };
    api.eq = (c: string, v: unknown) => { state.filters[c] = v; return api; };
    api.order = () => api;

    const resolve = () => {
      if (table === "tag_batches" && state.op === "select") return { data: fixtures.batch ?? null, error: null };
      if (table === "brand_pricing") return { data: fixtures.pricing ?? null, error: null };
      if (table === "discounts" && state.op === "select") {
        // getActive*Discount (filters by type) vs consumeDiscount (filters by id)
        if (state.filters.type === "batch") return { data: fixtures.batchDiscount ?? null, error: null };
        if (state.filters.type === "subscription") return { data: fixtures.subDiscount ?? null, error: null };
        return { data: fixtures.batchDiscount ?? fixtures.subDiscount ?? null, error: null };
      }
      if (table === "subscriptions" && state.op === "select") return { data: fixtures.subscription ?? null, error: null };
      if (table === "companies") return { data: fixtures.company ?? { email: "brand@test.co", name: "Brand" }, error: null };
      if (table === "invoices" && state.op === "insert") {
        const inv = { id: "inv-1", created_at: "2026-06-11T00:00:00Z", paystack_payment_link: null, paystack_reference: null, ...state.data };
        captured.invoice = inv;
        return { data: inv, error: null };
      }
      return { data: null, error: null };
    };

    api.single = async () => resolve();
    api.maybeSingle = async () => resolve();
    api.then = (res: (v: { data: null; error: null }) => void) => Promise.resolve({ data: null, error: null }).then(res);
    return api;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = { from: (t: string) => builder(t) } as any;
  return { client, captured };
}

describe("createBatchInvoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates invoice with correct subtotal from default tiers (tags only)", async () => {
    const { client, captured } = mockSupabase({ batch: { batch_size: 10, cards_quantity: 0, batch_type: "tags" }, pricing: null });
    const inv = await createBatchInvoice(client, "b1", "c1");
    // 10 tags @ 400000 = 4,000,000
    expect(inv.subtotal).toBe(4000000);
    expect(inv.amount).toBe(4000000);
    expect(captured.lineItems).toHaveLength(1);
    expect(captured.batchStatus).toBe("awaiting_payment");
  });

  it("creates correct line items for a mixed batch", async () => {
    const { captured } = mockSupabase({ batch: { batch_size: 60, cards_quantity: 60, batch_type: "mixed" }, pricing: null });
    const { client, captured: cap } = mockSupabase({ batch: { batch_size: 60, cards_quantity: 60, batch_type: "mixed" }, pricing: null });
    void captured;
    const inv = await createBatchInvoice(client, "b1", "c1");
    // 60 tags @ 350000 + 60 cards @ 350000
    expect(inv.subtotal).toBe(60 * 350000 * 2);
    expect(cap.lineItems.filter((l) => (l.total as number) > 0)).toHaveLength(2);
  });

  it("applies an active batch discount and records a discount line", async () => {
    const { client, captured } = mockSupabase({
      batch: { batch_size: 10, cards_quantity: 0, batch_type: "tags" },
      pricing: null,
      batchDiscount: { id: "d1", type: "batch", percentage: 20, duration: 5, used: 0 },
    });
    const inv = await createBatchInvoice(client, "b1", "c1");
    expect(inv.subtotal).toBe(4000000);
    expect(inv.discount_amount).toBe(800000);
    expect(inv.amount).toBe(3200000);
    expect(captured.lineItems.some((l) => (l.total as number) < 0)).toBe(true);
  });

  it("creates invoice with no discount when none active", async () => {
    const { client } = mockSupabase({ batch: { batch_size: 10, cards_quantity: 0, batch_type: "tags" }, pricing: null, batchDiscount: null });
    const inv = await createBatchInvoice(client, "b1", "c1");
    expect(inv.discount_amount).toBe(0);
    expect(inv.discount_id).toBeNull();
  });
});

describe("createSubscriptionInvoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates correct amount for a monthly plan", async () => {
    const { client } = mockSupabase({
      subscription: { id: "s1", company_id: "c1", billing_interval: "monthly", custom_monthly_price: null, current_period_end: null, trial_ends_at: null, plans: { name: "Atelier", monthly_price: 15000000 } },
    });
    const inv = await createSubscriptionInvoice(client, "s1");
    expect(inv.subtotal).toBe(15000000);
    expect(inv.amount).toBe(15000000);
  });

  it("applies a custom price override and a subscription discount", async () => {
    const { client, captured } = mockSupabase({
      subscription: { id: "s1", company_id: "c1", billing_interval: "monthly", custom_monthly_price: 12000000, current_period_end: null, trial_ends_at: null, plans: { name: "Atelier", monthly_price: 15000000 } },
      subDiscount: { id: "sd1", type: "subscription", percentage: 25, duration: 6, used: 0 },
    });
    const inv = await createSubscriptionInvoice(client, "s1");
    expect(inv.subtotal).toBe(12000000);
    expect(inv.discount_amount).toBe(3000000);
    expect(inv.amount).toBe(9000000);
    expect(captured.lineItems.some((l) => (l.total as number) < 0)).toBe(true);
  });
});
