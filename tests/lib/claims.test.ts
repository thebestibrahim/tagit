import { describe, it, expect, vi } from "vitest";

// claims.ts imports email + certificate modules at module load; stub their
// side-effectful deps so we can test the pure helper in isolation.
vi.mock("@/lib/email", () => ({
  sendClaimApprovedEmail: vi.fn(),
  sendCertificateEmail: vi.fn(),
  APP_URL: "http://localhost:3000",
}));
vi.mock("@/lib/certificate", () => ({
  generateCertNumber: vi.fn(),
  generateCertificatePdf: vi.fn(),
  fetchLogoDataUrl: vi.fn(),
  certificateUrl: vi.fn(),
}));

const { claimExpiresAt, CLAIM_WINDOW_HOURS } = await import("@/lib/claims");

describe("claimExpiresAt", () => {
  it("is a 24-hour window", () => {
    expect(CLAIM_WINDOW_HOURS).toBe(24);
  });

  it("returns an ISO timestamp 24h after the given time", () => {
    const from = new Date("2026-06-03T00:00:00.000Z");
    const result = claimExpiresAt(from);
    expect(result).toBe("2026-06-04T00:00:00.000Z");
  });

  it("defaults to 24h from now", () => {
    const before = Date.now();
    const result = new Date(claimExpiresAt()).getTime();
    const expected = before + 24 * 60 * 60 * 1000;
    // within a 2s tolerance for execution time
    expect(Math.abs(result - expected)).toBeLessThan(2000);
  });
});
