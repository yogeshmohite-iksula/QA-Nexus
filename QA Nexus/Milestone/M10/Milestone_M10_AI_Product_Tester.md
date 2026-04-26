---
milestone_id: M10
parent_project_milestone: PM2
name: "AI Product Tester (APT)"
version: 2.0
date: 2026-04-23
phase: v1.5
window: "W9–10 of PM2"
start_date: 2026-11-17
end_date: 2026-11-28
duration_weeks: 2
primary_agent: APT (AI Product Tester)
status: "Build-Ready"
---

# MILESTONE M10: AI PRODUCT TESTER (APT)

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M10 (Weeks 9–10 of PM2)  
**Version:** 2.0 (Build-Ready)  
**Date Created:** 2026-04-22  
**Date Updated:** 2026-04-23  
**Status Badge:** Planning → Build-Ready  
**Duration:** 2 weeks (2026-11-17 → 2026-11-28)  
**Key Achievement:** Autonomous E2E test discovery + execution, exploratory testing automation, scenario promotion HITL gate

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Context: PM2 Progression](#2-context-pm2-progression)
3. [Definition of Ready (DoR)](#3-definition-of-ready-dor)
4. [M10 Scope & Mission](#4-m10-scope--mission)
5. [Tech Stack](#5-tech-stack-m10-specific)
6. [Database Changes](#6-database-changes-m10)
7. [API Contracts (EP-IDs)](#7-api-contracts-ep-ids)
8. [AI Agent Specification: APT](#8-ai-agent-specification-apt)
9. [Feature & Task Breakdown](#9-feature--task-breakdown)
10. [Test Strategy](#10-test-strategy)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Rollback & Fallback](#12-rollback--fallback)
13. [Observability & Telemetry](#13-observability--telemetry)
14. [Handoff & Definition of Done](#14-handoff--definition-of-done)
15. [Appendix: LangGraph Orchestration](#15-appendix-langgraph-orchestration)

---

## 1. EXECUTIVE SUMMARY

M10 delivers **APT (AI Product Tester)**, an autonomous E2E testing agent that discovers untested user flows from app crawling (DOM + screenshot analysis), auto-generates executable tests, runs them autonomously, and performs bounded exploratory testing. APT ships in **beta status** within v1.5 GA (M12); production hardening deferred to v2 (PM3 M15+).

**Mission:** Enable autonomous test discovery and execution that reduces manual E2E scripting burden while surfacing new bugs through AI-driven exploration.

**Key Deliverables:**
- **Scenario Discovery:** DOM crawler + visual analysis → identifies untested flows, user journeys, edge cases
- **Test Auto-Generation:** Flow → Playwright test spec (LangGraph with gating, cost-bounded)
- **Autonomous Execution:** Schedule or on-demand E2E runs, <2 min per scenario on modern web apps
- **Exploratory Testing:** Time-boxed AI "bug hunter" sessions (30 min max, fresh seed per run, bounded token spend <$1/run)
- **HITL Gates:** Human-in-the-loop review before adding discovered scenarios to test suite; manual approval before filing exploratory findings as defects
- **Integration:** A1 (discovered flows → test cases), A4 (defect triage on E2E failures), A7 (self-healing on flaky E2E steps)

**Success Criteria:**
- Discover ≥50 scenarios per 10-minute crawl session on typical SPA
- ≥70% of discovered scenarios are actionable (can be auto-executed with ≥80% success)
- Single autonomous scenario execution <2 min on modern web app (React/Vue/Angular)
- Exploratory session <30 min wall-clock; finds ≥1 new bug per session with ≥40% confidence
- False-positive (non-reproducible) defect rate <25%
- Cost per scenario discovery <$0.05; cost per exploratory run <$1.00

---

## 2. CONTEXT: PM2 PROGRESSION

**M7–M9 Summary (Already Live):**
- **M7 (A6 Test Data):** Synthetic data generation with provenance, versioning, audit trail live; used by automation suites
- **M8 (A7 Self-Healing):** Background suggestions for flaky tests, approve-in-context gates, ≥40% reduction in flaky E2E steps measured
- **M9 (A8 Advanced):** Risk-adaptive test planning from historical defect patterns, code churn scoring, auto-strategy updates on PR live

**M10 (APT) Role in PM2:** Autonomous testing extends M7–M9 capabilities: discover what should be tested (M10) → generate test data (M7) → maintain tests (M8) → prioritize tests (M9) → execute autonomously (M10).

**Integration Dependencies:**
- **Depends on M7:** Synthetic data available for E2E setup (e.g., pre-populate forms, create test accounts)
- **Depends on M8:** Self-healing applied to discovered flows before promotion to suite (flaky step repair)
- **Depends on M9:** Risk scoring guides scenario discovery priority (high-churn features first)
- **Feeds A1 (Test Case Generator):** Discovered flows → suggested test cases for human refinement/approval
- **Feeds A4 (Defect Intelligence):** E2E failures → RCA analysis, auto-defect triage
- **Cross-Milestone Link:** M11 (Visual Regression) can use APT discovery for visual baseline capture; M12 (GA) includes APT beta feedback loop

---

## 3. DEFINITION OF READY (DoR)

**Prerequisites for Viable M10 Kickoff:**

1. M7 (A6 Test Data) stable + seeded (≥5 test data templates usable by APT setup flows)
2. M8 (A7 Self-Healing) operational (flaky step suggestions available; HITL gate in place)
3. M9 (A8 Advanced) risk scoring live (APT can query risk_score per feature from risk_adaptive_test_plans table)
4. Playwright runner (M5) mature + optimized (headless execution <2s startup overhead)
5. A4 RCA agent (M4) proven (≥75% confidence on E2E failure stack traces)
6. LangGraph infrastructure ready (LangGraph 0.2.15+, Redis checkpoints, Hatchet scheduling)
7. Ollama Gemma 4 + Claude 3.5 Sonnet (fallback) available; token budgets allocated
8. Web app test environment prepared (staging with seed data, 99% uptime SLA for 2w)
9. Figma + PRD context for test app available (APT uses design context for flow discovery)
10. Mock E2E failure scenarios seeded (≥20 realistic E2E failure traces for RCA + exploratory testing)

---

## 4. M10 SCOPE & MISSION

### **Phase 1 (W1: Scenario Discovery Engine)**

**Goal:** DOM crawler + visual analysis identifies untested user journeys (50+ per session).

**Scope:**
- **DOM Crawling:** Breadth-first traversal of app DOM; identify clickable elements (buttons, links, inputs), form fields, navigation patterns
- **Visual Analysis:** Full-page screenshot + OCR (extract text, button labels); cluster similar pages (identify repeated UI patterns, modal dialogs, error states)
- **Flow Inference:** From element chains + visual patterns, infer 3–5 step user journeys (e.g., "Sign up → Enter email → Verify email → Set password → Dashboard")
- **Scenario Generation:** Each inferred flow = 1 scenario; output: list of {flow_id, description, steps: [{action, locator, expected_result}], confidence}
- **Untested Filter:** Query existing test_cases table; exclude flows already covered (fuzzy match on step descriptions); return only novel scenarios
- **HITL Gate 1:** Human reviewer sees ≥10 scenarios grouped by category (auth, payment, reporting, etc.); can approve bulk, reject, or refine before promotion to suite

**Deliverables:** DMS-T001–T004 (see Feature Breakdown §9)

---

### **Phase 2 (W2: Autonomous Execution + Exploratory Testing)**

**Goal:** Execute discovered scenarios autonomously; run bounded exploratory sessions.

**Scope:**
- **Auto-Generation:** Discovered scenario → Playwright test spec (TypeScript) via LangGraph; cost-gated (max $0.05/scenario)
- **Autonomous Execution:** Schedule or on-demand; execute on isolated Playwright worker; <2 min per scenario (2 min timeout, hard limit)
- **Evidence Capture:** Screenshot at each step, full-page screenshot on success/failure, video recording (optional, cost-tracked), browser console logs, HAR file
- **Flaky Repair:** A7 self-healing applied to detected flaky steps before next retry (max 3 retries, 10s backoff)
- **Result Recording:** test_results table updated; linked to scenario_id; evidence stored in R2
- **Exploratory Testing:** Time-boxed AI "bug hunter" session (30 min wall-clock, $1 budget): LangGraph variant explores random flows, fuzzes inputs (XSS, injection, boundary tests), captures failures → explores further based on findings
- **HITL Gate 2:** Human reviewer sees exploratory findings (≥1 bug found); can accept (file defect), dismiss (false positive), or refine before filing

**Deliverables:** DMS-T005–T008 (see Feature Breakdown §9)

---

## 5. TECH STACK (M10-SPECIFIC)

| Component | Version | Purpose | Status | Milestone |
|-----------|---------|---------|--------|-----------|
| **Playwright** | 1.48+ | Browser automation, crawling, scenario execution | Live (M5+) | M10 (new: crawling, scenario execution) |
| **LangGraph** | 0.2.15+ | Orchestration: scenario discovery, test gen, exploratory flows | Live (M1+) | M10 (new: 3-flow orchestration) |
| **Ollama Gemma 4 26B MoE** | 2026-04 | Scenario inference, flow description generation | Live (M1+) | M10 (high token volume for discovery) |
| **Claude 3.5 Sonnet** | Latest | Cost-gated fallback for complex RCA, exploratory logic | Available (M4+) | M10 (exploratory agent) |
| **Redis** | 7.x | LangGraph checkpoints (discovery state, exploratory breadcrumb) | Live (M0+) | M10 |
| **Hatchet** | 0.33+ | Job queue for scenario execution, exploratory sessions | Live (M5+) | M10 (new: APT job type) |
| **PostgreSQL 15** | 15.x | scenarios table, scenario_results, exploratory_sessions | Live (M0+) | M10 (new: 3 tables) |
| **Cloudflare R2** | Live | Evidence storage (video, trace files) | Live (M3+) | M10 |
| **Unleash** | 5.3+ | Feature flags: `apt.discovery`, `apt.exploratory_testing` | Live (M0+) | M10 |

---

## 6. DATABASE CHANGES (M10)

### New Tables

**TB-047: scenarios** (AI-discovered user flows)
```sql
CREATE TABLE scenarios (
  scenario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  flow_description TEXT NOT NULL,
  steps JSONB NOT NULL, -- [{action, locator, expected_result, screenshot_path?}]
  confidence_score NUMERIC(3,2) NOT NULL, -- 0.00–1.00
  category VARCHAR(32) DEFAULT 'general', -- auth, payment, reporting, navigation, etc.
  source VARCHAR(32) DEFAULT 'apt_discovery', -- apt_discovery, apt_exploratory, manual
  status VARCHAR(32) DEFAULT 'pending_review', -- pending_review, approved, rejected, archived
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (project_id, status, created_at),
  INDEX (confidence_score DESC)
);
```

**TB-048: scenario_results** (Autonomous execution results)
```sql
CREATE TABLE scenario_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(scenario_id),
  test_run_id UUID REFERENCES test_runs(id),
  execution_status VARCHAR(32) NOT NULL, -- pass, fail, timeout, error
  duration_ms INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  error_message TEXT,
  step_results JSONB, -- [{step_idx, action, result, screenshot_url, duration_ms}]
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (scenario_id, execution_status),
  INDEX (created_at DESC)
);
```

**TB-049: exploratory_sessions** (APT exploratory bug-hunting runs)
```sql
CREATE TABLE exploratory_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  duration_seconds INTEGER,
  token_spent NUMERIC(6,2),
  bugs_found INTEGER,
  findings JSONB, -- [{finding_type, description, reproduction_steps, confidence, defect_id_filed?}]
  status VARCHAR(32) DEFAULT 'completed', -- running, completed, failed, timeout
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (project_id, created_at),
  INDEX (bugs_found DESC)
);
```

### Modified Tables

**test_cases:**
- Add `source_scenario_id UUID REFERENCES scenarios(scenario_id)` — link case to discovered scenario (optional, for traceability)

**test_results:**
- Add `discovered_scenario_id UUID REFERENCES scenarios(scenario_id)` — link E2E result to scenario

---

## 7. API CONTRACTS (EP-IDs)

### Scenario Discovery & Management

**EP-050 POST `/api/v1/apt/discover` — Trigger scenario discovery crawl**
```json
Request:
{
  "project_id": "proj-123",
  "app_url": "https://staging.acme.com",
  "max_pages": 20,
  "depth_limit": 5,
  "include_categories": ["auth", "payment", "reporting"],
  "timeout_seconds": 600
}

Response (202 Accepted — async):
{
  "job_id": "apt-discover-001",
  "status": "queued",
  "estimated_scenarios": null
}

Polling GET `/api/v1/apt/jobs/:job_id`:
{
  "job_id": "apt-discover-001",
  "status": "completed",
  "scenarios_discovered": 47,
  "scenarios": [
    {
      "scenario_id": "sc-001",
      "flow_description": "User signup: enter email → verify → set password",
      "steps": [
        { "action": "navigate", "url": "/signup", "expected_result": "form visible" },
        { "action": "fill", "locator": "input[name=email]", "value": "test@acme.com", "expected_result": "email entered" },
        { "action": "click", "locator": "button:has-text('Next')", "expected_result": "verify modal shown" }
      ],
      "confidence_score": 0.87,
      "category": "auth"
    },
    ...
  ]
}
```

**EP-051 POST `/api/v1/scenarios/review` — HITL gate: approve/reject scenarios**
```json
Request:
{
  "project_id": "proj-123",
  "scenario_ids": ["sc-001", "sc-002", "sc-005"],
  "action": "approve",
  "reason": "All auth flows critical for v1.5"
}

Response:
{
  "approved_count": 3,
  "scenarios_status": [
    { "scenario_id": "sc-001", "status": "approved", "reviewed_at": "2026-11-20T10:30:00Z" },
    ...
  ]
}
```

**EP-052 GET `/api/v1/scenarios` — List scenarios (paginated, filterable)**
```json
Request:
GET /api/v1/scenarios?project_id=proj-123&status=approved&category=auth&page=1&per_page=20

Response:
{
  "scenarios": [
    {
      "scenario_id": "sc-001",
      "flow_description": "...",
      "status": "approved",
      "recent_execution_status": "pass",
      "recent_execution_date": "2026-11-21T09:00:00Z"
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 47 }
}
```

### Autonomous Execution

**EP-053 POST `/api/v1/scenarios/:scenario_id/execute` — Run approved scenario autonomously**
```json
Request:
{
  "project_id": "proj-123",
  "scenario_id": "sc-001",
  "environment": "staging",
  "retry_on_failure": 2,
  "capture_video": false
}

Response (202 Accepted):
{
  "test_run_id": "run-123",
  "scenario_result_id": "sr-001",
  "status": "queued"
}

Polling GET `/api/v1/scenarios/results/:result_id`:
{
  "scenario_result_id": "sr-001",
  "scenario_id": "sc-001",
  "execution_status": "pass",
  "duration_ms": 1847,
  "step_results": [
    {
      "step_idx": 0,
      "action": "navigate",
      "result": "success",
      "screenshot_url": "https://r2.acme.com/...png",
      "duration_ms": 400
    },
    ...
  ],
  "created_at": "2026-11-21T10:15:00Z"
}
```

**EP-054 GET `/api/v1/apt/execution-report` — Aggregated scenario execution report**
```json
Request:
GET /api/v1/apt/execution-report?project_id=proj-123&date_range=7d

Response:
{
  "date_range": "7d",
  "total_scenarios_executed": 47,
  "pass_rate": 0.85,
  "avg_duration_ms": 1850,
  "top_failing_scenarios": [
    {
      "scenario_id": "sc-015",
      "flow_description": "Payment flow: card entry",
      "pass_rate": 0.62,
      "recent_error": "Timeout waiting for stripe iframe"
    }
  ],
  "discovered_new_bugs": 3
}
```

### Exploratory Testing

**EP-055 POST `/api/v1/apt/explore` — Start bounded exploratory session**
```json
Request:
{
  "project_id": "proj-123",
  "app_url": "https://staging.acme.com",
  "duration_minutes": 30,
  "budget_usd": 1.0,
  "seed": "explore-high-risk-payment",
  "focus_areas": ["payment", "auth"]
}

Response (202 Accepted):
{
  "session_id": "exp-sess-001",
  "status": "running",
  "start_time": "2026-11-21T10:15:00Z"
}

Polling GET `/api/v1/apt/exploratory/:session_id`:
{
  "session_id": "exp-sess-001",
  "status": "completed",
  "duration_seconds": 1847,
  "token_spent": 0.87,
  "bugs_found": 2,
  "findings": [
    {
      "finding_type": "input_injection",
      "description": "XSS via card number field: '<img src=x onerror=alert()>' accepted without escaping",
      "reproduction_steps": "Navigate to /checkout → Payment tab → Enter payload in card number field → Check DOM",
      "confidence": 0.92,
      "defect_id_filed": null
    },
    {
      "finding_type": "race_condition",
      "description": "Double-submit race: clicking 'Complete' twice results in 2 charges",
      "reproduction_steps": "Navigate to /checkout → Fill form → Click Complete × 2 rapidly",
      "confidence": 0.78,
      "defect_id_filed": null
    }
  ]
}
```

**EP-056 POST `/api/v1/apt/exploratory/:session_id/findings/:finding_id/file-defect` — Convert finding to defect**
```json
Request:
{
  "project_id": "proj-123",
  "session_id": "exp-sess-001",
  "finding_id": 1,
  "severity": "P1",
  "assignee_id": "user-456"
}

Response:
{
  "defect_id": "defect-789",
  "jira_issue_key": "QA-123",
  "title": "XSS via card number field",
  "description": "...",
  "findings_link": "..." -- link back to exploratory session
}
```

---

## 8. AI AGENT SPECIFICATION: APT

### APT Architecture (LangGraph-based)

**Entry Point:** `AptDiscoveryFlow` (LangGraph conditional router)

```
┌─ Scenario Discovery (W1)
│  ├─ DOM Crawler (Playwright headless)
│  ├─ Visual Analyzer (Claude vision + OCR)
│  ├─ Flow Inference (LLM: "infer 3-5 step user journeys")
│  ├─ Untested Filter (query test_cases, fuzzy match)
│  └─ HITL Gate 1: Human review + approve/reject
│
├─ Autonomous Execution (W2)
│  ├─ Scenario → Playwright Codegen
│  ├─ Cost Budgeter (max $0.05/scenario)
│  ├─ Hatchet Job: execute (max 2 min timeout)
│  ├─ Evidence Capture (screenshot, logs, video)
│  ├─ Flaky Repair (A7 self-healing on failure)
│  └─ Result Recording (test_results + scenario_results)
│
└─ Exploratory Testing (W2)
   ├─ Exploration Strategy (random flow picker + input fuzzer)
   ├─ Budget Tracker (<30 min, <$1, early exit if budget exceeded)
   ├─ Finding Capture (bug classification, confidence scoring)
   ├─ HITL Gate 2: Human review findings
   └─ Defect Filing (A4 RCA on findings, optional)
```

### Scenario Discovery Flow (Orchestration)

**LangGraph State Machine (pseudocode):**

```python
def scenario_discovery_flow(
    app_url: str,
    max_pages: int = 20,
    depth_limit: int = 5,
    existing_test_cases: List[TestCase]
) -> List[Scenario]:
    """
    1. Crawl app (Playwright headless)
    2. Analyze pages visually (Claude + OCR)
    3. Infer flows (LLM reasoning)
    4. Filter untested flows
    5. Return scenarios (confidence scored)
    """
    
    # Step 1: DOM Crawl
    pages = await playwright_crawl(
        app_url, max_pages=max_pages, depth_limit=depth_limit
    )
    # Output: List[{url, dom, text, clickables, forms}]
    
    # Step 2: Visual Analysis (per page)
    visual_features = []
    for page in pages:
        screenshot = await capture_screenshot(page.url)
        ocr_text = await ocr(screenshot)
        visual_features.append({
            "url": page.url,
            "screenshot": screenshot,
            "text": ocr_text,
            "buttons": extract_buttons(screenshot),
            "forms": extract_forms(page.dom)
        })
    
    # Step 3: Flow Inference (LLM)
    flows = await llm_infer_flows(visual_features)
    # Prompt: "Infer 3-5 step user journeys from these pages..."
    # Output: [{description, steps: [{action, locator, expected_result}]}]
    
    # Step 4: Untested Filter + Dedup
    existing_descs = [tc.description for tc in existing_test_cases]
    novel_flows = await semantic_filter(
        flows, existing_descs, similarity_threshold=0.7
    )
    # Use pgvector for semantic matching
    
    # Step 5: Confidence Scoring
    scenarios = []
    for flow in novel_flows:
        confidence = await score_scenario(flow)
        scenarios.append({
            "flow_description": flow.description,
            "steps": flow.steps,
            "confidence_score": confidence,
            "category": infer_category(flow)
        })
    
    return scenarios
```

**Cost Model (Scenario Discovery):**
- Playwright crawl: ~$0.001 per page (compute cost)
- Vision API calls: ~$0.01 per screenshot (Claude vision)
- LLM reasoning (flow inference): ~$0.005 per scenario batch
- **Total per discovery session:** ~$0.50–$1.00 for 50 scenarios (cost-gated in code)

### Exploratory Testing Flow

**LangGraph State Machine (pseudocode):**

```python
def apt_exploratory_flow(
    app_url: str,
    duration_minutes: int = 30,
    budget_usd: float = 1.0,
    focus_areas: List[str] = []
) -> ExploratorySession:
    """
    1. Start exploration loop (budget-bounded)
    2. Pick random entry points (or focus_areas first)
    3. Fuzz inputs (injection, boundary tests, XSS, race conditions)
    4. Capture findings (bug classification)
    5. Explore deeper based on findings (adaptive)
    6. Return findings (human review gate)
    """
    
    session = ExploratorySession(
        start_time=now(),
        budget_remaining_usd=budget_usd,
        duration_remaining_seconds=duration_minutes * 60
    )
    
    findings = []
    visited_states = set()
    
    while session.has_budget() and session.not_timed_out():
        # Pick entry point
        if focus_areas and len(findings) < 1:
            entry = random.choice(focus_areas)
        else:
            entry = random.choice(app_entry_points)
        
        # Fuzz inputs (pick fuzzer strategy)
        strategies = ["xss", "sql_injection", "race_condition", "boundary", "navigation"]
        fuzzer_strategy = random.choice(strategies)
        
        # Execute fuzzing session
        finding = await fuzz_and_explore(
            app_url, entry, fuzzer_strategy, max_duration=300
        )
        
        if finding.is_new():
            findings.append(finding)
            visited_states.add(finding.state_hash)
            
            # Explore deeper if finding looks exploitable
            if finding.confidence > 0.8:
                deeper_findings = await explore_around(finding, depth=2)
                findings.extend(deeper_findings)
        
        # Update budget
        session.update_budget(tokens_used=finding.tokens_used)
    
    return ExploratorySession(
        findings=findings,
        duration_seconds=elapsed,
        token_spent=budget_usd - session.budget_remaining_usd,
        bugs_found=count_high_confidence_findings(findings)
    )
```

**Cost Model (Exploratory Session):**
- Playwright execution: ~$0.01 per minute
- Claude reasoning (finding analysis): ~$0.02 per finding
- **Total per 30-min session:** ~$0.30–$1.00 (budget enforced in code)

### Integration with A1, A4, A7

**A1 (Test Case Generator) Integration:**
- Input: Discovered scenarios (approved)
- Output: Test cases with Clarification Questions gate
- Flow: APT discovers scenario → A1 converts to formal test case → QA Lead reviews + approves

**A4 (Defect Intelligence) Integration:**
- Input: E2E failure from autonomous scenario execution
- Output: 5-layer RCA with confidence per layer
- Flow: Scenario fails → A4 analyzes failure context → stores RCA in test_results

**A7 (Self-Healing) Integration:**
- Input: Detected flaky step in scenario
- Output: Suggestion (refine locator, add wait condition, etc.)
- Flow: Scenario pass rate <80% → A7 suggests repair → approve-in-context → fix + re-execute

---

## 9. FEATURE & TASK BREAKDOWN

### Week 1: Scenario Discovery Engine (W1: 2026-11-17 → 2026-11-23)

#### DMS-T001: DOM Crawler + Visual Analysis Core
**Description:** Implement Playwright-based crawler + vision API integration for untested flow detection.

**Details:**
- **DOM Crawler:** BFS traversal (Playwright), max 20 pages, depth limit 5, identify: buttons, links, inputs, navigation patterns, modals
- **Visual Analyzer:** Full-page screenshot per URL → Claude vision API (extract text, button labels, form structure) + OCR
- **Page Clustering:** Identify recurring UI patterns (e.g., "3 pages have same navbar + sidebar" → count as 1 unique layout)
- **Output:** List of {url, dom, screenshot, visual_features, clickables: [{action, locator}]}

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer (APT)  
**Dependencies:** Playwright 1.48+, Claude vision API, pgvector  
**US-ID:** US-020 [APT discovery]  
**TB/EP:** TB-047 (scenarios), EP-050 (discovery trigger)

---

#### DMS-T002: Flow Inference + Scenario Generation
**Description:** LLM-driven inference of user journeys from crawled app; output actionable scenarios.

**Details:**
- **Flow Inference Prompt:** "Given these pages + clickables, infer 3–5 step user journeys (e.g., signup, login, payment checkout). Return JSON: [{description, steps: [{action, locator, expected_result}]}]"
- **Step Validation:** Ensure each step is actionable (locator exists, action is standard: navigate, click, fill, wait, screenshot, assert)
- **Confidence Scoring:** Score = (LLM confidence + locator_confidence + expected_result_clarity) / 3
- **Dedup via pgvector:** Query existing test_cases; use semantic similarity to filter out already-tested flows
- **Category Inference:** Classify scenario (auth, payment, reporting, navigation, etc.) for later filtering

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** AI Engineer (LangGraph + LLM)  
**Dependencies:** DMS-T001, LangGraph 0.2.15+, Ollama Gemma 4 / Claude  
**US-ID:** US-020  
**TB/EP:** TB-047, EP-051 (scenario review gate)

---

#### DMS-T003: HITL Gate 1 — Scenario Review API
**Description:** Human-in-the-loop approval flow for discovered scenarios before execution.

**Details:**
- **Review UI:** Show scenarios grouped by category (auth, payment, etc.); bulk approve/reject/refine
- **Approval Flow:** Draft → Lead approves → Approved (status in DB)
- **Audit Trail:** Log reviewer + timestamp + reason for each approval/rejection
- **Integration:** Approved scenarios feed into Autonomous Execution phase

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** Backend + Frontend  
**Dependencies:** DMS-T002, EP-051  
**US-ID:** US-020  
**TB/EP:** TB-047 (scenarios.status)

---

#### DMS-T004: Scenario List + Filter UI
**Description:** Frontend for browsing, filtering, and managing discovered scenarios.

**Details:**
- **List View:** Paginated scenarios (20 per page), sortable by confidence, category, execution status
- **Filters:** Status (pending, approved, rejected), category, confidence range, date range
- **Detail Pane:** Flow description, steps, confidence, recent execution results, approval status
- **Bulk Actions:** Approve × N, reject × N, archive × N
- **Export:** Scenario list to CSV (for reporting, tracking)

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Frontend Engineer  
**Dependencies:** DMS-T003, EP-052  
**US-ID:** US-020  
**TB/EP:** TB-047

---

### Week 2: Autonomous Execution + Exploratory Testing (W2: 2026-11-24 → 2026-11-28)

#### DMS-T005: Scenario → Playwright Codegen
**Description:** Convert approved scenario definition to executable Playwright test spec (TypeScript).

**Details:**
- **Code Generation:** Template-based or LLM-driven (e.g., "Convert this scenario to Playwright TypeScript test_spec.ts")
- **Step Mapping:** scenario.steps[i] → Playwright action:
  - `{action: "navigate", locator: "/checkout"}` → `await page.goto("https://app/checkout")`
  - `{action: "click", locator: "button:has-text('Pay')"}` → `await page.click("...")`
  - `{action: "fill", locator: "input[name=email]", value: "test@example.com"}` → `await page.fill(...)`
  - `{action: "screenshot"}` → `await page.screenshot({path: "..."})`
- **Error Handling:** Add try-catch per step; capture error context (step #, error message, screenshot)
- **Cost Budgeting:** Estimate token cost for execution; return early if >$0.05 budget exceeded

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend Engineer (APT)  
**Dependencies:** DMS-T002, LangGraph, Playwright API  
**US-ID:** US-020  
**TB/EP:** TB-048 (scenario_results), EP-053 (execution trigger)

---

#### DMS-T006: Autonomous Execution + Hatchet Integration
**Description:** Execute Playwright specs on isolated workers; <2 min per scenario, with retries and flaky repair.

**Details:**
- **Job Definition:** Hatchet workflow `apt-scenario-execution.yaml`
  - Input: scenario_id, test_run_id
  - Step 1: Allocate worker (max 3 concurrent per Oracle VM)
  - Step 2: Execute Playwright spec (2-min timeout, hard limit)
  - Step 3: Capture evidence (screenshot, console logs, HAR, video optional)
  - Step 4: A7 flaky repair (if pass_rate <80%, suggest fix + re-execute)
  - Step 5: Update test_results + scenario_results
- **Retry Logic:** Exponential backoff (1s, 2s, 4s) up to 2 retries on transient failure
- **Evidence Upload:** R2 signed URLs for artifacts (screenshot, video, trace)

**Priority:** P0  
**Estimate:** 18 hours  
**Owner:** DevOps + Backend  
**Dependencies:** DMS-T005, Hatchet 0.33+, R2, A7 service  
**US-ID:** US-020  
**TB/EP:** TB-048, EP-053, EP-054

---

#### DMS-T007: Exploratory Testing Engine
**Description:** Bounded AI-driven exploratory testing: pick random flows, fuzz inputs, find bugs.

**Details:**
- **Exploration Strategy:** Pick entry points (auth, payment, main flow); apply fuzzing strategies (XSS, SQL injection, race condition, boundary values, navigation)
- **Fuzzer:** For each input field, inject payloads:
  - XSS: `<img src=x onerror=alert()>`, `"><script>alert()</script>`
  - SQL: `' OR 1=1 --`, `admin'--`
  - Boundary: empty, max-length, negative numbers, special chars
  - Race: Submit form × 2 rapidly (detect double-charge, duplicate create)
- **Finding Capture:** On error/anomaly, capture: reproduction steps, error message, screenshot, confidence
- **Budget Tracking:** Wall-clock <30 min, token spend <$1, early exit if budget exceeded
- **Adaptive Exploration:** If finding high-confidence (>0.8), explore related flows (e.g., if XSS found in email field, try other fields)

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** AI Engineer + Backend  
**Dependencies:** DMS-T001, DMS-T005, LangGraph, Claude  
**US-ID:** US-020  
**TB/EP:** TB-049 (exploratory_sessions), EP-055, EP-056

---

#### DMS-T008: HITL Gate 2 + Finding Triage
**Description:** Human review of exploratory findings before filing defects.

**Details:**
- **Review UI:** Show findings grouped by type (XSS, race, etc.); each finding has: description, reproduction steps, screenshot, confidence
- **Triage Flow:** Finding → Lead reviews → Accept (file defect) / Dismiss (false positive) / Refine
- **Defect Filing:** Approved finding → A4 RCA (auto-analyze) → create defect in Jira via 2-way sync
- **Audit Trail:** Log reviewer + decision + reasoning

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend + Frontend  
**Dependencies:** DMS-T007, A4 service, Jira integration  
**US-ID:** US-020  
**TB/EP:** TB-049, EP-056

---

#### DMS-T009: Observability + Telemetry
**Description:** Dashboards + metrics for scenario discovery/execution health.

**Details:**
- **Metrics:**
  - Scenarios discovered (per crawl session)
  - Scenario approval rate (% approved vs. total discovered)
  - Execution success rate (% pass vs. total executed)
  - Autonomous coverage (% of test cases sourced from APT)
  - Exploratory bugs found (per session, confidence distribution)
  - Cost per scenario ($0.05 target), cost per exploratory run ($1.0 target)
- **Dashboards:** SigNoz + GlitchTip (APT-specific panels)
- **Alerts:** If execution success rate <70% or cost >$0.10/scenario

**Priority:** P1  
**Estimate:** 8 hours  
**Owner:** DevOps + Backend  
**Dependencies:** SigNoz, Langfuse, all DMS-T tasks  
**US-ID:** US-020  
**TB/EP:** None (observability artifact)

---

## 10. TEST STRATEGY

### Manual Testing (QA Team)

1. **Scenario Discovery:**
   - Crawl 3 test apps (simple form, SPA with modals, e-commerce checkout)
   - Validate discovered scenarios ≥50 per app
   - Verify dedup filters out existing test cases
   - Check confidence scores (high-confidence scenarios should have <5% false-positive rate)

2. **Autonomous Execution:**
   - Execute 50 approved scenarios on staging environment
   - Validate pass rate ≥85% (target <15% flaky)
   - Verify evidence capture (screenshot, logs, HAR all present)
   - Test A7 self-healing: introduce flakiness, verify A7 suggests repair, re-execution succeeds

3. **Exploratory Testing:**
   - Run 5 exploratory sessions (30 min each, $1 budget each)
   - Validate ≥1 new bug found per session (40% confidence threshold)
   - Verify HITL gate: human reviewer can accept/reject findings
   - Test defect filing: findings → defects in Jira (verify 2-way sync)

4. **Integration Testing:**
   - Discovered scenarios → A1 test case generation (verify flow)
   - E2E failure → A4 RCA (verify RCA results in test_results)
   - Flaky scenario → A7 suggestion (verify self-healing approval flow)
   - Exploratory finding → A4 RCA → defect filing (end-to-end)

### E2E Testing (Playwright)

- APT itself tested via Playwright: trigger discovery → verify scenarios table populated → execute scenarios → verify results
- End-to-end: crawl → discovery → HITL gate → execution → exploratory → filing defects

### Load Testing

- 5 concurrent APT discovery sessions + 10 autonomous execution jobs + 2 exploratory sessions
- Verify no resource contention (Hatchet, Ollama, PostgreSQL)
- Target: <500ms API latency for list/detail queries

### Accessibility

- HITL review UI (EP-051, EP-055) tested for WCAG 2.1 AA
- Keyboard navigation, screen reader support for findings review

---

## 11. RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|-----------|-------|
| **Scenario discovery low recall** (misses valid flows) | Discovery quality, user trust | Medium | Pilot validation with 3 test apps; iterate on crawler depth/heuristics | AI Eng |
| **High false-positive rate in exploratory testing** (non-reproducible bugs) | Defect triage burden | Medium | Confidence thresholds (>0.8 only), HITL gate required before filing | AI Eng |
| **Scenario execution timeout >2 min** (slow test env, network latency) | Cost overrun, missed scenarios | Medium | 2-min hard limit enforced in code; early exit if budget exceeded; prioritize fast scenarios | Backend |
| **Cost overrun** (exploratory session >$1) | Budget impact, uncontrolled LLM spend | Low | Token budgeter in LangGraph; hard stop at budget limit; cost per-scenario capped | AI Eng |
| **A7 self-healing unavailable at M10 start** | Can't repair flaky discovered scenarios | Low | Fallback: skip repair step; execute scenario 3×, use best result | Backend |
| **Jira sync for exploratory findings fails** | Can't file defects from exploratory | Medium | Fallback: manual defect creation in QA Nexus (later sync to Jira) | Backend |
| **Ollama Gemma 4 inference slow** (token latency >5s per flow) | Discovery latency, poor UX | Low | Fallback to Claude 3.5 Sonnet (cost-tracked); batch inference for multiple flows | AI Eng |
| **HITL gate bottleneck** (QA Lead approval backlog) | Discovered scenarios pile up; not executed | Medium | Batch approval UI; approve-bulk-by-category; default to approve if confidence >0.9 | Product |

---

## 12. ROLLBACK & FALLBACK

### Feature Flags

- `apt.discovery` — Dark-launch discovery crawl, require manual enable for scenario list
- `apt.execution` — Autonomous execution (default disabled; enable per project)
- `apt.exploratory_testing` — Exploratory sessions (default disabled; enable for select pilots)

### Fallback Paths

1. **Discovery crawl hangs:** Return empty scenarios list; log error; alert ops
2. **Scenario execution timeout:** Mark as failed; skip flaky repair; move to next scenario
3. **Exploratory budget exceeded:** Stop exploration loop; return findings so far
4. **Jira sync on exploratory finding fails:** Store finding locally; user can manually file later
5. **Vision API quota exceeded:** Fallback to OCR only (text-based feature extraction)

### Rollback Decision Gate (M12)

- If scenario discovery recall <40% (misses >50% of valid flows), disable `apt.discovery` flag
- If false-positive defect rate >30%, disable `apt.exploratory_testing` flag
- If cost per scenario >$0.10, disable `apt.discovery` for expensive apps

---

## 13. OBSERVABILITY & TELEMETRY

### Metrics (Langfuse + SigNoz)

**Discovery Phase:**
- `apt_scenarios_discovered_total` (counter) — per crawl session
- `apt_crawl_duration_seconds` (histogram) — wall-clock time
- `apt_pages_visited` (gauge) — per session
- `apt_scenarios_approved_rate` (gauge) — % approved by lead

**Execution Phase:**
- `apt_scenario_execution_success_rate` (gauge) — % pass
- `apt_scenario_execution_duration_ms` (histogram) — per scenario
- `apt_scenarios_flaky_rate` (gauge) — % <80% pass rate
- `apt_autonomous_coverage_pct` (gauge) — % of test cases sourced from APT

**Exploratory Phase:**
- `apt_exploratory_bugs_found_total` (counter) — per session
- `apt_exploratory_finding_confidence_distribution` (histogram)
- `apt_exploratory_false_positive_rate` (gauge)
- `apt_exploratory_duration_seconds` (histogram)
- `apt_exploratory_token_spent_usd` (gauge)

**Cost:**
- `apt_discovery_cost_usd_total` (counter) — cumulative
- `apt_scenario_cost_usd_avg` (gauge) — target <$0.05
- `apt_exploratory_cost_usd_avg` (gauge) — target <$1.00

### Alarms

- `apt_execution_success_rate < 70%` → P2 alert (ops)
- `apt_exploratory_false_positive_rate > 30%` → P2 alert (product)
- `apt_scenario_cost > $0.10` → P1 alert (cost control)
- `apt_discovery_recall_session < 40%` (manual inspection) → P2 alert (quality)

### Tracing

- Full execution trace per scenario (Langfuse): discovery → codegen → execution → evidence upload
- Exploratory session trace: strategy selection → fuzzing → finding capture → audit

---

## 14. HANDOFF & DEFINITION OF DONE

### Exit Criteria (M10 DoD)

1. ✅ Scenario discovery live (EP-050 deployed, ≥50 scenarios discoverable per crawl)
2. ✅ HITL gate 1 operational (EP-051, human review + approval working)
3. ✅ Autonomous execution live (EP-053, <2 min per scenario, ≥85% success rate)
4. ✅ Evidence capture complete (screenshot, console logs, HAR, video optional, all in R2)
5. ✅ A7 self-healing integration verified (flaky scenario → suggestion → fix → re-execute)
6. ✅ Exploratory testing live (EP-055, <30 min, <$1 budget, ≥1 bug/session)
7. ✅ HITL gate 2 operational (EP-056, human review + defect filing working)
8. ✅ Integration with A1/A4/A7 verified (discover → generate → execute → triage flows)
9. ✅ Observability dashboards live (SigNoz + Langfuse, all metrics tracked)
10. ✅ Feature flags deployed (all 3 APT flags dark-launched, ready for M12 beta feedback)
11. ✅ Zero P0 defects; <2 P1 defects; all tech debt documented
12. ✅ API contracts frozen (EP-050–056 finalized, breaking changes impossible)
13. ✅ Handoff docs complete (API spec, admin runbook, troubleshooting guide)

### Handoff Artifacts

- **API Specification:** OpenAPI 3.0 (EP-050–056 with examples)
- **Admin Runbook:** Feature flag roll-out strategy, cost control, troubleshooting
- **Troubleshooting Guide:** Common issues (discovery hangs, execution timeouts, budget exceeded) + remediation
- **Data Export:** Sample scenarios, results, exploratory sessions (for M12 customer pilots)
- **Observability:** SigNoz dashboards + alarm definitions exported

### Successor Milestone (M11)

- **M11 (Visual Regression + Mobile + On-Prem):** APT scenario discovery can be used to establish visual baselines (screenshot per scenario)
- **M12 (v1.5 GA):** APT in beta; customer feedback loop integrated; cost tracking + limits enforced

---

## 15. APPENDIX: LANGGRAPH ORCHESTRATION

### State Schema

```python
from typing import TypedDict, Annotated
import operator

class AptState(TypedDict):
    # Input
    app_url: str
    max_pages: int
    depth_limit: int
    duration_minutes: int
    budget_usd: float
    
    # Intermediate
    crawled_pages: list  # [{url, dom, screenshot, visual_features}]
    inferred_flows: list  # [{description, steps, confidence}]
    novel_scenarios: list  # [{scenario_id, ...}]
    approved_scenarios: list
    execution_results: Annotated[list, operator.add]  # Accumulated results
    exploratory_findings: list
    
    # Output
    status: str  # "queued", "running", "completed", "failed"
    error: Optional[str]
    job_id: str
```

### Node Definitions

```python
async def crawl_node(state: AptState) -> AptState:
    """Crawl app, return pages."""
    pages = await playwright_crawl(state["app_url"], ...)
    return {"crawled_pages": pages}

async def visual_analyze_node(state: AptState) -> AptState:
    """Visual analysis per page."""
    visual_features = []
    for page in state["crawled_pages"]:
        features = await claude_vision_analyze(page["screenshot"])
        visual_features.append(features)
    return {"crawled_pages": [
        {**p, "visual_features": vf}
        for p, vf in zip(state["crawled_pages"], visual_features)
    ]}

async def flow_inference_node(state: AptState) -> AptState:
    """Infer flows from pages."""
    flows = await llm_infer_flows(state["crawled_pages"])
    return {"inferred_flows": flows}

async def dedup_filter_node(state: AptState, existing_test_cases) -> AptState:
    """Filter novel flows."""
    novel = await semantic_filter(state["inferred_flows"], existing_test_cases)
    return {"novel_scenarios": novel}

async def hitl_gate_1_node(state: AptState) -> AptState:
    """Wait for human approval."""
    approved = await wait_for_hitl_approval(state["novel_scenarios"], timeout=3600)
    return {"approved_scenarios": approved}

# ... execution, exploratory, hitl_gate_2 nodes similarly defined
```

### Graph Topology

```
Crawl → Visual Analyze → Flow Inference → Dedup Filter → 
  → HITL Gate 1 (human review) → 
  → (Parallel) Autonomous Execution + Exploratory Testing → 
  → HITL Gate 2 (human review findings) → 
  → Defect Filing (A4 RCA)
```

### Checkpointing

- Redis checkpoint after each major node (crawl, inference, HITL gate)
- Allow resume from checkpoint if job interrupted (e.g., network timeout)
- TTL: 7 days on Redis checkpoint keys

---

**End of Milestone M10 Document (1,050+ lines, build-ready)**
