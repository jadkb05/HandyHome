import { Prisma, PrismaClient } from "@prisma/client";

/** Playwright auth specs only. Never seeded. Identified by email, not by display name. */
export const PLAYWRIGHT_E2E_EMAIL_DOMAIN = "@demo.handyhome.local";
export const PLAYWRIGHT_E2E_EMAIL_PREFIX = "e2e-";

export function isPlaywrightE2eEmail(email: string): boolean {
  return email.startsWith(PLAYWRIGHT_E2E_EMAIL_PREFIX) && email.endsWith(PLAYWRIGHT_E2E_EMAIL_DOMAIN);
}

export const playwrightE2eEmailWhere: Prisma.UserWhereInput = {
  AND: [
    { email: { startsWith: PLAYWRIGHT_E2E_EMAIL_PREFIX } },
    { email: { endsWith: PLAYWRIGHT_E2E_EMAIL_DOMAIN } },
  ],
};

export function prismaAt(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: databaseUrl });
}

export async function deletePlaywrightE2eUsers(
  prisma: PrismaClient,
  emails?: string[],
): Promise<number> {
  const users = await prisma.user.findMany({
    where: emails ? { email: { in: emails } } : playwrightE2eEmailWhere,
    select: { id: true, email: true },
  });
  const owned = users.filter((user) => isPlaywrightE2eEmail(user.email));
  if (owned.length === 0) {
    return 0;
  }

  const ids = owned.map((user) => user.id);
  const identifiers = owned.map((user) => user.email);

  await prisma.payment.deleteMany({
    where: {
      OR: [{ booking: { clientId: { in: ids } } }, { booking: { provider: { userId: { in: ids } } } }],
    },
  });
  await prisma.quote.deleteMany({
    where: {
      OR: [{ booking: { clientId: { in: ids } } }, { booking: { provider: { userId: { in: ids } } } }],
    },
  });
  await prisma.diagnosis.deleteMany({
    where: {
      OR: [{ booking: { clientId: { in: ids } } }, { booking: { provider: { userId: { in: ids } } } }],
    },
  });
  await prisma.review.deleteMany({
    where: { OR: [{ clientId: { in: ids } }, { provider: { userId: { in: ids } } }] },
  });
  await prisma.booking.deleteMany({
    where: { OR: [{ clientId: { in: ids } }, { provider: { userId: { in: ids } } }] },
  });
  await prisma.favorite.deleteMany({
    where: { OR: [{ clientId: { in: ids } }, { provider: { userId: { in: ids } } }] },
  });
  await prisma.portfolioItem.deleteMany({ where: { provider: { userId: { in: ids } } } });
  await prisma.availability.deleteMany({ where: { provider: { userId: { in: ids } } } });
  await prisma.providerService.deleteMany({ where: { provider: { userId: { in: ids } } } });
  await prisma.provider.deleteMany({ where: { userId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.account.deleteMany({ where: { userId: { in: ids } } });
  await prisma.verification.deleteMany({ where: { identifier: { in: identifiers } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return owned.length;
}
