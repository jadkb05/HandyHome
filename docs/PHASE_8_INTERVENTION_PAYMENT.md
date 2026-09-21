# Phase 8 — Intervention + payment state

**Status:** implemented for the 0€ development/demo V1  
**Stop line:** intervention complete → payment PENDING → client records PAID  
**Not claimed:** reviews, Stripe, PayPal, card charges, refunds, notifications, AI

> This is a domain payment **state**, not a financial transfer.

```text
QUOTE_ACCEPTED
  → Professional starts intervention     (Booking INTERVENTION)
  → Professional completes intervention  (Booking PAYMENT + Payment PENDING)
  → Client records payment state         (Booking COMPLETED + Payment PAID)
```

## Booking statuses reused

No new `BookingStatus` values. Mapping:

| Enum | Meaning in Phase 8 |
|---|---|
| `QUOTE_ACCEPTED` | Quote accepted; intervention not started |
| `INTERVENTION` | Intervention in progress |
| `PAYMENT` | Intervention completed — payment pending |
| `COMPLETED` | Payment recorded |

`REVIEWED` is unused. `APPOINTMENT_SCHEDULED` remains unused (slot stored at booking create).

## Intervention

Only the assigned professional.

- Start: booking must be `QUOTE_ACCEPTED` **and** have an `ACCEPTED` quote.
- Complete: booking must be `INTERVENTION`. Transaction: snapshot payment + booking `PAYMENT`.

Clients cannot start or complete. Another professional cannot.

## Payment model

Reuses existing `Payment` (`bookingId` unique, `quoteId`, amount, currency). Phase 8 adds `PaymentStatus`:

```text
PENDING | PAID
```

`providerReference` stays unused. No card, CVV, IBAN, or PSP token fields.

### Snapshot

On complete-intervention, amount and currency are copied from the accepted quote. The browser cannot supply the amount. Currency remains **MAD**.

### V1 confirmation rule

Only the **client who owns the booking** can record `PAID`.

Rationale: the professional dashboard must not show a fake payment button; there is no PSP; this is an acknowledgement of state, not “card charged”.

`lib/payments.getPaymentService()` still throws. It is not called.

## Invariants

- One payment row per booking (`Payment.bookingId` unique)
- Payment references the accepted quote
- Amount equals that quote at creation
- Currency `MAD`
- No payment without accepted quote
- Cannot mark `PAID` before intervention completion (booking must be `PAYMENT`)
- No application path from `PAID` back to `PENDING`
- Completing intervention twice cannot create a second payment

## UI copy (English)

- Quote accepted / Start intervention
- Intervention in progress / Complete intervention
- Intervention completed — payment pending / Record payment (client)
- Payment recorded

The UI does not say “Card charged”, “Stripe”, or “Transaction successful”.

## Tests

- `tests/marketplace/phase8.test.ts` — PH8-01–20
- `tests/e2e/intervention-payment.spec.ts` — E2E-08-01–12 on `handyhome_e2e` only
