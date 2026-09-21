import { expect, test, type Page } from "@playwright/test";

const noHorizontalOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );

function trigger(page: Page) {
  return page.getByRole("button", { name: "Open HandyHome assistant" });
}

test.describe("V1 assistant (UI only)", () => {
  test("trigger is visible, named and wired to the panel", async ({ page }) => {
    await page.goto("/");
    await expect(trigger(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toHaveAttribute("aria-controls", "assistant-panel");
    const box = await trigger(page).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByTestId("assistant-panel")).toBeHidden();
  });

  test("opens, shows the coming-soon message, and closes with the close button", async ({
    page,
  }) => {
    await page.goto("/");
    await trigger(page).click();
    const panel = page.getByTestId("assistant-panel");
    await expect(panel).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByRole("heading", { name: "HandyHome Assistant" })).toBeVisible();
    await expect(panel).toContainText("Our assistant is coming soon.");
    await expect(page.getByRole("button", { name: "Close HandyHome assistant" })).toBeFocused();

    await page.getByRole("button", { name: "Close HandyHome assistant" }).click();
    await expect(panel).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("Escape closes the panel and returns focus to the trigger", async ({ page }) => {
    await page.goto("/");
    await trigger(page).click();
    await expect(page.getByTestId("assistant-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("assistant-panel")).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("Find a professional navigates to Search and closes the panel", async ({ page }) => {
    await page.goto("/services");
    await trigger(page).click();
    await page
      .getByTestId("assistant-panel")
      .getByRole("link", { name: "Find a professional" })
      .click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByTestId("assistant-panel")).toBeHidden();
  });

  for (const width of [375, 390]) {
    test(`no horizontal overflow and panel fits the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto("/");
      expect(await noHorizontalOverflow(page)).toBe(true);
      await trigger(page).click();
      const panel = page.getByTestId("assistant-panel");
      await expect(panel).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBe(true);
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.y).toBeGreaterThanOrEqual(0);
    });
  }

  test("does not sit above the open mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto("/");
    await page.locator("summary.nav-toggle").click();
    const menuLink = page.locator(".site-nav-wrap").getByRole("link", { name: "Search" });
    await expect(menuLink).toBeVisible();
    await menuLink.click({ trial: true });
  });
});
