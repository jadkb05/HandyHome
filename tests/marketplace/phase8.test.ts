import { BookingStatus, PaymentStatus, Prisma, PrismaClient, QuoteStatus, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { bookingDetailInclude, createBookingForIdentity } from "@/features/bookings/create";
import { respondToBookingForIdentity } from "@/features/bookings/transitions";
import { completeDiagnosisForIdentity, startDiagnosisForIdentity } from "@/features/diagnosis/service";
import {
  completeInterventionForIdentity,
  startInterventionForIdentity,
} from "@/features/intervention/service";
import { createPendingPaymentInTransaction, recordPaymentForIdentity } from "@/features/payments/service";
import { createQuoteForIdentity, respondToQuoteForIdentity } from "@/features/quotes/service";
import { zonedCivilToUtc } from "@/lib/datetime";
import { getPaymentService } from "@/lib/payments";

const prisma = new PrismaClient();
const suffix = `ph8-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

let slotIndex = 0;

function nextSlot() {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15];
  const days = ["2026-10-05", "2026-10-07", "2026-10-09"];
  const index = slotIndex;
  slotIndex += 1;
  const day = days[Math.floor(index / hours.length)];
  const hour = hours[index % hours.length];
  if (!day || hour === undefined) {
    throw new Error("No remaining test slots.");
  }
  return zonedCivilToUtc(day, `${String(hour).padStart(2, "0")}:00`);
}

async function cleanup() {
  await prisma.payment.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.quote.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.review.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.diagnosis.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.booking.deleteMany({
    where: { client: { email: { contains: suffix } } },
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
    data: { name: "PH8 Plumbing", slug: `plumbing-${suffix}` },
  });
  ids.service = service.id;

  const clientA = await prisma.user.create({
    data: {
      name: "PH8 Client A",
      email: `client-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientA = clientA.id;
  const clientB = await prisma.user.create({
    data: {
      name: "PH8 Client B",
      email: `client-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientB = clientB.id;

  const availability = {
    create: [
      {
        dayOfWeek: 1,
        startTime: new Date("1970-01-01T08:00:00.000Z"),
        endTime: new Date("1970-01-01T16:00:00.000Z"),
        active: true,
      },
      {
        dayOfWeek: 3,
        startTime: new Date("1970-01-01T08:00:00.000Z"),
        endTime: new Date("1970-01-01T16:00:00.000Z"),
        active: true,
      },
      {
        dayOfWeek: 5,
        startTime: new Date("1970-01-01T08:00:00.000Z"),
        endTime: new Date("1970-01-01T16:00:00.000Z"),
        active: true,
      },
    ],
  };

  const proA = await prisma.user.create({
    data: {
      name: "PH8 Pro A",
      email: `pro-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: "Casablanca",
          availability,
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
      name: "PH8 Pro B",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Electrician",
          city: "Casablanca",
          availability,
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

describe("PH8 intervention and payment state", () => {
  const clientA = () => identity(ids.clientA, AppRole.CLIENT, `client-a-${suffix}@test.handyhome.local`);
  const clientB = () => identity(ids.clientB, AppRole.CLIENT, `client-b-${suffix}@test.handyhome.local`);
  const proA = () => identity(ids.proA, AppRole.PROFESSIONAL, `pro-a-${suffix}@test.handyhome.local`);
  const proB = () => identity(ids.proB, AppRole.PROFESSIONAL, `pro-b-${suffix}@test.handyhome.local`);

  async function acceptedBooking() {
    const created = await createBookingForIdentity(
      clientA(),
      {
        providerId: ids.providerA,
        serviceId: ids.service,
        scheduledAt: nextSlot().toISOString(),
      },
      frozenNow,
    );
    return respondToBookingForIdentity(proA(), { bookingId: created.id, decision: "accept" });
  }

  async function quoteAcceptedBooking(amount = "180.00") {
    const booking = await acceptedBooking();
    await startDiagnosisForIdentity(proA(), { bookingId: booking.id });
    await completeDiagnosisForIdentity(proA(), {
      bookingId: booking.id,
      findings: "Kitchen tap washer is worn and needs replacement.",
    });
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount,
      notes: "Washer replacement and labour.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: quote.id, decision: "accept" });
    const loaded = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingDetailInclude,
    });
    return { booking: loaded, quote };
  }

  it("PH8-01: cannot start intervention without accepted quote", async () => {
    const booking = await acceptedBooking();
    await expect(startInterventionForIdentity(proA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "QUOTE_NOT_ACCEPTED",
    });
  });

  it("PH8-02: professional owning booking can start intervention after accepted quote", async () => {
    const { booking } = await quoteAcceptedBooking();
    const started = await startInterventionForIdentity(proA(), { bookingId: booking.id });
    expect(started.status).toBe(BookingStatus.INTERVENTION);
  });

  it("PH8-03: another professional cannot start intervention", async () => {
    const { booking } = await quoteAcceptedBooking();
    await expect(startInterventionForIdentity(proB(), { bookingId: booking.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("PH8-04: client cannot start intervention", async () => {
    const { booking } = await quoteAcceptedBooking();
    await expect(startInterventionForIdentity(clientA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "FORBIDDEN_ROLE",
    });
  });

  it("PH11: only the assigned professional can complete an intervention", async () => {
    const { booking } = await quoteAcceptedBooking();
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await expect(completeInterventionForIdentity(proB(), { bookingId: booking.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(completeInterventionForIdentity(clientA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "FORBIDDEN_ROLE",
    });
    const started = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(started.status).toBe(BookingStatus.INTERVENTION);
  });

  it("PH8-05 / 07 / 09 / 10 / 19 / 20: complete intervention creates MAD snapshot payment, no review", async () => {
    const { booking, quote } = await quoteAcceptedBooking("220.50");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    const completed = await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    expect(completed.status).toBe(BookingStatus.PAYMENT);
    expect(completed.payment?.status).toBe(PaymentStatus.PENDING);
    expect(completed.payment?.currency).toBe("MAD");
    expect(completed.payment?.quoteId).toBe(quote.id);
    expect(completed.payment?.amount.equals(quote.amount)).toBe(true);

    const quoteAfter = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    expect(quoteAfter.amount.equals(quote.amount)).toBe(true);
    expect(quoteAfter.status).toBe(QuoteStatus.ACCEPTED);
    expect(await prisma.review.count({ where: { bookingId: booking.id } })).toBe(0);
  });

  it("PH8-06: cannot complete intervention before it starts", async () => {
    const { booking } = await quoteAcceptedBooking();
    await expect(completeInterventionForIdentity(proA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "ILLEGAL_TRANSITION",
    });
  });

  it("PH8-08: payment cannot exist before accepted quote", async () => {
    const booking = await acceptedBooking();
    const loaded = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: bookingDetailInclude,
    });
    await expect(
      prisma.$transaction((tx) => createPendingPaymentInTransaction(tx, loaded)),
    ).rejects.toMatchObject({
      code: "QUOTE_NOT_ACCEPTED",
      message: "A payment can be created only after a quote is accepted.",
    });
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(0);
  });

  it("PH8-11 / 12: one payment per booking; double creation prevented", async () => {
    const { booking } = await quoteAcceptedBooking("90.00");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    await expect(completeInterventionForIdentity(proA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "ILLEGAL_TRANSITION",
    });
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(1);

    const accepted = booking.quotes.find((row) => row.status === QuoteStatus.ACCEPTED);
    await expect(
      prisma.payment.create({
        data: {
          bookingId: booking.id,
          quoteId: accepted!.id,
          amount: new Prisma.Decimal("1.00"),
          currency: "MAD",
          status: PaymentStatus.PENDING,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("PH8-13: payment cannot become PAID before intervention completion", async () => {
    const { booking } = await quoteAcceptedBooking();
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await expect(recordPaymentForIdentity(clientA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "ILLEGAL_TRANSITION",
      message: "Payment can be recorded only after the intervention is completed.",
    });
  });

  it("PH8-14 / 17: client records payment; browser amount is ignored", async () => {
    const { booking, quote } = await quoteAcceptedBooking("175.00");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    const recorded = await recordPaymentForIdentity(clientA(), {
      bookingId: booking.id,
      amount: "9999.00",
    });
    expect(recorded.status).toBe(PaymentStatus.PAID);
    expect(recorded.amount.equals(quote.amount)).toBe(true);
    const loaded = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { payment: true },
    });
    expect(loaded.status).toBe(BookingStatus.COMPLETED);
    expect(loaded.payment?.status).toBe(PaymentStatus.PAID);
  });

  it("PH8-15: payment cannot return from PAID to PENDING", async () => {
    const { booking } = await quoteAcceptedBooking("80.00");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    await recordPaymentForIdentity(clientA(), { bookingId: booking.id });
    await expect(recordPaymentForIdentity(clientA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "ALREADY_RECORDED",
    });
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { bookingId: booking.id },
    });
    expect(payment.status).toBe(PaymentStatus.PAID);
  });

  it("PH8-16: another user cannot modify payment", async () => {
    const { booking } = await quoteAcceptedBooking("60.00");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    await expect(recordPaymentForIdentity(clientB(), { bookingId: booking.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(recordPaymentForIdentity(proA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "FORBIDDEN_ROLE",
    });
  });

  it("PH8-18: no payment provider API is required", async () => {
    expect(() => getPaymentService()).toThrow(/Payment provider is not locked/);
    const { booking } = await quoteAcceptedBooking("55.00");
    await startInterventionForIdentity(proA(), { bookingId: booking.id });
    await completeInterventionForIdentity(proA(), { bookingId: booking.id });
    const recorded = await recordPaymentForIdentity(clientA(), { bookingId: booking.id });
    expect(recorded.status).toBe(PaymentStatus.PAID);
    expect(recorded.providerReference).toBeNull();
  });
});
