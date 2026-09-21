# HandyHome — Architecture Decisions

**Project:** HandyHome  
**Agency:** KB Agency  
**Phase:** 0.5 — Architecture Lock  
**Status:** LOCKED FOR V1 FOUNDATION — unresolved business/vendor choices remain open  
**V1 interface language:** English

> This document separates confirmed product constraints from technical decisions proposed for implementation. Unresolved business rules remain in `OPEN_QUESTIONS.md`.

## 1. Product decisions

### Confirmed

- HandyHome V1 is a real-data home-services marketplace.
- Two primary roles exist: `CLIENT` and `PROFESSIONAL`.
- The core journey is:
  `Search → Professional → Request → Appointment → Diagnosis → Quote → Accept → Intervention → Payment → Review`.
- There is no mandatory problem-description form in the core workflow.
- There is no fake fixed final price before diagnosis.
- The final price is determined by the professional after diagnosis and communicated through a quote.
- Phase 7: diagnosis is a booking-owned `DRAFT` → `COMPLETED` record. A quote can be created only after a completed diagnosis. Client decline uses existing `QuoteStatus.REJECTED` (UI label: Declined). After accept, the booking is `QUOTE_ACCEPTED`. Intervention, payment, and reviews remain later phases.
- Professionals must be stored in the database and become discoverable through search/map.
- The map must be real, interactive, and database-driven.
- V1 chatbot is UI-only; no AI is part of the core booking flow.
- Raw card data must never be stored in the HandyHome database.
- V1 interface language is **English**.
- HandyHome must not use a generic AI/SaaS visual template.

### Source-of-truth hierarchy

1. Explicit client-approved requirements
2. HandyHome V1 validation document
3. Existing repository architecture/conventions
4. ChatGPT + Claude technical decisions
5. Skills/general defaults

The repository currently reports that the client-approved validation document is not present. Therefore, business decisions that are not explicitly documented must remain open rather than being invented.

## 2. Technical decisions

### Stack

**Proposed:**
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Maintained authentication library
- Schema validation with Zod
- Playwright for browser/E2E testing

Exact library versions and auth provider are to be locked after technical review.

### Authentication

**V1 requirement:**
- Real authentication.
- Passwords are hashed.
- No plaintext passwords.
- Server-side role enforcement.
- Server-side ownership checks.
- Client resources cannot be accessed by another client.
- Professional resources cannot be modified by another professional.
- Validation at API/server boundaries.

**Decision:** do not build homegrown authentication.

**Phase 3 lock (0€ demo):** Better Auth + PostgreSQL + Prisma. No paid auth SaaS, no email/SMS provider, no Stripe. Identity is the existing `User` row (`CLIENT` / `PROFESSIONAL`). See `docs/PHASE_3_AUTH.md`.

### Roles

```text
CLIENT
PROFESSIONAL
```

Administrative functionality is not part of the current V1 scope unless the client explicitly requires it.

### Dates and time

Use one canonical appointment timestamp:

```text
scheduledAt
```

Store timestamps in UTC and display them in the application's chosen business timezone (`Africa/Casablanca`) unless a later client decision changes the display policy.

Do not model appointment time as unrelated date/time strings.

### Booking integrity

- Booking status transitions are centralized.
- Illegal transitions are rejected.
- Double booking must be prevented with transactional/database safeguards.
- Business-state logic must be unit tested.

### Quotes

A booking may have multiple quote revisions:

```text
Booking 1 → N Quotes
```

Only one quote can be the active/accepted quote for the booking at a time.

This supports quote revision after refusal without overwriting historical quote records.

Phase 7 implements that lifecycle:

- Professional assigned to the booking starts and completes diagnosis (`src/features/diagnosis/`).
- Same professional creates a `SENT` quote with server-assigned `version` (`src/features/quotes/`).
- Client who owns the booking accepts (`ACCEPTED`) or declines (`REJECTED`).
- A declined quote stays in history. The professional may send the next version.
- Currency is `MAD` (existing Quote.currency; no currency engine).
- Accepting a quote does **not** create a Payment or Review and does **not** move the booking to `INTERVENTION` / `COMPLETED`.

Phase 8 continues from `QUOTE_ACCEPTED`:

- Assigned professional starts intervention (`INTERVENTION`) then completes it (`PAYMENT` = payment pending).
- Completing intervention creates one `Payment` snapshot from the accepted quote (`PENDING`, amount/currency copied, `MAD`).
- The **client who owns the booking** records the V1 payment state (`PaymentStatus.PAID`, booking `COMPLETED`). This is a domain acknowledgement, not a card charge.
- `lib/payments` remains an unused PSP adapter. No Stripe/PayPal. No card fields.

### Payment

Phase 8 implements a **payment state record**, not a payment gateway.

```text
QUOTE_ACCEPTED
→ INTERVENTION          (professional starts)
→ PAYMENT               (intervention completed; Payment PENDING)
→ COMPLETED             (client records payment state; Payment PAID)
```

V1 confirmation rule: only the client who owns the booking can mark the payment `PAID`. The professional dashboard does not offer a payment button.

Amount is a snapshot of the accepted quote at payment-row creation. Browser-submitted amounts are ignored. Currency remains `MAD`.

`Payment.bookingId` is unique (one payment per booking). A `PAID` payment has no reverse transition to `PENDING`.

A real PSP/provider is **not** locked (OPEN_QUESTIONS B-10). The application must not store raw card details.

### Reviews

Phase 9: one overall integer rating (1–5) plus optional comment, **one review per booking**.

Eligibility:

- authenticated `CLIENT`
- owns the booking
- booking `COMPLETED`
- payment `PAID`
- no existing review

`clientId` and `providerId` come from the booking row, not the browser. Professionals cannot create, edit, or delete reviews. Reviews are immutable after submit. Booking status stays `COMPLETED` (`REVIEWED` is unused).

Public professional profiles show average (one decimal) and count **only from real Review rows**. No fake seed reviews. Public review DTOs exclude diagnosis, quotes, payments, email, and phone.

### Maps

Use a map-provider abstraction rather than coupling the domain directly to one provider.

Conceptually:

```text
features/search
      ↓
lib/maps
      ↓
Map provider
```

Provider selection for commercial production remains open. For the 0€ V1 demo, MapLibre GL JS + OpenFreeMap is wired through `lib/maps` (`docs/PHASE_5_SEARCH_MAP.md`).

### Geospatial search

Provider records contain latitude/longitude.

For proximity search, a bounding-box prefilter plus Haversine distance calculation is an acceptable V1 direction. A more advanced geospatial database solution can be introduced if measured requirements justify it.

### Media

Profile and portfolio images should not be stored as raw binary blobs in normal relational records.

Store:
- media metadata
- stable storage/object URL or storage key

Use an abstraction so the storage provider can change later.

### English / future localization

V1 is English.

The codebase should avoid hardcoding English strings into business logic and should keep presentation copy organized so localization can be introduced later.

Arabic/RTL and French are not V1 deliverables.

### Testing

Testing follows task size:

- Small task: typecheck, lint, acceptance criteria.
- Business feature: typecheck, lint, build, business-logic tests.
- End of phase: Playwright, responsive checks, accessibility, screenshots, performance.
- Pre-delivery: full E2E, accessibility, performance, security review, production build and client demo.

## 3. Explicitly not decided here

The following remain open:
- production hosting / managed auth beyond the 0€ Better Auth + PostgreSQL demo
- commercial map vendor beyond the 0€ MapLibre + OpenFreeMap demo adapter
- media storage provider
- payment provider
- notification provider
- diagnostic pricing (B-01 remains open; Phase 7 does not bill the diagnosis)
- quote refusal beyond decline + next version (no refund/payment path)
- cancellation/no-show rules
- professional verification process
- exact vs approximate location display
- provider response deadline
- commission/money flow
- final language/localization strategy beyond English V1
- hosting/deployment provider

See `OPEN_QUESTIONS.md`.


## 4. Architecture-lock rules

The following are locked for implementation:

- English is the V1 interface language.
- Client and Professional are distinct roles.
- Real authentication and server-side authorization are required.
- PostgreSQL + Prisma is the V1 data foundation.
- Booking/quote/payment business logic belongs on the server.
- `scheduledAt` is the canonical appointment timestamp.
- Quote history is preserved with a 1-to-many Booking → Quote relationship.
- Raw card data is never stored.
- Maps, media and payments are accessed through adapters.
- V1 chatbot is UI-only.
- No mandatory problem-description form is introduced.
- No fixed final service price is invented before diagnosis.

The following are intentionally NOT locked:
- vendor/provider choices;
- diagnostic pricing;
- cancellation/no-show rules;
- provider verification rules;
- notification channels;
- commission/settlement rules;
- final service-category list if the client-approved source is unavailable.

Cursor must not silently decide any of these.
