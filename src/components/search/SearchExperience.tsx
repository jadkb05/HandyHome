"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ProfessionalCard, searchProfessionalToCard } from "@/components/ProfessionalCard";
import { copy } from "@/content/en";
import type { SearchProfessional } from "@/features/search";
import { toMapMarkers } from "@/lib/maps";

const SearchMap = dynamic(
  () => import("@/components/search/SearchMap").then((mod) => mod.SearchMap),
  { ssr: false },
);

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

const DESKTOP_QUERY = "(min-width: 64rem)";

/** The map panel is always visible from 64rem up; below that it sits behind a toggle. */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

type SearchExperienceProps = {
  professionals: SearchProfessional[];
};

export function SearchExperience({ professionals }: SearchExperienceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapRequested, setMapRequested] = useState(false);
  const isClient = useIsClient();
  const isDesktop = useIsDesktop();
  const markers = useMemo(() => toMapMarkers(professionals), [professionals]);
  const markerIds = useMemo(() => new Set(markers.map((marker) => marker.id)), [markers]);
  // Do not create a WebGL map for a hidden mobile panel until it is first opened.
  const mountMap = isClient && (isDesktop || mapRequested);

  function select(id: string) {
    setSelectedId(id);
    document.getElementById(`search-result-${id}`)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  return (
    <div className="search-layout">
      <div className="search-list-panel">
        <button
          type="button"
          className="button button-secondary map-toggle"
          aria-expanded={mapOpen}
          aria-controls="search-map-panel"
          onClick={() => {
            setMapOpen((open) => !open);
            setMapRequested(true);
          }}
        >
          {mapOpen ? copy.hideMap : copy.showMap}
        </button>
        <div className="search-results" data-testid="search-results">
          {professionals.map((professional) => (
            <div id={`search-result-${professional.id}`} key={professional.id}>
              <ProfessionalCard
                professional={searchProfessionalToCard(professional)}
                distanceKm={professional.distanceKm}
                selected={selectedId === professional.id}
                selectable
                canShowOnMap={markerIds.has(professional.id)}
                onSelect={select}
                variant="compact"
              />
            </div>
          ))}
        </div>
      </div>
      <div
        id="search-map-panel"
        className="search-map-panel"
        data-open={mapOpen}
        data-testid="search-map-panel"
      >
        {mountMap ? (
          <SearchMap markers={markers} selectedId={selectedId} onSelect={select} />
        ) : (
          <p className="map-banner" role="status">
            {copy.mapLoading}
          </p>
        )}
      </div>
    </div>
  );
}
