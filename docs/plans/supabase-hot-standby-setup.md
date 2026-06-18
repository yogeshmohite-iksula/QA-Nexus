# Supabase Hot-Standby Setup — Neon failover guide (BE+1, Sat 2026-06-13)

> **Author:** MAIN (plan) · **Executor:** BE+1 · **Status:** ready to execute Sat · **Cost:** $0 (Hard Rule 1 — Supabase Free; see §7)
> **Why:** the Neon Free DB is **SUSPENDED** (quota-cap; manual mid-month resume unlikely — likely Jul 1 auto-reset). That suspension is the **single remaining gate** on the Yogesh deep test (dashboard §10.3). A Supabase Free hot-standby gives a ~5-minute failover so the test isn't hostage to Neon's reset date — and stays as a warm standby even after Neon resumes.
> **Scope:** stand up an identical Postgres+pgvector on Supabase Free, replay migrations, seed Iksula canon, and make `DATABASE_URL` flippable at Render. **No app code changes** — the Prisma datasource already reads `DATABASE_URL` + `DIRECT_URL` (`apps/api/prisma/schema.prisma:46-47`).

---

## §0 — Pre-flight confirmations (do these FIRST — they gate the whole plan)

**These are verify-before-assert items. Confirm each on the live Supabase free-tier dashboard before relying on the plan.**

1. **pgvector on Free.** Supabase ships the `vector` extension (pgvector) on **all tiers including Free** — it's enabled per-database via `create extension vector`. **CONFIRM as Step 2 below** by actually running `create extension` + creating one HNSW index on the free project. pgvector HNSW supports up to 2000 dimensions; our embedding column (`vector(...)`, **confirm current dim** — init migration is `vector(1024)`; CLAUDE.md cites a later `0002_vector_384_dim.sql` migration to 384; run `prisma migrate status` to see the live chain) is well within either way. If `create extension vector` or the HNSW index fails on Free → **STOP and flag Yogesh** (the whole failover assumption breaks; we'd fall back to waiting for Neon's Jul 1 reset).
2. **Region = AWS Singapore** (`ap-southeast-1`) to match Neon's region → lowest latency from Render's region + parity with prod topology. Set at project-creation time (cannot change later without recreating).
3. **Free-tier limits fit pilot scale.** Supabase Free = 500 MB DB + 7-day-idle auto-pause. Our seed is tiny (5 projects / 30 reqs / 63 cases / 5 suites / 25 defects / ~158 audit rows ≈ well under 0.5 GB — same scale that fit Neon Free). ✅ within.

---

## §1 — Create the Supabase project

1. Sign in at `https://supabase.com/dashboard` (use the project Google/GitHub identity; **not** a personal account that could orphan the project).
2. **New project** →
   - **Name:** `qa-nexus-standby`
   - **Region:** **Southeast Asia (Singapore) `ap-southeast-1`** (§0.2)
   - **Plan:** **Free**
   - **DB password:** generate a strong one → **store it in the password manager + Render env later; NEVER commit it** (Hard Rule 6). Do not paste it into this doc, any PR, or Slack.
3. Wait ~2 min for provisioning.

## §2 — Enable pgvector + confirm HNSW (the §0.1 gate, executed)

In the Supabase dashboard → **SQL Editor**, run:

```sql
create extension if not exists vector;
-- smoke an HNSW index to confirm Free supports it (drop after):
create table _vec_probe (id int, e vector(384));
create index on _vec_probe using hnsw (e vector_cosine_ops);
drop table _vec_probe;
```

✅ All three succeed → Free supports pgvector + HNSW → proceed. ❌ Any fail → **STOP + flag Yogesh** (§0.1).

## §3 — Get the two connection strings (the Prisma gotcha)

Supabase exposes **two** connection modes. Prisma needs **both** — this is the #1 Supabase+Prisma footgun:

| Env var        | Supabase connection                      | Port     | Used for               | Why                                                                                    |
| -------------- | ---------------------------------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL` | **Pooler** (Supavisor, transaction mode) | **6543** | runtime queries        | serverless/long-lived app connections; survives Render dyno churn                      |
| `DIRECT_URL`   | **Direct**                               | **5432** | `prisma migrate` / DDL | migrations use advisory locks + DDL that **break through the transaction-mode pooler** |

Dashboard → **Project Settings → Database → Connection string**:

- **Pooler / "Transaction" tab** → copy the `:6543` URI → this is `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1` (Prisma+PgBouncer requirement).
- **"Direct connection" / Session tab** → copy the `:5432` URI → this is `DIRECT_URL`.

Both look like `postgresql://postgres.<ref>:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:<port>/postgres`. **Keep the password OUT of this doc** — substitute `[PASSWORD]` when you paste into Render.

> The repo is already wired for this: `apps/api/prisma/schema.prisma:46-47` reads `url = env("DATABASE_URL")` + `directUrl = env("DIRECT_URL")`. **No schema edit needed.**

## §4 — Replay migrations onto Supabase

From `apps/api`, with the two Supabase URLs exported **in your shell only** (not committed):

```bash
cd apps/api
export DATABASE_URL="postgresql://postgres.<ref>:[PW]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://postgres.<ref>:[PW]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

pnpm --filter @qa-nexus/api exec prisma migrate status   # shows the chain it will apply
pnpm --filter @qa-nexus/api exec prisma migrate deploy    # replays ALL migrations identically (uses DIRECT_URL)
```

`migrate deploy` replays the **exact same** migration chain that built Neon — identical schema, including the pgvector column + HNSW indexes. Confirm the final line shows all migrations applied + `migrate status` reports "Database schema is up to date."

## §5 — Seed Iksula canon

```bash
# seed script lives at apps/api/prisma/seed.ts
pnpm --filter @qa-nexus/api exec prisma db seed
# (if package.json has no prisma.seed block, run it directly:)
# pnpm --filter @qa-nexus/api exec tsx prisma/seed.ts   # confirm the exact runner BE+1 uses
```

**Verify the seed (expected Iksula-canon counts):**

```sql
-- in Supabase SQL Editor:
select
  (select count(*) from "Project")      as projects,    -- expect 5
  (select count(*) from "Requirement")  as requirements, -- expect 30
  (select count(*) from "TestCase")     as test_cases,    -- expect 63
  (select count(*) from "TestSuite")    as suites,        -- expect 5
  (select count(*) from "Defect")       as defects;       -- expect 25
-- audit chain (expect ~158 rows; HMAC chain re-seeds from the seed's genesis):
select count(*) from "audit_log";
```

> **Audit-log note:** the HMAC chain re-seeds from the seed's own genesis row, so the chain is internally valid on Supabase even though row hashes differ from Neon's (different seed-time secret). The benign row-25 drift documented for Neon (see `feedback_audit_immutability_and_seed_drift.md`) will reproduce identically — that's expected, not a failover defect.

## §6 — Failover: flip Render to Supabase (~5 min)

When ready to cut over (DB-unlock for the Yogesh test):

1. **Render dashboard → `qa-nexus-api` service → Environment.**
2. Update **two** env vars:
   - `DATABASE_URL` → the Supabase **pooler** `:6543` URL (with `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` → the Supabase **direct** `:5432` URL
3. **Save** → Render auto-redeploys (~3-5 min). The API boots against Supabase.
4. **Verify live** (the 46th-RC + 41st-RC discipline — confirm the CURRENT deploy, not a stale one):
   ```bash
   curl -s https://qa-nexus-api.onrender.com/health/lite        # 200 (BE+1's #284 lightweight health)
   curl -s https://qa-nexus-api.onrender.com/api/projects | head # 5 real Iksula projects
   ```
   Then **re-run Phase C with the FE network-tab gate**: F09 switcher → 5 real projects; F28 → 158 audit rows; F21 → 25 defects. The dashboard §10.2 🟡 rows flip ✅ here.

## §7 — Cost + keep-warm + rollback

- **$0 (Hard Rule 1).** Supabase Free = $0/mo at this scale. No paid component introduced. If anything in setup prompts for a card → **STOP** (we don't proceed past the free tier without an ADR + Yogesh sign-off).
- **7-day idle auto-pause.** Supabase Free pauses a project after 7 days of no queries; it **auto-resumes in ~30-60s on the next connection** (cold start). For pilot-test windows this is acceptable (first request of the day wakes it). **Keep this standby warm even after Neon resumes Jul 1** — a periodic ping (reuse the UptimeRobot pattern, or a lightweight scheduled query) keeps it from pausing, so it stays a genuine hot-standby, not a cold archive.
- **Rollback to Neon** (after Jul 1, if preferred as primary): flip the same two Render env vars back to the Neon URLs → redeploy → re-verify. Because both DBs hold the same migration chain + seed, cutover is symmetric in either direction. Keep whichever is **not** primary as the warm standby.

---

## Open confirmations (BE+1 to close on Sat — flagged, not assumed)

1. **pgvector + HNSW on Free** — §2 smoke (the load-bearing gate).
2. **Current embedding dim** — `prisma migrate status` (init `vector(1024)` vs the cited `0002` → 384; either is HNSW-safe).
3. **Exact `prisma db seed` invocation** — confirm the `prisma.seed` block in `apps/api/package.json` vs a direct `tsx prisma/seed.ts` runner.
4. **UptimeRobot keep-warm target** — point the keep-alive at `/health/lite` (BE+1 #284), **never** `/health/deep` (47th/48th RC — deep health is expensive; lite is the keep-alive surface).

_Authored Fri night 2026-06-12 by MAIN as BE+1's Sat execution guide. No secrets in this doc (Hard Rule 6) — all connection strings are `[PASSWORD]`/`<ref>` placeholders. The failover needs no app-code change because the Prisma datasource already reads `DATABASE_URL` + `DIRECT_URL`; this plan only stands up the standby DB + flips two Render env vars. The single gate it removes: the Yogesh deep test no longer waits on Neon's Jul 1 reset._
