# Zero Canned Data Sweep — 2026-06-19 ~22:30 IST

After PR #291 + #295 shipped, Yogesh's live walk surfaced surfaces still
masking real state with canned fixtures. This sweep root-causes + fixes
each, OR replaces with honest empty states per the "no canned data
anywhere" bar.

## Phase 1 — Inventory

| #   | Surface                                                                                         | File:line                                                            | Disposition                                              |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | /home Outcome Board · YOUR ACTION QUEUE card                                                    | `outcome-board.tsx:48-69` (`ACTION_QUEUE`)                           | **EMPTY-STATE** (no personal-queue endpoint)             |
| 2   | /home YOUR QUEUE list                                                                           | `queue.tsx:10,19,51` (`QUEUE_ROWS`)                                  | **EMPTY-STATE** (no personal-queue endpoint)             |
| 3   | /requirements 404 on stale UUID                                                                 | `requirements-list-page.tsx:275-286` (uses `project.id` before live) | **FIX root cause** — gate fetch on `isProjectsLoaded`    |
| 4   | F17 Test Cases — same root cause                                                                | `test-case-library-placeholder.tsx`                                  | **FIX same** — gate fetch on `isProjectsLoaded`          |
| 5   | Left nav badges (Requirements 142, TC 1,284, …)                                                 | `admin-shell.tsx` `NavItem.count`                                    | **STRIP** — remove `count` rendering across all NavItems |
| 6   | Settings tabs (General / Branding / Data Retention / Integrations / Billing / SSO / Compliance) | `settings-audit-page.tsx:254-274`                                    | **HIDE** — only Audit Log tab remains                    |
| 7   | F27 Recent Activity wire                                                                        | `users-roles-page.tsx:64-75`                                         | **VERIFY** — should already be live post-#295            |

Out-of-scope rebuilds (DEFERRED, not canned): F19 Run Console, F22 Defect Detail, F09 projects-list-page archived count. These are full-frame surfaces, not /home/F14/F17/F28.

## Phase 2 — ProjectContext loaded flag (root cause)

Add `isProjectsLoaded: boolean` to context. F14 + F17 + any project-scoped consumer gates its useEffect on this flag → no fetch fires with the stale seed UUID. demo-seed remains the synchronous render fallback (shell, switcher don't blink) but child pages wait for the real list before firing project-scoped APIs.

## Phase 3 — /home empty states

`ACTION_QUEUE` card body → "No action items today" / single-line description.
`QUEUE_ROWS` rendering → "Your queue is clear" honest empty section, tabs stay but render 0 across the board until BE adds a personal-queue endpoint.

## Phase 4 — Left nav badges stripped

`NavItem.count` rendering removed across the rail. Cleaner than fake numbers. Restore when a per-area counts endpoint ships.

## Phase 5 — Settings tabs hidden

Only Audit Log tab renders. Tab strip + panels for General/Branding/Data-Retention/Integrations/Billing/SSO/Compliance removed from the page. The components stay in tree (dead exports) — restore via a single line change once features land.

## Phase 6 — F27 Recent Activity verify

Post-#295 the wire is `live ?? canned` (correct null-vs-empty semantics). Confirm rendered rows on prod actually match audit, NOT canned. If still canned → investigate (likely same root-cause class as P0).

## Phase 7 — Visual gate + ship

Typecheck + ESLint + 320 / 1440 screenshots → PR #296 → notify.
