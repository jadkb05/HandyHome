import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(dashboard|professional\/dashboard)/, { timeout: 15_000 });
}

async function openMobileMenu(page: import("@playwright/test").Page) {
  await page.locator("summary.nav-toggle").click();
}

async function signOutMobile(page: import("@playwright/test").Page) {
  await openMobileMenu(page);
  await page.locator(".site-nav-wrap").getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator("summary.nav-toggle")).toBeVisible();
}

function noHorizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

test.describe("Phase 11 mobile functional smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage, search, profile and login stay usable at 390px", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find local professionals for your home." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Find a professional" }).first()).toBeVisible();
    await openMobileMenu(page);
    const mobileNav = page.locator(".site-nav-wrap");
    await expect(mobileNav.getByRole("link", { name: "Search" })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);

    await mobileNav.getByRole("link", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByTestId("search-form")).toBeVisible();
    await page.getByLabel("Service").selectOption("plumbing");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    expect(await noHorizontalOverflow(page)).toBe(false);

    await page.getByTestId("search-results").getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    await expect(page.getByRole("heading", { name: "Ahmed El Mansouri" })).toBeVisible();
    await expect(page.getByTestId("request-intervention")).toBeVisible();

    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find local professionals for your home." })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);
  });

  test("client dashboard and booking form are usable at 390px", async ({ page }) => {
    await signIn(page, "client@demo.handyhome.local", "DemoClient123!");
    await expect(page.getByRole("heading", { name: "Client dashboard" })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);

    await page.goto("/professionals");
    await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    await page.getByTestId("request-intervention").click();
    await expect(page.getByTestId("booking-form")).toBeVisible();
    await expect(page.getByTestId("booking-services").getByRole("radio", { name: "Plumbing" })).toBeVisible();
    await expect(page.getByTestId("booking-slots").locator("label").first()).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);

    await signOutMobile(page);
    await signIn(page, "ahmed@demo.handyhome.local", "DemoProAhmed123!");
    await expect(page.getByRole("heading", { name: "Professional dashboard" })).toBeVisible();
    expect(await noHorizontalOverflow(page)).toBe(false);
  });
});
