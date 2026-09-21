# HandyHome — Skills Index

**Phase:** 0 (repository audit)  
**Source of originals:** `/home/kb.jad/Downloads/SKILL.md` … `SKILL(13).md`  
**Repo copies:** originals were copied, not moved. Downloads files are unchanged.

No skill system existed in this repository before Phase 0. Skills were numbered `SKILL.md` / `SKILL(1).md` … `SKILL(13).md` in Downloads. They are now classified by purpose under `skills/`.

Companion `references/` files, licenses, and helper scripts referenced by several skills were **not** present next to the source files. See `docs/RESOURCE_CONFLICTS.md`.

There are **no** skills in this repository for: product, backend, database, security, or deployment.

---

## Classification

```text
skills/
├── design/
│   ├── frontend-design/
│   ├── anti-slop-design/
│   ├── page-designer/
│   └── design-critique/
├── frontend/
│   ├── frontend-ui/
│   ├── frontend-ui-ux/
│   └── animate/
├── ux/
│   ├── frontend-design-audit/
│   └── webshop-ux-expertise/
├── research/
│   ├── user-researcher/
│   └── journey-map/
├── accessibility/
│   └── accessibility-auditor/
├── performance/
│   └── performance-optimization/
└── testing/
    └── playwright/
```

---

## Index

| Skill | Location | Purpose | Use when | Relevant phases |
|---|---|---|---|---|
| frontend-design | `skills/design/frontend-design/SKILL.md` | Distinctive visual identity: palette, type, layout, signature element. Avoids templated AI looks. | Choosing or implementing visual direction, design tokens, landing or branded UI | 1 (design system), 4 (public UI), 6–7 (dashboards), any new page |
| anti-slop-design | `skills/design/anti-slop-design/SKILL.md` | Reject generic AI-generated UI (purple gradients, Inter/Roboto defaults, glassmorphism, identical card grids). | Any major UI generation, refactor, or critique; before emitting frontend code with color/type/layout/motion/copy | 1, 4–7, 11 (UX audit) |
| page-designer | `skills/design/page-designer/SKILL.md` | Framework-agnostic full-page layout specs (purpose, shell, hierarchy) using a design system. | Planning a page/screen before implementation (landing, search, dashboards, forms) | 4–10 (each new page), after tokens exist |
| design-critique | `skills/design/design-critique/SKILL.md` | Senior UX/UI critique using Nielsen heuristics and Laws of UX. Quality, not only compliance. | Screenshots, mockups, or live UI review | 11 (UX audit), after each UI slice |
| frontend-ui | `skills/frontend/frontend-ui/SKILL.md` | Prompting strategies for distinctive HTML/CSS/React UI; lists fonts and anti-patterns. | Building a webpage, component, or layout when aesthetic guidance is needed | 1, 4–7 |
| frontend-ui-ux | `skills/frontend/frontend-ui-ux/SKILL.md` | Master frontend doctrine: interaction design, visual system, architecture, WCAG 2.2 AA, Core Web Vitals, Definition of Done. | Before writing markup/styles; before declaring UI done | All UI phases (1, 4–11) |
| animate | `skills/frontend/animate/SKILL.md` | Audit and add purposeful motion (`transform`/`opacity`), Playwright visual checks, `prefers-reduced-motion`. | Adding or fixing micro-interactions after UI exists | After 4–7 UI exists; 11 |
| frontend-design-audit | `skills/ux/frontend-design-audit/SKILL.md` | Usability audit of **existing** UI (code or URL) against 15 principles. Not for greenfield builds. | Reviewing implemented screens, confusing flows, abandonment | 11; after features exist |
| webshop-ux-expertise | `skills/ux/webshop-ux-expertise/SKILL.md` | E-commerce conversion, checkout, cart, agentic commerce. | **Only** if a task is truly store/checkout UX. HandyHome V1 is a quote-based marketplace, not a webshop. Do not apply cart/checkout/AI-commerce patterns as product rules. | Use with caution; not a V1 core skill |
| user-researcher | `skills/research/user-researcher/SKILL.md` | Research plans, interviews, personas, usability tests, competitive research. | Client validation, personas, journey synthesis, usability testing | Pre-dev validation; 12 (demo feedback) |
| journey-map | `skills/research/journey-map/SKILL.md` | Interactive D3.js customer journey maps (emotion, pain points, not screen flows). | Visualizing client/professional end-to-end experience | Validation / UX research; not implementation |
| accessibility-auditor | `skills/accessibility/accessibility-auditor/SKILL.md` | WCAG audit (skill text: 2.1 AA), keyboard, screen reader, common fixes. | Accessibility implementation and audit | 1 (foundations), 11 |
| performance-optimization | `skills/performance/performance-optimization/SKILL.md` | Diagnose/fix LCP, INP, CLS, bundle, assets, render performance. | Performance-sensitive work; pre-launch vitals | 5 (map/search), 11 |
| playwright | `skills/testing/playwright/SKILL.md` | Browser automation, E2E, forms, screenshots, responsive checks. | Feature E2E, login, search, booking flows | 3–11 (per feature), 11 (full E2E) |

---

## Recommended default stack for HandyHome UI work

When building UI, read in this order unless a task says otherwise:

1. Product requirements in `docs/HANDY_HOME_MASTER_CONTEXT_KB_AGENCY.md` (skills do not override product rules)
2. `frontend-ui-ux` (engineering + UX doctrine)
3. `anti-slop-design` + `frontend-design` (visual distinctiveness)
4. `page-designer` (page structure, once tokens exist)
5. `accessibility-auditor` and `performance-optimization` before calling a slice done
6. `playwright` for realistic browser verification
7. `design-critique` / `frontend-design-audit` on implemented screens

---

## Provenance

| Repo skill | Original Downloads file |
|---|---|
| frontend-design | `SKILL.md` |
| frontend-ui | `SKILL(1).md` |
| anti-slop-design | `SKILL(2).md` |
| journey-map | `SKILL(3).md` |
| page-designer | `SKILL(4).md` |
| design-critique | `SKILL(5).md` |
| user-researcher | `SKILL(6).md` |
| animate | `SKILL(7).md` |
| webshop-ux-expertise | `SKILL(8).md` |
| frontend-design-audit | `SKILL(9).md` |
| accessibility-auditor | `SKILL(10).md` |
| performance-optimization | `SKILL(11).md` |
| frontend-ui-ux | `SKILL(12).md` |
| playwright | `SKILL(13).md` |
