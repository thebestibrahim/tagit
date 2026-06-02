import { describe, it, expect, vi, beforeEach } from "vitest";

// Avoid pulling in email/certificate side effects via the real confirmClaim.
vi.mock("@/lib/claims", () => ({
  confirmClaim: vi.fn(() => Promise.resolve({ confirmed: true })),
}));

let authHeader: string | null = null;
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({ get: (k: string) => (k === "authorization" ? authHeader : null) })
  ),
}));

const { GET } = await import("@/app/api/cron/confirm-claims/route");

describe("GET /api/cron/confirm-claims (auth guard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authHeader = null;
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when CRON_SECRET is not configured (fails closed)", async () => {
    authHeader = "Bearer anything";
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when the bearer token does not match", async () => {
    process.env.CRON_SECRET = "right-secret";
    authHeader = "Bearer wrong-secret";
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when no authorization header is present", async () => {
    process.env.CRON_SECRET = "right-secret";
    authHeader = null;
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
