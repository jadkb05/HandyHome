# Phase 5 — Search, filters, map, and geolocation

**Status:** implemented for the 0€ development/demo V1  
**Not claimed:** commercial map SLA, routing, paid geocoding, or client-approved ranking

Phase 5 adds public professional **search** and **discovery**. It does **not** add booking, appointments, diagnosis, quotes, payment, reviews, favorites, notifications, AI matching, or professional verification workflows.

> The map uses geographic display and straight-line distance for V1. It is not a routing/navigation system.

## Search architecture

Route: `/search`

```text
URL query (validated)
        ↓
parseSearchParams (Zod, server)
        ↓
searchProfessionals (Prisma, server)
        ↓
selected public fields only
        ↓
list UI + MapLibre markers
```

Prisma stays on the server. The browser never receives a Prisma client, raw SQL, emails, phone numbers, or passwords.

Conceptual query:

```ts
searchProfessionals({
  serviceId, // implemented as Service.slug
  city,
  neighborhood, // Provider.address
  latitude,
  longitude,
  radius,
})
```

Filters are allow-listed. Arbitrary Prisma `where` objects from the client are rejected.

Result cap: 50 rows (`SEARCH_RESULT_LIMIT`).

## Filters

| Filter | Source | Notes |
|---|---|---|
| Service | `Service.slug` from the database | UI options are queried, not hardcoded. DEMO V1 catalog only (`OPEN_QUESTIONS` T-07). |
| City | `Provider.city` | Case-insensitive equality. City/neighborhood level, not street address. |
| Neighborhood | `Provider.address` | Same field used as the public neighborhood label in Phase 4. |
| Marked verified only | `Provider.verified` | Uses the stored boolean. `false` is not presented as “unsafe”. |
| Sort | `name` or `nearest` | `nearest` is applied only when origin coordinates exist. |

There is no price, rating, response-time, experience, or AI filter.

## URL state

Search is represented in the query string so refresh, sharing, back/forward, and E2E tests stay deterministic.

Example:

```text
/search?service=plumbing&city=casablanca&neighborhood=maarif
```

Also accepted when present and valid:

- `verified=1`
- `sort=name` or `sort=nearest`
- `lat` + `lng` (temporary client search origin)
- `radius` (km, 0–100; not exposed in the V1 form)

Invalid values (non-slug service, lat without lng, out-of-range coordinates, unknown sort) render a generic error. Stack traces are not shown.

## Geolocation

`navigator.geolocation.getCurrentPosition` runs **only after** the user clicks **Use my location**.

The page does not request location on load.

Handled outcomes:

- success → `lat` / `lng` / `sort=nearest` written to the URL
- permission denied
- timeout
- position unavailable
- API missing

The origin is temporary URL/search context. It is **not** stored on `User` / `Provider` and is not sent to a geocoding or routing vendor.

## Distance (Haversine)

`src/lib/maps/distance.ts` computes great-circle distance in kilometres.

When an origin exists **and** the professional has coordinates, the UI may show `2.4 km away`.

This is **straight-line geographic distance**, not road distance, travel time, or walking directions. No Google Distance Matrix, Mapbox Directions, or other routing API is used.

Professionals without coordinates stay in the list with no distance label.

## Sorting

- Origin present and `sort=nearest`: nearest first; rows without coordinates last; name then id as tie-breakers.
- Origin missing: `nearest` is ignored. Order is `User.name` then `Provider.id`. The UI states that nearest sorting needs location. No invented relevance score.

## Map architecture

```text
features/search
      ↓
lib/maps (adapter + config + distance)
      ↓
MapLibre GL JS + OSM-compatible style
```

UI components call `getMapAdapter()`. They do not hard-code a tile vendor URL.

### MapLibre

Client map: `src/components/search/SearchMap.tsx` (loaded with `ssr: false`).

Markers are built from search results (`toMapMarkers`). Rows without `latitude`/`longitude` are omitted from the map and remain in the accessible list.

Marker click highlights the matching card (and a compact popup). Card click highlights the matching marker. Profile navigation uses `/professionals/[id]`.

### Tile source (0€ demo)

Isolated in `src/lib/maps/config.ts`:

- Style: OpenFreeMap Liberty (`https://tiles.openfreemap.org/styles/liberty`)
- No API key, no signup, no credit card
- Default view bounded to the Casablanca metro area (`minZoom` 10, `maxZoom` 16, `maxBounds`) so the demo does not preload the world
- No bulk tile download, no prefetch of unused regions

Public OSM tile infrastructure is **not** treated as an unlimited CDN. Request volume stays at interactive, on-screen use.

If the remote style fails, MapLibre switches to a local background-only style so markers can still render. If WebGL/map init fails, the list remains usable with an inline map error.

### Attribution

Visible attribution includes **© OpenStreetMap contributors** (plus OpenFreeMap credit from the adapter config). MapLibre’s attribution control is enabled with that custom string.

## Coordinate model

Existing Prisma fields:

```text
Provider.latitude   Decimal(9,6) nullable
Provider.longitude  Decimal(9,6) nullable
Provider.city
Provider.address    // neighborhood label
```

Coordinates are optional. Demo Ahmed/Fatima pins are **neighborhood-level marketplace locations** (Maarif / Ain Diab), not street or home addresses.

Phase 5 migration `20260920211500_phase5_search_indexes` adds `Provider_address_idx` because neighborhood filter equality is used on `address`. `city` and `(latitude, longitude)` indexes already existed.

## List ↔ map and responsive behavior

Desktop (`64rem+`): list and map side by side. Map is sticky.

Mobile: search controls, then results, then **Show map** / **Hide map**. The map is not a shrunk desktop split. Every map professional also appears in the list (keyboard-accessible cards and profile links).

## 0€ demo assumptions

Intended demonstration stack:

- Vercel Hobby (personal/non-commercial terms; not production certification)
- Free-tier PostgreSQL
- Repository assets
- Open-source MapLibre + OpenFreeMap style (no key)

Not introduced: Google Maps, paid Mapbox/MapTiler, paid geocoding, Stripe, email/SMS, paid image hosting, paid search/AI APIs.

Vercel Hobby is for personal/non-commercial usage according to Vercel’s terms. This phase is for development/demo/validation.

## Future migration path

Replace the tile/style implementation inside `src/lib/maps/` only. Keep `getMapAdapter()`, `toMapMarkers()`, and Haversine helpers stable.

A later commercial map/geocoding vendor would still sit behind that adapter. PostGIS or another geospatial index can replace the bounding-box prefilter + Haversine pass if volume requires it.

## Limitations

- No routing, isochrones, or turn-by-turn
- No reverse geocoding of the browser location into a city name
- No availability/date filter (B-06 still open)
- No ranking beyond name / optional nearest
- OpenFreeMap/OSM tiles need a network path; the list does not
- Demo coordinates are approximate neighborhood pins
- Search is public; only public professional fields are selected
- Playwright E2E auth users live in `handyhome_e2e` and are deleted after the auth spec (see `docs/PHASE_3_AUTH.md`). Listing/search queries are not name-filtered.

## Intentionally postponed (Phase 6+)

Booking, appointment creation, diagnosis, quotes, payment, reviews, favorites, notifications, AI chatbot, verification workflow, advanced matching/ranking.
