---
milestone_id: M8
parent_project_milestone: PM2
phase: v1.5
canonical_source: PROJECT_ROADMAP.md v1.2
version: 1.0
date: 2026-04-22
start_date: 2026-10-13
end_date: 2026-10-31
duration_weeks: 3
duration_calendar_days: 19
week_within_pm2: "W4-6"
team_size_fte: "3 (1 backend, 1 AI eng, 1 QA)"
owner: "AI Engineer Lead"
predecessors: ["M7 (Test Data Generation)", "M6 (GA prep)"]
successors: ["M9 (A8 Advanced)", "M10 (AI Product Tester)"]
primary_agent: "A7 (Test Maintenance / Self-Healing)"
status: "Planned"
---

# Milestone M8 — Test Maintenance Self-Healing (A7)

## Executive Summary

M8 delivers **A7 Test Maintenance (Self-Healing)**, enabling intelligent, background suggestions for fixing brittle automation tests without silent edits. When test execution uncovers broken locators, timeout mismatches, or environment-specific failures, A7 analyzes failure patterns, suggests targeted fixes (selector updates, retry logic, wait conditions), and surfaces them in an approve-in-context modal. QA engineers review suggestions, approve fixes with one click, and A7 applies changes + re-runs the test for validation. This milestone reduces flaky test rework time by 40%, unblocks continuous test execution in pipelines, and establishes the governance model (HITL approval, never auto-apply) that carries through M9+ agents.

**Mission:** Shift test maintenance from reactive (engineer debugs failures manually) to proactive (A7 suggests, engineer approves). Enable self-healing without governance risk.

**Key Deliverables:**
- A7 agent using LangGraph: failure pattern analysis → root cause hypothesis → suggestion generation → approval
- Background monitor: watches test runs (M5 automation runner output), detects flaky patterns
- Suggestion engine: selector heuristics (nearest-sibling, ARIA role, text-anchor, visual-anchor), retry logic, timeout adjustment
- Approval modal: approve-in-context only (never silent), HITL gate for all changes
- Batch approval UI: queue of pending suggestions (per-suite), grouped approvals
- Test re-execution + validation: once approved, run test again, measure improvement
- Flaky test dashboard: pass rate trends (before/after A7), improvement metrics, root cause taxonomy
- Audit trail: every suggestion + approval + failure logged to TB-012
- Integration with M14 (Test Selection, PM3): high-churn areas get prioritized heals

**Success Criteria:** ≥40% flaky test reduction measured in pilot cohort (over 2-week baseline); ≥80% suggestion approval rate; suggestion latency p95 <5s per broken locator; zero unintended side effects (A7 fix breaks other tests <2%).

---

## Context: What Shipped Before

**PM1 Foundation (M0–M6):**
- Test case management + Playwright automation runner (M5)
- Flake detection algorithm (5-run strategy, 20–80% pass rate classification)
- Evidence capture (screenshot, HAR, console logs, env snapshot)
- Defect creation + A4 RCA (5-layer analysis)

**PM2 Earlier (M7 completion gate for M8 entry):**
- Synthetic test data generation (A6) enables deterministic, reproducible test scenarios
- Observability mature (Langfuse, SigNoz) capturing agent performance + failure patterns
- Audit trail infrastructure (TB-012) immutable and searchable
- Feature flags (Unleash) enable safe rollouts of AI features

**What M8 Unlocks Downstream:**
- M9 (Risk-Adaptive Planning) consumes A7 healing suggestions to identify high-risk code areas
- M10 (AI Product Tester) uses A7 heuristics for exploratory automation (element discovery)
- M11 (Visual Regression) leverages A7 healing for cross-browser/viewport selector fixes
- M13 (Low-Code Authoring, PM3) references A7 healing in visual editor (auto-repair broken steps)
- M14 (Test Selection, PM3) prioritizes healing for high-churn modules identified by A7 pattern analysis
- M15 (Full Test Planning, PM3) incorporates stability signals from A7 into coverage recommendations

---

## Scope

### In Scope (Delivering in M8)

1. **A7 Agent Architecture**
   - LangGraph: failure analysis → failure taxonomy (selector, timing, environment, assertion) → healing suggestions
   - Confidence scoring per suggestion (0.0–1.0)
   - HITL approve-in-context modal (show original + fixed test, user must click "Approve")
   - Never auto-apply fixes (even if confidence >0.95)

2. **Failure Pattern Detection**
   - Monitor test_runs + test_results (M5 automation runner output)
   - Classify failures: broken selector (element not found), timeout (wait exceeded), assertion fail, env mismatch
   - Compute flakiness: test passes sometimes, fails randomly → candidate for healing
   - Trigger A7 on: 3+ failures in last 10 runs, pass rate 20–80%

3. **Locator Healing Heuristics**
   - **Selector Strategies (in priority order):**
     1. Nearest sibling: if button moved, find by adjacent label
     2. ARIA role: if button lost ID, find by role="button" + text
     3. Text anchor: if selector broke, find by button text (case-insensitive)
     4. Visual anchor: if all else fails, find by visual position on page (experimental, feature-flagged)
   - **Implementation:** Playwright locator strategies + fallback logic
   - **Validation:** Test new selector on live page (before user approval)

4. **Retry & Timeout Adjustment**
   - Detect timeout failures: "waiting for selector timed out after 30s"
   - Suggest: increase timeout to 60s OR add explicit retry (exponential backoff, max 3 retries)
   - Detect flaky assertion: assertion passes 70% of time → suggest retry
   - Output: code snippet (JavaScript/Playwright syntax) for approval

5. **Approval Workflow**
   - Background process queues suggestions (no user action until suggestion ready)
   - UI modal: show test name, failure context (screenshot), original selector, suggested fix, confidence
   - User actions: "Approve Fix", "Reject & Explain", "Ignore This Suggestion"
   - Batch mode: queue 10+ suggestions, group by suite, approve all at once (with warning)
   - Approval state audit logged to TB-012

6. **Test Re-Execution & Validation**
   - Once approved, immediately enqueue test re-run (via M5 Hatchet runner)
   - Capture result: pass/fail
   - If pass: mark suggestion as "effective", log improvement to dashboard
   - If fail: mark as "ineffective", prompt user "Fix didn't work, would you like to try another suggestion?"
   - Max 2 auto-re-runs per suggestion (prevent retry loop)

7. **Flaky Test Dashboard**
   - **Metrics per test case:**
     - Pass rate trend (30-day, with/without A7 fixes applied)
     - Flakiness timeline (when flakiness started, when fixed)
     - Root cause breakdown (pie chart: selector 40%, timing 35%, environment 15%, assertion 10%)
     - A7 healing status: pending suggestions, approved fixes, effectiveness %
   - **Bulk view (per suite):**
     - Total flaky tests, total healed, total still flaky
     - Healing effectiveness: % of suggestions approved, % of approved actually fixed problem
   - **Improvement metrics:**
     - "Flaky test reduction: 42% since M8 start" (vs baseline)
     - "Most improved test: LoginFlow (80% → 98% pass rate)"

8. **Audit Trail & Governance**
   - TB-012 entries: action='healing_suggestion_generated', 'healing_suggestion_approved', 'healing_suggestion_applied', 'test_rerun_result'
   - Immutable log: every decision tracked
   - Compliance-ready: export audit trail for GxP/HIPAA (PM3)

### Out of Scope (Deferred)

- Visual regression locator healing (M11)
- Mobile app element healing (M11)
- Code generation for complex fixes (e.g., rewrite test step logic) — M13 (low-code authoring)
- Predictive healing (heal before failure observed) — M9 (risk-adaptive planning)
- Cross-team healing rules (standardized selectors) — PM3 governance

### Rationale

- Selector healing is 60–70% of flaky test issues in practice; return on investment is high
- HITL approval prevents governance risk (A7 never silently changes tests)
- Batch approval enables scaling to 100+ flaky tests without fatigue
- Re-execution validation prevents false positives (suggestion doesn't actually fix problem)
- Dashboard provides feedback loop for improving A7 heuristics (effectiveness tracking)

---

## Exit Gate + Acceptance Criteria

**Milestone Exit Gate (GoNogo Decision, 2026-10-31):**

A7 self-healing production-ready: 40% flaky test reduction pilot + ≥80% suggestion approval rate + <5s suggestion latency + zero unintended side effects.

| AC-ID | Acceptance Criterion | Verifier | Pass/Fail |
|-------|-----|----------|----------|
| **M8-AC001** | A7 detects flaky test patterns (pass rate 20–80% over 10 runs) with ≥90% accuracy | QA | TBD |
| **M8-AC002** | Suggestion engine generates ≥3 distinct healing strategies per broken locator (nearest sibling, ARIA, text anchor) | Backend | TBD |
| **M8-AC003** | Suggestion latency p95 <5s per broken locator (measured via SigNoz) | Backend | TBD |
| **M8-AC004** | Approve-in-context modal enforced: user must explicitly click "Approve", never auto-apply | Frontend | TBD |
| **M8-AC005** | Test re-execution on approval: enqueue runner job, capture result, mark effectiveness | Backend | TBD |
| **M8-AC006** | Suggestion approval rate ≥80% (of total suggestions generated, ≥80% approved by human) | QA | TBD |
| **M8-AC007** | Healing effectiveness ≥70% (of approved suggestions, ≥70% actually fix problem per re-run validation) | QA | TBD |
| **M8-AC008** | Flaky test reduction ≥40% in pilot cohort (baseline → after 2 weeks A7 enabled) | PM | TBD |
| **M8-AC009** | Side effect rate <2% (of approved fixes, <2% break other tests, measured via E2E suite) | QA | TBD |
| **M8-AC010** | Batch approval UI functional: queue 10 suggestions, group by suite, approve all at once | Frontend | TBD |
| **M8-AC011** | Flaky test dashboard renders: pass rate trends, root cause breakdown, A7 effectiveness metrics | Frontend | TBD |
| **M8-AC012** | Audit trail logged for 100% of suggestions (generated, approved, applied, re-run result) to TB-012 | Backend | TBD |
| **M8-AC013** | Feature flag `ai.auto_heal_selectors` toggles correctly; when disabled, suggestions not generated | DevOps | TBD |
| **M8-AC014** | Observability: Langfuse captures A7 invocations; SigNoz dashboard shows suggestion rate + approval rate + effectiveness | DevOps | TBD |
| **M8-AC015** | Pilot testing: 2 pilots (5–8 automation engineers) can independently review + approve suggestions without training beyond 30 min intro | PM | TBD |

**V2 Working Hypothesis (Quantified Targets):**
- ≥40% flaky test reduction is pilot target, measured against M5 baseline (% of tests in 20–80% pass rate band). Initial pilots expect 38–45%; tuning in W3 (T006).
- ≥80% approval rate assumes suggestions are high-confidence. Initial runs expect 75–85%; refine heuristics if <75%.
- <5s suggestion latency allows background processing without blocking test execution UI.
- <2% side effect rate ensures A7 healing doesn't introduce new bugs (critical for trust).

---

## Feature / Task Breakdown (Week-Wise)

### WEEK 1: A7 AGENT + FAILURE PATTERN DETECTION (2026-10-13 → 2026-10-19)

#### M8-T001: A7 LangGraph Agent Design & Implementation
**Description:** Define and implement LangGraph node graph for self-healing. Route test failure → failure analysis → suggestion generation → approval → re-run.

**Details:**
- **Input:** Test case, failure context (screenshot, error message, selector)
- **Node 1: Failure Classification**
  - Parse error message: "element with selector 'button#login' not found" → "broken selector"
  - Check screenshot: element visible? Might be off-screen → "timing issue"
  - Check log: "AssertionError: expected true, got false" → "assertion failure"
  - Classify: SELECTOR_BROKEN, TIMEOUT, ASSERTION, ENVIRONMENT, UNKNOWN
- **Node 2: Context Gathering**
  - Fetch past runs of same test: pass/fail counts, error patterns
  - Fetch test step code: understand what was being tested
  - Fetch browser viewport: might hint at responsive design issue
- **Node 3: Suggestion Generation**
  - If SELECTOR_BROKEN: apply heuristics (nearest sibling, ARIA, text anchor)
  - If TIMEOUT: suggest wait condition OR retry logic
  - If ASSERTION: suggest assertion retry
  - Output: list of suggestions, each with confidence + rationale
- **Node 4: HITL Approval Gate**
  - Display modal: test name, original failure screenshot, suggested fix, confidence, re-run result
  - Wait for user: "Approve", "Reject", "Ignore"
- **Node 5: Apply Fix (on Approval)**
  - Update test_cases.test_code with new selector/timeout
  - Log to audit_events with action='healing_applied'
- **Node 6: Test Re-Execution**
  - Enqueue runner job for same test
  - Capture result (pass/fail)
  - Log effectiveness

**Priority:** P0  
**Estimate:** 28 hours  
**Owner:** AI Engineer + Backend Lead  
**Dependencies:** M5 test runner, M6 observability, Langfuse integration  
**US-ID:** US-052 (test maintenance / self-healing)  
**TB/EP:** TB-012 (audit), EP-074 (new healing suggestion endpoint)

---

#### M8-T002: Failure Pattern Detection + Flakiness Scoring
**Description:** Monitor test_runs table, detect patterns (20–80% pass rate), classify failure root causes.

**Details:**
- **Background Job (Hatchet cron, every 10 min):**
  - Query test_results for last 10 runs per test case
  - Group by status (pass/fail)
  - Compute pass rate: pass_count / (pass_count + fail_count)
  - If 0.20 ≤ pass_rate ≤ 0.80: mark as FLAKY, enqueue A7 healing job
- **Failure Classification:**
  - Parse error message (regex):
    - "element not found" → SELECTOR_BROKEN
    - "waiting for.*timed out" → TIMEOUT
    - "expected.*got" → ASSERTION
    - "dial.*connection refused" → ENVIRONMENT
    - else → UNKNOWN
  - Store classification in TB-021 `healing_signals` (new table)
- **Flakiness Scoring:**
  - Volatility metric: standard deviation of pass/fail sequence (last 10 runs)
  - If volatility high (e.g., [P, F, P, F, P, F, ...]) → high healing candidate
  - If volatility low but pass rate 20–80% (e.g., [P, P, P, P, F, F, F, F, ...]) → environment-specific

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer  
**Dependencies:** M5 test execution data, TB-021 schema  
**US-ID:** US-052  
**TB/EP:** TB-021 (new)

---

#### M8-T003: Selector Healing Heuristics (Nearest Sibling, ARIA, Text Anchor)
**Description:** Implement Playwright locator strategies for fixing broken selectors.

**Details:**
- **Strategy 1: Nearest Sibling**
  - Original selector: `button#login` (ID removed by refactor)
  - Screenshot analysis: find label near button position
  - New selector: `label:has-text('Login') + button`
  - Confidence: 0.85 (not ID, but stable if label stays)
- **Strategy 2: ARIA Role**
  - Original: `#submit-btn`
  - If element has role="button", rewrite to: `button:has-text('Submit')`
  - Confidence: 0.90 (role attributes stable)
- **Strategy 3: Text Anchor**
  - Original: `button.button-primary` (class deleted)
  - Fallback to text: `button:has-text('Submit')` or `text='Submit'` (in Playwright)
  - Confidence: 0.75 (text can change, localization risk)
- **Strategy 4: Visual Anchor (experimental, feature-flagged)**
  - Use Visual Regression baseline (M11) to find element by position + appearance
  - Confidence: 0.60 (less robust)
- **Implementation:**
  - Function: `healSelector(originalSelector, screenshot, testCode) → List<Suggestion>`
  - Each suggestion: {strategy, newSelector, confidence, rationale}
  - Validate: test new selector against live page (Playwright `locator().isVisible()`)

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** Backend Engineer + QA  
**Dependencies:** Playwright library, screenshot analysis (M5 evidence)  
**US-ID:** US-052  
**TB/EP:** None (library integration)

---

#### M8-T004: Healing Suggestion Schema + Audit Integration
**Description:** Design TB-021 `healing_signals` + TB-022 `healing_suggestions`. Wire audit logging to TB-012.

**Details:**
- **TB-021 `healing_signals` (tracking flaky patterns):**
  ```sql
  CREATE TABLE healing_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    failure_count INT,
    pass_count INT,
    pass_rate DECIMAL(3,2),
    failure_classification VARCHAR(50),  -- SELECTOR_BROKEN, TIMEOUT, ASSERTION, ENVIRONMENT
    first_failed_at TIMESTAMP,
    last_failed_at TIMESTAMP,
    healing_triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_healing_signals_project ON (project_id, pass_rate)
  );
  ```
- **TB-022 `healing_suggestions` (tracking generated + approved suggestions):**
  ```sql
  CREATE TABLE healing_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id UUID NOT NULL REFERENCES test_cases(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    failure_classification VARCHAR(50),
    suggestion_type VARCHAR(50),  -- SELECTOR_UPDATE, TIMEOUT_INCREASE, RETRY, WAIT_CONDITION
    original_value VARCHAR(1024),  -- original selector or timeout
    suggested_value VARCHAR(1024),  -- new selector or timeout
    confidence DECIMAL(3,2),
    approval_state VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, ignored
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    test_result_after_approval VARCHAR(50),  -- pass, fail, pending
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,  -- system
    INDEX idx_healing_suggestions_test_case ON (test_case_id, approval_state)
  );
  ```
- **Audit Logging (TB-012):**
  - On suggestion generated: log action='healing_suggestion_generated' + metadata={failure_class, suggestion_type, confidence}
  - On approval: log action='healing_suggestion_approved' + metadata={approved_by, original, suggested}
  - On applied: log action='healing_applied' + metadata={test_case_id, suggestion_id}
  - On re-run result: log action='healing_test_rerun' + metadata={result, effectiveness}

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer  
**Dependencies:** TB-012 live, Postgres  
**US-ID:** US-052  
**TB/EP:** TB-021, TB-022, TB-012 (audit)

---

### WEEK 2: APPROVAL UI + BATCH APPROVALS + RE-EXECUTION (2026-10-20 → 2026-10-26)

#### M8-T005: Approve-in-Context Modal + Batch Queue UI
**Description:** Build React components for suggestion modal (single approval) + batch queue (multiple approvals per suite).

**Details:**
- **Modal: Single Suggestion Approval**
  - Title: "Healing Suggestion: LoginFlow"
  - Sections:
    1. Failure Context: screenshot (original failure), error message
    2. Original: selector/timeout code (pre-formatted)
    3. Suggested Fix: new selector/timeout code (syntax-highlighted)
    4. Confidence: "85% confident this will fix the issue"
    5. Rationale: "Nearest sibling strategy: label 'Login' found adjacent to button"
    6. Re-run Result: (if available) "Test passed after applying this fix" [green badge]
  - Actions: "Approve Fix", "Reject & Explain", "Ignore", "Close"
  - Keyboard shortcut: Enter = Approve, Esc = Close
- **Batch Queue: Multiple Suggestions**
  - Left sidebar: list of pending suggestions (grouped by suite)
  - Cards: test name, failure type, confidence, "View & Approve" button
  - Actions: "Approve All", "Reject All", "Ignore All" (with confirmation)
  - Progress: "5 of 12 approved" (progress bar)
  - Filtering: show pending, approved, rejected, effective (checkboxes)
- **Error States:**
  - If re-run result unavailable (pending): show spinner "Running validation test..."
  - If approval fails (network error): show "Retry" button
  - If test code changed since suggestion: warn "Original selector no longer matches code"

**Priority:** P0  
**Estimate:** 22 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M8-T001 (A7 agent), M8-T004 (healing_suggestions schema)  
**US-ID:** US-052  
**TB/EP:** EP-074 (GET /api/healing/suggestions), EP-075 (POST /api/healing/suggestions/:id/approve)

---

#### M8-T006: Test Re-Execution + Effectiveness Validation
**Description:** On suggestion approval, immediately enqueue test re-run. Measure improvement.

**Details:**
- **Post-Approval Flow:**
  1. User clicks "Approve Fix"
  2. System applies fix to test_cases.test_code (update SQL)
  3. Enqueue Hatchet job: `automation_run` (same test, same environment)
  4. Poll job status every 2s (WebSocket or polling via API)
  5. Once complete, update healing_suggestions.test_result_after_approval
- **Effectiveness Metric:**
  - If result = pass: mark_as_effective()
  - If result = fail: mark_as_ineffective()
  - Log to TB-012: action='healing_effectiveness_measured'
- **UI Feedback:**
  - Modal updates: "Result: PASS ✓" [green] OR "Result: FAIL ✗" [red]
  - Dashboard chart: effectiveness rate (% of approved fixes that actually worked)
- **Retry Logic:**
  - Max 1 re-run per suggestion (prevent retry loop)
  - If re-run fails: suggest alternative from list (e.g., "Try timeout increase instead")

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer  
**Dependencies:** M5 Hatchet runner, M8-T001  
**US-ID:** US-052  
**TB/EP:** EP-076 (POST /api/healing/suggestions/:id/apply-and-rerun)

---

#### M8-T007: Flaky Test Dashboard (Pass Rate Trends, Root Cause Breakdown, Effectiveness)
**Description:** Build dashboard showing flakiness timeline, healing impact, effectiveness metrics.

**Details:**
- **Page: `/reports/flaky-tests`**
  - **KPI Cards (top):**
    1. "Total Flaky Tests": count of tests in 20–80% pass rate band
    2. "Healed by A7": count with ≥1 approved suggestion
    3. "Still Flaky": count with pending suggestions or ineffective heals
    4. "Flakiness Reduction": "45% improvement vs M5 baseline" [green trend]
  - **Chart 1: Pass Rate Timeline (30-day, per test)**
    - X-axis: date
    - Y-axis: pass rate (0–100%)
    - Lines: before A7 enabled, after A7 enabled (color: red → green)
    - Annotation: when suggestion approved (vertical line)
    - Hover: show specific test name, pass rate on that day
  - **Chart 2: Root Cause Breakdown (pie)**
    - Slices: SELECTOR_BROKEN (40%), TIMEOUT (35%), ASSERTION (15%), ENVIRONMENT (10%)
    - Hover: count of tests per category
  - **Chart 3: A7 Effectiveness (bar)**
    - X-axis: suggestion types (Selector Update, Timeout Increase, Retry)
    - Y-axis: effectiveness % (approved fixes that actually worked)
    - Target: ≥70% per type
  - **Table: Top Improved Tests**
    - Columns: test name, pre-heal pass rate, post-heal pass rate, improvement %, A7 suggestion count
    - Sortable, filterable by project

**Priority:** P0  
**Estimate:** 18 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M8-T004, M8-T006 (effectiveness data)  
**US-ID:** US-052  
**TB/EP:** EP-077 (new flaky dashboard endpoint)

---

### WEEK 3: VALIDATION + TESTING + PILOT ROLLOUT (2026-10-27 → 2026-10-31)

#### M8-T008: Integration Tests + Suggestion Validation
**Description:** Write integration + E2E tests for A7. Validate suggestion quality, approval flow, effectiveness.

**Details:**
- **Unit Tests (≥80% coverage):**
  - Failure classification: error message parsing, category routing
  - Selector healing: heuristics (nearest sibling, ARIA, text) produce valid selectors
  - Confidence scoring: edge cases (unknown failure, low-confidence suggestion)
  - Flakiness scoring: pass rate calculation, volatility metric
- **Integration Tests:**
  - E2E: test failure → pattern detection → suggestion generated → user approves → test re-runs → effectiveness measured
  - Batch: 3 suggestions queued, batch approval via API, all applied + re-run
  - Audit: TB-012 entries logged for each action
  - Side effects: approved fix doesn't break other tests (run full E2E suite after approval)
- **Suggestion Quality Test:**
  - Create 5 intentionally broken tests (invalid selector, wrong timeout, assertion mismatch)
  - Run A7 on each
  - Manual review: are suggestions accurate? (5/5 correct = 100% accuracy)
  - Confidence scores reasonable? (high-confidence suggestions should mostly approve)
- **Effectiveness Validation:**
  - Create 10 flaky tests
  - Apply A7 suggestions to all
  - Measure: % of suggested fixes that actually improve pass rate
  - Target: ≥70% effectiveness

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** QA Engineer + Backend  
**Dependencies:** M8-T001–T007  
**US-ID:** US-052  
**TB/EP:** None (test infrastructure)

---

#### M8-T009: Observability + Monitoring Dashboard
**Description:** Wire A7 to Langfuse + SigNoz. Monitor suggestion rate, approval rate, effectiveness, latency.

**Details:**
- **Langfuse Integration:**
  - Log each A7 invocation: input (failure context), output (suggestions), latency, effectiveness
  - Create evals: "Is suggestion accurate?" (binary), "Does suggestion match failure?" (binary)
  - Retro-eval: run evals on past suggestions (human review sample)
- **SigNoz Metrics:**
  - Counter: `a7_suggestions_total` (labeled: failure_type, suggestion_type)
  - Counter: `a7_approvals_total` (labeled: approval_state)
  - Histogram: `a7_suggestion_latency_ms` (p50, p95, p99)
  - Gauge: `a7_pending_approvals` (queue length)
  - Counter: `a7_effectiveness_total` (labeled: result: effective/ineffective)
- **SigNoz Dashboard: "A7 Self-Healing"**
  - Panels:
    1. "Suggestion Rate" (per hour)
    2. "Approval Rate" (% of total suggestions approved)
    3. "Latency Percentiles" (p50, p95, p99)
    4. "Effectiveness Rate" (% of approved that actually fixed issue)
    5. "Flaky Tests Reduced" (30-day trend)
  - Alerts:
    - If suggestion latency >5s for >5 min → Slack notification
    - If approval rate <50% (users not trusting suggestions) → investigate
    - If effectiveness <60% → tune heuristics

**Priority:** P1  
**Estimate:** 12 hours  
**Owner:** DevOps + Backend  
**Dependencies:** Langfuse, SigNoz  
**US-ID:** US-052  
**TB/EP:** None (observability)

---

#### M8-T010: Feature Flag + Safe Rollout (Dark → Canary → GA)
**Description:** Gate A7 behind feature flag. Execute safe rollout.

**Details:**
- **Flag: `ai.auto_heal_selectors`**
  - Default: false (disabled)
  - Rollout phases:
    - Phase 1 (W1 Mon): Dark launch (internal only, developers test)
    - Phase 2 (W2 Wed): Canary 10% (1 of 2 pilots gets suggestions)
    - Phase 3 (W3 Fri): Canary 50% (both pilots)
    - Phase 4 (W3 Sat): GA (all projects)
- **Monitoring per phase:**
  - Suggestion approval rate (target ≥80%)
  - Effectiveness rate (target ≥70%)
  - Side effect rate (target <2%)
  - User feedback (Slack #qa-nexus-pilots)
- **Rollback Trigger:** If any metric breached for >15 min, disable flag + investigate
- **Communication:** Daily update to pilots (Slack), summary at end of each phase

**Priority:** P1  
**Estimate:** 6 hours  
**Owner:** PM + DevOps  
**Dependencies:** Unleash integration, all M8 tasks  
**US-ID:** US-052  
**TB/EP:** None (feature flag)

---

#### M8-T011: Pilot Testing + Feedback Loop
**Description:** Conduct pilot usability testing with 2 Iksula automation engineer teams. Iterate on A7 UX/suggestions.

**Details:**
- **Pilot Cohort:**
  - Pilot A: 3 automation engineers (one team)
  - Pilot B: 5 automation engineers (another team)
  - Total: 8 engineers
- **Duration:** 2-week pilot (W1–W3)
  - Week 1: 30-min intro + 1-hour hands-on training (live demo + guided use)
  - Week 2: Independent use, weekly 15-min check-in
  - Week 3: Feedback survey + debrief
- **Feedback Topics:**
  - Usability: "Was it easy to review + approve suggestions? What was unclear?"
  - Quality: "Did suggestions actually fix the problems? Any bad suggestions?"
  - Workflow: "Did approval modal fit into your workflow? Batch mode helpful?"
  - Metrics: "Did you see flakiness reduction? From how much to how much?"
  - Trust: "Do you trust A7 to auto-fix in the future? (hypothetically)"
- **Success Metrics:**
  - ≥80% of pilots can independently review + approve suggestions (without live support)
  - ≥70% would use A7 again
  - ≥40% flaky test reduction observed (measured via dashboard)
  - 0 critical bugs (incorrect healing, side effects, data loss)
- **Iteration (if needed):**
  - If approval rate low (<60%): improve suggestion confidence or add more context
  - If effectiveness low (<65%): refine heuristics, add alternative suggestions
  - If UX friction: streamline modal or batch UI

**Priority:** P1  
**Estimate:** 14 hours  
**Owner:** PM + QA Lead  
**Dependencies:** M8-T001–T010  
**US-ID:** GM-001 (adoption metric)  
**TB/EP:** None (user research)

---

## API Contracts (M8 Scope)

All endpoints authenticated via BetterAuth; RBAC enforced (user must have project access + Lead/Admin role for approvals).

### Healing Suggestions

#### `POST /api/healing/analyze`
**Purpose:** Trigger A7 analysis on a specific test (used for testing, normally background job)

**Request:**
```json
{
  "testCaseId": "case_123",
  "failureContext": {
    "screenshot": "base64_image_data",
    "errorMessage": "element with selector 'button#login' not found",
    "failureClassification": "SELECTOR_BROKEN"
  }
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "hatchet_healing_xyz",
  "status": "queued",
  "estimatedDuration": 5
}
```

---

#### `GET /api/healing/suggestions?projectId=proj_123&status=pending`
**Purpose:** Fetch pending suggestions for project (for batch queue UI)

**Response (200 OK):**
```json
{
  "projectId": "proj_123",
  "suggestions": [
    {
      "id": "healing_456",
      "testCaseId": "case_123",
      "testName": "LoginFlow",
      "failureClassification": "SELECTOR_BROKEN",
      "suggestionType": "SELECTOR_UPDATE",
      "originalValue": "button#login",
      "suggestedValue": "button:has-text('Login')",
      "confidence": 0.85,
      "rationale": "Nearest sibling strategy: label 'Login' found adjacent to button",
      "approval_state": "pending",
      "createdAt": "2026-10-20T10:00:00Z"
    }
  ],
  "pendingCount": 5,
  "totalCount": 12
}
```

---

#### `POST /api/healing/suggestions/:id/approve`
**Purpose:** User approves healing suggestion, system applies fix + re-runs test

**Request:**
```json
{
  "suggestionId": "healing_456",
  "approval": true,
  "userFeedback": "Looks good, let's try this"
}
```

**Response (200 OK, if re-run completes quickly; 202 if async):**
```json
{
  "suggestionId": "healing_456",
  "approval_state": "approved",
  "approved_at": "2026-10-20T10:15:00Z",
  "testRerunJobId": "hatchet_rerun_xyz",
  "testRerunStatus": "running"
}
```

#### `GET /api/healing/suggestions/:id/rerun-status?jobId=hatchet_rerun_xyz`
**Purpose:** Poll test re-run status after approval

**Response (200 while running):**
```json
{
  "jobId": "hatchet_rerun_xyz",
  "status": "running",
  "progress": 0.5
}
```

**Response (200 when done):**
```json
{
  "jobId": "hatchet_rerun_xyz",
  "status": "done",
  "testResult": "pass",
  "effectiveness": "effective",
  "duration_ms": 8500
}
```

---

#### `GET /api/reports/flaky-tests?projectId=proj_123`
**Purpose:** Fetch flaky test dashboard data

**Response (200 OK):**
```json
{
  "projectId": "proj_123",
  "kpis": [
    {"label": "Total Flaky", "value": 12},
    {"label": "Healed by A7", "value": 7},
    {"label": "Still Flaky", "value": 5},
    {"label": "Improvement", "value": "45%"}
  ],
  "rootCauseBreakdown": [
    {"category": "SELECTOR_BROKEN", "count": 8, "percentage": 0.67},
    {"category": "TIMEOUT", "count": 3, "percentage": 0.25},
    {"category": "ASSERTION", "count": 1, "percentage": 0.08}
  ],
  "effectiveness": [
    {"type": "SELECTOR_UPDATE", "effectiveness": 0.80},
    {"type": "TIMEOUT_INCREASE", "effectiveness": 0.67},
    {"type": "RETRY", "effectiveness": 0.75}
  ],
  "topImprovedTests": [
    {
      "testName": "LoginFlow",
      "priorPassRate": 0.60,
      "currentPassRate": 0.98,
      "improvement": 0.38,
      "healingCount": 2
    }
  ]
}
```

---

## Database Changes (M8 Scope)

### New Tables

#### `TB-021: healing_signals`
```sql
CREATE TABLE healing_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  failure_count INT NOT NULL,
  pass_count INT NOT NULL,
  pass_rate DECIMAL(3, 2),
  failure_classification VARCHAR(50),
  first_failed_at TIMESTAMP,
  last_failed_at TIMESTAMP,
  healing_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_healing_signals_project ON (project_id),
  INDEX idx_healing_signals_pass_rate ON (pass_rate)
);
```

#### `TB-022: healing_suggestions`
```sql
CREATE TABLE healing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  failure_classification VARCHAR(50),
  suggestion_type VARCHAR(50),
  original_value VARCHAR(2048),
  suggested_value VARCHAR(2048),
  confidence DECIMAL(3, 2),
  approval_state VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  test_result_after_approval VARCHAR(50),
  effectiveness VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  INDEX idx_healing_suggestions_test_case ON (test_case_id, approval_state),
  INDEX idx_healing_suggestions_project ON (project_id)
);
```

### Migrations

- **File:** `2026-10-13_001_create_healing_tables.sql`
  - Creates TB-021, TB-022
  - Grants permissions to `api_user` role

---

## AI Agent Spec (A7)

### LangGraph Node Flow

```
Input (failed test, failure context, screenshot)
  ↓
[Failure Classification] → parse error, categorize (SELECTOR/TIMEOUT/ASSERTION/ENV)
  ↓
[Context Gathering] → fetch past runs, test code, browser info
  ↓
[Suggestion Generation] → apply heuristics per failure type
  ↓
[Confidence Scoring] → rate each suggestion (0–1)
  ↓
[HITL Approval Gate] → show modal, wait for user
  ↓ Approved
[Apply Fix] → update test code, log to TB-012
  ↓
[Test Re-Execution] → enqueue runner job
  ↓
[Effectiveness Measurement] → pass/fail, update TB-022
  ↓
Output (effectiveness signal)
```

### Prompt Strategy

- **System Prompt:** "You are A7, a test maintenance agent. Your role is to analyze test failures, suggest fixes (selector updates, timeout adjustments, retry logic), and never auto-apply. Always provide high-confidence suggestions. Explain your reasoning."
- **Selector Healing Prompt:** "The test failed because the selector 'button#login' was not found. The button is visible on the page. Suggest strategies to find it: (1) by adjacent label, (2) by ARIA role, (3) by text content. Rate each by confidence."

### Confidence Model

- **Per-Suggestion Confidence:**
  - Nearest sibling strategy: 0.85–0.90 (robust if label stable)
  - ARIA role strategy: 0.88–0.95 (role attributes typically stable)
  - Text anchor strategy: 0.70–0.80 (text can change)
  - Visual anchor strategy: 0.60–0.70 (less robust)
- **Aggregate Confidence (per test):** Mean of all suggestion confidences
- **UI Display:** "85% confident this fix will work"
- **Threshold for Display:** Only show suggestions ≥0.65 confidence

### HITL Gates

1. **Approval Modal:** Always required (even if confidence >0.95)
2. **Re-run Validation:** Automatically enqueue test re-run, show result to user
3. **Batch Approval:** Warn if approving 5+ suggestions at once

### Cost & Latency Budget

- **Latency SLO:** <5s per suggestion (failure analysis → suggestions generated)
  - Breakdown: failure classification ~100ms, context gather ~200ms, suggestion generation (LLM) ~2s, confidence scoring ~500ms
- **Cost:** ~$0.01 per suggestion (LLM call for generation + confidence scoring)
- **Guardrails:**
  - Max 100 pending suggestions per project
  - Suggestion TTL: 30 days (auto-expire old suggestions)
  - Timeout: 10s per analysis job (fallback to generic suggestion if slow)

---

## Test Strategy

### Unit Tests (≥80% Coverage)

- Failure classification: error message parsing, categorization
- Selector healing heuristics: nearest sibling, ARIA, text anchor logic
- Confidence scoring: edge cases
- Flakiness scoring: pass rate calculation, volatility metric

**Tools:** Jest, Playwright test utilities

---

### Integration Tests (≥70% Critical Paths)

- E2E: test failure → pattern detection → suggestion → approval → fix applied → test re-run → effectiveness measured
- Batch: 3 suggestions, batch approval, all applied + re-run
- Audit: TB-012 entries logged for each action
- Side effects: approved fix doesn't break other tests (run full E2E suite)

**Tools:** Jest, test-containers (PostgreSQL), Hatchet mock jobs

---

### E2E Tests (Playwright)

- **Journey 1: Selector Healing**
  - Create intentionally broken test (invalid selector)
  - Trigger A7
  - Review suggestion modal
  - Approve fix
  - Test re-runs and passes
- **Journey 2: Batch Approval**
  - Create 3 broken tests
  - Batch approvals via API
  - All applied + re-run
  - Effectiveness metrics updated

**Tools:** Playwright (via M5 runner)

---

### Performance Tests (k6)

**Load Scenario:** 10 concurrent users, each reviewing + approving 5 suggestions (50 total)

**SLOs:**
- Suggestion latency p95 <5s
- Approval API p95 <500ms
- Error rate <2%

---

## Risks + Mitigations

| R-ID | Description | Likelihood | Impact | Owner | Mitigation | Status |
|------|---|---|---|---|---|---|
| **M8-R001** | Selector healing breaks other tests (side effect) | Medium | High | QA | Run full E2E suite after each approval, track side effect rate, alert if >2% | Testing + monitoring |
| **M8-R002** | Suggestion approval rate low (<60%), users don't trust A7 | Medium | High | AI | Improve suggestion confidence, add more context (screenshots, code), gather feedback | Pilot feedback loop |
| **M8-R003** | A7 effectiveness <60% (suggestions don't fix problem) | Low | High | Backend | Refine heuristics, test on intentional failures, measure effectiveness + iterate | W3 validation |
| **M8-R004** | Suggestion latency >5s due to LLM latency spikes | Medium | Medium | Backend | Add caching for similar failures, timeout fallback (generic suggestion), monitor Langfuse | Monitoring |
| **M8-R005** | User ignores suggestions (adoption friction) | Medium | Medium | PM | Live training, batch UI, clear rationale + re-run results, gather feedback | Training + iteration |
| **M8-R006** | Audit trail incomplete (HIPAA compliance risk) | Low | Critical | Security | Verify TB-012 entries logged for 100% of actions, test audit trail audit (log audit) | Testing |

---

## Rollback Plan

**Trigger Conditions:**
- Suggestion approval rate drops <50% (users not trusting)
- Effectiveness drops <60% (suggestions not fixing problems)
- Side effect rate >5% (approved fixes break other tests)
- Suggestion latency >10s consistently (blocking UX)

**Rollback Steps (RTO: <15 min):**

1. **Immediate:** Disable flag (`ai.auto_heal_selectors: false`); notify pilots
2. **Investigation:** Check Langfuse for low-confidence suggestions, SigNoz for latency issues
3. **Fix or Revert:** Refine heuristics (quick fix) OR revert agent code (full revert)
4. **Verification:** Test on dev, verify suggestion quality + latency
5. **Re-Enable:** Enable flag, monitor for 1 hour

---

## Observability

### OTel Spans & Custom Metrics

- **Span:** `a7_analyze_failure` (parent)
  - Attributes: testCaseId, failureClassification, suggestionType, confidence
  - Children: classify_failure, gather_context, generate_suggestions, score_confidence
- **Metrics:**
  - Counter: `a7_suggestions_total` (labels: failure_type, suggestion_type)
  - Histogram: `a7_suggestion_latency_ms` (p50, p95, p99)
  - Counter: `a7_approvals_total` (labels: approval_state)
  - Gauge: `a7_pending_approvals`
  - Counter: `a7_effectiveness_total` (labels: effective/ineffective)

---

## Handoff

**Delivered M8:**
- A7 agent (LangGraph, failure analysis → suggestions → approval)
- Failure pattern detection (background monitoring, 20–80% pass rate classification)
- Selector healing (nearest sibling, ARIA, text anchor heuristics)
- Timeout + retry suggestions
- Approve-in-context modal (never auto-apply)
- Batch approval UI + queue
- Test re-execution + effectiveness validation
- Flaky test dashboard (pass rate trends, root causes, healing impact)
- Observability + monitoring (Langfuse, SigNoz)
- Pilot testing + feedback incorporated
- Feature flag + safe rollout (dark → canary → GA)
- 40% flaky test reduction in pilot cohort

**Known Deferred (v1.5+):**
- Visual regression healing (M11)
- Mobile app element healing (M11)
- Predictive healing (heal before failure, M9)
- Cross-team healing rules / shared selectors (PM3 governance)

**Technical Debt Logged:**
- Selector heuristics confidence scoring can be refined (currently 75–90%, target 85–95%)
- LLM latency occasionally >3s (investigate caching, pre-compute context)
- Side effect detection (running full E2E suite post-approval) is resource-intensive (move to background job with async reporting)

---

## Definition of Done

**All criteria must be "Go" for M8 exit gate.**

1. **Code Quality:** All tasks merged, 2-reviewer approval, CI/CD green, ≥80% coverage
2. **Testing:** AC001–AC015 verified, integration + E2E tests green, effectiveness ≥70%
3. **Performance:** p95 suggestion latency <5s, p95 approval API <500ms
4. **Observability:** Langfuse traces + SigNoz dashboard live, evals established
5. **Compliance:** Audit trail 100% complete, encryption at rest verified
6. **Documentation:** A7 runbook, API docs updated
7. **Pilot Testing:** 2 pilots tested, ≥40% flaky test reduction, 0 critical bugs
8. **Go/No-Go Gate:** Review meeting + sign-off

---

## Appendix

### Glossary

- **Flaky Test:** Test with pass rate 20–80% (passes sometimes, fails randomly)
- **Healing Suggestion:** A7-recommended fix (selector update, timeout, retry)
- **HITL Approval:** Human-in-the-loop (user must approve before applying)
- **Effectiveness:** % of approved suggestions that actually fix the problem
- **Side Effect:** Approved fix breaks a different test

---

## Reference Links

- [Playwright Locator Strategies](https://playwright.dev/docs/locators)
- [ARIA Roles](https://www.w3.org/WAI/ARIA/apg/)
- [TB-012 Audit Events](./../../ERD.md)
- [PROJECT_ROADMAP.md v1.2](./../../PROJECT_ROADMAP.md) — M8 dates
- [Milestone M7](./../../Milestone/M7/Milestone_M7_Test_Data_Generation.md) — predecessor
- [Milestone M9](./../../Milestone/M9/Milestone_M9_A8_Advanced.md) — successor

---

**END OF MILESTONE M8 DOCUMENT**
