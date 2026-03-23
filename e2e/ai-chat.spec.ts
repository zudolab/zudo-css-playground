import { test, expect } from "@playwright/test";

/** The AI Chat trigger button lives in the sidebar of every page. */
function chatTrigger(page: import("@playwright/test").Page) {
  return page.locator("aside button", { hasText: "AI Chat" });
}

/** The AI Chat dialog. */
function chatDialog(page: import("@playwright/test").Page) {
  return page.locator('dialog[aria-label="AI Chat"]');
}

/** Navigate to the page and wait for React hydration. */
async function gotoAndHydrate(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  // Ensure the React dialog component has hydrated
  await expect(page.locator('dialog[aria-label="AI Chat"]')).toBeAttached({
    timeout: 10000,
  });
}

/** Open the AI Chat dialog. */
async function openChat(page: import("@playwright/test").Page) {
  await chatTrigger(page).click();
  const dialog = chatDialog(page);
  await expect(dialog).toBeVisible({ timeout: 5000 });
  return dialog;
}

/** Type a message and send it via the Send button. */
async function submitMessage(
  dialog: ReturnType<typeof chatDialog>,
  text: string,
) {
  const input = dialog.getByPlaceholder("e.g. Make 10 breadcrumb patterns");
  await input.click();
  await input.pressSequentially(text);
  await dialog.getByRole("button", { name: "Send" }).click();
}

test.describe("AI Chat Modal", () => {
  test("opens dialog when clicking AI Chat button", async ({ page }) => {
    await gotoAndHydrate(page);

    const trigger = chatTrigger(page);
    await expect(trigger).toBeVisible();

    await trigger.click();

    const dialog = chatDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("span", { hasText: "AI Chat" })).toBeVisible();
  });

  test("Escape closes dialog", async ({ page }) => {
    await gotoAndHydrate(page);

    const dialog = await openChat(page);

    await page.keyboard.press("Escape");

    await expect(dialog).not.toBeVisible();
  });

  test("chat response renders markdown", async ({ page }) => {
    await page.route("**/api/ai-chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "chat",
          message: "**bold** and `code`",
        }),
      }),
    );

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    await submitMessage(dialog, "Hello");

    // User message appears
    await expect(dialog.getByText("Hello")).toBeVisible({ timeout: 5000 });

    // Assistant response with rendered markdown
    const md = dialog.locator(".ai-chat-md");
    await expect(md).toBeVisible({ timeout: 5000 });
    await expect(md.locator("strong")).toHaveText("bold");
    await expect(md.locator("code")).toHaveText("code");
  });

  test("pending_files response shows Reload button", async ({ page }) => {
    await page.route("**/api/ai-chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "pending_files",
          files: { "breadcrumbs.astro": "<html>breadcrumbs</html>" },
          message: "Created 10 breadcrumb patterns!",
          needsReload: true,
        }),
      }),
    );
    await page.route("**/api/ai-chat-apply", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          files: ["breadcrumbs.astro"],
        }),
      }),
    );

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    await submitMessage(dialog, "Make 10 breadcrumb patterns");

    // The reload button must be visible.
    // Before the fix, dangerouslySetInnerHTML and children on the same div
    // caused React to throw, crashing the component entirely.
    const reloadBtn = dialog.getByRole("button", {
      name: "Reload page to see results",
    });
    await expect(reloadBtn).toBeVisible({ timeout: 5000 });

    // Files list should also be shown
    await expect(dialog.getByText("breadcrumbs.astro")).toBeVisible();
  });

  test("clicking Reload button triggers page reload", async ({ page }) => {
    await page.route("**/api/ai-chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "pending_files",
          files: { "cards.astro": "<html>cards</html>" },
          message: "Created card patterns!",
          needsReload: true,
        }),
      }),
    );
    await page.route("**/api/ai-chat-apply", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          files: ["cards.astro"],
        }),
      }),
    );

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    await submitMessage(dialog, "Make cards");

    const reloadBtn = dialog.getByRole("button", {
      name: "Reload page to see results",
    });
    await expect(reloadBtn).toBeVisible({ timeout: 5000 });

    // Set up navigation wait BEFORE clicking (window.location.reload() keeps same URL)
    const navigationPromise = page.waitForNavigation({ waitUntil: "load" });
    await reloadBtn.click();
    await navigationPromise;
  });

  test("API error shows error message", async ({ page }) => {
    await page.route("**/api/ai-chat", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service unavailable" }),
      }),
    );

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    await submitMessage(dialog, "test");

    await expect(dialog.getByText("Service unavailable")).toBeVisible({
      timeout: 5000,
    });
  });

  test("closing dialog resets state", async ({ page }) => {
    await page.route("**/api/ai-chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ action: "chat", message: "Hello!" }),
      }),
    );

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    await submitMessage(dialog, "hi");
    await expect(dialog.locator(".ai-chat-md")).toBeVisible({ timeout: 5000 });

    // Close and reopen
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();

    await openChat(page);

    // Messages should be cleared
    await expect(dialog.locator(".ai-chat-md")).not.toBeVisible();
    const input = dialog.getByPlaceholder("e.g. Make 10 breadcrumb patterns");
    await expect(input).toHaveValue("");
  });

  test("dialog stays open while loading", async ({ page }) => {
    // Mock with a delayed response
    await page.route("**/api/ai-chat", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ action: "chat", message: "Done" }),
      });
    });

    await gotoAndHydrate(page);
    const dialog = await openChat(page);

    const input = dialog.getByPlaceholder("e.g. Make 10 breadcrumb patterns");
    await input.click();
    await input.pressSequentially("slow request");
    await dialog.getByRole("button", { name: "Send" }).click();

    // Loading indicator should appear and dialog stays open
    await expect(dialog).toBeVisible();
    await expect(input).toBeDisabled();

    // Wait for response to complete
    await expect(dialog.locator(".ai-chat-md")).toBeVisible({ timeout: 10000 });
    await expect(input).toBeEnabled();
  });
});
