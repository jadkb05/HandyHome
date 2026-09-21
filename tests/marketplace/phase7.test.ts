import { BookingStatus, Prisma, PrismaClient, QuoteStatus, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/errors";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { createBookingForIdentity } from "@/features/bookings/create";
import { respondToBookingForIdentity } from "@/features/bookings/transitions";
import {
  completeDiagnosisForIdentity,
  getCompletedDiagnosisForClient,
  startDiagnosisForIdentity,
} from "@/features/diagnosis/service";
import { createQuoteForIdentity, getQuotesForClient, respondToQuoteForIdentity } from "@/features/quotes/service";
import { zonedCivilToUtc } from "@/lib/datetime";

const prisma = new PrismaClient();
const suffix = `ph7-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const days = ["2026-10-05", "2026-10-07"];
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
    data: { name: "PH7 Plumbing", slug: `plumbing-${suffix}` },
  });
  ids.service = service.id;

  const clientA = await prisma.user.create({
    data: {
      name: "PH7 Client A",
      email: `client-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.clientA = clientA.id;
  const clientB = await prisma.user.create({
    data: {
      name: "PH7 Client B",
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
    ],
  };

  const proA = await prisma.user.create({
    data: {
      name: "PH7 Pro A",
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
      name: "PH7 Pro B",
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

describe("PH7 diagnosis and quotes", () => {
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

  async function diagnosedBooking() {
    const booking = await acceptedBooking();
    await startDiagnosisForIdentity(proA(), { bookingId: booking.id });
    return completeDiagnosisForIdentity(proA(), {
      bookingId: booking.id,
      findings: "Kitchen tap washer is worn and needs replacement.",
    });
  }

  it("PH7-01: professional can create diagnosis for own accepted booking", async () => {
    const booking = await acceptedBooking();
    const started = await startDiagnosisForIdentity(proA(), { bookingId: booking.id });
    expect(started.status).toBe(BookingStatus.DIAGNOSIS);
    expect(started.diagnosis?.status).toBe("DRAFT");
  });

  it("PH7-02: professional cannot diagnose another professional's booking", async () => {
    const booking = await acceptedBooking();
    await expect(startDiagnosisForIdentity(proB(), { bookingId: booking.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("PH7-03: client cannot create diagnosis", async () => {
    const booking = await acceptedBooking();
    await expect(startDiagnosisForIdentity(clientA(), { bookingId: booking.id })).rejects.toMatchObject({
      code: "FORBIDDEN_ROLE",
    });
  });

  it("PH7-04: diagnosis can be completed", async () => {
    const booking = await acceptedBooking();
    await startDiagnosisForIdentity(proA(), { bookingId: booking.id });
    const completed = await completeDiagnosisForIdentity(proA(), {
      bookingId: booking.id,
      findings: "Pipe joint needs resealing under the sink.",
    });
    expect(completed.diagnosis?.status).toBe("COMPLETED");
    expect(completed.diagnosis?.findings).toContain("resealing");
  });

  it("PH7-05: quote creation fails without completed diagnosis", async () => {
    const booking = await acceptedBooking();
    await expect(
      createQuoteForIdentity(proA(), {
        bookingId: booking.id,
        amount: "150.00",
        notes: "Tap repair",
      }),
    ).rejects.toMatchObject({
      code: "DIAGNOSIS_INCOMPLETE",
      message: "Complete the diagnosis before creating a quote.",
    });
  });

  it("PH7-06 / 07: professional can create quote v1 after completed diagnosis", async () => {
    const booking = await diagnosedBooking();
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "180.50",
      notes: "Washer replacement and labour.",
    });
    expect(quote.version).toBe(1);
    expect(quote.status).toBe(QuoteStatus.SENT);
    expect(quote.currency).toBe("MAD");
    expect(quote.amount.toString()).toBe("180.5");
    const loaded = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(loaded.status).toBe(BookingStatus.QUOTE_PENDING);
  });

  it("PH7-09 / 10: client can view own quotes, not another client's", async () => {
    const booking = await diagnosedBooking();
    await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "90.00",
      notes: "Inspection follow-up.",
    });
    const own = await getQuotesForClient(clientA(), booking.id);
    expect(own).toHaveLength(1);
    const diagnosis = await getCompletedDiagnosisForClient(clientA(), booking.id);
    expect(diagnosis?.findings).toContain("washer");
    await expect(getQuotesForClient(clientB(), booking.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getCompletedDiagnosisForClient(clientB(), booking.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("PH7-11: client can accept SENT quote", async () => {
    const booking = await diagnosedBooking();
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "200.00",
      notes: "Full repair.",
    });
    const accepted = await respondToQuoteForIdentity(clientA(), {
      quoteId: quote.id,
      decision: "accept",
    });
    expect(accepted.status).toBe(QuoteStatus.ACCEPTED);
    const loaded = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { payment: true, review: true, quotes: true },
    });
    expect(loaded.status).toBe(BookingStatus.QUOTE_ACCEPTED);
    expect(loaded.status).not.toBe(BookingStatus.INTERVENTION);
    expect(loaded.status).not.toBe(BookingStatus.COMPLETED);
    expect(loaded.payment).toBeNull();
    expect(loaded.review).toBeNull();
  });

  it("PH7-12 / 13 / 14 / 08: decline keeps history and next quote is v2", async () => {
    const booking = await diagnosedBooking();
    const first = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "300.00",
      notes: "First offer.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: first.id, decision: "decline" });
    const declined = await prisma.quote.findUniqueOrThrow({ where: { id: first.id } });
    expect(declined.status).toBe(QuoteStatus.REJECTED);

    const second = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "250.00",
      notes: "Revised offer.",
    });
    expect(second.version).toBe(2);
    expect(second.status).toBe(QuoteStatus.SENT);
    const history = await getQuotesForClient(clientA(), booking.id);
    expect(history.map((quote) => quote.version)).toEqual([1, 2]);
    expect(history[0]?.status).toBe(QuoteStatus.REJECTED);
  });

  it("PH7-15: two accepted quotes cannot exist for one booking", async () => {
    const booking = await diagnosedBooking();
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "110.00",
      notes: "Accepted path.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: quote.id, decision: "accept" });
    await expect(
      prisma.quote.create({
        data: {
          bookingId: booking.id,
          amount: new Prisma.Decimal("120.00"),
          currency: "MAD",
          notes: "Second accepted",
          status: QuoteStatus.ACCEPTED,
          version: 2,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      createQuoteForIdentity(proA(), {
        bookingId: booking.id,
        amount: "130.00",
        notes: "Should fail.",
      }),
    ).rejects.toMatchObject({ code: "ALREADY_ACCEPTED" });
  });

  it("PH7-16: professional cannot accept quote as client", async () => {
    const booking = await diagnosedBooking();
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "75.00",
      notes: "Small job.",
    });
    await expect(
      respondToQuoteForIdentity(proA(), { quoteId: quote.id, decision: "accept" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN_ROLE" });
  });

  it("PH7-17: professional cannot create quote for another provider's booking", async () => {
    const booking = await diagnosedBooking();
    await expect(
      createQuoteForIdentity(proB(), {
        bookingId: booking.id,
        amount: "50.00",
        notes: "Not mine.",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("PH7-18 / 19 / 20: accepted quote does not create payment, review, or intervention", async () => {
    const booking = await diagnosedBooking();
    const quote = await createQuoteForIdentity(proA(), {
      bookingId: booking.id,
      amount: "99.00",
      notes: "Final check.",
    });
    await respondToQuoteForIdentity(clientA(), { quoteId: quote.id, decision: "accept" });
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(0);
    expect(await prisma.review.count({ where: { bookingId: booking.id } })).toBe(0);
    const loaded = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(loaded.status).toBe(BookingStatus.QUOTE_ACCEPTED);
  });
});
