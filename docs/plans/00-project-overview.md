# QA Nexus — Project overview (PM1 → PM4)

> **Last updated:** 2026-05-02 (Day 6 of PM1)
> **Authority:** Summary view. Binding specs: `../../QA Nexus/PRD/PRD.md` (v2.10) +
> `../../QA Nexus/ERD/ERD.md` (v2.6) + `../../QA Nexus/PROJECT_ROADMAP.md` (v1.1).

---

## What is QA Nexus

An AI-native QA management platform for the Iksula QA team. Replaces the existing
Jira + Confluence + spreadsheet workflow with a single workspace that captures
test docs, generates test cases via LLM agents (A1), deduplicates with embedding
similarity (A2), runs tests live, performs 5-Layer root-cause analysis on defects
(A4), and syncs bidirectionally with Jira.

**Pilot:** 8 named Iksula users × 12 hr/day × 7 days/week (10 AM – 10 PM IST), running
on entirely free-tier infrastructure ($0/month).

**v1 GA:** 2026-09-21 (PM1 close + acceptance gates).

---

## PM-level scope summary

| PM  | Scope                                                                                                        | Window                  | Status                                                          |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------- |
| PM1 | MVP — 41 frames, A1+A2+A4 agents, 8-user Iksula pilot, Jira sync                                             | 2026-04-21 → 2026-09-21 | **IN PROGRESS** (Day 6 of 18-week build, M0 closing 2026-05-03) |
| PM2 | Org-scale hardening — multi-org, observability deepening, OpenBao secrets, paid-tier migration if needed     | post-GA, ~Q4 2026       | NOT STARTED                                                     |
| PM3 | Enterprise — SSO/SAML/SCIM, custom OAuth, advanced compliance (SOC2-lite), Vault-managed secrets             | ~Q1 2027                | NOT STARTED                                                     |
| PM4 | Adjacent agents — A3 Test Data Synthesizer, A5 Risk Scorer, A6 Coverage Analyzer; expand to non-QA workflows | ~Q2-Q3 2027             | NOT STARTED                                                     |

PM2-PM4 scope is described at high level in the project-level `PRD.md` v2.10
(§§14-17). PM1 supersedes those sections for 2026-04-21 → 2026-09-21.

---

## PM1 milestone breakdown (binding from `PROJECT_ROADMAP.md` v1.1)

| Mn  | Theme                                   | Window                  | Status                                |
| --- | --------------------------------------- | ----------------------- | ------------------------------------- |
| M0  | Setup & infra (free-tier plumbing)      | 2026-04-27 → 2026-05-10 | **CLOSING 2026-05-03 (7 days early)** |
| M1  | Users, Roles & RBAC                     | 2026-05-11 → 2026-05-24 | IN PROGRESS (BE + FE branches active) |
| M2  | Test Documents & Knowledge Base         | 2026-05-25 → 2026-06-14 | NOT STARTED                           |
| M3  | Test Cases + A1 + A2                    | 2026-06-15 → 2026-07-05 | NOT STARTED                           |
| M4  | Test Runs + Defects + A4 + Jira         | 2026-07-06 → 2026-07-26 | NOT STARTED                           |
| M5  | Automation MVP + Reports + Pilot launch | 2026-07-27 → 2026-08-16 | NOT STARTED                           |
| M6  | Full Reports Suite + GA                 | 2026-08-17 → 2026-09-21 | NOT STARTED                           |

Per-Mn detail in `02-milestones/Mn-*.md`. PM1 execution detail in
`01-pm1-execution-plan.md`.

---

## Tech stack at a glance (locked, $0/month)

| Layer          | Choice                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router) · React 19 · Tailwind 4 (CSS-first) · shadcn/ui · Sonner · TipTap · Framer Motion                 |
| Backend        | NestJS 10 (REST + WebSocket via `@nestjs/websockets`) · Prisma 5 · BetterAuth (Postgres adapter)                          |
| Database       | Postgres 15 + pgvector (HNSW) on Neon free 0.5 GB · scale-to-zero                                                         |
| Embeddings     | `@xenova/transformers` · **bge-small-en-v1.5** (384-dim, 33 MB) ← amended Day-4 from bge-large for Render Free 512 MB OOM |
| LLM            | Groq free (`gpt-oss-120b` primary, `llama-4-scout` long-context, `gpt-oss-20b` fast) + Gemini 2.5 Flash fallback          |
| Storage        | Cloudflare R2 free (10 GB / 1M class-A / 10M class-B) — presigned-URL direct upload                                       |
| Hosting        | Cloudflare Pages free (FE) + Render Free Hobby Singapore (API, 512 MB) + Neon free (DB)                                   |
| Observability  | OpenTelemetry SDK · Grafana Cloud OTLP (traces) · Better Stack OTLP (logs) · Slack alerts (3 named rules)                 |
| Email          | Resend free (3000/mo)                                                                                                     |
| Keep-alive     | UptimeRobot free (5-min `/health` ping, 24x7)                                                                             |
| CI             | GitHub Actions free (2k min/mo, weekly `pg_dump` cron)                                                                    |
| Eval           | DeepEval on Colab Free (engineering-only, never blocks prod traffic)                                                      |
| E2E            | Playwright (internal QA)                                                                                                  |
| Repo / package | pnpm workspaces 10.x (`apps/web`, `apps/api`, `packages/shared`)                                                          |

**Total monthly cost: $0** for the 8-user × 12hr/day pilot.

---

## Iksula data canon (used verbatim in seeds, fixtures, demo data)

**Anchor project:** Iksula Returns (key `RET`) · Sprint 42 Day 9 of 14 · Release `R-2026-04-PaymentV2`

**Pilot team (8 users, FINAL — no placeholders):**

| #   | Name           | Org role    | RBAC role                                   |
| --- | -------------- | ----------- | ------------------------------------------- |
| 1   | Akshay Panchal | QA Lead     | **Lead**                                    |
| 2   | Yogesh Mohite  | Sr QA       | **Admin** (deployer-admin, Day-0 bootstrap) |
| 3   | Kishor Kadam   | QA Engineer | QA Engineer                                 |
| 4   | Nitin Gomle    | QA Engineer | QA Engineer                                 |
| 5   | Nadim Siddiqui | QA Engineer | QA Engineer                                 |
| 6   | Govind Daware  | QA Engineer | QA Engineer                                 |
| 7   | Mohanraj K.    | QA Engineer | QA Engineer                                 |
| 8   | Sagar Todankar | QA Engineer | QA Engineer                                 |

**Other Iksula projects (background context):** Iksula Commerce (`CART`), Iksula
Payments (`PAY`, staging amber), Iksula Mobile App (`AUTH`, main green), Iksula
Internal Ops (`OPS`, available).

**Sample uploads:** `return_policy_v2.xlsx`, `legacy_refund_test_cases.csv`,
`customer_return_flow_recording.mp4`

**ID patterns:** Jira reqs `RET-###` · uploaded reqs `REQ-###` · test cases
`TC-RET-###` · defects `DEF-###` · imports `#242`

**Jira instance:** `iksula.atlassian.net` (12 projects visible)

---

## Hard rules (binding from `CLAUDE.md`)

1. **$0/month cost gate** — any paid component requires explicit Yogesh approval +
   ADR. Even $5/mo upgrades.
2. **Free / OSI-approved OSS only** — hosted services OK if free tier matches
   pilot scale.
3. **Never modify the 41 locked HTML frames** in `PM1_UI_v2/` — translate to React
   in `apps/web/src/app/**`.
4. **Locked design tokens only** — no MD3, no tertiary colors, no `tailwind.config.ts`
   extension. `enforce-design-tokens.sh` blocks.
5. **Ban list enforced** — FastAPI / Ollama / Redis / Neo4j / Keycloak / Vault /
   MUI / Chakra / Mantine / langchain etc. all blocked by `enforce-pm1-stack.sh`.
6. **No secrets in repo** — `.env` gitignored, gitleaks in CI, `check-secrets.sh`
   PreToolUse hook.
7. **HMAC-SHA256 chained `audit_log`** for every state-changing op (see PM1_ERD §3.13).
8. **pnpm only** (never npm/yarn). **TypeScript strict**. **All endpoints have
   shared Zod schemas** in `packages/shared`.
9. **Visual confirmation gate** — every newly developed/refactored screen needs
   Yogesh's explicit "looks good, commit" approval before commit. Established
   2026-04-26 after F06 RWD iterations.
10. **Full RWD on every ported frame** — base styles target 320 px, no fixed
    pixel widths on layout containers, tap targets ≥44 px, no horizontal scroll
    ≥320 px. Enforced by `enforce-rwd.sh`.

---

## Top decisions log (PM1 to date — see `../architecture/` for ADRs)

| Date       | Decision                                                                                | Doc                                             |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 2026-04-21 | Lock free-tier OSS stack; drop self-hosted Oracle VM + Ollama                           | PM1_PRD v8.0                                    |
| 2026-04-22 | Prisma raw-SQL split for vector + HNSW operations                                       | ADR-002 (`adr-002-prisma-raw-split.md`)         |
| 2026-04-22 | `@xenova/transformers` in-process embeddings (no FastAPI)                               | ADR-003 (`adr-003-embedding-model.md`)          |
| 2026-04-25 | Render Free Hobby (Singapore) deployment topology                                       | ADR-004 (`adr-004-render-deployment.md`)        |
| 2026-04-25 | Cloudflare R2 presigned-URL pattern (no buffering through dyno)                         | ADR-005 (`adr-005-r2-storage.md`)               |
| 2026-04-26 | Visual confirmation gate (CLAUDE.md Rule 13)                                            | EOD 2026-04-26                                  |
| 2026-04-26 | Full RWD rule (Rule 12 + `enforce-rwd.sh` hook)                                         | MS0-T034                                        |
| 2026-04-28 | 3-layer demo-seed architecture (types → demo source → contexts)                         | ADR-006 (`adr-006-seed-data-centralization.md`) |
| 2026-04-30 | Pure-OTel logging (no pino/winston) — Path 2                                            | ADR-007 (forthcoming) + `api.md`                |
| 2026-04-30 | Sharp pin to `^0.33.5` for Render Free build                                            | ADR-009 (`adr-009-pnpm-sharp-render-deploy.md`) |
| 2026-05-01 | Embedding model: bge-large → **bge-small-en-v1.5** (384-dim) for Render Free 512 MB OOM | ADR-003 amendment + MS0-T017+AC008 amendment    |
| 2026-05-01 | OTel pipeline: Grafana Cloud + Better Stack + Slack alerts (3 rules)                    | EOD 2026-05-01                                  |
| 2026-05-01 | Pre-push gate framework (3 stages: typecheck → frozen-lockfile → CHANGELOG)             | `.husky/pre-push`                               |

---

## Cross-references

- `01-pm1-execution-plan.md` — PM1 detail
- `02-milestones/M0-setup-infra.md` … `M6-reports-ga.md` — per-milestone plans
- `03-drift-checklist.md` — generic Mn-close template
- `04-plan-vs-actual.md` — living delivery log
- `../STATUS.md` — daily snapshot
- `../CHANGELOG.md` — chronological feature log
- `../followups.md` — open followups (a) – (r)
- `../audits/skill-alignment-audit.md` — Day-5 cumulative 96%
- `../audits/code-audit.md` — Day-5 architecture audit (overall A-)
- `../audits/2026-05-02-m0-ac-dry-run.md` — M0 acceptance-gate state
- `../architecture/` — ADRs
- `../eod-reports/` — daily EOD writeups
- `../../QA Nexus/PRD/PRD.md` (v2.10) — project-level product spec
- `../../QA Nexus/ERD/ERD.md` (v2.6) — project-level engineering spec
- `../../QA Nexus/PROJECT_ROADMAP.md` (v1.1) — milestone calendar
- `../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` (v8.1) — PM1 product spec (binding)
- `../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` (v2.1) — PM1 engineering spec (binding)
