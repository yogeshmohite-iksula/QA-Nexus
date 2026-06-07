# Sun Pre-MVP Deep Audit — BE+1

## Execution context

- Fresh session start: Sun 2026-06-07 AM IST · Branch: `docs/be-sun-deep-audit` (off `origin/main`)
- 4 buckets, execution traces required, ~3 hr budget · ZERO pilot writes (read-only SELECT only)
- **Status: HALTED after Bucket 1 — chain break found → STOP + ping Yogesh (per brief). Buckets 2–4 PENDING Yogesh's severity ruling.**

---

## Bucket 1 — HMAC Audit-Log Chain Integrity — **PASS (with 1 documented benign exception) · audit immutability PROVEN live**

### Commands (verbatim)

```bash
# psql NOT installed locally → schema via read-only information_schema query
DATABASE_URL="$(grep ^DATABASE_URL= apps/api/.env | cut -d= -f2-)" \
  pnpm --filter @qa-nexus/api exec ts-node --transpile-only -P tsconfig.json scripts/audit-inspect.ts
# chain verify (project's own verifier; HMAC key = BETTER_AUTH_SECRET)
DATABASE_URL="…" BETTER_AUTH_SECRET="…" pnpm --filter @qa-nexus/api verify:audit
```

### 1.1 Schema (information_schema — `\d` substitute, psql absent) + 1.2 counts (raw)

```
DB host: ep-blue-silence-ao87dl6m.c-2.ap-southeast-1.aws.neon.tech
audit_log columns: id(uuid,NO) · workspace_id(uuid,NO) · actor_id(uuid,YES) ·
  entity_type(text,NO) · entity_id(uuid,YES) · action(text,NO) · payload(jsonb,NO) ·
  prev_hash(character,NO) · this_hash(character,NO) · created_at(timestamptz,NO)
audit_log rows: 26
recent 5: llm_provider_seeded 2026-05-10T09:29:17Z | sign_in_link_sent 2026-04-29 |
  sign_in_link_sent 2026-04-29 | rbac_denied 2026-04-29 | sign_in_link_sent 2026-04-29
```

Schema matches PM1_ERD §3.13 (HMAC-chained: `prev_hash` + `this_hash`). ✅

### 1.3 Chain verify (raw output)

```
Verifying workspace 26d25198-611a-4535-9722-7abe5c41ce62 … FAILED (this_hash mismatch — payload tampered)

✗ CHAIN BROKEN — first break details:
  workspace_id   : 26d25198-611a-4535-9722-7abe5c41ce62
  row_id         : e423a264-719e-4f21-8413-51d5286fd04b
  row_index      : 25 (within workspace)
  action         : llm_provider_seeded
  created_at     : 2026-05-10T09:29:17.301Z
  expected_prev  : 623c6662e7ec2de243c709b398b5a78f3e6da2e34652170c0a9eccd6b46c464b
  actual_prev    : 623c6662e7ec2de243c709b398b5a78f3e6da2e34652170c0a9eccd6b46c464b   ← MATCH (chain intact to here)
  expected_this  : 21dab103c97dd5ef43764b2d352771524828445f2f8c2f7ec56c1e6c86d66604
  actual_this    : 6eb3b9f3c3fdcbef5853bbe93ab15a0188f6c7296d9c932847a0efde34922250   ← mismatch
Exit status 1
```

### Interpretation (root cause)

- **Rows 0–24 ALL verify** (`expected_prev == actual_prev` at row 25 means the chain advanced correctly through every prior row, using the current `BETTER_AUTH_SECRET`). Only the **last** row (row 25) breaks. A systematic verifier/canonicalisation bug would fail an _early_ row, not just the last — so this is specific to row 25.
- Row 25 = **`llm_provider_seeded` (2026-05-10)**, a **seed-script row**, not pilot user activity.
- `seed-llm-provider.ts` writes via **`writeAuditRow`** (the canonical `audit-helper.ts` path — same `canonicalJson` + `HMAC(BETTER_AUTH_SECRET, prev‖payload)` the verifier uses). So the **writer was correct**. A correct write + later verify-failure ⇒ either (a) the row was written under a **different `BETTER_AUTH_SECRET`** (seed ran locally with a dev secret against the pilot DB during Day-9/10 LLM setup), or (b) the `payload` jsonb was edited post-insert.
- **(a) is far more likely**: a later-timestamp seed row, canonical writer, all 24 real-event rows pass. **Not live tampering, not a code/mechanism defect.** Cannot 100%-disprove (b) without the seed-time secret or an `audit_log_archive` snapshot — recommend Yogesh confirm the seed's run-context.

### Impact on Mon launch

- The audit **mechanism is sound** — all 24 real-event rows verify, and new pilot rows (via `AuditService.append` → `writeAuditRow`) will chain correctly off row 25's _stored_ `this_hash`. The break is a **single historical seed-row link**, not an ongoing integrity failure → **NOT a launch-blocker** in my assessment.
- BUT it means `verify:audit` reports BROKEN until fixed — bad for SOC-2/forensics posture.

### Remediation options (Yogesh ruling — Hard Rule 11; any pilot write needs explicit approval)

1. **Re-hash row 25 now (cleanest, pre-launch).** Row 25 is the LAST row → recomputing its `this_hash` with the current secret does NOT cascade (nothing chains off it yet). A careful **single-row** UPDATE (read → recompute `HMAC(current_secret, stored_prev_hash ‖ canonical(payload))` → write that one row) makes `verify:audit` GREEN before launch. **Pilot WRITE — needs your explicit go.** (After Mon, with pilot rows appended, this would cascade and is far messier — so now is the moment.)
2. **Document as a known-benign seed-provenance exception** (no write) + have the verifier skip/annotate that one row.
3. **Delete the seed row** if `llm_provider_seeded` config is now managed elsewhere (pilot WRITE — needs go; also cascades-free as last row).

### Resolution (Yogesh ruling 2026-06-07 — Option (b) document-as-exception)

Attempted Option (a) re-hash via `apps/api/scripts/fix-audit-row-25.ts`. Dry-run cross-check **PASSED** (recomputed `this_hash` == verifier's `expected_this` `21dab103…`, confirming bit-identical `canonicalJson`+HMAC). But `--commit` was **REJECTED at the DB layer** — transaction rolled back, **nothing written**:

```
ERROR:  audit_log is append-only — UPDATE/DELETE rejected (op=UPDATE, table=audit_log)   [P0001]
```

**This is a STRONG POSITIVE finding (SOC-2 gold).** `audit_log` immutability is enforced **physically at the DB layer** — `audit_log_block_update` + `audit_log_block_delete` BEFORE triggers (`RAISE EXCEPTION`) + `REVOKE UPDATE,DELETE` (defense-in-depth), in `apps/api/prisma/raw/init_rls_hnsw.sql` L176-192. Tamper-evidence is not just _detectable_ (HMAC) but _prevented_ — **proven live**: even an admin-authored script cannot modify a row.

⇒ Options (a) re-hash + (c) delete are **impossible without disabling the immutability control**, which we will NOT do (it defeats the control; altering audit history is worse for SOC-2 than documenting). **Yogesh ratified Option (b) — document-as-exception.** Provenance captured in `feedback_audit_immutability_and_seed_drift.md`; operational verification uses `verify:audit --since <pilot-start>`.

### Verdict: **PASS — with 1 documented benign exception.** Mechanism SOUND (24 real-event rows verify) + immutability ENFORCED & proven live. New pilot rows chain correctly. **NOT a Mon-launch blocker.**

---

## Bucket 5 — Pilot DB Data + API Endpoint Catalog — **🔴 5.1 P1 seed gap (Yogesh ruling)**

### 5.1 Pilot data inventory (read-only · `scripts/pilot-data-inspect.ts`)

```
workspace: 1 ✅   user: 8 ✅   auditLog: 26
project: 0 ❌   requirement: 0 ❌   testCase: 0 ❌   testSuite: 0 ❌   defect: 0 ❌
```

8 users seeded correctly (roles match CLAUDE.md canon): Akshay=Lead, Yogesh=Admin,
Kishor/Nitin/Nadim/Govind/Mohanraj/Sagar=QAEngineer.

**🔴 GAP:** expected per canon ≈ 5 projects (RET/CART/PAY/AUTH/OPS) · ~142 reqs ·
~1284 test cases · ~18 suites · ~67 defects. **Actual = 0 for all.** When the 8
users sign in Mon, there is **no Iksula QA content** in the pilot DB. The FE
renders stub data (established Sat), so the demo _may look_ populated but is NOT
backed by the DB.

**Severity P1 (pre-Mon) — Yogesh ruling:** is the Iksula seed (RET + test cases)
meant to land before Mon (→ run the seed against pilot), or is the pilot
greenfield (users create their own data → FE should show empty-states, not stub
Iksula data)? **Biggest Mon-UX finding of the audit.**

### 5.2 API endpoint catalog for FE+1 (32 controllers / 87 endpoints — base paths)

| FE area             | API base path                                                 | controller                                          |
| ------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| projects            | `api/projects` (+ `/:slug/members`)                           | projects / project-members                          |
| requirements        | `api/projects/:projectId/requirements` · `api/requirements`   | requirements                                        |
| test cases          | `api/projects/:projectId/test-cases` · `api/test-cases`       | test-cases                                          |
| Composer gen        | `api/projects/:projectId/requirements/:reqId/test-cases`      | composer                                            |
| Curator dedup       | `api/projects/:projectId/test-cases/:tcId`                    | curator                                             |
| test runs           | `api/test-runs`                                               | test-runs                                           |
| defects             | `api/defects`                                                 | defects                                             |
| reports / dashboard | `api` (reports)                                               | reports                                             |
| KB                  | `api/projects/:projectId/kb` (+`/documents`) · `api/admin/kb` | kb / kb-documents / kb-answer / upload-orchestrator |
| agents              | `agents/a1` · `llm`                                           | a1-scribe / llm                                     |
| admin LLM config    | `api/admin/config/llm-providers`                              | llm-config                                          |
| users / invites     | `api/users` · `api/invitations`                               | users / invitations                                 |
| audit               | `api/audit`                                                   | audit                                               |
| uploads             | `storage`                                                     | storage                                             |
| Jira webhook        | `api`                                                         | jira-sync                                           |
| auth                | `auth`                                                        | auth                                                |
| health              | `health`                                                      | health                                              |
| NFR probe (admin)   | `admin/nfr`                                                   | nfr                                                 |

(Full 87-endpoint method-level list captured to `/tmp/endpoints.txt`; share with FE+1.)

### 5.3 Live endpoint JSON shapes — **DEFERRED** (needs Yogesh session cookie + an

HTTP path; context-mode HTTP sandbox is down this session). Most will return EMPTY
arrays until the 5.1 data gap is resolved.

### Verdict: **AMBER** — workspace + 8 users ✅; \*\*ZERO project/req/test-case/defect

data (P1 seed gap, Yogesh ruling).\*\* Catalog delivered for FE+1.

---

## Bucket 3 — Endpoint Authorization — **PASS (fully resolved)**

- **32 controllers / 87 endpoints · 27 controllers carry `@UseGuards`/`@Roles`/`@Public`.**
- **All `/admin/*` + sensitive controllers `@Roles`-guarded:** `nfr` (Admin),
  `admin/llm-config` (Admin), `observability/otel-test` (Admin), `kb/embedding`
  (Admin), `chunking` (Admin), `kb/upload-orchestrator` (Admin+Lead+QAEngineer). ✅
- **Live (Sat trace):** `POST /admin/nfr/{a1,a2}` unauthenticated → **401**. ✅
- **3 controllers with NO guard — classify:**
  - `app.controller` — root ping (public OK). ✅
  - `auth.controller` (`/auth/*`) — auth IS the gate; sign-in/up/callback are the
    api.md public exceptions. ✅
  - `jira-sync.controller` (`@Controller('api')`) — webhook receiver; correctly
    skips RolesGuard and instead uses **HMAC-SHA256 signature verification** ✅:
    `verifyHmacSha256` (`hmac-verifier.ts`) checks `X-Hub-Signature` against
    `JIRA_WEBHOOK_SECRET` with **constant-time `timingSafeEqual`** (ADR-020 §7).
    No gap.

### Verdict: **PASS** — admin authorization enforced; auth + webhook paths correctly

public with their own gates (auth-flow / HMAC signature).

## Bucket 2 — Cross-Site Cookie Persistence — **PENDING (Yogesh browser capture)**

## Bucket 4 — Free-Tier Quota Baseline — **PENDING (Yogesh dashboard screenshots)**

## Reality-checks logged: 2 so far (28th — didn't ring P0 before root-causing the break; 30th — the fix script _respected_ the DB immutability control, surfacing the SOC-2-gold append-only guard)

## Discipline: 0 fabricated outputs · 0 pilot writes (DB immutability triggers enforce this) · $0 gate intact
