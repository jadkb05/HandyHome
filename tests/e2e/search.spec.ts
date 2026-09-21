import { expect, test, type Page } from "@playwright/test";

const EMPTY_STYLE = {
  version: 8,
  name: "handyhome-e2e",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F8FAFC" },
    },
  ],
};

async function mockMapTiles(page: Page) {
  await page.route("https://tiles.openfreemap.org/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/styles/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EMPTY_STYLE),
      });
      return;
    }
    await route.fulfill({ status: 204, body: "" });
  });
}

test.describe("Phase 5 search and map", () => {
  test.beforeEach(async ({ page }) => {
    await mockMapTiles(page);
  });

  test("PH5-E2E-01: open /search", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: "Find a professional" })).toBeVisible();
    await expect(page.getByTestId("search-form")).toBeVisible();
    await expect(page.getByText("E2E Professional")).toHaveCount(0);
  });

  test("PH5-E2E-02 to 05: plumbing search from database and profile link", async ({ page }) => {
    await page.goto("/search");
    await page.getByLabel("Service").selectOption("plumbing");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/service=plumbing/);
    await expect(page.getByTestId("search-count")).toContainText("professional");
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).not.toContainText("Sara Amrani");

    await page.getByLabel("City").fill("Casablanca");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/city=Casablanca/);
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");

    await page.getByTestId("search-results").getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    await expect(page).toHaveURL(/\/professionals\//);
    await expect(page.getByRole("heading", { name: "Ahmed El Mansouri" })).toBeVisible();
  });

  test("PH5-E2E-04: filter by Casablanca", async ({ page }) => {
    await page.goto("/search?city=Casablanca");
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).toContainText("Sara Amrani");
  });

  test("PH5-E2E-06 to 08: map markers from database professionals", async ({ page }) => {
    await page.goto("/search?city=Casablanca");
    await expect(page.getByTestId("search-map")).toBeVisible();
    await expect(page.locator(".map-attribution")).toContainText("© OpenStreetMap contributors");
    const ahmedMarker = page.locator('[data-testid="map-marker"][aria-label="Ahmed El Mansouri"]');
    await expect(ahmedMarker).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="map-marker"][aria-label="Sara Amrani"]')).toBeVisible();

    await ahmedMarker.click();
    const ahmedCard = page.locator("[data-testid^='professional-card-']").filter({ hasText: "Ahmed El Mansouri" });
    await expect(ahmedCard).toHaveAttribute("data-selected", "true");
    await expect(ahmedCard.getByText("Selected on map")).toBeVisible();
  });

  test("PH5-E2E-09: use my location interaction is handled", async ({ page }) => {
    await page.addInitScript(() => {
      const position = {
        coords: {
          latitude: 33.573,
          longitude: -7.589,
          accuracy: 25,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      navigator.geolocation.getCurrentPosition = (success) => {
        success(position as GeolocationPosition);
      };
    });

    await page.goto("/search?service=plumbing");
    await page.getByTestId("use-my-location").click();
    await expect(page).toHaveURL(/lat=33\.573/);
    await expect(page).toHaveURL(/lng=-7\.589/);
    await expect(page).toHaveURL(/sort=nearest/);
    await expect(page.getByTestId("search-results")).toContainText("km away");
  });

  test("PH5-E2E-10: no-results state works", async ({ page }) => {
    await page.goto("/search?service=painting&city=Rabat");
    await expect(page.getByTestId("search-empty")).toContainText(
      "No professionals found for this service and location.",
    );
    await expect(page.getByText("Try another service or location.")).toBeVisible();
    await expect(page.getByTestId("search-results")).toHaveCount(0);
  });

  test("PH12-E2E: Paris geolocation keeps Casablanca results and map markers", async ({ page }) => {
    await page.addInitScript(() => {
      const position = {
        coords: {
          latitude: 48.85661,
          longitude: 2.35222,
          accuracy: 25,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      navigator.geolocation.getCurrentPosition = (success) => {
        success(position as GeolocationPosition);
      };
    });

    await page.goto("/search?city=Casablanca");
    await page.getByTestId("use-my-location").click();
    await expect(page).toHaveURL(/lat=48\.85661/);
    await expect(page).toHaveURL(/lng=2\.35222/);
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).toContainText("km away");
    await expect(page.locator('[data-testid="map-marker"][aria-label="Ahmed El Mansouri"]')).toBeVisible({
      timeout: 15_000,
    });
  });
});
