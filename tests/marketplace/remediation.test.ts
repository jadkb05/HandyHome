import { BookingStatus, DiagnosisStatus, PrismaClient, QuoteStatus, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/errors";
import { UserRole as AppRole, type AuthIdentity } from "@/lib/auth/types";
import { createBookingForIdentity } from "@/features/bookings/create";
import { bookingStatusHint } from "@/features/bookings/status";
import { respondToBookingForIdentity } from "@/features/bookings/transitions";
import { startDiagnosisForIdentity } from "@/features/diagnosis/service";
import { startInterventionForIdentity } from "@/features/intervention/service";
import {
  listProfessionals,
  updateProviderProfileForIdentity,
} from "@/features/professionals";
import {
  ProfileValidationError,
  publicProfileError,
} from "@/features/professionals/errors";
import { respondToQuoteForIdentity } from "@/features/quotes/service";
import { listPublicReviewsForProvider } from "@/features/reviews";
import { publicAuthorName } from "@/features/reviews/display-name";
import { reviewSummariesFor } from "@/features/reviews/summary";
import { listSearchLocations, parseSearchParams, searchProfessionals } from "@/features/search";
import { getServiceBySlug } from "@/features/services";

const prisma = new PrismaClient();
const suffix = `rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = (label: string) => `${label}-${suffix}@test.handyhome.local`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";

const ids = {
  service: "",
  clientA: "",
  clientB: "",
  proMain: "",
  provMain: "",
  proIncomplete: "",
  provIncomplete: "",
  proNoService: "",
  provNoService: "",
};
const serviceSlug = `remediation-${suffix}`;

function identity(userId: string, role: AuthIdentity["role"], label: string): AuthIdentity {
  return { userId, email: email(label), name: label, role };
}
const clientA = () => identity(ids.clientA, AppRole.CLIENT, "client-a");
const clientB = () => identity(ids.clientB, AppRole.CLIENT, "client-b");
const proMain = () => identity(ids.proMain, AppRole.PROFESSIONAL, "pro-main");
const proIncomplete = () => identity(ids.proIncomplete, AppRole.PROFESSIONAL, "pro-incomplete");

let slotCounter = 0;
function futureSlot(): Date {
  slotCounter += 1;
  return new Date(Date.UTC(2031, 0, 1, 8, 0, 0) + slotCounter * 3_600_000);
}

async function makeBooking(status: BookingStatus, clientId = ids.clientA) {
  return prisma.booking.create({
    data: {
      clientId,
      providerId: ids.provMain,
      serviceId: ids.service,
      scheduledAt: futureSlot(),
      status,
    },
  });
}

async function cleanup() {
  const users = { email: { contains: suffix } };
  const bookings = {
    OR: [{ client: users }, { provider: { user: users } }],
  };
  await prisma.review.deleteMany({ where: { booking: bookings } });
  await prisma.payment.deleteMany({ where: { booking: bookings } });
  await prisma.quote.deleteMany({ where: { booking: bookings } });
  await prisma.diagnosis.deleteMany({ where: { booking: bookings } });
  await prisma.booking.deleteMany({ where: bookings });
  await prisma.providerService.deleteMany({ where: { provider: { user: users } } });
  await prisma.availability.deleteMany({ where: { provider: { user: users } } });
  await prisma.provider.deleteMany({ where: { user: users } });
  await prisma.session.deleteMany({ where: { user: users } });
  await prisma.account.deleteMany({ where: { user: users } });
  await prisma.user.deleteMany({ where: users });
  await prisma.service.deleteMany({ where: { slug: serviceSlug } });
}

beforeAll(async () => {
  await cleanup();
  const service = await prisma.service.create({ data: { name: "Remediation service", slug: serviceSlug } });
  ids.service = service.id;

  const client = async (label: string, name: string) =>
    (
      await prisma.user.create({
        data: { name, email: email(label), passwordHash: hash, role: UserRole.CLIENT },
      })
    ).id;
  ids.clientA = await client("client-a", "Karim Haddad");
  ids.clientB = await client("client-b", "Other Client");

  const pro = async (
    label: string,
    provider: { profession: string; city: string; withService: boolean; withAvailability?: boolean },
  ) => {
    const user = await prisma.user.create({
      data: {
        name: `Pro ${label}`,
        email: email(label),
        passwordHash: hash,
        role: UserRole.PROFESSIONAL,
        provider: {
          create: {
            profession: provider.profession,
            city: provider.city,
            latitude: 33.573,
            longitude: -7.589,
            services: provider.withService ? { create: { serviceId: ids.service } } : undefined,
            availability: provider.withAvailability
              ? {
                  create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
                    dayOfWeek,
                    startTime: new Date(Date.UTC(1970, 0, 1, 8)),
                    endTime: new Date(Date.UTC(1970, 0, 1, 20)),
                  })),
                }
              : undefined,
          },
        },
      },
      include: { provider: true },
    });
    return { userId: user.id, providerId: user.provider!.id };
  };
  const main = await pro("pro-main", {
    profession: "Plumber",
    city: `City-${suffix}`,
    withService: true,
    withAvailability: true,
  });
  ids.proMain = main.userId;
  ids.provMain = main.providerId;
  const incomplete = await pro("pro-incomplete", {
    profession: "Not set yet",
    city: "Not set yet",
    withService: false,
    withAvailability: true,
  });
  ids.proIncomplete = incomplete.userId;
  ids.provIncomplete = incomplete.providerId;
  const noService = await pro("pro-noservice", {
    profession: "Electrician",
    city: `City-${suffix}`,
    withService: false,
    withAvailability: true,
  });
  ids.proNoService = noService.userId;
  ids.provNoService = noService.providerId;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("H1 incomplete professionals are not public", () => {
  it("is excluded from listings, search, service pages and locations", async () => {
    const listed = (await listProfessionals()).map((provider) => provider.id);
    expect(listed).toContain(ids.provMain);
    expect(listed).not.toContain(ids.provIncomplete);
    expect(listed).not.toContain(ids.provNoService);

    const searched = (await searchProfessionals(parseSearchParams({}))).map((item) => item.id);
    expect(searched).not.toContain(ids.provIncomplete);
    expect(searched).not.toContain(ids.provNoService);

    const service = await getServiceBySlug(serviceSlug);
    expect(service?.providers.map((item) => item.providerId)).toEqual([ids.provMain]);

    const locations = await listSearchLocations();
    expect(locations.cities).not.toContain("Not set yet");
  });

  it("cannot be booked, even with availability listed", async () => {
    const scheduledAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
    for (const providerId of [ids.provIncomplete, ids.provNoService]) {
      await expect(
        createBookingForIdentity(clientA(), { providerId, serviceId: ids.service, scheduledAt }),
      ).rejects.toMatchObject({ code: "PROVIDER_INELIGIBLE" });
    }
    expect(await prisma.booking.count({ where: { providerId: ids.provIncomplete } })).toBe(0);
  });

  it("becomes public once profession, city and a service are set", async () => {
    await updateProviderProfileForIdentity(proIncomplete(), {
      profession: "Electrician",
      city: "Casablanca",
      description: "",
      serviceIds: [ids.service],
    });
    const listed = (await listProfessionals()).map((provider) => provider.id);
    expect(listed).toContain(ids.provIncomplete);
    const searched = await searchProfessionals(parseSearchParams({ service: serviceSlug }));
    expect(searched.map((item) => item.id)).toContain(ids.provIncomplete);
  });
});

describe("H2 profile validation and errors", () => {
  it("returns friendly field messages, never a raw Zod dump", async () => {
    const before = await prisma.provider.findUniqueOrThrow({ where: { id: ids.provNoService } });
    const error = await updateProviderProfileForIdentity(identity(ids.proNoService, AppRole.PROFESSIONAL, "pro-noservice"), {
      profession: "A",
      city: "",
      description: "x".repeat(501),
      serviceIds: [],
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProfileValidationError);
    const fields = (error as ProfileValidationError).fieldErrors;
    expect(fields.profession).toMatch(/profession/i);
    expect(fields.city).toMatch(/city/i);
    expect(fields.description).toMatch(/500/);
    expect(fields.services).toMatch(/at least one service/i);
    expect((error as Error).message).not.toMatch(/[{}\[\]]|"code"|invalid_type/);
    const after = await prisma.provider.findUniqueOrThrow({ where: { id: ids.provNoService } });
    expect(after.profession).toBe(before.profession);
  });

  it("rejects the registration placeholder and unknown services", async () => {
    const pro = identity(ids.proNoService, AppRole.PROFESSIONAL, "pro-noservice");
    await expect(
      updateProviderProfileForIdentity(pro, { profession: "Not set yet", city: "Rabat" }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
    await expect(
      updateProviderProfileForIdentity(pro, { profession: "Plumber", city: "Rabat", serviceIds: ["nope"] }),
    ).rejects.toBeInstanceOf(ProfileValidationError);
  });

  it("maps unexpected and auth errors to safe messages", () => {
    const prismaLike = new Error(
      "Invalid `prisma.provider.update()` invocation: Unique constraint failed on the fields: (`userId`)",
    );
    const mapped = publicProfileError(prismaLike);
    expect(mapped.message).toBe("The profile could not be saved. Try again.");
    expect(JSON.stringify(mapped)).not.toMatch(/prisma|constraint|userId/i);
    expect(publicProfileError(new UnauthorizedError()).message).toMatch(/sign in/i);
    expect(publicProfileError(new ForbiddenError("internal detail")).message).not.toMatch(/internal/);
    expect(publicProfileError("a string").message).toBe("The profile could not be saved. Try again.");
  });
});

describe("privacy and registration", () => {
  it("shows first name and last initial, never an email-derived name", () => {
    expect(publicAuthorName("Karim Haddad")).toBe("Karim H.");
    expect(publicAuthorName("  Amal  ben   youssef ")).toBe("Amal Y.");
    expect(publicAuthorName("Madonna")).toBe("Madonna");
    expect(publicAuthorName("jad.kb@gmail.com")).toBeNull();
    expect(publicAuthorName("   ")).toBeNull();
  });

  it("publishes reviews without the client's full name and aggregates ratings", async () => {
    for (const rating of [5, 4]) {
      const booking = await makeBooking(BookingStatus.COMPLETED);
      await prisma.review.create({
        data: { bookingId: booking.id, clientId: ids.clientA, providerId: ids.provMain, rating },
      });
    }
    const summary = await listPublicReviewsForProvider(ids.provMain);
    expect(summary.reviews.every((review) => review.authorName === "Karim H.")).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("Haddad");

    const aggregate = (await reviewSummariesFor([ids.provMain, ids.provNoService])).get(ids.provMain);
    expect(aggregate).toMatchObject({ count: 2, average: 4.5, averageLabel: "4.5" });
    const found = (await searchProfessionals(parseSearchParams({ service: serviceSlug }))).find(
      (item) => item.id === ids.provMain,
    );
    expect(found).toMatchObject({ reviewCount: 2, averageLabel: "4.5" });
  });

  it("validates name and phone on the server at registration", async () => {
    const register = (name: string, phone?: string) =>
      auth.api.signUpEmail({
        body: {
          email: email(`reg-${Math.random().toString(36).slice(2, 7)}`),
          password: "CorrectHorse123!",
          name,
          role: "CLIENT",
          ...(phone ? { phone } : {}),
        } as never,
      });
    await expect(register("A")).rejects.toThrow();
    await expect(register("x".repeat(81))).rejects.toThrow();
    await expect(register("someone@example.com")).rejects.toThrow();
    await expect(register("Valid Name", "not-a-phone")).rejects.toThrow();
    const ok = await register("  Valid Name  ", "+212 600 000 000");
    expect(ok.user.name).toBe("Valid Name");
  });
});

describe("search ranking is applied before the row limit", () => {
  it("returns the nearest professional even when 50+ others sort first by name", async () => {
    const nearSlug = `near-${suffix}`;
    const near = await prisma.service.create({ data: { name: "Near service", slug: nearSlug } });
    for (let index = 0; index < 52; index += 1) {
      const far = index === 51 ? 0 : 0.2; // index 51 sits at the origin, the rest ~20 km away
      await prisma.user.create({
        data: {
          name: index === 51 ? "Zzz Nearest" : `Aaa Far ${String(index).padStart(2, "0")}`,
          email: email(`far-${index}`),
          passwordHash: hash,
          role: UserRole.PROFESSIONAL,
          provider: {
            create: {
              profession: "Plumber",
              city: "Casablanca",
              latitude: 33.573 + far,
              longitude: -7.589,
              services: { create: { serviceId: near.id } },
            },
          },
        },
      });
    }
    try {
      const results = await searchProfessionals(
        parseSearchParams({ service: nearSlug, sort: "nearest", lat: "33.573", lng: "-7.589" }),
      );
      expect(results).toHaveLength(50);
      expect(results[0]?.name).toBe("Zzz Nearest");
      expect(results[0]?.distanceKm).toBeLessThan(0.1);
    } finally {
      await prisma.providerService.deleteMany({ where: { serviceId: near.id } });
      await prisma.provider.deleteMany({ where: { user: { email: { contains: `far-` }, AND: { email: { contains: suffix } } } } });
      await prisma.user.deleteMany({ where: { email: { contains: `far-` }, AND: { email: { contains: suffix } } } });
      await prisma.service.delete({ where: { id: near.id } });
    }
  });
});

describe("conditional state transitions", () => {
  it("lets only one of two concurrent accept/decline requests win", async () => {
    const booking = await makeBooking(BookingStatus.REQUESTED);
    const results = await Promise.allSettled([
      respondToBookingForIdentity(proMain(), { bookingId: booking.id, decision: "accept" }),
      respondToBookingForIdentity(proMain(), { bookingId: booking.id, decision: "reject" }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ code: "ILLEGAL_TRANSITION" });
    const stored = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(stored.status).toBe(
      (fulfilled[0] as PromiseFulfilledResult<{ status: BookingStatus }>).value.status,
    );
  });

  it("starts a diagnosis exactly once under concurrency", async () => {
    const booking = await makeBooking(BookingStatus.ACCEPTED);
    const results = await Promise.allSettled([
      startDiagnosisForIdentity(proMain(), { bookingId: booking.id }),
      startDiagnosisForIdentity(proMain(), { bookingId: booking.id }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.diagnosis.count({ where: { bookingId: booking.id } })).toBe(1);
    const stored = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(stored.status).toBe(BookingStatus.DIAGNOSIS);
    expect((await prisma.diagnosis.findUniqueOrThrow({ where: { bookingId: booking.id } })).status).toBe(
      DiagnosisStatus.DRAFT,
    );
  });

  it("does not start an intervention that already moved on", async () => {
    const booking = await makeBooking(BookingStatus.QUOTE_ACCEPTED);
    await prisma.quote.create({
      data: { bookingId: booking.id, amount: "100.00", currency: "MAD", version: 1, status: QuoteStatus.ACCEPTED },
    });
    const results = await Promise.allSettled([
      startInterventionForIdentity(proMain(), { bookingId: booking.id }),
      startInterventionForIdentity(proMain(), { bookingId: booking.id }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      BookingStatus.INTERVENTION,
    );
    expect(await prisma.payment.count({ where: { bookingId: booking.id } })).toBe(0);
  });
});

describe("ownership regression", () => {
  it("another client cannot accept or decline someone else's quote", async () => {
    const booking = await makeBooking(BookingStatus.QUOTE_PENDING);
    const quote = await prisma.quote.create({
      data: { bookingId: booking.id, amount: "250.00", currency: "MAD", version: 1, status: QuoteStatus.SENT },
    });
    for (const decision of ["accept", "decline"] as const) {
      await expect(
        respondToQuoteForIdentity(clientB(), { quoteId: quote.id, decision, claimedClientId: ids.clientA }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    }
    const stored = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    expect(stored.status).toBe(QuoteStatus.SENT);
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe(
      BookingStatus.QUOTE_PENDING,
    );
  });
});

describe("status hints", () => {
  it("explain every status to both sides without inventing states", () => {
    for (const status of Object.values(BookingStatus)) {
      expect(bookingStatusHint(status, "client").length).toBeGreaterThan(10);
      expect(bookingStatusHint(status, "professional").length).toBeGreaterThan(10);
    }
    expect(bookingStatusHint(BookingStatus.REQUESTED, "client")).toMatch(/waiting for the professional/i);
    expect(bookingStatusHint(BookingStatus.QUOTE_PENDING, "client", { hasSentQuote: true })).toMatch(
      /waiting for your decision/i,
    );
    expect(bookingStatusHint(BookingStatus.QUOTE_PENDING, "client", { hasSentQuote: false })).toMatch(
      /declined/i,
    );
    expect(bookingStatusHint(BookingStatus.PAYMENT, "client")).toMatch(/payment status is still pending/i);
  });
});

