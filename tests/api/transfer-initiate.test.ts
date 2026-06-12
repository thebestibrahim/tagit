import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

const mockTagQuery = vi.fn();
const mockOwnerQuery = vi.fn();
const mockOtpCount = vi.fn();
const mockOtpInsert = vi.fn();

// Chainable stub for `.update().eq().eq().eq()` (and any depth), awaitable.
function eqChain(result: unknown) {
  const obj: Record<string, unknown> = {
    eq: () => eqChain(result),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return obj;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "tags") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve(mockTagQuery())),
            })),
          })),
        };
      }
      if (table === "ownership_records") {
        // Owner is resolved across the product's tag group: .in().eq().single()
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(mockOwnerQuery())),
              })),
            })),
          })),
        };
      }
      if (table === "otp_codes") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => Promise.resolve({ count: mockOtpCount(), error: null })),
              })),
            })),
          })),
          // Invalidate prior unused codes before issuing a fresh one.
          update: vi.fn(() => eqChain({ error: null })),
          insert: vi.fn(() => Promise.resolve(mockOtpInsert())),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@/lib/email", () => ({
  sendOtpEmail: vi.fn(() => Promise.resolve()),
}));

const { POST } = await import("@/app/api/transfer/initiate/route");

// New flow: /initiate only verifies the owner and emails a code. Recipient
// details are collected later at /finalize, so they are not part of this body.
const validBody = {
  tag_id: "tag-uuid",
  owner_email: "owner@example.com",
};

describe("POST /api/transfer/initiate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOtpCount.mockReturnValue(0);
    mockOtpInsert.mockReturnValue({ error: null });
    mockTagQuery.mockReturnValue({ data: { id: "tag-uuid", status: "owned" }, error: null });
    mockOwnerQuery.mockReturnValue({
      data: { id: "owner-record-uuid", owner_email: "owner@example.com" },
      error: null,
    });
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ tag_id: "tag-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockOtpCount.mockReturnValue(3);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it("returns 409 when tag is not in a transferable status", async () => {
    mockTagQuery.mockReturnValue({ data: { id: "tag-uuid", status: "live" }, error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("allows transfer of an already-transferred tag", async () => {
    mockTagQuery.mockReturnValue({ data: { id: "tag-uuid", status: "transferred" }, error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });

  it("returns 404 when no ownership record found", async () => {
    mockOwnerQuery.mockReturnValue({ data: null, error: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(404);
  });

  it("returns 403 when email does not match owner", async () => {
    mockOwnerQuery.mockReturnValue({
      data: { id: "owner-record-uuid", owner_email: "different@example.com" },
      error: null,
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it("matches owner email case-insensitively", async () => {
    mockOwnerQuery.mockReturnValue({
      data: { id: "owner-record-uuid", owner_email: "OWNER@EXAMPLE.COM" },
      error: null,
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });

  it("returns 200 and reports the code was sent, without creating a transfer yet", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.emailSent).toBe(true);
    // No transfer_request exists until /finalize.
    expect(body.transfer_id).toBeUndefined();
  });
});
