import { test, expect } from "@playwright/test";

test.describe("Sidebar Navigation", () => {
  test("sidebar is visible with CSS Playground title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("aside")).toBeVisible();
    await expect(
      page.locator("aside a", { hasText: "CSS Playground" }),
    ).toBeVisible();
  });

  test("AI Chat button is visible in sidebar", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const chatBtn = page.locator("aside button", { hasText: "AI Chat" });
    await expect(chatBtn).toBeVisible();
  });
});
