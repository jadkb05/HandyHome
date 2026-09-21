import { expect, test } from "@playwright/test";
import { deletePlaywrightE2eUsers, prismaAt } from "./e2e-users";
import { e2eDatabaseUrl } from "./env";

test.describe("new professional onboarding", () => {
  test("incomplete professionals stay private until profile and a service are set", async ({ page, browser }) => {
    test.setTimeout(90_000);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `e2e-onboard-${stamp}@demo.handyhome.local`;
    const name = `Onboard Pro ${stamp.slice(-4)}`;
    const prisma = prismaAt(e2eDatabaseUrl());

    try {
      await page.goto("/register");
      await page.getByLabel("Full name").fill(name);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill("DemoClient123!");
      await page.getByRole("radio", { name: /I am a Professional/ }).check();
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/professional\/dashboard$/, { timeout: 15_000 });

      // Dashboard explains what is missing.
      const notice = page.getByTestId("profile-incomplete");
      await expect(notice).toContainText("Your profile is not public yet");
      await expect(notice).toContainText("Add your profession");
      await expect(notice).toContainText("Choose at least one service you offer");

      // Not visible anywhere public.
      for (const path of ["/", "/professionals", "/search"]) {
        await page.goto(path);
        await expect(page.getByText("Not set yet")).toHaveCount(0);
        await expect(page.getByText(name)).toHaveCount(0);
      }

      const providerId = (await prisma.provider.findFirstOrThrow({ where: { user: { email } } })).id;
      const anonymous = await browser.newContext();
      const anonPage = await anonymous.newPage();
      // (A loading boundary streams the shell first, so assert the not-found content, not the status.)
      await anonPage.goto(`/professionals/${providerId}`);
      await expect(anonPage.getByText("This professional profile was not found.")).toBeVisible();
      await expect(anonPage.getByTestId("request-intervention")).toHaveCount(0);
      await anonPage.goto(`/professionals/${providerId}/book`);
      await expect(anonPage.getByText("This professional profile was not found.")).toBeVisible();

      // The owner can still preview their own page.
      await page.goto(`/professionals/${providerId}`);
      await expect(page.getByTestId("profile-private-notice")).toBeVisible();
      await expect(page.getByText("No description yet.")).toBeVisible();

      // Friendly validation, no raw error text.
      await page.goto("/professional/profile");
      await page.getByLabel("Profession").fill("A");
      await page.getByRole("button", { name: "Save profile" }).click();
      const form = page.locator("form.profile-form");
      await expect(form.locator(".field-error").first()).toBeVisible();
      await expect(form).toContainText("Enter your profession");
      await expect(form).toContainText("Choose at least one service");
      await expect(form).not.toContainText(/invalid_type|"code"|\[\s*\{/);
      await expect(page.getByLabel("Profession")).toHaveAttribute("aria-invalid", "true");

      // Complete it.
      await page.getByLabel("Profession").fill("Electrician");
      await page.getByLabel("City").fill("Casablanca");
      await page.getByLabel("Electrical").check();
      await page.getByRole("button", { name: "Save profile" }).click();
      await expect(page.getByRole("status")).toHaveText("Profile saved.");

      await page.goto("/professional/dashboard");
      await expect(page.getByTestId("profile-incomplete")).toHaveCount(0);
      await page.goto("/professionals");
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await anonPage.goto(`/professionals/${providerId}`);
      await expect(anonPage.getByRole("heading", { name })).toBeVisible();
      await expect(anonPage.getByTestId("request-intervention")).toBeVisible();
      await anonymous.close();
    } finally {
      await deletePlaywrightE2eUsers(prisma, [email]);
      await prisma.$disconnect();
    }
  });
});

test.describe("hardening and progressive enhancement", () => {
  test("sends basic security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["permissions-policy"]).toContain("geolocation=(self)");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("home content stays visible when JavaScript does not run", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const reveals = page.locator(".reveal");
    expect(await reveals.count()).toBeGreaterThan(3);
    for (const index of [0, 3, (await reveals.count()) - 1]) {
      await expect(reveals.nth(index)).toHaveCSS("opacity", "1");
    }
    await context.close();
  });

  test("uses the brand favicon and a right-sized logo", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
    const logo = page.locator(".site-header .brand-logo");
    const src = await logo.getAttribute("src");
    expect(src).toContain("logo-540");
  });
});

test.describe("search map stability", () => {
  test("selecting a professional keeps the same markers and does not refit the map", async ({ page }) => {
    await page.goto("/search?city=Casablanca");
    const marker = page.locator('[data-testid="map-marker"][aria-label="Ahmed El Mansouri"]');
    await expect(marker).toBeVisible({ timeout: 15_000 });
    await marker.evaluate((element) => element.setAttribute("data-probe", "same-node"));

    const card = page.locator("[data-testid^='professional-card-']").filter({ hasText: "Sara Amrani" });
    await card.getByRole("button", { name: /Show on map: Sara Amrani/ }).click();
    await expect(card).toHaveAttribute("data-selected", "true");
    await expect(page.locator('[data-testid="map-marker"][data-selected="true"]')).toHaveAttribute(
      "aria-label",
      /Sara Amrani \(selected\)/,
    );
    await expect(marker).toHaveAttribute("data-probe", "same-node");
  });

  test("does not create a map for the hidden panel on mobile until it is opened", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/search?city=Casablanca");
    await expect(page.getByTestId("search-results")).toBeVisible();
    await expect(page.locator(".maplibregl-canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Show map" }).click();
    await expect(page.getByTestId("search-map")).toBeVisible();
    await expect(page.locator('[data-testid="map-marker"][aria-label="Ahmed El Mansouri"]')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("the verified-only filter is not offered while nobody can be verified", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByLabel("Verified professionals only")).toHaveCount(0);
  });
});
