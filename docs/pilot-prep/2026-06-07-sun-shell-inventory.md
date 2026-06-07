# Sun 2026-06-07 — Shell Consistency Inventory + Gap Analysis

**Author:** FE+1 (cross-executed in MAIN's chat)
**Worktree:** `/Users/yogeshmohite/AI_Tester_Project/Project10-QA_Nexus-frontend`
**Canonical source:** `PM1_UI_v2/Redesign Frame by claude design/_SHELL Topbar + Left Rail.html` + `_SHELL Developer Handoff.md` (Yogesh shipped 2026-06-06 22:00)
**Pilot Day-1:** Mon 2026-06-08 (≈24 hr horizon)

---

## §1 Headline

**Good news:** the existing `apps/web/components/admin/admin-shell.tsx` (1336 LOC) already implements **~70% of canonical**. Most of the markup, tokens, and structural primitives (rail collapse, section collapse, mobile drawer, scroll-lock, ESC, sticky topbar, rail-foot identity) are already there per the Day-11 amendment.

**Real gap:** the **dropdowns** are mostly visual stubs (Pattern A). They need interactivity to satisfy the canonical:

1. Project switcher → dropdown of 5 Iksula projects with select+check
2. Search → live-filter nav items + ⌘K shortcut + grouped results
3. Quick create (+) → 5-item dropdown
4. Notifications (bell) → 5-item dropdown + unread dots + Mark all read
5. Theme toggle → flip `html[data-theme]` + persist (currently visual stub)
6. Mode toggle (Operate/Review/Prove) → set `app.dataset.mode` + persist
7. User pill → account menu dropdown with 6 rows + Sign out
8. **Light theme tokens** in `globals.css` (currently dark-only; canonical needs `html[data-theme="light"]` block)

**Strategy** (preserves Sun window):

- **Do NOT rebuild AdminShell from scratch.** Upgrade the 8 gaps in-place.
- All 17 P0/P1 components that import AdminShell will inherit the upgrade automatically — zero per-page churn for the dropdowns/theme.
- Per-page work is only: confirm `active` prop is set + verify render at viewports.

---

## §2 Route inventory (35 total page.tsx files)

### Authenticated — `/admin/*` (6 routes, P0)

| Route                             | Component used                               | AdminShell wrap                        | Notes                                      |
| --------------------------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| `/admin/agents/`                  | `agents-page.tsx`                            | ✓                                      | F26, active=`agents`                       |
| `/admin/agents/provider-setup/`   | `LlmProviderSetupModal` (#236 MERGED)        | ✓ (via base)                           | F26m1 modal route                          |
| `/admin/agents/model-assignment/` | `AgentsWithModelAssignmentModal` (#244 OPEN) | ✓ (via wrapper renders F26 underneath) | F26m2 modal route                          |
| `/admin/users/`                   | `users-roles-page.tsx`                       | ✓                                      | F27, active=`users-roles`                  |
| `/admin/users/invite/`            | `UsersRolesWithModal` (#240 OPEN)            | ✓ (via wrapper)                        | F27m1 modal route                          |
| `/admin/settings/`                | `settings-audit-page.tsx`                    | ✓                                      | F28, active=`settings-audit`               |
| `/admin/settings/providers/`      | `LlmProviderConfigModal` (#237 MERGED)       | ✓ (via base?)                          | F28m1 modal route — verify wrapper present |

### Authenticated — `/home/*` (3 routes, P0)

| Route               | Component              | Wrap | Notes                  |
| ------------------- | ---------------------- | ---- | ---------------------- |
| `/home/`            | `qa-engineer-home.tsx` | ✓    | F08 default home       |
| `/home/empty/`      | (similar)              | ✓    | F08 empty state        |
| `/home/lead-admin/` | (similar)              | ✓    | F08 Lead/Admin variant |

### Authenticated — `(app)` group (10 routes, P1)

| Route                                  | Component                           | Wrap | Notes                             |
| -------------------------------------- | ----------------------------------- | ---- | --------------------------------- |
| `/(app)/requirements/`                 | `requirements-list-page.tsx`        | ✓    | F14, active=`requirements`        |
| `/(app)/test-cases/`                   | `test-case-library-placeholder.tsx` | ✓    | F16a/b/c, active=`test-cases`     |
| `/(app)/test-cases/generate/`          | `generate-page.tsx`                 | ✓    | active=`test-cases` (or sub)      |
| `/(app)/kb/imports/`                   | `kb-imports-page.tsx`               | ✓    | F15 child                         |
| `/(app)/kb/upload/`                    | `kb-upload-page.tsx`                | ✓    | F15 child                         |
| `/(app)/projects/[slug]/defects/`      | `defects-page.tsx`                  | ✓    | F21 list                          |
| `/(app)/projects/[slug]/defects/[id]/` | `F22DefectDetail.tsx`               | ✓    | F22                               |
| `/(app)/projects/[slug]/reports/`      | `F23ReportsStudio.tsx`              | ✓    | F23                               |
| `/(app)/projects/[slug]/results/`      | `results-page.tsx`                  | ✓    | F20                               |
| `/(app)/projects/[slug]/runs/[runId]/` | `run-console-page.tsx`              | ✓    | F19                               |
| `/(app)/dashboard/executive/`          | `F25Page.tsx`                       | ✓    | F25, active=`executive-dashboard` |

### Authenticated — top-level `/projects/*` (6 routes, P1 — older paths)

| Route                                   | Component                | Wrap      | Notes                       |
| --------------------------------------- | ------------------------ | --------- | --------------------------- |
| `/projects/`                            | `projects-list-page.tsx` | ✓         | F09                         |
| `/projects/[slug]/kb/`                  | `kb-page.tsx`            | ✓         | F15 (top-level)             |
| `/projects/[slug]/imports/`             | ?                        | ?         | Could be Pattern A page     |
| `/projects/[slug]/sources/jira/`        | ?                        | likely no | Onboarding flow inside auth |
| `/projects/[slug]/sources/jira/step-2/` | ?                        | likely no | Onboarding step             |
| `/projects/[slug]/sources/jira/step-3/` | ?                        | likely no | Onboarding step             |
| `/projects/[slug]/upload/`              | ?                        | ?         | Pattern A page              |

### Auth-flow — NO shell (4 routes)

- `/(auth)/sign-in/` + `/(auth)/sign-in/forgot/` + `/(auth)/verify-magic-link/` + `/(auth)/set-password/` — per Hard Rule 14, these are pre-auth and have no shell.

### Onboarding — NO shell (4 routes)

- `/(onboarding)/founder/` + `/(onboarding)/invited/{lead-admin,qa-engineer,stakeholder}/` — first-login wizards, no shell.

### Other (2)

- `/` (`app/page.tsx`) — likely a redirector. Verify.

### Missing routes (frame canon exists, React port not built — Day-29 backlog)

- **`/test-suites/`** (F18) — no React route found. Frame exists in `PM1_UI_v2/Redesign Frame by claude design/` per Day-21 work.
- Per-agent integrations sub-pages (under F28) — sub-routes may need to be built.

---

## §3 Current AdminShell — what's IN vs canonical

| Feature                                                                                | Status                                                    | Action                                                                                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Tokens (dark) on `:root` in `globals.css`                                              | ✓ Present (Day-11)                                        | Audit vs canonical token list, add missing                                                               |
| Tokens (light) on `html[data-theme="light"]`                                           | ✗ MISSING                                                 | **Add full block from handoff §2**                                                                       |
| Inter / DM Sans / JetBrains Mono via `next/font/google`                                | ✓ Present in `layout.tsx`                                 | **Lesson 10 — vars don't cascade to plain CSS. Add `<link>` to head OR fix the `@theme inline` mapping** |
| Topbar markup (brand + project pill + search + icon cluster + mode toggle + user pill) | ✓ Present                                                 | Verify visual parity with canonical at 1024+                                                             |
| Rail markup (collapse toggle + 5 sections + 20 items + foot)                           | ✓ Present                                                 | Audit nav count (handoff says 20; current may differ)                                                    |
| Rail collapse toggle (240↔64)                                                          | ✓ Wired with localStorage `qa-nexus.shell.rail-collapsed` | ✓                                                                                                        |
| Section collapse (per-section persistence)                                             | ✓ Wired                                                   | ✓                                                                                                        |
| Mobile hamburger drawer + scroll-lock + ESC                                            | ✓ Wired (Day-11)                                          | Verify behavior + animation                                                                              |
| Active nav item state                                                                  | ✓ Via `active` prop                                       | ✓                                                                                                        |
| **Project switcher dropdown** (5 projects, select+check)                               | ✗ Static pill                                             | **BUILD: dropdown component, list 5 Iksula projects, persist selection**                                 |
| **Search dropdown** (live-filter nav + ⌘K + grouped results)                           | ✗ Static placeholder                                      | **BUILD: keyboard shortcut + filter + results panel + groups**                                           |
| **Quick create dropdown** (+)                                                          | ✗ Icon only, no dropdown                                  | **BUILD: 5-item menu (Requirement / Test case / Generate / Test run / Defect)**                          |
| **Notifications dropdown** (bell + 3 badge)                                            | ✗ Bell icon only                                          | **BUILD: 5-item menu + unread dots + Mark all read**                                                     |
| **Theme toggle** (sun/moon → `html[data-theme]`)                                       | ✗ Pattern A visual stub                                   | **BUILD: persist to `qa-nexus.theme` localStorage, flip attribute**                                      |
| **Mode toggle** (Operate / Review / Prove)                                             | ✗ Visual only, not wired                                  | **BUILD: set `app.dataset.mode`, persist `qa-nexus.mode`**                                               |
| **User menu dropdown**                                                                 | ✗ Static pill                                             | **BUILD: 6-row menu (Profile / Account / Theme / Shortcuts / Help / Sign out)**                          |
| One-popover-at-a-time + outside-click close + ESC                                      | ✗ Per-popover; no shared closeAll                         | **Add `useOpenPopover()` state shared across all dropdowns**                                             |
| SYS-17 scrollbar                                                                       | ✓ Present (Day-11)                                        | ✓                                                                                                        |
| Rail-foot persistent identity                                                          | ✓ Present                                                 | ✓                                                                                                        |

---

## §4 Recommended upgrade plan (in priority order)

### TIER 1 — must-ship for Mon pilot (≈3 hr)

1. **Add light theme tokens** to `globals.css` (handoff §2 block) — **20 min**
2. **Fix Lesson 10 font loading** — either:
   - (a) Add `<link rel="stylesheet">` to `layout.tsx` `<head>` for Google Fonts (immediate fix, matches handoff)
   - (b) Audit + fix the `@theme inline` mapping so `var(--font-inter)` resolves at all scopes
   - **Recommendation: do (a) — safest, matches canonical 1:1, takes 5 min** — **5 min**
3. **Theme toggle** wired + persistent + flips `html[data-theme]` — **30 min**
4. **Project switcher dropdown** with 5 projects + check + persist `qa-nexus.project` — **30 min**
5. **User menu dropdown** with Sign out (functional) — **30 min**
6. **Shared `useOpenPopover()` state** so dropdowns are one-at-a-time + ESC + outside-click — **20 min**

**= ≈2 hr 15 min. Pilot ships with: themed shell + working project switcher + working user menu + Sign out + all P0 pages inherit.**

### TIER 2 — nice-to-have if Tier 1 finishes < 12:00 IST (≈1.5 hr)

7. **Quick create (+) dropdown** with 5 items linking to existing routes — **20 min**
8. **Notifications (bell) dropdown** with 5 stub items + Mark all read — **30 min**
9. **Mode toggle** wired + persist `qa-nexus.mode` (doesn't change anything visible yet, just state) — **15 min**
10. **Search** live-filter nav items + ⌘K shortcut + grouped results — **45 min**

### TIER 3 — defer to post-pilot (Day-29 backlog)

11. **F18 Test Suites page** — React port not started (frame exists)
12. **Onboarding flow shell-less polish** — already correct per Hard Rule 14
13. **`apps/web/app/page.tsx`** redirector audit
14. Cross-page audit: confirm all 17 components passing correct `active` prop
15. Lesson 10 root-cause fix on `next/font` (replace per-modal `@import` with global `<link>`)

---

## §5 Per-page migration assessment

**Good news:** 17 component files already import AdminShell. The Tier 1 upgrade is **shell-only** — no per-page edits needed for the dropdowns/theme to start working. The only per-page risk is if a component:

- Doesn't pass `active` prop → nav item won't highlight
- Hardcodes a color that conflicts with light theme → looks weird in light mode

**Mitigation in Phase 3:** Playwright probe at 320 + 1440 in BOTH themes for each P0 page (F08, F26, F27, F28). Catch hardcoded hex on the fly.

---

## §6 Risk + open questions for Yogesh

1. **Lesson 10 follow-up**: should I (a) add `<link>` to `layout.tsx <head>` (1:1 with canonical) or (b) leave the per-modal `@import` workaround in place + use the global path going forward? Recommendation: (a) — it's 5 min and matches the canonical.
2. **`/admin/settings/providers/` route component**: still need to verify if it has an AdminShell wrapper or if it's modal-only. Will check in Phase 3.
3. **Tier 2 budget**: should I aim for Tier 2 completion if Tier 1 finishes early, or strictly stand down at 16:30 and defer 2 to post-pilot?
4. **Mode toggle semantics**: should switching between Operate / Review / Prove DO anything visible (filter content, change layout), or just persist + set `app.dataset.mode` for future hook? Brief says just set dataset, so I'll do that.
5. **`/test-suites/` (F18)** — React port not started but frame exists. Confirm Day-29 deferral is acceptable.

---

## §7 Branch + PR strategy

- **PR A:** `feat/web-shell-canonical-upgrade` — AdminShell upgrade + globals.css light theme + Lesson 10 font fix. All P0/P1 components inherit. **No per-page edits in this PR.**
- **PR B:** `chore/web-shell-active-audit` — per-page `active` prop audit + any hardcoded-hex fixes uncovered in Phase 3 visual gate.
- **PR C:** This inventory doc — `docs/web-shell-inventory-sun.md` (this file, committed once approved).

All flat-base to main.

---

## §8 Approval requested

Per brief Phase 1: **PAUSE FOR YOGESH APPROVAL** before Phase 2 starts.

**Approve as-is?** Tier 1 (≈2h 15m) ships before lunch. P0 pages tested in Phase 3 (afternoon). Tier 2 attempted only if Tier 1 ships clean by 12:00.

OR — reply with redirects:

- Scope cut: skip a specific Tier 1 item
- Scope add: lift a Tier 2 item to Tier 1
- Strategy change: full AdminShell rewrite instead of in-place upgrade
- Defer to post-pilot entirely (just ship the docs + Lesson 10 font fix today)
