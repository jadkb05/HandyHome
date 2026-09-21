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

  test("auth marketing panel shows the artisan beside the desktop form", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByText("Home services, made simple.")).toBeVisible();
    await expect(page.getByText("Compare local professionals")).toBeVisible();
    await expect(page.getByTestId("auth-artisan").locator("img")).toBeVisible();
    expect(await pageFitsViewport(page)).toBe(true);

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByTestId("auth-artisan").locator("img")).toBeVisible();
    expect(await pageFitsViewport(page)).toBe(true);
  });

  test("auth artisan stays compact and does not overflow on phones", async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 393, height: 852 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of ["/login", "/register"] as const) {
        await page.goto(path);
        await expect(page.getByTestId("auth-artisan")).toBeVisible();
        const asideBox = await page.locator(".auth-aside").boundingBox();
        expect(asideBox?.height ?? 999, `${path} aside at ${viewport.width}px`).toBeLessThan(220);
        await expect(page.getByLabel("Email")).toBeVisible();
        await expect(page.locator(".auth-card")).toBeVisible();
        expect(await pageFitsViewport(page), `${path} at ${viewport.width}px`).toBe(true);
      }
    }
  });

  test("mobile homepage hero places the visual between the description and search", async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 393, height: 852 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.locator(".hero__visual")).toBeVisible();
      await expect(page.getByRole("search")).toBeVisible();
      const tops = await page.evaluate(() => {
        const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? 0;
        const box = (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        };
        const overlap = (
          a: { top: number; bottom: number; left: number; right: number } | null,
          b: { top: number; bottom: number; left: number; right: number } | null,
        ) => Boolean(a && b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom));
        const visualBox = box(".hero__visual");
        const searchBox = box(".hero-search");
        const searchButtonBox = box(".hero-search .button");
        const assistantBox = box(".assistant-trigger");
        return {
          kicker: top(".hero__kicker"),
          title: top(".hero__title"),
          lead: top(".hero__lead"),
          visual: top(".hero__visual"),
          search: top(".hero-search"),
          links: top(".hero__links"),
          visualBox,
          searchBox,
          searchAssistantOverlap: overlap(searchButtonBox, assistantBox),
        };
      });
      expect(tops.kicker, `kicker at ${viewport.width}px`).toBeLessThan(tops.title);
      expect(tops.title, `title at ${viewport.width}px`).toBeLessThan(tops.lead);
      expect(tops.lead, `lead at ${viewport.width}px`).toBeLessThan(tops.visual);
      expect(tops.visual, `visual at ${viewport.width}px`).toBeLessThan(tops.search);
      expect(tops.search, `search at ${viewport.width}px`).toBeLessThan(tops.links);
      expect(tops.visualBox && tops.searchBox, `no overlap at ${viewport.width}px`).toBeTruthy();
      expect(tops.visualBox!.bottom, `visual above search at ${viewport.width}px`).toBeLessThanOrEqual(
        tops.searchBox!.top + 1,
      );
      expect(tops.searchAssistantOverlap, `search vs assistant at ${viewport.width}px`).toBe(false);
      await expect(page.locator(".hero__links").getByRole("link", { name: "Browse all professionals" })).toBeVisible();
      await expect(page.locator(".hero__links").getByRole("link", { name: "Explore services" })).toBeVisible();
      expect(await pageFitsViewport(page), `home at ${viewport.width}px`).toBe(true);
    }
  });

  test("desktop homepage hero keeps copy and search to the left of the visual", async ({ page }) => {
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const layout = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
        return {
          copy: box(".hero__copy"),
          visual: box(".hero__visual"),
          search: box(".hero-search"),
          links: box(".hero__links"),
        };
      });
      expect(layout.copy && layout.visual && layout.search && layout.links, `hero boxes at ${width}px`).toBeTruthy();
      expect(layout.copy!.right, `copy left of visual at ${width}px`).toBeLessThanOrEqual(layout.visual!.left + 1);
      expect(layout.search!.right, `search left of visual at ${width}px`).toBeLessThanOrEqual(layout.visual!.left + 1);
      expect(layout.search!.top, `search under copy at ${width}px`).toBeGreaterThan(layout.copy!.top);
      expect(layout.links!.top, `links under search at ${width}px`).toBeGreaterThan(layout.search!.top);
      expect(await pageFitsViewport(page), `home at ${width}px`).toBe(true);
    }
  });
});
