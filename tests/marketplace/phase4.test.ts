import { PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { getProfessionalById } from "@/features/professionals/queries";
import { updateProviderProfileForIdentity } from "@/features/professionals/profile";
import { DEMO_SERVICE_CATALOG } from "@/features/services/catalog";

const prisma = new PrismaClient();
const suffix = `ph4-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";

const ids = {
  client: "",
  proA: "",
  proB: "",
  providerA: "",
  providerB: "",
  plumbing: "",
  cleaning: "",
};

async function cleanup() {
  await prisma.providerService.deleteMany({
    where: { provider: { user: { email: { contains: suffix } } } },
  });
  await prisma.availability.deleteMany({
    where: { provider: { user: { email: { contains: suffix } } } },
  });
  await prisma.portfolioItem.deleteMany({
    where: { provider: { user: { email: { contains: suffix } } } },
  });
  await prisma.provider.deleteMany({
    where: { user: { email: { contains: suffix } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: suffix } },
  });
  await prisma.service.deleteMany({
    where: { slug: { contains: suffix } },
  });
}

beforeAll(async () => {
  await cleanup();

  const plumbing = await prisma.service.create({
    data: {
      name: "PH4 Plumbing",
      slug: `plumbing-${suffix}`,
      description: "Test-only service",
    },
  });
  const cleaning = await prisma.service.create({
    data: {
      name: "PH4 Cleaning",
      slug: `cleaning-${suffix}`,
      description: "Test-only service",
    },
  });
  ids.plumbing = plumbing.id;
  ids.cleaning = cleaning.id;

  const client = await prisma.user.create({
    data: {
      name: "PH4 Client",
      email: `client-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.client = client.id;

  const proA = await prisma.user.create({
    data: {
      name: "PH4 Ahmed",
      email: `pro-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: "Casablanca",
          address: "Maarif",
          verified: false,
          services: {
            create: [{ serviceId: plumbing.id }, { serviceId: cleaning.id }],
          },
          portfolio: {
            create: {
              mediaKey: `demo/${suffix}/a`,
              title: "Owner A sample",
              sortOrder: 0,
            },
          },
          availability: {
            create: {
              dayOfWeek: 1,
              startTime: new Date("1970-01-01T08:00:00.000Z"),
              endTime: new Date("1970-01-01T16:00:00.000Z"),
              active: true,
            },
          },
        },
      },
    },
    include: { provider: true },
  });
  ids.proA = proA.id;
  ids.providerA = proA.provider!.id;

  const proB = await prisma.user.create({
    data: {
      name: "PH4 Fatima",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Cleaner",
          city: "Casablanca",
          verified: false,
          services: { create: { serviceId: cleaning.id } },
        },
      },
    },
    include: { provider: true },
  });
  ids.proB = proB.id;
  ids.providerB = proB.provider!.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

function identity(userId: string, role: AuthIdentity["role"] = AppRole.PROFESSIONAL): AuthIdentity {
  return {
    userId,
    email: `${userId}@test.handyhome.local`,
    name: "Test",
    role,
  };
}

describe("Phase 4 marketplace data", () => {
  it("PH4-01: service records exist", async () => {
    const services = await prisma.service.findMany({
      where: { id: { in: [ids.plumbing, ids.cleaning] } },
    });
    expect(services).toHaveLength(2);
    expect(DEMO_SERVICE_CATALOG.length).toBeGreaterThan(0);
  });

  it("PH4-02: service slug unique", async () => {
    await expect(
      prisma.service.create({
        data: { name: "Dup", slug: `plumbing-${suffix}` },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("PH4-03: provider-service relation works", async () => {
    const link = await prisma.providerService.findUnique({
      where: { providerId_serviceId: { providerId: ids.providerA, serviceId: ids.plumbing } },
    });
    expect(link?.providerId).toBe(ids.providerA);
  });

  it("PH4-04: provider can have multiple services", async () => {
    const links = await prisma.providerService.findMany({ where: { providerId: ids.providerA } });
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("PH4-05: service can have multiple providers", async () => {
    const links = await prisma.providerService.findMany({ where: { serviceId: ids.cleaning } });
    expect(links.map((link) => link.providerId).sort()).toEqual(
      [ids.providerA, ids.providerB].sort(),
    );
  });

  it("PH4-06: public professional profile retrieves correct provider", async () => {
    const profile = await getProfessionalById(ids.providerA);
    expect(profile?.id).toBe(ids.providerA);
    expect(profile?.userId).toBe(ids.proA);
    expect(profile?.user.name).toBe("PH4 Ahmed");
    expect(profile?.services.map((item) => item.serviceId)).toEqual(
      expect.arrayContaining([ids.plumbing, ids.cleaning]),
    );
  });

  it("PH4-07: unknown provider returns not found", async () => {
    expect(await getProfessionalById("missing-provider-id")).toBeNull();
  });

  it("PH4-08: professional ownership prevents editing another provider", async () => {
    await expect(
      updateProviderProfileForIdentity(identity(ids.proA), {
        profession: "Hijack",
        city: "Rabat",
        claimedProviderId: ids.providerB,
        claimedOwnerId: ids.proB,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const untouched = await prisma.provider.findUniqueOrThrow({ where: { id: ids.providerB } });
    expect(untouched.profession).toBe("Cleaner");
    expect(untouched.city).toBe("Casablanca");

    const updated = await updateProviderProfileForIdentity(identity(ids.proA), {
      profession: "Plumber",
      city: "Casablanca",
      description: "Owned update",
      claimedProviderId: ids.providerB,
      claimedOwnerId: ids.proB,
    }).catch((error: unknown) => error);
    expect(updated).toBeInstanceOf(ForbiddenError);

    const own = await updateProviderProfileForIdentity(identity(ids.proA), {
      profession: "Plumber",
      city: "Casablanca",
      description: "Owned update",
    });
    expect(own.id).toBe(ids.providerA);
    expect(own.description).toBe("Owned update");
  });

  it("PH4-09: portfolio belongs to correct provider", async () => {
    const items = await prisma.portfolioItem.findMany({ where: { providerId: ids.providerA } });
    expect(items).toHaveLength(1);
    expect(items[0]?.providerId).toBe(ids.providerA);
    const other = await prisma.portfolioItem.findMany({ where: { providerId: ids.providerB } });
    expect(other).toHaveLength(0);
  });

  it("PH4-10: availability belongs to correct provider", async () => {
    const slots = await prisma.availability.findMany({ where: { providerId: ids.providerA } });
    expect(slots).toHaveLength(1);
    expect(slots[0]?.providerId).toBe(ids.providerA);
    expect(slots[0]?.dayOfWeek).toBe(1);
  });
});
