export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type MapMarker = {
  id: string;
  point: GeoPoint;
  label: string;
};

export type MapViewState = {
  center: GeoPoint;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  maxBounds: [[number, number], [number, number]];
};

export type MapStyleConfig = {
  styleUrl: string;
  attribution: string;
  rasterFallback: boolean;
};

export type MapAdapter = {
  readonly providerName: string;
  readonly style: MapStyleConfig;
  readonly defaultView: MapViewState;
  readonly fallbackStyle: Record<string, unknown>;
};
