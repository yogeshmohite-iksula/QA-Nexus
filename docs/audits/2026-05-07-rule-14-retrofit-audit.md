# Hard Rule 14 Retrofit Audit (Day-12 Thu 2026-05-07)

> **Trigger:** Rule 14 codified on Day-11 evening (2026-05-06) via PR #64. Yogesh asked
> for a retrofit audit of pre-Rule-14 frames F08, F09, F27, F28 to confirm shell parity.
>
> **Audit time:** 09:55 IST. **Author:** MAIN session.

---

## TL;DR

| Frame                      | Route             | Page-level wrap     | Component wraps in AdminShell? | Status           |
| -------------------------- | ----------------- | ------------------- | ------------------------------ | ---------------- |
| **F08 Home** (QA Engineer) | `/home`           | `QaEngineerHome`    | ❌ does NOT import AdminShell  | ⚠️ **VIOLATION** |
| **F09 Projects List**      | `/projects`       | `ProjectsListPage`  | ❌ does NOT import AdminShell  | ⚠️ **VIOLATION** |
| **F27 Users & Roles**      | `/admin/users`    | `UsersRolesPage`    | ✅ imports AdminShell          | OK               |
| **F28 Settings & Audit**   | `/admin/settings` | `SettingsAuditPage` | ✅ imports AdminShell          | OK               |

**Plus**: AdminShell component itself lacks the `data-shell-collapse` + `data-shell-hamburger` data attributes that followup `(ak)` will use for hook detection. FE+1's TASK 0 today (AdminShell v2 / Hard Rule 14) is the canonical fix path — adds these primitives.

---

## Methodology

1. Located all `page.tsx` files in `apps/web/app/` for the 4 target routes.
2. Grepped `apps/web/components/` for files importing `AdminShell`.
3. Cross-referenced page → component → AdminShell import.
4. Skimmed `apps/web/components/admin/admin-shell.tsx` for collapse + hamburger primitives.

## Detailed findings

### F08 Home — VIOLATION

- **Page file:** `apps/web/app/home/page.tsx` — renders `<QaEngineerHome />` inside `<CurrentUserProvider>`.
- **Component file:** `apps/web/components/home/qa-engineer-home.tsx` — does NOT appear in the AdminShell-import grep. The page renders custom layout (TopBar + LeftRail are bespoke for F08a, not via shared shell).
- **Locked HTML reference:** F08a Home (QA Engineer).html — was ported pre-Rule-14 with its own custom shell.
- **Severity:** P2 — works visually today, but breaks shell-parity contract; collapse + hamburger primitives won't ship to this route until retrofitted.

### F09 Projects List — VIOLATION

- **Page file:** `apps/web/app/projects/page.tsx` — renders `<ProjectsListPage />` inside `<Suspense>`.
- **Component file:** `apps/web/components/projects/projects-list-page.tsx` — does NOT import AdminShell. Renders bespoke layout for the F09 grid card UI.
- **Severity:** P2 — same as F08.

### F27 Users & Roles — OK

- **Page file:** `apps/web/app/admin/users/page.tsx` → `<AdminGuard>` → `<UsersRolesPage />`
- **Component file:** `apps/web/components/admin/users-roles-page.tsx` ✅ imports `AdminShell` with `active='users-roles'`.

### F28 Settings & Audit — OK

- **Page file:** `apps/web/app/admin/settings/page.tsx` → `<AdminGuard>` → `<SettingsAuditPage />`
- **Component file:** `apps/web/components/admin/settings-audit-page.tsx` ✅ imports `AdminShell` with `active='settings-audit'`.

### AdminShell component itself

- **File:** `apps/web/components/admin/admin-shell.tsx`
- **Status:** Has `TopBar` + left rail chrome, but skim shows no `data-shell-collapse` or `data-shell-hamburger` attributes yet. FE+1's Day-12 TASK 0 ("AdminShell v2 / Hard Rule 14") is the planned fix — adds collapse toggle (desktop) + hamburger (mobile) per F15 v2 canonical reference.
- **Naming followup** noted in source: "rename `AdminShell` → `AppShell` once the rail item count grows past the Govern section" — tracked already.

## Action items

### Filed: followup `(am)` Hard Rule 14 retrofit on F08 + F09

- **Severity:** P2
- **Tag:** `[m2-followup]`
- **Owner:** FE chat
- **Trigger:** to land as Thu PM TASK 5 (after the 3 flip PRs + AdminShell v2 lands)
- **Effort:** S–M (~30 min per frame; both can ship in one PR)
- **Approach:**
  - F08: wrap `<QaEngineerHome>` body in `<AdminShell active='home'>` (add new `'home'` value to the `AdminNavActive` union type)
  - F09: wrap `<ProjectsListPage>` body in `<AdminShell active='projects'>` (add `'projects'` to the union)
  - Remove bespoke top-bar + left-rail markup since AdminShell will provide them
  - Visual gate at 320 + 1440 px to confirm collapse + hamburger primitives render (per Rule 13 amendment)

### Already covered by FE+1 TASK 0 today

- **AdminShell v2** — adds `data-shell-collapse` + `data-shell-hamburger` data attributes (per Rule 13 amendment); adds collapse toggle desktop + hamburger mobile per F15 v2 line refs (89-92, 132-133, 135-148, 183-198).
- After AdminShell v2 lands, the F08 + F09 retrofit will inherit collapse + hamburger primitives automatically.

## Cross-references

- `CLAUDE.md` Hard Rule 14 (codified PR #64, 2026-05-06)
- `docs/followups.md` (ak) — author-time PreToolUse hook for shell-wrap + primitives
- `PM1_UI_v2/Redesign Frame by claude design/F15 Knowledge Base v2.html` — canonical reference
- Day-11 EOD report `docs/eod-reports/2026-05-06-day-11.md` — context
- Hard Rule 13 visual-gate amendment (extended in Rule 14 codification)

---

_Audit complete. 2 of 4 frames violate Rule 14 (F08, F09). Filed `(am)` followup for FE+1 to retrofit Thu PM after AdminShell v2 lands._
