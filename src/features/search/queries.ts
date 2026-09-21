import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { boundingBox, haversineKm } from "@/lib/maps/distance";
import { toMapMarkers } from "@/lib/maps/adapter";
import { occupyingScheduledTimes } from "@/features/bookings/occupancy";
import { hasOpenSlotOnCivilDate } from "@/features/bookings/slots";
import { reviewSummariesFor, summaryOrEmpty } from "@/features/reviews/summary";
import { publicProviderWhere } from "@/features/professionals/completeness";
import type { SearchFilters } from "@/features/search/validation";

export const SEARCH_RESULT_LIMIT = 50;

export type SearchProfessional = {
  id: string;
  name: string;
  profession: string;
  city: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  image: string | null;
  services: { slug: string; name: string }[];
  distanceKm: number | null;
  reviewCount: number;
  averageRating: number | null;
  averageLabel: string | null;
};

function toNumber(value: Prisma.Decimal | null): number | null {
  if (value == null) {
    return null;
  }
  return Number(value);
}

async function providerIdsWithOpenSlotOnDate(
  providers: Array<{
    id: string;
    availability: Array<{ dayOfWeek: number; startTime: Date; endTime: Date; active: boolean }>;
  }>,
  civilDate: string,
  now: Date,
): Promise<Set<string>> {
  const occupiedByProvider = await occupyingScheduledTimes(providers.map((provider) => provider.id));
  const available = new Set<string>();
  for (const provider of providers) {
    if (
      hasOpenSlotOnCivilDate({
        availability: provider.availability,
        occupied: occupiedByProvider.get(provider.id) ?? [],
        civilDate,
        now,
      })
    ) {
      available.add(provider.id);
    }
  }
  return available;
}

export async function searchProfessionals(
  filters: SearchFilters,
  options?: { now?: Date },
): Promise<SearchProfessional[]> {
  const origin =
    filters.lat != null && filters.lng != null
      ? { latitude: filters.lat, longitude: filters.lng }
      : null;
  const now = options?.now ?? new Date();
  const filterByDate = Boolean(filters.date);

  const where: Prisma.ProviderWhereInput = { ...publicProviderWhere };

  if (filters.service) {
    where.services = { some: { service: { slug: filters.service } } };
  }
  if (filters.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }
  if (filters.neighborhood) {
    where.address = { equals: filters.neighborhood, mode: "insensitive" };
  }
  if (filters.verified) {
    where.verified = true;
  }

  if (origin && filters.radius) {
    const box = boundingBox(origin, filters.radius);
    where.AND = [
      {
        OR: [
          { latitude: null },
          {
            latitude: { gte: box.minLat, lte: box.maxLat },
            longitude: { gte: box.minLng, lte: box.maxLng },
          },
        ],
      },
    ];
  }

  // Distance ranking, radius, and date availability are applied after the query,
  // so the row limit is only used in the database when none of those are in play.
  const rankByDistance = origin != null && (filters.sort === "nearest" || filters.radius != null);
  const rows = await getPrisma().provider.findMany({
    where,
    take: rankByDistance || filterByDate ? undefined : SEARCH_RESULT_LIMIT,
    select: {
      id: true,
      profession: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      verified: true,
      user: { select: { name: true, image: true } },
      services: { select: { service: { select: { slug: true, name: true } } } },
      availability: { where: { active: true } },
    },
    orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
  });

  const availableIds = filterByDate
    ? await providerIdsWithOpenSlotOnDate(
        rows.map((row) => ({ id: row.id, availability: row.availability })),
        filters.date!,
        now,
      )
    : null;

  const summaries = await reviewSummariesFor(rows.map((row) => row.id));
  const mapped: SearchProfessional[] = rows.map((row) => {
    const latitude = toNumber(row.latitude);
    const longitude = toNumber(row.longitude);
    const distanceKm =
      origin && latitude != null && longitude != null
        ? haversineKm(origin, { latitude, longitude })
        : null;
    const reviewSummary = summaryOrEmpty(summaries, row.id);
    return {
      id: row.id,
      name: row.user.name,
      profession: row.profession,
      city: row.city,
      neighborhood: row.address,
      latitude,
      longitude,
      verified: row.verified,
      image: row.user.image,
      services: row.services.map((item) => item.service),
      distanceKm,
      reviewCount: reviewSummary.count,
      averageRating: reviewSummary.average,
      averageLabel: reviewSummary.averageLabel,
    };
  });

  const afterRadius =
    origin && filters.radius
      ? mapped.filter(
          (item) => item.distanceKm == null || item.distanceKm <= (filters.radius as number),
        )
      : mapped;
  const filtered = availableIds
    ? afterRadius.filter((item) => availableIds.has(item.id))
    : afterRadius;

  const useNearest = filters.sort === "nearest" && origin != null;

  filtered.sort((a, b) => {
    if (useNearest) {
      if (a.distanceKm == null && b.distanceKm == null) {
        return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
      }
      if (a.distanceKm == null) {
        return 1;
      }
      if (b.distanceKm == null) {
        return -1;
      }
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
    }
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });

  return filtered.slice(0, SEARCH_RESULT_LIMIT);
}

export function searchMarkers(results: SearchProfessional[]) {
  return toMapMarkers(results);
}

export async function listSearchLocations() {
  const rows = await getPrisma().provider.findMany({
    where: publicProviderWhere,
    select: { city: true, address: true },
    distinct: ["city", "address"],
    orderBy: [{ city: "asc" }, { address: "asc" }],
  });
  return {
    cities: [...new Set(rows.map((row) => row.city).filter(Boolean))],
    neighborhoods: [...new Set(rows.map((row) => row.address).filter((value): value is string => Boolean(value)))],
  };
}
