"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/content/en";
import type { SearchFilters } from "@/features/search";

type UseMyLocationButtonProps = {
  filters: SearchFilters;
};

export function UseMyLocationButton({ filters }: UseMyLocationButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function requestLocation() {
    setMessage(null);
    if (!navigator.geolocation) {
      setMessage(copy.geoUnsupported);
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams();
        if (filters.service) {
          params.set("service", filters.service);
        }
        if (filters.city) {
          params.set("city", filters.city);
        }
        if (filters.neighborhood) {
          params.set("neighborhood", filters.neighborhood);
        }
        if (filters.verified) {
          params.set("verified", "1");
        }
        if (filters.radius) {
          params.set("radius", String(filters.radius));
        }
        params.set("lat", position.coords.latitude.toFixed(5));
        params.set("lng", position.coords.longitude.toFixed(5));
        params.set("sort", "nearest");
        setPending(false);
        router.push(`/search?${params.toString()}`);
      },
      (error) => {
        setPending(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMessage(copy.geoDenied);
        } else if (error.code === error.TIMEOUT) {
          setMessage(copy.geoTimeout);
        } else {
          setMessage(copy.geoUnavailable);
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="geo-control">
      <button
        type="button"
        className="button button-secondary"
        data-testid="use-my-location"
        onClick={requestLocation}
        disabled={pending}
      >
        {copy.useMyLocation}
      </button>
      {message ? (
        <p className="form-alert" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
