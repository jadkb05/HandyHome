import { expect, test } from "@playwright/test";

test.describe("mobile menu (native details/summary)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("closes after choosing a link and keeps working afterwards", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("details.site-nav-wrap");
    await page.locator("summary.nav-toggle").click();
    await expect(menu).toHaveAttribute("open", "");

    await menu.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(menu).not.toHaveAttribute("open", "");

    await page.locator("summary.nav-toggle").click();
    await expect(menu).toHaveAttribute("open", "");
    await menu.getByRole("link", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(menu).not.toHaveAttribute("open", "");
  });

  test("closes after choosing the link for the page you are already on", async ({ page }) => {
    await page.goto("/services");
    const menu = page.locator("details.site-nav-wrap");
    await page.locator("summary.nav-toggle").click();
    await menu.getByRole("link", { name: "Services" }).click();
    await expect(menu).not.toHaveAttribute("open", "");
  });

  test("Escape closes the menu and returns focus to the toggle", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("details.site-nav-wrap");
    await page.locator("summary.nav-toggle").click();
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(page.locator("summary.nav-toggle")).toBeFocused();
  });
});
