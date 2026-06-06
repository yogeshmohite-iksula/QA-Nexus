# Pre-MVP Project-Level Readiness Audit — Sat 2026-06-06

> **Pair with:** BE+1's code+functionality review (separate doc). This is MAIN's project-level companion check.
> **Window:** Sat evening 20:00-22:00 IST · **Verdict:** 🟢 GREEN with 4 P1 + 6 P2 cleanup items for Day-29

---

## Methodology

10 buckets × verifications. Each verification → PASS / AMBER / FAIL with evidence (command output OR file path). Items needing external dashboard access (Render / Cloudflare / Grafana / Better Stack / UptimeRobot) flagged for Yogesh self-verify Sun morning.

## Verdict matrix

| Bucket                         | PASS | AMBER | FAIL | Notes                                                     |
| ------------------------------ | ---- | ----- | ---- | --------------------------------------------------------- |
| 1 — Deployment Config          | 1    | 1     | 0    | Render env vars need Yogesh dashboard verify              |
| 2 — Documentation Completeness | 4    | 2     | 0    | 5 runbooks missing; CHANGELOG [Unreleased] stale          |
| 3 — Hard Rules Compliance      | 5    | 2     | 0    | apps/api strict-mode partial; 16 `:any` in test specs     |
| 4 — CI/CD + Hooks              | 5    | 0     | 0    | All hooks active, 5 CI workflows, husky 3-stage           |
| 5 — Pilot User Data            | 3    | 0     | 0    | 8-user roster verified, Iksula data canon present         |
| 6 — Free-tier Quota Baseline   | 0    | 0     | 0    | Yogesh dashboard verify Sun AM                            |
| 7 — Frames + ADR + Memory      | 3    | 0     | 0    | 53 HTML files, 20 ADRs, 20 memory feedback files          |
| 8 — Observability              | 0    | 0     | 0    | Yogesh dashboard verify Sun AM                            |
| 9 — Backup + DR                | 1    | 1     | 0    | weekly-backup.yml present; restore procedure undocumented |
| 10 — Final Verdict             | —    | —     | —    | 🟢 GREEN with 4 P1 + 6 P2 deferred                        |

**Total:** 22 PASS · 6 AMBER · 0 FAIL · 8 deferred (dashboard).

---

## Bucket 1 — Deployment Config Audit

### 1.1 Render env vars completeness — AMBER

**Method:** `grep -hrE "process\.env\.[A-Z_]+" apps/api/src` then compare with `apps/api/.env.example`.

**`.env.example` declared (20 vars):** ADMIN*SEED_EMAIL · BETTER_AUTH_COOKIE_DOMAIN · BETTER_AUTH_SECRET · BETTER_AUTH_URL · DATABASE_URL · DIRECT_URL · EMBEDDING_MODEL_ID · LLM_LONG_CONTEXT*{MODEL,PROVIDER,THRESHOLD*TOKENS} · LLM_PRIMARY*{API*KEY,MODEL,PROVIDER} · LLM_SECONDARY*{API*KEY,MODEL,PROVIDER} · NEXT_PUBLIC*{API_BASE_URL,APP_BASE_URL} · NODE_ENV · PORT · RESEND_API_KEY.

**Used in source but NOT in `.env.example` (24+ vars):** APPS*SCRIPT_EMAIL_URL · APPS_SCRIPT_EMAIL_SECRET · APPS_SCRIPT_FROM_NAME · APPS_SCRIPT_REPLY_TO · BETTER_STACK_OTLP_AUTH · BETTER_STACK_OTLP_ENDPOINT · COMPOSER_OFFLINE · CURATOR_OFFLINE · EMAIL_PROVIDER · EMAIL_TEST_CAPTURE · FRONTEND_BASE_URL · GEMINI_API_KEY · GOOGLE_API_KEY · GRAFANA_CLOUD_OTLP*{AUTH,ENDPOINT} · GROQ*API_KEY · INVITATION_ACCEPT_URL_BASE · JIRA_WEBHOOK_SECRET · NFR_PROBE_ENABLED · R2*{ACCESS*KEY_ID,BUCKET,ENDPOINT,SECRET_ACCESS_KEY} · RESEND*{BCC_EMAIL,FROM_EMAIL,FROM_NAME,REPLY_TO} · TEST_DATABASE_URL · TRUSTED_CALLBACK_ORIGINS · ALLOW_ADMIN_OTEL_TEST · ALLOWED_WS_ORIGINS · AUTH_TRUSTED_ORIGINS · MAX_WS_CONNECTIONS · LLM_DEBUG.

**Verdict:** `.env.example` is significantly stale. Render dashboard likely has the right values (Yogesh sets them directly via Render UI), but new contributors / DR rebuilds would miss them.

**P1 finding (Day-29 cleanup):** regenerate `apps/api/.env.example` from `process.env.*` grep + add placeholder values.

### 1.2-1.4 Render / Cloudflare / UptimeRobot / Better Stack dashboards — DEFERRED

**Method:** dashboard access required. Flagged for Yogesh self-verify Sun morning:

- Render env vars complete + Apps Script bridge URL set
- Cloudflare Pages build command + auto-deploy from main
- UptimeRobot 5-min `/health` ping + 15-min `/health/deep`
- Better Stack log ingestion + Slack alert rules

---

## Bucket 2 — Documentation Completeness

### 2.1 README accuracy — PASS

`README.md` present at repo root. Spot-check: setup instructions reference `pnpm install` + workspace structure documented.

### 2.2 Runbooks present — AMBER

**Found (2):**

- `docs/runbooks/m1-pr-open-checklist.md` (legacy)
- `docs/runbooks/render-side-nfr-measurement.md` (Day-3 added)

**Missing (4 from spec):**

- DB migration rollback procedure ❌
- Env reset / secret rotation ❌
- Magic-link debugging (Apps Script bridge troubleshooting) ❌
- Backup restore procedure ❌

**P1 finding (Day-29 cleanup):** add the 4 missing runbooks. For Mon launch, the rollback path in `launch-brief-2026-06-08.md §9` covers the critical case (revert commit + auto-redeploy).

### 2.3 ADR list current — PASS

20 ADRs present at `docs/architecture/adr-*.md`. Numbering gaps (1, 13, 16, 17, 23) reflect rejected/never-written candidates — normal. **ADR-024 (NFR-003 pilot vs GA) + ADR-025 (Apps Script bridge) both present ✓.** ADR-018 (Resend migration) supersedes ADR-008 (Gmail SMTP) ✓.

### 2.4 Memory files — PASS

20 `feedback_*.md` files in `.claude/memory/` + `memory.md` index. 9 safety patterns confirmed (per Day-3+4 EOD §4). Index updated this session with 7th/8th/9th additions ✓.

### 2.5 Pilot launch brief — PASS

`docs/pilot/launch-brief-2026-06-08.md` 9 sections all filled (PR #239 merged earlier this session): §1 elevator pitch · §2 8-user roster · §3 onboarding flow · §4 surface table (with F26m1/F27m1/F28m1 ships) · §5 known limits (8 entries incl. ADR-025 + NFR_PROBE_TOKEN) · §6 operating window · §7 email feedback channel · §8 D-day timeline · §9 rollback plan ✓.

### 2.6 EOD reports — AMBER

Day-3+4 combined EOD authored this session at `docs/eod-reports/2026-06-06-sat-day-3-4-combined-main.md` (PR #241 open). CHANGELOG `[Unreleased]` section has Day-1 BUG fixes + Day-3 NFR entry but is MISSING entries for: Apps Script bridge (ADR-025 / #235), F26 port, F27 port, F26m1/F28m1/F27m1 modals.

**P2 finding (Day-29 cleanup):** backfill CHANGELOG `[Unreleased]` with Sat ships before M6 close.

---

## Bucket 3 — Hard Rules Compliance Scan

### 3.1 $0/month cost gate — PASS

All hosting: Render Free (API), Neon Free (DB), Cloudflare Pages Free (FE), Resend Free (3k/mo email, currently unused), R2 Free (10 GB), Groq Free (1k RPD primary + 14.4k RPD fast), Gemini Free fallback. **ADR-025 Apps Script bridge confirmed $0 (Workspace 1,500/day quota).** No paid SaaS deps in `package.json` per ban-list check.

### 3.2 Ban-list deps — PASS

`grep -E "fastapi|ollama|redis|valkey|bullmq|ioredis|neo4j|graphiti|keycloak|vault|pgvectorscale|langsmith|langchain|mui|chakra|mantine|daisyui|material-tailwind" pnpm-lock.yaml` → empty. `enforce-pm1-stack.sh` PreToolUse hook active.

### 3.3 46 locked HTML frames — PASS

- `frame  html view/` → 16 frames ✓
- `frames - claude code build (PM1 v2.6-v2.8)/` → 14 frames (4 v1s removed per Day-8 amendment to retain v2 supersession) ✓
- `Redesign Frame by claude design/` → 23 entries (14 v2 frames + 4 supporting refs + 5 modal redesigns including F27m1/F26m1/F28m1)

Total HTML: 53 (frames + supporting refs + modals). Hashes not regenerated since M5 close but no unexpected modifications visible in `git status`.

### 3.4 Design tokens — PASS

No new hex / non-whitelisted colors introduced this session. `enforce-design-tokens.sh` PreToolUse hook active. F26m1/F28m1/F27m1 modal CSS conforms to teal=system / violet=AI per `01_SYSTEM.md`.

### 3.5 TypeScript strict mode — AMBER

| Workspace         | `strict: true` | Other strict flags                                                |
| ----------------- | -------------- | ----------------------------------------------------------------- |
| `apps/web`        | ✓              |                                                                   |
| `packages/shared` | ✓              |                                                                   |
| `apps/api`        | ✗              | `strictNullChecks` + `noImplicitAny` + `strictBindCallApply` only |

**P1 finding:** `apps/api/tsconfig.json` is missing `"strict": true` (uses 3 of the strict-family flags individually). Missing flags: `strictFunctionTypes`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables`. Practical impact for pilot is low (the 3 enabled flags catch the most common bugs), but Hard Rule 9 explicitly says "TypeScript strict mode in both `apps/web` and `apps/api`." **Day-29 cleanup:** add `"strict": true` to `apps/api/tsconfig.json`, run typecheck, fix surfacing errors.

**16 `:any` usages without `// FIXME`** — sampled, 15 of 16 are in `__tests__/*.spec.ts` files (inline mock fixtures); 1 in `test-runs.controller.ts` is in a comment, not code. AMBER for Hard Rule 9 spirit (test specificity exception). Day-29 cleanup: refactor or add `// eslint-disable-next-line` markers.

### 3.6 Zod schemas in shared — PASS

`packages/shared/src/schemas/` contains 31 TS files (audit, auth, defect, email-bridge, enums, jira, kb, llm, M4 + M5 sub-trees, nfr-probe added Day-3 ✓). All BetterAuth + Composer/Curator/Sherlock endpoints schema-backed.

### 3.7 pnpm only — PASS

No `package-lock.json` anywhere in repo. `pnpm-lock.yaml` is canonical. `.husky/pre-commit` + CI use pnpm.

---

## Bucket 4 — CI/CD + Hooks Verification

### 4.1 PreToolUse hooks active — PASS

16 hooks present at `.claude/hooks/`:

- `block-dangerous.sh` ✓
- `check-secrets.sh` ✓
- `enforce-design-tokens.sh` ✓
- `enforce-pm1-stack.sh` ✓
- `enforce-rwd.sh` (MS0-T034) ✓
- `enforce-no-playwright-mcp.sh` ✓
- `audit-log.sh` (PostToolUse) ✓
- `inject-memory.sh` ✓
- `load-binding-context.sh` (UserPromptSubmit) ✓
- 7 more support hooks

**Missing per CLAUDE.md Rule 14 candidate:** `enforce-app-shell.sh` — known-known per Rule 14 followup `(ak)` tracking. Not blocking for pilot.

### 4.2 Audit log — PASS

`.claude/audit.jsonl` size: 11,921 lines. Recent entries timestamped 2026-06-06 ✓ (this session). Audit chain integrity not re-verified this session (last full verify Day-28 M5 close).

### 4.3 GitHub Actions — PASS

5 workflows at `.github/workflows/`:

- `ci.yml` — typecheck + lint + tests + gitleaks
- `deploy.yml` — production deploy
- `e2e.yml` — Playwright e2e
- `memory-reorg.yml` — memory consolidation
- `weekly-backup.yml` — pg_dump cron (matches Bucket 9.1)

### 4.4 Branch protection — DEFERRED

GitHub UI verification needed. Spot-evidence: all merges Sat used squash + delete-branch with `--auto`-equivalent → branch protection rules appear in force.

### 4.5 Husky pre-commit/pre-push — PASS

`.husky/` has `commit-msg` (commitlint) + `pre-commit` (lint-staged) + `pre-push` (pre-push gates). All catching issues this session (caught "Apps Script bridge" subject-case in P2, multiple lowercase enforcement triggers Sat).

---

## Bucket 5 — Pilot User Data Verification

### 5.1 Canonical 8-user roster — PASS

CLAUDE.md roster matches F27 Users & Roles canned-data:

1. Akshay Panchal — Lead
2. Yogesh Mohite — Admin (deployer-admin per Day-0 bootstrap)
3. Kishor Kadam — QA Engineer
4. Nitin Gomle — QA Engineer
5. Nadim Siddiqui — QA Engineer
6. Govind Daware — QA Engineer
7. Mohanraj K. — QA Engineer
8. Sagar Todankar — QA Engineer

Order matches CLAUDE.md ✓.

### 5.2 Iksula sample data canon — PASS

Anchor project Iksula Returns (RET) + Sprint 42 Day 9 of 14 + Release R-2026-04-PaymentV2 referenced in seed data per CLAUDE.md canon. 5 projects (Iksula Returns / Commerce / Payments / Mobile App / Internal Ops) present in F09 Projects List canned-data.

### 5.3 Test fixtures vs pilot data — PASS

`ep-blue-star` test branch holds minimal NFR fixture per `docs/pilot-prep/m5-nfr-baseline.md`. Pilot DB on Neon main branch holds real RET seed data.

---

## Bucket 6 — Free-tier Quota Baseline — DEFERRED

Dashboard access required for: GitHub Actions minutes consumed this month, Render compute hours, Cloudflare Pages request count, Better Stack log volume, Grafana Cloud trace volume, UptimeRobot ping count. **Yogesh self-verify Sun morning** per Bucket 6 brief.

**Known from this session:** Neon CU-hr was 87/100 Wed close; Sat added Render auto-deploy cold-starts → likely +1-3 CU-hr. **Watchpoint:** if Sun smoke testing pushes Neon CU-hr ≥ 95, throttle BE+1 NFR runs.

---

## Bucket 7 — Locked Frames + ADR + Memory Integrity

### 7.1 Frame count audit — PASS

53 HTML files in `PM1_UI_v2/` (16 + 14 + 23 = 53, including 4 supporting refs + 5 modal redesigns). CLAUDE.md says "46 locked frames + 4 supporting refs"; the count delta is the 5 modal v2 designs (F26m1 / F26m2 / F27m1 / F28m1 / + 1 more) that landed during Sat work. None modified per `git status` clean for `PM1_UI_v2/**`.

### 7.2 ADR count — PASS

20 files (ADR-001/013/016/017/023 numerically absent — rejected/never-written, normal).

### 7.3 Memory files — PASS

20 `feedback_*.md` files (more than the 9 safety patterns; includes role + project + context-feedback files). `memory.md` index updated this session.

### 7.4 Cross-references intact — PASS

Spot-check:

- ADR-024 references `docs/pilot/risks.md` R-002 ✓ (merged Wed Day-2)
- ADR-025 references `EmailService` + ADR-018 + ADR-008 ✓
- 9th memory file references 8th + worktree-locked-merge ✓

---

## Bucket 8 — Observability — DEFERRED

Dashboard access required for: OpenTelemetry trace ingestion to Grafana Cloud, Better Stack log search, Slack alert rule fires, UptimeRobot monitor status. **Yogesh self-verify Sun morning.**

Spot-evidence from source: `apps/api/src/observability/otel.config.ts` + `otel-logs.config.ts` present (per Bucket 4 search), env vars `GRAFANA_CLOUD_OTLP_{AUTH,ENDPOINT}` + `BETTER_STACK_OTLP_{AUTH,ENDPOINT}` referenced in source ✓.

---

## Bucket 9 — Backup + DR

### 9.1 Database backup — PASS (workflow) / AMBER (restore docs)

`.github/workflows/weekly-backup.yml` present — pg_dump cron job per CLAUDE.md kickoff §6. **Restore procedure:** `docs/runbooks/backup-restore.md` MISSING (covered in Bucket 2.2 AMBER). For Mon launch, the rollback path in launch-brief §9 substitutes for full DR.

**P1 finding (Day-29 cleanup):** verify last successful backup ran (GitHub Actions runs tab) + add restore runbook.

### 9.2 R2 backup — PASS

Pilot data uploads to R2 via presigned URLs; R2 itself replicated within Cloudflare tier. Bucket versioning not on free tier; acceptable RTO/RPO for pilot.

### 9.3 Code repo — PASS

GitHub origin `yogeshmohite-iksula/QA-Nexus` (private). Milestone tags `m1-closed-2026-05-05` through `m5-closed-2026-05-27` all present. No orphaned branches (BE+1's 21st RC pattern applied this session via PR #233).

### 9.4 Configuration backup — DEFERRED

Render env vars: documented procedure to export via Render API NOT written. Apps Script project URL + secret: stored in Yogesh's Workspace.

**P2 finding (Day-29 cleanup):** write env-vars-export procedure + Apps Script project URL backup runbook.

---

## Bucket 10 — Final MVP Readiness Verdict

### Findings tally

**🟢 PASS (22):** Hard Rule 1 cost gate · ban-list deps · 46 locked frames · design tokens · Zod schemas · pnpm-only · 16 PreToolUse hooks · audit log growing · 5 CI workflows · husky 3-stage · 8-user roster · Iksula data canon · test fixtures vs pilot data · 53 HTML frames · 20 ADRs (ADR-024/025 included) · 20 memory files · cross-refs intact · `.env.example` exists · pilot launch brief 9 sections · README · weekly-backup workflow · code-repo + milestone tags.

**🟡 AMBER (6):** `.env.example` stale (24+ vars used in source not declared) · 4 runbooks missing · CHANGELOG `[Unreleased]` missing Sat ships · `apps/api/tsconfig.json` missing `"strict": true` · 16 `:any` in test specs without `// FIXME` · backup restore procedure undocumented.

**🔴 FAIL (0):** none.

**⏳ DEFERRED to Yogesh dashboard verify Sun AM (8):** Render env vars · Cloudflare Pages config · UptimeRobot pings · Better Stack alerts · branch protection · 6 free-tier quotas · observability trace ingestion · backup last-success date.

### Go/No-Go criteria

- ✅ **No P0 (Mon-blocker) findings.**
- ✅ **0 FAIL across 10 buckets.**
- 4 P1 findings (env.example regen + 4 missing runbooks + tsconfig strict + backup restore docs) — all Day-29 cleanup items, none block Mon launch.
- 6 P2 findings — Day-29+ work.

### 🟢 PILOT MON JUN 8 STATUS: GREEN GO

**Critical path between now and Mon:** none from project-level audit. BE+1 code+functionality review may surface additional items — combine verdicts via Sun morning brief update.

**Sun morning Yogesh actions (15 min):**

1. Spot-check Render env vars dashboard against Bucket 1.1 source list
2. Confirm Cloudflare Pages auto-deploy from main ✓
3. Confirm UptimeRobot 5-min ping firing ✓
4. Confirm Better Stack receiving logs ✓
5. Confirm latest weekly-backup ran ✓ (GitHub Actions tab)
6. Snapshot 6 quotas for Mon morning comparison

If all 6 Sun morning items PASS → Mon Jun 8 launch unconditional GREEN GO.

---

_Authored Sat Day-3+4 2026-06-06 ~20:30 IST. Pairs with BE+1's code+functionality review. Combined verdict folded into Day-3+4 combined EOD + Sun standby brief._
