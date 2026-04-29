# ADR-006: Centralize demo seed data + decouple UI from hardcoded names

- **Status:** Accepted
- **Date:** 2026-04-29
- **Deciders:** Yogesh Mohite (Admin), MAIN session
- **Related:** followup (i) `docs/followups.md` · MS0-T030.e/f/g (the F08a/b/c ports that surfaced the issue) · ADR-002 (analogous "shared infra has implicit version coupling" pattern) · `IKSULA_CONTEXT.md` (the 8-user / 5-project canon the seed must remain consistent with)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

During Day 1–3 frame ports (F06 → F08c), each component grew its own `data.ts` file with inline hardcoded user names + project keys + test-case strings + defect entries. By Day 3 EOD we had 5 such files:

```
apps/web/components/home/data.ts            (F08a — QA Engineer Home)
apps/web/components/home-lead/data.ts       (F08b — QA Lead Home)
apps/web/components/home-empty/data.ts      (F08c — Empty Project Home)
apps/web/components/projects/data.ts        (F09 — Projects List, planned)
apps/web/components/sprint/data.ts          (F10 — Sprint Board, planned)
```

Each held a self-contained but partial copy of:

- The 8 named Iksula pilot users (Akshay, Yogesh, Kishor, Nitin, Nadim, Govind, Mohanraj, Sagar)
- 1–5 of the 5 Iksula projects (RET, CART, PAY, AUTH, OPS)
- A few test-case / defect / run rows specific to that view

The data was correct (matched `IKSULA_CONTEXT.md`) but the architecture was wrong:

1. **Every component owned its own version of the canonical data.** Drift was inevitable — F08a's "Akshay" had different `lastLoginAt` than F08b's "Akshay".
2. **Adding a new user (F27 Admin user-management) required N source-code changes.** The contract "Admin creates users → UI shows them" cannot hold if the UI hardcodes the list.
3. **No path from demo to API.** When `GET /api/users` lands (T021 + F27), every component that imports the local `data.ts` must change to use the API. Per-component refactors compound friction.

This ADR formalizes the centralization pattern before more components copy the anti-pattern.

## Decision

Adopt a **3-layer architecture** for stub data on the FE:

| Layer            | File                                | Owner          | Lifetime                                        |
| ---------------- | ----------------------------------- | -------------- | ----------------------------------------------- |
| 1. Type contract | `packages/shared/src/seed-types.ts` | shared (BE↔FE) | Permanent — survives the demo-to-API transition |
| 2. Demo source   | `apps/web/lib/demo-seed.ts`         | apps/web       | Replaced by API queries when BE endpoints land  |
| 3. Context       | `apps/web/lib/contexts/*.tsx`       | apps/web       | Permanent — hook signatures stay stable forever |

**Layer 1** declares typed interfaces (`UserPublic`, `Project`, `TestCase`, `Defect`, `TestRun`, `AgentActivity`, `Approval`, `TeamRoster`, `ProjectList`, plus 3 "with relations" join types). The BE Zod schemas are single-source-of-truth for entity shapes; UI-only types (AgentActivity, Approval) live alongside.

**Layer 2** holds the actual stub arrays + a `SEED_IDS` map of stable hardcoded UUID v4 values. Top-of-file header lists which BE endpoint replaces each array (`/api/users`, `/api/projects`, etc). This file disappears when BE is fully wired.

**Layer 3** wraps the stub arrays in React Context providers with stable hook signatures:

- `useCurrentUser()` → active user (defaults to Yogesh in demo mode)
- `useSetCurrentUser()` → role-switcher (DEMO ONLY; removed post-T030.5)
- `useProjectList()`, `useActiveProject()`, `useProject(slug)`, `useSetActiveProject()`
- `useTeamRoster()`, `useTeamMember(id)`, `useTeammates()`

Components import ONLY from the context layer. They never reach into `lib/demo-seed.ts` directly.

When BE endpoints land, Layer 2 disappears and Layer 3 swaps its data source from `lib/demo-seed.ts` to TanStack Query calls. **Components do not change.** That's the whole point.

### Stable hardcoded UUIDs

All seed IDs are stable hardcoded UUID v4 values (generated once via `node crypto.randomUUID()`, committed verbatim). Rationale:

- Snapshot tests can reference `SEED_IDS.users.yogesh` without flake.
- Referential integrity: `testCase.assignedTo === SEED_IDS.users.akshay` works deterministically.
- Debugging: a UUID in a `console.info` marker is greppable across logs.
- API migration: BE will use real Postgres-generated UUIDs; the seed UUIDs become irrelevant once the swap happens, but in the meantime they're anchors for tests + cross-references.

### Wire order in `apps/web/app/layout.tsx`

```
<CurrentUserProvider>          ← outermost
  <ProjectProvider>
    <TeamRosterProvider>       ← innermost (depends on CurrentUser for "exclude self")
      {children}
```

`TeamRosterProvider`'s `useTeammates()` filters the roster to exclude the current user — that's the only cross-context dependency, and it dictates the inside-out wire order.

## Consequences

### Positive

- **Zero per-component data files.** New components consume `useTeamRoster()` and `useActiveProject()` directly. F09 + F10 can be built without ever creating a `data.ts`.
- **Adding a 9th pilot user is one append to `apps/web/lib/demo-seed.ts:users[]`.** Every component reflects it on next render.
- **Migration to API endpoints is a single-file change.** Replace context-provider's data source from import to `useQuery('/api/users')`. Every consumer hook signature stays stable.
- **Type-safe across BE↔FE boundary.** Components import `UserPublic` from `@qa-nexus/shared` — the same type the BE uses for response payloads.
- **Snapshot test resilience.** Stable UUIDs mean snapshots don't churn on every demo-data tweak.
- **Role-preview switcher** for free. `useSetCurrentUser()` lets us QA Lead vs QA Engineer vs Stakeholder views without round-tripping through real auth.

### Negative / accepted trade-offs

- **Day-4 morning FE refactor required** to delete the 3 existing `data.ts` files + update the components that import them. Estimated ~1.5 hr per the migration runbook.
- **Two providers nest 3-deep** → small render-cost increase. Negligible at PM1 scale; revisit if measured re-render counts get noisy in M2+.
- **`SEED_IDS` map duplicates id strings.** Acceptable trade-off for `SEED_IDS.users.akshay` ergonomics vs `users.find(u => u.email === 'akshay.panchal@iksula.com')!.id`.
- **`useSetCurrentUser` exists in production code paths until T030.5.** Documented as "DEMO ONLY"; tests can fail-fast if a non-test code path imports it. Future TypeScript hygiene: when T030.5 lands, this hook is removed and any remaining consumer fails to compile.
- **Sub-arrays for test-cases / defects / runs / activities / approvals are bigger than any single component needs.** Acceptable: the data lives in one file with no per-component duplication, and the context layer can later add filter helpers if a view needs only "RET P0 defects".

### Neutral

- **Pattern A (CLAUDE.md `PM1_PATTERNS.md`) compatible.** Context providers hold pure local state — no `fetch`, no `useMutation`, no `axios`. Onboarding tree continues to use intent-only routing; this layer just adds a parallel demo-data path for non-onboarding screens.
- **Workspace setup unchanged.** No new pnpm workspace packages; `apps/web/lib/contexts/` is just a new subdirectory.
- **No behavior change for users.** Visible UI is pixel-identical after the migration — the seed data is the same, only its source changes.

## Alternatives considered

### A. Per-component `data.ts` (status quo, do nothing)

**Rejected.** The original anti-pattern. Already showed drift in 24 hrs (Day 1 → Day 3). At PM2 scale (more components, more frame ports), drift compounds.

### B. BE mock-server (e.g., MSW) returning `/api/users` etc. before T021 lands

**Rejected for PM1.** MSW + Storybook mocks would deliver the same component-side win (all components `useQuery('/api/users')` from Day 1) but adds:

- A mock-server runtime to maintain in parallel with the demo-seed file (the mocks have to know the same data).
- MSW Service Worker setup that interferes with Cloudflare Pages static-export build.
- Extra mental model: "is this a real call or a mock?" during dev.

The context-provider approach is **cheaper now and trivially upgrades to MSW or real fetch later** because the components already depend on hook abstractions. Defer MSW to M2 if the demo-mode path becomes painful.

### C. Storybook fixtures (each story declares its own data)

**Rejected.** Storybook isn't installed yet (P2 / M1). Even if it were, Storybook fixtures are for isolated component snapshots — they don't help the actual `/home` page render at runtime.

### D. Server-side seed via Prisma (real Neon DB calls from Day 1)

**Rejected for the FE-only refactor.** Eventually the BE seed at `apps/api/prisma/seed.ts` is the source of truth — that's already done (Day 1 PR #4). But the FE can't talk to the BE until T021 + RBAC + Render are live. Building a "Day-2.5" path where the FE talks to the BE through a partial RBAC stack would add 2–3 days of work for ZERO long-term value (it gets thrown away when real auth lands). The context-provider stub is the right tradeoff.

### E. Co-locate seed in `packages/shared/src/seed.ts` (BE + FE both import)

**Rejected.** Risks the BE ts-node seed runner accidentally importing FE-shaped data. The current `apps/api/prisma/seed.ts` is BE-canonical (uses Prisma client + workspaceId + RLS-aware INSERTs); `apps/web/lib/demo-seed.ts` is FE-canonical (UI-display shapes + already-joined "with relations" types). Two files, one canon — tracked via `IKSULA_CONTEXT.md` so they stay in lockstep.

### F. Server Components + RSC fetch from the API

**Rejected for now.** The FE is `output: 'export'` (Cloudflare Pages static), which doesn't support server-component fetches. Even if it did, the API isn't deployed yet (T011 dashboard work is Yogesh's Day-4 task). When `output: 'standalone'` becomes viable post-pilot (Vercel or Cloudflare Workers), revisit.

## Open questions resolved

1. **What about RBAC visibility — should QA Engineers see ALL defects or only their assigned?** The seed exposes everything; the context providers don't filter. Per-view filtering happens in the components (e.g., F08a "My Queue" filters `defects[]` by `assigneeId === currentUser.id`). When BE endpoints land, RBAC + RLS handle this server-side; FE filtering becomes belt-and-suspenders.
2. **What if a component needs data not in `demo-seed.ts`?** Add it to demo-seed.ts. Don't create a new `data.ts` in the component folder. If you're tempted to, that's the signal to extend `seed-types.ts` with a new entity type FIRST, then add to demo-seed, then consume via context.
3. **How do we keep `IKSULA_CONTEXT.md` and `demo-seed.ts` in sync?** Manual review during PR. Filed as a P3 "future tooling" — `scripts/verify-iksula-canon.ts` could grep IKSULA_CONTEXT.md for the 8 user names + 5 project keys and assert demo-seed.ts contains them. Defer until canon drift actually happens (it hasn't yet).
4. **What about the BE seed in `apps/api/prisma/seed.ts`?** It's BE-canonical for the same 8 users + 5 projects (T020.5 / Day 1 PR #4). When BE endpoints land, the FE switches to API queries that hit BE-seeded data — and the FE demo-seed becomes obsolete. The two seeds are kept in sync via human review against `IKSULA_CONTEXT.md`.

## Migration plan

The FE per-component refactor (deletion of the 3 existing `data.ts` files + import-rewrites) is documented in **`docs/refactor/seed-centralization-migration.md`** as a step-by-step Day-4 morning runbook. FE chat owns execution. Each refactored component lands as its own PR (F08a → F08b → F08c → F09 → F10) so reviews stay scoped.

Acceptance criteria (per migration runbook):

- [ ] No `apps/web/components/**/data.ts` files remain (5 expected before, 0 after).
- [ ] No `import.*from\s+['"]\./data['"]` lines in any component (search via `grep`).
- [ ] All `apps/web/components/**/*.tsx` use `useTeamRoster()` / `useActiveProject()` / `useProject(slug)` / `useTeamMember(id)` for entity lookup.
- [ ] Visual gates: F08a, F08b, F08c, F09, F10 produce **pixel-identical** screenshots before vs after (because the seed data has the same content; only its source changes).
- [ ] `pnpm --filter web typecheck` + `pnpm --filter web build` exit 0.
- [ ] `pnpm --filter @qa-nexus/e2e test --testPathPattern=onboarding` (the always-enabled `/health` smoke) still passes.

## Cross-references

- `packages/shared/src/seed-types.ts` — Layer 1 (type contracts)
- `apps/web/lib/demo-seed.ts` — Layer 2 (demo source)
- `apps/web/lib/contexts/{CurrentUser,Project,TeamRoster}Context.tsx` — Layer 3 (context providers)
- `apps/web/app/layout.tsx` — provider wire-up
- `docs/refactor/seed-centralization-migration.md` — Day-4 FE migration runbook
- `docs/followups.md` (i) — the followup that triggered this ADR
- `IKSULA_CONTEXT.md` — the canonical 8-user / 5-project shape this seed must reflect
- `apps/api/prisma/seed.ts` — BE-side seed (kept in sync via human review against IKSULA_CONTEXT.md)
- ADR-002 — analogous "shared infrastructure has implicit version coupling" pattern (Prisma raw SQL split)
- `PM1_PATTERNS.md` Pattern A — deferred-routing ancestor; this ADR adds the parallel demo-data lane

## Refinement (2026-04-29 evening, post FE PR #16)

The original migration runbook said "delete data.ts". FE chat refined this during PR #16: data.ts files stay as VIEW-ONLY fixture stores; only ENTITY IDENTITY exports (SIGNED_IN_USER, ACTIVE_PROJECT) move to context providers. Rationale: view fixtures (queue rows, evidence chips, sparkline data, sample issues, integration health cards) get replaced by NEW api endpoints (run results, defect lists, agent activity feeds) when M2/M3/M4 backends land — NOT by the user/project APIs that context providers will swap to. Forcing inlining of 200+ lines of view fixtures into 6+ consumer files would have created code duplication for no architectural gain. Future ports follow this refinement: contexts for entity identity, data.ts for view fixtures.
