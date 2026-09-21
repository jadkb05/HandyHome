import type { GeoPoint } from "@/lib/maps/types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Straight-line geographic distance. Not routing or travel time. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const chord =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(chord)));
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km away`;
}

export function boundingBox(origin: GeoPoint, radiusKm: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.max(0.2, Math.cos(toRadians(origin.latitude))));
  return {
    minLat: origin.latitude - latDelta,
    maxLat: origin.latitude + latDelta,
    minLng: origin.longitude - lngDelta,
    maxLng: origin.longitude + lngDelta,
  };
}
