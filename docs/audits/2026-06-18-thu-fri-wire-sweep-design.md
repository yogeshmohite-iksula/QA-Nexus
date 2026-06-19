# Fri AM Wire Sweep — Design Doc (Thu 2026-06-18 night, design-only)

**Purpose:** lock all Hard-Rule-11 contracts + adapter sketches for the 9-row WIRE sweep so Fri morning is execution, not discovery. No code touched tonight.
**Templates:** existing `lib/api/defects-api.ts` · `audit-api.ts` · `pending-invites-api.ts` — same Option-B convention (`fetchWithFallback` with null fallback; never throws; canned holds on failure).

---

## Hard-Rule-11 contracts (verified against backend, file:line cited)

### 1. `api/test-runs` — `test-runs/test-runs.controller.ts` ⛔ NO LIST ENDPOINT

- **Fri PM Hard-Rule-11 catch (2026-06-19):** the controller has ONLY `@Patch(':id/start')`, `@Patch(':id/result')`, `@Patch(':id/abort')` — **no `@Get()`, no `@Get(':id')`, no `@Post()` list.** /home cannot fetch a runs list against this BE state.
- **Resolution for tonight's WIRE sweep:**
  - `/home` ActiveRunsCard → swapped to `<ComingSoon label="Active runs" hint="Live run progress arrives once the run-list endpoint ships." />` (honest "no BE list yet" rather than canned `ACTIVE_RUNS`).
  - `RECENT_RUNS` canned export was never rendered anywhere → left in place as dead code (no behaviour change).
- **Reinstate as a live card once BE adds:**
  - `@Get('') @Roles(...)` workspace-scoped list returning `{ ok, runs, pagination }`, **AND**
  - `@Get(':id') @Roles(...)` detail returning `{ ok, run }` (currently the controller returns an un-enveloped `{ id, status, startedAt }`-shape from PATCH handlers — not a stable read endpoint).
- **Shared schema:** `TestRunSchema` at `packages/shared/src/schemas/test-run.ts:5` (item only — no list-response schema; compose locally when BE adds the list).

### 2. `api/audit` — already wired (`audit-api.ts`)

- For **/home EVIDENCE_THREAD + F27 Recent Activity**: reuse `fetchAuditEntries()` from `audit-api.ts`; filter client-side by `actorEmail` containing `composer|curator|sherlock` (or `actor_kind=agent` if BE adds it).
- No new fetcher needed. **Two display adapters** (one per surface) point at the same source.

### 3. `api/defects` — already wired (`defects-api.ts`)

- For **/home QUEUE defect-triage lane**: reuse `fetchDefects()`; filter `status===new||triaged` for the "needs triage" lane count.
- No new fetcher. One small selector.

### 4. `api/users` — `users/users.controller.ts:46`

- `@Controller('api/users')` `@Get()` returns `{ ok: true as const, users }` (all 4 roles, line 75).
- **Shared schema:** `UserPublicSchema` at `packages/shared/src/schemas/user.ts:21`.
- For **F27 team roster**: `useAdminUsers` hook exists but unused — Fri AM, wire it through `users-roles-page.tsx` (replace `F27_TEAM_MEMBERS` canned with hook output, canned = fallback).

### 5. `api/requirements` — `requirements/requirements.controller.ts:70` + `:182`

- **TWO controllers** (the path-drift correction):
  - **Project-scoped**: `api/projects/:projectId/requirements` (`@Get()`, line 108) — list per project.
  - **Flat**: `api/requirements` (`@Get(':reqId/test-cases')`, line 205) — only the linked-TCs sub-endpoint.
- **For F14**: project-scoped list is what we need → caller must pass `projectId` (resolve from active project context, same pattern as F09 switcher).
- **Shared schemas:** `RequirementListItem` line 83, `RequirementListResponse` line 102.

### 6. `api/test-cases` — `test-cases/test-cases.controller.ts:75` + `:208`

- **TWO controllers** (same path-drift class as reqs):
  - **Project-scoped**: `api/projects/:projectId/test-cases` (`@Get()`, line 113) — list per project.
  - **Flat**: `api/test-cases` (`@Get(':caseId')`, line 231) — only detail by id.
- **For F17 list**: project-scoped → needs `projectId`.
- **Shared schemas:** `TestCaseListItem` line 206, `TestCaseListResponse` line 224.

### 7. `api/admin/config/llm-providers` — `admin/llm-config/llm-config.controller.ts:34`

- **CORRECTION self-correction:** route prefix IS `api/admin/config/llm-providers` (as I originally planned), just lives in `admin/llm-config/` sub-folder (file location ≠ route prefix; the planning brief had it right).
- For **F26m1 + `/admin/settings/providers`**: read remaining handlers (GET/PATCH/POST test-connection) Fri AM — likely `{ok, providers}` envelope.
- **Shared schema:** `LlmProviderSchema` at `packages/shared/src/schemas/llm.ts:14`.

---

## Adapter sketches (per row, what to build Fri AM)

| Row                            | New file (or reuse)                                                                     | Caller wires it into                                             | Display shape needed                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| /home ACTIVE_RUNS              | **`lib/api/test-runs-api.ts`** new — `fetchActiveRuns()` filters `status === 'running'` | `components/home/qa-engineer-home.tsx`                           | `ActiveRun` (existing)                                                       |
| /home RECENT_RUNS              | same file — `fetchRecentRuns(limit=5)` ordered by `createdAt desc`                      | same                                                             | `RECENT_RUNS` shape                                                          |
| /home EVIDENCE_THREAD          | reuse `audit-api.ts` + new `auditToEvidence()` adapter                                  | same                                                             | `EvidenceEntry` (existing)                                                   |
| /home QUEUE defect-triage lane | reuse `defects-api.ts` + selector `defects.filter(d => d.status === 'new')`             | same                                                             | row count + first 3 titles                                                   |
| F27 Recent Activity            | reuse `audit-api.ts` + new `auditToActivityEntry()`                                     | `users-roles-page.tsx`                                           | `F27ActivityEntry`                                                           |
| F27 team roster                | reuse `useAdminUsers` hook (unused today)                                               | `users-roles-page.tsx`                                           | structural `TeamMemberRow[]` (decouple frozen type, same pattern as Sweep C) |
| F14 requirements               | **`lib/api/requirements-api.ts`** new — `fetchRequirements(projectId)`                  | `requirements-list-page.tsx`                                     | structural `RequirementRow[]`                                                |
| F17 test cases                 | **`lib/api/test-cases-api.ts`** new — `fetchTestCases(projectId)`                       | `test-case-library-placeholder.tsx` (or new list view)           | structural `TestCaseRow[]`                                                   |
| F26m1 LLM config               | **`lib/api/llm-config-api.ts`** new — `fetchLlmProviders()`                             | `llm-provider-setup-modal.tsx` + `llm-provider-config-modal.tsx` | structural `LlmProviderRow[]`                                                |

### Project-context plumbing (3 of 9 rows need it)

F14 + F17 + F19/F20 require a `projectId`. Source: `useActiveProject()` from `lib/contexts/ProjectContext.tsx` (already used by the topbar switcher). Adapter signature: `fetchX(projectId: string): Promise<T[] | null>`; page hook reads active project then calls.

---

## Per-row loading / empty / error contract (Option-B convention applied)

| State                      | Behavior                                                                                                                                          | Why                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Loading**                | Keep canned visible — no skeleton, no spinner.                                                                                                    | Same pattern as #283/#274/#276. No visual flash. Cleanest visual gate.        |
| **Empty `{ok, items:[]}`** | Render honest empty state ("0 active runs", "No requirements yet", CTA where one exists pre-port).                                                | Yogesh's "no dummy data" bar — the real data is "nothing yet", and we say so. |
| **Error / null**           | Silent fallback to canned + `console.warn('[label] fetch failed → canned')`. **No toast** (avoids E2E noise; Yogesh sees fixtures, not a banner). | Matches `fetchWithFallback` contract. Render never breaks.                    |

## Yogesh-workflow coverage (every WIRE row earns its hour)

| WIRE row                  | W1 Admin walk | W2 Invite + role-switch | W3 QA Engineer | Wasted? |
| ------------------------- | ------------- | ----------------------- | -------------- | ------- |
| /home ACTIVE_RUNS         | —             | —                       | ✅             | no      |
| /home RECENT_RUNS         | —             | —                       | ✅             | no      |
| /home EVIDENCE_THREAD     | ✅            | —                       | ✅             | no      |
| /home QUEUE defect-triage | —             | —                       | ✅             | no      |
| F27 Recent Activity       | ✅            | ✅ (invite shows here)  | —              | no      |
| F27 team roster           | ✅            | ✅                      | —              | no      |
| F14 requirements          | —             | —                       | ✅             | no      |
| F17 test cases            | —             | —                       | ✅             | no      |
| F26m1 LLM config          | ✅            | —                       | —              | no      |

**0 speculative wires** — every one is on at least one workflow Yogesh will actually exercise Fri evening.

## /home HERO de-fiction (no endpoint, no fetcher needed)

Replace `Sprint 42 · Day 9 of 14` etc. with: `"Welcome back, {user.displayName}"` + active project name from `useActiveProject()`. Strip release banner. ~20 LOC edit in `qa-engineer-home.tsx`.

## "Coming soon" affordance — single shared component

Build once, use 7 places: `<ComingSoon label="Release risk" hint="Coming in next release" />` — greyed-out card matching canonical token palette (`--t3` text, `--overlay` bg, `--border` border, `cursor: not-allowed`). One file: `components/admin/coming-soon.tsx`. Used in: home RELEASE_RISK · AI_NARRATIVE · PINNED_REFS · SUGGESTED_NEXT · F23 reports · F25 executive · F26 agents activity.

---

## Recommended Fri AM order (smallest blast radius first)

1. **Project-context-free wires (parallel-safe):** F27 team roster (`useAdminUsers` already exists — fastest), F26m1 LLM config, /home EVIDENCE_THREAD + QUEUE-triage (reuse existing fetchers), F27 Recent Activity (reuse audit).
2. **Project-scoped wires** (F14 reqs, F17 TCs, /home runs ×2, F19/F20) — after wiring project-context-free ones; same pattern, so the second batch is mechanical.
3. **HERO de-fiction + `ComingSoon` component + label-application sweep** — last (visual gate at 320 + 1440 once, covers everything that moved).

**Time estimate:** the 4 project-context-free wires ≈ 2.5 hr (route-mock verify each, same pattern as #283/#274/#276); the 4 project-scoped wires ≈ 2 hr (mechanical once context plumbing is up); HERO + ComingSoon + labels ≈ 1.5 hr; visual gate ≈ 1 hr. **Total ≈ 7 hr** — fits the 9 AM–4 PM block with buffer for E2E P0 follow-ups.

## What I'm NOT building Fri AM (out of scope, on the inventory)

- F23 reports / F25 executive surfaces (M5 — coming-soon label only)
- F26 agents activity/health (no clean endpoint — coming-soon label only)
- F18 Test Suites (still gated on BE controller)
- TipTap / F24 / KB advanced — all explicitly dropped per Yogesh's earlier decisions
