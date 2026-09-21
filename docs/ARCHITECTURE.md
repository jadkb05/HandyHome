# HandyHome — Technical Architecture

**Phase:** 0.5 — Architecture Lock  
**Status:** LOCKED V1 FOUNDATION  
**Language:** English V1

## 1. System shape

```text
Browser / Mobile Web
        ↓
Next.js Application
        ↓
┌──────────────────────────────────────┐
│ Presentation                         │
│ Pages / layouts / components         │
├──────────────────────────────────────┤
│ Feature domains                      │
│ auth / providers / services          │
│ search / bookings / diagnosis / quotes │
│ payments / reviews / favorites       │
├──────────────────────────────────────┤
│ Application / server logic           │
│ authorization / validation           │
│ state transitions / transactions     │
├──────────────────────────────────────┤
│ Infrastructure adapters              │
│ auth / maps / media / payments       │
├──────────────────────────────────────┤
│ PostgreSQL + Prisma                  │
└──────────────────────────────────────┘
```

## 2. Repository direction

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── providers/
│   ├── services/
│   ├── search/
│   ├── bookings/
│   ├── diagnosis/
│   ├── quotes/
│   ├── payments/
│   ├── reviews/
│   └── favorites/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── maps/
│   ├── media/
│   ├── payments/
│   └── validation/
└── types/

prisma/
docs/
skills/
```

This is a baseline, not a requirement to force every file into a feature folder.

## 3. Request flow

```text
Client
  ↓
Search
  ↓
Provider profile
  ↓
Request intervention
  ↓
Provider accepts
  ↓
Appointment scheduled
  ↓
Diagnosis
  ↓
Quote sent
  ↓
Client accepts quote
  ↓
Intervention
  ↓
Payment
  ↓
Review
```

No mandatory problem-description form is inserted into this flow.

## 4. Authorization model

Every protected server operation must establish:

1. authenticated user
2. role permission
3. resource ownership / allowed relationship
4. validated input

Example:

```text
CLIENT
  └─ can read/write own profile
  └─ can create own requests
  └─ can access own quotes/payments/reviews

PROFESSIONAL
  └─ can manage own provider profile
  └─ can manage own availability/services/portfolio
  └─ can process requests assigned to them
  └─ can create/update diagnosis, quotes, and intervention for their own bookings
  └─ cannot access another professional's diagnosis, quotes, intervention, or payments

CLIENT (Phase 7–8)
  └─ can view completed diagnosis and quotes on own bookings
  └─ can accept or decline a SENT quote on own bookings
  └─ cannot create or modify diagnosis or quotes
  └─ can record the V1 payment state on own bookings after intervention completion
  └─ can leave one review on own COMPLETED + PAID bookings
  └─ cannot review another client's booking

PROFESSIONAL (Phase 9)
  └─ can see public reviews on the public profile
  └─ cannot create, edit, or delete client reviews
```

Authorization must be enforced server-side, not only by hiding UI.

## 5. Booking state machine

Recommended canonical states:

```text
REQUESTED
  ↓
ACCEPTED
  ↓
APPOINTMENT_SCHEDULED
  ↓
DIAGNOSIS
  ↓
QUOTE_PENDING
  ↓
QUOTE_ACCEPTED
  ↓
INTERVENTION
  ↓
PAYMENT
  ↓
COMPLETED
  ↓
REVIEWED
```

`QUOTE_SENT` is represented by a quote record (`QuoteStatus.SENT`) plus booking `QUOTE_PENDING`.

Phase 8 implements `QUOTE_ACCEPTED` → `INTERVENTION` → `PAYMENT` → `COMPLETED` and **stops**. `REVIEWED` is not transitioned here. `APPOINTMENT_SCHEDULED` is unused: Phase 6 already stores `scheduledAt` at booking create.

`BookingStatus.PAYMENT` means payment pending. `COMPLETED` means the payment state was recorded (not a PSP settlement).

Phase 9 adds a review after `COMPLETED` + `PAID`. Booking status does **not** move to `REVIEWED`. Diagnosis notes and payment amounts are not public review/profile fields.

Quote creation is rejected unless a completed diagnosis exists. Quote versions are assigned server-side. At most one `ACCEPTED` quote per booking (`Quote_one_accepted_per_booking_idx`).

Diagnosis and quote mutations live in `src/features/diagnosis/` and `src/features/quotes/` and are tested.

## 6. Database access

Prisma is the proposed ORM/data-access layer.

Rules:
- no direct client-side database access
- server-side validation
- transactions for multi-record business operations
- indexes on high-value search/filter fields
- unique constraints for identity and ownership invariants where appropriate

## 7. Search and map

Search inputs:

```text
Where?
Service?
When?
```

Results combine:
- provider profile
- services
- availability
- location
- distance
- rating where available

Desktop:
```text
Results list | Interactive map
```

Mobile:
```text
Map + responsive result list / bottom sheet
```

Map markers are generated from database providers.

The map provider is isolated behind `lib/maps`. Phase 5 uses MapLibre GL JS + OpenFreeMap through that adapter (`docs/PHASE_5_SEARCH_MAP.md`).

## 8. Media

Profile and portfolio media use:
- metadata in PostgreSQL
- actual media in external/object/file storage

The storage implementation is behind `lib/media`.

Do not make business logic depend on one storage vendor.

## 9. Payment boundary

The application domain depends on a payment **state** in Phase 8, not on a PSP.

```text
Payment domain (PENDING → PAID snapshot)
     ↓
PaymentService interface (lib/payments) — unused in V1
     ↓
Provider adapter — not selected (B-10)
```

Phase 8 never calls `getPaymentService()`. No Stripe, PayPal, card form, or provider reference is written.

## 10. Environment configuration

Secrets must be environment variables.

Examples:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
MAP_PROVIDER_KEY
MEDIA_STORAGE_*
PAYMENT_*
```

Exact names depend on the selected providers.

Never commit secrets.

## 11. Design system

The design system should define:
- typography
- color tokens
- spacing
- radii
- borders
- elevation
- states
- buttons
- forms
- navigation
- cards
- map/list patterns

Visual direction:
premium, modern, professional, trustworthy, clean, urban, locally relevant, mobile-first and distinctive.

Avoid generic AI/SaaS patterns.

## 12. Accessibility

Target WCAG AA principles:
- semantic HTML
- keyboard navigation
- visible focus
- correct labels
- adequate contrast
- clear errors
- responsive behavior
- reduced motion

Accessibility is part of implementation, not only final QA.

## 13. Performance

Track:
- LCP
- INP
- CLS
- TTFB
- bundle size
- image loading

Target direction:
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

Measure before optimizing.

## 14. Deployment

Deployment provider is not yet locked.

The final V1 environment needs:
- public web hosting
- hosted PostgreSQL
- media storage
- environment secrets
- production build
- HTTPS
- reproducible migrations

## 15. Demo data

The public/demo environment should contain realistic provider data around Casablanca so:
- search returns results
- map contains markers
- profiles are populated
- the end-to-end demo can be executed

Demo data must be clearly identified and must not be presented as real verified professionals.

## 16. Architectural rule

When an unresolved business decision affects architecture, do not invent a rule in code.

Surface the ambiguity, update `OPEN_QUESTIONS.md`, and obtain a decision before implementing the affected behavior.


## 17. Phase 1 boundary

Phase 1 is foundation only:

- project initialization;
- application shell;
- design-token foundation;
- database connection/configuration;
- Prisma foundation;
- validation/configuration foundation;
- testing/lint/typecheck/build setup;
- authentication foundation only if the selected library is explicitly locked.

Phase 1 must NOT implement:
- the complete booking workflow;
- real marketplace search;
- real map integration;
- payment processing;
- AI;
- invented provider data presented as real;
- unresolved business rules.

This boundary is intentional. Later phases will implement the marketplace incrementally.
