import { BookingStatus, PaymentStatus, PrismaClient, UserRole } from "@prisma/client";
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
import { recordPaymentForIdentity } from "@/features/payments/service";
import { getProfessionalById } from "@/features/professionals/queries";
import { createQuoteForIdentity, respondToQuoteForIdentity } from "@/features/quotes/service";
import { formatAverageRating } from "@/features/reviews/rating";
import { listPublicReviewsForProvider, PUBLIC_REVIEW_FIELDS } from "@/features/reviews/queries";
import { createReviewForIdentity } from "@/features/reviews/service";
import { zonedCivilToUtc } from "@/lib/datetime";

const prisma = new PrismaClient();
const suffix = `ph9-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";
const frozenNow = new Date("2026-10-04T12:00:00.000Z");
const findings = `PH9 secret findings ${suffix}`;

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
  await prisma.review.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.payment.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.quote.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
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
    data: { name: "PH9 Plumbing", slug: `plumbing-${suffix}` },
  });
  ids.service = service.id;
  const clientA = await prisma.user.create({
    data: {
      name: "PH9 Client A",
      email: `client-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientA = clientA.id;
  const clientB = await prisma.user.create({
    data: {
      name: "PH9 Client B",
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
      name: "PH9 Pro A",
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
      name: "PH9 Pro B",
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

describe("PH9 reviews and ratings", () => {
  const clientA = () => identity(ids.clientA, AppRole.CLIENT, `client-a-${suffix}@test.handyhome.local`);
  const clientB = () => identity(ids.clientB, AppRole.CLIENT, `client-b-${suffix}@test.handyhome.local`);
  const proA = () => identity(ids.proA, AppRole.PROFESSIONAL, `pro-a-${suffix}@test.handyhome.local`);

  async function paidBooking(amount = "180.00") {
    const created = await createBookingForIdentity(
      clientA(),
      {
        providerId: ids.providerA,
        serviceId: ids.service,
        scheduledAt: nextSlot().toISOString(),
      },
      frozenNow,
    );
    await respondToBookingForIdentity(proA(), { bookingId: created.id, decision: "accept" });
    await startDiagnosisForIdentity(proA(), { bookingId: created.id });
    await completeDiagnosisForIdentity(proA(), { bookingId: created.id, findings });
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: created.id,
      amount,
      notes: "Washer replacement and labour.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: quote.id, decision: "accept" });
    await startInterventionForIdentity(proA(), { bookingId: created.id });
    await completeInterventionForIdentity(proA(), { bookingId: created.id });
    await recordPaymentForIdentity(clientA(), { bookingId: created.id });
    return prisma.booking.findUniqueOrThrow({
      where: { id: created.id },
      include: bookingDetailInclude,
    });
  }

  it("PH9-01 / 07 / 12 / 14: client can review own COMPLETED + PAID booking", async () => {
    const booking = await paidBooking();
    const review = await createReviewForIdentity(clientA(), {
      bookingId: booking.id,
      rating: 1,
      comment: "The plumber explained the repair clearly.",
    });
    expect(review.bookingId).toBe(booking.id);
    expect(review.clientId).toBe(ids.clientA);
    expect(review.providerId).toBe(ids.providerA);
    expect(review.rating).toBe(1);
    expect(review.comment).toContain("explained");
  });

  it("PH9-02: client cannot review if payment is not PAID even when booking is COMPLETED", async () => {
    const booking = await paidBooking();
    await prisma.payment.update({
      where: { bookingId: booking.id },
      data: { status: PaymentStatus.PENDING },
    });
    await expect(createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 5 })).rejects.toMatchObject({
      code: "PAYMENT_REQUIRED",
      message: "Payment must be completed before leaving a review.",
    });
  });

  it("PH9-03: client cannot review an INTERVENTION booking", async () => {
    const booking = await paidBooking();
    await prisma.review.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.INTERVENTION },
    });
    await expect(createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 5 })).rejects.toMatchObject({
      code: "ILLEGAL_TRANSITION",
    });
  });

  it("PH9-04: client cannot review a payment-pending booking", async () => {
    const created = await createBookingForIdentity(
      clientA(),
      {
        providerId: ids.providerA,
        serviceId: ids.service,
        scheduledAt: nextSlot().toISOString(),
      },
      frozenNow,
    );
    await respondToBookingForIdentity(proA(), { bookingId: created.id, decision: "accept" });
    await startDiagnosisForIdentity(proA(), { bookingId: created.id });
    await completeDiagnosisForIdentity(proA(), { bookingId: created.id, findings });
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: created.id,
      amount: "70.00",
      notes: "Pending payment path.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: quote.id, decision: "accept" });
    await startInterventionForIdentity(proA(), { bookingId: created.id });
    await completeInterventionForIdentity(proA(), { bookingId: created.id });
    await expect(createReviewForIdentity(clientA(), { bookingId: created.id, rating: 5 })).rejects.toMatchObject({
      code: "ILLEGAL_TRANSITION",
    });
  });

  it("PH9-05: client cannot review another client's booking", async () => {
    const booking = await paidBooking();
    await expect(createReviewForIdentity(clientB(), { bookingId: booking.id, rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("PH9-06: professional cannot create a review", async () => {
    const booking = await paidBooking();
    await expect(createReviewForIdentity(proA(), { bookingId: booking.id, rating: 5 })).rejects.toMatchObject({
      code: "FORBIDDEN_ROLE",
    });
  });

  it("PH9-08 / 13: rating 5 is valid and whitespace-only comment is stored as empty", async () => {
    const booking = await paidBooking();
    const review = await createReviewForIdentity(clientA(), {
      bookingId: booking.id,
      rating: 5,
      comment: "   ",
    });
    expect(review.rating).toBe(5);
    expect(review.comment).toBeNull();
  });

  it("PH9-09 / 10 / 11: invalid ratings are rejected", async () => {
    const booking = await paidBooking();
    await expect(createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 0 })).rejects.toMatchObject({
      code: "INVALID_RATING",
    });
    await expect(createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 6 })).rejects.toMatchObject({
      code: "INVALID_RATING",
    });
    await expect(createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 4.5 })).rejects.toMatchObject({
      code: "INVALID_RATING",
    });
    await expect(
      createReviewForIdentity(clientA(), { bookingId: booking.id, rating: "4.5" }),
    ).rejects.toMatchObject({ code: "INVALID_RATING" });
  });

  it("PH9-15 / 16: second review is rejected by app and unique constraint", async () => {
    const booking = await paidBooking();
    await createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 4, comment: "First." });
    await expect(
      createReviewForIdentity(clientA(), { bookingId: booking.id, rating: 3, comment: "Second." }),
    ).rejects.toMatchObject({ code: "ALREADY_REVIEWED" });
    await expect(
      prisma.review.create({
        data: {
          bookingId: booking.id,
          clientId: ids.clientA,
          providerId: ids.providerA,
          rating: 2,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("PH9-17 / 18 / 19 / 20: public summary uses real reviews and hides private data", async () => {
    const first = await paidBooking("180.00");
    const second = await paidBooking("95.00");
    await createReviewForIdentity(clientA(), {
      bookingId: first.id,
      rating: 5,
      comment: "Excellent result.",
    });
    await createReviewForIdentity(clientA(), { bookingId: second.id, rating: 4 });

    const summary = await listPublicReviewsForProvider(ids.providerA);
    expect(summary.count).toBeGreaterThanOrEqual(2);
    const expected =
      summary.reviews.reduce((total, review) => total + review.rating, 0) / summary.count;
    expect(summary.average).toBeCloseTo(expected);
    expect(summary.averageLabel).toBe(formatAverageRating(expected));
    expect(formatAverageRating(4.6666)).toBe("4.7");
    expect(summary.reviews[0] && Object.keys(summary.reviews[0]).sort()).toEqual(
      [...PUBLIC_REVIEW_FIELDS].sort(),
    );

    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain(findings);
    expect(serialized).not.toContain("180.00");
    expect(serialized).not.toContain(`client-a-${suffix}@test.handyhome.local`);

    const empty = await listPublicReviewsForProvider(ids.providerB);
    expect(empty.count).toBe(0);
    expect(empty.average).toBeNull();
    expect(empty.averageLabel).toBeNull();

    const profile = await getProfessionalById(ids.providerA);
    expect(profile && "email" in profile.user).toBe(false);
    expect(profile && "diagnosis" in profile).toBe(false);
    expect(profile && "payment" in profile).toBe(false);
  });
});
