# Phase C — Live Smoke-Curl Set (run after #261/#262/#263 merge + Render redeploy)

> **Purpose:** the runnable verification battery for Phase C of the PRD-conformance audit. Pre-staged
> tonight so it's executable the instant Render finishes redeploying (~3 min post-merge).
> **Rule 6:** every command uses **env placeholders** — NO secrets in this doc. When pasting results
> back, **scrub** cookies / tokens / DB URLs.
> **Paths are sourced from controller code** (agent inventories in `2026-06-13-sat-be-workflow-conformance.md`),
> NOT REST guesses — per the "verify API paths before consumer wiring" memory. Where I corrected your
> sketch, it's flagged ✏️.

## Preconditions (set once per shell)

```bash
export API="https://<your-render-service>.onrender.com"   # public host, not a secret
# Sign in via the FE, open devtools → Network → copy the FULL `Cookie:` request header value of any
# authenticated XHR, paste it here (whole header → robust vs cookie-name guessing):
export COOKIE="<paste-full-cookie-header>"                 # SECRET — never commit
# Admin (Yogesh) session for admin probes = same COOKIE (you are Admin).
# psql access for the DB-level probes (§5):
export DBURL="$DATABASE_URL"                               # SECRET — from Render env, never commit
```

Helper to time + show status without dumping bodies:

```bash
c() { curl -s -o /dev/null -w "%{http_code}  %{time_total}s\n" "$@"; }     # status+latency only
cj() { curl -s -w "\n→ %{http_code} %{time_total}s\n" "$@"; }              # body+status (scrub before paste)
```

## 0. Deploy SHA sanity (confirm the redeploy landed)

```bash
cj "$API/health"        # expect 200; if a /version or build-sha field exists, confirm it == merged HEAD
```

## 1. RCA guard (#262) — `POST /api/defects/{id}/rca` ✏️ returns **202** (async kickoff), not 200

Pick a real defect id: `cj "$API/api/projects/{PROJECT_ID}/defects"` (post-W2R build) or from the seed.

```bash
DEF="<a-seeded-defect-uuid>"
# 1a anonymous → expect 401 (RolesGuard, no session)
c -X POST "$API/api/defects/$DEF/rca"
# 1b valid session (Admin/Lead/QAEng in the defect's workspace) → expect 202 + audit row
cj -X POST -H "Cookie: $COOKIE" "$API/api/defects/$DEF/rca"
# 1b-audit: confirm the kickoff was attributed to a REAL actor (not null)
cj -H "Cookie: $COOKIE" "$API/api/audit?limit=5" | grep -i rca   # expect rca_kicked_off w/ actorId set
# 1c cross-tenant → expect 404  (needs a defect id in ANOTHER workspace — see caveat)
c -X POST -H "Cookie: $COOKIE" "$API/api/defects/<defect-in-other-ws>/rca"
```

**Caveat (cross-tenant):** the pilot is **single-workspace**, so 1c has no live target. The tenant-404 is
**unit-verified** (#262 added the `workspaceId!==→404` spec). Mark 1c **spec-verified, live-skipped** unless a
throwaway 2nd workspace exists.

## 2. Disabled-user gate (#262) — `resolveSession` returns null → 401 on next `/api/*`

```bash
# Use a QA-Engineer test user (NOT the last Admin — last-Admin disable is blocked by design).
# Admin disables them: PATCH /api/users/:id/status {status:'disabled'}  → also purges their BetterAuth sessions.
cj -X PATCH -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
   -d '{"status":"disabled"}' "$API/api/users/{TARGET_USER_ID}/status"      # expect 200 + user_status_changed audit
# Then reuse THAT user's still-held cookie on any guarded read → expect 401
c -H "Cookie: $DISABLED_USER_COOKIE" "$API/api/projects"
# Re-enable to restore: {"status":"active"}
```

**Caveat:** needs the target user's own cookie (sign in as them first). If impractical, the gate is
**spec-verified** (#262) + the session-purge is the belt; mark **partial-live**. Disabling self/last-Admin → expect 409.

## 3. Per-entity tenant-scoped reads (the seeded data Yogesh will click)

```bash
# 3a projects (workspace-scoped list) → expect 200 + 5 Iksula projects
cj -H "Cookie: $COOKIE" "$API/api/projects"
PID="<grab a project id from 3a>"
# 3b requirements (project-scoped) → expect 200 + ~30 for RET
c -H "Cookie: $COOKIE" "$API/api/projects/$PID/requirements"
# 3c test-cases (project-scoped) → expect 200 + ~63 for RET
c -H "Cookie: $COOKIE" "$API/api/projects/$PID/test-cases"
# 3d defects — ⚠ GATED on W2-R build (GET list + GET detail). Pre-build → 404/501. Post-build → 200 + 25
c -H "Cookie: $COOKIE" "$API/api/projects/$PID/defects"
# 3e test-suites — ⚠ GATED on W5 F18 build. Pre-build → 404. Post-build → 200 + 5
c -H "Cookie: $COOKIE" "$API/api/projects/$PID/test-suites"
# 3f anonymous on any of the above → expect 401 (RBAC guard)
c "$API/api/projects"
```

**3d/3e are the build-gated rows** — they PROVE the two Sat/Sun builds the moment they land.

## 4. Audit verify-chain ✏️ real path = `GET /api/audit/verify-chain` (Admin) — NOT `/api/admin/...`

```bash
cj -H "Cookie: $COOKIE" "$API/api/audit/verify-chain"   # → { valid, brokenAtId, verifiedRows, truncated }
```

**Expected:** `valid:true, brokenAtId:null`. **HONESTY FLAG:** if `brokenAtId` points at an **early row (~row 25)**,
that is the **documented benign seed-drift exception** (an early seed row written under a prior
`BETTERAUTH_SECRET`), NOT a tamper — confirm its timestamp predates the pilot seed; cross-ref
`feedback_audit_immutability_and_seed_drift` + the Day-29 ledger. The 128 pilot-seed rows were written
with the **current** secret and chain cleanly among themselves.

## 5. RLS runtime-enable probe (G5) — the definitive app-level-vs-DB-layer answer

Run against Neon via psql (`psql "$DBURL" -c "..."`):

```bash
# 5a which tables have RLS turned ON
psql "$DBURL" -c "SELECT relname, relrowsecurity FROM pg_class WHERE relrowsecurity = true ORDER BY relname;"
# 5b which CREATE POLICY policies are actually installed
psql "$DBURL" -c "SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename;"
# 5c sanity: append-only audit triggers ARE expected live (proven) —
psql "$DBURL" -c "SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid='audit_log'::regclass AND NOT tgisinternal;"
```

**Interpretation:** 5a/5b **empty** ⇒ `init_rls_hnsw.sql` RLS was never applied → tenant isolation is
**app-level where-clauses ONLY** (proven for 3/4 entities in Phase B; defects pending W2-R). That's a single-layer
posture vs ERD §8.1's double-layer — document + decide. 5c **non-empty** ⇒ audit immutability confirmed at DB.

### §5 RESULT — pre-run 2026-06-11 (read-only DB probe; RLS state is merge-independent) → **G5 RESOLVED**

RLS is **enabled on all 20 scoped tables** with **20 `*_workspace_isolation` policies installed** (cmd `ALL`; `projects` qual = `workspace_id = current_setting('app.workspace_id')::uuid`). Audit append-only triggers live (`audit_log_block_update` + `audit_log_block_delete`). **This corrects the Phase-B W2-§F inference** ("`init_rls_hnsw.sql` not in migrations chain → not applied"): the policies **ARE applied** — out-of-band, exactly like the audit triggers. **BUT the policies are INERT for the application connection**, for three independent reasons: (1) the app connects as **`neondb_owner`** which has **`rolbypassrls = true`** → RLS bypassed regardless of policies; (2) tables are **`FORCE ROW LEVEL SECURITY = false`** and the app is the table owner → owner bypasses non-forced RLS; (3) the app **never `SET`s `app.workspace_id`** (GUC is null — W2 agent found no `set_config` in `apps/api/src`). **Net: enforced tenant isolation = app-level `where`-clauses + `assert*Workspace` ONLY** — the Phase-B _outcome_ stands; only its _reason_ changes. **Pilot impact: NONE** (single Iksula workspace → no cross-tenant data to leak). **To activate DB-level RLS for PM2+ multi-tenant:** connect as a non-owner, non-`BYPASSRLS` role + `ALTER TABLE … FORCE ROW LEVEL SECURITY` + `SET LOCAL app.workspace_id` per request/transaction. Documented gap vs ERD §8.1 double-layer; **not a PM1 blocker.**

## 6. NFR p50/p95 latency (G4 — NFR-002 target p95 < 500ms)

```bash
# 30-sample loop on a representative read; compute p50/p95 (cold-start: discard the first sample)
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{time_total}\n" -H "Cookie: $COOKIE" "$API/api/projects"
done | sort -n | awk '{a[NR]=$1} END{print "p50="a[int(NR*0.5)]"s  p95="a[int(NR*0.95)]"s  n="NR}'
```

Repeat for `/api/projects/$PID/test-cases` (heavier) + `/health` (baseline). **Render Free cold-start** will
spike the first call — note it separately; NFR-002 is steady-state p95. The dedicated `/admin/nfr/{a1,a2}`
probes need `NFR_PROBE_ENABLED=true` + the Admin cookie (per `feedback_nfr_probe_token_auth`; Day-29 adds `NFR_PROBE_TOKEN`).

## Expected-results summary (what each row PROVES)

| §        | Check                | Pass condition                          | Proves                       |
| -------- | -------------------- | --------------------------------------- | ---------------------------- |
| 0        | /health              | 200                                     | redeploy landed              |
| 1a/1b/1c | RCA guard            | 401 / 202+real-actor-audit / 404(spec)  | #262 RCA guard + attribution |
| 2        | disabled gate        | 401 on reuse                            | #262 disabledAt gate         |
| 3a-3c    | project/req/TC reads | 200 + seeded counts                     | W2 conformant (3/4)          |
| 3d/3e    | defect/suite reads   | 200 + 25 / 200 + 5                      | **W2-R + W5 builds landed**  |
| 4        | verify-chain         | valid:true (or documented row-25 drift) | audit integrity              |
| 5a/5b    | pg_policies          | rows present OR empty(=app-level-only)  | **G5 resolved**              |
| 5c       | audit triggers       | present                                 | immutability at DB           |
| 6        | p50/p95              | p95 < 500ms steady-state                | **G4 measured**              |

## Gating note

Rows **3d, 3e** are not runnable until the two builds land (W2-R defects read API, W5 F18 controller). All
other rows run immediately post-redeploy. **Cross-tenant (1c) + disabled-user (2)** are partly spec-verified
in single-workspace pilot — flagged inline. Phase C results → fold into the Phase D final verdict doc.
