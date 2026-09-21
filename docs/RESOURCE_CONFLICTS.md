# HandyHome — Resource Conflicts

**Phase:** 0  
**Rule:** Do not resolve a contradiction here unless an explicit project decision already exists. Record what must be decided.

---

## C1 — Interface language (French copy vs English V1)

| | |
|---|---|
| **Source A** | `docs/HANDY_HOME_MASTER_CONTEXT_KB_AGENCY.md` — UI examples in French (`Prix sur devis`, `🚧 Fonctionnalité en cours de développement`, search example `Casablanca \| Plombier \| 25 septembre`) |
| **Source B** | Phase 0 prompt — **Known decision: HandyHome V1 interface language is ENGLISH** |
| **What conflicts** | Product-facing strings in the spec are French; V1 UI language is recorded as English. |
| **Why it matters** | Routes, copy, locale, date formats, and Playwright assertions all depend on language. Mixing languages without a rule produces inconsistent UI. |
| **Decision required** | Confirm English as the only V1 UI language. Decide whether canonical phrases (`Prix sur devis`) stay French as branded terms or are translated. Arabic / French as secondary locales is a separate open question. |
| **Existing decision** | Phase 0 states English for V1 interface. Not used to rewrite the master context. |

---

## C2 — No client-approved baseline vs master as source of truth

| | |
|---|---|
| **Source A** | Master §30–31 — client-approved requirements and V1 validation document outrank everything else |
| **Source B** | Repository — those documents do not exist |
| **What conflicts** | The operating system assumes a validated client baseline; the repo only has the agency master context |
| **Why it matters** | Implementation may bake in unvalidated scope (map, quotes, dashboards, V1/V2 split) |
| **Decision required** | Whether the master context is temporarily treated as the product baseline, or architecture waits on client validation |

---

## C3 — Suggested technical stack vs “not yet architecture”

| | |
|---|---|
| **Source A** | Master §17 — suggested Next.js, TypeScript, Tailwind, PostgreSQL, Prisma, folder layout, feature domains |
| **Source B** | Master §33 — ChatGPT + Claude must establish final stack, auth, schema, map provider, API boundaries **before** large Cursor implementation |
| **What conflicts** | Stack looks decided in §17 but is explicitly still a proposal until architecture review |
| **Why it matters** | Implementing from §17 now would skip the architecture phase the same document requires |
| **Decision required** | Lock or revise the stack in an architecture document. Until then, treat §17 as proposal only |

---

## C4 — Booking lifecycle verbosity

| | |
|---|---|
| **Source A** | Master §10 — `REQUESTED → ACCEPTED → APPOINTMENT_SCHEDULED → DIAGNOSIS → QUOTE_SENT → QUOTE_PENDING → QUOTE_ACCEPTED → INTERVENTION → PAYMENT → COMPLETED → REVIEWED` |
| **Source B** | Same section — “Implementation may simplify redundant statuses if the business meaning remains intact.” Quote/payment/review are also separate entities in §9 |
| **What conflicts** | Unclear whether quote/payment/review are booking statuses, separate records, or both |
| **Why it matters** | Schema, APIs, dashboards, and E2E tests |
| **Decision required** | Canonical state machine vs derived status from related records |

---

## C5 — Payment “prepared” vs “complete online payment is V2”

| | |
|---|---|
| **Source A** | Master §11, §23 — V1 includes payment **state/structure**; real PSP “according to the chosen solution”; demo step 16 “Payment status is handled” |
| **Source B** | Master §23 V2 — “complete online payment integration where not already included” |
| **What conflicts** | Unclear whether V1 is status-only (manual/offline) or includes a live payment provider |
| **Why it matters** | PCI scope, env vars, demo script, legal copy |
| **Decision required** | V1 payment: statuses only vs a named provider. Raw card data remains forbidden either way (§11, §32) |

---

## C6 — AI / chatbot vs e-commerce “agentic commerce” skill

| | |
|---|---|
| **Source A** | Master §12, §23, §32 — V1: no OpenAI API; floating button only; message that the feature is in development; no AI step in booking |
| **Source B** | `skills/ux/webshop-ux-expertise/SKILL.md` — AI shopping assistants, agentic commerce, personalization as conversion patterns |
| **What conflicts** | Skill encourages AI commerce features that V1 explicitly forbids as product |
| **Why it matters** | Blind skill use would expand V1 scope |
| **Decision required** | None for product (V1 AI rule is already a non-negotiable). Skill must be subordinated to master context |

---

## C7 — Marketplace (quote after diagnostic) vs webshop checkout patterns

| | |
|---|---|
| **Source A** | Master — no fixed final price before diagnostic; **Prix sur devis**; flow is request → appointment → diagnostic → quote → accept → intervention → payment |
| **Source B** | `webshop-ux-expertise` — product price, cart, guest checkout, one-page checkout |
| **What conflicts** | HandyHome is not a catalog-price webshop. Cart/checkout conversion tactics are the wrong domain model |
| **Why it matters** | Could invent a cart, listed prices, or guest checkout that the product did not specify |
| **Decision required** | Confirm this skill is reference-only / out of domain for V1 booking, except generic accessibility/perf notes |

---

## C8 — WCAG version (AA unspecified vs 2.1 vs 2.2)

| | |
|---|---|
| **Source A** | Master §19 — “WCAG AA principles” (no version) |
| **Source B** | `accessibility-auditor` — WCAG **2.1** AA |
| **Source C** | `frontend-ui-ux`, `webshop-ux-expertise` — WCAG **2.2** AA |
| **What conflicts** | Target standard is inconsistent across skills and the spec |
| **Why it matters** | 2.2 adds criteria (e.g. target size) that affect components and audits |
| **Decision required** | Lock WCAG version + level for HandyHome V1 |

---

## C9 — Dark mode

| | |
|---|---|
| **Source A** | `anti-slop-design` — “Dark mode nobody asked for” is an instant reject |
| **Source B** | `frontend-ui-ux` — design light and dark as two deliberate decisions; `webshop-ux-expertise` cites dark mode conversion stats |
| **Source C** | Master — no dark mode requirement |
| **What conflicts** | Skills disagree; product is silent |
| **Why it matters** | Token system, QA matrix, time |
| **Decision required** | Light-only V1 vs light+dark. Do not implement dark mode by default |

---

## C10 — Font / aesthetic guidance overlap

| | |
|---|---|
| **Source A** | `frontend-design` — avoid clustered AI defaults, including cream+serif and unexamined geometric sans (e.g. Space Grotesk-type looks as generic cluster) |
| **Source B** | `frontend-ui` — recommends Space Grotesk, Syne, Outfit, Playfair, etc. as “distinctive alternatives” |
| **What conflicts** | One skill’s recommended fonts are another skill’s generic cluster |
| **Why it matters** | Phase 1 design system could look like “AI marketplace default” |
| **Decision required** | HandyHome identity from product (trust, local, not generic SaaS) outranks font lists in skills. Pick tokens in architecture/design, not from a skill font menu |

---

## C11 — Playwright skill vs project test strategy

| | |
|---|---|
| **Source A** | Master §29 — Playwright for realistic flows **in the project**, Definition of Done includes critical flows |
| **Source B** | `skills/testing/playwright/SKILL.md` — write scripts to `/tmp`, visible browser by default, skill-local `lib/helpers` |
| **What conflicts** | Skill workflow is ad-hoc `/tmp` automation, not a repo `e2e/` suite. Skill helpers are not in this repository |
| **Why it matters** | Tests would not be reviewable or CI-ready if `/tmp` convention is followed |
| **Decision required** | Project Playwright layout (in-repo, headless CI vs headed debug). Treat the skill as browser-testing knowledge, not as the repo convention |

---

## C12 — Incomplete skill packages (broken internal references)

| | |
|---|---|
| **Source A** | Skills that `read` local `references/`, `LICENSE.txt`, `lib/helpers`, or `~/.claude/skills/ui-design-principles/SKILL.md` |
| **Source B** | Downloads and this repo — only the `SKILL.md` bodies were provided. No `references/` trees, licenses, or Playwright helper lib. `~/.claude/skills` is absent on this machine |
| **What conflicts** | Skills instruct the agent to read files that do not exist |
| **Why it matters** | Audits/animation/a11y checklists may be incomplete if those files are required |
| **Decision required** | Whether to obtain full skill packages or operate on `SKILL.md` bodies only |

Skills with missing local companions include at least:

- `anti-slop-design` (`references/…`, LICENSE)
- `page-designer` (`references/tokens-reference.md`)
- `accessibility-auditor` (`references/*.md`)
- `frontend-ui-ux` (`references/accessibility.md`)
- `webshop-ux-expertise` (`references/…`)
- `animate` (`~/.claude/skills/ui-design-principles/SKILL.md`; optional `DESIGN-BRIEF.md`)
- `playwright` (`lib/helpers`)
- `frontend-design` (`LICENSE.txt`)

---

## C13 — Guest / unauthenticated booking (implied by skills, unspecified by product)

| | |
|---|---|
| **Source A** | Master — client can create an account; dashboards and requests sit behind client role. Does not say whether search is public and whether a request requires login |
| **Source B** | `webshop-ux-expertise` — guest checkout as a critical conversion pattern |
| **What conflicts** | No product rule for guest intervention requests |
| **Why it matters** | Auth gates, funnel, schema (`clientId` required or not) |
| **Decision required** | Must a user be authenticated to search, view profiles, and/or request an intervention? |

---

## C14 — Route and folder structure “may evolve”

| | |
|---|---|
| **Source A** | Master §14–16 — listed public/client/provider routes |
| **Source B** | Master §16–17 — exact naming and `src/` layout are not immutable |
| **What conflicts** | Lists look like a spec but are labeled changeable |
| **Why it matters** | Implementing routes now without an architecture doc creates throwaway URLs |
| **Decision required** | Lock routes in architecture. Until then they are proposals |

---

## Not treated as conflicts

- Overlap between `frontend-design`, `frontend-ui`, `frontend-ui-ux`, and `anti-slop-design` (complementary, not contradictory on product rules).
- Master forbids a mandatory “describe your problem” step; no document requires it.
- No application code exists, so there is no code-vs-spec conflict yet.
