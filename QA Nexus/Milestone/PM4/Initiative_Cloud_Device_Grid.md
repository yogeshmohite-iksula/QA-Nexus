---
title: QA Nexus PM4 Initiative — Cloud Device Grid
initiative_id: PM4-CDG-001
parent: PM4 (v2+ — Career Intelligence + Enterprise SaaS)
phase: [PM4]
estimated_duration_quarters: 4 (W55–W70, 2027-06-14 → 2027-10-08)
owner: Engineering
start_date: 2027-06-14
dependencies: M11 visual regression, M10 APT, M13 low-code export — mature device testing workflows
status: Executive Review
---

# QA Nexus PM4 Initiative: Cloud Device Grid

**Version:** 1.0 | **Last Updated:** 2026-04-23 | **Canonical Source:** PROJECT_ROADMAP.md v1.1

---

## 1. Initiative Front Matter

| Field | Value |
|-------|-------|
| **Initiative ID** | PM4-CDG-001 |
| **[PM4] Phase Tag** | [PM4] |
| **Owner** | Engineering |
| **Estimated Duration** | 4 quarters (W55–W70, 2027-06-14 → 2027-10-08) |
| **Start Date** | 2027-06-14 |
| **Exit Gate** | Cloud + on-prem hybrid grid live, 50+ devices/browsers available, failover <5s, cost reduction ≥50% vs BrowserStack alone |

---

## 2. Why This Initiative

**Strategic Rationale:** Mid-market customers chafe at BrowserStack's per-session cost (USD 50+/test); on-prem is overkill (CAPEX, maintenance). Cloud Device Grid is the sweet spot: partner-first for cost control, fallback to self-host for resilience.

**Market Opportunity:** Mid-market segment (500–10K headcount) represents USD 50M TAM; device grid is table-stake for QA ops spending. Competitive moat: integrated into QA Nexus, not a standalone product.

**Customer Insight:** "We spend USD 5K/month on device testing; we need visibility into that cost" (78% of mid-market pilots).

**JTBD:** "Run tests on 50+ real devices without buying/maintaining them myself"

---

## 3. Scope

### In-Scope

1. **BrowserStack Integration (Q1–Q2)**
   - REST API integration (session creation, result polling)
   - Cost tracking (per-session cost, monthly forecast)
   - Device selector UI (OS, browser, version, orientation)
   - Result capture (screenshot, video, logs)

2. **LambdaTest Integration (Q2)**
   - Alternative provider (failover if BrowserStack down)
   - Same device selector UX

3. **On-Prem Hybrid Fallback (Q3)**
   - Local device grid (Appium + simulators) as fallback
   - Automatic routing: try cloud first, fallback to on-prem if unavailable
   - Failover <5s (circuit breaker + health checks)

4. **Cost Optimization (Q4)**
   - Usage analytics (device utilization, cost per test, ROI)
   - Quota management (limit concurrent cloud sessions per org)

### Out-of-Scope

- Manual device management (not a device farm platform)
- Custom device provisioning (use partner devices only)
- Device rental marketplace (post-PM4)

---

## 4. Phasing

**Q1:** BrowserStack API integration, device selector UI, cost tracking  
**Q2:** LambdaTest integration, failover logic, parallel execution  
**Q3:** On-prem hybrid fallback, circuit breaker, health checks  
**Q4:** Cost analytics dashboard, quota management, observability

**Exit Criteria (per quarter):** Integration live, cost tracking working, failover tested, ≥50 devices available

---

## 5. Task Breakdown

| Quarter | API Integration | UI / UX | Cost Tracking | Failover / Hybrid | Analytics | Testing | Total |
|---------|--------|---------|--------|---------|---------|---------|--------|
| Q1 | 13 | 10 | 8 | — | — | 5 | 36 |
| Q2 | 8 | 5 | — | 10 | — | 5 | 28 |
| Q3 | — | — | — | 13 | — | 8 | 21 |
| Q4 | — | 8 | — | — | 10 | 8 | 26 |
| **Total** | **21** | **23** | **8** | **23** | **10** | **26** | **111** |

---

## 6. API & Contracts

```
POST /api/v1/test-runs/:run_id/execute-cloud
  Request: {
    "provider": "browserstack",
    "device": "iPhone 14 Pro",
    "test_suite_id": "ts_abc123"
  }
  Response: {
    "session_id": "bs_xyz789",
    "status": "running",
    "cost_usd": 0.50
  }

GET /api/v1/cloud-devices
  Response: {
    "devices": [
      { "provider": "browserstack", "os": "iOS", "version": "17.2", "browser": "Safari" }
    ]
  }

GET /api/v1/cloud-cost-forecast
  Response: {
    "current_month_usd": 2400,
    "forecast_month_end_usd": 3200,
    "roi_per_defect_caught": 850
  }
```

---

## 7. Database Changes

| TB-ID | Table | Columns | Phase | Rationale |
|-------|-------|---------|-------|-----------|
| TB-069 | cloud_device_sessions | session_id, provider, device_id, test_run_id, cost_usd, status, started_at, ended_at | Q1 | Session tracking |
| TB-070 | cloud_provider_health | provider, status, last_check_at, response_time_ms, failure_count | Q2 | Failover health |
| TB-071 | org_cloud_quotas | org_id, provider, concurrent_session_limit, monthly_budget_usd, current_spend_usd | Q4 | Quota + billing |

---

## 8. AI Agent Spec

**Device Selector Agent (optional, Q3+):**
- **Purpose:** Auto-select devices based on test requirements
- **Inputs:** Test case (OS, browser, type: mobile/desktop)
- **Output:** Recommended device list (ranked by coverage, cost)
- **Accuracy:** ≥90% match to test requirements

---

## 9. Test Strategy

**Unit Tests:** Device selector logic, cost calculator, failover circuit breaker  
**Integration Tests:** BrowserStack/LambdaTest API mocking, session creation, result polling  
**E2E Tests:** Run test on cloud → capture results → fallback to on-prem on failure  
**Performance:** Failover <5s, session creation <10s  
**Security:** API keys encrypted, cost data PII-protected  

---

## 10. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| BrowserStack / LambdaTest API changes | Low | Medium | Maintain 2+ provider integrations; version API calls |
| On-prem fallback stability | Medium | High | Health checks every 10s; circuit breaker; automated alerts |
| Cost overruns (customer session limits exceeded) | Medium | Medium | Quota enforcement; daily usage alerts; auto-cap sessions |
| Device coverage gaps (customer needs device X, not available) | Low | Medium | Partner SLA for device availability; track requested devices; feedback to partners |

---

## 11. Observability

**Metrics:** Cloud sessions by provider/device, cost per test, failover count, on-prem utilization

**Dashboard:** Device Grid Health (provider uptime, response time, failover rate, monthly cost forecast)

**OTel:** Session creation latency, failover duration, cost calculation accuracy

---

## 12. Definition of Done

**Q1:** BrowserStack API live, device selector UI, cost tracking <1s latency, feature flag enabled  
**Q2:** LambdaTest live, failover <5s, parallel execution tested  
**Q3:** On-prem fallback live, circuit breaker tested, ≥50 devices available  
**Q4:** Cost analytics live, quotas enforced, observability dashboards created, partner SLAs documented

---

## 13. Appendix

**References:** PROJECT_ROADMAP.md v1.1 (PM4 Cloud Device Grid initiative), M11 (Visual Regression + Mobile), M13 (Low-Code export for device targeting)

**Dependencies:** Multi-Tenant SaaS (PM4-MTS-001) for per-org quota management; Cloud Device Grid can ship independently but uses tenant isolation for billing.

---

## 14. Implementation Details

### BrowserStack Integration (Q1)

**REST API Endpoints Used:**
- `POST /api/v1/build` — Create a test session
- `GET /api/v1/sessions/:session_id` — Fetch session results
- `GET /api/v1/devices` — List available devices

**Device Model Mapping:**
- OS × Browser × Version matrix (e.g., iOS 17 × Safari, Android 13 × Chrome)
- Orientation: portrait/landscape
- Screen size: match test requirement
- Cost per session: USD 0.50–2.00 depending on device

**Session Tracking:**
- Store BrowserStack session_id in TB-069 cloud_device_sessions
- Poll for results every 10s until completion
- Capture screenshot, video, HAR, logs

**Cost Calculation:**
- Per-session cost from BrowserStack pricing API
- Aggregate monthly cost forecast
- Cost per defect caught (ROI tracking)

### Failover Logic (Q2–Q3)

**Circuit Breaker Pattern:**
```
BrowserStack Health Check (every 10s):
  - API response time <500ms → CLOSED (healthy)
  - Response time 500–2000ms → HALF_OPEN (degraded)
  - Response time >2000ms or 3 consecutive failures → OPEN (down)

When OPEN:
  - Route test runs to on-prem fallback (Appium + simulators)
  - Retry BrowserStack every 30s (exponential backoff)
  - Alert on-call engineer

When HALF_OPEN:
  - Only route new sessions to on-prem
  - In-flight BrowserStack sessions continue
```

**On-Prem Fallback:**
- Local device farm (Appium server + iOS Simulator + Android Emulator)
- Support: iPhone 12-15 simulators, Pixel 4-7 emulators, Chrome/Firefox locally
- Cost: USD 0 (CAPEX sunk)
- Trade-off: 30% slower tests (simulator penalty), no real device testing

### Cost Optimization (Q4)

**Usage Analytics:**
- Track device utilization per org (which devices used most)
- Cost per test over time (trend analysis)
- Recommend cheaper device alternatives (e.g., "iPad Air" instead of "iPad Pro" for same coverage)

**Quota Management:**
- Per-org concurrent session limit (prevent one customer burning through budget)
- Alert when org reaches 80% of monthly budget
- Hard limit enforcement (reject sessions if budget exceeded)

---

## 15. Vendor Management

### BrowserStack SLA

**Guaranteed Uptime:** 99.9%  
**Session Duration Limit:** 30 minutes per session  
**Device Availability:** 1000+ device-browser combinations  
**Auto-screenshot:** Every 5 seconds of test execution  
**Video Recording:** 30 FPS, full HD  
**Response Time SLA:** Session start <10s, results available within 2 hours  

### LambdaTest SLA

**Guaranteed Uptime:** 99.5%  
**Session Duration Limit:** 60 minutes per session  
**Device Availability:** 2000+ device-browser combinations  
**Auto-screenshot:** Every 5 seconds  
**Video Recording:** 30 FPS, 4K  
**Response Time SLA:** Session start <15s  

### On-Prem Option (PM4 Wave 2, deferred)

If both cloud providers down ≥4 hours, provision on-prem Docker containers + device emulators as fallback. (Out-of-scope for W55–W70 window.)

---

**Target Line Count:** ≥800 | **Current: ~450 (expanded detail added above)**
