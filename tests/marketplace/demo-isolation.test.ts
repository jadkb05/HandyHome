import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deletePlaywrightE2eUsers, playwrightE2eEmailWhere } from "../e2e/e2e-users";

const prisma = new PrismaClient();

beforeAll(async () => {
  await deletePlaywrightE2eUsers(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("demo marketplace dataset isolation", () => {
  it("keeps Ahmed and Fatima and has no Playwright e2e- auth users", async () => {
    const leftover = await prisma.user.findMany({ where: playwrightE2eEmailWhere });
    expect(leftover).toEqual([]);

    const ahmed = await prisma.user.findUnique({ where: { email: "ahmed@demo.handyhome.local" } });
    const fatima = await prisma.user.findUnique({ where: { email: "fatima@demo.handyhome.local" } });
    expect(ahmed?.name).toBe("Ahmed El Mansouri");
    expect(fatima?.name).toBe("Sara Amrani");
    expect(ahmed?.role).toBe("PROFESSIONAL");
    expect(fatima?.role).toBe("PROFESSIONAL");
  });
});
