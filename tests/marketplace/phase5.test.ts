import { BookingStatus, PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  InvalidSearchParamsError,
  parseSearchParams,
  searchMarkers,
  searchProfessionals,
} from "@/features/search";
import { formatDistanceKm, haversineKm, toMapMarkers } from "@/lib/maps";
import { zonedCivilToUtc } from "@/lib/datetime";

const prisma = new PrismaClient();
const suffix = `ph5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";

const ids = {
  plumbing: "",
  cleaning: "",
  providerA: "",
  providerB: "",
  providerC: "",
  client: "",
};

const NEAR = { latitude: 33.57311, longitude: -7.58984 };
const FAR = { latitude: 33.5892, longitude: -7.6033 };
const frozenNow = new Date("2026-10-04T12:00:00.000Z");
const MONDAY = "2026-10-05";
const TUESDAY = "2026-10-06";

const mondayWindows = {
  dayOfWeek: 1,
  startTime: new Date("1970-01-01T08:00:00.000Z"),
  endTime: new Date("1970-01-01T16:00:00.000Z"),
  active: true,
};
const tuesdayWindows = {
  dayOfWeek: 2,
  startTime: new Date("1970-01-01T09:00:00.000Z"),
  endTime: new Date("1970-01-01T17:00:00.000Z"),
  active: true,
};

async function cleanup() {
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { provider: { user: { email: { contains: suffix } } } },
        { client: { email: { contains: suffix } } },
      ],
    },
  });
  await prisma.providerService.deleteMany({
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
    data: { name: "PH5 Plumbing", slug: `plumbing-${suffix}` },
  });
  const cleaning = await prisma.service.create({
    data: { name: "PH5 Cleaning", slug: `cleaning-${suffix}` },
  });
  ids.plumbing = plumbing.id;
  ids.cleaning = cleaning.id;

  const proA = await prisma.user.create({
    data: {
      name: "PH5 Ahmed",
      email: `pro-a-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: `Casa-${suffix}`,
          address: `Maarif-${suffix}`,
          latitude: NEAR.latitude,
          longitude: NEAR.longitude,
          verified: false,
          services: { create: { serviceId: plumbing.id } },
          availability: { create: mondayWindows },
        },
      },
    },
    include: { provider: true },
  });
  ids.providerA = proA.provider!.id;

  const proB = await prisma.user.create({
    data: {
      name: "PH5 Fatima",
      email: `pro-b-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Plumber",
          city: `Casa-${suffix}`,
          address: `AinDiab-${suffix}`,
          latitude: FAR.latitude,
          longitude: FAR.longitude,
          verified: true,
          services: { create: { serviceId: plumbing.id } },
          availability: { create: tuesdayWindows },
        },
      },
    },
    include: { provider: true },
  });
  ids.providerB = proB.provider!.id;

  const proC = await prisma.user.create({
    data: {
      name: "PH5 NoPin",
      email: `pro-c-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.PROFESSIONAL,
      provider: {
        create: {
          profession: "Cleaner",
          city: `Rabat-${suffix}`,
          address: `Agdal-${suffix}`,
          verified: false,
          services: { create: { serviceId: cleaning.id } },
        },
      },
    },
    include: { provider: true },
  });
  ids.providerC = proC.provider!.id;

  const client = await prisma.user.create({
    data: {
      name: "PH5 Client",
      email: `client-${suffix}@test.handyhome.local`,
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });
  ids.client = client.id;
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("Phase 5 search, filters, and distance", () => {
  it("PH5-01: search by service", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}` }),
    );
    expect(results.map((item) => item.id).sort()).toEqual([ids.providerA, ids.providerB].sort());
    expect(results.every((item) => item.services.some((service) => service.slug === `plumbing-${suffix}`))).toBe(
      true,
    );
  });

  it("PH5-02: search by city", async () => {
    const results = await searchProfessionals(parseSearchParams({ city: `Casa-${suffix}` }));
    expect(results.map((item) => item.id).sort()).toEqual([ids.providerA, ids.providerB].sort());
  });

  it("PH5-03: search by neighborhood", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ neighborhood: `Maarif-${suffix}` }),
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerA]);
    expect(results[0]?.neighborhood).toBe(`Maarif-${suffix}`);
  });

  it("PH5-04: combined service + city filtering", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, city: `Casa-${suffix}` }),
    );
    expect(results.map((item) => item.id).sort()).toEqual([ids.providerA, ids.providerB].sort());

    const none = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, city: `Rabat-${suffix}` }),
    );
    expect(none).toEqual([]);
  });

  it("PH5-05: professional without coordinates remains in list", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `cleaning-${suffix}` }),
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerC]);
    expect(results[0]?.latitude).toBeNull();
    expect(results[0]?.longitude).toBeNull();
  });

  it("PH5-06: professional without coordinates does not become a map marker", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `cleaning-${suffix}` }),
    );
    expect(searchMarkers(results)).toEqual([]);
    expect(
      toMapMarkers([
        { id: "with", name: "With pin", latitude: 33.57, longitude: -7.59 },
        { id: "without", name: "No pin", latitude: null, longitude: null },
      ]),
    ).toEqual([{ id: "with", label: "With pin", point: { latitude: 33.57, longitude: -7.59 } }]);
  });

  it("PH5-07: distance calculation", () => {
    expect(haversineKm(NEAR, NEAR)).toBeCloseTo(0, 6);
    const equatorDegree = haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(equatorDegree).toBeGreaterThan(110);
    expect(equatorDegree).toBeLessThan(113);
    expect(formatDistanceKm(2.44)).toBe("2.4 km away");
  });

  it("PH5-08: nearest sorting with coordinates", async () => {
    const results = await searchProfessionals(
      parseSearchParams({
        service: `plumbing-${suffix}`,
        sort: "nearest",
        lat: String(NEAR.latitude),
        lng: String(NEAR.longitude),
      }),
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerA, ids.providerB]);
    expect(results[0]?.distanceKm).not.toBeNull();
    expect(results[1]?.distanceKm).not.toBeNull();
    expect(results[0]!.distanceKm!).toBeLessThan(results[1]!.distanceKm!);
  });

  it("PH5-09: deterministic fallback ordering without user location", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, sort: "nearest" }),
    );
    expect(results.every((item) => item.distanceKm == null)).toBe(true);
    expect(results.map((item) => item.name)).toEqual(["PH5 Ahmed", "PH5 Fatima"]);
  });

  it("PH5-10: verified filter uses actual verified field", async () => {
    const verified = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, verified: "1" }),
    );
    expect(verified.map((item) => item.id)).toEqual([ids.providerB]);
    expect(verified[0]?.verified).toBe(true);

    const all = await searchProfessionals(parseSearchParams({ service: `plumbing-${suffix}` }));
    expect(all.some((item) => item.verified === false)).toBe(true);
  });

  it("PH5-11: invalid search parameters rejected", () => {
    expect(() => parseSearchParams({ service: "Plumbing" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ service: "not a slug" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ lat: "33.5" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ lat: "200", lng: "0" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ sort: "relevance" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ verified: "yes" })).toThrow(InvalidSearchParamsError);
    expect(() => parseSearchParams({ date: "not-a-date" }, { now: frozenNow })).toThrow(
      InvalidSearchParamsError,
    );
    expect(() => parseSearchParams({ date: "2026-13-40" }, { now: frozenNow })).toThrow(
      InvalidSearchParamsError,
    );
    expect(() => parseSearchParams({ date: "2026-10-03" }, { now: frozenNow })).toThrow(
      InvalidSearchParamsError,
    );
    expect(() => parseSearchParams({ date: "2026-10-18" }, { now: frozenNow })).toThrow(
      InvalidSearchParamsError,
    );
  });

  it("PH12: a Paris origin without radius still returns Casablanca professionals", async () => {
    const results = await searchProfessionals(
      parseSearchParams({
        service: `plumbing-${suffix}`,
        sort: "nearest",
        lat: "48.85661",
        lng: "2.35222",
      }),
    );
    expect(results.map((item) => item.id).sort()).toEqual([ids.providerA, ids.providerB].sort());
    expect(results.every((item) => item.distanceKm != null && item.distanceKm > 1000)).toBe(true);
    const markers = searchMarkers(results);
    expect(markers).toHaveLength(2);
    expect(markers.every((marker) => marker.point.latitude > 33 && marker.point.latitude < 34)).toBe(true);
    expect(markers.every((marker) => marker.point.longitude < -7 && marker.point.longitude > -8)).toBe(true);
  });

  it("search without a date keeps existing service and city results", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, city: `Casa-${suffix}` }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id).sort()).toEqual([ids.providerA, ids.providerB].sort());
  });

  it("search with a date returns only professionals with an open slot that day", async () => {
    const monday = await searchProfessionals(parseSearchParams({ date: MONDAY }, { now: frozenNow }), {
      now: frozenNow,
    });
    const mondayIds = monday.map((item) => item.id);
    expect(mondayIds).toContain(ids.providerA);
    expect(mondayIds).not.toContain(ids.providerB);
    expect(mondayIds).not.toContain(ids.providerC);

    const tuesday = await searchProfessionals(parseSearchParams({ date: TUESDAY }, { now: frozenNow }), {
      now: frozenNow,
    });
    const tuesdayIds = tuesday.map((item) => item.id);
    expect(tuesdayIds).toContain(ids.providerB);
    expect(tuesdayIds).not.toContain(ids.providerA);
    expect(tuesdayIds).not.toContain(ids.providerC);
  });

  it("search with service and date", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, date: MONDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerA]);
  });

  it("search with city and date", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ city: `Casa-${suffix}`, date: TUESDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerB]);
  });

  it("search with service, city and date", async () => {
    const results = await searchProfessionals(
      parseSearchParams(
        { service: `plumbing-${suffix}`, city: `Casa-${suffix}`, date: MONDAY },
        { now: frozenNow },
      ),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerA]);
    expect(results[0]?.neighborhood).toBe(`Maarif-${suffix}`);
  });

  it("preserves a valid date in parsed URL state", () => {
    const filters = parseSearchParams(
      { service: `plumbing-${suffix}`, city: `Casa-${suffix}`, date: MONDAY, sort: "name" },
      { now: frozenNow },
    );
    expect(filters).toMatchObject({
      service: `plumbing-${suffix}`,
      city: `Casa-${suffix}`,
      date: MONDAY,
      sort: "name",
    });
  });

  it("excludes a professional with no availability on the selected date", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ service: `cleaning-${suffix}`, date: MONDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id)).toEqual([]);
  });

  it("excludes a professional whose remaining slots that day are occupied", async () => {
    const clocks = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
    await prisma.booking.createMany({
      data: clocks.map((clock) => ({
        clientId: ids.client,
        providerId: ids.providerA,
        serviceId: ids.plumbing,
        scheduledAt: zonedCivilToUtc(MONDAY, clock),
        status: BookingStatus.REQUESTED,
      })),
    });

    const occupied = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, date: MONDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(occupied.map((item) => item.id)).toEqual([]);

    await prisma.booking.updateMany({
      where: { providerId: ids.providerA },
      data: { status: BookingStatus.REJECTED },
    });

    const afterReject = await searchProfessionals(
      parseSearchParams({ service: `plumbing-${suffix}`, date: MONDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(afterReject.map((item) => item.id)).toEqual([ids.providerA]);
  });

  it("map markers match only professionals returned for the selected date", async () => {
    const results = await searchProfessionals(
      parseSearchParams({ city: `Casa-${suffix}`, date: MONDAY }, { now: frozenNow }),
      { now: frozenNow },
    );
    expect(results.map((item) => item.id)).toEqual([ids.providerA]);
    expect(searchMarkers(results).map((marker) => marker.id)).toEqual([ids.providerA]);
    expect(searchMarkers(results).every((marker) => marker.label === "PH5 Ahmed")).toBe(true);
  });
});
