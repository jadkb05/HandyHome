import { BookingStatus, PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { createBookingForIdentity, offeredBookingServices } from "@/features/bookings/create";
import { listBookingsForClient, listBookingsForProfessional } from "@/features/bookings/queries";
import { createBookingInputSchema } from "@/features/bookings/validation";
import { zonedCivilToUtc } from "@/lib/datetime";

const prisma = new PrismaClient();
const suffix = `ph61-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";
const frozenNow = new Date("2026-10-04T12:00:00.000Z");

const ids = {
  client: "",
  proA: "",
  proB: "",
  providerA: "",
  providerB: "",
  plumbing: "",
  appliance: "",
  electrical: "",
};

function identity(userId: string, role: AuthIdentity["role"], email: string): AuthIdentity {
  return { userId, email, name: role, role };
}

function mondaySlot(clock = "08:00") {
  return zonedCivilToUtc("2026-10-05", clock);
}

async function cleanup() {
  await prisma.diagnosis.deleteMany({
    where: {
      OR: [
        { booking: { client: { email: { contains: suffix } } } },
        { booking: { provider: { user: { email: { contains: suffix } } } } },
      ],
    },
  });
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { client: { email: { contains: suffix } } },
        { provider: { user: { email: { contains: suffix } } } },
      ],
    },
  });
  await prisma.providerService.deleteMany({
    where: { provider: { user: { email: { contains: suffix } } } },
  });
  await prisma.availability.deleteMany({
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
    data: { name: "Plumbing", slug: `plumbing-${suffix}` },
  });
  const appliance = await prisma.service.create({
    data: { name: "Appliance repair", slug: `appliance-${suffix}` },
  });
  const electrical = await prisma.service.create({
    data: { name: "Electrical", slug: `electrical-${suffix}` },
  });
  ids.plumbing = plumbing.id;
  ids.appliance = appliance.id;
  ids.electrical = electrical.id;

  const client = await prisma.user.create({
    data: {
      name: "PH61 Client",
      email: `client-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.client = client.id;

  const proA = await prisma.user.create({
    data: {
      name: "PH61 Ahmed",
      email: `pro-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: "Casablanca",
          availability: {
            create: {
              dayOfWeek: 1,
              startTime: new Date("1970-01-01T08:00:00.000Z"),
              endTime: new Date("1970-01-01T16:00:00.000Z"),
              active: true,
            },
          },
          services: {
            create: [{ serviceId: plumbing.id }, { serviceId: appliance.id }],
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
      name: "PH61 Other",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Electrician",
          city: "Casablanca",
          availability: {
            create: {
              dayOfWeek: 1,
              startTime: new Date("1970-01-01T08:00:00.000Z"),
              endTime: new Date("1970-01-01T16:00:00.000Z"),
              active: true,
            },
          },
          services: { create: { serviceId: electrical.id } },
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

describe("PH6.1 booking service selection", () => {
  const client = () => identity(ids.client, AppRole.CLIENT, `client-${suffix}@test.handyhome.local`);
  const proA = () => identity(ids.proA, AppRole.PROFESSIONAL, `pro-a-${suffix}@test.handyhome.local`);

  it("PH6.1-01: professional with multiple services exposes all offered services", async () => {
    const provider = await prisma.provider.findUniqueOrThrow({
      where: { id: ids.providerA },
      include: { services: { include: { service: true } } },
    });
    const offered = offeredBookingServices(provider.services);
    expect(offered.map((item) => item.name).sort()).toEqual(["Appliance repair", "Plumbing"]);
    expect(offered.some((item) => item.id === ids.electrical)).toBe(false);
  });

  it("PH6.1-02: client must select a service when multiple services exist", async () => {
    await expect(
      createBookingForIdentity(
        client(),
        { providerId: ids.providerA, scheduledAt: mondaySlot("08:00").toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "SERVICE_NOT_OFFERED", message: "Choose a service." });
  });

  it("PH6.1-03 / 07 / 08: selected service is stored and shown to both parties", async () => {
    const booking = await createBookingForIdentity(
      client(),
      {
        providerId: ids.providerA,
        serviceId: ids.plumbing,
        scheduledAt: mondaySlot("08:00").toISOString(),
      },
      frozenNow,
    );
    expect(booking.serviceId).toBe(ids.plumbing);
    expect(booking.service.name).toBe("Plumbing");
    expect(booking.status).toBe(BookingStatus.REQUESTED);

    const clientRows = await listBookingsForClient(client());
    expect(clientRows.find((row) => row.id === booking.id)?.service.name).toBe("Plumbing");

    const professionalRows = await listBookingsForProfessional(proA());
    expect(professionalRows.find((row) => row.id === booking.id)?.service.name).toBe("Plumbing");
  });

  it("PH6.1-04: service not offered by provider is rejected", async () => {
    await expect(
      createBookingForIdentity(
        client(),
        {
          providerId: ids.providerA,
          serviceId: ids.electrical,
          scheduledAt: mondaySlot("09:00").toISOString(),
        },
        frozenNow,
      ),
    ).rejects.toMatchObject({
      code: "SERVICE_NOT_OFFERED",
      message: "That service is not offered by this professional.",
    });
  });

  it("PH6.1-05: client cannot use another provider's serviceId", async () => {
    await expect(
      createBookingForIdentity(
        client(),
        {
          providerId: ids.providerA,
          serviceId: ids.electrical,
          scheduledAt: mondaySlot("10:00").toISOString(),
        },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "SERVICE_NOT_OFFERED" });
  });

  it("PH6.1-06: a one-service professional books that explicit serviceId", async () => {
    const booking = await createBookingForIdentity(
      client(),
      {
        providerId: ids.providerB,
        serviceId: ids.electrical,
        scheduledAt: mondaySlot("08:00").toISOString(),
      },
      frozenNow,
    );
    expect(booking.serviceId).toBe(ids.electrical);
    expect(booking.service.name).toBe("Electrical");
  });

  it("PH6.1-09: booking input has no problem-description field", () => {
    expect("description" in createBookingInputSchema.shape).toBe(false);
    expect("problem" in createBookingInputSchema.shape).toBe(false);
    expect("notes" in createBookingInputSchema.shape).toBe(false);
  });

  it("PH6.1-10: booking still does not create a quote or payment", async () => {
    const booking = await createBookingForIdentity(
      client(),
      {
        providerId: ids.providerA,
        serviceId: ids.appliance,
        scheduledAt: mondaySlot("11:00").toISOString(),
      },
      frozenNow,
    );
    expect(await prisma.quote.count({ where: { bookingId: booking.id } })).toBe(0);
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(0);
  });
});
