# Seed-data centralization migration runbook (FE Day-4 morning)

**Owner:** FE chat.
**Target:** delete the 3 existing `apps/web/components/**/data.ts` files; rewrite all consumers to read from the new context-provider hooks per ADR-006. Visual output must be **pixel-identical** before vs after — the seed data is the same, only its source changes.
**Estimate:** ~1.5 hours total (5 PRs of ~15-20 min each).
**Closes:** followup (i) from `docs/followups.md`.

---

## Why this exists

ADR-006 documents the architectural decision in full. Short version:

- 5 components (F08a, F08b, F08c, F09, F10) had inline `data.ts` files with hardcoded user/project names. Drift was inevitable.
- MAIN scaffolded a 3-layer architecture Day-3 evening: types in `@qa-nexus/shared/seed-types`, single source in `apps/web/lib/demo-seed.ts`, hook providers in `apps/web/lib/contexts/*`.
- This runbook tells you how to migrate each existing component without breaking visuals.

## Pre-flight

Before starting:

```bash
git pull origin main --ff-only
git log --oneline -3 | head    # confirm 0bb13c4 (seed-types) and the demo-seed/contexts commit are present
pnpm install                    # picks up @qa-nexus/shared workspace-link
pnpm --filter web typecheck     # baseline must exit 0
```

If typecheck fails, STOP. Fix the baseline first; don't migrate on a broken tree.

## The 5 components to migrate

| Order | Component                                | Existing data.ts | New imports                                                                                 |
| ----- | ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| 1     | F08a — `apps/web/components/home/`       | DELETE           | `useCurrentUser`, `useActiveProject`, `useTeamRoster`                                       |
| 2     | F08b — `apps/web/components/home-lead/`  | DELETE           | `useCurrentUser`, `useActiveProject`, `useTeamRoster`, `useTeamMember`                      |
| 3     | F08c — `apps/web/components/home-empty/` | DELETE           | `useCurrentUser`, `useActiveProject`                                                        |
| 4     | F09 — `apps/web/components/projects/`    | (not yet built)  | `useProjectList`, `useSetActiveProject`                                                     |
| 5     | F10 — `apps/web/components/sprint/`      | (not yet built)  | `useActiveProject`, `useTeamRoster`, plus filtered defects/runs/test-cases from `demo-seed` |

Migrate **one at a time**, one PR per component. Each PR's diff is small (~150-300 lines net) and reviews fast.

## Standard migration steps (per component)

### Step 1 — Find the imports

```bash
grep -rn "from '\./data'" apps/web/components/<component-folder>/
```

This lists every `.tsx` consumer. Memorize the names imported (`SIGNED_IN_USER`, `ACTIVE_PROJECT`, `HERO`, etc.).

### Step 2 — Map old names to new hooks

Reference table (most components only need a subset):

| Old import (`./data`)           | New hook                                                                      | Notes                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `SIGNED_IN_USER`                | `const me = useCurrentUser();`                                                | shape change: `me.displayName` (was `name`), `me.role`, `me.id`. Initials computed inline.      |
| `ACTIVE_PROJECT`                | `const project = useActiveProject();`                                         | shape change: `project.key`, `project.name`. Sprint info stays in component — see Step 4 below. |
| `TEAM_ROSTER` / `TEAMMATES`     | `const { members } = useTeamRoster();` or `const teammates = useTeammates();` | use `useTeammates()` when "exclude self" is intended (most cases).                              |
| Hardcoded "Akshay Panchal"      | `const akshay = useTeamMember(SEED_IDS.users.akshay);`                        | only if the component genuinely needs to reference Akshay specifically (e.g., approval cards).  |
| Test-case / defect / run arrays | `import { testCases, defects, recentRuns } from '@/lib/demo-seed';`           | direct import from demo-seed is FINE for the data arrays — only ENTITY identity goes via hooks. |

### Step 3 — Replace imports

```diff
-import {
-  SIGNED_IN_USER,
-  ACTIVE_PROJECT,
-  HERO,
-  TEAMMATES,
-  RECENT_DEFECTS,
-} from './data';
+import { useCurrentUser } from '@/lib/contexts/CurrentUserContext';
+import { useActiveProject } from '@/lib/contexts/ProjectContext';
+import { useTeammates } from '@/lib/contexts/TeamRosterContext';
+import { defects } from '@/lib/demo-seed';
```

### Step 4 — Reshape per-component constants that genuinely belong in the component

Some `./data.ts` exports are **view-specific** stubs that don't belong in the central seed (e.g., the F08a "HERO" copy: "Welcome back, Kishor" — that's a view-time computation, not data). Keep these as **inline `const` declarations within the .tsx file**, computed from the hook output:

```tsx
export function QAEngineerHome() {
  const me = useCurrentUser();
  const project = useActiveProject();

  // View-specific copy (NOT seed data — computed from hook output)
  const HERO = {
    greeting: `Welcome back, ${me.displayName.split(' ')[0]}`,
    subtitle: `${project.name} · Sprint 42 Day 9 of 14`,
  };

  return (...);
}
```

Sprint info (Sprint 42, Day 9 of 14, release `R-2026-04-PaymentV2`) is currently a hardcoded constant. For the migration: **keep it inline in the component** for now. When BE adds a `Sprint` entity (M2+), it'll come via `useActiveSprint()` from a future context. Don't over-engineer this.

### Step 5 — Visual confirmation gate (CLAUDE.md Rule 13)

For each migrated component:

```bash
# Capture screenshot at 320 + 1440 viewports
pnpm --filter web dev    # in one terminal

# In another terminal:
node apps/web/scripts/screenshot-frame.mjs http://localhost:3000/home 320 568 docs/screenshots/rwd-home-qa-320-post-migration.png
node apps/web/scripts/screenshot-frame.mjs http://localhost:3000/home 1440 900 docs/screenshots/rwd-home-qa-1440-post-migration.png
```

Compare the post-migration screenshots against the pre-migration ones (`rwd-home-qa-{320,1440}.png`). They should be **pixel-identical**. If there's any diff, the migration broke something — investigate before commit.

Diff command:

```bash
# Pixel-compare via ImageMagick (install via brew if not present)
compare -metric AE \
  docs/screenshots/rwd-home-qa-1440.png \
  docs/screenshots/rwd-home-qa-1440-post-migration.png \
  /tmp/diff.png; echo
# Expected: 0 (zero pixels differ)
```

If `compare` reports >0 pixels different, look at `/tmp/diff.png` to see WHAT differs. Common gotchas:

- Display name shape: `me.displayName` includes "Mohanraj K." (with period); old data had "Mohanraj K" (no period). Check the canonical spelling in `IKSULA_CONTEXT.md`.
- Initials: `'KK'` was hardcoded; now compute inline as `me.displayName.split(' ').map(n => n[0]).slice(0, 2).join('')`. Should produce `'KK'` for Kishor Kadam — verify with snapshot test.
- Role label: old data had `'QA Engineer'`; new uses `me.role` which is `'QAEngineer'` (no space). For display copy, use `me.organizationalLabel` (which IS `'QA Engineer'`).

### Step 6 — Run all gates before commit

```bash
# Workspace-wide
pnpm --filter web typecheck    # exit 0
pnpm --filter web lint         # exit 0
pnpm --filter web build        # exit 0

# Pattern A audit (Rule from PM1_PATTERNS.md)
grep -rnE 'fetch\(|useMutation\(|axios|/api/' apps/web/components/<component-folder>/
# Expected: 0 matches OUTSIDE comments. (Comments documenting "no fetch" are fine.)

# Visual gate per Step 5 — must report 0 pixel diff
```

### Step 7 — Delete the old `data.ts`

Once all consumers are rewritten and gates pass:

```bash
git rm apps/web/components/<component-folder>/data.ts
```

### Step 8 — Commit + PR

Per the standard convention:

```bash
git add -A
git commit -m "refactor(web): migrate F08<X> to seed-centralization (followup i, ADR-006)"
git push -u origin feature/fe-seed-migration-f08<X>
gh pr create --title "refactor(web): F08<X> seed centralization (followup i)" \
  --body "$(cat <<EOF
Migrates F08<X> from local data.ts to context-provider hooks per ADR-006.

## Changes
- Deleted apps/web/components/<folder>/data.ts (~N lines).
- Rewrote N consumers to use useCurrentUser / useActiveProject / useTeamRoster / useTeammates / useTeamMember.
- View-specific copy (HERO, etc.) kept inline as const computed from hook output.

## Gates
- [x] pnpm --filter web typecheck — exit 0
- [x] pnpm --filter web lint — exit 0
- [x] pnpm --filter web build — exit 0
- [x] Pattern A audit: 0 fetch/useMutation/axios/api in component tree
- [x] Visual gate: pixel-identical at 320 + 1440 viewports (screenshots attached)

## Closes
followup (i) for F08<X> only. Other components migrate in subsequent PRs.
EOF
)"
```

MAIN reviews each PR for:

- [ ] No new inline `data.ts` files anywhere.
- [ ] All entity lookups via context hooks.
- [ ] No fetch/useMutation/axios in component tree (Pattern A holds).
- [ ] Visual screenshots show 0 pixel diff at 320 + 1440.
- [ ] Both typechecks (web + api) green on the PR's CI run.

## Per-component playbook

### Component 1 — F08a (`apps/web/components/home/`)

Existing `data.ts` exports (skim the file to confirm):

- `SIGNED_IN_USER` (Kishor K.) → `useCurrentUser()`. Hardcode-test by setting `<CurrentUserProvider initialUserId={SEED_IDS.users.kishor}>` in `app/home/page.tsx` until role-switcher UI lands.
- `ACTIVE_PROJECT` (Iksula Returns) → `useActiveProject()`.
- `HERO`, `MY_QUEUE` (test cases), `TEAM_NUDGES`, `RECENT_DEFECTS`, etc. — inline view computations OR direct demo-seed array imports.

Files to edit (~7): `home-shell.tsx`, `left-rail.tsx`, `outcome-board.tsx`, `qa-engineer-home.tsx`, `queue.tsx`, `right-rail.tsx` + delete `data.ts`.

### Component 2 — F08b (`apps/web/components/home-lead/`)

Existing exports likely include `SIGNED_IN_USER` (Akshay), `APPROVAL_QUEUE` (3 items: A1, A2, A4), defect rows. Map:

- Akshay = Lead → `useCurrentUser()` with `<CurrentUserProvider initialUserId={SEED_IDS.users.akshay}>`.
- Approval queue → `import { pendingApprovals } from '@/lib/demo-seed';` then filter by `assignedTo.id === me.id`.
- Per-approval requestedBy → `useTeamMember(approval.requestedBy.id)`.

Files to edit (~7): `approvals-queue.tsx`, `home-shell.tsx`, `left-rail.tsx`, `outcome-board.tsx`, `qa-lead-home.tsx`, `right-rail.tsx` + delete `data.ts`.

### Component 3 — F08c (`apps/web/components/home-empty/`)

Empty-project state — fewer dependencies. Likely just `SIGNED_IN_USER` + `ACTIVE_PROJECT`.

Files to edit (~4): `founder-empty-home.tsx`, `home-shell.tsx`, `left-rail.tsx` + delete `data.ts`.

### Components 4 + 5 — F09, F10 (not yet built)

Build them from scratch using the new pattern. No data.ts, only context hooks + direct demo-seed array imports for tabular data.

## Common pitfalls + fixes

| Pitfall                                                          | Fix                                                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component imports both old `./data` and new context hook → drift | grep first; rewrite all consumers in one PR; delete `./data` last.                                                                                  |
| `useCurrentUser` throws "must be called within Provider"         | Verify `apps/web/app/layout.tsx` wraps tree in `<CurrentUserProvider>` (already done in Phase 3f, commit pending).                                  |
| Visual diff: greeting now says "Yogesh" not "Kishor"             | Default current user is Yogesh (Admin). For F08a (QA Engineer view), set `<CurrentUserProvider initialUserId={SEED_IDS.users.kishor}>` in the page. |
| Visual diff: "QAEngineer" instead of "QA Engineer"               | Use `me.organizationalLabel` (display copy) not `me.role` (enum value).                                                                             |
| Test-case row count differs                                      | demo-seed has 50 test cases (20 RET / 12 CART / 8 PAY / 7 AUTH / 3 OPS). Old data.ts may have had only 5–10 — keep the new richer list.             |
| Pattern A grep flags self-documenting comments                   | False positives — comments like `// NO fetch` are fine. The CI check ignores comment-only matches via the `\bfetch\(` regex anchor.                 |
| pnpm-lock.yaml conflicts on rebase                               | regen via `pnpm install` then commit.                                                                                                               |

## Acceptance — when this runbook is "done"

- [ ] `find apps/web/components -name data.ts` returns 0 files.
- [ ] `grep -rE "from '\./data'" apps/web/components` returns 0 matches.
- [ ] All 5 component PRs (#XX–#XX) merged.
- [ ] `pnpm --filter web typecheck` + `pnpm --filter web build` both exit 0 on `main`.
- [ ] `apps/e2e` /health smoke test still passes (no FE auth flow regression).
- [ ] Visual screenshots in `docs/screenshots/rwd-{home-qa,home-lead,home-empty,projects,sprint}-{320,1440}.png` updated post-migration; pixel-identical to pre-migration.
- [ ] Followup (i) marked `✅ CLOSED` in `docs/followups.md` with the merge SHAs.

## Cross-references

- ADR-006 (`docs/architecture/adr-006-seed-data-centralization.md`) — the architectural decision this runbook implements
- `packages/shared/src/seed-types.ts` — Layer 1 type contracts
- `apps/web/lib/demo-seed.ts` — Layer 2 demo source (unchanging during migration)
- `apps/web/lib/contexts/{CurrentUser,Project,TeamRoster}Context.tsx` — Layer 3 hooks
- `apps/web/app/layout.tsx` — provider wire-up
- `IKSULA_CONTEXT.md` — the canon the seed must reflect
- `PM1_PATTERNS.md` Pattern A + Pattern B — deferred routing + visual confirmation gate (both still apply)
- `docs/followups.md` (i) — the follow-up entry
