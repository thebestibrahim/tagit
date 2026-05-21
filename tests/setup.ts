import { vi } from "vitest";

// Provide required env vars for all tests so env.ts doesn't throw
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.TAGIT_HMAC_SECRET = "a".repeat(64);
process.env.RESEND_API_KEY = "re_test_key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock Supabase across all tests
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient()),
}));

export function mockSupabaseClient() {
  const chain: Record<string, unknown> = {};

  const builder = (): typeof chain => {
    chain.select = vi.fn(() => builder());
    chain.insert = vi.fn(() => builder());
    chain.update = vi.fn(() => builder());
    chain.delete = vi.fn(() => builder());
    chain.eq = vi.fn(() => builder());
    chain.neq = vi.fn(() => builder());
    chain.gt = vi.fn(() => builder());
    chain.gte = vi.fn(() => builder());
    chain.order = vi.fn(() => builder());
    chain.limit = vi.fn(() => builder());
    chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
    chain.then = undefined;
    return chain;
  };

  return {
    from: vi.fn(() => builder()),
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  };
}

function makeRequest(body: unknown, ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

export { makeRequest };
