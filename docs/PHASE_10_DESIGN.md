# Phase 10 — Final marketplace design and realistic demo data

**Status:** implemented  
**Scope:** presentation, design system, and public-facing demo profiles. No new booking, payment, review, map, or auth business rules.

## Design system

Tokens live in `src/app/globals.css` (`:root`).

| Token | Value |
|---|---|
| Primary | `#006EF9` |
| Hover | `#0058D4` |
| Active | `#004BB3` |
| Text | `#111827` |
| Muted | `#4B5563` |
| Border | `#E5E7EB` |
| Soft background | `#F8FAFC` |
| White | `#FFFFFF` |
| Radius | `0.5rem` / `0.75rem` |
| Card shadow | soft, low elevation |

## Homepage motion

Hero entrance uses CSS only (staggered fade/translate). Scroll sections use `Reveal` (`src/components/motion/Reveal.tsx`) with IntersectionObserver. Navbar shadow uses `StickyHeader`. All motion respects `prefers-reduced-motion`.

Reusable pieces:

- `ProfessionalCard` (directory and compact search variants)
- `ServiceCard`
- `StarDisplay`
- `BookingProgress`
- `EmptyState`
- marketplace header/footer in `AppShell`
- search form + MapLibre search experience

Official logo: `public/brand/handyhome-logo.png` via `BrandLogo`. Do not replace it.

## Image assets

Local files under `public/images/`. No hotlinked Google Images.

| Folder | Use |
|---|---|
| `public/images/home/` | Official homepage hero and brand illustrations |
| `public/images/services/` | Category cards |
| `public/images/professionals/` | Profile portraits / work photos |
| `public/images/portfolio/` | Completed-work gallery |

## Visual background system (Phase 10.1)

Reusable decorative language lives in `SceneBackdrop` (`src/components/visual/SceneBackdrop.tsx`). It recreates the product-owner abstract blue/white reference with CSS + lightweight SVG: organic blobs, curved ribbons, circles, and dot clusters. The raster reference is **not** used as a page background.

Layers are `pointer-events: none`, `aria-hidden`, and clipped so they cannot overflow or capture clicks. Homepage sections vary intensity (`hero`, `flow`, `circles`, `wash`, `cta`). Motion on selected shapes is slow and respects `prefers-reduced-motion`.

Content width token: `--layout-max: 80rem` (1280px).

Cards stay white. Header is sticky, slightly translucent, with a light blur.

Do not replace these with stock photography on the homepage hero or brand section.

`next/image` is used for these assets. Alt text is required on content images; decorative card thumbnails may use empty alt when the surrounding text already names the professional.

## Realistic demo data

Seed (`prisma/seed.ts`) still uses `@demo.handyhome.local` emails and the same documented passwords. Display names are marketplace profiles, not `[DEMO]` labels.

| Email | Public name | Role |
|---|---|---|
| `client@demo.handyhome.local` | Karim Haddad | Client |
| `ahmed@demo.handyhome.local` | Ahmed El Mansouri | Plumber, Maarif |
| `fatima@demo.handyhome.local` | Sara Amrani | Electrician, Gauthier |
| `youssef@demo.handyhome.local` | Youssef Benali | HVAC, Bourgogne |
| `imane@demo.handyhome.local` | Imane Alaoui | Home cleaner, Anfa |
| `omar@demo.handyhome.local` | Omar Tazi | Carpenter, Maarif |
| `nadia@demo.handyhome.local` | Nadia Bennani | Painter, Ain Diab |

These are synthetic seed profiles. The UI must not say DEMO. Reviews and verification stay real: seed professionals are unverified and have no fake ratings.

## Public UI rules

Customer-facing copy must not mention:

- DEMO / V1 / Phase N
- client-approved taxonomy
- development, test data, implementation notes
- later-phase shipping

Internal docs and code identifiers (for example `DEMO_SERVICE_CATALOG`) may keep those terms.

Do not invent reviews, ratings, verification, revenue charts, or payment-gateway language.

## Responsive breakpoints

CSS custom properties: `--bp-sm: 40rem`, `--bp-md: 48rem`, `--bp-lg: 64rem`.

Check:

- 1440 / 1280 / 1024 desktop
- 768 tablet
- 390 / 375 mobile

Navbar uses a native `details` menu under 48rem. Search shows the list first; **Show map** / **Hide map** remain. Desktop search keeps list + MapLibre side by side.

## Motion

Short hover/focus transitions only. `prefers-reduced-motion: reduce` disables animation, transition, and smooth scrolling.
