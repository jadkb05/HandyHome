import { Prisma, PrismaClient, UserRole, BookingStatus, QuoteStatus, PaymentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";

const ids = {
  client: "",
  professional: "",
  otherProfessional: "",
  provider: "",
  otherProvider: "",
  service: "",
};

async function cleanup() {
  await prisma.payment.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.quote.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.diagnosis.deleteMany({
    where: { booking: { client: { email: { contains: suffix } } } },
  });
  await prisma.review.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.booking.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.favorite.deleteMany({
    where: { client: { email: { contains: suffix } } },
  });
  await prisma.providerService.deleteMany({
    where: { service: { slug: { contains: suffix } } },
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

  const client = await prisma.user.create({
    data: {
      name: "Test Client",
      email: `client-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.client = client.id;

  const professional = await prisma.user.create({
    data: {
      name: "Test Professional",
      email: `pro-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Test",
          city: "Casablanca",
          latitude: 33.5731,
          longitude: -7.5898,
          verified: false,
        },
      },
    },
    include: { provider: true },
  });
  ids.professional = professional.id;
  ids.provider = professional.provider!.id;

  const other = await prisma.user.create({
    data: {
      name: "Other Professional",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Test",
          city: "Casablanca",
          verified: false,
        },
      },
    },
    include: { provider: true },
  });
  ids.otherProfessional = other.id;
  ids.otherProvider = other.provider!.id;

  const service = await prisma.service.create({
    data: {
      name: "Test-only fixture (not a catalog category)",
      slug: `test-only-${suffix}`,
    },
  });
  ids.service = service.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("database invariants", () => {
  it("rejects duplicate user emails", async () => {
    await expect(
      prisma.user.create({
        data: {
          name: "Dup",
          email: `client-${suffix}@test.handyhome.local`,
          passwordHash: hash,
          role: UserRole.CLIENT,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it("enforces one provider per professional user", async () => {
    const provider = await prisma.provider.findUnique({ where: { userId: ids.professional } });
    expect(provider?.userId).toBe(ids.professional);

    await expect(
      prisma.provider.create({
        data: {
          userId: ids.professional,
          profession: "Duplicate",
          city: "Casablanca",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("enforces unique provider-service pairs", async () => {
    await prisma.providerService.create({
      data: { providerId: ids.provider, serviceId: ids.service },
    });
    await expect(
      prisma.providerService.create({
        data: { providerId: ids.provider, serviceId: ids.service },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("enforces unique favorites", async () => {
    await prisma.favorite.create({
      data: { clientId: ids.client, providerId: ids.provider },
    });
    await expect(
      prisma.favorite.create({
        data: { clientId: ids.client, providerId: ids.provider },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("preserves quote history as 1→N with versions", async () => {
    const booking = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
        status: BookingStatus.QUOTE_PENDING,
      },
    });

    const first = await prisma.quote.create({
      data: {
        bookingId: booking.id,
        amount: new Prisma.Decimal("100.00"),
        currency: "MAD",
        status: QuoteStatus.SENT,
        version: 1,
      },
    });
    const second = await prisma.quote.create({
      data: {
        bookingId: booking.id,
        amount: new Prisma.Decimal("120.00"),
        currency: "MAD",
        status: QuoteStatus.DRAFT,
        version: 2,
      },
    });

    const quotes = await prisma.quote.findMany({
      where: { bookingId: booking.id },
      orderBy: { version: "asc" },
    });
    expect(quotes).toHaveLength(2);
    expect(quotes.map((quote) => quote.id)).toEqual([first.id, second.id]);
    expect(quotes[0]?.amount.toString()).toBe("100");
  });

  it("rejects a second accepted quote on the same booking", async () => {
    const booking = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
      },
    });
    await prisma.quote.create({
      data: {
        bookingId: booking.id,
        amount: new Prisma.Decimal("80.00"),
        currency: "MAD",
        status: QuoteStatus.ACCEPTED,
        version: 1,
      },
    });
    await expect(
      prisma.quote.create({
        data: {
          bookingId: booking.id,
          amount: new Prisma.Decimal("90.00"),
          currency: "MAD",
          status: QuoteStatus.ACCEPTED,
          version: 2,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("links bookings to the assigned provider and client", async () => {
    const booking = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
      },
    });
    const loaded = await prisma.booking.findUniqueOrThrow({
      where: { id: booking.id },
      include: { client: true, provider: true },
    });
    expect(loaded.clientId).toBe(ids.client);
    expect(loaded.provider.userId).toBe(ids.professional);
  });

  it("links one payment to a booking and quote without card fields", async () => {
    const booking = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
      },
    });
    const quote = await prisma.quote.create({
      data: {
        bookingId: booking.id,
        amount: new Prisma.Decimal("150.00"),
        currency: "MAD",
        status: QuoteStatus.ACCEPTED,
        version: 1,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        quoteId: quote.id,
        amount: new Prisma.Decimal("150.00"),
        currency: "MAD",
        status: PaymentStatus.PENDING,
      },
    });
    expect(payment.bookingId).toBe(booking.id);
    expect("cardNumber" in payment).toBe(false);
    expect("cvv" in payment).toBe(false);

    await expect(
      prisma.payment.create({
        data: {
          bookingId: booking.id,
          quoteId: quote.id,
          amount: new Prisma.Decimal("150.00"),
          currency: "MAD",
          status: PaymentStatus.PENDING,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("prevents two appointments for the same provider at the same scheduledAt", async () => {
    const scheduledAt = new Date("2026-10-01T09:00:00.000Z");
    await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
        scheduledAt,
        status: BookingStatus.APPOINTMENT_SCHEDULED,
      },
    });
    await expect(
      prisma.booking.create({
        data: {
          clientId: ids.client,
          providerId: ids.provider,
          serviceId: ids.service,
          scheduledAt,
          status: BookingStatus.APPOINTMENT_SCHEDULED,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("allows the same scheduledAt for a different provider", async () => {
    const scheduledAt = new Date("2026-10-02T09:00:00.000Z");
    await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
        scheduledAt,
      },
    });
    const other = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.otherProvider,
        serviceId: ids.service,
        scheduledAt,
      },
    });
    expect(other.providerId).toBe(ids.otherProvider);
  });

  it("allows only one review per booking", async () => {
    const booking = await prisma.booking.create({
      data: {
        clientId: ids.client,
        providerId: ids.provider,
        serviceId: ids.service,
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        clientId: ids.client,
        providerId: ids.provider,
        rating: 5,
        comment: "On time.",
      },
    });
    await expect(
      prisma.review.create({
        data: {
          bookingId: booking.id,
          clientId: ids.client,
          providerId: ids.provider,
          rating: 4,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects deleting a user who still owns a provider (restrict)", async () => {
    await expect(prisma.user.delete({ where: { id: ids.professional } })).rejects.toMatchObject({
      code: "P2003",
    });
  });
});
