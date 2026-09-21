# HANDY HOME --- MASTER PROJECT CONTEXT

## KB AGENCY · Collaboration & Development Operating System

**Project:** Handy Home\
**Agency:** KB Agency\
**Phase:** Pre-development / V1 validation\
**Working model:** ChatGPT + Claude = brains · Cursor = developer

------------------------------------------------------------------------

# 1. Mission

Handy Home is a real-data home-services marketplace connecting clients
with local professionals for home services.

The core experience is:

**Search → Professionals → Profile → Intervention Request → Appointment
→ Diagnostic → Quote → Client Accepts → Intervention → Payment →
Review**

This is the canonical V1 business workflow.

**Important:** Do not add a mandatory "describe your problem" form as a
new main step. AI is not part of the V1 core workflow.

------------------------------------------------------------------------

# 2. Users

## Client

The client can:

-   create an account;
-   search by location, service and date;
-   discover nearby professionals;
-   view professionals on a real interactive map;
-   view professional profiles;
-   see services, experience, ratings, reviews, availability and
    portfolio;
-   request an intervention;
-   manage appointments;
-   receive and accept quotes;
-   follow intervention/payment status;
-   leave reviews;
-   manage favorites and profile.

## Professional / Ouvrier

The professional can:

-   create an account;
-   create and manage a professional profile;
-   define profession and services;
-   add experience, description, location and availability;
-   add portfolio items;
-   receive, accept or refuse requests;
-   manage appointments;
-   perform diagnostics;
-   create/send quotes;
-   track interventions and payments;
-   receive reviews.

------------------------------------------------------------------------

# 3. Search

The main search UX is inspired by modern booking marketplaces:

`📍 Où ? | 🔧 Quel service ? | 📅 Quand ? | 🔍`

Example:

`Casablanca | Plombier | 25 septembre`

Filters may include:

-   service;
-   location;
-   date/availability;
-   distance;
-   rating;
-   verification.

------------------------------------------------------------------------

# 4. Real Map

The map must be a real interactive map, not an image.

Professionals stored in the database must appear as real geolocated
markers.

### Desktop

List on the left, map on the right.

-   selecting a result can center/highlight its marker;
-   selecting a marker can show a professional preview;
-   list and map stay synchronized.

### Mobile

Responsive map + result list, with a bottom-sheet style pattern where
appropriate.

------------------------------------------------------------------------

# 5. Professional Profile

A professional profile contains:

-   photo;
-   name;
-   profession;
-   verification status;
-   rating/reviews;
-   experience;
-   description;
-   services;
-   location/distance;
-   availability;
-   portfolio;
-   request-intervention CTA.

## Price rule

There is no fixed final price before the diagnostic.

Use:

> **Prix sur devis**

The professional determines the final price after the diagnostic and
sends a quote.

------------------------------------------------------------------------

# 6. Client Dashboard

Main areas:

-   overview;
-   upcoming interventions;
-   active requests;
-   appointments;
-   quotes;
-   payments;
-   favorites;
-   profile/settings.

------------------------------------------------------------------------

# 7. Professional Dashboard

Main areas:

-   overview;
-   new requests;
-   appointments;
-   availability;
-   diagnostics/quotes;
-   interventions;
-   payments;
-   reviews;
-   profile;
-   portfolio.

------------------------------------------------------------------------

# 8. Authentication

Two roles:

``` text
CLIENT
  ↓
Account
  ↓
Client Dashboard
```

``` text
PROFESSIONAL
  ↓
Account
  ↓
Professional Profile
  ↓
Professional Dashboard
```

Role-based access must be enforced.

Passwords must never be stored in plaintext.

------------------------------------------------------------------------

# 9. Database

V1 uses a real database. No hardcoded-only marketplace.

Core entities:

-   User
-   Provider
-   Service
-   ProviderService
-   Availability
-   Booking / Request
-   Quote
-   Payment
-   Review
-   Favorite
-   Portfolio

Suggested fields include user role, provider
profession/location/geocoordinates, service relationships, availability,
booking status, quote amount/status, payment status, reviews and
portfolio media.

The exact Prisma schema may evolve after architecture review.

------------------------------------------------------------------------

# 10. Booking State Model

Suggested lifecycle:

`REQUESTED → ACCEPTED → APPOINTMENT_SCHEDULED → DIAGNOSIS → QUOTE_SENT → QUOTE_PENDING → QUOTE_ACCEPTED → INTERVENTION → PAYMENT → COMPLETED → REVIEWED`

Implementation may simplify redundant statuses if the business meaning
remains intact.

------------------------------------------------------------------------

# 11. Payment

Business flow:

`QUOTE ACCEPTED → INTERVENTION → PAYMENT → REVIEW`

V1 prepares the payment flow and statuses.

A real payment provider can be integrated according to the chosen
solution.

**Never store raw card data in the Handy Home database.**

------------------------------------------------------------------------

# 12. AI / Chatbot

## V1

No OpenAI API.

Only a floating assistant button.

On click:

> 🚧 Fonctionnalité en cours de développement

No AI chatbot step in the core booking workflow.

## Future

Potential AI features:

-   search assistance;
-   recommendations;
-   booking assistance;
-   approximate price estimation;
-   intelligent matching;
-   conversational support.

------------------------------------------------------------------------

# 13. Initial Services

Possible categories:

-   Plomberie
-   Électricité
-   Nettoyage
-   Peinture
-   Climatisation / Chauffage
-   Menuiserie
-   Réparation

Architecture must remain extensible.

------------------------------------------------------------------------

# 14. Public Pages

Potential public routes:

``` text
/
 /search
 /services
 /services/[slug]
 /providers
 /providers/[id]
 /about
 /contact
 /how-it-works
 /login
 /register
 /register/client
 /register/provider
```

------------------------------------------------------------------------

# 15. Client Routes

``` text
/dashboard/client
/dashboard/client/bookings
/dashboard/client/quotes
/dashboard/client/payments
/dashboard/client/favorites
/dashboard/client/profile
```

------------------------------------------------------------------------

# 16. Professional Routes

``` text
/dashboard/provider
/dashboard/provider/profile
/dashboard/provider/services
/dashboard/provider/availability
/dashboard/provider/requests
/dashboard/provider/bookings
/dashboard/provider/quotes
/dashboard/provider/payments
/dashboard/provider/portfolio
```

Exact route naming may evolve during architecture planning.

------------------------------------------------------------------------

# 17. Technical Direction

Suggested stack:

-   Next.js
-   TypeScript
-   Tailwind CSS
-   PostgreSQL
-   Prisma
-   authentication solution selected during architecture;
-   real map provider;
-   server/API logic required for database, authentication and maps.

Suggested organization:

``` text
src/
├── app/
├── components/
├── features/
├── lib/
├── prisma/
└── types/
```

Possible feature domains:

-   auth
-   providers
-   services
-   bookings
-   quotes
-   payments
-   reviews

Do not treat this structure as immutable. Improve it if architecture
review identifies a better solution.

------------------------------------------------------------------------

# 18. Design Direction

Handy Home should feel:

-   premium;
-   modern;
-   professional;
-   trustworthy;
-   clean;
-   urban;
-   locally relevant;
-   mobile-first;
-   distinctive.

The existing Handy Home identity emphasizes trust, security, stability
and reliability.

Do not produce a generic AI/SaaS template.

Avoid unjustified:

-   purple/indigo gradients;
-   glassmorphism;
-   decorative blobs;
-   repetitive generic card grids;
-   excessive rounded cards;
-   meaningless animation;
-   generic "AI startup" copy.

Every design choice should answer:

**Why this choice for Handy Home and for this user?**

------------------------------------------------------------------------

# 19. Frontend Quality

Frontend work must consider together:

1.  interaction/information design;
2.  visual system;
3.  architecture;
4.  accessibility;
5.  performance.

Accessibility target: WCAG AA principles.

Important:

-   semantic HTML;
-   keyboard navigation;
-   visible focus;
-   correct labels;
-   accessible forms;
-   adequate contrast;
-   clear errors;
-   responsive layouts;
-   reduced-motion support.

------------------------------------------------------------------------

# 20. Performance

Measure and optimize:

-   LCP;
-   INP;
-   CLS;
-   TTFB;
-   bundle size;
-   image loading;
-   render performance.

Target direction:

-   LCP \< 2.5s;
-   INP \< 200ms;
-   CLS \< 0.1.

Do not optimize blindly. Measure first.

------------------------------------------------------------------------

# 21. UX Principles

Use:

-   visibility of system status;
-   match between system and real world;
-   user control/freedom;
-   consistency;
-   error prevention;
-   recognition over recall;
-   flexibility;
-   minimalist design;
-   clear error recovery;
-   accessibility;
-   tolerance/forgiveness.

Every important action should have visible feedback.

------------------------------------------------------------------------

# 22. Animation

Motion must serve a purpose:

-   state feedback;
-   transition;
-   responsiveness;
-   emphasis.

Do not animate everything.

Respect `prefers-reduced-motion`.

Prefer performant transform/opacity transitions.

------------------------------------------------------------------------

# 23. V1 Scope

## Included

-   responsive frontend;
-   client role;
-   professional role;
-   authentication;
-   real database;
-   professional profiles;
-   services;
-   search;
-   filters;
-   location;
-   real map;
-   map markers;
-   professional profile;
-   intervention request;
-   appointments;
-   diagnostic state;
-   quotes;
-   quote acceptance;
-   intervention state;
-   payment state/structure;
-   reviews;
-   favorites;
-   client dashboard;
-   professional dashboard;
-   portfolio;
-   chatbot UI without AI.

## V2 / Later

-   functional AI assistant;
-   AI recommendations;
-   advanced AI matching;
-   AI-assisted price estimation;
-   complete online payment integration where not already included;
-   advanced security features;
-   advanced automation/management.

------------------------------------------------------------------------

# 24. Demonstration Scenario

A successful V1 demo should support:

1.  Professional creates account.
2.  Professional creates `Ahmed — Plombier`.
3.  Adds location, services, availability, experience and portfolio.
4.  Data is stored in DB.
5.  Client creates account.
6.  Client searches for plumber + area + date.
7.  Ahmed appears in list and on map.
8.  Client opens profile.
9.  Client requests intervention.
10. Ahmed accepts.
11. Appointment is created.
12. Ahmed performs diagnostic.
13. Ahmed creates/sends quote.
14. Client accepts quote.
15. Intervention is completed.
16. Payment status is handled.
17. Client leaves review.

------------------------------------------------------------------------

# 25. Development Philosophy

Do NOT ask Cursor to build the entire application in one giant prompt.

Use:

``` text
DEFINE
  ↓
ARCHITECT
  ↓
SPECIFY
  ↓
IMPLEMENT
  ↓
TEST
  ↓
REVIEW
  ↓
FIX
  ↓
ACCEPT
```

Features are delivered incrementally.

A feature is not complete just because it compiles.

------------------------------------------------------------------------

# 26. TEAM ROLES

## ChatGPT --- Lead Architect / Product / QA

ChatGPT owns:

### Product

-   product scope;
-   V1 boundary;
-   business logic;
-   requirements;
-   acceptance criteria.

### Architecture

-   application architecture;
-   database/domain design;
-   API contracts;
-   state models;
-   technical tradeoffs.

### UX/UI

-   user flows;
-   page structure;
-   interaction quality;
-   accessibility;
-   design consistency.

### QA

-   test strategy;
-   acceptance criteria;
-   Playwright scenarios;
-   regression analysis;
-   screenshot review.

### Performance & Security

-   performance strategy;
-   obvious security risks;
-   authentication/authorization review;
-   safe implementation patterns.

ChatGPT is the primary product/architecture brain.

------------------------------------------------------------------------

## Claude --- Second Brain / Senior Reviewer

Claude should:

-   read this entire master context;
-   challenge assumptions;
-   independently review architecture;
-   identify edge cases;
-   review Cursor's code;
-   review business logic;
-   review UX;
-   propose alternatives;
-   help debug difficult issues;
-   protect maintainability;
-   protect V1 scope.

Claude should NOT blindly agree with ChatGPT.

When ChatGPT and Claude disagree:

``` text
Proposal
  ↓
Independent review
  ↓
Tradeoff analysis
  ↓
Decision
```

Claude is the independent senior reviewer / second brain.

------------------------------------------------------------------------

## Cursor --- Developer / Implementation Engineer

Cursor is responsible for implementation.

Cursor should:

-   read repository instructions;
-   inspect existing code before modifying it;
-   implement specifications;
-   create components;
-   create routes;
-   implement Prisma schema/migrations;
-   implement APIs;
-   connect frontend/backend/database;
-   run lint/typecheck/build;
-   run tests;
-   fix bugs;
-   prepare implementation for review.

Cursor should NOT silently invent major product rules.

If ambiguity affects:

-   business workflow;
-   database architecture;
-   authentication;
-   payment;
-   major UX;
-   API contracts;

the ambiguity must be surfaced before making a major irreversible
decision.

------------------------------------------------------------------------

# 27. Skills Operating System

The uploaded skills are part of the project methodology.

Relevant skill categories include:

### Frontend UI/UX

For any frontend page, component, form, modal, navigation or interface.

### Anti-Slop Design

For avoiding generic AI-generated interfaces and establishing a
deliberate visual system.

### Frontend Design

For distinctive typography, palette, layout and visual direction.

### Page Designer

For defining page purpose, hierarchy, shell and layout before
implementation.

### Design Critique

For screenshot/mockup/live UI review.

### Frontend Design Audit

For deeper usability audits of existing frontend implementations.

### Accessibility Auditor

For keyboard, WCAG, semantic HTML, focus and accessibility validation.

### Performance Optimization

For Core Web Vitals, bundle size, assets and runtime performance.

### Playwright

For real browser testing, E2E, forms, responsive behavior and
screenshots.

### Animation

For deliberate micro-interactions and motion validation.

### User Researcher

For future interviews, usability testing, personas, journey mapping and
research synthesis.

------------------------------------------------------------------------

# 28. Definition of Done

A feature is DONE only when:

## Product

-   approved requirement is implemented;
-   V1 scope is respected;
-   expected states exist.

## UX

-   purpose is clear;
-   loading exists;
-   empty state exists;
-   success state exists;
-   error state exists;
-   user can recover/go back/cancel where appropriate.

## UI

-   design system is consistent;
-   responsive behavior works;
-   interface is distinctive and not generic.

## Accessibility

-   keyboard works;
-   focus is visible;
-   labels are correct;
-   contrast is adequate;
-   semantic structure is correct.

## Technical

-   typecheck passes;
-   lint passes;
-   build passes;
-   migrations work;
-   no obvious console errors;
-   no broken critical routes.

## QA

-   critical Playwright flows pass;
-   screenshots reviewed;
-   desktop/mobile checked;
-   core workflow works end-to-end.

## Performance

-   no obvious unnecessary bundle bloat;
-   images are optimized;
-   critical content loads efficiently;
-   major Core Web Vitals risks are addressed.

------------------------------------------------------------------------

# 29. Testing Strategy

### Component

Test states, props, interactions and errors.

### Page

Test layout, navigation, responsive behavior and accessibility.

### Business flow

Test:

``` text
Register
→ Login
→ Search
→ Profile
→ Request
→ Appointment
→ Quote
→ Accept
→ Intervention
→ Payment
→ Review
```

### Browser

Use Playwright for realistic browser flows.

### Final QA

Run:

-   typecheck;
-   lint;
-   build;
-   accessibility;
-   responsive checks;
-   E2E;
-   performance checks;
-   UX review.

------------------------------------------------------------------------

# 30. Client Validation

Before major development starts, the client should validate:

-   visual direction;
-   site structure;
-   client journey;
-   professional journey;
-   search;
-   interactive map;
-   dashboards;
-   core workflow;
-   V1 scope;
-   V2/future scope.

The approved validation document is the baseline.

Major post-validation business changes may affect UX, architecture,
database, implementation and timeline.

------------------------------------------------------------------------

# 31. Source-of-Truth Priority

When information conflicts, use:

``` text
1. Explicit client-approved requirements
        ↓
2. Handy Home V1 validation document
        ↓
3. Existing repository architecture/conventions
        ↓
4. ChatGPT + Claude technical decisions
        ↓
5. Skills/general defaults
```

Skills improve quality but do not override explicit product
requirements.

------------------------------------------------------------------------

# 32. Non-Negotiable Constraints

1.  No mandatory problem-description form in the core workflow.
2.  No fake fixed final price before diagnostic.
3.  Use "Prix sur devis".
4.  Map must be real and database-driven.
5.  Professionals added to DB must become discoverable.
6.  Client and professional roles are distinct.
7.  V1 chatbot is UI-only.
8.  Never store raw card data.
9.  Do not overbuild V1.
10. Do not sacrifice UX, accessibility or performance for visual polish.
11. Handy Home must not look like a generic AI-generated SaaS template.

------------------------------------------------------------------------

# 33. First Technical Phase

Before Cursor implements large features, ChatGPT + Claude should
establish:

1.  final stack;
2.  repository structure;
3.  authentication approach;
4.  database schema;
5.  role/permission model;
6.  booking state model;
7.  map provider strategy;
8.  API boundaries;
9.  environment variables;
10. design tokens;
11. component strategy;
12. testing strategy.

Then create an implementation-ready specification for Cursor.

------------------------------------------------------------------------

# 34. Recommended Development Order

``` text
PHASE 1
Project setup
Design system
Architecture
        ↓
PHASE 2
Database
Prisma
Migrations
        ↓
PHASE 3
Authentication
Roles
        ↓
PHASE 4
Public UI
Landing
Services
Provider discovery
        ↓
PHASE 5
Real map
Search
Filters
        ↓
PHASE 6
Professional profile
Professional dashboard
        ↓
PHASE 7
Client dashboard
        ↓
PHASE 8
Requests
Appointments
        ↓
PHASE 9
Diagnostics
Quotes
        ↓
PHASE 10
Intervention
Payment state
Reviews
        ↓
PHASE 11
E2E
Accessibility
Performance
UX audit
        ↓
PHASE 12
Client demo
Final fixes
```

This order can change if architecture review identifies a better
dependency order.

------------------------------------------------------------------------

# 35. Cursor Task Protocol

Every Cursor task should be written with:

``` text
OBJECTIVE
What are we building?

CONTEXT
Why?

USER
Who uses it?

REQUIREMENTS
What must happen?

CONSTRAINTS
What must NOT happen?

DATA
What entities are involved?

UI
What should be visible?

STATES
Loading / empty / error / success / disabled.

ACCEPTANCE CRITERIA
How do we know it works?

TESTS
What should Playwright verify?

DEFINITION OF DONE
What must pass?
```

------------------------------------------------------------------------

# 36. Team Model

``` text
                    CLIENT / PRODUCT OWNER
                             │
                             ▼
                    ┌──────────────────┐
                    │     CHATGPT      │
                    │ Lead Architect   │
                    │ Product / UX     │
                    │ QA / Strategy    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      CLAUDE      │
                    │ Second Brain     │
                    │ Senior Review    │
                    │ Edge Cases       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      CURSOR      │
                    │ Developer        │
                    │ Implementation   │
                    │ Debugging        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ PLAYWRIGHT / QA  │
                    │ Browser / E2E    │
                    └────────┬─────────┘
                             │
                             ▼
                    CHATGPT + CLAUDE
                      FINAL REVIEW
```

------------------------------------------------------------------------

# 37. Golden Rule

The goal is NOT:

> "Make Cursor generate a lot of code quickly."

The goal is:

> **Make Cursor implement the right product correctly, one validated
> feature at a time.**

Speed comes from:

-   clear architecture;
-   clear requirements;
-   reusable components;
-   strong skills;
-   automated tests;
-   continuous review.

------------------------------------------------------------------------

# 38. One-Line Product Definition

> **Handy Home is a real-data home-services marketplace where clients
> discover nearby professionals through search and map, view their
> profiles, request an intervention, schedule an appointment, receive a
> post-diagnostic quote, accept it, complete the intervention, pay and
> leave a review.**

------------------------------------------------------------------------

# 39. MESSAGE TO CLAUDE

Claude, you are joining the Handy Home development team as the second
senior brain.

Read this document completely before making architectural
recommendations.

Your priorities are:

1.  Protect the approved V1 product scope.
2.  Challenge assumptions.
3.  Review architecture independently.
4.  Identify edge cases.
5.  Review Cursor implementation critically.
6.  Protect maintainability.
7.  Review UX and accessibility.
8.  Help debug difficult issues.
9.  Use the project skills when relevant.
10. Never invent a major business rule without surfacing ambiguity.
11. Explain disagreements with ChatGPT using concrete tradeoffs.
12. Produce implementation-ready specifications for Cursor when
    architecture is settled.

Working philosophy:

``` text
Think deeply.
Specify clearly.
Build incrementally.
Test realistically.
Review critically.
Ship only when validated.
```

------------------------------------------------------------------------

# END

**KB AGENCY**\
Conception & développement digital

**Project:** Handy Home\
**Document:** Master Project Context & Development Operating System\
**Version:** V1
