---
milestone_id: M7
parent_project_milestone: PM2
phase: v1.5
canonical_source: PROJECT_ROADMAP.md v1.2
version: 1.0
date: 2026-04-22
start_date: 2026-09-22
end_date: 2026-10-10
duration_weeks: 3
duration_calendar_days: 19
week_within_pm2: "W1-3"
team_size_fte: "3 (1 backend, 1 AI eng, 1 QA)"
owner: "Backend Lead"
predecessors: ["M6 (GA prep + observability)", "M5 (automation runner + reporting)"]
successors: ["M8 (Self-Healing)", "M10 (AI Product Tester)"]
primary_agent: "A6 (Test Data Generation)"
status: "Planned"
---

# Milestone M7 — Test Data Generation (A6)

## Executive Summary

M7 delivers **A6 Test Data Generation**, enabling inline synthetic data creation with full provenance, version history, immutable audit trail, and compliance-aware handling (PII scrubbing, HIPAA/GxP awareness). QA engineers no longer manually seed test data; A6 generates realistic, parameterized datasets on demand during test authoring or batch execution. Provenance includes seed value, schema version, generator algorithm, and user approval state — enabling reproducibility, audit, and compliance review. This milestone unblocks data-driven test scenarios at scale without exposing sensitive production data or requiring manual fixture maintenance.

**Mission:** Shift synthetic data creation from manual labor (fixtures, factories, spreadsheets) to agent-assisted generation, with compliance-first design. Enable QA teams to author tests faster by auto-populating parametrized datasets.

**Key Deliverables:**
- A6 agent using LangGraph + Faker library (extensible generators per column type)
- Inline data generation UI (right-rail panel in test case editor, Notion-style)
- Batch generation API + Hatchet job orchestration
- Provenance tracking: seed, generator version, source schema, user approval, timestamp
- Version history + diff view (dataset mutations tracked)
- Re-generate with same seed for deterministic reproducibility
- Export: CSV, JSON, SQL INSERT
- Audit trail written to TB-012 `audit_events` (immutable, encrypted at rest)
- PII scrub passes + FERPA/HIPAA-aware data shapes (feature-flagged for PM3 compliance foundation)
- Integration tests validating schema compliance + deterministic generation

**Success Criteria:** A6 generates valid test data <2s p95 (10k rows); ≥95% of synthetic data passes validation; audit trail 100% complete; re-generation with same seed yields identical dataset.

---

## Context: What Shipped Before

**PM1 Foundation (M0–M6):**
- Test case management with parameterization placeholders (TipTap editor supports {var} syntax, deferred binding)
- Test execution runner (Playwright automation, manual runs, evidence capture)
- Basic test reporting (pass rate, flake detection, defect counts)
- A4 Defect Intelligence with RCA (stack → env → config → code → data layers)
- Jira 2-way sync + defect categorization

**PM2 Earlier (M5 completion gate for M7 entry):**
- Playwright runner fully operational with artifact storage (R2)
- Materialized views for reporting KPIs
- Feature flag infrastructure mature (Unleash)
- Observability baseline (SigNoz, Langfuse, GlitchTip) capturing agent performance
- 2–3 Iksula pilots live with test data seeded manually (spreadsheets, factories)

**What M7 Unlocks Downstream:**
- M8 (Self-Healing) depends on test data quality + consistency for pattern learning (flake signals baseline)
- M9 (Risk-Adaptive Planning) consumes historical defect patterns linked to synthetic data characteristics
- M10 (AI Product Tester) uses A6 to auto-generate user personas + action sequences for exploratory testing
- M11 (Visual Regression + Mobile) leverages A6 to parametrize UI states (light/dark mode, locales, viewport sizes)
- M13 (Low-Code Authoring, PM3) references A6 to auto-fill test data in visual editors
- M14 (Test Selection, PM3) uses A6 output to estimate test coverage per data subset

---

## Scope

### In Scope (Delivering in M7)

1. **A6 Agent Architecture**
   - LangGraph node graph: input schema → clarification questions → generator selection → generation → approval → persist
   - Prompt templates per data type (name, email, phone, address, credit card, medical, e-commerce)
   - Integration with Faker library + custom generators per schema column
   - Confidence scoring per generated value (0.0–1.0)
   - Human-in-the-loop approval: show generated sample (5–10 rows), user confirms or regenerates

2. **Synthetic Data Generator Engine**
   - Schema-aware generation: read test_cases.param_schema (JSONB, Zod-validated), generate matching values
   - Faker library integration: name(), email(), phoneNumber(), address(), creditCard(), etc.
   - Custom generators: medical (patient ID format), e-commerce (SKU taxonomy), finance (account number with checksum)
   - Deterministic mode: seed-based generation (same seed → same data every time)
   - Non-deterministic mode: random generation with min/max/regex constraints per column

3. **Provenance & Audit Trail**
   - TB-012 `audit_events` entries for each generation:
     ```json
     {
       "actor": "user_id",
       "action": "data_generation",
       "resource_type": "test_case",
       "resource_id": "case_123",
       "metadata": {
         "generator_version": "v1.2.3",
         "seed": "abc123",
         "row_count": 10,
         "schema_version": "2.1",
         "approval_state": "approved",
         "pii_scrub_applied": true,
         "compliance_flags": ["HIPAA", "GDPR"]
       },
       "timestamp": "2026-09-25T14:30:00Z"
     }
     ```
   - Immutable log (append-only, no delete/update)
   - Encryption at rest (AES-256-GCM, key stored in Doppler secrets)

4. **Version History & Diff**
   - TB-019 `data_generation_history` (new) tracking each generation:
     - dataset_id, version, seed, schema, row_count, created_by, created_at, changes_from_prev_version
   - Diff view: show row-by-row changes between versions (added/deleted/modified rows)
   - Rollback UI: select prior version, re-apply to test case (updates test parameters)

5. **Integration Points**
   - Inline in test case editor (right-rail panel, Notion-style)
   - Triggered via `POST /api/data/generate` (sync <2s for <1k rows, async for >1k via Hatchet)
   - Batch generation API: `POST /api/data/generate-batch` (parametrized across multiple test cases, async)
   - Export endpoints: `GET /api/data/:id/export?format=csv|json|sql`

6. **Compliance Features**
   - PII scrubbing (feature-flagged, default off):
     - Detect sensitive columns (email, ssn, credit_card, phone) via regex + LLM classification
     - Mask or exclude PII from logs (store only in DB, never in audit trail plaintext)
   - HIPAA awareness (feature flag `compliance.hipaa_mode`):
     - Generate patient IDs in valid formats
     - Avoid linking patient data across generations (random patient ID per dataset)
     - Restrict certain test data types (no real-world-like insurance numbers, etc.)
   - GxP awareness (feature flag `compliance.gxp_mode`):
     - Immutable audit trail (cannot be deleted, only appended)
     - Batch generation tracked as single operation with approval chain
     - Export format supports 21 CFR Part 11 compliance (metadata + signature)

### Out of Scope (Deferred to PM3+)

- Cloud data providers (Stripe Test API, Twilio Sandbox) — defer to M10 or M13
- Real PII de-identification (Tink API, Anonymizer libraries) — defer to PM3 compliance work
- Data masking in production exports (PII redaction for analytics) — PM4
- Integration with DuckDB/Polars for large-scale generation (>100k rows) — M12 (v1.5 GA prep)
- Genetic testing / ML-based data synthesis — PM4 (Career Intelligence phase)

### Rationale

- Inline generation in test editor unblocks QA engineers from manual data seeding, reducing test authoring time
- Provenance + audit trail de-risks compliance audits (HIPAA, GxP, SOC2, EU AI Act)
- Deterministic generation enables test reproducibility (critical for flake debugging, M8 Self-Healing)
- Export + version history enables data reuse across test suites and sharing with teams

---

## Exit Gate + Acceptance Criteria

**Milestone Exit Gate (GoNogo Decision, 2026-10-10):**

All acceptance criteria verified + 0 critical bugs + performance SLOs met + 2 pilots using A6 successfully.

| AC-ID | Acceptance Criterion | Verifier | Pass/Fail |
|-------|-----|----------|----------|
| **M7-AC001** | A6 generates synthetic data for ≥6 data types (name, email, phone, address, credit card, medical ID) in <2s p95 (measured for 10k row generation) | QA | TBD |
| **M7-AC002** | Generated data passes schema validation (type, length, format, constraints) ≥95% of time | QA | TBD |
| **M7-AC003** | Provenance audit trail logged to TB-012 for 100% of generations (seed, schema, user, timestamp, approval state) | Backend | TBD |
| **M7-AC004** | Re-generation with identical seed produces identical dataset (bit-for-bit reproducibility, tested on 5 datasets) | QA | TBD |
| **M7-AC005** | Version history diff view renders correctly; rollback to prior version works (data exported + used in test) | QA | TBD |
| **M7-AC006** | Inline generation UI in test case editor (right-rail panel) functional: open panel → select data type → generate → approve → bind to {param} | Frontend | TBD |
| **M7-AC007** | Batch generation API enqueues 50 concurrent requests without error; all complete within 5 min | Backend | TBD |
| **M7-AC008** | Export endpoints (CSV, JSON, SQL INSERT) produce valid files readable by spreadsheet + database tools | Backend | TBD |
| **M7-AC009** | PII scrub feature flag toggles correctly; when enabled, plaintext PII excluded from audit logs (encrypted in DB only) | Security | TBD |
| **M7-AC010** | HIPAA mode flag generates valid patient ID formats; batch generation immutable + cannot be deleted | Compliance | TBD |
| **M7-AC011** | Faker library integration tested for determinism (10 generations with seed="test123" all identical) | QA | TBD |
| **M7-AC012** | A6 confidence scoring visible on UI; generation marked "low confidence" if <0.75 threshold | Frontend | TBD |
| **M7-AC013** | Observability: Langfuse traces capture A6 invocations with latency, confidence, data types used; SigNoz dashboard shows generation rate + errors | DevOps | TBD |
| **M7-AC014** | Pilot feedback: 2 pilots can independently author 3 test cases using A6 data generation (without training beyond 30 min intro) | PM | TBD |

**V2 Working Hypothesis (Quantified Targets):**
- Generation latency target <2s p95 is pilot-target, measured against baseline: current manual seeding time ~5–10 min per test case. A6 <2s is **4–5x faster**, enabling rapid test iteration.
- ≥95% validation success rate assumes Faker + custom generators are well-tuned to schema constraints. Initial runs expect 90–94%; tuning during W2 (T007).
- Re-generation reproducibility is critical for M8 (flake detection consistency) and M9 (defect pattern analysis). Targeting 100% because PRNG seeding is deterministic by design.

---

## Feature / Task Breakdown (Week-Wise)

### WEEK 1: A6 AGENT ARCHITECTURE + FAKER INTEGRATION (2026-09-22 → 2026-09-28)

#### M7-T001: A6 LangGraph Agent Design & Implementation
**Description:** Define and implement LangGraph node graph for synthetic data generation. Route input → clarification → generator selection → generation → approval → audit.

**Details:**
- **Input:** Test case schema (JSONB), user intent (e.g., "Generate 100 user records for login test")
- **Node 1: Schema Validation**
  - Receive test_cases.param_schema (Zod-validated)
  - Extract columns: name, type, constraints (min/max length, regex, enum)
  - Route to generator selection
- **Node 2: Clarification Questions (HITL Gate)**
  - If schema ambiguous or >10 columns, ask: "Generate 100 or 1000 rows?" "Include nulls for optional fields?" "Locale for addresses (US/EU/etc)?"
  - Wait for user response (2 min timeout, default = proceed)
- **Node 3: Generator Selection**
  - Map column types to generators: STRING → Faker.word() | Faker.sentence() | Faker.email()
  - Logic tree: if column name matches regex /email|mail/ → Faker.email(); if /credit|card/ → custom credit_card(); else → Faker.word()
- **Node 4: Data Generation**
  - Instantiate Faker with seed (deterministic) or random seed (non-deterministic)
  - Generate row batch (configurable, default 100)
  - Compute confidence per value (LLM judgment on compliance with schema + realism)
  - Aggregate confidence per batch (mean, min, max)
- **Node 5: Approval Gate**
  - Display sample (first 5 rows) + metadata (seed, row_count, confidence, estimated latency)
  - User can: Approve → save to TB-019 + audit to TB-012, Regenerate, or Discard
- **Node 6: Persist + Audit**
  - Save dataset to TB-019 `data_generation_history`
  - Log to TB-012 `audit_events` with metadata (schema, seed, user, approval, compliance flags)
  - Return dataset ID + export links

**Priority:** P0  
**Estimate:** 24 hours  
**Owner:** AI Engineer + Backend Lead  
**Dependencies:** TB-012, TB-019 schema ready; Faker library installed; Langfuse integration (M5)  
**US-ID:** US-051 (test data generation)  
**TB/EP:** TB-012, TB-019, EP-070 (new data gen endpoint)

---

#### M7-T002: Faker Library Integration + Custom Generators
**Description:** Integrate Faker.js (Node) or Python Faker; extend with custom generators for domain-specific types.

**Details:**
- **Faker Integration:**
  - Package: `@faker-js/faker` (v8.3+, JavaScript) or `faker` (Python)
  - Setup: instantiate Faker with locale (en_US, de_DE, ja_JP, etc.)
  - Seed support: `new Faker({ locale: 'en_US', seed: 12345 })`
- **Built-in Generators** (validated):
  - `faker.person.firstName()`, `faker.person.lastName()`
  - `faker.internet.email()`, `faker.internet.username()`
  - `faker.phone.number()`, `faker.location.streetAddress()`, `faker.location.zipCode()`
  - `faker.finance.creditCardNumber()` (masked format, never store unmasked)
- **Custom Generators** (new code):
  - Medical: `generatePatientID(format: 'MRN|EMPI')` → valid format (e.g., MRN: PAT-2026-0001234)
  - E-commerce: `generateSKU(taxonomy: 'product_category')` → valid SKU (e.g., "BOOK-ENG-FICTION-001")
  - Finance: `generateAccountNumber(institution: 'bank')` → valid format with checksum (IBANs, routing numbers)
  - Enum: `generateEnumValue(enum_list: [...])`  → random pick from list
- **Validation:**
  - Each generator includes test suite (Jest)
  - Determinism test: seed="test123" → 10 generations all identical
  - Constraint compliance: min/max length, regex match
  - Realism check (manual): sample output looks reasonable to QA reviewer

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer  
**Dependencies:** M7-T001 (LangGraph ready)  
**US-ID:** US-051  
**TB/EP:** None (library integration, not endpoint)

---

#### M7-T003: Schema Inference + Column Type Detection
**Description:** Infer synthetic data types from test case parameter schema. Classify columns (name, email, phone, etc.) automatically to route to correct generator.

**Details:**
- **Input:** test_cases.param_schema (JSONB)
  ```json
  {
    "columns": [
      {"name": "user_email", "type": "string", "constraints": {"minLength": 5, "pattern": "^[^@]+@[^@]+\\.[^@]+$"}},
      {"name": "phone_number", "type": "string", "constraints": {"pattern": "^\\+?1?\\d{10,15}$"}},
      {"name": "age", "type": "integer", "constraints": {"minimum": 18, "maximum": 120}},
      {"name": "is_active", "type": "boolean"},
      {"name": "created_at", "type": "datetime", "constraints": {"before": "2026-09-22"}}
    ]
  }
  ```
- **Classification Logic:**
  1. **Regex-based:** Check column name + pattern
     - If name matches /email|mail/ → email generator
     - If name matches /phone|tel/ → phone generator
     - If pattern matches email regex → email generator
  2. **Type-based:** Use Zod type as fallback
     - integer + constraints (18–120) → age
     - boolean → boolean (50% true/false)
     - datetime → faker.date.past() or future()
  3. **LLM Classification** (optional, gated flag `ai.data_type_inference`):
     - Send column spec to Claude/Gemini: "What type of data for this column?"
     - Use response to override regex/type-based guess
     - Confidence threshold: >0.8 uses LLM guess, <0.8 falls back to rule-based
- **Output:** Routing table (column_name → generator_name, confidence)

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend Engineer  
**Dependencies:** M7-T002 (generators ready)  
**US-ID:** US-051  
**TB/EP:** None

---

#### M7-T004: Provenance Tracking Schema + Audit Integration
**Description:** Design and implement provenance schema (TB-019). Wire audit logging to TB-012.

**Details:**
- **TB-019 `data_generation_history` Schema:**
  ```sql
  CREATE TABLE data_generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    test_case_id UUID NOT NULL REFERENCES test_cases(id),
    dataset_id UUID UNIQUE NOT NULL,  -- links to actual generated data
    version INT NOT NULL,  -- incremental per test case (v1, v2, v3, ...)
    seed VARCHAR(255),  -- PRNG seed for determinism
    schema_version VARCHAR(50),  -- test_cases.param_schema version
    generator_version VARCHAR(50),  -- A6 + Faker version
    row_count INT NOT NULL,
    pii_scrub_applied BOOLEAN DEFAULT false,
    compliance_flags JSONB DEFAULT '[]',  -- ["HIPAA", "GDPR", "GxP"]
    approval_state VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    changes_from_prev_version TEXT,  -- diff description
    INDEX idx_data_history_test_case ON (test_case_id, version)
  );
  ```
- **Audit Logging (TB-012):**
  - On generation → log to `audit_events` with action='data_generation'
  - Metadata includes: seed, schema_version, generator_version, row_count, approval_state, compliance_flags
  - Never store plaintext PII in audit log (if PII detected, log "{pii_detected}" instead of value)
  - Encryption: audit_events.metadata encrypted at rest (AES-256-GCM)
- **Data Storage (TB-020):** New table for actual generated data (JSONB, volatile)
  ```sql
  CREATE TABLE generated_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_generation_history_id UUID NOT NULL REFERENCES data_generation_history(id),
    rows JSONB NOT NULL,  -- array of row objects
    row_count INT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',  -- auto-delete old data
    INDEX idx_generated_datasets_history ON data_generation_history_id
  );
  ```

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer  
**Dependencies:** TB-012 live; Postgres encryption function available  
**US-ID:** US-051  
**TB/EP:** TB-019, TB-020, TB-012 (audit)

---

### WEEK 2: INLINE UI + BATCH GENERATION + EXPORT (2026-09-29 → 2026-10-05)

#### M7-T005: Inline Data Generation UI (Right-Rail Panel)
**Description:** Build React component for test case editor right-rail. Trigger A6 generation, show preview, approve/regenerate.

**Details:**
- **Panel Layout (Notion-style):**
  - Title: "Synthetic Data Generator"
  - Tabs: "Generate | History | Export"
  - **Generate Tab:**
    - Dropdown: select data type or "Auto-detect from schema"
    - Input: row count (default 100, max 10k for inline, higher via batch)
    - Checkbox: "Deterministic (use seed)" + seed input field (optional)
    - Button: "Generate" (shows spinner + latency estimate)
    - On success: preview grid (5 sample rows, columns: value, confidence, type)
    - Actions: "Approve & Bind", "Regenerate", "Clear"
  - **History Tab:**
    - List of prior generations (version, seed, row_count, created_by, created_at)
    - Diff icon (show changes from prev version)
    - Rollback button (re-apply prior version to test case)
  - **Export Tab:**
    - Radio buttons: CSV, JSON, SQL INSERT
    - Button: "Download"
    - Button: "Copy to Clipboard"
- **Approval Flow:**
  - User clicks "Approve & Bind"
  - System binds generated dataset to test case params (creates TipTap param variable)
  - Example: User approves 100 rows of `{user_email}` → test case gets `{user_email: dataset_v1}`
  - Audit log entry created
- **Error States:**
  - If generation >2s: show "Generating..." with cancel button
  - If generation fails: show error message + "Retry" button
  - If schema missing: show "Please define schema in test case first"
- **Accessibility:**
  - WCAG 2.2 AA: aria-labels on all buttons, focus ring visible, keyboard nav (Tab/Enter/Esc)

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M7-T001 (A6 agent), M7-T004 (provenance schema)  
**US-ID:** US-051  
**TB/EP:** EP-070 (GET /api/data/:id/preview)

---

#### M7-T006: Batch Generation API + Hatchet Job
**Description:** Implement `POST /api/data/generate-batch` for large-scale generation across multiple test cases. Orchestrate via Hatchet.

**Details:**
- **API Endpoint: `POST /api/data/generate-batch`**
  - Request body:
    ```json
    {
      "projectId": "proj_123",
      "testCaseIds": ["case_1", "case_2", "case_3"],
      "rowCounts": [100, 500, 1000],
      "deterministic": true,
      "seed": "batch_seed_001"
    }
    ```
  - Response (202 Accepted):
    ```json
    {
      "jobId": "hatchet_job_xyz",
      "status": "queued",
      "estimatedDuration": 120
    }
    ```
- **Hatchet Workflow: `data-generation-batch`**
  - Step 1: Allocate worker from pool (max 2 concurrent batches per project, prevent resource contention)
  - Step 2: For each test case, enqueue generation step (parallel up to 5 per batch)
  - Step 3: Await all generations complete
  - Step 4: Aggregate results (summary: total rows generated, failures, avg latency)
  - Step 5: Send notification (Slack to #qa-nexus, email to requester)
- **Retry Logic:**
  - Exponential backoff: 1s, 2s, 4s (max 3 retries)
  - Timeout per test case: 10 min
- **Monitoring:**
  - Log to SigNoz: batch job ID, total duration, per-test-case latency, error rate
  - Alert if any test case fails

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer  
**Dependencies:** Hatchet setup (M0+), M7-T001  
**US-ID:** US-051  
**TB/EP:** EP-071 (new batch endpoint)

---

#### M7-T007: Export Endpoints (CSV, JSON, SQL)
**Description:** Implement export APIs to download generated data in multiple formats.

**Details:**
- **Endpoint: `GET /api/data/:id/export?format=csv|json|sql`**
  - Parameter: `format` (required) → csv, json, sql-insert
  - Response header: `Content-Disposition: attachment; filename="dataset-{id}.{ext}"`
  - **CSV Export:**
    - Header row: column names
    - Data rows: values
    - Delimiter: comma
    - Escaping: quoted fields with embedded commas
  - **JSON Export:**
    - Array of row objects
    - Pretty-printed (2-space indent)
  - **SQL INSERT Export:**
    - `INSERT INTO {table_name} (col1, col2, ...) VALUES (...), (...);`
    - Requires table_name param (optional, defaults to test case name)
    - Handle string escaping (single quotes)
- **RBAC:** User must have project access + Lead/Admin role (or creator of dataset)
- **Error Handling:**
  - If dataset not found: 404 Not Found
  - If format invalid: 400 Bad Request

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer  
**Dependencies:** M7-T004 (provenance schema with rows stored)  
**US-ID:** US-051  
**TB/EP:** EP-072 (new export endpoint)

---

#### M7-T008: Version History + Rollback UI
**Description:** Implement version history display in right-rail panel. Diff view + rollback button.

**Details:**
- **Backend: Version History Retrieval**
  - Query TB-019 for test case: all versions ordered by created_at DESC
  - Return: [{ version, seed, row_count, created_by, created_at, changes_from_prev_version }, ...]
  - Diff computation: compare rows between consecutive versions (added/deleted/modified)
- **Frontend: History Tab**
  - List view: each version as expandable row
  - Metadata: "v3 by Alice, Sep 25, 2026 14:30 (1000 rows)"
  - Icon: "Show diff" (expands to show per-row changes)
  - Button: "Rollback to this version" (disabled if current version)
- **Rollback Action:**
  - User clicks "Rollback to v2"
  - System re-applies v2 dataset to test case params
  - Creates new entry in TB-019: "Rollback from v4 to v2 by Bob"
  - Audit log: action='data_rollback', metadata={from_version: 4, to_version: 2}
- **Diff Visualization:**
  - Show first 5 differing rows (sample, not all)
  - Format: "Row 1: email changed from user1@old.com to user2@new.com"
  - Summary line: "3 rows added, 1 modified, 0 deleted"

**Priority:** P1  
**Estimate:** 14 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M7-T005 (UI panel)  
**US-ID:** US-051  
**TB/EP:** EP-073 (new version history endpoint)

---

### WEEK 3: COMPLIANCE + TESTING + OBSERVABILITY (2026-10-06 → 2026-10-10)

#### M7-T009: PII Scrubbing + HIPAA/GxP Feature Flags
**Description:** Implement PII detection + scrubbing. Gate HIPAA/GxP compliance modes behind feature flags.

**Details:**
- **PII Detection:**
  - Regex patterns: email, SSN (###-##-####), credit card (#### #### #### ####), phone (###) ###-####
  - LLM classification (optional): "Is this column likely PII?" (confidence >0.8)
  - Categorize: email, phone, ssn, credit_card, passport_id, license_id
- **Scrubbing (when enabled):**
  - Don't store plaintext PII in audit logs
  - Instead, log "{email_detected}", "{ssn_detected}"
  - Encrypt data at rest (TB-020 rows encrypted with AES-256-GCM)
  - Never export PII in CSV/JSON unless user explicitly confirms "Export PII"
- **HIPAA Mode (feature flag `compliance.hipaa_mode`):**
  - Default: false
  - When true:
    - Patient IDs generated in valid formats (MRN, EMPI)
    - Never link patient data across generations (each batch gets fresh patient IDs)
    - Restrict certain columns (no insurance numbers, no real-world-like MRNs)
    - Audit trail immutable (cannot delete, only append)
  - Enable via Unleash during M7 (dark launch, enable for Iksula pilot with HIPAA data)
- **GxP Mode (feature flag `compliance.gxp_mode`):**
  - Default: false
  - When true:
    - Batch generation treated as single operation (all-or-nothing)
    - Approval chain: requester → reviewer → approved_by field in TB-019
    - Export includes metadata + signature (JSON Web Signature, JWS)
    - Immutable: cannot regenerate or rollback without new approval
  - Enable via Unleash (dark launch)

**Priority:** P1 (feature-flagged, not blocking MVP)  
**Estimate:** 18 hours  
**Owner:** Security Engineer + Backend  
**Dependencies:** Feature flag infrastructure (Unleash, M0+)  
**US-ID:** US-051  
**TB/EP:** None (feature flag, not endpoint)

---

#### M7-T010: Integration Tests + Determinism Validation
**Description:** Write unit + integration tests for A6. Validate deterministic generation, schema compliance, audit logging.

**Details:**
- **Unit Tests (Jest, ≥80% coverage):**
  - Faker integration: seed="test123" → 10 iterations all identical
  - Custom generators: medical ID format validation, credit card checksum validation
  - Schema inference: column name + regex correctly classified
  - Confidence scoring: values within 0.0–1.0 range, aggregate confidence computed correctly
  - PII detection: regex patterns catch email/phone/ssn, LLM classification works (mock API)
- **Integration Tests (PostgreSQL test container):**
  - E2E: LangGraph node flow (validate → clarify → generate → approve → audit)
  - Provenance: audit_events logged for each generation, TB-019 version incremented
  - Batch generation: 3 test cases generated in parallel, all results persisted
  - Export: CSV output valid (headers correct, no header injection), JSON valid JSON, SQL valid INSERT
  - Rollback: prior version restored, new audit entry created
- **Determinism Test (Critical):**
  - Create 5 datasets with seed="test123"
  - Compare outputs: all must be bit-for-bit identical
  - Test passes: determinism ≥100%
  - Test fails: root cause analysis (PRNG seed not respected, timestamp in values, random UUID, etc.)
- **Load Test:**
  - Generate 10 datasets concurrently (batch API)
  - Measure: total duration, per-dataset latency, error rate
  - Target: all complete <5 min, p95 latency <2s per dataset
- **Tools:** Jest, test-containers, PostgreSQL, k6 (load test)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** QA Engineer + Backend  
**Dependencies:** M7-T001–T009  
**US-ID:** US-051  
**TB/EP:** None (test infrastructure)

---

#### M7-T011: Observability + Monitoring
**Description:** Wire A6 to Langfuse + SigNoz. Monitor generation latency, confidence, errors.

**Details:**
- **Langfuse Integration:**
  - Log each A6 LangGraph invocation with span ID
  - Capture: input schema, output dataset (first 5 rows for inspection), latency, confidence, approval state, error (if any)
  - Cost tracking: estimate tokens used (Faker doesn't use LLM, but LLM classification node does if enabled)
  - Evals: create eval function to check generated data schema compliance (auto-score against constraints)
- **SigNoz Custom Metrics:**
  - Counter: `a6_generation_total` (labeled: data_type, project_id)
  - Histogram: `a6_generation_latency_ms` (p50, p95, p99)
  - Gauge: `a6_pending_generations` (current queue length)
  - Counter: `a6_errors_total` (labeled: error_type)
- **SigNoz Dashboard:**
  - Title: "A6 Test Data Generation"
  - Panels:
    1. "Generation Rate (per hour)" — bar chart
    2. "Latency Percentiles" — line chart (p50, p95, p99)
    3. "Error Rate" — line chart
    4. "Top Data Types" — pie chart
    5. "Confidence Distribution" — histogram
  - Alerts:
    - If p95 latency >2s for >10 min → Page on-call
    - If error rate >5% for >10 min → Slack notification
- **Audit Log Review:**
  - SigNoz also visualizes audit_events (TB-012) for A6: user, action, timestamp, approval state
  - Ensure encryption at rest verified (log cannot decrypt PII without key)

**Priority:** P1  
**Estimate:** 12 hours  
**Owner:** DevOps + Backend  
**Dependencies:** Langfuse (M2+), SigNoz (M0+)  
**US-ID:** US-051  
**TB/EP:** None (observability)

---

#### M7-T012: Pilot Testing + Feedback Incorporation
**Description:** Conduct pilot usability testing with 2 Iksula teams. Iterate on A6 UX based on feedback.

**Details:**
- **Pilot Cohort:**
  - Pilot A: 3 QA engineers (one team, ~2 test cases per engineer)
  - Pilot B: 5 QA engineers (another team, ~5 test cases per engineer)
  - Total: 8 QA engineers, 20 test cases, each authoring 1–2 cases with A6
- **Session Design:**
  - Week 1 (Sep 22–28): Kickoff, intro to A6 (30 min live demo), guided hands-on (1h, 1:1 support)
  - Week 2 (Sep 29–Oct 5): Pilots use A6 independently, weekly 15-min check-in
  - Week 3 (Oct 6–10): Feedback survey + debrief (30 min, structured Q&A)
- **Feedback Topics:**
  - Usability: "Was it easy to generate data? What was hard?"
  - Latency: "Did generation feel fast enough? (target <2s)" [NPS-style]
  - Quality: "Did generated data work in your tests? Any validation errors?"
  - Compliance: "Did you notice PII? Did audit trail make sense?" [HIPAA pilot only]
  - Integration: "How did A6 fit into your workflow?"
- **Success Metrics:**
  - ≥80% of pilots successfully author test case using A6
  - ≥70% would use A6 again in future test authoring
  - 0 critical bugs (data corruption, generation failure)
  - Average latency <2s (measure via SigNoz)
- **Iteration (if needed):**
  - If feedback reveals UX friction: improve UI (e.g., move export button, rename field)
  - If performance issue: optimize generator (e.g., batch Faker instantiation)
  - If quality issue: tune generator for specific data type (e.g., email format)
  - Bug fixes logged + resolved before M7 exit gate

**Priority:** P1  
**Estimate:** 14 hours  
**Owner:** PM + QA Lead  
**Dependencies:** M7-T001–T011 complete (working MVP)  
**US-ID:** GM-001 (adoption metric)  
**TB/EP:** None (user research)

---

## API Contracts (M7 Scope)

All endpoints authenticated via BetterAuth; RBAC enforced (user must have project access).

### Data Generation

#### `POST /api/data/generate`
**Purpose:** Inline (sync) synthetic data generation for <1k rows

**Request:**
```json
{
  "testCaseId": "case_123",
  "rowCount": 100,
  "deterministic": true,
  "seed": "abc123",
  "selectedTypes": {
    "user_email": "email",
    "first_name": "firstName",
    "age": "integer[18,120]"
  }
}
```

**Response (200 OK, if <2s):**
```json
{
  "datasetId": "dataset_456",
  "seed": "abc123",
  "rowCount": 100,
  "preview": [
    {"user_email": "john.doe@example.com", "first_name": "John", "age": 35, "confidence": 0.95},
    {"user_email": "jane.smith@example.com", "first_name": "Jane", "age": 28, "confidence": 0.92}
  ],
  "overallConfidence": 0.94,
  "latency_ms": 1250,
  "approval_state": "pending"
}
```

**Response (202 Accepted, if >2s):**
```json
{
  "jobId": "hatchet_job_xyz",
  "status": "queued",
  "estimatedDuration": 10
}
```

---

#### `GET /api/data/:id/status?jobId=hatchet_job_xyz`
**Purpose:** Poll generation job status (for async >2s)

**Response (200 while running):**
```json
{
  "jobId": "hatchet_job_xyz",
  "status": "running",
  "progress": 0.6
}
```

**Response (200 when done):**
```json
{
  "jobId": "hatchet_job_xyz",
  "status": "done",
  "datasetId": "dataset_456",
  "rowCount": 1000,
  "overallConfidence": 0.93,
  "preview": [...]
}
```

---

#### `POST /api/data/:id/approve`
**Purpose:** User approves generated dataset, binds to test case params

**Request:**
```json
{
  "datasetId": "dataset_456",
  "approval": true
}
```

**Response (200 OK):**
```json
{
  "datasetId": "dataset_456",
  "approval_state": "approved",
  "approved_at": "2026-09-25T14:30:00Z",
  "test_case_param_binding": "{user_email: dataset_456, first_name: dataset_456, age: dataset_456}"
}
```

---

#### `POST /api/data/generate-batch`
**Purpose:** Batch generation across multiple test cases (async via Hatchet)

**Request:**
```json
{
  "projectId": "proj_123",
  "testCaseIds": ["case_1", "case_2", "case_3"],
  "rowCounts": [100, 500, 100],
  "deterministic": true,
  "seed": "batch_seed_001"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "hatchet_batch_xyz",
  "status": "queued",
  "totalTestCases": 3,
  "estimatedDuration": 120
}
```

---

#### `GET /api/data/:id/export?format=csv|json|sql`
**Purpose:** Download generated dataset in specified format

**Response (200, file download):**
- Header: `Content-Type: text/csv` (or application/json, text/plain for SQL)
- Body: CSV/JSON/SQL data
- Example CSV:
  ```
  user_email,first_name,age
  john@example.com,John,35
  jane@example.com,Jane,28
  ```

---

#### `GET /api/data/:id/history?testCaseId=case_123`
**Purpose:** Fetch version history for test case dataset

**Response (200 OK):**
```json
{
  "testCaseId": "case_123",
  "versions": [
    {
      "version": 3,
      "seed": "seed_v3",
      "rowCount": 100,
      "createdBy": "alice",
      "createdAt": "2026-09-25T14:30:00Z",
      "changesFromPrev": "1 row added, 2 modified"
    },
    {
      "version": 2,
      "seed": "seed_v2",
      "rowCount": 100,
      "createdBy": "bob",
      "createdAt": "2026-09-24T10:15:00Z",
      "changesFromPrev": "all rows"
    }
  ]
}
```

---

#### `POST /api/data/:id/rollback`
**Purpose:** Rollback test case data to prior version

**Request:**
```json
{
  "testCaseId": "case_123",
  "targetVersion": 2
}
```

**Response (200 OK):**
```json
{
  "testCaseId": "case_123",
  "currentVersion": 4,
  "rolledBackToVersion": 2,
  "rollbackApprovedAt": "2026-09-25T14:45:00Z"
}
```

---

## Database Changes (M7 Scope)

### New Tables

#### `TB-019: data_generation_history`
```sql
CREATE TABLE data_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  dataset_id UUID UNIQUE NOT NULL,
  version INT NOT NULL DEFAULT 1,
  seed VARCHAR(255),
  schema_version VARCHAR(50),
  generator_version VARCHAR(50) DEFAULT '1.0.0',
  row_count INT NOT NULL,
  pii_scrub_applied BOOLEAN DEFAULT false,
  compliance_flags JSONB DEFAULT '[]'::jsonb,
  approval_state VARCHAR(50) DEFAULT 'pending' CHECK (approval_state IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  changes_from_prev_version TEXT,
  UNIQUE(test_case_id, version),
  INDEX idx_data_history_test_case ON (test_case_id, version DESC),
  INDEX idx_data_history_project ON (project_id)
);
```

#### `TB-020: generated_datasets`
```sql
CREATE TABLE generated_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_generation_history_id UUID NOT NULL REFERENCES data_generation_history(id) ON DELETE CASCADE,
  rows JSONB NOT NULL,
  row_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  INDEX idx_generated_datasets_history ON (data_generation_history_id)
);

-- Encryption at rest (via pgcrypto extension):
-- ALTER TABLE generated_datasets ADD COLUMN rows_encrypted BYTEA;
-- UPDATE generated_datasets SET rows_encrypted = pgp_sym_encrypt(rows::TEXT, '{encryption_key_from_doppler}');
```

### Migrations

- **File:** `2026-09-22_001_create_data_generation_tables.sql`
  - Creates TB-019, TB-020
  - Grants permissions to `api_user` role
  - Encryption function setup (pgp_sym_encrypt)

---

## AI Agent Spec (A6)

### LangGraph Node Flow

```
Input (schema, user intent)
  ↓
[Validate Schema] → FAIL → Return error
  ↓ OK
[Clarification Questions Gate] → SKIP if unambiguous
  ↓ Approved
[Infer Data Types] → route to generators
  ↓
[Generator Selection] → map columns to Faker + custom generators
  ↓
[Data Generation] → instantiate Faker with seed, generate rows, compute confidence
  ↓
[Approval Gate (HITL)] → user shows sample, must approve
  ↓ Approved
[Persist to DB] → save to TB-019, TB-020
  ↓
[Audit Log Entry] → write to TB-012, encrypt PII
  ↓
Output (datasetId, seed, rowCount, confidence, export links)
```

### Prompt Strategy

- **System Prompt:** "You are A6, a synthetic data generation agent. Your role is to generate realistic, valid test data matching the provided schema. Always prioritize determinism (same seed = same data). For ambiguous columns, ask clarification questions. Never generate real PII unless explicitly authorized."
- **Column Clarifications:** "The schema has column 'address'. Should I generate US addresses, EU addresses, or both?"
- **Confidence Scoring:** "Rate each generated value from 0.0 (unlikely) to 1.0 (certain) based on realism and constraint compliance."

### Confidence Model

- **Per-Value Confidence:**
  - Faker-generated: default 0.90 (Faker is well-tuned)
  - Custom generator: 0.85–0.95 (depends on complexity)
  - LLM classification-guided: 0.80–0.92 (LLM uncertainty)
  - Constraint-violating: penalty -0.10 (e.g., email without @ → 0.0)
- **Aggregate Confidence (per batch):** Mean of all values
- **UI Display:** Show "Confidence: 94%" + breakdown ("95% emails, 92% names, 88% ages")
- **Threshold for Auto-Approval:** If overall confidence ≥0.90 and no constraints violated, optionally skip HITL gate (feature flag `ai.auto_approve_high_confidence_data`, default false)

### HITL Gates

1. **Clarification Questions:** If schema ambiguous (e.g., "email or phone?"), ask user before generating
2. **Approval Prompt:** Always show sample (5 rows) before persisting; user must click "Approve"
3. **Compliance Confirmation (if HIPAA/GxP mode):** "Confirm this data will be used for testing only, not production"

### Cost & Latency Budget

- **Latency SLO:** <2s p95 for ≤10k rows
  - Breakdown: Faker instantiation ~50ms, row generation ~0.15ms/row (150µs), audit logging ~50ms → total ~200ms for 10k rows
  - Confidence scoring: +50ms (LLM call, if enabled; otherwise fast)
  - Threshold: if estimated >2s, offload to Hatchet (async)
- **Cost:** No token cost (Faker is local). LLM classification optional (if enabled, ~$0.001 per schema inference)
- **Guardrails:**
  - Max row count per request: 10k (inline), 1M (batch, async)
  - Max concurrent batch jobs: 5 per project
  - Seed length: ≤255 chars (for determinism reproducibility)
  - Timeout: 10 min per batch job

### Eval Harness

- **Evals (Langfuse):**
  - **Schema Compliance:** Generated row matches type + constraint (binary: pass/fail)
  - **Realism:** Faker output looks plausible to human reviewer (3-point Likert)
  - **Determinism:** Same seed produces identical batch (binary)
  - **Latency:** Actual <2s p95 vs SLO (threshold)
- **Run weekly:** Sample 100 generations, auto-score compliance + realism via script + manual audit (10 samples)
- **Alert:** If schema compliance <95%, page AI engineer to investigate

---

## Test Strategy

### Unit Tests (≥80% Coverage)

- Faker integration: seed determinism, locale support, custom generators
- Schema inference: column classification (email, phone, etc.)
- Confidence scoring: value range, aggregate computation
- PII detection: regex patterns, LLM classification (mocked)
- Audit logging: format, encryption, TB-012 write

**Tools:** Jest, ts-jest, faker library test suite

---

### Integration Tests (≥70% Critical Paths)

- LangGraph flow: input → generate → approve → audit (end-to-end)
- Batch generation: 3 test cases, parallel execution, error handling
- Provenance: TB-019 version incremented, TB-020 rows stored, TB-012 audit logged
- Export: CSV valid, JSON valid, SQL valid syntax
- Rollback: prior version restored, new audit entry created
- Determinism: seed="test123" × 10 iterations → all identical

**Tools:** Jest, test-containers (PostgreSQL), Hatchet mock jobs

---

### E2E Tests (Playwright via M5 Runner)

- **Journey 1: Inline Generation**
  - Navigate to test case editor
  - Open "Synthetic Data Generator" panel
  - Select "Auto-detect" + row count 100
  - Click "Generate"
  - Approve sample preview
  - Assertion: dataset bound to test case params
  - Assertion: audit entry logged
- **Journey 2: Batch Generation**
  - Create automation suite with 3 test cases
  - Click "Generate Data for All Cases" (batch button)
  - Monitor job status
  - Assertion: all 3 complete within 5 min
- **Journey 3: Export + Rollback**
  - Export generated dataset as CSV
  - Verify file downloads correctly
  - Rollback to prior version
  - Assertion: new version created, audit logged

**Tools:** Playwright (via M5 runner)

---

### Performance Tests (k6)

**Load Scenario:** 10 concurrent users, each generating 5 datasets (50 total, rowCount=100 each)

**SLOs:**
- p95 generation latency <2s per dataset
- Batch job completion <5 min for 3 test cases
- Error rate <2%

---

### Security Scans (GitHub Actions)

- **Snyk:** Detect Faker library vulnerabilities
- **OWASP ZAP:** API endpoint injection tests (malicious schema input)
- **Trivy:** Container image scan (if Hatchet worker has custom image)

---

## Risks + Mitigations

| R-ID | Description | Likelihood | Impact | Owner | Mitigation | Status |
|------|---|---|---|---|---|---|
| **M7-R001** | Faker library determinism breaks with version upgrade | Low | High | Backend | Pin Faker version, test determinism before each upgrade, semantic versioning | Preventive |
| **M7-R002** | PII accidentally leaks to audit logs or export | Medium | Critical | Security | PII detection regex + LLM classification, encrypt at rest, audit trail audit (weekly review) | Monitoring |
| **M7-R003** | Custom generator format errors (medical ID, SKU) | Medium | Medium | Backend | Unit tests per custom generator, manual QA testing | Pre-launch test |
| **M7-R004** | Batch generation starves other Hatchet jobs (M5 automation) | Low | High | DevOps | Max 2 concurrent batch jobs per project, prioritize automation over data gen | Configuration |
| **M7-R005** | A6 schema inference classifies column incorrectly, generates invalid data | Medium | Medium | AI | LLM classification confidence threshold >0.8, fallback to rule-based if low confidence, pilot testing | Mitigation |
| **M7-R006** | Deterministic generation latency >2s due to row count or Faker overhead | Low | Medium | Backend | Load test early (W2), profile Faker instantiation, batch instantiation if needed | Load test W2 |
| **M7-R007** | HIPAA/GxP modes not tested before v1.5 GA (deferred to PM3) | Low | Medium | Security | Feature-flag gates compliance modes, dark launch for HIPAA pilot only (if available) | Gating strategy |

---

## Rollback Plan

**Trigger Conditions:**
- A6 generates data that fails >20% of test validations (schema mismatch)
- Determinism breaks (same seed produces different data)
- PII leaks to unencrypted logs
- Batch generation causes Hatchet queue to deadlock (>1000 stuck jobs)

**Rollback Steps (RTO: <15 min):**

1. **Immediate:** Disable A6 feature flag (`ai.data_generation: false`); notify pilots in Slack
2. **Investigation:** Check Langfuse for generation errors, SigNoz for latency/resource issues
3. **Fix or Revert:** If code bug, revert commit + re-deploy; if Faker issue, pin to prior version
4. **Verification:** Test generation on dev, verify schema compliance ≥95%
5. **Re-Enable:** Enable flag, monitor for 1 hour

**Data Restoration:** Generated datasets in TB-020 marked as "invalid"; users advised to re-generate post-fix

---

## Observability

### OTel Spans & Custom Metrics

- **Span:** `a6_generate` (parent)
  - Attributes: testCaseId, rowCount, seed, dataType, approval_state
  - Timing: generation latency (ms)
  - Children spans: schema_validate, generate_rows, compute_confidence, persist, audit_log
- **Metrics:**
  - Counter: `a6_generations_total` (labels: data_type, project_id, approval_state)
  - Histogram: `a6_generation_latency_ms` (p50, p95, p99)
  - Gauge: `a6_pending_approvals` (awaiting HITL approval)
  - Counter: `a6_errors_total` (labels: error_type)

### Dashboards & Alerts

- **SigNoz Dashboard: "A6 Test Data Generation"**
  - Generation rate (per hour)
  - Latency percentiles (p50, p95, p99) — alert if p95 >2s
  - Error rate — alert if >5%
  - Top data types (pie chart)
  - Confidence distribution (histogram)

- **Langfuse Dashboard: "A6 Agent Evals"**
  - Schema compliance rate (target ≥95%)
  - Realism score (manual audits, 1–3 Likert)
  - Determinism check (same seed match rate)

---

## Handoff

**Delivered M7:**
- A6 LangGraph agent (node flow: validate → clarify → generate → approve → audit)
- Faker integration + 6 data types (name, email, phone, address, credit card, medical ID)
- Inline generation UI (right-rail panel in test case editor)
- Batch generation API + Hatchet orchestration
- Provenance tracking (TB-019, TB-020) + immutable audit trail (TB-012)
- Version history + rollback UI
- Export (CSV, JSON, SQL INSERT)
- PII scrubbing + HIPAA/GxP feature flags (dark launch, no pilot production use in M7)
- Determinism validation (seed reproducibility ≥100%)
- Pilot testing + feedback incorporated

**Known Deferred (v1.5+):**
- DuckDB/Polars for >100k row generation (scale path, currently Faker in-memory)
- Real PII de-identification (Tink API, requires privacy license) — PM3
- Production data masking for analytics — PM4
- Genetic/ML-based synthesis (probabilistic data gen) — PM4

**Technical Debt Logged:**
- Faker version pinning required (semantic versioning + pre-release testing) — track in Jira
- Custom generator test coverage can be extended (currently 85%, stretch to 95%)
- LLM classification latency occasionally hits 1s+ (investigate caching, pre-compute schemas)

---

## Definition of Done

**All criteria must be "Go" for M7 exit gate.**

1. **Code Quality:**
   - All tasks merged to `main`
   - 2-reviewer code review + approval
   - CI/CD green (lint, type check, unit tests ≥80%, security scan)
   - Zero ESLint errors

2. **Testing:**
   - AC001–AC014 verified
   - Integration tests green (LangGraph, batch, export, rollback)
   - E2E Playwright journeys pass (inline, batch, export)
   - Determinism test: same seed × 10 iterations → 100% match
   - Load test: 10 concurrent users, p95 <2s, error <2%

3. **Performance:**
   - p95 generation latency <2s (measured via SigNoz)
   - Batch job completion <5 min for 3 test cases
   - No resource contention (Hatchet, PostgreSQL)

4. **Observability:**
   - Langfuse traces captured for all A6 invocations
   - SigNoz dashboard "A6" live + alerts configured
   - Schema compliance evals running + baseline established (≥95%)

5. **Compliance:**
   - PII scrubbing logic tested (plaintext not in audit logs)
   - HIPAA/GxP feature flags wired + tested in dark mode
   - Encryption at rest verified (TB-020 encrypted, key in Doppler)

6. **Documentation:**
   - A6 runbook (how to use, troubleshoot) published in KB
   - API docs (OpenAPI) updated
   - Release notes drafted

7. **Pilot Testing:**
   - 2 pilots (8 QA engineers) tested A6 independently
   - ≥80% successfully generated data
   - 0 critical bugs (data corruption, generation failure)
   - Feedback incorporated

8. **Go/No-Go Gate:**
   - Review meeting scheduled
   - All criteria evaluated + signed (PM + Tech Lead)

---

## Appendix

### Glossary

- **Synthetic Data:** Artificially generated, non-real data matching specified schema (used for testing, avoids PII exposure)
- **Provenance:** Record of data's origin, creator, version, and modifications (audit trail)
- **Deterministic Generation:** Same seed input → same output every time (reproducibility)
- **Faker:** JavaScript/Python library providing realistic, fake data generators (names, emails, etc.)
- **HITL:** Human-in-the-loop (user approval required before data persisted)
- **Confidence Scoring:** LLM-assigned probability (0–1) that generated value is valid + realistic
- **PII:** Personally Identifiable Information (name, email, SSN, credit card, etc.)

### Reference Links

- [Faker.js Docs](https://github.com/faker-js/faker)
- [HIPAA Testing Best Practices](https://www.hipaa.com/test-environment/)
- [GxP Data Integrity](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/electronic-records-electronic-signatures)
- [TB-012 Audit Events Schema](./../../ERD.md)
- [PROJECT_ROADMAP.md v1.2](./../../PROJECT_ROADMAP.md) — M7 dates, predecessors, successors
- [Milestone M5](./../../Milestone/M5/Milestone_M5_Automation_Basic_Reports_MVP_Launch.md) — entry gate dependencies
- [Milestone M8](./../../Milestone/M8/Milestone_M8_Self_Healing.md) — downstream dependency on deterministic data

---

**END OF MILESTONE M7 DOCUMENT**
