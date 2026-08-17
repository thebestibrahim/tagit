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
    await page.getByRole("textbox", { name: /company name/i }).fill("Test Co");
    await page.getByRole("textbox", { name: /full name/i }).fill("Test User");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("button", { name: /fashion/i }).click();
    const password = page.getByRole("textbox", { name: /^password$/i });
    await password.fill("short");
    await page.getByRole("button", { name: /submit application/i }).click();
    // The password input's `minlength="8"` blocks native form submission —
    // the app never gets a chance to render an error, so assert we're still
    // on the application form instead of the (unreachable) success state.
    await expect(page.getByRole("heading", { name: /apply to join tagit/i })).toBeVisible();
    await expect(await password.evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login|auth/);
  });

  test("admin redirects to the staff portal, not the brand portal, when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/control\/signin/);
  });

  test("staff sign in renders with a forgot-password link back to the admin recovery flow", async ({ page }) => {
    await page.goto("/control/signin");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    const forgot = page.getByRole("link", { name: /forgot password/i });
    await expect(forgot).toBeVisible();
    await expect(forgot).toHaveAttribute("href", "/auth/forgot-password?type=admin");
  });
});
