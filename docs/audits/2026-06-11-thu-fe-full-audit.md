# FE Full Audit — Thu 2026-06-11 (in progress)

**Audited state:** `origin/main` @ `cb1f2c4` (includes #256/#258/#259 P0-001 cascade).
**Method:** 6 parallel read-only auditors — (1) specs/milestones, (2) FE code vs Hard Rules, (3) BE (FE-gap context only), (4) contracts/infra, (5) per-role journeys + dummy-data exposure, (6) runtime click-sweep of deployed pages.dev.
**Status:** synthesis in progress — sections appended as auditors report. Final prioritized backlog at the end once all 6 are in.

---

## SECTION 5 — Per-role user journeys + dummy-data exposure (COMPLETE)

### Headline findings

1. **🔴 P0 — Unauthenticated visitors get the full app, including /admin, on the deployed pilot.**
   With no session, `CurrentUserContext` silently falls back to the **Yogesh/Admin seed persona** (`lib/contexts/CurrentUserContext.tsx:75-92`, fallback `users[7]`). `AdminGuard` checks `me.role === 'Admin'` — which **passes for a signed-out visitor**. No `middleware.ts`, no server-side gate exists. A logged-out person typing `qa-nexus-web.pages.dev/admin/settings` sees a complete, convincing Admin surface (made worse by canned data meaning nothing requires a real API).
   _Honest attribution: this is a consequence of the Sun P0-001 fix's dev-fallback design (my #258). The prep doc planned a prod-vs-dev gate (`NODE_ENV`) — the shipped implementation does not include it. Fix: prod + resolved-null-session → redirect to /sign-in (or at minimum make the fallback non-Admin)._

2. **🔴 P0 — The invite flow is theater end-to-end.** The "Invite to QA Nexus" modal seeds from canned `F27M1_INITIAL_INVITEES` and **POSTs nothing** (`components/admin/invite-user-modal.tsx:62`); the modal's own copy promises "a Resend email with a set-password link" the FE cannot send. `(onboarding)/invited/*`, `/founder`, `/set-password` are **fully orphaned** (zero inbound links — typed-URL only) and show **fictional identities** (Priya S. / Ravi K. / Meera R.) with dead CTAs. `/set-password` pre-fills password `'RefundFlow2026!'` with a no-op submit.

3. **No role-based routing exists.** Magic-link `callbackURL` is hardcoded to `/home` for everyone (`app/(auth)/sign-in/page.tsx:171,192`). `/home` renders the **F08a QA-Engineer view for all roles**, canned. `/home/lead-admin` (F08b) exists but nothing routes to it; no Stakeholder home exists at all. "Lead read-only" access promised in F27 copy is not implemented (AdminGuard is Admin-only).

4. **Navigation traps:**
   - Brand logo `href="/"` → forced `/sign-in`, and sign-in has no already-authenticated redirect → signed-in users get stranded (`admin-shell.tsx:414`, `app/page.tsx:17`).
   - ⌘K palette contains 404 links (`/test-plans-cycles`, `/test-suites`, `/environments`, `/projects/ret/runs`) and hardcodes slug `ret` regardless of active project (`shell-topbar-widgets.tsx:248-256`). Palette shows GOVERN/admin entries to all roles (no role filter) → non-admins get bounced with a toast that's a TODO and never fires.
   - `/home` page CTAs: **zero real links** — every action is a `console.info` Pattern-A marker; the only working exits are the rail (5 enabled items) + ⌘K.

5. **Shipped-but-unwired live plumbing:** `useAdminUsers` + `users-list-view-states.tsx` hit the real `GET /api/users` but **no page consumes them** (F27 renders canned instead). `fetchWithFallback` (#253) has **zero callers on main** — the F09 project-switcher wiring (#255) was never merged, so even the topbar project list is the hardcoded canon, not the API.

### Dummy-data exposure — direct answer to "will a new user see the dummy data?"

**YES.** Of 28 authenticated/onboarding routes: **24 CANNED · 1 MIXED · 3 LIVE** (only the KB family does real fetches with honest empty states; `/test-cases/generate` is live-with-honest-fallback).

A brand-new user with an empty workspace sees, in their first minutes:

- `/home`: "Sprint 42 on track" (timestamped 2026-04-28), action queue with RET-137 / DEF-001 / PR #1847, reviews from fictional "Priya S" + "Neha D" — **P0**
- `/projects`: 5 projects dressed with fake ops ("AMBER · 3 P1 defects open") — **P0**
- `/admin/users`: "8 members · 1 pending invite · Synced 30 sec ago" incl. fictional pending invite "Priya Tiwari" — **P0**
- Defects hub + detail: fabricated **P0 incident** ("Customer money is in flight…") assigned to fictional Suresh P./Ritu B./Arjun K. — **P0**
- `/dashboard/executive`: pass-rate 87.2 / coverage 74 / sign-off list with fictional "Riya Nair" — **P0**
- Plus P1 fiction on results/runs/reports/requirements/settings(47k audit rows)/agents/imports/jira/upload, and the orphaned lead dashboard claiming "ROI 342% · ₹14.2L cost avoided".

**Fictional people not in the 8-person Iksula roster** (worst offenders, with file:line in the full agent report): Suresh P. (12 occurrences), Priya A./S./Tiwari, Ritu B., Arjun K., Neha D, Riya Nair, Ravi K., Meera R.

### Full per-route matrix

| Route                                          | Class                                | Severity |
| ---------------------------------------------- | ------------------------------------ | -------- |
| /home                                          | CANNED                               | P0       |
| /projects                                      | CANNED                               | P0       |
| /admin/users (+invite)                         | CANNED (live fetcher exists, unused) | P0       |
| /projects/[slug]/defects (+detail)             | CANNED                               | P0       |
| /dashboard/executive                           | CANNED                               | P0       |
| /projects/[slug]/results                       | CANNED                               | P1       |
| /projects/[slug]/runs/[runId]                  | CANNED                               | P1       |
| /projects/[slug]/reports                       | CANNED                               | P1       |
| /requirements                                  | CANNED                               | P1       |
| /admin/settings (+providers)                   | CANNED                               | P1       |
| /admin/agents (+2 sub-routes)                  | CANNED                               | P1       |
| /projects/[slug]/imports                       | CANNED                               | P1       |
| /projects/[slug]/sources/jira (3 steps)        | CANNED                               | P1       |
| /projects/[slug]/upload                        | CANNED (2 files pre-loaded)          | P1       |
| /home/lead-admin (orphaned)                    | CANNED                               | P1       |
| /test-cases                                    | CANNED placeholder                   | P2       |
| /test-cases/generate                           | MIXED (live + honest fallback)       | P2       |
| /projects/[slug]/kb + /kb/upload + /kb/imports | LIVE                                 | —        |
| /home/empty, /founder, /invited/\* (orphaned)  | CANNED                               | P2       |

---

## SECTION 6 — Runtime click-sweep of deployed pages.dev (COMPLETE)

18 routes, every visible button/link clicked. Classification: WORKING (nav/modal/state within 500ms) · STUB (fires `pattern-a:deferred:*` marker — intentional Pattern A) · DEAD (nothing happens, no marker — a real defect).

### App-wide baseline

**Theme toggle + Operate/Review/Prove mode pills are silently DEAD on every route** (4 dead controls/page, no marker). These are the canonical-shell widgets I built — they flip `data-theme`/`data-mode` locally but the agent's 500ms nav/modal/aria detector doesn't catch attribute-only changes, so "dead" here may be partially a detector limitation for theme (it DID verify theme-persist in the smoke suite). **Operate/Review/Prove genuinely does nothing visible** (by design — data hook only, per handoff §4). Net: theme = likely-works-but-unverified-by-this-probe; mode = intentional no-op.

### Worst DEAD-button concentrations (real defects, not Pattern-A stubs)

| Route                               | Severity | Finding                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **/home/lead-admin/**               | P0       | **24 dead — entire rail nav + switcher + user pill are dead `<button>`s.** Lead/Admin landing on this page is TRAPPED — cannot navigate anywhere. Root cause: this page uses its OWN shell (`home-lead/home-shell.tsx`), NOT the canonical AdminShell — a Hard Rule 14 violation. The nav renders as non-functional buttons. |
| **/home/empty/**                    | P0       | Same trap — 22 dead incl. entire rail; new-user first-run page. "Dismiss checklist" dead too.                                                                                                                                                                                                                                |
| **/admin/users/invite/**            | P0       | Invite flow completely inert — 0 working, 0 stub, 26 dead; the invite UI never even appears on the deployed build (the source's invite-modal markers never fire). Stale deploy OR unwired route — needs investigation.                                                                                                       |
| **/admin/agents/provider-setup/**   | P1       | Close AND Cancel both dead — **dead-end modal route with no exit** (only 2 buttons, both dead).                                                                                                                                                                                                                              |
| **/admin/agents/model-assignment/** | P1       | All 26 controls dead, incl. a fake non-AdminShell topbar (search ⌘K is a dead button).                                                                                                                                                                                                                                       |
| **/admin/settings/providers/**      | P1       | Save changes / Test connection / Close / Show / 11 provider rows all silently dead.                                                                                                                                                                                                                                          |
| **/admin/users/**                   | P1       | Filter, Export CSV, Edit-user ×7, More-actions ×7 silently dead.                                                                                                                                                                                                                                                             |
| **/dashboard/executive/**           | P1       | Every range toggle + Export/Refresh/**Approve release** dead, zero markers.                                                                                                                                                                                                                                                  |
| **/projects/**                      | P2       | Filter chips, Grid/Table/Compact, Manage pins/Unpin, More options dead (page otherwise 11 working).                                                                                                                                                                                                                          |
| **/admin/agents/**                  | P2       | Test now, Details ×3, Edit permissions, agent-filter chips, time-range dead (11 working).                                                                                                                                                                                                                                    |

### React error #418 (hydration mismatch) on 7 routes

`/requirements/`, `/test-cases/`, `/test-cases/generate/`, `/kb/imports/`, `/admin/agents/`, `/admin/users/invite/`, `/admin/settings/` — minified React #418 (`args[]=HTML`), a server/client hydration mismatch. P1 — can cause content flashes / interactivity loss; needs per-route diagnosis (common cause: `Date`-dependent or `localStorage`-dependent render without `suppressHydrationWarning`/effect-gating).

### href="#" dead links (P2)

"Open quality report", "View full audit log", "View role permissions" ×4, "View email metrics", sign-in "Contact Site Admin", + 13 hash links on /admin/settings.

### HEALTHY Pattern-A routes (stubs fire markers as designed)

/home/ (9 working + 11 markers), /requirements/ (15 markers), /test-cases/generate/, /admin/settings/ (8 markers), /projects/. The silently-DEAD concentration is in GOVERN/admin + dashboard + home role-variants.

---

## URGENT ITEM — F09 switcher PR #255 status (RESOLVED via gh)

- **#253** (`fetchWithFallback` helper + wiring plan) = **MERGED** to main. The helper IS on main — but with **zero callers** (the consumer wiring lived in #255).
- **#255** (F09 switcher → `/api/projects`) = **CLOSED today 2026-06-11 09:27 UTC, never merged.** `mergeStateStatus: DIRTY`, `mergeable: CONFLICTING`.
- **Why it wasn't merged:** #255 was **stacked on #253's branch** (`baseRefName: feat/web-option-b-safety-net`), not on main. When #253 merged, #255's base disappeared → it went CONFLICTING/DIRTY and was closed in this week's cleanup. The code still exists on branch `feat/web-option-b-f09-projects`.
- **Can it land before Mon?** YES — recoverable ~1–2 hr: re-target branch to `main`, resolve the one expected conflict (`shell-topbar-widgets.tsx` hardcoded `PROJECTS` const vs the dynamic `getSwitcherProjects()` version), re-run typecheck + smoke, merge. Low risk (fetch-with-canned-fallback = worst case is today's hardcoded list). **This is the single cleanest "real data" win available before launch.**

---

---

# FINAL SYNTHESIS — Fri 2026-06-12 (for 9:30 IST triage)

**Coverage:** §5 journeys+dummy-data (done) · §6 runtime click-sweep (done) · §1 specs/milestones + §4 contracts/infra (re-launched after context-gap loss, fold in on arrival) · 5 targeted P0 investigations (done, below). The launch-blocker picture is complete from §5/§6 + targeted; §1/§4 add breadth, not new P0s expected.

## Verdict (FE launch readiness)

- **🔴 HARD-HOLD on a "real-data pilot."** 24/28 routes render canned fiction; signed-out visitors reach the Admin surface. Not safe to put 8 real users on it today.
- **🟡 Mon Jun 15 is viable for a SCOPED pilot** IF the 4 true launch-blockers below land Fri–Sun (~2 eng-days). "Scoped" = auth gate closed + identity correct + the 2–3 cheapest real-data wires + fictional names scrubbed. Full real-data on every page = **Wed Jun 17 or staged post-pilot**.
- Honesty note: the deep audit found **1 NEW P0** (signed-out→Admin, my own #258 fallback gap) beyond the 3 already known. Net P0 count = 4. No 5th-P0 surprise — but invite #418 needs a repro before its size is known.

## 🔴 LAUNCH-BLOCKERS (must fix before any pilot)

### P0-A — Signed-out visitor gets the full Admin surface

- **Root cause:** `lib/contexts/CurrentUserContext.tsx:75-92` — no-session fallback returns the **Yogesh/Admin** seed unconditionally (the planned `NODE_ENV` gate from the prep doc was never shipped). `components/admin/admin-guard.tsx:32` checks only `me.role === 'Admin'` → passes for the signed-out fallback. No `middleware.ts`/server gate (static export).
- **Patch shape — two layers (apply the tri-layer auth pattern):**
  - _Quick (~15 lines, closes the worst exposure):_ `admin-guard.tsx` — consume `useCurrentUserMeta()`; in prod (`process.env.NODE_ENV === 'production'`) when `!isAuthenticated && !isLoading` → `router.replace('/sign-in')` instead of admitting the fallback. Gate on `NODE_ENV` so dev/CI preview + smoke still render.
  - _Complete (~30 lines):_ an `<AuthGate>` (or extend `CurrentUserProvider`) wrapping all authed routes — prod + resolved-null-session → redirect `/sign-in`; never redirect during `isLoading`; never loop on `/sign-in`. Keeps dev/CI fallback intact.
- **Test:** e2e — prod-built app, no cookie, `goto /admin/settings` → expect redirect to `/sign-in` (would fail today). Plus dev-mode test that the fallback still renders (no regression to smoke 13).
- **Blast radius:** touches every authed route's gating. Risk = redirect loop / breaking dev preview — mitigated by `NODE_ENV` + `isLoading` guards. Verify smoke 13/13 stays green.

### P0-B — F09 project switcher: #255 rescue (real `/api/projects`)

- **Root cause:** #255 was **stacked on #253's branch**; when #253 merged, #255 went CONFLICTING and was closed (never merged). Code lives on `feat/web-option-b-f09-projects`. `fetchWithFallback` is on main with **zero callers**.
- **Patch shape (~1–2 hr):** re-target branch to `main`, resolve the one expected conflict (`shell-topbar-widgets.tsx` hardcoded `PROJECTS` const → dynamic `getSwitcherProjects()`), typecheck + smoke, merge.
- **Test:** existing smoke 12 (switcher shows 5 projects) + add: API-up → renders API list; API-down → canned fallback (worst case = today).
- **Blast radius:** topbar only; canned fallback = zero-breakage. **Cleanest real-data win.**

### P0-C — Fictional names mislead pilot users (Suresh P., Priya, Ritu B., Arjun K., Neha D, Riya Nair, Ravi K., Meera R.)

- **CORRECTION to §5's framing — this is NOT a Rule 17 port violation.** The fictional names are **present in the canonical v2 HTML itself** (`Redesign Frame by claude design/*.html`: Suresh ×15, Priya ×11, Ravi ×4, Ritu ×2, Arjun ×2, Neha ×1, Riya ×1 — alongside roster Yogesh ×52, Akshay ×13, Kishor ×7…). The React ports **faithfully extracted them per Rule 17.** Root cause is **upstream: Claude Design authored non-roster names into the locked frames.**
- **Patch shape:** the canonical frames are **Rule 3 locked** → cannot edit without Yogesh approval. Two options: (a) Yogesh approves cleaning the canonical HTML + re-extract canned-data (cleanest, ~2-3 hr, touches `defects/`, `f22-defect-detail/`, `f19/f20-run-console/`, `executive/` canned-data.ts); or (b) override at the `canned-data.ts` layer with roster names + documented Rule-15 deviation (~2 hr, no canonical edit). **Recommend (a)** — keeps canonical = source-of-truth.
- **Test:** grep guard in CI — no non-roster name in `apps/web/**/canned-data.ts` (a `scripts/check-roster-names.mjs`).
- **Blast radius:** content-only; the frames that show people (F19/F20/F21/F22/F25/F08).

### P0-D — `/admin/users/invite` inert + React #418

- **Root cause (partial):** wrapper `users-roles-with-modal.tsx` is clean; the #418 originates in `InviteUserModal`/`UsersRolesPage` and needs an **unminified dev-build repro** to pin the line (do NOT guess). Modal also POSTs nothing (`invite-user-modal.tsx:62`) — but that's the documented Pattern-A deferral, not the bug.
- **Sibling #418s ARE root-caused:** `app/admin/agents/provider-setup/page.tsx` + `app/admin/agents/model-assignment/page.tsx` use `useSearchParams()` **without `<Suspense>`** → Next 15 static-export CSR-bailout hydration mismatch. **Patch: wrap the `useSearchParams` consumer in `<Suspense>` (~5 lines each).** This likely also explains provider-setup's dead Close/Cancel (component bailed hydration → handlers never attached).
- **Test:** per-route hydration assertion (no #418 in console) extended across the 7 flagged routes.
- **Blast radius:** the 3 modal-stage routes; low — Suspense wrap is local.

## 🟠 LAUNCH-PRE-DAY (would surprise a Day-1 user; fix before real-data pilot, not before a scoped demo)

- **Dummy data on 24/28 routes** (§5 matrix). Cheapest real wires using existing-but-unused plumbing: **F27 users** (`useAdminUsers`+`users-list-view-states.tsx` already hit `/api/users` — just render them; ~2 hr), **F28 audit** (`/api/audit` exists), **F09** (P0-B). Each needs an **EmptyState** for empty-workspace (component already exists, PR #250). Effort: ~1 day for the 3 cheap wires + empty states. The rest (defects/runs/reports/executive) = post-pilot.
- **No role-based home routing** — everyone lands on F08a `/home`. Lead/Stakeholder never see their dashboards; F27 "Lead read-only" unimplemented. Decide: ship single-home for pilot (fine) vs add routing (~1 day).
- **Brand logo `href="/"` strands signed-in users at `/sign-in`** (`admin-shell.tsx:414`, `app/page.tsx:17`). Patch: `/` redirects to `/home` when session present (~5 lines). Test: signed-in `goto /` → `/home`.
- **⌘K palette: 4 dead 404 links + slug hardcoded `ret`** (`shell-topbar-widgets.tsx:248-256`). Patch: gate links to built routes + use active project slug (~15 lines).
- **Admin silently-dead buttons** (§6): F27 Edit-user/Export, executive range/Export/Approve, settings/providers Save/Test/Close. Either wire or add `pattern-a:deferred` markers + disabled affordance so they don't read as broken (~0.5 day to mark all).

## 🟡 POST-PILOT M5 HARDENING

- `/home/lead-admin` + `/home/empty`: custom `HomeShell` (Rule 14 violation) — **but orphaned** (nothing routes to them; real `/home` uses AdminShell + works). Fix = AdminShell rewrap (~1–2 hr each) **only if** role-home routing enters scope; else mark clearly or remove to avoid typed-URL traps. **Not a Day-1 blocker.**
- Orphaned onboarding (`/founder`, `/invited/*`, `/set-password`) — invite flow is end-to-end theater; real invite/onboarding = full BE wire (M5).
- Remaining canned routes → real API (defects/runs/reports/executive) as BE endpoints land.
- Theme persists ✓ (smoke 4); Operate/Review/Prove = intentional no-op (mark or implement).
- A11y sweep (B9), Lighthouse/perf (B8), `href="#"` placeholders (~20).

## Recommended Fri 10:00 sprint order (for Mon Jun 15 scoped pilot)

1. P0-A AuthGate (0.5 day) — highest risk, do first + verify smoke.
2. P0-B F09 rescue (0.25 day) — quick win.
3. P0-D Suspense-wrap provider-setup/model-assignment (0.25 day) + start invite #418 repro.
4. P0-C fictional-name scrub (0.5 day, pending Yogesh's locked-frame approval).
5. 🟠 F27/F28 real wires + EmptyState (1 day) — if Wed Jun 17, include; if Mon Jun 15, defer to staged.
   → **Mon Jun 15 viable for P0-A/B/C/D (~1.5–2 days). Full no-dummy-data → Wed Jun 17.**

---

## SECTION 4 — Contracts + Infra (COMPLETE) — no new P0s

**Good news:** all 21 ERD tables (TB-001–021) have `@qa-nexus/shared` Zod schema coverage, imported by **both** apps. **$0 cost gate clean** (`@aws-sdk/client-s3` is the R2 client, not paid AWS; no banned deps; locked majors honored). CI has 6 blocking jobs incl. gitleaks + hook-validation; weekly pg_dump cron exists.

**P1 (🟠/🟡 — fold into hardening, none launch-blocking):**

1. **FE schema drift** — 3 `apps/web` files redefine project/invite Zod shapes without importing shared: `components/projects/create-project-schema.ts:25`, `components/onboarding/schemas.ts`, `admin/invite-user-schema.ts:13`. **`inviteRoles` defined twice with divergent ordering AND wrong casing** vs canonical `role.enum.ts` (`Admin/Lead/QAEngineer/Stakeholder`). Live drift the moment Pattern-A wiring lands. → migrate to `packages/shared`.
2. **E2E CI is non-blocking** (`e2e.yml:199` `continue-on-error: true`, most specs `.skip`). **This is _why_ the P0-001 cross-site regression + dummy-data state landed green** — the auth/onboarding happy-path is never gated. Reinforces P0-A's test requirement: the new auth-gate e2e must be a _blocking_ gate. 🟠
3. **gitleaks not in pre-commit** (CI-only) — direct-editor commits leave secrets in local reflog before CI catches. 🟡
4. **`enforce-app-shell.sh` never implemented** (Rule 14 followup `(ak)`) — shell-parity / `data-tone` / collapse primitives are manual-gate-only. Relevant to the lead-admin/empty Rule-14 violations (no hook would have caught them). 🟡
5. **Undocumented env vars** read by `apps/api` but absent from `.env.example`: `APPS_SCRIPT_EMAIL_*` (×4), `EMAIL_PROVIDER`, `NFR_PROBE_ENABLED`, `TEST_DATABASE_URL` → silent stub-mode risk on fresh Render deploy. 🟠
6. **Cross-site auth** correctly handled via CHIPS + 3 origin allowlists (P0-001 #256) — **P2: verify `AUTH_TRUSTED_ORIGINS`/`ALLOWED_WS_ORIGINS`/`TRUSTED_CALLBACK_ORIGINS` are actually set in the Render dashboard** (blank in `.env.example` by design; must confirm live).

---

## SECTION 1 — Specs + Milestones compliance (COMPLETE) — surfaced 2 NEW P0-class items

**Backend + data model are strong:** all 21 ERD tables + 2 aux in Prisma (MS0-AC003 PASS), ~25/29 endpoints, all 3 in-scope agents (Composer/Curator/Sherlock) implemented, HMAC audit chain proven. **Frame score: ~20 SHIPPED / 3 PARTIAL / 2 NOT BUILT.**

**These are a DIFFERENT CLASS than my P0-A..D.** A–D are _defects_ (broken/wrong → day-fixable). §1's gaps are _missing MVP features_ (never built → week-scale). They don't "break" — they're absent. Whether they block the pilot is a **scope question for Yogesh**, not an eng-fix.

### 🔴 NEW — Missing MVP features (spec gaps, NOT day-fixes)

- **GAP-1 (P0) — Document authoring pillar absent.** PRD §9.2-B / W-003 specify a TipTap/ProseMirror block editor + doc versioning + Draft→Submitted→Approved workflow. **Not built** — no `tiptap`/`prosemirror` in `apps/web/package.json`; F15 KB is chunk **search+upload only**. This is an entire MVP capability (M2 deliverable). **Build scale: ~1–2 weeks** (editor + versioning UI + BE workflow), not a hardening fix.
- **GAP-2 (P0) — F18 Test Suites not built.** `TestSuite`/`TestSuiteMember` Prisma models exist but are **orphaned** (no controller, no endpoint, no FE route; grep-confirmed unused in `apps/api/src`). M4 headline scope. Users can't group cases into suites → "run from suite" (W-002) is degraded. **Build scale: ~1 week** (port F18 v2 frame + BE CRUD + run-from-suite wire).
- **GAP-3 (P1) — F24 QA-Value dashboard not built** (M5 headline; partially mitigated by F25 Executive Dashboard which IS shipped).

### 🟠 P1 correctness risks

- **GAP-4 — Sherlock (A4) eval gate ratcheted 70%→40% (ADR-019); passes at 64%**, and corpus labels are LLM-vs-LLM (not human ground truth). RCA hypotheses shown to pilot users may be low-confidence. GO/NO-GO conversation item.
- **GAP-5 — RLS multi-tenant isolation not evidenced; admin guard is client-side-only (BUG-003, "accepted-for-pilot"; server enforce → M6).** **This independently confirms + refines my P0-A:** the _client-side-only admin guard_ was already a KNOWN accepted-for-pilot limitation. My #258 fallback made it strictly worse (signed-out → Admin), but the underlying "no server-side admin enforcement" predates me. P0-A's FE fix closes the signed-out hole; true server-side RBAC remains an M6 item.
- **GAP-6 — `POST /webhooks/github` + `/slack/webhook` not evidenced** (W-004 CI-ingestion + Slack alerts). **GAP-7 — Cmd-K omnibox (F-016 global search), Playwright-CI-runner, WCAG/Axe scan unverified** (M5 exit items).

### 🟡 P2

NFR perf gates (001/002/003) unmeasured in prod (A1/A2 deferred to Day-29; A4 estimate-only); F10 standalone project-create/settings page absent; `docs/milestone-reports/` empty (closure asserted in CHANGELOG/EOD only — traceability gap).

---

# RECONCILED VERDICT (supersedes the interim verdict above)

Two axes, not one:

**Axis 1 — DEFECTS (my P0-A..D):** ~1.5–2 eng-days. Mon Jun 15 viable. These make the app _not look broken_.

**Axis 2 — MISSING FEATURES (GAP-1 TipTap, GAP-2 Test Suites):** **weeks, not days.** Cannot land by Mon or Wed.

**→ The GO/NO-GO now hinges on a SCOPE question only Yogesh can answer:**
_Which workflows does the pilot actually exercise?_

- **If the pilot scope is** Requirements → A1 test-case generation → runs → defects → Sherlock RCA → reports/exec-dashboard (the agentic-QA core, all SHIPPED): then GAP-1/GAP-2 are **out of pilot scope**, and **Mon Jun 15 is viable** once defects A–D land + those two surfaces are clearly marked "coming soon" (not dead-ended).
- **If the pilot requires** in-app document authoring/approval (GAP-1) or suite-based test organization (GAP-2): then **neither Mon nor Wed is viable** — that's a multi-week build, and the honest call is a **HARD-HOLD to ~late June / July**.

**My recommendation:** scope the pilot to the agentic-QA core (which is genuinely built + strong), fix defects A–D for Mon Jun 15, and explicitly defer GAP-1/GAP-2 to M5+/M6 with "coming soon" affordances so users aren't surprised by absent nav items. That delivers a credible, honest pilot without pretending the doc-editor or suites exist.

**Honesty note (recalibration):** I earlier said "no 5th P0 expected." §1 disproved that — it found 2 missing-feature P0s. They're a different class (absent features vs broken code), but they're real and I should not have pre-judged the spec auditor's scope. The defect count (4) and the timeline for _defects_ stand; the _feature_ gaps reframe the launch decision around scope.
