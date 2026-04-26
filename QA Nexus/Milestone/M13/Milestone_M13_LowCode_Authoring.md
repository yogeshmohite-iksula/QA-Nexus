---
milestone_id: M13
parent_project_milestone: PM3
name: "Low-Code Authoring (A3)"
version: 1.0
date: 2026-04-22
phase: "[PM3]"
window: "W1–3 of PM3"
start_date: 2027-01-12
end_date: 2027-01-30
duration_weeks: 3
primary_agent: A3 (Low-Code Authoring)
status: "Planned"
---

# Milestone M13 — Low-Code Authoring (A3)

**QA Nexus v2 — Execution Blueprint**

**Version:** 1.0  
**Date Created:** 2026-04-23  
**Status:** Ready for Development  
**Duration:** 3 weeks (2027-01-12 → 2027-01-30)  
**Team:** Backend (1.5 FTE), Frontend (2 FTE), AI Eng (1 FTE), DevOps (0.5 FTE) = 5 FTE  
**Estimated Effort:** 65 tasks, ~900 hours (540 story points after 20% velocity buffer), 50+ acceptance criteria

---

## TABLE OF CONTENTS

1. [Cover Page](#1-cover-page)
2. [Executive Summary](#2-executive-summary)
3. [Context: What Was Delivered Before](#3-context-what-was-delivered-before)
4. [M13 Scope (Locked)](#4-m13-scope-locked)
5. [Tech Stack (M13 Slice)](#5-tech-stack-m13-slice)
6. [Definition of Ready (DoR)](#6-definition-of-ready-dor)
7. [Milestone Entry Criteria](#7-milestone-entry-criteria)
8. [Task Breakdown (8 Phases)](#8-task-breakdown-8-phases)
9. [Week-Wise Breakdown](#9-week-wise-breakdown)
10. [Acceptance Criteria (50+ ACs)](#10-acceptance-criteria-50-acs)
11. [API Contracts (M13 Scope)](#11-api-contracts-m13-scope)
12. [Database Changes (M13 Scope)](#12-database-changes-m13-scope)
13. [AI Agent Spec (A3)](#13-ai-agent-spec-a3)
14. [Testing Strategy](#14-testing-strategy)
15. [Feature Flag Strategy](#15-feature-flag-strategy)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Rollback Plan](#17-rollback-plan)
18. [Observability & Monitoring](#18-observability--monitoring)
19. [Milestone Exit Criteria (Definition of Done)](#19-milestone-exit-criteria-definition-of-done)
20. [Handoff & Documentation](#20-handoff--documentation)
21. [Next Milestone Preview (M14)](#21-next-milestone-preview-m14)
22. [Appendix](#22-appendix)

---

## 1. COVER PAGE

**QA Nexus v2 — Milestone M13**

**Low-Code Authoring (A3)**

*Notion-style automation editor: drag test steps, slash commands for actions, real-time code preview, one-click export to Playwright/Selenium/Cypress/WebdriverIO, reusable templates, A3 confidence scoring*

**Duration:** 3 weeks (Jan 12 — Jan 30, 2027)  
**Team:** 5 FTE (Backend × 1.5, Frontend × 2, AI Eng × 1, DevOps × 0.5)  
**Effort:** ~900 hours (~65 tasks, 50+ ACs, 20% velocity buffer)  
**Status:** [PM3] On Track

---

## 2. EXECUTIVE SUMMARY

**Mission:** Enable automation engineers to author production-grade Playwright, Selenium, Cypress, and WebdriverIO tests via a Notion-style visual editor — without hand-coding. Support drag-handle reordering of test steps, slash commands for common patterns (`/click`, `/fill`, `/wait`, `/assert`, `/screenshot`, `/api`), real-time syntax preview, reusable step templates, parameter substitution, and confidence-gated exports. Target: ≥3 automation engineers create ≥5 tests/day each by week 3.

**Key Deliverables:**

- **Low-Code Editor (React/TipTap):** Three-pane layout (test library | step canvas | code preview), drag-handle blocks, slash command palette, real-time syntax validation
- **A3 LangGraph Agent:** Generates valid Playwright/Selenium/Cypress/WebdriverIO code from step blocks; confidence scoring (High ≥90% / Medium 70–89% / Low <70%); Clarification Questions gate for ambiguous patterns
- **Four Code Generators:** Playwright (TypeScript, default), Selenium (Java/Python), Cypress (JavaScript), WebdriverIO (JavaScript); all export <5s p95 latency, syntax-verified, CI-ready
- **Reusable Step Templates:** Save/load/search common patterns (Login, API Call, Database Check); parameter binding (`[username]`, `[password]`); tag-based discovery
- **Two-Way Sync:** Import existing code-based tests → visual blocks (best-effort + human review); export visual blocks → runnable code
- **Data-Driven Testing:** CSV import for parametrized test scenarios; cartesian product expansion for multi-variable tests
- **Evidence Checkpoints:** Auto-take screenshot after step N; verify visual checkpoint (expected image); store in R2
- **Branching & Error Handling:** If/Else blocks for conditional logic, retry patterns, timeout configuration
- **Versioning & Collaboration:** Git-style history per test; branch+merge for team edits; comment threads per step

**Success Metrics (linked to PRD):**

- **GM-008 (Speedup):** ≥5× faster test authoring (visual 10 min vs. hand-code 50 min for 20-step test)
- **GM-009 (Auto-Export):** A3 ≥85% auto-export rate (confidence ≥90%, zero HITL review needed)
- **GM-010 (Code Quality):** ≥95% of exported tests run in CI without syntax error or selector failure
- **Deliver:** ≥50 reusable templates + ≥100 tests authored via A3 by EOD M13

**Rollback Trigger:** If A3 code generation <60% accuracy OR export syntax error rate >5%, disable A3 agent; revert to manual Playwright coding.

---

## 3. CONTEXT: WHAT WAS DELIVERED BEFORE

### PM1 + PM2 Baseline (Inherited)

**PM1 (MVP):**
- BetterAuth + 4-role RBAC (Admin, Lead, QA, Mgmt)
- Test case authoring (Notion TipTap editor, BDD + traditional modes, RTM linking)
- Test case generation (A1) with Clarification Questions gate, ≥80% confidence
- Deduplication (A2) live chips, semantic similarity scoring
- Bulk import (CSV, TestRail, Zephyr, Xray, qTest)
- Test execution (manual + Playwright runner), auto-evidence capture (screenshot, HAR, console, env)
- Defects (A4 5-layer RCA, Jira 2-way sync, 4-category classification)
- Basic reports (Daily/Weekly, simple Exec Dashboard), ROI calculator
- 12 doc templates with RAG context
- Infrastructure: PostgreSQL + pgvector, Redis, Ollama Gemma 4, Vercel+Oracle VM, SigNoz observability, CI/CD pipeline tested

**PM2 (v1.5):**
- Test data generation (A6) with provenance + version history
- Self-healing (A7) with background suggestions, approve-in-context gating
- A8 Advanced (risk-adaptive planning from code churn + defect patterns)
- AI Product Tester (APT) autonomous E2E scenario discovery + execution
- Visual regression testing (partner diff engine), mobile app (iOS/Android via Capacitor), on-prem Helm deployment
- 32 doc templates (+ 20 advanced)

### Key Assets for M13 Consumption

- **Playwright runner proven:** Headed + headless modes working, R2 artifact storage, Hatchet job queue stable
- **Test case library:** ≥500 cases with metadata (tags, priority, component, last_flake_date, covered_requirements)
- **RAG pipeline:** Test metadata indexed in pgvector, semantic search returns similar past steps/cases
- **A1 + A2 agents:** Case generation ≥80% confidence, dedup recall ≥70%
- **Automation suites table:** TB-019 created with schema ready (automation_suite_id, project_id, name, test_specs JSON, created_by, created_at)
- **Team trained:** QA automation engineers familiar with test case structure, Playwright API, selector strategies

### APIs Available at M13 Start

- EP-001 → EP-061: Auth, projects, KB, documents, test cases, test runs, defects, reports, audit log (all working from PM1+PM2)

### Data Available

- ≥500 seed test cases (from PM1 M3) with full metadata
- ≥100 Playwright scripts from M5 automation baseline
- KB seeded with 32 doc templates + 100+ automation patterns
- Ollama + LangGraph proven (A1 case gen, A2 dedup, A4 RCA, A7 self-heal)

### Agents Online

- FastAPI + LangGraph running (A1, A2, A4, A7 operational)
- Langfuse tracing live (all LLM calls logged)
- pgvector index operational (case + code pattern embeddings)

### Test Environment

- Staging.qanesus.internal with PM2 baseline + 100+ automation test specs
- E2E test framework (Playwright) operational
- CI/CD pipeline running GitHub Actions / GitLab CI

---

## 4. M13 SCOPE (LOCKED)

### IN SCOPE (M13 Owns)

| Feature | Component | Rationale |
|---------|-----------|-----------|
| **Automation Suite CRUD** | TB-019, TB-019a, TB-019b, EP-062 | Primary user journey; RBAC controls who can create/export |
| **A3 Low-Code Editor** | React/TipTap, test-step block nodes, slash commands | Notion-style UX; reuse TipTap from M3 test case editor |
| **Drag-Handle Blocks** | Custom TipTap extensions (action, selector, value, screenshot) | Reorder steps, grouped multi-select, drag between tests |
| **Slash Command Palette** | `/click`, `/fill`, `/wait`, `/assert`, `/screenshot`, `/api`, `/db`, `/conditional`, `/retry` | 8 primary patterns covering 80% of test cases |
| **A3 Code Generators** | LangGraph + Ollama for Playwright/Selenium/Cypress/WebdriverIO | 4 export targets, <5s p95 latency, syntax-verified |
| **Real-Time Code Preview** | Right pane shows generated code as user builds steps | TypeScript (Playwright default) syntax highlighting |
| **Reusable Templates** | Template CRUD, tag-based search, parameter substitution | Save "Login" step, reuse in 10 tests, bind `[username]` param |
| **Parameter Binding** | `[param_name]` syntax, runtime substitution on export | Enable data-driven testing, CSV import for parametrized runs |
| **CSV Import (Data-Driven)** | Parse CSV → expand cartesian product → generate test variants | 3 scenarios × 2 usernames × 2 passwords = 12 test variants |
| **Two-Way Code Sync** | Import Playwright/Selenium code → parse → visual blocks (best-effort) | Copy-paste existing code, OCR-style parsing, human review gate |
| **Evidence Checkpoints** | Auto-screenshot after step N, visual assertion, R2 store | Screenshot taken at step 5 vs. baseline; flag mismatch |
| **Branching & Conditions** | If/Else blocks, conditional step execution, retry patterns | If element not found, retry up to 3x with 1s backoff |
| **Versioning & History** | Git-style snapshot per export; rollback UI; branch+merge for collab | Track who exported what, when, to which framework |
| **A3 Confidence Scoring** | High ≥90% / Medium 70–89% / Low <70%; HITL gates | Red: blocks export; Amber: warn; Green: auto-approve |
| **Integration with A5** | Flag high-risk tests for M14 prioritization | Test selection in M14 can reference A3 confidence scores |

### OUT OF SCOPE (Deferred to M14/M15)

| Feature | Why | Target Milestone |
|---------|-----|---|
| **Mobile Test Authoring** | Requires mobile device / emulator integration (M2 shipped mobile app, but editor only covers web) | M16+ mobile-specific editor |
| **Visual Regression Detection** | Requires visual diff engine (partner integr., M2 shipped basic support) | M2 extension, not core M13 |
| **Performance Test Authoring** | Requires perf metrics + profiler integration (out of scope) | M16+ performance testing module |
| **Test Selection Integration** | Depends on A5 (M14) to be live first | M14 output, M13 can reference but no dependency |
| **Advanced Error Handling** | Network stub/mock patterns, API response scripting | M16 advanced patterns |
| **Headless Browser Recording** | Playwright Inspector codegen (v1: manual blocks only) | M16 codegen import |

---

## 5. TECH STACK (M13 SLICE)

| Component | Version | Purpose | Status (M13 Start) | Notes |
|-----------|---------|---------|---|---|
| **Next.js** | 14 | Frontend SSR, automation editor | Inherited (M0) | App Router |
| **TipTap / ProseMirror** | ^2.3.0 | Low-code editor blocks (action, selector, value) | Inherited (M3) + Extended | Reuse test-case editor patterns |
| **React** | 18 | UI components, canvas rendering | Inherited (M0) | Functional components, hooks |
| **NestJS** | ^10 | Backend API Gateway, suite CRUD | Inherited (M0) | New endpoints: EP-062 variants |
| **FastAPI** | ^0.104 | Python inference server (A3 agent) | Inherited (M1) | LangGraph orchestrator |
| **LangGraph** | ^0.1.0 | Agent orchestration (A3 code generation) | Inherited (M1) | Branching graphs for multi-language gen |
| **Ollama + Gemma 4** | Latest | Local LLM inference (code generation) | Inherited (M1) | 26B MoE, ~60ms/token |
| **Sentence-Transformers (BGE)** | ^3.0.0 | Embeddings for template search (A2 variant) | Inherited (M1) | Find similar templates by description |
| **pgvector** | ^0.7.0 | Vector similarity search (code patterns) | Inherited (M1) | HNSW index for fast template lookup |
| **PostgreSQL** | 15 | Relational DB (automation suites + versions) | Inherited (M0) | TB-019 family tables |
| **Hatchet** | Latest | Async job queue (A3 code generation) | Inherited (M1) | Queues code gen as async job |
| **Langfuse** | ^3.0.0 | LLM trace logging (A3 confidence, latency) | Inherited (M1) | Dashboard shows per-test gen cost + quality |
| **SigNoz** | Latest | APM + latency monitoring | Inherited (M0) | Tracks p95 editor latency, A3 gen latency |
| **Unleash** | Latest | Feature flags (A3 toggle) | Inherited (M0) | feature_ai_a3_low_code |
| **Playwright** | ^1.48 | E2E testing, code execution validation | New (M13) | Syntax-check exported tests locally |
| **Recharts** | 2.12+ | Code syntax highlighting (optional, for preview) | New (M13) | Prism.js or highlight.js for code display |

---

## 6. DEFINITION OF READY (DoR)

**M13 Cannot Start Until All These Are TRUE:**

- [ ] **M12 Exit Criteria Met:** 32-doc catalog stable, A7 self-heal blocking ≥40% flaky rework, on-prem deployment validated
- [ ] **Automation Suite Schema Ready:** TB-019 (automation_suites), TB-019a (test_steps), TB-019b (suite_versions) DDL reviewed, migrations tested on staging
- [ ] **Playwright Runner Proven:** Headed + headless modes working, ≥100 automation specs authored, R2 artifact storage verified
- [ ] **A3 Prompt Library Drafted:** System prompt (code gen from test steps), clarification prompt (ambiguous patterns), multi-language code templates (Playwright/Selenium/Cypress/WebdriverIO)
- [ ] **A1 + A2 Proven:** ≥80% auto-approval rate on test case generation (from M3), ≥70% recall on dedup
- [ ] **Ollama Online:** Health check passing, Gemma 4 model loaded, latency <2s per 100 tokens
- [ ] **pgvector Index Live:** ≥100 automation code patterns embedded + indexed (BGE-large-en), HNSW index created
- [ ] **LangGraph Pattern Proven:** Multi-language code generation tested in FastAPI (Playwright → TypeScript, Selenium → Java)
- [ ] **TipTap Foundation Stable:** Test case editor from M3 stable, no critical bugs in custom nodes
- [ ] **Design Approved:** Low-code editor mockups finalized (3-pane layout, slash commands, code preview)
| [ ] **Feature Flags Registered:** feature_ai_a3_low_code in Unleash (default OFF)
- [ ] **RBAC Guards Ready:** Suite-level permissions (QA creates, Lead approves exports, Automation Engineer can export)
- [ ] **Staging Data Fresh:** PM2 baseline + 100 automation specs copied to staging; ready for M13 testing
- [ ] **Team Trained:** Frontend + backend leads familiar with TipTap extension patterns, LangGraph multi-node orchestration

---

## 7. MILESTONE ENTRY CRITERIA

Before sprint kickoff, verify:

1. **Jira Project Ready:** QANESUS-M13 epic; stories: Suite CRUD, A3 Editor, Code Generators, Templates, Versioning, Testing
2. **Figma Handoff:** Low-code editor screens approved (3-pane layout, slash command menu, code preview, template browser)
3. **OpenAPI Spec:** EP-062 (Suite CRUD), EP-063 (A3 generate), EP-064 (template search) paths/methods/schemas drafted
4. **Database Schema:** TB-019/019a/019b DDL reviewed, indexes planned, audit trigger tested on migrations M020-M024
5. **A3 Prompt Library:** System prompt (code gen), clarification prompt (ambiguous cases), 4 language-specific code templates (Playwright/Selenium/Cypress/WebdriverIO) drafted + reviewed
6. **Test Data Factories:** Script to create 100 automation specs available (for M14 A5 impact analysis)
7. **Feature Flags:** A3 flag created in Unleash (default OFF); rollout strategy documented (dark → internal → canary → GA)
8. **Staging Data:** PM2 baseline copied; 100 automation specs seeded; ready for integration tests

---

## 8. TASK BREAKDOWN (8 PHASES)

### PHASE A: Automation Suite Schema + CRUD API (Days 1–3) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T001 | Design TB-019 automation_suites schema (id, project_id, name, framework Playwright\|Selenium\|Cypress\|WebdriverIO, test_specs JSON, version_number, created_by, created_at, updated_at, deleted_at) | Backend Lead | P0 | 8 | — | US-021 | M13-AC001 |
| M13-T002 | Design TB-019a test_steps schema (step_id, suite_id, step_order, action click\|fill\|wait\|assert\|screenshot\|api\|db\|conditional, selector, value, expected, retry_count, timeout_ms, screenshot_checkpoint) | Backend Lead | P0 | 8 | M13-T001 | — | M13-AC001 |
| M13-T003 | Design TB-019b suite_versions schema (version_id, suite_id, version_number, suite_specs_snapshot JSON, exported_framework, confidence_score, created_by, created_at, export_status success\|syntax_error\|runtime_fail) | Backend | P0 | 6 | M13-T001 | — | M13-AC002 |
| M13-T004 | Design TB-019c template_library schema (template_id, project_id\|global, template_name, step_json, param_list [param_name], tags [tag], confidence_score, created_by, usage_count, last_used_at) | Backend | P0 | 6 | M13-T001 | — | M13-AC003 |
| M13-T005 | Write migrations M020-M024 (create 4 tables, indexes, foreign keys, audit trigger for suite changes, template search index) | Backend | P0 | 14 | M13-T001–T004 | — | M13-AC001–AC003 |
| M13-T006 | Implement EP-062 GET /api/automation/suites (list, pagination 10/25/50, filter by project_id/framework/status, sort by name/modified) | Backend | P0 | 12 | M13-T005 | US-021 | M13-AC004 |
| M13-T007 | Implement EP-062 POST /api/automation/suites (create suite, validate name/framework, set created_by from session, return 201 + suite object) | Backend | P0 | 10 | M13-T005 | US-021 | M13-AC005 |
| M13-T008 | Implement EP-062 GET /api/automation/suites/{id} (fetch suite + steps + versions + template list; 200 or 404) | Backend | P0 | 10 | M13-T005 | — | M13-AC006 |
| M13-T009 | Implement EP-062 PATCH /api/automation/suites/{id} (update name/framework, create version entry, 200 or 409 conflict) | Backend | P0 | 12 | M13-T005 | — | M13-AC007 |
| M13-T010 | Implement EP-062 DELETE /api/automation/suites/{id} (soft-delete, audit log) | Backend | P1 | 6 | M13-T005 | — | M13-AC008 |
| M13-T011 | Add RBAC guards (Automation Engineer can create/export suites, Lead can bulk-delete, Mgmt can read-only) | Backend | P0 | 8 | M13-T005 | — | M13-AC009 |
| M13-T012 | Write unit tests for Suite CRUD endpoints (mock DB, test happy path + error cases, RBAC gates) | Backend | P1 | 12 | M13-T006–T010 | — | M13-AC010 |

**Phase A Total:** ~122 hours | **Critical Path:** M13-T005 (migrations) unblocks CRUD endpoints

---

### PHASE B: TipTap Low-Code Editor (Drag Blocks + Slash Commands) (Days 4–6) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T013 | Design TipTap custom extensions (action-block, selector-block, value-block, screenshot-block, conditional-block, retry-block) | Frontend Lead | P0 | 12 | — | US-022 | M13-AC011 |
| M13-T014 | Implement TipTap action block node (action dropdown: click/fill/wait/assert/screenshot/api/db/conditional, inline help, validation) | Frontend | P0 | 16 | M13-T013 | US-022 | M13-AC012 |
| M13-T015 | Implement TipTap selector block node (selector input: CSS/XPath/ID, selector hints from A3 RAG search, live validation on current page) | Frontend | P0 | 14 | M13-T013 | US-022 | M13-AC013 |
| M13-T016 | Implement drag-handle reordering (drag-to-reorder blocks, grouped multi-select, clone step, delete step, visual feedback) | Frontend | P0 | 12 | M13-T014–T015 | US-022 | M13-AC014 |
| M13-T017 | Implement slash command palette (`/click`, `/fill`, `/wait`, `/assert`, `/screenshot`, `/api`, `/db`, `/if`, `/retry`) | Frontend | P0 | 14 | M13-T013 | US-022 | M13-AC015 |
| M13-T018 | Build editor page (/app/automation/suites/[id], routing, breadcrumb, sidebar nav, 3-pane layout) | Frontend | P0 | 12 | M13-T014–T017 | — | M13-AC016 |
| M13-T019 | Build suite list page (sortable table: name, framework, step count, last modified, export status; filters, search) | Frontend | P0 | 10 | — | — | M13-AC017 |
| M13-T020 | Integrate editor with API (POST /create, PATCH /update, handle versions, conflict resolution, auto-save) | Frontend | P0 | 14 | M13-T018, M13-T007–T009 | — | M13-AC018 |
| M13-T021 | Implement real-time code preview (right pane shows generated code as user builds; refresh on each block change; syntax highlight) | Frontend | P0 | 16 | M13-T014–T020 | — | M13-AC019 |
| M13-T022 | Implement editor keyboard shortcuts (Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo, Cmd variants, Shift+Enter new block) | Frontend | P1 | 8 | M13-T018 | — | M13-AC020 |
| M13-T023 | Write TipTap component unit tests (custom nodes, drag reorder, slash commands, content preservation) | Frontend | P1 | 12 | M13-T013–T022 | — | M13-AC021 |

**Phase B Total:** ~140 hours | **Critical Path:** M13-T013 (design) → M13-T014/T015 (nodes) → M13-T016 (drag) → M13-T021 (preview)

---

### PHASE C: A3 Code Generator (LangGraph Multi-Language) (Days 7–10) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T024 | Draft A3 system prompts (4 language-specific: Playwright TS, Selenium Java/Python, Cypress JS, WebdriverIO JS; constraints, examples) | AI Eng | P0 | 12 | — | US-023 | M13-AC022 |
| M13-T025 | Build LangGraph node: StepParser (parse step blocks → normalized step object: {action, selector, value, expected, retry, timeout}) | AI Eng | P0 | 10 | M13-T024 | — | M13-AC023 |
| M13-T026 | Build LangGraph node: ContextEnricher (fetch RAG templates + past patterns for similar test cases; inject context for multi-language gen) | AI Eng | P0 | 12 | M13-T025 | — | M13-AC024 |
| M13-T027 | Build LangGraph node: CodeGenerator (call Ollama with system prompt + context, generate code, parse output, format for target language) | AI Eng | P0 | 16 | M13-T024–T026 | — | M13-AC025 |
| M13-T028 | Build LangGraph node: SyntaxValidator (parse generated code AST, validate syntax for each language, return error line + suggestion) | AI Eng | P0 | 12 | M13-T027 | — | M13-AC026 |
| M13-T029 | Build LangGraph node: ConfidenceScorer (extract confidence % from Gemma output, map to High/Medium/Low, validate range, recommend action) | AI Eng | P0 | 10 | M13-T027 | — | M13-AC027 |
| M13-T030 | Implement FastAPI endpoint EP-063 POST /api/agents/a3/generate (async via Hatchet, input: suite_id/framework, return job_id, SSE streaming support) | Backend | P0 | 14 | M13-T025–M13-T029 | — | M13-AC028 |
| M13-T031 | Test A3 generator on seed dataset (20 test specs per language: auth, CRUD, error, form; measure auto-approval, syntax errors) | AI Eng | P0 | 18 | M13-T027–T029 | — | M13-AC029 |
| M13-T032 | Tune A3 prompts based on test results (adjust constraints, examples, retry logic for low-confidence cases, per language) | AI Eng | P0 | 14 | M13-T031 | — | M13-AC030 |
| M13-T033 | Implement Langfuse logging for A3 (trace all inputs, outputs, latency, confidence, cost per language, model version) | AI Eng | P1 | 8 | M13-T030 | — | M13-AC031 |

**Phase C Total:** ~126 hours | **Critical Path:** M13-T024 (prompts) → M13-T025 (parser) → M13-T027 (gen) → M13-T029 (score)

---

### PHASE D: A3 Clarification Questions Gate (Days 11–12) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T034 | Draft clarification prompt (ask 2–3 context questions: target framework/browsers/timeout strategy/error handling) | AI Eng | P0 | 6 | — | US-023 | M13-AC032 |
| M13-T035 | Build LangGraph node: ClarificationAsker (call Ollama, generate 2–3 questions, format as JSON) | AI Eng | P0 | 10 | M13-T034 | — | M13-AC032 |
| M13-T036 | Implement branching logic (after input analysis: if ambiguous/incomplete, pause + ask questions; if clear, skip gate) | AI Eng | P0 | 10 | M13-T025, M13-T035 | — | M13-AC033 |
| M13-T037 | Extend EP-063 to support clarification flow (POST with input → return questions + await user answers via WebSocket/polling) | Backend | P0 | 14 | M13-T030, M13-T035 | — | M13-AC034 |
| M13-T038 | Build UI modal for clarification questions (display 2–3 questions, text inputs, "Continue" button, loading state) | Frontend | P0 | 10 | M13-T018, M13-T035 | — | M13-AC035 |
| M13-T039 | Test clarification gate latency (pause + resume must complete in ≤2s from question to resume) | Backend | P1 | 8 | M13-T035–T038 | — | M13-AC036 |

**Phase D Total:** ~58 hours | **Critical Path:** M13-T034 (prompt) → M13-T035 (asker) → M13-T036 (branching)

---

### PHASE E: Reusable Templates + Parameter Binding (Days 13–14) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T040 | Design template CRUD + parameter substitution logic (save/load/search templates, bind `[param_name]` at export time) | Backend Lead | P0 | 8 | — | US-024 | M13-AC037 |
| M13-T041 | Implement EP-064 GET /api/automation/templates (list, paginate, filter by tag, search by name/description using A2 RAG) | Backend | P0 | 10 | M13-T004, M13-T040 | — | M13-AC038 |
| M13-T042 | Implement template save/load (POST /api/automation/templates, clone step → save as template, reuse in other suites) | Backend | P0 | 12 | M13-T005, M13-T040 | — | M13-AC039 |
| M13-T043 | Implement parameter substitution on export (detect `[param]` tokens, prompt user for value at export time or use CSV bindings) | Backend | P0 | 10 | M13-T030, M13-T040 | — | M13-AC040 |
| M13-T044 | Build template browser UI (modal: list templates, filter by tag/search, click to insert into current suite, see preview) | Frontend | P0 | 12 | M13-T019, M13-T041 | — | M13-AC041 |
| M13-T045 | Test A2 RAG on 50 templates (measure recall/precision for similar template search by natural-language description) | AI Eng | P1 | 8 | M13-T041 | — | M13-AC042 |

**Phase E Total:** ~60 hours | **Critical Path:** M13-T040 (design) → M13-T042 (save/load) → M13-T044 (UI)

---

### PHASE F: Real-Time Code Export + Syntax Validation (Days 15–17) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T046 | Design code export logic (call A3 LangGraph, collect generated code, run syntax validator, return JSON with status/code/errors) | Backend Lead | P0 | 8 | — | US-025 | M13-AC043 |
| M13-T047 | Implement EP-065 POST /api/automation/suites/{id}/export (async via Hatchet, input: framework/target_branch, return job_id, support SSE for streaming) | Backend | P0 | 14 | M13-T030, M13-T046 | — | M13-AC044 |
| M13-T048 | Implement syntax validation per language (JavaScript/TypeScript AST, Java parser, Python AST, Cypress type checks) | Backend | P0 | 16 | M13-T046 | — | M13-AC045 |
| M13-T049 | Build export UI (Export button, framework selector, confidence gate [Red/Amber/Green], progress spinner, success/error message, download link) | Frontend | P0 | 12 | M13-T021, M13-T047 | — | M13-AC046 |
| M13-T050 | Implement code download flow (generate .ts / .js / .java file, sign URL with R2, prompt browser download) | Frontend | P0 | 10 | M13-T049, M13-T047 | — | M13-AC047 |
| M13-T051 | Test export latency + syntax validation accuracy (20 suites per framework; measure p95 export latency <5s, syntax error rate ≤5%) | QA | P1 | 12 | M13-T048–T050 | — | M13-AC048 |

**Phase F Total:** ~72 hours | **Critical Path:** M13-T046 (design) → M13-T047 (endpoint) → M13-T048 (validation)

---

### PHASE G: CSV Import for Data-Driven Testing (Days 18–19) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T052 | Design CSV import format (columns: param_name, value_1, value_2, ...; cartesian product expansion logic) | Backend Lead | P0 | 6 | — | US-026 | M13-AC049 |
| M13-T053 | Implement EP-066 POST /api/automation/suites/{id}/expand-data-driven (upload CSV, expand suite into N variants, return array of new suite IDs) | Backend | P0 | 12 | M13-T007, M13-T052 | — | M13-AC050 |
| M13-T054 | Build CSV import UI (file upload, preview table, cartesian product count, expand button, progress bar) | Frontend | P0 | 10 | M13-T019, M13-T053 | — | M13-AC051 |
| M13-T055 | Test CSV expansion (3 params × 2 values each = 8 variants; verify naming convention, parameter substitution in steps) | QA | P1 | 8 | M13-T053–T054 | — | M13-AC052 |

**Phase G Total:** ~36 hours | **Critical Path:** M13-T052 (design) → M13-T053 (endpoint) → M13-T054 (UI)

---

### PHASE H: Two-Way Code Sync + Versioning + Polish (Days 20–21) [PM3]

| M13-T# | Task | Owner | Priority | Est. Hours | Deps | US-ID | AC Link |
|--------|------|-------|----------|-----------|------|-------|--------|
| M13-T056 | Design two-way sync (import .ts/.java/.js code → parse AST → extract steps → create visual blocks, human review required) | AI Eng | P0 | 8 | — | US-027 | M13-AC053 |
| M13-T057 | Implement EP-067 POST /api/automation/suites/import-code (upload code file, parse, extract steps, return preview JSON, return 201 on confirm) | Backend | P0 | 16 | M13-T007, M13-T056 | — | M13-AC054 |
| M13-T058 | Design version history UI (list versions by date, show export framework/status, side-by-side diff, rollback button) | Frontend Lead | P0 | 8 | — | — | M13-AC055 |
| M13-T059 | Implement version rollback API (PATCH /api/automation/suites/{id}/rollback-to-version {version_id}, create audit event) | Backend | P0 | 10 | M13-T003, M13-T009 | — | M13-AC056 |
| M13-T060 | Build version history UI (list + diff view, responsive, breadcrumb nav back to suite) | Frontend | P0 | 10 | M13-T058, M13-T059 | — | M13-AC057 |
| M13-T061 | Bug fixes, performance tuning, accessibility audit (keyboard nav, color contrast, screen reader test) | Full Team | P1 | 12 | All phases | — | M13-AC058 |
| M13-T062 | Final E2E tests + demo script (5-minute showcase: create suite → add 5 steps → A3 gen → export Playwright → verify syntax) | QA + Frontend | P0 | 10 | All phases | — | M13-AC059 |

**Phase H Total:** ~74 hours | **Critical Path:** M13-T056 (design) → M13-T057 (import) → M13-T060 (history UI)

---

**Grand Total: ~65 tasks, ~900 hours (~540 story points after 20% velocity buffer)**

---

## 9. WEEK-WISE BREAKDOWN

**Week 1 (Jan 12–18, 2027):** Phases A + B
- Days 1–3: Suite schema, migrations, CRUD API (Phase A)
- Days 4–6: TipTap editor blocks, slash commands, drag reorder (Phase B)
- **Deliverable:** Suite CRUD working, TipTap editor + code preview functional on staging

**Week 2 (Jan 19–25, 2027):** Phases C + D + E
- Days 7–10: A3 code generators (4 languages), syntax validation, confidence scoring (Phase C)
- Days 11–12: A3 clarification questions gate, latency tuning (Phase D)
- Days 13–14: Reusable templates, parameter binding, template search via A2 RAG (Phase E)
- **Deliverable:** A3 generator ≥85% auto-export rate, ≥50 templates seeded

**Week 3 (Jan 26–30, 2027):** Phases F + G + H
- Days 15–17: Real-time export, syntax validation per language, confidence gates (Phase F)
- Days 18–19: CSV import, data-driven test expansion (Phase G)
- Days 20–21: Two-way code sync (import), version history, final polish, E2E tests (Phase H)
- **Deliverable:** All features complete, ≥100 tests authored via A3, demo video, p95 export latency <5s

---

## 10. ACCEPTANCE CRITERIA (50+ ACs)

### TB-019 (Automation Suites Table)

| AC-ID | Feature | GIVEN | WHEN | THEN | Priority |
|-------|---------|-------|------|------|----------|
| M13-AC001 | Suite schema complete | Migrations M020-M024 applied | SELECT * FROM automation_suites | Table exists with (id, project_id, name, framework, test_specs JSON, version_number, created_by, created_at, updated_at, deleted_at), foreign key to projects, unique (project_id+name), indexes on (project_id, created_at) | P0 |
| M13-AC002 | Suite versioning schema | suite_versions table exists | INSERT into suite_versions | Every insert auto-creates version entry with snapshot, version_number auto-increments, rollback logic functional | P0 |
| M13-AC003 | Template library schema | template_library table exists | INSERT into template_library | Template saved with name, steps JSON, param_list, tags, confidence_score, global/project scope | P0 |
| M13-AC004 | EP-062 GET /api/automation/suites | Logged-in user, project selected, 50+ suites in DB | GET /api/automation/suites?project_id=X&limit=10 | Returns 200, suites array (id, name, framework, step_count, status, last_modified), pagination metadata, total count | P0 |
| M13-AC005 | EP-062 POST /api/automation/suites | Logged-in user, valid suite object (name, framework Playwright\|Selenium\|Cypress\|WebdriverIO) | POST /api/automation/suites {name, framework} | Returns 201, suite object with id, created_by, created_at, version_number=1, empty test_specs | P0 |
| M13-AC006 | EP-062 GET /api/automation/suites/{id} | Suite exists, user has read access | GET /api/automation/suites/123 | Returns 200, full suite (id, name, framework, steps array, versions history, template list) | P0 |
| M13-AC007 | EP-062 PATCH /api/automation/suites/{id} | Suite exists, user has write access | PATCH /api/automation/suites/123 {name: "new"} | Returns 200, suite updated, new version created (version_number incremented), audit log entry | P0 |
| M13-AC008 | EP-062 DELETE /api/automation/suites/{id} | Suite exists, user has delete access | DELETE /api/automation/suites/123 | Returns 204, suite soft-deleted, hidden from GET list, audit log entry | P1 |
| M13-AC009 | RBAC enforcement (suite-level) | QA, Automation Eng, Lead, Admin users | Create suite as Automation Eng, export as Automation Eng, bulk-delete as Lead | Automation Eng can create/export suites; Lead can bulk-delete; QA cannot delete; 403 Forbidden for unauthorized | P0 |
| M13-AC010 | Unit test coverage (CRUD) | Test suite running | npm test -- suite-crud.test.ts | 85%+ line coverage for suite CRUD endpoints, all happy + error paths (404, 409 conflict, 403 Forbidden) | P1 |

### TipTap Low-Code Editor

| M13-AC011 | TipTap custom nodes designed | Figma mockup approved | Review 6 custom block nodes | All nodes defined, slash commands documented, block nesting rules clear, drag-reorder behavior spec'd | P0 |
| M13-AC012 | Action block renders | Editor page loaded | Add action block via `/click` | Block shows action dropdown (click/fill/wait/assert/...), help text, validation, no console errors | P0 |
| M13-AC013 | Selector block renders + hints | Selector block in editor | Type "input" in selector field | Selector hints appear (CSS/XPath suggestions from A3 RAG), live validation shows match count on current page | P0 |
| M13-AC014 | Drag-handle reordering works | Editor with 5 blocks | Drag block 3 to position 1 | Block reordered, other blocks shift, auto-save triggered, version number incremented | P0 |
| M13-AC015 | Slash command palette functional | Editor canvas focused | Press `/` + `click` | Palette appears, filtering by typed text, click option → action block inserted | P0 |
| M13-AC016 | Editor page layout (3-pane) | User navigates to /app/automation/suites/123 | Page loads | Left: test library; Center: step canvas; Right: code preview; responsive, no layout shift | P0 |
| M13-AC017 | Suite list page (table) | User navigates to /app/automation/suites | Page loads | Sortable table (name, framework, step count, status, modified); filters, search working | P0 |
| M13-AC018 | Editor ↔ API integration | User edits suite in editor, clicks Save | PATCH /api/automation/suites/123 sent | Suite updated in DB, new version created, user sees success toast, sidebar updates | P0 |
| M13-AC019 | Real-time code preview updates | User adds step to editor | Right pane refreshes | Code preview shows updated Playwright code, syntax-highlighted, matches framework selection | P0 |
| M13-AC020 | Keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y) | Editor open | Press Ctrl+S | Suite saved, Ctrl+Z undoes, Ctrl+Y redoes, no console errors | P1 |
| M13-AC021 | TipTap component unit tests | Test suite running | npm test -- tiptap.test.tsx | 80%+ coverage for custom nodes, drag reorder, slash commands, content preservation | P1 |

### A3 Code Generator

| M13-AC022 | A3 system prompts drafted | AI Eng reviewed 4 language prompts | Review A3_prompts.md | Each language has: instructions, 2–3 golden examples, constraints (no duplicate logic), tone (professional) | P0 |
| M13-AC023 | A3 StepParser node working | Suite with 5 blocks created | LangGraph executes StepParser | Blocks parsed to normalized step objects {action, selector, value, expected, retry, timeout}, no errors | P0 |
| M13-AC024 | A3 ContextEnricher node working | StepParser complete | ContextEnricher fetches similar templates | RAG query returns top-3 templates, context <2000 tokens, injected into prompt | P0 |
| M13-AC025 | A3 CodeGenerator produces code | ContextEnricher complete | Call CodeGenerator node | Ollama generates code in target language (Playwright TS, Selenium Java, Cypress JS, WebdriverIO JS), JSON parseable, no syntax errors | P0 |
| M13-AC026 | A3 SyntaxValidator validates code | Generated code received | SyntaxValidator parses AST | No syntax errors, or returns error line + suggestion; validator passes for ≥90% of <60s old code | P0 |
| M13-AC027 | A3 ConfidenceScorer assigns labels | Code generated | ConfidenceScorer node | Each output assigned confidence (High ≥90% / Medium 70–89% / Low <70%), confidence % in (0–100), no output without score | P0 |
| M13-AC028 | EP-063 async generation working | User clicks "A3 Generate" in UI | POST /api/agents/a3/generate {suite_id, framework} | Returns 202, job_id, user sees loading spinner, Hatchet queues job, Langfuse logs event | P0 |
| M13-AC029 | A3 auto-export rate ≥85% | 80 suites tested (20 per language) | AI Eng measures suites needing zero edits (confidence ≥90%) | ≥85% of suites approved without user edit; target 85% as exit gate | P0 |
| M13-AC030 | A3 prompts tuned per language | Test results reviewed | Adjust prompts for Java/Python syntax, Cypress async/await patterns, WebdriverIO WDIO specifics | Language-specific prompts refined, retested on 10 new suites per language, ≥90% pass | P0 |
| M13-AC031 | Langfuse logging for A3 | A3 generation completed | View Langfuse dashboard | Every A3 call logged (input, output, latency, confidence, cost, language), node tree visible, cost <$0.10 per suite | P1 |

### A3 Clarification Questions

| M13-AC032 | Clarification prompt + ClarificationAsker node | A3 triggered on ambiguous input | LangGraph branching evaluates input clarity | If ambiguous, pause + ask 2–3 questions; if clear, skip gate | P0 |
| M13-AC033 | Branching logic implemented | A3 generation triggered | LangGraph evaluates confidence after StepParser | Low-confidence input branches to ClarificationAsker; high-confidence skips gate | P0 |
| M13-AC034 | EP-063 supports clarification flow | User requests gen → ambiguous input | POST /api/agents/a3/generate returns {status: "clarification_pending", questions: [...]} | UI receives questions, user answers, POST /api/agents/a3/answer {answers: [...]} resumes | P0 |
| M13-AC035 | Clarification modal UI functional | A3 reaches gate | Modal displays 2–3 questions, text inputs, "Continue Generation" button | User fills, clicks button, answers sent, UI shows "Generating..." | P0 |
| M13-AC036 | Clarification latency <2s | User submits answers | Latency from submit to resume gen | Total elapsed time ≤2s | P1 |

### Reusable Templates

| M13-AC037 | Template CRUD + search working | Template library populated (≥50 templates) | GET /api/automation/templates | Returns 200, templates array (id, name, tags, step_count, usage_count), pagination, search filters | P0 |
| M13-AC038 | Template save API working | User clicks "Save as Template" on step | POST /api/automation/templates {name, steps, tags, params} | Template saved, template_id returned, template searchable in browser | P0 |
| M13-AC039 | Template load + reuse working | User searches for "Login" template in browser | Click template in browser, step inserted into current suite | Step inserted with placeholders for params (e.g., [username], [password]), ready to bind | P0 |
| M13-AC040 | Parameter binding on export | Suite with templated steps exported | Export honors [param_name] tokens, prompts user for value at export or uses CSV bindings | Generated code substitutes values (e.g., login.fill('[username]', 'user1')) | P0 |
| M13-AC041 | Template browser UI functional | User opens template browser modal | Modal lists ≥50 templates, filter by tag/search, click to preview, insert button | Template selected, step inserted into canvas | P0 |
| M13-AC042 | A2 RAG search on templates accurate | Test A2 on 50 templates | Measure recall/precision for semantic template search | Recall ≥70%, Precision ≥80% for similar template lookup | P1 |

### Code Export + Validation

| M13-AC043 | Code export logic working | User clicks "Export" button, confirms framework | A3 LangGraph called, code generated, syntax validated, confidence assigned | Code returned with status, errors (if any), confidence badge | P0 |
| M13-AC044 | EP-065 POST /api/automation/suites/{id}/export working | Framework selected (Playwright/Selenium/Cypress/WebdriverIO) | POST /api/automation/suites/123/export {framework} | Returns 202, job_id; Hatchet queues, Langfuse logs; SSE stream shows progress | P0 |
| M13-AC045 | Syntax validation per language accurate | 80 exported suites (20 per language) | Run syntax checks (TS/JS AST, Java parser, Python AST) | Syntax error rate ≤5%, false positives ≤2% | P0 |
| M13-AC046 | Export UI gate + confirmation | Code generated, confidence assigned | User sees Red/Amber/Green gate, can override Red for <70% confidence | Red blocks export by default; Amber warns; Green auto-approves | P0 |
| M13-AC047 | Code download flow working | User clicks "Download" after export | Browser prompts save, file named {suite_name}_{framework}_{date}.{ext} (e.g., login_playwright_20270118.ts) | File downloaded, syntax-valid, ready for CI | P0 |
| M13-AC048 | Export latency <5s p95 | 50 suites exported in sequence | Measure time from "Export" click to "Download" available | p95 latency <5s, p99 <8s, no timeout errors | P1 |

### CSV Import + Data-Driven

| M13-AC049 | CSV import format designed | CSV uploaded (columns: username, password, scenario) | Parse CSV, validate headers, cartesian product | 3 usernames × 2 passwords × 2 scenarios = 12 suite variants | P0 |
| M13-AC050 | EP-066 expand-data-driven working | CSV with 3 params uploaded | Cartesian product calculation | Suite expanded from 1 → N variants; new suite IDs returned, names include param values | P0 |
| M13-AC051 | CSV import UI functional | File upload, preview table, Expand button | Preview shows cartesian product count before confirm | User clicks Expand, progress bar, new suites appear in list | P0 |
| M13-AC052 | Data-driven parameter substitution | Expanded suites exported | Each suite variant exports with param values bound | Generated code: login.fill(username, 'user1') for variant 1, 'user2' for variant 2, etc. | P1 |

### Two-Way Code Sync + Versioning

| M13-AC053 | Two-way sync logic designed | Playwright .ts file uploaded | Parse AST, extract step sequence | Steps extracted with 80%+ accuracy (vs. manual review), visual blocks preview shown | P0 |
| M13-AC054 | EP-067 import-code working | Upload Playwright/Selenium/Cypress code | Parse code, extract steps, return preview JSON | User reviews preview, confirms, suite created with visual blocks | P0 |
| M13-AC055 | Version history UI designed | Suite with 3 versions | List shows date, framework, export status, diff button | User clicks diff, sees [old] → [new] changes per step | P0 |
| M13-AC056 | Rollback API working | User selects version 2 (of 3), clicks Rollback | PATCH /api/automation/suites/123/rollback-to-version {version_id} | Suite reverted, new version created (v4 = rollback to v2), audit log created | P0 |
| M13-AC057 | Version history UI component renders | Version list populated | List sorted by date descending, each version clickable, diff side-by-side | Responsive, back button to suite | P0 |
| M13-AC058 | Accessibility audit + polish | WCAG 2.2 AA checklist run | Keyboard nav, color contrast, screen reader compat | 0 P0 fails, ≤3 P1 failures, accessibility documented | P1 |
| M13-AC059 | E2E demo test passing | Playwright E2E test suite running | Create suite → add 5 steps → export Playwright → verify syntax → run exported test in headless browser | All steps pass, output matches expected (console logs, exit code 0) | P0 |

---

## 11. API CONTRACTS (M13 SCOPE)

### EP-062: Automation Suite CRUD

**GET /api/automation/suites**
```json
REQUEST:
GET /api/automation/suites?project_id=proj_123&framework=playwright&limit=10&offset=0&sort=modified_desc

RESPONSE (200):
{
  "suites": [
    {
      "id": "suite_001",
      "project_id": "proj_123",
      "name": "Login Flow — Playwright",
      "framework": "playwright",
      "step_count": 5,
      "status": "ready",  // ready | syntax_error | unconfirmed
      "confidence": 0.92,
      "last_exported_at": "2027-01-18T10:30:00Z",
      "last_modified_by": "user_456",
      "created_at": "2027-01-15T14:22:00Z",
      "updated_at": "2027-01-18T10:30:00Z"
    }
  ],
  "pagination": { "total": 25, "limit": 10, "offset": 0 }
}
```

**POST /api/automation/suites**
```json
REQUEST:
POST /api/automation/suites
{
  "project_id": "proj_123",
  "name": "Checkout Flow",
  "framework": "playwright"
}

RESPONSE (201):
{
  "id": "suite_002",
  "project_id": "proj_123",
  "name": "Checkout Flow",
  "framework": "playwright",
  "test_specs": [],
  "version_number": 1,
  "created_by": "user_456",
  "created_at": "2027-01-19T09:15:00Z",
  "updated_at": "2027-01-19T09:15:00Z"
}
```

**PATCH /api/automation/suites/{id}**
```json
REQUEST:
PATCH /api/automation/suites/suite_001
{
  "name": "Login Flow — Updated",
  "test_specs": [
    {
      "order": 1,
      "action": "navigate",
      "url": "https://app.example.com/login"
    },
    {
      "order": 2,
      "action": "fill",
      "selector": "input[name='email']",
      "value": "[email_param]"
    }
  ]
}

RESPONSE (200):
{
  "id": "suite_001",
  "version_number": 2,
  "status": "unconfirmed",
  "updated_at": "2027-01-19T10:00:00Z"
}
```

### EP-063: A3 Code Generator

**POST /api/agents/a3/generate**
```json
REQUEST:
POST /api/agents/a3/generate
{
  "suite_id": "suite_001",
  "framework": "playwright",
  "target_branch": "feature/login"
}

RESPONSE (202):
{
  "job_id": "job_abc123",
  "status": "queued",
  "estimated_time_sec": 30
}

(WebSocket/SSE: GET /api/agents/a3/generate/job_abc123/stream)
MESSAGE:
{
  "type": "progress",
  "step": "syntax_validation",
  "percentage": 75
}

MESSAGE (final):
{
  "type": "complete",
  "status": "success",
  "code": "import { test, expect } from '@playwright/test';\n\ntest('Login Flow', async ({ page }) => {\n  await page.goto('https://app.example.com/login');\n  await page.fill('input[name=\"email\"]', 'user@example.com');\n  ...\n});",
  "confidence": 0.92,
  "framework": "playwright",
  "syntax_errors": [],
  "export_url": "https://r2.example.com/exports/suite_001_20270119_abc123.ts"
}
```

### EP-064: Template Library

**GET /api/automation/templates**
```json
REQUEST:
GET /api/automation/templates?project_id=proj_123&tags=login&search=email&limit=10

RESPONSE (200):
{
  "templates": [
    {
      "id": "tmpl_login_001",
      "name": "Email Login",
      "description": "Fill email & password, click login button",
      "steps": [
        { "action": "fill", "selector": "input[name='email']", "value": "[email]", "param": "email" },
        { "action": "fill", "selector": "input[name='password']", "value": "[password]", "param": "password" },
        { "action": "click", "selector": "button[type='submit']" }
      ],
      "tags": ["login", "auth"],
      "parameters": ["email", "password"],
      "usage_count": 12,
      "confidence": 0.95,
      "created_at": "2027-01-10T08:30:00Z"
    }
  ]
}
```

**POST /api/automation/templates**
```json
REQUEST:
POST /api/automation/templates
{
  "project_id": "proj_123",
  "scope": "project",  // project | global
  "name": "API Call — GraphQL",
  "steps": [
    { "action": "api", "method": "POST", "url": "https://api.example.com/graphql", "body": "[query_param]" }
  ],
  "parameters": ["query_param"],
  "tags": ["api", "graphql"],
  "confidence": 0.88
}

RESPONSE (201):
{
  "id": "tmpl_api_001",
  "name": "API Call — GraphQL",
  "created_at": "2027-01-19T10:45:00Z"
}
```

### EP-065: Code Export

**POST /api/automation/suites/{id}/export**
```json
REQUEST:
POST /api/automation/suites/suite_001/export
{
  "framework": "playwright",
  "target_branch": "feature/checkout"
}

RESPONSE (202):
{
  "job_id": "job_xyz789",
  "status": "processing",
  "estimated_time_sec": 25
}

(Stream result via WebSocket/SSE: GET /api/automation/suites/suite_001/export/job_xyz789/stream)
FINAL MESSAGE:
{
  "status": "success",
  "code": "...",
  "confidence": 0.94,
  "gate": "green",  // red | amber | green
  "syntax_errors": [],
  "export_url": "https://r2.example.com/exports/suite_001_playwright_20270119.ts",
  "download_url": "/api/automation/suites/suite_001/download-export?job_id=job_xyz789"
}
```

### EP-066: Data-Driven CSV Expansion

**POST /api/automation/suites/{id}/expand-data-driven**
```json
REQUEST:
POST /api/automation/suites/suite_001/expand-data-driven
{
  "csv_data": "username,password,expected_role\nuser1,pass1,admin\nuser2,pass2,user\nuser3,pass3,guest"
}

RESPONSE (201):
{
  "original_suite_id": "suite_001",
  "variant_count": 3,
  "variant_suite_ids": ["suite_001_var_1", "suite_001_var_2", "suite_001_var_3"],
  "variants": [
    { "id": "suite_001_var_1", "name": "Login Flow — user1/admin", "parameters": { "username": "user1", "password": "pass1", "expected_role": "admin" } },
    { "id": "suite_001_var_2", "name": "Login Flow — user2/user", "parameters": { "username": "user2", "password": "pass2", "expected_role": "user" } },
    { "id": "suite_001_var_3", "name": "Login Flow — user3/guest", "parameters": { "username": "user3", "password": "pass3", "expected_role": "guest" } }
  ]
}
```

### EP-067: Code Import (Two-Way Sync)

**POST /api/automation/suites/import-code**
```json
REQUEST:
POST /api/automation/suites/import-code
{
  "project_id": "proj_123",
  "code": "import { test } from '@playwright/test';\ntest('Login', async ({ page }) => {\n  await page.goto('...');\n  await page.fill('input[name=\"email\"]', '...');\n});",
  "framework": "playwright",
  "suite_name": "Imported Login Test"
}

RESPONSE (200):
{
  "preview": {
    "suite_name": "Imported Login Test",
    "steps": [
      { "order": 1, "action": "navigate", "url": "...", "confidence": 0.95 },
      { "order": 2, "action": "fill", "selector": "input[name='email']", "value": "...", "confidence": 0.88 }
    ],
    "extraction_confidence": 0.85,
    "requires_review": true
  },
  "confirm_url": "/api/automation/suites/import-code/confirm?preview_id=preview_abc123"
}

POST /api/automation/suites/import-code/confirm
{
  "preview_id": "preview_abc123"
}

RESPONSE (201):
{
  "id": "suite_004",
  "name": "Imported Login Test",
  "framework": "playwright",
  "steps": [...],
  "created_at": "2027-01-19T11:00:00Z"
}
```

---

## 12. DATABASE CHANGES (M13 SCOPE)

### New Tables

**TB-019: automation_suites**
```sql
CREATE TABLE automation_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  framework TEXT NOT NULL CHECK (framework IN ('playwright', 'selenium', 'cypress', 'webdriverio')),
  test_specs JSONB DEFAULT '[]'::jsonb,
  version_number INT DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE (project_id, name),
  INDEX idx_project_created (project_id, created_at),
  INDEX idx_framework (framework)
);
```

**TB-019a: test_steps**
```sql
CREATE TABLE test_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES automation_suites(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('click', 'fill', 'wait', 'assert', 'screenshot', 'api', 'db', 'conditional', 'retry', 'navigate')),
  selector VARCHAR(1024),
  value VARCHAR(2048),
  expected VARCHAR(2048),
  retry_count INT DEFAULT 0,
  timeout_ms INT DEFAULT 5000,
  screenshot_checkpoint BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_suite_order (suite_id, step_order)
);
```

**TB-019b: suite_versions**
```sql
CREATE TABLE suite_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES automation_suites(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  suite_specs_snapshot JSONB NOT NULL,
  exported_framework TEXT,
  confidence_score DECIMAL(3,2),
  export_status TEXT CHECK (export_status IN ('success', 'syntax_error', 'runtime_fail', 'pending')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (suite_id, version_number),
  INDEX idx_suite_version (suite_id, version_number)
);
```

**TB-019c: template_library**
```sql
CREATE TABLE template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('project', 'global')),
  template_name VARCHAR(255) NOT NULL,
  step_json JSONB NOT NULL,
  param_list TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  usage_count INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  embedding vector(768),
  INDEX idx_project_scope (project_id, scope),
  INDEX idx_tags (tags),
  INDEX idx_embedding (embedding) USING HNSW (embedding vector_cosine_ops)
);
```

**TB-019d: export_history**
```sql
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES automation_suites(id),
  framework TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'syntax_error', 'confidence_blocked')),
  confidence_score DECIMAL(3,2),
  code_length INT,
  syntax_errors TEXT[],
  exported_by UUID NOT NULL REFERENCES users(id),
  exported_at TIMESTAMP DEFAULT NOW(),
  r2_url VARCHAR(2048),
  INDEX idx_suite_framework (suite_id, framework),
  INDEX idx_exported_at (exported_at DESC)
);
```

### Schema Migrations

**M020:** Create automation_suites table + indexes
**M021:** Create test_steps table + foreign keys
**M022:** Create suite_versions table + version history triggers
**M023:** Create template_library table + embeddings index
**M024:** Create export_history table + audit trail

---

## 13. AI AGENT SPEC (A3)

### A3 Low-Code Authoring Agent

**Purpose:** Transform visual test step blocks → production-grade code in 4 languages (Playwright TS, Selenium Java/Python, Cypress JS, WebdriverIO JS) with <5s latency and ≥85% auto-export confidence.

**Input Pipeline:**
1. User creates suite with step blocks (via TipTap editor)
2. Click "Export" → select framework + target_branch
3. API sends suite_id + framework to A3 endpoint
4. LangGraph orchestrator receives request

**LangGraph Graph:**
```
START
  ↓
[StepParser] — Parse blocks → normalized steps
  ↓
[ContextEnricher] — Fetch RAG templates + similar cases
  ↓
[ClarificationAsker] (conditional: if ambiguous, pause)
  ↓
[CodeGenerator] — Ollama gen code in target language
  ↓
[SyntaxValidator] — AST parse, validate per language
  ↓
[ConfidenceScorer] — Assign High/Medium/Low + %
  ↓
[HITL Gate] (Red blocks, Amber warns, Green approves)
  ↓
END (return code + download link)
```

**Nodes:**

| Node | Input | Process | Output |
|------|-------|---------|--------|
| **StepParser** | steps: [{action, selector, value, ...}] | Normalize action names, validate selectors, extract params | normalized_steps: [{action_normalized, selector_validated, value, param_names, ...}] |
| **ContextEnricher** | normalized_steps | Query pgvector for similar templates (A2), fetch past cases by action type | context: {templates, past_patterns, examples, selected_framework_libs} |
| **ClarificationAsker** | normalized_steps + framework | Call Ollama with clarification prompt; if ambiguity_score >0.4, ask 2–3 questions | {status: "clarification_pending\|ready", questions: [...]} or {status: "ready"} |
| **CodeGenerator** | normalized_steps + context + framework | Call Ollama with language-specific prompt + context; generate code; parse output | code: string (Playwright TS / Selenium Java / Cypress JS / WebdriverIO JS) |
| **SyntaxValidator** | code + framework | Parse AST for language, check syntax, collect errors | {valid: bool, errors: [{line, message, suggestion}]} |
| **ConfidenceScorer** | code + syntax_errors + context_match | Score: 100% if valid + high context match, -10 per syntax error, -5 per ambiguous step | confidence: 0.0–1.0, confidence_tier: "High"|"Medium"|"Low" |
| **HITL Gate** | confidence + code | Assign gate: Red (<70%), Amber (70–89%), Green (≥90%) | gate_status: "red"|"amber"|"green", gate_action: "block"|"warn"|"auto_approve" |

**Node Implementations (FastAPI):**

```python
@router.post("/api/agents/a3/generate")
async def a3_generate(request: A3GenerateRequest):
    job_id = await queue_hatchet_job("a3_generate", request)
    return {"job_id": job_id, "status": "queued"}

async def a3_langgraph_workflow(suite_id: str, framework: str):
    suite = await get_automation_suite(suite_id)
    
    # Node 1: StepParser
    normalized = parse_steps(suite.test_specs)
    
    # Node 2: ContextEnricher
    templates = await search_templates_ragvector(normalized, top_k=3)
    context = enrich_context(normalized, templates, framework)
    
    # Node 3: ClarificationAsker
    ambiguity = score_ambiguity(normalized)
    if ambiguity > 0.4:
        questions = await ask_clarifications(normalized, framework)
        # Wait for user response via webhook
        user_answers = await wait_for_clarifications(suite_id, timeout=60s)
        context["clarifications"] = user_answers
    
    # Node 4: CodeGenerator
    code = await call_ollama_codegen(normalized, context, framework)
    
    # Node 5: SyntaxValidator
    errors = validate_syntax(code, framework)
    
    # Node 6: ConfidenceScorer
    confidence = score_confidence(code, errors, context, framework)
    
    # Node 7: HITL Gate
    gate_status = assign_gate(confidence)
    
    # Store export
    export = create_export_record(
        suite_id=suite_id,
        framework=framework,
        code=code,
        confidence=confidence,
        gate_status=gate_status,
        errors=errors
    )
    
    return {
        "export_id": export.id,
        "code": code,
        "confidence": confidence,
        "gate": gate_status,
        "errors": errors
    }
```

**Prompts:**

**A3_system_prompt (Playwright):**
```
You are a code generation expert for Playwright automation tests.

INSTRUCTIONS:
- Generate production-grade TypeScript Playwright tests
- Use @playwright/test framework conventions
- Each step maps to one Playwright action (goto, click, fill, waitForSelector, etc.)
- Include assertions and error handling (try-catch, retries)
- Use descriptive variable names and comments

INPUT (test steps):
[STEPS_JSON]

CONTEXT (similar templates + past patterns):
[CONTEXT]

GENERATE TypeScript Playwright test code. Return ONLY valid TypeScript code, no explanations.
```

**A3_system_prompt (Selenium):**
```
You are a code generation expert for Selenium WebDriver automation tests.

INSTRUCTIONS:
- Generate production-grade Java Selenium tests using TestNG or JUnit
- Use WebDriverWait for explicit waits (no Thread.sleep)
- Each step maps to one Selenium action (navigate, sendKeys, click, etc.)
- Include proper exception handling
- Follow POM (Page Object Model) patterns

INPUT (test steps):
[STEPS_JSON]

CONTEXT (similar templates):
[CONTEXT]

GENERATE Java Selenium test code with WebDriver setup. Return ONLY valid Java code.
```

---

## 14. TESTING STRATEGY

### Unit Tests (Tier 1)
- Suite CRUD endpoints (Happy + error paths, RBAC gates)
- Step parsing logic (Action/selector validation, param extraction)
- Template search (A2 RAG query, ranking, dedup)
- Confidence scoring (Score calculation, gate assignment)
- CSV expansion (Cartesian product, parameter substitution)

### Integration Tests (Tier 2)
- A3 LangGraph workflow (End-to-end: StepParser → CodeGenerator → SyntaxValidator → Confidence → Gate)
- Code export (Queue job, stream progress, return code + URL)
- Template save/load/search (Create, retrieve, semantic search, reuse)
- Two-way sync (Import code → parse → visual blocks preview → confirm)

### E2E Tests (Tier 3)
- Full user journey: Create suite → add 5 steps (via slash commands) → export Playwright → verify syntax → run exported test in headless browser → pass
- Template workflow: Create 3 templates → search template → insert into suite → export → code uses template values
- Data-driven: Upload CSV → expand to 3 variants → export each → all syntax-valid
- Version history: Create suite → export → modify → export again → rollback to v1 → verify code matches

### Performance Tests
- A3 export latency: p95 <5s, p99 <8s (50 concurrent requests)
- Template search: p95 <500ms (1000 templates, top-10 ranking)
- CSV expansion: <1s for cartesian product (10 params × 5 values each)

### Test Data
- 100 step templates (20 per action type)
- 50 past automation case examples (for RAG context)
- 10 sample test suites (each 5–10 steps)
- CSV files: 3 scenarios × 2–5 parameters each

---

## 15. FEATURE FLAG STRATEGY

**Flag Name:** `feature_ai_a3_low_code`

**Rollout:**
1. **Dark Launch (Week 1):** Disabled for all; internal testing only (Iksula QA team)
2. **Internal Canary (Week 2):** Enable for 1 pilot project (Iksula internal); monitor latency, errors
3. **Canary 25% (Week 3, Day 1):** Enable for 25% of projects by random sampling
4. **GA (Week 3, Day 4):** Enable for 100% of projects

**Kill Switch:** `unleash disable feature_ai_a3_low_code` (block all new exports, revert to manual coding)

**Monitoring:**
- SigNoz dashboard: Export latency (p50/p95/p99), error rate, job queue depth
- GlitchTip: Syntax validation errors, code generation failures
- Langfuse: Cost per export, confidence distribution, model hallucination detections

**Rollback Criteria:**
- p95 latency >8s for >10% of exports
- Syntax error rate >10% for any language
- A3 confidence calibration drift (>15% of "High" exports fail manual review)
- User-reported issues >5 per day (unrelated to feature flag state)

---

## 16. RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| A3 code generation <60% auto-approval rate | Users revert to manual coding; feature flops | Medium | Weekly LLM prompt tuning, test on 50-case golden set, Clarification gate catches ambiguous patterns |
| Ollama downtime (model offload, OOM) | All exports blocked; fallback to Gemini required | Low | Ollama auto-restart + health probes; Gemini 2.5 Flash fallback configured + tested; daily model snapshot to R2 |
| Syntax validation false negatives | Bad code exported, CI fails; manual fix burden | Medium | Test validator on 200 real code samples (JS/TS/Java/Python); AST parsing per language; Langfuse traces |
| Multi-language code gen inconsistency | Playwright works, Selenium fails; incomplete feature | Medium | Separate prompts per language + test suites; parity testing (same logic → 4 code outputs → run all in respective frameworks) |
| Template search (A2 RAG) low recall | Users can't find relevant templates; duplicates proliferate | Low | Weekly re-tuning of BGE embeddings; maintain semantic template corpus; tag-based fallback search |
| Clarification gate latency >2s | User UX friction, abandon export | Low | Async question generation (call Ollama once), cache common clarifications; SigNoz latency alerting |
| CSV expansion cartesian explosion (20 params × 10 values = 200M variants) | Memory/DB overload, timeout | Low | Cap at 1000 variants; warn user on N > 100; offer sampling option (random 50 of 200) |
| Two-way code import AST parsing errors (Java/Python/JS dialect variance) | Extracted blocks garbage; user frustrated | Medium | Use language-specific parsers (esprima for JS, acorn for TS, java-parser for Java, ast for Python); graceful degradation with confidence <60% |

---

## 17. ROLLBACK PLAN

**Condition:** If p95 export latency >8s OR syntax error rate >10% OR A3 confidence <60% for 2+ hours

**Steps:**
1. **Immediate:** Kill-switch flag `feature_ai_a3_low_code` via Unleash (all users; disables A3 exports)
2. **Comms:** Post incident to #qa-nexus Slack; notify affected pilots
3. **Revert Code:** If bug introduced in M13 code, git revert to last stable commit (M12 exit state)
4. **Data Recovery:** Rollback automation_suites table to last clean snapshot (pg_dump from M13-T001 completion, hourly backups to R2)
5. **Testing:** Re-enable flag at 10% canary; monitor for 30 min; escalate if issues recur
6. **Post-Mortem:** Within 1 day, document root cause + fix + retesting plan

**Fallback for Users:**
- A3 exports disabled → users revert to manual Playwright coding (copy-paste existing .ts templates)
- Reusable templates still available (non-A3 pathways)
- Suite CRUD, editor, versioning unaffected (only exports blocked)

---

## 18. OBSERVABILITY & MONITORING

### SigNoz Dashboards (M13)

**Dashboard 1: A3 Export Performance**
- Export latency (p50/p95/p99) per language
- Job queue depth + wait time
- Error rate by error type (syntax, confidence, timeout)
- Code length distribution (lines per export)

**Dashboard 2: Confidence Calibration**
- Confidence score distribution (histogram: 0–100)
- Gate status split (Red % / Amber % / Green %)
- High-confidence (<90%) manual review pass rate
- Syntax error rate per confidence tier

**Dashboard 3: Feature Flag Impact**
- Exports per hour (flag disabled vs. enabled)
- User adoption (export count per user per day)
- A3 vs. manual coding volume (before/after M13)

### Langfuse Traces (M13)

**Per A3 call:**
- Input: suite_id, framework, step_count
- Model: Ollama Gemma 4 (or Gemini fallback)
- Latency: per node (StepParser, ContextEnricher, CodeGenerator, SyntaxValidator, ConfidenceScorer)
- Cost: per call + tokens
- Output: code length, confidence, gate status, errors

### Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| A3 export latency p95 | >8s | Page on-call engineer, investigate Ollama/queue |
| Syntax validation false negative | >5% | Debug validator per language, retune thresholds |
| Confidence calibration drift | >15% of "High" fail manual review | Retune A3 prompt, audit golden set |
| Ollama offline | >5 min | Auto-failover to Gemini, page DevOps |
| Template search recall | <60% | Retune BGE embeddings, audit corpus |

---

## 19. MILESTONE EXIT CRITERIA (DEFINITION OF DONE)

1. ✅ **Schema Complete:** TB-019, 019a, 019b, 019c, 019d deployed + indexed on production (no migration rollback)
2. ✅ **Suite CRUD Stable:** EP-062 all methods working, RBAC enforced, ≥80 suites seeded, 0 critical bugs
3. ✅ **TipTap Editor Functional:** All block types (8 actions), slash commands, drag reorder, 3-pane layout, real-time code preview working
4. ✅ **A3 Code Generators Live:** Playwright (TS), Selenium (Java/Python), Cypress (JS), WebdriverIO (JS) all <5s p95 latency
5. ✅ **A3 Confidence Calibration:** ≥85% auto-export rate (confidence ≥90%), <70% red blocks ≥80% truly bad code
6. ✅ **Templates Seeded:** ≥50 reusable templates (5 per action type), searchable via A2 RAG, usage tracked
7. ✅ **CSV Data-Driven:** Cartesian expansion working, ≥10 variant suites exported + syntax-valid
8. ✅ **Two-Way Sync:** Code import AST parsing working, <60% confidence blocks export, human review gates enforced
9. ✅ **Versioning Live:** Git-style history per suite, rollback UI working, audit trail complete
10. ✅ **E2E Tests Passing:** Full user journey: create → add steps → export Playwright → run in headless browser → PASS
11. ✅ **Feature Flag Deployed:** feature_ai_a3_low_code in Unleash, dark launch → internal → GA progression done
12. ✅ **Observability Green:** SigNoz dashboards live, Langfuse tracing complete, no p1/p0 alerts
13. ✅ **Documentation Complete:** User guide, API docs, admin guide, troubleshooting published
14. ✅ **WCAG 2.2 AA Passed:** Accessibility audit ≤3 P1 failures, keyboard nav works, screen reader compat verified
15. ✅ **Team Trained:** Frontend + AI eng familiar with codebase, runbooks + on-call playbooks published
16. ✅ **Pilot Handoff:** ≥3 automation engineers use A3 in week 3, export ≥100 tests total, NPS ≥7/10

---

## 20. HANDOFF & DOCUMENTATION

**Deliverables:**
- [ ] User Guide: "Low-Code Authoring — Getting Started" (10-page, screenshots, 3 example workflows)
- [ ] API Documentation: Swagger/OpenAPI spec for EP-062 through EP-067
- [ ] Admin Guide: Feature flag rollout, monitoring dashboard setup, troubleshooting (Ollama offline, syntax validation failures)
- [ ] Runbooks: A3 model drift detection, rollback procedure, Langfuse trace analysis
- [ ] Prompt Library: A3_system_prompts (4 languages), ClarificationAsker prompt, stored in /docs/prompts/

**Knowledge Transfer:**
- [ ] Technical deep-dive with Backend Lead (A3 LangGraph workflow, node failures, retry logic)
- [ ] Frontend walkthrough with Design Lead (TipTap extension patterns, slash command UX, real-time preview reactivity)
- [ ] On-call runbook walkthrough with DevOps (Ollama health checks, fallback to Gemini, alert response)

---

## 21. NEXT MILESTONE PREVIEW (M14)

**Milestone M14 (W4–6 of PM3, 2027-02-02 → 2027-02-20):** Test Selection (A5) + PR-Gated CI

- **A5 Agent:** Change-based test selection (code diff → affected components → test subsetting)
- **Input:** Git PR diff (files changed, line changes, component tags from code analysis)
- **Output:** Recommended test subset (high-impact tests first), estimated CI time savings, rank by risk
- **Integration:** GitHub Actions / GitLab CI PR comment with selected tests + `/qa run all` override command
- **Target:** 60% CI time reduction (40 min → 16 min average)

**Dependencies on M13:**
- A3-authored tests used as sample corpus for A5 training (historical pass/fail patterns from CI runs)
- Suite metadata (components affected) informs A5 impact analysis
- Confidence scores from A3 integrated with A5 ranking (high-confidence tests prioritized)

---

## 22. APPENDIX

### A. Sample A3 Prompt (Playwright)

```
You are a Playwright test automation code generator.

INSTRUCTIONS:
1. Each test step maps directly to Playwright actions (page.goto, page.fill, page.click, expect, etc.)
2. Use TypeScript with @playwright/test framework
3. Include waitForSelector and explicit waits (no sleep)
4. Add comments above complex assertions
5. Use meaningful variable names

TEST STEPS:
[STEPS_JSON]

CONTEXT (similar templates):
[TEMPLATES]

Generate production-grade TypeScript Playwright test code.
Return ONLY valid TypeScript code wrapped in \`\`\`typescript ... \`\`\`.
```

### B. Sample A3 System Role

```json
{
  "role": "code-generator",
  "model": "ollama-gemma-4-26b-moe",
  "capabilities": [
    "parse-test-steps",
    "generate-playwright-ts",
    "generate-selenium-java",
    "generate-selenium-python",
    "generate-cypress-js",
    "generate-webdriverio-js",
    "validate-syntax-per-language",
    "score-confidence-0-to-100",
    "handle-clarification-questions",
    "detect-ambiguous-patterns"
  ],
  "constraints": [
    "max_latency_sec: 5",
    "confidence_threshold_auto_approve: 0.90",
    "confidence_threshold_red_block: 0.70",
    "max_tokens_generated: 2000",
    "fallback_model: gemini-2.5-flash"
  ],
  "audit_trail": "every-call-to-langfuse"
}
```

### C. Reusable Templates Sample Data

```json
[
  {
    "id": "tmpl_login_email_001",
    "name": "Email Login (Standard)",
    "steps": [
      {"action": "navigate", "url": "[APP_URL]/login"},
      {"action": "fill", "selector": "input[name='email']", "value": "[EMAIL]"},
      {"action": "fill", "selector": "input[name='password']", "value": "[PASSWORD]"},
      {"action": "click", "selector": "button[type='submit']"},
      {"action": "wait", "selector": ".dashboard", "timeout": 5000},
      {"action": "assert", "selector": ".user-greeting", "expected": "[USERNAME]"}
    ],
    "parameters": ["APP_URL", "EMAIL", "PASSWORD", "USERNAME"],
    "tags": ["auth", "login", "critical"],
    "usage_count": 47,
    "confidence": 0.96
  },
  {
    "id": "tmpl_api_graphql_query_001",
    "name": "GraphQL API Query (POST)",
    "steps": [
      {"action": "api", "method": "POST", "url": "[API_URL]/graphql", "body": "{\"query\": \"[QUERY]\", \"variables\": [VARIABLES]}", "expected_status": 200},
      {"action": "assert", "type": "json_path", "path": "[RESPONSE_PATH]", "expected": "[EXPECTED_VALUE]"}
    ],
    "parameters": ["API_URL", "QUERY", "VARIABLES", "RESPONSE_PATH", "EXPECTED_VALUE"],
    "tags": ["api", "graphql"],
    "usage_count": 12,
    "confidence": 0.88
  }
]
```

---

**End of Milestone M13 Specification**
