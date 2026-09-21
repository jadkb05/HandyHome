# HandyHome — Initial Open Questions

**Phase:** 0  
**Rule:** List what implementation needs and the repo does not define. Do not invent answers.

Known decision (Phase 0, not from the master context): **V1 interface language is English.** See `docs/RESOURCE_CONFLICTS.md` C1.

---

## Product / business

| ID | Question | Why it blocks implementation | Notes from existing docs |
|---|---|---|---|
| Q1 | Is the master context the temporary product baseline, or must a client-approved V1 validation document exist first? | Scope, UX, and timeline (master §30) | No validation document in the repo |
| Q2 | Launch geography: Casablanca only, Morocco-wide, or unspecified cities? | Search, map bounds, seed data, copy | Example uses Casablanca; not a rule |
| Q3 | Professional verification process (who verifies, which documents, SLA)? | `verificationStatus` on profiles, admin vs manual DB | Field mentioned; process not specified |
| Q4 | Cancellation / refusal / no-show rules (who can cancel, until when, what happens to quotes)? | Booking state machine, dashboards | Status list has no cancellation policy |
| Q5 | Diagnostic visit: free, paid fee, or professional-defined? | Quote/payment timing, “Prix sur devis” | No fixed **final** price before diagnostic; diagnostic fee itself is undefined |
| Q6 | May a booking have multiple quote versions (revise/reject/resend)? | Quote schema and UI | One quote flow described; revisions not specified |
| Q7 | Platform commission / fees? | Payment amounts, provider dashboard | Not mentioned |
| Q8 | Who proposes the appointment time — client date in search, professional, or negotiation? | Request form, availability, scheduling | Search has a date; appointment creation is a demo step |
| Q9 | Intervention address vs professional map location: what is stored and what is shown to whom? | Privacy, map markers, booking fields | Map shows professionals; client site address not specified |
| Q10 | Favorites and reviews: any moderation or eligibility rules (e.g. review only after completed/paid)? | Review API, abuse | Demo leaves a review after payment status |

---

## Authentication / security / roles

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q11 | Authentication solution (Auth.js, Clerk, custom sessions, etc.)? | Phase 1–3 setup | Master: “selected during architecture” |
| Q12 | Credentials only, or OAuth (Google, etc.) in V1? | Register/login UI | Not specified |
| Q13 | Email verification and/or phone verification required? | Registration, spam, trust | Phone listed as possible user field, not as a process |
| Q14 | Is `ADMIN` a V1 role? | Routes, seed, verification | Only CLIENT and PROFESSIONAL specified |
| Q15 | Must the user be logged in to search, open a profile, and/or request an intervention? | Middleware, public pages | See conflict C13 |
| Q16 | Session model (JWT vs database sessions) and password hashing library? | Auth implementation | “Passwords must never be stored in plaintext” only |
| Q17 | Account recovery (forgot password) in V1? | Auth pages | Not specified |

---

## Payments

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q18 | V1: payment **statuses only**, or a live provider? | Scope of Phase 10 | See conflict C5 |
| Q19 | If a provider: which one (and Morocco-ready: CMI, Payzone, Stripe, other)? | Integration, legal, env | “According to the chosen solution” |
| Q20 | Who is paid (platform, professional, split) and when (before/after intervention)? | Payment entity, demo | Flow is quote accepted → intervention → payment → review |
| Q21 | Currency and rounding (MAD assumed from market, not specified)? | Quote/payment fields | Not specified |

---

## Map / location / search

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q22 | Map provider (Google Maps, Mapbox, MapLibre, Leaflet+OSM, other)? | API keys, cost, UX | “Real interactive map”; provider not chosen |
| Q23 | Marker precision: exact coordinates, approximate, or city-level for public view? | Privacy for professionals | DB has geocoordinates; visibility not specified |
| Q24 | Distance unit and default radius? | Filters | Distance filter listed, no defaults |
| Q25 | Search date: filter by availability slots, or just a preference stored on the request? | Availability schema vs search | Search UX includes date |

---

## Database / domain (schema not locked)

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q26 | Canonical booking state machine (full list vs simplified; quote/payment/review as statuses vs tables)? | Prisma models | See conflict C4 |
| Q27 | Availability model: recurring week grid, date-specific slots, or both? | Provider calendar | Entity named, fields not specified |
| Q28 | Service catalog: fixed V1 list only, or professionals can add custom services? | `Service` vs `ProviderService` | Categories listed as “possible”; “extensible” |
| Q29 | Portfolio media: images only? max count? who hosts files? | Uploads, storage | Portfolio required in V1 |
| Q30 | Soft delete, audit timestamps, and uniqueness rules (one review per booking, etc.)? | Schema integrity | Not specified |

---

## Notifications / communication

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q31 | How are parties notified (in-app only, email, SMS, WhatsApp)? | Request/quote/accept loops | Not specified |
| Q32 | Email/SMS provider if any? | Env, cost, deliverability | Not specified |
| Q33 | In-app messaging between client and professional in V1? | Scope | Not in V1 included list |

---

## Language / locale / content

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q34 | English-only UI: translate `Prix sur devis` and the chatbot stub, or keep those French strings? | Copy, tests | See C1. V1 UI = English is already a Phase 0 decision |
| Q35 | Arabic (or French) as a second language in V1? | i18n architecture | Not specified |
| Q36 | Timezone and date/number formats (e.g. Africa/Casablanca)? | Appointments, search “when” | Not specified |

---

## Design / frontend

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q37 | Existing HandyHome visual identity assets (logo, hex colors, type)? | Design tokens | Master describes qualities, not tokens or files. No assets in repo |
| Q38 | Dark mode in V1? | Tokens, QA | Product silent; skills disagree (C9) |
| Q39 | WCAG version (2.1 AA vs 2.2 AA)? | A11y acceptance | See C8 |
| Q40 | Component library (none, Radix/shadcn, other)? | Architecture | Not specified; skills say don’t invent a second system once one exists |

---

## Infrastructure / delivery

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q41 | Hosting (Vercel, other) and Postgres host (local Docker, Neon, etc.)? | Env, deploy | Not specified |
| Q42 | File/image storage for avatars, portfolio, verification docs? | Uploads | Not specified |
| Q43 | Environment variable list and secrets management? | Phase 1 setup | Master lists “environment variables” as architecture work, no list |
| Q44 | Git remote and CI? | Collaboration, Playwright in CI | No git repo at audit time |

---

## AI

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q45 | Exact V1 chatbot UI copy in **English**, placement, and whether it appears on all pages? | Floating button | Behavior specified; English copy not specified (French stub exists in master) |

V1 functional AI is **out of scope** (master §12, §32). Not an open product question.

---

## Skills / tooling (repo hygiene)

| ID | Question | Why it blocks implementation | Notes |
|---|---|---|---|
| Q46 | Operate with incomplete skill packages (missing `references/` and helpers) or restore full packages? | Quality of a11y/perf/animation audits | See C12 |
| Q47 | In-repo Playwright convention vs skill `/tmp` workflow? | Test location | See C11 |

---

## Suggested order for architecture (no answers implied)

Blockers that should be settled before Phase 1 implementation:

1. Q1 (baseline authority)  
2. Q11–Q16 (auth)  
3. Q22–Q24 (map)  
4. Q26–Q27 (booking + availability)  
5. Q18–Q21 (payment depth)  
6. Q31 (notifications at least: in-app vs none)  
7. Q37, Q39 (identity + a11y target)  
8. Q41–Q43 (runtime)  
9. Q34 (English copy for mandated French examples)
