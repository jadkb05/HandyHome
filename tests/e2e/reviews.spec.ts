import { expect, test } from "@playwright/test";
import { prismaAt } from "./e2e-users";
import { demoDatabaseUrl, e2eDatabaseUrl } from "./env";

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

async function reachPaymentRecorded(page: import("@playwright/test").Page) {
  await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
  await page.goto("/professionals");
  await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
  await page.getByTestId("request-intervention").click();
  await expect(page.getByTestId("booking-form")).toBeVisible();
  await page.getByTestId("booking-services").getByRole("radio", { name: "Plumbing" }).check();
  await page.getByTestId("booking-slots").locator("label").first().click();
  await page.getByRole("button", { name: "Request intervention" }).click();
  await expect(page.getByTestId("booking-confirmation")).toBeVisible();

  await signOut(page);
  await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByTestId("start-diagnosis").click();
  await page.getByTestId("diagnosis-findings").fill("Kitchen tap washer is worn and needs replacement.");
  await page.getByTestId("complete-diagnosis").click();
  await page.getByTestId("quote-amount-input").fill("180.00");
  await page.getByTestId("quote-notes").fill("Washer replacement and labour.");
  await page.getByTestId("send-quote").click();

  await signOut(page);
  await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
  await page.getByTestId("accept-quote").click();

  await signOut(page);
  await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
  await page.getByTestId("start-intervention").click();
  await page.getByTestId("complete-intervention").click();

  await signOut(page);
  await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
  await page.getByTestId("record-payment").click();
  await expect(page.getByTestId("payment-recorded")).toBeVisible();
}

test.describe("Phase 9 reviews and ratings", () => {
  test.beforeEach(async () => {
    await cleanupDemoBookings();
  });

  test.afterAll(async () => {
    await cleanupDemoBookings();
  });

  test("E2E-09-01 to 06, 08 and 09: review after payment, profile display, isolation", async ({
    page,
  }) => {
    await reachPaymentRecorded(page);
    await expect(page.getByTestId("leave-review")).toBeVisible();
    await page.getByTestId("review-rating-5").check();
    await page.getByTestId("review-comment").fill("Clear, careful work on the tap.");
    await page.getByTestId("submit-review").click();
    await expect(page.getByTestId("review-submitted")).toHaveText("Review submitted");
    await expect(page.getByTestId("review-form")).toHaveCount(0);

    await page.goto("/professionals");
    await page.getByRole("link", { name: /Ahmed El Mansouri/ }).click();
    const reviews = page.getByTestId("profile-reviews");
    await expect(reviews.getByTestId("review-average")).toHaveText("5.0");
    await expect(reviews.getByTestId("review-count")).toHaveText("1 review");
    await expect(reviews.getByTestId("public-review")).toContainText("Clear, careful work on the tap.");
    await expect(reviews).not.toContainText("Kitchen tap washer");
    await expect(reviews).not.toContainText("180.00");
    await expect(reviews).not.toContainText(CLIENT_EMAIL);
    await expect(reviews).not.toContainText("Washer replacement and labour");

    const demo = prismaAt(demoDatabaseUrl());
    try {
      expect(
        await demo.review.count({
          where: { provider: { user: { email: AHMED_EMAIL } } },
        }),
      ).toBe(0);
    } finally {
      await demo.$disconnect();
    }
  });

  test("E2E-09-07: professional cannot submit a review", async ({ page }) => {
    await reachPaymentRecorded(page);
    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await expect(page.getByTestId("professional-bookings")).toBeVisible();
    await expect(page.getByTestId("review-form")).toHaveCount(0);
    await expect(page.getByTestId("submit-review")).toHaveCount(0);
  });
});
