import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

const state = vi.hoisted(() => ({
  otps: [] as { id: string; code_hash: string; attempts: number }[],
  codeMatches: true,
  ops: [] as string[],
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(() => Promise.resolve(state.codeMatches)),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.gt = () => b;
      b.order = () => b;
      b.limit = () => Promise.resolve({ data: state.otps, error: null });
      b.update = () => {
        state.ops.push(`${table}.update`);
        return { eq: () => Promise.resolve({ error: null }) };
      };
      return b;
    }),
  })),
}));

const { POST } = await import("@/app/api/transfer/confirm/route");

const validBody = { email: "owner@example.com", code: "123456" };

describe("POST /api/transfer/confirm", () => {
  beforeEach(() => {
    state.otps = [{ id: "otp-1", code_hash: "hashed", attempts: 0 }];
    state.codeMatches = true;
    state.ops = [];
  });

  it("returns 400 when email or code is missing", async () => {
    const res = await POST(makeRequest({ email: "owner@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when there is no valid code", async () => {
    state.otps = [];
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
  });

  it("returns 400 when attempts are exhausted", async () => {
    state.otps = [{ id: "otp-1", code_hash: "hashed", attempts: 5 }];
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
  });

  it("returns 400 and increments attempts on an incorrect code", async () => {
    state.codeMatches = false;
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(state.ops).toContain("otp_codes.update"); // attempts++
  });

  it("returns 200 with the verification id on success", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.verification).toBe("otp-1");
    expect(state.ops).toContain("otp_codes.update"); // marks is_used
  });
});
