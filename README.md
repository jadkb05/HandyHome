# HandyHome

HandyHome is a home-services marketplace (KB Agency). Clients search for Casablanca-area professionals, request an intervention, receive a diagnosis and quote, then track intervention, payment **status**, and reviews.

V1 interface language: English. Official brand: white + `#006EF9`.

This is a **0€ demo / validation** product, not a commercial production launch.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- PostgreSQL 16 + Prisma 6
- Better Auth (email/password, Prisma adapter, server sessions)
- MapLibre GL JS + OpenFreeMap (no map API key)
- Vitest + Playwright

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `BETTER_AUTH_SECRET` to a random string of at least 32 characters (`openssl rand -base64 32`).
3. Keep `BETTER_AUTH_URL="http://localhost:3000"` for local development.
4. Start PostgreSQL: `docker compose up -d`
5. Apply migrations: `npx prisma generate` then `npm run db:migrate:deploy`
6. Seed demo users (optional, recommended locally): `npm run db:seed`
7. Start the app: `npm run dev` → http://localhost:3000

Do not commit `.env`.

## Environment variables

| Variable | Local | Hosted demo (Vercel) |
|---|---|---|
| `DATABASE_URL` | Docker Postgres from `docker-compose.yml` | Free-tier PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random 32+ character secret | **Different** strong secret per environment |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public HTTPS origin: `https://handy-home-tawny.vercel.app` |

Optional (tests only): `TEST_DATABASE_URL`, `E2E_DATABASE_URL`. Optional (LAN phone testing): `DEV_PUBLIC_HOST`.

If `BETTER_AUTH_URL` is omitted on Vercel, the app falls back to `https://$VERCEL_URL`. Set the public URL explicitly when using a custom domain.

No other paid services are required. Do not add Stripe, paid auth SaaS, email/SMS, or AI APIs.

## Scripts

- `npm run dev` — development server (`0.0.0.0:3000`)
- `npm run build` — `prisma generate` then `next build`
- `npm start` — production server (after build)
- `npm run typecheck` / `npm run lint`
- `npm run test:db` — Vitest (own database `handyhome_test`)
- `npm run test:e2e` — Playwright (own database `handyhome_e2e`, port 3001)
- `npm test` — Vitest then Playwright
- `npx prisma validate`
- `npm run db:migrate:deploy` / `npm run db:seed`

Playwright browsers once: `npx playwright install chromium`

Full deployment runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Architecture and phase docs: [`docs/`](docs/).

## Demo accounts

Created by `npm run db:seed`. Emails use `@demo.handyhome.local`. These are not real people and not production secrets.

| Role | Email | Password | Public name |
|---|---|---|---|
| CLIENT | `client@demo.handyhome.local` | `DemoClient123!` | Karim Haddad |
| PROFESSIONAL | `ahmed@demo.handyhome.local` | `DemoProAhmed123!` | Ahmed El Mansouri |
| PROFESSIONAL | `fatima@demo.handyhome.local` | `DemoProFatima123!` | Sara Amrani |

Additional seed professionals: Youssef Benali, Imane Alaoui, Omar Tazi, Nadia Bennani. All stay `verified: false`.

## V1 limitations

- Payment is **status-only** (`PENDING` / `PAID`). No payment service provider, no card data.
- Chatbot UI is a stub. No AI.
- No email verification, SMS, or notifications.
- Professional verification is stored but not a public trust workflow.
- Map tiles are public OpenFreeMap (fair use).
- Real-device / physical-phone QA (GPS, MapLibre/WebGL) remains a **manual** step.

## 0€ demo infrastructure

Intended hosted stack: Vercel Hobby + PostgreSQL free tier + this repository. See `docs/DEPLOYMENT.md`.
