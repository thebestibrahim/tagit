import { test, expect } from "@playwright/test";

test.describe("Auth pages", () => {
  test("login page renders with form fields", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/tagit/i);
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("login shows error on bad credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("textbox", { name: /email/i }).fill("bad@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 8_000 });
  });

  test("register page renders with all required fields", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByRole("textbox", { name: /company name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();
  });

  test("register shows error for short password", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("short");
    await page.getByRole("button", { name: /register|create/i }).click();
    await expect(page.getByText(/8 characters|too short|password/i)).toBeVisible({ timeout: 5_000 });
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login|auth/);
  });
});
