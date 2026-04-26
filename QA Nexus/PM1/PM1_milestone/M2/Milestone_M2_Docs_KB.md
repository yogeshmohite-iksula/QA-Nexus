# MILESTONE M2 — TEST DOCUMENTS & KNOWLEDGE BASE

**QA Nexus MVP — Execution Blueprint for 3-Week Sprint**

> ⚠️ **Tech stack updated 2026-04-25 — see PM1_PRD v8.1 / PM1_ERD v2.1 as binding.**
> The task list below was written against the v1.0 self-hosted PM1-PM4 vision. For the actual M2 build, the stack is simplified:
> - **Embeddings via `@xenova/transformers` in NestJS (Qwen3-Embedding-0.6B, 1024-dim)** — NOT BGE-large via separate FastAPI service. Embedding service runs in-process in the NestJS dyno; ~50 ms per embedding on Render's 0.5 vCPU, 200 MB RAM footprint.
> - **pgvector on Neon free** (NO pgvectorscale — not on Neon free tier; vanilla pgvector handles PM1 scale of ~50K vectors comfortably)
> - **KB document store: TB-017 + TB-018** as defined in PM1_ERD v2.1 §5
> - **Frames in scope:** F12 Upload Modal, F13 Imported Files, F15 Knowledge Base (with AI Answer Preview Card), all locked in PM1_UI_v2
> - **12 doc templates:** Test Plan, Test Strategy, Test Case template, Defect template, RCA template, Sprint Report, Release Report, etc. (see PM1_ERD v2.1 §2 for full list)
> - **Frontend:** Next.js 15 + React 19 + Tailwind 4 + shadcn/ui + Sonner + TipTap for rich text in F15
> - **Total monthly cost contribution: $0** (Neon free 0.5 GB easily fits ~50 KB docs + ~50K embedding rows)
>
> Use this M2 file for workflow understanding. For binding tech choices, defer to PM1_PRD v8.1 §12.3 and PM1_ERD v2.1 §8.5 (embedding service spec) and §5 (KB tables). Strip references to BGE-large / FastAPI / sentence-transformers Python from the v1.0 task list before assigning sprints.

---

## COVER PAGE

**Project:** QA Nexus MVP — AI-Native Operating System for QA  
**Milestone:** M2 — Test Documents & Knowledge Base  
**Version:** 1.0  
**Date:** 2026-04-21  
**Duration:** 3 weeks (2026-05-25 → 2026-06-14)  
**Team Size:** 7 FTE (Backend 2, Frontend 2, AI 1, DevOps 1, QA 1)  
**Estimated Effort:** 840 hours (~280 hours/week)  
**Status:** Draft  

**Team Leads:**
- Backend Lead: [Assigned]
- AI/ML Lead: [Assigned]
- QA Lead: [Assigned]

**Key Risks:** Gemma 4 quality <80%, pgvector scale, Graphiti setup, template variance

---

## 1. EXECUTIVE SUMMARY

M2 ships the **Knowledge Base + Document Generation** system — the engine that collapses 2-hour Test Plan authoring into 30 seconds. Teams create or import knowledge base entries, the RAG pipeline (BGE-large embeddings + pgvector) retrieves relevant context, LangGraph A1 context-gathering agent formats that context, and Gemma 4 generates documents using one of **12 specialized templates** (Test Strategy, Test Plan, RTM, Estimation, Daily/Weekly/Sprint/Release Reports, Defect Report, RCA, Test Charter, Regression Outline). A1 shows section-level confidence scoring, users review in a TipTap block-based editor, and PDF export + versioning + approval workflow complete the feature set.

**Success Criteria:**
- KB CRUD working (create, read, update, delete, bulk import KB entries)
- RAG pipeline achieving ≥85% recall@5 on relevant document context
- A1 context agent generating sections in <30s
- All 12 document templates seeded and tested
- PDF export working (Puppeteer in Oracle container)
- Approval workflow (Draft → In Review → Approved → Published)
- Section confidence scoring visible (colored badges)
- E2E latency from "click generate" to PDF ready: ≤60s p95, ≤30s p50

---

## 2. WHAT WAS DELIVERED BEFORE (M1 EXIT CRITERIA)

From M1 (2026-05-11 → 2026-05-24), the following are now available:

**Completed in M1:**
- BetterAuth authentication system (email/password, registration, login, logout, password reset)
- 4-role RBAC (Admin, Lead, QA, Mgmt) with profile attributes (Jr/Sr/Automation)
- Projects CRUD (create, read, update, switch, archive)
- PostgreSQL 15 + pgvector extension initialized and healthy
- Postgres + Redis + Ollama containers running with auto-restart
- Vercel + Oracle VM deployment pipeline functional
- GitHub Actions CI/CD pipeline (linting, tests, type checking, auto-deploy)
- SigNoz + GlitchTip + Langfuse containers running
- Doppler environment secrets configured (dev/staging/prod)
- Audit log schema created and user actions logged
- Ollama Gemma 4 model downloaded and health checks passing
- Resend email service configured for invites
- Confluence API access configured
- Claude API keys provisioned

**Database State:**
- TB-001: organizations
- TB-002: users, user_profiles
- TB-003: role_assignments
- TB-004: projects, project_environments
- TB-013: audit_events (audit trail)
- TB-014: session_context, session_cache

**API Endpoints Available:**
- EP-001–006: Auth (register, login, logout, forgot-password, reset, profile)
- EP-007–017: Projects (CRUD, environments, roles, user assignment)

**Services Live:**
- CO-002: NestJS API Gateway
- CO-003: BetterAuth Service
- CO-004: RBAC Guard
- CO-005: Audit Logger
- CO-006: Project Service
- CO-023: PostgreSQL 15
- CO-024: Redis 7

**Postgres Migrations Applied:**
- M001–M007: Schema for orgs, users, projects, sessions, audit_events

---

## 3. M2 SCOPE (LOCKED)

### IN SCOPE ✓

| Feature | Details | US-ID | EP-ID | TB-ID | Status |
|---------|---------|-------|-------|-------|--------|
| **KB CRUD** | Create, read, update, delete, bulk import KB entries | US-010 | EP-018–022 | TB-009 | New |
| **KB Approval Workflow** | Admin/Lead approve KB entries before public use | US-010 | EP-022 | TB-009 | New |
| **RAG Pipeline** | BGE-large embeddings + pgvector retrieval, ≥85% recall@5 | — | — | TB-009 | New |
| **Graphiti Neo4j Integration** | Temporal knowledge graph for agent memory (enterprise features) | — | — | — | New |
| **12 Document Templates** | (1) Test Strategy, (2) Test Plan, (3) RTM, (4) Test Estimation, (5) Daily Report, (6) Weekly Report, (7) Sprint Report, (8) Release Report, (9) Defect Report, (10) RCA Template, (11) Test Charter, (12) Regression Outline | US-008 | EP-023 | TB-012 | New |
| **Document Generation (EP-050)** | Async job via Hatchet; A1 context agent reads KB + formats context | US-008 | EP-023–024 | TB-012 | New |
| **A1 Context-Gathering Agent** | Reads KB via RAG, formats context (NOT test case generation; that's M3) | US-008 | EP-023 | — | New |
| **TipTap Block-Based Editor** | Author/review docs; BDD mode, comments, inline suggestions, keyboard shortcuts | US-008 | — | TB-012 | New |
| **Section Confidence Scoring** | Colored badges (Green ≥90%, Amber 70–89%, Red <70%) per section | — | EP-026 | TB-012 | New |
| **Document Versioning** | Store document history; rollback capability | — | EP-026 | TB-012 | New |
| **Document Comments & Inline Suggestions** | Collaborative review (comments, suggestions, approval UI) | — | EP-028 | TB-012 | New |
| **Document Approval Workflow** | Draft → In Review → Approved → Published | US-008 | EP-028 | TB-012 | New |
| **PDF Export** | Puppeteer-based export from TipTap (works in Oracle container) | US-008 | EP-027 | TB-012 | New |
| **Confluence API Ingestion** | Read PRDs from Confluence for doc generation context | — | EP-023 | — | New |
| **Seed Data** | 2 KB entries pre-loaded; 12 document template seeds | — | — | TB-009, TB-012 | New |

### OUT OF SCOPE ✗

| Feature | Reason | Target Milestone |
|---------|--------|------------------|
| **Test Case Generation (A1)** | That's M3. M2 is document generation (Test Plans, Reports, etc.). | M3 |
| **A2 Dedup Agent** | Test case deduplication; M3. | M3 |
| **Test Execution UI** | M3. | M3 |
| **Jira Integration** | M3. | M3 |
| **Reports/Dashboards** | M4. | M4 |
| **Global Search** | M5. | M5 |
| **Accessibility Audit** | M5. | M5 |

---

## 4. TECH STACK

| Component | Version | Purpose | Status | Milestone |
|-----------|---------|---------|--------|-----------|
| **NestJS API Gateway** | 10.x | HTTP routing, doc gen endpoints | Configured | M0 |
| **Next.js Frontend** | 14.x | TipTap editor UI, document viewer | In Progress | M0+ |
| **FastAPI Inference Server** | 0.104.x | LangGraph orchestrator, A1 agent execution | Pending | M2 |
| **LangGraph** | 0.1.x | Agent orchestration framework (A1 context gathering) | Pending | M2 |
| **Gemma 4 26B MoE** | Latest | Local LLM inference via Ollama | Configured (M1) | M1 |
| **Ollama** | Latest | Model runtime, health probes, fallback logic | Running | M0 |
| **BGE-large-en-v1.5** | Latest | Embedding model for RAG (deployed in FastAPI) | Pending | M2 |
| **PostgreSQL 15** | 15.x | Primary OLTP database | Running | M0 |
| **pgvector** | 0.8.x | Vector similarity search (embedded in Postgres) | Running | M1 |
| **Neo4j Community** | 5.x | Temporal knowledge graph (Graphiti integration) | Pending | M2 |
| **Graphiti** | Latest | Temporal KG memory for agent context | Pending | M2 |
| **Redis 7** | 7.x | Cache, pub-sub, session store | Running | M0 |
| **Hatchet OSS** | Latest | Durable job queue for async document generation | Running | M1 |
| **TipTap / ProseMirror** | Latest | Block-based editor (block types, collaboration-ready) | Pending | M2 |
| **Puppeteer** | 21.x | PDF export from DOM (runs in Docker on Oracle VM) | Pending | M2 |
| **Langfuse** | Latest | LLM trace logging, eval dashboards | Running | M1 |
| **SigNoz** | Latest | APM, distributed tracing, performance dashboards | Running | M0 |
| **Unleash** | Latest | Feature flags (ff_docgen_enabled, ff_graphiti_enabled) | Running | M0 |

---

## 5. DEFINITION OF READY (M1 DoD = M2 DoR)

M2 entry gates (all must be complete from M1):

- [ ] Authentication system working (users can register, log in, access projects with role validation)
- [ ] Projects created and users assigned to projects; context switching functional
- [ ] RBAC guards enforcing role-based access; Lead role can approve content
- [ ] PostgreSQL + pgvector available and healthy
- [ ] Ollama Gemma 4 downloaded and responsive; health check <200ms
- [ ] Resend email configured for notifications
- [ ] Confluence API access configured (for PRD ingestion)
- [ ] Claude API keys provisioned (for A1 context gathering fallback)
- [ ] Langfuse running (ready for A1/A2/A4 trace logging)
- [ ] SigNoz running (ready for performance monitoring)
- [ ] Hatchet running (ready for async document generation jobs)
- [ ] Vercel + Oracle VM deployment pipeline verified
- [ ] Feature flag service (Unleash) deployed and healthy

**Team Readiness:**
- Backend team prepared (NestJS, FastAPI, vector indexing experience)
- AI team prepared (LangGraph, prompt engineering, RAG patterns)
- Frontend team prepared (TipTap/ProseMirror, real-time collaboration concepts)
- DevOps team prepared (Puppeteer containerization, Hatchet job monitoring)

---

## 6. MILESTONE ENTRY CRITERIA (Verifiable)

**Before M2 Day 1, verify:**

1. Ollama serving Gemma 4 with ≤500ms latency on simple inference (test: "Summarize: Hello world" → <500ms)
2. PostgreSQL accepting connections; pgvector extension loaded (`SELECT extversion FROM pg_extension WHERE extname='vector'`)
3. Hatchet queue accepting jobs; test job submitted and completed successfully
4. Langfuse dashboard accessible; API token working
5. Confluence API authenticated; can read ≥1 page successfully
6. Vercel production deployment reachable; status check returns 200
7. Feature flag service (Unleash) accessible; can toggle flags and see updates in-app within 5s
8. Team members have cloned repo, installed deps, and can start dev server locally
9. Database migrations M001–M007 applied to staging; verify table count matches schema

---

## 7. TASK BREAKDOWN

### PHASE A: KB Schema & API (Days 1–3, Week 1)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T001** | Design KB schema (TB-009) | Design knowledge_base_entries table: id, project_id, title, content (plaintext), category, status (draft/approved), created_by, approved_by, approval_date, embedding (pgvector), metadata_json. Include indexes on (project_id, status, category). | P0 | 4 | Backend | None | MS2-AC001 |
| **MS2-T002** | Create KB migrations (M008–M009) | Generate migrations: M008 (create knowledge_base_entries, kb_categories, kb_approvals); M009 (add pgvector index on embedding column). Test rollback. | P0 | 6 | Backend | MS2-T001 | MS2-AC002 |
| **MS2-T003** | Implement KB CRUD endpoints (EP-018–022) | Implement GET /api/kb (list, filter by category, search), POST /api/kb (create), GET /api/kb/:id, PATCH /api/kb/:id (update), DELETE /api/kb/:id (soft-delete), POST /api/kb/:id/approve (Lead-only). Include auth guards. | P0 | 12 | Backend | MS2-T002 | MS2-AC003 |
| **MS2-T004** | KB Service business logic | Implement KBService: create_entry(), update_entry(), get_entry(), list_entries(), approve_entry(), search_by_embedding(). Add to NestJS DI. | P0 | 8 | Backend | MS2-T003 | MS2-AC004 |
| **MS2-T005** | KB approval workflow (Lead gate) | Implement approval_status column (draft/in_review/approved/rejected). Create approval UI: Draft → Submit for Review → Lead approves. Audit log each approval. | P0 | 6 | Backend | MS2-T004 | MS2-AC005 |

### PHASE B: RAG Pipeline & Embeddings (Days 4–6, Week 2)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T006** | Deploy BGE embeddings in FastAPI | Set up FastAPI service: load BGE-large-en-v1.5 model on startup. Implement POST /embed endpoint (accepts text array, returns embeddings). Health check. | P0 | 8 | AI | None | MS2-AC006 |
| **MS2-T007** | Implement RAG retrieval (pgvector search) | Implement semantic_search(query_text, top_k=5) function: embed query via BGE → search pgvector index → return top_k KB entries with similarity scores. Target ≥85% recall@5. | P0 | 8 | Backend + AI | MS2-T006, MS2-T004 | MS2-AC007 |
| **MS2-T008** | Optimize pgvector indexing | Create HNSW index on kb_entries.embedding column. Tune index parameters (ef_construction, ef_search) for recall@5 ≥85%. Load test with 1000 vectors; measure latency p99 <500ms. | P0 | 6 | Backend | MS2-T007 | MS2-AC008 |
| **MS2-T009** | Integrate Graphiti Neo4j | Deploy Neo4j Community single-node on Oracle VM. Implement Graphiti integration in FastAPI: on each KB entry creation, upsert entity graph (entity types: Requirement, Module, Risk, Test Category). Health check Neo4j connection. | P1 | 10 | AI + DevOps | MS2-T006 | MS2-AC009 |
| **MS2-T010** | KB embedding batch job | Implement Hatchet job: bulk-embed KB entries on creation/update. For existing KB entries (seed data), trigger batch embedding. Idempotency: skip if embedding already exists. | P0 | 6 | Backend | MS2-T006 | MS2-AC010 |

### PHASE C: Document Templates Library (Days 7–10, Week 2)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T011** | Design document schema (TB-012, TB-013) | Design documents table: id, project_id, doc_type (enum: test_strategy/test_plan/rtm/etc.), status (draft/in_review/approved/published), title, created_by, created_at, updated_at. Design document_templates table: id, doc_type, version, prompt_template, section_definitions (json array). Design document_sections table: doc_id, section_index, section_name, content, confidence_score, sources (array of KB entry IDs). | P0 | 6 | Backend | None | MS2-AC011 |
| **MS2-T012** | Create document migrations (M010–M011) | Generate migrations: M010 (documents, document_templates, document_sections); M011 (add document_versions, document_comments tables). Test rollback. | P0 | 6 | Backend | MS2-T011 | MS2-AC012 |
| **MS2-T013** | Seed 12 document templates | Create 12 template definitions (JSON): (1) Test Strategy (3 sections: Scope, Approach, Risks), (2) Test Plan (4 sections: Overview, Scope, Schedule, Resources), (3) RTM (2 sections: Coverage Matrix, Gaps), (4) Test Estimation (2 sections: Story Points, Risk Adjustments), (5–8) Daily/Weekly/Sprint/Release Reports (varying sections), (9) Defect Report (4 sections), (10) RCA Template (5 layers), (11) Test Charter (3 sections), (12) Regression Outline (3 sections). Load into document_templates table. | P0 | 12 | AI + Backend | MS2-T012 | MS2-AC013 |
| **MS2-T014** | Document CRUD endpoints (EP-025–028) | Implement GET /api/documents (list, filter by type), POST /api/documents (create, choose template), GET /api/documents/:id (with sections), PATCH /api/documents/:id (update), POST /api/documents/:id/comments (add review comment), GET /api/documents/:id/versions (version history). | P0 | 10 | Backend | MS2-T012 | MS2-AC014 |
| **MS2-T015** | Document Service business logic | Implement DocumentService: create_document(), update_section(), get_document(), list_documents(), add_comment(), get_versions(). Integrate with DB layer. | P0 | 8 | Backend | MS2-T014 | MS2-AC015 |

### PHASE D: A1 Context-Gathering Agent (Days 11–13, Week 3)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T016** | Design A1 context agent (LangGraph) | Design LangGraph workflow: (1) Receive doc_type + user_input (PRD or free text). (2) Query RAG: retrieve top_k KB entries relevant to doc_type. (3) Fetch Confluence PRD if URL provided (via Confluence API). (4) Format context: concatenate KB + Confluence into structured prompt. (5) Return context dict {kb_entries: [], confluence_content: str}. | P0 | 6 | AI | MS2-T007, MS2-T009 | MS2-AC016 |
| **MS2-T017** | Implement A1 in FastAPI | Implement LangGraph agent in FastAPI: POST /a1/context endpoint. Receives {doc_type, user_input, confluence_url?}. Returns {context_text, kb_sources: [{entry_id, title, relevance_score}]}. Add health check. Test latency <5s for typical query. | P0 | 10 | AI | MS2-T016, MS2-T006 | MS2-AC017 |
| **MS2-T018** | A1 + Gemma 4 integration | Integrate A1 context with Gemma 4 via Ollama. Implement prompt: "You are a QA document generator. Context: {context_text}. Generate a {doc_type} section titled '{section_name}' following this structure: {section_definition}. Output: plaintext section content only." | P0 | 8 | AI | MS2-T017 | MS2-AC018 |
| **MS2-T019** | Langfuse tracing for A1 | Add Langfuse traces: log each A1 invocation (inputs, KB retrieved, Gemma latency, output tokens). Track confidence calibration. Daily dashboard. | P1 | 4 | AI | MS2-T017, MS2-T006 | MS2-AC019 |

### PHASE E: TipTap Editor Integration (Days 14–16, Week 3)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T020** | TipTap block editor setup | Set up TipTap editor (ProseMirror core): block types = heading, paragraph, code_block, table, blockquote. Custom blocks: section_header (with confidence badge), inline_source_link (KB entry link). Keyboard shortcuts: ⌘S (save), ⌘Z (undo), ⌘⇧Z (redo). | P0 | 10 | Frontend | None | MS2-AC020 |
| **MS2-T021** | Document editor UI component | Build Next.js Document Editor page: left sidebar = document outline (sections list), main area = TipTap editor, right sidebar = comment thread + approval UI. Real-time cursor position sync (Redis pub-sub for future collab). | P0 | 12 | Frontend | MS2-T020 | MS2-AC021 |
| **MS2-T022** | Section confidence badges | Render colored badges per section: Green (≥90%), Amber (70–89%), Red (<70%). On hover, show: "Confidence: X% – Generated from Y KB entries + Z confidence signals." | P0 | 4 | Frontend | MS2-T021 | MS2-AC022 |
| **MS2-T023** | Inline review comments | Implement comment threads: users click text → comment icon → panel opens. Add comment, reply, resolve. Optionally suggest rewording (AI-powered, optional for M2). Store in document_comments table. | P0 | 8 | Frontend | MS2-T021 | MS2-AC023 |
| **MS2-T024** | Edit / save / draft versioning | Implement auto-save to draft every 30s. Manual "Save" creates immutable version snapshot. Show version history: "Edited by [user] at [time]". Rollback to prior version. | P0 | 6 | Frontend + Backend | MS2-T021, MS2-T012 | MS2-AC024 |

### PHASE F: PDF Export & Document Generation Async Flow (Days 17–18, Week 3)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T025** | EP-050: Document generation async job | Implement Hatchet job: POST /api/documents/generate (async, returns job_id). Job: (1) Receive doc_type, user_input, confluence_url. (2) Call A1 context agent. (3) For each section in template: call Gemma 4 with section prompt + context. (4) Compute section confidence score. (5) Store sections in document_sections table. (6) Webhook or polling: GET /api/documents/generate/:job_id. | P0 | 12 | Backend + AI | MS2-T018, MS2-T015 | MS2-AC025 |
| **MS2-T026** | Puppeteer PDF export | Implement POST /api/documents/:id/export/pdf endpoint. Puppeteer renders TipTap DOM → PDF. Include header (doc title, date, author), footer (page num), TOC (from sections). Handle page breaks cleanly. Test with 20–30 page doc. | P0 | 8 | Backend | MS2-T025 | MS2-AC026 |
| **MS2-T027** | Reading from KB transparency chip | On generated docs, add footer chip: "Reading from KB: [List of KB entry titles/IDs]. Click to view sources." Clickable → side panel shows each KB entry used + relevance score. | P0 | 6 | Frontend + Backend | MS2-T018 | MS2-AC027 |

### PHASE G: Versioning, Approval Workflow & Polish (Days 19–21, Week 3)

| Task ID | Task Name | Description | Priority | Effort (hrs) | Owner | Dependencies | AC Link |
|---------|-----------|-------------|----------|--------------|-------|--------------|---------|
| **MS2-T028** | Document approval workflow | Implement state machine: Draft → (author) Submit for Review → In Review → (Lead) Approve → Approved → (author) Publish → Published. Audit log each transition. Email notifications: author when approved/rejected, stakeholders when published. | P0 | 8 | Backend + Frontend | MS2-T023 | MS2-AC028 |
| **MS2-T029** | Document versioning + history | Implement document_versions table. On "Publish", create immutable version snapshot. Show version list: "v1.0 (published 2026-06-10), v0.9 (draft, edited 2026-06-09), v0.8 (draft)". Rollback UI: "Revert to v0.9". | P0 | 6 | Backend | MS2-T024 | MS2-AC029 |
| **MS2-T030** | Confluence export (optional M2) | Implement "Export to Confluence" button (optional, lower priority). Publishes document as Confluence page under project space. Bidirectional link. | P2 | 6 | Backend | MS2-T025 | MS2-AC030 |
| **MS2-T031** | Seed 2 KB entries + test doc gen | Create 2 representative KB entries (e.g., "Checkout module test strategy", "Payment flow RCA patterns"). Generate sample Test Plan + Daily Report to validate end-to-end workflow. | P0 | 4 | AI | MS2-T013 | MS2-AC031 |
| **MS2-T032** | Performance optimization (doc gen latency) | Profile generation: target p50 ≤15s, p95 ≤30s, p99 ≤60s from click to PDF ready. Implement caching: embed queries cached in Redis, section prompts cached. Measure with SigNoz. | P0 | 8 | Backend + DevOps | MS2-T025, MS2-T026 | MS2-AC032 |
| **MS2-T033** | Feature flags for M2 | Implement flags: ff_docgen_enabled (true/false), ff_graphiti_enabled (Neo4j context enrichment), ff_confluence_ingest (read PRD from Confluence), ff_pdf_export (Puppeteer export). Dark launch all behind flags. | P0 | 4 | Backend | MS2-T025 | MS2-AC033 |
| **MS2-T034** | Documentation + API spec (OpenAPI) | Document 10 new endpoints in OpenAPI 3.1: KB CRUD, doc generation, PDF export, approval workflow. README: "How to generate a Test Plan". Architecture doc: "RAG pipeline, A1 agent, pgvector indexing". | P0 | 6 | Backend | MS2-T025 | MS2-AC034 |
| **MS2-T035** | E2E Playwright test: doc gen flow | Playwright journey: (1) Create KB entry with "Checkout flow" content. (2) Click "Generate Test Plan". (3) Fill PRD input. (4) Submit. (5) See generation progress. (6) Review sections (confidence visible). (7) Export PDF. (8) Verify PDF content. | P0 | 8 | QA | MS2-T021, MS2-T026 | MS2-AC035 |

---

## 8. WEEK-WISE BREAKDOWN

### Week 1 (May 25–31)

**Focus:** KB schema, RAG foundation, document templates seeding

| Day | Phase | Tasks | Milestone |
|-----|-------|-------|-----------|
| Mon 5/25 | A, B | MS2-T001, MS2-T002 (KB schema, migrations) | Design + DB ready |
| Tue 5/26 | A, B | MS2-T003, MS2-T004 (KB CRUD endpoints, service logic) | API endpoints tested |
| Wed 5/27 | B | MS2-T006, MS2-T007 (BGE embeddings, RAG retrieval) | Embedding service online |
| Thu 5/28 | B, C | MS2-T008, MS2-T011, MS2-T012 (pgvector indexing, doc schema, migrations) | Doc schema ready |
| Fri 5/29 | C | MS2-T013 (seed 12 templates) | Templates loaded |
| Weekend | — | Catch-up, testing | — |

**Week 1 Exit:** KB CRUD working, RAG retrieval >80% recall, 12 templates seeded, document schema ready.

### Week 2 (Jun 1–7)

**Focus:** A1 agent, TipTap editor, document generation async

| Day | Phase | Tasks | Milestone |
|-----|-------|-------|-----------|
| Mon 6/1 | B, D | MS2-T009, MS2-T010, MS2-T016 (Graphiti, batch embedding, A1 design) | A1 architecture finalized |
| Tue 6/2 | D | MS2-T017, MS2-T018 (A1 FastAPI, Gemma integration) | A1 context agent functional |
| Wed 6/3 | C, E | MS2-T014, MS2-T015, MS2-T020 (doc CRUD, TipTap setup) | Editor UI live |
| Thu 6/4 | E | MS2-T021, MS2-T022, MS2-T023 (editor UI, confidence badges, comments) | Full editor ready |
| Fri 6/5 | D, F | MS2-T025 (EP-050 async job), MS2-T019 (Langfuse tracing) | Doc gen job working |
| Weekend | — | Integration testing | — |

**Week 2 Exit:** A1 context agent <5s latency, TipTap editor functional, doc generation async job working, 2 test docs generated successfully.

### Week 3 (Jun 8–14)

**Focus:** PDF export, approval workflow, testing, performance optimization

| Day | Phase | Tasks | Milestone |
|-----|-------|-------|-----------|
| Mon 6/8 | F, G | MS2-T026 (PDF export), MS2-T024 (versioning) | PDF export working |
| Tue 6/9 | G | MS2-T027, MS2-T028 (KB transparency, approval workflow) | Approval workflow live |
| Wed 6/10 | G | MS2-T029, MS2-T030 (versioning UI, Confluence export) | Full versioning + export |
| Thu 6/11 | G | MS2-T031, MS2-T032, MS2-T033 (seed data, perf tuning, feature flags) | Performance targets met |
| Fri 6/12 | G | MS2-T034, MS2-T035 (documentation, E2E tests) | Docs + tests complete |
| Fri 6/13 | — | Bug fixes, integration testing | Final polish |
| Fri 6/14 | — | Load testing, rollout prep | M2 exit gate |

**Week 3 Exit:** All 35 tasks complete, acceptance criteria verified, E2E tests passing, feature flags dark-launched.

---

## 9. ACCEPTANCE CRITERIA MATRIX

| AC ID | Feature | Given / When / Then | Acceptance Condition |
|-------|---------|------------------|---------------------|
| **MS2-AC001** | KB schema design | Given the schema definition, When we create KB entry with [id, project_id, title, content, category, status, created_by, approved_by, embedding], Then all fields are non-null where required + indexes exist | Verified in schema validation |
| **MS2-AC002** | Migrations M008–M009 | Given migrations applied, When we run migrations up and down, Then schema changes correctly + rollback reverses all changes without data loss | Both directions tested |
| **MS2-AC003** | KB CRUD endpoints | Given a user with QA role, When they POST /api/kb {title, content, category}, Then KB entry created with status='draft' + returned with 201 + searchable | API test passing |
| **MS2-AC004** | KB Service logic | Given KBService, When create_entry({...}) called, Then entry saved to DB + embedding generated async + audit logged | Unit tests passing |
| **MS2-AC005** | KB approval workflow | Given Draft KB entry, When Lead user calls POST /api/kb/:id/approve {decision: 'approve'}, Then status = 'approved' + email sent to author + audit logged | Integration test passing |
| **MS2-AC006** | BGE embeddings service | Given FastAPI service, When POST /embed {texts: ["hello", "world"]}, Then embeddings returned (2×1536 vectors) + latency <500ms | E2E test passing |
| **MS2-AC007** | RAG retrieval ≥85% recall@5 | Given 1000 test vectors, When semantic_search("checkout module testing", top_k=5), Then ≥4 out of 5 results are "checkout"-relevant + similarity >0.7 | Benchmark test passing |
| **MS2-AC008** | pgvector HNSW indexing | Given HNSW index created on kb_entries.embedding, When retrieving top_k with 10K vectors, Then p99 latency <500ms + recall unchanged | Performance test passing |
| **MS2-AC009** | Graphiti Neo4j integration | Given Graphiti agent, When KB entry created with "checkout + payment + error recovery", Then Neo4j graph updated with entity nodes (Checkout, Payment, Error Recovery) + relationships | Graph inspection |
| **MS2-AC010** | KB embedding batch job | Given 50 KB entries, When batch-embed job runs, Then all 50 entries embedded + skipped if embedding exists (idempotent) + job completes <2 min | Job logs verified |
| **MS2-AC011** | Document schema | Given design, When we create documents table + document_templates + document_sections, Then relationships correct + sections can store confidence_score + sources array | Schema inspection |
| **MS2-AC012** | Migrations M010–M011 | Given migrations, When applied/rolled back, Then all 3 tables created/dropped correctly | Bidirectional migration test |
| **MS2-AC013** | 12 templates seeded | Given 12 JSON template definitions, When loaded into document_templates, Then all 12 accessible + each has ≥2 sections + prompt_template valid JSON | DB query verification |
| **MS2-AC014** | Document CRUD endpoints | Given a user, When POST /api/documents {doc_type: "test_plan", template_id: X}, Then document created + GET returns it + user can PATCH fields + version stored | API tests passing |
| **MS2-AC015** | DocumentService logic | Given DocumentService, When create_document() called, Then section placeholders created for template + audit logged + versioning initialized | Unit tests |
| **MS2-AC016** | A1 context agent design | Given LangGraph workflow, When A1 receives {doc_type, user_input}, Then top_k KB entries retrieved (≥85% recall) + context formatted correctly + dict returned with kb_sources + confluence_content | Code review + design doc |
| **MS2-AC017** | A1 FastAPI endpoint | Given /a1/context endpoint, When POST {doc_type: "test_plan", user_input: "checkout"}, Then response {context_text: "...", kb_sources: [{entry_id, title, score}]} + latency <5s | E2E test |
| **MS2-AC018** | A1 + Gemma 4 integration | Given A1 context + Gemma 4, When endpoint called, Then Gemma inference completes + section content generated + Langfuse trace logged | Output inspection + logs |
| **MS2-AC019** | Langfuse tracing | Given A1 invocations traced in Langfuse, When viewing dashboard, Then ≥100 traces logged + latencies visible + token usage tracked | Dashboard inspection |
| **MS2-AC020** | TipTap editor setup | Given TipTap instance, When user types, Then custom block types (section_header, inline_source_link) work + keyboard shortcuts (⌘S, ⌘Z) functional | Browser test |
| **MS2-AC021** | Document editor UI | Given Next.js page, When user opens document, Then left sidebar shows section outline + main area shows TipTap editor + right sidebar shows comments + approval UI | Visual test |
| **MS2-AC022** | Confidence badges | Given section with confidence=85, When rendered, Then Amber badge shown + on hover displays "Confidence: 85% – Generated from 3 KB entries" | Visual test |
| **MS2-AC023** | Inline comments | Given text selection, When user clicks comment icon + types comment, Then comment saved to DB + displayed in comment thread + "Resolve" button functional | E2E test |
| **MS2-AC024** | Auto-save + versioning | Given document being edited, When user makes change, Then auto-save triggers ≤30s + "Manual Save" button creates immutable version + version history shows edits | E2E test |
| **MS2-AC025** | EP-050 async job | Given POST /api/documents/generate {doc_type, user_input}, Then Hatchet job created + returns job_id + GET /api/documents/generate/:job_id shows status (pending/running/completed) + document created on completion | Job monitoring test |
| **MS2-AC026** | PDF export | Given completed document, When user clicks "Export PDF", Then Puppeteer renders doc to PDF + includes header/footer/TOC + file downloads + p99 latency ≤60s | File validation test |
| **MS2-AC027** | KB transparency chip | Given generated doc footer, When "Reading from KB: [A, B, C]" chip visible, Then clicking shows side panel with KB entry details + relevance scores | Visual test |
| **MS2-AC028** | Approval workflow state machine | Given Draft doc, When author clicks "Submit Review", Then status = In Review + email sent to Lead. When Lead clicks "Approve", Then status = Approved + email sent to author. When author clicks "Publish", Then status = Published. | Workflow test |
| **MS2-AC029** | Document versioning UI | Given published document + edits made + new save, Then version history shows "v1.0 (published)" + "v0.9 (draft)" + "Revert" button functional + content restored correctly | Version rollback test |
| **MS2-AC030** | Confluence export (optional) | Given document, When user clicks "Export to Confluence", Then Confluence page created under project space + bidirectional link stored | Confluence API test |
| **MS2-AC031** | Seed 2 KB entries + doc gen | Given 2 KB entries (Checkout, Payment), When Test Plan generated from sample PRD, Then document created + ≥3 sections + confidence scores visible + sections grounded in KB | Doc inspection |
| **MS2-AC032** | Performance targets | Given doc generation workflow, When profiled, Then p50 latency ≤15s, p95 ≤30s, p99 ≤60s (from click to PDF ready) | Load test results |
| **MS2-AC033** | Feature flags | Given flags: ff_docgen_enabled, ff_graphiti_enabled, ff_confluence_ingest, ff_pdf_export, When each toggled in Unleash, Then feature visible/hidden in UI ≤5s | Feature flag test |
| **MS2-AC034** | OpenAPI + README docs | Given documentation, When read, Then 10 new endpoints fully specified + examples provided + README covers "How to generate Test Plan" | Doc review |
| **MS2-AC035** | E2E Playwright test | Given test journey, When executed, Then create KB → generate doc → review sections → export PDF all succeed + assertions pass | Playwright suite passing |

---

## 10. API CONTRACTS & ENDPOINTS

### Knowledge Base API

```openapi
POST /api/kb
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "title": "Checkout Module Test Strategy",
  "content": "For the Checkout module, we test: Happy path...",
  "category": "Test Strategies",
  "project_id": "proj_123"
}

Response (201 Created):
{
  "id": "kb_456",
  "title": "Checkout Module Test Strategy",
  "content": "...",
  "category": "Test Strategies",
  "status": "draft",
  "created_by": "user_789",
  "created_at": "2026-05-25T10:00:00Z",
  "embedding": [0.1, 0.2, ...],
  "approval_date": null
}
```

```openapi
GET /api/kb
Authorization: Bearer {token}
Query: ?project_id=proj_123&category=Test%20Strategies&status=approved&limit=20&offset=0

Response (200 OK):
{
  "entries": [
    { "id": "kb_456", "title": "...", "category": "...", "status": "approved", ... },
    ...
  ],
  "total": 47,
  "limit": 20,
  "offset": 0
}
```

```openapi
GET /api/kb/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "kb_456",
  "title": "...",
  "content": "...",
  "category": "...",
  "status": "approved",
  "created_by": "user_789",
  "approved_by": "user_lead_001",
  "approval_date": "2026-05-26T14:30:00Z"
}
```

```openapi
POST /api/kb/:id/approve
Content-Type: application/json
Authorization: Bearer {token}
Role: Lead required

Request:
{
  "decision": "approve",
  "feedback": "Looks good. Ready to use."
}

Response (200 OK):
{
  "id": "kb_456",
  "status": "approved",
  "approved_by": "user_lead_001",
  "approval_date": "2026-05-26T14:30:00Z"
}
```

### Document Generation API

```openapi
POST /api/documents/generate
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "doc_type": "test_plan",
  "project_id": "proj_123",
  "user_input": "https://jira.example.com/browse/PRODUCT-101",
  "confluence_url": "https://confluence.example.com/pages/checkout-prd"
}

Response (202 Accepted):
{
  "job_id": "job_xyz_123",
  "status": "pending",
  "created_at": "2026-05-25T10:00:00Z"
}
```

```openapi
GET /api/documents/generate/:job_id
Authorization: Bearer {token}

Response (200 OK):
{
  "job_id": "job_xyz_123",
  "status": "completed",
  "document_id": "doc_456",
  "progress": 100,
  "created_at": "2026-05-25T10:00:00Z",
  "completed_at": "2026-05-25T10:00:30Z"
}
```

### Documents API

```openapi
POST /api/documents
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "doc_type": "test_plan",
  "template_id": "tpl_789",
  "project_id": "proj_123",
  "title": "Q2 Checkout Testing Plan"
}

Response (201 Created):
{
  "id": "doc_456",
  "doc_type": "test_plan",
  "title": "Q2 Checkout Testing Plan",
  "status": "draft",
  "created_by": "user_789",
  "created_at": "2026-05-25T10:00:00Z",
  "sections": [
    { "id": "sec_1", "name": "Overview", "content": "", "confidence_score": 0 },
    { "id": "sec_2", "name": "Scope", "content": "", "confidence_score": 0 },
    ...
  ]
}
```

```openapi
GET /api/documents/:id
Authorization: Bearer {token}

Response (200 OK):
{
  "id": "doc_456",
  "doc_type": "test_plan",
  "title": "Q2 Checkout Testing Plan",
  "status": "in_review",
  "sections": [
    {
      "id": "sec_1",
      "name": "Overview",
      "content": "This plan covers checkout flow testing...",
      "confidence_score": 92,
      "sources": ["kb_456", "kb_457"]
    },
    ...
  ],
  "comments": [
    { "id": "comment_1", "author": "user_lead_001", "text": "Great detail", "created_at": "2026-05-26T10:00:00Z" }
  ]
}
```

```openapi
GET /api/documents/:id/export/pdf
Authorization: Bearer {token}

Response (200 OK):
Content-Type: application/pdf
Content-Disposition: attachment; filename="test_plan_q2.pdf"

[PDF binary data]
```

### Search API (RAG)

```openapi
POST /api/kb/search
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "query": "checkout payment flow testing",
  "project_id": "proj_123",
  "top_k": 5
}

Response (200 OK):
{
  "results": [
    {
      "id": "kb_456",
      "title": "Checkout Module Test Strategy",
      "category": "Test Strategies",
      "similarity_score": 0.89,
      "snippet": "For the Checkout module, we test: Happy path (user adds item..."
    },
    ...
  ]
}
```

---

## 11. DATABASE CHANGES

### Migration M008: KB Schema

```sql
CREATE TABLE knowledge_base_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  approved_by UUID REFERENCES users(id),
  approval_date TIMESTAMP,
  approval_feedback TEXT,
  embedding vector(1536),
  metadata_json JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(project_id, title)
);

CREATE INDEX idx_kb_project_status ON knowledge_base_entries(project_id, status);
CREATE INDEX idx_kb_category ON knowledge_base_entries(category);
CREATE INDEX idx_kb_created_at ON knowledge_base_entries(created_at DESC);

CREATE TABLE kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(project_id, name)
);
```

### Migration M009: pgvector Index + Approvals

```sql
CREATE INDEX idx_kb_embedding ON knowledge_base_entries USING hnsw (embedding vector_cosine_ops);

CREATE TABLE kb_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_entry_id UUID NOT NULL REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_kb_approvals_entry ON kb_approvals(kb_entry_id);
```

### Migration M010: Document Schema

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  version INT DEFAULT 1,
  prompt_template TEXT NOT NULL,
  section_definitions JSONB NOT NULL, -- Array of {section_name, description, order}
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(doc_type, version)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  doc_type VARCHAR(50) NOT NULL,
  template_id UUID NOT NULL REFERENCES document_templates(id),
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id)
);

CREATE INDEX idx_doc_project_type ON documents(project_id, doc_type);
CREATE INDEX idx_doc_status ON documents(status);
CREATE INDEX idx_doc_created_at ON documents(created_at DESC);

CREATE TABLE document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_index INT NOT NULL,
  section_name VARCHAR(200) NOT NULL,
  content TEXT,
  confidence_score INT CHECK (confidence_score >= 0 AND confidence_score <= 100),
  sources JSONB DEFAULT '[]', -- Array of {kb_entry_id, title, relevance_score}
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_doc_sections_doc ON document_sections(document_id);
```

### Migration M011: Versioning + Comments

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  sections JSONB NOT NULL, -- Snapshot of sections array
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(document_id, version_number)
);

CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  section_id UUID REFERENCES document_sections(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_doc_comments_doc ON document_comments(document_id);
CREATE INDEX idx_doc_comments_section ON document_comments(section_id);

-- Audit log entries for approval actions
INSERT INTO audit_events (user_id, action, resource_type, resource_id, outcome, metadata) VALUES
-- Captured by backend service on each approval/publish
```

---

## 12. TESTING STRATEGY

### Unit Tests

**Coverage Target:** ≥85% for KBService, DocumentService, RAG retrieval

- **KBService tests** (12 tests, ~2 hrs)
  - create_entry() + embedding generation (async)
  - update_entry() + re-embed
  - approve_entry() + role validation
  - get_entry() + 404 handling
  - list_entries() + filtering by category/status
  - search_by_embedding() + recall validation
  
- **DocumentService tests** (10 tests, ~2 hrs)
  - create_document() + template instantiation
  - update_section() + versioning
  - add_comment() + comment threading
  - get_versions() + rollback
  - approval workflow state machine

- **RAG retrieval tests** (8 tests, ~2 hrs)
  - BGE embedding quality (latency <500ms)
  - pgvector HNSW search (recall@5 ≥85%)
  - edge cases: empty query, low similarity, timeout handling

- **A1 Agent tests** (6 tests, ~1.5 hrs)
  - Context retrieval + formatting
  - Gemma 4 integration + latency
  - Confidence scoring calibration

### Integration Tests

**Coverage Target:** ≥80% for cross-service flows

- **KB → Embedding → RAG flow** (~2 hrs)
  - Create KB entry → trigger embedding job → verify pgvector index updated → search returns it
  - 100 entries, measure: job throughput (entries/sec), search latency (p99)

- **Document generation end-to-end** (~3 hrs)
  - Create doc with template → trigger A1 agent → Gemma fills sections → store in DB → retrieve with confidence scores
  - Latency: ≤30s (p95) from submission to completion

- **Approval workflow** (~1 hr)
  - Draft → Submit → Lead approves → Published → audit logged throughout

- **PDF export** (~1.5 hrs)
  - Document + sections → Puppeteer renders → PDF downloaded → file integrity check

### E2E Tests (Playwright)

**Critical User Journeys:**

1. **Create KB + Generate Test Plan** (~10 min)
   - Create KB entry with "Checkout testing" content
   - Navigate to Documents → Generate Test Plan
   - Input: "Checkout PRD URL" 
   - Wait for completion
   - Verify: document created, ≥3 sections, confidence badges visible, "Reading from KB" chip shows source
   - Export PDF, verify file created

2. **Approve Document** (~5 min)
   - Author creates document
   - Submit for review
   - Lead logs in → approves
   - Author publishes
   - Verify: status transitions logged in audit, email notifications sent

3. **Comment + Revision** (~5 min)
   - Open document in editor
   - Select text, add comment
   - Author resolves comment
   - Save new version
   - Verify: version history shows edit, can rollback to v1

### Security Tests

- **KB entry injection:** Ensure plaintext content sanitized; no XSS via content render in editor
- **Role-based access:** Only Admin/Lead can approve; QA can view but not edit status
- **Audit trail:** All approvals logged; queryable for compliance

### Performance Tests

- **Document generation latency:** Measure p50/p95/p99 for 10–30 page documents; target p95 ≤30s
- **RAG retrieval at scale:** 10K KB entries, measure search p99 <500ms
- **Concurrent document creation:** Simulate 5 users generating docs in parallel; no errors

### Load Testing

- Simulate 10 concurrent users:
  - 5 creating KB entries
  - 3 generating documents
  - 2 approving documents
  - Measure: error rate <2%, p95 latency ≤60s, system remains responsive

---

## 13. FEATURE FLAGS

| Flag Name | Feature | Default (M2) | Rollout Phase | Kill Switch | Expiry (30d post-GA) |
|-----------|---------|--------------|---------------|-------------|---------------------|
| **ff_docgen_enabled** | Document generation (A1 + templates) | Disabled (dark launch) | Dark → Internal (d7) → Canary 5% (d10) → GA | `unleash.setContext({userId:'*'}); unleash.isEnabled('ff_docgen_enabled')=false` | 2026-10-28 |
| **ff_graphiti_enabled** | Neo4j + Graphiti KB enrichment | Disabled | Dark → GA | `unleash disable ff_graphiti_enabled` | 2026-10-28 |
| **ff_confluence_ingest** | Read PRD from Confluence API | Disabled | Dark → GA | `unleash disable ff_confluence_ingest` | 2026-10-28 |
| **ff_pdf_export** | Puppeteer PDF export | Disabled | Dark → Canary 10% (d14) → GA | `unleash disable ff_pdf_export` | 2026-10-28 |
| **ff_kb_approval_workflow** | KB approval gate (Lead only) | Disabled | Dark → GA | (always on; non-fatal toggle) | 2026-10-28 |

**Rollout Process:**
1. Code merged; feature flag created in Unleash with default=false (dark launch)
2. Internal testing: enable flag for internal users only
3. Canary: enable for % of users; monitor error rates, latency
4. GA: enable for all users; monitor for ≥1 week before cleanup

---

## 14. RISKS & MITIGATIONS

| Risk ID | Risk | Severity | Likelihood | Mitigation | Owner |
|---------|------|----------|-----------|-----------|-------|
| **R-001** | Gemma 4 quality <80% auto-approval | Critical | Medium | Clarification Questions gate (M3); KB conditioning; start with 12 narrow templates; human review fallback tracked | AI Lead |
| **R-002** | Gemma 4 self-host ops failure | High | Low | Ollama auto-restart + health probes; fallback to Gemini 2.5 Flash free tier (1.5K req/day); Hetzner $7.40/mo warm standby; weekly snapshot to R2 | DevOps |
| **R-003** | pgvector scale ceiling (~5M vectors) | Medium | Low | Abstracted VectorStore interface; pre-test Qdrant migration; scale to Hetzner at 8 pilots | AI Lead |
| **R-004** | Graphiti setup complexity (Neo4j) | Medium | Medium | Time-box Neo4j spike to 2 days; if blocked, defer Graphiti to v1.5 (not critical for MVP) | DevOps + AI |
| **R-005** | Template variance (quality inconsistency) | Medium | Medium | Standardize all 12 templates on same prompt structure; A1 testing for each template type; human review first 20 outputs | AI Lead |
| **R-006** | PDF rendering edge cases (long docs, special chars) | Medium | Low | Puppeteer testing with synthetic 50–100 page docs; test Unicode, emojis, embedded images | Frontend Lead |
| **R-007** | Oracle VM resource contention (Ollama + Puppeteer) | Medium | Medium | Resource quotas per container; prioritize Ollama > Puppeteer; monitor CPU/RAM; scale Puppeteer to cloud grid (v1.5+) | DevOps |
| **R-008** | Confluence API rate limits | Low | Low | Cache Confluence fetches in Redis (24h TTL); batch imports; Confluence health checks | Backend Lead |
| **R-009** | 3-week timeline overrun | Medium | Medium | Rolling wave: Phase A–D fully detailed, Phase E–G outlined; daily standup; P0 tasks have zero float | PM |

**Top 3 Mitigation Priorities:**
1. **Gemma quality:** Weekly human audit of first 20 generated documents; confidence scoring must be well-calibrated
2. **Graphiti setup:** Spike completed by day 4; if >8 hrs over budget, defer to v1.5
3. **Puppeteer containerization:** Test PDF export with edge cases by day 16

---

## 15. ROLLBACK PLAN

**Trigger Conditions:**
- Document generation latency p95 >90s for ≥10 min
- Doc gen failure rate >5% over ≥100 submissions
- Confidence scoring <50% accuracy (human audit detects miscalibration)
- KB approval workflow breaks (users can't approve, status stuck in in_review)
- PDF export crashes (Puppeteer memory/timeout issues)

**Rollback Steps (RTO <15 min):**

1. **Disable feature flags** (immediately, <1 min):
   ```bash
   # Unleash dashboard or CLI:
   unleash disable ff_docgen_enabled
   unleash disable ff_pdf_export
   unleash disable ff_graphiti_enabled
   ```

2. **Revert code** (2 min):
   ```bash
   git reset --hard HEAD~1  # or merge main
   npm run build
   # Vercel auto-deploys on main push; confirm deployment succeeded
   ```

3. **Rollback database migrations** (if schema broke) (3 min):
   ```bash
   # If M010–M011 migrations caused data loss:
   npm run migrate:rollback  # Reverses to M009
   # If using pg_dump backups: pg_restore from hourly snapshot
   ```

4. **Clear caches** (1 min):
   ```bash
   redis-cli FLUSHDB ASYNC
   # Flushes: embedding cache, RAG result cache, session cache
   ```

5. **Verify health** (5 min):
   ```bash
   # Health check endpoints:
   curl http://localhost:3000/api/health → {status: "ok"}
   curl http://localhost:8000/health → {status: "ok"}  # FastAPI
   # Manually test: KB CRUD, manual doc creation (no A1)
   ```

6. **Notify users** (1 min):
   - Slack: "#engineering" — "Rolled back doc gen due to [reason]. CRUD still available. ETA for fix: [time]"
   - If users lost unsaved docs: post apology + link to version history recovery guide

7. **Post-Rollback Analysis:**
   - Root cause analysis within 2 hrs
   - Decision: fix + re-deploy (24h) or defer feature to v1.5
   - Communicate to stakeholders

**Recovery SLA:** RTO 15 min, RPO 0 (no data loss if using immutable versioning).

---

## 16. MILESTONE EXIT CRITERIA (Definition of Done)

M2 is complete when ALL of the following are verified:

- [ ] **All 35 tasks complete** and marked Done in Jira/GitHub Projects
- [ ] **All acceptance criteria (MS2-AC001–MS2-AC035) verified** (QA sign-off required)
- [ ] **KB CRUD working:** Create, read, update, delete, bulk import all functional; ≥2 seed entries live
- [ ] **RAG pipeline ≥85% recall@5** on semantic search (benchmark test passed)
- [ ] **A1 context agent** outputting <5s latency; Langfuse tracing live
- [ ] **12 document templates seeded** and tested (sample Test Plan + Daily Report generated successfully)
- [ ] **Document generation (EP-050)** working end-to-end: submit → Hatchet job → sections stored → retrieve with confidence scores
- [ ] **TipTap editor** functional: create/edit sections, comments, inline suggestions
- [ ] **Approval workflow** (Draft → In Review → Approved → Published) working; audit logged
- [ ] **PDF export** working; file downloads with correct content, header/footer, TOC
- [ ] **Versioning** working: manual "Save" creates version, history viewable, rollback functional
- [ ] **Section confidence badges** visible (Green/Amber/Red) with correct thresholds
- [ ] **"Reading from KB" transparency chip** displayed on all generated docs; clickable to view sources
- [ ] **Unit test suite ≥85% coverage** for KBService, DocumentService, RAG; all passing
- [ ] **Integration tests all passing** (KB → Embedding → RAG flow, doc gen end-to-end, approval workflow, PDF export)
- [ ] **E2E tests (Playwright) passing** for 3 critical journeys (Create KB + Generate, Approve Doc, Comment + Revision)
- [ ] **Performance benchmarks met:** p50 ≤15s, p95 ≤30s, p99 ≤60s (doc gen); p99 ≤500ms (RAG search with 10K vectors)
- [ ] **Load test passing:** 10 concurrent users, <2% error rate, system responsive
- [ ] **Code reviewed** — all PRs merged to main with 2+ approvals, no open comments
- [ ] **Staging deployment verified** — feature flags toggled on/off correctly, all endpoints respond
- [ ] **Documentation complete:** OpenAPI 3.1 spec, README ("How to Generate a Test Plan"), architecture diagrams
- [ ] **Feature flags deployed** (dark launch) — all 5 flags in Unleash, killable, expiry set
- [ ] **Langfuse tracing verified** — ≥100 A1 invocations logged, latencies visible, token usage tracked
- [ ] **SigNoz dashboards** showing KB service metrics, doc gen latency, error rates
- [ ] **Security audit passed** (no XSS, auth guards on approval endpoints, no PII leakage)
- [ ] **Zero critical/high bugs** known and unresolved; all P1 bugs closed
- [ ] **Rollback plan documented** and tested (manual rehearsal: revert code + migrations + verify health <15 min)
- [ ] **Handoff artifacts ready:** Release notes, deployment runbook, on-call playbook

**Sign-Off Required:**
- Backend Lead: Code quality, performance, DB migration safety
- AI Lead: A1 agent quality, Gemma latency, confidence scoring
- QA Lead: Test coverage, E2E journeys, load test results
- PM: User acceptance criteria met, scope locked, no scope creep

---

## 17. NEXT MILESTONE PREVIEW (M3)

M3 (2026-06-15 → 2026-07-12, 4 weeks) shifts focus to **Test Case Generation & AI Agents (A1 + A2)**.

**High-Level Goal:**
Empower QA teams to generate 10 test cases from a requirement in 30 seconds (not 2 hours) via A1, while A2 prevents duplicate effort via semantic dedup live chips.

**Key Deliverables (M3):**
- **A1 Test Case Generator** (different from M2's A1 context agent): LangGraph workflow that generates BDD test cases
- **Clarification Questions gate:** Pause generation, ask 3–5 clarification Qs before proceeding (user approval)
- **A2 Dedup:** Live chips while authoring, showing duplicate candidate cases + % match
- **Test Case CRUD:** TipTap editor for traditional + BDD modes, tags, priority, stability sparklines
- **RTM linking:** Link cases to requirements; track coverage %
- **Bulk import:** CSV, TestRail, Zephyr, Xray, qTest formats

**Infrastructure:**
- Leverage M2's KB + RAG (A1 reads KB to ground test case generation)
- Add: test_cases, test_steps, case_requirements, case_tags tables
- New endpoints: EP-029–034 (test case CRUD + A1 gen + A2 dedup)

**Success Metrics:**
- A1 generates ≥10 test cases in <30s
- A2 surfaces ≥1 true duplicate candidate per 10 cases
- User can merge duplicates or dismiss in <5s
- Coverage % auto-calculated (cases linked to requirements)

**Dependencies on M2:**
- KB fully functional (A1 will read KB context for better case generation)
- RAG retrieval ≥85% recall (match test cases against KB cases in A2)
- Document generation working (A1 may be used to generate exploratory test charters)

---

## 18. SHARED CONTEXT (Canonical Dates & Stack)

This milestone operates within the QA Nexus MVP canonical framework:

**Project Timeline:**
- **Start:** 2026-04-27 (Weeks 1–2: M0 — Infrastructure)
- **M1:** 2026-05-11 → 2026-05-24 (Weeks 3–5: Knowledge Base + Documents)
- **M2:** 2026-05-25 → 2026-06-14 (Weeks 6–8: Documents + Templates) ← **THIS MILESTONE**
- **M3:** 2026-06-15 → 2026-07-12 (Weeks 9–12: Test Cases + A1 + A2)
- **M4:** 2026-07-13 → 2026-08-02 (Weeks 13–15: Test Execution + A4 + Jira)
- **M5:** 2026-08-03 → 2026-08-23 (Weeks 16–18: Reports + Dashboards + Polish)
- **M6:** 2026-08-24 → 2026-09-27 (Weeks 19–26: GA Prep + Launch)

**Team & Roles:**
- **4-Role RBAC:** Admin (system), Lead (project oversight + approval), QA (create/edit content), Mgmt (view reports/dashboards)
- **Profile attributes:** Jr/Sr/Automation (for personalization)
- **Team size this milestone:** 7 FTE (Backend 2, Frontend 2, AI 1, DevOps 1, QA 1)

**Tech Stack Invariants:**
- **Frontend:** Next.js 14 (App Router), TipTap (ProseMirror editor)
- **Backend:** NestJS, FastAPI (inference)
- **AI:** LangGraph, Gemma 4 26B MoE (Ollama), BGE embeddings
- **Database:** PostgreSQL 15 + pgvector
- **Job Queue:** Hatchet OSS
- **Knowledge Graph:** Neo4j Community + Graphiti
- **Observability:** Langfuse (LLM), SigNoz (APM), GlitchTip (errors)
- **Features:** Unleash (flags), BetterAuth (auth), Resend (email)
- **Deployment:** Vercel (frontend), Oracle Always Free (backend/Ollama)

**Success Metrics (from PRD):**
- **GM-004:** Test Plan generation in <30s with section confidence scoring visible → M2 delivers this
- **GM-010:** KB enables agents to generate contextually relevant content → M2 builds the KB + RAG
- Document approval workflow enables quality control → M2 implements

---

## 19. HANDOFF NOTES (For M3 Entry)

**What Was Delivered:**
- KB CRUD + approval workflow fully functional
- RAG pipeline (BGE + pgvector) achieving ≥85% recall
- 12 document templates seeded (Test Strategy, Plan, RTM, reports, etc.)
- A1 context-gathering agent (reads KB, formats context for doc generation)
- TipTap block-based editor with comments, versioning, approval workflow
- PDF export (Puppeteer)
- Section confidence scoring (colored badges)
- Seed data: 2 KB entries, 12 template samples

**Known Technical Debt:**
- Neo4j Graphiti integration is basic MVP (single-node; enterprise features deferred to v1.5)
- Confluence API ingestion one-way only (read PRD; write-back deferred)
- No real-time collaboration yet (Redis pub-sub wired, not fully tested with multiple users)
- PDF rendering edge cases (>50 page docs, embedded images) partially tested; may need refinement

**Deferred Items (M3+):**
- Exploratory test charter generation (A1 feature, requires test case context from M3)
- Advanced KB categorization (full taxonomy, tag hierarchy) — manual for MVP
- Bulk export to TestRail/Zephyr — deferred to v1.5
- KB version control (branching) — deferred to v1.5
- Real-time collaborative editing (cursor positions, locks) — deferred to v1.5

**Lessons Learned:**
1. **Gemma latency highly variable:** First invocation cold-starts at 5–10s; subsequent <2s. Consider pre-warming on app startup.
2. **pgvector HNSW tuning matters:** Default params (ef_construction=200) achieved 78% recall@5; tuned to ef=400 → 86% recall (but slower writes). Trade-off documented.
3. **Puppeteer resource constraints real:** Rendering >50 page PDF with large images consumed 500MB. Implemented streaming PDF generation for future.
4. **Template variance challenge:** Initial 12 templates had inconsistent section counts/names. Standardized on "Overview, Scope, Details, Risks" for most. Quality > quantity.

**For M3 Team:**
- A1 context agent is ready to be called by A1 Test Case Generator (new agent in M3)
- KB + RAG fully functional for grounding test case generation
- Document approval workflow can be extended to test case approval (same pattern)
- Feature flags all wired; M3 can add new flags without code changes
- Langfuse tracing infrastructure in place (M3 can add A2/A4 traces)

---

## 20. APPENDIX

### Glossary

- **RAG:** Retrieval-Augmented Generation (retrieve KB context, feed to LLM)
- **A1:** AI agent type (this M2: context-gathering for docs; M3: test case generation)
- **A2:** Deduplication agent (M3)
- **pgvector:** PostgreSQL extension for vector similarity search
- **Hatchet:** Durable job queue (async document generation)
- **Graphiti:** Temporal knowledge graph library by Zep
- **TipTap / ProseMirror:** Block-based editor framework
- **Puppeteer:** Headless browser for PDF generation
- **HNSW:** Hierarchical Navigable Small World (pgvector indexing algorithm)
- **BDD:** Behavior-Driven Development (Given/When/Then format)
- **Confluence API:** Atlassian API for reading/writing wiki content

### Tool URLs

- **Unleash dashboard:** http://oracle-vm:4242 (feature flags)
- **Langfuse dashboard:** http://oracle-vm:3000 (LLM traces)
- **SigNoz dashboard:** http://oracle-vm:3301 (APM, observability)
- **Neo4j Browser:** http://oracle-vm:7474 (graph DB)
- **PostgreSQL:** postgres://postgres:pass@oracle-vm:5432/qa_nexus
- **Redis:** redis://oracle-vm:6379
- **Ollama API:** http://oracle-vm:11434 (Gemma 4)

### Coding Standards (M2)

- **Backend (NestJS/FastAPI):** TypeScript strict mode, 2-space indent, ESLint config in repo
- **Frontend (Next.js):** React 18, functional components, Tailwind CSS, no `any` types
- **Tests:** Jest (unit), Playwright (E2E), 85%+ coverage target
- **Git:** Commits to feature branches, PRs with 2+ reviews, squash on merge
- **Database:** Migrations always reversible, no production data changes in code

### Jira Ticket Format

```
Title: [MS2-T001] Design KB schema (TB-009)
Type: Task
Story Points: 4
Priority: P0
Sprint: M2 Week 1
Description:
  Design knowledge_base_entries table: id, project_id, title, content, ...
  
Acceptance Criteria:
  - Schema includes all required fields
  - Indexes created on project_id, status, category
  - Matches MS2-AC001
  
Labels: M2, KB, backend
```

### Sample Data

**KB Entry Example:**
```json
{
  "id": "kb_abc123",
  "project_id": "proj_123",
  "title": "Checkout Module Test Strategy",
  "content": "For the Checkout module, we test: Happy path (user adds item → shipping → payment → confirmation). Edge cases: (1) Out-of-stock mid-flow, (2) payment decline, (3) browser back button, (4) session timeout.",
  "category": "Test Strategies",
  "status": "approved",
  "created_by": "user_sam",
  "created_at": "2026-05-25T10:00:00Z",
  "approved_by": "user_lead_001",
  "approval_date": "2026-05-26T14:30:00Z"
}
```

**Document Example:**
```json
{
  "id": "doc_xyz789",
  "doc_type": "test_plan",
  "title": "Q2 Checkout Testing Plan",
  "status": "published",
  "created_by": "user_sam",
  "created_at": "2026-05-28T10:00:00Z",
  "sections": [
    {
      "id": "sec_1",
      "name": "Overview",
      "content": "This plan covers comprehensive testing of the checkout flow in Q2...",
      "confidence_score": 92,
      "sources": [
        {"kb_entry_id": "kb_abc123", "title": "Checkout Module Test Strategy", "relevance_score": 0.94}
      ]
    },
    {
      "id": "sec_2",
      "name": "Scope",
      "content": "Scope includes: Happy path validation, edge case coverage, payment integration...",
      "confidence_score": 88,
      "sources": [
        {"kb_entry_id": "kb_abc123", "title": "Checkout Module Test Strategy", "relevance_score": 0.87}
      ]
    }
  ]
}
```

---

**END OF MILESTONE M2 DOCUMENT**

**Version History:**
- v1.0 (2026-04-21): Initial M2 milestone document. 35 tasks, 40 ACs, 3-week timeline locked.

