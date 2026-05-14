# PM1 — Execution plan (M0 → M6)

> **Last updated:** 2026-05-02 (Day 6)
> **Authority:** Summary view. Binding specs: `../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md`
> (v8.1) + `../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` (v2.1) + per-Mn milestone files
> in `../../QA Nexus/PM1/PM1_milestone/`.

---

## Revision history

| Date       | Author       | Change                                                                                  |
| ---------- | ------------ | --------------------------------------------------------------------------------------- |
| 2026-05-02 | MAIN (Day 6) | Initial scaffold. M0 closing 7 days early (Sunday 2026-05-03 ceremony). M1 in progress. |

---

## PM1 scope summary

**IN SCOPE for PM1 (binding from PM1_PRD v8.1):**

- 41 locked HTML frames → React ports in `apps/web/src/app/**`
- 4-role RBAC (Admin / Lead / QA Engineer / Stakeholder)
- BetterAuth magic-link auth + invitation flow
- 12 doc templates + AI-augmented Knowledge Base (TipTap editor)
- 3 AI agents:
  - **A1 Test Case Generator** (Groq `gpt-oss-120b` primary)
  - **A2 Duplicate Detector** (embedding cosine similarity, no LLM call)
  - **A4 5-Layer RCA** (parallel Groq + Gemini fallback)
- Test runs (live state via WebSocket) + defects + 5-Layer RCA accordion
- Jira 2-way sync via OAuth 2.0 3LO
- Reports Studio (4 PM1 templates: PDF/Excel/HTML)
- F25 Executive Dashboard ("Prove mode" ivory canvas)
- F28 Settings & Audit (HMAC chain integrity ≥99.95%)
- 8-user Iksula pilot launch + 4-week soak before GA

**DEFERRED to PM2+ (NOT shipping in PM1):**

- ❌ Multi-org / multi-tenant beyond Iksula
- ❌ SSO / SAML / SCIM (PM3 M16)
- ❌ Custom OAuth provider (PM3 M17)
- ❌ Self-hosted Vault / OpenBao (PM2 — Render env vars in PM1)
- ❌ A3 Test Data Synthesizer / A5 Risk Scorer / A6 Coverage Analyzer (PM4)
- ❌ Adjacent (non-QA) workflows (PM4)
- ❌ Self-hosted observability (Prometheus/SigNoz) — Grafana Cloud free in PM1
- ❌ pgvectorscale (not on Neon free tier; vanilla pgvector adequate for ~50K vectors)

---

## M0 → M6 timeline + status

| Mn  | Window                                                     | Status                | Headline                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | 2026-04-27 → 2026-05-03                                    | **CLOSED 2026-05-03** | **17/19 PASS · 0 FAIL · 2 DEFERRED to M1.5** (AC007 LLM key UI · AC013 3rd Slack rule). AC012 footnoted-PASS (manual workflow_dispatch; scheduled cron drift on first activation). Completion report: `../milestones/M0_completion_report.md`                                                                 |
| M1  | 2026-05-11 → 2026-05-24                                    | **IN PROGRESS**       | F06+F07+RBAC+magic-link invites + F26m1 Agent Model Assignment + F27m1 User Mgmt + F28m1 LLM Provider Config                                                                                                                                                                                                  |
| M2  | 2026-05-25 → 2026-06-14                                    | NOT STARTED           | Document Catalog (12 templates) + KB ingestion + F12-F15                                                                                                                                                                                                                                                      |
| M3  | 2026-05-08 → 2026-05-13 (compressed from 2026-06-15→07-05) | **CLOSED 2026-05-13** | **52 PRs / 6 calendar days / ~3.6 working days.** Test cases CRUD + A1 Composer real Groq + A2 Curator real pgvector + F14 + 3 modals + drawer + F16a/b/c + F19 + AdminShell canonical + magic-link auth end-to-end. Tag `m3-closed-2026-05-13` at SHA `a98797b`. Report: `../milestones/m3-close-report.md`. |
| M4  | 2026-07-06 → 2026-07-26                                    | NOT STARTED           | Test Runs (live WS) + Defects + A4 5-Layer RCA + Jira 2-way + F18-F22                                                                                                                                                                                                                                         |
| M5  | 2026-07-27 → 2026-08-16                                    | NOT STARTED           | Reports Studio (4 templates) + F23-F28 + 8-user pilot Day-0                                                                                                                                                                                                                                                   |
| M6  | 2026-08-17 → 2026-09-21                                    | NOT STARTED           | Full reports suite + GA-readiness sweep (12 acceptance gates)                                                                                                                                                                                                                                                 |

**Per-milestone detail in `02-milestones/Mn-*.md`.**

---

## Acceptance-gate summary

PM1's GA gate is **12 binding criteria from PM1_ERD v2.1 §10**, plus per-Mn AC
sub-gates. Tracker:

| AC    | Description                                               | Status      | Evidence                                              |
| ----- | --------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| GA-1  | 41/41 frames render at locked design tokens               | IN PROGRESS | F06 + F06b + F06c + F07 + F08-F13 ported (M0)         |
| GA-2  | A1 eval ≥80% on 30-req golden set                         | NOT STARTED | T032 golden seeds committed Day 6 (`75630f3`)         |
| GA-3  | A2 eval <5% FP, ≥60% TP on 102-pair set                   | NOT STARTED | T032 golden seeds committed Day 6                     |
| GA-4  | A4 eval top-2 RCA accuracy ≥70% on 50-defect set          | NOT STARTED | T032 golden seeds committed Day 6 (62 valid)          |
| GA-5  | NFR-001 page load p50 <1.5s, p95 <3s                      | NOT STARTED | Measured at M5 pilot                                  |
| GA-6  | NFR-002 API latency p50 <200ms, p95 <500ms (excl. LLM)    | NOT STARTED | Measured at M5 pilot                                  |
| GA-7  | NFR-003 A1<10s · A2<500ms · A4<15s p95                    | NOT STARTED | Measured at M3+M4 close                               |
| GA-8  | NFR-014 RBAC all 4 roles correctly gated                  | NOT STARTED | M1 close                                              |
| GA-9  | HMAC audit chain integrity ≥99.95%                        | PARTIAL     | Audit log table live (`audit_log`); chain-check at M5 |
| GA-10 | Pilot acceptance: 6/8 users complete E2E without engineer | NOT STARTED | M5 pilot week 1                                       |
| GA-11 | **Cost gate: $0/month** confirmed                         | ON TRACK    | M0 to date $0; verified Day-5 EOD                     |
| GA-12 | Backup pipeline (weekly `pg_dump` to R2) functional       | NOT STARTED | M2 cron task                                          |

Per-Mn AC pass-rates documented in each `02-milestones/Mn-*.md`.

---

## Risks + dependencies

### Active risks (Day 6)

| #   | Risk                                                                                                                                                 | Severity | Mitigation                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Gemini 2.5 Flash free RPD may have been cut from 1500 → 250/day** (Dec 2025 50-80% reduction across Google free models, per May 2026 web research) | **HIGH** | Verify against Google AI Studio dashboard before M3. If confirmed, reduce A1 fallback retry budget + plan to migrate fallback to Groq `gpt-oss-20b` (14.4k RPD). |
| R2  | Render Free 512 MB OOM (already hit Day-4)                                                                                                           | MEDIUM   | bge-small (33 MB) + pre-flight memory guard + sharp 0.33+ decoupled binary all shipped Day 4-5. Monitor at M2 KB ingestion + M3 A1+A2 load.                      |
| R3  | Neon free 0.5 GB cap (~50K vectors)                                                                                                                  | MEDIUM   | Current usage <5%. Followup `(m)` files quota-alert system (M1 BE cron + FE banner + new `r2_quota_log` table).                                                  |
| R4  | R2 quota exhaustion (10 GB / 1M Class-A / 10M Class-B)                                                                                               | LOW      | Same followup `(m)` covers R2.                                                                                                                                   |
| R5  | Neon was acquired by Databricks (2025) — vendor stability watch                                                                                      | LOW      | Free tier doubled (50→100 CU-hr/mo) post-acquisition. No migration trigger yet.                                                                                  |
| R6  | Single QA developer (Yogesh) — bus factor 1                                                                                                          | MEDIUM   | All architectural decisions ADR-documented; Akshay onboarded as Lead.                                                                                            |
| R7  | OAuth 2.0 3LO complexity at M4 — Iksula corporate tenant approval                                                                                    | MEDIUM   | M4 Day 1 task: confirm `iksula.atlassian.net` admin can approve OAuth app.                                                                                       |
| R8  | Cold-start UX on Render Free (15-min idle spin-down, 30-60s cold start)                                                                              | LOW      | UptimeRobot 5-min keep-alive on `/health` covers full 12-hr pilot window. Verified Day 5.                                                                        |

### Cross-Mn dependencies

```
M0 (infra)     ─┬→ M1 (auth+RBAC)  ─┬→ M2 (KB)  ─→ M3 (A1+A2) ─┬→ M4 (Runs+A4+Jira) ─→ M5 (Reports+Pilot) ─→ M6 (GA)
                │                    │                          │
                └─→ HMAC audit chain ┴─→ shared Zod schemas      └─→ Golden sets (T032) gate A1/A2/A4 evals
```

**M0 unlocks:** all infra · BetterAuth scaffold · audit_log table · OTel pipeline ·
locked HTML frames ported (12 of 41).

**M1 needs from M0:** Postgres + BetterAuth schema · Resend domain · `audit_log` table
ready · OTel + Better Stack receiving logs.

**M2 needs from M1:** RBAC middleware enforced · Iksula 8 users seeded with roles ·
audit_log capturing user actions.

**M3 needs from M2:** KB document table populated · embedding service warm in dyno ·
Golden sets (T032) committed (✅ done Day 6, `75630f3`).

**M4 needs from M3:** A1+A2 working end-to-end · Test case library populated ·
WebSocket gateway proven (already exists from T026, PR #11).

**M5 needs from M4:** A4 working · Jira 2-way sync stable · all 41 frames ported ·
8 users invited via M1 invite flow.

**M6 needs from M5:** All pilot findings triaged · 4-week soak complete · 12 GA
gates measured.

---

## Pilot launch readiness criteria (M5 Day-0)

Before flipping the 8-user pilot live:

1. F28 Settings → F28m1 LLM Provider Configuration: Yogesh pastes Groq + Gemini API
   keys, tests connection, enables models, Save. (Unblocks M0-AC007 deferred.)
2. F26 Agents → F26m1 Agent Model Assignment: per-agent model assigned (A1/A2/A4 ×
   primary/long-context/fallback).
3. First end-to-end A1 generation succeeds (Yogesh as Admin).
4. Akshay invited via F27m1 → magic-link → first sign-in → confirmed Lead role.
5. 6 QA Engineers invited in batch via F27 → all 6 first-sign-in within 24h.
6. Anchor project Iksula Returns (key `RET`) created in F09 → Jira OAuth connected
   in F11a/b/c → 12 projects visible.
7. Sample upload works: `return_policy_v2.xlsx` ingested → KB search returns hit.
8. UptimeRobot keep-alive shows 100% uptime for 7 consecutive days.
9. Better Stack dashboard shows 0 ERROR-level logs for 24h prior to launch.
10. $0 cost confirmed via Render + Neon + Cloudflare + Resend dashboards.

---

## Architectural patterns shipped Days 3-5 (drift item — see also `../followups.md` (r))

These patterns are **live in the codebase** but **not yet in PM1_ERD §3**. Filed
as followup `(r)`. Formal `../architecture/patterns.md` lands M1 morning.

### Pattern A — Deferred-mode services

Pioneered Day 4 for LLMGateway + EmbeddingService + R2Service + OTelExporter.
Each service that depends on optional env vars uses a try/catch in its
constructor; if env vars missing, the service enters a "deferred" state. Public
methods throw `HttpException(501, "service deferred")`. Health endpoint reports
each service's state + `deferred_reason`. Allows boot to succeed on Render Free
even when some env vars not yet provisioned. **Code:** `apps/api/src/llm/llm-gateway.service.ts`,
`apps/api/src/embedding/embedding.service.ts`, `apps/api/src/r2/r2.service.ts`,
`apps/api/src/observability/otel.config.ts`.

### Pattern B — Visual confirmation gate (CLAUDE.md Rule 13)

For every newly developed/refactored screen, post local URL + screenshots at 320px
and 1440px to Yogesh; wait for explicit "looks good, commit" approval BEFORE
running `git commit`. Established 2026-04-26 after F06 + F06b + RWD iterations
where automated checks passed but real-screen rendering revealed slider overflow

- browser-extension hydration noise + cramped form spacing. Codified in CLAUDE.md
  Rule 13.

### Pattern C — Full RWD on every ported frame (CLAUDE.md Rule 12)

41 locked HTML frames are 1600×1024 design **canvases**, NOT mandated widths.
React ports MUST be mobile-first (320px base), no fixed-pixel layout containers,
tap targets ≥44px, no horizontal scroll ≥320px. Modals (Stage 1120×860, Edit
960×720, Picker 720×640, Confirm 480×360) become full-screen Drawer sheets on
mobile. Enforced by `enforce-rwd.sh` PreToolUse hook (MS0-T034).

### Pattern D — HMAC-SHA256 chained audit_log

Every state-changing operation writes a row to `audit_log` with
`prev_hash + payload → curr_hash` (HMAC-SHA256, key in env). Chain integrity is
audited at GA gate (≥99.95%). Schema in PM1_ERD §3.13. Visible in F28 Settings &
Audit tab.

### Pattern E — Shared Zod schemas in `packages/shared`

Every API endpoint has its request + response schema in `packages/shared`. The FE
imports the same schemas for client-side validation. Eliminates schema drift
between FE and BE. Followup `(q)` (M1 morning) adds dedicated unit tests.

### Pattern F — Pre-flight memory guard (Day-4)

`EmbeddingService` checks `MODEL_MEMORY_MB[id] > heapLimit × 0.7` before loading
the model. Refuses to load if model would push past 70% of heap; logs reason +
enters deferred mode. Prevents OOM crash loops on Render Free.

### Pattern G — Production smoke test sentinel

`apps/api/test/prod-smoke.spec.ts` env-gates by `PROD_SMOKE_URL`. If env var
present at CI run, hits live `/health` + `/llm/test` + asserts deferred-mode
fields. If absent, sentinel test always runs to confirm the spec compiles.
Established Day-4 after sharp 0.32 silent postinstall failure.

---

## Drift items surfaced (Day 6)

| #   | Drift                                                                                                                                                                                                                                                                                                                        | Recommended path                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **PM1_PRD §6 / PM1_ERD §3 still cite `Xenova/bge-large-en-v1.5` (1024-dim).** Live state: bge-small (384-dim) per ADR-003 amendment + PR #20 vector(384) migration.                                                                                                                                                          | Yogesh-approved binding-spec amendment in M1 first half (~15 min edit). Plans reference the AMENDMENT, not the un-amended spec, so internally consistent.      |
| D2  | **PM1_PRD §10 / PM1_ERD §3 mention generic OTel.** Live state: Grafana Cloud OTLP + Better Stack OTLP + Slack alerts (3 named rules). Pipeline more specific than spec.                                                                                                                                                      | Capture live pipeline in this file's tech stack (done above). Recommend ADR-007 (telemetry pipeline) in M1 to formalize.                                       |
| D3  | **Architectural patterns A-G (above) not in PM1_ERD §3.** Shipped Days 3-5.                                                                                                                                                                                                                                                  | Followup `(r)` files formal `../architecture/patterns.md` in M1 morning.                                                                                       |
| D4  | **MS0-T017 + MS0-AC008 amended in M0 milestone file (commit `b2a6235`)** but parent PM1_PRD references unchanged.                                                                                                                                                                                                            | Ride along with D1 in the M1-morning binding-spec amendment.                                                                                                   |
| D5  | **Followup `(m)` R2 free-tier quota alert system** is substantial M1 user-facing scope (BE cron + FE banner + new `r2_quota_log` table) but NOT in canonical M1 milestone file.                                                                                                                                              | Captured in `02-milestones/M1-users-roles.md` as a known scope addition. Yogesh-approved milestone-file edit in M1 first half.                                 |
| D6  | **M2/M3 milestone specs cite `Qwen3-Embedding-0.6B` as if implemented** (1024-dim). Live state: bge-small. **NEW finding (May 2026 web research):** Qwen3-Embedding-0.6B-ONNX _is now available_ (`onnx-community/Qwen3-Embedding-0.6B-ONNX`, Transformers.js 3.6.0, June 2025). Migration path opens earlier than expected. | Captured in `02-milestones/M2-test-docs-kb.md` + `M3-test-cases-ai.md` as "Plan recommendation: revisit embedding model at M3 close once memory budget known." |

---

## Cross-references

- `00-project-overview.md` — whole-project view
- `02-milestones/M0-setup-infra.md` … `M6-reports-ga.md` — per-Mn detail
- `03-drift-checklist.md` — generic Mn-close template
- `04-plan-vs-actual.md` — living delivery log
- `../STATUS.md` — daily snapshot
- `../CHANGELOG.md`
- `../followups.md`
- `../audits/skill-alignment-audit.md`
- `../audits/code-audit.md`
- `../audits/2026-05-02-m0-ac-dry-run.md`
- `../architecture/adr-002-prisma-raw-split.md` · `adr-003-embedding-model.md` (+ amendment) · `adr-004-render-deployment.md` · `adr-005-r2-storage.md` · `adr-006-seed-data-centralization.md` · `adr-009-pnpm-sharp-render-deploy.md`
- `../eod-reports/` (Day 1 through Day 5, Day 6 forthcoming)
- `../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` (v8.1)
- `../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` (v2.1)
- `../../QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`
- `../../QA Nexus/PM1/PM1_milestone/M1/Milestone_M1_Users_Roles.md` (v1.0 with v8.1 banner)
- `../../QA Nexus/PM1/PM1_milestone/M{2..6}/` — per-Mn binding milestone files
