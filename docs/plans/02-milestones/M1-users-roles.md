# M1 — Users, Roles & RBAC

> **Last updated:** 2026-05-02 (Day 6 — pre-kickoff snapshot)
> **Authority:** Summary view. Binding spec:
> `../../../QA Nexus/PM1/PM1_milestone/M1/Milestone_M1_Users_Roles.md` (v1.0 with v8.1 banner).

---

## Goal

Every authenticated API call enforces 4-role RBAC. Magic-link sign-up + invitation
flow works end-to-end. 8-user Iksula pilot roster seeded with correct roles. F27
Users & Roles + F27m1 Invite User Modal + F28m1 LLM Provider Configuration +
F26m1 Agent Model Assignment screens shipped. HMAC-SHA256 chained `audit_log`
captures every privileged action.

**Window:** 2026-05-11 → 2026-05-24 (2 weeks)
**Status:** **IN PROGRESS** (BE branch `feature/be-m1-users-schema` + FE branch
`feature/fe-m1-users-roles` active; **NOT merging until M0 closes Sunday 2026-05-03**)

---

## Frames in scope

| Frame    | File                                               | Owner | Status                       |
| -------- | -------------------------------------------------- | ----- | ---------------------------- |
| F27      | F27 Users & Roles                                  | FE    | NOT STARTED                  |
| F27m1    | F27m1 Invite User Modal                            | FE    | NOT STARTED                  |
| F26      | F26 Agents                                         | FE    | NOT STARTED                  |
| F26m1    | F26m1 Agent Model Assignment Modal (v2.10 NEW)     | FE    | NOT STARTED                  |
| F28m1    | F28m1 LLM Provider Configuration Modal (v2.10 NEW) | FE    | NOT STARTED (unblocks AC007) |
| F07b/c/d | Invited First-Run flow (3 sub-frames)              | FE    | NOT STARTED                  |

---

## Tasks (BE + FE high-level — see binding M1 file for Given/When/Then ACs)

### BE (Track 2 — `feature/be-m1-users-schema`)

| Task     | Description                                                                                                                                                                                                                                           | Status      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| MS1-T001 | BetterAuth Postgres adapter wired (NOT Redis — see PM1_ERD v2.1 §5)                                                                                                                                                                                   | IN PROGRESS |
| MS1-T002 | Magic-link plugin enabled with `nextCookies()` + Resend transport                                                                                                                                                                                     | NOT STARTED |
| MS1-T003 | Invitation flow via magic-link `metadata: { inviteId }` (BetterAuth-supported pattern)                                                                                                                                                                | NOT STARTED |
| MS1-T004 | 4-role RBAC matrix (Admin/Lead/QA Engineer/Stakeholder) wired in NestJS guard                                                                                                                                                                         | NOT STARTED |
| MS1-T005 | TB-002 user + TB-003 organization + TB-004 project_member tables migration                                                                                                                                                                            | IN PROGRESS |
| MS1-T006 | TB-005 invitation table + invitation lifecycle endpoints                                                                                                                                                                                              | NOT STARTED |
| MS1-T007 | F26m1 + F28m1 + F27m1 + F27 endpoints with shared Zod schemas                                                                                                                                                                                         | NOT STARTED |
| MS1-T008 | Audit-log middleware: every privileged action writes HMAC-chained row                                                                                                                                                                                 | NOT STARTED |
| MS1-T009 | Iksula 8-user seed data (verbatim from CLAUDE.md canon)                                                                                                                                                                                               | NOT STARTED |
| MS1-T010 | Followup `(p)` discharge: audit-log discipline gate (P1 from code audit FIND-1)                                                                                                                                                                       | NOT STARTED |
| MS1-T011 | Followup `(q)` discharge: shared schema unit-test coverage (P1 from code audit FIND-2)                                                                                                                                                                | NOT STARTED |
| MS1-T012 | Followup `(r)` discharge: audit-log + OTel span correlation (P2 from code audit FIND-5) + ADR-007 (telemetry pipeline) + `../../architecture/patterns.md`                                                                                             | NOT STARTED |
| MS1-T013 | **(NEW per drift D5)** Followup `(m)` R2/Neon free-tier quota alert system: BE cron checks usage daily; writes to new TB-`r2_quota_log` table; emits `quota.warning` event when >80% / `quota.critical` when >95%; FE banner subscribes via WebSocket | NOT STARTED |

### FE (Track 1 — `feature/fe-m1-users-roles`)

| Task     | Description                                                               | Status      |
| -------- | ------------------------------------------------------------------------- | ----------- |
| MS1-FE01 | F27 Users & Roles list (Pattern A deferred routing + RWD)                 | NOT STARTED |
| MS1-FE02 | F27m1 Invite User Modal (with role select + magic-link copy-to-clipboard) | NOT STARTED |
| MS1-FE03 | F26 Agents (3 cards: A1/A2/A4 + autonomy ladder + 6 guardrail toggles)    | NOT STARTED |
| MS1-FE04 | F26m1 Agent Model Assignment Modal (per-agent model select)               | NOT STARTED |
| MS1-FE05 | F28m1 LLM Provider Configuration Modal (Admin-only, key paste + test)     | NOT STARTED |
| MS1-FE06 | F07b/c/d Invited First-Run flow (3 screens)                               | NOT STARTED |
| MS1-FE07 | Quota banner component (subscribes to MS1-T013 WebSocket event)           | NOT STARTED |

---

## Acceptance criteria (from binding M1 file + carry-forward)

| AC        | Description                                                                            | Status      |
| --------- | -------------------------------------------------------------------------------------- | ----------- |
| MS1-AC001 | Magic-link sign-in works end-to-end (Resend → email → click → session)                 | NOT STARTED |
| MS1-AC002 | All 4 roles correctly enforce permissions on all endpoints (no leak)                   | NOT STARTED |
| MS1-AC003 | Admin can invite a user; invitee receives magic-link; first sign-in lands in F07b      | NOT STARTED |
| MS1-AC004 | F27 Users & Roles renders all 8 Iksula seed users with correct roles                   | NOT STARTED |
| MS1-AC005 | F28m1 saves Groq + Gemini API keys; "Test connection" hits `/llm/test` and returns 200 | NOT STARTED |
| MS1-AC006 | F26m1 assigns models per agent (A1/A2/A4 × primary/long-context/fallback)              | NOT STARTED |
| MS1-AC007 | Every privileged action writes a row to `audit_log` with valid HMAC chain              | NOT STARTED |
| MS1-AC008 | RBAC bypass attempts return 403 + write `audit_log` denial entry                       | NOT STARTED |
| MS1-AC009 | M0-AC007 unblocks (LLM keys via F28m1 UI)                                              | NOT STARTED |
| MS1-AC010 | M0-AC013 unblocks (3rd Slack rule wired once Yogesh's Grafana env vars land)           | NOT STARTED |
| MS1-AC011 | **(NEW D5)** Quota banner fires within 60s of synthetic 80% R2 usage                   | NOT STARTED |
| MS1-AC012 | All shared Zod schemas have unit tests (followup `(q)` discharged)                     | NOT STARTED |
| MS1-AC013 | `../../architecture/patterns.md` documents Patterns A-G (followup `(r)` discharged)    | NOT STARTED |

---

## Dependencies

**Needs from M0:**

- ✅ Postgres + pgvector live with `vector(384)` schema
- ✅ BetterAuth `@better-auth/core` installed (scaffold)
- ✅ `audit_log` table schema present (HMAC fields ready)
- ✅ Resend default sender working (`onboarding@resend.dev`)
- ⏸ AC007 deferred → unblocked by F28m1 (THIS milestone)
- ⏸ AC013 deferred → Yogesh provisions Grafana env vars (orthogonal to M1 code work)

**Hands forward to M2:**

- 4-role RBAC middleware enforced on every endpoint
- Iksula 8 users seeded with roles
- audit_log capturing all user actions
- F26 + F28 + F27 + F26m1 + F27m1 + F28m1 ported (6 frames)

---

## Risks (start)

| #   | Risk                                                                                                        | Mitigation                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R1  | BetterAuth invitation flow via `metadata: { inviteId }` is plugin-supported but not documented exhaustively | Web research (May 2026) confirms pattern is supported; M1 Day 1: smoke-test with single invite end-to-end before building UI |
| R2  | Resend default sender (`onboarding@resend.dev`) may hit spam filter on Iksula corporate inboxes             | Day 1 task: send test email to all 8 pilot inboxes; if blocked, escalate to verified-domain setup                            |
| R3  | RBAC matrix gaps (4 roles × ~20 endpoints = 80 cells) — easy to miss one                                    | Generate test matrix from `packages/shared` schema metadata; require 100% coverage in CI                                     |
| R4  | F28m1 + F26m1 are NEW frames (v2.10) — locked HTML may have edge cases not yet hit                          | Visual confirmation gate (Rule 13) catches; budget 1 extra day for iterations                                                |
| R5  | Pre-Sunday merge restriction (no merging until M0 closes) compresses M1 Week 1                              | Both Track 1 + Track 2 work continues on branches; merge cascade Monday morning Day 7                                        |

---

## Notes / decisions log (will fill during M1)

_Empty until M1 Day 1 (2026-05-11)._

---

## Drift items

| #     | Item                                                                                                                                                                | Action                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1-D1 | **Followup `(m)` R2/Neon quota alert** is substantial M1 user-facing scope (BE cron + FE banner + new `r2_quota_log` table) but NOT in canonical M1 milestone file. | Add MS1-T013 + MS1-FE07 + MS1-AC011 above. **Recommend Yogesh-approved milestone-file edit in M1 first half (~30 min).** Captured here as advisory; M1 binding file untouched.   |
| M1-D2 | M1 binding file references "Oracle VM + Ollama + FastAPI + Redis + Neo4j + BullMQ" in v1.0 task list (v8.1 banner notes the override).                              | No remediation needed — banner explicitly says "use M1 file for workflow understanding and acceptance criteria; for binding tech choices, defer to PM1_PRD v8.1 / PM1_ERD v2.1." |
| M1-D3 | M1 binding file says Next.js 14 + React 18 + Tailwind 3.4 in old places. Live state: Next 15 / React 19 / TW 4.                                                     | Same as M1-D2 — banner explicitly overrides. No edit needed.                                                                                                                     |

---

## Cross-references

- Binding milestone file: `../../../QA Nexus/PM1/PM1_milestone/M1/Milestone_M1_Users_Roles.md`
- Locked frame source: `../../../QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F27 Users & Roles.html` (and F27m1, F26, F26m1, F28m1, F07b/c/d)
- BetterAuth magic-link reference: `../../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` §6 + §11
- RBAC matrix canon: `../../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` §6 + `PM1_ERD v2.1 §5`
- Followups discharged: `../../followups.md` (m) (p) (q) (r)
- Code audit findings unblocked: `../../audits/code-audit.md` FIND-1, FIND-2, FIND-5
- Pattern docs (forthcoming): `../../architecture/patterns.md` (lands M1 morning)
- ADR forthcoming: `../../architecture/adr-007-telemetry-pipeline.md`
