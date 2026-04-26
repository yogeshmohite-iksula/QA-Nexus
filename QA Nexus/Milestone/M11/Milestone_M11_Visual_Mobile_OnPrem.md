---
milestone_id: M11
parent_project_milestone: PM2
name: "Visual Regression + Mobile + On-Prem Deployment"
version: 2.0
date: 2026-04-23
phase: v1.5
window: "W11–13 of PM2"
start_date: 2026-12-01
end_date: 2026-12-19
duration_weeks: 3
status: "Build-Ready"
---

# MILESTONE M11: VISUAL REGRESSION + MOBILE + ON-PREM DEPLOYMENT

**Organization:** Iksula Services Pvt Ltd  
**Milestone:** M11 (Weeks 11–13 of PM2)  
**Version:** 2.0 (Build-Ready)  
**Date Created:** 2026-04-22  
**Date Updated:** 2026-04-23  
**Status Badge:** Planning → Build-Ready  
**Duration:** 3 weeks (2026-12-01 → 2026-12-19)  
**Scope:** 3 independent sub-features in 1 milestone (visual regression, mobile app, on-prem deployment)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Context: PM2 Progression](#2-context-pm2-progression)
3. [Definition of Ready (DoR)](#3-definition-of-ready-dor)
4. [M11 Scope: 3 Sub-Features](#4-m11-scope-3-sub-features)
5. [Tech Stack](#5-tech-stack-m11-specific)
6. [Database Changes](#6-database-changes-m11)
7. [API Contracts (EP-IDs)](#7-api-contracts-ep-ids)
8. [Sub-Feature 1: Visual Regression](#8-sub-feature-1-visual-regression)
9. [Sub-Feature 2: Mobile App (iOS/Android)](#9-sub-feature-2-mobile-app-iosandroid)
10. [Sub-Feature 3: On-Prem Deployment](#10-sub-feature-3-on-prem-deployment)
11. [Feature & Task Breakdown](#11-feature--task-breakdown)
12. [Test Strategy](#12-test-strategy)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Rollback & Fallback](#14-rollback--fallback)
15. [Observability & Telemetry](#15-observability--telemetry)
16. [Handoff & Definition of Done](#16-handoff--definition-of-done)

---

## 1. EXECUTIVE SUMMARY

M11 is a **3-in-1 milestone** shipping three foundational capabilities: visual regression testing, native mobile app (iOS/Android), and air-gapped on-prem deployment. Each feature is independently valuable and ships in parallel.

**Mission:** Extend QA Nexus beyond web E2E testing (visual validation), enable mobile QA (native iOS/Android), and unlock enterprise deployment (on-prem for air-gapped networks + regulated industries).

**Key Deliverables:**
- **Visual Regression:** In-house Playwright screenshot diff (pixel + perceptual) + optional partner hybrid (Percy/Applitools hook for enterprise)
- **Mobile App:** Native iOS (Swift) and Android (Kotlin) shells wrapping Next.js PWA; Capacitor bridge for offline support, biometric auth, push notifications
- **On-Prem Deployment:** Helm chart (Kubernetes) + air-gapped install + Ollama local LLM + customer-managed encryption (KMS)

**Success Criteria:**
- Visual diff accuracy ≥90% (low false-positive rate)
- Mobile app functional (iOS App Store / Android Play Store pilot submission)
- On-prem deployment <4 hours on prepared cluster; offline-first functionality tested
- ≥1 customer deployed on-prem (pilot by M12 GA)

---

## 2. CONTEXT: PM2 PROGRESSION

**M7–M10 Summary:**
- **M7 (A6 Test Data):** Synthetic data generation live; used by APT for E2E setup
- **M8 (A7 Self-Healing):** Flaky test suggestions + HITL gate operational
- **M9 (A8 Advanced):** Risk-adaptive test planning from code churn live
- **M10 (APT):** Autonomous E2E discovery + execution + exploratory testing live; finds new bugs

**M11 Role in PM2:** Extends test execution breadth: visual validation (UI regressions), mobile platform coverage, enterprise deployment options.

---

## 3. DEFINITION OF READY (DoR)

**Prerequisites for Viable M11 Kickoff:**

1. M10 (APT) stable (scenario discovery + execution operational)
2. Playwright runner (M5) mature and optimized (headless execution <2s)
3. Frontend (Next.js) responsive design validated (mobile-friendly layouts tested)
4. A7 self-healing (M8) applied to visual steps (detect flaky screenshots)
5. Kubernetes test environment prepared (1 cluster for on-prem testing)
6. Helm package management tooling + knowledge available (DevOps team trained)
7. Ollama Gemma 4 bundle (weights) prepared for air-gapped distribution
8. iOS/Android development environment setup (Xcode, Android Studio, Capacitor CLI)
9. Figma + design tokens exported (visual baseline from design system)
10. Mock on-prem customer environment setup (air-gapped network, no internet)

---

## 4. M11 SCOPE: 3 SUB-FEATURES

### Sub-Feature 1: Visual Regression (Weeks 1–2)

**Goal:** Capture + compare UI screenshots per test case/scenario; detect regressions.

**Default Strategy (In-House, Playwright-based):**
- Playwright screenshot capture at each test step + full-page on success/failure
- Pixel-level diff (OpenCV) + perceptual hash (SSIM)
- Baseline management: per-branch, per-viewport, per-theme (light/dark mode)
- Approval workflow: Review proposed changes before committing as new baseline
- Integration with A7: Detect flaky screenshots (noise), suggest stable locators

**Optional Partner Hybrid (For Enterprise):**
- Percy API hook: Send screenshot → Percy generates visual report
- Applitools Eyes hook: Alternative perceptual engine
- Decision: Default to in-house; offer partner integration as premium feature (not M11 scope, deferred to M12 or PM3)

**Scope (M11):** In-house engine only; partner hooks deferred.

---

### Sub-Feature 2: Mobile App (iOS + Android) (Weeks 1–3)

**Goal:** Native mobile shells (iOS + Android) wrapping QA Nexus PWA.

**Tech Stack:**
- **Capacitor:** Cross-platform bridge (JavaScript ↔ native iOS/Android)
- **iOS:** Swift + SwiftUI (biometric auth, push notifications, offline storage)
- **Android:** Kotlin + Jetpack Compose (biometric auth, FCM for push, Room DB for offline)
- **Next.js PWA:** Existing frontend + service worker (offline-first PWA support)

**Key Capabilities:**
- **Authentication:** Biometric (Face ID / fingerprint) for RBAC-sensitive actions (approve test case, file defect)
- **Offline-First:** View test cases + docs without internet; queue writes; sync on reconnect
- **Push Notifications:** Defect assigned, test run complete, approval requested
- **Pilot Submission:** TestFlight (iOS) + Internal Track (Android) for beta pilots

**Scope (M11):** Build native shells, biometric auth, offline support, push integration. App Store/Play Store submission in M12.

---

### Sub-Feature 3: On-Prem Deployment (Weeks 2–3)

**Goal:** Helm chart for Kubernetes on-prem installation; air-gapped networking.

**Architecture:**
- **Helm Chart:** Deploys: Next.js frontend, NestJS API, FastAPI inference, PostgreSQL 15, Redis 7, Ollama Gemma 4, MinIO (S3-compatible object store)
- **Network:** Air-gapped (no internet required after initial image pull)
- **Data Encryption:** Customer-managed KMS key for at-rest encryption
- **Audit Logging:** Export audit log to customer SIEM (syslog endpoint configurable)
- **Deployment Time:** <4 hours on prepared 3-node Kubernetes cluster

**Scope (M11):** Helm chart, smoke test, install guide, upgrade guide from cloud→on-prem.

---

## 5. TECH STACK (M11-SPECIFIC)

| Component | Version | Purpose | Status | Milestone |
|-----------|---------|---------|--------|-----------|
| **Playwright** | 1.48+ | Screenshot capture for visual regression | Live (M5+) | M11 |
| **OpenCV** | 4.8+ | Pixel-level image diff + SSIM perceptual hash | New | M11 |
| **Capacitor** | 5.x | iOS/Android bridge for PWA | New | M11 |
| **Swift** | 5.9+ | iOS native shell + biometric auth | New | M11 |
| **Kotlin** | 1.9+ | Android native shell + biometric auth | New | M11 |
| **Helm** | 3.12+ | Kubernetes package manager | New | M11 |
| **MinIO** | Latest | S3-compatible object store (on-prem) | New | M11 |
| **Ollama** | 2026-04 | Local LLM (Gemma 4 26B MoE weights bundled) | Live (M0+) | M11 (bundled) |
| **PostgreSQL 15** | 15.x | On-prem data store | Live (M0+) | M11 |
| **Redis 7** | 7.x | On-prem cache | Live (M0+) | M11 |

---

## 6. DATABASE CHANGES (M11)

### New Tables

**TB-050: visual_baselines** (Screenshot baselines per test case)
```sql
CREATE TABLE visual_baselines (
  baseline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES test_cases(id),
  branch VARCHAR(255) DEFAULT 'main',
  viewport_width INT,
  viewport_height INT,
  theme VARCHAR(32) DEFAULT 'light', -- light, dark
  screenshot_url VARCHAR(2048),
  screenshot_hash VARCHAR(64), -- SHA-256 for dedup
  perceptual_hash VARCHAR(64), -- SSIM hash
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (test_case_id, branch, viewport_width, theme),
  UNIQUE (test_case_id, branch, viewport_width, theme)
);
```

**TB-051: visual_diffs** (Comparison results: baseline vs. actual)
```sql
CREATE TABLE visual_diffs (
  diff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID NOT NULL REFERENCES test_results(id),
  baseline_id UUID NOT NULL REFERENCES visual_baselines(baseline_id),
  actual_screenshot_url VARCHAR(2048),
  diff_image_url VARCHAR(2048), -- Highlighted differences
  pixel_diff_percentage NUMERIC(5,2), -- 0–100%
  perceptual_similarity NUMERIC(3,2), -- 0.00–1.00 (SSIM)
  status VARCHAR(32) DEFAULT 'pending_review', -- pending_review, approved_new_baseline, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (test_result_id, status),
  INDEX (created_at DESC)
);
```

**TB-052: mobile_app_configs** (iOS/Android app configuration + versioning)
```sql
CREATE TABLE mobile_app_configs (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_platform VARCHAR(16) NOT NULL, -- ios, android
  app_version VARCHAR(32),
  bundle_id VARCHAR(255), -- com.iksula.qa_nexus
  build_number INT,
  api_endpoint_override VARCHAR(255), -- for on-prem URLs
  biometric_enabled BOOLEAN DEFAULT TRUE,
  offline_sync_enabled BOOLEAN DEFAULT TRUE,
  push_notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (app_platform, app_version)
);
```

**TB-053: on_prem_deployments** (Customer on-prem instances for audit + license tracking)
```sql
CREATE TABLE on_prem_deployments (
  deployment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  customer_id UUID REFERENCES organizations(id),
  deployment_url VARCHAR(255),
  kubernetes_cluster_name VARCHAR(255),
  deployed_by UUID NOT NULL REFERENCES users(id),
  deployed_at TIMESTAMP,
  helm_chart_version VARCHAR(32),
  airgap_mode BOOLEAN DEFAULT TRUE,
  kms_key_id_encrypted VARCHAR(255), -- Encrypted reference to customer KMS key
  audit_log_destination VARCHAR(255), -- syslog endpoint or S3 bucket
  status VARCHAR(32) DEFAULT 'active', -- active, maintenance, archived
  last_health_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (customer_id, status),
  INDEX (deployed_at DESC)
);
```

### Modified Tables

**test_results:**
- Add `visual_diff_id UUID REFERENCES visual_diffs(diff_id)` — link test result to visual comparison

---

## 7. API CONTRACTS (EP-IDs)

### Visual Regression APIs

**EP-057 POST `/api/v1/visual/baselines` — Create/update visual baseline**
```json
Request:
{
  "test_case_id": "case-123",
  "branch": "main",
  "viewport": { "width": 1920, "height": 1080 },
  "theme": "light",
  "screenshot_url": "https://r2.acme.com/baseline-001.png"
}

Response:
{
  "baseline_id": "vb-001",
  "test_case_id": "case-123",
  "branch": "main",
  "screenshot_hash": "sha256:abc123...",
  "perceptual_hash": "ssim:def456...",
  "created_at": "2026-12-05T10:00:00Z"
}
```

**EP-058 POST `/api/v1/visual/compare` — Compare screenshot vs. baseline (async)**
```json
Request:
{
  "test_result_id": "tr-001",
  "baseline_id": "vb-001",
  "actual_screenshot_url": "https://r2.acme.com/actual-001.png"
}

Response (202 Accepted):
{
  "diff_id": "vd-001",
  "status": "queued"
}

Polling GET `/api/v1/visual/diffs/:diff_id`:
{
  "diff_id": "vd-001",
  "test_result_id": "tr-001",
  "pixel_diff_percentage": 2.3,
  "perceptual_similarity": 0.98,
  "diff_image_url": "https://r2.acme.com/diff-overlay-001.png",
  "status": "pending_review"
}
```

**EP-059 POST `/api/v1/visual/diffs/:diff_id/approve` — HITL: approve new baseline or reject**
```json
Request:
{
  "action": "approve_new_baseline", -- or "reject"
  "reason": "Design update approved in PR #456"
}

Response:
{
  "diff_id": "vd-001",
  "status": "approved_new_baseline",
  "baseline_id_updated": "vb-002",
  "reviewed_at": "2026-12-05T10:30:00Z"
}
```

### Mobile App APIs

**EP-060 GET `/api/v1/mobile/config/:platform` — Get mobile app configuration**
```json
Response:
{
  "platform": "ios",
  "app_version": "1.5.0",
  "bundle_id": "com.iksula.qa_nexus",
  "api_endpoint": "https://api.qa-nexus.com",
  "biometric_enabled": true,
  "offline_sync_enabled": true
}
```

**EP-061 POST `/api/v1/mobile/biometric-auth` — Biometric authentication (Face ID / fingerprint)**
```json
Request:
{
  "platform": "ios",
  "biometric_token": "encrypted_face_id_data",
  "user_email": "user@acme.com"
}

Response:
{
  "session_token": "jwt:...",
  "user_id": "user-123",
  "expires_at": "2026-12-06T10:00:00Z"
}
```

**EP-062 POST `/api/v1/mobile/sync-queue` — Sync offline-queued writes**
```json
Request:
{
  "platform": "android",
  "user_id": "user-123",
  "queued_actions": [
    { "action_type": "create_test_case", "payload": {...}, "timestamp": "..." },
    { "action_type": "file_defect", "payload": {...}, "timestamp": "..." }
  ]
}

Response:
{
  "synced_count": 2,
  "failures": [],
  "last_sync": "2026-12-05T10:00:00Z"
}
```

**EP-063 POST `/api/v1/mobile/push-registration` — Register device for push notifications**
```json
Request:
{
  "platform": "ios",
  "device_token": "fcm:or:apns:token",
  "user_id": "user-123"
}

Response:
{
  "registration_id": "reg-001",
  "status": "active"
}
```

### On-Prem Deployment APIs

**EP-064 GET `/api/v1/onprem/health` — Deployment health check**
```json
Response:
{
  "status": "healthy",
  "components": {
    "postgresql": "up",
    "redis": "up",
    "ollama": "up",
    "minio": "up",
    "api": "up"
  },
  "timestamp": "2026-12-05T10:00:00Z"
}
```

**EP-065 POST `/api/v1/onprem/audit-export` — Export audit log to SIEM**
```json
Request:
{
  "destination_type": "syslog",
  "destination_host": "siem.acme.com",
  "destination_port": 514,
  "start_date": "2026-12-01",
  "end_date": "2026-12-05"
}

Response:
{
  "export_job_id": "exp-001",
  "status": "queued",
  "estimated_events": 15000
}
```

---

## 8. SUB-FEATURE 1: VISUAL REGRESSION

### Overview

Capture screenshots during test execution; compare against per-branch baselines; detect UI regressions (color, layout, text, images).

### Architecture

```
Test Execution
    ↓
Playwright Screenshot (full-page)
    ↓
Query Visual Baseline (test_case_id, branch, viewport, theme)
    ↓
Visual Diff Engine (OpenCV pixel diff + SSIM perceptual)
    ↓
Store Diff + Highlight (TB-051: visual_diffs)
    ↓
HITL Review: Approve New Baseline or Reject
    ↓
Update TB-050 (visual_baselines) if approved
```

### Tasks (W1–2)

**VR-T001: Visual Baseline Management**
- CRUD for visual_baselines table
- Per-branch + viewport + theme versioning
- Screenshot storage + lifecycle (90-day retention)

**VR-T002: Pixel-Level + Perceptual Diff Engine**
- OpenCV integration: compute pixel diff %
- SSIM (Structural Similarity Index) for perceptual matching
- Generate diff image (highlight changes) via OpenCV drawing

**VR-T003: Approval Workflow**
- Review UI: side-by-side baseline vs. actual
- Approve (commit as new baseline) or reject (test fails, investigate)
- Audit trail: reviewer + timestamp + reason

**VR-T004: A7 Self-Healing Integration**
- Detect flaky screenshots (noise, timing-dependent visual changes)
- Suggest stable locators or screenshot anchoring

---

## 9. SUB-FEATURE 2: MOBILE APP (iOS/ANDROID)

### Overview

Native iOS + Android apps wrapping QA Nexus PWA; offline-first with biometric auth + push notifications.

### Architecture

```
Capacitor (JavaScript Bridge)
    ├─ iOS: Swift + SwiftUI
    │   ├─ Biometric Auth (Face ID / Touch ID)
    │   ├─ Offline Storage (Core Data / SQLite)
    │   ├─ Push Notifications (APNs)
    │   └─ Deep Linking
    │
    └─ Android: Kotlin + Jetpack Compose
        ├─ Biometric Auth (BiometricPrompt)
        ├─ Offline Storage (Room DB)
        ├─ Push Notifications (FCM)
        └─ Deep Linking

Next.js PWA (Existing Frontend)
    ├─ Service Worker (offline cache)
    ├─ IndexedDB (offline queue for writes)
    └─ Sync Manager (reconcile on reconnect)
```

### Tasks (W1–3)

**MA-T001: iOS Native Shell (Swift + SwiftUI)**
- Create Xcode project; integrate Capacitor
- Biometric auth: Face ID setup
- Offline storage: Core Data for test cases + docs cache
- Push notification: APNs integration

**MA-T002: Android Native Shell (Kotlin + Jetpack Compose)**
- Create Android Studio project; integrate Capacitor
- Biometric auth: BiometricPrompt setup
- Offline storage: Room DB for caching
- Push notification: FCM integration

**MA-T003: Next.js PWA Service Worker + Offline Sync**
- Service Worker: cache test cases, docs, reports
- IndexedDB: queue offline writes (create case, file defect)
- Sync manager: reconcile queue on reconnect (conflict resolution)

**MA-T004: Biometric Authentication Bridge**
- Capacitor plugin: biometric_auth
- iOS: return Face ID token → server validates
- Android: return fingerprint token → server validates
- Flow: user taps "Approve Defect" → biometric prompt → server validates → action confirmed

**MA-T005: Push Notification Infrastructure**
- FCM (Android) + APNs (iOS) configuration
- Device token registration (EP-063)
- Notification payloads: defect assigned, run complete, approval requested
- Deeplink handling: notification tap → relevant screen in app

**MA-T006: Pilot Submission Kit**
- TestFlight: iOS beta distribution
- Google Play Internal Testing Track: Android beta
- App signing certificates + provisioning profiles
- Release notes, screenshots, app store descriptions

---

## 10. SUB-FEATURE 3: ON-PREM DEPLOYMENT

### Overview

Helm chart for Kubernetes on-prem installation; air-gapped networking; customer-managed encryption; audit log export.

### Architecture

```
Kubernetes Cluster (Customer-Managed)
    ├─ NestJS API (2–4 replicas)
    ├─ Next.js Frontend (2 replicas)
    ├─ FastAPI Inference (1 replica + Ollama sidecar)
    ├─ PostgreSQL 15 (StatefulSet, persistent volume)
    ├─ Redis 7 (StatefulSet)
    ├─ Ollama Gemma 4 (DaemonSet, model cache on node volumes)
    ├─ MinIO (S3-compatible, persistent volume for artifacts)
    └─ Ingress (TLS termination, customer domain)

Air-Gapped Setup:
    ├─ No external API calls (no Claude, no external LLM)
    ├─ Ollama Gemma 4 runs locally (bundled weights)
    ├─ All container images pre-loaded in cluster
    └─ Artifact storage: MinIO (no Cloudflare R2)
```

### Tasks (W2–3)

**OP-T001: Helm Chart Scaffolding**
- Chart structure: templates/, values.yaml, Chart.yaml
- Namespace isolation: qa-nexus-prod, qa-nexus-staging
- Resource requests/limits (CPU, memory per pod)
- Persistence: PVC for PostgreSQL, Redis, Ollama model cache

**OP-T002: PostgreSQL + Redis StatefulSets**
- PostgreSQL 15: primary + standby replication (optional)
- Redis: single-node or sentinel mode
- Data persistence: NFS or cloud block storage
- Backup strategy: daily snapshots to MinIO

**OP-T003: Ollama Gemma 4 Bundling + Distribution**
- Download model weights (~26GB for Gemma 4 26B MoE)
- Package in OCI image or tarball
- DaemonSet deployment: model cached on each node
- Fallback: if Ollama offline, use local inference (lightweight model)

**OP-T004: MinIO S3-Compatible Deployment**
- MinIO StatefulSet (3-node quorum for HA)
- S3 API compatibility: QA Nexus code unchanged
- Bucket structure: same as R2 (qaix-artifacts/{projectId}/...)
- Lifecycle policies: auto-delete >90-day artifacts

**OP-T005: Ingress + TLS Configuration**
- Kubernetes Ingress with customer domain
- TLS termination: customer cert or Let's Encrypt
- API endpoint: https://qa-nexus.customer.com/api
- Frontend: https://qa-nexus.customer.com

**OP-T006: Customer KMS Key Integration**
- Encryption at rest: DB + MinIO
- Customer provides KMS key (AWS KMS, Vault, Thales, etc.)
- QA Nexus code: abstract encryption provider interface
- Key rotation: supported in helm upgrade

**OP-T007: Audit Log Export to SIEM**
- Audit log schema: actions table in PostgreSQL
- Export job: daily batch to customer SIEM (syslog, S3, Elasticsearch)
- Endpoint: EP-065 (audit-export API)
- Compliance: GDPR, SOC2, HIPAA-ready

**OP-T008: Install Guide + Smoke Test**
- Prerequisites: K8s 1.24+, 3-node cluster, 16GB RAM per node
- Installation: `helm install qa-nexus qa-nexus-charts/qa-nexus -f values-customer.yaml`
- Smoke test: Create project → author case → run → verify dashboard
- Estimated time: <4 hours on prepared cluster
- Upgrade path: helm upgrade (zero-downtime for stateless services)

---

## 11. FEATURE & TASK BREAKDOWN

### Week 1: Visual Regression Core (2026-12-01 → 2026-12-07)

| Task | Title | Hours | Owner |
|------|-------|-------|-------|
| VR-T001 | Visual Baseline CRUD + Storage | 12 | Backend |
| VR-T002 | Pixel + Perceptual Diff Engine | 16 | Backend |
| MA-T001 | iOS Native Shell Setup | 20 | iOS Eng |
| MA-T002 | Android Native Shell Setup | 20 | Android Eng |
| OP-T001 | Helm Chart Scaffolding | 12 | DevOps |

### Week 2: Mobile App Core + On-Prem Infrastructure (2026-12-08 → 2026-12-14)

| Task | Title | Hours | Owner |
|------|-------|-------|-------|
| VR-T003 | Visual Diff Approval Workflow | 10 | Backend + Frontend |
| VR-T004 | A7 Self-Healing Integration | 8 | Backend |
| MA-T003 | PWA Service Worker + Offline Sync | 18 | Frontend |
| MA-T004 | Biometric Auth Bridge | 16 | iOS + Android + Backend |
| OP-T002 | PostgreSQL + Redis StatefulSets | 12 | DevOps |
| OP-T003 | Ollama Gemma 4 Bundling | 14 | DevOps |

### Week 3: Mobile App Completion + On-Prem Testing (2026-12-15 → 2026-12-19)

| Task | Title | Hours | Owner |
|------|-------|-------|-------|
| MA-T005 | Push Notification Infrastructure | 14 | Backend + iOS + Android |
| MA-T006 | Pilot Submission Kit | 10 | Mobile |
| OP-T004 | MinIO S3-Compatible Deployment | 12 | DevOps |
| OP-T005 | Ingress + TLS Configuration | 8 | DevOps |
| OP-T006 | Customer KMS Key Integration | 12 | Backend + DevOps |
| OP-T007 | Audit Log Export to SIEM | 10 | Backend + DevOps |
| OP-T008 | Install Guide + Smoke Test | 16 | DevOps + QA |

---

## 12. TEST STRATEGY

### Manual Testing

**Visual Regression:**
1. Capture baselines (5 key pages × 3 viewports × 2 themes = 30 baselines)
2. Intentionally introduce CSS changes; run comparison
3. Verify pixel diff % accurate
4. Verify SSIM perceptual score (0.98+ for minor spacing, 0.90+ for color change)
5. Test HITL approval: approve new baseline, reject false positive

**Mobile App:**
1. iOS: Install via TestFlight; test auth (Face ID), offline case viewing, push notification
2. Android: Install via Internal Track; test auth (fingerprint), offline case viewing, push notification
3. Offline sync: Queue 5 actions offline → reconnect → verify synced

**On-Prem Deployment:**
1. Provision 3-node K8s cluster (minikube or cloud provider)
2. Deploy via Helm: `helm install qa-nexus...`
3. Smoke test: project creation, case authoring, run execution
4. Verify audit log export to mock SIEM (syslog server)
5. Verify offline Ollama inference works

### E2E Testing (Playwright)

- Visual regression test: baseline capture → diff → approval
- Mobile (via Appium): biometric auth, offline queue, push notification
- On-prem: health check API, audit export API

### Load Testing

- Visual diff on 100 concurrent test results
- Push notification delivery to 500 devices
- On-prem: Helm chart scales to 3 API replicas + PostgreSQL replication

---

## 13. RISKS & MITIGATIONS

| Risk | Impact | Likelihood | Mitigation | Owner |
|------|--------|------------|-----------|-------|
| **Visual diff false positives** (minor rendering noise flagged as regression) | Test noise, user frustration | Medium | SSIM threshold tuning; A7 flaky screenshot detection | Backend |
| **Mobile app app-store rejection** (privacy/security policy issues) | Delay pilot customers | Low | Legal review early (W1); privacy policy + security checklist | Product + Legal |
| **On-prem network isolation** (Ollama model download fails in air-gapped) | Installation blocked | Medium | Pre-bundle model weights; fallback to lightweight local model | DevOps |
| **MinIO bucket quota exceeded** (artifact storage fills quickly) | On-prem deployment runaway costs | Low | Lifecycle policies (90-day auto-delete); quota enforcement per project | DevOps |
| **PostgreSQL replication lag** (on-prem standby gets stale) | Data loss risk | Low | Synchronous replication mode; RTO/RPO targets in docs | DevOps |
| **Biometric auth timeout** (Face ID takes >10s) | UX degradation | Low | Timeout + fallback to password | Mobile Eng |
| **KMS key rotation breaks encryption** (old data unreadable) | Data loss | Low | Test key rotation in staging; document process | Backend + DevOps |

---

## 14. ROLLBACK & FALLBACK

### Feature Flags

- `visual_regression.enabled` — Dark-launch visual diffs; review UI disabled until flag on
- `mobile_app.ios_testflight` — iOS app available for TestFlight beta
- `mobile_app.android_internal_track` — Android app available for internal testing
- `onprem_deployment.helm_chart_available` — Helm chart published to repo

### Fallback Paths

1. **Visual diff fails:** Store actual screenshot; don't fail test; mark as "review needed"
2. **Mobile biometric auth times out:** Fallback to password entry
3. **On-prem Ollama offline:** Use lightweight local model; inference slower but operational
4. **MinIO quota exceeded:** Archive old artifacts to customer-provided S3 bucket

### Rollback Decision Gate (M12)

- If visual diff false-positive rate >20%, disable visual regression in favor of manual review
- If mobile app crashes >5%, defer app store submission to M12 or PM3
- If on-prem deployment takes >6 hours, defer to PM3 for automation improvements

---

## 15. OBSERVABILITY & TELEMETRY

### Metrics

**Visual Regression:**
- `visual_diffs_created_total` (counter)
- `visual_diff_accuracy` (gauge, % matches ground truth)
- `visual_baseline_approval_rate` (gauge, % approved vs. reviewed)

**Mobile App:**
- `mobile_app_installs_total` (counter, per platform)
- `mobile_app_crash_rate` (gauge, %)
- `mobile_biometric_auth_success_rate` (gauge, %)
- `mobile_offline_sync_queue_depth` (gauge)

**On-Prem Deployment:**
- `onprem_deployments_active` (gauge, # customers)
- `onprem_cluster_health_status` (gauge, per component)
- `onprem_audit_export_job_duration_seconds` (histogram)
- `onprem_artifact_storage_usage_bytes` (gauge)

### Alarms

- `visual_diff_accuracy < 85%` → P2 alert
- `mobile_crash_rate > 5%` → P1 alert
- `onprem_cluster_health < healthy` → P1 alert

---

## 16. HANDOFF & DEFINITION OF DONE

### Exit Criteria (M11 DoD)

1. ✅ Visual regression engine operational (EP-057–059 deployed, ≥90% diff accuracy)
2. ✅ Visual baseline approval workflow live (HITL review UI, audit trail)
3. ✅ iOS app submitted to TestFlight (biometric auth, offline caching tested)
4. ✅ Android app submitted to Internal Track (biometric auth, offline caching tested)
5. ✅ Push notification infrastructure live (defect + run notifications sent)
6. ✅ Helm chart deployed to test cluster (smoke test passed, <4 hour install time)
7. ✅ On-prem PostgreSQL + Redis + MinIO + Ollama operational
8. ✅ Audit log export to SIEM working (EP-065)
9. ✅ Customer KMS key integration proven (at-rest encryption functional)
10. ✅ Installation guide + upgrade guide published
11. ✅ Mobile app offline sync tested (queue → reconnect → merge)
12. ✅ A7 self-healing applied to visual steps
13. ✅ Feature flags deployed (dark-launch ready)
14. ✅ Zero P0 defects; <2 P1 defects
15. ✅ Observability dashboards live (SigNoz + Langfuse)

### Handoff Artifacts

- **Visual Regression API:** OpenAPI spec (EP-057–059)
- **Mobile App Deployment Kit:** TestFlight + Internal Track instructions; app signing guide
- **Helm Chart:** Published to artifact repo; values.yaml with all customization points documented
- **Installation Guide:** Prerequisites, install steps, smoke test checklist, <4-hour timebox
- **Upgrade Guide:** Schema migrations, backward-compatibility notes, rollback procedure
- **On-Prem Admin Runbook:** Health checks, troubleshooting, audit log export, KMS key rotation

### Successor Milestone (M12)

- **M12 (v1.5 GA):** Visual regression, mobile app, on-prem deployment go into production/beta
- **Customer pilots:** ≥1 on-prem customer live; mobile app pilots in TestFlight + Internal Track

---

**End of Milestone M11 Document (1,200+ lines, build-ready)**
