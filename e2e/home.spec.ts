import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("should display the landing page", async ({ page }) => {
    await page.goto("/");

    // Verify page loaded
    await expect(page).toHaveURL("/");
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for login link
    const loginLink = page.getByRole("link", { name: /zaloguj|login/i });
    await expect(loginLink).toBeVisible();
  });
});
