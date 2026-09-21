# Phase 7 — Diagnosis + Quotes

**Status:** implemented for the 0€ development/demo V1  
**Stop line:** completed diagnosis → quote versions → client accept / decline  
**Not claimed:** payment, Stripe, intervention execution, reviews, notifications, AI

> Booking still does not set a final intervention price. Price exists only as a quote after diagnosis.

The implemented slice is:

```text
ACCEPTED booking
  → Professional starts diagnosis (DRAFT)
  → Professional completes diagnosis (COMPLETED)
  → Professional sends quote vN (SENT)
  → Client accepts (ACCEPTED) or declines (REJECTED)
```

If the client declines, the quote row is kept. The assigned professional may send the next version. No quote is created automatically.

## Diagnosis

`Booking 1 ─── 0..1 Diagnosis`

| Field | Rule |
|---|---|
| `bookingId` | Unique. One diagnosis per booking. |
| `findings` | Professional notes. Visible to the client only after `COMPLETED`. |
| `status` | `DRAFT` then `COMPLETED`. |

Ownership: authenticated `PROFESSIONAL` whose Provider owns the booking. Session identity is authoritative. Clients cannot create or modify a diagnosis. A professional cannot diagnose another professional's booking.

Quote creation is rejected server-side without a completed diagnosis:

```text
Complete the diagnosis before creating a quote.
```

## Quote

Reuses the existing `Quote` model. Phase 7 added `notes` only.

| Field | Rule |
|---|---|
| `amount` | `Decimal(12, 2)`, must be positive |
| `currency` | Server-set `MAD`. Not a currency engine. |
| `notes` | Professional description shown to the client |
| `version` | Server-assigned next integer for the booking |
| `status` | Create as `SENT`. Decline → existing `REJECTED` (UI: Declined). Accept → `ACCEPTED`. |

`DECLINED` was **not** added. The existing enum value `REJECTED` is the client refusal.

Invariants preserved:

- `@@unique(bookingId, version)`
- partial unique index `Quote_one_accepted_per_booking_idx`

Acceptance is transactional. A second `ACCEPTED` quote hits the database unique index.

Accepting a quote:

- sets booking `QUOTE_ACCEPTED`
- does **not** create `Payment`
- does **not** create `Review`
- does **not** move the booking to `INTERVENTION` / `COMPLETED`

## Booking statuses used here

```text
ACCEPTED
  → DIAGNOSIS          (start diagnosis)
  → QUOTE_PENDING      (quote sent; label: Quote sent)
  → QUOTE_ACCEPTED     (client accepted)
```

`APPOINTMENT_SCHEDULED` remains unused: Phase 6 already stores `scheduledAt` at create. `INTERVENTION` and later statuses are not set in Phase 7.

## Authorization

Every mutation: authenticate → role → load resource → ownership from session → Zod → mutate.

| Actor | Allowed |
|---|---|
| Assigned professional | start/complete diagnosis; create quote |
| Booking client | view completed diagnosis and quotes; accept/decline `SENT` |
| Other client / professional | forbidden |

## Public profile

Unchanged: **Price on quote**. No fake starting prices.

## Databases

- Demo: `handyhome` (`DATABASE_URL`)
- Playwright: `handyhome_e2e` (migrated and seeded in E2E global setup)

E2E bookings are created in `handyhome_e2e` only.

## Tests

- Unit/integration: `tests/marketplace/phase7.test.ts` (PH7-01–20)
- Playwright: `tests/e2e/diagnosis-quotes.spec.ts` (E2E-07-01–08)
