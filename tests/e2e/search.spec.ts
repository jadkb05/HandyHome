import { expect, test, type Page } from "@playwright/test";
import { SLOT_HORIZON_DAYS } from "../../src/features/bookings/slots";
import {
  addCivilDays,
  civilDateInBusinessTimezone,
  formatCivilDateLong,
  weekdayFromCivilDate,
} from "../../src/lib/datetime";
import { pageFitsViewport } from "./overflow";

function searchDateOnWeekday(weekday: number): string {
  const today = civilDateInBusinessTimezone(new Date());
  const dates: string[] = [];
  for (let offset = 0; offset < SLOT_HORIZON_DAYS; offset += 1) {
    const date = addCivilDays(today, offset);
    if (weekdayFromCivilDate(date) === weekday) {
      dates.push(date);
    }
  }
  return dates[1] ?? dates[0]!;
}

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
    await expect(page.getByLabel("Date")).toBeVisible();
    await expect(page.getByText("Any date")).toHaveCount(0);
    await expect(page.getByLabel("Neighborhood")).toHaveCount(0);
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

  test("search without a date keeps current plumbing results", async ({ page }) => {
    await page.goto("/search?service=plumbing");
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-count")).toContainText("professional");
    await expect(page.getByTestId("search-count")).not.toContainText("available on");
  });

  test("search with service and date keeps the date in the URL", async ({ page }) => {
    const monday = searchDateOnWeekday(1);
    await page.goto("/search");
    await page.getByLabel("Service").selectOption("plumbing");
    await page.getByTestId("search-date").fill(monday);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(new RegExp(`service=plumbing`));
    await expect(page).toHaveURL(new RegExp(`date=${monday}`));
    await expect(page.getByTestId("search-date")).toHaveValue(monday);
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).not.toContainText("Sara Amrani");
    await expect(page.getByTestId("search-count")).toContainText(
      `available on ${formatCivilDateLong(monday)}`,
    );
  });

  test("search with city and date", async ({ page }) => {
    const monday = searchDateOnWeekday(1);
    await page.goto(`/search?city=Casablanca&date=${monday}`);
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).not.toContainText("Sara Amrani");
  });

  test("search with service, city and date", async ({ page }) => {
    const monday = searchDateOnWeekday(1);
    await page.goto(`/search?service=plumbing&city=Casablanca&date=${monday}&sort=name`);
    await expect(page).toHaveURL(new RegExp(`date=${monday}`));
    await expect(page.getByTestId("search-results")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("search-results")).not.toContainText("Sara Amrani");
    await expect(page.getByTestId("search-count")).toContainText("1 professional available on");
  });

  test("invalid date is rejected safely", async ({ page }) => {
    await page.goto("/search?date=not-a-date");
    await expect(page.getByRole("alert")).toContainText("Those search filters could not be used.");
    await page.goto("/search?date=1999-01-01");
    await expect(page.getByRole("alert")).toContainText("Those search filters could not be used.");
  });

  test("professionals without a slot on the selected date are excluded", async ({ page }) => {
    const tuesday = searchDateOnWeekday(2);
    await page.goto(`/search?service=plumbing&date=${tuesday}`);
    await expect(page.getByTestId("search-empty")).toContainText("No professionals available on that date.");
    await expect(page.getByTestId("search-results")).toHaveCount(0);
  });

  test("map markers follow date-filtered professionals", async ({ page }) => {
    const monday = searchDateOnWeekday(1);
    await page.goto(`/search?service=plumbing&city=Casablanca&date=${monday}`);
    await expect(page.getByTestId("search-map")).toBeVisible();
    await expect(page.locator('[data-testid="map-marker"][aria-label="Ahmed El Mansouri"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid="map-marker"][aria-label="Sara Amrani"]')).toHaveCount(0);
  });

  test("mobile search filters fit without horizontal overflow", async ({ page }) => {
    const monday = searchDateOnWeekday(1);
    const viewports = [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 393, height: 852 },
      { width: 430, height: 932 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/search?service=plumbing&city=Casablanca&date=${monday}&sort=name`);
      await expect(page.getByTestId("search-form")).toBeVisible();
      await expect(page.getByLabel("Service")).toBeVisible();
      await expect(page.getByLabel("City")).toBeVisible();
      await expect(page.getByLabel("Date")).toBeVisible();
      await expect(page.getByLabel("Sort")).toBeVisible();
      await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
      await expect(page.getByText("Any date")).toHaveCount(0);
      expect(await pageFitsViewport(page)).toBe(true);
    }
  });

  test("desktop filter labels and inputs share one horizontal grid", async ({ page }) => {
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/search");
      await expect(page.getByTestId("search-form")).toBeVisible();
      const alignment = await page.evaluate(() => {
        const form = document.querySelector("[data-testid='search-form']");
        if (!form) {
          return { ok: false };
        }
        const fields = [...form.querySelectorAll<HTMLElement>(":scope > .field")];
        const labels = fields.map((field) => field.querySelector(":scope > span")?.getBoundingClientRect());
        const controls = fields.map((field) =>
          field.querySelector(":scope > select, :scope > input")?.getBoundingClientRect(),
        );
        const button = form.querySelector(".search-form__actions .button")?.getBoundingClientRect();
        if (labels.some((box) => !box) || controls.some((box) => !box) || !button) {
          return { ok: false };
        }
        const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
        const labelTops = labels.map((box) => box!.top);
        const controlTops = controls.map((box) => box!.top);
        const controlHeights = controls.map((box) => box!.height);
        return {
          ok:
            spread(labelTops) <= 2 &&
            spread(controlTops) <= 2 &&
            spread(controlHeights) <= 4 &&
            Math.abs(button.top - controlTops[0]) <= 4,
        };
      });
      expect(alignment, `filter row at ${width}px`).toEqual({ ok: true });
    }
  });
});
