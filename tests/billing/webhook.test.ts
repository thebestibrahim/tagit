import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import crypto from "crypto";

const SECRET = "sk_test_unit_secret";

beforeAll(() => {
  process.env.PAYSTACK_SECRET_KEY = SECRET;
});

function sign(body: string): string {
  return crypto.createHmac("sha512", SECRET).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a correct signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paystack");
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects an incorrect signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paystack");
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });

  it("rejects a missing signature", async () => {
    const { verifyWebhookSignature } = await import("@/lib/paystack");
    expect(verifyWebhookSignature("{}", null)).toBe(false);
  });
});

describe("buildReference", () => {
  it("produces a unique, prefixed reference", async () => {
    const { buildReference } = await import("@/lib/paystack");
    const a = buildReference("3f9a1b2c-0000-0000-0000-000000000000");
    const b = buildReference("3f9a1b2c-0000-0000-0000-000000000000");
    expect(a.startsWith("tgt_")).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("POST /api/webhooks/paystack", () => {
  function req(body: string, signature: string | null) {
    return new Request("http://localhost/api/webhooks/paystack", {
      method: "POST",
      headers: signature ? { "x-paystack-signature": signature } : {},
      body,
    });
  }

  it("rejects an invalid signature — 401", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const res = await POST(req(JSON.stringify({ event: "charge.success" }), "bad"));
    expect(res.status).toBe(401);
  });

  it("returns 200 for a non-charge event (ignored, idempotent)", async () => {
    const { POST } = await import("@/app/api/webhooks/paystack/route");
    const body = JSON.stringify({ event: "transfer.success", data: { reference: "x" } });
    const res = await POST(req(body, sign(body)));
    expect(res.status).toBe(200);
  });

  describe("invoice matching", () => {
    afterEach(() => {
      vi.doUnmock("@/lib/billing/settle");
      vi.doUnmock("@supabase/supabase-js");
      vi.resetModules();
    });

    // ensurePaystackLink mints a fresh Paystack reference on every "Pay now"
    // click, so an invoice's stored `paystack_reference` column reflects
    // whichever click was LAST, not necessarily the one this event reports on
    // (e.g. an earlier, still-open checkout tab is the one that actually paid).
    // The webhook must resolve the invoice via metadata.invoice_id, not by
    // matching the event's reference against that single mutable column.
    it("matches the invoice by metadata.invoice_id, not by the stale stored paystack_reference", async () => {
      const settleInvoice = vi.fn(async () => ({ alreadyPaid: false }));
      vi.doMock("@/lib/billing/settle", () => ({ settleInvoice }));

      const invoiceRow = { id: "inv-by-metadata", status: "sent", amount: 500000, paystack_reference: "old-stale-ref" };
      vi.doMock("@supabase/supabase-js", () => ({
        createClient: vi.fn(() => ({
          from: vi.fn((table: string) => {
            if (table !== "invoices") return {};
            return {
              select: vi.fn(() => ({
                eq: vi.fn((col: string, val: string) => ({
                  // A reference-based lookup would find nothing here — proving
                  // settlement succeeded via the metadata match, not a fallback.
                  maybeSingle: vi.fn(async () =>
                    col === "id" && val === "inv-by-metadata"
                      ? { data: invoiceRow, error: null }
                      : { data: null, error: null }
                  ),
                })),
              })),
            };
          }),
        })),
      }));

      vi.resetModules();
      const { POST } = await import("@/app/api/webhooks/paystack/route");
      const body = JSON.stringify({
        event: "charge.success",
        data: { reference: "fresh-ref-not-on-row", amount: 500000, metadata: { invoice_id: "inv-by-metadata" } },
      });
      const res = await POST(req(body, sign(body)));

      expect(res.status).toBe(200);
      expect(settleInvoice).toHaveBeenCalledTimes(1);
      expect(settleInvoice.mock.calls[0][1]).toMatchObject({ id: "inv-by-metadata" });
      expect(settleInvoice.mock.calls[0][2]).toMatchObject({ reference: "fresh-ref-not-on-row" });
    });

    it("falls back to matching by paystack_reference when metadata is absent", async () => {
      const settleInvoice = vi.fn(async () => ({ alreadyPaid: false }));
      vi.doMock("@/lib/billing/settle", () => ({ settleInvoice }));

      const invoiceRow = { id: "inv-by-reference", status: "sent", amount: 250000, paystack_reference: "ref-only" };
      vi.doMock("@supabase/supabase-js", () => ({
        createClient: vi.fn(() => ({
          from: vi.fn((table: string) => {
            if (table !== "invoices") return {};
            return {
              select: vi.fn(() => ({
                eq: vi.fn((col: string, val: string) => ({
                  maybeSingle: vi.fn(async () =>
                    col === "paystack_reference" && val === "ref-only"
                      ? { data: invoiceRow, error: null }
                      : { data: null, error: null }
                  ),
                })),
              })),
            };
          }),
        })),
      }));

      vi.resetModules();
      const { POST } = await import("@/app/api/webhooks/paystack/route");
      const body = JSON.stringify({
        event: "charge.success",
        data: { reference: "ref-only", amount: 250000 },
      });
      const res = await POST(req(body, sign(body)));

      expect(res.status).toBe(200);
      expect(settleInvoice).toHaveBeenCalledTimes(1);
      expect(settleInvoice.mock.calls[0][1]).toMatchObject({ id: "inv-by-reference" });
    });
  });
});
