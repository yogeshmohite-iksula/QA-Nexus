# FE Workflow Conformance Matrix (Phase B) — Sat 2026-06-13

**Inputs:** Phase-A baseline (`2026-06-12-fri-fe-prd-baseline.md`) + tonight's 6-section audit (`2026-06-11-thu-fe-full-audit.md`) + **Yogesh's 5 decisions**.
**Boundary (Phase A):** PM1 = milestone schedule; MVP = end-of-M5; M6 = post-pilot. **Past-milestone unbuilt mandate = conformance FAIL; future-milestone canned = acceptable "coming soon".**

## Decisions applied

| #   | Decision                                        | Effect on worklist                                                                   |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| D1  | Functional invite = **M1-MANDATED**             | P0-D invite must WORK (fix #418 **+** wire real POST — needs BE `/api/invitations`). |
| D2a | Doc authoring (GAP-1/M2) = **NO, out of pilot** | F15 doc-editor → "coming soon"; **not a blocker.**                                   |
| D2b | Suite-based org (GAP-2/F18/M4) = **YES**        | **Build F18** (Workflow 5) — FE port + BE `/api/test-suites`.                        |
| D3  | F24 QA-Value = **DROPPED**                      | Omit; no nav entry; no work.                                                         |
| D   | Jira = **SEED-ONLY**                            | F09/projects consume `/api/projects` seed; outbound Jira deferred to M5.             |
| E   | Fictional names = **canned-data override**      | Sweep `canned-data.ts` → roster names; **no locked-frame edits (Rule 3).**           |

---

## WORKFLOW 1 — New user → proper empty states (not fiction)

PM1 rule: M1-past surfaces a new user hits MUST show real-or-empty, not fabricated.

| Route                                               | Milestone | Now                                               | Verdict                            | Fix                                                        |
| --------------------------------------------------- | --------- | ------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `/home` (F08a)                                      | M1 past   | canned Sprint-42 + fake defects + fictional names | **FAIL**                           | wire real OR empty-state; scrub names (P0-C)               |
| `/projects` (F09)                                   | M1 past   | hardcoded canon + fake ops counts                 | **FAIL**                           | P0-B wire `/api/projects` (seed) + EmptyState              |
| `/admin/users` (F27)                                | M1 past   | canned roster + fictional "Priya Tiwari" invite   | **FAIL**                           | wire `useAdminUsers`→`/api/users` (exists, unused) + scrub |
| `/requirements` (F14)                               | M3 past   | `STUB_REQUIREMENTS`                               | **FAIL (soft)**                    | wire `/api/requirements` OR empty-state                    |
| `/test-cases`, `/test-cases/generate` (F16)         | M3 past   | canned; generate is MIXED (live+honest fallback)  | **PARTIAL**                        | F16b acceptable; F17 list wire/empty                       |
| `/projects/[slug]/defects` `…/[id]` (F21/F22)       | M4 past   | canned, fictional Suresh/Ritu/Arjun               | **FAIL**                           | scrub names (P0-C) + wire/empty when BE ready              |
| `/projects/[slug]/results`,`runs/[runId]` (F19/F20) | M4 past   | canned                                            | **FAIL (soft)**                    | "coming soon" or wire; scrub names                         |
| `/projects/[slug]/reports` (F23)                    | M5        | canned previews                                   | **coming-soon OK**                 | label                                                      |
| `/dashboard/executive` (F25)                        | M5        | canned KPIs + fictional "Riya Nair"               | **coming-soon OK** but scrub names | label + P0-C                                               |
| `/home/empty`,`/home/lead-admin`                    | orphaned  | custom shell (Rule 14)                            | **defer**                          | orphaned; hide or rewrap post-pilot                        |

**Net:** 6 M1/M3/M4-past surfaces = real conformance FAILs (home, projects, users, requirements, defects, results). M5 surfaces (reports/exec) = coming-soon-OK **if labeled + names scrubbed**.

## WORKFLOW 2 — Existing user → seeded data (Decision D)

- **F09 switcher MUST consume `/api/projects`** (P0-B rescue). Today: hardcoded.
- Nav chain F09→F14→F16: routes exist + navigate; data is canned → wire or empty-state per W1.
- Outbound Jira correctly deferred (D) — no FE work; ensure no "Sync to Jira" button implies live sync (label).

## WORKFLOW 3 — Admin surface (Yogesh)

| Surface                          | Now                                             | Verdict         | Action                                           |
| -------------------------------- | ----------------------------------------------- | --------------- | ------------------------------------------------ |
| F26m1 LLM Config                 | canned; provider-setup Close/Cancel dead + #418 | **FAIL**        | Suspense-wrap (#418) + wire or coming-soon       |
| F27 invite (D1)                  | inert + #418                                    | **FAIL**        | **P0-D**: fix #418 + real POST (BE dep)          |
| F28 Settings/Audit               | canned audit; tab dead                          | **FAIL (soft)** | wire `/api/audit` (exists) + mark exports        |
| `/admin/users` edit ×7 / more ×7 | dead                                            | **FAIL**        | wire edit (BE dep) or coming-soon label          |
| `/admin/agents/model-assignment` | 26 dead + fake topbar + #418                    | **FAIL**        | Suspense-wrap + wire or coming-soon              |
| `/admin/settings/providers`      | Save/Test/Close dead                            | **FAIL**        | wire (BE `/api/admin/llm-config`) or coming-soon |

## WORKFLOW 4 — Buttons (per click-sweep)

Rule: PM1-route dead button → wire (endpoint exists) | "coming soon" (501) | hide (M6). 404 palette links + orphaned-page dead buttons = **defect-regardless**.

- ⌘K 404 links + slug-hardcode (`shell-topbar-widgets.tsx:248-256`) → gate to built routes + active slug. **P1, ~15L.**
- ~20 `href="#"` placeholders → label or remove. **P2.**
- Theme toggle = works (smoke 4); Operate/Review/Prove = intentional no-op → keep or hide.

## WORKFLOW 5 — F18 Test Suites (Decision D2b — BUILD)

- BE: `TestSuite`/`TestSuiteMember` models exist, **no controller/endpoint** → **BE+1 must build `/api/test-suites` CRUD + run-from-suite**. Sat-PM sync.
- FE: port `F18 Test Suites v2.html` via **frame-port skill** (Rule 18) — extract-canned-data → spec → scaffold → diff-probe → visual gate. **Est: ~1 day FE** once BE contract known.
- Blocks pilot per D2b → **Sun build**.

## WORKFLOW 6 — P0 fix sequence (start now)

| P0                             | Fix                                                                   | Effort           | Dep                       |
| ------------------------------ | --------------------------------------------------------------------- | ---------------- | ------------------------- |
| **A** signed-out→Admin         | AdminGuard prod `isAuthenticated` gate + AuthGate                     | ~0.5 day         | none — **start now**      |
| **B** F09 switcher             | re-target closed #255 branch → main, 1 conflict, wire `/api/projects` | ~1-2 hr          | none                      |
| **C** fictional names          | canned-data override sweep → roster (Decision E)                      | ~0.5 day         | none                      |
| **D** invite #418 + functional | unminified repro → fix; wire real POST                                | repro + ~0.5 day | **BE `/api/invitations`** |

**FE-only (no BE): A, B, C** → ship Sat. **D + W5** need BE coordination.

---

_Phase C (live verify) gated on #261/#262/#263 + Render redeploy. Phase D reconciles after B+C._
