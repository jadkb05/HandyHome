import { expect, test } from "@playwright/test";

test.describe("Phase 4 marketplace", () => {
  test("PH4-E2E-01 to 09: browse professionals and services", async ({ page }) => {
    await page.goto("/professionals");
    await expect(page.getByRole("heading", { name: "Find a professional" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ahmed El Mansouri/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sara Amrani/ })).toBeVisible();
    const saraCard = page.locator("[data-testid^='professional-card-']").filter({ hasText: "Sara Amrani" });
    await expect(saraCard.locator(".pro-card__fallback")).toHaveText("SA");
    await expect(saraCard.locator("img.pro-card__image")).toHaveCount(0);
    await expect(page.locator('img[src*="sara.jpg"]')).toHaveCount(0);
    await expect(page.getByText("E2E Professional")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/professionals");
    await expect(saraCard.locator(".pro-card__fallback")).toHaveText("SA");
    await expect(page.locator('img[src*="sara.jpg"]')).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/professionals");
    await saraCard.getByRole("link", { name: /Sara Amrani/ }).click();
    await expect(page.getByRole("heading", { name: "Sara Amrani" })).toBeVisible();
    await expect(page.locator('img[src*="sara.jpg"]')).toHaveCount(0);
    await expect(page.getByTestId("profile-services")).toContainText("Electrical");
    await expect(page.getByTestId("profile-location")).toContainText("Casablanca");

    await page.goto("/professionals");

    await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    await expect(page).toHaveURL(/\/professionals\//);
    await expect(page.getByRole("heading", { name: "Ahmed El Mansouri" })).toBeVisible();
    await expect(page.getByTestId("profile-services")).toContainText("Plumbing");
    await expect(page.getByTestId("profile-location")).toContainText("Casablanca");
    await expect(page.getByTestId("price-on-quote")).toHaveText("Price on quote");

    await page.goto("/services");
    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Plumbing/ })).toBeVisible();

    await page.goto("/services/plumbing");
    await expect(page.getByRole("heading", { name: "Plumbing" })).toBeVisible();
    await expect(page.getByTestId("service-professionals")).toContainText("Ahmed El Mansouri");
  });

  test("PH4-E2E-10: CLIENT cannot access professional profile editing", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("client@demo.handyhome.local");
    await page.getByLabel("Password").fill("DemoClient123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto("/professional/profile");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Edit your professional profile" })).toHaveCount(0);
  });

  test("PH4-E2E-11: PROFESSIONAL can edit own profile", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("ahmed@demo.handyhome.local");
    await page.getByLabel("Password").fill("DemoProAhmed123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/professional\/dashboard$/, { timeout: 15_000 });

    await page.goto("/professional/profile");
    await expect(page.getByRole("heading", { name: "Edit your professional profile" })).toBeVisible();
    await page.getByLabel("Description").fill("Plumbing repairs and installations for homes around Maarif.");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("status")).toHaveText("Profile saved.");
  });
});
