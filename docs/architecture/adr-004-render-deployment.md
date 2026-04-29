# ADR-004: Host the NestJS API on Render Free Hobby

- **Status:** Accepted
- **Date:** 2026-04-29
- **Deciders:** Yogesh Mohite (Admin), MAIN session
- **Related:** MS0-T011 · `docs/deploy/render-runbook.md` · `docs/deploy/uptimerobot-runbook.md` (mitigates Render's idle-sleep) · ADR-003 (embedding model load on free dyno)
- **Supersedes:** none
- **Superseded by:** none

---

## Context

PM1 needs a public-internet HTTPS endpoint for the NestJS API at $0/month for the 8-user pilot. Hard kickoff rule #1 forbids paid components without Yogesh's written sign-off + ADR.

Constraints:

- **Cost ceiling:** $0/month total infra. Even $5/mo upgrades require an ADR.
- **Pilot scale:** 8 named users, 7 days/week, 10 AM – 10 PM IST (12-hour daily window). Peak concurrency ~3-5 users.
- **Latency target:** "acceptable for daily QA work" (PM1_PRD §10 NFR-001). Not a hard SLA but should feel responsive.
- **Memory:** the NestJS process loads `@xenova/transformers` + `Xenova/bge-large-en-v1.5` embedding model (~280 MB resident at warm). Plus Prisma client + Express + the rest of Node = ~350-400 MB total at warm.
- **Region:** Neon DB is in Singapore (`ap-southeast-1`). API should be in the same region for low-latency queries.
- **Deploy automation:** every push to `main` should deploy without manual button-clicking.

## Decision

Host on **Render Free Hobby plan** (Singapore region) with auto-deploy from `main` branch. Mitigate the 15-min idle-sleep behavior via UptimeRobot 5-min HTTP checks against `/health` (per ADR / runbook for T015).

**Concrete config** (full table in `docs/deploy/render-runbook.md` Step 2):

| Setting       | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Plan          | Free                                                                                        |
| Region        | Singapore                                                                                   |
| Branch        | `main`                                                                                      |
| Build command | `pnpm install && pnpm --filter @qa-nexus/shared build && pnpm --filter @qa-nexus/api build` |
| Start command | `pnpm --filter @qa-nexus/api start:prod`                                                    |
| Auto-deploy   | On push to `main`                                                                           |
| Health check  | `GET /health` (Render's deploy-time check + UptimeRobot's 5-min keep-alive both use this)   |

## Consequences

### Positive

- **$0/month** confirmed. Free plan is 750 dyno-hours/month — single 24/7 dyno consumes ~720 hours, well under cap.
- **Single source of truth for deploy:** push to `main` → Render builds → live in ~3-4 min. No separate deploy script to maintain (vs Cloudflare Pages which uses `pnpm deploy:web` direct upload).
- **Region-matched with Neon:** Singapore-to-Singapore Postgres latency is ~5-10 ms, vs ~150 ms if API were in US-East.
- **No outbound IP whitelist** needed in Neon (Neon free tier accepts all IPs by default).
- **Native HTTPS** via Render's edge proxy — no ACME certbot to manage.

### Negative / accepted trade-offs

- **Cold-start ~10-15s** when dyno wakes from idle sleep. Mitigated by UptimeRobot 5-min ping during operating window (10 AM – 10 PM IST). Off-window cold-start (first morning click) is acceptable per kickoff §3.
- **512 MB RAM ceiling.** Embedding model (~280 MB) + NestJS (~70 MB) + Prisma (~30 MB) + buffers = ~400 MB peak. Tight but works. Mitigation if OOM: lazy-load model on first `/embedding` request instead of eager-load at bootstrap (see runbook Gotcha 3).
- **No autoscaling.** Single dyno only. Pilot scale fits; PM2 scale-up will need paid plan.
- **15 min build retention.** If a deploy fails partway and we need the build artifacts to debug, we have ~15 min to grab logs before they purge.
- **No database in Render.** Render offers free Postgres but with a 90-day expiration; we use Neon instead (see ADR-001 implicit for Neon choice).

### Neutral

- **Render's dashboard is browser-only** for setup. Cannot be automated from MAIN session today. Provisioning is human-driven (Yogesh) per `docs/deploy/render-runbook.md`. Future: Render's Terraform provider could automate, but adds dependency for $0 benefit at PM1 scale.

## Alternatives considered

### A. Railway

**Rejected.** Railway removed their free tier in 2023 (now $5/month minimum after a $5 trial credit). Not $0.

### B. Fly.io

**Considered, rejected.** Fly.io has a free tier (3 shared-cpu-1x VMs × 256 MB RAM = 768 MB total). 256 MB per VM is too tight for embedding model (~280 MB). Could spread across multiple VMs but adds complexity (load-balancing single-tenant API). Defer until PM1 hits Render's 512 MB ceiling.

### C. Self-host on Oracle Cloud Always Free (ARM Ampere VM, 24 GB RAM, 4 OCPU)

**Rejected** per CLAUDE.md ban list spirit (no self-hosting infra). Adds maintenance burden — OS updates, security patches, certbot, nginx config, log rotation, backup scripts. The point of the $0 commercial PaaS stack is "vendor handles ops". Even though Oracle is "free", the ops cost in human-hours is real.

### D. Vercel for the API

**Rejected.** Vercel's free tier allows serverless functions but not long-running Node servers. NestJS doesn't fit serverless cold-start budgets (~50ms target; our embedding model alone is 1.7s warm-load). Plus Vercel functions have 10s execution limit on free, killing any long LLM call. WebSocket support also limited.

### E. Cloudflare Workers

**Rejected.** Workers have a 10ms CPU-time limit on free, cannot run Node-only deps (Prisma needs Node `fs`/`crypto`/etc.), and don't support WebSockets the way our `@nestjs/websockets` setup expects. Also, our embedding model is WASM but at 280 MB exceeds Workers' bundle size limit.

### F. Heroku Eco

**Rejected.** Heroku Eco is $5/month — first paid component would break the cost gate. Also no free tier any more (the famous "Heroku free dyno" was sunset 2022).

## Open questions resolved

1. **What if 512 MB isn't enough?** Lazy-load the embedding model (defer the `pipeline()` call from bootstrap to first `/embedding` request). Costs ~38s latency on first post-deploy embedding request but keeps boot under 5s. Documented in render-runbook.md Gotcha 3.
2. **How do we recover from a bad deploy?** Render keeps last 5 successful deploys. One-click rollback via dashboard. Database migrations don't auto-rollback — see ADR-002 for the prisma-raw-split contract.
3. **What's the cost-gate alarm?** Render emails when account hits 80% of monthly hours. We monitor via the runbook's Step 8 weekly check.

## Cross-references

- `docs/deploy/render-runbook.md` — the executable provisioning runbook
- `docs/deploy/uptimerobot-runbook.md` — the keep-alive mitigation
- `docs/architecture/adr-003-embedding-model.md` — why bge-large-en-v1.5 (constrains memory budget for this ADR)
- `apps/api/.env.example` — env-var inventory referenced by runbook Step 3
- `CLAUDE.md` § "Locked tech stack" → "Hosting: Cloudflare Pages free (FE) + Render free Hobby (API) + Neon free (DB) + UptimeRobot 5-min keep-alive on /health"
- `PM1_ERD §M0_v8` — task T011 spec
