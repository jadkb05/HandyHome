# Phase 6 — Booking / request intervention

**Status:** implemented for the 0€ development/demo V1  
**Stop line:** appointment request + professional accept/decline  
**Not claimed:** diagnosis, quotes, payment, reviews, favorites, notifications, AI

> Phase 6 does not determine the final intervention price.

The implemented slice is:

```text
Professional profile
  → Request intervention
  → Choose service (from ProviderService)
  → Appointment slot (Casablanca time)
  → Booking (REQUESTED)
  → Professional dashboard (Accept / Decline)
```

Diagnosis, quote, payment, and review remain later phases.

## Booking lifecycle

```text
CLIENT creates booking
        ↓
    REQUESTED   (UI label: Pending)
        ↓
PROFESSIONAL Accept → ACCEPTED
        or
PROFESSIONAL Decline → REJECTED
```

`REQUESTED` is the existing schema pending state. Phase 6 did not add a parallel `PENDING` value.

Later schema values (`APPOINTMENT_SCHEDULED`, `DIAGNOSIS`, `QUOTE_PENDING`, …) exist on the enum for later phases. Phase 6 does not transition into them.

## Status semantics

| Status | Who sets it | Meaning in Phase 6 |
|---|---|---|
| `REQUESTED` | Server, on create | Client asked for that appointment. Occupies the slot. |
| `ACCEPTED` | Assigned professional | Professional agreed to the appointment. Occupies the slot. Stop before diagnosis. |
| `REJECTED` | Assigned professional | Professional declined. Row is kept for history. **Does not occupy the slot.** |

Illegal transitions (anything other than `REQUESTED` → `ACCEPTED` / `REJECTED`) are rejected in `src/features/bookings/transitions.ts`.

### Cancellation

Client/professional **cancellation is not implemented**.

`OPEN_QUESTIONS` B-05 is still open. A `CANCELLED` status that kept `scheduledAt` would block the slot unless the unique index excluded it, which is why cancellation was deferred rather than added as a silent broken model.

## Timezone handling

| Layer | Rule |
|---|---|
| Database | `Booking.scheduledAt` is `timestamptz` UTC. There are no separate date/time columns. |
| Business display | `Africa/Casablanca` |
| Browser/host TZ | Not used as the business timezone |

Conversion lives in `src/lib/datetime.ts` (`zonedCivilToUtc`, `civilDateInBusinessTimezone`, formatters). Example:

```text
Client selects 2026-10-05 14:00 Casablanca
→ stored 2026-10-05T13:00:00.000Z
→ displayed 14:00 Casablanca time
```

The booking UI states: “Times are in Casablanca time.”

## Availability and slot generation

Availability is the existing weekly `Availability` model:

- `dayOfWeek`: 0 = Sunday … 6 = Saturday
- `startTime` / `endTime`: clock values stored as UTC hours on a dummy date (same convention as Phase 4)
- Clock values are interpreted as **Casablanca wall time**, not as instants

V1 slot rules (`src/features/bookings/slots.ts`):

- 60-minute interval
- 14-day lookahead from the current Casablanca civil date
- End time is exclusive (`08:00–16:00` → last start `15:00`)
- Past instants are omitted
- Occupied instants (non-`REJECTED` bookings) are omitted
- If the professional has no availability rows: “No availability is currently listed for this professional.”

This is not a configurable calendar engine.

## Service context

The client **must choose a service** the professional actually offers (`ProviderService` + `Service`).

There is still **no** mandatory “describe your problem” field.

On create, the server:

1. reads `serviceId` from the request
2. looks up `ProviderService(providerId, serviceId)`
3. rejects the booking if that pair does not exist

There is no fallback to the first service alphabetically. A professional with one service may have that option preselected in the UI, but `serviceId` is still sent and validated.

If the professional has no `ProviderService` rows, booking is ineligible.

## Double-booking protection

Application checks hide taken slots and reject stale submissions.

The integrity boundary is the database unique index:

```sql
UNIQUE (providerId, scheduledAt)
WHERE scheduledAt IS NOT NULL AND status <> 'REJECTED'
```

Index name: `Booking_provider_scheduledAt_active_key`.

Phase 6 changed the predicate so a `REJECTED` row can keep `scheduledAt` for history without blocking a later request for the same instant. Concurrent creates that pass the application check still collide on this index; Prisma `P2002` is mapped to:

“This time slot is no longer available.”

Prisma/SQL errors are not shown in the UI.

## Ownership

| Actor | Create | Read | Update |
|---|---|---|---|
| Anonymous | No (sign-in CTA) | No | No |
| `CLIENT` | Yes, `clientId` = session user id | Own bookings only | No status updates in Phase 6 |
| `PROFESSIONAL` | No (cannot book as a client) | Bookings for the Provider they own | Accept/decline those bookings only |

Server derivation:

- `clientId` = `ownerIdFromSession(authenticated CLIENT)`
- `providerId` = validated Provider row (must belong to a `PROFESSIONAL` user and have at least one service)
- `serviceId` = client-selected service that exists on `ProviderService` for that provider
- `scheduledAt` = server-parsed UTC instant that is an open slot
- `status` = `REQUESTED` on create; accept/decline only from the assigned professional

Hidden form fields, query parameters, and claimed `clientId` / `providerId` values cannot select another owner. Professional listing never takes a provider id from the URL.

## Client flow

1. Public profile → **Request intervention**
2. Anonymous users see a sign-in CTA (`/login?from=/professionals/{id}/book`)
3. Authenticated client chooses a service offered by that professional, then a date, then a Casablanca time
4. Confirm appointment
5. “Your intervention request has been submitted.” Status: Pending
6. The same booking appears on `/dashboard`

No price is shown on the booking itself. The profile/booking copy may say “Price on quote”.

## Professional flow

`/professional/dashboard` lists incoming bookings for the session user’s Provider.

For `REQUESTED` rows the professional can **Accept** or **Decline**. Dashboard state is the only notification channel.

## 0€ constraint

Phase 6 uses Next.js, PostgreSQL, Prisma, and Better Auth only.

It does not add Stripe, email, SMS, AI, a paid calendar, or an external booking SaaS.

## Limitations

- No cancellation / no-show
- No diagnosis or quote
- No payment
- No email/SMS
- Unverified professionals remain bookable (verification process is still open)
- Weekly availability only; no date-specific exceptions
- Morocco Ramadan UTC offset follows the host ICU timezone data

## Deferred to Phase 7+

- Diagnosis
- Quotes and pricing
- Payment
- Reviews
- Favorites
- Notifications
- Cancellation policy
- Appointment-scheduled / later booking statuses
