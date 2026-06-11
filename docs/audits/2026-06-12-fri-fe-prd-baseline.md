# FE PRD-Conformance Baseline — Fri 2026-06-12 (Phase-A knowledge index)

**Purpose.** Establish the binding PM1-MANDATED vs PM2-4-DEFERRED boundary so that every FE finding from
tonight's audit (`docs/audits/2026-06-11-thu-fe-full-audit.md`) can be judged a **conformance FAILURE** (PM1
feature that must work now and doesn't) or an **acceptable deferral** (Pattern-A canned / "coming soon" is fine).
This feeds Phase-B conformance matrix + Phase-C live tests.

**Sources (all cited inline below):**

- `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` **v8.1** — product scope/requirements (PRD §)
- `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` **v2.1** — engineering inventory, milestone→frame map, GA gates (ERD §)
- `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` + `…/Redesign Frame by claude design/_DESIGN_RULES.md` (17 rules)
- 14 canonical v2 HTML frames in `…/Redesign Frame by claude design/`
- `docs/audits/2026-06-11-thu-fe-full-audit.md` (referred to here as **TONIGHT**)
- `CLAUDE.md` Hard Rules 1–18 + Iksula data canon
- Audited code state: `origin/main @ cb1f2c4`, FE worktree branch `audit/fe-thu-jun-11`.

---

## ⚠️ Reader's decoder ring (read this first — it prevents 90% of misreadings)

1. **Two different "F" namespaces.** The PRD uses **capability IDs F-001…F-016** (functional areas, PRD §9.2).
   The UI / milestones / this audit use **frame IDs F06…F28** (screens). They are NOT the same. This baseline
   keys everything on the **frame IDs F06–F28** (what the audit and React routes use) and cross-references the
   PRD capability + FR-/NFR-/workflow IDs.
2. **The binding scope boundary is the milestone schedule, not just §8.** §8.2 lists what is _out of MVP
   entirely_ (PM2+). But within the MVP, **PRD §15.3 + ERD §9 assign each frame/agent to a milestone M0–M6**.
   _That milestone assignment is the precise "is it mandated NOW" answer._ A frame can be **SHIPPED** (ported,
   exists) yet its feature milestone is M4/M5/M6 ⇒ **canned data is acceptable today**.
3. **MVP launch = end of M5 (target 2026-08-31, ERD §9). M6 (→2026-09-21) is Full-Reports + GA polish, after
   the internal pilot launch.** So M6 items are NOT what Yogesh's pilot exercises.
4. **Today is 2026-06-11.** Per the PRD/ERD calendar the project _should_ be finishing M2 / entering M3. The FE
   is far ahead (frames ported through F28). **The conformance question is therefore almost never "is the frame
   built" (most are) — it is "does the data/behavior the PRD mandates for THIS milestone actually work."**
5. **Agent codenames** (DESIGN_RULES §"Agent naming", CLAUDE.md): **A1 = Composer**, **A2 = Curator**,
   **A4 = Sherlock**. UI must never show "A1/A2" literally (DESIGN_RULES rule 15).
6. **PRD implementation columns are partly pre-pivot.** PRD §10/§12 still name FastAPI, Ollama/Gemma, Redis,
   Hetzner, Vercel/Oracle, LangGraph+Hatchet, Langfuse/SigNoz, Qwen3-embed. **Those are superseded** by the
   locked PM1 stack (ERD §11 Q-PM1-01…20 + CLAUDE.md): NestJS / Groq+Gemini / Render / Neon / Cloudflare /
   bge-small-384 / Grafana. **The NFR _targets_ (latency, uptime, RBAC) remain binding; the _implementation_
   names do not.** ERD §10 even _revises_ the agent-latency gate for Groq (A1<10s, A2<500ms, A4<15s).

---

# A. PM1 SCOPE BOUNDARY (verbatim PRD quote + clean mandated/deferred list)

## A.1 Verbatim — PRD §8 Scope Summary (lines 221–263)

> ### 8.1 In Scope for MVP
>
> | Area                  | MVP Scope                                                                                                                     |
> | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
> | Workspace foundation  | Authentication, project setup, role-based access (4 roles: Admin/Lead/QA/Management), project membership                      |
> | Document intelligence | Upload and manage PRD and QA documents (12 templates), Notion-style editor, generate selected QA artifacts, approval workflow |
> | Test case management  | Author, edit, organize, tag, prioritize, and link test cases; RTM (Requirements Traceability Matrix)                          |
> | AI assistance         | A1 generation with clarification questions, A2 dedupe detection, A4 5-layer RCA                                               |
> | Execution             | Manual execution workflow with evidence linking (screenshots, logs, timestamps)                                               |
> | Defects               | Defect creation, AI-assisted RCA summary, Jira 2-way sync                                                                     |
> | Reporting             | Daily, weekly, sprint, and release-oriented summary reporting; Executive Dashboard with ROI                                   |
> | Knowledge layer       | Cross-project retrieval of approved QA knowledge via RAG (Retrieval-Augmented Generation)                                     |
> | Search and navigation | Global search (Cmd+K omnibox) across cases, defects, documents, KB                                                            |
> | Governance            | Auditability of major AI actions and operational events (immutable audit log)                                                 |
> | Integrations          | Jira (OAuth 2-way), CI webhook (GitHub/GitLab), Slack notifications, Confluence (read PRDs), Resend (email)                   |
>
> ### 8.2 Explicitly Out of Scope for MVP
>
> - replacing Jira for project management
> - full cloud device grid (deferred to v1.5+)
> - advanced visual regression (deferred to v2+)
> - full low-code automation editor (A3 deferred to v1.5+)
> - advanced change-based test selection (A5 deferred to v1.5+)
> - synthetic test data platform (A6 deferred to v1.5+)
> - full career development layer (L7 deferred to v2+)
> - full EU AI Act compliance workspace (L6 foundation only; full governance deferred to v1.5+)
> - on-prem enterprise deployment (deferred to v1.5+)
> - white-label multi-brand productization (deferred to v2+)
>
> ### 8.3 Post-MVP Priority Candidates
>
> - low-code automation authoring (A3)
> - AI-driven test selection for pull requests (A5)
> - richer self-healing maintenance workflows (A7)
> - deeper compliance and governance reporting (L6)
> - AI product behavior testing for LLM features (APT)
> - portfolio and career modules (L7)
> - on-prem and multi-tenant SaaS scaling

## A.2 Verbatim — PRD §15.2 Release Readiness Gates (the launch bar)

> - Core workflows work end to end for at least one pilot project
> - Jira integration works reliably for selected fields
> - AI features are reviewed and logged with visible rails
> - Weekly reporting can be produced from product data
> - Pilot measurement instrumentation is active
> - Security audit passed (0 critical, 0 high vulnerabilities)
> - WCAG 2.1 AA accessibility verified
> - Pilot KPIs met (≥80% DAU, ≥70% defect flow, ≥80% A1 auto-approve)

## A.3 Clean PM1-MANDATED vs PM2-4-DEFERRED per feature area (every row cites §)

| Feature area                                                                                             | Verdict                                           | Citing §                                                                            | Notes                                                        |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Auth (email+password / magic-link), session                                                              | **PM1-MANDATED (M0/M1)**                          | PRD §8.1, FR-001, NFR-013; ERD §9 M0/M1; gate ERD §10.8                             | BetterAuth. SSO/SAML deferred (§16.1).                       |
| 4-role RBAC (Admin/Lead/QA-Eng/Stakeholder)                                                              | **PM1-MANDATED (M1)**                             | PRD §8.1, FR-002, NFR-002/014; ERD §9 M1, TB-002; gate ERD §10.8                    | **Server-side enforce is partially M6** — see GAP-5.         |
| Project create/switch/archive + membership                                                               | **PM1-MANDATED (M1)**                             | PRD §8.1, FR-003; ERD §9 M1 (F09/F10)                                               | F10 standalone create/settings page absent (TONIGHT §1-P2).  |
| User invite + role assignment UI                                                                         | **PM1-MANDATED (M1)**                             | PRD §9.2-A; ERD §9 M1 ("F27/F27m1 Users & Roles + Invite")                          | **Invite is M1 = mandated.** Reconciles TONIGHT P0-D / P0-2. |
| Document upload + 12 templates                                                                           | **PM1-MANDATED (M2)**                             | PRD §8.1, §9.2-B, FR-004; ERD §9 M2                                                 | Upload exists; templates partial.                            |
| TipTap/ProseMirror Notion editor + Draft→Submitted→Approved versioning                                   | **PM1-MANDATED (M2)**                             | PRD §8.1, §9.2-B, FR-005, W-003; ERD §9 M2; ERD §3.11                               | **NOT BUILT = GAP-1.** This is a mandated M2 capability.     |
| Knowledge Base screen + RAG semantic search + pin                                                        | **PM1-MANDATED (M2)**                             | PRD §8.1, §9.2-B, FR-017; ERD §9 M2, EP-024/025                                     | **One of the few genuinely LIVE FE surfaces** (TONIGHT §5).  |
| Test case CRUD + tag/priority/bulk + versioning                                                          | **PM1-MANDATED (M3)**                             | PRD §8.1, §9.2-C, FR-006; ERD §9 M3                                                 | FE: F16a/b/c ported; `/test-cases` list is placeholder (P2). |
| RTM (Requirements Traceability Matrix) linking                                                           | **PM1-MANDATED (M3)**                             | PRD §9.2-C, FR-009 (**Should**); ERD §9 M3                                          | Lower priority (Should, not Must).                           |
| **A1 Composer** test-case generation + clarification gate + confidence                                   | **PM1-MANDATED (M3)**                             | PRD §8.1, §9.2-C, §12.2, FR-007, W-001/W-007; ERD §7-A1, §9 M3; gate ERD §10.2      | `/test-cases/generate` is the one MIXED-live FE route.       |
| **A2 Curator** dedupe chips (test cases + defects)                                                       | **PM1-MANDATED (M3/M4)**                          | PRD §8.1, §9.2-C/E, §12.2, FR-008, W-008; ERD §7-A2; gate ERD §10.3                 | Embedding-only (no LLM assignment, ERD TB-021).              |
| Test runs (create, row-per-case, quick status, evidence paste)                                           | **PM1-MANDATED (M4)**                             | PRD §8.1, §9.2-E, FR-010, W-002; ERD §9 M4, §3.10                                   | FE F19/F20 ported, canned (TONIGHT §5 P1).                   |
| **Test Suites** (group cases, run-from-suite)                                                            | **PM1-MANDATED (M4)**                             | PRD §9.2-C ("hierarchical"), W-002; ERD §9 M4 ("F18/F18m1 Suites"), TB-009/010      | **NOT BUILT = GAP-2.** Mandated for M4 (target Aug 3).       |
| Defect create (prefilled) + **A4 Sherlock 5-layer RCA**                                                  | **PM1-MANDATED (M4)**                             | PRD §8.1, §9.2-E, §12.2, FR-011/012, W-002; ERD §7-A4, §9 M4; gate ERD §10.4        | A4 eval ratcheted 70%→40% (GAP-4, ADR-019).                  |
| Jira 2-way sync (OAuth 3LO + webhook/poll)                                                               | **PM1-MANDATED (M4)**                             | PRD §8.1, §9.2-E, FR-013, W-002; ERD §9 M4, EP-006/007/008/014                      | FE F-source-jira ported canned (P1).                         |
| CI webhook ingestion (GitHub/GitLab)                                                                     | **PM1-MANDATED (M5)**                             | PRD §8.1, §9.2-E, W-004; ERD §9 M5, EP-009                                          | **GAP-6** — endpoint not evidenced.                          |
| Slack notifications (outbound webhook)                                                                   | **PM1-MANDATED (M5)**                             | PRD §8.1, §12.11; ERD §9 M5, EP-010                                                 | **GAP-6** — not evidenced.                                   |
| Confluence read / Resend email                                                                           | **PM1-MANDATED**                                  | PRD §8.1, §12.11; ERD §2 (5 integrations)                                           | Resend is the invite-email channel (ADR-018).                |
| **Basic Reporting** — 4 templated reports (Daily/Weekly/Sprint/Release)                                  | **PM1-MANDATED (M5)**                             | PRD §8.1, §9.2-F "Basic Reporting (M5)", FR-014, W-005; ERD §9 M5 (F23), EP-016/017 | FE F23 ported canned (P1).                                   |
| **Executive Dashboard** — 5-KPI + ROI + Approve Release                                                  | **PM1-MANDATED (M5)**                             | PRD §9.2-F, W-006; ERD §9 M5 (F25), EP-019                                          | FE F25 ported canned; Approve-release dead (P1).             |
| Personal dashboard (assigned cases/defects)                                                              | **PM1-MANDATED (M5)**                             | PRD §9.2-F; ERD §9 M5                                                               | Part of F08 home family.                                     |
| **Cmd-K omnibox** global search + nav + agent invoke                                                     | **PM1-MANDATED (M5)**                             | PRD §8.1, §9.2-F (F-016), FR-016 (**Should**); ERD §9 M5                            | **GAP-7** + palette has 404s (TONIGHT §5.4).                 |
| Immutable HMAC audit log + F28 viewer                                                                    | **PM1-MANDATED (cross-cutting; surfaced M5 F28)** | PRD §8.1, §9.2-Gov, FR-015, NFR-018; ERD §9 M5 (F28), §3.13, gate ERD §10.9         | BE proven (TONIGHT §1). FE F28 canned.                       |
| **LLM provider config** (F28m1) + **agent model assignment** (F26m1) — Day-0 setup                       | **PM1-MANDATED (M5; added PRD v8.1)**             | PRD §1.1 v8.1, §12.3; ERD TB-019/020/021, EP-026/027/028/029                        | Day-0 flow; FE canned + many dead buttons (TONIGHT §6).      |
| **Full Reporting** — 10 named dashboards, quality-gate presets, cohort/date-range                        | **PM2-4-DEFERRED (M6, post-launch)**              | PRD §9.2-F "Full Reporting (M6, Post-GA)"; ERD §9 M6                                | After internal pilot launch. Canned/absent OK now.           |
| **F24 QA-Value dashboard**                                                                               | **DEFERRED-within-MVP (M5 headline, low pri)**    | ERD §9 M5; TONIGHT GAP-3                                                            | Mitigated by F25 which IS shipped. Ambiguous-priority.       |
| Light/dark mode (real), Design v3 GA polish                                                              | **PM2-4-DEFERRED (M6)**                           | PRD §9.2-F/§19.2; ERD §9 M6; CLAUDE.md R14 ("dark/light…post-M4")                   | Theme toggle is Pattern-A stub today — acceptable.           |
| Operate/Review/Prove mode behavior                                                                       | **DEFERRED (intentional no-op now)**              | TONIGHT §6 (handoff §4 "data hook only")                                            | Not PRD-mandated as interactive; mark, don't fix.            |
| **A3** low-code automation editor                                                                        | **PM2-4-DEFERRED (v1.5)**                         | PRD §8.2, §8.3, §16.1                                                               | Not in PM1 agent set (ERD §2 = 3 agents).                    |
| **A5** change-based test selection                                                                       | **PM2-4-DEFERRED (v1.5)**                         | PRD §8.2, §8.3, §16.1                                                               | —                                                            |
| **A6** synthetic test-data platform                                                                      | **PM2-4-DEFERRED (v2)**                           | PRD §8.2, §16.1                                                                     | —                                                            |
| **A7** self-healing / test maintenance                                                                   | **PM2-4-DEFERRED (v2)**                           | PRD §8.3, §16.1; ERD §3.11 note                                                     | "Flaky→Deprecated" manual in PM1.                            |
| **A8** full auto test-planning                                                                           | **PM2-4-DEFERRED (v1.5)**                         | PRD §16.1                                                                           | —                                                            |
| L6 full EU AI Act compliance workspace                                                                   | **PM2-4-DEFERRED (v1.5; foundation only in MVP)** | PRD §8.2, §16.1, §19.2                                                              | —                                                            |
| L7 career/portfolio modules                                                                              | **PM2-4-DEFERRED (v2)**                           | PRD §8.2, §16.1                                                                     | —                                                            |
| Cloud device grid, visual regression, mobile app, white-label, full 70-doc catalog, on-prem/multi-tenant | **PM2-4-DEFERRED**                                | PRD §8.2, §16.1                                                                     | MVP ships 12 of 70 templates.                                |

**FR/NFR priority note:** every FR-001…FR-017 is **PM1 (MVP)**; priority is **Must** except **FR-009 (RTM link)
= Should**, **FR-016 (global search) = Should**, **FR-017 (KB retrieval) = Should** (PRD §9.1). All NFR-001…030
are PM1 targets; the **binding GA gates** are the subset re-stated in ERD §10 (see Table C / GA gates below).

---

# B. REQUIREMENT → IMPLEMENTATION MAP

## B.1 Functional requirements FR-001…FR-017 (PRD §9.1)

| FR     | Requirement (abbrev)                           | Priority   | Milestone | Port/impl status (TONIGHT §1)       | Data state (TONIGHT §5/§6)              | Conformance read                           |
| ------ | ---------------------------------------------- | ---------- | --------- | ----------------------------------- | --------------------------------------- | ------------------------------------------ |
| FR-001 | Role/membership-scoped workspace access        | Must       | M0/M1     | Auth SHIPPED                        | **Pattern broken** — signed-out → Admin | **FAIL (P0-A)**                            |
| FR-002 | 4-role RBAC                                    | Must       | M1        | SHIPPED (client)                    | guard client-only                       | **PARTIAL** — client OK, server M6 (GAP-5) |
| FR-003 | Project create/switch/archive                  | Must       | M1        | SHIPPED                             | canned switcher; #255 unmerged          | **FAIL-ish (P0-B)** real list never wired  |
| FR-004 | Ingest/version source docs                     | Must       | M2        | SHIPPED (upload)                    | canned/live mix                         | OK for milestone (upload works)            |
| FR-005 | Generate QA docs from source (editor+approval) | Must       | M2        | **NOT BUILT (GAP-1)**               | n/a                                     | **FAIL (mandated M2, absent)**             |
| FR-006 | Test case CRUD/tag/priority                    | Must       | M3        | PARTIAL (`/test-cases` placeholder) | canned                                  | Acceptable today (M3 in-flight)            |
| FR-007 | A1 Composer draft generation                   | Must       | M3        | SHIPPED                             | MIXED live + fallback                   | **PASS-track** (live path exists)          |
| FR-008 | A2 Curator similarity/dedupe                   | Must       | M3/M4     | SHIPPED (UI)                        | canned chips                            | Acceptable; verify live in Phase-C         |
| FR-009 | Link cases → requirements (RTM)                | **Should** | M3        | PARTIAL                             | canned                                  | Acceptable deferral (Should)               |
| FR-010 | Manual runs + status + evidence                | Must       | M4        | SHIPPED (F19/F20)                   | canned                                  | Acceptable today (M4 future)               |
| FR-011 | Defect from failed test, prefilled             | Must       | M4        | SHIPPED (F21/F22)                   | canned                                  | Acceptable today (M4 future)               |
| FR-012 | A4 Sherlock RCA                                | Must       | M4        | SHIPPED                             | canned; eval 64% (GAP-4)                | Acceptable today; eval risk noted          |
| FR-013 | Jira 2-way sync                                | Must       | M4        | SHIPPED (UI)                        | canned 3-step                           | Acceptable today (M4 future)               |
| FR-014 | Reporting for team+mgmt                        | Must       | M5        | SHIPPED (F23/F25)                   | canned                                  | Acceptable today (M5 future)               |
| FR-015 | Immutable audit of high-value actions          | Must       | cross-cut | SHIPPED (BE proven)                 | FE F28 canned                           | BE PASS; FE viewer canned-OK               |
| FR-016 | Global search (Cmd-K)                          | **Should** | M5        | PARTIAL                             | palette has 404s (GAP-7)                | Acceptable deferral but **404s = defect**  |
| FR-017 | Retrieve historical KB in AI flows             | **Should** | M2        | SHIPPED (KB live)                   | LIVE                                    | **PASS-track**                             |

## B.2 Frames F06–F28 (UI namespace) — milestone, canonical HTML, route, port + data state

Port status uses TONIGHT §1 ("~20 SHIPPED / 3 PARTIAL / 2 NOT BUILT"). Data state uses TONIGHT §5 matrix +
§6 click-sweep. "Milestone" from ERD §9.

| Frame             | Title                                    | PRD cap / §           | Milestone (ERD §9)        | PM1-mandated NOW?     | Canonical v2 HTML                                                                      | React route                                                                       | Port                                                  | Data state                                                                     |
| ----------------- | ---------------------------------------- | --------------------- | ------------------------- | --------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| F06/F06b/F06c     | Sign In / forgot / verify                | FR-001 §9.2-A         | M0                        | **YES**               | (M0 originals, pre-redesign)                                                           | `(auth)/sign-in`, `/sign-in/forgot`, `(auth)/verify-magic-link`                   | SHIPPED                                               | canned copy; `callbackURL` hardcoded `/home` (P0-3)                            |
| F07/F07b-d        | Founder + invited onboarding             | §9.2-A                | M1                        | **YES**               | (onboarding originals)                                                                 | `(onboarding)/founder`, `/invited/{lead-admin,qa-engineer,stakeholder}`           | SHIPPED but **orphaned**                              | CANNED, fictional names, dead CTAs (P0/P2)                                     |
| F08a/b/c          | Home (QA / Lead-Admin / Stakeholder)     | §9.2-F personal dash  | M1 (F25 home variants M5) | **YES (single home)** | (home originals)                                                                       | `/home`, `/home/lead-admin`, `/home/empty`                                        | SHIPPED; **lead/empty use own shell (R14 violation)** | CANNED P0; lead-admin+empty **24/22 dead buttons** (P0)                        |
| F09               | Projects List                            | FR-003 §9.2-A         | M1                        | **YES**               | (projects original)                                                                    | `/projects`                                                                       | SHIPPED                                               | CANNED P0; real `/api/projects` wiring (#255) **closed unmerged** (P0-B)       |
| F10               | Project create/settings                  | FR-003                | M1                        | **YES**               | (n/a separate frame)                                                                   | **absent** (modal only)                                                           | NOT-BUILT (standalone)                                | create-project is a modal; standalone page absent (P2)                         |
| F12               | Doc upload                               | FR-004 §9.2-B         | M2                        | **YES**               | (upload original)                                                                      | `/projects/[slug]/upload`                                                         | SHIPPED                                               | CANNED (2 files preloaded) P1                                                  |
| F13               | Imports                                  | §9.2-B                | M2                        | **YES**               | (imports original)                                                                     | `/projects/[slug]/imports`, `/kb/imports`                                         | SHIPPED                                               | CANNED P1                                                                      |
| F14 + F14m1/m2/m3 | Requirements + Edit/Link/Convert modals  | FR-009 §9.2-C         | M3                        | **YES**               | `F14 Requirements v2.html`, `F14m1/m2/m3 …v2.html`                                     | `(app)/requirements`                                                              | SHIPPED                                               | CANNED P1; React #418 hydration                                                |
| F15               | Knowledge Base                           | FR-017 §9.2-B         | M2                        | **YES**               | `F15 Knowledge Base v2.html` (also canonical shell)                                    | `/projects/[slug]/kb`, `/kb/upload`, `/kb/imports`                                | SHIPPED                                               | **LIVE** (real fetch + honest empty states) — best surface                     |
| F16a              | Test Case Method Chooser                 | §9.2-C                | M3                        | **YES**               | `F16a Test Case Method Chooser v2.html`                                                | (entry within test-cases)                                                         | SHIPPED                                               | canned chooser                                                                 |
| F16b              | A1 Composer Generate from Requirement    | FR-007 §9.2-C         | M3                        | **YES**               | `F16b A1 Generate from Requirement v2.html`                                            | `(app)/test-cases/generate`                                                       | SHIPPED                                               | **MIXED** (live + honest fallback) P2                                          |
| F16c              | Bulk Import Test Cases                   | §9.2-C                | M3                        | **YES**               | `F16c Bulk Import Test Cases v2.html`                                                  | (modal in test-cases)                                                             | SHIPPED                                               | canned                                                                         |
| F17               | Test Case Library                        | FR-006 §9.2-C         | M3                        | **YES**               | (no v2; library)                                                                       | `(app)/test-cases`                                                                | **PARTIAL (placeholder)**                             | CANNED placeholder P2                                                          |
| F18 + F18m1       | Test Suites + Edit Suite modal           | §9.2-C, W-002         | M4                        | **YES (M4)**          | `F18 Test Suites v2.html`, `F18m1 Edit Suite Modal v2.html`                            | **absent**                                                                        | **NOT-BUILT (GAP-2)**                                 | models orphaned; no route                                                      |
| F19               | Run Console (live)                       | FR-010 §9.2-E         | M4                        | **YES (M4)**          | `F19 Run Console v2.html`                                                              | `/projects/[slug]/runs/[runId]`                                                   | SHIPPED                                               | CANNED P1                                                                      |
| F20               | Run Results                              | FR-010 §9.2-E         | M4                        | **YES (M4)**          | `F20 Run Results v2.html`                                                              | `/projects/[slug]/results`                                                        | SHIPPED                                               | CANNED P1 (cluster fiction)                                                    |
| F21               | Defects Hub                              | FR-011 §9.2-E         | M4                        | **YES (M4)**          | `F21 Defects Hub v2.html`                                                              | `/projects/[slug]/defects`                                                        | SHIPPED                                               | CANNED P0 (fabricated P0 incident)                                             |
| F22               | Defect Detail (5-layer RCA)              | FR-012 §9.2-E         | M4                        | **YES (M4)**          | `F22 Defect Detail v2.html`                                                            | `/projects/[slug]/defects/[id]`                                                   | SHIPPED                                               | CANNED P0 (fictional assignees)                                                |
| F23               | Reports Studio                           | FR-014 §9.2-F         | M5                        | **YES (M5)**          | (handoff bundle / v2)                                                                  | `/projects/[slug]/reports`                                                        | SHIPPED                                               | CANNED P1                                                                      |
| F24               | QA-Value dashboard                       | §9.2-F                | M5                        | **DEFERRED-in-MVP**   | (n/a)                                                                                  | **absent**                                                                        | **NOT-BUILT (GAP-3)**                                 | mitigated by F25                                                               |
| F25               | Executive Dashboard (Prove)              | §9.2-F, W-006         | M5                        | **YES (M5)**          | `F25 Executive Dashboard v2 -Dark-.html`                                               | `/dashboard/executive`                                                            | SHIPPED                                               | CANNED P0; Approve-release + Export dead                                       |
| F26 + F26m1/m2    | Agents + Model Assignment modals         | §12.2, v8.1           | M5                        | **YES (M5)**          | `F26m1 LLM Provider Setup Modal v2.html`, `F26m2 Agent Model Assignment Modal v2.html` | `/admin/agents`, `/admin/agents/provider-setup`, `/admin/agents/model-assignment` | SHIPPED                                               | CANNED P1; sub-routes **all 26 controls dead**, #418                           |
| F27 + F27m1       | Users & Roles + Invite modal             | §9.2-A                | M1                        | **YES (M1)**          | `F27 Users and Roles v2.html`, `F27m1 Invite User Modal v2.html`                       | `/admin/users`, `/admin/users/invite`                                             | SHIPPED                                               | CANNED P0; **live `useAdminUsers` exists, unused**; invite inert + #418 (P0-D) |
| F28 + F28m1       | Settings & Audit + Provider Config modal | FR-015 §9.2-Gov, v8.1 | M5                        | **YES (M5)**          | `F28 Settings and Audit v2.html`, `F28m1 LLM Provider Configuration Modal v2.html`     | `/admin/settings`, `/admin/settings/providers`                                    | SHIPPED                                               | CANNED P1 (47k fake audit rows); Save/Test/Close dead                          |

**Frame-numbering gaps:** F11 not in PM1 inventory; F08a/b/c, F06b/c, F07b-d are sub-variants. The ERD §2 count
is **41 frames** (17 Claude Design + 24 Claude Code), GA gate ERD §10.1 requires all 41 render at locked tokens.

## B.3 NFR-001…030 (PRD §10) — binding targets + GA-gate subset

| NFR                                    | Target (PRD §10.1)                                                 | PM1-mandated                  | GA-gate? (ERD §10)                                 | FE status                                          |
| -------------------------------------- | ------------------------------------------------------------------ | ----------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| NFR-001 Page load                      | p50<1.5s / p95<3s + **full RWD 320→1920, no h-scroll, ≥44px taps** | **YES**                       | **Gate §10.5**                                     | RWD enforced by hook; perf unmeasured in prod (P2) |
| NFR-002 API latency                    | p50<200ms / p95<500ms                                              | YES                           | **Gate §10.6**                                     | unmeasured prod                                    |
| NFR-003 Agent latency                  | **A1<10s, A2<500ms, A4<15s** (ERD §10.7 revised)                   | YES                           | **Gate §10.7**                                     | deferred to Day-29 (GAP-7/P2)                      |
| NFR-004 Global search                  | p95<2s KB / <5s full                                               | YES (Should feature)          | —                                                  | KB live                                            |
| NFR-005 Jira sync                      | <5s/defect                                                         | YES                           | —                                                  | canned                                             |
| NFR-006 Report gen                     | p95<30s                                                            | YES                           | —                                                  | canned                                             |
| NFR-007 Screenshot upload              | <10s/1MB                                                           | YES                           | —                                                  | R2 presign exists                                  |
| NFR-008 Playwright run                 | p50<5min/case                                                      | YES (M5)                      | —                                                  | GAP-7 unverified                                   |
| NFR-009 DB query                       | p95<200ms                                                          | YES                           | —                                                  | BE                                                 |
| NFR-010 Cache hit ≥80%                 | YES (impl=Redis ⇒ **superseded**, no Redis in PM1 ERD §8.2)        | n/a                           | impl superseded                                    |
| NFR-011 Availability                   | 99.5% MVP / 99.9% post-GA                                          | YES                           | —                                                  | UptimeRobot keep-alive                             |
| NFR-012 Scalability                    | 8 pilot users etc.                                                 | YES                           | —                                                  | —                                                  |
| NFR-013 AuthN                          | email+pw, SSO-ready                                                | YES                           | implied §10.8                                      | SHIPPED                                            |
| NFR-014 RBAC 4-role                    | enforced all endpoints                                             | YES                           | **Gate §10.8**                                     | **client-only (GAP-5); server M6**                 |
| NFR-015 Encrypt at rest (AES-256 PII)  | YES                                                                | —                             | BE                                                 |
| NFR-016 TLS 1.3                        | YES                                                                | —                             | platform                                           |
| NFR-017 Jira token encrypted           | YES                                                                | —                             | BE                                                 |
| NFR-018 Immutable audit                | YES                                                                | **Gate §10.9 (HMAC ≥99.95%)** | BE proven                                          |
| NFR-019 PII masking in logs            | YES                                                                | —                             | §security.md                                       |
| NFR-020 SQLi prevention (Prisma)       | YES                                                                | —                             | BE                                                 |
| NFR-021–025 Privacy/GDPR/consent       | YES (consent opt-in banner)                                        | —                             | not evidenced FE                                   |
| NFR-026 **WCAG 2.1 AA** core workflows | YES (M5)                                                           | **§15.2 launch gate**         | **unverified (GAP-7)**                             |
| NFR-027–030 Observability              | YES                                                                | —                             | OTel→Grafana (impl Langfuse/SigNoz **superseded**) |

**Non-NFR GA gates (ERD §10):** §10.1 41/41 frames render tokens (largely met), §10.2 A1 eval ≥80%,
§10.3 A2 FP<5%/TP≥60%, §10.4 A4 top-2 ≥70% (**ratcheted to 40%, GAP-4**), §10.10 6/8 pilot users complete
the full flow unaided, §10.11 **$0 cost gate**, §10.12 free-tier headroom ≥50%.

---

# C. HARD RULE → GOVERNED SURFACES (CLAUDE.md Rules 1–18)

| Rule | Governs                                                           | Surfaces / enforcement         | Relevance to tonight's findings                                                                                                             |
| ---- | ----------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | $0/month cost gate                                                | all infra/deps                 | Gate ERD §10.11; TONIGHT §4 confirms clean                                                                                                  |
| 2    | Free/OSI OSS only                                                 | `package.json`, infra          | `enforce-pm1-stack.sh`                                                                                                                      |
| 3    | Never edit 46 locked HTML frames                                  | `PM1_UI_v2/**`                 | **Directly = P0-C**: fictional names live in locked frames ⇒ fix needs Yogesh approval                                                      |
| 4    | No MD3 tokens / no extend tailwind config                         | `apps/web/**/*.{ts,tsx,css}`   | `enforce-design-tokens.sh`                                                                                                                  |
| 5    | Ban-list deps                                                     | `package.json`, lockfile       | `enforce-pm1-stack.sh`; note LangGraph/Hatchet/Redis (PRD-era) are banned                                                                   |
| 6    | No secrets in repo                                                | all                            | gitleaks CI (not pre-commit — TONIGHT §4-P1.3)                                                                                              |
| 7    | State-changes → HMAC audit_log                                    | BE write paths, F28            | FR-015/NFR-018; gate ERD §10.9                                                                                                              |
| 8    | pnpm only                                                         | scripts                        | —                                                                                                                                           |
| 9    | TS strict                                                         | `apps/web`, `apps/api`         | —                                                                                                                                           |
| 10   | Zod schemas in `packages/shared`, shared FE/BE                    | API + FE validation            | **TONIGHT §4-P1.1**: 3 FE files redefine project/invite schemas; `inviteRoles` divergent casing                                             |
| 11   | Ask Yogesh, never guess                                           | process                        | the SCOPE question in TONIGHT reconciled verdict                                                                                            |
| 12   | Full RWD every ported frame                                       | every `(app)/**/page.tsx`      | `enforce-rwd.sh`; NFR-001                                                                                                                   |
| 13   | Visual confirmation gate pre-commit                               | every new/refactored screen    | the binding human gate                                                                                                                      |
| 14   | App-shell parity (AdminShell) on every authed page                | `(app)/**/page.tsx`            | **Directly = home-lead + home-empty violations** (own shell ⇒ dead nav, P0); `enforce-app-shell.sh` **never implemented** (TONIGHT §4-P1.4) |
| 15   | Port from v2 HTML; design changes need approval                   | FE ports                       | source-of-truth for B.2 / Table D                                                                                                           |
| 16   | Canonical-first port workflow (diff-probe)                        | FE ports                       | —                                                                                                                                           |
| 17   | Canned-data verbatim extraction                                   | `components/**/canned-data.ts` | **P0-C is NOT a Rule-17 violation** — names came verbatim from locked HTML (Rule-3 upstream)                                                |
| 18   | All ports via `.claude/skills/frame-port` (+Day-19/21 amendments) | FE ports, diff-probe bands     | governs how F18 (GAP-2) must be built                                                                                                       |

---

# D. v2 FRAME → REACT PORT + DIFF STATUS (the 14 canonical frames)

Canonical set per CLAUDE.md Hard Rule 15 inventory (12 frames + canonical demo). Listed with major structural
sections (from ARIA landmarks) and the React port. (F25/F26/F27/F28 v2 HTML were added later via Claude Design
handoff bundles — included for completeness as they are now ported.)

| v2 HTML frame                                                                  | Major sections (ARIA-derived)                                                            | React route(s)                          | Port status                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| F14 Requirements v2                                                            | topbar (switch project / new / notifications) + rail + requirements list + detail drawer | `(app)/requirements`                    | SHIPPED, CANNED, #418                                 |
| F14m1 Edit Requirement / F14m2 Link Test Case / F14m3 Convert to Jira (modals) | modal stage forms                                                                        | requirements page modals                | SHIPPED                                               |
| F15 Knowledge Base v2 (**canonical shell**)                                    | banner + breadcrumb + card grid + chunk detail + search/clear/tweaks                     | `/projects/[slug]/kb` (+upload/imports) | SHIPPED, **LIVE**                                     |
| F16a Method Chooser v2                                                         | Create-Manually / AI-Generated / Bulk-Import / resume-recent                             | test-cases entry                        | SHIPPED                                               |
| F16b A1 Generate v2                                                            | rail + breadcrumb + generate-phases + activity panel                                     | `(app)/test-cases/generate`             | SHIPPED, **MIXED-live**                               |
| F16c Bulk Import v2                                                            | import-phases + default merge strategy                                                   | test-cases modal                        | SHIPPED                                               |
| F18 Test Suites v2                                                             | rail + breadcrumb + filter suites + bulk actions + coverage-RAG legend + suite rows      | **none**                                | **NOT-BUILT (GAP-2)**                                 |
| F18m1 Edit Suite Modal v2                                                      | suite edit form                                                                          | **none**                                | **NOT-BUILT**                                         |
| F19 Run Console v2                                                             | cases-in-run pane + current-case pane + evidence tabs + pass/fail/flaky                  | `/projects/[slug]/runs/[runId]`         | SHIPPED, CANNED (AdminShell canonical per R14 Day-17) |
| F20 Run Results v2                                                             | clusters + cluster timing + evidence rail + create-defects-from-clusters                 | `/projects/[slug]/results`              | SHIPPED, CANNED                                       |
| F21 Defects Hub v2                                                             | defects header + filters + bulk actions + defect detail + export                         | `/projects/[slug]/defects`              | SHIPPED, CANNED                                       |
| F22 Defect Detail v2                                                           | breadcrumb + defect metadata + layer breakdown (5-layer RCA) + more-actions              | `/projects/[slug]/defects/[id]`         | SHIPPED, CANNED                                       |
| `_Demo Collapsible Nav Sections.html`                                          | binding shell pattern (collapsible sections + single rail scrollbar)                     | AdminShell                              | reference, not a route                                |
| (later-added) F25 Executive Dashboard v2                                       | exec header + KPIs + approval sign-off + Prove overlays                                  | `/dashboard/executive`                  | SHIPPED, CANNED, dead Approve                         |
| (later-added) F26m1/m2 Provider/Model modals                                   | provider directory + model checklist + per-agent picker                                  | `/admin/agents/*`                       | SHIPPED, CANNED, dead controls                        |
| (later-added) F27 Users & Roles + F27m1 Invite                                 | users table + invite modal                                                               | `/admin/users(+/invite)`                | SHIPPED, CANNED, invite inert                         |
| (later-added) F28 Settings & Audit + F28m1 Provider Config                     | settings tabs + audit log + provider config                                              | `/admin/settings(+/providers)`          | SHIPPED, CANNED, dead Save/Test                       |

_Per-viewport pixel diff-probe status (GREEN/AMBER/RED per Rule 18) is not in tonight's data; Phase-B should
re-run `diff-probe.mjs --scope content` for any frame contested at visual gate._

---

# E. CROSS-LINK — tonight's findings → PRD § → mandated-or-deferred verdict (THE reconciliation)

**Legend:** **CONFORMANCE FAILURE** = PM1-mandated for current/past milestone AND broken/absent ⇒ must fix.
**ACCEPTABLE DEFERRAL** = canned/absent is fine because feature's milestone is future (M4/M5/M6) or feature is
PM2+. **DEFECT-regardless** = broken even though the surrounding feature may be deferred (a dead button/404/crash
is never "acceptable canned").

| Finding (TONIGHT)                                              | What it is                                              | PRD/ERD §                                                         | Mandated milestone      | VERDICT                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0-A** signed-out visitor gets full Admin surface            | auth/RBAC gate hole (CurrentUserContext fallback→Admin) | FR-001/002, NFR-002/014; ERD §10.8; gate §15.2                    | **M0/M1 (past)**        | **CONFORMANCE FAILURE** — mandated auth gate is broken. Must fix before any pilot.                                                                                                                                                                                                                                   |
| **P0-B** F09 switcher real `/api/projects` unmerged (#255)     | project list shows canned not API                       | FR-003; ERD §9 M1, EP-…                                           | **M1 (past)**           | **CONFORMANCE FAILURE (soft)** — project-switching is M1-mandated; live data never wired. Cheapest real-data win.                                                                                                                                                                                                    |
| **P0-C** fictional names (Suresh P., Priya, Ritu B., …)        | non-roster identities shown to pilot                    | Iksula data canon (CLAUDE.md); Rule 3 (names live in locked HTML) | cross-cutting           | **CONFORMANCE FAILURE vs data canon** — but root cause upstream (locked frames), fix needs Yogesh approval. NOT a Rule-17 port defect.                                                                                                                                                                               |
| **P0-D** `/admin/users/invite` inert + #418                    | invite modal POSTs nothing + hydration crash            | §9.2-A; ERD §9 **M1** ("F27m1 Invite")                            | **M1 (past)**           | **Split:** the **#418 crash = DEFECT-regardless (FAIL)**. The **POST-nothing invite = ambiguous**: invite UI is M1-mandated, but real invite _email/onboarding_ wire is called an M5 item in TONIGHT §7. **FLAG: is functional invite an M1 conformance item or M5?** Lean FAIL (M1 frame), but confirm with Yogesh. |
| home-lead / home-empty **24/22 dead nav buttons**              | own shell, not AdminShell (Rule 14)                     | CLAUDE.md R14; F08b M1                                            | **M1 (orphaned)**       | **DEFECT-regardless** if reachable; mitigated because **orphaned** (no inbound route). Real `/home` works. ⇒ **Acceptable for pilot IF kept unreachable**; FAIL if role-home routing ships.                                                                                                                          |
| Theme toggle + Operate/Review/Prove dead                       | shell widgets no-op                                     | R14 ("dark/light post-M4"); TONIGHT §6                            | **M6 / intentional**    | **ACCEPTABLE DEFERRAL** — theme persists (smoke 4); mode is by-design no-op. Mark, don't fix.                                                                                                                                                                                                                        |
| ⌘K palette 404 links + slug hardcoded `ret`                    | broken nav targets                                      | FR-016 (**Should**, M5)                                           | **M5 (future)**         | **DEFECT-regardless** for the 404s (broken links read as defects) even though omnibox is a Should/M5 feature. Gate links to built routes.                                                                                                                                                                            |
| 24/28 routes CANNED fiction                                    | dummy data app-wide                                     | per-frame milestones (Table B.2)                                  | mixed                   | **Mostly ACCEPTABLE DEFERRAL** — defects/runs/reports/exec are M4/M5 ⇒ canned OK _if marked_. FAIL only where milestone is past (home/projects/users = M1, P0).                                                                                                                                                      |
| **GAP-1** TipTap/ProseMirror doc editor + approval absent      | entire authoring pillar not built                       | FR-005, §9.2-B, W-003; ERD §9 **M2**                              | **M2 (should be done)** | **CONFORMANCE FAILURE (scope-gated)** — mandated M2 capability, absent. Multi-week build. **Pilot-blocking ONLY IF pilot scope includes in-app doc authoring.**                                                                                                                                                      |
| **GAP-2** F18 Test Suites not built                            | models orphaned, no route                               | §9.2-C, W-002; ERD §9 **M4**                                      | **M4 (future, Aug 3)**  | **ACCEPTABLE DEFERRAL today** — M4 is future per schedule. Mark "coming soon". FAIL only if pilot needs suite-based organization. **NOT PM2 — it is PM1/M4.**                                                                                                                                                        |
| **GAP-3** F24 QA-Value dashboard not built                     | dashboard absent                                        | §9.2-F; ERD §9 M5                                                 | **M5 (future)**         | **ACCEPTABLE DEFERRAL** — M5 + mitigated by F25 (shipped).                                                                                                                                                                                                                                                           |
| **GAP-4** A4 Sherlock eval 70%→40% (ADR-019), 64%              | low-confidence RCA shown                                | gate ERD §10.4                                                    | M4                      | **AMBER / GO-NO-GO item** — gate was formally ratcheted (ADR), so not a silent failure, but pilot users may see weak RCA. Flag for Yogesh.                                                                                                                                                                           |
| **GAP-5** RLS isolation not evidenced; admin guard client-only | server-side RBAC absent                                 | NFR-014; ERD §10.8; BUG-003 "accepted-for-pilot"                  | server-enforce **M6**   | **ACCEPTABLE DEFERRAL (documented)** for server-side; but **P0-A's signed-out hole is the FAIL part**.                                                                                                                                                                                                               |
| **GAP-6** GitHub/Slack webhooks not evidenced                  | CI ingest + alerts                                      | W-004, §12.11; ERD §9 **M5**, EP-009/010                          | **M5 (future)**         | **ACCEPTABLE DEFERRAL** — M5. Verify in Phase-C when M5 lands.                                                                                                                                                                                                                                                       |
| **GAP-7** Cmd-K search, Playwright-CI, WCAG/Axe unverified     | M5 exit items unverified                                | FR-016, NFR-008/026; §15.2                                        | **M5 (future)**         | **ACCEPTABLE DEFERRAL today**; **WCAG is a §15.2 launch gate** ⇒ must pass before _launch_, not before today.                                                                                                                                                                                                        |
| §4-P1.1 FE schema drift (`inviteRoles` casing)                 | 3 FE files bypass shared Zod                            | Rule 10                                                           | cross-cut               | **DEFECT (latent)** — fires when Pattern-A wiring lands; fix in hardening.                                                                                                                                                                                                                                           |
| §4-P1.2 E2E CI non-blocking (`continue-on-error`)              | happy-path never gated                                  | §15.2 instrumentation                                             | cross-cut               | **PROCESS FAILURE** — _why_ P0-001 + dummy state shipped green. New auth-gate e2e must be blocking.                                                                                                                                                                                                                  |
| §4-P1.5 undocumented env vars absent from `.env.example`       | silent stub-mode on fresh deploy                        | NFR config                                                        | cross-cut               | **DEFECT (ops)** — document before next Render deploy.                                                                                                                                                                                                                                                               |
| `docs/milestone-reports/` empty                                | closures asserted only in CHANGELOG/EOD                 | traceability                                                      | process                 | **P2 traceability gap** — confirmed empty this audit.                                                                                                                                                                                                                                                                |

**Net reconciliation (the one-sentence frame):** Of tonight's items, the **true PM1 conformance failures**
(mandated for a current/past milestone AND broken/absent) are **P0-A, P0-B, P0-D's #418 crash, GAP-1**, plus
the **M1-past canned surfaces (home/projects/users)** and **P0-C vs the data canon**. Everything keyed to
**M4/M5/M6** (runs, defects, reports, exec, Jira, suites=GAP-2, webhooks=GAP-6, omnibox/WCAG=GAP-7) is an
**acceptable deferral _today_** provided it is clearly marked "coming soon" and not dead-ended — exactly
TONIGHT's reconciled recommendation to **scope the pilot to the agentic-QA core (all SHIPPED) and defer
GAP-1/GAP-2**.

**Open ambiguities flagged for Yogesh (do not guess):**

1. **Is a _functional_ user-invite (real Resend email + set-password) an M1 conformance requirement or an M5
   item?** ERD §9 places F27m1 in M1; TONIGHT §7 calls the real wire M5. (Affects P0-D verdict.)
2. **Does the pilot scope include in-app document authoring (GAP-1/M2) and suite organization (GAP-2/M4)?**
   This is the single GO/NO-GO scope question; the PRD mandates both for MVP but on M2/M4 timelines.
3. **F24 QA-Value (GAP-3):** ERD lists it M5-headline but TONIGHT treats it optional given F25 — confirm
   whether it is required for pilot or formally dropped.
