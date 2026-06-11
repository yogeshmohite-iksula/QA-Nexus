# BE PRD-Conformance Baseline (Phase A knowledge index) — 2026-06-11 (Day-32)

> **Purpose:** the spec-grounded baseline for the PRD-conformance verification Yogesh requested
> before he tests the system. **The contract:** what the PRD mandates for **PM1 MUST WORK NOW**;
> what the PRD defers to **PM2-PM4 is acceptable as a 501 stub / canned fallback**. This Phase-A
> doc maps every requirement → PM1-vs-deferred → actual shipped status. Phases B/C (live
> verification) + D (the conformance verdict doc) follow post-merge of #261/#262/#263 + Render
> redeploy.
> **Sources:** PM1_PRD.md **v8.1** + PM1_ERD.md **v2.1** (full reads via 3 read-only audit agents) +
> CHANGELOG + EODs + Day-32 audit (PR #261) + **a live pilot-DB probe (2026-06-11)**.
> **Audited base:** `origin/main` `cb1f2c4`. #261/#262/#263 still OPEN.

## 0. Two corrections to stale inputs (honesty over the cached docs)

- **Pilot DB is POPULATED** (live probe 2026-06-11): `workspace 1 · user 8 · project 5 · requirement 30 ·
testCase 63 · testSuite 5 · defect 25 · auditLog 158` (testRun 0, kbDocument 0 = legitimately empty —
  users create those). The seed (`seed-iksula-pilot.ts`) was executed `--commit` Sunday + chain-verified.
  Any doc citing "0 projects/reqs/TCs" (pre-seed Day-32 §5.1 snapshot) is **stale** — Yogesh tests against real data.
- The **Day-32 full conformance audit** (`docs/audits/2026-06-11-day-32-be-full-conformance-audit.md`) **exists** on
  PR #261 (not yet merged → not on this branch); its findings are valid + carried below.

## A. PRD requirement matrix — PM1-mandated vs PM2-4-deferred (PM1_PRD v8.1)

| ID                       | PRD §           | Requirement                                                                                | Class            |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------ | ---------------- |
| FR-001..003              | §9.1            | Role+membership project workspaces · 4-role RBAC · project CRUD                            | **PM1**          |
| FR-004/005               | §9.1/9.2B       | Ingest versioned PRDs · 12 AI QA-doc templates (TipTap+approval)                           | **PM1**          |
| FR-006/007/008/009       | §9.1/9.2C       | TC CRUD+tag+prioritize · A1 draft gen · A2 dup-detect · TC↔req RTM                         | **PM1**          |
| FR-010/011/012           | §9.1/9.2E       | Manual runs+evidence · defect-from-fail prefilled · A4 RCA                                 | **PM1**          |
| FR-013                   | §9.1/9.2E/12.11 | **Jira bidirectional sync** (OAuth 3LO, webhook+poll)                                      | **PM1**          |
| FR-014                   | §9.1/9.2F       | Reporting: 4 basic reports + Exec Dashboard 5-KPI + ROI                                    | **PM1**          |
| FR-015                   | §9.1            | Immutable audit log of high-value actions incl. AI usage                                   | **PM1**          |
| FR-016/017               | §9.1            | Global search (⌘K) · RAG knowledge retrieval                                               | **PM1** (Should) |
| FEAT-Onboard             | §20.1           | 6-screen pilot onboarding walkthrough (<15 min)                                            | **PM1**          |
| FEAT-CI/Slack/Confluence | §12.11          | CI webhook · Slack notify (webhook) · Confluence read                                      | **PM1**          |
| FEAT-Reports10           | §9.2F           | 10 named dashboards "Full Reporting (M6, Post-GA)"                                         | **PM2-4**        |
| OOS A3/A5/A6/A7          | §8.2            | Low-code automation editor · change-based selection · device grid · adv. visual-regression | **PM2-4**        |

## B. The 5 contested-area rulings + ACTUAL status (the heart of the verification)

| Area                       | PRD ruling (cite)                                                                                               | Actual code status NOW                                                                                                                           | Verdict                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **Jira sync**              | **PM1** (FR-013 Must §9.1; §8.1; M4 exit §15.3)                                                                 | **Inbound webhook LIVE + HMAC-verified** (ADR-020, 15 events); **outbound connect/sync = 501 stubs**                                             | 🟠 **PARTIAL — PM1 gap** (outbound stubbed)       |
| **A1 Composer** (TC gen)   | **PM1**, ≥80% auto-approve / A1<30s (§9.2C, NFR-003, ERD §7 ≥80% golden)                                        | **LIVE** (`/requirements/:id/test-cases/generate`); **AC011 eval DEFERRED Day-29** (not measured)                                                | 🟡 live, **quality unverified**                   |
| **A2 Curator** (dedup)     | **PM1**, ≥60% TP / <5% FP / <5s (§9.2C, ERD §7)                                                                 | **LIVE** (pgvector HNSW cosine, ADR-014); **AC021 eval DEFERRED Day-29**                                                                         | 🟡 live, **quality unverified**                   |
| **A4 Sherlock** (RCA)      | **PM1**, **top-2 ≥70%** on 50-defect golden set / A4<30s / <70%-confidence-blocks (§9.2E, **ERD §7 top-2≥70%**) | **LIVE + guarded** (#262). **AC042 top-2 = 64%** — clears the **relaxed M4 gate ≥40%** (lowered Day-18, `M4_v2`), **below the PRD/ERD ≥70% bar** | 🟠 **functional, below spec bar** — Yogesh's call |
| **Reports**                | basic 4 + Exec = **PM1**; 10-dashboard suite = **PM2-4** (§9.2F)                                                | **Backend LIVE** (ADR-021, 6 builders + SWR + cron); **F23 + F25 FE ports shipped**                                                              | ✅ **PM1 met**                                    |
| **F26 Agents / F27 Users** | **PM1** (FR-002, §9.2A; v8.1 added F26m1)                                                                       | F27 **backend LIVE** (`/api/users`,`/api/invitations`); **F26/F27 FE page ports DEFERRED Day-29 Tier-2** (ADR-022 §5.9)                          | 🟡 backend met; FE ports deferred                 |
| **Onboarding/invite**      | **PM1** (§9.2A invites + audit; §20.1 6-screen)                                                                 | **Invitation API LIVE + audited** (create/accept/resend/revoke, SHA-256 tokens); onboarding pages built                                          | ✅ **PM1 met**                                    |

## C. NFR targets + measurement status (PM1_PRD §10.1)

| NFR                   | Target                                                                                    | Measured?                                                              |
| --------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| NFR-001 page load     | p50<1.5s / **p95<3s**                                                                     | ❌ DEFERRED Day-29 (no CWV trace)                                      |
| NFR-002 API latency   | p50<200ms / **p95<500ms**                                                                 | ❌ DEFERRED Day-29                                                     |
| NFR-003 agents        | A1<30s · A2<5s · A4<30s (ERD tightens A1<10s/A2<500ms/A4<15s)                             | A4 **pilot p95<20s** (ADR-024) ✅; A1/A2 **DEFERRED**                  |
| NFR-011 availability  | 99.5% MVP; RTO<1h/RPO<15min                                                               | UptimeRobot keep-alive live; weekly pg_dump backups verified (7 in R2) |
| NFR-013..020 security | RLS+guards, AES-256, TLS1.3, immutable audit, PII mask                                    | audit immutability **proven live**; RLS runtime-enable **unverified**  |
| NFR-026 a11y          | WCAG 2.1 AA, Axe 0-violation core flows                                                   | ❌ no audit run (FE)                                                   |
| Cost gate §12.8       | **$0/mo**                                                                                 | ✅ all quotas GREEN (Day-32 B4)                                        |
| Pilot KPI gate §15.2  | ≥80% DAU · ≥70% defect flow · ≥80% A1 auto-approve · **0 critical/high vulns** · ≥95% e2e | measured during pilot                                                  |

## D. ERD binding invariants — and where the ERD DELEGATES (PM1_ERD v2.1)

The ERD asserts the invariants exist but **does not specify their concrete shape** → those must be sourced from PRD/CLAUDE.md/code, not the ERD:

- **RBAC (§3.4/§5):** roles enum `Admin/Lead/QAEngineer/Stakeholder`; only explicit gates are **LLM config = Admin-only** + **agent-assignment = Admin+Lead**; **no per-action capability matrix** → derive expected gating from PRD §9 + verify on every endpoint (NFR-014 "all 4 roles gated, positive+negative"). **AUDIT GAP.**
- **Audit chain (§3.13/§8.7):** "HMAC-SHA256 chained immutable rows", "every state-change writes one row", chain integrity **≥99.95%** (§10#9). **No column list / trigger / REVOKE DDL in the ERD** — that's impl (proven live per Day-32). **AUDIT GAP (schema lives in code).**
- **Tenancy/RLS (§8.1/§5):** RLS keyed on **workspace_id AND project_id**; `kb_document.project_id NULL`=workspace-scoped. **Per-request tenant mechanism + cross-tenant 404-vs-403 NOT specified** → derive from convention (#262 used 404). **AUDIT GAP.**
- **Zod boundary:** "every endpoint → shared `packages/shared` schema" is a **CLAUDE.md Rule 10 invariant, NOT in the ERD** — cite CLAUDE.md, not ERD.
- **LLM gateway (§4 CO-017/§8.4):** all calls funnel Groq→Gemini fallback (429/503 retry; 4xx no-fallback); keys via env, never logged.
- **Agents (§7):** A1 ≥80% golden + ≥80% auto-approve; A2 <500ms/≥60% TP/<5% FP; **A4 top-2 ≥70% on 50-defect DeepEval golden set**, RCA<15s, zero false-high-confidence. Eval = DeepEval on Colab, **never blocks prod**.
- **Jira (§3.7/§5):** **OAuth 3LO only** in PM1 (token-auth=PM3); tokens encrypted at rest; inbound webhook **MUST HMAC-verify**.

## E. Stale-spec supersessions (mark as documented, NOT violations)

1. **§3.12 "LangGraph" + "Eval Gate (LangSmith)"** → ban-listed (Rule 5); reality = NestJS TS modules + DeepEval (§4 supersedes).
2. **Qwen3-Embedding-0.6B / 1024-dim** (§6/§8.4/§8.5) → reality **BGE-small / 384-dim** (header amendment + ADR-003; schema already `vector(384)`).
3. **HashiCorp Vault transit** (§3.13/§3.7/§5/§8.7) → ban-listed; reality = Render env vars (§8.7 defers OpenBao to PM2+).
4. **Redis working-memory 4-tier** (§3.12 diagram) → §7 corrects to 3-tier (PG/pgvector/R2), Redis dropped (ban-listed).
5. ERD prose "25 endpoints" vs 29 (EP-001..029) — stale count, not a conflict.

## F. Milestone status ledger (ACTUAL, not the PRD's stale July calendar)

| M       | Delivers                                                      | Status NOW                                                 | Evidence               |
| ------- | ------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------- |
| M0      | infra/RLS-SQL/8-user seed                                     | **DONE** (2026-05-03)                                      | CHANGELOG [0.1.0]      |
| M1      | RBAC/invites/users/audit/email                                | **DONE**                                                   | CHANGELOG [M4] Day-6/9 |
| M2      | KB+RAG (bge-small/384)                                        | **DONE**                                                   | ADR-014; Day-5         |
| M3      | A1+A2 (live)                                                  | **PARTIAL** — code live, **AC011/AC021 evals Day-29**      | Day-13/14              |
| M4      | runs/defects/A4/Jira-inbound                                  | **PARTIAL** — A4 64% (relaxed gate), **Jira outbound 501** | [M5 CORE]; Day-20/21   |
| M5 CORE | F19/F22/F23/F25/F28 ports + reports BE + Jira ADR-020 + AC042 | **DONE (core)**; F26/F27 FE → Day-29                       | [M5 CORE] 2026-05-27   |
| M6      | GA hardening                                                  | **PENDING**                                                | —                      |

## G. PM1-mandated GAP register (the focus list for Phase B/C verification)

| #   | Gap                                                                         | PRD basis            | Class                 | Est. effort                                       |
| --- | --------------------------------------------------------------------------- | -------------------- | --------------------- | ------------------------------------------------- |
| G1  | **Outbound Jira connect/sync = 501**                                        | FR-013 PM1           | 🟠 PM1 functional gap | new feature (M4 carry)                            |
| G2  | **A4 RCA top-2 = 64% < ≥70% PRD/ERD bar** (clears relaxed ≥40%)             | §9.2E/ERD§7          | 🟠 PM1 quality gap    | prompt-tune / accept relaxed gate (Yogesh ruling) |
| G3  | **A1/A2 quality unmeasured** (AC011/AC021 deferred)                         | §9.2C/ERD§7          | 🟡 verification gap   | run evals (~½ day)                                |
| G4  | **NFR-001/002/003 prod numbers unmeasured**                                 | §10.1                | 🟡 verification gap   | NFR_PROBE_TOKEN + probe (~3 lines + run)          |
| G5  | **RLS runtime-enabled state unverified** (+ 8 post-M0 tables, audit REVOKE) | ERD §8.1, NFR-014/16 | 🟡 hygiene/security   | Day-32 audit ledger                               |
| G6  | **501 stub endpoints (defect actions, Jira) lack guards**                   | NFR-014              | 🟡 hygiene            | ~per-stub @Roles                                  |
| G7  | **F26/F27 FE page ports deferred**                                          | FR-002               | 🟡 (FE) Tier-2 Day-29 | FE scope                                          |

## H. Phase B/C plan (Saturday, after #261/#262/#263 merge + Render redeploy)

- **B (workflow conformance):** new-user lifecycle (uninvited→401 ✓ / invited→data) · existing-user CRUD per entity (audit actorId real, RBAC matrix, cross-tenant 404) · Admin surface · every-button BE backing.
- **C (live functional):** auth+session lifecycle · CRUD+audit per entity · agent invocations (A1/A2/A4, quota) · audit chain live probe + tamper test · quota/NFR.
- ⚠ **Live curls Saturday need Yogesh's terminal** — inline HTTP is hook-blocked from this session (established repeatedly); I supply exact commands + interpret.
- **D deliverable:** `docs/audits/2026-06-12-fri-be-prd-conformance-verification.md` — GREEN/AMBER/RED + Yogesh-test-ready Y/N/CONDITIONAL.

## I. Provisional Phase-A read

**AMBER, test-ready-with-caveats.** PM1 backend is broadly conformant + the pilot DB has real Iksula data to click through. The named PM1 gaps are **G1 (Jira outbound 501)** + **G2 (A4 64% < 70%)** — both _functional-but-below-PRD-bar_, not _broken_ — plus unmeasured quality/NFR (G3/G4). None is a hard "system doesn't work." The Phase B/C live verification (Saturday) confirms or downgrades this. **Cross-ref:** Day-32 audit (PR #261), `feedback_*` memory patterns applied.
