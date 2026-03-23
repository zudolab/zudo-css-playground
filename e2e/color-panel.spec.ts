import { test, expect } from "@playwright/test";

test.describe("Color Tweak Panel", () => {
  test("toggle button is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Color Tweak Panel"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test("opens panel when toggle clicked", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Color Tweak Panel"]');
    await toggleBtn.click();

    // Panel title should be visible
    await expect(page.getByText("Color Tweak")).toBeVisible({ timeout: 5000 });

    // Preset selector should be visible
    await expect(page.locator("select")).toBeVisible();
  });

  test("preset switching works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Color Tweak Panel"]');
    await toggleBtn.click();

    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 5000 });

    // Switch to Dracula preset
    await select.selectOption("Dracula");

    // Verify the select value changed
    await expect(select).toHaveValue("Dracula");
  });

  test("close button works", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggleBtn = page.locator('button[title="Toggle Color Tweak Panel"]');
    await toggleBtn.click();

    await expect(page.getByText("Color Tweak")).toBeVisible({ timeout: 5000 });

    // Click close button
    await page.locator('button[aria-label="Close"]').first().click();

    // Panel should be hidden
    await expect(page.getByText("Color Tweak")).not.toBeVisible();
  });
});
