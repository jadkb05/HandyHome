import type { MapStyleConfig, MapViewState } from "@/lib/maps/types";

/**
 * 0€ demo map config. Isolated here so UI never hard-codes a tile vendor.
 *
 * OpenFreeMap serves OSM-derived vector tiles with no API key and no signup.
 * Attribution must remain visible. Do not bulk-download or prefetch the world.
 */
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export const mapStyleConfig: MapStyleConfig = {
  styleUrl: "https://tiles.openfreemap.org/styles/positron",
  attribution: `${OSM_ATTRIBUTION} · © OpenFreeMap`,
  rasterFallback: true,
};

/** Casablanca metro area — keeps demo tile requests local, not global. */
export const defaultMapView: MapViewState = {
  center: { latitude: 33.573, longitude: -7.589 },
  zoom: 12,
  minZoom: 10,
  maxZoom: 16,
  maxBounds: [
    [-7.85, 33.4],
    [-7.4, 33.72],
  ],
};

/** Background-only style so markers still render if remote tiles fail. */
export const fallbackMapStyle = {
  version: 8,
  name: "handyhome-fallback",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F8FAFC" },
    },
  ],
} as const;
