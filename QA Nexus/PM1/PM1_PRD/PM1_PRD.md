# QA Nexus PM1 — Phase-Level PRD

## Product Requirements Document — PM1 Only

**Subtitle:** AI-Native QA Workspace · MVP / Phase 1 / v1 GA (2026-09-21)
**Organization:** Iksula Services Pvt Ltd
**Document Name:** PM1_PRD (formerly MVP_PRD)
**Document Version:** v8.1 (PM1 UI 41-frame closure — F28m1 + F26m1 added for Day-0 LLM config flow, 2026-04-25 late)
**Document Status:** Approved baseline for PM1 build (tech stack final, UI inventory closed at 41 frames)
**Companion Documents:** `PM1_ERD.md` (PM1 engineering spec), `../PM1_UI_v2/UI Files/01_SYSTEM.md` (locked design system), `../Milestone/M0`–`M6` folders (week-by-week execution), project-level `../PRD/PRD.md` and `../ERD/ERD.md` (full PM1–PM4 program context)
**Scope:** **This document covers PM1 only.** PM2/PM3/PM4 scope lives in the project-level `../PRD/PRD.md` and is intentionally excluded here.

---

## 1. Document Control

| Field | Value |
|---|---|
| Product | QA Nexus |
| Release | **PM1 (= MVP = v1 GA)** |
| Target Build Window | **18 weeks** (M0–M6: 2026-04-27 → 2026-09-21) |
| Target Audience | Leadership (approval), Product (scope), Engineering (build), Design (UI), QA (acceptance) |
| Primary Goal | Approve PM1 scope, investment, and delivery guardrails; serve as the binding spec for the M0–M6 build |
| Core PM1 AI Agents | **A1** Test Case Generator · **A2** Duplicate Detection · **A4** Defect Intelligence (5-Layer RCA) |
| Deferred Agents | A3 Low-Code (PM3) · A5 Test Selection (PM3) · A6 Synthetic Data (PM2) · A7 Self-Healing (PM2) · A8 Test Planning (PM1+PM2→PM3) · APT (PM2) · VCG (PM3) |
| PM1 UI Inventory | **41 of 41 frames locked** (17 Claude Design + 24 Claude Code, see `../PM1_UI_v2/`) — v2.10 added F28m1 (LLM Provider Configuration) + F26m1 (Agent Model Assignment) for Day-0 setup flow |
| PM1 Frontend Stack | **Next.js 15** + **React 19** + **Tailwind CSS 4** + shadcn/ui + Sonner + lucide-react + react-hook-form + Zod + Framer Motion + TanStack Query v5 |
| PM1 Backend Stack | **NestJS 10 (single service — REST + WebSocket + embeddings)** + Prisma 5 + BetterAuth + Zod + `@xenova/transformers` |
| PM1 Data Stack | **Postgres 15 + pgvector** (Neon free) + **Cloudflare R2** (no Redis, no BullMQ — sessions in Postgres, async via WebSocket) |
| PM1 AI Stack | **Groq free API** (gpt-oss-120b primary, llama-4-scout long-ctx, gpt-oss-20b fast) + **Gemini 2.5 Flash** fallback + **Qwen3-Embedding-0.6B** in-process via @xenova |
| PM1 Total Cost | **$0/month** — all components on free tiers |
| Primary Delivery Motion | Internal pilot on 2–3 Iksula projects (Iksula Returns, Commerce, Mobile App) before wider rollout |
| Pilot Anchor Project | Iksula Returns · Sprint 42 · Release R-2026-04-PaymentV2 · Team (8): Akshay Panchal (QA Lead), Yogesh Mohite (Sr QA + Admin), Kishor Kadam (QA Engineer), Nitin Gomle (QA Engineer), Nadim Siddiqui (QA Engineer), Govind Daware (QA Engineer), Mohanraj K. (QA Engineer), Sagar Todankar (QA Engineer) |

### 1.1 Revision Notes

- **v6.0** reframed the PRD for executive readability and engineering clarity, softening unsupported claims.
- **v6.1 (2026-04-23)** merged V2.0 functional/technical depth back into the v6.0 executive shell: Features F-001..F-010 expanded, Workflows W-001..W-008 added, A1/A2/A4 AI design detailed, data model restored, integration specs added, NFR detail expanded, milestone schedule restored, new sections (Telemetry, Privacy, Launch Checklist) added. Softened-claim framing preserved.
- **v8.1 (2026-04-25 late) — Day-0 LLM configuration flow added; UI inventory closed at 41 frames:**
  - **Gap analysis triggered the addition of 2 modals:** With API keys (Groq, Gemini) now in the stack as the LLM source, Admin/Lead need a UI to configure providers, fetch available models, and assign them per agent. The 39-frame baseline didn't cover this — F28 Settings → Integrations Health tab and F26 Agents had placeholder slots but no actual model-picker UX.
  - **F28m1 LLM Provider Configuration Modal added** (Stage 1120×860). Opens from F28 → "+ Add Provider". Two-pane layout: provider directory (Groq + Gemini connected, 9 more available — OpenRouter, Cerebras, OpenAI/ChatGPT, Anthropic Claude, Kimi, Mistral, Together, Fireworks, Custom OpenAI-compat) + right pane with API key + endpoint + prominent teal "Test connection" button + free-tier callout + 11-model checkbox list with violet "Used by" agent assignment pills.
  - **F26m1 Agent Model Assignment Modal added** (Edit 960×760). Opens from F26 agent card → "Configure model". Per-agent picker: Primary (teal-accent default), Long-context (auto-routing for >100K prompts), Fallback (auto-routing on 429/503/timeout). Read-only routing rules card derived from selections. Sample test panel with realistic Iksula REQ-088 3DS prompt and inline result.
  - **PM1 UI inventory grew 39 → 41 frames.** Provenance: 17 Claude Design + 24 Claude Code. Both new modals follow the locked design discipline (teal=system, violet=AI, no MD3, hardcoded tokens, `min-height: 0` flex pattern for internal scroll, absolute-positioned backdrops on 1600×1024 canvas).
  - **Future-proof architecture:** F28m1's provider directory list is generic — adding a new provider (when more free-tier services emerge) requires no schema or UI redesign, just one new entry. The "Custom (OpenAI-compat)" entry already supports any OpenAI-API-compatible endpoint (self-hosted vLLM, LocalAI, LiteLLM proxy, etc.).
  - **Day-0 setup flow now complete:** Admin signs in → F28 Settings → F28m1 (paste Groq key, test, enable models) → F26 Agents → F26m1 per-agent (assign Primary/Long-context/Fallback) → save → first A1 generation works end-to-end.

- **v8.0 (2026-04-25) — PM1 free-OSS tech stack locked.** See §12.3 for full stack details and `PM1_ERD.md` v2.0 for the engineering architecture.

- **v7.0 (2026-04-25) — PM1 phase-level rebrand and final-state alignment:**
  - **Renamed** from `MVP_PRD` to `PM1_PRD` to align with the project-level naming convention (PM1 → PM2 → PM3 → PM4).
  - **Filed under** `QA Nexus/PM1/PM1_PRD/` so each phase's PRD has a dedicated folder; project-level PRD remains at `QA Nexus/PRD/PRD.md`.
  - **Scope explicitly tightened to PM1 only.** Any PM2/PM3/PM4 content is removed or marked as "deferred — see project-level PRD."
  - **Frontend stack updated** to include Tailwind CSS 3.4 + shadcn/ui + lucide-react + react-hook-form + Zod + Framer Motion. The earlier "hardcoded CSS variables, no Tailwind" rule was a constraint at the *design-spec generation* layer (Stitch / Claude Design) to prevent Material Design 3 drift. In production code, Tailwind with locked tokens declared in `tailwind.config.ts` is the chosen approach because (a) it makes the anti-drift discipline code-reviewable, (b) shadcn/ui gives Radix accessibility (WCAG 2.1 AA) out of the box, and (c) it saves ~3–4 weeks of M0/M1 build time vs. building primitives from scratch.
  - **PM1 UI inventory marked closed at 39 of 39 frames locked** (17 Claude Design + 22 Claude Code). F18m1 Edit Suite Modal added in v2.8. Folder split at v2.9 isolates Claude Code build artifacts to `../PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/` so future Claude Design touch-up writes cleanly to `../PM1_UI_v2/frame  html view/`.
  - **Companion `PM1_ERD.md` created** under `QA Nexus/PM1/PM1_ERD/`. The PM1_ERD covers PM1 architecture diagrams (C4 L1/L2/L3, deployment topology, sequence diagrams for A1/A4/Jira sync/Day-0, state machines, agent orchestration, PII data flow), PM1 data model (TB-001 through TB-018), PM1 API contracts (EP-001 through EP-025), PM1 agents (A1, A2, A4 specs only), and PM1 infrastructure. PM2/PM3/PM4 ERD content remains in the project-level `../ERD/ERD.md`.
  - **Iksula data canon refreshed** to current pilot state: active project Iksula Returns, Sprint 42 Day 9 of 14, release R-2026-04-PaymentV2, full team roster.

### 1.2 Reading Guide

- **Leadership**: Focus on Sections 2–8 and 13–15 for strategic overview and roadmap.
- **Product and Engineering**: Use Sections 7–13 and 15 as implementation baseline.
- **Architecture and Technical**: Sections 12 (Solution Overview), data model, integrations, and NFRs are foundation.
- **Sections 16–20**: Future work, validation notes, telemetry, compliance, and launch readiness.

---

## 2. Executive Summary

QA Nexus is a proposed AI-native QA workspace designed to reduce the fragmentation of modern quality operations. Today, QA teams often move across multiple tools for requirements review, test case authoring, execution tracking, defect triage, reporting, and stakeholder communication. QA Nexus brings those activities into a single workflow with AI assistance embedded where it can reduce repetitive effort without removing human review.

The MVP is positioned as a test management and defect intelligence beachhead. It focuses on the highest-frequency, highest-friction workflows:

- test document creation and knowledge management
- project and user setup with role-based access
- AI-assisted test case generation with duplicate detection
- test execution with evidence capture
- defect creation with AI-assisted root-cause guidance
- reporting for QA leads and management

The product bet is straightforward: if QA Nexus can help teams create better test assets faster, diagnose defects earlier, and report progress with less manual work, it can become the daily operating layer for QA teams instead of another isolated tool.

**Leadership should treat several value claims as pilot targets to validate, not as already-proven outcomes.** The document now clearly separates verified external context from internal product hypotheses.

---

## 3. Strategic Context

### 3.1 Why This Product Now

Three forces make this a timely product opportunity:

1. QA work is still fragmented across disconnected systems, creating handoff friction and weak traceability.
2. AI-assisted software development is increasing delivery speed, which raises the importance of fast, reliable QA feedback loops.
3. Teams need better evidence, governance, and explainability as software products increasingly include AI-assisted code or AI-enabled experiences.

### 3.2 Externally Supported Context

The following points are supported well enough to use in leadership discussions:

- AI-assisted code quality requires stronger review and testing discipline. CodeRabbit reported that AI-authored pull requests in its 2025 study had roughly `1.7x` more issues overall than human-only PRs, with higher security and correctness risk. This is directionally relevant to QA Nexus because faster code generation increases the need for stronger QA workflows.
- The EU AI Act uses a risk-based framework and is becoming applicable in stages. This supports the long-term value of governance, traceability, and auditability features in AI-adjacent testing workflows.
- PRD best practices from Atlassian emphasize clarity on objectives, assumptions, scope, out-of-scope items, user needs, and open questions. This revised PRD has been aligned to that structure.

### 3.3 Internal Strategic Hypotheses

The following should be treated as business hypotheses or pilot goals unless validated with primary evidence from internal pilots or stronger public datasets:

- QA teams lose approximately 45 minutes per day to tool switching.
- AI-using QA professionals materially out-earn non-AI QA professionals by a fixed amount.
- A fixed average ROI such as `688%` can be claimed before pilot baselines are collected.
- A fixed market size number such as `$166.91B` should be treated as a third-party market estimate, not an independently verified fact.

---

## 4. Problem Statement

### 4.1 Core Problem

QA teams work in fragmented systems that separate planning, authoring, execution, triage, and reporting. This leads to duplicated effort, delayed feedback, weak traceability, and limited leadership visibility.

### 4.2 User Problems To Solve

| User Group | Current Pain | Desired Outcome |
|---|---|---|
| Junior and mid-level QA engineers | Manual test case writing, duplicate cases, repeated data entry, scattered context | Faster authoring with guidance and less rework |
| Senior QA and automation engineers | Slow triage, disconnected evidence, weak historical context, multiple tools | Faster diagnosis and stronger cross-project learning |
| QA leads and managers | Manual status reporting, poor visibility, difficult approval trails | Reliable dashboards, faster sign-offs, clearer delivery risk |
| Leadership and stakeholders | Hard to assess release readiness and QA value | Clear quality posture, trend reporting, and traceable release signals |

### 4.3 Jobs To Be Done

- When I receive a PRD or feature brief, I want to generate a usable first draft of a test plan and test cases quickly.
- When I author or review test cases, I want the system to identify likely duplicates before they enter the suite.
- When a test fails, I want evidence and defect context captured in one place so triage is faster.
- When I create a defect, I want likely root cause guidance and clean Jira handoff.
- When leadership asks for status, I want the latest quality picture without manually assembling multiple reports.

---

## 5. Product Vision

### 5.1 Vision Statement

QA Nexus is the operating workspace for QA teams where test planning, authoring, execution, defect management, and reporting happen in one connected system with AI assistance built into the workflow.

### 5.2 Product Promise

QA Nexus does not attempt to replace engineering systems of record such as Jira or source control. Instead, it aims to become the quality operating layer between product inputs and release decisions.

### 5.3 Design Principle

The product should feel calm, credible, and high-signal. The brainstorm's "Quiet Intelligence" direction remains appropriate:

- clarity over visual noise
- AI as an assistant, not a magic black box
- visible provenance for AI outputs
- quick navigation between planning, execution, and decision-making

---

## 6. Users, Personas, and Primary Scenarios

### 6.1 Primary Personas

| Persona | Primary Objective | Key Success Signal |
|---|---|---|
| QA Engineer | Produce and execute good test assets efficiently | Can create, refine, and run test cases with less manual effort |
| Senior QA / Automation Engineer | Improve strategy, quality of cases, and defect diagnosis | Can move from failure to useful triage context quickly |
| QA Lead / Manager | Govern scope, visibility, and team output | Can approve plans, monitor quality trends, and report status fast |
| Management / Stakeholder | Understand readiness and risk | Can review release health and major quality concerns in minutes |

### 6.2 Primary Scenarios

1. PRD to test plan and cases (via A1 Test Case Generator with KB context)
2. Test case authoring with real-time duplicate detection (A2)
3. Test execution with evidence capture and auto-linking
4. Defect filing with AI-assisted RCA (A4) and Jira sync
5. Weekly or release-status reporting with ROI visibility

---

## 7. Product Goals, Success Metrics, and Validation Plan

### 7.1 MVP Goals

| Goal ID | Goal | Type |
|---|---|---|
| G1 | Reduce the effort required to create usable test assets | Product outcome |
| G2 | Reduce time from failure observation to actionable defect entry | Product outcome |
| G3 | Improve reuse of historical QA knowledge across projects | Product outcome |
| G4 | Improve management visibility into QA progress and release risk | Business outcome |
| G5 | Establish a trustworthy AI-assisted workflow with review controls | Trust and governance |

### 7.2 Pilot Metrics (Targets, Not Proven Claims)

These are recommended pilot targets for measurement during internal pilot, not pre-proven claims:

| Metric | Proposed Target | Validation Method | V2.0 Working Hypothesis |
|---|---|---|---|
| Test case draft creation time | `50%+` faster than current baseline | Time-on-task during pilot | V2 target was 90% faster via A1; pilot will validate actual range |
| Defect creation turnaround | `50%+` faster than current baseline | Compare elapsed time before and after adoption | V2 target was 95% faster triage via A4; pilot will validate actual range |
| A1 suggestion acceptance rate | `>=60%` accepted with minor edits or better | In-product review telemetry | |
| A2 duplicate precision | `>=70%` precision on reviewed duplicates | Human-labeled evaluation set | |
| A4 helpfulness score | `>=70%` of triage outputs rated helpful by QA reviewers | Structured feedback prompt | |
| Weekly active usage | `>=75%` of pilot users active 3+ days/week by week 3 | Product analytics | |
| Jira-linked defects flowing through QA Nexus | `>=60%` during pilot window | Integration telemetry | |

### 7.3 Metrics That Must Be Baseline-Driven

The following should not be presented as fixed facts until baseline data exists:

- exact time savings percentages (% reduction vs. baseline)
- exact defect triage acceleration percentages
- exact ROI percentages (cost avoidance)
- exact coverage uplift percentages
- AI agent auto-approval or acceptance rates without pilot data

---

## 8. Scope Summary

### 8.1 In Scope for MVP

| Area | MVP Scope |
|---|---|
| Workspace foundation | Authentication, project setup, role-based access (4 roles: Admin/Lead/QA/Management), project membership |
| Document intelligence | Upload and manage PRD and QA documents (12 templates), Notion-style editor, generate selected QA artifacts, approval workflow |
| Test case management | Author, edit, organize, tag, prioritize, and link test cases; RTM (Requirements Traceability Matrix) |
| AI assistance | A1 generation with clarification questions, A2 dedupe detection, A4 5-layer RCA |
| Execution | Manual execution workflow with evidence linking (screenshots, logs, timestamps) |
| Defects | Defect creation, AI-assisted RCA summary, Jira 2-way sync |
| Reporting | Daily, weekly, sprint, and release-oriented summary reporting; Executive Dashboard with ROI |
| Knowledge layer | Cross-project retrieval of approved QA knowledge via RAG (Retrieval-Augmented Generation) |
| Search and navigation | Global search (Cmd+K omnibox) across cases, defects, documents, KB |
| Governance | Auditability of major AI actions and operational events (immutable audit log) |
| Integrations | Jira (OAuth 2-way), CI webhook (GitHub/GitLab), Slack notifications, Confluence (read PRDs), Resend (email) |

### 8.2 Explicitly Out of Scope for MVP

- replacing Jira for project management
- full cloud device grid (deferred to v1.5+)
- advanced visual regression (deferred to v2+)
- full low-code automation editor (A3 deferred to v1.5+)
- advanced change-based test selection (A5 deferred to v1.5+)
- synthetic test data platform (A6 deferred to v1.5+)
- full career development layer (L7 deferred to v2+)
- full EU AI Act compliance workspace (L6 foundation only; full governance deferred to v1.5+)
- on-prem enterprise deployment (deferred to v1.5+)
- white-label multi-brand productization (deferred to v2+)

### 8.3 Post-MVP Priority Candidates

- low-code automation authoring (A3)
- AI-driven test selection for pull requests (A5)
- richer self-healing maintenance workflows (A7)
- deeper compliance and governance reporting (L6)
- AI product behavior testing for LLM features (APT)
- portfolio and career modules (L7)
- on-prem and multi-tenant SaaS scaling

---

## 9. Functional Requirements

### 9.1 Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | The system shall allow authenticated users to access project-specific workspaces based on role and project membership. | Must |
| FR-002 | The system shall support Admin, Lead, QA, and Management roles with permission-based access control. | Must |
| FR-003 | The system shall allow users to create, switch, archive, and manage projects. | Must |
| FR-004 | The system shall ingest source documents such as PRDs and store versioned project documentation. | Must |
| FR-005 | The system shall generate selected QA documents from approved source material using AI-assisted flows. | Must |
| FR-006 | The system shall support creation, editing, tagging, prioritization, and organization of test cases. | Must |
| FR-007 | The system shall generate draft test cases from approved context through A1. | Must |
| FR-008 | The system shall evaluate semantic similarity between test cases and surface likely duplicates through A2. | Must |
| FR-009 | The system shall allow linking test cases to requirements or source document sections. | Should |
| FR-010 | The system shall support manual test runs with status marking, comments, and evidence association. | Must |
| FR-011 | The system shall create defects from failed tests with pre-filled context and linked evidence. | Must |
| FR-012 | The system shall generate AI-assisted RCA summaries for defects via A4. | Must |
| FR-013 | The system shall synchronize defects with Jira in both directions for supported fields. | Must |
| FR-014 | The system shall provide reporting views for team and management audiences. | Must |
| FR-015 | The system shall maintain an auditable record of high-value actions including AI usage, approvals, and defect updates. | Must |
| FR-016 | The system shall provide global search across projects, documents, cases, and defects according to user permissions. | Should |
| FR-017 | The system shall retrieve relevant historical QA knowledge during AI-assisted workflows. | Should |

### 9.2 Functional Detail by Capability

#### A. Workspace and Administration (F-001, F-002, F-003)

**Projects & Workspaces**:
- Create, switch, archive projects
- Per-project Jira key and environment config
- Multi-tenant isolation via RLS (Row-Level Security)
- Team member management and invitations

**User Management & RBAC**:
- 4-role model: Admin (system), Lead (project), QA (contributor), Management (read-only)
- Email + password identity (BetterAuth), SSO-ready (OpenID Connect hook)
- Audit log for all role changes, user invites, integration credential updates
- Role-based dashboard defaults (Admin → Settings, QA → Test Cases, Management → Exec Dashboard)

#### B. Document Intelligence (F-004, F-005)

**Document Management & Knowledge Base**:
- Upload PRD and QA documents (12 template types in MVP: Test Strategy, Plan, RTM, Estimation, Daily Status, Weekly Report, Sprint Sign-off, Release Readiness, Defect Report, RCA, Exploratory Charter, Regression Outline)
- TipTap/ProseMirror Notion-style block editor with collaborative editing
- Versioning + approval workflow (Draft → Submitted → Approved)
- Lead-approval gate required before document becomes "official"
- RAG ingestion into pgvector for A1/A2/A4 context retrieval
- Knowledge Base as first-class top-level screen (not buried in Settings)
- PDF export of approved documents
- Context form for generation input (module scope, browsers, environments, personas, risk level)

**Acceptance Criteria**:
- Document upload <5s (small files)
- TipTap editor latency <500ms
- RAG retrieval latency <5s for KB
- Approval workflow email sent and link works
- Version history accurate and diffable
- Approved documents visible in KB with full-text search

#### C. Test Case Management (F-006, F-007, F-008, F-009)

**Test Case Authoring & Organization**:
- Hierarchical storage: Project > Module > Test Case
- Notion-style Markdown + BDD Gherkin + traditional step syntax
- Fields: title, description, steps, expected results, preconditions, tags, priority (P0–P5), RTM link, evidence attachment
- Bulk ops: tag, priority, status (Draft/Ready/Deprecated) on multiple cases
- Test case versioning + rollback
- RTM (Requirements Traceability Matrix) as interactive two-pane: left tree (docs), right matrix (cases) with drag-and-link

**AI Assistance**:
- **A1 Test Case Generator**:
  - Inputs: PRD doc (PDF/text/Figma), scope (module), user context (project history, KB)
  - Clarification questions gate: "What environment? Which browsers?" before generation
  - Outputs: 3–20 test cases in BDD + traditional syntax, tagged, RTM-linked, with confidence scores
  - Confidence model: ≥90% auto-ready, 70–89% amber, <70% red/blocked
  - "Reading from KB" label shows which documents were used
  - Acceptance criteria: ≥10 cases from 3-page PRD in <30s; ≥80% auto-approved (confidence ≥80%)

- **A2 Duplicate Detection**:
  - Live duplicate-detection chips visible while authoring (70%+ = amber, 90%+ = red)
  - Semantic embedding (BGE-small-en-v1.5) + title overlap + step-sequence alignment
  - Dismissible, session-persistent chips
  - Confidence model: embedding_score × 0.5 + title_overlap × 0.3 + sequence_align × 0.2
  - Acceptance criteria: Latency <5s; ≥60% true duplicate detection; <5% false positive rate

#### D. AI Assistance Rails

All MVP AI features must follow these controls:

- The user can review before committing
- The system shows confidence or review state
- The system identifies the source context used (KB, PRD, prior cases)
- The system logs the AI action and user decision (acceptance, rejection, edit)
- Failure modes gracefully degrade (low confidence blocks creation, not auto-approve)

#### E. Execution and Defects (F-010, F-011, F-012, F-013)

**Test Execution & Runs**:
- Create runs from selected cases (manual or automated)
- Row-per-case execution view (quick-status buttons: Pass/Fail/Blocked/Skipped)
- Screenshot paste inline (Cmd+V) → auto-attached; timestamps and environment captured
- Create defect from failed case without re-entering common information
- Run history + comparison view (this run vs. previous, trend analysis)
- Acceptance criteria: Run creation <2s; quick-status update <1s; screenshot upload <10s; defect creation <3s

**Defect Management**:
- Defect creation form prefilled from failing run context
- **A4 5-Layer RCA** (Defect Intelligence):
  - Layer 1 (Stack Trace, 90% confidence): Parse error, exception type, file/line
  - Layer 2 (Environment Diff, 80%): Compare staging vs. production, DB version, OS
  - Layer 3 (Configuration, 60%): Feature flags, API endpoints, timeouts, pool sizes
  - Layer 4 (Code Inspection, 50%): Examine logic flow from Git context or test description
  - Layer 5 (Data State, 40%): Hypothesize data state (user locked, test data expired, cache stale)
  - Outputs: RCA summary (root-cause hypothesis + confidence %), 4-category classification (Functional/Performance/Security/Usability), suggested Jira component + assignee
  - Blocking threshold: <70% confidence requires manual RCA before defect creation
  - Acceptance criteria: RCA generation <30s; confidence ≥70% for auto-creation

- **Jira 2-Way Sync**:
  - OAuth 2.0 3-legged flow (no credential storage)
  - Create defect in QA Nexus → Jira issue (POST /rest/api/3/issues)
  - Status/assignee change in Jira → QA Nexus updates (PUT via webhook + 2-min poll fallback)
  - Per-project Jira key config + status_map_json (handle schema drift)
  - Acceptance criteria: Defect creation <3s; Jira sync <5s; bidirectional status sync <2 min lag

- **A2 Defect Deduplication**:
  - Semantic vector similarity check against prior defects in project
  - Same confidence model as test case dedup
  - Acceptance criteria: Latency <10s; ≥60% true duplicate detection; <5% false positives

#### F. Reporting (F-014, F-015, F-016)

**Team and Management Views**:
- **Basic Reporting (M5)**:
  - 4 templated reports: Daily, Weekly, Sprint, Release
  - Auto-populate: run count, pass rate %, new/fixed/aging defects, coverage %, ROI (cost avoidance)
  - Personal dashboard: assigned cases + defects due today
  - Executive Dashboard: 5-KPI summary (pass %, defect trend, coverage %, release RAG, ROI)
  - ROI formula: cost-per-stage defaults ($200 Req / $1K Dev / $2.2K QA / $14.6K Prod) showing cost avoidance
  - Scheduled email delivery (configurable frequency)
  - Acceptance criteria: Report template auto-fills in <30s; email sent ≤5 min of scheduled time; drill-down links work

- **Full Reporting (M6, Post-GA)**:
  - 10 named dashboards: Build Run Health, Failure Analysis, Test Insights, Coverage Trends, Execution Time, Quality Gate, QA Value, Executive Summary, Compliance, Roadmap Fitness
  - Drill-down capabilities + custom date ranges + cohort comparison
  - Quality gates (Pragmatic/Strict/Regulated presets) with pass/fail thresholds
  - PDF/PNG export + scheduled email delivery

**Search and Navigation (F-016)**:
- Global search via Cmd+K / Ctrl+K omnibox
- Search across test cases, defects, documents, KB
- Faceted filtering (type, project, status, assignee, tag)
- Omnibox also handles navigation (jump to screen) and agent invocation (open A1 generator)
- Real-time + eventual-consistency modes (KB <5s, external integrations <30s)
- Acceptance criteria: Omnibox appears <100ms; search latency <2s (KB), <5s (full index)

**Governance & Audit (F-015, F-017)**:
- Immutable audit log for all user actions (login, create/edit/delete case/defect/doc, AI generation, integration sync, role changes)
- Query audit log by date, user, action type, resource type
- Export to CSV for compliance
- All AI agent runs tracked: model, input/output tokens, cost, latency, user feedback
- PII filtering in logs (email addresses, IP addresses masked by default)

---

## 10. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | The product shall present core dashboard and workspace views with acceptable responsiveness for daily use on modern desktop browsers. |
| NFR-002 | The product shall enforce role-based authorization on all project-scoped data access (RLS + NestJS guards). |
| NFR-003 | The product shall maintain auditability for user actions and AI-assisted operations relevant to governance. |
| NFR-004 | The product shall support secure storage of integration tokens and sensitive configuration (AES-256 encryption). |
| NFR-005 | The product shall preserve version history for critical QA artifacts (documents, test cases). |
| NFR-006 | The product shall provide graceful fallback states when AI responses are unavailable, low confidence, or incomplete. |
| NFR-007 | The product shall support observability for errors, latency, and integration health. |
| NFR-008 | The product shall be designed for accessibility and clear readability in core workflows (WCAG 2.1 AA). |
| NFR-009 | The product shall use traceable identifiers for projects, documents, runs, cases, and defects. |
| NFR-010 | The product shall support export of key reports and operational records. |

### 10.1 Detailed NFR Breakdown

#### Performance (NFR-001 to NFR-010)

| NFR | Target | Measurement |
|-----|--------|---|
| **NFR-001: Page Load** | p50 <1.5s, p95 <3s | Next.js Core Web Vitals (FCP, LCP, CLS) |
| **NFR-002: API Latency** | p50 <200ms, p95 <500ms | NestJS endpoint latency (SigNoz) |
| **NFR-003: AI Agent Latency** | A1 <30s, A2 <5s, A4 <30s | FastAPI inference + Hatchet queue time |
| **NFR-004: Global Search** | p95 <2s (KB), <5s (full index) | Postgres tsvector query time |
| **NFR-005: Jira Sync** | <5s per defect, <30s bulk | OAuth + REST API round-trip |
| **NFR-006: Report Generation** | p95 <30s | Aggregation query + rendering |
| **NFR-007: Screenshot Upload** | <10s per image (1 MB) | R2 upload + CDN |
| **NFR-008: Playwright Run** | p50 <5min/case (Docker) | Measured in pilot |
| **NFR-009: Database Query** | p95 <200ms | Postgres slow query log |
| **NFR-010: Cache Hit Rate** | ≥80% for dashboards | Redis cache ratio |

#### Availability (NFR-011)

| Target | SLA | Measurement |
|--------|---|---|
| **MVP (M0–M5)** | 99.5% uptime | <3.6 hours downtime/month |
| **Post-GA (M6+)** | 99.9% uptime | <43 min downtime/month |

**Disaster Recovery**:
- RTO (Recovery Time Objective): <1 hour
- RPO (Recovery Point Objective): <15 min
- Backup Strategy: Postgres daily snapshot to R2; 30-day retention
- Failover: Ollama auto-restart; fallback to Gemini 2.5 Flash if unavailable >5 min

#### Scalability (NFR-012)

| Dimension | MVP Capacity | Scale Path |
|-----------|---|---|
| **Concurrent Users** | 8 (pilot) | Hetzner CX32 @ 50 concurrent |
| **Test Cases** | 50K per project | Indexed via Postgres; shard at 500K |
| **pgvector Embeddings** | 5M vectors | Swap to Qdrant OSS when >5M |
| **Daily Runs** | 1K | Hatchet queue scaling (Postgres-backed) |
| **Document Storage** | 500 GB total | R2 scales automatically |

#### Security (NFR-013 to NFR-020)

| NFR | Requirement | Implementation |
|-----|---|---|
| **NFR-013: Authentication** | Email + password (MVP), SSO-ready | BetterAuth (TS-native) + OpenID Connect hook |
| **NFR-014: Authorization (RBAC)** | 4-role model enforced | Postgres RLS + NestJS guards |
| **NFR-015: Encryption at Rest** | AES-256 for PII fields | Postgres native + application layer |
| **NFR-016: Encryption in Transit** | TLS 1.3 for all APIs | Vercel + Oracle (auto-enforced) |
| **NFR-017: Jira OAuth Token Storage** | Encrypted, no plaintext | AES-256 in Postgres, decrypted at auth time |
| **NFR-018: Audit Trail** | Immutable, queryable | Postgres audit_logs (insert-only) |
| **NFR-019: PII Masking** | Email/phone masked in logs | Query-level masking (show last 4 chars) |
| **NFR-020: SQL Injection Prevention** | Parameterized queries only | Prisma ORM + NestJS (no raw SQL) |

#### Privacy (NFR-021 to NFR-025)

| NFR | Requirement | Implementation |
|-----|---|---|
| **NFR-021: Data Residency** | USA (Oracle Cloud Ashburn, Virginia) | Default; EU residency in v2+ |
| **NFR-022: PII Handling** | Scan A1/A2/A4 inputs for PII; mask before LLM | Regex + HuggingFace PII detector |
| **NFR-023: GDPR Compliance** | Right to delete | Soft-delete (marked deleted_at); hard-delete on 30-day retention |
| **NFR-024: Data Retention** | Test cases: indefinite (unless project deleted); Audit logs: 7 years | Postgres archival policy |
| **NFR-025: Consent Management** | User consent for AI features | Opt-in banner for A1/A2/A4 on first use |

#### Accessibility (NFR-026)

| Target | Scope | Measurement |
|--------|---|---|
| **WCAG 2.1 AA** | Core workflows (login, create case, execute run, log defect) | Axe/WAVE scan, keyboard navigation, screen reader testing |

#### Observability (NFR-027 to NFR-030)

| NFR | Requirement | Implementation |
|-----|---|---|
| **NFR-027: Structured Logging** | All errors, integrations, AI runs logged | Langfuse (traces), SigNoz (metrics), Postgres audit |
| **NFR-028: Integration Health** | Visual widget showing Jira/CI/Slack status | Integration health dashboard + alerts |
| **NFR-029: AI Model Observability** | Per-agent traces (prompt, tokens, latency, cost) | Langfuse agent traces |
| **NFR-030: Error Budget Tracking** | Track error rate per integration | Dashboard showing reliability trends |

### 10.2 Recommended Quality Bars for MVP

- Core workflows optimized for desktop first (responsive for mobile browsers)
- Basic accessibility review before pilot (Axe scan, keyboard nav)
- Encryption in transit and at rest for sensitive operational data
- Structured logging for integration failures
- Retry and fallback behavior for Jira synchronization

---

## 11. Core Workflows

This section describes the primary user scenarios and interaction patterns, from V2.0 baseline.

### Workflow W-001: QA Creates Test Cases from Uploaded PRD (A1 + A2)

**Narrative**:

1. QA uploads PRD (PDF/Word) via Documents screen → clicks "Test Case Generation" button
2. A1 asks clarification questions: "Which modules? Which browsers? Performance critical?"
3. QA answers form (or uses KB defaults from prior projects)
4. A1 generates 5–20 test cases in BDD Gherkin + traditional syntax, tagged, prioritized
5. A2 shows live duplicate-detection chips: "Similar to Case #123 (92% match)" → QA dismisses or merges
6. A1 cases show confidence: ≥90% auto-ready, 70–89% flag for review, <70% blocked
7. QA edits cases inline (Notion editor), maps to Requirements via RTM drag-link
8. QA clicks "Approve All" or selects subset; cases move to Ready state
9. Email notification to Lead for final sign-off (optional gate)

**Acceptance Criteria**: ≥10 test cases generated from 3-page PRD in <30s; ≥80% of A1 output auto-approved (confidence ≥80%); A2 catches ≥60% of true duplicates in pilot dataset.

---

### Workflow W-002: QA Executes Test Suite and Logs Defect (Jira 2-way)

**Narrative**:

1. QA views personalized dashboard: assigned cases for today's sprint
2. QA creates a Run ("Sprint 14, Checkout Feature, Chrome")
3. For each case: Mark Pass/Fail/Blocked/Skipped with quick-status buttons
4. On Fail: QA pastes screenshot, types brief note, clicks "Create Defect"
5. Defect form auto-populated: test case title + description + screenshot + run context (browser, env, timestamp)
6. System shows A4 RCA summary (stack trace parsed, env diff highlighted, layer confidence scores)
7. QA reviews RCA, optionally adds manual notes, clicks "Save to Jira"
8. Defect syncs to Jira (title, description, priority, assignee) via OAuth, creates issue in PROJ project
9. Later: Jira status changes (e.g., Developer marks as "In Progress") → QA Nexus updates defect status bidirectionally via webhook
10. QA can see Jira issue link directly on defect card

**Acceptance Criteria**: Time-to-log-a-defect ≤90s (measured week 1 of pilot); Jira sync completes in <5s for ≥95% of defects; bidirectional status sync <2 min lag.

---

### Workflow W-003: QA Lead Reviews & Approves Test Strategy (Document Management + A1)

**Narrative**:

1. Sr QA creates Test Strategy doc via Documents screen (12 templates available)
2. A1 generates draft strategy from PRD (scope, approach, entry/exit criteria, test types, environments)
3. Sr QA edits strategy in TipTap editor (Markdown blocks, comments, suggestions)
4. Sr QA clicks "Submit for Approval" → sends to Lead via email with link
5. Lead opens doc in QA Nexus, sees version history and diff-view (vs. prior version)
6. Lead comments inline ("Increase load-test duration from 2h to 4h"), approves
7. System emails Sr QA with approval + comments; strategy moves to Approved state
8. Document is frozen (read-only); any future edits create new version

**Acceptance Criteria**: Document generation ≤30s; approval workflow email sent and link works; version history accurate and diffable; approval audit trail immutable.

---

### Workflow W-004: Automation Engineer Sets Up CI/Webhook Integration

**Narrative**:

1. Admin goes to Integrations screen, clicks "Add CI Integration"
2. Selects "GitHub Actions" or "GitLab CI" or "Generic Webhook"
3. System displays webhook URL and sample payload schema
4. Automation Engineer copies webhook URL into CI YAML (GitHub Actions or GitLab CI pipeline)
5. Next CI run posts test results to webhook (JUnit XML, pass/fail counts, error logs)
6. QA Nexus receives webhook, parses results, creates Run with matching test case results
7. If test case in Run has recorded Playwright script, auto-link is shown
8. Failed tests show auto-evidence (screenshot from automation run)

**Acceptance Criteria**: Webhook integration <5 min to set up; result ingestion <10s latency; 100% of CI webhook payloads parsed without error.

---

### Workflow W-005: QA Lead Generates Weekly Report (Reports)

**Narrative**:

1. Lead clicks "Reports" screen, selects "Weekly Report" template
2. System auto-populates: run count (total / pass / fail / blocked), defect count (new / fixed / aging), coverage %, ROI (cost avoidance)
3. Lead edits report title, adds executive summary, clicks "Schedule Email"
4. Report email sent to stakeholders (configurable list) every Friday 9 AM
5. Report includes: metrics table, trend charts (7-day rolling), release RAG, drill-down links to QA Nexus dashboard

**Acceptance Criteria**: Report template auto-fills in <30s; email delivery ≤5 min; drill-down links work (no 404s).

---

### Workflow W-006: Management Views Exec Dashboard (Release Readiness)

**Narrative**:

1. Manager logs in, lands on Exec Dashboard (default for Management role)
2. Dashboard shows: Pass Rate %, Defect Trend (7-day), Coverage %, Release RAG, ROI
3. Manager sees Release RAG = Green (all gates pass)
4. Manager clicks Defect Trend chart → drills to "Active Defects by Severity" list
5. Manager clicks a P0 defect → sees A4 RCA analysis (root cause, confidence, suggested owner)
6. Manager clicks "Approve Release" button; system emails QA Lead confirmation + timestamp audit trail

**Acceptance Criteria**: Dashboard loads <3s; drill-down fast; RAG calculation accurate per quality gate rules; "Approve Release" creates immutable audit record.

---

### Workflow W-007: A1 Test Generator Asks Clarification Questions

**Narrative**:

1. QA uploads PRD or selects "Generate Test Plan" from document
2. A1 detects ambiguities (incomplete scope, no browser list, no env) and shows form: "Which modules? Desktop / Mobile / Both? Staging or Production environment?"
3. QA answers via form (dropdown, text, multi-select)
4. A1 regenerates plan/cases with clarified context
5. If QA skips answers (leaves blank), A1 uses KB defaults (from prior projects) or red-flags with "Assumption: mobile not tested"

**Acceptance Criteria**: Clarification form shown before generation in 100% of ambiguous cases; KB defaults applied correctly; red-flag assumptions visible on output.

---

### Workflow W-008: Defect Deduplication via A2 Vector Search

**Narrative**:

1. QA logs defect: "Login button not clickable on mobile"
2. System runs A2 (semantic similarity) against all prior defects in project
3. A2 finds match: Defect #42 from 2 weeks ago ("Mobile login unresponsive") at 85% similarity
4. System shows chip: "Potential duplicate: #42 (85% match)" with link
5. QA dismisses (if false positive) or clicks "Merge" (links defect #42 as related, opens Jira issue lookup)
6. If <70% confidence, system auto-creates new defect (no chip shown); ≥90% blocks creation and forces review

**Acceptance Criteria**: A2 latency <10s; ≥60% true duplicate detection rate; <5% false positive rate (pilot data); dismiss action tracked for model feedback.

---

## 12. Solution Overview

### 12.1 Product Modules

| Module | Purpose |
|---|---|
| Workspace Foundation | Identity, projects, roles, and membership (RBAC via BetterAuth + Postgres RLS) |
| Document Studio | Document upload, versioning, approvals, AI-assisted QA docs (TipTap editor + Notion-style blocks) |
| Test Case Workspace | Test case authoring, organization (hierarchical modules), similarity review, RTM linking |
| Execution Hub | Run management, case result capture, evidence handling (screenshots, logs, timestamps) |
| Defect Intelligence | Defect workflow, A4 RCA summary, Jira synchronization (OAuth + webhook/poll) |
| Reporting Layer | Team and management summaries (templated reports, Exec Dashboard, scheduled email) |
| Knowledge Layer | Retrieval of approved historical QA context via RAG (pgvector embeddings + BGE model) |
| Search & Navigation | Global omnibox (Cmd+K), Postgres full-text, faceted filtering |
| Integration Hub | Jira, CI webhook, Slack, Confluence, Resend integration orchestration |
| Audit & Governance | Immutable audit log, AI agent run tracking, PII masking, RBAC enforcement |

### 12.2 AI Agent Responsibilities

| Agent | MVP Role | Guardrail |
|---|---|---|
| A1 | Generate draft test cases and selected QA artifacts | User review required before finalization; confidence scoring gates creation |
| A2 | Surface likely duplicate test cases or related artifacts | Suggestive, not destructive; user-dismissible chips; false positive tracking |
| A4 | Provide structured RCA guidance for failures and defects | Advisory output, not automatic root-cause truth; <70% confidence blocks creation |

### 12.3 Technology Direction (PM1 — LOCKED v8.0, 2026-04-25)

**Total cost target: $0/month for the PM1 pilot** (8 users × 12 hr/day, 1–2 month internal Iksula pilot). All software is OSI-approved free OSS; all infrastructure runs on free tiers with documented OSS migration paths if free tiers ever change.

**Frontend (PM1):**
- **Next.js 15** App Router · **React 19** · TypeScript 5.x (RSC, useActionState, useFormStatus)
- **Tailwind CSS 4** (CSS-first config, ~30% smaller bundle, faster builds — current stable as of April 2026)
- **shadcn/ui** (Radix-based, copy-paste, WCAG 2.1 AA, MIT) — locked design tokens in `tailwind.config.ts`
- **Sonner** (replaces deprecated shadcn `toast` component)
- **lucide-react** icons
- **react-hook-form + Zod resolver** for forms (Zod schemas shared with NestJS)
- **Framer Motion** for live-state animations (F19 pulsing pill, F26 transitions)
- **TanStack Query v5** server-state cache + optimistic mutations
- **TipTap** rich text editor for KB (F15) and defect notes (F22)
- Type fonts: Inter (UI), DM Sans (display 18+), JetBrains Mono (IDs/timestamps)

**Backend / API (PM1) — single NestJS service:**
- **NestJS 10** — REST + WebSocket in one service (TypeScript, modular, decorator-driven)
- **Node.js 20 LTS**
- **Prisma 5** for type-safe migrations and queries
- **Zod** for input validation (same schemas as frontend)
- **BetterAuth** (MIT) for magic-link + Jira OAuth 3LO
- **`@xenova/transformers`** (Apache 2.0) for embeddings — Qwen3-Embedding-0.6B runs in pure JS/WASM directly inside NestJS, no separate Python service needed
- **Groq SDK** for direct LLM API calls
- **Hand-rolled LLM gateway** (or `freellm` MIT package) — primary Groq → fallback Gemini
- **`ws`** (MIT) for WebSocket gateway (F19 live updates)

> **Why no FastAPI:** With Groq doing all LLM inference, the original FastAPI service had only embedding + orchestration left. Both can run cleanly in NestJS via `@xenova/transformers` (embeddings) and direct Groq SDK calls (orchestration). One service, one language, simpler ops, fits free-tier budget. FastAPI can be added in PM2 if Python-specific work emerges.

**AI / LLM stack (PM1) — all free APIs:**
- **A1 Test Case Generator (primary):** Groq → `openai/gpt-oss-120b` (production model, 500 tok/s, 131K context, 1,000 RPD free)
- **A1 long-context variant:** Groq → `meta-llama/llama-4-scout-17b-16e-instruct` (10M context, preview tier — for full PRD ingestion)
- **A4 5-Layer RCA:** Groq → `openai/gpt-oss-120b` (reasoning capability)
- **A4 fast layers (L1 stack analysis):** Groq → `openai/gpt-oss-20b` (1,000 tok/s, 14,400 RPD free)
- **A2 Duplicate Detection:** No LLM call — pure embedding similarity (in-process via @xenova)
- **Fallback LLM:** Gemini 2.5 Flash free tier (1,500 RPD, kicks in when Groq throttles)
- **Failover gateway:** Hand-rolled in NestJS (or `freellm` OSS package) with retryable-error detection
- **Embedding model:** **Qwen3-Embedding-0.6B** (Apache 2.0, 1024-dim, runs CPU in 200 MB RAM, ~50 ms per embedding via `@xenova/transformers`)
- **Eval framework:** **DeepEval** (MIT, pytest-native) — runs on engineering Colab Free for golden-set evaluation, never user-facing

**Data layer (PM1) — managed free tiers:**
- **PostgreSQL 15** + **pgvector** extension on **Neon free** (0.5 GB storage, 100 CU-hours/month, scale-to-zero)
- **No `pgvectorscale`** — not supported on Neon free, and not needed at PM1 scale (~50K vectors)
- **No Redis/Valkey** — sessions stored in Postgres (BetterAuth supports this), in-process LRU cache for hot data, WebSocket pub/sub via NestJS event emitter. Eliminates an entire infrastructure tier for PM1.
- **Cloudflare R2 free** (10 GB storage, 1M Class A ops, 10M Class B ops) for evidence — screenshots, HAR, console logs
- **No BullMQ** — A1/A4 calls run inline async (5–15 sec via Groq), client gets 202 + WebSocket completion event. BullMQ adds back in PM2 if durable retry semantics are needed.

**Observability (PM1):**
- **OpenTelemetry SDK** (Apache 2.0) in NestJS for traces, metrics, logs
- **Grafana Cloud free tier** (50 GB logs, 10K series metrics, 50 GB traces/month — most generous free observability in 2026)
- **Better Stack free tier** for alerting (Slack integration, on-call schedule)
- **UptimeRobot free tier** to ping `/health` every 5 minutes — keeps Render free dyno warm during business hours
- Audit log: HMAC-SHA256 chained Postgres rows (visible in F28 Settings & Audit)

**Hosting (PM1) — all free tiers:**

| Layer | Provider | Free tier spec |
|---|---|---|
| Frontend | **Cloudflare Pages** | Unlimited bandwidth, 500 builds/month, 100K function reqs/day |
| API + WebSocket | **Render free** (Hobby plan) | 750 hr/month, 512 MB RAM, sleeps after 15 min idle (mitigated by UptimeRobot keep-alive) |
| Postgres + pgvector | **Neon free** | 0.5 GB, 100 CU-hr, scale-to-zero |
| Object storage | **Cloudflare R2 free** | 10 GB, 1M Class A / 10M Class B ops |
| Email transactional | **Resend free** | 100 emails/day, 3,000/month (magic links + invites + digests) |
| Keep-alive | **UptimeRobot free** | 50 monitors, 5-min ping interval |
| Source control | **GitHub** | Free private repos |
| CI/CD | **GitHub Actions** | 2,000 min/month free for private repos |
| Backups | **GitHub Actions cron → R2** | Weekly Postgres dump (1-year history) |
| Secrets (PM1) | **Render env vars + GitHub Secrets** | Free, encrypted at rest |
| Secrets (PM3+) | **OpenBao** (MPL 2.0) | Self-host migration |
| Domain (optional) | Use *.cloudflare-pages.dev free OR custom domain ~$10/year | — |

**Internal QA dogfood (PM1):** Playwright for E2E tests on QA Nexus itself.

**Engineering dev environment (M0–M6 build):** Colab Free + Kaggle Free combined (60 GPU hours/week) for local prototyping, eval batch runs, and model experiments. **Never connected to user-facing pilot.** Colab Pro+ (paid $50/mo) explicitly NOT adopted — confirmed skip per scope review.

**Total monthly cost: $0** (entirely on free tiers). Migration paths to paid tiers documented at every layer; cheapest paid step is Render Starter ($7/mo) when cold-start UX outgrows the keep-alive workaround.

**4 critical adjustments locked in v8.0** (vs v7.0):
1. Frontend versions bumped: Tailwind 3.4 → **Tailwind 4**, React 18 → **React 19**, Next.js 14 → **Next.js 15**
2. **FastAPI dropped** — single NestJS service handles everything for PM1
3. **Redis/Valkey + BullMQ dropped** — sessions in Postgres, async via inline + WebSocket
4. **pgvectorscale dropped** — not on Neon free; vanilla pgvector handles PM1 scale

> **Why Tailwind + shadcn/ui despite the "no Tailwind" rule in `01_SYSTEM.md`:** That rule applies to *design-spec generation* (Stitch / Claude Design / Claude Code generating static HTML frames in `PM1_UI_v2/frame  html view/`). It was added because v1 Stitch extended `tailwind.config.js` with Material Design 3 variants and drifted across 27 of 27 frames. In production React code, Tailwind 4 with locked tokens in CSS-first config is the right approach — anti-drift becomes code-reviewable (a PR adding `bg-orange-400` fails because `orange` isn't in the theme), and shadcn/ui gives Radix accessibility for free.

Leadership should approve product scope through this PRD. Detailed engineering architecture lives in the companion `PM1_ERD.md`.

### 12.4 AI System Design — A1 Test Case Generator

**Inputs**:
- Source document (PRD as PDF/text/Figma link, or prior Test Plan)
- User context (module scope, target browsers, environments, team project history)
- Knowledge Base (approved documents from same project or org)
- Clarification Q&A (user answers: "Which modules?" "Desktop/Mobile/Both?" "Performance critical?")

**Workflow**:
1. User uploads document or clicks "Generate Test Cases"
2. A1 (FastAPI agent on LangGraph) detects ambiguities in scope
3. If ambiguities detected (no browser list, no env, incomplete module names):
   - A1 returns clarification form to user (via frontend modal)
   - User answers form; A1 re-runs with clarified context
4. If ambiguities resolved (or user skips and KB provides defaults):
   - A1 retrieves KB context (pgvector similarity search: top-5 related documents)
   - A1 reasons: "Based on PRD section 3.2 and prior 'Checkout' test cases (from KB), I recommend 5 cases for Login module, 3 for Signup, 2 for Payment"
   - A1 generates 3–20 test cases in BDD Gherkin + traditional syntax
   - Per case: title, description, steps, expected results, tags (inferred: module, feature, risk level), priority (P0–P5)
5. A1 scores confidence per case (0–100%):
   - ≥90%: Auto-ready (green badge, no review required)
   - 70–89%: Amber (flag for review, user must click "Accept" or "Regenerate")
   - <70%: Red (blocked, returns to user with "Confidence too low; please regenerate with more context")
6. A1 returns cases with "Reading from KB: Login Test Strategy v2, Checkout Test Plan v1" label visible
7. QA accepts cases → A2 runs dedup check immediately

**Confidence Model**:
- Base score: 80% (default for well-scoped PRD)
- Penalties:
  - No prior test cases in KB for this module: -10%
  - Ambiguous requirements (multiple interpretations): -15%
  - Complex feature (>5 components): -5%
- Bonuses:
  - Detailed PRD with examples: +5%
  - Recent similar project in KB: +10%
- Final score = clamp(base + penalties + bonuses, 0, 100)

**Failure Handling**:
- If confidence <70%: Block case creation; return with "Try again" button + suggestions
- If partial failure (5 of 10 cases fail): Return passing 5 cases + error detail for failed ones
- If full failure (Gemma 4 inference timeout): Fallback to Gemini 2.5 Flash (free tier) for quick generation; mark as "Fallback LLM used"

**Observability**:
- Langfuse trace: prompt, token usage (input/output), latency, cost
- Confidence heatmap per case (visible in frontend)
- User feedback loop: QA marks case as "Poor quality" → interaction logged for A1 retraining signal
- Audit trail: Every case linked to generation run + source document + timestamp + user who generated

---

### 12.5 AI System Design — A2 Duplicate Detection

**Inputs**:
- New test case (title, description, steps, tags)
- Project's existing test cases (embeddings in pgvector)
- Similarity threshold (adjustable: 50%, 70%, 90%)

**Workflow**:
1. QA creates or A1 generates test case
2. A2 (FastAPI agent) triggers immediately (on case save)
3. A2 generates embedding for new case (BGE-small-en-v1.5 model, CPU inference)
4. A2 queries pgvector: `SELECT * FROM test_cases WHERE embedding <-> new_embedding < 0.3` (cosine distance <0.3 ≈ 70% similarity)
5. A2 ranks matches by similarity score + title overlap + step-sequence alignment
6. For each match:
   - If similarity ≥90%: Show red chip "Likely duplicate: Case #123 (92% match) → Merge?"
   - If 70–89%: Show amber chip "Similar: Case #456 (78% match) → Review?"
   - If <70%: No chip shown
7. Chips are dismissible (per session); user can click "Merge" to link cases or "Dismiss" (interaction logged)

**Confidence Model**:
- Embedding similarity (cosine): 0–1 score, directly mapped to % match
- Title overlap (Jaro-Winkler): 0–1 score, multiplied by 30% weight
- Step-sequence alignment (SequenceMatcher): 0–1 score, multiplied by 20% weight
- Final confidence = embedding_score × 0.5 + title_overlap × 0.3 + sequence_align × 0.2

**Failure Handling**:
- Embedding generation timeout: Skip A2 (no blocking); case created without dedup
- pgvector query timeout: Fallback to Postgres full-text search (less accurate)
- False positive (user dismisses after merge): Interaction tracked; A2 learns to down-weight similar pattern in future

**Observability**:
- Langfuse embedding trace: model, latency, cost
- Dedup chip interaction log: shown, dismissed, merged
- Matrix view: all matches ranked, exportable as CSV for team review
- Model performance: track false positive rate (user dismisses), false negative rate (similar cases not flagged)

---

### 12.6 AI System Design — A4 Defect Intelligence & 5-Layer RCA

**Inputs**:
- Failing test run (test case, error log, stack trace, screenshot, browser/OS, environment, timestamp)
- Project KB (approved test strategies, prior defects with RCA)
- Jira issue history (for defect clustering)

**Workflow**:
1. QA logs defect from failing run → A4 triggered automatically
2. A4 (FastAPI LangGraph agent) starts 5-layer RCA pipeline:
   - **Layer 1 — Stack Trace Analysis** (confidence: 90%):
     - Parse error message, file/line number, exception type
     - Look for common patterns (null pointer, assertion failure, timeout)
     - Output: "Root cause candidate: NullPointerException in LoginService.validate() at line 42"
   - **Layer 2 — Environment Diff** (confidence: 80%):
     - Compare run environment (staging vs. production, Chrome version, OS version) vs. prior successful run
     - Detect changes (e.g., "Staging DB upgraded to v15 yesterday")
     - Output: "Env difference: DB version changed from 14 to 15; may be schema drift"
   - **Layer 3 — Configuration Analysis** (confidence: 60%):
     - Check project config (feature flags, API endpoints, timeouts, pool sizes)
     - Detect if config mismatch could cause failure
     - Output: "Config hypothesis: connection pool size reduced from 50 to 10; timeout likely"
   - **Layer 4 — Code Inspection** (confidence: 50%):
     - Examine code context from Git repo (if available via API) or test case description
     - Reason about logic flow that could cause failure
     - Output: "Code hypothesis: LoginService.validate() doesn't handle null password; new test case exposes bug"
   - **Layer 5 — Data State Analysis** (confidence: 40%):
     - Hypothesize data state (user account locked, test data expired, cache stale)
     - Output: "Data hypothesis: test user account might be locked after 5 login failures; reset needed"
3. A4 ranks layers by confidence; identifies most likely root cause (e.g., Layer 1 + Layer 4)
4. A4 suggests 4-category classification: Functional / Performance / Security / Usability
5. A4 suggests Jira component (e.g., "LoginService") and assignee (based on prior defect history)
6. A4 runs dedup check against prior defects in project (A2 semantic similarity)

**Outputs**:
- RCA summary (1–3 paragraphs, plain English):
  ```
  Root cause (90% confidence): Stack trace shows NullPointerException in LoginService.validate(). 
  Contributing factor (60% confidence): Staging database upgraded yesterday; schema may have changed.
  Hypothesis to verify: Check if validate() method handles null password after recent refactor.
  
  Classification: Functional defect
  Suggested component: LoginService
  Suggested assignee: john.doe (fixed similar issue 2 weeks ago)
  Similar defect: #42 (88% match) — "Login validation fails with special chars" (fixed in v2.1)
  ```
- RCA tree (interactive graph): 5 layers as nodes, confidence scores, drill-to-evidence links
- Blocked if confidence <70% (requires manual RCA)

**Confidence Model**:
- Per-layer scores (fixed by design, per layer description above)
- Composite score = max(layer_confidences) (most confident layer sets overall confidence)
- Blocking threshold: <70% composite confidence

**Failure Handling**:
- Layer parsing fails (unrecognized error format): Skip that layer, continue with others
- KB/Jira lookup fails: RCA completes with available layers; missing layers noted
- Defect similarity lookup fails: RCA completes without dedup suggestions
- Confidence <70%: Block defect creation; QA prompted: "RCA confidence too low (62%). Review stack trace manually and re-create."

**Observability**:
- Langfuse agent trace: per-layer reasoning, token usage, latency (target: <30s)
- RCA tree visualization (graph or collapsible summary)
- Human feedback labels: QA marks RCA as "Correct" or "Incorrect" → signal for A4 retraining
- Audit trail: RCA reasoning persisted with defect; immutable record

---

### 12.7 Agent Orchestration (LangGraph + Hatchet)

**LangGraph Setup**:
- **A1 Test Generator**: LangGraph StateGraph with 4 nodes:
  1. Clarification Questions (conditional branching: if ambiguities detected, ask user; else skip)
  2. KB Context Retrieval (pgvector semantic search)
  3. Case Generation (Gemma 4 inference)
  4. Confidence Scoring (per-case)
- **A2 Duplicate Detection**: Stateless FastAPI endpoint (synchronous), called on case save
- **A4 RCA**: LangGraph StateGraph with 5 nodes (Layer 1–5) + merge node (rank by confidence)

**HITL (Human-in-the-Loop) Interrupts**:
- A1: If confidence <70%, pause before case creation; QA chooses "Accept with warnings" or "Regenerate"
- A4: If confidence <70%, block defect creation; QA prompted to run manual RCA

**Hatchet Job Queue** (OSS, Postgres-backed):
- All async agent jobs (A1, A4, KB embedding indexing, report generation) queued via Hatchet
- Retry policy: 3 attempts with exponential backoff (1s, 2s, 4s)
- Timeout: 60s per job (A1), 30s per job (A2), 120s per job (A4 + Jira dedup)
- Monitoring: Hatchet dashboard shows job queue depth, failure rate, latency percentiles

---

### 12.8 Cost & Latency Budgets

| Agent | Input Type | Target Latency | Cost per Run | Max Runs/Month (MVP) |
|---|---|---|---|---|
| **A1 (Generator)** | PRD 3–10 pages | <30s | $0.05 (Gemma) | 2,000 |
| **A2 (Dedup)** | Single case | <5s | $0.001 (embedding) | Unlimited |
| **A4 (RCA)** | Error log + stack trace | <30s | $0.08 (Gemma multi-layer) | 1,000 |

**LLM Model Cost** (MVP, self-hosted on Oracle Always Free):
- Gemma 4 26B: $0 (self-hosted, only compute cost)
- Gemini 2.5 Flash (fallback): $0.075 per 1M input tokens (free tier: 1,500 req/day, 1M tok/min)
- BGE-large embedding: $0 (self-hosted, CPU inference)

**Infrastructure Cost** (MVP, all-in):
- Oracle Always Free VM: $0/mo
- Vercel Hobby (Next.js frontend): $0/mo
- Cloudflare R2 (10GB storage): $0/mo
- Upstash Redis (10K commands/day): $0/mo
- Resend (3K emails/mo): $0/mo
- **Total MVP cost: $0/mo** (scaling path: Hetzner CX32 @ $7.40/mo when needed)

---

### 12.9 Guardrails & Safety

**Prompt Injection Defense**:
- All user inputs (PRD text, test case steps, error logs) sanitized before passing to LLM
- Prompt templates locked (no user-controlled prompt construction)
- Token limit enforced: A1 input capped at 4K tokens (PRD summary); A4 input capped at 2K tokens (error log + context)

**PII Handling**:
- A1/A2/A4 inputs scanned for PII patterns (email, phone, SSN, credit card)
- If PII detected: User warned; PII masked in LLM input (e.g., "test@example.com" → "TEST_EMAIL")
- A1 output scanned for PII; if found, flag returned to user (no defect creation until reviewed)

**Hallucination Containment**:
- A1 confidence scoring (0–100%) trained on human feedback; confidence <70% blocks auto-approval
- A4 layer-by-layer confidence (not single end-to-end score) reduces hallucination risk
- All agent outputs include "Read from KB" or "Assumptions made" labels to indicate what context was used

**Model Output Validation**:
- A1 output schema validation: case must have title, steps, expected results (no missing fields)
- A4 output must include at least one layer with confidence >60% (no empty RCA)
- A2 output must have similarity score 0–1 (no invalid scores)

---

### 12.10 Data Model

**Core Entities**:

| Entity ID | Entity Name | Description | Key Attributes |
|---|---|---|---|
| **CO-001** | Organization | Tenant container (Iksula initially; SaaS multi-tenant path v2+) | org_id, name, plan_tier, billing_contact |
| **CO-002** | Project | QA project (Sprint 14, Checkout Feature, etc.) | project_id, org_id, name, jira_key, archived_at |
| **CO-003** | User | Team member (QA engineer, lead, admin) | user_id, email, password_hash, full_name, role |
| **CO-004** | ProjectMember | User + Project + Role mapping | user_id, project_id, role (Admin/Lead/QA/Mgmt) |
| **CO-005** | Environment | Test environment (Staging, Production, Dev) | env_id, project_id, name, base_url, db_connection_string |
| **CO-006** | Document | Uploaded or created document (PRD, Test Plan, RTM) | doc_id, project_id, title, type (enum), content, version, approved_at |
| **CO-007** | TestCase | Individual test case (unit of testing) | case_id, project_id, module_id, title, description, steps (JSON), preconditions, tags, priority, status (Draft/Ready/Deprecated), created_by, rtm_links |
| **CO-008** | Module | Test case hierarchy (grouping) | module_id, project_id, name, parent_module_id (nullable) |
| **CO-009** | TestPlan | Named grouping of test cases (for runs) | plan_id, project_id, name, cases (many-to-many via TestPlanCase) |
| **CO-010** | TestRun | Execution session (one run of one or more cases) | run_id, project_id, plan_id, env_id, browser_os, status (In Progress / Completed), started_at, completed_at, created_by |
| **CO-011** | RunResult | Per-case result within a run | result_id, run_id, case_id, status (Pass/Fail/Blocked/Skipped), notes, screenshot_url, error_log, defect_id (nullable) |
| **CO-012** | Defect | Bug record (synced to Jira) | defect_id, project_id, case_id (nullable), title, description, steps, priority, severity, status (Open/In Progress/Fixed/Duplicate), jira_issue_key, jira_issue_url, created_at, created_by, resolved_at |
| **CO-013** | RCALayer | 5-layer RCA output per defect (Layer 1–5) | rca_id, defect_id, layer_number, hypothesis (text), confidence (0–1), evidence_link, ai_agent_run_id |
| **CO-014** | RTMLink | Requirements ↔ Test Case mapping | rtm_id, document_id (requirement), case_id (test case), coverage_status (Covered/Pending/At-Risk) |
| **CO-015** | AIAgentRun | Audit trail for every AI agent execution | run_id, agent_id (A1/A2/A4), input_tokens, output_tokens, model_used (Gemma/Gemini), cost, latency_ms, output_json, confidence_score (if applicable), user_feedback (Correct/Incorrect/Partial), created_at |
| **CO-016** | KBEntry | Knowledge Base document (approved doc indexed for RAG) | kb_id, project_id, doc_id, embedding (pgvector), chunk_index, content_text, source_doc_title, created_at |
| **CO-017** | JiraIntegration | Jira OAuth credentials + config per project | integration_id, project_id, jira_instance_url, oauth_token (encrypted), status_map_json (Jira status → QA Nexus status), last_sync_at |
| **CO-018** | CIWebhook | CI webhook config (GitHub Actions, GitLab CI, etc.) | webhook_id, project_id, webhook_url (to QA Nexus), auth_token, ci_provider (enum), created_at |
| **CO-019** | AuditLog | All user actions logged (RBAC, integrations, AI agents) | log_id, user_id, action_type (enum), resource_type (Case/Defect/Doc/User), resource_id, before_state (JSON, nullable), after_state (JSON, nullable), created_at |
| **CO-020** | ReportSchedule | Scheduled report delivery (Daily, Weekly, Sprint, Release) | schedule_id, project_id, report_type (enum), recipients (email array), frequency (cron), last_run_at, next_run_at, enabled |

**Relationships (ERD Summary)**:

```
Organization (1) --< (M) Project
Project (1) --< (M) TestCase, Document, TestPlan, TestRun, Defect, Environment, JiraIntegration, CIWebhook, KBEntry

Module (1) --< (M) TestCase  // Hierarchical
TestCase (1) --< (M) RTMLink
Document (1) --< (M) RTMLink
TestPlan (M) --< (M) TestCase (via TestPlanCase junction)
TestRun (1) --< (M) RunResult
RunResult (M) --< (1) TestCase
RunResult (M) --< (1) Defect (nullable)
Defect (1) --< (M) RCALayer
TestCase (M) --< (M) AIDuplicate (self-join for A2 dedup tracking)

User (1) --< (M) ProjectMember
ProjectMember (M) --< (1) Project
AIAgentRun (0..1) --< (1) TestCase (created_by A1)
AIAgentRun (0..1) --< (1) Defect (created_by A4)
```

---

### 12.11 Integrations

#### Jira Cloud (2-Way Sync)

**Auth**: OAuth 2.0 3-legged flow (no credential storage)

**Endpoints**:
- Create Issue: `POST /rest/api/3/issues` (title, description, priority, component, assignee)
- Get Issue: `GET /rest/api/3/issues/{key}` (fetch status, assignee, comments)
- Update Issue: `PUT /rest/api/3/issues/{key}` (status, assignee, comment)
- Search Issues: `GET /rest/api/3/search` (find existing issue for dedup)

**Events**:
- **QA Nexus → Jira**: Defect created (POST), status/assignee updated (PUT), comment added (POST)
- **Jira → QA Nexus**: Issue status changed, assignee changed, commented (via webhook or 2-min poll)

**Rate Limits**: 300 API calls per minute (Jira Cloud)

**Reliability**:
- Webhook push with 2-min poll fallback (if webhook fails 3x, revert to polling)
- Retry on 429: exponential backoff (1s, 2s, 4s)
- Queue failed syncs via Hatchet (retry up to 3x)

**Per-Project Config**:
- `status_map_json`: Map Jira statuses to QA Nexus defect statuses
  ```json
  {
    "jira_open": "open",
    "jira_in_progress": "in_progress",
    "jira_done": "resolved"
  }
  ```

---

#### CI Webhook (GitHub Actions / GitLab CI / Generic)

**Endpoint**: `POST /api/ci-webhook/{project_id}`

**Auth**: Bearer token (per-project, stored encrypted in Postgres)

**Payload Schema** (JSON):
```json
{
  "build_id": "abc123",
  "status": "success|failure",
  "test_results": [
    {
      "test_name": "user should login successfully",
      "status": "passed|failed",
      "duration_ms": 1234,
      "error_message": "null pointer exception",
      "artifacts": [
        {
          "type": "screenshot",
          "url": "https://ci-artifacts.example.com/screenshot.png"
        }
      ]
    }
  ]
}
```

**Processing**:
1. Parse JUnit XML or JSON payload
2. Match test results to test cases (by name or ID)
3. Create Run + RunResult records
4. Link failing result to potential defect (if same case failed before)

**Rate Limits**: No official limit (self-owned); system accepts up to 1 webhook per 10s per project

**Failure Handling**:
- Invalid payload (JSON parse error): Log error, return 400; CI pipeline unaffected (non-blocking)
- Missing test case match: Create placeholder case "Auto-created from CI result"
- Large payload (>50 MB): Reject with 413; ask CI to split results

---

#### Slack Notifications (Webhook Only, MVP)

**Endpoint**: `https://hooks.slack.com/services/{team_id}/{channel_id}/{token}` (user-provided)

**Events Triggered**:
- Defect created (P0 or P1): "🔴 [Project] P0 Defect: Login button unresponsive"
- Defect resolved: "✅ [Project] Fixed: Login button unresponsive"
- Test run completed (with >5 failures): "⚠️ [Project] Run failed: 5/20 cases failed"
- Report scheduled (receipt notification): "📊 Weekly report sent to leadership"

**Payload**: Slack Block Kit JSON (user-friendly, with drill-down links)

**Rate Limits**: Slack allows ~1 webhook per second

**Failure Handling**: If webhook fails, retry up to 3x with backoff; log error; do not block QA Nexus operation

---

#### Confluence (Read PRDs, Write Reports)

**Auth**: OAuth 2.0 (Atlassian account required)

**Endpoints**:
- Search Pages: `GET /wiki/rest/api/content/search` (find PRD by title)
- Get Page Content: `GET /wiki/rest/api/content/{id}` (fetch page body)
- Create Page: `POST /wiki/rest/api/content` (write report page)

**Use Cases**:
- **Read**: QA Lead uploads Jira PRD link → system fetches Confluence page content → A1 ingests as context
- **Write**: Auto-generated report written to Confluence (team wiki archive)

**Rate Limits**: 100 API calls per hour per user

**Failure Handling**: If Confluence fetch fails, A1 proceeds with fallback (e.g., "PRD content not available; using user-provided scope")

---

#### Resend (Transactional Email)

**Endpoints**:
- Send Email: `POST https://api.resend.com/emails` (invite, report, notification)

**Templates**:
- User Invite: "You're invited to QA Nexus — [team] project"
- Report Delivery: "Weekly Report — [project]" (HTML + embedded charts)
- Defect Status: "[Defect] status changed to Fixed"

**Rate Limits**: 3,000 emails per month (MVP tier)

**Failure Handling**: Queue failed email to Hatchet (retry up to 5x); notify Admin if >10 failures in 1 hour

---

## 13. Dependencies, Assumptions, and Constraints

### 13.1 Key Dependencies

- Jira API access and authentication flow approval
- Access to source documents for pilot projects
- Decision on hosting, security, and operating model
- Product analytics instrumentation for pilot measurement
- Alignment between product, engineering, and QA leads on pilot workflow design

### 13.2 Assumptions

- Pilot users are willing to review AI-generated output instead of expecting zero-touch automation
- Organizations will accept Jira as system of record for project management while QA Nexus handles QA workflow
- PRD and requirements source material are good enough to produce useful first drafts
- Historical QA data exists or can be accumulated to make the knowledge layer valuable

### 13.3 Constraints

- MVP timeline is aggressive relative to scope breadth (18 weeks, M0–M6)
- Success depends on trust in AI suggestions, not just feature completeness
- Quality of integrations will affect perceived product value significantly
- Leadership-facing value claims must be backed by measured pilot outcomes, not vendor-style assumptions

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI-generated outputs are noisy or generic | Low trust, low adoption | Require review rails, confidence display, source context, and rapid feedback loops |
| Scope is too broad for 18 weeks | Delivery slippage | Keep MVP tightly focused on the beachhead workflows only (M0–M6 locked) |
| Jira sync is unreliable | Operational frustration | Define limited sync scope, retries, monitoring, and clear fallback states |
| Weak source documents reduce AI usefulness | Poor generation quality | Clarification step, approval workflow, editable outputs |
| Leadership expects ROI proof too early | Credibility risk | Present ROI as a measured pilot outcome, not a pre-proven number |
| Duplicate detection has false positives | Reviewer fatigue | Tune thresholds with human feedback and precision monitoring |
| RCA suggestions are misread as authoritative | Defect misclassification | Label A4 clearly as guidance with reviewer confirmation required |
| Knowledge layer has insufficient initial data | Lower differentiation at launch | Seed with approved internal project data and grow iteratively |
| Pilot team feedback is not collected | Missed improvement signals | Instrument app with A1/A2/A4 feedback buttons; weekly retro with pilot |

---

## 15. Delivery Roadmap

### 15.1 Recommended MVP Phasing

| Phase | Focus | Outcome | Duration |
|---|---|---|---|
| Phase 0 | Foundation | Auth, roles, projects, basic shell, core data model | 2 weeks (M0) |
| Phase 1 | Users & Roles | 4-role RBAC, project membership, audit log | 2 weeks (M1) |
| Phase 2 | Documents & Knowledge Base | Document upload, Notion editor, RAG pipeline, 12 templates | 3 weeks (M2) |
| Phase 3 | Test Cases & A1+A2 | Test case CRUD, A1 generation, A2 dedup, RTM | 3 weeks (M3) |
| Phase 4 | Runs, Defects & Jira | Test runs, A4 RCA, Jira sync, CI webhook | 3 weeks (M4) |
| Phase 5 | Automation & Reporting | Playwright runner, basic reports, Exec Dashboard, omnibox | 3 weeks (M5) |
| Phase 6 | Full Reports & GA | Full reporting dashboards, WCAG 2.1 AA, security audit, GA | 5 weeks (M6) |

---

### 15.2 Release Readiness Gates

- Core workflows work end to end for at least one pilot project
- Jira integration works reliably for selected fields
- AI features are reviewed and logged with visible rails
- Weekly reporting can be produced from product data
- Pilot measurement instrumentation is active
- Security audit passed (0 critical, 0 high vulnerabilities)
- WCAG 2.1 AA accessibility verified
- Pilot KPIs met (≥80% DAU, ≥70% defect flow, ≥80% A1 auto-approve)

---

### 15.3 MVP Milestone Schedule (M0–M6)

**Dates align with PROJECT_ROADMAP.md v1.1; MVP GA 2026-09-21**

#### M0: Foundation Setup (2026-04-27 → 2026-05-10)
**Duration**: 2 weeks | **Owner**: DevOps Lead

**Deliverables**:
- Oracle Cloud VM provisioned (4 OCPU, 24GB RAM, Postgres 16, Ollama)
- Vercel Hobby frontend deployed (hello-world Next.js app)
- Postgres 16 + pgvector initialized with schema
- Ollama Gemma 4 26B running on Oracle VM (health checks configured)
- GitHub Actions CI/CD pipeline (auto-deploy on main)
- Langfuse self-hosted on Oracle (tracing ready)
- BetterAuth (email + password) integrated into NestJS API
- Design tokens (Quiet Intelligence) locked + approved

**Exit Criteria**:
- Postgres query latency <200ms on test queries
- Ollama inference latency <10s for 500-token prompt
- NestJS API hello-world responds <100ms
- Next.js app loads <1.5s p50
- User can register + login via email + password
- Audit log captures login event

---

#### M1: Users & Roles (2026-05-11 → 2026-05-24)
**Duration**: 2 weeks | **Owner**: Backend Lead

**Deliverables**:
- 4-role RBAC model (Admin/Lead/QA/Management) fully implemented
- Postgres RLS policies enforce role permissions (query-level)
- User invite + role assignment UI (Admin screen)
- Project creation + team member invitation
- Audit log captures all RBAC actions
- User session management + logout
- Dashboard redirects based on role

**Exit Criteria**:
- Non-Admin user cannot create new user (403)
- Non-Lead user cannot approve document (403)
- Audit log shows every role change with timestamp
- User invited via email can reset password via link
- Project isolation enforced (user sees only their projects' data)

---

#### M2: Test Documents & Knowledge Base (2026-05-25 → 2026-06-14)
**Duration**: 3 weeks | **Owner**: Frontend Lead + FastAPI ML Engineer

**Deliverables**:
- Document upload UI (12 template types)
- TipTap/ProseMirror Notion-style block editor
- Document versioning + approval workflow
- RAG pipeline: approved docs indexed into pgvector
- Knowledge Base screen (top-level navigation) with search + filter
- "Reading from KB" label visible on A1/A2/A4 outputs
- PDF export of documents
- Context form for document generation

**Exit Criteria**:
- A1 can retrieve relevant KB docs (pgvector similarity search) in <5s
- Document approval workflow email sent and link works
- Approved document visible in KB screen with full-text search
- PDF export includes all content (no truncation)
- RAG embedding latency <5s for 10-page document

---

#### M3: Test Cases & AI Agents A1 + A2 (2026-06-15 → 2026-07-05)
**Duration**: 3 weeks | **Owner**: FastAPI ML Engineer + Frontend Lead

**Deliverables**:
- Test case CRUD (Create, Read, Update, Delete with hierarchical modules)
- Notion-style editor for test case steps (BDD Gherkin + traditional syntax)
- Bulk ops (tag, priority, status change)
- **A1 Test Case Generator**: PRD input, clarification questions gate, confidence scoring
- **A2 Duplicate Detection**: Live dedup chips while authoring, dismissible
- RTM (Requirements Traceability Matrix) linking
- Test case versioning + rollback UI
- Global search indexed for test cases

**Exit Criteria**:
- A1 generates 10 test cases from 3-page PRD in <30s
- ≥80% of A1 output auto-approved (confidence ≥80%) without edit
- A2 catches ≥60% of true duplicates in controlled dataset
- A2 false positive rate <5%
- RTM drag-link works smoothly
- Dedup chip shown <5s after case creation
- Test case versioning shows diff-view between versions

---

#### M4: Test Runs, Defects & Jira Integration (2026-07-06 → 2026-07-26)
**Duration**: 3 weeks | **Owner**: Backend Lead + Integrations Engineer

**Deliverables**:
- Test Run CRUD (create run, select cases, set environment + browser/OS, assign team member)
- Row-per-case execution view (quick-status buttons)
- Screenshot paste inline (Cmd+V) → auto-attach
- Auto-evidence capture at failure moment
- Defect creation form (prefilled from failing run context)
- **A4 Defect Intelligence & RCA**: 5-layer analysis, confidence scoring, 4-category classification
- **Jira 2-Way Integration**: OAuth 2.0 3LO, create issue on defect save, status/assignee sync
- Per-project Jira key config + status mapping
- Defect deduplication (A2 vector similarity)
- Run history + comparison view
- Defect aging dashboard (SLA tracking)

**Exit Criteria**:
- Defect creation <3s; Jira sync <5s
- Bidirectional status sync <2 min lag
- A4 RCA generation <30s; confidence ≥70% required for defect creation
- Jira issue created for each defect synced; link visible on defect card
- User can edit status_map_json in project settings + test mapping
- Run comparison shows pass rate trend (this week vs. last week)

---

#### M5: Automation + Basic Reports + MVP Launch (2026-07-27 → 2026-08-16)
**Duration**: 3 weeks | **Owner**: QA Automation Engineer + Backend Lead

**Deliverables**:
- **Playwright Runner**: Playwright tests integrated via CI webhook
- CI webhook receiver (`POST /api/ci-webhook`), JUnit/JSON parsing, result ingestion
- Auto-evidence attachment from Playwright run
- Basic self-heal: flag selector-break cases for manual review
- **Basic Reporting**: 4 templated reports (Daily, Weekly, Sprint, Release) auto-populated
- Executive Dashboard: 5-KPI view (pass %, defect trend, coverage %, release RAG, ROI)
- Personal dashboard (assigned cases + defects due today)
- **ROI Formula**: Cost-per-stage defaults with cost avoidance calculation
- **Command-K Omnibox**: Cmd+K / Ctrl+K for search + navigation + agent invocation
- WCAG 2.1 AA accessibility compliance
- E2E test coverage for critical paths
- Performance optimization (p95 page load <3s, API <500ms)
- Pilot onboarding flow (6-screen walkthrough)

**Exit Criteria**:
- Playwright tests integrate via CI webhook in <5 min setup
- Report template auto-fills in <30s; email sent ≤5 min
- Exec Dashboard loads <3s; drill-down responsive
- Omnibox search latency <2s (KB), <5s (full index)
- WCAG 2.1 AA: Axe scan zero violations, keyboard nav tested
- E2E tests pass ≥95% (<2 flaky tests in pilot)
- p95 page load <3s, p95 API <500ms
- Pilot team can onboard in <15 min via walkthrough

---

#### M6: Full Reports & GA (2026-08-17 → 2026-09-20)
**Duration**: 5 weeks | **Owner**: Product Lead + Design Lead

**Deliverables**:
- **Full Reporting**: 10 named dashboards (Build Run Health, Failure Analysis, Test Insights, Coverage Trends, Execution Time, Quality Gate, QA Value, Executive Summary, Compliance, Roadmap Fitness)
- Drill-down capabilities + custom date ranges + cohort comparison
- PDF/PNG export + scheduled email delivery
- Quality gates (Pragmatic / Strict / Regulated presets)
- **GA Polish**: Design v3 finalization (Quiet Intelligence dark tokens, light + dark mode), performance tuning, security audit, compliance review
- Legal review (copyright, data handling, GDPR)
- Production runbook + incident response playbook
- Customer success playbook (onboarding, support, training materials)

**Exit Criteria**:
- 10 dashboards operational; drill-down lag <1s per level
- PDF export <10s; scheduled email delivery <5 min of time
- Quality gate calculation matches acceptance criteria
- Design v3 approved by team + customer (light/dark mode)
- Security audit: 0 critical, 0 high vulnerabilities
- GDPR compliance checklist complete
- Runbook covers: deploy, rollback, DB recovery, Ollama restart, Jira token refresh
- Customer success guide ready for beta + GA launch
- **GO/NO-GO GATE**: Pilot KPIs met (≥80% DAU week 3, ≥70% defect flow, ≥80% A1 auto-approve), legal cleared, security passed
- **MVP GA: 2026-09-21**

---

## 16. Future Work and Recommended Follow-On Documents

### 16.1 Future Product Chapters

These are worth keeping visible for future planning, but should not dilute MVP delivery:

- **A3 Low-Code Automation Editor** (v1.5): Notion-style automation script builder bridging manual and code-heavy Playwright
- **A5 Test Selection** (v1.5): Change-based test subsetting for PR-gated CI
- **A6 Test Data Generation** (v2): Inline synthetic data generator with data lineage
- **A7 Test Maintenance / Self-Healing** (v2): Background suggestions for failing tests, auto-PR for selector fixes
- **A8 Full Test Planning** (v1.5): Auto-generate test strategy + plan from PRD alone
- **Vibe Code Governor** (v2+): Governance layer for AI-written code, JIT testing
- **AI Product Tester (APT)** (v2+): Autonomous E2E test discovery + execution, LLM behavior testing
- **Career Compass** (L7, v2+): AI-powered career pathing, job market intelligence, portfolio builder
- **Compliance & Governance** (L6, v1.5+): EU AI Act automation, immutable agent audit trail
- **Visual Regression** (v2+): In-house diff-based or Applitools/Percy integration
- **Cloud Device Grid** (v2+): BrowserStack / Sauce Labs / LambdaTest integration or in-house runner
- **Full 70-Document Catalog** (v1.5+): MVP ships 12; remaining 58 templates added progressively
- **SSO/SAML** (v1.5+): Keycloak + Azure AD (OpenID Connect hook ready in MVP)
- **Mobile App** (v2+): Native iOS/Android with notification + approval workflows
- **White-Label / Multi-Tenant SaaS** (v2+): Per-customer branding, multi-tenant foundation

### 16.2 Required Follow-On Documents

To reduce ambiguity after PRD approval, the following documents should be created or refreshed next:

1. **Solution architecture document** — System design, technology choices, deployment, scaling
2. **ERD and data retention model** — Detailed schema, indexing, archival policy
3. **API and integration contract specification** — OpenAPI specs, webhook schemas
4. **UX specification and screen-level flows** — Wireframes, interaction patterns
5. **Pilot success measurement plan** — Metrics collection, analysis, reporting
6. **Security and privacy design review** — Threat model, encryption, data handling
7. **Milestone plan with owners and sequencing** — Detailed sprint breakdowns, dependencies

---

## 17. Decisions Required From Leadership

### 17.1 Immediate Decisions

1. Approve the MVP product direction as a QA workflow platform rather than a broader all-in-one QA transformation suite.
2. Approve the reduced MVP scope centered on document-to-test-to-defect workflows with three core AI agents (A1, A2, A4).
3. Approve internal pilot-first rollout before any external positioning.
4. Approve that ROI and productivity claims will be validated during pilot rather than asserted as settled facts.
5. Approve preparation of downstream architecture, ERD, UX, and milestone artifacts based on this PRD.

### 17.2 Recommended Status for This PRD

The appropriate status is `Draft for Leadership Review` or `Pending Approval`, not `Approved`, until the above decisions are confirmed.

---

## 18. Telemetry & Analytics Hooks

All core workflows shall emit structured events for measurement and optimization.

### 18.1 Event Taxonomy

**AI Agent Events**:
- `a1.generation.started`: PRD uploaded, clarification questions shown
- `a1.generation.completed`: Test cases generated, confidence distribution recorded
- `a1.generation.accepted`: Cases accepted by user, edit count recorded
- `a2.dedup.shown`: Duplicate chip displayed, confidence recorded
- `a2.dedup.dismissed`: Duplicate chip dismissed by user (false positive signal)
- `a4.rca.started`: Defect logged, RCA analysis triggered
- `a4.rca.completed`: RCA summary generated, per-layer confidence recorded
- `a4.rca.accepted`: Defect created with RCA (acceptance signal)

**Workflow Events**:
- `case.created`: Test case created (manual or via A1)
- `case.edited`: Test case edited post-creation
- `run.created`: Test run started
- `run.completed`: Test run finished, pass rate recorded
- `defect.created`: Defect filed (manual or from run)
- `defect.jira_synced`: Defect synced to Jira, latency recorded
- `report.generated`: Report template rendered
- `report.emailed`: Report email sent, delivery recorded

**User Events**:
- `user.login`: User logged in
- `user.invited`: User invited to project
- `user.role_changed`: User role updated
- `search.executed`: Omnibox search query issued, results count
- `kb.doc_approved`: Document approved and indexed

### 18.2 Pilot Measurement Events (M5–M6)

- Daily Active Users (DAU) by project
- Test case creation rate (manual + A1 generated) per project per week
- A1 auto-approval rate (% cases with confidence ≥80% accepted without edit)
- A2 duplicate precision (% of flagged duplicates confirmed by user)
- A4 RCA acceptance rate (% of defects created from A4 output)
- Jira sync success rate (% of defects synced without error)
- Report email delivery rate (% of scheduled reports sent on time)
- Average time-to-defect (from test failure to defect creation)
- Average time-to-approval (from defect created to Jira issue creation)

---

## 19. Privacy & Compliance

### 19.1 Data Handling

**PII Handling**:
- A1/A2/A4 inputs scanned for email, phone, SSN, credit card patterns
- Detected PII masked in LLM prompts (e.g., "test@example.com" → "TEST_EMAIL")
- Audit logs mask PII (show last 4 chars only) by default
- All integration tokens (Jira OAuth, Slack, Resend) encrypted at rest (AES-256)

**Data Residency**:
- MVP: USA (Oracle Cloud Ashburn, Virginia)
- Post-MVP: EU residency option available for GDPR compliance

**Data Retention**:
- Test cases, documents, runs: Indefinite (unless project deleted)
- Defects: Retained per SLA; archival after 3 years (soft-delete)
- Audit logs: 7 years (per SOX 404 requirements)
- Personal data: Soft-delete on user removal; hard-delete after 30 days (GDPR right to be forgotten)

### 19.2 EU AI Act Posture (Roadmap Consideration, Not MVP Shipped)

The following are planned for v1.5+ governance layer (not shipped in MVP):

- **Agent Audit Trail**: Every A1/A2/A4 invocation logged with inputs, outputs, confidence scores, user feedback
- **Consent Management**: Opt-in banner for AI features at first use
- **Bias & Fairness Monitoring**: Track A1/A2/A4 performance across demographic cohorts (if applicable to QA)
- **Impact Assessment**: Document AI system risks and mitigations
- **Transparency**: "AI-assisted" badge on all AI outputs, "Read from KB" source labels

MVP does not include formal EU AI Act compliance reporting, but the audit infrastructure (CO-015 AIAgentRun table) is foundation for future compliance layers.

---

## 20. Launch Checklist

### 20.1 Pilot Readiness Gate Items

**Product**:
- [ ] All 17 functional requirements (FR-001 to FR-017) implemented and tested
- [ ] All 3 AI agents (A1, A2, A4) working end-to-end with confidence scoring + fallback
- [ ] Jira 2-way sync tested across 2+ Jira instances (schema drift handling verified)
- [ ] CI webhook integration tested with GitHub Actions and GitLab CI
- [ ] Basic reporting (4 templates) auto-populating correctly
- [ ] Pilot onboarding flow (6-screen walkthrough) usable by non-PM users
- [ ] E2E test suite passing (≥95% success rate)

**Engineering**:
- [ ] Postgres performance tuning (p95 queries <200ms) verified
- [ ] Ollama inference latency <10s for 500-token prompt (measured)
- [ ] Hatchet job queue monitoring dashboard live
- [ ] Error budget tracking configured (SigNoz dashboards)
- [ ] Langfuse trace sampling configured (<5% sample rate for cost control)
- [ ] Database backup + restore tested (RTO/RPO targets met)

**Security**:
- [ ] Security audit completed (0 critical, 0 high vulnerabilities)
- [ ] OWASP Top 10 checklist verified
- [ ] Jira OAuth token storage encrypted (AES-256)
- [ ] PII masking in logs enabled (regex + HuggingFace detector)
- [ ] Rate limiting configured (API, webhook, Jira sync)
- [ ] SQL injection prevention verified (Prisma ORM, parameterized queries)

**Accessibility**:
- [ ] WCAG 2.1 AA: Axe scan zero violations on core flows (login, create case, execute run, log defect)
- [ ] Keyboard navigation tested (Tab, Enter, Escape)
- [ ] Screen reader testing completed (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Color contrast verified (WCAG AA standards)

**Legal & Compliance**:
- [ ] Terms of Service reviewed (PII handling, data retention, deletion)
- [ ] Privacy Policy finalized (data residency, breach notification, GDPR right to delete)
- [ ] GDPR Data Protection Impact Assessment (DPIA) completed
- [ ] Data processing agreement (DPA) for integrations signed (Jira, Slack, Resend)

**Operational**:
- [ ] Production runbook written (deploy, rollback, DB recovery, Ollama restart, Jira token refresh)
- [ ] Incident response playbook drafted (on-call rotation, escalation path)
- [ ] Monitoring alerts configured (error rate, latency, integration health)
- [ ] Customer success playbook ready (onboarding, FAQ, support email address)
- [ ] Pilot communication plan drafted (kickoff email, weekly retro schedule, feedback collection)

**Pilot Success Metrics**:
- [ ] Analytics instrumentation active (event taxonomy configured)
- [ ] Baseline data collection started (pre-pilot workflow measurements)
- [ ] Feedback form deployed (in-app button for A1/A2/A4 quality ratings)
- [ ] Weekly retro scheduled (product + eng + pilot team)
- [ ] Success criteria defined (≥80% DAU week 3, ≥70% defect flow, ≥80% A1 auto-approve)

---

## Appendix A. Source Validation Notes

### A.1 What Was Kept Strongly

- The core project vision from the brainstorm and project analysis
- The MVP emphasis on document intelligence, test cases, execution, defects, and reporting
- The three-agent MVP focus on A1, A2, and A4
- The need for governance, provenance, and auditability
- The 18-week timeline with 7 locked milestones (M0–M6)
- Integration scope (Jira, CI, Slack, Confluence, Resend)

### A.2 What Was Softened or Reframed

- Fixed ROI numbers (now "pilot target" with 688% as V2 working hypothesis)
- Fixed productivity percentages (now "pilot targets" with 90%/95% as V2 working hypotheses)
- Market-size certainty (now framed as "third-party estimate, not independently verified fact")
- Salary-gap claims (now "hypothesis to validate during pilots")
- Profession-fear percentages (now "internal hypothesis")
- Any statement that sounded already proven without pilot evidence

### A.3 Why This Matters

For leadership review, a PRD should feel evidence-aware and execution-ready. Overstating uncertain claims can reduce confidence even when the product idea itself is strong. The v6.1 approach separates:

1. **Verified external context** (CodeRabbit data on AI code quality, EU AI Act regulatory framework)
2. **Internal product hypotheses** (45 min/day tool switching, 688% ROI) marked as "pilot targets"
3. **Functional/technical specifications** (detailed feature specs, AI agents, data model) to guide engineering

---

## Appendix B. External References

These references were used to validate or improve the structure and factual framing of this PRD:

1. Atlassian, "How to create a product requirements document (PRD)"  
   <https://www.atlassian.com/agile/requirements>

2. Atlassian, "Product requirements template"  
   <https://www.atlassian.com/software/confluence/templates/product-requirements>

3. European Commission, "Navigating the AI Act"  
   <https://digital-strategy.ec.europa.eu/en/faqs/navigating-ai-act>

4. Council of the European Union, "Artificial intelligence (AI) act: Council gives final green light"  
   <https://www.consilium.europa.eu/en/press/press-releases/2024/05/21/artificial-intelligence-ai-act-council-gives-final-green-light-to-the-first-worldwide-rules-on-ai/>

5. CodeRabbit, "Our new report: AI code creates 1.7x more problems"  
   <https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report>

### B.1 Interpretation Note

The regulatory and PRD-structure references above are strong enough for direct use. The CodeRabbit reference is relevant directional evidence for AI-assisted development risk, but it is still vendor-published research and should be presented accordingly.

---

**End of MVP_PRD.md (v6.1) | QA Nexus MVP | 18-Week Development Timeline | Target GA: 2026-09-21**

