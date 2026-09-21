# Phase 3 — Authentication and authorization

**Status:** implemented for the 0€ development/demo V1  
**Library:** Better Auth `1.7.5`  
**Identity store:** existing Prisma `User` + PostgreSQL  
**Not claimed:** commercial production compliance, email verification, 2FA, or paid hosting SLAs

This phase adds sign-up, login, logout, server sessions, role checks, and ownership helpers. It does **not** add marketplace search, bookings, quotes, maps, payments, reviews, or favorites.

## Better Auth architecture

```text
Browser
  → /login /register (branded UI)
  → POST /api/auth/* (Better Auth Next.js handler)
  → betterAuth({ prismaAdapter, emailAndPassword, nextCookies })
  → PostgreSQL
       User (application identity + role)
       Account.password (hashed credential)
       Session (server session)
       Verification (library table; email sending is not configured)
```

Configuration lives in `src/lib/auth/`. The catch-all route is `src/app/api/auth/[...all]/route.ts`.

Email/password is the only enabled method. There is no OAuth, magic link, SMS, or hosted auth SaaS.

## User ↔ authentication identity

There is **one** application user model: Prisma `User`.

Better Auth writes into that table (plus `Account`, `Session`, `Verification`). It does not introduce a competing `AppUser`.

| Field | Owner | Why |
|---|---|---|
| `User.id` | shared | Session `user.id` is the marketplace owner id |
| `User.email` | shared | unique login identifier |
| `User.name` | Better Auth + app | required by Better Auth sign-up |
| `User.role` | app, validated by Better Auth additional field | `CLIENT` or `PROFESSIONAL` only |
| `User.emailVerified` | Better Auth | required by the library; stays `false` because no email provider is configured |
| `User.image` | Better Auth | optional library field; unused in UI |
| `User.phone` | app | optional; not required to register |
| `User.passwordHash` | Phase 2 leftover | nullable; **not used for login** |
| `Account.password` | Better Auth | hashed password |
| `Provider` | app | created as an unverified stub when a PROFESSIONAL registers |

Registration of a professional does **not** mark `Provider.verified = true`.

## Session model

- Sessions are stored in PostgreSQL (`Session`).
- The browser holds an HTTP-only Better Auth cookie set by `nextCookies()`.
- `auth.api.getSession({ headers })` is the server source of truth.
- Helpers: `getCurrentUser()`, `requireAuth()`, `requireRole("CLIENT" | "PROFESSIONAL")`.
- Page helpers `requirePageAuth()` / `requirePageRole()` redirect instead of throwing.

Do not trust localStorage, client React state, URL `userId`, or a homemade cookie for role or identity.

## Role authorization

| Area | Rule |
|---|---|
| `/login`, `/register`, `/` | public |
| `/dashboard` | authenticated `CLIENT` |
| `/professional/dashboard` | authenticated `PROFESSIONAL` |
| `/api/auth/*` | Better Auth handlers |

A CLIENT who opens `/professional/dashboard` is redirected to `/dashboard`.  
A PROFESSIONAL who opens `/dashboard` is redirected to `/professional/dashboard`.  
Anonymous access to those paths is redirected to `/login` (proxy cookie presence + server `requirePageRole`).

The Next.js `proxy` only checks that a session cookie exists. Role isolation is enforced in the server page with `requirePageRole`.

## Ownership principles (for Phase 4+)

Reusable helpers:

- `ownerIdFromSession(identity, claimedOwnerId?)` — always returns `identity.userId`
- `assertOwnership(sessionUserId, resourceOwnerId)`
- `assertRole(identity, allowedRoles)`

Future Booking / Quote / Review / Favorite operations **must**:

1. `requireAuth()` or `requireRole(...)`
2. take the owner id from the session (`identity.userId`), never from `?userId=` or a request body field the client controls
3. query `where: { clientId: identity.userId }` or the professional’s `Provider` row for `identity.userId`
4. `assertOwnership` before mutating another table row

This phase does not implement those marketplace operations. Tests AUTH-11 and AUTH-12 lock the principle.

## Protected routes

| Path | Access |
|---|---|
| `/` | public |
| `/login` | public; signed-in users redirect to their dashboard |
| `/register` | public; signed-in users redirect to their dashboard |
| `/dashboard` | CLIENT session |
| `/professional/dashboard` | PROFESSIONAL session |
| `/api/auth/[...all]` | Better Auth |

## Security decisions

- Passwords are hashed by Better Auth; plaintext is never stored.
- API/session payloads do not include password hashes.
- `BETTER_AUTH_SECRET` is server-only.
- Role is a server field on `User`, copied into the session by Better Auth additional fields, and re-checked with `requireRole`.
- Invalid credentials and missing accounts return a generic failure to the UI.
- Duplicate email is rejected.
- Logout uses `auth.api.signOut` / the header form, which invalidates the database session.
- No Stripe, email provider, SMS provider, or AI API.

## Environment

See `.env.example` and the README. Required:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (≥ 32 characters)
- `BETTER_AUTH_URL` (local origin or Vercel HTTPS origin)

## 0€ infrastructure

Works with:

- Vercel Hobby
- a free PostgreSQL database
- npm dependencies in this repository

Does **not** introduce paid Auth0/Clerk/Cognito, Resend, Twilio, Stripe, or object storage.

## Known limitations

- Email verification is off (`requireEmailVerification: false`) because no mail provider is in budget.
- Password reset email is not implemented for the same reason.
- No OAuth, 2FA, rate-limit productization, or audit log UI.
- `User.passwordHash` is leftover and unused.
- The Next.js `proxy` cannot enforce role by itself; pages do.
- Demo passwords are documented for local/demo login only.
- This is a development/demo architecture, not a production security certification.

## E2E isolation (Phase 5.1)

Playwright does **not** share the demo database with `npm run dev`.

- Demo / `DATABASE_URL`: `handyhome` (Ahmed, Fatima, demo client only after seed)
- Playwright: `handyhome_e2e` (created if missing, migrated, and re-seeded in global setup)
- Auth E2E registers `e2e-*@demo.handyhome.local` users, then deletes those rows
- Public listing queries are unchanged; they are not filtered by `[DEMO]` names

The Next.js server under Playwright listens on `http://127.0.0.1:3001` with `BETTER_AUTH_URL` set to that origin and `NEXT_DIST_DIR=.next-e2e`, so it can run beside a local `npm run dev` on port 3000.

## Future hardening (not Phase 3)

- Email verification and password reset once a 0€-compatible or later-budget mail path exists
- Rate limiting / captcha on auth endpoints
- Session listing/revocation UI
- Remove `User.passwordHash` after a dedicated cleanup phase
- Production cookie/domain review for a real custom domain
- Marketplace ownership checks on Booking, Quote, Review, Favorite, and Payment (Phase 4+)

## Must not be implemented until Phase 4+

- marketplace search, ranking, filters, and provider discovery
- map
- booking UI
- quotes UI
- payments / Stripe
- reviews
- favorites UI
- notifications
- AI chatbot
- professional verification workflow
- advanced profile features
