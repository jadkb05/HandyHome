import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { boundingBox, haversineKm } from "@/lib/maps/distance";
import { toMapMarkers } from "@/lib/maps/adapter";
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

export async function searchProfessionals(filters: SearchFilters): Promise<SearchProfessional[]> {
  const origin =
    filters.lat != null && filters.lng != null
      ? { latitude: filters.lat, longitude: filters.lng }
      : null;

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

  // Distance ranking and radius filtering happen after the query, so the row
  // limit may only be applied in the database when neither is in play.
  // Otherwise a "nearest" search would rank just the first alphabetical rows.
  const rankByDistance = origin != null && (filters.sort === "nearest" || filters.radius != null);
  const rows = await getPrisma().provider.findMany({
    where,
    take: rankByDistance ? undefined : SEARCH_RESULT_LIMIT,
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
    },
    orderBy: [{ user: { name: "asc" } }, { id: "asc" }],
  });

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

  const filtered =
    origin && filters.radius
      ? mapped.filter(
          (item) => item.distanceKm == null || item.distanceKm <= (filters.radius as number),
        )
      : mapped;

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
