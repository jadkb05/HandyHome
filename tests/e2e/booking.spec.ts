import { BookingStatus } from "@prisma/client";
import { expect, test } from "@playwright/test";
import {
  addCivilDays,
  civilDateInBusinessTimezone,
  weekdayFromCivilDate,
  zonedCivilToUtc,
} from "../../src/lib/datetime";
import { prismaAt } from "./e2e-users";
import { e2eDatabaseUrl } from "./env";

const CLIENT_EMAIL = "client@demo.handyhome.local";
const CLIENT_PASSWORD = "DemoClient123!";
const AHMED_EMAIL = "ahmed@demo.handyhome.local";
const AHMED_PASSWORD = "DemoProAhmed123!";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(dashboard|professional\/dashboard)/, { timeout: 15_000 });
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Sign in" })).toBeVisible();
}

async function chooseService(page: import("@playwright/test").Page, name: string) {
  await page.getByTestId("booking-services").getByRole("radio", { name }).check();
}

async function submitFirstSlot(page: import("@playwright/test").Page) {
  await page.getByTestId("booking-slots").locator("label").first().click();
  await page.getByRole("button", { name: "Request intervention" }).click();
}

async function openAhmedProfile(page: import("@playwright/test").Page) {
  await page.goto("/professionals");
  await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
  await expect(page.getByRole("heading", { name: "Ahmed El Mansouri" })).toBeVisible();
}

async function cleanupDemoBookings() {
  const prisma = prismaAt(e2eDatabaseUrl());
  try {
    await prisma.review.deleteMany({
      where: {
        booking: {
          OR: [
            { client: { email: CLIENT_EMAIL } },
            { client: { email: { startsWith: "e2e-" } } },
            { provider: { user: { email: AHMED_EMAIL } } },
          ],
        },
      },
    });
    await prisma.payment.deleteMany({
      where: {
        booking: {
          OR: [
            { client: { email: CLIENT_EMAIL } },
            { client: { email: { startsWith: "e2e-" } } },
            { provider: { user: { email: AHMED_EMAIL } } },
          ],
        },
      },
    });
    await prisma.quote.deleteMany({
      where: {
        booking: {
          OR: [
            { client: { email: CLIENT_EMAIL } },
            { client: { email: { startsWith: "e2e-" } } },
            { provider: { user: { email: AHMED_EMAIL } } },
          ],
        },
      },
    });
    await prisma.diagnosis.deleteMany({
      where: {
        booking: {
          OR: [
            { client: { email: CLIENT_EMAIL } },
            { client: { email: { startsWith: "e2e-" } } },
            { provider: { user: { email: AHMED_EMAIL } } },
          ],
        },
      },
    });
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { client: { email: CLIENT_EMAIL } },
          { client: { email: { startsWith: "e2e-" } } },
          { provider: { user: { email: AHMED_EMAIL } } },
        ],
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("Phase 6 booking", () => {
  test.beforeEach(async () => {
    await cleanupDemoBookings();
  });

  test.afterAll(async () => {
    await cleanupDemoBookings();
  });

  test("PH6-E2E-01 to 07 / PH6.1-E2E-01 to 06: client requests Plumbing", async ({ page }) => {
    await openAhmedProfile(page);
    await expect(page.getByTestId("request-intervention")).toBeVisible();

    await page.getByTestId("request-intervention").click();
    await expect(page).toHaveURL(/\/professionals\/.+\/book/);
    await expect(page.getByRole("heading", { name: "Request intervention" })).toBeVisible();
    await expect(page.getByTestId("booking-login")).toBeVisible();

    await page.getByTestId("booking-login").click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email").fill(CLIENT_EMAIL);
    await page.getByLabel("Password").fill(CLIENT_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/professionals\/.+\/book/);
    await expect(page.getByTestId("booking-form")).toBeVisible();
    await expect(page.getByTestId("booking-services")).toBeVisible();
    await expect(page.getByTestId("booking-services")).toContainText("Plumbing");
    await expect(page.getByTestId("booking-services")).toContainText("Appliance repair");
    await expect(page.getByTestId("booking-services")).toContainText("Home maintenance");
    await expect(page.getByTestId("booking-slots")).toBeVisible();
    await expect(page.getByTestId("timezone-note")).toContainText("Casablanca");
    await expect(page.getByLabel(/Describe|problem/i)).toHaveCount(0);
    await expect(page.getByText("Price on quote", { exact: true })).toBeVisible();

    await chooseService(page, "Plumbing");
    await submitFirstSlot(page);
    await expect(page.getByTestId("booking-confirmation")).toBeVisible();
    await expect(page.getByText("Your intervention request has been submitted.")).toBeVisible();
    await expect(page.getByTestId("booking-status")).toHaveText("Pending");

    await page.getByRole("link", { name: "View your bookings" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("client-bookings")).toContainText("Ahmed El Mansouri");
    await expect(page.getByTestId("client-bookings")).toContainText("Plumbing");
    await expect(page.getByTestId("booking-item-status")).toHaveText("Pending");
  });

  test("PH6-E2E-08 to 10 / PH6.1-E2E-07: professional manages Plumbing request; client cannot", async ({ page }) => {
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await openAhmedProfile(page);
    await page.getByTestId("request-intervention").click();
    await expect(page.getByTestId("booking-form")).toBeVisible();
    await chooseService(page, "Plumbing");
    await submitFirstSlot(page);
    await expect(page.getByTestId("booking-confirmation")).toBeVisible();

    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await expect(page).toHaveURL(/\/professional\/dashboard$/);
    await expect(page.getByTestId("professional-bookings")).toContainText("Karim Haddad");
    await expect(page.getByTestId("professional-bookings")).toContainText("Plumbing");
    await expect(page.getByTestId("booking-item-status")).toHaveText("Pending");
    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByTestId("booking-item-status")).toHaveText("Accepted");

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await page.goto("/professional/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Professional dashboard" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Accept" })).toHaveCount(0);
  });

  test("PH6-E2E-11: double-booked slot is rejected", async ({ page }) => {
    const prisma = prismaAt(e2eDatabaseUrl());
    try {
      await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
      await openAhmedProfile(page);
      await page.getByTestId("request-intervention").click();
      await expect(page.getByTestId("booking-form")).toBeVisible();
      await chooseService(page, "Plumbing");

      const providerId = page.url().match(/professionals\/([^/]+)\/book/)?.[1];
      expect(providerId).toBeTruthy();
      const occupiedIso = await page.getByTestId("booking-slots").locator("input").first().inputValue();
      const client = await prisma.user.findUniqueOrThrow({ where: { email: CLIENT_EMAIL } });
      const serviceLink = await prisma.providerService.findFirstOrThrow({
        where: { providerId: providerId! },
      });
      await prisma.booking.create({
        data: {
          clientId: client.id,
          providerId: providerId!,
          serviceId: serviceLink.serviceId,
          scheduledAt: new Date(occupiedIso),
          status: BookingStatus.REQUESTED,
        },
      });

      await page.getByTestId("booking-slots").locator("label").first().click();
      await page.getByRole("button", { name: "Request intervention" }).click();
      await expect(page.getByTestId("booking-error")).toHaveText("This time slot is no longer available.");
    } finally {
      await prisma.$disconnect();
    }
  });

  test("PH6-E2E-12: invalid/unavailable slot is rejected", async ({ page }) => {
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await openAhmedProfile(page);
    await page.getByTestId("request-intervention").click();
    await expect(page.getByTestId("booking-form")).toBeVisible();
    await chooseService(page, "Plumbing");

    const tuesdayDate = (() => {
      const start = civilDateInBusinessTimezone(new Date());
      for (let offset = 1; offset <= 14; offset += 1) {
        const next = addCivilDays(start, offset);
        if (weekdayFromCivilDate(next) === 2) {
          return next;
        }
      }
      throw new Error("Could not find a Tuesday in the booking horizon.");
    })();
    const tuesday = zonedCivilToUtc(tuesdayDate, "10:00").toISOString();
    await page.evaluate((iso) => {
      const form = document.querySelector('[data-testid="booking-form"]');
      if (!(form instanceof HTMLFormElement)) {
        throw new Error("booking form missing");
      }
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "scheduledAt";
      input.value = iso;
      input.checked = true;
      input.required = true;
      form.appendChild(input);
    }, tuesday);

    await page.getByRole("button", { name: "Request intervention" }).click();
    await expect(page.getByTestId("booking-error")).toHaveText(
      "That time is outside this professional's availability.",
    );
  });
});
