# HandyHome — Documentation Index

**Phase:** 0 (repository audit)  
**Rule:** Skills improve quality. They do not override explicit product requirements.

---

## Authority levels

| Level | Meaning |
|---|---|
| 1. Client-approved requirements | Signed/validated client baseline. **None found.** |
| 2. Project decisions | Explicit decisions recorded for this repo. |
| 3. Architecture proposals | Suggested technical direction, not locked. |
| 4. Open questions | Necessary for implementation, not yet decided. |
| 5. Reference material | Context, methodology, copies of source specs. |
| 6. Skills / instructions | How to execute work; not product law. |

Master context priority when information conflicts (section 31):

1. Explicit client-approved requirements  
2. Handy Home V1 validation document  
3. Existing repository architecture/conventions  
4. ChatGPT + Claude technical decisions  
5. Skills / general defaults  

Neither (1) nor (2) exists as a separate signed file in this repository. The master context is currently the strongest **product** document, but it is not labeled as client-approved.

---

## Documents in this repository

| File | Category | Purpose | Authority | Relevant phase |
|---|---|---|---|---|
| `docs/HANDY_HOME_MASTER_CONTEXT_KB_AGENCY.md` | Product / Business; also UX, Architecture, Database, Auth/Security, Frontend, Testing, Accessibility, Performance | Canonical V1 product workflow, users, scope, constraints, team model, suggested stack | **5 — Reference / project specification.** Treat as source of truth for **business requirements** until a client-approved validation document exists. Stack/schema/routes inside it are **3 — proposals** unless later locked. | All phases; read before architecture and implementation |
| `docs/DOCUMENTATION_INDEX.md` | Other (this file) | Classification of project documents | 5 — Reference | 0+ |
| `docs/SKILLS_INDEX.md` | Skills / instructions | Index of available skills, when to use them | 6 | 0+ |
| `docs/RESOURCE_CONFLICTS.md` | Other | Unresolved contradictions; no silent resolution | 4 (flags decisions required) | Architecture, before implementation |
| `docs/INITIAL_OPEN_QUESTIONS.md` | Other | Implementation-blocking unknowns | 4 | Architecture, before implementation |

---

## Documents found outside the repository (not rewritten)

| File | Category | Purpose | Authority | Notes |
|---|---|---|---|---|
| `/home/kb.jad/Downloads/HANDY_HOME_MASTER_CONTEXT_KB_AGENCY.md` | Product / Business | Original master context | Same as the repo copy | Copied into `docs/` verbatim |
| `/home/kb.jad/Downloads/SKILL.md` … `SKILL(13).md` | Skills / instructions | Original skill files (opaque numbering) | 6 | Copied into `skills/` with classified names |

Other files in Downloads (KB Agency PDFs, ecommerce plans, school projects, etc.) are **not** HandyHome project documents and were not imported.

---

## What does **not** exist yet

| Expected / typical document | Category | Status |
|---|---|---|
| Client-approved V1 validation document | Product / Business | Missing (master §30) |
| `DECISIONS.md` | Project decisions | Missing |
| `ARCHITECTURE.md` | Architecture | Missing |
| `DATABASE.md` | Database | Missing |
| Auth / security specification | Authentication / Security | Missing |
| API contract | Backend | Missing |
| Design tokens / DESIGN-BRIEF | UI / Design | Missing |
| Deployment / env spec | Deployment / Infrastructure | Missing |
| Test plan (project-level) | Testing / QA | Missing (strategy outlined in master §29 only) |
| Source code, Prisma schema, tests, assets, config | — | Missing |

---

## Classification of the master context (by section)

The master file covers multiple categories. Do not split or rewrite it; use this map:

| Category | Master sections (approx.) |
|---|---|
| Product / Business | 1–3, 5 (price rule), 10–13, 23–24, 30, 32, 38 |
| UX / User Research | 3–4, 6–7, 14–16, 21, 24 |
| UI / Design | 18–19, 22 |
| Architecture | 17, 26, 33–35 |
| Database | 9–10 |
| Authentication / Security | 8, 11 (no raw card data), 32 |
| Frontend | 4, 14–16, 17, 19 |
| Backend | 17 (server/API), 33 |
| Testing / QA | 28–29 |
| Accessibility | 19, 28 |
| Performance | 20, 28 |
| Deployment / Infrastructure | 33 (env vars only; no host/provider) |
| Other (operating system) | 25–27, 31, 36–37, 39 |

---

## Known project decision recorded in Phase 0

| Decision | Source | Authority |
|---|---|---|
| HandyHome V1 **interface language is English** | Phase 0 implementation prompt | 2 — Project decision |

This conflicts with French product copy in the master context. See `docs/RESOURCE_CONFLICTS.md`. Do not invent additional language rules.

---

## Code, tests, config, assets

**None** in `/home/kb.jad/handyHome` at audit time:

- No git repository
- No `package.json`, lockfile, or app source
- No Prisma / SQL schema
- No tests
- No images, logos, or design files
- No `.env` / env example
- No CI

The repository is documentation + skills only.

---

## Added after Phase 0

| File | Category | Purpose | Authority | Relevant phase |
|---|---|---|---|---|
| `docs/DECISIONS.md` | Project decisions | Architecture-lock decisions | 2 | 0.5+ |
| `docs/ARCHITECTURE.md` | Architecture | V1 foundation architecture | 2 / 3 | 0.5+ |
| `docs/DATABASE.md` | Database | Prisma/PostgreSQL baseline | 2 | 2+ |
| `docs/OPEN_QUESTIONS.md` | Open questions | Remaining blockers | 4 | All |
| `docs/PHASE_1_CURSOR_PROMPT.md` | Implementation brief | Phase 1 execution prompt | 5 | 1 |
| `docs/PHASE_3_AUTH.md` | Authentication / Security | Better Auth, sessions, roles, ownership | 2 | 3 |
| `docs/PHASE_4_MARKETPLACE_DATA.md` | Product / Database / UI | Services, professional profiles, portfolio, availability | 2 | 4 |
| `docs/PHASE_5_SEARCH_MAP.md` | Product / Architecture / UI | Search, filters, MapLibre, geolocation, Haversine | 2 | 5 |
| `docs/PHASE_6_BOOKING.md` | Product / Architecture | Booking request, slots, accept/decline | 2 | 6 |
| `docs/PHASE_7_DIAGNOSIS_QUOTES.md` | Product / Architecture / Database | Diagnosis, quote versions, accept/decline | 2 | 7 |
| `docs/PHASE_8_INTERVENTION_PAYMENT.md` | Product / Architecture / Database | Intervention lifecycle, payment state | 2 | 8 |
| `docs/PHASE_9_REVIEWS.md` | Product / Architecture / Database | Reviews, ratings, public profile | 2 | 9 |
