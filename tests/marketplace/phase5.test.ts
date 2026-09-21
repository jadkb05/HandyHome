import { PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  InvalidSearchParamsError,
  parseSearchParams,
  searchMarkers,
  searchProfessionals,
} from "@/features/search";
import { formatDistanceKm, haversineKm, toMapMarkers } from "@/lib/maps";

const prisma = new PrismaClient();
const suffix = `ph5-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const hash = "unusable-test-hash:NOT_A_PASSWORD";

const ids = {
  plumbing: "",
  cleaning: "",
  providerA: "",
  providerB: "",
  providerC: "",
};

const NEAR = { latitude: 33.57311, longitude: -7.58984 };
const FAR = { latitude: 33.5892, longitude: -7.6033 };

async function cleanup() {
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
});
