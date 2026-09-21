# Phase 4 — Services and professional marketplace data

**Status:** implemented for the 0€ development/demo V1  
**Not claimed:** client-approved service taxonomy, verification, search, or maps

This phase publishes database-backed services, professional profiles, portfolio, and availability. It does **not** add search, ranking, geolocation, maps, booking, quotes, payments, reviews, or favorites UI.

## Service model

Existing Prisma `Service`:

```text
id, name, slug (unique), description, createdAt, updatedAt
```

No schema redesign. Rows are created by seed, not hardcoded in pages.

### V1 demo catalog

`OPEN_QUESTIONS` **T-07** is still unresolved. There is no client-approved taxonomy in the repository.

Seed therefore inserts a **small English demo catalog** aligned with the master context “possible categories”:

| Slug | Name |
|---|---|
| `plumbing` | Plumbing |
| `electrical` | Electrical |
| `painting` | Painting |
| `air-conditioning` | Air conditioning |
| `appliance-repair` | Appliance repair |
| `carpentry` | Carpentry |
| `cleaning` | Cleaning |
| `general-maintenance` | Home maintenance |

These records are a small English seed catalog. They are not a locked product catalog. Public UI copy is customer-facing (`docs/PHASE_10_DESIGN.md`).

## Provider ↔ Service

Existing `ProviderService` (`providerId`, `serviceId`, composite primary key).

A professional may offer several services. A service may have several professionals.

Demo links:

- Ahmed El Mansouri (`ahmed@demo.handyhome.local`) → Plumbing, Appliance repair, Home maintenance
- Sara Amrani (`fatima@demo.handyhome.local`) → Electrical

UI reads these links with Prisma `include`, never from hardcoded arrays.

## Professional public profile

Route: `/professionals/[id]` (`Provider.id`).

Shows, when present:

- name (`User.name`)
- profession, description
- neighborhood + city (not a street address)
- services
- availability summary
- portfolio
- **Price on quote**
- verification as a neutral label (`Not verified` / `Marked verified`)

There is no fake rating, review count, or certification badge.

Unknown ids render the route `not-found` UI.

Listing: `/professionals` — database list only. No ranking, distance, filters, or map.

## Portfolio

Existing `PortfolioItem`. Displayed from the database.

Demo files live in `public/demo/portfolio/` (repository assets). `url` stores a site-relative path. `getMediaStorage()` still throws until T-03 is locked. No Cloudinary/S3/image SaaS.

## Availability

Existing `Availability` (`dayOfWeek`, `startTime`, `endTime`, `active`).

Profiles show a simple weekday/time list. Times are stored as clock values (not booking instants). No calendar, no booking conflict engine.

## Location

`Provider.city` and optional `address` used as a **neighborhood** label (Maarif, Ain Diab). Latitude/longitude are stored as nullable neighborhood-level demo pins and are used by Phase 5 search/map. They are not street or home addresses.

## Ownership

Public read: anyone may view `/professionals/[id]`.

Edit: `/professional/profile` is `PROFESSIONAL`-only.

`updateProviderProfileForIdentity`:

1. `requireRole("PROFESSIONAL")` / `assertRole`
2. load `Provider` with `where: { userId: session.userId }`
3. ignore client-supplied `userId`
4. reject a `providerId` that is not the owned row

A CLIENT hitting the edit URL is redirected to `/dashboard`.

## Demo data

Unchanged login credentials from Phase 3. Seed also upserts the catalog and provider-service links. Public names are realistic marketplace profiles (`docs/PHASE_10_DESIGN.md`). Emails remain `@demo.handyhome.local`.

## Intentionally postponed (later phases)

Search, map, and geolocation shipped in Phase 5 (`docs/PHASE_5_SEARCH_MAP.md`). Still postponed:

- booking / appointment UI
- quotes, payments, reviews, favorites UI
- notifications, chatbot, AI
- professional verification workflow
- paid media storage and real image upload
- client-approved service taxonomy (T-07)
- ranking beyond name / optional nearest
