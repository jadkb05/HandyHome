import { defaultMapView, fallbackMapStyle, mapStyleConfig } from "@/lib/maps/config";
import type { MapAdapter, MapMarker } from "@/lib/maps/types";
import type { GeoPoint } from "@/lib/maps/types";

export class MapProviderNotSelectedError extends Error {
  constructor() {
    super("Map provider is not locked (OPEN_QUESTIONS T-02).");
    this.name = "MapProviderNotSelectedError";
  }
}

const mapLibreAdapter: MapAdapter = {
  providerName: "maplibre-openfreemap",
  style: mapStyleConfig,
  defaultView: defaultMapView,
  fallbackStyle: fallbackMapStyle,
};

export function getMapAdapter(): MapAdapter {
  return mapLibreAdapter;
}

export function toMapMarkers(
  items: Array<{
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }>,
): MapMarker[] {
  const markers: MapMarker[] = [];
  for (const item of items) {
    if (item.latitude == null || item.longitude == null) {
      continue;
    }
    markers.push({
      id: item.id,
      label: item.name,
      point: { latitude: item.latitude, longitude: item.longitude },
    });
  }
  return markers;
}

export function isGeoPoint(value: { latitude: unknown; longitude: unknown }): value is GeoPoint {
  return typeof value.latitude === "number" && typeof value.longitude === "number";
}
