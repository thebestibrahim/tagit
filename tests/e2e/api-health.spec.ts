import { test, expect } from "@playwright/test";

// Smoke tests hitting the API routes directly to verify they return
// well-formed JSON errors (not HTML crash pages or 500s from missing env vars).

test.describe("API routes — error shape", () => {
  test("POST /api/otp/send returns 400 without body", async ({ request }) => {
    const res = await request.post("/api/otp/send", { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  test("POST /api/otp/verify returns 400 without body", async ({ request }) => {
    const res = await request.post("/api/otp/verify", { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/transfer/initiate returns 400 without body", async ({ request }) => {
    const res = await request.post("/api/transfer/initiate", { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/auth/register returns 400 without body", async ({ request }) => {
    const res = await request.post("/api/auth/register", { data: {} });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/otp/send rejects invalid purpose", async ({ request }) => {
    const res = await request.post("/api/otp/send", {
      data: { email: "test@example.com", purpose: "hack" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid purpose/i);
  });

  test("POST /api/auth/register rejects short password", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "Test Co",
        email: "test@example.com",
        password: "short",
        industry: "fashion",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/8 characters|password/i);
  });

  test("POST /api/auth/register rejects invalid industry", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "Test Co",
        email: "test@example.com",
        password: "validpassword123",
        industry: "invalid_industry",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/industry/i);
  });
});
