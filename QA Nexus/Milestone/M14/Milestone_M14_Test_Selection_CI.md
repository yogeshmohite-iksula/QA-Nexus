---
milestone_id: M14
parent_project_milestone: PM3
name: "Test Selection (A5) + PR-Gated CI"
version: 1.0
date: 2026-04-23
phase: "[PM3]"
window: "W4–6 of PM3"
start_date: 2027-02-02
end_date: 2027-02-20
duration_weeks: 3
primary_agent: A5 (Test Selection)
status: "Planned"
---

# Milestone M14 — Test Selection (A5) + PR-Gated CI

**QA Nexus v2 — Execution Blueprint**

**Version:** 1.0  
**Date Created:** 2026-04-23  
**Status:** Ready for Development  
**Duration:** 3 weeks (2027-02-02 → 2027-02-20)  
**Team:** Backend (1.5 FTE), AI Eng (1 FTE), DevOps (1 FTE), QA (0.5 FTE) = 4 FTE  
**Estimated Effort:** 55 tasks, ~850 hours (510 story points after 20% velocity buffer), 45+ acceptance criteria

---

## TABLE OF CONTENTS

1. [Cover Page](#1-cover-page)
2. [Executive Summary](#2-executive-summary)
3. [Context: What Was Delivered Before](#3-context-what-was-delivered-before)
4. [M14 Scope (Locked)](#4-m14-scope-locked)
5. [Tech Stack (M14 Slice)](#5-tech-stack-m14-slice)
6. [Definition of Ready (DoR)](#6-definition-of-ready-dor)
7. [Milestone Entry Criteria](#7-milestone-entry-criteria)
8. [Task Breakdown (7 Phases)](#8-task-breakdown-7-phases)
9. [Week-Wise Breakdown](#9-week-wise-breakdown)
10. [Acceptance Criteria (45+ ACs)](#10-acceptance-criteria-45-acs)
11. [API Contracts (M14 Scope)](#11-api-contracts-m14-scope)
12. [Database Changes (M14 Scope)](#12-database-changes-m14-scope)
13. [AI Agent Spec (A5)](#13-ai-agent-spec-a5)
14. [Testing Strategy](#14-testing-strategy)
15. [Feature Flag Strategy](#15-feature-flag-strategy)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Rollback Plan](#17-rollback-plan)
18. [Observability & Monitoring](#18-observability--monitoring)
19. [Milestone Exit Criteria (Definition of Done)](#19-milestone-exit-criteria-definition-of-done)
20. [Handoff & Documentation](#20-handoff--documentation)
21. [Next Milestone Preview (M15)](#21-next-milestone-preview-m15)
22. [Appendix](#22-appendix)

---

## 1. COVER PAGE

**QA Nexus v2 — Milestone M14**

**Test Selection (A5) + PR-Gated CI**

*Change-based test subsetting: analyze code diffs, select high-impact tests (P0/P1 prioritized), estimate time savings, GitHub/GitLab CI integration, 60% CI time reduction demo (40 min → 16 min)*

**Duration:** 3 weeks (Feb 02 — Feb 20, 2027)  
**Team:** 4 FTE (Backend × 1.5, AI Eng × 1, DevOps × 1, QA × 0.5)  
**Effort:** ~850 hours (~55 tasks, 45+ ACs, 20% velocity buffer)  
**Status:** [PM3] On Track

---

## 2. EXECUTIVE SUMMARY

**Mission:** Deliver the **A5 Test Selection Agent**, enabling intelligent PR-gated CI that selects only relevant tests from a 500+ test suite based on code changes. When a PR modifies `payments/checkout.ts`, A5 identifies which tests cover the Payments component and schedules only those for CI execution. Target: 60% CI time reduction (40 min full suite → 16 min subset), ≥80% selection accuracy, false-negative rate <5%.

**Key Deliverables:**

- **A5 Change-Based Test Selection Agent:** Parses Git diffs → extracts affected components → queries test metadata index → ranks tests by risk (P0/P1 first) + coverage → outputs subset with confidence scoring + rationale
- **Test Metadata Indexing:** Map test cases to components (via code analysis + manual tagging); pgvector embeddings for semantic component matching
- **CI Integration Layer:** GitHub Actions / GitLab CI webhook receivers, matrix job generation, PR comment with selected tests + time estimate, `/qa run all` override command
- **Cost Model:** Store avg execution time per test; selection optimizes for cost-time savings, not just test count
- **Missed-Failure Detection:** Nightly full-suite run → compare with PR subset → identify false negatives → retrain A5 ranking model
- **Dashboards:** Weekly A5 accuracy report, CI time saved per week, missed-failure rate trend, override rate per repo

**Success Metrics (linked to PRD):**

- **GM-011 (Speedup):** 40 min full suite → 16 min PR subset (60% savings); demonstrated on baseline 500-test suite
- **GM-012 (Accuracy):** A5 ≥80% accurate (selected tests match actual failures when code changes); measured across 20 PRs
- **GM-013 (False-Neg Rate):** <5% of skipped tests should have run (post-hoc analysis); target <2% long-term
- **Deliver:** CI time saved quantified, dashboards live, ≥10 pilot PRs validated

**Rollback Trigger:** If missed-failure rate >5% OR selection accuracy <70% for 24h, disable A5; revert to full-suite CI.

---

## 3. CONTEXT: WHAT WAS DELIVERED BEFORE

### PM1 + PM2 + M13 Baseline (Inherited)

**Automation Suite Library (from M13):**
- ≥100 automation suites authored via A3 low-code editor
- 4 frameworks: Playwright TS, Selenium Java, Cypress JS, WebdriverIO JS
- Metadata per suite: component_tags, priority (P0/P1/P2/P3), affected_modules, framework
- Versioning + export history tracked (framework, export status, confidence score)

**Test Execution Infrastructure:**
- Playwright runner (headed + headless) with R2 artifact storage
- GitHub Actions + GitLab CI pipelines running tests; JUnit XML output captured
- Baseline full-suite CI: ~500 tests, ~40 min average runtime (some projects vary)
- Hatchet job queue for parallel test execution (4 concurrent workers)

**A1 + A2 + A3 + A4 + A7 Proven:**
- Test generation, dedup, low-code authoring, RCA, self-healing all ≥80% confidence
- Historical test pass/fail data available (last 100 runs per project)

**RAG + Vector Store:**
- pgvector index operational (test metadata, component descriptions)
- Semantic search available for component/test matching
- BGE-large embeddings functional

### Key Assets for M14 Consumption

- **Test Suite + Metadata:** ≥100 automation suites with component tags, priority, affected modules, execution history
- **CI Baseline Data:** Last 50 PR runs with diffs + full-suite test results (pass/fail per test)
- **Test Execution Times:** Historical avg time per test (stored per framework) for cost optimization
- **Defect History:** 200+ resolved defects linked to components + test cases (for impact analysis)
- **GitHub/GitLab Repos:** CI workflows configured, webhooks tested (push, PR events)

### APIs Available at M14 Start

- EP-001 → EP-067: All PM1/PM2/M13 endpoints operational (auth, suites, templates, exports, etc.)

### Data Available

- ≥500 test results from M13 automation runs (framework, status, duration, component coverage)
- PR history (git diffs, affected files, component mapping)
- Execution time distribution (p50/p95 per test)

### Agents Online

- FastAPI + LangGraph (A1/A2/A3/A4/A7 operational)
- Langfuse tracing live
- pgvector index with test metadata

---

## 4. M14 SCOPE (LOCKED)

### IN SCOPE (M14 Owns)

| Feature | Component | Rationale |
|---------|-----------|-----------|
| **Change Detection (Diff Parser)** | Git diff → affected components | Parse PR code changes, map to components via codebase analysis |
| **Test Metadata Indexing** | TB-020, TB-020a (component mapping, test dependencies) | Store which tests cover which components; semantic search for fuzzy matching |
| **A5 Ranking Algorithm** | LangGraph agent (risk-based prioritization) | P0/P1 tests first, then coverage-based, then cost optimization |
| **Cost Model** | Test execution time tracking, CI time optimizer | Minimize total run time, not just test count |
| **CI Workflow Generation** | GitHub Actions / GitLab CI matrix job creation | Dynamically generate test matrix from A5 output (4 parallel workers, 10 tests/worker) |
| **PR Comment + Feedback** | Post selected tests + rationale to PR | Show which tests selected, why, estimated time savings |
| **Override Command** | `/qa run all` comment command | Dev can force full-suite run if A5 subset seems insufficient |
| **Missed-Failure Detection** | Nightly full-suite → compare with PR subset → feedback loop | Identify false negatives, retrain A5 model weekly |
| **Dashboards** | Weekly A5 accuracy report, CI time saved, missed-failure trend | Analytics + observability |
| **Integration with M13/M15** | A3 suites flagged by risk, A5 prioritizes them; A8 (M15) risk matrix informs A5 | Cross-milestone data flow |

### OUT OF SCOPE (Deferred to M15/M16)

| Feature | Why | Target Milestone |
|---------|-----|---|
| **Machine Learning Reranking** | Requires historical failure patterns (nightly validation not mature until week 3); defer to M15 advanced | M15 (A8 Full) integrates with A5 |
| **Test Flakiness Weighting** | A7 self-heal reduces flakiness; can integrate in M15 when stable | M15 |
| **Performance Regression Detection** | Requires perf baselines + trend analysis (out of scope) | M16+ |
| **Custom CI Platform Integration** | Jenkins, CircleCI, etc. (v1: GitHub + GitLab only) | M16+ |

---

## 5. TECH STACK (M14 SLICE)

| Component | Version | Purpose | Status (M14 Start) | Notes |
|-----------|---------|---------|---|---|
| **Git / GitPython** | ^3.1.0 | Diff parsing, file change analysis | New (M14) | Parse PR diffs, extract file paths, map to components |
| **LangGraph** | ^0.1.0 | A5 agent orchestration (change analysis → ranking) | Inherited (M1) | Branching graphs for impact analysis |
| **Ollama + Gemma 4** | Latest | LLM for component impact analysis (contextual ranking) | Inherited (M1) | Assist in identifying affected components from diff context |
| **pgvector** | ^0.7.0 | Vector similarity search (test → component mapping) | Inherited (M1) | HNSW index for fast test lookup by component |
| **PostgreSQL** | 15 | Test metadata index (TB-020, TB-020a) | Inherited (M0) | Component mapping, test dependencies |
| **Hatchet** | Latest | Job queue for full-suite nightly validation | Inherited (M1) | Async job for missed-failure detection |
| **GitHub Actions / GitLab CI** | Latest | Webhook receivers, matrix job generation | Inherited (M5) + Extended | New A5 integration layer |
| **FastAPI** | ^0.104 | A5 endpoint implementation | Inherited (M1) | EP-068 (A5 select tests), EP-069 (override), EP-070 (feedback) |
| **NestJS** | ^10 | Backend API Gateway (webhook receiver) | Inherited (M0) | New endpoints for CI integration |
| **Langfuse** | ^3.0.0 | LLM trace logging (A5 ranking decisions) | Inherited (M1) | Dashboard shows per-PR selection rationale, cost |
| **SigNoz** | Latest | APM + latency monitoring | Inherited (M0) | Tracks CI time reduction, A5 selection latency |
| **Redis** | 7 | Cache (test metadata, component mappings) | Inherited (M0) | Cache hot paths (frequently modified files) |

---

## 6. DEFINITION OF READY (DoR)

**M14 Cannot Start Until All These Are TRUE:**

- [ ] **M13 Exit Criteria Met:** ≥100 automation suites authored, A3 <5s export latency, ≥50 templates seeded
- [ ] **Test Metadata Schema Ready:** TB-020 (component_mapping), TB-020a (test_dependencies) DDL reviewed, migrations tested on staging
- [ ] **A3 Test Suite + Metadata Complete:** All ≥100 suites have component_tags + priority + affected_modules + execution_time_baseline
- [ ] **PR History Available:** Last 50 PRs with git diffs + full-suite test results (pass/fail per test, execution time)
- [ ] **CI Baselines Captured:** p50/p95 execution time per test documented; full-suite 40 min baseline confirmed
- [ ] **Component Mapping Codebase Ready:** Code analysis to map files → components (manual mapping for seed set + automated for new code)
- [ ] **GitHub Actions + GitLab CI Tested:** Webhook receiver tested, matrix job generation dummy-tested
- [ ] **A5 Prompt Library Drafted:** System prompt (change analysis), ranking prompt (prioritize by risk), tested on 10-PR sample
- [ ] **Ollama Online:** Health check passing, Gemma 4 model loaded, latency <2s per 100 tokens
- [ ] **pgvector Index Live:** Test metadata + component descriptions embedded + indexed (BGE-large-en), HNSW created
- [ ] **LangGraph Pattern Proven:** Change analysis + ranking pipeline tested end-to-end on sample PR
- [ ] **Staging Data Fresh:** M13 baseline + 100 suites + 50 PR diffs copied to staging; ready for M14 testing
- [ ] **Team Trained:** DevOps, Backend leads familiar with LangGraph multi-node patterns, CI/CD webhook patterns

---

## 7. MILESTONE ENTRY CRITERIA

Before sprint kickoff, verify:

1. **Jira Project Ready:** QANESUS-M14 epic; stories: Diff Parser, Metadata Index, A5 Agent, CI Integration, Dashboards, Testing
2. **Figma Handoff:** PR comment design approved (selected tests layout, time savings callout, override button)
3. **OpenAPI Spec:** EP-068 (A5 select tests), EP-069 (override), EP-070 (feedback) paths/methods/schemas drafted
4. **Database Schema:** TB-020/020a DDL reviewed, migration M025-M026 tested on staging
5. **A5 Prompt Library:** System prompt (change analysis from code diff), ranking prompt (prioritize by risk), tested on sample
6. **Test Data:** 50 PR diffs with known test results available (for validation set)
7. **Feature Flag:** feature_ai_a5_test_selection in Unleash (default OFF); rollout strategy documented
8. **GitHub/GitLab Setup:** Webhook receivers deployed (staging + prod), matrix job templates drafted

---

## 8. TASK BREAKDOWN (7 PHASES)

### PHASE A: Change Detection + Component Mapping (Days 1–4) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T001 | Design diff parser (parse git diff → extract file paths → component mapping logic) | Backend Lead | P0 | 8 | — | US-028 | M14-AC001 |
| M14-T002 | Implement diff parser (parse PR diff, extract file paths, handle renames/deletes, validate) | Backend | P0 | 12 | M14-T001 | — | M14-AC002 |
| M14-T003 | Design component mapping strategy (codebase structure → file → component; seed set manual, new files automated) | AI Eng | P0 | 8 | — | — | M14-AC003 |
| M14-T004 | Build component mapper (file path → component name; regex patterns + semantic matching) | Backend | P0 | 14 | M14-T003 | — | M14-AC004 |
| M14-T005 | Create seed component mapping (map 100 test suites + codebase files to components; document mapping rules) | QA | P0 | 16 | M14-T004 | — | M14-AC005 |
| M14-T006 | Implement EP-068 GET /api/agents/a5/component-impact (input: PR diff, output: affected_components + impact scores) | Backend | P0 | 12 | M14-T002, M14-T004 | — | M14-AC006 |
| M14-T007 | Test diff parser accuracy (50 PR diffs, verify extracted files + components match manual audit) | QA | P1 | 12 | M14-T002, M14-T005 | — | M14-AC007 |

**Phase A Total:** ~82 hours | **Critical Path:** M14-T001 (design) → M14-T002 (diff parser) → M14-T004 (component mapper)

---

### PHASE B: Test Metadata Indexing (Days 5–7) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T008 | Design TB-020 component_mapping schema (test_id, component_name, coverage_type primary\|secondary, confidence, created_by) | Backend Lead | P0 | 6 | — | — | M14-AC008 |
| M14-T009 | Design TB-020a test_dependencies schema (test_id, depends_on_test_id, dependency_type sequential\|data\|environment) | Backend | P0 | 6 | — | — | M14-AC009 |
| M14-T010 | Write migrations M025-M026 (create 2 tables, indexes, foreign keys, seed initial component mappings) | Backend | P0 | 10 | M14-T008–T009 | — | M14-AC010 |
| M14-T011 | Implement test metadata search API (EP-071 GET /api/tests/by-component?component_name=Payments, return test_ids + coverage) | Backend | P0 | 10 | M14-T008–T010 | — | M14-AC011 |
| M14-T012 | Build pgvector embeddings for components + tests (BGE embeddings for component names, test names, descriptions) | AI Eng | P0 | 12 | — | — | M14-AC012 |
| M14-T013 | Index embeddings in pgvector (create HNSW index, test semantic search: "payment flow" → find Payments component tests) | Backend | P0 | 10 | M14-T012 | — | M14-AC013 |
| M14-T014 | Test metadata accuracy (100 test suites tagged with components, validate coverage mapping against code analysis) | QA | P1 | 10 | M14-T010–T013 | — | M14-AC014 |

**Phase B Total:** ~64 hours | **Critical Path:** M14-T008 (schema) → M14-T010 (migrations) → M14-T013 (index)

---

### PHASE C: A5 Ranking Algorithm (Days 8–11) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T015 | Draft A5 system prompt (change analysis → affected components → test impact scoring) | AI Eng | P0 | 8 | — | US-029 | M14-AC015 |
| M14-T016 | Build LangGraph node: ChangeAnalyzer (parse PR diff, extract affected components with confidence scores) | AI Eng | P0 | 12 | M14-T001–T002, M14-T015 | — | M14-AC016 |
| M14-T017 | Build LangGraph node: TestLookup (query TB-020 + pgvector: find tests covering affected components) | Backend | P0 | 10 | M14-T011–T013, M14-T016 | — | M14-AC017 |
| M14-T018 | Build LangGraph node: RiskRanker (rank tests by: P0/P1/P2 priority, component coverage, dependency chains, execution cost) | AI Eng | P0 | 14 | M14-T017 | — | M14-AC018 |
| M14-T019 | Build LangGraph node: CostOptimizer (min-cost test subset covering ≥80% component impact; estimate CI time savings) | Backend | P0 | 12 | M14-T018 | — | M14-AC019 |
| M14-T020 | Implement FastAPI endpoint EP-068 POST /api/agents/a5/select-tests (async via Hatchet, input: PR_diff/target_branch, return job_id) | Backend | P0 | 14 | M14-T015–T019 | — | M14-AC020 |
| M14-T021 | Test A5 on 20-PR validation set (manual audit: selected tests vs. actual test failures in full suite) | AI Eng | P0 | 16 | M14-T020 | — | M14-AC021 |
| M14-T022 | Tune A5 ranking weights based on test results (adjust priority weights, coverage thresholds, cost model) | AI Eng | P0 | 12 | M14-T021 | — | M14-AC022 |
| M14-T023 | Implement Langfuse logging for A5 (trace: input diff, component analysis, ranking decisions, selected tests, time savings) | Backend | P1 | 8 | M14-T020 | — | M14-AC023 |

**Phase C Total:** ~106 hours | **Critical Path:** M14-T015 (prompt) → M14-T016 (analyzer) → M14-T018 (ranker) → M14-T020 (endpoint)

---

### PHASE D: CI Integration (GitHub Actions + GitLab CI) (Days 12–14) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T024 | Design GitHub Actions workflow integration (trigger on PR open/push, call A5 endpoint, generate matrix, run tests, report) | DevOps Lead | P0 | 8 | — | US-030 | M14-AC024 |
| M14-T025 | Implement GitHub Actions workflow (yaml template for matrix job generation, 4 parallel workers, 10 tests/worker) | DevOps | P0 | 14 | M14-T020, M14-T024 | — | M14-AC025 |
| M14-T026 | Implement GitLab CI integration (yaml template, parallel runners, same matrix generation logic) | DevOps | P0 | 14 | M14-T020, M14-T024 | — | M14-AC026 |
| M14-T027 | Implement PR comment poster (NestJS endpoint receives A5 result → posts comment with selected tests + estimated time + /qa run all button) | Backend | P0 | 12 | M14-T020 | — | M14-AC027 |
| M14-T028 | Implement `/qa run all` override command (webhook receiver, re-trigger full-suite CI if dev comments `/qa run all`) | Backend | P0 | 10 | M14-T027 | — | M14-AC028 |
| M14-T029 | Test CI integration on staging repos (create fake PR, verify A5 endpoint called, matrix generated, comment posted) | QA | P1 | 12 | M14-T025–T028 | — | M14-AC029 |

**Phase D Total:** ~70 hours | **Critical Path:** M14-T024 (design) → M14-T025 (GitHub) → M14-T026 (GitLab) → M14-T027 (comment)

---

### PHASE E: Missed-Failure Detection + Feedback Loop (Days 15–17) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T030 | Design missed-failure detection logic (nightly: run full suite, compare with PR subset results, identify FN tests) | AI Eng | P0 | 8 | — | — | M14-AC030 |
| M14-T031 | Implement nightly validation job (Hatchet cron: run full suite, store results in TB-020b new table, compare with PR subsets) | Backend | P0 | 14 | M14-T030, M14-T010 | — | M14-AC031 |
| M14-T032 | Implement feedback loop (missed FN tests → update test_dependencies + component_mapping confidence scores; retrain) | Backend | P0 | 12 | M14-T031 | — | M14-AC032 |
| M14-T033 | Create TB-020b validation_history table (store nightly full-suite results, FN detection, A5 ranking drift) | Backend | P0 | 6 | — | — | M14-AC033 |
| M14-T034 | Test feedback loop on 2-week historical data (replay 10 PRs, verify FN detection + retraining improves accuracy) | QA | P1 | 12 | M14-T031–T032 | — | M14-AC034 |

**Phase E Total:** ~52 hours | **Critical Path:** M14-T030 (design) → M14-T031 (job) → M14-T032 (feedback)

---

### PHASE F: Dashboards + Monitoring (Days 18–19) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T035 | Design A5 dashboards (selection accuracy, CI time saved, missed-failure rate, override rate per repo) | Backend Lead | P0 | 8 | — | US-031 | M14-AC035 |
| M14-T036 | Implement weekly A5 accuracy report API (GET /api/reports/a5-accuracy?start_date=...&end_date=...) | Backend | P0 | 12 | M14-T032, M14-T035 | — | M14-AC036 |
| M14-T037 | Implement SigNoz dashboard: A5 latency, CI time reduction, selection accuracy trend | DevOps | P0 | 10 | M14-T035, M14-T036 | — | M14-AC037 |
| M14-T038 | Implement Langfuse dashboard: A5 ranking decisions, cost per PR, model confidence distribution | AI Eng | P0 | 8 | M14-T023 | — | M14-AC038 |
| M14-T039 | Test dashboards on 2-week historical data (verify metrics accurately reflect selection quality) | QA | P1 | 8 | M14-T036–T038 | — | M14-AC039 |

**Phase F Total:** ~46 hours | **Critical Path:** M14-T035 (design) → M14-T036 (API) → M14-T037 (SigNoz)

---

### PHASE G: Integration with M13/M15 + Polish (Days 20–21) [PM3]

| M14-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M14-T040 | Design A3 ↔ A5 integration (A3-authored tests flagged by risk score; A5 prioritizes them in PR subset) | AI Eng | P0 | 6 | M14-T018 | — | M14-AC040 |
| M14-T041 | Implement A3 confidence integration with A5 ranking (high-confidence A3 tests ranked higher) | Backend | P0 | 10 | M14-T018, M14-T040 | — | M14-AC041 |
| M14-T042 | Design A5 ↔ A8 (M15) data flow (A8 risk matrix inputs A5 ranking; A5 selection feeds A8 coverage analysis) | Product | P1 | 6 | M14-T018 | — | M14-AC042 |
| M14-T043 | Feature flag integration (gate A5 behind feature_ai_a5_test_selection; rollout strategy dark → canary → GA) | Backend | P0 | 8 | — | — | M14-AC043 |
| M14-T044 | Bug fixes, performance tuning, latency optimization (A5 selection <10s p95) | Full Team | P1 | 12 | All phases | — | M14-AC044 |
| M14-T045 | Final E2E tests + demo script (3-minute showcase: create PR with code change → A5 selects tests → matrix runs → 60% time savings demo) | QA + Backend | P0 | 10 | All phases | — | M14-AC045 |

**Phase G Total:** ~52 hours | **Critical Path:** M14-T040 (design) → M14-T041 (integration)

---

**Grand Total: ~55 tasks, ~850 hours (~510 story points after 20% velocity buffer)**

---

## 9. WEEK-WISE BREAKDOWN

**Week 1 (Feb 02–08, 2027):** Phases A + B
- Days 1–4: Diff parser, component mapper, component-impact endpoint (Phase A)
- Days 5–7: Metadata schema, pgvector index, test lookup (Phase B)
- **Deliverable:** Change detection accurate (≥99%), test metadata indexed, semantic search working on staging

**Week 2 (Feb 09–15, 2027):** Phases C + D
- Days 8–11: A5 ranking algorithm, LangGraph pipeline, endpoint live (Phase C)
- Days 12–14: GitHub Actions + GitLab CI integration, PR comment poster, `/qa run all` override (Phase D)
- **Deliverable:** A5 selection ≥80% accurate on 20-PR validation set, CI workflows triggering, PR comments posting

**Week 3 (Feb 16–20, 2027):** Phases E + F + G
- Days 15–17: Missed-failure detection, feedback loop, retraining (Phase E)
- Days 18–19: SigNoz + Langfuse dashboards, weekly accuracy report (Phase F)
- Days 20–21: A3/A5 integration, A5/A8 data flow design, final polish, demo (Phase G)
- **Deliverable:** Missed-failure rate <5%, dashboards live, 60% CI time savings demo (40 min → 16 min), feature flag ready for rollout

---

## 10. ACCEPTANCE CRITERIA (45+ ACs)

### Change Detection

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| M14-AC001 | Diff parser design complete | Design doc reviewed | Review parser spec | Parser pseudocode, error handling, performance targets documented | P0 |
| M14-AC002 | Diff parser accurate | 50 PR diffs parsed | Extract file paths, component names | ≥99% accuracy vs. manual audit, handles renames/deletes/modifications | P0 |
| M14-AC003 | Component mapping strategy defined | Codebase analyzed | Map files → components | Seed set (100 files → 10 components) documented, rules for new files clear | P0 |
| M14-AC004 | Component mapper working | 100 test suites + codebase files | Call component mapper | Correct component names extracted for ≥95% of files | P0 |
| M14-AC005 | Component mapping seeded | 100 suites + codebase files analyzed | Create seed component_mapping table | ≥100 test-component mappings, coverage_type + confidence stored | P0 |
| M14-AC006 | EP-068 component-impact endpoint working | PR diff sent to endpoint | POST /api/agents/a5/component-impact {diff} | Returns 200, affected_components array with impact scores (0–1) | P0 |
| M14-AC007 | Diff parser latency <1s | 50 PR diffs parsed in sequence | Measure parse + mapper latency | p95 <1s, p99 <2s (per diff) | P1 |

### Test Metadata Indexing

| M14-AC008 | Component mapping schema complete | Migrations M025-M026 applied | SELECT * FROM component_mapping | Table exists with (test_id, component_name, coverage_type, confidence, created_by), foreign keys, indexes on (test_id, component_name) | P0 |
| M14-AC009 | Test dependencies schema complete | TB-020a created | SELECT * FROM test_dependencies | Table exists with (test_id, depends_on_test_id, dependency_type), foreign keys, UNIQUE constraint on (test_id, depends_on_test_id) | P0 |
| M14-AC010 | Migrations applied cleanly | M025-M026 run on staging → prod | Rollback tested, no data loss | Both migrations pass, rollback succeeds, zero downtime | P0 |
| M14-AC011 | EP-071 test-by-component search working | Query sent for "Payments" component | GET /api/tests/by-component?component_name=Payments | Returns 200, test_ids array, coverage %, execution_time_avg | P0 |
| M14-AC012 | Component + test embeddings generated | BGE embeddings called for 100 components + 500 tests | Embeddings created | 768-dim vectors stored, no embedding errors, latency <100ms per call | P0 |
| M14-AC013 | pgvector HNSW index live | Embeddings indexed in pgvector | Query by component name ("payment flow") | Semantic search returns relevant test IDs in <500ms | P0 |
| M14-AC014 | Metadata accuracy validated | 100 suites tagged + code analyzed | Verify component mappings | ≥95% accuracy vs. manual code review (10-suite audit sample) | P0 |

### A5 Ranking Algorithm

| M14-AC015 | A5 system prompt drafted | Prompt reviewed | Review A5_system_prompt.md | Change analysis instructions, ranking examples, constraints documented | P0 |
| M14-AC016 | A5 ChangeAnalyzer node working | LangGraph executed on PR diff | Node outputs affected_components with scores | Components extracted from diff, confidence scores assigned, no parse errors | P0 |
| M14-AC017 | A5 TestLookup node working | Affected components input | Node queries TB-020 + pgvector | Tests covering components returned, sorted by coverage %, <500ms latency | P0 |
| M14-AC018 | A5 RiskRanker node working | Tests list input | Node ranks by P0/P1/priority + coverage + cost | Top-N tests ranked, rationale per ranking factor provided, confidence score assigned | P0 |
| M14-AC019 | A5 CostOptimizer node working | Ranked tests input | Node selects min-cost subset covering ≥80% impact | Subset returned, estimated CI time savings calculated, no infeasible subsets | P0 |
| M14-AC020 | EP-068 async selection working | PR diff + framework sent | POST /api/agents/a5/select-tests {diff} | Returns 202, job_id; Hatchet queues job; progress streamable via WebSocket/SSE | P0 |
| M14-AC021 | A5 accuracy ≥80% on validation set | 20-PR validation set | Manual audit: selected tests vs. actual failures | ≥80% of selected tests match true failures (when code actually changes); <5% FN rate | P0 |
| M14-AC022 | A5 ranking weights tuned | Test results reviewed, weights adjusted | Accuracy re-measured on 10 new PRs | Accuracy ≥82% after tuning (improvement over baseline) | P0 |
| M14-AC023 | Langfuse logging for A5 | A5 selection completed | View Langfuse dashboard | Every call logged (diff analysis, ranking decisions, selected tests, time savings estimate, cost) | P1 |

### CI Integration

| M14-AC024 | GitHub Actions workflow designed | Design doc reviewed | Review workflow spec | Trigger logic, matrix generation, test execution, reporting documented | P0 |
| M14-AC025 | GitHub Actions workflow live | Workflow deployed to staging repo | Trigger PR open/push | Workflow executes, A5 endpoint called, matrix generated, tests run in parallel (4 workers) | P0 |
| M14-AC026 | GitLab CI integration live | CI template deployed | Trigger on MR create/push | Template applies, A5 endpoint called, parallel runners spawn, tests execute | P0 |
| M14-AC027 | PR comment poster working | A5 selection complete | Comment posted to PR | Comment shows selected tests (count), time savings estimate, `/qa run all` button | P0 |
| M14-AC028 | `/qa run all` override working | Dev comments `/qa run all` | Webhook received, full-suite CI triggered | Full suite re-queued, override logged in audit trail | P0 |
| M14-AC029 | CI integration tested on staging | Fake PR created on staging repo | All workflows execute end-to-end | A5 called, matrix generated, tests run, results reported, comment posted | P1 |

### Missed-Failure Detection

| M14-AC030 | Missed-failure detection logic designed | Design doc reviewed | Review detection spec | Nightly full-suite → compare with PR subset → identify FN tests, retrain logic documented | P0 |
| M14-AC031 | Nightly validation job live | Hatchet cron job deployed | Job runs at 2 AM daily | Full suite executes, results stored in TB-020b, comparison logic runs, FN tests identified | P0 |
| M14-AC032 | Feedback loop retraining working | FN tests detected | Retraining logic applies | test_dependencies + component_mapping confidence scores updated based on FN patterns | P0 |
| M14-AC033 | TB-020b validation_history schema | Migrations applied | SELECT * FROM validation_history | Table stores nightly results (full_suite_results JSON, fn_tests, ranking_changes, created_at) | P0 |
| M14-AC034 | Feedback loop validated on historical data | 10 PRs replayed with feedback loop | Accuracy measured after loop iterations | Accuracy improves from 80% → 85%+ (measured on 5 new PRs after retraining) | P1 |

### Dashboards + Monitoring

| M14-AC035 | A5 dashboards designed | Figma mockup approved | Review dashboard layouts | Selection accuracy chart, CI time saved chart, missed-failure rate, override rate per repo | P0 |
| M14-AC036 | Weekly accuracy report API working | Report endpoint called | GET /api/reports/a5-accuracy?start_date=...&end_date=... | Returns 200, JSON: selection_accuracy %, fn_rate %, time_saved_minutes, override_count | P0 |
| M14-AC037 | SigNoz dashboard live | Metrics populated | View SigNoz dashboard | A5 latency (p50/p95/p99), CI time reduction, test selection volume, error rates displayed | P0 |
| M14-AC038 | Langfuse dashboard live | LLM calls traced | View Langfuse dashboard | A5 ranking decisions traced, cost per PR, confidence distribution, model hallucination flags | P0 |
| M14-AC039 | Dashboards accuracy validated | 2-week historical data replayed | Verify metrics | Dashboards show correct totals, trends, no data anomalies | P1 |

### Integration + Polish

| M14-AC040 | A3 ↔ A5 integration designed | Design doc reviewed | Review data flow spec | A3-authored tests flagged by risk, A5 prioritizes them, confidence scores propagate | P0 |
| M14-AC041 | A3 confidence integrated with A5 | Tests ranked with A3 scores | High-confidence A3 tests ranked higher | A3-generated tests appear in top-N selected (all else equal) | P0 |
| M14-AC042 | A5 ↔ A8 data flow designed | Design doc for M15 planning | Review A8 integration spec | Risk matrix from A8 (M15) inputs A5 ranking; A5 selection feeds A8 coverage | P1 |
| M14-AC043 | Feature flag integrated | feature_ai_a5_test_selection in Unleash | Flag default OFF, rollout documented | Dark → canary → GA progression ready for week 3 | P0 |
| M14-AC044 | A5 selection latency <10s p95 | 50 concurrent selection requests | Measure latency distribution | p95 <10s, p99 <15s, no timeout errors | P1 |
| M14-AC045 | E2E demo test passing | Full user journey test | Create PR → A5 select → run matrix → 60% time savings verify | All steps pass, time savings quantified (40 min → 16 min), demo recording ready | P0 |

---

## 11. API CONTRACTS (M14 SCOPE)

### EP-068: A5 Test Selection

**POST /api/agents/a5/select-tests**
```json
REQUEST:
POST /api/agents/a5/select-tests
{
  "pr_id": "12345",
  "source_branch": "feature/payment-checkout",
  "target_branch": "main",
  "diff": "<full git diff>",
  "all_test_ids": ["test_001", "test_002", ..., "test_500"]
}

RESPONSE (202):
{
  "job_id": "job_xyz789",
  "status": "processing",
  "estimated_time_sec": 8
}

(Stream result via WebSocket/SSE: GET /api/agents/a5/select-tests/job_xyz789/stream)
FINAL MESSAGE:
{
  "status": "complete",
  "selected_test_ids": [
    "test_101", "test_102", "test_103", ..., "test_125"
  ],
  "selected_count": 25,
  "total_count": 500,
  "coverage_pct": 87,
  "affected_components": [
    {"name": "Payments", "impact_score": 0.95, "affected_files": ["src/payments/checkout.ts"]},
    {"name": "Auth", "impact_score": 0.42, "affected_files": ["src/auth/session.ts"]}
  ],
  "ranking_rationale": "Payments (P0 priority, 8 tests) ranked first; Auth (P1 priority, 5 tests) second",
  "estimated_ci_time_minutes": 16,
  "full_suite_time_minutes": 40,
  "time_saved_minutes": 24,
  "time_saved_pct": 60,
  "confidence": 0.85,
  "test_matrix": [
    {
      "worker_id": 1,
      "test_ids": ["test_101", "test_102", ..., "test_107"],
      "estimated_time_minutes": 4
    },
    {
      "worker_id": 2,
      "test_ids": ["test_108", ..., "test_114"],
      "estimated_time_minutes": 4
    }
  ]
}
```

### EP-069: Override (`/qa run all`)

**POST /api/ci/override-to-full-suite**
```json
REQUEST:
POST /api/ci/override-to-full-suite
{
  "pr_id": "12345",
  "source_branch": "feature/payment-checkout",
  "override_reason": "Custom logic; run full suite",
  "override_user_id": "user_456"
}

RESPONSE (202):
{
  "status": "override_accepted",
  "full_suite_job_id": "job_full_999",
  "estimated_time_minutes": 40,
  "note": "Full suite queued; A5 subset cancelled"
}
```

### EP-070: Feedback / Validation Result

**POST /api/agents/a5/validation-feedback**
```json
REQUEST:
POST /api/agents/a5/validation-feedback
{
  "pr_id": "12345",
  "a5_selected_test_ids": ["test_101", ..., "test_125"],
  "full_suite_results": {
    "passed_tests": ["test_001", "test_002", ..., "test_500"],
    "failed_tests": ["test_150", "test_201"]
  },
  "false_negative_test_ids": ["test_150", "test_201"],  // A5 skipped but should have run
  "false_positive_test_ids": []
}

RESPONSE (201):
{
  "feedback_id": "feedback_abc123",
  "accuracy_before": 0.85,
  "accuracy_after": 0.87,  // After retraining
  "fn_rate": 0.04,
  "note": "2 FN tests detected; component dependencies updated for next PR"
}
```

---

## 12. DATABASE CHANGES (M14 SCOPE)

### New Tables

**TB-020: component_mapping**
```sql
CREATE TABLE component_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES automation_suites(id),
  component_name VARCHAR(255) NOT NULL,
  coverage_type TEXT CHECK (coverage_type IN ('primary', 'secondary')),
  confidence DECIMAL(3,2) DEFAULT 0.80,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (test_id, component_name),
  INDEX idx_component (component_name),
  INDEX idx_test (test_id)
);
```

**TB-020a: test_dependencies**
```sql
CREATE TABLE test_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES automation_suites(id),
  depends_on_test_id UUID NOT NULL REFERENCES automation_suites(id),
  dependency_type TEXT CHECK (dependency_type IN ('sequential', 'data', 'environment')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (test_id, depends_on_test_id),
  INDEX idx_test (test_id),
  INDEX idx_depends (depends_on_test_id)
);
```

**TB-020b: validation_history**
```sql
CREATE TABLE validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id VARCHAR(255),
  a5_selected_test_ids UUID[],
  full_suite_results JSONB,
  false_negative_tests UUID[],
  false_positive_tests UUID[],
  accuracy_before DECIMAL(3,2),
  accuracy_after DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_created (created_at DESC)
);
```

### Schema Migrations

**M025:** Create component_mapping table + indexes
**M026:** Create test_dependencies table + indexes
**M027:** Create validation_history table + audit trail

---

## 13. AI AGENT SPEC (A5)

### A5 Test Selection Agent

**Purpose:** Parse PR code diffs → identify affected components → rank tests by impact (P0/P1 first) + coverage + cost → output optimized test subset with ≥80% accuracy and 60% CI time savings.

**Input Pipeline:**
1. GitHub/GitLab webhook → PR push event
2. Extract PR diff + branch info
3. Call A5 endpoint with diff + all test IDs
4. LangGraph orchestrator processes

**LangGraph Graph:**
```
START (PR diff)
  ↓
[ChangeAnalyzer] — Parse diff → extract affected components
  ↓
[TestLookup] — Query TB-020: find tests covering components
  ↓
[RiskRanker] — Rank by P0/P1/priority + coverage + dependencies
  ↓
[CostOptimizer] — Select min-cost subset covering ≥80% impact
  ↓
[ConfidenceScorer] — Assign confidence (0–1) to selection
  ↓
END (return selected test IDs + rationale + time savings)
```

**Nodes:**

| Node | Input | Process | Output |
|------|-------|---------|--------|
| **ChangeAnalyzer** | PR diff | Parse diff → extract file paths → map files → components via component_mapper + Ollama contextual analysis | affected_components: [{name, impact_score (0–1), affected_files}] |
| **TestLookup** | affected_components | Query TB-020 for each component; pgvector semantic search for fuzzy matches | test_ids: [test_001, test_002, ...], coverage_pct per component |
| **RiskRanker** | test_ids + component_coverage | Sort tests by: priority (P0 > P1 > P2) > component coverage > dependency chains > execution_cost | ranked_tests: [{test_id, priority, coverage, cost, ranking_score}] |
| **CostOptimizer** | ranked_tests | Select minimum-cost subset covering ≥80% of component impact; estimate CI time (sum of test execution times) | selected_test_ids, estimated_ci_time_minutes, time_saved_minutes, time_saved_pct |
| **ConfidenceScorer** | selected_test_ids + ranked_tests | Score: 1.0 if all P0 selected, -0.05 per P2 skipped, -0.1 per skipped P1 | confidence: 0–1, explanation: string |

**Node Implementations (FastAPI):**

```python
@router.post("/api/agents/a5/select-tests")
async def a5_select_tests(request: A5SelectRequest):
    job_id = await queue_hatchet_job("a5_select_tests", request)
    return {"job_id": job_id, "status": "queued"}

async def a5_langgraph_workflow(pr_diff: str, all_test_ids: List[str]):
    # Node 1: ChangeAnalyzer
    affected_components = parse_diff_to_components(pr_diff)
    
    # Node 2: TestLookup
    tests_by_component = await query_component_mapping(affected_components)
    
    # Node 3: RiskRanker
    ranked = rank_tests_by_risk(tests_by_component, priority_weights={...})
    
    # Node 4: CostOptimizer
    selected = optimize_cost_subset(ranked, min_coverage=0.80)
    
    # Node 5: ConfidenceScorer
    confidence = score_selection_confidence(selected, ranked)
    
    return {
        "selected_test_ids": selected.test_ids,
        "confidence": confidence,
        "time_saved_minutes": selected.time_saved,
        "affected_components": affected_components
    }
```

---

## 14. TESTING STRATEGY

### Unit Tests (Tier 1)
- Diff parser (50 git diffs, verify extracted files + components)
- Component mapper (100 files, verify component names)
- Risk ranker (100 tests, verify ranking order by priority + coverage)
- Cost optimizer (subset selection, verify ≥80% coverage + min cost)
- Confidence scorer (various scenarios, verify score calculation)

### Integration Tests (Tier 2)
- A5 LangGraph workflow end-to-end (diff → selected tests)
- TB-020 queries (component lookup, pgvector semantic search)
- GitHub Actions / GitLab CI workflow generation (matrix output format)
- PR comment posting (webhook receiver → comment formatted correctly)
- Missed-failure detection nightly job (full-suite → FN detection)

### E2E Tests (Tier 3)
- Full workflow: Create PR with code change → A5 selects tests → matrix runs 4 workers in parallel → tests pass → 60% time savings verified
- Override test: `/qa run all` comment triggers full-suite re-run
- Historical validation: Replay 10 past PRs with A5, verify ≥80% accuracy
- Missed-failure feedback: Nightly run identifies FN tests, retrain improves accuracy

### Performance Tests
- A5 selection latency: p95 <10s (50 concurrent requests)
- Diff parsing: <1s per 500-line diff
- Component lookup: <500ms for 100+ tests per component
- pgvector semantic search: <200ms for 1000 embeddings

### Test Data
- 50 historical PRs with diffs + full-suite test results
- 100 seed tests + component mappings
- 10-component taxonomy (Auth, Payments, Users, Products, Orders, Shipping, Support, Analytics, Admin, Settings)

---

## 15. FEATURE FLAG STRATEGY

**Flag Name:** `feature_ai_a5_test_selection`

**Rollout:**
1. **Dark Launch (Days 1–5):** Disabled for all; internal testing (Iksula CI)
2. **Internal Canary (Days 6–12):** Enable for 1 pilot project; monitor accuracy, latency, FN rate
3. **Canary 50% (Days 13–17):** Enable for 50% of active repos by random sampling
4. **GA (Days 18–21):** Enable for 100% of repos

**Kill Switch:** `unleash disable feature_ai_a5_test_selection` (all PRs revert to full-suite CI)

**Monitoring:**
- SigNoz dashboard: A5 latency (p50/p95/p99), CI time reduction (target 60%), selection accuracy trend
- GlitchTip: A5 endpoint errors, diff parser failures, component mapping misses
- Langfuse: Cost per selection, ranking decisions, confidence distribution

**Rollback Criteria:**
- Missed-failure rate >5% for >6 hours
- Selection accuracy <70% for >6 hours
- A5 endpoint latency p95 >15s
- False-negative rate spike (>10%) on nightly validation
- >10 user-reported issues within 24h (unrelated to flag state)

---

## 16. RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| A5 diff parser misses affected components | Tests not selected; failures in prod; developer trust lost | Medium | Test parser on 50-PR sample, handle edge cases (renames, deletes), manual audits weekly |
| Component mapping incomplete (new files not tagged) | A5 can't find relevant tests; FN rate high | Medium | Seed set 100+ mappings, use Ollama to auto-tag new files, validation loop retrains |
| A5 ranking weights miscalibrated (wrong priority) | Non-critical tests selected, critical tests skipped | Medium | Weekly weight tuning based on FN/FP data, manual audit on 5 PRs per week |
| CI matrix job generation fails | Tests never run; PR stuck pending; dev friction | Low | Test workflow on staging, timeout handlers, fallback to full-suite on gen failure |
| PostgreSQL component_mapping query slow (100+ components) | A5 latency >15s; dev waits too long | Low | Index on component_name, cache hot components in Redis, batch queries |
| Nightly full-suite validation fails | No feedback loop; A5 ranking doesn't improve | Low | Hatchet job retry logic (3x), alert on nightly failure, manual FN detection fallback |
| Test execution time baseline stale | Cost optimizer selects slow tests; CI time not 60% saved | Medium | Update execution time baseline every 2 weeks, monitor for outliers (new slow tests) |

---

## 17. ROLLBACK PLAN

**Condition:** If FN rate >5% OR selection accuracy <70% OR latency >15s p95 for 2+ hours

**Steps:**
1. **Immediate:** Kill-switch flag `feature_ai_a5_test_selection` (all PRs revert to full-suite CI)
2. **Comms:** Post incident to #qa-nexus Slack; notify team
3. **Diagnosis:** Check Langfuse traces (ranking logic) + SigNoz metrics (latency/accuracy) + GitHub Actions logs
4. **Fix:** If data issue, retrain A5 ranking weights; if bug, revert code to last stable M13 baseline
5. **Testing:** Re-enable flag at 10% canary; monitor for 30 min before wider rollout
6. **Post-Mortem:** Within 1 day, document root cause + fix

**Fallback for Users:**
- A5 selection disabled → all PRs use full-suite CI (normal behavior)
- Manual override `/qa run all` still works (no impact)
- Dashboard metrics show rollback event + time

---

## 18. OBSERVABILITY & MONITORING

### SigNoz Dashboards (M14)

**Dashboard 1: A5 Selection Performance**
- Selection latency (p50/p95/p99) per PR
- Diff parser latency
- Component lookup latency
- Selected test count distribution

**Dashboard 2: CI Time Reduction**
- Baseline full-suite time vs. A5-selected time (side-by-side)
- Time saved per PR (minutes, %)
- Time saved trend over 2 weeks

**Dashboard 3: A5 Accuracy**
- Selection accuracy % (vs. manual audit)
- False-negative rate (% of skipped tests that should have run)
- False-positive rate (% of selected tests that didn't fail)
- Confidence score distribution

### Langfuse Traces (M14)

**Per A5 call:**
- Input: PR diff, affected files, all test IDs
- Analysis: affected_components, reasoning
- Ranking: ranked test_ids, priority/coverage/cost per test
- Selection: final selected_ids, confidence, time savings estimate

### Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| A5 latency p95 | >15s | Page on-call, investigate bottleneck (parser vs. lookup vs. ranker) |
| FN rate spike | >5% | Trigger FN detection analysis, consider rollback |
| Selection accuracy | <70% | Flag to team, check if component mapping stale, retrain weights |
| Nightly validation failure | >1 error | Alert DevOps, check Hatchet job logs, manual validation fallback |

---

## 19. MILESTONE EXIT CRITERIA (DEFINITION OF DONE)

1. ✅ **Diff Parser Accurate:** ≥99% extraction accuracy on 50-PR validation set
2. ✅ **Component Mapping Complete:** ≥100 test-component mappings seeded + pgvector indexed
3. ✅ **A5 Agent Accurate:** ≥80% selection accuracy on 20-PR validation set, <5% FN rate
4. ✅ **CI Integration Live:** GitHub Actions + GitLab CI workflows executing, matrix generated, tests running
5. ✅ **PR Comments Posting:** Selected tests + time savings + `/qa run all` button posted to PRs
6. ✅ **Override Command Working:** `/qa run all` triggers full-suite CI, override logged
7. ✅ **Missed-Failure Detection:** Nightly validation job running, FN tests identified, feedback loop retraining
8. ✅ **Dashboards Live:** Weekly accuracy report, CI time saved, FN rate trend displayed
9. ✅ **60% Time Savings Demo:** Baseline 40 min → A5 subset 16 min documented + video demo
10. ✅ **A3 ↔ A5 Integration:** A3-authored tests prioritized in A5 selection, data flow verified
11. ✅ **Feature Flag Ready:** feature_ai_a5_test_selection in Unleash, dark launch → GA rollout strategy documented
12. ✅ **E2E Tests Passing:** Full workflow: PR → A5 select → run tests → ≥80% accuracy validated
13. ✅ **Observability Green:** SigNoz + Langfuse dashboards live, latency targets met, no p0/p1 alerts
14. ✅ **Documentation Complete:** User guide (for devs), API docs, admin guide, troubleshooting published
15. ✅ **Team Trained:** DevOps, Backend, AI leads understand codebase; on-call runbooks published

---

## 20. HANDOFF & DOCUMENTATION

**Deliverables:**
- [ ] User Guide: "Test Selection in CI — Getting Started" (5-page, screenshot walkthrough, override examples)
- [ ] API Documentation: Swagger/OpenAPI spec for EP-068 through EP-070
- [ ] Admin Guide: Feature flag rollout, nightly validation setup, troubleshooting (missed-failure detection, ranking drift)
- [ ] Runbooks: A5 latency debugging, missed-failure analysis, component mapping maintenance
- [ ] Dashboards Guide: SigNoz + Langfuse navigation, metric interpretation, alerting setup

**Knowledge Transfer:**
- [ ] Technical deep-dive with Backend Lead (A5 LangGraph workflow, component mapping queries, cost model)
- [ ] DevOps walkthrough (GitHub Actions / GitLab CI integration, webhook receiver, matrix generation)
- [ ] On-call runbook walkthrough with DevOps (A5 latency spikes, nightly validation failures, rollback procedure)

---

## 21. NEXT MILESTONE PREVIEW (M15)

**Milestone M15 (W7–8 of PM3, 2027-02-23 → 2027-03-06):** Full Test Planning (A8 Full)

- **A8 Full Agent:** Auto-generate complete test strategy from PRD alone
- **Input:** PRD (text or Figma), test case library, defect history, component metadata
- **Output:** Test Strategy, Risk Matrix, Entry/Exit Criteria, Compliance Checklist, Coverage Estimate
- **Integration:** Risk matrix from A8 informs A5 selection priorities (high-risk components → more tests selected)
- **Target:** <60s strategy generation, ≥90% QA Lead approval rate on auto-generated criteria

**Dependencies on M14:**
- A5 ranking model (trained on historical PR failures) feeds A8 risk assessment
- Component coverage analysis from A5 selection informs A8 coverage requirements
- Missed-failure feedback loop improves A8 risk matrix calibration

---

## 22. APPENDIX

### A. Sample A5 Prompt (Change Analysis)

```
You are a test impact analysis expert.

INSTRUCTIONS:
1. Parse the PR code diff to identify changed files
2. For each changed file, extract the component (use codebase structure)
3. For each component, assess impact: 1.0 (critical), 0.5–0.9 (major), 0.1–0.5 (minor)
4. Return affected components sorted by impact score descending

PR DIFF:
[DIFF_TEXT]

COMPONENT MAPPING (file → component):
[MAPPING_JSON]

Return JSON: {"affected_components": [{"name": "...", "impact_score": 0.X, "affected_files": [...]}]}
```

### B. Sample A5 Ranking Weights

```json
{
  "priority_weights": {
    "P0": 10.0,
    "P1": 5.0,
    "P2": 2.0,
    "P3": 1.0
  },
  "coverage_weight": 3.0,
  "dependency_weight": 2.0,
  "execution_cost_weight": -0.01,  // Penalize slow tests
  "confidence_threshold_select": 0.7,
  "confidence_threshold_skip": 0.3,
  "min_component_coverage": 0.80
}
```

### C. Sample CI Time Estimate

```json
{
  "test_execution_times": {
    "test_101": 2.5,  // minutes
    "test_102": 3.1,
    "test_103": 1.8,
    "test_104": 2.2
  },
  "parallel_workers": 4,
  "overhead_per_job_minutes": 1.0,  // startup, reporting
  "selected_tests_total_time": 25.0,
  "parallelized_time_estimate": 16.0,  // 25 / 4 + 1 overhead = ~7.25, round up for variance
  "full_suite_time_estimate": 40.0,
  "time_saved_minutes": 24.0,
  "time_saved_pct": 60.0
}
```

---

**End of Milestone M14 Specification**
