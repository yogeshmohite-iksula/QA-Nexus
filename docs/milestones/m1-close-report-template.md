# M1 Close Report — `<FILL: YYYY-MM-DD>`

> **Template usage:** MAIN fills in this template during the M1 close
> ceremony (target: Wed 6 May 2026 EOD). Each `<FILL: ...>` marker is a
> required field. Each "→ command:" prompt is the canonical command to
> generate the data.
>
> Once filled, save as `docs/milestones/m1-completion-report.md` (drop
> the `-template` suffix).

- **Milestone:** **M1 — Users, Roles, Auth & Audit**
- **Sprint:** Sprint 42 of PM1 (per CLAUDE.md "Iksula data canon")
- **Author:** `<FILL: MAIN session>`
- **Approved by:** Yogesh Mohite (Admin)

---

## 1. Dates + duration

| Field                 | Value                                                  |
| --------------------- | ------------------------------------------------------ |
| **Start date**        | `<FILL: YYYY-MM-DD>` (Day 1 = first M1 task in flight) |
| **End date**          | `<FILL: YYYY-MM-DD>` (close ceremony date)             |
| **Calendar duration** | `<FILL: N>` days                                       |
| **Working days**      | `<FILL: N>` days (per `docs/eod-reports/`)             |

## 2. PRs landed in M1

> → command: `gh pr list --state merged --search "merged:>=<M1_START_DATE> base:main" --limit 100 --json number,title,mergedAt,author`

| #   | PR        | Author   | One-line summary | Merged               |
| --- | --------- | -------- | ---------------- | -------------------- |
| 1   | #`<FILL>` | `<FILL>` | `<FILL>`         | `<FILL: YYYY-MM-DD>` |
| 2   | #`<FILL>` | `<FILL>` | `<FILL>`         | `<FILL: YYYY-MM-DD>` |
| …   | …         | …        | …                | …                    |

**Total M1 PRs:** `<FILL: N>` (target: ~25-35 across BE + FE + docs)

## 3. Test counts + coverage delta

> → command (BE): `pnpm --filter @qa-nexus/api test 2>&1 | grep -E "Tests:|Test Suites:"`
> → command (FE): `pnpm --filter @qa-nexus/web test 2>&1 | grep -E "Tests:|Test Suites:"`

| Surface          | Suites      | Tests       | Δ vs M0 close |
| ---------------- | ----------- | ----------- | ------------- |
| BE jest unit     | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| BE jest e2e      | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| BE coverage %    | `<FILL: %>` | —           | `+<FILL>`     |
| FE jest          | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |
| Playwright (E2E) | `<FILL: N>` | `<FILL: N>` | `+<FILL>`     |

**M0 baseline (for diff):**

- BE: 213 unit / 0 e2e / N% coverage (per `docs/milestones/M0_completion_report.md`)
- FE: `<FILL: M0 FE count>`

## 4. Frames live in production from `PM1_UI_v2/`

> → command: `find apps/web/app -name "page.tsx" | xargs grep -l "Implements F" | sort -u`

| Frame ID                  | Route                         | Status                      | Last visual gate     |
| ------------------------- | ----------------------------- | --------------------------- | -------------------- |
| F06 Sign In               | `/auth/sign-in`               | `<FILL: live / scaffolded>` | `<FILL: YYYY-MM-DD>` |
| F06b Magic-link sent      | `/auth/sign-in/sent`          | `<FILL>`                    | `<FILL>`             |
| F08b Home                 | `/`                           | `<FILL>`                    | `<FILL>`             |
| F09 Projects List         | `/projects`                   | `<FILL>`                    | `<FILL>`             |
| F11 Imports / Upload      | `/projects/[slug]/upload`     | `<FILL>`                    | `<FILL>`             |
| F14 Test Cases            | `/projects/[slug]/test-cases` | `<FILL>`                    | `<FILL>`             |
| F15 Knowledge Base        | `/projects/[slug]/kb`         | `<FILL>`                    | `<FILL>`             |
| F26 LLM Provider Config   | `/admin/llm-providers`        | `<FILL>`                    | `<FILL>`             |
| F27 Admin / Users         | `/admin/users`                | `<FILL>`                    | `<FILL>`             |
| F28 Settings & Audit      | `/admin/audit`                | `<FILL>`                    | `<FILL>`             |
| `<FILL: other M1 frames>` | …                             | …                           | …                    |

**Frames count live:** `<FILL: N>` of 41 locked frames in `PM1_UI_v2/`.

## 5. Acceptance gates status

### 5.1 RBAC sweep (`@M1-CLOSE-GATE` tag)

> → command: `pnpm --filter @qa-nexus/api test:e2e -- --testPathPattern m1-close`

- **Total assertions:** `<FILL: N>` (target ≥ 30)
- **Passing:** `<FILL: N>` / `<FILL: N>`
- **Status:** ☐ PASS ☐ FAIL ☐ NOT RUN
- **Notes (if failed):** `<FILL: which roles × endpoints fell over>`

### 5.2 Audit chain verify (full DB sweep)

> → command: `pnpm --filter @qa-nexus/api verify:audit`

- **Workspaces checked:** `<FILL: N>`
- **Total rows verified:** `<FILL: N>`
- **Chain status:** ☐ OK ☐ BROKEN
- **First-break details (if broken):** `<FILL: workspace_id, row_id, action, reason>`

### 5.3 Day-0 admin seed

> → command: query `audit_log WHERE action = 'day0_admin_seeded'`

- **Seed event recorded:** ☐ YES ☐ NO
- **Seed timestamp:** `<FILL: ISO-8601>`
- **Seeded email domain:** `<FILL: iksula.com>` (PII-redacted per `.claude/rules/security.md`)
- **TB-002 user row exists with `role=Admin`:** ☐ YES ☐ NO
- **Followup `(x)` closed:** ☐ YES ☐ NO

### 5.4 Other M1 acceptance gates

| Gate                                                | Status        | Notes         |
| --------------------------------------------------- | ------------- | ------------- |
| Magic-link 10-min TTL active in prod                | ☐ PASS ☐ FAIL | `<FILL>`      |
| Cookie `Domain=.qanexus.iksula.com` set on callback | ☐ PASS ☐ FAIL | `<FILL>`      |
| Cookie `Partitioned: true` (CHIPS-compliant)        | ☐ PASS ☐ FAIL | `<FILL>`      |
| `nextCookies()` plugin active in `auth.config.ts`   | ☐ PASS ☐ FAIL | `<FILL>`      |
| BetterAuth session shared across `app.` ↔ `api.`    | ☐ PASS ☐ FAIL | `<FILL>`      |
| Gmail SMTP outbound delivery (ADR-008 §6 warmup)    | ☐ PASS ☐ FAIL | `<FILL>`      |
| All 8 pilot users invited + accepted                | ☐ PASS ☐ FAIL | `<FILL: N/8>` |
| F27 Admin tab shows full team roster                | ☐ PASS ☐ FAIL | `<FILL>`      |
| RBAC denied events captured in audit                | ☐ PASS ☐ FAIL | `<FILL>`      |

## 6. Carry-overs to M2

> Tracked in `docs/followups.md`. Below is a snapshot at M1 close.

| Followup                                                        | Severity | Description                                           | Owner  | Target milestone |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------- | ------ | ---------------- |
| `(x)` Day-0 admin seed gap                                      | P2       | `<FILL: closed / open>`                               | BE     | M1 (closing now) |
| `(z)` PDF parser re-eval gate                                   | P3       | `pdf-parse` → `pdfjs-dist` if Render upgrade approved | BE     | M2.5             |
| `(aa)` Cookie-domain migration                                  | P3       | If pilot expands beyond `qanexus.iksula.com`          | BE     | PM2              |
| `(l)` Embedding-model quality eval                              | P3       | bge-large M3 re-litigation if off Free tier           | BE     | M3               |
| `(v)` Phase-1 audit of 37 remaining locked frames               | P3       | Spec-drift audit per Phase-1 template                 | Design | M2-M4 rolling    |
| `<FILL: any new M2-bound followups discovered during ceremony>` | …        | …                                                     | …      | M2               |

## 7. Free-tier quota usage snapshot

> → command (Render): manual check — Render dashboard → service → "Last 30 days" usage
> → command (Neon): `SELECT pg_size_pretty(pg_database_size('neondb'));` + Neon dashboard "Compute usage"
> → command (Cloudflare R2): R2 dashboard → bucket → metrics
> → command (GitHub Actions): https://github.com/yogeshmohite-iksula/QA-Nexus/settings/billing → Actions usage
> → command (Groq): https://console.groq.com/usage
> → command (Gemini): https://aistudio.google.com/app/usage

| Provider                          | Free tier                                               | Used in M1                   | % consumed                | Headroom for M2 |
| --------------------------------- | ------------------------------------------------------- | ---------------------------- | ------------------------- | --------------- |
| **Render** (Hobby web service)    | 750 hr/mo dyno                                          | `<FILL: N>` hr               | `<FILL: %>`               | `<FILL>`        |
| **Neon** (free tier)              | 0.5 GB storage + 100 compute-hr/mo                      | `<FILL: MB>` / `<FILL: hr>`  | `<FILL: %>` / `<FILL: %>` | `<FILL>`        |
| **Cloudflare R2**                 | 10 GB storage + 1M Class A + 10M Class B ops + 0 egress | `<FILL: MB>` / `<FILL: ops>` | `<FILL: %>`               | `<FILL>`        |
| **GitHub Actions** (private repo) | 2,000 min/mo                                            | `<FILL: min>`                | `<FILL: %>`               | `<FILL>`        |
| **Groq** (free)                   | 1,000 RPD `gpt-oss-120b` + 14,400 RPD `gpt-oss-20b`     | `<FILL: RPD>`                | `<FILL: %>`               | `<FILL>`        |
| **Gemini 2.5 Flash** (free)       | 1,500 RPD                                               | `<FILL: RPD>`                | `<FILL: %>`               | `<FILL>`        |
| **Gmail SMTP** (Workspace)        | 2,000 outbound/day                                      | `<FILL: emails/day>`         | `<FILL: %>`               | `<FILL>`        |
| **Cloudflare Pages**              | 500 builds/mo                                           | `<FILL: builds>`             | `<FILL: %>`               | `<FILL>`        |

**Total infra cost during M1:** `$<FILL: 0.00>/month` (Hard Rule 1 binding — must be `$0.00`).

## 8. Notable wins / lessons banked

`<FILL: 3-5 short bullets — what worked unusually well, what to repeat in M2>`

## 9. Notable misses / debt accrued

`<FILL: 3-5 short bullets — what slipped, what we'd do differently, debt to repay in M2>`

## 10. Sign-off

| Role                   | Name           | Sign-off | Date                 |
| ---------------------- | -------------- | -------- | -------------------- |
| Admin                  | Yogesh Mohite  | ☐        | `<FILL: YYYY-MM-DD>` |
| QA Lead                | Akshay Panchal | ☐        | `<FILL: YYYY-MM-DD>` |
| MAIN session (process) | MAIN (Claude)  | ☐        | `<FILL: YYYY-MM-DD>` |

---

## Cross-references

- `docs/milestones/M0_completion_report.md` — prior milestone close (template precedent)
- `docs/eod-reports/` — daily Day-N status reports for M1
- `docs/CHANGELOG.md` — `[Unreleased]` section will be cut to M1 release section on close
- `docs/followups.md` — backlog snapshot for §6 carry-overs
- `apps/api/test/m1-close/rbac-sweep.e2e-spec.ts` — `@M1-CLOSE-GATE` tagged tests for §5.1
- `scripts/verify-audit-chain.ts` — runs §5.2 audit chain verify (`pnpm --filter @qa-nexus/api verify:audit`)
- `docs/architecture/adr-007-cookie-domain.md` — cookie-domain decision (M1 PR #43)
- `docs/architecture/adr-008-email-service-gmail-smtp.md` — email transport (M1 PR #26)
