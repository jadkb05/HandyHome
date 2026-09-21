import { expect, test } from "@playwright/test";
import { pageFitsViewport } from "./overflow";

test.describe("design system: responsive integrity", () => {
  for (const width of [375, 390, 393, 430, 768, 1024, 1280, 1440]) {
    test(`public pages do not overflow horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/services", "/services/plumbing", "/professionals", "/search", "/login", "/register"]) {
        await page.goto(path);
        await expect(page.getByRole("main")).toBeVisible();
        expect(await pageFitsViewport(page), `${path} at ${width}px`).toBe(true);
      }
    });
  }

  test("homepage does not include the professional preview section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Meet local professionals" })).toHaveCount(0);
    await expect(page.getByText("Profiles with real services, areas and reviews from completed jobs.")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "View all professionals" })).toHaveCount(0);
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByRole("heading", { name: "From first search to finished job" })).toBeVisible();
  });

  test("touch targets on the mobile header and primary controls are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    for (const locator of [
      page.locator("summary.nav-toggle"),
      page.getByRole("button", { name: "Search" }).first(),
      page.getByRole("button", { name: "Open HandyHome assistant" }),
    ]) {
      const box = await locator.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("the sticky header is fully opaque so scrolled content never shows through", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services");
    const background = await page.locator(".site-header").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).toBe("rgb(255, 255, 255)");
  });

  test("service cards do not repeat a single-professional count", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator(".service-tile").first()).toBeVisible();
    await expect(page.getByText("1 professional", { exact: true })).toHaveCount(0);
  });

  test("the current page is marked in the primary navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/services");
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("home hero search sends the chosen service to the search page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("search").locator("select").selectOption("plumbing");
    await page.getByRole("search").getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search\?service=plumbing/);
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
  });

  test("booking form shows a live summary of the selected service and time", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("client@demo.handyhome.local");
    await page.getByLabel("Password").fill("DemoClient123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await page.goto("/professionals");
    await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    await page.getByTestId("request-intervention").click();
    const summary = page.locator(".booking-summary");
    await expect(summary).toHaveAttribute("data-ready", "false");
    await page.getByTestId("booking-services").getByRole("radio", { name: "Plumbing" }).check();
    await page.getByTestId("booking-slots").getByRole("radio").first().check();
    await expect(summary).toHaveAttribute("data-ready", "true");
    await expect(summary).toContainText("Plumbing");
  });
});
