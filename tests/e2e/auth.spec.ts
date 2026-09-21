import { expect, test } from "@playwright/test";
import { deletePlaywrightE2eUsers, prismaAt } from "./e2e-users";
import { e2eDatabaseUrl } from "./env";

test.describe("authentication happy path", () => {
  test("client register, session, logout, login, and role isolation", async ({ page }) => {
    test.setTimeout(90_000);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const clientEmail = `e2e-client-${stamp}@demo.handyhome.local`;
    const professionalEmail = `e2e-pro-${stamp}@demo.handyhome.local`;
    const password = "DemoClient123!";
    const prisma = prismaAt(e2eDatabaseUrl());

    try {
      await page.goto("/register");
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
      await page.getByLabel("Full name").fill("[DEMO] E2E Client");
      await page.getByLabel("Email").fill(clientEmail);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("radio", { name: /I am a Client/ }).check();
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "Client dashboard" })).toBeVisible();
      await expect(page.getByTestId("auth-email")).toHaveText(clientEmail);
      await expect(page.getByTestId("auth-role")).toHaveText("Client account");

      await page.goto("/professional/dashboard");
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "Client dashboard" })).toBeVisible();

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(
        page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Sign in" }),
      ).toBeVisible();

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);

      await page.goto("/login");
      await page.getByLabel("Email").fill(clientEmail);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      await expect(page.getByTestId("auth-email")).toHaveText(clientEmail);

      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(
        page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Sign in" }),
      ).toBeVisible();

      await page.goto("/register");
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
      await page.getByLabel("Full name").fill("[DEMO] E2E Professional");
      await page.getByLabel("Email").fill(professionalEmail);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("radio", { name: /I am a Professional/ }).check();
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/professional\/dashboard$/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "Professional dashboard" })).toBeVisible();
      await expect(page.getByTestId("auth-email")).toHaveText(professionalEmail);
      await expect(page.getByTestId("auth-role")).toHaveText("Professional account");
      await expect(page.getByText("This account is not verified")).toBeVisible();

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/professional\/dashboard$/);
    } finally {
      await deletePlaywrightE2eUsers(prisma, [clientEmail, professionalEmail]);
      await prisma.$disconnect();
    }
  });

  test("invalid credentials show a safe error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@demo.handyhome.local");
    await page.getByLabel("Password").fill("WrongPass123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("auth-error")).toHaveText("Invalid email or password.");
    await expect(page).toHaveURL(/\/login/);
  });

  test("duplicate email shows a safe error", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Karim Duplicate");
    await page.getByLabel("Email").fill("client@demo.handyhome.local");
    await page.getByLabel("Password").fill("DemoClient123!");
    await page.getByRole("radio", { name: /I am a Client/ }).check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByTestId("auth-error")).toBeVisible();
    await expect(page.getByTestId("auth-error")).not.toContainText("Invalid origin");
    await expect(page).toHaveURL(/\/register/);
  });
});
