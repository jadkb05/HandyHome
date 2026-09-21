"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { copy } from "@/content/en";
import { getMapAdapter } from "@/lib/maps";
import type { MapMarker } from "@/lib/maps";

type SearchMapProps = {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function SearchMap({ markers, selectedId, onSelect }: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<{ id: string; label: string; marker: maplibregl.Marker }[]>([]);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const fallbackUsed = useRef(false);
  const [tileError, setTileError] = useState(false);
  const [initError, setInitError] = useState(false);
  const [basemapState, setBasemapState] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const adapter = getMapAdapter();
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: adapter.style.styleUrl,
        center: [adapter.defaultView.center.longitude, adapter.defaultView.center.latitude],
        zoom: adapter.defaultView.zoom,
        minZoom: adapter.defaultView.minZoom,
        maxZoom: adapter.defaultView.maxZoom,
        maxBounds: adapter.defaultView.maxBounds,
        attributionControl: false,
        cooperativeGestures: true,
        trackResize: true,
      });
    } catch {
      queueMicrotask(() => setInitError(true));
      return;
    }

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: adapter.style.attribution,
      }),
    );
    map.once("style.load", () => {
      if (mapRef.current !== map) {
        return;
      }
      const sources = map.getStyle()?.sources ?? {};
      if (Object.keys(sources).length > 0) {
        setBasemapState("ready");
      }
    });
    map.on("error", (event) => {
      // A missing glyph range or one failed tile must not replace a loaded
      // street map with the empty gray fallback style.
      if ((event as { tile?: unknown }).tile || (map.isStyleLoaded() && Object.keys(map.getStyle()?.sources ?? {}).length > 0)) {
        return;
      }
      if (fallbackUsed.current || mapRef.current !== map) {
        return;
      }
      fallbackUsed.current = true;
      try {
        map.setStyle(adapter.fallbackStyle as StyleSpecification);
      } catch {
        setInitError(true);
        return;
      }
      setTileError(true);
      setBasemapState("fallback");
    });
    mapRef.current = map;

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      for (const entry of markerRefs.current) {
        entry.marker.remove();
      }
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || initError) {
      return;
    }

    function drawMarkers(target: maplibregl.Map) {
      for (const entry of markerRefs.current) {
        entry.marker.remove();
      }
      markerRefs.current = [];

      for (const item of markers) {
        const isSelected = item.id === selectedIdRef.current;
        const element = document.createElement("button");
        element.type = "button";
        element.className = "map-marker";
        element.dataset.testid = "map-marker";
        element.dataset.professionalId = item.id;
        element.dataset.selected = isSelected ? "true" : "false";
        element.setAttribute("aria-label", isSelected ? `${item.label} (selected)` : item.label);
        const marker = new maplibregl.Marker({ element, anchor: "bottom" })
          .setLngLat([item.point.longitude, item.point.latitude])
          .setPopup(new maplibregl.Popup({ closeButton: true, offset: 18 }).setText(item.label))
          .addTo(target);
        element.addEventListener("click", () => {
          onSelectRef.current(item.id);
          marker.togglePopup();
        });
        markerRefs.current.push({ id: item.id, label: item.label, marker });
      }
    }

    function fitView(target: maplibregl.Map) {
      if (markers.length === 1) {
        target.easeTo({
          center: [markers[0].point.longitude, markers[0].point.latitude],
          zoom: 13,
          duration: 0,
        });
      } else if (markers.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        for (const item of markers) {
          bounds.extend([item.point.longitude, item.point.latitude]);
        }
        target.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }
    }

    // Markers are DOM elements, so they do not need the basemap style to be
    // loaded (the basemap may fail and fall back to a plain background).
    drawMarkers(map);
    fitView(map);
    if (map.loaded()) {
      return;
    }
    // Refit once the map has its final size, but only for this marker set.
    const onLoad = () => fitView(map);
    map.once("load", onLoad);
    return () => {
      map.off("load", onLoad);
    };
    // Selection is applied in place below; it must not rebuild markers or refit the view.
  }, [markers, initError]);

  useEffect(() => {
    for (const entry of markerRefs.current) {
      const element = entry.marker.getElement();
      const isSelected = entry.id === selectedId;
      element.dataset.selected = isSelected ? "true" : "false";
      element.setAttribute("aria-label", isSelected ? `${entry.label} (selected)` : entry.label);
    }
  }, [selectedId]);

  const adapter = getMapAdapter();

  return (
    <div className="search-map-wrap">
      {initError ? (
        <p className="map-banner" role="status">
          {copy.mapInitError}
        </p>
      ) : null}
      {!initError && tileError ? (
        <p className="map-banner" role="status">
          {copy.mapTilesUnavailable}
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="search-map"
        data-testid="search-map"
        data-basemap={basemapState}
        role="region"
        aria-label={copy.searchMapLabel}
        hidden={initError}
      />
      <p className="map-attribution">{adapter.style.attribution}</p>
    </div>
  );
}
