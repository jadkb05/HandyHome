import { expect, test } from "@playwright/test";
import { prismaAt } from "./e2e-users";
import { demoDatabaseUrl, e2eDatabaseUrl } from "./env";

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

async function reachAcceptedQuote(page: import("@playwright/test").Page) {
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
  await expect(page.getByTestId("professional-bookings")).toBeVisible();
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByTestId("start-diagnosis").click();
  await page.getByTestId("diagnosis-findings").fill("Kitchen tap washer is worn and needs replacement.");
  await page.getByTestId("complete-diagnosis").click();
  await page.getByTestId("quote-amount-input").fill("180.00");
  await page.getByTestId("quote-notes").fill("Washer replacement and labour.");
  await page.getByTestId("send-quote").click();
  await expect(page.getByText("Quote sent. Awaiting client.")).toBeVisible();

  await signOut(page);
  await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
  await page.getByTestId("accept-quote").click();
  await expect(page.getByTestId("quote-accepted")).toBeVisible();
}

test.describe("Phase 8 intervention and payment state", () => {
  test.beforeEach(async () => {
    await cleanupDemoBookings();
  });

  test.afterAll(async () => {
    await cleanupDemoBookings();
  });

  test("E2E-08-01 to 10 and 12: intervention, payment snapshot, recorded state, no PSP", async ({
    page,
  }) => {
    await reachAcceptedQuote(page);

    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await expect(page.getByTestId("booking-item-status")).toHaveText("Quote accepted");
    await expect(page.getByTestId("start-intervention")).toBeVisible();
    await page.getByTestId("start-intervention").click();
    await expect(page.getByTestId("booking-item-status")).toHaveText("Intervention in progress");

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await expect(page.getByTestId("intervention-in-progress")).toContainText("Intervention in progress");
    await expect(page.getByTestId("complete-intervention")).toHaveCount(0);

    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await page.getByTestId("complete-intervention").click();
    await expect(page.getByTestId("payment-pending")).toContainText(
      "Intervention completed — payment pending",
    );
    await expect(page.getByTestId("record-payment")).toHaveCount(0);
    await expect(page.getByText("Stripe")).toHaveCount(0);
    await expect(page.getByLabel("Card number")).toHaveCount(0);

    const e2e = prismaAt(e2eDatabaseUrl());
    const demo = prismaAt(demoDatabaseUrl());
    try {
      const payment = await e2e.payment.findFirstOrThrow({
        where: { booking: { client: { email: CLIENT_EMAIL } } },
        include: { quote: true },
      });
      expect(payment.status).toBe("PENDING");
      expect(payment.currency).toBe("MAD");
      expect(payment.amount.toString()).toBe(payment.quote.amount.toString());
      expect(payment.quote.status).toBe("ACCEPTED");
      expect(await demo.payment.count({ where: { booking: { client: { email: CLIENT_EMAIL } } } })).toBe(
        0,
      );
    } finally {
      await e2e.$disconnect();
      await demo.$disconnect();
    }

    await signOut(page);
    await signIn(page, CLIENT_EMAIL, CLIENT_PASSWORD);
    await expect(page.getByTestId("payment-pending")).toBeVisible();
    await expect(page.getByTestId("payment-amount")).toContainText("180.00 MAD");
    await page.getByTestId("record-payment").click();
    await expect(page.getByTestId("payment-recorded")).toContainText("Payment recorded");
    await expect(page.getByTestId("booking-item-status")).toHaveText("Payment recorded");
    await expect(page.getByText("Card charged")).toHaveCount(0);
    await expect(page.getByText("Transaction successful")).toHaveCount(0);
    await expect(page.getByText("Payment processed by Stripe")).toHaveCount(0);
  });

  test("E2E-08-11: another user cannot manipulate payment", async ({ page }) => {
    await reachAcceptedQuote(page);
    await signOut(page);
    await signIn(page, AHMED_EMAIL, AHMED_PASSWORD);
    await page.getByTestId("start-intervention").click();
    await page.getByTestId("complete-intervention").click();
    await expect(page.getByTestId("payment-pending")).toBeVisible();

    await signOut(page);
    await signIn(page, FATIMA_EMAIL, FATIMA_PASSWORD);
    await expect(page.getByRole("heading", { name: "Professional dashboard" })).toBeVisible();
    await expect(page.getByTestId("start-intervention")).toHaveCount(0);
    await expect(page.getByTestId("complete-intervention")).toHaveCount(0);
    await expect(page.getByTestId("record-payment")).toHaveCount(0);
    await expect(page.getByTestId("professional-bookings")).toHaveCount(0);
  });
});
