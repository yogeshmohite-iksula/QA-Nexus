# MILESTONE M5: AUTOMATION + BASIC REPORTS + MVP LAUNCH

> ⚠️ **Tech stack updated 2026-04-25 — see PM1_PRD v8.1 / PM1_ERD v2.1 as binding. M5 is the pilot launch milestone — cost gate and reliability gates matter.**
> The task list below was written against the v1.0 self-hosted vision. For the actual M5 build:
> - **Reports Studio (F23):** template-based PDF/Excel/HTML export. 4 PM1 templates (see PM1_ERD v2.1 §6 EP-016). Inline SVG charts (line/bar) — NO heavy charting library, just hand-crafted SVG paths.
> - **Executive Dashboard (F25):** Prove mode with ivory canvas (#FAFAF8) — the ONLY frame that flips workspace chrome's main-area palette from dark to light. Stakeholder-facing only.
> - **QA Value Dashboard (F24):** AI benefit analytics with 4 hero metrics. Provenance footnotes on every claim.
> - **Agents page (F26):** 3 agent cards (A1, A2, A4), autonomy ladder, 6 guardrail toggles, 4-run eval table, 5 recent decisions, guardrail events log. v2.10 added "Configure model" button on each agent card → opens F26m1 Agent Model Assignment Modal.
> - **Settings & Audit (F28):** 6 PM1 tabs (General, Branding, Data Retention, Integrations Health, Audit Log, Billing) + 2 PM3+ preview tabs (SSO/SAML, Compliance). Audit Log tab shows HMAC-SHA256 chain integrity ≥99.95%. v2.10 added "+ Add LLM Provider" button under Integrations Health → opens F28m1 LLM Provider Configuration Modal.
> - **Pilot launch infrastructure (Day 1 of pilot is F28m1 + F26m1 setup):** Admin (Yogesh) signs in → F28 → F28m1 paste Groq API key → Test connection → enable models → Save → F26 → F26m1 per-agent model assignment → first A1 generation works end-to-end.
> - **Acceptance gates for pilot launch (locked v2.1 PM1_ERD §10):** All 41 frames render correctly, 3 agents pass eval golden sets (A1 ≥80%, A2 ≥60% true-dup with <5% FP, A4 ≥70% top-2 RCA accuracy), HMAC chain integrity ≥99.95%, **monthly cost = $0**, 6 of 8 pilot users complete the end-to-end flow without engineer intervention.
> - **Internal pilot scope:** 8 Iksula users (6 QA + 1 Lead = Yogesh + 1 Higher Authority unconfirmed) × 12 hr/day × 1-2 month duration. Anchor project: Iksula Returns. Sprint 42, Day 9 of 14. Release R-2026-04-PaymentV2.
> - **Frontend versions:** Next.js 15 + React 19 + Tailwind 4 + shadcn/ui + Sonner + Framer Motion (for F19 pulsing pill, F25 Prove mode transitions).
> - **Total monthly cost gate: $0** for pilot duration. Migration to Render Starter $7/mo only if cold-start UX outgrows the UptimeRobot keep-alive (low risk for 8 users).
>
> Use this M5 file for the launch playbook + acceptance criteria. For binding cost / reliability / launch criteria, defer to PM1_PRD v8.1 §15 (Delivery Roadmap), PM1_PRD §20 (Launch Checklist), and PM1_ERD v2.1 §10 (Acceptance Gates).

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M5 (Weeks 16–18 of 18-week MVP)  
**Version:** 1.0 (Final)  
**Date Created:** 2026-04-21  
**Status Badge:** On Track → MVP Launch Gate  
**Duration:** 3 weeks (2026-07-27 → 2026-08-16)

---

## EXECUTIVE SUMMARY

M5 closes the MVP: **Playwright automation runner** ships with async job execution (Hatchet workers), R2 artifact storage, AI-assisted step generation (gated), flake detection (5-run strategy), and **basic reports** (3 KPI dashboards + trend charts). Pilot onboarding, MVP readiness checklist, and go/no-go gate lock on 2026-08-16. Two to three internal Iksula projects launch live.

**Mission:** Ship automation infrastructure + foundational reporting to enable pilots to log defects and track quality trends without manual assembly.

**Key Deliverables:**
- Playwright runner (headed/headless, isolated Hatchet workers, R2 uploads)
- Scheduled & on-demand runs via Hatchet cron + API
- AI step generation (LangGraph variant; `ai.auto_playwright` flag)
- Flake detection (5-run confidence, 20–80% pass rate threshold)
- Basic reports (3 dashboards: run summary, defect summary, 30-day trend)
- MVP launch checklist + pilot onboarding docs
- Zero P0 bugs, <3 P1, observability green for 7 days

---

## CONTEXT: WHAT WAS DELIVERED BEFORE

**M0–M4 Summary:** Authentication (4-role RBAC, BetterAuth), project workspace (CRUD, Jira key config), knowledge base + 12 document templates (A1 context-aware generation), test case authoring (TipTap editor, A2 dedup, RTM linking), test execution (manual runs, auto-evidence capture: screenshot + HAR + console logs + env snapshot), defects (A4 5-layer RCA, 4-category classification), Jira 2-way sync (OAuth 2.0, webhook + 2-min poll), reports framework (Daily/Weekly/Sprint/Release templates, auto-population, PDF export).

**Deployment State:**
- Vercel (frontend) + Oracle VM (backend: NestJS, FastAPI, Ollama Gemma 4, PostgreSQL, Redis, Neo4j)
- Cloudflare R2 operational (evidence storage)
- Langfuse + SigNoz + GlitchTip active (observability)
- Feature flags (Unleash): A1/A2/A4/Jira sync disabled by default; M5 enables basic reports + command-K

**Available Databases:**
- `test_runs`, `test_results`, `evidence_files` (M3)
- `defects`, `defect_categories` (M3)
- `reports`, `report_templates` (M4)
- `automation_suites` placeholder ready (M0 schema)

---

## TECH STACK (M5 SCOPE)

| Component | Version | Purpose | Status | Milestone |
|-----------|---------|---------|--------|-----------|
| **Playwright** | 1.48+ | Browser automation runner (headed/headless, cross-browser) | Configured | M5 |
| **Hatchet (Postgres backend)** | 0.33+ | Async job queue for automation + reports | Running (M1+) | M5 (new worker pool) |
| **Cloudflare R2** | Live | Evidence storage + artifact blobs (video, trace, screenshots) | Operational (M3+) | M5 |
| **LangGraph** | 0.2.15+ | Agent orchestration variant for step generation | Ready (M1+) | M5 |
| **PostgreSQL 15** | 15.x | Automation run schema + flake signals + materialized views | Live (M0+) | M5 |
| **Redis 7** | 7.x | Flake detection cache (5-run window) | Live (M0+) | M5 |
| **Ollama Gemma 4** | 2026-04 | LLM for AI step generation (fallback: Gemini 2.5 Flash) | Live (M1+) | M5 |
| **recharts** | 2.12+ | Frontend charts for basic reports (React components) | Ready (M4+) | M5 |
| **Unleash** | 5.3+ | Feature flags (`automation.playwright_runner`, `ai.auto_playwright`, `reports.basic_v1`) | Live (M0+) | M5 |

---

## DEFINITION OF READY (DoR)

**Prerequisites Ensuring Viable Kickoff:**

1. Test execution data seeded (≥100 test runs with results, ≥500 results across 3 pilot projects)
2. Defect data mature (≥100 defects with evidence, RCA complete, Jira sync proven)
3. Report templates tested (Daily, Weekly, Sprint queries validated on staging DB)
4. Hatchet infrastructure confirmed (job queue responsive, retry logic tested)
5. Playwright environment setup (headed + headless modes working in Docker on Oracle VM)
6. Pilot projects identified + contacts confirmed (2–3 Iksula internal projects ready to onboard week 1)
7. Performance baselines captured (doc gen p95 <60s, RCA p95 <10s, API p95 <300ms)
8. Feature flag infrastructure operational (Unleash SDKs deployed, flag registry synchronized)
9. Observability dashboards prepared (SigNoz + GlitchTip dashboards created for M5 metrics)
10. Load test plan finalized (synthetic user scenarios, VU count, ramp-up strategy)

---

## MILESTONE ENTRY CRITERIA

1. M4 DoD fully satisfied (reports + ROI dashboard live, all tests green)
2. Playwright + Hatchet integration tested in dev (simple test case → Hatchet job → R2 artifact)
3. Pilot onboarding docs drafted (checklist, success metrics, support channel setup)
4. Feature flag rollout strategy documented (`automation.playwright_runner` dark launch → internal canary → GA)
5. MVP readiness gate criteria published (P0/P1 thresholds, observability SLOs, pilot engagement targets)
6. Test data pipeline operational (factories for generating automation runs, flake scenarios)

---

## TASK BREAKDOWN (WEEK-WISE)

### WEEK 1: AUTOMATION RUNNER INFRA (2026-07-27 → 2026-08-02)

**W1 Goal:** Playwright runner core + Hatchet job execution + R2 artifact upload fully functional.

#### MS5-T001: Playwright Test Runner Skeleton
**Description:** Build headless Playwright runner that accepts a test spec (JSON or hand-written .test.ts), executes steps, captures screenshots + HAR + console logs at each step, and saves artifacts to R2.

**Details:**
- Implement runner class: `PlaywrightRunner` (TypeScript, in NestJS service or FastAPI sidecar)
- Accept test spec format: `{name, steps: [{action, selector, value?, screenshot?}]}`
- Browser launch modes: headed (for dev) + headless (for CI/Hatchet)
- Screenshot capture at each step + on failure
- HAR file generation (via `browser.context.recordHAR()`)
- Console log capture (via `page.on('console')`)
- Environment snapshot (OS, browser version, viewport size, network speed simulation)
- R2 upload wrapper: `uploadArtifact(runId, artifactType, blob) → R2 URL`
- Error handling: step failure stops run, returns error context

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** Backend Engineer (Automation)  
**Dependencies:** M3 test_results schema, M3 evidence_files schema, R2 creds in Doppler  
**US-ID:** US-008  
**TB/EP:** TB-006, EP-039

---

#### MS5-T002: Hatchet Job Definition + Worker Pool
**Description:** Create Hatchet workflow for automation runs: enqueue → allocate worker → execute runner → upload artifacts → mark result.

**Details:**
- Hatchet workflow YAML: `automation-run.yaml`
  - Trigger: API call (`/api/automation/runs/enqueue`) or cron (scheduled)
  - Step 1: Allocate worker from pool (max 3 concurrent, based on pilot count)
  - Step 2: Execute PlaywrightRunner (pass test spec + run context)
  - Step 3: Upload artifacts to R2 (retry 3x on transient failure)
  - Step 4: Update test_results with pass/fail + artifact URLs
  - Step 5: Emit event to UI (WebSocket or polling via API)
- Worker image: Docker container with Chromium (via Playwright) + Node.js
- Max concurrency: 3 per Oracle VM (1 per core, CPU throttle at 80%)
- Retry: exponential backoff (1s, 2s, 4s, 8s) up to 3 attempts
- Timeout: 5 min per run (hardcoded, no override per job)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** DevOps + Backend  
**Dependencies:** Hatchet running (M0+), Cloudflare R2, Docker registry  
**US-ID:** US-008  
**TB/EP:** None (Hatchet job, not exposed as endpoint yet)

---

#### MS5-T003: Test Run Execution API (Create Run, Enqueue, Poll Status)
**Description:** NestJS endpoints for test automation: create run, link test cases, enqueue, poll status, fetch results.

**Details:**
- `POST /api/automation/runs` — create new automation run (project, env, test cases)
- `POST /api/automation/runs/:id/enqueue` — enqueue to Hatchet (return jobId)
- `GET /api/automation/runs/:id/status` — poll status (queued, running, done) + progress
- `GET /api/automation/runs/:id/results` — fetch all test results + artifact URLs
- `GET /api/automation/artifacts/:artifactId` — redirect to R2 signed URL (screenshot, HAR, logs)
- Request validation: ensure test cases exist, env valid, user has project access (RBAC)
- Response: JSON with run metadata, results array, artifact links
- Pagination: results per 25, sortable by status/duration

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer (API)  
**Dependencies:** MS5-T001, MS5-T002, Project Service (RBAC guard)  
**US-ID:** US-008  
**TB/EP:** EP-035 (new), EP-036 (new), EP-037 (modified)

---

#### MS5-T004: R2 Upload & Artifact Lifecycle Management
**Description:** Cloudflare R2 integration for evidence storage with lifecycle policies.

**Details:**
- R2 bucket structure: `qaix-artifacts/{projectId}/{runId}/{artifactType}-{timestamp}.{ext}`
- Artifact types: screenshot, har, console-log, env-snapshot, video (optional)
- Upload flow: 
  - Multipart upload for files >100MB (videos)
  - Server-side signed URL generation (1-hour expiry)
  - Retry on transient failure (503, 429)
  - Metadata: `Content-Type`, `Cache-Control: public, max-age=31536000` (1 year)
- Lifecycle policy: Auto-delete artifacts >90 days old (configurable per project)
- Quota tracking: Warn at 80% bucket utilization, enforce soft quota
- Fallback: If R2 fails, store as base64 blob in Postgres (temp, ≤100 MB)

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** DevOps  
**Dependencies:** R2 API keys in Doppler, Postgres evidence_files schema  
**US-ID:** US-008  
**TB/EP:** EP-039 (modified)

---

#### MS5-T005: Web-Based Test Spec Editor / Playwright Codegen Integration
**Description:** UI for creating test specs (both hand-written and AI-generated). Reuse Playwright Codegen for recording.

**Details:**
- **Manual authoring:**
  - TipTap block editor: `test-step` block type (action + selector + value + screenshot toggle)
  - Block types: navigate, click, fill, screenshot, wait, assertion
  - Drag-reorder steps, delete, clone
  - Auto-save to `automation_suites.spec_json`
- **Codegen mode:**
  - Launch browser recorder (Playwright Inspector) in new window
  - Record user actions (clicks, fills, navigations)
  - Auto-insert screenshot at each step
  - Import generated code into editor
- **Validation:**
  - Check selector syntax (CSS + XPath)
  - Dry-run on dev browser (small form)
  - Show error if selector not found

**Priority:** P1  
**Estimate:** 18 hours  
**Owner:** Frontend Engineer  
**Dependencies:** MS5-T001, TipTap editor, Playwright Inspector  
**US-ID:** US-008  
**TB/EP:** EP-030 (modified for automation)

---

### WEEK 2: FLAKE DETECTION + BASIC REPORTS (2026-08-03 → 2026-08-09)

**W2 Goal:** Flake detection live + 3 basic report dashboards shipped + AI step generation gated behind flag.

#### MS5-T006: Flake Detection Algorithm (5-Run Strategy)
**Description:** Classify tests as "flaky" if they pass/fail inconsistently. Run same test 5 times on failure; compute pass rate over last 10 runs; flag if 20–80%.

**Details:**
- **Trigger:** When test fails during automation run
  - Automatically enqueue 5 re-runs of same test (sequential, isolated browser)
  - Collect pass count, fail count
  - Compute current pass rate: `passCount / 5`
  - Query flake_signals table for same test (last 10 runs)
  - Compute historical pass rate (sliding window, 10-run average)
  - Classification:
    - If historical pass rate 20–80%: FLAKY (emit warning badge in UI)
    - If ≤20%: BROKEN (not flaky, consistently fails)
    - If ≥80%: STABLE (not flaky, consistently passes or random outlier)
- **Flake signals table:**
  ```
  CREATE TABLE flake_signals (
    id UUID PRIMARY KEY,
    automation_run_id UUID,
    test_case_id UUID,
    pass_rate_5run DECIMAL(3,2),
    pass_rate_10run_historical DECIMAL(3,2),
    classification TEXT ('FLAKY', 'STABLE', 'BROKEN'),
    rerun_count INT,
    first_detected_at TIMESTAMP,
    last_confirmed_at TIMESTAMP,
    created_at TIMESTAMP
  );
  ```
- **Caching:** Redis cache flake_signals per test (key: `flake:{testId}:{projectId}`, TTL 24h)
- **Confidence:** Show badge only if ≥2 recent occurrences (at least 2 re-run rounds)
- **UI Display:** Flake badge (amber) with tooltip "Flaky: 60% pass rate (6/10 recent runs)"

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer (Analytics)  
**Dependencies:** MS5-T001 (test execution data), Redis, PostgreSQL flake_signals table  
**US-ID:** US-008  
**TB/EP:** TB-006 (new flake_signals), EP-037 (modified with flake status)

---

#### MS5-T007: Materialized Views for Report KPIs
**Description:** Pre-compute report metrics via PostgreSQL materialized views, refreshed hourly.

**Details:**
- **View 1: run_summary_metrics** (for KPI card: total runs, pass rate, avg duration)
  ```
  SELECT
    project_id,
    COUNT(*) as total_runs,
    ROUND(100.0 * COUNT(CASE WHEN status = 'pass' THEN 1 END) / COUNT(*), 2) as pass_rate_pct,
    ROUND(AVG(EXTRACT(EPOCH FROM (ended_at - started_at))), 0) as avg_duration_sec,
    MAX(updated_at) as last_run_at
  FROM test_runs
  WHERE updated_at >= NOW() - INTERVAL '30 days'
  GROUP BY project_id;
  ```
- **View 2: defect_summary_metrics** (for KPI card: open count by severity, MTTR, reopens)
  ```
  SELECT
    project_id,
    COUNT(CASE WHEN status = 'open' AND severity = 'critical' THEN 1 END) as open_critical,
    COUNT(CASE WHEN status = 'open' AND severity = 'major' THEN 1 END) as open_major,
    COUNT(CASE WHEN status = 'open' AND severity = 'minor' THEN 1 END) as open_minor,
    ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))), 0)::INT as mttr_sec,
    COUNT(CASE WHEN reopen_count > 0 THEN 1 END) as reopen_count
  FROM defects
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY project_id;
  ```
- **View 3: pass_fail_trend** (for 30-day stacked area chart)
  ```
  SELECT
    DATE_TRUNC('day', test_runs.created_at)::DATE as date,
    COUNT(CASE WHEN status = 'pass' THEN 1 END) as passed,
    COUNT(CASE WHEN status = 'fail' THEN 1 END) as failed,
    COUNT(*) as total
  FROM test_runs
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY date
  ORDER BY date;
  ```
- **Refresh strategy:**
  - Hatchet cron job: `refresh-reports-views` runs hourly at XX:00
  - Command: `REFRESH MATERIALIZED VIEW CONCURRENTLY run_summary_metrics;`
  - Concurrency prevents locks; safe for live queries
- **Index:**
  - Create index on `(project_id)` for quick lookups

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend Engineer (DB)  
**Dependencies:** Test execution + defect data seeded, PostgreSQL  
**US-ID:** US-009, US-010  
**TB/EP:** TB-006 (views only, not table)

---

#### MS5-T008: Basic Reports Backend (3 Dashboards: Run Summary, Defect Summary, Trend)
**Description:** NestJS endpoints that query materialized views + compute KPI cards.

**Details:**
- **Endpoint 1: `GET /api/reports/dashboards/automation-summary`**
  - Query: `run_summary_metrics` for project
  - Response:
    ```json
    {
      "projectId": "...",
      "period": "last_30_days",
      "cards": [
        {"label": "Total Runs", "value": 250, "trend": "+15%", "metadata": {...}},
        {"label": "Pass Rate", "value": "87%", "trend": "-2%", "metadata": {...}},
        {"label": "Avg Duration", "value": "45s", "trend": "stable", "metadata": {...}}
      ],
      "lastUpdated": "2026-08-16T14:30:00Z"
    }
    ```
- **Endpoint 2: `GET /api/reports/dashboards/defect-summary`**
  - Query: `defect_summary_metrics` for project
  - Response:
    ```json
    {
      "projectId": "...",
      "period": "last_30_days",
      "cards": [
        {"label": "Open by Severity", "value": {critical: 3, major: 12, minor: 45}, "trend": "-1 critical"},
        {"label": "Mean Time to Close", "value": "3.2d", "trend": "-0.5d"},
        {"label": "Reopens", "value": 7, "trend": "-2"}
      ],
      "lastUpdated": "2026-08-16T14:30:00Z"
    }
    ```
- **Endpoint 3: `GET /api/reports/dashboards/trend-30d?projectId=...`**
  - Query: `pass_fail_trend` for project, last 30 days
  - Response: Array of daily data for recharts stacked area chart
    ```json
    {
      "data": [
        {"date": "2026-07-17", "passed": 150, "failed": 20, "total": 170},
        {"date": "2026-07-18", "passed": 155, "failed": 18, "total": 173},
        ...
      ],
      "summary": {"avgPassRate": 0.887, "trend": "improving"}
    }
    ```
- **RBAC:** User must have `Lead` or `Admin` role + project access
- **Caching:** Redis cache results, TTL 1 hour (refreshes with materialized view)
- **Error handling:** Return empty cards with "No data available" if project has <5 runs

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer (API)  
**Dependencies:** MS5-T007 (materialized views), Project Service (RBAC)  
**US-ID:** US-009, US-010  
**TB/EP:** EP-053 (new automation dashboard), EP-054 (modified)

---

#### MS5-T009: Basic Reports Frontend (React Components: KPI Cards, Trend Chart)
**Description:** Next.js pages + React components for 3 dashboards using recharts for visualization.

**Details:**
- **Page 1: Automation Summary Dashboard** (`/reports/automation-summary`)
  - 3 KPI cards (horizontal layout, light card bg)
  - Each card: label + primary value + trend badge (up/down/stable arrow)
  - Refresh button (top-right) + auto-refresh toggle (every 5 min)
  - Loading skeleton while fetching
  - Error state: "Failed to load. Retry?"
- **Page 2: Defect Summary Dashboard** (`/reports/defect-summary`)
  - Mirrors automation summary: 3 cards
  - Card 1: severity breakdown (open critical/major/minor as mini bars or text)
  - Card 2: MTTR (days.hours format)
  - Card 3: reopen count + trend
- **Page 3: 30-Day Pass/Fail Trend** (`/reports/trend`)
  - recharts AreaChart component
  - X-axis: dates (last 30 days)
  - Y-axis: count (0 to max)
  - Stacked area: passed (green), failed (red)
  - Tooltip on hover: date + counts
  - Legend (top): Passed, Failed
  - Responsive: full width, 300px min height
  - Export as image (Save As PNG)
- **Navigation:**
  - Left sidebar: Reports menu
  - Breadcrumb: Home > Reports > [Automation/Defect/Trend]
  - Tab navigation: "Automation | Defect | Trend"
- **Accessibility:**
  - WCAG 2.2 AA: colour + icon for card trends
  - Keyboard shortcut: ⌘R to refresh current dashboard
  - Alt text for chart images

**Priority:** P0  
**Estimate:** 18 hours  
**Owner:** Frontend Engineer  
**Dependencies:** MS5-T008 (backend endpoints), recharts, DESIGN.md  
**US-ID:** US-009, US-010  
**TB/EP:** EP-053, EP-054

---

#### MS5-T010: AI-Assisted Playwright Step Generation (LangGraph Variant, Gated Flag)
**Description:** Extend LangGraph agent (reuse A1 context gen) to emit `test.step` calls instead of doc sections. Gate behind `ai.auto_playwright` flag (dark launch, disabled by default).

**Details:**
- **Input:** Natural-language test scenario (e.g., "User logs in with valid credentials")
- **LangGraph graph variant:** `GeneratePlaywrightSteps` (fork of A1 doc gen)
  - Node 1: Clarification Questions (same gate as A1) — user confirms scenario scope
  - Node 2: Fetch similar past tests (A2 semantic search) — provide context
  - Node 3: LLM generates Playwright steps — output format:
    ```json
    {
      "steps": [
        {"action": "navigate", "url": "https://app.example.com/login", "screenshot": true},
        {"action": "fill", "selector": "input[name='email']", "value": "user@example.com", "screenshot": false},
        {"action": "fill", "selector": "input[name='password']", "value": "password", "screenshot": false},
        {"action": "click", "selector": "button[type='submit']", "screenshot": true},
        {"action": "wait", "selector": "text=Dashboard", "timeout": 5000, "screenshot": true},
        {"action": "assertion", "type": "text", "selector": ".greeting", "expected": "Hello User"}
      ]
    }
    ```
  - Node 4: Human-in-the-loop approval (user reviews, edits, saves)
- **Feature flag:** `ai.auto_playwright`
  - Default: `false` (disabled)
  - Rollout: Dark → Internal Iksula (week 2) → Canary 10% (week 3) → GA (week 3)
  - Kill switch: `unleash disable ai.auto_playwright`
- **Integration:**
  - Endpoint: `POST /api/automation/generate-steps` (async via Hatchet)
  - Accepts natural-language description + optional context (app URL, past test IDs)
  - Returns: job ID for polling
  - Result: Array of steps (JSON) ready to save as test spec
- **Confidence scoring:**
  - LLM outputs `confidence: 0.0–1.0` per step
  - Show warning if <0.6 ("This step might fail; please review")
  - Auto-approve only if all steps ≥0.8
- **Fallback:** If Ollama offline, redirect to Gemini 2.5 Flash (free tier)

**Priority:** P1 (gated, dark launch)  
**Estimate:** 16 hours  
**Owner:** AI Engineer + Backend  
**Dependencies:** LangGraph (M1+), Ollama/Gemini fallback, Hatchet, Feature flags (Unleash)  
**US-ID:** US-011 (partial, automation variant)  
**TB/EP:** None (new endpoint, not in ERD yet)

---

#### MS5-T011: Basic Reports Feature Flag Integration
**Description:** Gate basic reports behind `reports.basic_v1` flag for safe canary rollout.

**Details:**
- Flag config (Unleash):
  - Name: `reports.basic_v1`
  - Default: `false` (disabled)
  - Strategy 1: Dark launch (internal flag, enable for test)
  - Strategy 2: Canary 20% (week 2, Thursday) — enable for 1 pilot project
  - Strategy 3: GA (week 3, Monday) — enable for all projects
  - Kill switch: `unleash disable reports.basic_v1`
- **Frontend flag check:**
  - In report pages, check flag at load time
  - If disabled: show "Coming soon" placeholder
  - If enabled: show dashboards (normal flow)
  - Use Unleash SDK (React context provider)
- **Backend flag check:**
  - NestJS guard on report endpoints: `@UseGuards(FeatureFlagGuard)` with `reports.basic_v1`
  - If disabled: return 410 Gone + message "Reports not yet available"
- **Monitoring:**
  - SigNoz dashboard: flag enable/disable events, latency per flag state
  - Alert if flag disabled unexpectedly (possible rollback)

**Priority:** P1  
**Estimate:** 6 hours  
**Owner:** Backend + Frontend  
**Dependencies:** Unleash SDK integration (M0+), MS5-T008/T009  
**US-ID:** US-009, US-010  
**TB/EP:** None (feature flag, not endpoint)

---

### WEEK 3: MVP LAUNCH CHECKLIST + HARDENING (2026-08-10 → 2026-08-16)

**W3 Goal:** Zero P0 bugs, <3 P1 open, observability green 7 days, go/no-go gate passed, 2–3 pilots launched.

#### MS5-T012: MVP Readiness Checklist + Go/No-Go Review
**Description:** Formalize MVP launch gate criteria; conduct final go/no-go review with team + leadership.

**Details:**
- **Acceptance Criteria Matrix (Launch Gate):**
  - **Defect Quality:** 0 open P0 bugs, <3 open P1 bugs (all P2 acceptable), <10 open P3
  - **Observability:** SigNoz/GlitchTip dashboards green (no error rate >2%, p95 latency <target for all critical paths) for 7 consecutive days before launch
  - **Feature Completeness:** All 20 sections of M5 task breakdown complete (code merged, tests green)
  - **Performance:** p95 API latency <300ms, p95 doc gen <60s, p95 RCA <10s, p95 search <500ms
  - **Test Coverage:** Unit tests ≥80% (code), integration tests ≥70% (critical paths), E2E Playwright tests passing (3 journeys: auth → test case → defect → report)
  - **Accessibility:** WCAG 2.2 AA audit complete, <5 unfixed failures (all critical fixed)
  - **Documentation:** Release notes drafted, user guide updated, API docs in OpenAPI, admin runbook published
  - **Pilot Readiness:** 2–3 Iksula projects recruited, kick-off scheduled, success metrics defined (engagement, defect flow, adoption)
  - **On-Call Readiness:** Runbook for P0–P2 scenarios ready, escalation path defined, on-call roster assigned
  - **Backup/Restore:** Point-in-time recovery tested (restore from R2 snapshot, verify data integrity)
- **Review Meeting:** Friday, 2026-08-22, 2–3 PM (1 hour)
  - Attendees: Engineering Lead, PM, QA Lead, DevOps
  - Go/No-Go decision: All 8 criteria must be "Go" (no Conditional Go)
  - If No-Go: Identify blockers, reassess launch date (push to next week or descope feature)
  - Record decision + signatures in Jira ticket

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** PM + Tech Lead  
**Dependencies:** All M5 tasks complete  
**US-ID:** N/A (meta task)  
**TB/EP:** N/A

---

#### MS5-T013: Pilot Onboarding Program (Training + Kickoff)
**Description:** Create pilot onboarding docs + conduct live training sessions with 2–3 Iksula teams.

**Details:**
- **Deliverables:**
  1. **Pilot Onboarding Checklist** (1-page)
     - Pre-kickoff: VPN access, project setup, user invites
     - Day 1: 30-min intro call (features, success metrics, support channel)
     - Week 1: 1-hour hands-on training (test case creation, defect logging, report viewing)
     - Week 2–4: Weekly 15-min check-ins + async support (Slack channel)
  2. **User Guide** (5–10 pages)
     - "Getting Started" walkthrough (create project, add team, author test)
     - "Common Tasks" (log defect, view report, generate test plan)
     - Keyboard shortcuts (⌘K, ⌘Enter, ⌘⇧D)
     - FAQ + troubleshooting
  3. **Admin Guide** (for Iksula IT ops)
     - User provisioning (bulk CSV import)
     - RBAC setup (assign roles per project)
     - Jira integration troubleshooting
     - Backup/restore procedures
  4. **Success Metrics Dashboard** (live in QA Nexus admin panel)
     - Per-pilot metrics: login frequency, test cases created, defects logged, reports viewed
     - Cohort metrics: engagement (% active 4+ days/week), adoption (% defects flowing QA Nexus → Jira)
     - Real-time telemetry (last 24h activity)
- **Training Sessions:**
  - Session 1 (Mon, 2026-08-17, 10:00 AM): Pilot A (5 QAs) — 1 hour live + recorded
  - Session 2 (Wed, 2026-08-19, 10:00 AM): Pilot B + C (8 QAs) — 1 hour live + recorded
  - Format: Screen share, live demo, Q&A, recording uploaded to KB
- **Support Channel:**
  - Slack channel: `#qa-nexus-pilots`
  - Responders: AI Engineer + QA Lead (on-call during pilot week 1–4)
  - SLA: <2h response time for issues blocking work

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** PM + QA Lead + Technical Writer  
**Dependencies:** Pilot projects confirmed  
**US-ID:** GM-001 (adoption metric)  
**TB/EP:** N/A

---

#### MS5-T014: Performance Optimization & Load Testing
**Description:** Identify and fix performance bottlenecks; validate system can handle 3 concurrent pilots (10 simultaneous users).

**Details:**
- **Performance Profiling:**
  - Use SigNoz APM to identify slow endpoints (p95 >300ms)
  - Profile Ollama inference (Gemma 4 step generation) — target <5s per step batch
  - Profile DB query slowness (materialized views, report queries) — target <200ms
  - Profile search latency (pgvector similarity search) — target <500ms
- **Optimizations (if needed):**
  - Add Redis caching layer to frequently queried endpoints
  - Optimize DB indexes (if not already done in earlier milestones)
  - Add connection pooling to Postgres (PgBouncer on Oracle VM)
  - Batch Ollama inference requests (queue up 10 requests, run in single model invocation)
  - Implement pagination for large result sets (avoid loading full dataset into memory)
- **Load Testing:**
  - Tool: k6 (lightweight, scriptable)
  - Scenario: 10 concurrent VUs (virtual users) for 5 min
  - Actions per VU: login, create test case, run automation, view report (repeat 5×)
  - Success criteria:
    - p95 latency <500ms (should be <300ms, but 500ms acceptable for load test)
    - Error rate <2%
    - No server crashes, no database connection exhaustion
  - Run 3× (baseline, with cache layer, with DB index optimization)
  - Report: Before/after latency histogram + error rate
- **Monitoring during test:**
  - SigNoz dashboard: CPU, memory, disk I/O, error rate, latency percentiles
  - Alert if any metric exceeds threshold (e.g., CPU >80%, error rate >2%)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** DevOps + Backend  
**Dependencies:** All features complete, production-like test data seeded  
**US-ID:** GM-014 (performance SLO)  
**TB/EP:** None (infrastructure, not endpoint)

---

#### MS5-T015: Backup / Restore Testing (End-to-End)
**Description:** Validate that point-in-time recovery from R2 snapshot works and restores all data correctly.

**Details:**
- **Backup Procedure (existing, validate):**
  - Daily Hatchet cron job: `pg_dump qaix_prod > /tmp/qaix-$(date +%Y%m%d).sql.gz`
  - Upload to R2: `s3cmd put /tmp/qaix-$(date +%Y%m%d).sql.gz s3://iksula-backups/qaix-prod/`
  - Retention: keep last 30 daily backups
  - Verify: log success/failure to SigNoz
- **Restore Test:**
  - On staging DB: stop services, drop current data
  - Download latest backup from R2
  - Restore: `psql -f /tmp/qaix-latest.sql`
  - Verify data integrity:
    - Row counts match (sample 10 tables)
    - Foreign key constraints pass
    - No orphaned records
  - Restart services, verify connectivity
  - Check UI: load homepage, view project data
  - Document time-to-restore (target: <4h including RTO)
- **Documentation:**
  - Update admin runbook with restore procedure
  - Add troubleshooting section (e.g., "restore hangs" → increase work_mem)

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** DevOps  
**Dependencies:** R2 backup automation (M0+), PostgreSQL  
**US-ID:** None (infrastructure)  
**TB/EP:** None

---

#### MS5-T016: WCAG 2.2 AA Accessibility Audit + Remediation
**Description:** Conduct automated + manual accessibility audit; fix critical/major failures.

**Details:**
- **Automated Audit Tools:**
  - axe DevTools (Chrome plugin): run on all 25+ screens, report violations
  - Lighthouse (Chrome DevTools): Accessibility tab, review score
  - Expected: ≥90% Lighthouse accessibility score
- **Manual Audit (by QA):**
  - Keyboard navigation: Can all interactive elements be reached via Tab? Focus visible?
  - Colour contrast: All text ≥4.5:1 (WCAG AA)?
  - Form labels: All inputs have associated labels?
  - Images: All images have alt text (or aria-hidden if decorative)?
  - Screen reader (NVDA on Windows, VoiceOver on Mac): Spot-check 5 critical flows (auth, test case, defect, report)
- **Issue Categories:**
  - **Critical:** Error states not announced, required field not marked, colour-only status indication
  - **Major:** Form label missing, focus trap, low contrast (<4.5:1)
  - **Minor:** Missing alt text on non-critical image, suboptimal keyboard order
- **Remediation:**
  - Fix all critical issues (zero tolerance)
  - Fix ≥80% of major issues (acceptable if minor <3)
  - Document deferred issues in GitHub (backlog for v1.5)
- **Accessibility Conformance Report:**
  - VPAT (Voluntary Product Accessibility Template) 2.2
  - Claim WCAG 2.2 AA conformance for critical paths (auth, test case, defect, report)
  - Store in Google Drive for compliance audit

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Frontend Engineer + QA Lead  
**Dependencies:** M5 frontend tasks complete  
**US-ID:** GM-012 (product quality — a11y is part of quality gate)  
**TB/EP:** None (design + frontend QA, not endpoint)

---

#### MS5-T017: E2E Tests (Playwright Self-Test via Playwright Runner)
**Description:** Write 3 critical Playwright journeys; execute via Playwright runner to validate runner itself.

**Details:**
- **Journey 1: Authentication Flow**
  - Navigate to login page
  - Fill email + password
  - Click "Login"
  - Assertion: redirected to Project Picker, greeting shows user name
  - Artifacts captured: screenshot per step, HAR file, console logs
- **Journey 2: Test Case Creation (A1 Generator)**
  - Log in, select project
  - Click "New Test Case"
  - Fill title + description
  - Click "A1 Generate Steps"
  - Assertion: steps populated in editor, confidence badges visible
  - Click "Save"
  - Assertion: case visible in list
- **Journey 3: Defect Creation from Run + Jira Push**
  - Create test run, execute 1 case, fail intentionally
  - Click "Log Defect" button
  - Assertion: form pre-filled with run context
  - Fill severity + notes
  - Click "Push to Jira"
  - Assertion: defect created, Jira link shown
  - Poll Jira API: verify issue exists in target project
- **Execution:**
  - Tests authored in TipTap editor (MS5-T005)
  - Enqueue via runner API (MS5-T003)
  - Collect artifacts from R2
  - Results: pass/fail + artifacts in test_results table
  - CI Gate: Tests run on every merge to `main`, block merge if any fail
- **Reporting:**
  - Dashboards: E2E test status card in admin panel
  - Alert: if E2E tests fail >2h before launch, escalate to Tech Lead

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** QA Engineer + Automation  
**Dependencies:** MS5-T001 (runner), MS5-T005 (test editor), MS5-T003 (API)  
**US-ID:** N/A (test infrastructure)  
**TB/EP:** None

---

#### MS5-T018: Flake Detection Validation (Synthetic Test Generator)
**Description:** Create synthetic test scenarios that are intentionally flaky (50% pass rate) to validate flake detection algorithm.

**Details:**
- **Synthetic Test Suite:**
  - Create 5 test specs with controlled flakiness:
    - Test A: 100% pass (baseline)
    - Test B: 50% pass (sleep 1–5s, randomize success)
    - Test C: 80% pass (fail if time-of-day in [1–2 AM UTC])
    - Test D: 20% pass (broken selector, fixed mid-test)
    - Test E: 100% fail (assertion fails always)
  - Enqueue 10 runs of each (total 50 runs)
- **Validation:**
  - Test A: Should classify as STABLE (0% flake rate)
  - Test B: Should classify as FLAKY (50% pass rate in 20–80% range)
  - Test C: Should classify as FLAKY (80% is edge, but still flaky)
  - Test D: Should classify as BROKEN or IMPROVING (depends on when fixed)
  - Test E: Should classify as BROKEN (0% pass rate)
- **Flake signals table:** Verify records created + confidence computed
- **UI: Verify flaky badges** appear correctly on dashboard + test case detail page

**Priority:** P1  
**Estimate:** 10 hours  
**Owner:** QA Engineer  
**Dependencies:** MS5-T001 (runner), MS5-T006 (flake detection)  
**US-ID:** N/A (test infrastructure)  
**TB/EP:** None

---

#### MS5-T019: On-Call Runbook Authoring (P0–P2 Scenarios)
**Description:** Document step-by-step playbooks for incident response. Target scenarios: Ollama offline, pgvector full, Oracle VM disk full, Hatchet job queue backlog.

**Details:**
- **Runbook Format (per scenario):**
  - Symptom: What does on-call see in monitoring?
  - Impact: Which users/features affected?
  - Root cause: Most likely culprit
  - Investigation steps: How to confirm
  - Resolution: Step-by-step fix
  - Escalation: Who to contact if not resolved in X min
  - Post-incident: Log in Jira, alert PM/leadership
- **Scenarios:**
  1. **Ollama Offline (P0)**
     - Symptom: Document generation fails ("LLM unavailable")
     - Investigation: `ssh oracle-vm; curl -s http://localhost:11434/api/tags`
     - Fix: `systemctl restart ollama` OR failover to Gemini 2.5 Flash (set flag)
     - Escalation: If restart fails, page infrastructure on-call
  2. **pgvector Index Full (P1)**
     - Symptom: Search latency spikes (>5s), insert errors ("pgvector index full")
     - Investigation: `SELECT count(*) FROM pgvector_entries;` (should be <5M)
     - Fix: Archive old vectors (move to cold storage), or scale to Qdrant
     - Escalation: Plan scale-out in next sprint
  3. **Oracle VM Disk 95%+ Full (P0)**
     - Symptom: Postgres inserts fail, log rotation fails
     - Investigation: `df -h / ; du -sh /var/lib/postgresql/*`
     - Fix: Delete old logs, purge R2 artifact cache, extend block storage
     - Escalation: Infrastructure on-call
  4. **Hatchet Job Queue Backlog >1000 Jobs (P1)**
     - Symptom: Automation runs queued >30 min, users see "Queued" status
     - Investigation: `hatchet job list --status queued | wc -l`
     - Fix: Increase worker concurrency (add new worker pool), or pause non-urgent jobs
     - Escalation: If >2h, notify pilots + descope non-critical features
- **Distribution:**
  - Runbook pinned in Slack #oncall channel
  - Printed + taped to monitor (physical backup)
  - Annual review + update (Q1 each year)

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** DevOps + Backend Lead  
**Dependencies:** M0–M5 infrastructure complete  
**US-ID:** None (operations)  
**TB/EP:** None

---

#### MS5-T020: Feature Flag Rollout Execution (Dark → Internal → Canary → GA)
**Description:** Gradually enable automation + reports + AI step gen via feature flags over week 3, monitored for issues.

**Details:**
- **Timeline:**
  | Date | Feature | Status | Scope | SLO |
  |------|---------|--------|-------|-----|
  | Mon 2026-08-17 | `automation.playwright_runner` | Dark | Internal test only | — |
  | Tue 2026-08-18 | `reports.basic_v1` | Dark | Internal test only | — |
  | Wed 2026-08-19 | `ai.auto_playwright` | Dark | Internal test only | — |
  | Wed 2026-08-19 (PM) | `automation.playwright_runner` | Canary 10% | Pilot A (1/3 pilots) | <2% error rate |
  | Thu 2026-08-20 | `reports.basic_v1` | Canary 20% | Pilot A + B (2/3 pilots) | p95 latency <500ms |
  | Fri 2026-08-21 | All flags | Canary 50% | All pilots | All SLOs met |
  | Sat 2026-08-22 | All flags | GA | All projects | All SLOs met, 0 P0 bugs |
- **Monitoring per stage:**
  - Error rate (target <2%)
  - Latency (target p95 <500ms for reports, <5s for automation)
  - User feedback (Slack #qa-nexus-pilots, watch for complaints)
  - Jira tickets (auto-filed errors in QA Nexus project)
- **Rollback trigger:** If any SLO breached for >10 min, disable flag + investigate
- **Communication:** Post updates to #qa-nexus-pilots daily during rollout

**Priority:** P0  
**Estimate:** 6 hours (mostly monitoring, not coding)  
**Owner:** PM + DevOps  
**Dependencies:** All flags wired + SigNoz dashboards ready  
**US-ID:** None (ops)  
**TB/EP:** None

---

#### MS5-T021: Release Notes Drafting
**Description:** User-facing narrative of MVP features + getting started guide.

**Details:**
- **Content (2–3 pages):**
  - **Headline:** "QA Nexus MVP Launches: Playwright Automation + AI-Powered Reports"
  - **What's New (3 sections):**
    1. **Playwright Automation Runner** — Run tests in browser, capture evidence auto, detect flaky tests
    2. **Basic Reports Dashboards** — 3 KPI cards + 30-day trend chart, auto-refreshing
    3. **AI-Assisted Test Generation** — Write tests from natural language (beta, opt-in)
  - **Getting Started (Quick Links):**
    - Create your first project (link to guide)
    - Author a test case (link to guide)
    - Run a test (link to guide)
    - View reports (link to guide)
  - **Known Limitations (Transparent):**
    - Playwright automation limited to web apps (native apps in v2)
    - AI step generation beta (fallback to manual if LLM offline)
    - Basic reports (full dashboards + export in v1.5)
  - **Feedback:** "We're listening! Report bugs or suggest features in #qa-nexus-feedback"
- **Format:** Markdown (GitHub release notes) + sanitized HTML (in-app announcement banner)
- **Distribution:** GitHub release tag, in-app banner (1-week visibility), email to pilots, Slack

**Priority:** P0  
**Estimate:** 6 hours  
**Owner:** PM + Technical Writer  
**Dependencies:** All features complete  
**US-ID:** None (marketing)  
**TB/EP:** None

---

#### MS5-T-CART-SMOKE: Iksula Commerce (CART) Cross-Project Smoke Test (R2 mitigation add-on, patched 2026-04-26)

**Type:** Cross-project validation (manual + scripted)
**Owner:** Yogesh Mohite (Sr QA + Admin) + 1 QA Engineer (rotating)
**Duration:** 1 day (~8 hours)
**Priority:** P1
**Source:** R2 mitigation from Phase 0.5 — confirms PM1 generalizes from anchor project (Iksula Returns / RET) to a second Iksula project (Iksula Commerce / CART) before M6 GA.
**Description:** Run the full e2e PM1 workflow against Iksula Commerce (CART) requirements, NOT Iksula Returns (RET). Steps:
1. Load 5–10 real CART requirements via F12 Upload Modal (use sanitized PRD excerpts from prior CART sprints)
2. Generate test cases via A1 (F16b) — verify confidence scoring + clarification questions work for non-RET domain
3. Run A2 dedup (live chips on F17) against existing test case library — confirm cross-project dedup doesn't false-flag CART vs RET cases
4. Log a sample defect on F21 — verify A4 5-Layer RCA produces sensible classification for CART-domain failure
5. Push defect to Jira (CART project, NOT RET) — verify OAuth 3LO scope covers multi-project sync
6. Generate weekly report via F23 — confirm CART-scoped data appears correctly without RET pollution

**Acceptance Criteria:**
- All 6 steps complete without engineer intervention
- A1 confidence ≥80% on CART cases (parity with RET baseline)
- A2 false-positive rate <10% cross-project (relaxed from <5% intra-project)
- A4 top-2 RCA accuracy ≥60% on CART domain (relaxed from ≥70% intra-RET; calibrate)
- Findings (any project-specific assumptions surfaced) logged to GitHub Issues with `cart-smoke` label, triaged before M6 GA

**Trigger:** After MS5-LAUNCH (pilot Day-0 setup complete + first A1 generation works on RET); BEFORE M6 GA acceptance gates run.
**Dependencies:** All M5 tasks complete; pilot launch infrastructure live.
**TB/EP:** N/A (validation task; uses existing endpoints)
**US-ID:** None (cross-project quality gate)
**Risk:** If smoke test surfaces blocking issues, M6 GA may slip — escalate immediately; do NOT silently accept project-specific code paths.

---

## ACCEPTANCE CRITERIA MATRIX

| AC-ID | Component | Acceptance Condition (Given/When/Then) | Verifier | Status |
|-------|-----------|-------|----------|--------|
| **MS5-AC001** | Playwright Runner (MS5-T001) | Given a test spec with 5 steps, when enqueued to Hatchet, then runner executes all steps, captures screenshots + HAR + logs, uploads to R2, and returns success | QA | TBD |
| **MS5-AC002** | Hatchet Job Execution (MS5-T002) | Given 3 concurrent automation runs, when workers allocated from pool, then all 3 execute in parallel without resource contention | DevOps | TBD |
| **MS5-AC003** | Automation API (MS5-T003) | Given a test run created via API, when status polled, then response includes progress % + artifact links | Backend | TBD |
| **MS5-AC004** | R2 Artifact Storage (MS5-T004) | Given artifacts uploaded to R2, when accessed via signed URL, then file downloads correctly + URL expires after 1h | DevOps | TBD |
| **MS5-AC005** | Web Spec Editor (MS5-T005) | Given a test step added via TipTap editor, when saved, then step stored in automation_suites.spec_json + can be executed | Frontend | TBD |
| **MS5-AC006** | Flake Detection Algorithm (MS5-T006) | Given a test that passes 6/10 times (60% rate), when flake check runs, then classified as FLAKY + badge visible in UI | Analytics | TBD |
| **MS5-AC007** | Materialized Views (MS5-T007) | Given 50 test runs + 20 defects, when report views refreshed, then KPI cards show correct totals + trends | Backend | TBD |
| **MS5-AC008** | Report API (MS5-T008) | Given project with 30+ runs, when automation-summary endpoint queried, then response includes 3 KPI cards with values + trends | Backend | TBD |
| **MS5-AC009** | Report Dashboard (MS5-T009) | Given 30 days of test data, when trend chart renders, then stacked area shows passed/failed per day + tooltip on hover | Frontend | TBD |
| **MS5-AC010** | AI Step Generation (MS5-T010) | Given natural-language scenario ("user logs in"), when A1 generates steps, then output includes 5+ steps with confidence >0.7 + requires approval before save | AI | TBD |
| **MS5-AC011** | Feature Flag Integration (MS5-T011) | Given `reports.basic_v1` flag disabled, when report page loaded, then "Coming soon" shown; when flag enabled, then dashboards render | Frontend | TBD |
| **MS5-AC012** | MVP Readiness Gate (MS5-T012) | Given go/no-go review meeting, when all 8 launch criteria evaluated, then decision recorded + approved by PM + Tech Lead | PM | TBD |
| **MS5-AC013** | Pilot Onboarding (MS5-T013) | Given 2 pilot teams invited, when training session completed, then all participants can independently: create project, author test, log defect, view report | QA | TBD |
| **MS5-AC014** | Performance (MS5-T014) | Given 10 concurrent users load testing, when simulating pilot workload for 5 min, then p95 latency <500ms + error rate <2% + no server crash | DevOps | TBD |
| **MS5-AC015** | Backup Restore (MS5-T015) | Given production backup on R2, when restore executed on staging, then row counts match + data integrity passed + RTO <4h | DevOps | TBD |
| **MS5-AC016** | WCAG 2.2 AA (MS5-T016) | Given accessibility audit on 10 critical screens, when automated + manual checks complete, then ≥90% pass rate + all critical failures fixed | Frontend | TBD |
| **MS5-AC017** | E2E Tests (MS5-T017) | Given 3 critical Playwright journeys written, when executed via runner, then all pass + artifacts captured | QA | TBD |
| **MS5-AC018** | Flake Detection Validation (MS5-T018) | Given 5 synthetic test specs with known flake rates, when detection runs, then classification accuracy ≥95% | QA | TBD |
| **MS5-AC019** | On-Call Runbook (MS5-T019) | Given 4 P0–P2 scenarios documented, when runbook tested by on-call trainee, then Ollama restart succeeds <5 min | DevOps | TBD |
| **MS5-AC020** | Feature Flag Rollout (MS5-T020) | Given flags rolled from dark → GA over 4 days, when each stage monitored, then <2% error rate throughout + user feedback neutral/positive | PM + DevOps | TBD |
| **MS5-AC021** | Release Notes (MS5-T021) | Given release notes drafted, when reviewed by PM + TW, then content approved + distributed to pilots + GitHub | PM | TBD |

---

## ENVIRONMENT & SETUP CHECKLIST (DAY 1)

**New Team Member Onboarding:**

- [ ] Slack access (#qa-nexus-pilots, #oncall, #dev)
- [ ] GitHub access (iksula/qa-nexus repo, branch: `feat/m5-automation`)
- [ ] Vercel access (logs, deployment history, env vars)
- [ ] Oracle VM access (SSH key, VPN, monitoring dashboards)
- [ ] Doppler access (dev secrets: R2 creds, Jira OAuth, Claude API key)
- [ ] SigNoz access (observability dashboards, alert rules)
- [ ] GlitchTip access (error tracking, release tracking)
- [ ] Unleash access (feature flag dashboard)
- [ ] Local dev setup:
  - `git clone https://github.com/iksula/qa-nexus`
  - `npm install` (root)
  - `cd frontend && npm install && npm run dev` (port 3000)
  - `cd backend && npm install && npm run start:dev` (port 3001)
  - `cd inference && pip install -r requirements.txt && python main.py` (port 8000)
  - Verify: `curl http://localhost:3001/health` → 200 OK
- [ ] Database access:
  - `psql -h oracle-vm-ip -U qaix_admin -d qaix_dev`
  - Run migrations: `npm run migrate:dev`
  - Seed test data: `npm run seed:test-data`
- [ ] Feature flag defaults (local config, `unleash.json`):
  - `automation.playwright_runner: false`
  - `reports.basic_v1: false`
  - `ai.auto_playwright: false`
- [ ] IDE setup:
  - ESLint + Prettier configured
  - TypeScript strict mode enabled
  - `.env.local` with API keys (request from PM)

---

## API CONTRACTS (M5 SCOPE ONLY)

All endpoints authenticated via BetterAuth session cookie; RBAC enforced at service level.

### Automation Suite Management

#### `POST /api/automation/suites`
**Purpose:** Create automation suite (collection of related test specs)

**Request:**
```json
{
  "projectId": "proj_123",
  "name": "Login Flow",
  "description": "Tests for login authentication",
  "environment": "staging"
}
```

**Response (201 Created):**
```json
{
  "id": "suite_456",
  "projectId": "proj_123",
  "name": "Login Flow",
  "specJson": {},
  "createdAt": "2026-08-10T10:00:00Z"
}
```

---

#### `GET /api/automation/suites/:id`
**Purpose:** Fetch suite + test specs

**Response (200):**
```json
{
  "id": "suite_456",
  "name": "Login Flow",
  "specs": [
    {"id": "spec_001", "name": "Valid Credentials", "steps": [...], "flakeStatus": "stable"}
  ],
  "lastRun": {"id": "run_789", "status": "pass", "timestamp": "2026-08-16T14:30:00Z"}
}
```

---

### Automation Run Execution

#### `POST /api/automation/runs`
**Purpose:** Create new automation run (enqueue suite)

**Request:**
```json
{
  "suiteId": "suite_456",
  "environment": "staging",
  "parallelism": 1
}
```

**Response (201):**
```json
{
  "id": "run_789",
  "suiteId": "suite_456",
  "status": "queued",
  "jobId": "hatchet_job_xyz",
  "estimatedDuration": 120,
  "createdAt": "2026-08-16T14:30:00Z"
}
```

---

#### `GET /api/automation/runs/:id`
**Purpose:** Poll run status + progress

**Response (200):**
```json
{
  "id": "run_789",
  "status": "running",
  "progress": 0.6,
  "results": [
    {
      "specId": "spec_001",
      "status": "pass",
      "duration": 45,
      "artifacts": {
        "screenshot": "https://r2.example.com/...",
        "har": "https://r2.example.com/...",
        "logs": "https://r2.example.com/..."
      }
    }
  ],
  "flakeDetected": [
    {"specId": "spec_004", "passRate": 0.6, "classification": "FLAKY"}
  ]
}
```

---

#### `POST /api/automation/runs/:id/stop`
**Purpose:** Stop running automation suite (graceful shutdown)

**Response (200):**
```json
{
  "id": "run_789",
  "status": "stopped",
  "stoppedAt": "2026-08-16T14:45:00Z"
}
```

---

### Flake Status

#### `GET /api/automation/flake-status?projectId=proj_123`
**Purpose:** Fetch flaky tests for project

**Response (200):**
```json
{
  "projectId": "proj_123",
  "flakes": [
    {
      "testId": "test_001",
      "name": "Login with Session Timeout",
      "passRate": 0.65,
      "recent10Runs": [1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
      "firstDetected": "2026-08-01T00:00:00Z",
      "confidence": 0.92
    }
  ]
}
```

---

### Basic Reports

#### `GET /api/reports/dashboards/automation-summary?projectId=proj_123`
**Purpose:** Fetch KPI cards for automation dashboard

**Response (200):**
```json
{
  "projectId": "proj_123",
  "period": "last_30_days",
  "cards": [
    {
      "label": "Total Runs",
      "value": 250,
      "trend": "+15%",
      "metadata": {"prevPeriod": 217, "change": 33}
    },
    {
      "label": "Pass Rate",
      "value": "87%",
      "trend": "-2%",
      "metadata": {"prevPeriod": 0.89}
    },
    {
      "label": "Avg Duration",
      "value": "45s",
      "trend": "stable",
      "metadata": {"min": 20, "max": 120}
    }
  ],
  "lastUpdated": "2026-08-16T14:30:00Z"
}
```

---

#### `GET /api/reports/dashboards/defect-summary?projectId=proj_123`
**Purpose:** Fetch defect KPI cards

**Response (200):**
```json
{
  "projectId": "proj_123",
  "period": "last_30_days",
  "cards": [
    {
      "label": "Open by Severity",
      "value": {"critical": 3, "major": 12, "minor": 45},
      "trend": "-1 critical"
    },
    {
      "label": "Mean Time to Close",
      "value": "3.2d",
      "trend": "-0.5d"
    },
    {
      "label": "Reopens",
      "value": 7,
      "trend": "-2"
    }
  ],
  "lastUpdated": "2026-08-16T14:30:00Z"
}
```

---

#### `GET /api/reports/dashboards/trend-30d?projectId=proj_123`
**Purpose:** Fetch 30-day pass/fail trend data for chart

**Response (200):**
```json
{
  "projectId": "proj_123",
  "data": [
    {"date": "2026-07-17", "passed": 150, "failed": 20, "total": 170},
    {"date": "2026-07-18", "passed": 155, "failed": 18, "total": 173}
  ],
  "summary": {
    "avgPassRate": 0.887,
    "trend": "improving",
    "bestDay": "2026-07-25",
    "worstDay": "2026-07-18"
  }
}
```

---

### AI-Assisted Playwright Step Generation

#### `POST /api/automation/generate-steps`
**Purpose:** Generate test steps from natural language (async via Hatchet)

**Request:**
```json
{
  "scenario": "User logs in with valid credentials",
  "appUrl": "https://app.example.com",
  "pastTestIds": ["test_001", "test_002"],
  "projectId": "proj_123"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "hatchet_job_abc",
  "status": "queued",
  "estimatedWaitTime": 30
}
```

#### `GET /api/automation/generate-steps/:jobId`
**Purpose:** Poll generation job status

**Response (200 while running):**
```json
{
  "jobId": "hatchet_job_abc",
  "status": "running",
  "progress": 0.5
}
```

**Response (200 when done):**
```json
{
  "jobId": "hatchet_job_abc",
  "status": "done",
  "steps": [
    {"action": "navigate", "url": "https://app.example.com/login", "screenshot": true, "confidence": 0.95},
    {"action": "fill", "selector": "input[name='email']", "value": "user@example.com", "confidence": 0.88},
    {"action": "click", "selector": "button[type='submit']", "confidence": 0.92},
    {"action": "wait", "selector": "text=Dashboard", "timeout": 5000, "confidence": 0.85},
    {"action": "assertion", "type": "text", "selector": ".greeting", "expected": "Hello User", "confidence": 0.90}
  ],
  "overallConfidence": 0.90,
  "readingFromKb": ["Test Strategy: Login Flow", "Past Test: Login with OTP"]
}
```

---

## DATABASE CHANGES (M5 SCOPE)

### New Tables

#### `automation_suites`
```sql
CREATE TABLE automation_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  spec_json JSONB NOT NULL DEFAULT '{}',
  browser_type VARCHAR(50) DEFAULT 'chromium',
  headless BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(project_id, name)
);
CREATE INDEX idx_automation_suites_project ON automation_suites(project_id);
```

#### `automation_runs`
```sql
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES automation_suites(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  environment VARCHAR(100),
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'pass', 'fail', 'stopped')),
  hatchet_job_id VARCHAR(255),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_duration_sec INT,
  result_count INT DEFAULT 0,
  pass_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  INDEX idx_automation_runs_project ON project_id,
  INDEX idx_automation_runs_status ON status
);
```

#### `automation_artifacts`
```sql
CREATE TABLE automation_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  artifact_type VARCHAR(50) NOT NULL CHECK (artifact_type IN ('screenshot', 'har', 'console_log', 'env_snapshot', 'video')),
  r2_url VARCHAR(2048),
  file_size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_automation_artifacts_run ON automation_run_id
);
```

#### `flake_signals` (Materialized View Helper Table)
```sql
CREATE TABLE flake_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  pass_rate_5run DECIMAL(3, 2),
  pass_rate_10run_historical DECIMAL(3, 2),
  classification VARCHAR(50) CHECK (classification IN ('FLAKY', 'STABLE', 'BROKEN')),
  rerun_count INT DEFAULT 5,
  first_detected_at TIMESTAMP,
  last_confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(test_case_id, project_id)
);
CREATE INDEX idx_flake_signals_project ON flake_signals(project_id);
```

### Materialized Views

#### `run_summary_metrics`
```sql
CREATE MATERIALIZED VIEW run_summary_metrics AS
SELECT
  project_id,
  DATE_TRUNC('day', NOW())::DATE as metric_date,
  COUNT(*) as total_runs,
  ROUND(100.0 * COUNT(CASE WHEN status = 'pass' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as pass_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM (ended_at - started_at))), 0)::INT as avg_duration_sec,
  MAX(updated_at) as last_run_at
FROM automation_runs
WHERE updated_at >= NOW() - INTERVAL '30 days'
GROUP BY project_id;

CREATE UNIQUE INDEX idx_run_summary_metrics ON run_summary_metrics (project_id, metric_date);
```

#### `defect_summary_metrics`
```sql
CREATE MATERIALIZED VIEW defect_summary_metrics AS
SELECT
  project_id,
  DATE_TRUNC('day', NOW())::DATE as metric_date,
  COUNT(CASE WHEN status = 'open' AND severity = 'critical' THEN 1 END) as open_critical,
  COUNT(CASE WHEN status = 'open' AND severity = 'major' THEN 1 END) as open_major,
  COUNT(CASE WHEN status = 'open' AND severity = 'minor' THEN 1 END) as open_minor,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))), 0)::INT as mttr_sec,
  COUNT(CASE WHEN reopen_count > 0 THEN 1 END) as reopen_count
FROM defects
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY project_id;

CREATE UNIQUE INDEX idx_defect_summary_metrics ON defect_summary_metrics (project_id, metric_date);
```

#### `pass_fail_trend`
```sql
CREATE MATERIALIZED VIEW pass_fail_trend AS
SELECT
  project_id,
  DATE_TRUNC('day', automation_runs.created_at)::DATE as date,
  COUNT(CASE WHEN status = 'pass' THEN 1 END) as passed,
  COUNT(CASE WHEN status = 'fail' THEN 1 END) as failed,
  COUNT(*) as total
FROM automation_runs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY project_id, date
ORDER BY project_id, date;

CREATE INDEX idx_pass_fail_trend_project ON pass_fail_trend (project_id, date);
```

### Migrations

- **Migration file:** `2026-08-03_001_create_automation_tables.sql`
  - Creates all tables above
  - Creates indexes
  - Grants permissions to `api_user` role
- **Refresh schedule:** `REFRESH MATERIALIZED VIEW CONCURRENTLY run_summary_metrics;` every 60 min

---

## TESTING PLAN

### Unit Tests (Target: ≥80% Coverage)

**Modules to test:**
- `PlaywrightRunner.ts` — step execution, artifact capture, error handling
- `FlakeDetectionService.ts` — pass rate calculation, classification logic
- `ReportAggregator.ts` — KPI computation, trend calculation
- `AutomationController.ts` — API request validation, response serialization

**Tools:** Jest + ts-jest, coverage threshold enforced in CI

---

### Integration Tests (Target: ≥70% Critical Paths)

**Scenarios:**
- E2E automation: create suite → enqueue → run → verify artifacts in R2
- Flake detection: 5 re-runs → pass rate → classification → UI badge
- Report generation: query materialized views → aggregate metrics → serialize response
- API security: verify RBAC enforced, unauthenticated requests rejected

**Tools:** Jest + test containers (PostgreSQL), Hatchet mock jobs

---

### E2E Tests (Playwright via Runner)

**3 Critical Journeys:**
1. **Auth Journey:** Register → Login → Project Picker
2. **Test Case Creation:** Create case → A1 generate steps → Save
3. **Defect Flow:** Create run → Execute → Fail → Log defect → Push to Jira

**Tools:** Playwright (self-test via automation runner MS5-T017)

---

### Performance Tests (k6)

**Load test scenario:** 10 concurrent users × 5 min, 2–3 rounds

**SLOs:**
- p95 API latency <500ms (target <300ms)
- p95 doc gen <60s
- p95 RCA <10s
- Error rate <2%

---

### Security Scans (GitHub Actions)

**Weekly SAST + SCA:**
- Snyk: dependency vulnerabilities, code smells
- Trivy: container image vulnerabilities
- OWASP ZAP: API endpoint vulnerabilities (POST request injection, auth bypass)

---

## FEATURE FLAG STRATEGY

| Flag | Feature | Owning Task | Default | Rollout Phase | Kill Switch | Retirement |
|------|---------|-------------|---------|---|---|---|
| `automation.playwright_runner` | Playwright automation runner + Hatchet | MS5-T002 | `false` | Dark → Canary 10% (W3 Wed) → GA (W3 Sat) | `unleash disable automation.playwright_runner` | 2026-09-21 |
| `ai.auto_playwright` | AI-assisted step generation | MS5-T010 | `false` | Dark → Canary 5% (W2 Thu) → GA (W3 Sat) | `unleash disable ai.auto_playwright` | 2026-09-21 |
| `reports.basic_v1` | Basic reports dashboards | MS5-T011 | `false` | Dark → Canary 20% (W2 Wed) → GA (W3 Sat) | `unleash disable reports.basic_v1` | 2026-09-21 |

---

## RISK & BLOCKER REGISTER

| R-ID | Description | Likelihood | Impact | Owner | Mitigation | Status |
|------|-----------|-----------|--------|-------|-----------|--------|
| **MS5-R001** | Playwright worker concurrency exceeds Oracle VM budget (CPU throttle) | Medium | High | DevOps | Max 3 concurrent workers, circuit breaker on CPU >80% | Monitoring |
| **MS5-R002** | Flake detection false positives (>20% mislabeled tests) | Medium | Medium | Analytics | Validate on synthetic 5-run dataset, adjust pass-rate thresholds if needed | Pre-launch test |
| **MS5-R003** | Report query performance degrades with >100K defects | Low | High | Backend | Materialized view refresh during off-peak, index optimization, partition if needed | Loadtest TBD |
| **MS5-R004** | Pilot onboarding friction (low adoption in week 1) | Medium | High | PM | Live training, weekly check-ins, fast response SLA (<2h) | Mitigation |
| **MS5-R005** | MVP launch slippage (features not ready by 2026-08-16) | Low | Critical | Eng Lead | P0 exit gate enforcement, daily standup, scope descope if needed | Daily tracking |
| **MS5-R006** | Jira OAuth token expiry mid-pilot (defect sync breaks) | Low | Medium | Backend | Token refresh implemented in M3, test refresh flow weekly | Done |
| **MS5-R007** | GlitchTip/SigNoz disk full (observability blackout) | Low | High | DevOps | Auto-cleanup old logs, alert at 70% capacity, extend disk space if needed | Preventive |
| **MS5-R008** | A4 RCA accuracy <60% during automation runs (confidence miscalibrated) | Low | Medium | AI | Weekly human audit, Langfuse evals, retrain if needed | Weekly review |

---

## ROLLBACK PLAN

**Trigger Conditions (any one triggers rollback decision):**
1. **P0 Bug:** Unrecoverable error affecting >20% of pilot users
2. **Data Corruption:** Automation artifacts lost, defects missing from Jira
3. **Performance SLO Breach:** p95 latency >1s for >30 min despite mitigation attempts
4. **Security Incident:** Unauthenticated access to defects, R2 bucket traversal

**Rollback Steps (RTO: <30 min):**

1. **Immediate (5 min):**
   - Disable feature flags: `unleash disable automation.playwright_runner reports.basic_v1 ai.auto_playwright`
   - Notify pilots in Slack: "We've temporarily disabled automation features while we investigate. Manual test logging still works."
   - Page on-call engineer + PM

2. **Investigation (10 min):**
   - Check GlitchTip for error patterns
   - Check SigNoz for latency spikes or resource exhaustion
   - Check Hatchet job queue for stuck jobs
   - Pull logs: `ssh oracle-vm; journalctl -u api | tail -100`

3. **Fix or Revert (10 min):**
   - **If transient issue (e.g., Ollama OOM):** Restart service, re-enable flag, monitor 10 min
   - **If code bug:** Revert last commit (`git revert -n HEAD`) + re-deploy to Vercel, test on dev, re-enable flags
   - **If data corruption:** Restore DB from R2 backup (see MS5-T015)

4. **Post-Rollback (5 min):**
   - Verify normal operation: test login, create case, log defect
   - Notify pilots: "Resolved. Re-enabling automation features."
   - File incident post-mortem in Jira (due within 24h)

**Data Migration Reversal Strategy:**
- If rolling back migrations: `npm run migrate:undo` (reverts last migration)
- If rolling back from backup: restore via `psql < /tmp/qaix-backup.sql`, verify row counts, restart services

**No-Rollback Alternative (Graceful Degrada):**
- If issue affects only AI features (`ai.auto_playwright`): disable flag, let manual workflow continue
- If issue affects only reports (`reports.basic_v1`): disable flag, let execution + defect logging continue
- If issue affects only automation (`automation.playwright_runner`): disable flag, pilots use manual runs

---

## MILESTONE EXIT CRITERIA (DEFINITION OF DONE)

**All criteria must be "Go" (green) for MVP launch approval.**

1. **Code Quality:**
   - All tasks merged to `main`
   - Code review complete + approved by 2 reviewers
   - CI/CD pipeline green (lint, type check, unit tests, security scan)
   - Zero ESLint errors, code coverage ≥80% for new code

2. **Testing:**
   - All 20 task acceptance criteria verified (AC01–AC21)
   - 3 critical Playwright journeys pass (E2E tests MS5-T017)
   - Flake detection validation complete (95%+ accuracy, MS5-T018)
   - Load test passed (10 VUs, p95 <500ms, error rate <2%, MS5-T014)

3. **Performance:**
   - p95 API latency <300ms (verified in load test)
   - p95 doc generation <60s
   - p95 RCA <10s
   - p95 search <500ms
   - Page load time (Lighthouse) ≥85

4. **Observability:**
   - SigNoz dashboards green for 7 consecutive days (no error spikes)
   - GlitchTip <5 P0 errors per day, <20 P1 errors
   - Langfuse traces captured for all A1/A2/A4 agents
   - Alerts configured + firing correctly (test fire, then silence)

5. **Defect Quality:**
   - 0 open P0 bugs
   - <3 open P1 bugs (all tracked in backlog for v1.5)
   - <10 open P2 bugs

6. **Documentation:**
   - Release notes drafted + reviewed by PM
   - User guide (5–10 pages) published in KB
   - Admin guide published
   - API docs (OpenAPI) generated + reviewed
   - On-call runbook (MS5-T019) complete + tested

7. **Pilot Readiness:**
   - 2–3 Iksula projects confirmed + contacts verified
   - Training sessions completed (all pilots can independently: create case, log defect, view report)
   - Success metrics dashboard live + baseline captured
   - Support channel (#qa-nexus-pilots) created + monitored

8. **Security & Compliance:**
   - WCAG 2.2 AA audit complete, ≥90% pass rate
   - No critical vulnerabilities in Snyk scan
   - Backup/restore tested end-to-end (RTO <4h, data integrity verified)
   - Audit log complete (all user + agent actions logged)

9. **Feature Flags:**
   - All 3 flags wired (dark launch state)
   - Rollout plan documented + approved
   - Kill switches tested (disable flag, verify graceful degradation)

10. **Go/No-Go Gate:**
    - Review meeting held (Fri, 2026-08-22, 2–3 PM)
    - All 9 exit criteria evaluated + approved
    - Decision recorded + signed (PM + Tech Lead)
    - Launch approved by leadership

---

## NEXT MILESTONE PREVIEW (M6: GA PREP)

**M6 High-Level Scope (2026-08-17 → 2026-09-20, 5 weeks post-MVP):**

- **Legal + Compliance:** GDPR right-to-delete, SOC 2 Type II readiness, privacy policy, ToS
- **Security Audit:** Penetration testing, OAuth 2.0 security review, secrets rotation
- **Monitoring + On-Call:** Datadog/PagerDuty integration, escalation runbooks, incident response playbook
- **Marketing + Sales:** Landing page, sales deck, competitive brief, pricing tier options
- **Support Enablement:** FAQ, support ticketing system, customer success playbook
- **Full Reports (Deferred from M5):** Release Readiness Report, RCA Aggregate, full Exec Dashboard, PDF/XLSX export
- **Performance Optimization (if needed):** Caching layer tuning, database partitioning, CDN edge caching
- **Documentation:** Comprehensive user manual, API docs (GraphQL if needed), architecture ADRs

---

## HANDOFF NOTES

**Delivered M5:**
- Playwright automation runner + Hatchet job execution
- R2 artifact storage (screenshots, HAR, logs, env snapshots)
- Flake detection algorithm (5-run strategy, 20–80% pass rate threshold)
- Basic reports (3 KPI dashboards + 30-day trend chart)
- AI-assisted Playwright step generation (LangGraph variant, gated behind `ai.auto_playwright` flag)
- MVP launch checklist + go/no-go gate
- 2–3 Iksula pilot teams onboarded + live
- Zero P0 bugs, <3 P1, observability green 7 days

**Known Deferred Items (v1.5+):**
- Full custom dashboards (pivot tables, drill-down, cohort analysis)
- Scheduled email reports
- PDF/XLSX export (export as image only in MVP)
- Analytics warehouse (post-MVP scale path)
- Traceability matrix report
- Cloud device grid / BrowserStack partnership
- Playwright self-healing (A7 step correction, v1.5)
- Full test planning agent (A8, v1.5)

**Technical Debt Logged:**
- Materialized view refresh during load test causes occasional lock contention (acceptable for MVP, optimize in M6)
- Ollama fallback to Gemini 2.5 Flash needs rate-limit monitoring (free tier: 1.5K req/day)
- Flake detection confidence scoring calibrated on synthetic data (validate against real pilot data)

**Lessons Learned (to feed M6 roadmap):**
- Pilots requested faster feedback on test execution (consider WebSocket streaming of results)
- Report dashboard performance depends heavily on materialized view refresh strategy
- AI step generation approval flow requires high confidence threshold to avoid user frustration

---

## APPENDIX

### Glossary

- **Flaky Test:** Test that passes inconsistently (20–80% pass rate over last 10 runs)
- **Materialized View:** Cached query result in PostgreSQL, refreshed on schedule
- **Hatchet:** Postgres-backed job queue for async work (document gen, automation runs, report generation)
- **R2:** Cloudflare object storage for evidence (screenshots, HAR, logs)
- **pgvector:** PostgreSQL extension for semantic search (embeddings)
- **KPI:** Key Performance Indicator (metrics card in dashboard)
- **Confidence Scoring:** LLM-assigned probability (0–1) that output is correct
- **Rollout Pattern:** Gradual feature release (dark → internal → canary → GA)

### Reference Links

- [Milestone Registry](./MILESTONE_REGISTRY.md) — Cross-milestone dependencies, DoR/DoD chain
- [PRD](./PRD.md) — Product requirements, user stories, success metrics
- [ERD](./ERD.md) — Database schema, API contracts, components
- [DESIGN](./DESIGN.md) — UI/UX patterns, accessibility guidelines
- [GitHub Issues](https://github.com/iksula/qa-nexus/issues) — Task tracking
- [SigNoz](https://signoz.oracle-vm-ip:3000) — Observability dashboard
- [GlitchTip](https://glitchtip.oracle-vm-ip:8000) — Error tracking
- [Unleash](https://unleash.oracle-vm-ip:4242) — Feature flags

---

**END OF MILESTONE M5 DOCUMENT**

Version 1.0 | Final | Ready for Go/No-Go Gate Review
