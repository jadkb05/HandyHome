# Phase 9 — Reviews and ratings

**Status:** implemented for the 0€ development/demo V1  
**Stop line:** one client review after paid completion, shown on the public profile  
**Not claimed:** replies, edits, deletion, moderation AI, notifications, reputation algorithms

```text
COMPLETED + Payment PAID
  → Client submits 1–5 rating (+ optional comment)
  → Review stored (one per booking)
  → Public professional profile shows real average and reviews
```

## Eligibility

Server-side, all of:

- authenticated `CLIENT`
- session user owns the booking
- `Booking.status = COMPLETED`
- `Payment.status = PAID`
- no existing review

`clientId` and `providerId` are copied from the booking. Browser values are ignored.

Professionals cannot create reviews. Booking status stays `COMPLETED` (`REVIEWED` unused).

Error when payment is not paid:

```text
Payment must be completed before leaving a review.
```

## Schema

Existing `Review` model reused.

Phase 9 migration:

- `UNIQUE Review.bookingId`
- `CHECK rating BETWEEN 1 AND 5`
- Booking relation is 1:0..1 (`review`)

No `updatedAt` (reviews are immutable). No fake seed reviews.

## Public profile

`listPublicReviewsForProvider` returns only:

- rating
- comment
- createdAt
- author display name (`User.name`)

Not included: email, phone, diagnosis, quote amount, payment, booking ids, appointment time.

Average is computed from stored integer ratings and displayed to **one decimal**. Count `0` shows “No reviews yet”, never a fake `5.0`.

## Tests

- `tests/marketplace/phase9.test.ts` — PH9-01–20
- `tests/e2e/reviews.spec.ts` — E2E-09-01–09 on `handyhome_e2e`
