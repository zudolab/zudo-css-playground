import { test, expect } from "@playwright/test";

test.describe("Demo Tweak Panel", () => {
  test("toggle button is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Demo Tweak Panel"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test("opens panel and shows tabs", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Demo Tweak Panel"]');
    await toggleBtn.click();

    await expect(page.getByText("Demo Tweak")).toBeVisible({ timeout: 5000 });

    // All tabs should be visible
    for (const tabName of ["Color", "Typography", "Spacing"]) {
      await expect(page.getByRole("button", { name: tabName })).toBeVisible();
    }
  });

  test("tab switching works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Demo Tweak Panel"]');
    await toggleBtn.click();

    await expect(page.getByText("Demo Tweak")).toBeVisible({ timeout: 5000 });

    // Click Typography tab
    await page.getByRole("button", { name: "Typography" }).click();

    // Typography content should be visible (slider inputs)
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test("reset button works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Demo Tweak Panel"]');
    await toggleBtn.click();

    await expect(page.getByText("Demo Tweak")).toBeVisible({ timeout: 5000 });

    // Reset button should be visible
    const resetBtn = page.getByRole("button", { name: "Reset to Defaults" });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
  });
});
