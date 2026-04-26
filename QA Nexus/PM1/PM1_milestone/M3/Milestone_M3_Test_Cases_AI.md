# Milestone M3: Test Cases & AI Generation

**QA Nexus MVP — Execution Blueprint**

> ⚠️ **Tech stack updated 2026-04-25 — see PM1_PRD v8.1 / PM1_ERD v2.1 as binding. M3 is the milestone that ships A1 + A2 — the locked LLM stack matters most here.**
> The task list below was written against the v1.0 self-hosted Gemma 4 26B MoE on Ollama. For the actual M3 build:
> - **A1 Test Case Generator:** Groq free API → `openai/gpt-oss-120b` (production, 500 tok/s, 131K ctx, 1,000 RPD free) for primary; `meta-llama/llama-4-scout-17b-16e-instruct` (preview, 10M ctx) for long-context variant; Gemini 2.5 Flash free fallback. **NO Ollama, NO self-hosted GPU, NO FastAPI service.**
> - **A2 Duplicate Detection:** No LLM call — pure embedding similarity via Qwen3-Embedding-0.6B in `@xenova/transformers` (in-process in NestJS). p50 latency 50-80ms (CPU-only).
> - **LLM gateway:** hand-rolled in NestJS or `freellm` package (MIT) — primary→fallback retry on 429/503. Configured via F28m1 LLM Provider Configuration Modal (Admin-only; v2.10 NEW frame).
> - **Per-agent model assignment:** done via F26m1 Agent Model Assignment Modal (Admin + Lead; v2.10 NEW frame). A1 has Primary / Long-context / Fallback paths; routing rules read-only and derived (prompt_tokens > 100K → Long-context; 429/503 → Fallback; otherwise → Primary).
> - **A1/A4 async pattern:** inline async via NestJS + WebSocket completion (NO BullMQ workers, NO Redis queue). Client gets 202 + runId immediately; WebSocket pushes `agent_run.complete` event when Groq returns.
> - **Eval gate:** DeepEval (MIT, pytest-native) golden-set runs on engineering Colab Free — NOT user-facing, NOT LangSmith.
> - **Frames in scope:** F14 Requirements, F14m1 Edit Requirement Modal, F14m2 Link Test Case Modal, F14m3 Convert to Jira Story Modal, F16a Method Chooser, F16b A1 Generate, F16c Bulk Import, F17 Test Case Library — all locked in PM1_UI_v2.
> - **New tables (v2.1 PM1_ERD):** TB-019 `llm_provider`, TB-020 `llm_provider_model`, TB-021 `agent_model_assignment` — provider config writes from F28m1 land here; agent routing reads from TB-021 at runtime.
> - **Acceptance gates (PM1 GA, revised v2.1):** A1 latency <10s p95 (down from v1.0's 30s thanks to Groq's LPU speed); A2 latency <500ms; ≥80% A1 cases auto-approved at confidence ≥80%; <5% A2 false-positive rate.
>
> Use this M3 file for the workflow narrative + acceptance criteria. For binding model + routing choices, defer to PM1_PRD v8.1 §12.3 and PM1_ERD v2.1 §3.5 (A1 sequence diagram), §3.12 (agent orchestration), §7 (per-agent specs). Strip Ollama / Gemma 4 / FastAPI references before sprint planning.

**Version:** 1.0  
**Date Created:** 2026-04-21  
**Status:** Ready for Development  
**Duration:** 3 weeks (2026-06-15 → 2026-07-05)  
**Team:** Backend (2 FTE), Frontend (1.5 FTE), AI Eng (1 FTE), DevOps (0.5 FTE) = 5 FTE  
**Estimated Effort:** 60 tasks, ~840 hours (504 story points after 20% velocity buffer), 45 acceptance criteria

---

## TABLE OF CONTENTS

1. [Cover Page](#1-cover-page)
2. [Executive Summary](#2-executive-summary)
3. [Context: What Was Delivered Before](#3-context-what-was-delivered-before)
4. [M3 Scope (Locked)](#4-m3-scope-locked)
5. [Tech Stack (M3 Slice)](#5-tech-stack-m3-slice)
6. [Definition of Ready (DoR)](#6-definition-of-ready-dor)
7. [Milestone Entry Criteria](#7-milestone-entry-criteria)
8. [Task Breakdown (9 Phases)](#8-task-breakdown-9-phases)
9. [Week-Wise Breakdown](#9-week-wise-breakdown)
10. [Acceptance Criteria (45 ACs)](#10-acceptance-criteria-45-acs)
11. [API Contracts (M3 Scope)](#11-api-contracts-m3-scope)
12. [Database Changes (M3 Scope)](#12-database-changes-m3-scope)
13. [Testing Strategy](#13-testing-strategy)
14. [Feature Flag Strategy](#14-feature-flag-strategy)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Rollback Plan](#16-rollback-plan)
17. [Milestone Exit Criteria (Definition of Done)](#17-milestone-exit-criteria-definition-of-done)
18. [Deliverables Checklist](#18-deliverables-checklist)
19. [Traceability Matrix](#19-traceability-matrix)
20. [Shared Context](#20-shared-context)
21. [Next Milestone Preview (M4)](#21-next-milestone-preview-m4)
22. [Appendix](#22-appendix)

---

## 1. COVER PAGE

**QA Nexus MVP — Milestone M3**

**Test Cases & AI Generation**

*Authoring 10+ test cases in minutes via A1 Generator with Clarification Gate + A2 live dedup + RTM linking + bulk import + versioning*

**Duration:** 3 weeks (June 15 — July 5, 2026)  
**Team:** 5 FTE (Backend × 2, Frontend × 1.5, AI Eng × 1, DevOps × 0.5)  
**Effort:** ~840 hours (~60 tasks, 45 ACs, 20% velocity buffer)  
**Status:** On Track

---

## 2. EXECUTIVE SUMMARY

**Mission:** Enable QA teams to author ≥10 test cases per invocation using A1 Test Case Generator (with mandatory Clarification Questions gate), detect live duplicates via A2 semantic similarity (pgvector cosine), link cases to requirements for RTM coverage tracking, bulk-import cases from industry formats, and maintain immutable version history with audit trails — all within 3 weeks (June 15 → July 5, 2026).

**Key Deliverables:**

- **Test Case CRUD API** (EP-060): create, read, update, delete operations with RBAC enforcement
- **TipTap Block-Based Editor** (UI): BDD (Given/When/Then) and Traditional (Steps/Expected) modes with seamless mode-switching
- **A1 Test Case Generator** (LangGraph): Consumes PRD/US/Jira ticket/KB doc → asks 2–3 clarification questions → generates ≥10 test cases with confidence badges (High/Medium/Low)
- **A2 Semantic Dedup** (pgvector): Live chips while authoring, similarity scoring (3 thresholds: exact ≥0.95, near ≥0.85, similar ≥0.75)
- **RTM Linking**: Trace test case ↔ requirement ↔ PRD US-ID chain
- **Test Case Versioning & Audit Trail**: Every edit creates immutable version; rollback supported
- **Bulk Import Adapters**: CSV, TestRail CSV, Zephyr JSON, Xray JSON, qTest JSON formats
- **Tags + Priority + Stability Sparklines**: P0/P1/P2/P3 priority, custom tags, flakiness trend (requires M4 run data; MVP shows mock)

**Success Metrics (linked to PRD):**

- **GM-005 (Speedup):** ≥10× faster authoring (A1 gen 30s vs. manual 2h)
- **GM-006 (Auto-Approval):** A1 ≥80% auto-approval rate (confidence ≥80%, no user edit needed)
- **GM-007 (Dedup Accuracy):** A2 surfaces ≥1 true duplicate candidate in demo seed corpus
- **Deliver:** ≥100 seed test cases by EOD M3 (for M4 test run reference)

**Rollback Trigger:** If A1 auto-approval <60% OR A2 false positives >10%, disable both agents; users revert to manual case authoring.

---

## 3. CONTEXT: WHAT WAS DELIVERED BEFORE

### M0 & M1 & M2 Baseline (Inherited)

**M0 — Infrastructure (Complete):**

- BetterAuth authentication + 4-role RBAC (Admin, Lead, QA, Mgmt)
- Projects CRUD + environments
- PostgreSQL 15 + pgvector extension + Redis cache
- Ollama (Gemma 4 26B MoE) + FastAPI inference server
- Docker containers (Postgres, Redis, Ollama, Langfuse, SigNoz, GlitchTip)
- Vercel CI/CD + GitHub Actions + Doppler secrets
- Audit log schema + logger

**M1 — Knowledge Base & Documents (Complete):**

- KB CRUD + approval workflow
- BGE-large embeddings + pgvector index seeded (≥30 KB entries)
- Document generation (A1 context agent) proven <30s
- 12 document templates loaded
- Document versioning + comments
- PDF export working

**M2 — Test Cases (Target M3 Entry, CRITICAL):**

- ✅ Test case CRUD (EP-060 create, read, update, delete)
- ✅ TipTap editor (block-based, BDD + traditional modes, mode-switch preserves content)
- ✅ A1 Test Case Generator (LangGraph pipeline, Clarification Questions gate, confidence badges)
- ✅ A2 Dedup (live chips while authoring, semantic similarity scoring via pgvector)
- ✅ RTM linking (test case ↔ requirement ↔ PRD US-ID)
- ✅ Tags + priority + stability sparklines (flaky-score from last 30 runs; MVP: mock data until M4 runs seeded)
- ✅ Test case bulk import (CSV, TestRail CSV, Zephyr JSON, Xray JSON, qTest JSON)
- ✅ Test case versioning + audit trail (every edit creates version; rollback supported)
- ✅ Database schema: TB-005 (test_cases), TB-005a (test_steps), TB-005b (case_tags), TB-005c (case_versions)

**APIs Available at M3 Start:**

- EP-001 → EP-027: Auth, projects, KB, documents (all working)
- EP-060, EP-061, EP-062: Test case CRUD, A1 generate, A2 dedup (assumed built in M2, stable at M3 start)

**Data Available:**

- ≥50 seed test cases (manual + A1-generated) from M2
- KB seeded (≥30 entries)
- Documents versioned
- Ollama + LangGraph proven with A1 context agent + Clarification Questions pattern

**Agents Online:**

- FastAPI + LangGraph running (A1 context agent from M1, A1 case generator from M2)
- Langfuse tracing live (all LLM calls logged)
- bgvector index operational

**Test Environment:**

- Staging.qanesus.internal with M2 baseline data
- E2E test framework (Playwright) ready

---

## 4. M3 SCOPE (LOCKED)

### IN SCOPE (M3 Owns)

| Feature | Component | Rationale |
|---------|-----------|-----------|
| **Test Case CRUD** | TB-005, TB-005a, TB-005b, TB-005c, EP-060 | Primary user journey; RBAC controls who can create/approve |
| **TipTap Editor (BDD + Traditional)** | UI, test_case_editor component | Mode-switch preserves content; supports Given/When/Then and Steps/Expected |
| **A1 Test Case Generator** | LangGraph pipeline (CO-019), EP-061 | Consumes PRD/US/Jira/KB as input; returns ≥10 cases with confidence |
| **A1 Clarification Questions Gate** | LangGraph branching, HITL pause | Asks 2–3 clarification questions before generation; waits for user answers |
| **A2 Semantic Dedup** | pgvector cosine similarity, EP-062 | Live chips while authoring; suggests merge or dismiss at 0.75/0.85/0.95 thresholds |
| **RTM Linking** | case_requirements join, EP-060 extend | Test case ↔ requirement ↔ PRD US-ID traceability |
| **Tags + Priority + Sparklines** | case_tags, case_priority, flakiness chart (mock) | P0/P1/P2/P3, custom tags, stability trend (data from M4 runs) |
| **Bulk Import Adapters** | CSV, TestRail, Zephyr, Xray, qTest parsers | 5 industry formats supported |
| **Test Case Versioning + Audit Trail** | TB-005c, audit_events, case_versions table | Every edit immutable; rollback UI supported |
| **Requirement Linking** | TB-005 case_requirements, RTM matrix | Track coverage % per requirement |

### OUT OF SCOPE (Deferred to M4)

| Feature | Why | Target Milestone |
|---------|-----|---|
| **Test Execution / Test Runs** | Depends on test cases being authored first | M4 (Test Runs & Defects) |
| **A4 RCA (5-layer Root Cause)** | Requires defect + test run data from M4 execution | M4 |
| **Jira 2-way Sync** | Requires defects + test runs to sync | M4 |
| **Auto-Evidence Capture** | Requires test execution infrastructure | M4 |
| **Defect CRUD** | Requires test run failures to create defects | M4 |
| **Reports (Daily/Weekly/Sprint)** | Requires test + defect data aggregation | M4–M5 |
| **ROI Calculator** | Requires cost baseline + defect trend data | M5 |
| **Command-K Omnibox** | Depends on M4 defect data for search scope | M5 |

---

## 5. TECH STACK (M3 SLICE)

| Component | Version | Purpose | Status (M3 Start) | Notes |
|-----------|---------|---------|---|---|
| **Next.js** | 14 | Frontend SSR, test case editor | Inherited (M0) | App Router |
| **TipTap / ProseMirror** | ^2.3.0 | Block-based editor (BDD + traditional) | Inherited (M2) | Custom nodes: BDD block, step block, expected-result block |
| **NestJS** | ^10 | Backend API Gateway, case CRUD | Inherited (M0) | New endpoints: EP-060 variants |
| **FastAPI** | ^0.104 | Python inference server (A1, A2) | Inherited (M1) | Hosts LangGraph orchestrator, calls Ollama |
| **LangGraph** | ^0.1.0 | Agent orchestration (A1 gen, A2 dedup) | Inherited (M1) | Branching graphs for clarification gate + dedup logic |
| **Ollama + Gemma 4** | Latest | Local LLM inference | Inherited (M1) | 26B MoE, ~60ms/token on Oracle 4-OCPU |
| **Sentence-Transformers (BGE-large-en)** | ^3.0.0 | Embeddings for A2 dedup | Inherited (M1) | 768-dim vectors, HNSW index in pgvector |
| **pgvector** | ^0.7.0 | Vector similarity search (Postgres extension) | Inherited (M1) | HNSW index for fast lookup; cosine similarity |
| **PostgreSQL** | 15 | Relational DB (test cases + versions) | Inherited (M0) | TB-005 family tables |
| **Hatchet** | Latest | Async job queue (A1/A2 agents) | Inherited (M1) | Queues A1 gen as async job; returns job_id for polling |
| **Langfuse** | ^3.0.0 | LLM trace logging (A1 confidence, A2 match %) | Inherited (M1) | Dashboard shows per-case generation cost + quality |
| **SigNoz** | Latest | APM + latency monitoring | Inherited (M0) | Tracks p95 case editor latency, A1 gen latency |
| **Unleash** | Latest | Feature flags (A1/A2 toggles) | Inherited (M0) | feature_ai_a1_case_gen, feature_ai_a2_dedup |
| **Playwright** | ^1.46 | E2E testing | New (M3) | Test case editor UI journeys, bulk import flows |

---

## 6. DEFINITION OF READY (DoR)

**M3 Cannot Start Until All These Are TRUE:**

- [ ] **M2 Exit Criteria Met:** Test case CRUD API working, TipTap editor functional, A1 generator returning cases, A2 dedup live chips working
- [ ] **Test Case Library Seeded:** ≥50 seed cases available (mix of manual + A1-generated) for A2 dedup validation
- [ ] **A1 Proven:** ≥80% auto-approval rate measured on M2 golden set (10-case corpus per category)
- [ ] **Ollama Online:** Health check passing, Gemma 4 model loaded, latency <2s per 100 tokens
- [ ] **pgvector Index Live:** ≥50 test case embeddings indexed (BGE-large-en), HNSW index created
- [ ] **LangGraph Pattern Proven:** Clarification Questions gate tested in M2 doc gen; branching logic validated
- [ ] **Database Migrations Ready:** M012-M015 (TB-005 family) reviewed, tested on staging, rollback verified
- [ ] **Design Approved:** TipTap editor screens finalized (BDD/Traditional mode designs)
- [ ] **Feature Flags Registered:** feature_ai_a1_case_gen, feature_ai_a2_dedup in Unleash (default OFF)
- [ ] **RBAC Guards Ready:** Case-level permissions (QA creates, Lead approves, dedup suggestions view-only)
- [ ] **Staging Data Fresh:** M2 baseline + 50 seed cases copied to staging; ready for M3 testing

---

## 7. MILESTONE ENTRY CRITERIA

Before sprint kickoff, verify:

1. **Jira Project Ready:** QANESUS project; epics: Test Case CRUD, A1 Generator, A2 Dedup, RTM, Versioning, Bulk Import, Testing
2. **Figma Handoff:** TipTap editor screens approved (BDD mode, Traditional mode, mode-switch mockups)
3. **OpenAPI Spec:** EP-060 (CRUD), EP-061 (A1 generate), EP-062 (A2 dedup) paths/methods/schemas drafted
4. **Database Schema:** TB-005/005a/005b/005c DDL reviewed (test_cases, test_steps, case_tags, case_versions)
5. **A1 Prompt Library:** System prompt (case generation), clarification prompt, dedup prompt drafted + reviewed
6. **Test Data Factories:** Script to create 100 test cases available (for M4 run assignment)
7. **Feature Flags:** Both flags created in Unleash (default OFF); rollout strategy documented
8. **Staging Data:** M2 baseline copied; ready for integration tests

---

## 8. TASK BREAKDOWN (9 PHASES)

### PHASE A: Test Case Schema + CRUD API (Days 1–3)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T001 | Design TB-005 test_cases schema (id, project_id, title, description, type BDD\|Traditional, priority P0–P3, created_by, created_at, updated_at, deleted_at) | Backend Lead | P0 | 8 | — | — | MS3-AC001 |
| MS3-T002 | Design TB-005a test_steps schema (step_id, case_id, step_order, content, expected_result, step_type BDD_GIVEN\|BDD_WHEN\|BDD_THEN\|STEP\|EXPECTED) | Backend Lead | P0 | 8 | MS3-T001 | — | MS3-AC001 |
| MS3-T003 | Design TB-005b case_tags schema (tag_id, case_id, tag_name, created_by) | Backend | P0 | 4 | MS3-T001 | — | MS3-AC001 |
| MS3-T004 | Design TB-005c case_versions schema (version_id, case_id, version_number, case_content_snapshot, created_by, created_at, change_reason) | Backend | P0 | 6 | MS3-T001 | — | MS3-AC002 |
| MS3-T005 | Write migrations M012-M015 (create 4 tables, indexes, foreign keys, audit trigger) | Backend | P0 | 12 | MS3-T001–T004 | — | MS3-AC001, MS3-AC002 |
| MS3-T006 | Implement EP-060 GET /api/test-cases (list, pagination 10/25/50, filter by project_id/priority/tag, sort by name/modified/coverage) | Backend | P0 | 12 | MS3-T005 | US-012 | MS3-AC003 |
| MS3-T007 | Implement EP-060 POST /api/test-cases (create case, validate title/type, set created_by from session, return 201 + case object) | Backend | P0 | 10 | MS3-T005 | US-012 | MS3-AC004 |
| MS3-T008 | Implement EP-060 GET /api/test-cases/{id} (fetch case + steps + tags + RTM links + version history; 200 or 404) | Backend | P0 | 10 | MS3-T005 | — | MS3-AC005 |
| MS3-T009 | Implement EP-060 PATCH /api/test-cases/{id} (update title/description/priority, create version entry, 200 or 409 conflict) | Backend | P0 | 12 | MS3-T005 | — | MS3-AC006 |
| MS3-T010 | Implement EP-060 DELETE /api/test-cases/{id} (soft-delete, audit log) | Backend | P1 | 6 | MS3-T005 | — | MS3-AC007 |
| MS3-T011 | Add RBAC guards (QA can create own cases, Lead can approve/bulk-delete, Mgmt can read-only) | Backend | P0 | 8 | MS3-T005 | — | MS3-AC008 |
| MS3-T012 | Write unit tests for CRUD endpoints (mock DB, test happy path + error cases) | Backend | P1 | 12 | MS3-T006–T010 | — | MS3-AC009 |

**Phase A Total:** ~118 hours | **Critical Path:** MS3-T005 (migrations) unblocks CRUD endpoints

---

### PHASE B: TipTap Editor (BDD + Traditional Modes) (Days 4–6)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T013 | Design TipTap custom extensions (BDD block, step block, expected-result block, screenshot attach) | Frontend Lead | P0 | 10 | — | US-013 | MS3-AC010 |
| MS3-T014 | Implement TipTap BDD block node (Given/When/Then structure, slash commands /given /when /then, placeholder text, validation) | Frontend | P0 | 14 | MS3-T013 | US-013 | MS3-AC011 |
| MS3-T015 | Implement TipTap Traditional block node (Step: text, Expected Result: text, drag reorder, slash commands) | Frontend | P0 | 14 | MS3-T013 | US-013 | MS3-AC011 |
| MS3-T016 | Implement mode-switch logic (toggle BDD ↔ Traditional, preserve content, transform structure, show confirmation) | Frontend | P0 | 12 | MS3-T014, MS3-T015 | US-013 | MS3-AC012 |
| MS3-T017 | Build case editor page (/app/test-cases/[id], routing, breadcrumb, sidebar nav) | Frontend | P0 | 10 | MS3-T014–T016 | — | MS3-AC013 |
| MS3-T018 | Build case list page (3-pane: folder tree / sortable list / detail preview; filters, search) | Frontend | P0 | 14 | — | — | MS3-AC014 |
| MS3-T019 | Integrate TipTap editor with API (POST /create, PATCH /update, handle versions, conflict resolution) | Frontend | P0 | 12 | MS3-T017, MS3-T007–T009 | — | MS3-AC015 |
| MS3-T020 | Implement editor keyboard shortcuts (Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo, Cmd variants) | Frontend | P1 | 8 | MS3-T017 | — | MS3-AC016 |
| MS3-T021 | Write TipTap component unit tests (custom nodes, mode-switch, content preservation) | Frontend | P1 | 10 | MS3-T013–T016 | — | MS3-AC017 |

**Phase B Total:** ~104 hours | **Critical Path:** MS3-T013 (design) → MS3-T014/T015 (nodes) → MS3-T016 (mode-switch)

---

### PHASE C: A1 Test Case Generator (LangGraph Pipeline) (Days 7–9)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T022 | Draft A1 system prompt (BDD case generation from PRD/US/Jira/KB, tone, examples, constraints) | AI Eng | P0 | 8 | — | US-012 | MS3-AC018 |
| MS3-T023 | Build LangGraph node: InputProcessor (parse PRD/US/Jira ticket, extract context, call KB RAG) | AI Eng | P0 | 12 | MS3-T022 | — | MS3-AC019 |
| MS3-T024 | Build LangGraph node: CaseGenerator (call Ollama with system prompt + context, generate 10 cases, parse response) | AI Eng | P0 | 14 | MS3-T023 | — | MS3-AC020 |
| MS3-T025 | Build LangGraph node: ConfidenceScorer (extract confidence % from Gemma output, map to High/Medium/Low, validate range 0–100) | AI Eng | P0 | 10 | MS3-T024 | — | MS3-AC021 |
| MS3-T026 | Implement FastAPI endpoint EP-061 POST /api/agents/a1/generate (async via Hatchet, return job_id, SSE streaming support) | Backend | P0 | 12 | MS3-T023–T025 | — | MS3-AC022 |
| MS3-T027 | Test A1 generator on seed dataset (10-case golden set per category: auth, CRUD, error, form, nav, integration; measure auto-approval) | AI Eng | P0 | 16 | MS3-T024–T025 | — | MS3-AC023 |
| MS3-T028 | Tune A1 prompt based on test results (adjust constraints, examples, retry logic for low-confidence cases) | AI Eng | P0 | 12 | MS3-T027 | — | MS3-AC023 |
| MS3-T029 | Implement Langfuse logging for A1 (trace all inputs, outputs, latency, confidence, cost) | AI Eng | P1 | 8 | MS3-T026 | — | MS3-AC024 |

**Phase C Total:** ~92 hours | **Critical Path:** MS3-T022 (prompt) → MS3-T023 (input) → MS3-T024 (gen) → MS3-T025 (score)

---

### PHASE D: A1 Clarification Questions Gate (Days 10–11)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T030 | Draft clarification prompt (ask 2–3 context questions about scope/persona/constraints) | AI Eng | P0 | 6 | — | US-012 | MS3-AC025 |
| MS3-T031 | Build LangGraph node: ClarificationAsker (call Ollama, generate 2–3 questions, format as JSON) | AI Eng | P0 | 10 | MS3-T030 | — | MS3-AC025 |
| MS3-T032 | Implement branching logic (after input analysis: if high confidence skip gate, else pause + ask questions) | AI Eng | P0 | 10 | MS3-T023, MS3-T031 | — | MS3-AC026 |
| MS3-T033 | Extend EP-061 to support clarification flow (POST with input → return questions + await user answers via WebSocket/polling) | Backend | P0 | 14 | MS3-T026, MS3-T031 | — | MS3-AC027 |
| MS3-T034 | Build UI modal for clarification questions (display 2–3 questions, text inputs for answers, "Continue" button) | Frontend | P0 | 10 | MS3-T017, MS3-T031 | — | MS3-AC028 |
| MS3-T035 | Test clarification gate latency (pause + resume must complete in ≤2s from question to resume) | Backend | P1 | 8 | MS3-T031–T034 | — | MS3-AC029 |

**Phase D Total:** ~58 hours | **Critical Path:** MS3-T030 (prompt) → MS3-T031 (asker) → MS3-T032 (branching)

---

### PHASE E: A2 Dedup Service (Days 12–13)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T036 | Design A2 similarity scoring logic (cosine similarity on BGE embeddings via pgvector; thresholds 0.75/0.85/0.95) | AI Eng | P0 | 8 | — | US-014 | MS3-AC030 |
| MS3-T037 | Implement FastAPI endpoint EP-062 POST /api/agents/a2/similar (input case text → embed → query pgvector → return top-3 candidates) | Backend | P0 | 12 | MS3-T036 | — | MS3-AC031 |
| MS3-T038 | Optimize pgvector query (HNSW index tuning, batch embedding for bulk checks, caching frequent queries) | Backend | P1 | 10 | MS3-T037 | — | MS3-AC032 |
| MS3-T039 | Test A2 on seed corpus (50 cases, measure recall/precision for exact/near-dup/similar thresholds) | AI Eng | P1 | 12 | MS3-T037 | — | MS3-AC033 |
| MS3-T040 | Tune A2 thresholds based on test results (adjust 0.75/0.85/0.95 if false-positive rate >10%) | AI Eng | P0 | 6 | MS3-T039 | — | MS3-AC033 |
| MS3-T041 | Implement Langfuse logging for A2 (similarity scores, match candidates, user action on chips) | Backend | P1 | 6 | MS3-T037 | — | MS3-AC034 |

**Phase E Total:** ~54 hours | **Critical Path:** MS3-T036 (design) → MS3-T037 (endpoint) → MS3-T038 (optimize)

---

### PHASE F: A2 Live Chips Integration (Days 14–15)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T042 | Design dedup chip UI (badge showing similarity %, "Merge?" button, "Dismiss" button, case link preview) | Frontend Lead | P0 | 8 | — | US-014 | MS3-AC035 |
| MS3-T043 | Implement dedup chips component (render live as user types, update on keystroke debounce, responsive layout) | Frontend | P0 | 12 | MS3-T042 | — | MS3-AC036 |
| MS3-T044 | Integrate chips with EP-062 (call /api/agents/a2/similar on title change, debounce 500ms, show top-3 candidates) | Frontend | P0 | 10 | MS3-T043, MS3-T037 | — | MS3-AC037 |
| MS3-T045 | Implement merge action (user clicks "Merge" → combine steps + tags, update RTM links, archive old case, audit log) | Backend | P0 | 12 | MS3-T009, MS3-T037 | — | MS3-AC038 |
| MS3-T046 | Implement dismiss action (user clicks "Dismiss" → hide chip for this session, store preference, don't suggest again) | Frontend | P1 | 6 | MS3-T043 | — | MS3-AC039 |
| MS3-T047 | Test live chips latency (<500ms from keystroke to chip display) | Frontend | P1 | 6 | MS3-T044 | — | MS3-AC040 |

**Phase F Total:** ~54 hours | **Critical Path:** MS3-T042 (design) → MS3-T043 (component) → MS3-T044 (integration)

---

### PHASE G: RTM + Tags + Sparklines (Days 16–18)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T048 | Design TB-005 case_requirements join (case_id, requirement_id, created_by, created_at) | Backend Lead | P0 | 6 | MS3-T005 | — | MS3-AC041 |
| MS3-T049 | Implement RTM linking API (POST /api/test-cases/{id}/link-requirement {requirement_id}, PATCH to unlink) | Backend | P0 | 10 | MS3-T048, MS3-T009 | US-015 | MS3-AC041 |
| MS3-T050 | Build RTM UI (modal: link to Jira issue by key; show coverage % = linked cases / total in requirement) | Frontend | P0 | 10 | MS3-T019, MS3-T049 | — | MS3-AC042 |
| MS3-T051 | Implement tags CRUD (POST /api/test-cases/{id}/tags, DELETE, list by case; auto-suggest from KB) | Backend | P0 | 10 | MS3-T005 | US-015 | MS3-AC043 |
| MS3-T052 | Build tags UI (dropdown with saved tags + create new, multi-select, filter by tag on list page) | Frontend | P0 | 10 | MS3-T018, MS3-T051 | — | MS3-AC043 |
| MS3-T053 | Design stability sparkline (7-day trend; data source: test_results.pass_count from M4; MVP: mock linear trend) | Frontend | P1 | 8 | — | — | MS3-AC044 |
| MS3-T054 | Implement sparkline rendering (tiny line chart, <100px wide, hover tooltip shows date + pass rate) | Frontend | P1 | 8 | MS3-T053 | — | MS3-AC044 |

**Phase G Total:** ~62 hours | **Critical Path:** MS3-T048 (schema) → MS3-T049 (API) → MS3-T050 (UI)

---

### PHASE H: Bulk Import Adapters (Days 19–20)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T055 | Design bulk import API (EP-063 POST /api/test-cases/bulk-import {format, file_content, project_id}) | Backend Lead | P0 | 6 | — | — | MS3-AC045 |
| MS3-T056 | Implement CSV adapter (parse headers, map fields to TB-005, return 10 cases per upload, validation + error reporting) | Backend | P0 | 12 | MS3-T055, MS3-T007 | — | MS3-AC045 |
| MS3-T057 | Implement TestRail CSV adapter (parse TestRail format, map Case/Steps/Expected to TB-005a, support multiline steps) | Backend | P0 | 12 | MS3-T055 | — | MS3-AC045 |
| MS3-T058 | Implement Zephyr + Xray + qTest JSON adapters (parse 3 JSON formats, normalize to TB-005, batch insert) | Backend | P0 | 14 | MS3-T055 | — | MS3-AC045 |
| MS3-T059 | Build bulk import UI (file upload, format selector, preview table, import button, success/error messages) | Frontend | P0 | 12 | MS3-T018, MS3-T055 | — | MS3-AC046 |
| MS3-T060 | Test bulk import with 5 industry format samples (100 cases each; verify field mapping, error handling) | QA | P1 | 12 | MS3-T055–T059 | — | MS3-AC047 |

**Phase H Total:** ~68 hours | **Critical Path:** MS3-T055 (design) → MS3-T056 (CSV) → MS3-T057–T058 (other formats)

---

### PHASE I: Versioning + Polish (Days 21)

| MS3-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| MS3-T061 | Design version history UI (list versions by date, show change reason, side-by-side diff, rollback button) | Frontend Lead | P0 | 8 | — | — | MS3-AC048 |
| MS3-T062 | Implement version rollback API (PATCH /api/test-cases/{id}/rollback-to-version {version_id}, create audit event) | Backend | P0 | 10 | MS3-T004, MS3-T009 | — | MS3-AC049 |
| MS3-T063 | Build version history UI component (list + diff view, responsive, breadcrumb nav back to case) | Frontend | P0 | 10 | MS3-T061, MS3-T062 | — | MS3-AC050 |
| MS3-T064 | Bug fixes, performance tuning, accessibility audit (keyboard nav, color contrast, screen reader test) | Full Team | P1 | 12 | All phases | — | MS3-AC051 |
| MS3-T065 | Final E2E tests + demo script (5-minute showcase: create case → A1 gen → dedup chip → RTM link → bulk import) | QA + Frontend | P0 | 8 | All phases | — | MS3-AC052 |

**Phase I Total:** ~48 hours | **Critical Path:** MS3-T061 (design) → MS3-T063 (UI)

---

**Grand Total: ~60 tasks, ~840 hours (~504 story points after 20% velocity buffer)**

---

## 9. WEEK-WISE BREAKDOWN

**Week 1 (June 15–21):** Phases A + B
- Days 1–3: Test case schema, migrations, CRUD API (Phase A)
- Days 4–6: TipTap editor, BDD/Traditional modes, mode-switch (Phase B)
- **Deliverable:** Test case CRUD working, TipTap editor functional on staging

**Week 2 (June 22–28):** Phases C + D + E
- Days 7–9: A1 Test Case Generator LangGraph pipeline, seed dataset testing (Phase C)
- Days 10–11: A1 Clarification Questions gate, latency tuning (Phase D)
- Days 12–13: A2 Dedup service, pgvector queries, threshold tuning (Phase E)
- **Deliverable:** A1 generator ≥80% auto-approval, A2 surfaces ≥1 true duplicate

**Week 3 (June 29–July 5):** Phases F + G + H + I
- Days 14–15: A2 live chips integration, UX Polish (Phase F)
- Days 16–18: RTM linking, tags, sparklines (Phase G)
- Days 19–20: Bulk import adapters (5 formats) (Phase H)
- Day 21: Versioning, final polish, E2E tests (Phase I)
- **Deliverable:** All features complete, ≥100 seed cases, demo recording

---

## 10. ACCEPTANCE CRITERIA (45 ACs)

### TB-005 (Test Cases Table)

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC001 | Test case schema complete | Database migrations M012-M015 applied | SELECT * FROM test_cases | Table exists with columns (id, project_id, title, type, priority, created_by, created_at, updated_at, deleted_at), foreign key to projects, unique constraint on project_id+title, indexes on (project_id, created_at) | P0 |
| MS3-AC002 | Case versioning schema | case_versions table exists | INSERT INTO case_versions | Every insert auto-creates version entry with snapshot, version_number auto-increments, rollback logic functional | P0 |
| MS3-AC003 | EP-060 GET /api/test-cases | Logged-in user, project selected, 50+ cases in DB | GET /api/test-cases?project_id=X&limit=10&offset=0 | Returns 200, cases array (id, title, priority, tags, coverage %), pagination metadata, total count | P0 |
| MS3-AC004 | EP-060 POST /api/test-cases | Logged-in QA user, valid case object (title, type: BDD\|Traditional, priority P0–P3) | POST /api/test-cases {title, type, priority, steps: []} | Returns 201, case object with id, created_by set to current user, created_at, version_number=1 | P0 |
| MS3-AC005 | EP-060 GET /api/test-cases/{id} | Case exists, user has read access | GET /api/test-cases/123 | Returns 200, full case (id, title, steps array, tags, RTM links, version history) | P0 |
| MS3-AC006 | EP-060 PATCH /api/test-cases/{id} | Case exists, user has write access | PATCH /api/test-cases/123 {title: "new"} | Returns 200, case updated, new version created (version_number incremented), audit log entry | P0 |
| MS3-AC007 | EP-060 DELETE /api/test-cases/{id} | Case exists, user has delete access (Lead+) | DELETE /api/test-cases/123 | Returns 204, case soft-deleted (deleted_at set), case hidden from GET list, audit log entry | P1 |
| MS3-AC008 | RBAC enforcement (case-level) | QA user, Lead user, Admin user | Create case as QA, Approve as Lead, Bulk-delete as Admin | QA can create own cases; Lead can bulk-delete any cases; Mgmt cannot delete; 403 Forbidden for unauthorized | P0 |
| MS3-AC009 | Unit test coverage (CRUD) | Test suite running | npm test -- crud.test.ts | 85%+ line coverage for case CRUD endpoints, all happy + error paths covered (404, 409 conflict, 403 Forbidden) | P1 |

### TipTap Editor

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC010 | TipTap custom nodes designed | Figma mockup approved | Review node structure (BDD block, step block, expected-result block) | All 3 custom nodes defined, slash commands documented, block nesting rules clear | P0 |
| MS3-AC011 | BDD + Traditional block nodes render | Editor page loaded | Toggle between BDD/Traditional mode on new case | BDD mode shows Given/When/Then fields, Traditional mode shows Step/Expected Result fields, placeholder text visible, no errors in console | P0 |
| MS3-AC012 | Mode-switch preserves content | Case with 3 BDD steps (Given, When, Then) | Click "Switch to Traditional" | Content preserved, BDD steps converted to Traditional steps (Given→Step 1, When→Step 2, Then→Step 3), user sees confirmation modal | P0 |
| MS3-AC013 | Case editor page functional | User navigates to /app/test-cases/123 | Page loads, TipTap editor rendered, case title/steps displayed, sidebar nav visible, breadcrumb shows project | Editor responsive, no layout shift, keyboard focus trap inside editor, Ctrl+S save works | P0 |
| MS3-AC014 | Case list page (3-pane) | User navigates to /app/test-cases | Page loads | Left: folder tree (filter by priority/tag), Middle: sortable list (name, type, priority, modified date), Right: detail preview; click case in list → preview updates | P0 |
| MS3-AC015 | TipTap editor → API integration | User edits case in editor, clicks Save | PATCH /api/test-cases/123 sent | Case updated in DB, new version created, version_number incremented, user sees success toast, sidebar updates modified date | P0 |
| MS3-AC016 | Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y) | Case editor open | Press Ctrl+S | Case saved (same as Save button), Ctrl+Z undoes last edit, Ctrl+Y redoes last undo | P1 |
| MS3-AC017 | TipTap component unit tests | Test suite running | npm test -- tiptap.test.tsx | 80%+ coverage for custom nodes, mode-switch logic, content preservation | P1 |

### A1 Test Case Generator

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC018 | A1 system prompt drafted | AI Eng reviewed prompt | Review A1_system_prompt.md | Prompt includes instructions (BDD case gen from requirements), examples (2–3 golden cases), constraints (no duplicate logic), tone (professional, specific) | P0 |
| MS3-AC019 | A1 InputProcessor node working | Test case generation triggered | LangGraph executes InputProcessor node | Input parsed, PRD/US/Jira/KB context extracted, KB RAG retrieves top-3 relevant entries, context <2000 tokens | P0 |
| MS3-AC020 | A1 CaseGenerator node produces cases | InputProcessor complete | LangGraph executes CaseGenerator node | Ollama called with system prompt + context, returns 10 cases in JSON format {cases: [{title, type, steps}]}, no parse errors | P0 |
| MS3-AC021 | A1 ConfidenceScorer assigns badges | CaseGenerator output received | ConfidenceScorer node processes cases | Each case assigned confidence (High/Medium/Low), confidence % extracted (0–100), no case without score | P0 |
| MS3-AC022 | EP-061 async generation working | User clicks "A1 Generate" in UI | POST /api/agents/a1/generate {input_type: "prd", input_text: "..."} sent | Returns 202, job_id returned, user sees loading spinner, Hatchet queues job, Langfuse logs generation event | P0 |
| MS3-AC023 | A1 auto-approval rate ≥80% | 60 cases tested (10 per category: auth, CRUD, error, form, nav, integration) | AI Eng measures cases needing zero edits (confidence ≥80%) | ≥80% of cases approved without user edit (target 80% as exit gate) | P0 |
| MS3-AC024 | Langfuse logging for A1 | A1 generation completed | View Langfuse dashboard | Every A1 call logged (input, output, latency, confidence, cost), tracing shows node tree | P1 |

### A1 Clarification Questions

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC025 | Clarification prompt + ClarificationAsker node | A1 prompted to generate cases | LangGraph branching logic evaluates input confidence | If low confidence (<70%), pause and call ClarificationAsker node; otherwise skip gate | P0 |
| MS3-AC026 | Branching logic implemented | A1 generation triggered on ambiguous input | LangGraph evaluates confidence after InputProcessor | Low-confidence input branches to ClarificationAsker; high-confidence input skips gate and proceeds to CaseGenerator | P0 |
| MS3-AC027 | EP-061 supports clarification flow | User requests generation → low confidence triggers gate | POST /api/agents/a1/generate returns {status: "clarification_pending", questions: [{q: "...", type: "text"}]} | UI receives questions, user answers via UI modal, POST /api/agents/a1/answer {clarification_answers: [...]} sent to resume | P0 |
| MS3-AC028 | Clarification modal UI functional | A1 reaches clarification gate | Modal displays 2–3 questions (read-only), text inputs for answers, "Continue Generation" button | User fills answers, clicks button, answers sent via WebSocket/polling, UI shows "Generating..." | P0 |
| MS3-AC029 | Clarification latency <2s | Clarification modal shown, user submits answers | Latency from submit to resume generation | Total elapsed time ≤2s (question ask + user answer + resume processing) | P1 |

### A2 Dedup

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC030 | A2 similarity thresholds defined | A2 algorithm documented | Review similarity threshold table | Thresholds: exact ≥0.95, near ≥0.85, similar ≥0.75; rationale documented (from testing) | P0 |
| MS3-AC031 | EP-062 /api/agents/a2/similar working | Case title entered in editor | POST /api/agents/a2/similar {case_title: "..."} sent | Returns 200, array of 3 candidates (case_id, similarity_score, title), sorted by score descending | P0 |
| MS3-AC032 | pgvector query optimized | Similarity query on 100+ cases | Query latency <500ms | HNSW index created, queries return in ≤500ms, batch embedding cached | P1 |
| MS3-AC033 | A2 accuracy on seed corpus (50 cases) | 50 seed cases embedded + queried | Measure recall (true duplicates found) and precision (false positives) | Recall ≥70% (finds ≥70% of known duplicates at ≥0.85 threshold), Precision ≥80% (≤20% false positives) | P0 |
| MS3-AC034 | Langfuse logging for A2 | A2 dedup check triggered | View Langfuse dashboard | Every dedup check logged (input, similarity scores, returned candidates, user action: merge/dismiss) | P1 |

### A2 Live Chips

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC035 | Dedup chip UI designed | Figma mockup approved | Review chip component spec (badge, match %, Merge button, Dismiss button, case link) | Design finalized, responsive on mobile/desktop, color scheme matches theme | P0 |
| MS3-AC036 | Dedup chips render live | User typing in case title field | After keystroke (debounce 500ms) | Top-3 candidates appear as chips below input, showing [candidate case title] (87% match), responsive grid layout | P0 |
| MS3-AC037 | Chips call EP-062 on keystroke | Case title field changes | Debounced call to /api/agents/a2/similar sent | Chips update <500ms after user stops typing | P0 |
| MS3-AC038 | Merge action combines cases | User sees dedup chip, clicks "Merge" | Backend calls merge handler | Old case steps/tags copied to new case, old case archived, RTM links updated, audit log created, UI refreshes | P0 |
| MS3-AC039 | Dismiss action hides chip | User clicks "Dismiss" on chip | Chip disappears from list, preference stored in session | Chip not suggested again in this session | P1 |
| MS3-AC040 | Chips latency <500ms | User types in editor | Time from keystroke to chip display | Debounce + fetch + render ≤500ms | P1 |

### RTM + Tags + Sparklines

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC041 | RTM linking API working | Case open, click "Link Requirement" | POST /api/test-cases/123/link-requirement {requirement_id: "REQ-001"} | Link created, coverage % recalculated (linked cases / total cases in requirement), 200 returned | P0 |
| MS3-AC042 | RTM UI modal functional | User clicks "Link Requirement" button | Modal shows Jira issue search, user selects issue, clicks "Link" | Case linked, modal closes, RTM section updated in case detail | P0 |
| MS3-AC043 | Tags CRUD working | Case open, click "Add Tag" | POST /api/test-cases/123/tags {tag_name: "smoke"} | Tag added, case filterable by tag on list page, tag suggestion list auto-populated from KB entries | P0 |
| MS3-AC044 | Stability sparkline renders | Case detail open, "Stability" section visible | Sparkline chart <100px wide shows 7-day trend | Sparkline visible (MVP: mock data showing flat trend until M4 test runs seeded) | P1 |

### Bulk Import

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC045 | Bulk import UI + 5 adapters working | User navigates to /app/test-cases/import | Selects format (CSV/TestRail/Zephyr/Xray/qTest), uploads file | Cases parsed, preview shown (title, type, steps count), import button, success message, cases appear in case list | P0 |
| MS3-AC046 | CSV format parsed correctly | CSV uploaded (columns: title, type, steps, priority, tags) | File processed | 10 cases imported, steps split by newline, tags parsed as comma-separated, no validation errors | P0 |
| MS3-AC047 | Bulk import handles 100 cases | 100-case file uploaded (one format) | Import completed | All 100 cases created, import latency ≤30s, audit log shows bulk import event | P1 |

### Versioning

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC048 | Version history UI functional | Case with 3 versions, click "History" | Version list shows (date, user, change_reason) | List sorted by date descending, each version clickable to view diff | P0 |
| MS3-AC049 | Rollback to prior version | User selects version 2 (of 3), clicks "Rollback" | PATCH /api/test-cases/123/rollback-to-version {version_id: v2} | Case reverted to version 2 content, new version created (v4 = rollback to v2), audit log shows rollback action | P0 |
| MS3-AC050 | Version diff view (side-by-side) | Versions v1 and v2 compared | Diff view shows [old field value] → [new field value] | Changes highlighted, responsive layout, back button to history list | P0 |

### Integration + Polish

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| MS3-AC051 | Accessibility audit passed (WCAG 2.2 AA partial) | Editor page, case list, modals | Run axe accessibility scan, keyboard-only navigation | No critical accessibility violations, keyboard focus order correct, color contrast ≥4.5:1, screen reader compatible | P1 |
| MS3-AC052 | E2E demo journey working (5 min) | Demo script: Create → A1 Gen → Dedup → RTM → Bulk Import | Execute journeys in order | All 5 steps complete without errors, demo recordable in <5 minutes | P0 |

---

## 11. API CONTRACTS (M3 Scope)

All endpoints in OpenAPI 3.1 format. Only NEW or MODIFIED endpoints in M3 listed below (M0–M2 endpoints inherited as-is).

### Test Case CRUD (EP-060)

```yaml
GET /api/test-cases:
  summary: List test cases
  parameters:
    - name: project_id
      in: query
      required: true
      schema: { type: string, format: uuid }
    - name: priority
      in: query
      schema: { type: string, enum: [P0, P1, P2, P3] }
    - name: tag
      in: query
      schema: { type: string }
    - name: limit
      in: query
      schema: { type: integer, default: 10 }
    - name: offset
      in: query
      schema: { type: integer, default: 0 }
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              cases: { type: array, items: { $ref: '#/components/schemas/TestCase' } }
              total: { type: integer }
              limit: { type: integer }
              offset: { type: integer }

POST /api/test-cases:
  summary: Create test case
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          properties:
            title: { type: string, minLength: 5 }
            type: { type: string, enum: [BDD, Traditional] }
            priority: { type: string, enum: [P0, P1, P2, P3], default: P2 }
            steps: { type: array, items: { type: object } }
          required: [title, type]
  responses:
    201:
      content:
        application/json:
          schema: { $ref: '#/components/schemas/TestCase' }

GET /api/test-cases/{id}:
  summary: Get test case details
  parameters:
    - name: id
      in: path
      required: true
      schema: { type: string, format: uuid }
  responses:
    200:
      content:
        application/json:
          schema: { $ref: '#/components/schemas/TestCaseDetail' }
    404: { description: Case not found }

PATCH /api/test-cases/{id}:
  summary: Update test case
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            title: { type: string }
            priority: { type: string }
            steps: { type: array }
  responses:
    200:
      content:
        application/json:
          schema: { $ref: '#/components/schemas/TestCase' }
    409: { description: Conflict (case modified by another user) }

DELETE /api/test-cases/{id}:
  summary: Delete test case (soft delete)
  responses:
    204: { description: Deleted }
```

### A1 Test Case Generator (EP-061)

```yaml
POST /api/agents/a1/generate:
  summary: Generate test cases from requirement
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          properties:
            input_type: { type: string, enum: [prd, user_story, jira_ticket, kb_doc] }
            input_text: { type: string, minLength: 20 }
            project_id: { type: string, format: uuid }
          required: [input_type, input_text, project_id]
  responses:
    202:
      content:
        application/json:
          schema:
            type: object
            properties:
              job_id: { type: string }
              status: { type: string, enum: [queued, analyzing, clarification_pending, generating, complete] }
              questions: { type: array, items: { type: object } }

GET /api/agents/a1/generate/{job_id}:
  summary: Poll generation status
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              status: { type: string }
              cases: { type: array, items: { $ref: '#/components/schemas/GeneratedCase' } }
              confidence_stats: { type: object }

POST /api/agents/a1/answer:
  summary: Resume generation after clarification
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            job_id: { type: string }
            clarification_answers: { type: array, items: { type: string } }
  responses:
    202: { description: Generation resumed }
```

### A2 Dedup (EP-062)

```yaml
POST /api/agents/a2/similar:
  summary: Find semantically similar test cases
  requestBody:
    required: true
    content:
      application/json:
        schema:
          type: object
          properties:
            case_title: { type: string }
            case_text: { type: string }
            project_id: { type: string, format: uuid }
            limit: { type: integer, default: 3 }
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              candidates: { type: array, items: { type: object, properties: { case_id: { type: string }, similarity_score: { type: number }, title: { type: string } } } }
```

### RTM Linking (EP-060 extend)

```yaml
POST /api/test-cases/{id}/link-requirement:
  summary: Link case to requirement (RTM)
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            requirement_id: { type: string }
  responses:
    200:
      content:
        application/json:
          schema: { type: object, properties: { coverage_percent: { type: number } } }

DELETE /api/test-cases/{id}/link-requirement/{requirement_id}:
  summary: Unlink case from requirement
  responses:
    204: { description: Unlinked }
```

### Tags (New Endpoints)

```yaml
POST /api/test-cases/{id}/tags:
  summary: Add tag to case
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            tag_name: { type: string }

DELETE /api/test-cases/{id}/tags/{tag_name}:
  summary: Remove tag
  responses:
    204: { description: Removed }

GET /api/test-cases/tags/suggestions:
  summary: Get suggested tags from KB
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              suggestions: { type: array, items: { type: string } }
```

### Versioning (New Endpoints)

```yaml
GET /api/test-cases/{id}/versions:
  summary: List case versions
  responses:
    200:
      content:
        application/json:
          schema:
            type: object
            properties:
              versions: { type: array, items: { type: object } }

GET /api/test-cases/{id}/versions/{version_id}:
  summary: Get case at specific version
  responses:
    200:
      content:
        application/json:
          schema: { $ref: '#/components/schemas/TestCaseDetail' }

PATCH /api/test-cases/{id}/rollback-to-version/{version_id}:
  summary: Rollback case to prior version
  responses:
    200:
      content:
        application/json:
          schema: { $ref: '#/components/schemas/TestCase' }
```

### Bulk Import (New Endpoint)

```yaml
POST /api/test-cases/bulk-import:
  summary: Bulk import cases from file
  requestBody:
    content:
      multipart/form-data:
        schema:
          type: object
          properties:
            project_id: { type: string, format: uuid }
            format: { type: string, enum: [csv, testrail, zephyr, xray, qtest] }
            file: { type: string, format: binary }
  responses:
    202:
      content:
        application/json:
          schema:
            type: object
            properties:
              job_id: { type: string }
              cases_imported: { type: integer }
              preview: { type: array, items: { type: object } }
```

---

## 12. DATABASE CHANGES (M3 Scope)

### Migrations M012–M015

**Migration M012:** Create TB-005 (test_cases table)

```sql
CREATE TABLE test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(20) CHECK (type IN ('BDD', 'Traditional')) NOT NULL DEFAULT 'BDD',
  priority VARCHAR(3) CHECK (priority IN ('P0', 'P1', 'P2', 'P3')) DEFAULT 'P2',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(project_id, title),
  INDEX idx_project_created (project_id, created_at),
  INDEX idx_created_by (created_by)
);
```

**Migration M013:** Create TB-005a (test_steps table)

```sql
CREATE TABLE test_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  content TEXT NOT NULL,
  expected_result TEXT,
  step_type VARCHAR(20) CHECK (step_type IN ('BDD_GIVEN', 'BDD_WHEN', 'BDD_THEN', 'STEP', 'EXPECTED')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, step_order),
  INDEX idx_case (case_id)
);
```

**Migration M014:** Create TB-005b (case_tags table)

```sql
CREATE TABLE case_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, tag_name),
  INDEX idx_case (case_id),
  INDEX idx_tag (tag_name)
);
```

**Migration M015:** Create TB-005c (case_versions table) + pgvector HNSW index

```sql
CREATE TABLE case_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  case_content_snapshot JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_reason VARCHAR(500),
  UNIQUE(case_id, version_number),
  INDEX idx_case_version (case_id, version_number)
);

-- pgvector HNSW index for A2 dedup
CREATE TABLE case_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE,
  title_embedding vector(768),
  content_embedding vector(768),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_case (case_id),
  INDEX idx_title_embedding USING HNSW (title_embedding vector_cosine_ops),
  INDEX idx_content_embedding USING HNSW (content_embedding vector_cosine_ops)
);

-- Case requirements (RTM linking)
CREATE TABLE case_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  requirement_id VARCHAR(100) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(case_id, requirement_id),
  INDEX idx_case (case_id),
  INDEX idx_requirement (requirement_id)
);
```

**Trigger:** Auto-increment version_number

```sql
CREATE FUNCTION increment_case_version() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO case_versions (case_id, version_number, case_content_snapshot, created_by, change_reason)
  VALUES (NEW.id, 1, row_to_json(NEW), NEW.created_by, 'Initial version');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_version_trigger
AFTER INSERT ON test_cases
FOR EACH ROW
EXECUTE FUNCTION increment_case_version();
```

---

## 13. TESTING STRATEGY

### Unit Tests

- **Target:** ≥85% line coverage for test case CRUD endpoints
- **Framework:** Jest + @nestjs/testing
- **Scope:** test_cases service, test_steps service, case_tags service, RBAC guards
- **CI Gate:** Coverage <85% blocks merge

### Integration Tests

- **Scope:** CRUD → DB → API response chain; A1 generator → Hatchet queue → response polling; A2 dedup → pgvector query → results
- **Framework:** Supertest (NestJS) + custom fixtures
- **Test Data:** 50 seed cases pre-loaded for each test suite
- **CI Gate:** All integration tests must pass

### E2E Tests

- **Framework:** Playwright
- **Critical Journeys:**
  1. Create test case (manual entry) → verify in DB → edit → save → verify version created
  2. A1 generation: paste PRD → answer clarification questions → receive 10 cases → accept selected → verify in list
  3. A2 dedup: type case title → see chip suggestions → click Merge → verify old case archived
  4. RTM linking: open case → click "Link Requirement" → search Jira → link → verify coverage % updated
  5. Bulk import: select CSV file → preview → import → verify 10 cases in list
- **CI Gate:** All E2E journeys must pass before staging deploy

### Performance Tests

- **TipTap Editor Latency:** p95 keystroke-to-render <200ms
- **A1 Generation Latency:** ≤30s from POST to job completion (including Ollama call)
- **A2 Query Latency:** ≤500ms for similarity search on 100+ cases
- **Clarification Gate:** ≤2s from question display to resume processing

### Security Tests

- **RBAC:** QA cannot delete cases, Lead cannot approve another's cases, Mgmt cannot write
- **Data Isolation:** Cases from Project A not visible in Project B list queries
- **SQL Injection:** All inputs validated, parameterized queries, no raw SQL
- **XSS:** TipTap HTML sanitization, no script execution in case content

---

## 14. FEATURE FLAG STRATEGY

### Flags Introduced in M3

| Flag Name | Feature | Default (M3) | Rollout Phase | Kill Switch | Retirement |
|-----------|---------|---|---|---|---|
| **ff_a1_enabled** | A1 Test Case Generator | OFF | Dark → Internal (w6) → Canary 5% (w7) → GA | `unleash disable ff_a1_enabled` | 30 days post-GA (2026-10-28) |
| **ff_a2_live_chips** | A2 Dedup live chips | OFF | Dark → Canary 1% (w6) → GA | `unleash disable ff_a2_live_chips` | 30 days post-GA (2026-10-28) |
| **ff_bulk_import_testrail** | Bulk import from TestRail | OFF | Dark (w5) → Internal (w6) → GA | `unleash disable ff_bulk_import_testrail` | 30 days post-GA (2026-10-28) |
| **ff_bdd_mode** | BDD test case editor | OFF | Dark (w4) → Internal (w5) → Canary 10% (w6) → GA | `unleash disable ff_bdd_mode` | 30 days post-GA (2026-10-28) |

### Feature Flag Logic

**In Code:**

```typescript
// NestJS guard for A1 generation endpoint
if (!unleash.isEnabled('feature_ai_a1_case_gen', { userId })) {
  throw new ForbiddenException('A1 Test Case Generator not yet enabled for your user');
}
```

**Rollout Strategy:**

- **Week 6 (Dark Launch):** Internal testing only (Iksula team)
- **Week 7 (Internal):** Enabled for all internal users (Iksula pilots); A1 metrics tracked in Langfuse
- **Week 8 (Canary):** 5% of external users (based on user_id hash); monitor error rate, latency, approval rate
- **Week 9+ (GA):** Roll out to 100% if metrics healthy

---

## 15. RISKS & MITIGATIONS

| Risk ID | Description | Probability | Impact | Mitigation | Owner | Escalation |
|---------|---|---|---|---|---|---|
| **R-001** | A1 hallucination: generates invalid BDD syntax or nonsensical steps | High (0.6) | High (0.8) | (1) Clarification Questions gate filters low-confidence inputs; (2) Golden dataset of 60 cases for prompt tuning; (3) Human audit of top-20 outputs weekly; (4) If auto-approval <60%, revert to manual authoring | AI Eng | Escalate if <70% auto-approval by day 9 |
| **R-002** | Clarification UX confusion: users don't understand what to answer or how to resume | Medium (0.5) | High (0.7) | (1) Clear UI copy ("Please answer these questions to improve generation"); (2) Example answers in modal; (3) E2E test journey with 3 users; (4) A/B test copy variants if user confusion >30% | Frontend Lead | Escalate if modal abandonment >20% |
| **R-003** | A2 false-positive dedup: suggests merging non-duplicate cases | Medium (0.4) | High (0.7) | (1) Strict threshold tuning (0.95 for exact, 0.85 for near); (2) Seed corpus tested (50 cases); (3) Manual audit of false positives; (4) If false-positive rate >10%, lower thresholds or disable A2 chips | AI Eng | Escalate if false-positive >15% |
| **R-004** | Bulk import field mapping: CSV columns don't align with TestRail/Zephyr formats | Medium (0.3) | Medium (0.6) | (1) Per-format adapter (5 total); (2) Preview before import (table of parsed columns); (3) Error messages for unmapped fields; (4) Support mapping UI if >20% import failures | Backend | Escalate if import success <95% |
| **R-005** | Gemma latency: Ollama response time degrades >1s on Oracle VM | Medium (0.5) | Medium (0.6) | (1) Monitor Ollama latency daily (p95 <2s); (2) Cache frequent prompts; (3) If latency spikes, trigger auto-restart of Ollama container; (4) Fallback to Gemini 2.5 Flash (free tier) if Ollama offline >5min | DevOps | Escalate if p95 latency >3s for 10min |
| **R-006** | TipTap BDD rendering: custom nodes don't render consistently across browsers | Low (0.3) | Medium (0.5) | (1) E2E tests on Chrome/Firefox/Safari; (2) CSS reset to ProseMirror defaults; (3) If rendering broken, revert to simpler block structure | Frontend | Escalate if >1 browser broken |
| **R-007** | Version storage growth: case_versions table grows 10GB/month if every keystroke creates version | Medium (0.4) | Low (0.5) | (1) Debounce version creation (only on save, not per keystroke); (2) Archive old versions (>90 days) to cold storage; (3) Monitor table size weekly | Backend | Escalate if versions table >5GB |
| **R-008** | Embedding cost: BGE embeddings slow down A2 on large corpus (1000+ cases) | Low (0.2) | Medium (0.4) | (1) Async embedding job (Hatchet queue); (2) Cache embeddings (TTL 7 days); (3) If latency >2s, batch smaller chunks | Backend | Escalate if dedup query >5s |
| **R-009** | pgvector scale ceiling: HNSW index performance degrades >1000 cases | Medium (0.3) | High (0.6) | (1) Pre-test on 5000-case corpus; (2) Monitor query time (p95 <500ms); (3) If scale limit hit, document Qdrant OSS migration path; (4) Scale to Hetzner before scale issues hit | Backend | Escalate if p95 query time >1s |

---

## 16. ROLLBACK PLAN

**Trigger Conditions (Any One Activates Rollback):**

1. A1 auto-approval rate drops below 60% (measurement via Langfuse)
2. A2 false-positive dedup rate exceeds 10% (user reports or automated detection)
3. TipTap editor rendering broken on >1 browser (E2E test failure)
4. Case CRUD API error rate >5% for ≥5 minutes
5. pgvector query latency >5s (p95) sustained for ≥5 minutes
6. Clarification gate modal UX confusion (>30% modal abandonment in Langfuse telemetry)

**Step-by-Step Rollback Process (Estimated RTO: <15 minutes):**

1. **Disable Feature Flags (≤2 min):**
   ```bash
   unleash disable feature_ai_a1_case_gen
   unleash disable feature_ai_a2_dedup
   # Users can still manually author cases via TipTap editor
   ```

2. **Stop Async Jobs (≤1 min):**
   ```bash
   kubectl scale deployment hatchet-worker --replicas=0
   # Existing jobs in queue drain before pod termination
   ```

3. **Revert Code (≤3 min):**
   ```bash
   git revert <commit_hash>
   git push origin main
   # Vercel auto-deploys reverting changes
   ```

4. **Verify API Health (≤2 min):**
   ```bash
   curl https://qanesus.internal/api/health
   # Expected: 200 OK
   ```

5. **Test CRUD Endpoints (≤2 min):**
   ```bash
   # Smoke test: Create, Read, Update, Delete a test case
   curl -X POST /api/test-cases # Should work
   curl -X GET /api/test-cases # Should work
   ```

6. **Database Rollback (if schema change caused issue):**
   - Run migration rollback: `npx typeorm migration:revert`
   - Restore from backup if data corruption: `pg_restore /backups/M3_schema_backup.sql`

7. **Notify Team (≤5 min):**
   - Slack: #qa-nexus-alerts: "M3 Rollback initiated at 14:32 UTC due to [reason]. Feature flags disabled. Users can still manually author cases."
   - PagerDuty: Alert on-call engineer

8. **Monitor Metrics (≥10 min):**
   - Watch Langfuse dashboard: A1/A2 calls should drop to zero
   - Watch SigNoz: API error rate should drop below 1%
   - Watch user feedback (Slack #feedback): "Can't see A1 Generate button?" expected; respond with "Feature temporarily disabled due to quality issues; manual case authoring still works."

**Post-Rollback Verification:**

- [ ] Feature flags confirmed OFF in Unleash UI
- [ ] Vercel deployment shows reverted commit
- [ ] API health check passes
- [ ] CRUD smoke test passes (create + read + update + delete)
- [ ] Database integrity check passed (run `SELECT COUNT(*) FROM test_cases`)
- [ ] Team notified in Slack + PagerDuty
- [ ] RCA initiated: "Why did A1/A2 fail? Prompt issue? Threshold miscalibration? Gemma latency?"

**Data Migration Reversal Strategy:**

If rollback requires schema revert:
1. If migrations are destructive (columns dropped), restore from backup taken before M3 start
2. If migrations are additive (new tables), keep tables; they won't cause issues if A1/A2 code is disabled
3. Test rollback plan on staging first (weekly DR drill recommended)

---

## 17. MILESTONE EXIT CRITERIA (Definition of Done)

**M3 Is Complete When ALL of These Are TRUE:**

**Code & Infrastructure:**

- [ ] All 60 tasks marked "Complete" (developer-driven)
- [ ] All code PRs merged to `main` with code review + CI/CD passing
- [ ] Migrations M012–M015 applied to staging + production
- [ ] pgvector HNSW index created and tested (query latency <500ms verified)
- [ ] Feature flags (A1/A2) created in Unleash (default OFF)
- [ ] Langfuse tracing live for all A1/A2 calls

**Acceptance Criteria Verification:**

- [ ] All 45 ACs verified by QA + Product Owner
- [ ] AC checklist signed off (signature in JIRA ticket or this document)

**Testing:**

- [ ] Unit tests: ≥85% coverage for CRUD endpoints (report in CI/CD dashboard)
- [ ] Integration tests: All passing (Hatchet + DB + API chain)
- [ ] E2E tests: All 5 critical journeys passing (Playwright on main)
- [ ] Security audit: RBAC enforcement verified, no XSS/SQLi, data isolation confirmed

**Performance:**

- [ ] A1 generation latency ≤30s (p95) for 10-case set
- [ ] A2 similarity query ≤500ms (p95) on 100-case corpus
- [ ] Clarification gate pause-to-resume ≤2s
- [ ] TipTap editor keystroke-to-render <200ms (p95)

**Data Quality:**

- [ ] ≥100 seed test cases created (mix of manual + A1-generated)
- [ ] A1 auto-approval rate measured ≥80% on golden dataset (60 cases across 6 categories)
- [ ] A2 false-positive rate <10% on seed corpus
- [ ] All test cases versioned; versions table has ≥100 entries

**Documentation:**

- [ ] API documentation updated (OpenAPI spec in README)
- [ ] Database schema documented (migrations readable, comments on complex logic)
- [ ] Prompt library documented (A1 system prompt, clarification prompt, A2 matching logic in `/docs/prompts/`)
- [ ] Deployment runbook updated (how to enable feature flags, how to rollback)
- [ ] E2E test coverage documented (5 journeys mapped to requirements in JIRA)

**Staging Verification:**

- [ ] Test case CRUD working end-to-end on staging.qanesus.internal
- [ ] A1 generator tested with 3 sample PRD snippets (confidence scores visible)
- [ ] A2 dedup tested with 10 pairs (mix of exact/near-duplicates) → chips display correctly
- [ ] Bulk import tested with 1 CSV, 1 TestRail, 1 Zephyr sample (≥5 cases each)
- [ ] Rollback plan tested (disable flags → verify A1/A2 UI disappears)

**Sign-Off:**

- [ ] PM (Product Owner) approval: "M3 scope delivered as specified"
- [ ] Tech Lead approval: "Code quality, test coverage, performance targets met"
- [ ] AI Eng Lead approval: "A1 + A2 agents performing as designed; confident in production readiness"
- [ ] DevOps Lead approval: "Deployments, monitoring, rollback runbooks documented"

---

## 18. DELIVERABLES CHECKLIST

| Artifact | Format | Status | Notes |
|----------|--------|--------|-------|
| **Test Case CRUD API** | NestJS endpoints (EP-060) | Target: July 5 | All CRUD operations, RBAC enforced |
| **TipTap Editor (BDD + Traditional)** | Next.js component | Target: July 5 | Mode-switch functional, 3 custom blocks |
| **A1 Test Case Generator** | LangGraph + FastAPI | Target: July 5 | ≥80% auto-approval measured, clarification gate working |
| **A2 Dedup Service** | pgvector + FastAPI | Target: July 5 | 3 thresholds tuned, <10% false positives |
| **RTM Linking** | NestJS + UI | Target: July 5 | Coverage % tracking, Jira issue linking |
| **Test Case Versioning** | TB-005c + rollback API | Target: July 5 | Audit trail complete, rollback tested |
| **Bulk Import Adapters** | CSV + TestRail + Zephyr + Xray + qTest | Target: July 5 | 5 formats supported, >95% import success |
| **Tags + Priority + Sparklines** | API + UI | Target: July 5 | Filter/sort by tag + priority, mock sparkline data |
| **Seed Data (100+ Cases)** | SQL + Hatchet factories | Target: July 5 | For M4 test run reference |
| **E2E Tests** | Playwright | Target: July 5 | 5 critical journeys automated |
| **Prometheus/Grafana Dashboards** | YAML + SigNoz | Target: July 5 | Case CRUD latency, A1 gen latency, A2 query latency monitored |
| **Langfuse Traces** | Dashboard | Target: July 5 | All A1/A2 calls logged; cost + quality visible |
| **Deployment Runbook** | Markdown | Target: July 5 | Feature flag enable/disable, rollback steps, troubleshooting |
| **API Documentation** | OpenAPI 3.1 YAML | Target: July 5 | All endpoints (EP-060, EP-061, EP-062, EP-063) documented |
| **Database Migration Scripts** | SQL (M012–M015) | Target: July 5 | All 4 migrations tested on staging |

---

## 19. TRACEABILITY MATRIX

All M3 tasks trace to PRD US-IDs and ERD identifiers (CO, EP, TB).

| PRD US-ID | Feature | M3 Tasks | M3 ACs | EP-IDs | TB-IDs | CO-IDs |
|-----------|---------|----------|--------|--------|--------|--------|
| **US-012** | "As a Jr QA, I can write 10 test cases in 5 min with A1 help" | MS3-T022–T035 | MS3-AC018–MS3-AC029 | EP-061 | TB-005a/b/c | CO-007, CO-019 |
| **US-013** | "As a Jr QA, I know if my test case is a duplicate before I save (A2)" | MS3-T036–MS3-T047 | MS3-AC030–MS3-AC040 | EP-062 | TB-005 | CO-007, CO-019 |
| **US-014** | "As a Lead, I link cases to requirements (RTM) to track coverage" | MS3-T048–MS3-T050 | MS3-AC041–MS3-AC042 | EP-060 extend | TB-005c | CO-007 |
| **US-015** | "As a Sr QA, I tag cases + set priority so they're sortable" | MS3-T051–MS3-T054 | MS3-AC043–MS3-AC044 | EP-060 extend | TB-005b | CO-007 |
| **US-016** | "As a Jr QA, I bulk-import cases from CSV/TestRail/Zephyr/Xray/qTest" | MS3-T055–MS3-T060 | MS3-AC045–MS3-AC047 | EP-063 | TB-005a/b | CO-007 |
| **GM-005** | "90% faster test case authoring (10× speedup vs. manual)" | MS3-T022–T028 | MS3-AC018–MS3-AC023 | EP-061 | TB-005 | CO-019 |
| **GM-006** | "A1 auto-approval rate ≥80% (confidence ≥80%, no edit needed)" | MS3-T027–T028, MS3-T040 | MS3-AC023, MS3-AC033 | EP-061 | TB-005 | CO-019 |
| **GM-007** | "A2 dedup accuracy: surfaces ≥1 true duplicate in demo (>70% match)" | MS3-T036–T047 | MS3-AC030–MS3-AC033 | EP-062 | TB-005 | CO-019 |

---

## 20. SHARED CONTEXT

### Dates (Canonical)

- **M3 Duration:** June 15 — July 5, 2026 (3 weeks, 21 days)
- **M3 Phases:** 9 phases, 2–3 days each
- **M3 Entry:** June 15 (Monday)
- **M3 Exit:** July 5 (Saturday) — Team reviews + sign-off Monday July 7
- **M4 Start:** July 6 (following Monday, back-to-back)

### Team (5 FTE)

- **Backend Engineer × 2:** CRUD API, A1/A2 endpoints, DB migrations, RTM logic
- **Frontend Engineer × 1.5:** TipTap editor, case list UI, dedup chips, bulk import UI, version history UI
- **AI Engineer × 1:** A1 prompt + LangGraph pipeline, A2 matching algorithm, Clarification Questions gate, threshold tuning
- **DevOps Engineer × 0.5:** Feature flag management, monitoring dashboards, production deployment, rollback procedures

### Velocity Buffer

- **Total Effort:** 60 tasks, ~840 hours
- **Velocity Buffer (20%):** 168 hours (reserved for unplanned bugs, context switches, spikes)
- **Committed Effort:** ~672 hours (~504 story points)
- **Per Week:** 224 hours committed (168 hours + 56 hours buffer per week)

### Infrastructure Available

- PostgreSQL 15 + pgvector (M0)
- Ollama Gemma 4 26B MoE (M1)
- FastAPI + LangGraph (M1)
- Hatchet job queue (M1)
- Langfuse tracing (M1)
- SigNoz APM (M0)
- Unleash feature flags (M0)
- Vercel CI/CD (M0)

### Key Success Metrics (Repeating)

- **Speedup:** ≥10× faster authoring (30s A1 gen vs. 2h manual)
- **Auto-Approval:** A1 ≥80% cases need zero user edits
- **Dedup Accuracy:** A2 surfaces ≥1 true duplicate; <10% false positives
- **Seed Data:** ≥100 test cases for M4 run assignment

---

## 20. FEATURE FLAG STRATEGY

Feature flags gate risky AI features behind per-project enablement. Default=off; Lead or Admin toggles on per project. Flag registry stored in `feature_flags` table (TB-017).

| Flag Key | Default | Scope | Rollout Criteria | Kill Switch |
|---|---|---|---|---|
| **a1_autopilot_mode** | off | per_project | A1 auto-approve rate ≥80% for 1 week on pilot | Any user can disable per-run |
| **a2_dedup_autoMerge** | off | per_project | A2 precision ≥95% verified | Lead can disable |
| **a1_kb_augmentation_v2** | off | per_user | Beta testers only (5 users) | Any user can revert to v1 |
| **a1_clarification_qa_gate** | off | per_project | QA gate blocks >5 ambiguous cases per week | Can disable for project |

**Rollout Process:**
1. New feature ships with flag **disabled**
2. Day 1–2: **Internal** rollout (Iksula team + 1–2 pilot projects)
3. Evaluation: Accuracy metrics, user feedback, false positive rates
4. If pass: **Canary 10–20%**, then graduated to **GA** (100%)
5. If fail: Debug + fix, or **Rollback** (disable flag)

**Every flag logs:** user_id, project_id, enabled_at, enabled_by, reason to `audit_log` (append-only).

---

## 21. NEXT MILESTONE PREVIEW (M4)

**M4: Test Execution, Defects & Jira Sync** (July 6 — August 2, 2026, 4 weeks)

### Scope (High-Level)

- **Test Run CRUD:** Create run (assign test cases, environment, assignee), update results (pass/fail/skip), capture evidence
- **Auto-Evidence Capture:** Screenshot + HAR + console logs + environment snapshot at test failure
- **A4 RCA (5-Layer):** Root Cause Analysis agent (stack trace → environment → config → code → data layers)
- **Defect CRUD:** Create defect from failing run, categorize (App/Test/Flaky/Env), add attachments
- **Jira 2-Way Sync:** OAuth 2.0 token flow, webhook receiver, status/assignee/comment mirroring
- **Jira Integration Health Monitoring:** Last sync time, sync failure rate, webhook delivery status

### Dependencies on M3

- **Test Case Library:** M4 uses ≥100 seed cases from M3 to populate test runs
- **A2 Dedup:** M4 reuses A2 dedup logic for semantic defect dedup (prevents duplicate defect creation)
- **RTM Links:** M4 test runs reference RTM-linked cases for traceability

### New Components

- **Test Execution Service (CO-008):** Test run CRUD, result tracking, evidence management
- **Defect Service (CO-009):** Defect CRUD, categorization, semantic dedup
- **A4 RCA Agent:** LangGraph pipeline (stack analysis, KB context, RCA reasoning)
- **Jira Integration Hub (CO-014):** OAuth 2.0, webhook, 2-way sync logic

### Risks Carried Forward from M3

- R-001 (A1 hallucination) → impacts A4 RCA quality
- R-002 (Gemma latency) → affects A4 inference time
- R-007 (pgvector scale) → affects A4 semantic search on defect corpus

---

## 22. APPENDIX

### A. RACI Matrix

| Role | Create Case | Approve Case | Generate Cases (A1) | Review Dedup (A2) | Link RTM | Bulk Import | View Reports |
|------|---|---|---|---|---|---|---|
| **Jr QA** | R/A | — | R/A | R | R | — | R |
| **Sr QA** | R/A | C | R/A | R/A | R/A | R/A | R |
| **QA Lead** | R | A | C | C | A | A | R/A |
| **QA Automation** | — | — | C (context) | — | R | A | R |
| **AI Engineer** | — | — | R/A | R/A | — | — | — |
| **Admin** | — | — | — | — | — | — | A |

**Legend:** R=Responsible (does work), A=Accountable (final say), C=Consulted (input), I=Informed (notified after)

### B. Glossary

| Term | Definition |
|------|-----------|
| **A1 Test Case Generator** | LangGraph agent that consumes PRD/US/Jira/KB context and generates 10+ BDD/Traditional test cases with confidence badges |
| **A2 Dedup** | Semantic similarity matching service using BGE embeddings + pgvector HNSW index to suggest duplicate case candidates |
| **BDD Mode** | Behavior-Driven Development format: Given (precondition), When (action), Then (expected outcome) |
| **Clarification Questions Gate** | HITL pause in A1 generation that asks 2–3 context questions before generating cases (filters low-confidence inputs) |
| **Confidence Badge** | High/Medium/Low score on generated case quality (based on Ollama output analysis); High cases auto-approved |
| **Dedup Chips** | Live UI suggestions (small badge cards) showing potential duplicate cases as user types case title; clickable "Merge" or "Dismiss" actions |
| **RTM (Requirement Traceability Matrix)** | Mapping of test cases to requirements (Jira issues); coverage % = (linked cases / total cases in requirement) × 100 |
| **pgvector** | PostgreSQL extension enabling vector similarity search (cosine similarity) via HNSW indexes |
| **Stability Sparkline** | Tiny line chart showing flakiness trend (pass rate) over 7 days; data source: test_results table from M4 runs |
| **TipTap** | Block-based editor framework (like Notion) built on ProseMirror; extensible with custom nodes |
| **Traditional Mode** | Sequential step format: Step 1 (action), Expected Result (outcome); useful for procedural test cases |

### C. Reference Links

- **PRD:** `/mnt/QA nexus MVP/PRD.md` § M3 (Test Cases + A1 + A2)
- **ERD:** `/mnt/QA nexus MVP/ERD.md` § TB-005 family, CO-007, CO-019, EP-060–EP-063
- **MILESTONE_REGISTRY:** `/mnt/QA nexus MVP/MILESTONE_REGISTRY.md` (DoR/DoD chain, shared context, feature flags)
- **M2 Exit Criteria:** `/mnt/QA nexus MVP/Milestone_M2_Test_Cases_A1_A2.md` § 16 (Definition of Done)
- **Deployment Runbook:** (TBD in M3 handoff)
- **Feature Flag Configuration:** Unleash UI @ https://unleash.internal/admin

### D. Prompt Library (Sample)

**A1 System Prompt (BDD Case Generation):**

```
You are a senior QA engineer helping to generate test cases from requirements documents.
Generate test cases in BDD (Given-When-Then) format. Each case must:
1. Start with clear preconditions (Given)
2. Specify a single user action (When)
3. Assert expected system behavior (Then)

Examples:
- Given: User logged in, cart has 3 items
  When: User clicks "Checkout"
  Then: Checkout form displays, subtotal calculated correctly

- Given: User has not verified email
  When: User logs in with email+password
  Then: Email verification modal appears

Constraints:
- Generate exactly 10 test cases
- Avoid duplicate cases (check similar cases in context)
- Do not include performance or load testing cases
- Tone: Professional, specific, measurable

Context (similar past cases):
{KB_CONTEXT_HERE}

Requirement:
{REQUIREMENT_TEXT_HERE}

Generate 10 test cases in JSON format:
{
  "cases": [
    {"title": "Login with valid credentials", "type": "BDD", "steps": [...]},
    ...
  ]
}
```

**A2 Similarity Matching Logic:**

```
Cosine Similarity Thresholds:
- ≥0.95: Exact duplicate (same case, possible copy-paste)
- ≥0.85: Near-duplicate (similar scope, same system area, likely merge candidate)
- ≥0.75: Similar (related but distinct; optional merge review)
- <0.75: Unique (no action needed)

For each threshold, display confidence badge + action button ("Merge" / "Dismiss")
```

### E. Sample Seed Data (10 Cases)

```json
[
  {
    "title": "User can log in with valid email and password",
    "type": "BDD",
    "priority": "P0",
    "steps": [
      {"step_type": "BDD_GIVEN", "content": "User is on login page"},
      {"step_type": "BDD_WHEN", "content": "User enters valid email and password, clicks Login"},
      {"step_type": "BDD_THEN", "content": "User redirected to dashboard, session token stored"}
    ]
  },
  {
    "title": "User cannot log in with invalid password",
    "type": "BDD",
    "priority": "P1",
    "steps": [
      {"step_type": "BDD_GIVEN", "content": "User account exists with email test@example.com"},
      {"step_type": "BDD_WHEN", "content": "User enters valid email but wrong password, clicks Login"},
      {"step_type": "BDD_THEN", "content": "Login fails, error message 'Invalid credentials' displayed"}
    ]
  }
]
```

### F. Deployment Checklist

- [ ] All PRs merged to `main`
- [ ] CI/CD pipeline green (linting, tests, type check)
- [ ] Migrations M012–M015 tested on staging
- [ ] Feature flags (A1/A2) registered in Unleash (default OFF)
- [ ] Langfuse tracing enabled for A1/A2 calls
- [ ] SigNoz dashboards created (case CRUD latency, A1/A2 latency)
- [ ] Rollback runbook documented + tested on staging
- [ ] Seed data (100 cases) loaded to staging
- [ ] E2E tests pass on staging environment
- [ ] Demo script recorded (5 min walkthrough)
- [ ] Team sign-off obtained (PM, Tech Lead, AI Eng, DevOps)
- [ ] Deployment approved by PM (feature flags OFF until canary phase)

---

**END OF MILESTONE M3 DOCUMENT**

**Version:** 1.0  
**Last Updated:** 2026-04-21  
**Status:** Ready for Development (Stakeholder Review Phase)

---

## SIGN-OFF BLOCK

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| **Product Manager** | [PM Name] | _____ | _____ | ☐ Approved |
| **Tech Lead** | [Tech Lead Name] | _____ | _____ | ☐ Approved |
| **AI Engineer Lead** | [AI Eng Name] | _____ | _____ | ☐ Approved |
| **DevOps Lead** | [DevOps Name] | _____ | _____ | ☐ Approved |

---
