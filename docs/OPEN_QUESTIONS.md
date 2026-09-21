# HandyHome — Open Questions

**Phase:** 0.5 — Architecture Lock  
**Status:** OPEN — resolve only when the affected feature is implemented

## Business questions

| ID | Question | Why it matters | Status |
|---|---|---|---|
| B-01 | Is the diagnostic visit free or paid? | Affects booking, quote and payment rules. | Open — Phase 7 does **not** bill the diagnosis and does **not** invent a diagnostic fee. |
| B-02 | What happens if the client refuses a quote? | Affects state machine and provider workflow. | Partial — Phase 7: client decline sets `QuoteStatus.REJECTED` (UI: Declined), keeps the row, and the assigned professional may send the next version. Refunds, payments, and cancellation remain later. |
| B-03 | Who can assign the professional “verified” status? | Affects trust UI and provider data. | Open |
| B-04 | Is there a response deadline for a professional request? | Affects request expiration and notifications. | Open |
| B-05 | What are the cancellation and no-show rules? | Affects booking states and payment/refund behavior. | Open — Phase 6 does **not** add `CANCELLED`. A cancelled row that kept `scheduledAt` would still occupy the previous unique index; any future cancellation model must exclude inactive statuses from `Booking_provider_scheduledAt_active_key`. |
| B-06 | Should professionals without availability on the selected date be hidden or simply marked unavailable? | Affects search UX and filtering. | Open |
| B-07 | Is the exact client/provider address visible, or only an approximate location? | Important for privacy and map behavior. | Open |
| B-08 | How does a professional receive a new request in V1? | Dashboard-only vs email/push/SMS affects infrastructure. | Open — Phase 6 uses **dashboard state only**. No email, SMS, or push provider. |
| B-09 | What is HandyHome's commission and money flow? | Needed before real payment settlement is implemented. | Open — Phase 8 does **not** take commission or move money. |
| B-10 | Which payment method/provider is required? | Determines payment integration. | Open — Phase 8 uses domain `PENDING`/`PAID` only. No Stripe, PayPal, or card data. Client records the V1 state. Real PSP remains later. |
| B-11 | What provider verification process is expected? | Determines whether a “verified” badge is meaningful. | Open |

## Technical questions

| ID | Question | Current direction |
|---|---|---|
| T-01 | Which maintained auth library? | **Resolved for 0€ V1 demo:** Better Auth + existing PostgreSQL/Prisma. Not a claim of commercial production compliance. |
| T-02 | Which map provider? | **Resolved for 0€ V1 demo:** MapLibre GL JS + OpenFreeMap OSM-compatible tiles behind `src/lib/maps/`. No API key. Not a claim of commercial production lock-in; the adapter remains so the tile vendor can change. See `docs/PHASE_5_SEARCH_MAP.md`. |
| T-03 | Which media storage? | Use a storage abstraction; provider not locked. |
| T-04 | Which hosting / PostgreSQL provider? | Not locked. |
| T-05 | What notification provider? | Not locked. |
| T-06 | Is Arabic/French localization required later? | Not a V1 requirement; architecture should not block future i18n. |
| T-07 | Which exact 9/7 service categories are approved? | **Still open.** Phase 4 seeds a small English DEMO V1 catalog (see `docs/PHASE_4_MARKETPLACE_DATA.md`). It is not client-approved. |

## Client-validation gap

Cursor reported that no client-approved validation document is currently in the repository.

This is important because the Master Context explicitly says the approved validation document is the baseline. Until that source is available, technical implementation can proceed only on decisions already explicit in the Master Context and on clearly marked technical proposals.

## Rule

If an unresolved question changes:
- the business workflow,
- database semantics,
- authorization,
- payment,
- privacy,
- or a major user journey,

Cursor must stop and surface it rather than silently choosing an answer.


## Phase 1 disposition

The following questions do NOT block Phase 1 foundation because Phase 1 does not implement their business behavior:

- diagnostic pricing;
- quote refusal behavior;
- professional verification;
- response deadlines;
- cancellation/no-show;
- availability filtering;
- exact/approximate location display;
- notifications;
- commission/settlement;
- payment provider;
- final approved service categories.

They become blockers only when the corresponding feature enters implementation.

The following must be decided before the relevant technical implementation begins:

- authentication library before production authentication;
- media storage provider before production media upload;
- payment provider before real payment integration;
- hosting provider before production deployment.
