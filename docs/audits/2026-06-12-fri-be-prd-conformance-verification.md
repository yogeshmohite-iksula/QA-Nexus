# BE PRD-Conformance Verification (Phase D — final verdict) — 2026-06-12 (Fri)

> **⚠️ DRAFT — Phase C (live) section is templated, not yet filled.** The stable sections (exec
> frame, workflow matrix, gaps, decisions, Day-29 ledger) are authored from Phase A/B + the shipped
> W2-R build; the **Phase C live-verification** results get filled during the 7-9 PM joint smoke with
> Yogesh, and the executive verdict is finalized then. Do NOT treat the verdict as binding until the
> DRAFT banner is removed.
> **Inputs:** Phase A `2026-06-12-fri-be-prd-baseline.md` · Phase B `2026-06-13-sat-be-workflow-conformance.md`
> · Phase C smoke set `2026-06-14-sun-be-phase-c-smoke-curl-set.md` · PRs #262 (RCA guard + disabled gate),
> #271 (W2-R defects read API). Contract: PM1-mandated MUST WORK NOW; PM2-PM4-deferred = stub OK.

## 1. Executive verdict — **PROVISIONAL: 🟡 CONDITIONAL** (finalize post-Phase-C)

PM1 backend is broadly conformant and the pilot DB carries real Iksula data to click through. Since
Phase B, the two before-test build items have been addressed/sequenced: **W2-R defects read API shipped
(#271)** closing the F21 blocker; **F18 Test Suites deferred** (Decision B → M6/Sat-optional). The
remaining items are _functional-but-below-bar_ or _deferred-by-decision_, not _broken_. **Yogesh-test-
ready: provisionally YES-with-caveats** — confirmed or downgraded by the Phase C live battery.

## 2. Workflow conformance matrix (post-merge state)

| WF  | Area                 | PM1 basis                 | Status        | Note                                                                                                           |
| --- | -------------------- | ------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| W1  | Invitation lifecycle | §9.2A, §20.1 (Decision A) | ✅ (on #262)  | 6 endpoints live + audited; disabled-inviter gate via #262 resolveSession; expiry-sweep = P2 cosmetic          |
| W2  | Existing-user CRUD   | §9.1 FR-001/006/010       | ✅ (was 🔴)   | projects/reqs/test-cases ✅; **defects read API shipped #271** (25 seeded reachable); create/status still stub |
| W3  | Admin surface        | §9.2A, FR-015             | ✅            | LLM config (Admin), audit + verify-chain (Admin), users role/status, invitations — all guarded + audited       |
| W4  | Every button backed  | NFR-014                   | 🟡            | BE endpoint inventory delivered; FE+1 reconciles dead-button list (joint)                                      |
| W5  | F18 Test Suites      | Decision B                | ⏸ deferred    | GAP-2 confirmed (models+Zod, no controller); build deferred M6/Sat-optional                                    |
| W6  | Quality bars + NFR   | §9.2C/E, §10.1            | 🟡 unmeasured | A4 64%<70% (accept+doc per Decision); A1/A2 evals + NFR prod = Day-29                                          |

## 3. Gap register resolution (G1-G5 + decisions A-E)

| #   | Gap (Phase A/B)                    | Resolution                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Outbound Jira connect/sync = 501   | **Deferred to M5 hardening** (Decision D — seed-only is the pilot test set). Inbound webhook live + HMAC. Not a pilot blocker.                                                                                                                                                                                                    |
| G2  | A4 RCA top-2 64% < 70% PRD/ERD bar | **Accept-as-is + document** (Decision — the test IS the measurement); clears relaxed M4 ≥40% gate.                                                                                                                                                                                                                                |
| G3  | A1/A2 quality unmeasured           | Day-29 evals; real-data use during pilot surfaces quality.                                                                                                                                                                                                                                                                        |
| G4  | NFR prod numbers unmeasured        | Lightweight instrumentation during Phase C (§7) + Day-29 `NFR_PROBE_TOKEN`.                                                                                                                                                                                                                                                       |
| G5  | RLS runtime-enable                 | **RESOLVED** (Day-32 read-only probe): 20 `workspace_isolation` policies installed but **inert** for the `neondb_owner` app role (`rolbypassrls=true`, no FORCE, GUC unset) → enforced isolation = app-level where-clauses (proven 4/4 entities incl. #271 defects). Pilot impact: none (single workspace). PM2+ activation item. |
| —   | F21 Defects Hub blank (W2)         | **CLOSED by #271** (defects read API).                                                                                                                                                                                                                                                                                            |
| —   | RCA anon + disabled-user (#262)    | **CLOSED by #262** (merged).                                                                                                                                                                                                                                                                                                      |

## 4. Phase C — live functional verification ⏳ TO FILL (7-9 PM joint smoke)

> Run the corrected smoke set (`2026-06-14-sun-be-phase-c-smoke-curl-set.md`, §3d/§3e flat
> `GET /api/defects`). Yogesh runs HTTP from his terminal; verdicts recorded here. Legend: ✅ matches
> spec / 🟡 partial / 🔴 violates / ⚪ unmeasured / ⏭ spec-verified-only.

**Phase 1 pre-results (live ANON checks, 2026-06-12 post-merge redeploy — no session cookie):**
deploy alive (`/health` → 200, 0.28s warm). **All security gates live** — RCA, projects, requirements,
test-cases, audit list, verify-chain all return **401** anon (guards active + routes mounted, incl. the flat
`GET /api/defects` #271 → 401 not 404). **C5 H-closure: `POST /auth/sign-out` → 200 (NOT 405)** → the H bug is
**FE-only** (#272 origin fix); BE handles POST correctly (`GET /auth/sign-out` → 404, POST-only as expected) —
no BE method mismatch. NFR baseline `/health` p50 0.14s / p95 0.25s (< NFR-002 500ms). **Authenticated rows
(200 + seeded counts, audit-row attribution, disabled-user gate, valid verify-chain, auth-p95) remain for the
7 PM joint with Yogesh's session cookie.** Full table filled at 9 PM.

| #   | Check                        | Expected                                                                                  | Result | Verdict |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------- | ------ | ------- |
| C0  | deploy SHA = post-merge main | `/health` 200; SHA matches                                                                | _TBD_  | _TBD_   |
| C1a | RCA guard anon               | `POST /api/defects/<id>/rca` → 401                                                        | _TBD_  | _TBD_   |
| C1b | RCA valid session            | → 202 + `rca_kicked_off` audit (real actorId)                                             | _TBD_  | _TBD_   |
| C1c | RCA cross-tenant             | → 404 (single-ws ⏭ spec-verified)                                                        | _TBD_  | _TBD_   |
| C2  | Disabled-user gate           | disabled session → 401 on next `/api/*`                                                   | _TBD_  | _TBD_   |
| C3a | Projects read                | `GET /api/projects` → 5 Iksula                                                            | _TBD_  | _TBD_   |
| C3b | Requirements read            | per-project → ~30 total                                                                   | _TBD_  | _TBD_   |
| C3c | Test-cases read              | → ~63                                                                                     | _TBD_  | _TBD_   |
| C3d | **Defects read (#271)**      | `GET /api/defects` → 25                                                                   | _TBD_  | _TBD_   |
| C4  | Audit verify-chain           | `GET /api/audit/verify-chain` (Admin) → valid; brokenAtId null OR documented row-25 drift | _TBD_  | _TBD_   |
| C5  | **Sign-out (H closure)**     | `POST /auth/sign-out` → 200 + server-side revoke                                          | _TBD_  | _TBD_   |
| C6  | Audit append-only            | DB triggers reject UPDATE/DELETE                                                          | _TBD_  | _TBD_   |
| C7  | NFR p50/p95                  | steady-state p95 < 500ms (NFR-002)                                                        | _TBD_  | _TBD_   |
| C8  | Free-tier quota              | Groq RPD / Neon CU within free                                                            | _TBD_  | _TBD_   |

**H sign-out — RESOLVED BE-side (2026-06-12):** live anon `POST /auth/sign-out` → **200 (not 405)**, so the BE
catch-all handles POST correctly — the 405 was purely the FE calling its own pages.dev origin. #272 (FE → API
origin) is the complete fix; the 7 PM joint confirms the authenticated `200 + server-side session revoke`.

## 5. Day-29 ledger reconciliation (parked for M5 hardening sprint, post-test)

fresh-DB migration interleave · RLS runtime-enable (G5 — inert, PM2+ activation) · audit REVOKE grant
hardening · Stakeholder run-state guard · 501-stub RBAC guards (defects create/status, Jira connect/sync)
· local Zods → packages/shared · stale-doc sweep · embeddings backfill (`TestCase.embedding`) · NFR prod
measurement (G4) · AC011/AC021 evals (G3) · invitation expiry sweep (W1 3c). None is a PM1 pilot blocker.

## 6. Yogesh-test-readiness sign-off ⏳ (finalize post-Phase-C)

- **Provisional: CONDITIONAL → YES** pending: (a) Phase C C0/C3d confirm the #271 redeploy serves 25
  defects; (b) C5 confirms sign-out closes H; (c) C1/C2 confirm the #262 security gates live.
- **Known-acceptable-for-pilot (documented):** A4 64% (Decision G2), Jira outbound deferred (D), F18
  deferred (B), NFR prod numbers (Day-29 G4), RLS DB-layer inert (G5, single-ws).
- Sun deep-test green-light → recorded here once Phase C is filled.
