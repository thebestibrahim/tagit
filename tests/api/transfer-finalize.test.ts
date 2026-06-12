import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

const state = vi.hoisted(() => ({
  otp: null as null | { id: string; email: string; purpose: string; is_used: boolean; created_at: string },
  tag: { id: "tag-1", status: "owned", product_id: "p1", products: { name: "Bag", companies: { name: "Brand" } } } as Record<string, unknown> | null,
  owner: { id: "own-1", owner_name: "Jane", owner_email: "owner@example.com" } as Record<string, unknown> | null,
  insert: { data: { id: "tr-1" }, error: null } as { data: { id: string } | null; error: unknown },
  ops: [] as string[],
}));

vi.mock("@/lib/tags", () => ({
  getSiblingTagIds: vi.fn(() => Promise.resolve(["tag-1"])),
}));

vi.mock("@/lib/email", () => ({
  sendTransferAcceptanceEmail: vi.fn(() => Promise.resolve()),
  APP_URL: "http://localhost:3000",
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.in = () => b;
      b.insert = () => {
        state.ops.push(`${table}.insert`);
        return b;
      };
      b.single = () => {
        switch (table) {
          case "otp_codes":
            return Promise.resolve({ data: state.otp, error: state.otp ? null : { message: "none" } });
          case "tags":
            return Promise.resolve({ data: state.tag, error: null });
          case "ownership_records":
            return Promise.resolve({ data: state.owner, error: null });
          case "transfer_requests":
            return Promise.resolve(state.insert);
          default:
            return Promise.resolve({ data: null, error: null });
        }
      };
      return b;
    }),
  })),
}));

const { POST } = await import("@/app/api/transfer/finalize/route");

const validBody = {
  tag_id: "tag-1",
  owner_email: "owner@example.com",
  verification: "otp-1",
  recipient_name: "Jane Doe",
  recipient_email: "jane@example.com",
  sale_price: null,
};

describe("POST /api/transfer/finalize", () => {
  beforeEach(() => {
    state.otp = {
      id: "otp-1",
      email: "owner@example.com",
      purpose: "transfer",
      is_used: true,
      created_at: new Date().toISOString(),
    };
    state.tag = { id: "tag-1", status: "owned", product_id: "p1", products: { name: "Bag", companies: { name: "Brand" } } };
    state.owner = { id: "own-1", owner_name: "Jane", owner_email: "owner@example.com" };
    state.insert = { data: { id: "tr-1" }, error: null };
    state.ops = [];
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ tag_id: "tag-1", owner_email: "owner@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when the verification proof is unused/invalid", async () => {
    state.otp = { id: "otp-1", email: "owner@example.com", purpose: "transfer", is_used: false, created_at: new Date().toISOString() };
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 403 when the verification is stale", async () => {
    state.otp = {
      id: "otp-1",
      email: "owner@example.com",
      purpose: "transfer",
      is_used: true,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    };
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 403 when the email no longer matches the current owner", async () => {
    state.owner = { id: "own-1", owner_name: "Jane", owner_email: "someone-else@example.com" };
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("returns 409 when the tag is no longer transferable", async () => {
    state.tag = { id: "tag-1", status: "live", product_id: "p1", products: null };
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("creates the transfer and returns the id on success", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.transfer_id).toBe("tr-1");
    expect(body.acceptanceUrl).toContain("/v/transfer/");
    expect(state.ops).toContain("transfer_requests.insert");
  });
});
