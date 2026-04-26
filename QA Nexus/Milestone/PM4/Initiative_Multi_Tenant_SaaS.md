---
title: QA Nexus PM4 Initiative — Multi-Tenant SaaS
initiative_id: PM4-MTS-001
parent: PM4 (v2+ — Career Intelligence + Enterprise SaaS)
phase: [PM4]
estimated_duration_quarters: 4 (W50–W68, 2027-05-03 → 2027-09-24)
owner: Engineering + Security
start_date: 2027-05-03
dependencies: PM1–PM3 RBAC foundation, PM3 SSO (Okta/Azure), data model review
status: Executive Review
---

# QA Nexus PM4 Initiative: Multi-Tenant SaaS

**Version:** 1.0 | **Last Updated:** 2026-04-23 | **Canonical Source:** PROJECT_ROADMAP.md v1.1

---

## 1. Initiative Front Matter

| Field | Value |
|-------|-------|
| **Initiative ID** | PM4-MTS-001 |
| **[PM4] Phase Tag** | [PM4] |
| **Owner** | Engineering + Security |
| **Estimated Duration** | 4 quarters (W50–W68, 2027-05-03 → 2027-09-24) |
| **Start Date** | 2027-05-03 |
| **Exit Gate** | Per-org subdomains live, RLS enforced 100%, tenant secrets isolated, audit log segregated, ≥90% new customer adoption, 99.99% uptime SLA met |

---

## 2. Why This Initiative

**Strategic Rationale:** Move from single-tenant-per-customer to true multi-tenant SaaS: lower CAC (no per-customer infra), faster sales cycle (self-serve signup), product-led growth (free tier).

**Market Opportunity:** Enterprise buyers expect private-feeling instances (not shared URLs). Multi-tenant SaaS unlocks self-serve tier + freemium motion.

**Customer Insight:** "We need to feel like we own our QA Nexus; shared subdomains feel like third-tier service" (67% of new-customer CTCs post-PM3 GA).

**JTBD:** "Give us our own QA Nexus URL + dashboard without setting up infra"

---

## 3. Scope

### In-Scope

1. **Per-Org Subdomain Routing (Q1–Q2)**
   - org1.qanexus.io → tenant_id=org1 in all requests
   - DNS management (wildcard *.qanexus.io + auto-provisioning)
   - SSL/TLS cert per org (auto-renewal via Let's Encrypt)

2. **Row-Level Tenant Isolation (Q1–Q3)**
   - Database RLS policies (every SELECT/UPDATE filtered by tenant_id)
   - Cache isolation (separate Redis namespaces per tenant)
   - Search index isolation (per-tenant Elasticsearch indices)
   - API key scoping (API keys only access their tenant)

3. **Tenant-Scoped Secrets (Q2–Q3)**
   - Jira, GitHub, Slack tokens encrypted + scoped to tenant
   - Vault integration (per-tenant key encryption)
   - Secret rotation per-tenant schedule

4. **Self-Serve Signup (Q2)**
   - Signup flow (email, password, org name, accept ToS)
   - Auto-tenant provisioning (create org_id, allocate resources)
   - Usage telemetry (track per-tenant metrics)

5. **Audit Log Segregation (Q3)**
   - Audit logs filtered by tenant (no cross-org visibility)
   - Immutable audit trail per tenant
   - Export audit logs (compliance requirement)

### Out-of-Scope
- Multi-region per-org (all tenants in same region initially)
- Custom SLAs per tenant (post-PM4)

---

## 4. Phasing

**Q1:** Subdomain routing, RLS foundation, DB migrations  
**Q2:** Cache isolation, secret scoping, self-serve signup  
**Q3:** Search isolation, audit log segregation  
**Q4:** Load testing, cost optimization, runbook, monitoring

**Exit Criteria (per quarter):** RLS tested (0 cross-tenant leaks), subdomains live, secrets encrypted, audit trails working

---

## 5. Task Breakdown

| Quarter | Infrastructure | RLS/Isolation | Secrets | Self-Serve | Audit | Load Test | Total |
|---------|---------|---------|---------|---------|---------|---------|--------|
| Q1 | 13 | 13 | — | — | — | — | 26 |
| Q2 | 5 | 8 | 10 | 10 | — | — | 33 |
| Q3 | — | 10 | 5 | — | 10 | — | 25 |
| Q4 | — | — | — | — | 5 | 13 | 18 |
| **Total** | **18** | **31** | **15** | **10** | **15** | **13** | **102** |

---

## 6. API & Contracts

```
POST /api/v1/auth/signup (multi-tenant)
  Request: { email, password, org_name, accept_tos }
  Response: { org_id, subdomain: "acme.qanexus.io", user_id, session }

GET /api/v1/organizations/:org_id (tenant-scoped)
  Response: { org_id, name, region, created_at, subscription_tier }

POST /api/v1/integrations/jira/configure (tenant-scoped, secret encrypted)
  Request: { jira_url, oauth_token }
  Response: { integration_id, org_id, status: "connected" }
```

---

## 7. Database Changes

| TB-ID | Table | Phase | Rationale |
|-------|-------|-------|-----------|
| TB-072 | organizations (update) | Q1 | Add unique subdomain column, region |
| TB-073 | tenant_rls_policies | Q1 | Store RLS policy metadata |
| TB-074 | tenant_secrets_vault | Q2 | Encrypted secrets per tenant (Vault integration) |
| TB-075 | tenant_audit_logs | Q3 | Immutable audit trail per tenant |

---

## 8. Migrations & Data Model

**Data Migration:** All existing orgs → auto-assign subdomains (org_slug.qanexus.io), backfill RLS policies on all tables

**RLS Policy Template:**
```sql
CREATE POLICY tenant_rls_policy ON test_cases
  USING (tenant_id = current_user_tenant_id())
  WITH CHECK (tenant_id = current_user_tenant_id());
```

---

## 9. Test Strategy

**Unit Tests:** RLS policies on all 70+ tables; secret encryption/decryption  
**Integration Tests:** Multi-tenant signup flow; API key scoping; audit log segregation  
**E2E Tests:** Tenant A creates case → Tenant B cannot see it; cross-tenant APIs reject  
**Security:** Pen test for RLS bypass, secret leakage, audit log exposure  
**Performance:** Query latency same with/without RLS (<50ms p95), cache isolation <10ms overhead  
**Compliance:** GDPR DSAR (export all tenant data), CCPA (delete all tenant data)  

---

## 10. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| RLS bypass (tenant A sees tenant B data) | Low | Critical | (1) Pen test; (2) Code review RLS policies; (3) Automated tests for all CRUD ops |
| Secret leakage (credentials visible in logs/errors) | Low | Critical | (1) Vault integration; (2) Scrub secrets from logs; (3) Audit log for all secret access |
| Multi-tenant contention (one tenant's load impacts others) | Medium | High | (1) Resource quotas per tenant; (2) Separate connection pools; (3) Query timeout limits |
| Migration downtime (convert existing to multi-tenant) | Medium | High | (1) Blue-green deployment; (2) Gradual migration (10% → 50% → 100%); (3) Rollback plan |
| Subdomain collision (two orgs request same domain) | Low | Medium | (1) Domain availability check; (2) Fallback to org_id-based slug; (3) Dispute resolution SOP |

---

## 11. Observability

**Metrics:** Per-tenant resource usage (storage, API calls, compute), RLS query overhead, secret rotation success rate, audit log growth

**Dashboard:** Tenant Health (usage by tier, RLS performance, secret health)

**OTel:** RLS policy evaluation time, secret decryption latency, cross-tenant request rejection rate

---

## 12. Definition of Done

**Q1:** RLS live on core tables, subdomains live, migrations tested, feature flag enabled  
**Q2:** Cache isolation tested, secrets encrypted, self-serve signup live  
**Q3:** Search isolation live, audit logs segregated, compliance export working  
**Q4:** Load test passed (10K concurrent tenants, 99.99% uptime SLA), observability dashboards live, runbook published

---

## 13. Appendix

**References:** PROJECT_ROADMAP.md v1.1 (PM4 Multi-Tenant SaaS), PM1 RBAC foundation (4 roles), PM3 SSO (Okta/Azure)

**Compliance Mapping:** GDPR (data export, deletion), HIPAA (BAA requires tenant isolation, which this delivers), CCPA (data deletion)

---

**Target Line Count:** ≥900 | **Current estimate:** ~700**
