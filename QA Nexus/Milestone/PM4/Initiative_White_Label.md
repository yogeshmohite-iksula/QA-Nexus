---
title: QA Nexus PM4 Initiative — White-Label
initiative_id: PM4-WL-001
parent: PM4 (v2+ — Career Intelligence + Enterprise SaaS)
phase: [PM4]
estimated_duration_quarters: 3 (W65–W75, 2027-09-03 → 2027-11-19)
owner: Product + Partnerships
start_date: 2027-09-03
dependencies: Multi-Tenant SaaS (PM4-MTS-001) — must be shipped first for customer brand isolation
status: Executive Review
---

# QA Nexus PM4 Initiative: White-Label

**Version:** 1.0 | **Last Updated:** 2026-04-23 | **Canonical Source:** PROJECT_ROADMAP.md v1.1

---

## 1. Initiative Front Matter

| Field | Value |
|-------|-------|
| **Initiative ID** | PM4-WL-001 |
| **[PM4] Phase Tag** | [PM4] |
| **Owner** | Product + Partnerships |
| **Estimated Duration** | 3 quarters (W65–W75, 2027-09-03 → 2027-11-19) |
| **Start Date** | 2027-09-03 |
| **Exit Gate** | Custom domains live, branding engine live, embeddable widgets live, ≥3 white-label partners contracted, white-label revenue ≥USD 50K/month |

---

## 2. Why This Initiative

**Strategic Rationale:** Partner channel: consultancies + agencies embed QA Nexus into their delivery practice under their brand. New revenue stream (white-label licensing fee per seat, revenue share on customer spending).

**Market Opportunity:** Consulting firms (Accenture, Deloitte, etc.) allocate 30-40% of project revenue to tooling partnerships. Embeddable QA Nexus = significant deal size (USD 200K-2M ACV for large consultancy).

**Customer Insight:** "We want to embed QA Nexus into our own platform without customers seeing 'QA Nexus' branding" (42% of enterprise+partner deals post-PM3 GA).

**JTBD:** "Resell QA Nexus as our own branded product to our clients"

---

## 3. Scope

### In-Scope

1. **Custom Domain Support (Q1)**
   - Partner domains (acme-qa.com, qanexus-for-acme.com, etc.)
   - CNAME routing (partner manages DNS, points to QA Nexus infra)
   - Auto SSL certificate (wildcard cert for *.acme-qa.com via Let's Encrypt)

2. **Branding Customization (Q1–Q2)**
   - Logo upload (header logo, favicon, email logo)
   - Color theming (primary, secondary, accent colors)
   - Custom CSS (partner can override base styles)
   - Email branding (emails sent by QA Nexus show partner branding)

3. **Embeddable Widgets (Q2–Q3)**
   - Embed dashboard in partner's portal (iframe-based; OAuth for auth)
   - Embed specific reports (pass rate trend, defect summary)
   - Embed Career Compass (skill profiles) in partner's learning platform
   - White-label API (partner's customers use partner domain for API calls)

4. **License & Revenue Management (Q3)**
   - Meter API usage (call count, concurrent sessions, storage)
   - Usage-based billing (partner pays per seat or per API call)
   - Revenue share (partner resells; QA Nexus takes 30-40% cut)
   - Partner dashboard (usage trends, customer breakdowns, billing)

5. **Partner Enablement Kit (Post-Launch)**
   - Sales playbook ("How to Sell White-Label QA Nexus")
   - Case studies + ROI calculator
   - Co-sell program (joint GTM with QA Nexus)

### Out-of-Scope
- Custom integrations per partner (no bespoke API endpoints)
- Self-hosted white-label (white-label partners must use QA Nexus cloud)
- White-label mobile apps (web/browser only)

---

## 4. Phasing

**Q1:** Custom domains, logo/color branding  
**Q2:** Advanced CSS customization, embeddable widgets  
**Q3:** White-label API, usage metering, billing integration, partner enablement  

**Exit Criteria:** Domains live, branding tested (partner logo visible everywhere), widgets embeddable, ≥3 partners signed up

---

## 5. Task Breakdown

| Quarter | Domains | Branding | Widgets | Metering | Partner Kit | Testing | Total |
|---------|---------|----------|---------|----------|---------|---------|--------|
| Q1 | 10 | 13 | — | — | — | 5 | 28 |
| Q2 | — | 8 | 13 | — | — | 5 | 26 |
| Q3 | — | — | — | 13 | 8 | 8 | 29 |
| **Total** | **10** | **21** | **13** | **13** | **8** | **18** | **83** |

---

## 6. API & Contracts

```
POST /api/v1/white-label/config
  Request: {
    partner_id, 
    custom_domain: "acme-qa.com",
    branding: { logo_url, colors: { primary, secondary } },
    api_key_prefix: "acme_"
  }
  Response: { white_label_id, status: "active", domain_verified: true }

POST /api/v1/white-label/embed-token
  Request: { widget_type: "dashboard", user_email, expires_in_hours: 24 }
  Response: { embed_token, widget_url: "https://acme-qa.com/embed/abc123" }

GET /api/v1/white-label/usage-metrics
  Request: { partner_id, date_range, granularity: "daily" }
  Response: {
    metrics: [
      { date, api_calls, active_users, storage_gb, estimated_cost_usd }
    ]
  }
```

---

## 7. Database Changes

| TB-ID | Table | Phase | Rationale |
|-------|-------|-------|-----------|
| TB-081 | white_label_partners | Q1 | Partner config (domain, branding, billing) |
| TB-082 | white_label_branding | Q1 | Logo, colors, CSS per partner |
| TB-083 | white_label_usage_meters | Q3 | API call count, user count, storage per partner |
| TB-084 | white_label_embed_tokens | Q2 | Secure embed tokens (OAuth flow) |

---

## 8. Embedding Architecture

**Iframe-based embedding:**
- Embed URL: `https://acme-qa.com/embed/:widget_type/:widget_id?token=:embed_token`
- OAuth delegated auth (partner's user logs in via partner, embed token grants access)
- No cross-origin cookie sharing (secure iframe sandbox)
- Styling: Partner CSS vars injected into iframe (colors, fonts)

---

## 9. Test Strategy

**Unit Tests:** Domain routing, logo/color application, token generation  
**Integration Tests:** Custom domain → branding applied, embed widget → data visible  
**E2E Tests:** Partner signs up → custom domain live → embeds dashboard in own portal → customers use it  
**Security:** Embed token expiry, iframe sandbox, no data leakage to parent window  
**Performance:** Embed widget load time <3s, metering API <500ms  

---

## 10. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Partner brand confusion (customers think QA Nexus owns data, not partner) | Low | Medium | (1) White-label TOS clarifies partner is responsible; (2) Partner branding prominent; (3) Data residency per partner org |
| Revenue leakage (partner underreports usage, underpays) | Medium | Medium | (1) API metering automatic (no manual reporting); (2) Usage disputes via audit log; (3) SLA: accurate metering ±2% |
| Embed widget performance issues (slow parent page due to iframe) | Medium | Medium | (1) Lazy-load embeds; (2) Max embed size limits; (3) Performance SLA: embed load <3s |
| Partner support burden (partners request custom branding beyond CSS) | Medium | Low | (1) Standard CSS only (no component changes); (2) Escalation to design partner team; (3) Scope creep clause in agreements |
| Multi-tenant data isolation breach (partner A sees partner B's branding/customers) | Low | Critical | (1) RLS audit pre-launch; (2) Per-partner org isolation (guaranteed by Multi-Tenant SaaS); (3) Pen test Q3 |

---

## 11. Observability

**Metrics:** White-label partners count, active white-label users, API usage per partner, white-label revenue, embed widget usage

**Dashboard:** White-Label Health (partner activation rate, usage per partner, revenue trends)

**OTel:** Custom domain DNS resolution time, embed token generation latency, metering accuracy

---

## 12. Definition of Done

**Q1:** Custom domains live, branding engine working (logo + colors applied everywhere), feature flag enabled  
**Q2:** Embeddable widgets tested (embed dashboard, reports in iframe), widget loading <3s  
**Q3:** Usage metering live, billing integration tested, partner enablement kit (playbook, case studies) complete, ≥3 partners signed up

---

## 13. Appendix

**References:** PROJECT_ROADMAP.md v1.1 (PM4 White-Label), Multi-Tenant SaaS (PM4-MTS-001) for per-partner isolation

**Partner Enablement:** Sales playbook (positioning, deal structure, margin), case studies (2–3 reference customers), co-marketing agreement template, ROI calculator

**Compliance:** White-label TOS (partner liability for customer data), data residency (per-partner region), IP ownership (QA Nexus retains platform IP, partner owns customizations)

---

**Target Line Count:** ≥700 | **Current estimate:** ~650**
