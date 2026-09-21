import { expect, test } from "@playwright/test";
import { prismaAt } from "./e2e-users";
import { e2eDatabaseUrl } from "./env";

const CLIENT_EMAIL = "client@demo.handyhome.local";
const CLIENT_PASSWORD = "DemoClient123!";
const AHMED_EMAIL = "ahmed@demo.handyhome.local";
const AHMED_PASSWORD = "DemoProAhmed123!";
const FATIMA_EMAIL = "fatima@demo.handyhome.local";
const FATIMA_PASSWORD = "DemoProFatima123!";

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

async function cleanupDemoBookings() {
  const prisma = prismaAt(e2eDatabaseUrl());
  try {
    const where = {
      OR: [
        { client: { email: CLIENT_EMAIL } },
        { client: { email: { startsWith: "e2e-" } } },
        { provider: { user: { email: AHMED_EMAIL } } },
      ],
    };
    await prisma.review.deleteMany({ where: { booking: where } });
    await prisma.payment.deleteMany({ where: { booking: where } });
    await prisma.quote.deleteMany({ where: { booking: where } });
    await prisma.diagnosis.deleteMany({ where: { booking: where } });
    await prisma.booking.deleteMany({ where });
  } finally {
    await prisma.$disconnect();
  }
}

async function clientBooksPlumbing(page: import("@playwright/test").Page) {
  await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
  await page.goto("/professionals");
  await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
  await page.getByTestId("request-intervention").click();
  await expect(page.getByTestId("booking-form")).toBeVisible();
  await page.getByTestId("booking-services").getByRole("radio", { name: "Plumbing" }).check();
  await page.getByTestId("booking-slots").locator("label").first().click();
  await page.getByRole("button", { name: "Request intervention" }).click();
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();
}

async function ahmedAccepts(page: import("@playwright/test").Page) {
  await signOut(page);
  await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
  await expect(page.getByTestId("professional-bookings")).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByTestId("booking-item-status")).toHaveText("Accepted");
}

test.describe("Phase 7 diagnosis and quotes", () => {
  test.beforeEach(async () => {
    await cleanupDemoBookings();
  });

  test.afterAll(async () => {
    await cleanupDemoBookings();
  });

  test("E2E-07-01 to 06: diagnosis, quote, and client acceptance", async ({ page }) => {
    await clientBooksPlumbing(page);
    await ahmedAccepts(page);

    await page.getByTestId("start-diagnosis").click();
    await expect(page.getByTestId("complete-diagnosis-form")).toBeVisible();
    await page.getByTestId("diagnosis-findings").fill("Kitchen tap washer is worn and needs replacement.");
    await page.getByTestId("complete-diagnosis").click();
    await expect(page.getByTestId("diagnosis-completed")).toBeVisible();
    await expect(page.getByTestId("create-quote-form")).toBeVisible();

    await page.getByTestId("quote-amount-input").fill("180.00");
    await page.getByTestId("quote-notes").fill("Washer replacement and labour.");
    await page.getByTestId("send-quote").click();
    await expect(page.getByText("Quote sent. Awaiting client.")).toBeVisible();

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await expect(page.getByTestId("client-bookings")).toContainText("Plumbing");
    await expect(page.getByTestId("quote-amount")).toContainText("180.00 MAD");
    await expect(page.getByTestId("booking-hint")).toHaveText("A quote is waiting for your decision.");
    await expect(page.locator(".quote-callout")).toContainText("Quote awaiting your decision");
    await expect(page.locator(".progress-timeline [aria-current='step']")).toContainText("Quote");
    await expect(page.getByTestId("client-bookings")).toContainText("Washer replacement and labour.");
    await page.getByTestId("accept-quote").click();
    await expect(page.getByTestId("booking-item")).toBeFocused();
    await expect(page.getByTestId("quote-accepted")).toHaveText(
      "Quote accepted. The next step is to proceed with the intervention.",
    );
    await expect(page.getByTestId("booking-item-status")).toHaveText("Quote accepted");
    await expect(page.getByText("Payment completed")).toHaveCount(0);
    await expect(page.getByText("Paid", { exact: true })).toHaveCount(0);
  });

  test("E2E-07-07: professional cannot see another professional's booking", async ({ page }) => {
    await clientBooksPlumbing(page);
    await ahmedAccepts(page);
    await signOut(page);
    await signIn(page, FATIMA_EMAIL, FATIMA_PASSWORD);
    await expect(page.getByRole("heading", { name: "Professional dashboard" })).toBeVisible();
    await expect(page.getByTestId("start-diagnosis")).toHaveCount(0);
    await expect(page.getByTestId("professional-bookings")).toHaveCount(0);
  });

  test("E2E-07-08: decline quote then send next version", async ({ page }) => {
    await clientBooksPlumbing(page);
    await ahmedAccepts(page);
    await page.getByTestId("start-diagnosis").click();
    await page.getByTestId("diagnosis-findings").fill("Valve needs replacing on the cold water line.");
    await page.getByTestId("complete-diagnosis").click();
    await page.getByTestId("quote-amount-input").fill("300.00");
    await page.getByTestId("quote-notes").fill("First offer.");
    await page.getByTestId("send-quote").click();
    await expect(page.getByText("Quote sent. Awaiting client.")).toBeVisible();

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await page.getByTestId("decline-quote").click();
    await expect(page.getByTestId("quote-history")).toContainText("Declined");

    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await expect(page.getByTestId("create-quote-form")).toBeVisible();
    await page.getByTestId("quote-amount-input").fill("250.00");
    await page.getByTestId("quote-notes").fill("Revised offer.");
    await page.getByTestId("send-quote").click();
    await expect(page.getByText("Quote sent. Awaiting client.")).toBeVisible();

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await expect(page.getByTestId("quote-history")).toContainText("Version 1");
    await expect(page.getByTestId("quote-history")).toContainText("Version 2");
    await expect(page.getByTestId("quote-amount")).toContainText("250.00 MAD");
  });
});
