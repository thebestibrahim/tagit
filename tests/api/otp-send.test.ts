import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

const mockInsert = vi.fn();
const mockCount = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "otp_codes") {
        return {
          // count query: .select().eq("email").gte("created_at")
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => Promise.resolve({ count: mockCount(), error: null })),
            })),
          })),
          insert: vi.fn(() => Promise.resolve(mockInsert())),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@/lib/email", () => ({
  sendOtpEmail: vi.fn(() => Promise.resolve()),
}));

const { POST } = await import("@/app/api/otp/send/route");

describe("POST /api/otp/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCount.mockReturnValue(0);
    mockInsert.mockReturnValue({ error: null });
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ purpose: "claim" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it("returns 400 when purpose is missing", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid purpose", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", purpose: "unknown" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid purpose/i);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCount.mockReturnValue(5);
    const res = await POST(makeRequest({ email: "user@example.com", purpose: "claim" }));
    expect(res.status).toBe(429);
  });

  it("returns 500 when DB insert fails", async () => {
    mockInsert.mockReturnValue({ error: { message: "db error" } });
    const res = await POST(makeRequest({ email: "user@example.com", purpose: "claim" }));
    expect(res.status).toBe(500);
  });

  it("returns 200 on success", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", purpose: "claim" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("accepts transfer as a valid purpose", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", purpose: "transfer" }));
    expect(res.status).toBe(200);
  });
});
