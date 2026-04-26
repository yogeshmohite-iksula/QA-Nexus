---
milestone_id: M9
parent_project_milestone: PM2
phase: v1.5
canonical_source: PROJECT_ROADMAP.md v1.2
version: 1.0
date: 2026-04-22
start_date: 2026-11-03
end_date: 2026-11-14
duration_weeks: 2
duration_calendar_days: 12
week_within_pm2: "W7-8"
team_size_fte: "2 (1 backend, 1 AI eng)"
owner: "AI Engineer Lead"
predecessors: ["M8 (Self-Healing)", "M7 (Test Data Generation)"]
successors: ["M10 (AI Product Tester)", "M12 (v1.5 GA prep)", "M15 (Full Test Planning, PM3)"]
primary_agent: "A8 Advanced (Risk-Adaptive Planning)"
status: "Planned"
---

# Milestone M9 — A8 Advanced (Risk-Adaptive Planning)

## Executive Summary

M9 advances **A8 Test Planning** from static coverage targets (e.g., "all modules 80% coverage") to dynamic, risk-adaptive strategy: A8 ingests historical defect patterns + code churn signals, computes risk score per component (1–10), and auto-adjusts coverage targets (low-risk areas 50%, high-risk 95%). On PR submission, A8 recomputes risk, auto-updates test plan JSON (consumed by M14 Test Selection), and provides QA lead with dynamic prioritization: "Run regression suite + focus on these 3 high-risk modules first." This milestone enables test teams to allocate test effort intelligently, prevents regressions in historically buggy code, and unblocks PM3's M15 full test planning (which builds on M9's risk model).

**Mission:** Shift testing from coverage-first (maximize % of code tested) to risk-first (maximize % of high-risk code tested). Reduce regression escapes in production while optimizing test execution time.

**Key Deliverables:**
- A8 agent using LangGraph: GitHub/GitLab API (code churn) + TB-007 defects (pattern learning) → risk scoring
- Risk model: code churn (frequency, recency, author experience) + defect density (bugs per LOC per component) + complexity (cyclomatic, dependencies)
- Risk scoring engine: components scored 1–10 (1=stable, 10=high-risk)
- Dynamic test plan JSON: auto-updates on PR, lists test cases ranked by risk coverage
- PR-gated integration: auto-runs on PR submission, returns "Recommended test subset to run"
- Consistency model: same PR code near-identical → same risk scores (detect code moves, refactors)
- Pilot evidence: 2 pilots reduce regression escapes by 30% using A8 recommendations
- Integration with M14 (PM3): A8 output drives test selection prioritization

**Success Criteria:** Risk scoring accuracy ≥85% (validated against historical defect data); QA leads approve A8 recommendations ≥85% of time; near-identical PRs produce near-identical risk scores (consistency ≥95%).

---

## Context: What Shipped Before

**PM1 Foundation (M0–M6) + PM2 Earlier (M7–M8):**
- Full test case management + execution (M5 Playwright automation runner)
- Defect logging + A4 5-layer RCA (TB-007 defects table with categorization)
- A7 Self-Healing (M8) produces reliability signals (flaky tests, healing effectiveness)
- A6 Test Data Generation (M7) enables deterministic, reproducible scenarios
- Audit trail infrastructure (TB-012) captures all agent actions
- Observability (Langfuse, SigNoz) measures agent performance + cost

**What M9 Unlocks Downstream:**
- M10 (AI Product Tester) uses A8 risk scores to prioritize exploratory testing (high-risk areas explored first)
- M12 (v1.5 GA prep) incorporates A8 risk model into release checklists (high-risk areas require approval before ship)
- M14 (Test Selection, PM3) consumes A8's dynamic test plan JSON to subset tests in CI (reduce CI time without losing coverage)
- M15 (Full Test Planning, PM3) builds on M9's risk model, adds strategic/entry-exit criteria, governance framework
- M16 (Vibe Code Governor, PM3) uses A8 risk as input to governance violations (high-risk code requires extra review)

---

## Scope

### In Scope (Delivering in M9)

1. **A8 Agent Architecture (Advanced)**
   - LangGraph: fetch GitHub/GitLab PR data → compute code churn → query TB-007 for historical defects → risk score per component
   - Input: PR number (GitHub/GitLab)
   - Output: risk-ranked test plan JSON (for M14 Test Selection)

2. **Code Churn Analysis**
   - **Frequency:** How often has component X changed in last 90 days? (commits/week)
   - **Recency:** How recent was last change? (days ago)
   - **Author Experience:** Has author modified high-risk code before? (author reputation score)
   - **Complexity Delta:** Did PR increase cyclomatic complexity or dependencies? (code diff analysis)
   - Data source: GitHub/GitLab API (commits, diff, author)

3. **Defect Pattern Learning**
   - Query TB-007 defects: historical bug density per component
   - Compute: bugs per 1000 LOC, severity distribution, resolution time
   - Identify: components with ≥3 defects in last 6 months = "historicall buggy"
   - Time-decay: recent defects weighted higher than old defects

4. **Risk Scoring Model**
   - Formula: `risk_score = (churn_frequency × 0.25) + (bug_density × 0.35) + (complexity_delta × 0.20) + (recency × 0.20)`
   - Normalized: 0–10 scale (0=stable, 10=max risk)
   - Bucketing: 0–3 (low), 4–6 (medium), 7–10 (high)
   - Confidence: confidence score per component (based on data completeness)

5. **Dynamic Test Plan Output**
   - JSON format: list of test cases, ranked by risk relevance to changed components
   - Example:
     ```json
     {
       "pr_number": 1234,
       "changed_components": ["auth", "payment"],
       "recommended_tests": [
         {"test_id": "case_001", "name": "LoginFlow", "risk_coverage": 0.95, "rank": 1},
         {"test_id": "case_042", "name": "PaymentFlow", "risk_coverage": 0.90, "rank": 2}
       ]
     }
     ```
   - Consumed by M14 Test Selection (PR-gated CI): "Run recommended_tests subset"

6. **PR-Gated Integration**
   - GitHub/GitLab webhook: on PR opened/updated → trigger A8
   - Output: comment on PR with recommended test subset + risk summary
   - Auto-update every commit (no manual trigger needed)

7. **Consistency Model**
   - Detect code movement (refactoring without logic change) → same risk score
   - Measure similarity: if PR1 and PR2 touch same files + similar LOC changed → expect similar risk scores
   - Validation: run A8 on 10 near-identical PRs → measure score variance (target <10%)

8. **Pilot Integration**
   - 2 pilots use A8 recommendations to prioritize test execution
   - Measure: regression escapes in production (before → after A8)
   - Track: time saved by running recommended subset vs full suite

### Out of Scope (Deferred to PM3+ M15)

- Strategic test planning (test strategy, approach, entry/exit criteria) — M15
- Governance rules enforcement (which components require QA lead approval before ship) — M16 VCG
- Real-time risk updates during code review (comment on each commit) — M14 full CI integration
- Multi-repo dependency risk (if service A changes, how much does service B test?) — M15+ (service mesh)
- Machine learning-based risk scoring (supervised learning on historical PR → defect outcomes) — PM4

### Rationale

- Risk-adaptive testing aligns testing effort with actual risk, reducing test time without sacrificing quality
- PR-gated integration enables shift-left: catch high-risk changes early (before merge)
- Consistency model ensures A8 is trustworthy (similar changes → similar risk)
- Pilot validation demonstrates real-world benefit (regression reduction)

---

## Exit Gate + Acceptance Criteria

**Milestone Exit Gate (GoNogo Decision, 2026-11-14):**

A8 Advanced ready for M14 consumption: risk scoring ≥85% accurate + PR-gated integration working + pilot reduces regression escapes by ≥30%.

| AC-ID | Acceptance Criterion | Verifier | Pass/Fail |
|-------|-----|----------|----------|
| **M9-AC001** | A8 fetches GitHub/GitLab PR data (commits, diff, author); code churn computed (frequency, recency, complexity delta) | Backend | TBD |
| **M9-AC002** | Defect pattern learning working: TB-007 queried, bug density per component computed, time-decay applied | Backend | TBD |
| **M9-AC003** | Risk scoring formula produces 0–10 scale; 10 test PRs scored ≥0.85 correlation with QA lead manual assessment | Backend | TBD |
| **M9-AC004** | Dynamic test plan JSON generated correctly; recommended_tests list ranked by risk; rank 1 = highest risk | Backend | TBD |
| **M9-AC005** | PR-gated integration working: webhook triggers A8 on PR open/update; comment posted on PR with recommendations within 10s | Backend | TBD |
| **M9-AC006** | Consistency model validated: 10 near-identical PRs scored with variance <10% (CV <0.10) | Backend | TBD |
| **M9-AC007** | Test plan JSON consumed by mock M14 Test Selection service: subset of tests executable without errors | Backend | TBD |
| **M9-AC008** | Observability live: Langfuse captures A8 invocations; SigNoz shows PR analysis latency (target <3s per PR) | DevOps | TBD |
| **M9-AC009** | 2 pilots use A8 recommendations for test prioritization for 1 week; ≥30% reduction in regression escapes observed | PM | TBD |
| **M9-AC010** | Feature flag `ai.a8_risk_scoring` toggles correctly; when disabled, default recommendations used (all tests) | DevOps | TBD |
| **M9-AC011** | Audit trail logged for 100% of A8 invocations to TB-012 (PR data, risk scores, recommendations) | Backend | TBD |

**V2 Working Hypothesis (Quantified Targets):**
- ≥85% accuracy means 85% of components A8 rates "high-risk" have ≥3 defects (validated against historical TB-007 data).
- <3s latency targets PR-gated integration (user can see comment within seconds of submitting PR).
- ≥30% regression reduction assumes A8 recommendations correctly identify high-risk areas (pilot-observed baseline).
- <10% variance on near-identical PRs ensures A8 is deterministic + trustworthy.

---

## Feature / Task Breakdown (Week-Wise, 2 Weeks)

### WEEK 1: A8 AGENT + CODE CHURN + DEFECT LEARNING (2026-11-03 → 2026-11-09)

#### M9-T001: A8 LangGraph Agent (GitHub/GitLab Integration)
**Description:** Implement LangGraph agent: fetch PR data, compute risk signals, score components, generate test plan.

**Details:**
- **Input:** PR URL (e.g., `https://github.com/org/repo/pull/1234`)
- **Node 1: Fetch PR Data**
  - GitHub API: PR files changed, diff, commits, author, created_at
  - Parse: which components touched (match files to component registry: auth, payment, etc.)
- **Node 2: Code Churn Analysis**
  - For each changed component: query Git history (90-day window)
  - Compute: commit frequency (commits/week), recency (days since last change), author experience
- **Node 3: Defect Pattern Learning**
  - Query TB-007 defects: filter by component, last 6 months
  - Compute: bug density (defects per 1000 LOC), severity distribution
  - Apply time-decay: defects from 1 month ago weighted 1.0x, 6 months ago 0.2x
- **Node 4: Risk Scoring**
  - For each component: risk_score = (churn × 0.25) + (bug_density × 0.35) + (complexity_delta × 0.20) + (recency × 0.20)
  - Normalize: 0–10 scale
  - Confidence: lower if data sparse (e.g., new component, no defects)
- **Node 5: Test Plan Generation**
  - Query TB-005 test_cases: which tests cover changed components?
  - Rank tests by risk relevance (test_risk = max(covered_component_risks))
  - Output JSON: recommended tests ranked by risk
- **Output:** Risk-ranked test plan JSON + risk summary (e.g., "3 high-risk components, 12 recommended tests")

**Priority:** P0  
**Estimate:** 24 hours  
**Owner:** AI Engineer + Backend  
**Dependencies:** GitHub/GitLab API keys (Doppler), TB-007, TB-005, Langfuse  
**US-ID:** US-053 (test planning / A8 advanced)  
**TB/EP:** TB-023 (new), EP-078 (new A8 API)

---

#### M9-T002: Code Churn Analysis Engine
**Description:** Compute churn metrics from Git history: frequency, recency, author experience, complexity delta.

**Details:**
- **Frequency:** commits per component per week (last 90 days)
  - Query: `git log --since=90.days.ago -- <component_files>`
  - Count: commit count, compute weekly average
  - Normalize: 0–10 scale (0=no changes, 10=10+ commits/week)
- **Recency:** days since last change
  - Query: `git log -1 --format="%ai" -- <component_files>`
  - Compute: days ago (0–1000)
  - Normalize: 0–10 scale (0=>90 days ago, 10=today)
- **Author Experience:** has author modified this component before?
  - Query: `git log --format="%an" -- <component_files>` for current PR author
  - Count: how many commits by author in component (last 12 months)
  - Normalize: 0–10 scale (0=first time, 10=expert, 20+ commits)
- **Complexity Delta:** did PR increase complexity?
  - Parse diff: count cyclomatic complexity changes (if code analysis available)
  - Fallback: LOC added/removed ratio (large adds = higher complexity risk)
  - Normalize: 0–10 scale

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer  
**Dependencies:** Git CLI or GitHub API (commits endpoint)  
**US-ID:** US-053  
**TB/EP:** None (internal engine)

---

#### M9-T003: Defect Pattern Learning + Time-Decay
**Description:** Query TB-007 historical defects, compute bug density per component, apply time-decay weighting.

**Details:**
- **Bug Density Calculation:**
  - For each component: query TB-007 defects where component = X AND created_at >= NOW() - 6 months
  - Fetch component LOC (estimate from test_cases coverage, or from code metrics table if available)
  - Compute: density = (defect_count / LOC) * 1000 (bugs per 1000 LOC)
  - Normalize: 0–10 scale (0=no defects, 10=dense, ≥5 bugs per 1000 LOC)
- **Time-Decay Weighting:**
  - Recent defects (1 month ago): weight 1.0x
  - Medium age (3 months ago): weight 0.6x
  - Old defects (6 months ago): weight 0.2x
  - Weighted density = SUM(defect_weight × density) / defect_count
- **Severity Weighting (optional):**
  - Critical defects: 3x weight
  - Major defects: 2x weight
  - Minor defects: 1x weight
- **Output:** TB-023 `component_risk_signals` table (one row per component, updated daily)

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend Engineer  
**Dependencies:** TB-007 (defects), TB-023 schema  
**US-ID:** US-053  
**TB/EP:** TB-023

---

#### M9-T004: Risk Scoring Formula + Component Bucketing
**Description:** Implement scoring formula, normalize 0–10 scale, bucket components into low/medium/high risk.

**Details:**
- **Scoring Formula:**
  ```
  risk_score = 
    (churn_frequency_norm × 0.25) +
    (bug_density_norm × 0.35) +
    (complexity_delta_norm × 0.20) +
    (recency_norm × 0.20)
  
  Where each input is normalized 0–10.
  ```
- **Bucketing:**
  - Low: 0–3 (stable components, few defects, infrequent changes)
  - Medium: 4–6 (moderate risk, mix of factors)
  - High: 7–10 (high-risk areas, frequent changes or defects)
- **Confidence Scoring:**
  - If component has <10 LOC of code coverage data: confidence 0.5 (low)
  - If component has <1 defect in 6 months: confidence 0.7 (medium)
  - If component has complete data: confidence 0.9 (high)
  - Confidence affects suggestion strength (low confidence = use broad recommendations)
- **Output:** TB-023 row per component: component_id, risk_score, risk_bucket, confidence

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer  
**Dependencies:** M9-T002, M9-T003 (churn + defect data ready)  
**US-ID:** US-053  
**TB/EP:** TB-023

---

### WEEK 2: TEST PLAN GENERATION + PR INTEGRATION + VALIDATION (2026-11-10 → 2026-11-14)

#### M9-T005: Dynamic Test Plan JSON Generation
**Description:** For given PR, generate ranked list of test cases covering high-risk components.

**Details:**
- **Input:** PR number (from GitHub/GitLab)
- **Process:**
  1. Fetch PR data (files changed, components affected)
  2. Look up component risk scores (TB-023)
  3. Query TB-005 test_cases: find tests covering affected components
  4. Rank tests: test_risk = max(covered_component_risks) + (coverage_weight × test_importance)
  5. Generate JSON output
- **Output Format:**
  ```json
  {
    "pr_number": 1234,
    "pr_title": "Fix login timeout",
    "changed_components": [
      {
        "name": "auth",
        "risk_score": 8,
        "risk_bucket": "high",
        "churn_frequency": 9,
        "bug_density": 7,
        "confidence": 0.92
      }
    ],
    "recommended_tests": [
      {
        "test_id": "case_001",
        "test_name": "LoginFlow_ValidCredentials",
        "covered_components": ["auth"],
        "risk_coverage": 0.95,
        "rank": 1,
        "run_time_estimate_sec": 8
      },
      {
        "test_id": "case_042",
        "test_name": "LoginFlow_SessionTimeout",
        "covered_components": ["auth"],
        "risk_coverage": 0.90,
        "rank": 2,
        "run_time_estimate_sec": 12
      }
    ],
    "test_suite_summary": {
      "total_tests_recommended": 12,
      "estimated_duration_sec": 180,
      "risk_coverage_pct": 0.92
    }
  }
  ```
- **Ranking Logic:**
  - Tests covering high-risk components ranked first
  - Estimated runtime used as tiebreaker (shorter tests first, to minimize total runtime)
  - Deprecated tests (flaky or ineffective) deprioritized

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer  
**Dependencies:** M9-T004 (risk scores), TB-005 (test_cases), TB-023  
**US-ID:** US-053  
**TB/EP:** EP-078 (return JSON)

---

#### M9-T006: PR-Gated Webhook Integration + Comment Posting
**Description:** Trigger A8 on PR open/update via GitHub/GitLab webhook. Post recommendation comment on PR.

**Details:**
- **Webhook Setup:**
  - GitHub: register webhook on repo: push + pull_request events
  - GitLab: register webhook on project: push + merge_request events
  - Payload: PR number, changed files, author
- **Endpoint: `POST /api/webhooks/github/pr-analysis` (or `/gitlab/...`)**
  - Authenticate: validate webhook signature (HMAC-SHA256)
  - Extract: PR number, trigger action (opened, synchronize, reopened)
  - Enqueue: Hatchet job to run A8 asynchronously
  - Response: 202 Accepted (webhook handler doesn't wait for job)
- **A8 Job (Hatchet):**
  - Run A8 agent (M9-T001)
  - Generate test plan JSON
  - Post comment on PR (GitHub/GitLab API)
- **PR Comment Format:**
  ```markdown
  ### A8 Risk Assessment
  
  **Risk Summary:**
  - High-risk components: auth (score 8/10), payment (score 7/10)
  - Recommended tests: 12 (estimated 3 min to run)
  - Risk coverage: 92% of changed code
  
  **Top Recommended Tests to Run:**
  1. LoginFlow_ValidCredentials (coverage: 95%)
  2. LoginFlow_SessionTimeout (coverage: 90%)
  
  [View Full Recommendations](https://qa-nexus.example.com/pr/1234/risk-analysis)
  
  ---
  *Generated by A8 Risk-Adaptive Planning*
  ```
- **Latency Target:** Comment posted within 10s of PR submission (background job completes quickly)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer  
**Dependencies:** GitHub/GitLab API integration (M4 Jira integration pattern)  
**US-ID:** US-053  
**TB/EP:** EP-079 (webhook handler)

---

#### M9-T007: Consistency Validation + A8 Trustworthiness Testing
**Description:** Validate that similar PRs produce similar risk scores. Ensures A8 is trustworthy + deterministic.

**Details:**
- **Consistency Test Dataset:**
  - Create 10 test PRs: simple code moves (refactoring without logic change)
    - E.g., move function from file A to file B (same code, different location)
    - E.g., rename variable (no logic change)
    - E.g., add blank lines (no logic change)
  - For each PR: run A8 twice independently, capture risk scores
- **Variance Calculation:**
  - For each component: compute risk_score variance across two runs
  - Aggregate: coefficient of variation (CV) = (std dev / mean) across 10 PRs
  - Target: CV < 0.10 (10% variance)
- **Validation:**
  - If CV < 0.10: consistency ≥95% ✓
  - If CV > 0.20: investigate root cause (randomness in algorithm, data staleness, etc.)
- **Output:** Consistency report (10 test cases, variance per case, overall CV, pass/fail)

**Priority:** P1  
**Estimate:** 12 hours  
**Owner:** QA Engineer + Backend  
**Dependencies:** M9-T001–T006 (A8 working)  
**US-ID:** US-053  
**TB/EP:** None (validation test)

---

#### M9-T008: Observability + Monitoring
**Description:** Wire A8 to Langfuse + SigNoz. Monitor analysis latency, accuracy, recommendation acceptance.

**Details:**
- **Langfuse Integration:**
  - Log each A8 PR analysis: input (PR files), output (risk scores, test recommendations), latency
  - Create evals: "Are recommended tests covering high-risk components?" (binary check)
  - Retro-eval: run evals on past recommendations (human review sample)
- **SigNoz Custom Metrics:**
  - Counter: `a8_pr_analyses_total` (labeled: risk_bucket)
  - Histogram: `a8_pr_analysis_latency_ms` (p50, p95, p99) — target <3s
  - Counter: `a8_recommendation_acceptance_total` (labeled: accepted/ignored)
  - Gauge: `a8_pending_pr_analyses`
- **SigNoz Dashboard: "A8 Risk Scoring"**
  - Analysis rate (per hour)
  - Latency percentiles
  - Accuracy (% of high-risk components actually had defects)
  - Recommendation acceptance rate (% of PRs where user ran recommended tests)
  - Top high-risk components (bar chart)
- **Alerts:**
  - If latency >5s: Slack notification
  - If accuracy <80%: investigate model drift

**Priority:** P1  
**Estimate:** 10 hours  
**Owner:** DevOps + Backend  
**Dependencies:** Langfuse, SigNoz  
**US-ID:** US-053  
**TB/EP:** None (observability)

---

#### M9-T009: Feature Flag + Pilot Rollout
**Description:** Gate A8 behind feature flag. Execute pilot rollout (dark → canary → limited pilot).

**Details:**
- **Flag: `ai.a8_risk_scoring`**
  - Default: false (disabled)
  - Rollout phases:
    - Phase 1 (Day 1–2): Dark launch (internal testing only, no PR comments)
    - Phase 2 (Day 3–4): Canary (enable for 1 pilot project, PR comments visible)
    - Phase 3 (Day 5+): Both pilots (enable for 2 pilot projects)
- **Monitoring per phase:**
  - PR analysis latency (target <3s)
  - Recommendation accuracy (target ≥85%)
  - Pilot feedback (survey after 1 week)
- **Rollback Trigger:** If accuracy <75% or latency >10s, disable flag
- **Communication:** Daily update to pilots (Slack), summary at phase transitions

**Priority:** P1  
**Estimate:** 6 hours  
**Owner:** PM + DevOps  
**Dependencies:** Unleash integration, M9-T001–T009  
**US-ID:** US-053  
**TB/EP:** None (feature flag)

---

#### M9-T010: Pilot Testing + Effectiveness Measurement
**Description:** Conduct 1-week pilot with 2 Iksula teams. Measure regression reduction using A8 recommendations.

**Details:**
- **Pilot Cohort:**
  - Pilot A: 2–3 automation engineers
  - Pilot B: 3–4 automation engineers
  - Total: 5–7 engineers
- **Duration:** 1 week (starting day 3 of M9)
  - Day 1–2: training (30 min), intro to A8 recommendations
  - Day 3–7: use A8 recommendations to prioritize test execution
- **Baseline Measurement (Day 1–2):**
  - Run full test suite on 5 sample PRs (before A8)
  - Count: regression escapes (defects found in production)
  - Record: test execution time
- **A8 Phase (Day 3–7):**
  - Use A8 recommendations to select test subset
  - Run only recommended tests on 5 new PRs
  - Count: regression escapes
  - Record: test execution time
- **Success Metrics:**
  - Regression escape reduction: ≥30% (e.g., baseline 10 escapes → A8 7 escapes)
  - Test execution time: reduce by ≥20% (run fewer tests, but cover high-risk areas)
  - Recommendation acceptance: ≥70% of pilots follow A8 recommendations
- **Feedback Survey (Day 7):**
  - "Were A8 recommendations helpful?"
  - "Would you use A8 again?"
  - "Any recommendations you disagreed with? Why?"
  - "Did running recommended-only subset feel risky?"
- **Iteration (if needed):**
  - If accuracy low: refine risk model, recalibrate weights
  - If acceptance low: improve comment clarity, add more context

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** PM + QA Lead  
**Dependencies:** M9-T001–T009 (A8 working + flagged)  
**US-ID:** GM-001 (adoption metric)  
**TB/EP:** None (user research)

---

## API Contracts (M9 Scope)

### Risk Analysis

#### `POST /api/risk/analyze-pr`
**Purpose:** Analyze PR risk, generate test recommendations (can be triggered manually or via webhook)

**Request:**
```json
{
  "prUrl": "https://github.com/iksula/qa-nexus/pull/1234"
}
```

**Response (202 Accepted, async):**
```json
{
  "jobId": "hatchet_risk_analysis_xyz",
  "status": "queued",
  "estimatedDuration": 10
}
```

#### `GET /api/risk/analyze-pr/:jobId`
**Purpose:** Poll PR analysis job status

**Response (200 while running):**
```json
{
  "jobId": "hatchet_risk_analysis_xyz",
  "status": "running",
  "progress": 0.5
}
```

**Response (200 when done):**
```json
{
  "jobId": "hatchet_risk_analysis_xyz",
  "status": "done",
  "prNumber": 1234,
  "changedComponents": [...],
  "recommendedTests": [...],
  "riskSummary": {...}
}
```

---

#### `GET /api/risk/pr/:prNumber`
**Purpose:** Fetch cached PR risk analysis (if already analyzed)

**Response (200 OK):**
```json
{
  "pr_number": 1234,
  "pr_title": "Fix login timeout",
  "changed_components": [
    {
      "name": "auth",
      "risk_score": 8,
      "risk_bucket": "high",
      "confidence": 0.92
    }
  ],
  "recommended_tests": [
    {
      "test_id": "case_001",
      "test_name": "LoginFlow_ValidCredentials",
      "risk_coverage": 0.95,
      "rank": 1
    }
  ],
  "test_suite_summary": {
    "total_recommended": 12,
    "estimated_duration_sec": 180,
    "risk_coverage_pct": 0.92
  }
}
```

---

## Database Changes (M9 Scope)

### New Tables

#### `TB-023: component_risk_signals`
```sql
CREATE TABLE component_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  component_name VARCHAR(255) NOT NULL,
  risk_score DECIMAL(3, 2),
  risk_bucket VARCHAR(50),  -- 'low', 'medium', 'high'
  churn_frequency DECIMAL(3, 2),  -- 0–10
  bug_density DECIMAL(3, 2),  -- 0–10
  complexity_delta DECIMAL(3, 2),  -- 0–10
  recency_days INT,
  author_experience DECIMAL(3, 2),  -- 0–10
  confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_risk_signals_project ON (project_id),
  INDEX idx_risk_signals_component ON (component_name)
);
```

### Migrations

- **File:** `2026-11-03_001_create_risk_signal_tables.sql`
  - Creates TB-023
  - Grants permissions to `api_user` role
  - Daily cron job to refresh risk scores

---

## AI Agent Spec (A8 Advanced)

### LangGraph Node Flow

```
Input (PR URL)
  ↓
[Fetch PR Data] → GitHub/GitLab API
  ↓
[Code Churn Analysis] → git log, compute frequency/recency/author
  ↓
[Defect Pattern Learning] → TB-007 query, compute bug density + time-decay
  ↓
[Risk Scoring] → formula, normalize 0–10
  ↓
[Test Plan Generation] → rank test_cases by risk relevance
  ↓
Output (risk-ranked test plan JSON)
```

### Prompt Strategy

- **System Prompt:** "You are A8, a risk-adaptive test planning agent. Your role is to analyze code changes, identify high-risk components, and recommend tests that cover those areas. Provide transparent risk scoring with confidence levels."
- **Churn Analysis Prompt:** "Analyze commit history for component X. How frequently has it changed? Is the author experienced with this component?"
- **Risk Scoring Prompt:** "Given churn metrics and defect history, assign a risk score (0–10) for component X. Explain your reasoning."

### Confidence Model

- **Per-Component Confidence:**
  - High (≥0.80): component has ≥5 defects in 6 months + churn data available
  - Medium (0.50–0.79): component has some defect history OR some churn data
  - Low (<0.50): component new, no defect history, sparse data
- **Aggregate Confidence (per PR):** Mean of component confidences
- **UI Display:** "Risk score: 8/10 (high confidence)" OR "Risk score: 6/10 (medium confidence)"

### Cost & Latency Budget

- **Latency SLO:** <3s per PR analysis
  - Breakdown: GitHub API fetch ~500ms, churn analysis ~1s, TB-007 query ~500ms, risk scoring ~200ms, test plan generation ~300ms
- **Cost:** ~$0.002 per PR (LLM calls for risk explanation, if enabled)
- **Guardrails:**
  - Max concurrent PR analyses: 10
  - Cache results per PR for 24h (avoid re-analysis for same PR)
  - Timeout: 10s per PR (fallback to conservative recommendation if slow)

---

## Test Strategy

### Unit Tests (≥80% Coverage)

- Churn analysis: git history parsing, frequency/recency/author computation
- Defect learning: TB-007 query, bug density calculation, time-decay weighting
- Risk scoring: formula implementation, bucketing logic, confidence scoring
- Test plan ranking: risk relevance matching, sorting logic

**Tools:** Jest, Git CLI mock

---

### Integration Tests (≥70% Critical Paths)

- E2E: PR data fetch → churn → defect learning → risk scoring → test plan generation
- GitHub/GitLab webhook: receive webhook payload, trigger A8, post PR comment
- Consistency: 10 near-identical PRs, score variance <10%
- Cache: results persist 24h, fetch from cache on re-analysis

**Tools:** Jest, test-containers (PostgreSQL), GitHub API mock

---

### E2E Tests (Playwright)

- **Journey 1: PR Analysis + Recommendation**
  - Create PR in GitHub
  - A8 analyzes, posts comment
  - Verify: recommendation comment visible on PR
- **Journey 2: Test Plan Consumption**
  - Fetch risk-ranked test plan JSON
  - Pass to mock M14 Test Selection
  - Verify: subset of tests executable

**Tools:** Playwright (manual or simulated webhook)

---

## Risks + Mitigations

| R-ID | Description | Likelihood | Impact | Owner | Mitigation | Status |
|------|---|---|---|---|---|---|
| **M9-R001** | Risk scoring accuracy <75% (high-risk components have few defects) | Medium | Medium | AI | Validate against historical TB-007 data, calibrate weights, pilot feedback | Validation testing |
| **M9-R002** | PR analysis latency >5s (GitHub API slow, many files changed) | Low | Medium | Backend | Cache results per PR (24h), timeout fallback (conservative recommendation) | Monitoring |
| **M9-R003** | Consistency variance >20% (similar PRs get different scores) | Low | High | Backend | Validate consistency on 10 test PRs, investigate randomness (LLM? data staleness?) | W2 testing |
| **M9-R004** | Pilot low acceptance (<50%), skepticism of A8 recommendations | Medium | High | PM | Transparent risk explanation, show underlying data (churn, defects), gather feedback | Pilot feedback |
| **M9-R005** | Defect data in TB-007 incomplete (missing historical defects, RCA data sparse) | Medium | Medium | Backend | Document data quality assumptions, validate against Git history + commits per component | Analysis |

---

## Rollback Plan

**Trigger Conditions:**
- Risk scoring accuracy <70% (validated against historical defects)
- PR analysis latency >10s consistently
- Consistency variance >25%
- Pilot rejects recommendations >50% of time

**Rollback Steps (RTO: <10 min):**

1. **Immediate:** Disable flag (`ai.a8_risk_scoring: false`); notify pilots
2. **Investigation:** Check Langfuse for low accuracy, SigNoz for latency
3. **Fix or Revert:** Recalibrate weights (quick fix) OR revert agent code (full revert)
4. **Verification:** Test on dev, validate accuracy + latency
5. **Re-Enable:** Enable flag, monitor for 1 hour

---

## Observability

### OTel Spans & Custom Metrics

- **Span:** `a8_analyze_pr` (parent)
  - Attributes: pr_number, changed_components, risk_bucket, confidence
  - Children: fetch_pr_data, analyze_churn, learn_defects, score_risk, generate_test_plan
- **Metrics:**
  - Counter: `a8_pr_analyses_total` (labels: risk_bucket)
  - Histogram: `a8_pr_analysis_latency_ms` (p50, p95, p99)
  - Counter: `a8_recommendation_acceptance_total` (labels: accepted/ignored)
  - Gauge: `a8_pending_pr_analyses`

---

## Handoff

**Delivered M9:**
- A8 advanced agent (LangGraph, PR analysis → risk scoring → test plan)
- Code churn analysis (frequency, recency, author experience, complexity delta)
- Defect pattern learning (bug density, time-decay, historical analysis)
- Risk scoring formula (0–10 scale, normalized, confidence-scored)
- Dynamic test plan JSON (ranked by risk, consumed by M14)
- PR-gated integration (webhook, auto-comment on PR)
- Consistency validation (similar PRs → similar scores, CV <10%)
- Observability + monitoring (Langfuse, SigNoz)
- Pilot testing + effectiveness measurement (≥30% regression reduction)
- Feature flag + safe rollout
- Accuracy ≥85% (validated against historical TB-007 data)

**Known Deferred (v1.5+ PM3):**
- Real-time risk updates during code review (M14 continuous CI)
- Multi-repo dependency risk (service mesh, M15+)
- ML-based risk scoring (supervised learning on PR → defect outcomes, PM4)
- Strategic test planning (entry/exit criteria, governance rules, M15)

**Technical Debt Logged:**
- Risk model weights (0.25 churn, 0.35 defects, etc.) are currently hand-tuned (A/B test on pilot data for better calibration)
- GitHub/GitLab API rate limiting can block PR analysis (implement exponential backoff + caching)
- Component boundary detection (matching file paths to component names) is regex-based (move to component registry table for robustness)

---

## Definition of Done

**All criteria must be "Go" for M9 exit gate.**

1. **Code Quality:** All tasks merged, 2-reviewer approval, CI/CD green, ≥80% coverage
2. **Testing:** AC001–AC011 verified, integration + consistency tests green, accuracy ≥85%
3. **Performance:** p95 PR analysis latency <3s
4. **Observability:** Langfuse traces + SigNoz dashboard live
5. **Documentation:** A8 risk model explanation, API docs
6. **Pilot Testing:** 2 pilots tested for 1 week, ≥30% regression reduction, 0 critical bugs
7. **Go/No-Go Gate:** Review meeting + sign-off

---

## Appendix

### Glossary

- **Risk Score:** Composite metric (0–10) indicating probability of defect in component
- **Code Churn:** Frequency of code changes to a component (commits per week, recency)
- **Defect Pattern:** Historical distribution of bugs per component (density, severity, time)
- **Time-Decay:** Weighting recent defects higher than old defects (recent = more relevant)
- **Consistency:** Similar code changes → similar risk scores (determinism, trustworthiness)

---

## Reference Links

- [GitHub REST API — Pulls](https://docs.github.com/en/rest/pulls)
- [GitLab REST API — Merge Requests](https://docs.gitlab.com/ee/api/merge_requests.html)
- [TB-007 Defects](./../../ERD.md)
- [PROJECT_ROADMAP.md v1.2](./../../PROJECT_ROADMAP.md) — M9 dates, successors
- [Milestone M8](./../../Milestone/M8/Milestone_M8_Self_Healing.md) — predecessor
- [Milestone M14, PM3](./../../Milestone/M14/Milestone_M14_Test_Selection.md) — downstream consumer
- [Milestone M15, PM3](./../../Milestone/M15/Milestone_M15_Full_Test_Planning.md) — extends M9 risk model

---

**END OF MILESTONE M9 DOCUMENT**
