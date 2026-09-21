# Deployment (0€ demo, Vercel + hosted PostgreSQL)

This is the controlled path for the demo/validation deployment. It is not a
commercial-production runbook (see "Known limits").

Repository: `git@github.com:jadkb05/HandyHome.git`

## Local

1. **PostgreSQL** — `docker compose up -d` (Postgres 16, databases `handyhome`, `handyhome_e2e`, `handyhome_test`).
2. **Environment variables** — copy `.env.example` to `.env`. Set `DATABASE_URL`, a unique `BETTER_AUTH_SECRET` (≥ 32 characters), and `BETTER_AUTH_URL=http://localhost:3000`.
3. **Migrations** — `npx prisma generate` then `npm run db:migrate:deploy`. Do not run `prisma migrate dev` or `migrate reset` against a shared database.
4. **Seed** — `npm run db:seed` only on a disposable/demo database. It recreates `@demo.handyhome.local` users and documented public passwords.
5. **App** — `npm run dev`.
6. **Tests** — `npm run test:db` (Vitest → `handyhome_test`) and `npm run test:e2e` (Playwright → `handyhome_e2e`). Never point those URLs at a database that holds real accounts.

## Vercel

Do not require paid add-ons. Hobby + a free PostgreSQL tier is the intended demo path.

1. **GitHub** — push this repository to `jadkb05/HandyHome`. In Vercel, import that GitHub repo (framework: Next.js).
2. **Environment variables** — set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` for **Production** and **Preview** (see table below). Preview deployments should use their own `BETTER_AUTH_URL` (or omit it so `https://$VERCEL_URL` is used).
3. **Build** — Vercel runs `npm ci` then `npm run build` (`prisma generate && next build`). `postinstall` also runs `prisma generate`. Migrations are **not** part of the build.
4. **Prisma migration** — from a trusted machine, once per release:

   ```bash
   DATABASE_URL="<target URL>" npx prisma migrate deploy
   ```

   Seed only if the target is a public/disposable demo database: `npm run db:seed`.
5. **Final verification** — on the HTTPS URL: register, sign in, search + map, book, diagnose, quote, intervene, record payment **status**, review. Then test on at least one physical phone (GPS + MapLibre). That real-device pass is still **manual** and is not covered by CI.

## Environment variables

| Variable | Needed at | Notes |
| --- | --- | --- |
| `DATABASE_URL` | build **and** runtime | PostgreSQL URL. On a pooled provider (Neon, Supabase, …) use the **pooled** URL here. |
| `BETTER_AUTH_SECRET` | build **and** runtime | 32+ random characters (`openssl rand -base64 32`). Never reuse the local value. Never commit a real secret. |
| `BETTER_AUTH_URL` | build **and** runtime | Public origin, e.g. `https://handyhome.example.vercel.app`. Falls back to `https://$VERCEL_URL`. |
| `TEST_DATABASE_URL` | Vitest only | Optional. Defaults to a `handyhome_test` database next to `DATABASE_URL`. Never point it at the demo DB. |
| `E2E_DATABASE_URL` | Playwright only | Optional. Defaults to `handyhome_e2e`. |

`src/lib/env.ts` validates the first three with Zod and throws a clear error
if one is missing or `BETTER_AUTH_SECRET` is shorter than 32 characters. The
check runs when the auth/database modules are first imported, so the variables
must exist in the Vercel **build** environment too, not only at runtime.

## Prisma client generation

`package.json` runs `prisma generate` in both `postinstall` and `build`
(`prisma generate && next build`). This avoids a stale generated client when
Vercel restores a cached `node_modules`.

## Migrations (manual, never automatic)

Migrations are **not** run by the build. Apply them deliberately, once per
release, from a trusted machine or CI job:

```bash
DATABASE_URL="<direct or pooled URL>" npx prisma migrate deploy
```

- `migrate deploy` only applies committed migrations from `prisma/migrations`.
  Never run `prisma migrate dev` or `migrate reset` against a shared database.
- Poolers in transaction mode (PgBouncer) can break advisory locks used by
  Prisma Migrate. If `migrate deploy` hangs or errors on a pooled URL, run it
  with the provider's **direct (non-pooled)** connection string for that one
  command, while the app keeps using the pooled `DATABASE_URL`. No `directUrl`
  is configured in `schema.prisma`; add one only if you want `prisma migrate`
  to pick it up automatically (then also set `DIRECT_URL` everywhere Prisma
  commands run).
- Take a provider snapshot/backup before applying a migration to a database that
  holds data you care about.

## Seed data

`npm run db:seed` creates the demo catalog, six demo professionals and one demo
client with **documented, public passwords** (see `prisma/seed.ts`). It also
deletes existing `@demo.handyhome.local` users first. Only seed a database that
is meant to be public/disposable. Do not seed one that holds real accounts.

## CI

`.github/workflows/ci.yml` uses a disposable GitHub Actions Postgres service and
CI-only throwaway secrets. It runs `prisma validate`, typecheck, lint, Vitest,
and build. It does **not** use the local demo database, a production database,
or Playwright (Playwright stays local: browsers + `handyhome_e2e`).

## Security headers

`next.config.ts` sends `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and a
`Permissions-Policy` that keeps geolocation for the "Use my location" button.
There is deliberately **no script/style CSP** yet: Next.js inline scripts,
`next/font` and MapLibre (workers, tiles from OpenFreeMap) need a tested,
nonce-based policy, which is separate work.

## Warnings (not deployment blockers)

| Warning | Class | Action |
| --- | --- | --- |
| Next.js LCP hint on some catalog images vs navbar logo `priority` | Future maintenance | Do not change UI in this pass. |
| Prisma CLI: `package.json#prisma` seed key deprecated toward Prisma 7 `prisma.config.ts` | Future maintenance | Do not upgrade Prisma solely to silence it. Seed still works via `npm run db:seed`. |

## Known limits (demo, not commercial production)

- V1 payment is **status-only** (`PENDING` / `PAID`). There is no payment provider, no card capture, and no money movement.
- Authentication rate limiting is Better Auth's default in-memory store, which
  is not shared across serverless instances. No email verification.
- Professional verification, cancellation/no-show, a real payment provider and
  account deletion are not implemented (V2 decisions).
- Chatbot UI is a stub. No AI.
- OpenFreeMap public tiles are fair-use; a commercial launch needs its own tiles.
- Seeded professional photos and portfolio images are stock photographs.
- Real-device testing (including MapLibre/WebGL and GPS on a physical phone)
  remains a manual verification step and has not been accepted as complete.
