---
milestone_id: M15
parent_project_milestone: PM3
name: "Full Test Planning (A8 Full)"
version: 1.0
date: 2026-04-23
phase: "[PM3]"
window: "W7–8 of PM3"
start_date: 2027-02-23
end_date: 2027-03-06
duration_weeks: 2
primary_agent: A8 (Test Planning — Full)
status: "Planned"
---

# Milestone M15 — Full Test Planning (A8 Full)

**QA Nexus v2 — Execution Blueprint**

**Version:** 1.0  
**Date Created:** 2026-04-23  
**Status:** Ready for Development  
**Duration:** 2 weeks (2027-02-23 → 2027-03-06)  
**Team:** Backend (1 FTE), AI Eng (1.5 FTE), Product (0.5 FTE) = 3 FTE  
**Estimated Effort:** 45 tasks, ~750 hours (450 story points after 20% velocity buffer), 40+ acceptance criteria

---

## TABLE OF CONTENTS

1. [Cover Page](#1-cover-page)
2. [Executive Summary](#2-executive-summary)
3. [Context: What Was Delivered Before](#3-context-what-was-delivered-before)
4. [M15 Scope (Locked)](#4-m15-scope-locked)
5. [Tech Stack (M15 Slice)](#5-tech-stack-m15-slice)
6. [Definition of Ready (DoR)](#6-definition-of-ready-dor)
7. [Task Breakdown (6 Phases)](#8-task-breakdown-6-phases)
8. [Week-Wise Breakdown](#9-week-wise-breakdown)
9. [Acceptance Criteria (40+ ACs)](#10-acceptance-criteria-40-acs)
10. [API Contracts (M15 Scope)](#11-api-contracts-m15-scope)
11. [AI Agent Spec (A8 Full)](#13-ai-agent-spec-a8-full)
12. [Testing Strategy](#14-testing-strategy)
13. [Risks & Mitigations](#16-risks--mitigations)
14. [Observability & Monitoring](#18-observability--monitoring)
15. [Milestone Exit Criteria (Definition of Done)](#19-milestone-exit-criteria-definition-of-done)
16. [Handoff & Documentation](#20-handoff--documentation)
17. [Appendix](#22-appendix)

---

## 1. COVER PAGE

**QA Nexus v2 — Milestone M15**

**Full Test Planning (A8 Full)**

*PRD-to-strategy automation: extract requirements, generate risk matrix, auto-populate entry/exit criteria, compliance checklist, <60s latency, ≥90% QA Lead approval rate*

**Duration:** 2 weeks (Feb 23 — Mar 06, 2027)  
**Team:** 3 FTE (Backend × 1, AI Eng × 1.5, Product × 0.5)  
**Effort:** ~750 hours (~45 tasks, 40+ ACs, 20% velocity buffer)  
**Status:** [PM3] On Track

---

## 2. EXECUTIVE SUMMARY

**Mission:** Deliver **A8 Full Test Planning Agent**, enabling automatic test strategy + risk matrix + entry/exit criteria generation from PRD + defect history + test metadata. When Product uploads PRD for a feature release, A8 generates a complete, QA Lead-approved test strategy in <60s. Target: ≥90% of auto-generated entry/exit criteria approved by QA Lead without edits.

**Key Deliverables:**

- **A8 Full LangGraph Agent:** Extracts requirements from PRD → analyzes defect history → generates risk matrix (likelihood × impact) → auto-populates entry/exit criteria → outputs compliance checklist (if regulated)
- **Risk Matrix Generation:** Requirement → risk cell (severity × likelihood); link to test cases; flag high-risk components for A5 prioritization
- **Entry/Exit Criteria Auto-Population:** From past projects + regulatory guidance + defect patterns; Lead-reviewed checklist
- **Compliance Checklist:** HIPAA / PCI-DSS / SOC 2 / GDPR requirements auto-mapped to test activities
- **Coverage Mapping:** FR-ID → test case candidates (semantic search via RAG); coverage %; gaps identified
- **Integration with M13+M14:** A3-authored tests included in coverage analysis; A5 risk ranking uses A8 matrix; 50-doc catalog includes Auto-Generated Strategy + Risk Matrix docs

**Success Metrics (linked to PRD):**

- **GM-014 (Speedup):** <60s strategy generation (vs. 4h manual)
- **GM-015 (Quality):** ≥90% QA Lead approval rate on auto-generated entry/exit criteria
- **GM-016 (Coverage):** ≥95% of requirements mapped to ≥1 test case; gaps identified
- **Deliver:** ≥5 PRDs processed, 50-doc catalog unlocked with 18 new templates

**Rollback Trigger:** If entry/exit criteria approval <70% OR coverage detection <80%, disable A8 Full; revert to manual strategy writing.

---

## 3. CONTEXT: WHAT WAS DELIVERED BEFORE

### PM1 + PM2 + M13 + M14 Baseline (Inherited)

**A8 Partial (from PM1 M2):**
- Context-gathering agent for 12 doc templates
- Basic strategy hints from KB RAG
- Section confidence scoring
- Needs Clarification Questions gate (not auto-complete)

**M13 Low-Code Authoring:**
- ≥100 automation suites (4 frameworks)
- A3-authored tests linked to components
- Confidence scores on code generation

**M14 Test Selection:**
- Component mapping (test → component)
- Risk ranking (P0/P1 prioritized)
- Missed-failure detection + feedback loop
- Accuracy ≥80%, A5 ranking weights tuned

**Assets for M15:**
- ≥500 test cases with metadata (component tags, priority, defect links)
- ≥200 resolved defects (category, root cause, affected components)
- 32 doc templates (Strategy hints, Estimation, etc.)
- KB seeded (30+ entries + defect patterns)
- RAG + pgvector operational
- A1, A2, A4, A7 all ≥80% confidence

---

## 4. M15 SCOPE (LOCKED)

### IN SCOPE (M15 Owns)

| Feature | Component | Rationale |
|---------|-----------|-----------|
| **Requirement Extraction** | PRD parsing (text + Figma), FR-ID extraction | Extract functional + non-functional + security + compliance reqs |
| **A8 Full LangGraph Pipeline** | Multi-node: analyzer → risk scorer → entry/exit → compliance → coverage | Build on A8 Partial (M2), extend with full strategy output |
| **Risk Matrix Generation** | 5×5 severity/likelihood grid, test case mapping | Generate risk matrix table + visual; flag high-risk components |
| **Entry/Exit Criteria Auto-Gen** | Template-based population from past projects + defect patterns | Auto-populate, Lead-review gate before lock |
| **Compliance Checklist** | HIPAA / PCI-DSS / SOC 2 / GDPR keyword detection + mapping | Conditional: if compliance keywords found in PRD |
| **Coverage Mapping** | FR-ID → semantic test search (RAG), coverage %, gap analysis | Integrate A1 test case library; identify uncovered requirements |
| **Integration with A5** | Pass risk matrix to A5 ranking for component prioritization | High-risk components trigger higher A5 test subset selection |
| **50-Doc Catalog Unlock** | Generate 18 new templates (Auto-Strategy, Risk Matrix, Entry/Exit, Compliance, Coverage Matrix, +13 more) | Part of PM3 deliverable (50 of 70 docs) |

### OUT OF SCOPE (Deferred to PM4)

| Feature | Why | Target Phase |
|---------|-----|---|
| **Multi-Language Strategy** | v1: English only; localization post-GA | PM4 |
| **Automated Test Plan Generation** | Requires detailed task breakdown logic (out of M15 scope) | M16+ |
| **Performance Baseline Automation** | Perf testing = separate module (M16+) | M16+ |
| **Advanced Regulatory Compliance** | GxP / HIPAA detailed validation (PM4 L6) | PM4 |

---

## 5. TECH STACK (M15 SLICE)

| Component | Version | Purpose | Status | Notes |
|-----------|---------|---------|--------|-------|
| **LangGraph** | ^0.1.0 | A8 Full agent orchestration | Inherited | Multi-node risk analysis pipeline |
| **Ollama + Gemma 4** | Latest | LLM for requirement analysis + risk scoring | Inherited | 26B MoE, fallback Gemini 2.5 Flash |
| **pgvector / RAG** | ^0.7.0 | Semantic search (FR-ID → test cases) | Inherited | BGE-large embeddings, coverage detection |
| **PostgreSQL** | 15 | Defect history, risk matrix storage | Inherited | TB-021 new table (risk_matrices) |
| **FastAPI** | ^0.104 | A8 endpoint implementation | Inherited | EP-072 (generate strategy) |
| **Langfuse** | ^3.0.0 | LLM trace logging | Inherited | Trace requirement analysis, risk scoring decisions |
| **SigNoz** | Latest | APM + latency monitoring | Inherited | Strategy generation latency, accuracy trends |
| **Hatchet** | Latest | Async job queue (strategy generation) | Inherited | Queue A8 async, return job_id for polling |

---

## 6. DEFINITION OF READY (DoR)

**M15 Cannot Start Until All These Are TRUE:**

- [ ] **M14 Exit Criteria Met:** A5 accuracy ≥80%, CI integration live, dashboards deployed, 60% time savings demo
- [ ] **A8 Partial Proven:** <30s context gathering (from M2), section confidence scoring working
- [ ] **Defect History Seeded:** ≥200 resolved defects with component tags, root cause, affected components
- [ ] **Test Case Library Complete:** ≥500 suites with metadata (component, priority, defect links)
- [ ] **Component Risk Mapping:** Map components → defect frequency + severity patterns
- [ ] **PRD Samples Available:** 5 representative PRDs for validation (features, compliance scope, FR counts)
- [ ] **A8 Prompt Library Drafted:** Requirement extraction, risk scoring, entry/exit templates for 3 project types
- [ ] **Ollama Online:** Health passing, Gemma 4 loaded, <2s latency
- [ ] **pgvector Index:** Test metadata + requirement keywords embedded + indexed
- [ ] **Staging Data Fresh:** M14 baseline + 5 sample PRDs + 200 defects copied to staging

---

## 7. TASK BREAKDOWN (6 PHASES) [PM3]

### PHASE A: Requirement Extraction + Risk Scoring (Days 1–3)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T001 | Draft A8 system prompt (require extraction, risk analysis, entry/exit templates) | AI Eng | P0 | 8 | — | US-032 | M15-AC001 |
| M15-T002 | Build LangGraph node: RequirementExtractor (parse PRD → extract FR-IDs, severity, compliance keywords) | AI Eng | P0 | 12 | M15-T001 | — | M15-AC002 |
| M15-T003 | Build LangGraph node: RiskAnalyzer (analyze defect history for component → assign likelihood/severity scores) | AI Eng | P0 | 14 | M15-T002 | — | M15-AC003 |
| M15-T004 | Build LangGraph node: RiskMatrixGenerator (5×5 likelihood×severity grid, map tests to risk cells) | Backend | P0 | 12 | M15-T003 | — | M15-AC004 |
| M15-T005 | Implement FastAPI endpoint EP-072 POST /api/agents/a8/generate-strategy (async, input: PRD_text/PRD_id, return job_id) | Backend | P0 | 14 | M15-T002–T004 | — | M15-AC005 |
| M15-T006 | Test A8 on 5-PRD validation set (measure accuracy, approval rate, latency) | AI Eng | P0 | 12 | M15-T005 | — | M15-AC006 |

**Phase A Total:** ~72 hours | **Critical Path:** M15-T001 (prompts) → M15-T002 (extractor) → M15-T003 (risk) → M15-T005 (endpoint)

---

### PHASE B: Entry/Exit Criteria + Compliance (Days 4–6)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T007 | Build LangGraph node: EntryExitBuilder (populate entry/exit from past projects + defect patterns + compliance) | AI Eng | P0 | 14 | M15-T003 | — | M15-AC007 |
| M15-T008 | Build TB-021 risk_matrices schema (store matrix, entry/exit, compliance_checklist, prd_id, created_by) | Backend | P0 | 6 | — | — | M15-AC008 |
| M15-T009 | Write migration M028 (create risk_matrices table + indexes) | Backend | P0 | 6 | M15-T008 | — | M15-AC009 |
| M15-T010 | Build LangGraph node: ComplianceChecker (keyword detection: HIPAA/PCI/SOC2/GDPR → generate checklist) | AI Eng | P0 | 12 | M15-T003 | — | M15-AC010 |
| M15-T011 | Implement Lead-review gate UI (show auto-gen entry/exit + compliance, Lead clicks Approve/Edit) | Frontend | P0 | 10 | — | — | M15-AC011 |
| M15-T012 | Test entry/exit accuracy on 5-PRD validation (measure Lead approval rate ≥90%) | QA | P0 | 10 | M15-T007–T011 | — | M15-AC012 |

**Phase B Total:** ~58 hours | **Critical Path:** M15-T007 (builder) → M15-T011 (gate) → M15-T012 (validation)

---

### PHASE C: Coverage Mapping + A5 Integration (Days 7–9)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T013 | Build LangGraph node: CoverageMapper (FR-ID → semantic test search via RAG, coverage %, gaps) | AI Eng | P0 | 14 | M15-T002 | — | M15-AC013 |
| M15-T014 | Integrate A5 risk ranking with A8 risk matrix (pass high-risk components to A5 for selection prioritization) | Backend | P0 | 10 | M15-T003, M14-data | — | M15-AC014 |
| M15-T015 | Implement EP-073 POST /api/agents/a8/risk-components (return high-risk components for A5 dynamic ranking) | Backend | P0 | 8 | M15-T003, M15-T014 | — | M15-AC015 |
| M15-T016 | Test coverage mapping on 5-PRD validation (measure ≥95% FR coverage detection) | QA | P0 | 10 | M15-T013 | — | M15-AC016 |

**Phase C Total:** ~42 hours | **Critical Path:** M15-T013 (mapper) → M15-T014 (A5 int) → M15-T015 (endpoint)

---

### PHASE D: 50-Doc Catalog Unlock (Days 10–11)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T017 | Design 18 new doc templates (Auto-Generated Strategy, Risk Matrix, Entry/Exit Checklist, Compliance Checklist, Coverage Matrix, +13 compliance/planning docs) | Product | P0 | 12 | — | — | M15-AC017 |
| M15-T018 | Implement doc template generation (A8 output → populate templates with strategy/matrix/entry-exit/compliance data) | Backend | P0 | 14 | M15-T007–T010, M15-T017 | — | M15-AC018 |
| M15-T019 | Test template generation (generate all 18 for 3 sample PRDs, verify formatting + completeness) | QA | P0 | 8 | M15-T018 | — | M15-AC019 |

**Phase D Total:** ~34 hours | **Critical Path:** M15-T017 (design) → M15-T018 (impl)

---

### PHASE E: Observability + Integration (Days 12–13)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T020 | Implement Langfuse logging for A8 (trace requirement analysis, risk decisions, entry/exit generation) | Backend | P0 | 8 | M15-T005 | — | M15-AC020 |
| M15-T021 | Build SigNoz dashboard: A8 latency (p50/p95/p99), strategy generation volume, accuracy trend | DevOps | P0 | 8 | M15-T005 | — | M15-AC021 |
| M15-T022 | Design A8 ↔ M13/M14 data flow (A3 test confidence → A8 coverage, A8 risk → A5 ranking) | Product | P0 | 6 | M15-T014 | — | M15-AC022 |
| M15-T023 | Feature flag integration (gate_ai_a8_full_planning, dark → canary → GA) | Backend | P0 | 6 | — | — | M15-AC023 |

**Phase E Total:** ~28 hours | **Critical Path:** M15-T020 (logging) → M15-T021 (dashboard)

---

### PHASE F: E2E + Polish (Days 14)

| M15-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC |
|--------|------|-------|----------|-----------|------|-------|-----|
| M15-T024 | Final E2E test: Upload PRD → A8 generates strategy → Risk matrix + Entry/exit + Compliance + Coverage in <60s → Lead approves | QA + Backend | P0 | 12 | All | — | M15-AC024 |
| M15-T025 | Bug fixes + performance tuning (latency <60s p95) | Full Team | P1 | 10 | All | — | M15-AC025 |
| M15-T026 | Documentation: User guide, API docs, admin guide | Product + Backend | P0 | 8 | — | — | M15-AC026 |

**Phase F Total:** ~30 hours | **Critical Path:** M15-T024 (E2E)

---

**Grand Total: ~45 tasks, ~750 hours (~450 story points after 20% velocity buffer)**

---

## 8. WEEK-WISE BREAKDOWN

**Week 1 (Feb 23–Mar 01, 2027):** Phases A + B
- Days 1–3: A8 prompts, requirement extraction, risk analysis, risk matrix generation (Phase A)
- Days 4–6: Entry/exit criteria, compliance checklist, Lead-review gate (Phase B)
- **Deliverable:** A8 ≥80% accuracy on 5-PRD validation set, entry/exit approval ≥90%

**Week 2 (Mar 02–06, 2027):** Phases C + D + E + F
- Days 7–9: Coverage mapping, A5 integration (Phase C)
- Days 10–11: 18-doc template generation, unlock 50-doc catalog (Phase D)
- Days 12–13: Observability, SigNoz/Langfuse dashboards, feature flag (Phase E)
- Day 14: E2E tests, final polish, <60s latency demo (Phase F)
- **Deliverable:** Full A8 agent live, 50-doc catalog unlocked, PM3 exit gate ready

---

## 9. ACCEPTANCE CRITERIA (40+ ACs)

### Requirement Extraction + Risk Analysis

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| M15-AC001 | A8 system prompt drafted | Prompt reviewed | Review A8_system_prompt.md | Requirement extraction + risk analysis + entry/exit + compliance instructions documented | P0 |
| M15-AC002 | RequirementExtractor node working | PRD text parsed | Extract FR-IDs, severity, compliance keywords | ≥95% accuracy vs. manual audit (10-PRD sample) | P0 |
| M15-AC003 | RiskAnalyzer node working | Defect history input | Assign likelihood/severity to components | Risk scores (1–5 scale) assigned, confidence per score | P0 |
| M15-AC004 | Risk matrix generated | Risk scores + test coverage | 5×5 grid created, tests mapped to cells | Matrix table + visual, high-risk cells flagged | P0 |
| M15-AC005 | EP-072 async strategy generation working | PRD uploaded | POST /api/agents/a8/generate-strategy | Returns 202, job_id; Hatchet queues; progress streamable | P0 |
| M15-AC006 | A8 accuracy ≥80% on validation set | 5-PRD validation set tested | Strategy generated for each PRD | ≥80% accuracy vs. manual QA Lead review | P0 |

### Entry/Exit + Compliance

| M15-AC007 | EntryExitBuilder node working | Defect patterns + templates | Entry/exit criteria populated | Auto-filled checklist, Lead-review ready | P0 |
| M15-AC008 | Risk matrices schema complete | Migrations applied | SELECT * FROM risk_matrices | Table exists, columns: prd_id, matrix_json, entry_exit, compliance, created_by | P0 |
| M15-AC009 | Migration M028 deployed | Applied to staging → prod | No rollback errors, zero downtime | Migration passes, data persisted, indexes created | P0 |
| M15-AC010 | ComplianceChecker node working | PRD with compliance keywords | Checklist generated for HIPAA/PCI/SOC2/GDPR | ≥95% keyword detection accuracy | P0 |
| M15-AC011 | Lead-review gate UI functional | Strategy + entry/exit + compliance shown | Lead clicks Approve / Edit | Approval stored, auto-gen locked on approve, edits tracked | P0 |
| M15-AC012 | Entry/exit approval rate ≥90% | 5-PRD validation set, Lead reviews | Measure approval % without edits | ≥90% of auto-generated criteria approved as-is | P0 |

### Coverage Mapping + A5 Integration

| M15-AC013 | CoverageMapper node working | FR-IDs + test library | Semantic search finds covering tests | ≥95% FR coverage detection, gaps identified | P0 |
| M15-AC014 | A5 risk integration working | A8 risk matrix output → A5 input | High-risk components prioritized in A5 selection | A5 test subset includes high-risk tests first | P0 |
| M15-AC015 | EP-073 risk-components endpoint working | Risk matrix available | GET /api/agents/a8/risk-components | Returns high-risk components sorted by score | P0 |
| M15-AC016 | Coverage mapping ≥95% accurate | 5-PRD validation, manual audit | FR coverage % measured | ≥95% of FRs mapped to ≥1 test | P0 |

### 50-Doc Catalog

| M15-AC017 | 18 doc templates designed | Design doc approved | Review template spec | 18 new templates spec'd (Strategy, Risk Matrix, Entry/Exit, Compliance, Coverage, +13 compliance docs) | P0 |
| M15-AC018 | Template generation working | A8 output available | Generate all 18 for 3 sample PRDs | Templates auto-populated, formatting correct, no content loss | P0 |
| M15-AC019 | Template generation accurate | 3 sample PRDs generated | Verify content completeness + accuracy | All 18 templates generated for each PRD, ≥95% content match manual review | P0 |

### Observability + Integration

| M15-AC020 | Langfuse logging for A8 | A8 generation completed | View Langfuse dashboard | Every call logged (requirement analysis, risk decisions, entry/exit, compliance, coverage) | P0 |
| M15-AC021 | SigNoz dashboard live | Metrics populated | View SigNoz A8 dashboard | Latency (p50/p95/p99), volume, accuracy trend displayed; no blank panels | P0 |
| M15-AC022 | A8 ↔ M13/M14 data flow designed | Design doc approved | Review data flow spec | A3 confidence → A8 coverage, A8 risk → A5 ranking documented | P0 |
| M15-AC023 | Feature flag integrated | feature_ai_a8_full_planning in Unleash | Flag default OFF, rollout documented | Dark → canary → GA progression ready | P0 |

### E2E + Exit Gate

| M15-AC024 | E2E test passing | Full user journey | Upload PRD → generate strategy → Lead approve → <60s latency verify | All steps pass, latency p95 <60s, demo video ready | P0 |
| M15-AC025 | A8 latency <60s p95 | 50 concurrent requests | Measure latency distribution | p95 <60s, p99 <90s, no timeout errors | P0 |
| M15-AC026 | Documentation complete | User guide + API docs + admin guide written | Review guides | User guide (5pg), API docs, admin guide, troubleshooting published | P0 |
| M15-AC027 | Observability green | All dashboards + alerts live | Check SigNoz, GlitchTip, Langfuse | No p0/p1 alerts, latency green, accuracy tracking active | P0 |
| M15-AC028 | WCAG 2.2 AA passed | Accessibility audit run | Verify keyboard nav, color contrast, screen reader | ≤3 P1 failures, accessibility documented | P1 |
| M15-AC029 | 50-doc catalog unlocked | 18 new templates deployed | Verify in production | 50 of 70 doc templates available, auto-generation working | P0 |
| M15-AC030 | PM3 Exit Gate Ready | All M13/M14/M15 exit criteria met | Verify gate checklist | A3 (low-code editor), A5 (test selection), A8 (full planning) all live + dashboards + 50-doc catalog | P0 |

---

## 10. API CONTRACTS (M15 SCOPE)

### EP-072: Generate Strategy

**POST /api/agents/a8/generate-strategy**
```json
REQUEST:
{
  "prd_id": "prd_001",
  "prd_text": "Feature: Payment Checkout...",
  "project_context": "e-commerce"
}

RESPONSE (202):
{
  "job_id": "job_a8_xyz",
  "status": "processing",
  "estimated_time_sec": 45
}

FINAL (via WebSocket/SSE):
{
  "status": "complete",
  "strategy": {
    "overview": "Test both happy path (successful payment) + error cases (timeout, invalid card)...",
    "scope": "Payments module, P0 critical path",
    "test_approach": "Risk-based: high-risk components covered ≥2x, P2 features sampled"
  },
  "risk_matrix": {
    "rows": ["Critical", "Major", "Minor"],
    "cols": ["Unlikely", "Likely", "Very Likely"],
    "cells": [
      {"risk": "critical+very_likely", "description": "Payment timeout + no retry", "tests": ["test_001", "test_002"]}
    ]
  },
  "entry_criteria": [
    "All P0 cases authored (A1 gen complete)",
    "A3 export syntax-valid for all 4 frameworks",
    "No open P0 defects from prior releases"
  ],
  "exit_criteria": [
    "Test pass rate ≥95%",
    "Zero P0/P1 defects open",
    "RTM coverage 100%",
    "Performance: checkout <2s p99"
  ],
  "compliance_checklist": [
    {"requirement": "PCI-DSS 3.2.1: Encrypt data in transit", "test_id": "test_ssl_001"},
    {"requirement": "PCI-DSS 6.5.10: Broken auth testing", "test_id": "test_auth_001"}
  ],
  "coverage": {
    "total_frs": 12,
    "covered_frs": 11,
    "coverage_pct": 92,
    "gaps": ["FR-008: Refund async notification"]
  },
  "confidence": 0.88,
  "created_at": "2027-02-23T10:00:00Z"
}
```

### EP-073: Risk Components

**GET /api/agents/a8/risk-components?prd_id=prd_001**
```json
RESPONSE (200):
{
  "high_risk_components": [
    {"name": "Payment Gateway", "risk_score": 4.8, "likelihood": 5, "severity": 5},
    {"name": "Authentication", "risk_score": 4.2, "likelihood": 4, "severity": 5}
  ],
  "recommended_a5_priority": "Payments, Auth — allocate 60% of A5 test subset here"
}
```

---

## 11. AI AGENT SPEC (A8 FULL) [PM3]

### A8 Full Test Planning Agent

**Purpose:** PRD-to-strategy automation: extract requirements → analyze risk (defect patterns) → generate risk matrix → auto-populate entry/exit/compliance → output release-ready strategy in <60s with ≥90% QA Lead approval rate.

**LangGraph Graph:**
```
START (PRD text)
  ↓
[RequirementExtractor] — Extract FR-IDs, severity, keywords
  ↓
[RiskAnalyzer] — Analyze defect history → assign risk scores
  ↓
[RiskMatrixGenerator] — 5×5 likelihood×severity grid
  ↓
[CoverageMapper] — FR-ID → semantic test search, coverage %
  ↓
[EntryExitBuilder] — Auto-populate entry/exit from templates
  ↓
[ComplianceChecker] — Detect HIPAA/PCI/SOC2/GDPR keywords
  ↓
[ConfidenceScorer] — Assign confidence to each section
  ↓
END (return strategy JSON + approval gate)
```

**Nodes:** RequirementExtractor (extract reqs), RiskAnalyzer (defect patterns), RiskMatrixGenerator (5×5 grid), CoverageMapper (FR-test mapping), EntryExitBuilder (populate checklist), ComplianceChecker (keyword detect), ConfidenceScorer (confidence assign).

---

## 12. TESTING STRATEGY

### Unit Tests
- Requirement extraction (10 PRDs, verify FR-ID extraction ≥95%)
- Risk analysis (100 defects → risk scores, verify ≥90% agreement with manual)
- Coverage mapping (semantic search on 500 tests, verify recall ≥90%)
- Entry/exit template population (past projects, verify completeness)

### Integration Tests
- A8 Full LangGraph workflow end-to-end (PRD → risk matrix → strategy)
- Risk matrix → TB-021 storage (query verification)
- A8 ↔ A5 data flow (risk → component prioritization)
- 50-doc template generation (all 18 templates auto-populated correctly)

### E2E Tests
- Full workflow: Upload PRD → A8 generates strategy → Lead review gate → storage → <60s latency verified
- Compliance detection: PRD with HIPAA keywords → checklist generated
- Coverage reporting: FRs unmapped → gaps identified, no false positives

### Validation Set
- 5 representative PRDs (various industries: fintech, e-commerce, healthcare, SaaS, gaming)
- Manual audit: Lead reviews auto-gen entry/exit, measures approval %

---

## 13. RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| A8 requirement extraction <70% accuracy | Strategy misses requirements; gaps undetected | Medium | Test on 10-PRD golden set, use Ollama + manual post-processing, keyword fallback |
| Defect history incomplete (components unmapped) | Risk scoring miscalibrated | Medium | Seed 200+ defect mappings in M14, manual backfill during M15 |
| Entry/exit approval <70% | Feature fails; manual writing still required | Medium | Template tuning based on 5-PRD validation, Lead feedback loop |
| A8 latency >90s (Ollama slowdown) | User waits too long; adoption friction | Low | Async job queue, timeout handlers, cache recent strategies, Gemini fallback |
| Compliance keyword detection false positives | Unnecessary checklists generated | Low | Validate on 20-PRD sample, tune keyword list, manual Lead review |

---

## 14. OBSERVABILITY & MONITORING

### SigNoz Dashboard
- A8 latency (p50/p95/p99), target <60s
- Strategy generation volume (per hour/day)
- Accuracy trend (requirement extraction %, risk score drift)

### Langfuse Traces
- Per A8 call: PRD input, requirement analysis, risk decisions, entry/exit gen, compliance detection

### Alerts
- Latency p95 >90s → investigate Ollama/queue
- Requirement extraction <60% → escalate to AI Eng
- Entry/exit approval <70% → review template tuning

---

## 15. MILESTONE EXIT CRITERIA (DEFINITION OF DONE)

1. ✅ **A8 Full Operational:** All nodes working, <60s p95 latency
2. ✅ **Requirement Extraction:** ≥95% accuracy on 10-PRD validation set
3. ✅ **Risk Matrix Complete:** 5×5 grid generated, high-risk cells flagged, tests mapped
4. ✅ **Entry/Exit Approval:** ≥90% of auto-gen criteria approved by Lead without edits
5. ✅ **Compliance Checklists:** ≥95% keyword detection, HIPAA/PCI/SOC2/GDPR covered
6. ✅ **Coverage Mapping:** ≥95% FR coverage detection, gaps identified
7. ✅ **A5 Integration:** High-risk components passed to A5 for dynamic selection
8. ✅ **50-Doc Catalog Unlocked:** 18 new templates auto-generated + deployed
9. ✅ **Observability Live:** SigNoz + Langfuse dashboards active, no alerts
10. ✅ **E2E Tests Passing:** Full workflow PRD → strategy → approval → <60s demo
11. ✅ **Feature Flag:** feature_ai_a8_full_planning Unleash flag dark launch → GA progression ready
12. ✅ **PM3 Exit Gate Ready:** M13/M14/M15 all complete, 50-doc catalog, dashboards, governance foundation

---

## 16. HANDOFF & DOCUMENTATION

**Deliverables:**
- [ ] User Guide: "Auto-Generate Test Strategy" (4-page, PRD upload flow, approval gate)
- [ ] API Documentation: Swagger spec for EP-072 (strategy gen) + EP-073 (risk components)
- [ ] Admin Guide: Feature flag, A8 latency tuning, entry/exit template customization
- [ ] 50-Doc Catalog: All 18 new templates documented + usage examples

**Knowledge Transfer:**
- [ ] Technical deep-dive: A8 LangGraph workflow, risk matrix generation, A5 integration
- [ ] On-call: A8 latency spikes, requirement extraction failures, Lead-approval gate issues

---

## 17. APPENDIX

### A. Sample A8 Prompt

```
You are a test planning expert. Generate a complete test strategy from a PRD.

INSTRUCTIONS:
1. Extract requirements (functional, non-functional, security, compliance)
2. Analyze risk: High-incident components (from defect history) = higher risk
3. Generate 5×5 risk matrix (likelihood × severity)
4. Populate entry/exit criteria (based on past projects + regulatory guidance)
5. Detect compliance keywords (HIPAA, PCI-DSS, SOC 2, GDPR)

PRD:
[PRD_TEXT]

DEFECT PATTERNS (past projects):
[DEFECT_HISTORY]

Return JSON with strategy, risk_matrix, entry_exit, compliance_checklist, coverage.
```

### B. Sample 18 New Templates (50-Doc Catalog)
1. Auto-Generated Test Strategy
2. Risk Matrix (visual + table)
3. Entry/Exit Criteria Checklist
4. Compliance Checklist (HIPAA/PCI/SOC2)
5. Coverage Matrix (FR-ID → test mapping)
6. +13 regulatory/planning docs (GDPR data protection, GxP FDA, advanced planning)

---

**End of Milestone M15 Specification**
