# M2 Close Report — `<FILL: YYYY-MM-DD>`

> **Template usage:** MAIN fills in this template during the M2 close
> ceremony (target: Sat 9 May 2026 EOD). Each `<FILL: ...>` marker is a
> required field. Each "→ command:" prompt is the canonical command to
> generate the data.
>
> Once filled, save as `docs/milestones/m2-completion-report.md` (drop
> the `-template` suffix).
>
> Modeled on `docs/milestones/m1-close-report-template.md` (Day-9 PR #45)
> with M2-specific adjustments (KB pipeline + RAG + doc CRUD + Render
> staging deploy).

- **Milestone:** **M2 — Knowledge Base + RAG + Document CRUD**
- **Sprint:** Sprint 42 of PM1 (per CLAUDE.md "Iksula data canon")
- **Author:** `<FILL: MAIN session>`
- **Approved by:** Yogesh Mohite (Admin)

---

## 1. Dates + duration

| Field                 | Value                                      |
| --------------------- | ------------------------------------------ |
| **Start date**        | `<FILL: YYYY-MM-DD>` (Day 1 = M2 kickoff)  |
| **End date**          | `<FILL: YYYY-MM-DD>` (close ceremony date) |
| **Calendar duration** | `<FILL: N>` days                           |
| **Working days**      | `<FILL: N>` days (per `docs/eod-reports/`) |

## 2. PRs landed in M2

> → command: `gh pr list --state merged --search "merged:>=<M2_START_DATE> base:main" --limit 100 --json number,title,mergedAt,author`

| #   | PR        | Author   | One-line summary | Merged               |
| --- | --------- | -------- | ---------------- | -------------------- |
| 1   | #`<FILL>` | `<FILL>` | `<FILL>`         | `<FILL: YYYY-MM-DD>` |
| 2   | #`<FILL>` | `<FILL>` | `<FILL>`         | `<FILL: YYYY-MM-DD>` |
| …   | …         | …        | …                | …                    |

**Total M2 PRs:** `<FILL: N>` (target: ~12-18 across BE + FE + docs)

### Day-11 BE Cascade (likely subset for the table above)

For grep convenience, the M2 BE Day-11 PRs were:

- #51 `feat(deploy)` M2 staging deployment artifacts (ADR-011)
- #53 `feat(api)` M2 Step 8 chunk-search real pgvector flip
- #57 `feat(api)` M2 RAG `/api/kb/answer` + ADR-012 lock
- #58 `chore(observability)` Day-11 platform-discipline
- #60 `feat(api)` M2 KB document CRUD (DELETE/GET cascade chunks + R2)
- #61 `feat(api)` M2 close-gate KB e2e sweep (69 tests)
- #`<FILL>` (this) `feat(api)` M2 close prep (template + verify:audit coverage)

## 3. Test counts + coverage delta

> → command (BE unit): `pnpm --filter @qa-nexus/api test 2>&1 | grep -E "Tests:|Test Suites:"`
> → command (BE e2e): `pnpm --filter @qa-nexus/api test:e2e 2>&1 | grep -E "Tests:|Test Suites:"`
> → command (FE): `pnpm --filter @qa-nexus/web test 2>&1 | grep -E "Tests:|Test Suites:"`

| Surface                           | Suites      | Tests       | Δ vs M1 close |
| --------------------------------- | ----------- | ----------- | ------------- |
| BE jest unit                      | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| BE jest e2e (m1-close + m2-close) | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| BE coverage %                     | `<FILL: %>` | —           | `+<FILL>`     |
| FE jest                           | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| Playwright (E2E)                  | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |

**M1 close baseline (for diff):**

- BE: ~322 unit / 54 m1-close e2e (per Day-10 M1 close report)
- FE: `<FILL: M1 FE count>`

## 4. Frames live in production from `PM1_UI_v2/`

> → command: `find apps/web/app -name "page.tsx" | xargs grep -l "Implements F" | sort -u`

| Frame ID                  | Route                         | Status                      | Last visual gate     |
| ------------------------- | ----------------------------- | --------------------------- | -------------------- |
| F12 KB Upload             | `/projects/[slug]/kb/upload`  | `<FILL: live / scaffolded>` | `<FILL: YYYY-MM-DD>` |
| F13 Imported Files        | `/projects/[slug]/kb/imports` | `<FILL>`                    | `<FILL>`             |
| F15 Knowledge Base        | `/projects/[slug]/kb`         | `<FILL>`                    | `<FILL>`             |
| F19 Run Console (RAG)     | `/projects/[slug]/runs`       | `<FILL>`                    | `<FILL>`             |
| F30 KB Browser            | `/projects/[slug]/kb/browse`  | `<FILL>`                    | `<FILL>`             |
| `<FILL: other M2 frames>` | …                             | …                           | …                    |

**Frames count live:** `<FILL: N>` of 41 locked frames in `PM1_UI_v2/`.

## 5. Acceptance gates status

### 5.1 KB close-gate sweep (`@M2-CLOSE-GATE` tag)

> → command: `pnpm --filter @qa-nexus/api test:e2e -- --testPathPattern m2-close`
> → OR (filter by tag): `pnpm --filter @qa-nexus/api test:e2e -- -t "@M2-CLOSE-GATE"`

- **Total assertions:** `<FILL: N>` (target ≥ 30; Day-11 baseline = 69 per PR #61)
- **Passing:** `<FILL: N>` / `<FILL: N>`
- **Status:** ☐ PASS ☐ FAIL ☐ NOT RUN
- **Notes (if failed):** `<FILL: which contracts fell over — RBAC matrix / workspace isolation / PII / relevance / RAG / cascade>`

### 5.2 Audit chain verify (full DB sweep)

> → command: `pnpm --filter @qa-nexus/api verify:audit`
> → command (M2 audit-action coverage report): `pnpm --filter @qa-nexus/api verify:audit -- --summary`

- **Workspaces checked:** `<FILL: N>`
- **Total rows verified:** `<FILL: N>`
- **Chain status:** ☐ OK ☐ BROKEN
- **First-break details (if broken):** `<FILL: workspace_id, row_id, action, reason>`

#### M2 audit-action coverage (from `--summary` flag)

> Confirms every M2 audit action wrote at least one row during the
> close-ceremony window (i.e., the live pipeline is exercising every
> audit path). Zero rows for any action = that path was never hit
> during pilot use.

| Audit action                          | Rows     | Last seen at                                           |
| ------------------------------------- | -------- | ------------------------------------------------------ |
| `kb_chunks_generated`                 | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_chunks_embedded`                  | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_document_orchestration_started`   | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_document_orchestration_completed` | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_document_orchestration_failed`    | `<FILL>` | `<FILL: ISO-8601>` (0 OK if no upload failures)        |
| `kb_search_performed`                 | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_search_failed`                    | `<FILL>` | `<FILL: ISO-8601>` (0 OK if embedder never deferred)   |
| `kb_answer_generated`                 | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_answer_failed`                    | `<FILL>` | `<FILL: ISO-8601>` (0 OK if Groq never quota-rejected) |
| `kb_document_deleted`                 | `<FILL>` | `<FILL: ISO-8601>`                                     |
| `kb_document_delete_failed`           | `<FILL>` | `<FILL: ISO-8601>` (0 OK if no R2 transient failures)  |

### 5.3 PII redaction sample-and-eyeball

> → command: query `SELECT action, payload FROM audit_log WHERE action LIKE 'kb_%' ORDER BY created_at DESC LIMIT 10;`

For each row sampled, eyeball the payload:

- ☐ NO chunk text appears (only `chunk_count` / counts)
- ☐ NO query text appears (only `query_length` + `query_token_count`)
- ☐ NO answer text appears (only `answer_length`)
- ☐ NO document title appears (only `title_length`)
- ☐ NO file bytes / R2 object content appears
- ☐ Email DOMAIN only (where applicable), never local-part

**Status:** ☐ PASS ☐ FAIL ☐ NOT RUN

### 5.4 Other M2 acceptance gates

| Gate                                                                                | Status        | Notes         |
| ----------------------------------------------------------------------------------- | ------------- | ------------- |
| Render staging `qa-nexus-api-staging` deploy GREEN (PR #51 + Yogesh dashboard work) | ☐ PASS ☐ FAIL | `<FILL>`      |
| Smoke test (`scripts/smoke-test-render.sh`) exits 0 against staging URL             | ☐ PASS ☐ FAIL | `<FILL>`      |
| `qa-nexus-staging` Neon Postgres provisioned + `pgvector` extension created         | ☐ PASS ☐ FAIL | `<FILL>`      |
| 2nd UptimeRobot monitor for staging URL (10 AM–10 PM IST window)                    | ☐ PASS ☐ FAIL | `<FILL>`      |
| `return_policy_v2.xlsx` uploaded → chunked → embedded → search-ranks-top-3          | ☐ PASS ☐ FAIL | `<FILL>`      |
| RAG `/api/kb/answer` returns cited chunks for "How long do I have to return?"       | ☐ PASS ☐ FAIL | `<FILL>`      |
| RAG empty-context short-circuit produces canonical "no info" string + skips LLM     | ☐ PASS ☐ FAIL | `<FILL>`      |
| Document delete cascade purges chunks + R2 file (verify `aws s3 ls` afterward)      | ☐ PASS ☐ FAIL | `<FILL>`      |
| All 4 RBAC roles can sign in via magic-link + access /projects                      | ☐ PASS ☐ FAIL | `<FILL: N/8>` |
| Cross-workspace KB access returns 404 (no leak) — manually verified in browser      | ☐ PASS ☐ FAIL | `<FILL>`      |

## 6. Carry-overs to M3

> Tracked in `docs/followups.md`. Below is a snapshot at M2 close.

| Followup                                                        | Severity | Description                                                        | Owner  | Target milestone |
| --------------------------------------------------------------- | -------- | ------------------------------------------------------------------ | ------ | ---------------- |
| `(af)` M3 RAG quality eval methodology                          | P3       | Curated 30-pair test set + `eval:rag` script + nightly CI baseline | BE     | M3               |
| `(z)` PDF parser re-eval gate                                   | P3       | `pdf-parse` → `pdfjs-dist` if Render upgrade approved              | BE     | M2.5             |
| `(aa)` Cookie-domain migration                                  | P3       | If pilot expands beyond `qanexus.iksula.com`                       | BE     | PM2              |
| `(l)` Embedding-model quality eval (bge-large re-litigation)    | P3       | Trigger on Render Hobby tier approval OR Qwen3-ONNX availability   | BE     | M3               |
| `(v)` Phase-1 audit of remaining locked frames                  | P3       | Spec-drift audit per Phase-1 template                              | Design | M2-M4 rolling    |
| `<FILL: any new M3-bound followups discovered during ceremony>` | …        | …                                                                  | …      | M3               |

## 7. Free-tier quota usage snapshot

> → command (Render): manual check — Render dashboard → service → "Last 30 days" usage
> → command (Neon staging): `SELECT pg_size_pretty(pg_database_size('qa_nexus_pm1'));` against staging DB + Neon dashboard "Compute usage"
> → command (Cloudflare R2): R2 dashboard → bucket → metrics
> → command (GitHub Actions): https://github.com/yogeshmohite-iksula/QA-Nexus/settings/billing → Actions usage
> → command (Groq): https://console.groq.com/usage
> → command (Gemini): https://aistudio.google.com/app/usage

| Provider                          | Free tier                                               | Used in M2     | % consumed  | Headroom for M3 |
| --------------------------------- | ------------------------------------------------------- | -------------- | ----------- | --------------- |
| **Render** (staging + prod dynos) | 750 hr/mo per service                                   | `<FILL: N>` hr | `<FILL: %>` | `<FILL>`        |
| **Neon** (staging project)        | 0.5 GB storage + 100 compute-hr/mo                      | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **Cloudflare R2**                 | 10 GB storage + 1M Class A + 10M Class B ops + 0 egress | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **GitHub Actions** (private repo) | 2,000 min/mo                                            | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **Groq**                          | 1,000 RPD `gpt-oss-120b` + 14,400 RPD `gpt-oss-20b`     | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **Gemini 2.5 Flash**              | 1,500 RPD                                               | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **Gmail SMTP** (Workspace)        | 2,000 outbound/day                                      | `<FILL>`       | `<FILL: %>` | `<FILL>`        |
| **Cloudflare Pages**              | 500 builds/mo                                           | `<FILL>`       | `<FILL: %>` | `<FILL>`        |

**Total infra cost during M2:** `$<FILL: 0.00>/month` (Hard Rule 1 binding — must be `$0.00`).

## 8. Notable wins / lessons banked

`<FILL: 3-5 short bullets — what worked unusually well, what to repeat in M3>`

Carry-forward candidates from Day-11 compound-learnings (see `.claude/memory/general.md` `## Compound learnings`):

- RAG citation drift solved by making `[chunk: <UUID>]` marker identical in input chunk header AND output citation
- Audit-composition rule: when one BE service composes another that already audits, don't re-audit — workspace isolation + audit row come for free
- PII guard on search/RAG audits: counts/provider/tokens only, NEVER text — pinned by negative `.toContain` assertions

## 9. Notable misses / debt accrued

`<FILL: 3-5 short bullets — what slipped, what we'd do differently, debt to repay in M3>`

## 10. Sign-off

| Role                   | Name           | Sign-off | Date                 |
| ---------------------- | -------------- | -------- | -------------------- |
| Admin                  | Yogesh Mohite  | ☐        | `<FILL: YYYY-MM-DD>` |
| QA Lead                | Akshay Panchal | ☐        | `<FILL: YYYY-MM-DD>` |
| MAIN session (process) | MAIN (Claude)  | ☐        | `<FILL: YYYY-MM-DD>` |

---

## Cross-references

- `docs/milestones/m1-close-report-template.md` — sister M1 template (precedent)
- `docs/milestones/m1-completion-report.md` — filled M1 report (Day-10 ceremony)
- `docs/milestones/M0_completion_report.md` — M0 close (precedent for the template format)
- `docs/eod-reports/` — daily Day-N status reports for M2
- `docs/CHANGELOG.md` — `[Unreleased]` will be cut to M2 release section on close
- `docs/followups.md` — backlog snapshot for §6 carry-overs
- `apps/api/test/m2-close/kb-sweep.e2e-spec.ts` — `@M2-CLOSE-GATE` tagged tests for §5.1
- `scripts/verify-audit-chain.ts` — runs §5.2 audit chain verify (`pnpm --filter @qa-nexus/api verify:audit`); `--summary` flag prints M2 audit-action coverage table
- `docs/architecture/adr-011-m2-staging-deployment.md` — staging topology (Render + Neon + UptimeRobot)
- `docs/architecture/adr-012-kb-rag-prompt-strategy.md` — RAG prompt + citation format + sampling defaults
