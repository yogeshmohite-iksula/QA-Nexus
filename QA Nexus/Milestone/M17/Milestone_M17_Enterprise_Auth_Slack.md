---
milestone_id: M17
parent_project_milestone: PM3
name: "Enterprise Auth (SSO/SAML) + Slack ChatOps + Jira Auth Alternatives"
version: 2.0
date: 2026-04-23
phase: v2
window: "W11 of PM3"
start_date: 2027-03-23
end_date: 2027-03-27
duration_weeks: 1
calendar_period: "[PM3] M17 (2027-03-23 → 2027-03-27)"
primary_component: "Enterprise Auth (SSO/SAML) + Slack Bot"
secondary_components: "JIT provisioning, SCIM 2.0 (deferred), Slack ChatOps (triage/search), Jira Auth Alternatives (API Token, PAT, custom OAuth)"
status: "Build-Ready (Tight 1-Week Schedule)"
---

# Milestone M17 — Enterprise Auth (SSO/SAML) + Slack ChatOps + Jira Auth Alternatives

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M17 (Week 11 of 12-week PM3) — **⚠️ CRITICAL: 1 WEEK ONLY**  
**Version:** 2.0 (Expanded from Stub)  
**Date Created:** 2026-04-22 | **Expanded:** 2026-04-23  
**Status Badge:** Build-Ready → Enterprise Auth Production  

---

## EXECUTIVE SUMMARY

[PM3] M17 delivers **Enterprise-Grade Authentication** (SSO/SAML for Okta, Azure AD, Google Workspace via SAML 2.0 + OIDC fallback) and **Slack ChatOps**, enabling QA teams to log in via corporate identity + triage test cases + search defects directly from Slack without leaving chat. **This is a 1-week milestone with tight dependency chain and significant risk of scope creep.** Exit gate: ≥2 identity providers live, Slack bot 3+ commands working, <100ms p95 response, ≥3 enterprise customers on SSO day-1.

**Mission:** Unlock enterprise-tier customer adoption by proving enterprise-grade auth + operational workflow automation in Slack.

**Key Deliverables:**
- SAML 2.0 authentication (Okta, Azure AD, Google Workspace)
- OIDC fallback for unsupported providers (OneLogin, Okta w/ OIDC)
- Just-in-time (JIT) user provisioning (auto-create users on first login)
- Group-to-role mapping (Okta groups → Admin/Lead/QA/Stakeholder roles)
- Slack bot: `/qa triage`, `/qa assign`, `/qa approve`, `/qa status` commands
- Slack notifications: test failures, defect assignments, approval requests (configurable)
- SAML metadata export for customer security reviews
- **Jira Auth Alternatives (new in M17):**
  - API Token + Email Basic Auth flow for **locked-down Atlassian Cloud tenants** where admin forbids third-party OAuth apps (EP-006b). User pastes API token + admin email; QA Nexus stores `api_token_encrypted` + `api_user_email` in TB-013.
  - Personal Access Token (PAT) flow for **Jira Server / Data Center on-prem** deployments (EP-006c). Supports `instance_url` behind VPN/private DNS + `self_signed_cert_trusted` boolean.
  - **Custom OAuth provider** registration (EP-006d) for enterprises running their own Atlassian OAuth proxy — stored in new TB-013b `jira_custom_oauth_providers`.
  - **Per-project Jira auth** — TB-013.`project_id` nullable column enables different projects in one org to authenticate to different Jira instances (e.g., Iksula Commerce uses OAuth Cloud, Iksula Returns uses PAT on-prem).
  - **Test Connection** dry-run endpoint (EP-006e) — validates auth_method before persist and populates `last_test_connection_status` for integration health dashboard.
- **Deferred to PM4:** SCIM 2.0 bulk sync, command-K Slack search parity

**Success Criteria:**
- ≥2 SSO providers live (Okta + Azure AD minimum)
- Slack bot command success rate ≥95%
- SSO login success rate ≥99%
- Slack command response time p95 <100ms
- <1 minute login flow (SAML assertion validation)
- ≥3 enterprise customers live on SSO by 2027-03-27
- All 4 Jira auth methods (oauth, api_token, pat, custom_oauth) pass EP-006e Test Connection against seeded Atlassian Cloud sandbox + on-prem Jira Server 9.x sandbox
- ≥1 customer using per-project Jira auth in production

**Risk Flag:** 1 week is extremely tight. SCIM + command-K parity must defer to PM4. If SSO auth becomes complex, deprioritize Slack bot (partial Slack feature set acceptable).

---

## CONTEXT: WHAT WAS DELIVERED BEFORE

**PM1–PM2 completed:** Test management, execution, defect logging, reporting, test data, self-healing, risk-adaptive planning, visual regression, on-prem deployment, mobile app.

**M16 completed:** Vibe Code Governor governance layer (policy engine, audit trail, PR checks).

**Deployment State (M17 Entry):**
- Vercel (frontend) + Oracle VM (backend NestJS, FastAPI, PostgreSQL, Redis)
- BetterAuth for current session management (email + password, GitHub OAuth)
- Slack integration: outbound notifications only (M5+); inbound ChatOps deferred
- 50 doc templates enabled; all agents (A1–A5, A8, APT, VCG) operational
- Jira/GitHub/GitLab/Confluence/Figma integrations live
- Feature flags active for canary rollout

**Database State:**
- `users`, `roles`, `project_members` (RBAC — from M0)
- `slack_channels`, `slack_integrations` (scaffolding from M5, not fully used)
- Ready for: `sso_providers`, `sso_sessions`, `user_groups`, `group_role_mappings` (M17 new)

**Auth Architecture Current:**
- BetterAuth session cookie + RBAC middleware (Next.js API routes)
- Session validation: POST to backend `/api/auth/session` → returns user + roles
- Secret storage: Doppler (env vars)

---

## REQUIREMENTS: DOMAIN DEPTH

### SSO/SAML Authentication Layer

**SAML 2.0 Flow (Okta Example):**
1. User clicks "Login with SSO" button
2. Redirect to Okta login URL (configured in QA Nexus)
3. User authenticates (password + MFA if configured by org)
4. Okta returns SAML assertion (signed XML, user claims: email, first_name, last_name, groups)
5. Backend validates signature (Okta cert fetched from metadata URL)
6. JIT provisioning: if user email not in `users` table, create account
7. Group mapping: extract groups from assertion (e.g., "QA Engineers"), map to roles
8. Create session cookie, redirect to dashboard
9. User logged in; subsequent API calls include session cookie (BetterAuth session)

**Providers:**
- **Okta:** SAML 2.0 metadata URL, auto-discovery
- **Azure AD (Entra ID):** SAML 2.0, similar flow
- **Google Workspace:** SAML 2.0 (custom metadata URL)
- **OIDC Fallback:** For orgs that only support OpenID Connect (OneLogin, Auth0); use oidc-client-ts library

**JIT Provisioning Logic:**
- On first SAML assertion: extract email, first_name, last_name
- Check `users` table: `WHERE email = assertion.email`
- If not found:
  - Create user: `INSERT INTO users (email, first_name, last_name, auth_method) VALUES (..., 'sso')`
  - Assign default role: "QA" (configurable per org)
  - Create `sso_sessions` record: map email → SSO provider + remote user ID
- If found: update last_login_at, refresh groups

**Group-to-Role Mapping:**
- SAML assertion includes `groups` claim: `["QA Engineers", "Test Leads", "Admins"]`
- Org config defines mapping: 
  ```json
  {
    "okta": {
      "QA Engineers": "QA",
      "Test Leads": "Lead",
      "Admins": "Admin"
    }
  }
  ```
- On login: extract groups, apply mapping, update `user_roles` junction table
- If user removes from "Admins" group in Okta, on next login, Admin role revoked

**NFRs for SSO:**
- Login flow: <60 seconds (SAML cert validation + JIT creation)
- Session validity: 8 hours (configurable per org)
- Re-auth for sensitive ops: force password entry for (delete project, export reports, view audit log)
- Logout: revoke session, clear cookie, revoke any active tokens

### Slack ChatOps (Bot + Notifications)

**Slack Bot Slash Commands:**

1. **`/qa triage <test-case-id> @assignee`**
   - Look up test case by ID
   - Assign to user (if valid email in Slack workspace)
   - Post inline view with case title, steps summary, recent results
   - Button: "Approve", "Reject", "Mark as Duplicate"
   - Notification: assignee gets DM "Triage request: Test Case #123"

2. **`/qa assign <defect-id> @user`**
   - Look up defect by ID
   - Assign to user
   - Sync to Jira (if Jira integration enabled)
   - Post: "Defect #456 assigned to @user. RCA: [summary]. Next steps: [action items]"

3. **`/qa approve <pr-or-item-id>`**
   - For PRs: approve in GitHub (requires OAuth token from user's Slack profile)
   - For approval requests: approve governance violation, A1 generation, test plan
   - Post: "✅ Approved by @user. Reason: [optional]"

4. **`/qa status <project-key>`**
   - Return 3 KPI cards: pass rate (last 24h), open defects, pending approvals
   - Format: Slack Block Kit
   - Link to full dashboard in QA Nexus

5. **`/qa search <keyword>`** (deferred to PM4 if time-constrained)
   - Search test cases + defects by keyword
   - Return top 5 results in thread

**Slack Notifications (configurable per user/project):**
- Test run failures: "@user Test case 'Login Flow' failed (3 failures in last 24h)"
- Defect assignment: "Defect #456 assigned to you by @reviewer"
- Approval requests: "Approval needed: A1 generated 5 test cases (avg confidence 0.73)"
- Daily digest: "7 new defects, 120 test cases run, 2 approval requests"

**Setup Flow:**
1. Admin clicks "Add to Slack" button in QA Nexus settings
2. Slack OAuth flow: request `chat:write`, `commands`, `app_mentions` scopes
3. Store: Slack workspace ID, bot token, workspace URL
4. Confirm: bot installed, ready for commands
5. User setup: `/qa connect` → stores user's QA Nexus user ID in Slack profile

**NFRs for Slack Bot:**
- Command response: <1 second (async job for heavy lifting, show "Processing…" spinner)
- Notification delivery: <5 seconds (publish to Slack message queue)
- Uptime: 99.9% (fallback to in-app notifications if Slack API down)
- Rate limit handling: queue commands, don't drop

### BetterAuth Integration with SSO

**Current State:** BetterAuth manages email/password + GitHub OAuth.

**SSO Extension Strategy:**
- BetterAuth has `providers` config; add SAML provider
- On login page: show "Login with SSO" button (separate from email/password)
- Clicking "SSO" redirects to org-specific SAML IDP selection OR password-less flow
- Backend validates SAML assertion, creates BetterAuth session (internal token)
- Subsequent requests use BetterAuth session (no changes to API layer)

**Migration for Existing Users:**
- If user has email `alice@acme.com` and Acme enables Okta SSO:
  - On Okta login: assertion has email `alice@acme.com`
  - Backend finds existing `users.alice@acme.com`, updates auth_method = "sso", merges accounts (no duplication)
  - Email + password login disabled for that user (they must use SSO now)
  - Fallback: admin can reset to email login if SSO breaks

---

## SCOPE DEFINITION & ACCEPTANCE CRITERIA

### Exit Gate + Acceptance Criteria

| AC-ID | Feature | Acceptance Condition | Verifier |
|-------|---------|----------------------|----------|
| **M17-AC001** | Okta SAML Flow | Given Okta IDP configured, when user logs in via Okta, then session created + user assigned to roles from groups claim | Backend/QA |
| **M17-AC002** | Azure AD SAML Flow | Given Azure AD app registered, when user logs in, then session created + JIT user provisioned | Backend/QA |
| **M17-AC003** | Google Workspace SAML | Given Google Workspace domain configured, when user logs in, then authenticated + assigned to org | Backend/QA |
| **M17-AC004** | JIT Provisioning | Given new user's first SAML login, when assertion received, then user auto-created + assigned default role | Backend |
| **M17-AC005** | Group-to-Role Mapping | Given Okta group "QA Engineers" mapped to role "QA", when user in that group logs in, then QA role assigned | Backend |
| **M17-AC006** | Re-auth for Sensitive Ops | Given user tries to delete project, when re-auth prompted, then password entry required before deletion | Frontend |
| **M17-AC007** | Slack Bot `/qa triage` | Given test case ID + assignee, when `/qa triage 123 @bob` executed, then test case details posted + Bob notified | Slack/Backend |
| **M17-AC008** | Slack Bot `/qa assign` | Given defect ID, when `/qa assign 456 @alice` executed, then defect assigned + synced to Jira | Slack/Backend |
| **M17-AC009** | Slack Bot `/qa status` | Given project key, when `/qa status proj_xyz` executed, then 3 KPI cards shown in Slack | Slack/Frontend |
| **M17-AC010** | Slack Notifications (Defect Assignment) | Given defect assigned to user, when notification configured, then Slack DM sent <5s | Slack/Backend |
| **M17-AC011** | Slack Notifications (Test Failure) | Given test run fails with >3 failures, when alert rule configured, then Slack notification sent to @channel | Backend |
| **M17-AC012** | SSO Login Response Time | Given typical Okta org, when SSO login initiated, then complete in <60s (SAML cert + JIT) | DevOps |
| **M17-AC013** | Slack Command Response Time | Given `/qa triage` command, when p95 latency measured, then <1s | DevOps |
| **M17-AC014** | SAML Metadata Export | Given admin clicks "Download SAML Metadata", then XML metadata file returned (customer uploads to Okta) | Frontend |
| **M17-AC015** | ≥2 SSO Providers Live | Given M17 exit gate, when count of live SSO orgs measured, then ≥2 providers (Okta + Azure AD) | Product |
| **M17-AC016** | ≥3 Enterprise Customers on SSO | Given day 1 of M17 exit, when customer adoption tracked, then ≥3 customers live on SSO | Product |

### Definition of Ready (DoR)

1. A1–A5, A8, APT, VCG all stable + merges complete
2. Okta test org provisioned + SAML metadata available
3. Azure AD test tenant configured + service principal created
4. Google Workspace test domain ready
5. Slack test workspace created + bot scopes documented
6. BetterAuth provider plugin architecture reviewed
7. SAML assertion validation library selected (node-saml or passport-saml)
8. Slack SDK (bolt-js) integrated + ready
9. Database schema (sso_providers, user_groups, group_role_mappings) drafted
10. Customer list: ≥3 enterprise prospects confirmed for day-1 SSO launch

---

## TASK BREAKDOWN (1 WEEK — CRITICAL SCHEDULE)

### DAY 1–2: SSO CORE (2027-03-23 → 2027-03-24)

**Goal:** SAML validation + JIT provisioning functional; users can log in via Okta + Azure AD.

#### M17-T001: SAML Provider Integration (node-saml + BetterAuth)
**Description:** Wire SAML authentication into BetterAuth; validate assertions from Okta/Azure AD.

**Details:**
- Library: `node-saml` or `passport-saml` (lightweight, well-tested)
- Configuration:
  ```javascript
  const samlConfig = {
    entryPoint: "https://iksula.okta.com/app/123/sso/saml",
    issuer: "qa-nexus",
    cert: fs.readFileSync("okta-cert.pem"),
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  };
  ```
- Endpoints:
  - `GET /auth/saml/metadata` → return SP metadata (for customer to upload to IDP)
  - `POST /auth/saml/login` → redirect to Okta login URL
  - `POST /auth/saml/acs` (Assertion Consumer Service) → validate assertion, create session
- **Critical:** Assertion validation MUST check:
  - Signature (IDP cert)
  - Subject confirmation (NotOnOrAfter timestamp)
  - Audience (match SP issuer)
  - NameID format (email address)
- **Error handling:** If assertion invalid, log + show user-friendly error ("Login failed; contact IT support")
- Integration with BetterAuth:
  - On valid assertion: call `betterAuth.createSession({email: assertion.nameID, ...})`
  - Return session cookie (existing BetterAuth flow)

**Priority:** P0  
**Estimate:** 12 hours (1 person, 1.5 days)  
**Owner:** Backend Engineer (Auth)  
**Dependencies:** node-saml library, Okta + Azure AD metadata  
**US-ID:** US-013 (enterprise auth)  
**TB/EP:** TB-009 (new), EP-046 (new)  
**Risk:** SAML debugging can be time-consuming; have Okta support on standby.

---

#### M17-T002: JIT User Provisioning + Group Mapping
**Description:** Auto-create users on first SSO login; map Okta/Azure groups to QA Nexus roles.

**Details:**
- **JIT Logic:**
  - SAML assertion includes: email, first_name, last_name, groups (array)
  - Check: `SELECT id FROM users WHERE email = ?`
  - If not found:
    - `INSERT INTO users (email, first_name, last_name, auth_method, created_at)`
    - `INSERT INTO user_roles (user_id, role_id)` → default role (config: "QA")
    - Create `sso_sessions` record: email → IDP + remote_id
  - If found: update last_login_at, refresh groups (see below)
- **Group Mapping:**
  - Store mapping in `sso_provider_config` table (org + IDP + mapping JSON)
  - Example:
    ```json
    {
      "oidp": "okta",
      "org_id": "org_123",
      "group_mappings": {
        "QA Team": "QA",
        "Test Leads": "Lead",
        "Admins": "Admin"
      }
    }
    ```
  - On login: extract groups from assertion, apply mapping, update user_roles
  - Revoke roles if user removed from group in IDP (compare current vs. previous groups on next login)
- **Database Schema:**
  ```sql
  CREATE TABLE sso_sessions (
    id UUID PRIMARY KEY,
    user_id UUID,
    sso_provider_id TEXT,  -- 'okta', 'azure_ad', 'google_workspace'
    remote_user_id TEXT,   -- IDP's unique ID for user (not email)
    created_at TIMESTAMP,
    last_login_at TIMESTAMP
  );
  
  CREATE TABLE sso_provider_config (
    id UUID PRIMARY KEY,
    org_id UUID,
    provider_type TEXT,    -- 'okta', 'azure_ad', 'google_workspace', 'oidc'
    metadata_url TEXT,
    client_id TEXT,
    client_secret TEXT,    -- stored encrypted in Doppler
    group_mappings JSONB,
    status TEXT ('active', 'inactive'),
    created_at TIMESTAMP
  );
  ```

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer (Auth)  
**Dependencies:** M17-T001 (SAML validation), user creation service  
**US-ID:** US-013  
**TB/EP:** TB-009

---

#### M17-T003: Azure AD + Google Workspace SAML Config
**Description:** Configure second + third SSO provider; validate with test tenants.

**Details:**
- **Azure AD:**
  - Register app in Azure portal
  - Get metadata URL: `https://login.microsoftonline.com/tenant-id/federationmetadata/2007-06/federationmetadata.xml`
  - Configure assertion attributes: `email`, `givenName`, `surname`, `groups`
  - Test: log in with Azure user → verify session created
- **Google Workspace:**
  - Same as Okta (SAML 2.0 is standard)
  - Get metadata URL from Google Admin console
  - Test: log in with Google account
- **Testing:**
  - 5 test users per provider (QA, Lead, Admin, non-existent user, duplicate email across providers)
  - Verify: group mapping, JIT creation, session persistence

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** Backend Engineer + DevOps  
**Dependencies:** Azure/Google test environments, M17-T001/T002  
**US-ID:** US-013  
**TB/EP:** TB-009

---

### DAY 3: SLACK BOT CORE (2027-03-25)

**Goal:** Slack bot `/qa triage`, `/qa assign`, `/qa status` commands working; notifications flowing.

#### M17-T004: Slack Bot Setup + Slash Commands (Core 3)
**Description:** Register Slack app, implement 3 slash commands, handle requests + responses.

**Details:**
- **Setup:**
  - Create Slack app in workspace (bolt-js framework)
  - Scopes: `chat:write`, `commands`, `app_mentions`, `users:read`
  - Request URL: `https://qa-nexus.backend/api/slack/events`
  - Save bot token + signing secret to Doppler
- **Slash Command 1: `/qa triage <case_id> @user`**
  - Handler: extract case_id + user_id
  - Query: `SELECT * FROM test_cases WHERE id = ?`
  - Update: `UPDATE test_cases SET assigned_to_id = user_id`
  - Response: Slack message with case details (title, # steps, recent pass rate)
  - Buttons: "Approve", "Reject", "Duplicate" → click handlers (defer to T005)
- **Slash Command 2: `/qa assign <defect_id> @user`**
  - Similar to triage: fetch defect, update assigned_to
  - Include RCA summary, Jira link if available
  - Sync to Jira: if integration enabled, update Jira issue assignee
- **Slash Command 3: `/qa status <project_key>`**
  - Query: materized views (M5 style) for pass rate, open defects, approvals
  - Format: 3 KPI cards (Slack Block Kit)
  - Example:
    ```
    📊 Project ABC Status (Last 24h)
    ✅ Pass Rate: 87% (120 passed, 18 failed)
    🐛 Open Defects: 5 (3 critical, 2 major)
    ⏳ Pending Approvals: 2 (1 A1 gen, 1 test plan)
    [View Dashboard →](link)
    ```
- **Error Handling:**
  - If case/defect not found: "Item not found. Check case ID."
  - If user not found: "User not in QA Nexus. Ask admin to invite."
  - If query fails: "Something went wrong. Try again or contact support."

**Priority:** P0  
**Estimate:** 14 hours  
**Owner:** Backend Engineer (Slack integration)  
**Dependencies:** bolt-js, Slack app registered, case/defect schemas  
**US-ID:** US-014 (Slack ChatOps)  
**TB/EP:** EP-047 (new Slack endpoints)  
**Risk:** Slack rate limits + message formatting debugging; allocate buffer time.

---

#### M17-T005: Slack Notifications (Test Failure + Defect Assignment)
**Description:** Emit notifications from QA Nexus to Slack on events.

**Details:**
- **Event 1: Test Run Failure (>3 failures in 24h)**
  - Trigger: when test_results status = 'fail' + count >3
  - Notification template:
    ```
    🚨 Test case 'Login Flow' failed again (4 failures in 24h)
    Assigned to: @alice
    Last failure: [timestamp], [error message]
    [View Results →](link)
    ```
  - Deliver to: assigned user (DM) + project channel (configurable)
- **Event 2: Defect Assignment**
  - Trigger: defect.assigned_to_id updated
  - Notification:
    ```
    📌 Defect #456 assigned to you
    Title: Login button unresponsive on Safari
    Severity: Major
    RCA: JavaScript error in event listener (line 45)
    [Review →](link)
    ```
  - Deliver to: assignee (DM)
- **Event 3: Approval Request**
  - Trigger: A1 generated 5+ test cases, or test plan >50 cases, or governance violation
  - Notification: thread to QA Lead/Admin
    ```
    ⏳ Approval needed
    A1 generated 5 test cases (avg confidence 0.73)
    [Review and approve →](link-to-approval-queue)
    ```
- **Configuration:**
  - Per-project notification preferences (enable/disable event types)
  - Per-user mute (user can mute 7 days)
  - Time zone aware (don't send 3 AM)

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** Backend Engineer  
**Dependencies:** Slack API (chat.postMessage), event system, M17-T004  
**US-ID:** US-014  
**TB/EP:** None (internal event system)  
**Risk:** Notification spam; start with conservative rules (only critical + assignment).

---

### DAY 4–5: SENSITIVE OPS RE-AUTH + POLISH (2027-03-26 → 2027-03-27)

**Goal:** Re-auth for sensitive ops, SAML metadata export, testing, launch.

#### M17-T006: Re-Authentication for Sensitive Operations
**Description:** Force password/biometric re-entry for delete project, export data, change SSO settings.

**Details:**
- **Sensitive Operations:**
  - Delete project
  - Export all test cases/defects (bulk data)
  - Change SSO provider (org-level)
  - View audit log (governance)
  - Delete user account
- **Flow:**
  - User clicks "Delete Project"
  - Modal: "Enter your password to confirm" (or biometric on mobile)
  - Verify: hash(password) against users.password_hash
  - Set flag: `session.authenticated_for_sensitive_ops = true` + timestamp
  - Allow operation if flag present + timestamp <15 min old
  - On sensitive op complete: clear flag
- **Implementation:**
  - API middleware: `@UseGuards(SensitiveOpsGuard)` checks flag
  - Frontend: modal interceptor (⌘K + "delete project" opens re-auth)
  - SSO-only users: re-auth via SAML (redirect to IDP, return to re-auth page)

**Priority:** P1  
**Estimate:** 8 hours  
**Owner:** Frontend + Backend  
**Dependencies:** M17-T001 (SSO flow)  
**US-ID:** US-013  
**TB/EP:** None

---

#### M17-T007: SAML Metadata Export + Security Checklist
**Description:** Allow admin to download SAML SP metadata for upload to Okta/Azure/Google.

**Details:**
- **Endpoint:** `GET /api/auth/saml/metadata`
  - Return XML metadata (Service Provider descriptor)
  - Format:
    ```xml
    <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="qa-nexus">
      <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://qa-nexus/api/auth/saml/acs"/>
      </SPSSODescriptor>
    </EntityDescriptor>
    ```
  - Content-Type: `application/xml`
  - Filename: `qa-nexus-sp-metadata.xml`
- **Security Checklist Page** (`/admin/auth/sso-setup`)
  - Step 1: Download metadata
  - Step 2: Upload to IDP (Okta/Azure/Google instructions linked)
  - Step 3: Copy IDP metadata URL into QA Nexus
  - Step 4: Test login
  - Checkbox: "I have configured SSO in [Okta/Azure]" (confirmation)
- **Documentation:**
  - Linked guides: "How to configure Okta SAML", "Azure AD SAML setup", "Google Workspace SAML"

**Priority:** P0  
**Estimate:** 6 hours  
**Owner:** Frontend + Documentation  
**Dependencies:** M17-T001  
**US-ID:** US-013  
**TB/EP:** None

---

#### M17-T008: Integration Testing + Staging Validation
**Description:** End-to-end testing of SSO flows + Slack bot; validate on staging + 1 pilot customer.

**Details:**
- **Test Matrix:**
  | Scenario | Provider | Expected | Status |
  |----------|----------|----------|--------|
  | New user first login | Okta | User created, role assigned | ✅ |
  | Existing user re-login | Okta | Session refreshed | ✅ |
  | Group change in IDP | Azure AD | Role updated on next login | ✅ |
  | `/qa triage` command | Slack | Test case assigned, notification sent | ✅ |
  | `/qa status` command | Slack | KPI cards displayed | ✅ |
  | Re-auth for delete | Portal | Password prompt shown, op blocked if wrong | ✅ |
  - Run 2 test cycles (developer testing + QA testing)
  - Pilot customer: Acme Corp (real Okta org) — 5 users log in via SSO, assign 3 test cases in Slack
  - Success metric: all flows pass, <1% error rate, user feedback positive

**Priority:** P0  
**Estimate:** 10 hours  
**Owner:** QA Engineer + Backend  
**Dependencies:** All M17 tasks  
**US-ID:** N/A (test task)  
**TB/EP:** None

---

#### M17-T009: Feature Flag Rollout + Monitoring (SSO + Slack)
**Description:** Gradual enable of SSO + Slack bot via feature flags; monitor for issues.

**Details:**
- **Flags:**
  - `auth.sso_saml_okta` (default: false)
  - `auth.sso_azure_ad` (default: false)
  - `slack.chatops_beta` (default: false)
- **Rollout (2027-03-26 → 2027-03-27):**
  - Day 1 (Tue): Dark launch (internal only, Iksula team)
  - Day 1 (PM): Canary 20% (1 customer: Acme Corp)
  - Day 2 (Wed): Canary 50% (2 customers)
  - Day 2 (PM): GA (all customers, flags enabled by default)
- **Monitoring:**
  - SigNoz: SSO login latency, Slack command response time, error rate
  - Alerts: if latency >60s OR error rate >2%, disable flag + page on-call
  - User feedback: Slack #support channel, watch for complaints

**Priority:** P0  
**Estimate:** 4 hours  
**Owner:** DevOps + PM  
**Dependencies:** All M17 tasks + feature flag infra (Unleash)  
**US-ID:** None (ops)  
**TB/EP:** None

---

#### M17-T010: Documentation + On-Call Runbook
**Description:** Write admin guide, troubleshooting docs, on-call playbooks.

**Details:**
- **Admin Guide** (2–3 pages)
  - "Configure Okta SSO" (step-by-step with screenshots)
  - "Configure Azure AD SSO"
  - "Set up Slack bot" (permission scopes, install link)
  - "Map groups to roles" (JSON editor example)
  - Troubleshooting: "SSO login fails with 'Subject not found'" → steps to debug
- **Runbook (P0–P2 Scenarios)**
  1. **SSO Login Fails (P0)**
     - Symptom: User sees "SAML assertion invalid"
     - Investigation: `SELECT * FROM sso_sessions WHERE user_id = ?` → check remote_id
     - Fix: Reset user's IDP login, have user try again
     - Escalation: If persists >1h, escalate to IDP admin
  2. **Slack Bot Not Responding (P0)**
     - Symptom: User runs `/qa triage` → no response
     - Investigation: Check Slack API status, check bot token in Doppler
     - Fix: Restart bot service, refresh token
     - Escalation: Page backend on-call
  3. **Group Mapping Broken (P1)**
     - Symptom: User logs in but missing role
     - Investigation: Check assertion groups vs. mapping config
     - Fix: Update group_mappings in sso_provider_config
     - Escalation: Notify Compliance Officer (user access changed unexpectedly)

**Priority:** P0  
**Estimate:** 8 hours  
**Owner:** Technical Writer + Backend Lead  
**Dependencies:** All M17 tasks  
**US-ID:** None (documentation)  
**TB/EP:** None

---

## ACCEPTANCE CRITERIA MATRIX

| AC-ID | Acceptance Condition | Verifier |
|-------|----------------------|----------|
| M17-AC001 to AC016 | (See Section: Exit Gate + Acceptance Criteria above) | QA/Backend/DevOps |

---

## RISKS & MITIGATIONS (1-WEEK CRITICAL SCHEDULE)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **Scope creep (SCIM + command-K)** | Miss deadline, feature incomplete | High | **Fix scoping NOW:** SCIM deferred to PM4; command-K deferred to PM4. Accept partial Slack (3 commands only). |
| **SAML assertion validation debugging** | Days lost to signature/cert issues | Medium | Have Okta/Azure support pre-engaged; use well-tested lib (node-saml); test early (day 1). |
| **Slack API rate limits** | Bot commands timeout/fail | Medium | Implement queue + async processing; monitor rate limits daily; fallback to in-app approval. |
| **Azure AD cert rotation** | Assertion validation fails mid-week | Low | Cache cert 24h; implement refresh on 401 unauthorized; alert on cert expiry. |
| **Customer SSO config complex** | Pilot customer can't activate SSO | Medium | Pair with customer engineer; test metadata upload flow end-to-end before go-live. |
| **JIT provisioning creates duplicate users** | Email address collision, user confusion | Low | Test with duplicate emails across IDPs; add unique constraint on (email, sso_provider_id). |
| **Slack notification spam** | Users mute notifications, lose signal | Medium | Start conservative: only critical severity + assignments; gather feedback day 1 of GA. |
| **SSO login >60s** | Enterprise customers bounce | Medium | Profile SAML validation (likely bottleneck); add Redis cache for IDP metadata; target <30s happy path. |
| **Deployment dependencies conflict** | Breaking change in VCG/A8 code | Low | Freeze M16/M15 code on day 1 of M17; git tags for each component. |

---

## DEFERRED TO PM4 (IF TIME-CONSTRAINED)

1. **SCIM 2.0 Bulk Sync** — Auto-sync user list from Okta/Azure (significant complexity)
2. **Command-K Slack Search Parity** — Full test case/defect search from Slack (requires Algolia or similar)
3. **Mobile SSO (PassKit)** — Biometric re-auth for mobile app
4. **OIDC Support** — OpenID Connect for Auth0, OneLogin (lower priority than SAML)
5. **Slack Workflow Approval** — Approve test cases directly in Slack workflow builder (Slack API change)

**Exit Gate Acceptance:** Ship SSO (≥2 providers) + basic Slack bot (3 commands) on 2027-03-27. **SCIM + command-K not required for GA.**

---

## ROLLBACK & CONTINGENCY

**If SSO adoption stalls (<1 customer by day-1 of GA):**
- Keep SSO flag `false` (disabled)
- Extend M17 by 1 week into M18 (risk: impacts v2 GA date)
- OR accept SSO as "beta" feature, not required for GA

**If Slack bot commands have >5% error rate:**
- Disable `slack.chatops_beta` flag
- Gather error logs (why commands failing)
- Fix + re-enable on day 2

**If SAML assertion validation breaks:**
- Fallback: disable SAML for that provider, support via email for duration
- Investigate: likely cert rotation or metadata change by IDP
- Fix within 24h

---

## DATABASE CHANGES (M17 SCOPE)

| Table | Change | Rationale |
|-------|--------|-----------|
| `users` | Add `auth_method` column (email/sso) | Track auth method per user |
| `sso_sessions` (new) | Store IDP session mappings | Link QA Nexus user to IDP user ID |
| `sso_provider_config` (new) | Org-level SSO provider settings | Okta/Azure/Google metadata + group mappings |
| `user_roles` | No change (existing junction) | Reuse for group-based role assignment |
| `slack_integrations` (new) | Store per-org Slack bot config | Workspace ID, bot token, notification preferences |

---

## API CONTRACTS (M17 SCOPE)

### SSO Authentication

#### `POST /api/auth/saml/acs` (Assertion Consumer Service)
**Purpose:** Receive SAML assertion from IDP; validate + create session

**Request (auto-submitted by browser):**
```
POST /api/auth/saml/acs HTTP/1.1
Content-Type: application/x-www-form-urlencoded

SAMLResponse=[encoded-assertion]&RelayState=[original-url]
```

**Response (302 redirect):**
```
Location: https://qa-nexus.app/dashboard
Set-Cookie: betterauth-session=...
```

---

#### `GET /api/auth/saml/metadata`
**Purpose:** Download SP metadata for customer to upload to IDP

**Response (200 application/xml):**
```xml
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="qa-nexus">
  ...
</EntityDescriptor>
```

---

### Slack Bot

#### `POST /api/slack/events` (Event Receiver)
**Purpose:** Receive slash commands + interactive events from Slack

**Request (slash command):**
```json
{
  "type": "slash_commands",
  "command": "/qa",
  "text": "triage 123 @bob",
  "user_id": "U123456",
  "channel_id": "C123456",
  "response_url": "https://hooks.slack.com/commands/..."
}
```

**Response (200):**
```json
{
  "response_type": "in_channel",
  "blocks": [
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "Test case #123 assigned to @bob"}
    }
  ]
}
```

---

## DEFINITION OF DONE

**Code:**
- M17-T001 through M17-T010 merged to main
- Unit tests ≥85% coverage (SAML validation, JIT provisioning, Slack handlers)
- Integration tests: SSO login flow + Slack command end-to-end
- E2E tests: 3 providers (Okta + Azure AD + Google) tested with real accounts

**Documentation:**
- Admin guide (configure SSO per provider)
- Slack bot setup guide (install + configure)
- Troubleshooting guide (P0–P2 scenarios)
- API documentation (OpenAPI spec for SSO endpoints)

**Deployment:**
- Feature flags `auth.sso_*` + `slack.chatops_beta` togglable
- Staging environment passes all acceptance criteria
- Performance baselines met (SSO <60s, Slack <1s)
- ≥3 customer pilots tested (real SSO login + Slack commands)

**Compliance:**
- SAML metadata export working
- Security checklist documented
- Sensitive operations guarded by re-auth

---

**End of Milestone M17 (Expanded)**
