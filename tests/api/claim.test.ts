import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

const mockOtpSelect = vi.fn();
const mockOtpUpdate = vi.fn();
const mockTagSelect = vi.fn();
const mockOwnerSelect = vi.fn();
const mockClaimsSelect = vi.fn();
const mockClaimInsert = vi.fn();
const mockTagsProductSelect = vi.fn();
const mockCompanySelect = vi.fn();
const mockCompare = vi.fn();
const mockSendClaimNotificationEmail = vi.fn(() => Promise.resolve());
const mockGetSiblingTagIds = vi.fn();
const mockReleaseExpiredClaims = vi.fn(() => Promise.resolve());

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "otp_codes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gt: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => Promise.resolve(mockOtpSelect())),
                    })),
                  })),
                })),
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve(mockOtpUpdate())),
          })),
        };
      }
      if (table === "tags") {
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("products")) {
              return {
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve(mockTagsProductSelect())),
                })),
              };
            }
            return {
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockTagSelect())),
              })),
            };
          }),
        };
      }
      if (table === "ownership_records") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve(mockOwnerSelect())),
              })),
            })),
          })),
        };
      }
      if (table === "ownership_claims") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve(mockClaimsSelect())),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve(mockClaimInsert())),
            })),
          })),
        };
      }
      if (table === "companies") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve(mockCompanySelect())),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("bcryptjs", () => ({ compare: mockCompare }));

vi.mock("@/lib/email", () => ({
  sendClaimNotificationEmail: mockSendClaimNotificationEmail,
  APP_URL: "http://localhost:3000",
}));

vi.mock("@/lib/claims", () => ({
  claimExpiresAt: () => "2026-07-01T00:00:00.000Z",
  releaseExpiredClaims: mockReleaseExpiredClaims,
}));

vi.mock("@/lib/tags", () => ({
  getSiblingTagIds: mockGetSiblingTagIds,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: (key: string) => (key === "x-forwarded-for" ? "1.2.3.4" : null),
    })
  ),
}));

const { POST } = await import("@/app/api/claim/route");

const validBody = {
  tag_id: "tag-uuid",
  claimant_name: "Amara Okafor",
  claimant_email: "amara@example.com",
  otp_code: "123456",
};

describe("POST /api/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOtpSelect.mockReturnValue({
      data: [{ id: "otp-1", code_hash: "hashed", attempts: 0 }],
      error: null,
    });
    mockOtpUpdate.mockReturnValue({ error: null });
    mockCompare.mockResolvedValue(true);
    mockTagSelect.mockReturnValue({
      data: { id: "tag-uuid", status: "live", company_id: "company-uuid", short_id: "ABC123", product_id: "product-uuid" },
      error: null,
    });
    mockGetSiblingTagIds.mockResolvedValue(["tag-uuid"]);
    mockOwnerSelect.mockReturnValue({ data: [], error: null });
    mockClaimsSelect.mockReturnValue({ data: [], error: null });
    mockClaimInsert.mockReturnValue({ data: { id: "claim-uuid" }, error: null });
    mockTagsProductSelect.mockReturnValue({ data: { products: { name: "The Midnight Tote" } }, error: null });
    mockCompanySelect.mockReturnValue({ data: { email: "brand@example.com", name: "Studio Noir" }, error: null });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ tag_id: "tag-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when no valid OTP is found", async () => {
    mockOtpSelect.mockReturnValue({ data: [], error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
  });

  it("returns 400 and does not create a claim after too many OTP attempts", async () => {
    mockOtpSelect.mockReturnValue({ data: [{ id: "otp-1", code_hash: "hashed", attempts: 5 }], error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(mockClaimInsert).not.toHaveBeenCalled();
  });

  it("returns 400 and increments attempts when the OTP code is incorrect", async () => {
    mockCompare.mockResolvedValue(false);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    expect(mockOtpUpdate).toHaveBeenCalled();
    expect(mockClaimInsert).not.toHaveBeenCalled();
  });

  it("returns 404 when the tag does not exist", async () => {
    mockTagSelect.mockReturnValue({ data: null, error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("returns 409 when the tag is not in a claimable state", async () => {
    mockTagSelect.mockReturnValue({
      data: { id: "tag-uuid", status: "owned", company_id: "company-uuid", short_id: "ABC123", product_id: null },
      error: null,
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("returns 409 when the item already has a current owner", async () => {
    mockOwnerSelect.mockReturnValue({ data: [{ id: "owner-1" }], error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("returns 409 when a claim is already pending for the item", async () => {
    mockClaimsSelect.mockReturnValue({ data: [{ id: "claim-existing" }], error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("returns 500 when claim creation fails", async () => {
    mockClaimInsert.mockReturnValue({ data: null, error: { message: "db error" } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it("creates the claim and notifies the brand on success", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSendClaimNotificationEmail).toHaveBeenCalledWith(
      "brand@example.com",
      expect.objectContaining({
        companyName: "Studio Noir",
        productName: "The Midnight Tote",
        claimantName: "Amara Okafor",
      })
    );
  });

  it("still succeeds even if the notification email fails", async () => {
    mockSendClaimNotificationEmail.mockRejectedValueOnce(new Error("resend down"));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });
});
