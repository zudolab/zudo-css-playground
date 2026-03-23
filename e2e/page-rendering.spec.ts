import { test, expect } from "@playwright/test";

test.describe("Page Rendering", () => {
  test("home page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toHaveText("CSS Playground");
    expect(errors).toHaveLength(0);
  });

  test("home page has correct meta title", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/Home.*CSS Playground/);
  });

  test("all React islands hydrate", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // SidebarNav hydrated
    await expect(page.locator("aside nav")).toBeAttached({ timeout: 10000 });

    // ColorTweakPanel toggle hydrated
    await expect(
      page.locator('button[title="Toggle Color Tweak Panel"]'),
    ).toBeAttached({ timeout: 10000 });

    // DemoTweakPanel toggle hydrated
    await expect(
      page.locator('button[title="Toggle Demo Tweak Panel"]'),
    ).toBeAttached({ timeout: 10000 });

    // AiChatModal dialog hydrated
    await expect(page.locator('dialog[aria-label="AI Chat"]')).toBeAttached({
      timeout: 10000,
    });
  });
});
