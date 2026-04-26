---
milestone_id: M16
parent_project_milestone: PM3
name: "Vibe Code Governor (Basic) + Agent Governance"
version: 2.0
date: 2026-04-23
phase: v2
window: "W9–10 of PM3"
start_date: 2027-03-09
end_date: 2027-03-20
duration_weeks: 2
calendar_period: "[PM3] M16 (2027-03-09 → 2027-03-20)"
primary_component: Vibe Code Governor (VCG)
secondary_components: "Governance policy engine, audit trail, compliance framework, admin UI"
status: "Build-Ready"
---

# Milestone M16 — Vibe Code Governor (Basic) + Agent Governance

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M16 (Weeks 9–10 of 12-week PM3)  
**Version:** 2.0 (Expanded from Stub)  
**Date Created:** 2026-04-22 | **Expanded:** 2026-04-23  
**Status Badge:** Build-Ready → VCG Production Gate

---

## EXECUTIVE SUMMARY

[PM3] M16 delivers **Vibe Code Governor (VCG), the governance foundation for AI-written code**. Every A1 test case, A2 dedup, A3 low-code export, A4 RCA, A5 test selection, and A8 plan becomes subject to configurable governance policies. VCG enforces 3 layers: **(1) input validation** (deny PII in prompts, hallucination risk), **(2) output audit** (immutable merkle-chained logs), and **(3) merge gating** (block PRs with >5 violations). This foundation satisfies **EU AI Act Article 13 transparency** and **SOC2 Type I CC6.1/CC7.1 logical access + monitoring**.

**Mission:** Establish governance-by-design so enterprises trust AI-assisted QA with proof of control + audit trail + compliance evidence.

**Key Deliverables:**
- Policy engine: conditional rules, semantic pattern matching, regex, allow/deny-list management
- Input/output validation pipeline: every agent call passes pre-commit VCG check
- Audit trail (immutable, merkle-chained): append-only, signed, exportable for legal holds
- Admin UI: policy editor, allow/deny list manager, audit viewer with filter/search/export
- GitHub/GitLab PR checks: merge gates, violation summaries, action recommendations
- EU AI Act + SOC2 + ISO27001 mapping: layer 6 foundation documented

**Success Criteria:**
- ≥95% of A1/A2/A3/A4/A5 calls logged with evidence chain
- Policy engine p95 <50ms; audit log write p95 <10ms
- Audit retrieval (1M entry query) <2s
- <1% false positives (legitimate AI calls flagged)
- VCG blocking ≥1 violation per 10 PRs (signal/noise ratio >0.1)

---

## CONTEXT: WHAT WAS DELIVERED BEFORE

**PM1 (MVP) completed:** Test case management (A1 gen + A2 dedup, RTM), test execution + evidence capture (screenshot/HAR/console), defect logging (A4 5-layer RCA), Jira 2-way sync, basic reports + ROI.

**PM2 (v1.5) completed:** A6 test data generation, A7 self-healing suggestions (approve-in-context only), A8-advanced risk-adaptive planning, APT autonomous E2E tester, visual regression, on-prem Helm deployment, mobile app (Capacitor).

**Deployment State (PM3 entry):**
- Vercel (frontend) + Oracle VM (backend NestJS, FastAPI, Ollama Gemma 4, PostgreSQL, Redis, Neo4j, Qdrant)
- LangGraph agent orchestration: A1, A2, A4, A6, A7, A8-adv, APT live in dev
- A3 (low-code) + A5 (test selection) + A8-full shipping M13–M15
- 50+ doc templates enabled; pgvector + GraphRAG knowledge layer operational
- Jira/GitHub/Slack/Confluence/Figma integrations live
- Unleash feature flags active for canary rollout

**Database State:**
- `test_cases`, `test_results`, `evidence_files`, `defects`, `reports` (PM1–PM2)
- `automation_suites` (M5 schema)
- `documents`, `document_versions`, `document_feedback` (knowledge base)
- Ready for: `governance_policies`, `audit_log`, `policy_violations`, `evidence_signatures` (M16 new)

---

## REQUIREMENTS: DOMAIN DEPTH

### Policy Engine (Input + Output Validation)

**Layer 1: Input Validation (Pre-Prompt)**
- **PII Detection:** Scan prompt for SSN, email, API key, credit card; deny if detected; log attempt
- **Hallucination Risk:** Check prompt for ambiguity markers ("generate an example…", "make up…"); warn/deny per policy
- **Secret Leakage Prevention:** Regex match for AWS_KEY, GOOGLE_SECRET, DATABASE_URL; deny + alert ops
- **Compliance Mode Override:** If user role = "Compliance Officer" + org policy = "HIPAA", allow PII prompts but flag for manual review queue

**Layer 2: Output Audit (Post-Generation)**
- **Evidence Chain:** Every agent call → (input_hash, model_version, prompt_revision, output, reviewer_id, verdict, timestamp)
- **Confidence Scoring:** A1 ≥0.8 auto-approve; 0.6–0.8 requires Lead approval; <0.6 requires Admin review
- **Semantic Content Check:** If A3 export contains hardcoded credentials (regex "password:", "api_key"), flag as critical + block merge

**Layer 3: Org Customization**
- Customer can define: "Allow A1 confidence ≥0.7 for non-HIPAA projects"
- Customer can define: "Deny A4 RCA on production incidents — review-only"
- Customer can define: "A8 test plans >50 test cases require Lead approval"

### Audit Trail (Immutable, Merkle-Chained, EU AI Act Compliant)

**Immutable Log Design:**
- Append-only PostgreSQL table: `audit_log(id, agent_id, action, input_hash, output_hash, user_id, timestamp, merkle_parent, signature)`
- Merkle chain: each entry signs the previous entry's hash; ensures tamper-detection
- Encryption: at-rest (AES-256 on disk) + in-transit (TLS 1.3)
- Retention: 7 years (legal hold for GDPR)
- Export: CSV/JSON with signature chain for auditor verification

**Evidence Capture:**
- Input hash: SHA-256(prompt + context)
- Output hash: SHA-256(generated code)
- Model version: `gemma-4-2026-04`
- Confidence: 0.0–1.0 per output
- User action: `generated`, `approved`, `rejected`, `modified`
- Reviewer: if approval required, who signed off + when

**EU AI Act Mapping:**
- Article 13 (transparency): audit trail proves every AI call logged + documented
- Article 14 (human oversight): approval chain visible for high-risk outputs
- Article 15 (data governance): evidence chain shows data used to generate output
- Article 22 (decision documentation): every agent output traceable to decision + human reviewer

### Admin UI (Policy Editor + Audit Viewer)

**Policy Editor Page** (`/admin/governance/policies`)
- **Create Rule:** Conditional expression builder
  - "If agent = A1 AND confidence < 0.7, then require Lead approval"
  - "If prompt contains 'password' (regex), then deny"
  - "If org = Acme Corp AND project = HIPAA, then deny PII in output"
- **Visual builder:** Drag-and-drop conditions (agent, field, operator, value)
- **Pre-built templates:** "High-Risk Projects (Finance)", "Low-Risk Projects (Demo)"
- **Allow/Deny Lists:** Add emails/domains to auto-approve or auto-deny list
- **Rule versioning:** History of policy changes with diffs
- **Dry-run mode:** Test policy against last 100 PRs; show what would block

**Audit Viewer Page** (`/admin/governance/audit-log`)
- **Filter:** Agent (A1–A8), user, timestamp (date range), action (generated/approved/rejected)
- **Search:** Free-text on user name, agent name, project ID
- **Export:** CSV/JSON with signature chain, filtered result set
- **View detail:** Click entry → full evidence chain (input, output, confidence, approver notes)
- **Analytics:** Pie chart by agent, bar chart by action (generated vs approved vs rejected)
- **Alerts:** Show "high-risk" entries (requires approval, denied due to policy)

### GitHub/GitLab PR Check Integration

**PR Comment:** Inline summary of AI usage in the PR
```
🤖 Vibe Code Governor Report
- 3 A1 test cases (avg confidence 0.85)
- 1 A3 low-code export (confidence 0.78, review suggested)
- 2 A4 RCA sections (auto-approved)

⚠️ 1 violation: A3 output includes hardcoded secret (line 45, automation_suites.spec). Merge blocked.
→ Fix: Remove secret, re-run generator, or request Lead override.
```

**Merge Gate:** If violations >5 OR critical severity, block merge + require approval from Lead/Admin.

---

## SCOPE & ACCEPTANCE CRITERIA

### Exit Gate + Acceptance Criteria

| AC-ID | Feature | Acceptance Condition | Verifier |
|-------|---------|----------------------|----------|
| **M16-AC001** | Policy Engine Input Validation | Given PII in prompt ("SSN: 123-45-6789"), when VCG check runs, then prompt denied + logged | Backend |
| **M16-AC002** | Confidence Scoring | Given A1 output with confidence 0.75, when score <0.8, then requires Lead approval + audit log entry | AI/Backend |
| **M16-AC003** | Audit Trail Immutable | Given 1000 audit entries, when attacker modifies entry #500, then merkle chain breaks + integrity check fails | Security |
| **M16-AC004** | Merkle Chain Signing | Given audit entries 1–100, when entry 100 includes hash of entry 99, then signature verification passes | Security |
| **M16-AC005** | Policy Editor CRUD | Given admin creates rule "A1 confidence <0.7 require approval", when rule tested on 20 past PRs, then 5 would require approval | Frontend |
| **M16-AC006** | Allow/Deny List | Given user in "auto-approve" list, when they generate A1 test case with confidence 0.6, then auto-approved despite threshold | Backend |
| **M16-AC007** | Org Customization | Given customer Acme sets policy "HIPAA projects deny PII", when A4 RCA includes patient name, then denied + alert | Backend |
| **M16-AC008** | Audit Export (1M entries) | Given 1M entries in audit log, when export CSV triggered, then completes <2s + can be opened in Excel | Backend |
| **M16-AC009** | GitHub PR Check | Given PR with 3 A1 test cases + 1 policy violation, when PR created, then check posts comment + blocks merge | DevOps |
| **M16-AC010** | GitLab MR Check | Same as AC009 but for GitLab merge request | DevOps |
| **M16-AC011** | Policy Engine p95 <50ms | Given 100 VCG checks in parallel, when p95 latency measured, then <50ms | DevOps |
| **M16-AC012** | Audit Log Write p95 <10ms | Given Hatchet writing 50 audit entries/sec, when p95 write latency measured, then <10ms | DevOps |
| **M16-AC013** | EU AI Act Mapping Doc | Given governance framework, when compliance team reviews mapping, then all Article 13/14/15/22 requirements covered + evidence chain shown | Compliance |
| **M16-AC014** | SOC2 CC6.1 (Logical Access) | Given audit trail proves only approved users can approve high-risk agents, then CC6.1 control satisfied | Security |
| **M16-AC015** | <1% False Positive Rate | Given 10K historical A1/A2/A3/A4/A5 calls, when policy engine tested, then <100 false positives | QA |

### Definition of Ready (DoR)

1. A1, A2, A3, A4, A5, A8 agents all live in dev (M13–M15 complete)
2. LangGraph emission points identified (where to inject VCG check)
3. PostgreSQL audit_log schema drafted + migration tested
4. Merkle chain algorithm (SHA-256 parent link) validated
5. EU AI Act Article 13/14/15/22 requirements documented
6. SOC2 / ISO27001 control mappings drafted (CC6.1, CC7.1, A.5, A.8, A.12)
7. Performance baselines captured: typical policy check <5ms, audit write <2ms
8. GitHub/GitLab webhook URLs confirmed + API tokens in Doppler
9. Admin user list (who can edit policies, approve violations) agreed with leadership

---

## TASK BREAKDOWN (2 WEEKS)

### WEEK 1: POLICY ENGINE + AUDIT TRAIL (2027-03-09 → 2027-03-15)

**W1 Goal:** Core VCG logic + immutable audit trail operational; policies enforced at agent call time.

#### M16-T001: Database Schema (Governance + Audit)
**Description:** Create PostgreSQL tables for policies, policy violations, audit log, and merkle chain.

**Details:**
```sql
CREATE TABLE governance_policies (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  project_id UUID,  -- NULL = org-wide
  name TEXT NOT NULL,
  rule_json JSONB,  -- {"if": {"agent": "A1", "confidence": {"<": 0.7}}, "then": "require_approval"}
  status TEXT ('active', 'paused', 'archived'),
  created_at TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP,
  updated_by UUID
);

CREATE TABLE policy_violations (
  id UUID PRIMARY KEY,
  policy_id UUID NOT NULL,
  agent_call_id UUID NOT NULL,
  violation_type TEXT ('pii_detected', 'confidence_low', 'secret_leaked', 'hallucination_risk'),
  severity TEXT ('critical', 'major', 'minor'),
  evidence_json JSONB,  -- {"prompt_preview": "...", "risk_score": 0.8}
  action TEXT ('denied', 'warned', 'approved', 'require_review'),
  reviewer_id UUID,
  reviewed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,        -- 'A1', 'A2', 'A3', etc.
  action TEXT NOT NULL,          -- 'generated', 'approved', 'rejected'
  project_id UUID,
  user_id UUID,
  input_hash CHAR(64),           -- SHA-256
  output_hash CHAR(64),          -- SHA-256
  model_version TEXT,            -- 'gemma-4-2026-04'
  confidence DECIMAL(3,2),       -- 0.0–1.0
  policy_decision TEXT,          -- 'auto_approved', 'requires_review', 'denied'
  reviewer_id UUID,              -- if approved by human
  merkle_parent_id BIGINT,       -- previous entry's ID
  merkle_parent_hash CHAR(64),   -- hash of previous entry (for chain validation)
  signature TEXT,                -- RSA-2048 signature of this entry
  created_at TIMESTAMP,
  indexed_by_tsv tsvector
);

CREATE INDEX audit_log_agent_idx ON audit_log(agent_id);
CREATE INDEX audit_log_user_idx ON audit_log(user_id);
CREATE INDEX audit_log_project_idx ON audit_log(project_id);
CREATE INDEX audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_search_idx ON audit_log USING gin(indexed_by_tsv);
```

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Backend Engineer (DB)  
**Dependencies:** PostgreSQL 15, migration tool (Prisma/Knex)  
**US-ID:** US-012 (governance)  
**TB/EP:** TB-008 (new), EP-040 (new)

---

#### M16-T002: Policy Engine Core (Evaluation + Condition Matching)
**Description:** Implement policy evaluation logic: given a policy rule + agent call context, return decision (approved/denied/requires_review).

**Details:**
- **Policy Rule Format (JSON DSL):**
  ```json
  {
    "id": "policy_001",
    "name": "High-Confidence-Only A1",
    "conditions": [
      {"field": "agent", "operator": "equals", "value": "A1"},
      {"field": "confidence", "operator": "<", "value": 0.7}
    ],
    "action": "require_approval",
    "allow_override": "Lead"
  }
  ```
- **Engine Logic:**
  - Load policy rules for org + project
  - Evaluate each condition against agent call context (input, output, confidence, user, timestamp)
  - If all conditions match, apply action (deny, warn, require_approval, auto_approve)
  - Return decision + evidence JSON
- **Semantic Matching:**
  - PII detection: regex + ML classifier (e.g., transformers `bert-base-NER` for SSN/email patterns)
  - Hallucination risk: flag if prompt contains ["generate an example", "make up", "invent"]; configurable threshold
  - Secret leakage: regex [AWS_SECRET_ACCESS_KEY, GOOGLE_CLOUD_API_KEY, DATABASE_URL, password, api_key]
- **Performance:** Cache policy rules in Redis (TTL 1h); evaluate in <50ms p95
- **Fallback:** If policy engine offline, allow all calls + log incident (fail-open, not fail-closed)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** Backend Engineer (AI/Rules)  
**Dependencies:** Policy schema (M16-T001), Redis, policy DSL parser  
**US-ID:** US-012  
**TB/EP:** EP-041 (new)

---

#### M16-T003: Immutable Audit Trail (Merkle Chain + Signing)
**Description:** Implement append-only audit log with merkle-chain hashing + RSA-2048 signing.

**Details:**
- **Entry Structure:**
  - id (auto-increment BIGINT for ordering)
  - agent_id, action, user_id, project_id, timestamps (standard fields)
  - input_hash, output_hash (SHA-256 of prompt + generated output)
  - model_version, confidence, policy_decision
  - merkle_parent_id, merkle_parent_hash (links to previous entry)
  - signature (RSA-2048 of this entry + parent hash)
- **Write Flow:**
  1. Call `AuditService.log({agent_id, action, user_id, ...})`
  2. Fetch last entry from DB (get merkle_parent_id + merkle_parent_hash)
  3. Compute SHA-256 of current entry fields (deterministic JSON ordering)
  4. Sign (current_entry_hash + parent_hash) with private key
  5. Insert into audit_log
  6. Return audit_log.id
- **Verification Flow (e.g., compliance audit):**
  1. Load entries 1..N from audit_log
  2. For each entry i: recompute hash, verify signature(hash + parent_hash)
  3. If any signature fails, alert + halt
  4. Return integrity report (entries validated, chain unbroken)
- **Key Management:**
  - Public/private key pair stored in Doppler (private key rotation annually)
  - Export public key for customer verification (GDPR right to audit)
- **Performance:** <10ms p95 for single-entry write; batch writes for 50+ entries <100ms

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer (Security)  
**Dependencies:** RSA library (node-rsa or cryptography.io), Doppler secrets, PostgreSQL  
**US-ID:** US-012  
**TB/EP:** TB-008

---

#### M16-T004: LangGraph Pre-Commit Injection (Agent Integration)
**Description:** Add VCG check node to all agent LangGraph workflows (A1, A2, A3, A4, A5, A8).

**Details:**
- **Graph Modification:**
  - Each agent graph currently has: Input → Process → Output
  - Add node: Input → Process → Output → **VCG Check** → Approve/Deny/Warn → Emit Event
- **VCG Check Node:**
  ```python
  class VCGCheckNode:
    def __init__(self, policy_engine):
      self.engine = policy_engine
    
    def run(self, agent_id, context):
      decision = self.engine.evaluate(agent_id, context)
      if decision.action == "deny":
        return {"status": "blocked", "reason": decision.reason}
      elif decision.action == "require_approval":
        return {"status": "pending_review", "reviewer_hint": decision.reviewer}
      else:
        return {"status": "approved", "audit_id": decision.audit_id}
  ```
- **A1 (Test Case Generator):**
  - Pre-commit: check input prompt for PII
  - Post-commit: check generated test case for hardcoded secrets
- **A2 (Dedup):**
  - Post-commit: check if candidate test cases have <0.3 confidence (warn)
- **A3 (Low-Code Export):**
  - Post-commit: check exported code for hardcoded API keys (deny if found)
- **A4 (RCA):**
  - Post-commit: if RCA contains PII (patient name, email), check org policy (HIPAA → deny, otherwise warn)
- **A5 (Test Selection):**
  - Pre-commit: check if selection criteria are reasonable (not "select all" when >100 tests)
- **A8 (Full Planning):**
  - Post-commit: check if plan >500 test cases (warn for resource exhaustion)
- **Agent Emission:** Every check logged to audit_log immediately (write before decision returned)

**Priority:** P0  
**Estimate:** 18 hours  
**Owner:** AI Engineer + Backend  
**Dependencies:** LangGraph codebase, VCG Check Node, policy engine (M16-T002)  
**US-ID:** US-012  
**TB/EP:** None (internal integration)

---

#### M16-T005: Audit Export API (CSV/JSON + Merkle Chain Verification)
**Description:** Implement endpoints for compliance auditor to export + verify audit log integrity.

**Details:**
- **Endpoint 1: `GET /api/audit/export?format=csv&filter[agent]=A1&filter[start_date]=2027-03-01`**
  - Query audit_log with filters
  - Return CSV with columns: id, agent_id, action, user_id, timestamp, input_hash, output_hash, signature
  - Include merkle_parent_id column for auditor to verify chain offline
- **Endpoint 2: `POST /api/audit/verify`**
  - Accept: JSON array of audit entries (exported format)
  - Verify: each entry's signature matches (entry_hash + parent_hash)
  - Return: { valid: true/false, broken_at_entry_id: N, evidence: "..." }
- **Endpoint 3: `GET /api/audit/public-key`**
  - Return RSA public key (PEM format) for customer to verify signatures independently
- **Access Control:** Only Admin or Compliance Officer role can call export endpoints
- **Logging:** Every export logged separately (who exported, when, what filters applied)

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer (API)  
**Dependencies:** M16-T003 (merkle chain), Prisma/SQL query builder  
**US-ID:** US-012  
**TB/EP:** EP-042 (new)

---

### WEEK 2: ADMIN UI + PR CHECKS + LAUNCH (2027-03-16 → 2027-03-20)

**W2 Goal:** Admin UI live, GitHub/GitLab checks integrated, policies enforced in staging, ready for production.

#### M16-T006: Policy Editor UI (Create/Edit Rules + Allow/Deny Lists)
**Description:** Next.js page for admins to create, edit, test policies + manage allow/deny lists.

**Details:**
- **Policy Editor Page** (`/admin/governance/policies`)
  - **List View:** Table of all policies (org + project scope, status, # violations last 7d)
  - **Create/Edit Form:**
    - Rule name + description
    - Conditions builder: dropdown UI for agent, field, operator, value
    - Pre-built templates: "High-Confidence-Only A1", "Finance Project No-PII", "Demo No-Secret-Check"
    - Action selector: Auto-Approve, Require-Review, Deny, Warn-Only
    - Allow-override: Who can manually approve denied calls (Lead, Admin)
    - Save as draft or activate immediately
  - **Dry-Run Mode:**
    - "Run this policy against last 100 calls" button
    - Show: # calls would be approved/denied/require-review
    - Highlight specific calls + what rule matched
  - **Rule Versioning:**
    - View history of policy changes
    - Rollback to previous version (audit trail preserved)
  - **Allow/Deny Lists:**
    - Tab: "Auto-Approve Users" — add email/domain to skip reviews
    - Tab: "Auto-Deny Teams" — add org/project to always require escalation
    - Bulk import (CSV): email, action, expiry (optional)

**Priority:** P0  
**Estimate:** 22 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M16-T002 (policy engine), Next.js, form builder component  
**US-ID:** US-012  
**TB/EP:** EP-043 (new)

---

#### M16-T007: Audit Log Viewer UI (Filter + Search + Export)
**Description:** Next.js page for admins to search audit log, filter by agent/user/timestamp, export.

**Details:**
- **Page:** `/admin/governance/audit-log`
- **Filters:**
  - Agent dropdown: A1, A2, A3, A4, A5, A8, APT
  - User autocomplete: search by name/email
  - Timestamp: date range picker (from/to)
  - Action: radio (generated, approved, rejected, denied)
  - Policy Decision: filter by (auto_approved, requires_review, denied)
- **Search:** Free-text on agent name, user name, project ID, prompt preview (first 100 chars)
- **Table:**
  - Columns: Timestamp, Agent, User, Action, Policy Decision, Input Hash (truncated), Output Hash (truncated)
  - Clickable row → detail panel (full entry, merkle parent link, signature validation status)
- **Detail Panel:**
  - All fields: agent_id, user_id, project_id, model_version, confidence, reviewer_id, reviewed_at
  - Input/output hashes with copy-to-clipboard
  - Merkle parent: clickable link to parent entry
  - Signature status: ✓ Valid or ✗ Invalid (with error message)
- **Export:**
  - CSV button: download filtered results (include signature column)
  - JSON button: download with full merkle chain
  - Excel button: auto-format for review
- **Analytics Dashboard:**
  - Pie chart: distribution by agent (% A1 vs A2 vs A3 etc.)
  - Bar chart: actions by day (last 30d, stacked: approved/denied/requires_review)
  - KPI: total entries, avg confidence by agent, # denied/requiring review

**Priority:** P0  
**Estimate:** 20 hours  
**Owner:** Frontend Engineer  
**Dependencies:** M16-T001 (audit schema), M16-T005 (export API), recharts  
**US-ID:** US-012  
**TB/EP:** EP-044 (new)

---

#### M16-T008: GitHub PR Check Integration (Comment + Merge Gate)
**Description:** Implement GitHub app that comments on PRs with VCG summary + blocks merge if violations >5.

**Details:**
- **Setup:**
  - Register GitHub app: `vibe-code-governor-bot`
  - Webhook: `POST /webhooks/github/pull-request` → receive PR events
  - Permissions: read repo content, write PR comments, dismiss branch protection reviews
- **Flow:**
  1. PR opened → GitHub sends webhook
  2. Backend fetches PR files + diffs
  3. For each file: scan for patterns matching A1/A2/A3/A4/A5 markers
     - A1 marker: JSON comment `{"ai_generated": "A1", "confidence": 0.85}`
     - A3 marker: code comment `// Generated by A3 low-code exporter`
     - A4 marker: doc comment `<!-- A4 RCA, confidence 0.75 -->`
  4. Count violations by severity (critical, major, minor)
  5. Post PR comment with summary:
     ```
     🤖 **Vibe Code Governor Report**
     ✅ 3 A1 test cases (avg confidence 0.87)
     ✅ 1 A3 automation block (confidence 0.78)
     ✅ 2 A4 RCA sections (auto-approved)
     
     ⚠️ **1 Violation (Major):** A3 output line 45 contains hardcoded API key
     → Action: Remove secret + re-run A3 generator, OR request Lead override
     ```
  6. If violations >5 OR severity=critical: 
     - Add status check: "VCG Governance — Requires Review"
     - Dismiss any "approve" reviews from non-Lead/Admin
     - Block merge (GitHub branch protection rule)
- **Merge Approval:**
  - Only Lead/Admin can override: add comment `@vibe-code-governor approve override` → check passes
  - Logged in audit_log as manual override by (user_id, timestamp, reason)

**Priority:** P0  
**Estimate:** 16 hours  
**Owner:** DevOps + Backend  
**Dependencies:** GitHub API, webhook infra, octokit SDK, M16-T002 (policy engine)  
**US-ID:** US-012  
**TB/EP:** EP-045 (new)

---

#### M16-T009: GitLab MR Check Integration (Note + Pipeline Status)
**Description:** Implement GitLab integration analogous to GitHub (MR comments + pipeline status).

**Details:**
- **Setup:**
  - GitLab app: PAT (personal access token) with API scopes
  - Webhook: `POST /webhooks/gitlab/merge-request` → receive MR events
- **Flow:** Same as GitHub but:
  - Comment format: GitLab markdown (slightly different syntax)
  - Status check: GitLab pipeline status (add status as commit status)
  - Merge gate: GitLab "Merge when pipeline succeeds" rule — add manual "VCG Governance" status
- **Override:** Comment `/vcg-approve` in MR to request override (same audit trail as GitHub)

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** DevOps + Backend  
**Dependencies:** GitLab API, python-gitlab SDK, M16-T008 (GitHub logic reuse)  
**US-ID:** US-012  
**TB/EP:** EP-045

---

#### M16-T010: Policy Violation Alerting + Escalation
**Description:** Real-time alerts to Slack + escalation to Compliance Officer if violations spike.

**Details:**
- **Trigger:** VCG Check Node emits violation event
- **Alert 1: Slack Notification (Per Violation)**
  - Channel: `#qa-nexus-governance`
  - Message: "🚨 Policy Violation: A3 output includes hardcoded secret (confidence 0.6). PR #123, user @alice. [Review →](link-to-violation)"
  - Severity indicator: 🔴 Critical, 🟠 Major, 🟡 Minor
- **Alert 2: Escalation (Spike Detection)**
  - If violations/hour >10 (5x baseline): alert Compliance Officer + on-call Engineer
  - Message: "⚠️ VCG violations spiked to 12/hr (baseline 2). Possible LLM degradation or policy too strict. [Investigate →](link)"
- **Dashboard Widget:** Slack home tab shows 24h violation trend (chart)

**Priority:** P1  
**Estimate:** 10 hours  
**Owner:** Backend + DevOps  
**Dependencies:** Slack SDK, M16-T002 (VCG events), alert thresholds config  
**US-ID:** US-012  
**TB/EP:** None

---

#### M16-T011: EU AI Act Compliance Mapping Doc + Evidence Pack
**Description:** Document how VCG governance addresses EU AI Act Articles 13/14/15/22; prepare evidence for auditor review.

**Details:**
- **Compliance Mapping Document** (`/docs/compliance/EU_AI_Act_M16.md`)
  - **Article 13 (Transparency):**
    - Requirement: "High-risk systems must document training data, performance metrics, and human oversight"
    - VCG evidence: Audit trail proves every A1/A2/A3/A4/A5 call logged with input + output + confidence + reviewer
    - Artifact: `audit_log` table, export endpoint
  - **Article 14 (Human Oversight):**
    - Requirement: "High-risk outputs require human review"
    - VCG evidence: Policy rules enforce approval chain (Lead for confidence 0.6–0.8, Admin for <0.6)
    - Artifact: `governance_policies` table, approval audit trail
  - **Article 15 (Data Governance):**
    - Requirement: "Systems must document data quality + bias mitigation"
    - VCG evidence: A1/A2 context vectors + confidence scores stored; bias check in roadmap (PM4)
    - Artifact: Model version + confidence in audit_log
  - **Article 22 (Decision Documentation):**
    - Requirement: "Automated decisions affecting users must be explainable"
    - VCG evidence: Every VCG decision logged with reason (policy rule matched, evidence JSON)
    - Artifact: `policy_violations` table + reason field
- **Evidence Pack for Auditor:**
  - Export: audit_log (1M entries, 7-year retention policy)
  - Export: governance_policies (all policies + version history)
  - Export: policy_violations (all denials + reasons)
  - Documentation: this mapping, architecture diagram, risk assessment
  - Briefing: 1-hour walkthrough with Compliance Officer

**Priority:** P0  
**Estimate:** 12 hours  
**Owner:** Compliance Officer + Technical Writer  
**Dependencies:** VCG design complete, audit_log schema  
**US-ID:** US-012  
**TB/EP:** None

---

#### M16-T012: SOC2 Type I Control Mapping (CC6.1, CC7.1, A.5, A.8, A.12)
**Description:** Document how VCG governance satisfies SOC2 Type I controls.

**Details:**
- **CC6.1 (Logical Access):**
  - Control: "Only authorized users can approve AI agents"
  - VCG evidence: RBAC enforced (Lead/Admin roles); approval audit trail logged
  - Test: Attempt to approve as QA role → blocked
- **CC7.1 (Monitoring):**
  - Control: "System logs all critical operations for audit"
  - VCG evidence: All VCG checks → audit_log (immutable, merkle-chained)
  - Test: Export 100 entries, verify signature chain unbroken
- **A.5 (Access Control):**
  - Control: "Access to policies restricted to authorized admins"
  - VCG evidence: Admin UI RBAC guard, policy changes logged
  - Test: Non-admin user attempts to create policy → 403 Forbidden, logged
- **A.8 (Asset Management):**
  - Control: "Classification of sensitive data (policies, audit trail)"
  - VCG evidence: Audit trail marked "Confidential"; retention policy 7 years
  - Test: Export audit trail → PII redaction applied
- **A.12 (Operations Security):**
  - Control: "Change management for critical systems (VCG policy changes)"
  - VCG evidence: Policy versioning, dry-run before activation
  - Test: Create policy, dry-run on 100 calls, activate → audit trail shows version history

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Compliance Officer + Security Engineer  
**Dependencies:** SOC2 audit plan, VCG design  
**US-ID:** US-012  
**TB/EP:** None

---

#### M16-T013: Performance Validation + Load Testing
**Description:** Measure policy engine latency + audit log write throughput under realistic load.

**Details:**
- **Baseline Tests:**
  - Policy check (simple rule, 1 condition): <5ms p50, <20ms p95
  - Policy check (complex rule, 5 conditions): <15ms p50, <50ms p95
  - Audit log write (single entry): <2ms p50, <10ms p95
  - Audit log write (batch 50 entries): <50ms p50, <100ms p95
- **Load Test:**
  - Scenario: 100 concurrent agent calls (A1–A5), each triggers VCG check + audit log write
  - Duration: 5 min
  - Success criteria:
    - p95 policy check <50ms (target SLO)
    - p95 audit write <10ms (target SLO)
    - Error rate <1%
    - No database connection pool exhaustion
- **Scaling Test:**
  - Query audit_log with 1M entries (export scenario)
  - Filter: agent=A1, timestamp last 7 days
  - Success: query completes <2s, result set <100K rows

**Priority:** P1  
**Estimate:** 12 hours  
**Owner:** DevOps + Backend  
**Dependencies:** Staging DB with seed data, k6 load test tool  
**US-ID:** US-012  
**TB/EP:** None

---

#### M16-T014: VCG Production Readiness Checklist + Rollout
**Description:** Final verification before enabling VCG in production; gradual rollout with feature flags.

**Details:**
- **Checklist:**
  - [ ] All 13 tasks (T001–T013) complete + merged
  - [ ] Policy engine p95 <50ms validated
  - [ ] Audit trail merkle chain verified (100% signature validation)
  - [ ] GitHub/GitLab PR checks functional (tested on 5 real PRs)
  - [ ] Admin UI fully functional (policy creation, audit export)
  - [ ] EU AI Act + SOC2 mapping approved by Compliance Officer
  - [ ] On-call runbook for "Audit log disk full" + "Policy engine offline" created
  - [ ] SigNoz dashboards ready (VCG check latency, audit write rate, violations per hour)
  - [ ] <1% false-positive rate confirmed (synthetic tests)
- **Rollout Strategy (Feature Flag: `vibe_code_governor`):**
  - Dark (internal test only): 2 days
  - Canary 10% (1 customer): 3 days, monitor violations/hour + latency
  - Canary 50%: 2 days, monitor policy violation trends
  - GA: full activation, all customers
- **Kill Switch:** If violations >100/hr OR p95 latency >200ms, disable flag + investigate

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** PM + DevOps  
**Dependencies:** All M16 tasks complete  
**US-ID:** N/A (meta task)  
**TB/EP:** None

---

## API CONTRACTS (M16 SCOPE)

All endpoints authenticated via BetterAuth; RBAC enforced (Admin/Compliance Officer for governance endpoints).

### Policy Management

#### `POST /api/governance/policies`
**Purpose:** Create new governance policy

**Request:**
```json
{
  "orgId": "org_123",
  "projectId": "proj_456",
  "name": "High-Confidence A1",
  "conditions": [
    {"field": "agent", "operator": "equals", "value": "A1"},
    {"field": "confidence", "operator": "<", "value": 0.7}
  ],
  "action": "require_approval",
  "allowOverride": "Lead"
}
```

**Response (201):**
```json
{
  "id": "policy_001",
  "orgId": "org_123",
  "status": "active",
  "createdAt": "2027-03-10T10:00:00Z"
}
```

---

#### `GET /api/governance/policies?orgId=org_123&projectId=proj_456`
**Purpose:** List policies for org/project

**Response (200):**
```json
{
  "policies": [
    {
      "id": "policy_001",
      "name": "High-Confidence A1",
      "conditions": [...],
      "action": "require_approval",
      "status": "active",
      "violationsLast7d": 15,
      "createdAt": "2027-03-10T10:00:00Z"
    }
  ],
  "total": 3
}
```

---

### Audit Log Access

#### `GET /api/audit-log?agent=A1&startDate=2027-03-01&endDate=2027-03-20&format=csv`
**Purpose:** Export audit log with optional filters

**Query Params:**
- `agent`: A1|A2|A3|A4|A5|A8|APT (optional, multiple allowed)
- `userId`: filter by user ID (optional)
- `projectId`: filter by project (optional)
- `startDate`, `endDate`: ISO 8601 date range
- `format`: csv|json (default: json)
- `includeSignatures`: true|false (default: true, for verification)

**Response (200):**
```csv
id,agent_id,action,user_id,project_id,timestamp,input_hash,output_hash,confidence,policy_decision,signature
1,A1,generated,user_123,proj_456,2027-03-10T10:00:00Z,abc123...,def456...,0.85,auto_approved,sig_xyz...
2,A1,approved,user_123,proj_456,2027-03-10T10:05:00Z,abc124...,def457...,0.75,requires_review,sig_abc...
```

---

#### `POST /api/audit-log/verify`
**Purpose:** Verify audit log merkle chain integrity

**Request:**
```json
{
  "entries": [
    {
      "id": 1,
      "agentId": "A1",
      "signature": "sig_xyz...",
      "merkleParentId": null,
      "merkleParentHash": null
    },
    {
      "id": 2,
      "agentId": "A1",
      "signature": "sig_abc...",
      "merkleParentId": 1,
      "merkleParentHash": "hash_of_entry_1"
    }
  ]
}
```

**Response (200):**
```json
{
  "valid": true,
  "entriesVerified": 2,
  "invalidAt": null,
  "evidence": "All signatures valid, merkle chain unbroken"
}
```

---

## DATABASE SCHEMA (TB/EP Reference)

| Table | TB-ID | Purpose | Columns |
|-------|-------|---------|---------|
| governance_policies | TB-008 | Store policy rules + metadata | id, org_id, project_id, name, rule_json, status, created_by, updated_at |
| policy_violations | TB-008 | Track violations by policy | id, policy_id, agent_call_id, violation_type, severity, evidence_json, action, reviewer_id |
| audit_log | TB-008 | Immutable audit trail | id, agent_id, action, user_id, project_id, input_hash, output_hash, model_version, confidence, policy_decision, reviewer_id, merkle_parent_id, merkle_parent_hash, signature, created_at |

---

## RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Policy engine latency >50ms p95 | Users perceive slow VCG checks; agent generation feels sluggish | Medium | Cache policies in Redis; pre-compute common rules; profile with SigNoz |
| Merkle chain signature validation fails | Compliance audit fails (integrity question); legal liability | Low | Test signature verification on 10K entries before production; annual chain verification audit |
| False-positive rate >1% | Legitimate AI outputs blocked; user frustration | Medium | Tune PII detector on real data; solicit feedback on blocked calls; manual review queue |
| Audit log disk space exhaustion | System unable to write audit entries; VCG fails open (all calls allowed) | Low | Monitor disk usage; implement archive-to-cold-storage after 90 days; alert at 80% capacity |
| Policy rule too restrictive | 50%+ violations requiring manual approval; slows down development | Medium | Dry-run mode before activation; gradual rollout (canary); gather user feedback on approval burden |
| GitHub/GitLab webhook failures | PR checks don't run; merge gates skipped | Low | Implement webhook retry (exponential backoff); alert if >10 failures/hour; manual fallback (comment triggers check) |
| Compliance audit reveals control gaps | SOC2/EU AI Act audit fails | Low | Pre-audit walkthrough with compliance auditor; export + review evidence 4 weeks before audit |

---

## ROLLBACK & CONTINGENCY

**If VCG blocks too many PRs:**
- Feature flag: disable `vibe_code_governor` → all policy checks return "approved" (no-op)
- Audit: export violations from past 24h, analyze which policy rules caused false positives
- Adjust: loosen thresholds, disable over-restrictive rules, re-enable gradually

**If audit log merkle chain breaks:**
- Detect: signature verification fails at entry N
- Alert: Page on-call security engineer
- Investigate: Query entries N-10 to N+10, check DB integrity
- Recover: If data corruption detected, restore from last verified backup (max 24h loss)
- Document: RCA + add monitoring alert for future occurrences

**If compliance audit finds missing evidence:**
- Re-export: audit_log for requested time range
- Manual verification: lead through merkle chain validation
- Document: answer compliance questionnaire with audit artifacts

---

## OBSERVABILITY & MONITORING

**SigNoz Dashboards:**
1. **VCG Health Dashboard**
   - Policy engine p50/p95/p99 latency (target: <50ms p95)
   - Audit log write latency (target: <10ms p95)
   - Violations per hour (baseline: 2/hr, alert if >10/hr)
   - False-positive rate (target: <1%)
   - Policy rule distribution (pie: A1 policies vs A2 vs A3 etc.)

2. **Compliance Dashboard**
   - Audit log entry count (7-year retention trend)
   - Merkle chain verification status (last verified, next scheduled)
   - Export activity (# exports, by whom, what filtered)
   - Policy changes (audit trail of policy edits)

**Alerts:**
- If p95 VCG check latency >100ms → page DevOps
- If audit log write errors >5/min → page Backend Lead
- If violations spike >100/hr → page Compliance Officer
- If merkle chain signature fails → page Security Engineer
- If audit log disk >80% capacity → page DevOps (plan archive)

---

## HANDOFF TO PM4 (Future)

**M16 Exit → M17 Entry Prerequisites:**
- VCG governance stable (≥7 days, <1% false positive rate)
- All agent LangGraph workflows emit audit trail
- GitHub/GitLab PR checks functional + no integration bugs
- Audit trail retained >30 days (prove retention policy works)

**Items Deferred to PM4:**
- Advanced policy templates (machine-learning-based heuristics)
- Bias detection + mitigation in AI outputs
- Real-time policy tuning (auto-adjust thresholds based on violation patterns)
- Multi-language policy DSL (not just JSON)

---

## DEFINITION OF DONE

**Code:**
- All M16-T001 through M16-T014 tasks merged to main branch
- Unit tests ≥90% coverage (policy engine, audit trail, API endpoints)
- Integration tests: VCG check + audit log write end-to-end
- E2E tests: GitHub PR check flow (create PR → VCG comment → merge gate)

**Documentation:**
- API documentation (OpenAPI spec) for all governance endpoints
- Admin runbook: how to create policies, resolve violations, export for audit
- Compliance mapping document (EU AI Act + SOC2) reviewed + approved
- Architecture diagram: VCG integration with agent workflows

**Deployment:**
- Feature flag `vibe_code_governor` togglable in production
- Staging environment passes all acceptance criteria
- Performance baselines met (SLOs green)
- On-call runbook + alert thresholds configured

**Compliance:**
- EU AI Act Article 13/14/15/22 evidence pack prepared
- SOC2 Type I control evidence collected + reviewed
- Audit log retention policy (7 years) enforced at DB level
- Merkle chain verified on 10K entries

---

**End of Milestone M16 (Expanded)**
