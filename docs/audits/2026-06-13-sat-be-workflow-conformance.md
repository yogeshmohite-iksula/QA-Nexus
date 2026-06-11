# BE Workflow Conformance Matrix (Phase B) — 2026-06-13 (Sat)

> **Phase B of the PRD-conformance verification.** Code-only reading (no live calls yet — Phase C).
> **Contract:** PM1-mandated per PRD v8.1 + Yogesh's decisions A-E = MUST WORK NOW; PM2-PM4-deferred =
> acceptable as stub. Built from 4 read-only audit agents (file:line cited throughout) over 6 workflows.
> **Baseline:** Phase A `docs/audits/2026-06-12-fri-be-prd-baseline.md`. **Code base audited:** `origin/main`
> `cb1f2c4` (the branch base — **#261/#262/#263 NOT merged**; see the reconciliation note).

## 0. Reconciliation — what the 3 open PRs already fix (do NOT double-count)

The agents read **pre-#262 main**, so they re-flagged issues #262 already closes. Crediting them:

| Agent finding                                                                        | Status                   | Closed by                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| W1 #5 — disabled inviter not blocked (resolveSession lacks `disabledAt` gate)        | **FIXED, pending merge** | **#262** adds `if (appUser.disabledAt) return null;` to `resolveSession` (shared by invite + all `/api/*`)        |
| W2/W3 — `POST /api/defects/:id/rca` unguarded + `actorId:null` + no cross-tenant 404 | **FIXED, pending merge** | **#262** adds `@UseGuards(RolesGuard)`+`@Roles`, real `actorId`, `workspaceId!==→404`, `DefectsModule→AuthModule` |
| #259 jest class (customSession mock)                                                 | FIXED                    | **#263** (last instance)                                                                                          |

**#262 has runtime impact; #261 (audit doc) + #263 (test-only) do not.** Everything below that is NOT in the table above is a **genuine open finding #262 does not touch.**

## Yogesh decisions applied (Rule 11 binding)

A invite flow = **PM1**, must work · B(a) TipTap authoring **out of pilot test scope**; B(b) F18 Suites **in scope** · C F24 dropped · D Jira **outbound = deferred to M5** (seed-only is the test set) · E fictional names via canned-data, no frame edits.

---

## WORKFLOW 1 — Invitation lifecycle · Verdict: 🟡 → ✅ on #262 merge

- **PRD/ERD:** §9.2A (invitations + audit), §20.1 (onboarding); ERD TB-003 + Hard Rule 7 audit. **PM1-mandated (Decision A).**
- **E2E reality:** all 6 endpoints **EXIST + wired** (the "un-routed" header comments are STALE — `InvitationsModule` is in `app.module.ts:45`). Create writes `invitation_created` with **real inviter actorId** (`invitations.service.ts:200-214`, `controller.ts:70-82`), Admin/Lead-guarded (`controller.ts:84-86`), workspace-forced (`service.ts:187`). Accept (`POST /api/invitations/accept`, public) creates TB-002 user + project memberships + `invitation_accepted` audit in one `$transaction` (`service.ts:498-553`), token = sha256 hash-compare (`:458-461`), expiry TTL 168h enforced on accept → 410 Gone (`:471-478`). Resend (`:363-399`) + revoke (`:601-618`) both re-audit + guard. Cross-tenant invite blocked (workspace from session, never client) (`:139-156`).

| #   | Sub-point                                       | Verdict | Note                                                                                                                                               |
| --- | ----------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | create: audit + real actorId + RBAC + tenant    | ✅      | clean                                                                                                                                              |
| 2   | accept: user + memberships + audit + token-hash | ✅      | (auth_user provisioned lazily on first magic-link sign-in, not at accept — `:507` placeholder hash; works for invited users who have a TB-002 row) |
| 3   | expiry TTL + on-accept check                    | ✅      | lazy-only                                                                                                                                          |
| 3c  | background expiry **sweep**                     | 🟡      | **MISSING** — `pending` rows never auto-flip to `expired`; F27 shows stale pending. Cosmetic (accept-time check is correct). Effort **M**.         |
| 4   | cross-tenant blocked                            | ✅      | 404 on ws mismatch                                                                                                                                 |
| 5   | disabled inviter blocked                        | 🟡→✅   | **#262** (resolveSession gate). Add a spec asserting it (effort **S**).                                                                            |
| 6   | resend + revoke                                 | ✅      | clean                                                                                                                                              |

- **Fixes:** [S, post-#262] add disabled-inviter spec · [M, P2] expiry sweep `@Cron` (mirror `reports-refresh.cron.ts`). **No PM1 blocker.**

## WORKFLOW 2 — Existing user → seeded projects · Verdict: 🔴 (defects) / ✅ (3 of 4 entities)

- **PRD/ERD:** §9.1 FR-001/006/010; ERD §8.1 RLS workspace+project; Hard Rule 7 audit. **PM1 (Decision D — 5 seeded projects = test set).**

| Entity       | list-scoped              | CRUD                                                  | audit (real actorId)      | cross-tenant 404          | Verdict                     |
| ------------ | ------------------------ | ----------------------------------------------------- | ------------------------- | ------------------------- | --------------------------- |
| projects     | ✅ `where:{workspaceId}` | 🟡 list/get/create (no PATCH/DELETE)                  | ✅                        | ✅ compound-key           | ✅ (read-only OK for pilot) |
| requirements | ✅ assert→projectId      | ✅ full CRUD                                          | ✅                        | ✅ `assertReqWorkspace`   | ✅                          |
| test-cases   | ✅ assert→projectId      | ✅ CRUD + bulk + links                                | ✅                        | ✅ `assertCaseWorkspace`  | ✅                          |
| **defects**  | 🔴 **no list**           | 🔴 **all CRUD = 501 stubs** (no `defects.service.ts`) | 🔴 (only rca, fixed #262) | 🟡 (rca only, fixed #262) | 🔴 **BLOCKER**              |

- **🔴 KEY FINDING (NEW — not in any open PR):** the **25 seeded defects are unreachable** — `GET /api/defects` (list) does not exist; `GET /api/defects/:id` is a 501 stub (`defects.controller.ts:73-81,196-217`). **F21 Defects Hub has no working read API.** #262 only guards the _RCA_ endpoint; it does NOT build CRUD.
- **Tenancy mechanism (G5 detail):** **app-level where-clauses + `assert*Workspace` helpers ONLY** — no session-GUC RLS in `apps/api/src` (grep empty). `init_rls_hnsw.sql` is **not in the Prisma migrations chain**, yet its audit-log append-only triggers ARE proven-live (applied out-of-band). So tenant isolation is **proven at app layer for 3/4 entities**; whether the file's `CREATE POLICY` RLS is active on Neon is **unverified → Phase C live probe (G5)**. Append-only audit triggers = ✅ live.
- **Fixes:** **[M, P1-before-test] build `DefectsService` + `GET /api/projects/:projectId/defects` (list) + `GET /api/defects/:id` (detail)** so F21 shows the 25 seeds; PATCH status if triage is in scope. Mirror `TestCasesService` (`assertProjectWorkspace`/`assertDefectWorkspace`→404). [M] verify RLS applied on Neon (Phase C).

## WORKFLOW 3 — Admin surface (Yogesh = Admin) · Verdict: ✅ strong

- **PRD/ERD:** §9.2A (F27/F26m1), FR-015 audit; ERD EP-026/029 Admin-only LLM. **PM1.**
- **E2E reality:** all 5 named admin surfaces ✅ correctly guarded + audited + workspace-scoped:

| Surface                                     | guard                                                        | audit                                                                                 | Verdict |
| ------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------- |
| LLM config (F26m1) get/update               | `@Roles(Admin)`                                              | `llm_provider_config_changed` real actorId                                            | ✅      |
| Audit list + **verify-chain**               | `@Roles(Admin/Lead)` / `Admin`                               | recomputes HMAC → `valid/brokenAtId/verifiedRows`                                     | ✅      |
| Users role-change + status (disable/enable) | `@Roles(Admin)`                                              | `workspace_role_changed` / `user_status_changed` (+ session revoke, last-Admin guard) | ✅      |
| Invitations create/list/resend/revoke       | `@Roles(Admin/Lead)`                                         | all audited                                                                           | ✅      |
| NFR probes `/admin/nfr/*`                   | `@Roles(Admin)` + flag-gate (session-cookie auth per memory) | n/a                                                                                   | ✅      |

- **Holes:** the only unguarded functional admin-class endpoint is `DefectsController` (`/defects/:id/rca`) — **fixed #262**. No dedicated `/api/admin/settings` _write_ endpoint exists (F28 = audit-view only) — **❓ scope question for Yogesh** (effort S if a settings-mutation surface is wanted; likely PM2). Jira `connect`/`sync` 501 stubs are **unguarded** (`jira-sync.controller.ts:131,141`) — must get `@Roles(Admin,Lead)` **before** they go functional (Decision D defers the functionality, so [S, post-test]).

## WORKFLOW 4 — All buttons backed · Verdict: 🟡 pending FE+1 reconciliation

- No FE click-sweep / dead-button doc exists in the BE worktree → **this is a joint task.** BE half (endpoint inventory) below; FE+1 maps their dead buttons onto it.
- **Working BE surfaces:** projects (list/get/create), requirements (full CRUD + RTM), test-cases (full CRUD + bulk + links), invitations (full), users (list/role/status), LLM config, audit + verify-chain, reports (6 builders + SWR), KB, composer (A1), curator (A2), test-runs.
- **501 stubs / missing (a FE button here = dead until built):** **defects** create/list/detail/status/jira (W2 🔴) · **test-suites** entire surface (W5 🔴) · Jira **connect/sync** (Decision D — deferred).
- **Rule:** FE button → working BE = FE-wiring gap (FE owns); FE button → 501/missing BE = BE gap (sequenced below). **Action:** FE+1 to share the click-sweep list; I reconcile in Phase D.

## WORKFLOW 5 — F18 Test Suites · Verdict: 🔴 GAP-2 CONFIRMED (build required)

- **PRD/Decision:** **B(b) — in pilot test scope.** FE+1 GAP-2 confirmed by independent BE audit.
- **E2E reality:** `TestSuite` + `TestSuiteMember` Prisma models EXIST (`schema.prisma:505-538`), migration applied (`20260427135123_init_pm1_schema/migration.sql:175,189`, 5 live rows), shared Zod schemas EXIST + unused (`packages/shared/src/schemas/test-suite.ts` — `Create/Update/ReorderSuiteMembers`). **But ZERO controller/service/module/route** — 34 controllers, none is `api/test-suites`; `AppModule` imports no `TestSuitesModule`; no `apps/api/src/test-suites/` dir. The 5 rows exist only because `seed-iksula-pilot.ts:946,978` wrote them directly via Prisma.
- **Build scope: M (~1 focused day)** — schema + migration + Zod already done → pure API build mirroring `test-cases`: `test-suites.module/controller/service`, scoped CRUD (`/api/projects/:projectId/test-suites` + flat `/api/test-suites/:id`), membership add/remove/reorder (`ReorderSuiteMembersInput` exists), RBAC + audit + unit specs + AppModule wiring. **FE coordination:** lock route shape + membership contract with FE+1 before they wire TanStack hooks (per "verify API paths before consumer wiring" memory).

## WORKFLOW 6 — Quality bars + measurement (per decisions)

| Gap                                 | PRD            | Decision                                                 | Phase B status                                                                                                     |
| ----------------------------------- | -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| G2 Sherlock RCA top-2 **64% < 70%** | §9.2E / ERD §7 | **accept as-is + document; the test IS the measurement** | AC042 corpus result 64% (n=50, 0 crashes, calibration 1.00); clears relaxed M4 ≥40% gate. No code change pre-test. |
| G3 A1/A2 unmeasured (AC011/AC021)   | §9.2C          | same — real-data use surfaces quality                    | eval harness drafted (`2026-06-06-ac011-ac021-eval-prep.md`); run during/after test                                |
| G4 NFR-001/002/003 prod numbers     | §10.1          | **instrument lightweight during test**                   | NFR probes live on Render; need `NFR_PROBE_TOKEN` (Day-29) + p50/p95 logging → Phase C                             |
| G5 RLS runtime-enable               | ERD §8.1       | **live probe AFTER merge+redeploy**                      | app-level isolation proven (3/4 entities); DB-RLS application unverified → Phase C `pg_policies` probe             |

---

## Consolidated register + recommended sequence

| #   | Item                                                 | Workflow | PRD basis   | Class                        | Effort | When                              |
| --- | ---------------------------------------------------- | -------- | ----------- | ---------------------------- | ------ | --------------------------------- |
| 1   | **Merge #262** (disabled gate + RCA guard)           | W1/W2/W3 | FR-015      | fix (done, unmerged)         | —      | **before test**                   |
| 2   | **Build defects read API** (list + detail [+status]) | W2       | §9.1 FR-010 | NEW build                    | **M**  | **before test** (if F21 in scope) |
| 3   | **Build F18 Test Suites controller**                 | W5       | Decision B  | NEW build                    | **M**  | **before test** (Sun plan)        |
| 4   | Instrument NFR prod measurement (`NFR_PROBE_TOKEN`)  | W6/G4    | §10.1       | instrument                   | S      | **during test**                   |
| 5   | RLS live probe (G5)                                  | W2/W6    | ERD §8.1    | verify                       | S      | **during test** (Phase C)         |
| 6   | A1/A2 quality evals (G3)                             | W6       | §9.2C       | measure                      | M      | during/after                      |
| 7   | Guard Jira connect/sync stubs                        | W3       | NFR-014     | hygiene                      | S      | **after** (Decision D defers fn)  |
| 8   | Invitation expiry sweep + disabled-inviter spec      | W1       | §9.2A       | hygiene                      | M+S    | after                             |
| 9   | Jira outbound sync (G1)                              | —        | FR-013      | **deferred M5** (Decision D) | L      | **after test**                    |
| 10  | Settings-write endpoint?                             | W3       | §9.2A       | scope ❓                     | S      | confirm w/ Yogesh                 |

## Provisional Phase B verdict: 🟡 CONDITIONAL

3 of 4 CRUD entities + invitations + the full Admin surface are **PM1-conformant** (scoped reads, real-actor audit, cross-tenant 404, working verify-chain). The **two build items** gating a clean Yogesh test are **defects read API (W2)** + **F18 Test Suites controller (W5)** — both ~M, both with schema/Zod already done. #262 merge closes the security/attribution findings. Jira outbound is correctly deferred (Decision D). **Phase C (live) confirms G5 RLS + G4 NFR + the #262 deploy.** Final verdict + Yogesh-test-ready Y/N/CONDITIONAL → Phase D.
