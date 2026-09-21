import { BookingStatus, Prisma, PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { createBookingForIdentity } from "@/features/bookings/create";
import { listBookingsForClient, listBookingsForProfessional, getClientBooking, getProfessionalBooking } from "@/features/bookings/queries";
import { generateOpenSlots } from "@/features/bookings/slots";
import { respondToBookingForIdentity } from "@/features/bookings/transitions";
import {
  addCivilDays,
  civilDateInBusinessTimezone,
  formatTimeInBusinessTimezone,
  weekdayFromCivilDate,
  zonedCivilToUtc,
} from "@/lib/datetime";

const prisma = new PrismaClient();
const suffix = `ph6-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";
const frozenNow = new Date("2026-10-04T12:00:00.000Z");

const ids = {
  clientA: "",
  clientB: "",
  proA: "",
  proB: "",
  providerA: "",
  providerB: "",
  service: "",
};

function identity(userId: string, role: AuthIdentity["role"], email: string): AuthIdentity {
  return { userId, email, name: role, role };
}

async function cleanup() {
  await prisma.payment.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.quote.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.diagnosis.deleteMany({
    where: {
      OR: [
        { booking: { client: { email: { contains: suffix } } } },
        { booking: { provider: { user: { email: { contains: suffix } } } } },
      ],
    },
  });
  await prisma.review.deleteMany({
    where: { client: { email: { contains: suffix } } },
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

  const service = await prisma.service.create({
    data: { name: "PH6 Plumbing", slug: `plumbing-${suffix}` },
  });
  ids.service = service.id;

  const clientA = await prisma.user.create({
    data: {
      name: "PH6 Client A",
      email: `client-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientA = clientA.id;

  const clientB = await prisma.user.create({
    data: {
      name: "PH6 Client B",
      email: `client-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientB = clientB.id;

  const proA = await prisma.user.create({
    data: {
      name: "PH6 Pro A",
      email: `pro-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: "Casablanca",
          availability: {
            create: [
              {
                dayOfWeek: 1,
                startTime: new Date("1970-01-01T08:00:00.000Z"),
                endTime: new Date("1970-01-01T16:00:00.000Z"),
                active: true,
              },
            ],
          },
          services: { create: { serviceId: service.id } },
        },
      },
    },
    include: { provider: true },
  });
  ids.proA = proA.id;
  ids.providerA = proA.provider!.id;

  const proB = await prisma.user.create({
    data: {
      name: "PH6 Pro B",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Electrician",
          city: "Casablanca",
          availability: {
            create: {
              dayOfWeek: 2,
              startTime: new Date("1970-01-01T09:00:00.000Z"),
              endTime: new Date("1970-01-01T17:00:00.000Z"),
              active: true,
            },
          },
          services: { create: { serviceId: service.id } },
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

function mondaySlot(clock = "08:00") {
  return zonedCivilToUtc("2026-10-05", clock);
}

describe("PH6 timezone", () => {
  it("PH6-15: converts Africa/Casablanca civil time to UTC and back", () => {
    const utc = zonedCivilToUtc("2026-10-05", "14:00");
    expect(utc.toISOString()).toBe("2026-10-05T13:00:00.000Z");
    expect(civilDateInBusinessTimezone(utc)).toBe("2026-10-05");
    expect(formatTimeInBusinessTimezone(utc)).toBe("14:00");
    expect(weekdayFromCivilDate("2026-10-05")).toBe(1);
  });
});

describe("PH6 slot generation", () => {
  it("builds 60-minute slots inside availability and skips occupied times", () => {
    const slots = generateOpenSlots({
      availability: [
        {
          dayOfWeek: 1,
          startTime: new Date("1970-01-01T08:00:00.000Z"),
          endTime: new Date("1970-01-01T10:00:00.000Z"),
          active: true,
        },
      ],
      occupied: [mondaySlot("08:00")],
      now: frozenNow,
    });
    const monday = slots.filter((slot) => slot.civilDate === "2026-10-05");
    expect(monday.map((slot) => slot.timeLabel)).toEqual(["09:00"]);
  });
});

describe("PH6 booking service", () => {
  const clientA = () => identity(ids.clientA, AppRole.CLIENT, `client-a-${suffix}@test.handyhome.local`);
  const clientB = () => identity(ids.clientB, AppRole.CLIENT, `client-b-${suffix}@test.handyhome.local`);
  const proA = () => identity(ids.proA, AppRole.PROFESSIONAL, `pro-a-${suffix}@test.handyhome.local`);
  const proB = () => identity(ids.proB, AppRole.PROFESSIONAL, `pro-b-${suffix}@test.handyhome.local`);

  it("PH6-01 / PH6-16: authenticated CLIENT can create a REQUESTED booking", async () => {
    const booking = await createBookingForIdentity(
      clientA(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("08:00").toISOString() },
      frozenNow,
    );
    expect(booking.clientId).toBe(ids.clientA);
    expect(booking.providerId).toBe(ids.providerA);
    expect(booking.status).toBe(BookingStatus.REQUESTED);
    expect(booking.scheduledAt?.toISOString()).toBe(mondaySlot("08:00").toISOString());
  });

  it("PH6-02: anonymous user cannot create booking", async () => {
    await expect(
      createBookingForIdentity(
        null,
        { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("09:00").toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("PH6-03: PROFESSIONAL cannot create a client booking", async () => {
    await expect(
      createBookingForIdentity(
        proA(),
        { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("09:00").toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN_ROLE" });
  });

  it("PH6-04: clientId comes from the authenticated session", async () => {
    const booking = await createBookingForIdentity(
      clientA(),
      {
        providerId: ids.providerA,
        serviceId: ids.service,
        scheduledAt: mondaySlot("10:00").toISOString(),
        claimedClientId: ids.clientB,
      },
      frozenNow,
    );
    expect(booking.clientId).toBe(ids.clientA);
    expect(booking.clientId).not.toBe(ids.clientB);
  });

  it("PH6-05: client can only read own bookings", async () => {
    const own = await listBookingsForClient(clientA());
    expect(own.every((row) => row.clientId === ids.clientA)).toBe(true);
    const other = await listBookingsForClient(clientB());
    expect(other.every((row) => row.clientId === ids.clientB)).toBe(true);
    const foreignId = own[0]?.id;
    expect(foreignId).toBeTruthy();
    await expect(getClientBooking(clientB(), foreignId!)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("PH6-06 / PH6-07: professional can only read own provider bookings", async () => {
    const own = await listBookingsForProfessional(proA());
    expect(own.every((row) => row.providerId === ids.providerA)).toBe(true);
    const other = await listBookingsForProfessional(proB());
    expect(other.every((row) => row.providerId === ids.providerB)).toBe(true);
    await expect(getProfessionalBooking(proB(), own[0]!.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("PH6-08: booking requires a valid provider", async () => {
    await expect(
      createBookingForIdentity(
        clientA(),
        { providerId: "missing-provider", serviceId: ids.service, scheduledAt: mondaySlot("11:00").toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_NOT_FOUND" });
  });

  it("PH6-09: booking requires a valid scheduledAt", async () => {
    await expect(
      createBookingForIdentity(clientA(), { providerId: ids.providerA, serviceId: ids.service, scheduledAt: "Monday morning" }, frozenNow),
    ).rejects.toMatchObject({ code: "INVALID_TIME" });
  });

  it("PH11: past appointment ISO timestamps are rejected", async () => {
    await expect(
      createBookingForIdentity(
        clientA(),
        {
          providerId: ids.providerA,
          serviceId: ids.service,
          scheduledAt: "2020-01-06T09:00:00.000Z",
        },
        frozenNow,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_TIME",
      message: "Choose a future appointment time.",
    });
  });

  it("PH6-10: booking must respect availability", async () => {
    const tuesday = addCivilDays("2026-10-05", 1);
    const outside = zonedCivilToUtc(tuesday, "10:00");
    await expect(
      createBookingForIdentity(
        clientA(),
        { providerId: ids.providerA, serviceId: ids.service, scheduledAt: outside.toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "OUTSIDE_AVAILABILITY" });
  });

  it("PH6-11: same provider + scheduledAt cannot be double booked", async () => {
    await expect(
      createBookingForIdentity(
        clientB(),
        { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("08:00").toISOString() },
        frozenNow,
      ),
    ).rejects.toMatchObject({ code: "SLOT_TAKEN", message: "This time slot is no longer available." });
  });

  it("PH6-12: race/conflict is handled as a friendly slot error", async () => {
    const iso = mondaySlot("11:00").toISOString();
    const results = await Promise.allSettled([
      createBookingForIdentity(clientA(), { providerId: ids.providerA, serviceId: ids.service, scheduledAt: iso }, frozenNow),
      createBookingForIdentity(clientB(), { providerId: ids.providerA, serviceId: ids.service, scheduledAt: iso }, frozenNow),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({
        code: "SLOT_TAKEN",
        message: "This time slot is no longer available.",
      }),
    });
  });

  it("PH6-13 / PH6-14: booking does not create a price, quote, payment, or card fields", async () => {
    const booking = await createBookingForIdentity(
      clientA(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("12:00").toISOString() },
      frozenNow,
    );
    const quotes = await prisma.quote.count({ where: { bookingId: booking.id } });
    const payments = await prisma.payment.count({ where: { bookingId: booking.id } });
    expect(quotes).toBe(0);
    expect(payments).toBe(0);
    const paymentFields = Prisma.dmmf.datamodel.models
      .find((model) => model.name === "Payment")
      ?.fields.map((field) => field.name) ?? [];
    expect(paymentFields).not.toContain("cardNumber");
    expect(paymentFields).not.toContain("cvv");
    expect(paymentFields).not.toContain("card");
  });

  it("professional can accept or reject a REQUESTED booking", async () => {
    const booking = await createBookingForIdentity(
      clientB(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("13:00").toISOString() },
      frozenNow,
    );
    const accepted = await respondToBookingForIdentity(proA(), {
      bookingId: booking.id,
      decision: "accept",
    });
    expect(accepted.status).toBe(BookingStatus.ACCEPTED);

    const other = await createBookingForIdentity(
      clientB(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("14:00").toISOString() },
      frozenNow,
    );
    const rejected = await respondToBookingForIdentity(proA(), {
      bookingId: other.id,
      decision: "reject",
    });
    expect(rejected.status).toBe(BookingStatus.REJECTED);

    const reused = await createBookingForIdentity(
      clientA(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("14:00").toISOString() },
      frozenNow,
    );
    expect(reused.status).toBe(BookingStatus.REQUESTED);
  });

  it("professional cannot accept another provider's booking", async () => {
    const booking = await createBookingForIdentity(
      clientA(),
      { providerId: ids.providerA, serviceId: ids.service, scheduledAt: mondaySlot("15:00").toISOString() },
      frozenNow,
    );
    await expect(
      respondToBookingForIdentity(proB(), { bookingId: booking.id, decision: "accept" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
