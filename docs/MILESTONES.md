# QA Nexus PM1 — Milestone Plan

**Generated:** Tech-project-forge-skill v1.4 Phase 1 PLAN (2026-04-26)
**Source of truth (BINDING):** [QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md](../QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md) v8.0 + per-milestone files M1–M6 (with v8.1 redirect blocks)
**Build window:** 2026-04-27 → 2026-09-21 (18 weeks, 7 milestones, GA 2026-09-21 — or earlier per Yogesh's preference)

---

## Milestone 0 — Infrastructure & Setup

**Window:** 2026-04-27 → 2026-05-10 (2 weeks, ~270h + 16h R3 add-on, **3 FTE**)
**Goal:** End-to-end deploy pipeline on free tiers; F06/F06b/F07 shells render; pilot users CANNOT use the system yet (only infra).

### Tasks (32 total — 31 from v8.0 + new T032 per R3)

**Phase 1 Bootstrapping (Days 1–3, ~70h):**

- MS0-T001 Repo + monorepo (pnpm workspaces, apps/web, apps/api, packages/shared) — wire to existing repo `https://github.com/yogeshmohite-iksula/QA-Nexus.git` (NO `gh repo create`)
- MS0-T002 Next.js 15 web scaffold + shadcn/ui init + Sonner + lucide-react + RHF + Zod + Framer Motion + TanStack Query
- MS0-T003 NestJS 10 API scaffold + Prisma 5 + Zod + BetterAuth + @nestjs/websockets + @xenova/transformers + Groq SDK + @google/generative-ai
- MS0-T004 Shared package (Zod schemas + TS path aliases)
- MS0-T005 GitHub Actions CI (lint + typecheck + test + build, on PR + main)
- MS0-T006 Pre-commit hooks (husky + lint-staged + commitlint)
- MS0-T007 README + onboarding doc
- MS0-T008 `.env.example` (DATABASE*URL, GROQ_API_KEY, GEMINI_API_KEY, RESEND_API_KEY, R2*_, BETTER*AUTH*_, JIRA*OAUTH*\_, OTEL\_\_, BETTER_STACK_TOKEN)
- MS0-T009 Local dev with Docker Compose (Postgres 15 + pgvector for offline only; NOT prod)

**Phase 2 Hosting (Days 4–6, ~60h):**

- MS0-T010 Cloudflare Pages project (build: `pnpm install && pnpm build --filter=web`)
- MS0-T011 Render free Hobby web service (auto-deploy from main)
- MS0-T012 Neon Postgres + `CREATE EXTENSION pgvector` + connection string. **Then:** install postgres MCP via `claude mcp add postgres ... -- ... "$NEON_DATABASE_URL"`
- MS0-T013 Cloudflare R2 bucket + CORS for presigned upload
- MS0-T014 Resend email config
- MS0-T015 UptimeRobot 5-min HTTP monitor on `/health` + Slack alert on downtime
- MS0-T016 Custom domain decision — **DEFERRED to PM2** per Yogesh (use `*.cloudflare-pages.dev` for pilot)
- MS0-T017 Groq + Gemini API keys; store in Render env vars
- MS0-T018 Backup automation: GitHub Actions cron weekly `pg_dump` from Neon → R2 with timestamp + restore drill
- MS0-T019 Grafana Cloud + Better Stack signup; OTel collector in NestJS; **+ R1 mitigation: wire Better Stack alert if UptimeRobot ping missed >10 min**

**Phase 3 Core API + first React shells (Days 7–10, ~140h):**

- MS0-T020 Prisma schema + migrations: define **TB-001 through TB-021** (21 tables, including TB-019/020/021 LLM provider tables); `prisma migrate dev`; HNSW indexes on vector columns via raw SQL migration
- MS0-T021 BetterAuth Postgres adapter + magic link via Resend; `/auth/sign-up`, `/auth/sign-in`, `/auth/callback`
- MS0-T022 RBAC guard (4 roles Admin/Lead/QA Engineer/Stakeholder) + `@Roles()` decorator; positive + negative tests
- MS0-T023 LLM gateway module: `LLMGateway.complete(prompt, options)`; primary→fallback retry on 429/503; OTel logs every call
- MS0-T024 Embedding service: load Qwen3-Embedding-0.6B at startup; `EmbeddingService.embed(text)` returns 1024-dim
- MS0-T025 Health endpoint: `/health` returns DB ping + LLM gateway ping + R2 ping + free-tier quota status
- MS0-T026 WebSocket gateway scaffold (`@nestjs/websockets`)
- MS0-T027 Audit log service (HMAC-SHA256 chained Postgres rows)
- MS0-T028 F06 Sign In page (translate locked HTML → React)
- MS0-T029 F06b Set Password page
- MS0-T030 F07 Founder Onboarding scaffold
- MS0-T031 E2E smoke test (Playwright: load FE → sign in → magic link → land on F07)

**Phase 3 ADD-ON (Days 7–10 parallel — NEW per R3 mitigation):**

- **MS0-T032 — Build A1/A2/A4 golden-set seed** (NEW, ~16h, P1, owners: Yogesh + Akshay)
  - Deliverable A: 20 RET requirements with hand-graded "expected test cases" → A1 golden set
  - Deliverable B: 50 known-duplicate defect pairs from prior CART/RET sprints → A2 golden set
  - Deliverable C: 50 historical defects with manually-classified root-cause layers (L1–L5) → A4 golden set
  - Storage: `apps/api/test/golden-sets/{a1,a2,a4}/*.json` + `apps/api/test/golden-sets/README.md`
  - Drives weekly DeepEval runs starting M3 — early warning if eval scores drift below acceptance gates

- **MS0-T035 — Token-savings reporting + memory hygiene cron** (NEW, ~4h, P1, owner: DevOps)
  - Source: P1.11 of `docs/audits/2026-04-27-skill-alignment-audit.md`. Makes the
    memory-management ROI visible after every `git push` so the value of
    `.claude/memory/` + `inject-memory.sh` + `load-binding-context.sh` is observable.
  - Deliverable A: `.claude/hooks/post-tool-use/report-token-savings.sh` —
    PostToolUse Bash hook gated on `^git push`; counts session-scoped fires of
    inject-memory + load-binding-context + Skill activations from
    `.claude/audit.jsonl` + `.claude/preloads.jsonl`; appends a per-session row to
    `.claude/token-savings.jsonl` with cumulative; prints summary block to stdout.
  - Deliverable B: `.claude/hooks/stop/cumulative-savings-report.sh` — Stop hook
    that prints the cumulative footer (tokens × sessions × estimated $) at session end.
  - Deliverable C: `.github/workflows/memory-reorg.yml` — weekly cron (Sat 20:30 UTC
    = Sun 02:00 IST) + `workflow_dispatch`; placeholder reminder job for now,
    automation deferred to PM2 (needs Claude Code auth in CI).
  - Side-changes: patched `audit-log.sh` (added `session_id`) + `load-binding-context.sh`
    (logs preload markers); added `.claude/preloads.jsonl` + `.claude/token-savings.jsonl`
    to `.gitignore`.

### Acceptance Criteria (19 from v8.0)

AC001 FE@CF Pages HTTPS + F06 renders · AC002 /health 200 + all subsystem pings green · **AC003 21 PM1 tables (TB-001..TB-021, including LLM provider tables) with HNSW** · AC004 R2 + presigned upload tested · AC005 BetterAuth working · AC006 RBAC 4 roles gated · AC007 Groq → Gemini fallback on simulated 429 · AC008 embedding <200 ms · AC009 UptimeRobot 5-min ping active · AC010 CI passes on PR · AC011 auto-deploy on push to main · AC012 weekly backup + restore drill · AC013 OTel traces in Grafana · AC014 Better Stack receives logs + Slack test alert (**+ ping-miss >10 min alert per R1**) · AC015 $0/mo cost signed off · AC016 docs complete · AC017 keys in env only · AC018 audit chain integrity · AC019 Playwright smoke (load → sign in → land on F07)

---

## Milestone 1 — Users & Roles

**Window:** 2026-05-11 → 2026-05-24 (2 weeks)
**Scope:** 4-role RBAC fully implemented; Postgres RLS policies; user invite + role assignment UI (F27); project creation + team member invitation (F09 + F10 + F07); audit log captures all RBAC actions; user session mgmt + logout; role-based dashboard redirect.
**Frames:** F06, F06b, F06c, F07, F07b, F07c, F07d, F08a, F08b, F08c, F09, F10, F27, F27m1.
**Exit:** non-Admin cannot create user (403); non-Lead cannot approve doc (403); audit log shows every role change with timestamp; magic link reset works; project isolation enforced.
**Pre-condition:** seed `users` table with all 8 named pilot users (Akshay=Lead, Yogesh=Admin, 6 QA Engineers); see [project_team_roster](.claude/projects/.../project_team_roster.md) memory.

---

## Milestone 2 — Test Documents & Knowledge Base

**Window:** 2026-05-25 → 2026-06-14 (3 weeks)
**Scope:** Document Catalog (12 templates: Test Plan, Test Strategy, Test Case template, Defect template, RCA template, Sprint Report, Release Report, etc.); KB CRUD; RAG pipeline via @xenova in NestJS (Qwen3-0.6B, 1024-dim, ~50ms/embed); pgvector HNSW; bulk import CSV/PDF/Word; PDF export; versioning; @mentions; comments.
**Frames:** F12 Upload Modal, F13 Imported Files, F14 Requirements, F14m1 Edit Requirement, F15 Knowledge Base.
**Exit:** generate Test Plan from Jira PRD in ≤30s with ≥70% confidence; KB recall@5 ≥85%; embedding latency p99 <500ms.

---

## Milestone 3 — Test Cases + A1 + A2

**Window:** 2026-06-15 → 2026-07-12 (4 weeks)
**Scope:** TipTap editor (BDD + traditional, custom blocks); A1 Test Case Generator with Clarification Questions gate; A2 Dedup live chips while authoring; RTM drag-link; bulk import (CSV/TestRail/Zephyr); Notion-style block editor.
**Frames:** F16a Method Chooser, F16b A1 Generate from Requirement, F16c Bulk Import, F17 Test Case Library (three-panel), F18 Test Suites, F18m1 Edit Suite Modal.
**Exit:** ≥10 test cases from 3-page PRD in <10s; ≥80% A1 auto-approved at confidence ≥80%; A2 catches ≥60% of true duplicates with <5% FP. **Weekly DeepEval starting now using MS0-T032 golden sets.**

---

## Milestone 4 — Test Runs + Defects + Jira + A4

**Window:** 2026-07-13 → 2026-08-09 (4 weeks)
**Scope:** Test runs (manual + Playwright trigger), live state via WebSocket (4-zone layout, pulsing live pill via Framer Motion); defects with pre-filled context + linked evidence; A4 5-Layer RCA (parallel via Promise.all in NestJS — NO Python). Jira OAuth 3LO 2-way sync (NO PAT/API token — those are PM3 M17); inbound Jira webhooks HMAC-SHA256 verified; status mapping in `jira_status_map`.
**A4 confidence canon (locked, do not deviate):** L1 Stack 90% → L2 Env 80% → L3 Config 60% → L4 Code 50% → L5 Data 40%.
**A4 latency budget (revised v2.1 per Groq's parallel LPU speed):** p50 8s, p95 15s.
**Frames:** F19 Run Console, F20 Run Results, F21 Defects Hub, F22 Defect Detail (A4 RCA accordion).
**Exit:** A4 ≥70% top-2 root-cause accuracy on 50-defect golden set (from MS0-T032); Jira sync <5s/defect; HMAC webhook verification 100%.

---

## Milestone 5 — Reports + Pilot Launch

**Window:** 2026-08-10 → 2026-08-30 (3 weeks)
**Scope:** Reports Studio F23 (4 PM1 templates, hand-crafted SVG charts — NO heavy charting lib); Executive Dashboard F25 (Prove mode IVORY canvas `#FAFAF8` — only frame that flips); QA Value Dashboard F24; Agents F26 + F26m1 Agent Model Assignment; Settings F28 + 6 GA tabs (General, Branding, Data Retention, Integrations Health, Audit Log, Billing) + 2 PM3+ preview (SSO/SAML, Compliance); F28m1 LLM Provider Configuration with `+ Add Provider`.
**Pilot Day-0 flow (MS5-LAUNCH):** Yogesh signs in F06 → F08b → F28 → F28m1 paste Groq key → Test connection → enable models → Save → F26 → F26m1 per-agent assignment → first A1 generation works on F14.
**+ NEW per R2 mitigation: MS5-T-CART-SMOKE** (~1 day, NEW): load 5–10 real CART (Iksula Commerce) requirements → A1 generate test cases → A2 dedup → log sample defect → A4 RCA. Goal: confirm no project-specific assumptions baked into PM1. Triage findings before M6 GA.
**Exit:** all 41 frames render correctly; A1/A2/A4 pass eval golden sets; HMAC chain ≥99.95%; **monthly cost = $0**; 6 of 8 pilot users complete e2e flow without engineer intervention; CART smoke test green.

---

## Milestone 6 — Full Reports + GA

**Window:** 2026-08-31 → 2026-09-21 (3 weeks)
**Scope:** No new frames (UI inventory closed at 41); Reports Studio polish (4 templates × P0/P1/P2/P3 priorities × 3 release types tested); SLA hardening; perf optimization; final pilot signoff; GA launch 2026-09-21.
**12 binding GA acceptance gates (PM1_ERD v2.1 §10):**

1. **41 of 41 UI frames** render at locked design tokens (no MD3 drift, no tertiary, no missing project switcher)
2. A1 eval ≥80% golden-set match (DeepEval)
3. A2 eval <5% FP, ≥60% TP
4. A4 eval ≥70% top-2 RCA accuracy on 50-defect golden set
5. NFR-001 page load p50 <1.5s, p95 <3s on cold cache
6. NFR-002 API latency p50 <200ms, p95 <500ms (excluding LLM calls)
7. NFR-003 agent latency: A1 <10s, A2 <500ms, A4 <15s at p95
8. NFR-014 RBAC all 4 roles correctly gated on every endpoint (positive + negative)
9. HMAC audit chain integrity ≥99.95% on F28
10. Pilot acceptance: 6 of 8 pilot users complete e2e flow without engineer intervention
11. **Cost gate: monthly infra spend = $0** for pilot duration
12. Free-tier headroom check: Groq RPD, Neon CU-hr, Render bandwidth, R2 storage all >50% remaining (else plan PM2 paid migration)

---

## Risky Assumptions to Validate Early (per Phase 0.5 confirmation)

**R1 — Render free dyno cold-start vs NFR-003 (p95 latencies).**
_Status:_ ACCEPTED. UptimeRobot 5-min keep-alive (MS0-T015 + AC009) is the locked mitigation per PM1*ERD §11 Q-PM1-13. **Added:** Better Stack alert if ping missed >10 min (wired in MS0-T019).
\_Owner:* DevOps (M0).
_Re-test:_ M5 pilot week — measure p95 first-request latency.

**R2 — 8-user single-project pilot generalizes to other Iksula projects.**
_Status:_ ACCEPTED with addition. **NEW M5 task MS5-T-CART-SMOKE** (1 day): full e2e flow on Iksula Commerce (CART) requirements before M6 GA.
_Owner:_ Yogesh (Sr QA + Admin) + 1 QA Engineer.
_Trigger:_ If smoke test surfaces project-specific assumptions, triage before GA — do not slip past 2026-09-21 without explicit decision.

**R3 — 18-week timeline assumes A1/A2/A4 evals pass on first golden-set run.**
_Status:_ ACCEPTED with addition. **NEW M0 task MS0-T032** (16h, Days 7–10 parallel): build golden-set seed for A1/A2/A4. Drives weekly DeepEval starting M3.
_Owners:_ Yogesh + Akshay.
_Trigger:_ If any agent eval is >10pp below the §10 acceptance gate by end of M4, triggers milestone-slip discussion (NOT a paid-tier escape hatch).

---

## Cross-check vs Milestone_M0_Setup_v8.md (BINDING) — divergences flagged

| #   | Item                 | Skill output (this doc)                                                   | M0_v8.md (binding)                                                                 | Action                                                                                                  |
| --- | -------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Task count           | **32** (T001..T031 + new T032)                                            | 31 (T001..T031); cover page says "22 tasks" but list has 31                        | Binding spec patch needed: add T032 to M0_v8 §3 Phase 3 add-on; reconcile cover page count to "31 + 1"  |
| 2   | AC003 wording        | "21 PM1 tables (TB-001..TB-021)"                                          | Already patched by Yogesh on 2026-04-26 to "all 21 PM1 tables (TB-001..TB-021)" ✓  | None — already in sync                                                                                  |
| 3   | T020 wording         | "Define TB-001..TB-021"                                                   | Already patched by Yogesh to "TB-001..TB-021" ✓                                    | None                                                                                                    |
| 4   | AC014                | "Better Stack receives logs + Slack test alert + ping-miss >10 min alert" | M0_v8 says "Slack test alert" only                                                 | Binding spec patch needed: add ping-miss criterion to AC014                                             |
| 5   | T016 Custom domain   | DEFERRED to PM2 (Yogesh decision Phase 0.5)                               | M0_v8 says "Decide: free \*.cloudflare-pages.dev or buy custom domain" P2 priority | Binding spec patch optional: mark T016 "DEFERRED to PM2" or leave as P2 in M0 with the deferred outcome |
| 6   | M5 backlog           | Includes new MS5-T-CART-SMOKE                                             | M5 file v1.0 doesn't have it                                                       | Binding spec patch needed: add MS5-T-CART-SMOKE to M5 file                                              |
| 7   | postgres MCP install | Wired into MS0-T012 ("Then: install postgres MCP")                        | M0_v8 doesn't mention MCP                                                          | No conflict — kickoff §1.2 says install postgres MCP only after Neon URL exists                         |
