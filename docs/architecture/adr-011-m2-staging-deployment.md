# ADR-011: M2 staging deployment — Render free + Neon free + UptimeRobot keep-alive

- **Status:** Accepted
- **Date:** 2026-05-06
- **Deciders:** Yogesh Mohite (Admin), BE chat
- **Related:** ADR-004 (original M0 Render setup — `qa-nexus-api.onrender.com`) · ADR-007 (cookie domain `.qanexus.iksula.com`) · ADR-008 (Gmail SMTP transport) · `docs/deploy/render-runbook.md` · `docs/deploy/uptimerobot-runbook.md` · MS0-T011 (original deploy task) · M2 P0 gate
- **Supersedes:** none (ADR-004 still describes the original deployment; this ADR layers M2 staging requirements on top)
- **Superseded by:** none

---

## Context

M2 (Knowledge Base & RAG) ships features that need a real Postgres DB
exercising pgvector HNSW indexes — local SQLite stubs are no longer
sufficient. We need an always-on (within the 10 AM – 10 PM IST pilot
window) staging environment to:

- Validate magic-link sign-in end-to-end against `app.qanexus.iksula.com`
  - `api.qanexus.iksula.com` cross-subdomain cookies (ADR-007)
- Exercise the chunking → embedding → search → answer RAG pipeline against
  real pgvector(384) HNSW indexes
- Run M2 acceptance gates Sat 9 May with `verify:audit` against a
  populated audit_log
- Let FE+1 run Pattern B real BetterAuth wiring against a live API
  without local-DB friction

The original M0 deploy (ADR-004) used a single Render service named
`qa-nexus-api`. M2 needs a dedicated **staging** environment that:

1. Doesn't risk corrupting the (still-empty) M0/M1 setup if it had any
   real data
2. Names cleanly so M3+ can stand up `qa-nexus-api-prod` alongside
3. Can be torn down + recreated quickly via a Blueprint (no manual form
   re-entry)

## Decision

Stand up **`qa-nexus-api-staging`** as a separate Render Web Service
(Free tier) backed by a separate Neon Postgres project
(`qa-nexus-staging`), with UptimeRobot keep-alive on the staging
`/health` endpoint during the pilot window.

### Service topology

```
                   ┌──────────────────────────────────────┐
                   │  app.qanexus.iksula.com (Cloudflare  │
                   │  Pages, Day-N FE deploy)             │
                   └────────────────┬─────────────────────┘
                                    │  fetch (cookies via .qanexus.*)
                                    ▼
┌──────────────────────────────────────────────────────────┐
│  api.qanexus.iksula.com  →  qa-nexus-api-staging         │
│    Render Web Service · Free tier · 750 hr/mo · 512 MB   │
│    Auto-deploy: push to main                             │
│    Build: pnpm install --frozen-lockfile                 │
│           && pnpm --filter @qa-nexus/api build           │
│           && pnpm --filter @qa-nexus/api prisma:migrate:deploy │
│    Start: pnpm --filter @qa-nexus/api start:prod         │
└────────────────┬─────────────────────────────────────────┘
                 │  Postgres (pooled via PgBouncer)
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Neon project `qa-nexus-staging`                         │
│    Free tier · 0.5 GB storage · scale-to-zero            │
│    pgvector extension enabled                            │
│    Pooled URL: ...-pooler.region.aws.neon.tech           │
│    Direct URL: ...region.aws.neon.tech (for migrations)  │
└──────────────────────────────────────────────────────────┘

UptimeRobot (free) → GET /health every 5 min, 04:30-16:30 UTC
                     (10 AM - 10 PM IST), 7 days/wk
```

### Env-var manifest (12 required)

| Var                                                                                      | Source                                                                                                         | Notes                                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                                                           | Neon pooled URL                                                                                                | `?pgbouncer=true&connection_limit=1` suffix mandatory for serverless |
| `DIRECT_URL`                                                                             | Neon non-pooled URL                                                                                            | Used by `prisma migrate deploy` only                                 |
| `BETTER_AUTH_SECRET`                                                                     | `openssl rand -base64 32`                                                                                      | ≥32 chars                                                            |
| `BETTER_AUTH_URL`                                                                        | `https://qa-nexus-api-staging.onrender.com` (or custom domain `https://api.qanexus.iksula.com` once DNS lands) | drives cookie-domain detection (ADR-007)                             |
| `BETTER_AUTH_COOKIE_DOMAIN`                                                              | `.qanexus.iksula.com` (when serving from custom domain) OR omit (when on `*.onrender.com`)                     | env override per ADR-007                                             |
| `ADMIN_SEED_EMAIL`                                                                       | `yogesh.mohite@iksula.com`                                                                                     | Day-0 admin seed (T021)                                              |
| `GROQ_API_KEY`                                                                           | Groq console                                                                                                   | LLM gateway primary                                                  |
| `GEMINI_API_KEY`                                                                         | AI Studio                                                                                                      | LLM gateway fallback                                                 |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM_EMAIL/FROM_NAME/REPLY_TO/BCC_EMAIL` (9 vars)          | Gmail Workspace SMTP                                                                                           | ADR-008                                                              |
| `R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET_NAME/ENDPOINT/PUBLIC_URL` (6 vars) | Cloudflare R2 dashboard                                                                                        | ADR-005                                                              |
| `EMBEDDING_MODEL_ID`                                                                     | `Xenova/bge-small-en-v1.5` (default)                                                                           | ADR-003 amendment                                                    |
| `NODE_ENV`                                                                               | `production`                                                                                                   | enables OTel + secure cookies                                        |

Total: ~28 distinct env vars across providers. Documented in `.env.example`

- baked into `render.yaml` Blueprint as `envVars: [{ key: ..., sync: false }]`
  so Yogesh fills them once via the Render dashboard after Blueprint apply.

## Consequences

### Positive

- **$0/month staging** — Render Free + Neon Free + UptimeRobot Free.
  Hard Rule 1 preserved.
- **1-click Blueprint** via `render.yaml` — `git push` → Render
  detects Blueprint → Yogesh clicks "Apply" → service provisioned.
  No clicking through 6 form fields.
- **Migrations run automatically** on every deploy via
  `prisma migrate deploy` baked into the build command. M2-side
  schema changes (KB tables, future indexes) ship safely.
- **Smoke-test script** (`scripts/smoke-test-render.sh`) exercises
  `/health` + a magic-link send + audit chain HEAD check post-deploy
  so failure modes surface in <30s rather than via a stuck FE.
- **Cleanly separated from M0/M1 setup** — `qa-nexus-api-staging` lives
  alongside the original `qa-nexus-api` (if that Render service still
  exists from ADR-004's MS0-T011); no risk of cross-contamination.
- **DNS-ready** — service name + cookie-domain config support a future
  custom domain `api.qanexus.iksula.com` swap-in (ADR-007 contract).

### Negative

- **Scale-to-zero cold start** — Neon's serverless Postgres adds
  300-500 ms to the first query after idle. Mitigated by UptimeRobot
  5-min ping during pilot window (10 AM – 10 PM IST). Outside the
  window, first morning click waits ~1s.
- **Render free dyno still 512 MB** — same constraint that drove
  ADR-003 (bge-small embedding) + ADR-010 (pdf-parse). No change here.
- **Free tier limit: 750 hr/mo** — at 24/7 = 720 hr, so we have ~30 hr
  headroom. UptimeRobot pings keep dyno warm 12 hr/day = 360 hr/mo
  active runtime; the rest is sleep. Comfortably within budget.
- **Manual env-var fill** — 28 vars to paste once after Blueprint
  apply. Documented in runbook with a checklist; takes ~10 min.
- **Neon free tier: 0.5 GB storage** — at PM1 pilot scale (~50 KB
  per audit row × 1k rows/day × 30 days = 1.5 MB/mo) we're at ~0.3%
  capacity. Comfortable headroom for M2 + M3.
- **No Prisma `migrate dev` in production** — only `migrate deploy`
  runs on Render. Schema authoring stays local; Yogesh runs
  `pnpm prisma:migrate:dev` locally, commits the SQL, and `migrate
deploy` applies it on the next push.

### Mitigation plan

1. **Blueprint-first deploy** — Yogesh applies `render.yaml` once.
   Subsequent topology changes go through PR review, not dashboard
   clicks.
2. **Smoke-test before announcing** — every deploy MAIN/Yogesh
   announces in-channel runs `scripts/smoke-test-render.sh` first.
   Exits non-zero on any health-check failure.
3. **Audit chain verify post-deploy** — once the staging DB has
   real audit rows, `pnpm --filter @qa-nexus/api verify:audit` runs
   nightly (manual cron or GitHub Actions on a separate workflow).
4. **Followup `(ae)`** filed for "production deployment topology" —
   when M3 lands, add `qa-nexus-api-prod` with stricter cookie
   policy + paid Render tier consideration.

## Alternatives considered

### A. Stay on the M0 single-environment Render service

- **Pros:** Zero new setup; reuse existing service from ADR-004.
- **Cons:** No clean separation between M2 dev work + the audited
  M0/M1 baseline. Audit chain verifications would mix experimental
  M2 audit rows with M1 close-gate state. Violates "staging vs. prod"
  hygiene that becomes important at M3.
- **Verdict:** Rejected — naming + Blueprint discipline matters as we
  scale.

### B. Fly.io free tier instead of Render

- **Pros:** No scale-to-zero cold start (Fly keeps machines hot).
- **Cons:** Free tier = 3 shared-cpu-1x machines × 256 MB RAM each
  (less than Render's 512 MB single dyno); BetterAuth + Prisma +
  bge-small-en-v1.5 (~33 MB) + NestJS would push 350+ MB at boot —
  would OOM. Migration cost from Render setup also non-zero.
- **Verdict:** Rejected — RAM ceiling is the binding constraint.

### C. Railway free tier instead of Render

- **Pros:** Generous free trial credits ($5/mo).
- **Cons:** Free credits are time-bounded; once exhausted the service
  pauses. PM1's $0/month binding rule (Hard Rule 1) requires a
  permanently-free tier with no trial-clock behavior.
- **Verdict:** Rejected — credit-clock model conflicts with Hard Rule 1.

### D. Self-host on Yogesh's laptop with ngrok

- **Pros:** No cloud-provider risk; free.
- **Cons:** Requires Yogesh's laptop to be on 24/7; ngrok free tier
  rotates URLs every restart (breaks magic-link callback persistence);
  no real "production-like" environment for FE+1 to test against.
- **Verdict:** Rejected — operational fragility unacceptable for
  pilot scale.

## Cross-references

- `render.yaml` — Blueprint for 1-click service creation
- `docs/deploy/render-runbook.md` — manual setup runbook (M2 staging
  section added by this PR)
- `docs/deploy/uptimerobot-runbook.md` — keep-alive setup
- `docs/deploy/r2-runbook.md` — R2 bucket setup (ADR-005)
- `scripts/smoke-test-render.sh` — post-deploy smoke test
- `.env.example` — full env-var manifest
- `docs/architecture/adr-004-render-deployment.md` — original M0
  deploy decision (still authoritative for general Render free-tier
  reasoning)
- `docs/architecture/adr-007-cookie-domain.md` — wildcard parent
  cookies that staging URL must support
- `docs/architecture/adr-008-email-service-gmail-smtp.md` — SMTP env
  vars staging needs
