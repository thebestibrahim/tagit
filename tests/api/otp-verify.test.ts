import { describe, it, expect, vi, beforeEach } from "vitest";
import { hash } from "bcryptjs";
import { makeRequest } from "../setup";

const mockOtpRow = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function(this: unknown) { return this; }),
        gt: vi.fn(function(this: unknown) { return this; }),
        order: vi.fn(function(this: unknown) { return this; }),
        limit: vi.fn(() => Promise.resolve({ data: mockOtpRow(), error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null, ...mockUpdate() })),
      })),
    })),
  })),
}));

const { POST } = await import("@/app/api/otp/verify/route");

const FUTURE = new Date(Date.now() + 10 * 60 * 1000).toISOString();

describe("POST /api/otp/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({});
  });

  it("returns 400 when fields are missing", async () => {
    mockOtpRow.mockReturnValue(null);
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no valid OTP exists", async () => {
    mockOtpRow.mockReturnValue([]);
    const res = await POST(makeRequest({ email: "a@b.com", code: "123456", purpose: "claim" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no valid code/i);
  });

  it("returns 400 after 5 failed attempts", async () => {
    const code_hash = await hash("999999", 10);
    mockOtpRow.mockReturnValue([
      { id: "1", code_hash, attempts: 5, is_used: false, expires_at: FUTURE },
    ]);
    const res = await POST(makeRequest({ email: "a@b.com", code: "000000", purpose: "claim" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too many attempts/i);
  });

  it("returns 400 and increments attempts on wrong code", async () => {
    const code_hash = await hash("111111", 10);
    mockOtpRow.mockReturnValue([
      { id: "abc", code_hash, attempts: 2, is_used: false, expires_at: FUTURE },
    ]);
    const res = await POST(makeRequest({ email: "a@b.com", code: "000000", purpose: "claim" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/incorrect/i);
  });

  it("returns 200 with correct code", async () => {
    const correctCode = "654321";
    const code_hash = await hash(correctCode, 10);
    mockOtpRow.mockReturnValue([
      { id: "xyz", code_hash, attempts: 0, is_used: false, expires_at: FUTURE },
    ]);
    const res = await POST(makeRequest({ email: "a@b.com", code: correctCode, purpose: "claim" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
