# Day-32 Full BE Conformance Audit — code vs PM1 specs + milestones

> **Scope:** Backend only (apps/api + prisma + packages/shared + scripts + infra), audited at
> `origin/main` HEAD **cb1f2c4** (includes #256 cookie/CORS, #258 FE session wire, #259
> customSession — all merged). Specs: PM1_PRD v8.1 · PM1_ERD v2.1 · M0–M6 milestone docs ·
> CLAUDE.md hard rules · .claude/rules/{api,database,security}.md.
> **Method:** 3 parallel audit agents (DB layer / API surface / milestones+infra) + a manual
> auth-workflow trace + a read-only live pilot-DB probe. Execution-trace discipline: every
> finding cites file:line; nothing fabricated; zero pilot writes.

## 0. Executive verdict

**AMBER — launch-viable for the 8-user pilot with 1 pre-launch P1 fix; structured Day-29 debt.**

| Layer                                       | Verdict                                                    | Top risk                                                                       |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| DB / Prisma / migrations                    | AMBER                                                      | RLS missing on 8 post-M0 tables; fresh-deploy migration-order trap             |
| API surface (30 controllers / 87 endpoints) | AMBER                                                      | **P1: `POST /api/defects/:id/rca` unguarded** (anonymous Sherlock/LLM trigger) |
| Auth workflows                              | GREEN (1 P2)                                               | disabled user not blocked until session expiry                                 |
| Pilot data                                  | GREEN                                                      | seed live + chain-verified; runs/KB legitimately empty                         |
| Milestones M0–M5                            | M0–M4 DONE · M5 PARTIAL (launch gate pending) · M6 PENDING | launch-eve deferred ledger (Day-29)                                            |
| Infra ($0 stack, CI, hooks, ban-list)       | GREEN                                                      | none — all conform                                                             |

---

## 1. User workflows (BE truth, traced from code)

### 1.1 NEW user (email NOT in TB-002 `users`)

1. They CAN request a magic link — `POST /auth/sign-up` and `/auth/sign-in` send to **any**
   email (`auth.controller.ts:88,117` → `auth.service.ts:83` `sendMagicLink`; no roster
   pre-check at send time).
2. They CAN click it — BetterAuth mints an `auth_user` + session cookie.
3. **They get NO access**: `resolveSession` (`auth.service.ts:103-127`) joins TB-002 by email;
   no row → returns **null** (warn-logged: _"Did the invitation flow run for this user?"_).
   `GET /auth/session` → `{authenticated:false}`; **every `/api/*` endpoint 401s** via
   `RolesGuard` (`roles.guard.ts:52`). `customSession` on `/auth/get-session` likewise yields
   `role:null` — FE redirects to sign-in.
4. **The only way in = invitation**: Admin/Lead `POST /api/invitations`
   (`invitations.controller.ts:84-86`, sha256-hashed single-display token) → user opens accept
   link → `POST /api/invitations/accept` (public-by-token, `:107`) **creates the TB-002 User
   row + ProjectMember rows**, marks invitation accepted, audits both steps.

**Answer to "will a new user see the (dummy) frame data?" — NO.** An uninvited user sees no
DB data at all (API 401s everywhere). An _invited_ user joins workspace Iksula and sees the
**real seeded** Iksula data (§3). The only "dummy" anything a signed-out/broken-session visitor
can see is the FE's client-side canned-data fallback (Option B, #253) — static display strings
baked into the build, **never another tenant's DB rows**, and the AdminGuard redirect (#258)
sends unauthenticated prod visitors to /sign-in before app pages render.

### 1.2 EXISTING roster user (the 8 pilot users)

Magic link → BetterAuth session → TB-002 join → `{role, displayName, organizationalLabel}`
merged into the session (#259 `customSession`, `auth.config.ts:256`) → workspace-scoped data.
Single-use atomic tokens (GHSA-hc7v-rggr-4hvx) + 10-min TTL + FE confirm-page defeats Gmail
scanner prefetch. Cookie: host-only `SameSite=None; Secure; Partitioned` (#256).

### 1.3 ADMIN (Yogesh — deployer-admin)

Special bootstrap: if the session email matches `ADMIN_SEED_EMAIL` and no TB-002 row exists,
`ensureDay0AdminSeed` auto-creates the Admin row on first login (`auth.service.ts:110-127`).
Admin-only surface: `/api/admin/config/llm-providers` (GET/PUT), `/api/audit/verify-chain`,
`/api/admin/nfr/*` (env-gated), user role PATCH + disable, invitations create/revoke (shared
with Lead).

### 1.4 Role matrix (what each role can reach — from `@Roles` inventory)

| Capability                                                           | Admin | Lead | QA Engineer | Stakeholder |
| -------------------------------------------------------------------- | ----- | ---- | ----------- | ----------- |
| View projects/users/requirements/TCs/suites/runs/defects/KB          | ✅    | ✅   | ✅          | ✅          |
| Create/edit project                                                  | ✅    | ✅   | ❌          | ❌          |
| Author/edit requirements, TCs, suites, runs, defects, KB             | ✅    | ✅   | ✅          | ⚠️ see P2-4 |
| Audit log list                                                       | ✅    | ✅   | ❌ (403)    | ❌ (403)    |
| Audit verify-chain · LLM provider config · role changes · NFR probes | ✅    | ❌   | ❌          | ❌          |
| Invitations create/revoke                                            | ✅    | ✅   | ❌          | ❌          |

### 1.5 Disabled / invited users — **P2 gap (new finding)**

`users.service.ts:10-13` defines derived status (disabled/invited/active), but **nothing
enforces it at request time**: `USER_SELECT` (`auth.service.ts:28-35`) omits
`disabledAt`/`activatedAt`, and neither `resolveSession` nor `RolesGuard` checks them. **An
Admin-disabled user keeps full API access until their session expires (7d).** Fix ≈ 4 lines
(select both fields; `if (appUser.disabledAt) return null`). Pre-Fri candidate.

---

## 2. Pilot data — what each signed-in user actually sees (live probe, read-only)

| Entity       | Live count                                             | Source                               | Mon/Fri UX                                        |
| ------------ | ------------------------------------------------------ | ------------------------------------ | ------------------------------------------------- |
| workspace    | 1 (Iksula)                                             | prisma/seed.ts                       | —                                                 |
| users        | 8 (canon roster)                                       | prisma/seed.ts                       | F27 shows real team                               |
| projects     | 5 (RET + CART/PAY/AUTH/OPS shells)                     | seed-iksula-pilot.ts (Sun, GO'd)     | F09 real                                          |
| requirements | 30 (RET-001…030)                                       | seed (golden-set era)                | F14 real                                          |
| test cases   | 63 (48 mined TC-RET-\* + 15 fresh)                     | seed                                 | F16 real                                          |
| test suites  | 5                                                      | seed                                 | F18 real                                          |
| defects      | 25 (DEF-001…025, linked to TCs)                        | seed (Sherlock golden-set transform) | F21/F22 real                                      |
| test runs    | **0**                                                  | —                                    | F19/F20 empty-state (correct — users create runs) |
| KB documents | **0**                                                  | —                                    | F12/13/15 empty-state (correct — users upload)    |
| audit_log    | 158 (chain GREEN since row 26; row-25 doc'd exception) | app + seed                           | F28 real                                          |

All of it is **workspace-scoped** — visible to the 8 roster users only. Embeddings on seeded
TCs are NULL (Prisma can't write `Unsupported(vector)`) → Curator similarity search over seed
data returns 0 until the raw-SQL backfill (Day-29; does not affect list views).

---

## 3. Per-page BE-backing matrix ("do the buttons have a real backend?")

| Frame / page                            | Backing endpoints                                            | BE status                                                     |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| F06/F06b sign-in + verify               | `/auth/sign-in(-up)` → magic-link → verify → `/auth/session` | ✅ LIVE (P0-001 closed)                                       |
| F08 Home                                | no dedicated aggregate endpoint                              | 🟡 FE canned by design (pilot)                                |
| F09 Projects                            | `GET /api/projects`, `GET :slug`, `POST` (Admin/Lead)        | ✅ LIVE — 5 real rows                                         |
| F14 Requirements (+m1-m3)               | `/api/projects/:id/requirements` CRUD + Jira import          | ✅ LIVE — 30 real                                             |
| F16a/b/c Test Cases                     | TC CRUD + Composer generate + Curator check                  | ✅ LIVE — 63 real; agent runs audited                         |
| F18 Suites                              | suites + members CRUD                                        | ✅ LIVE — 5 real                                              |
| F19 Run Console                         | `PATCH /api/test-runs/:id/start\|result`                     | ✅ LIVE but ⚠️ authenticated-any (P2-4); 0 runs → empty state |
| F20 Run Results                         | run/result reads                                             | ✅ LIVE — empty until runs happen                             |
| F21 Defects Hub                         | `GET /api/defects` etc.                                      | ✅ LIVE — 25 real                                             |
| F21/F22 RCA button                      | `POST /api/defects/:id/rca` (Sherlock)                       | ✅ functional but 🔴 **UNGUARDED (P1-1)**                     |
| F22 defect actions (status/assign/etc.) | 5 endpoints                                                  | 🟠 **501 stubs** — buttons will error politely                |
| F12/13/15 KB                            | docs CRUD, chunk/embed, search, R2 presign                   | ✅ LIVE — 0 docs → empty state                                |
| Jira connect/sync buttons               | connect + sync                                               | 🟠 **501 stubs**; inbound webhook ✅ LIVE (HMAC)              |
| F23 Reports Studio                      | 6 report builders + templates (ADR-021)                      | ✅ LIVE (basic); full suite = M6                              |
| F25 Exec Dashboard                      | ReportAggregate backend                                      | ✅ backend exists; FE port = Day-29 Tier-2                    |
| F26/F26m1 Agents                        | `GET/PUT /api/admin/config/llm-providers` (Admin)            | ✅ LIVE; F26 FE port = Day-29 Tier-2                          |
| F27 Users & Roles (+m1 invite)          | `GET /api/users`, role PATCH, disable, invitations           | ✅ LIVE — 8 real; F27 FE port = Day-29 Tier-2                 |
| F28 Settings & Audit                    | `GET /api/audit` (Admin/Lead) + `verify-chain` (Admin)       | ✅ LIVE — 158 rows                                            |

---

## 4. Consolidated findings register (BE)

### P1 — fix before Fri launch

1. **Unguarded functional RCA kickoff** — `defects.controller.ts:98`: no `@UseGuards/@Roles`;
   anonymous caller with a defect UUID triggers Sherlock LLM fan-out (Groq RPD burn) + writes
   `actorId:null` audit rows (`:155-157`). ERD §3.4 + Hard Rule 7. Fix ≈ 3 lines.
2. **Fresh-deploy migration-order trap** — raw `0004_m4_runs_defects_jira.sql:190-273` creates
   tables that prisma migration `20260519080000` then ALTERs; `prisma migrate deploy` on a
   fresh DB runs all prisma migrations first → hard failure. No pilot impact (DB exists);
   blocks clean re-provisioning/DR. Day-29 fix + restore-drill test.

### P2 — Day-29 (one pre-Fri candidate\*)

3. **_Disabled-user gate missing_** — §1.5 (≈4-line fix; recommend pre-Fri).
4. **Stakeholder can drive run state** — `test-runs.controller.ts:65,77` authenticated-any;
   ERD §3.4 intends read-only Stakeholder.
5. **RLS missing on 8 post-M0 tables** — `report_aggregate`/`report_template` (direct
   `workspace_id`, no policy) + 5 M3/M4 child tables + `jira_webhook_events` (no tenant key —
   needs explicit exception ruling). Single-workspace pilot mutes the risk; PM2 multi-tenant
   does not.
6. **audit_log REVOKE never landed** — `init_rls_hnsw.sql:196-200` commented out; triggers DO
   enforce append-only (proven live Sun), so defense-in-depth gap only. `schema.prisma:996`
   comment overstates.
7. **Unguarded 501 stubs** — 5 defect-action + 2 jira-sync endpoints have no guard _before_
   implementation; add guards now so they can't go live open by default.
8. **Controller-local Zod where shared exists** — `defects.controller.ts:57`,
   `test-runs.controller.ts:51`, jira webhook schema module-local (Hard Rule 10 letter).
9. **`defects.jira_issue_id` bare column** — `schema.prisma:706`, ERD TB-015 specifies FK.
10. **Docs staleness** — `database.md` still says 1024-dim vectors (reality: 384, ADR-003);
    `STATUS.md` frozen at 2026-04-29; `.env.example:50` real R2 account id (identifier-class).

### P3 (hygiene)

11. WS `?token=` query fallback (`realtime.gateway.ts:11,33`) — URL-leak vector; cookie path is primary.
12. `console.error/warn` ×2 (`main.ts:200`, `audit.interceptor.ts:102`); 64 `any` in spec files w/o FIXME (test-only).
13. rbac-demo controller + public `GET /` mounted in prod; otel-test POSTs unaudited (document exemption).
14. Raw-SQL numbering starts at 0002; stale "SCRATCH DRAFT" header on committed `0004`; `schema.prisma:37` points to a nonexistent migration path; report tables named singular.

### Clean passes ✅

ERD↔schema: 21/21 core tables conform (all drift M3-M5-documented + EXTRA tables justified);
enums exact (one approved deviation); HNSW + vector(384) everywhere; audit chain columns +
triggers proven live; LLM-gateway containment + OTel span attrs; embeddings 384 single-entry
startup-loaded; ws-only WebSocket w/ cookie auth; 0 `any` in prod src; no secrets; ban-list
clean (lockfile hits = optional-peer stubs); locked majors all pinned; CI 8 jobs + weekly
pg_dump (7 backups verified); all 6 CLAUDE.md hooks present; seed canon verbatim.

## 5. Milestone status (BE view)

M0 ✅ (34 tasks, [0.1.0]) · M1 ✅ (auth/RBAC/users) · M2 ✅ (KB+RAG) · M3 ✅ build (A1/A2 prod
latency → Day-29, ADR-024) · M4 ✅ (45 ACs incl. AC042) · **M5 PARTIAL** — core closed
2026-05-27, P0-001 closed 2026-06-11, launch + 6/8-user gate fires Fri 2026-06-12 · M6 PENDING
(needs pilot stable ≥7d). Deferred ledger (11 items, each source-cited) carried in §4 + the
Day-29 plan: NFR_PROBE_TOKEN + A1/A2 prod measurement, AC011/AC021 evals, embeddings backfill,
seed expansion to canon counts, cookie-config unit-test branch, shared-parent domain migration,
F26/F27 ports (FE), restore drill, Neon CU-hr watch.
