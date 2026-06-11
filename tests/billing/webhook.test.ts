import { describe, it, expect, beforeAll } from "vitest";
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
});
