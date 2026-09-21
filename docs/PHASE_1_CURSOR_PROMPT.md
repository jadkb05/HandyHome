# HandyHome — Phase 1 Cursor Prompt

**STATUS: AUTHORIZED**

**Project:** HandyHome  
**Agency:** KB Agency  
**V1 interface language:** English

## Objective

Build the technical foundation of HandyHome.

This is NOT the full marketplace implementation.

The goal is to create a clean, production-oriented foundation on which the marketplace can be implemented feature by feature.

## Mandatory reading

Before changing code, read:

```text
docs/DECISIONS.md
docs/OPEN_QUESTIONS.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/DOCUMENTATION_INDEX.md
docs/SKILLS_INDEX.md
```

Also inspect the relevant skills in `skills/`.

Use only skills relevant to the current task. Do not apply unrelated skills.

## Phase 1 scope

### 1. Project foundation

Set up:

- Next.js
- TypeScript
- Tailwind CSS
- ESLint
- formatting conventions consistent with the repository
- development scripts
- production build

Use current stable versions compatible with the project environment. Do not add unnecessary dependencies.

### 2. Repository structure

Establish the agreed structure:

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── providers/
│   ├── services/
│   ├── search/
│   ├── bookings/
│   ├── quotes/
│   ├── payments/
│   ├── reviews/
│   └── favorites/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── maps/
│   ├── media/
│   ├── payments/
│   └── validation/
└── types/

prisma/
```

Do not create empty abstractions solely for appearance. Create folders/files when they establish a useful boundary for the next phases.

### 3. Database foundation

Set up:

- PostgreSQL connection configuration
- Prisma
- Prisma schema foundation matching `DATABASE.md`
- migration workflow
- safe environment-variable handling

Do not invent unresolved business fields.

Do not create fake production data.

A minimal development seed may be created only if it is clearly marked as development data and does not pretend to represent real verified professionals.

### 4. Validation/configuration foundation

Create a clean server-side validation/configuration boundary.

Use Zod where runtime validation is required.

Environment secrets must never be committed.

Document required environment variables with safe placeholders/examples.

### 5. Authentication foundation

Only implement authentication now if the authentication library has a clear, maintained choice compatible with the current project.

If the library choice is not sufficiently established, create the application boundary/configuration without inventing a custom authentication system and report the blocker.

Never implement homegrown password/session security.

When authentication is implemented:

- passwords must be hashed;
- roles must be server-side;
- authorization must not depend only on UI visibility;
- ownership checks must be possible from the server.

### 6. Application shell

Create a minimal English application shell:

- root layout;
- typography/theme tokens;
- navigation shell;
- responsive base;
- accessible focus states;
- basic error/not-found boundaries where appropriate.

Do NOT build the full landing page yet.

Do NOT invent final marketing copy.

### 7. Design foundation

Establish reusable design tokens for:

- typography;
- spacing;
- borders/radii;
- surface/background tokens;
- interactive states;
- focus;
- responsive breakpoints.

Follow the project's anti-slop/design skills.

Avoid:

- generic purple/indigo AI gradients;
- glassmorphism;
- decorative blobs;
- excessive rounded cards;
- meaningless animation.

Do not prematurely design every page.

### 8. Testing foundation

Set up the testing foundation needed for later phases.

At minimum:

- typecheck;
- lint;
- production build.

If the current environment supports it cleanly, prepare Playwright configuration without creating fake E2E tests for features that do not exist yet.

## Explicitly forbidden in Phase 1

Do NOT implement:

- full marketplace search;
- provider discovery;
- real map;
- provider profiles;
- booking workflow;
- quote workflow;
- payment processing;
- reviews;
- favorites;
- AI/chatbot functionality;
- fake fixed prices;
- mandatory problem-description form;
- invented cancellation rules;
- invented diagnostic pricing;
- invented provider verification;
- invented commission rules;
- invented service categories.

## Quality requirements

Before finishing:

1. Run typecheck.
2. Run lint.
3. Run production build.
4. Run available tests.
5. Check that the application starts.
6. Check responsive base behavior.
7. Check keyboard focus and basic semantic structure.
8. Check that no secrets are committed.
9. Check that no unresolved business rule was encoded.

## Final report

Return:

### Files changed
List every created/modified file.

### Dependencies
List every dependency added and why.

### Commands
List the commands executed.

### Verification
Report:

- typecheck
- lint
- build
- tests
- dev server/startup

### Decisions/blockers
List anything that could not be completed without a product or vendor decision.

### Scope check
Confirm that no Phase 2+ marketplace feature was implemented.

STOP after Phase 1.

Do not automatically proceed to Phase 2.
