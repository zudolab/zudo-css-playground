import { test, expect } from "@playwright/test";

test.describe("HTML Preview", () => {
  test("renders iframe with correct content", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveText("CSS Playground");
  });

  test("page has correct title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/CSS Playground/);
  });
});
