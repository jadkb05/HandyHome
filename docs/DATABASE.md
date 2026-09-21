# HandyHome — Database Design

**Phase:** 0.5 — Architecture Lock  
**Status:** LOCKED V1 DATA MODEL BASELINE  
**ORM:** Prisma  
**Database:** PostgreSQL

## 1. Core model

```text
User
 ├── Client-owned bookings
 └── Provider profile ── ProviderService ── Service
                         │
                         ├── Availability
                         └── Portfolio

Booking
 ├── Appointment data
 ├── Diagnosis (0..1)
 ├── Quote(s)
 ├── Payment
 └── Review

User
 └── Favorite ── Provider
```

## 2. User

Purpose: authentication identity and role.

Conceptual fields:

```text
id
name
email
phone
passwordHash
role
createdAt
updatedAt
```

Role:

```text
CLIENT
PROFESSIONAL
```

Phase 3 authentication (Better Auth) maps to this same `User` row. Login hashes live on `Account.password`. `User.passwordHash` remains optional/legacy and is not used for login. Better Auth also stores `emailVerified`, optional `image`, and related `Session` / `Account` / `Verification` rows. See `docs/PHASE_3_AUTH.md`.

## 3. Provider

Represents the professional marketplace profile.

Conceptual fields:

```text
id
userId
profession
description
experience
city
address / location representation
latitude
longitude
verified
createdAt
updatedAt
```

`verified` must not be presented as a meaningful trust signal unless the verification process is defined.

## 4. Service

Represents a service category/type offered on HandyHome.

Conceptual fields:

```text
id
name
slug
description
createdAt
updatedAt
```

Do not invent the final category list until the client-approved source is available.

Phase 4 seeds a small DEMO V1 catalog in PostgreSQL for demonstration only. See `docs/PHASE_4_MARKETPLACE_DATA.md`. T-07 remains open.

## 5. ProviderService

Many-to-many relationship:

```text
Provider ↔ Service
```

Conceptual fields:

```text
providerId
serviceId
```

Use a unique constraint on the pair.

## 6. Availability

Represents professional availability.

The exact recurrence model is still a technical detail to finalize.

Potential conceptual fields:

```text
id
providerId
dayOfWeek
startTime
endTime
active
```

Appointments remain actual timestamps rather than being derived solely from recurring availability.

## 7. Booking

Represents an intervention request and its lifecycle.

Conceptual fields:

```text
id
clientId
providerId
serviceId
scheduledAt
status
createdAt
updatedAt
```

Potential optional fields must be justified by approved requirements.

### Invariants

- client must own the booking request
- provider must be the assigned professional
- service must be valid
- illegal status transitions are rejected
- double booking is prevented
- `scheduledAt` is stored consistently
- Phase 6: `REJECTED` is a terminal decline of `REQUESTED`. It does not occupy the slot index.
- Double-booking unique index: `UNIQUE (providerId, scheduledAt) WHERE scheduledAt IS NOT NULL AND status <> 'REJECTED'`
- Client cancellation is not modeled (OPEN_QUESTIONS B-05). A future `CANCELLED` status would also need to be excluded from this index.
- Phase 8: `QUOTE_ACCEPTED` → start intervention → `INTERVENTION`; complete intervention → `PAYMENT` plus one `Payment` snapshot; client records payment → booking `COMPLETED` and `PaymentStatus.PAID`. No `REVIEWED`.

## 8. Diagnosis

Phase 7: one diagnosis per booking.

```text
Booking 1 ─── 0..1 Diagnosis
```

```text
id
bookingId   (unique)
findings
status      DRAFT | COMPLETED
createdAt
updatedAt
```

- Only the assigned professional can create or complete it.
- Clients see findings only after `COMPLETED`.
- Quote creation requires `COMPLETED`.
- No attachments, AI, or checklists in V1.

## 9. Quote

A booking can have multiple quote records.

```text
Booking 1 ─── N Quote
```

Conceptual fields:

```text
id
bookingId
amount          Decimal(12, 2)
currency        MAD in V1 (server-set)
notes           professional description shown to the client
status
version
createdAt
updatedAt
```

Quote status (existing enum; Phase 7 does not add `DECLINED`):

```text
DRAFT        unused in Phase 7 create path
SENT         professional sent; client can accept or decline
REJECTED     client declined (UI: Declined); row kept for history
ACCEPTED     client accepted; at most one per booking
SUPERSEDED   unused in Phase 7
```

Invariants:
- `@@unique(bookingId, version)` — versions are assigned server-side; old quotes are never overwritten.
- partial unique index `Quote_one_accepted_per_booking_idx` — at most one `ACCEPTED` quote per booking.
- create is rejected without a completed diagnosis, if a `SENT` quote is already awaiting the client, or if an `ACCEPTED` quote already exists.

## 10. Payment

Existing model, reused in Phase 8. One payment per booking (`Payment.bookingId` unique).

```text
id
bookingId          unique
quoteId            accepted quote
amount             snapshot of accepted quote.amount
currency           MAD
status             PaymentStatus PENDING | PAID
providerReference  unused; never a card/PSP secret
createdAt
updatedAt
```

Domain statuses (not a PSP):

```text
PENDING   created when the professional completes the intervention
PAID      client who owns the booking recorded the V1 payment state
```

Invariants:
- cannot be created without an accepted quote
- amount/currency copied from that quote at creation (later quote edits would not change the snapshot; V1 has no quote edit)
- cannot become `PAID` before booking `PAYMENT` (intervention completed)
- `PAID` has no application path back to `PENDING`

Never store:
- full card number
- CVV
- raw payment credentials

Payment status is distinct from quote status. `BookingStatus.PAYMENT` = payment pending. `BookingStatus.COMPLETED` = payment recorded.

## 11. Review

One review per booking (`Review.bookingId` unique). Integer rating 1–5 (`Review_rating_check`). Optional comment.

```text
id
bookingId   unique
clientId    from booking, not the browser
providerId  from booking, not the browser
rating      1–5
comment     optional
createdAt
```

Eligibility (application + unique index):
- client owns booking
- `Booking.status = COMPLETED`
- `Payment.status = PAID`
- no existing review

Public profile queries select only rating, comment, createdAt, and client display name. They do not include diagnosis, quotes, payments, email, or phone.

Demo seed does not create reviews. Empty profiles show “No reviews yet”.

Business rule:
- one review per completed/paid booking — **implemented in Phase 9**.

## 12. Favorite

Represents a client saving a provider.

```text
id
clientId
providerId
createdAt
```

Use a unique constraint:

```text
(clientId, providerId)
```

## 13. Portfolio

Provider-owned media.

Conceptual fields:

```text
id
providerId
mediaKey / url
altText
title / caption
sortOrder
createdAt
updatedAt
```

Actual media bytes should live outside PostgreSQL in the selected storage system.

## 14. Indexing direction

Likely indexes:
- User.email
- Provider.userId
- Provider latitude/longitude-related search strategy (bbox prefilter + Haversine in application code for V1)
- Provider.address (neighborhood filter; added in Phase 5)
- ProviderService.serviceId
- Booking.clientId
- Booking.providerId
- Booking.scheduledAt
- Booking.status
- Diagnosis.bookingId (unique)
- Quote.bookingId
- Payment.bookingId
- Review.providerId
- Favorite.clientId

Exact indexes should be validated against query patterns before migration.

## 15. Transactions

Transactions are required for operations where multiple records must remain consistent, especially:
- accepting a booking
- scheduling an appointment
- accepting a quote
- payment state changes
- review creation where uniqueness must be enforced

## 16. Migration rule

Prisma migrations are version-controlled.

Do not modify production schema manually without a migration.

Before each schema migration:
- validate invariants
- run relevant tests
- inspect generated SQL when risk is non-trivial


## 17. Schema implementation rule

The entities and invariants in this document are the approved V1 baseline.

Before writing the first Prisma migration, Cursor must convert the conceptual fields into an explicit schema and run a schema review against:

- authorization/ownership;
- uniqueness;
- referential integrity;
- quote revision history;
- appointment conflicts;
- timestamps;
- nullable vs required fields.

If implementation requires a business rule not represented here, stop and surface it rather than inventing it.
