import { test, expect } from "@playwright/test";

// Tests the public /v/[token] scan page — the most critical consumer-facing flow.
// We test with a fake token to verify the page handles invalid tokens gracefully.
// End-to-end happy-path tests (real tokens) require a seeded test database.

test.describe("Scan page — public facing", () => {
  test("returns a page (not a 500) for unknown token", async ({ page }) => {
    const res = await page.goto("/v/invalid-token-that-does-not-exist");
    // Should render a 404/not-found page, not throw an unhandled error
    expect(res?.status()).not.toBe(500);
  });

  test("notFound page does not expose server errors or stack traces", async ({ page }) => {
    await page.goto("/v/invalid-token-that-does-not-exist");
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toMatch(/SUPABASE|service_role|HMAC|stack trace|at Object\./i);
  });

  test("404 page renders for completely unknown routes", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist-at-all");
    expect(res?.status()).toBe(404);
  });
});
