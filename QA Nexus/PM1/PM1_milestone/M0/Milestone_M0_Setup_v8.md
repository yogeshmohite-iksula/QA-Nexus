# Milestone M0: Infrastructure & Setup (PM1 v8.0 — locked free-OSS stack)

**QA Nexus PM1 — Foundational Plumbing on Free Tiers**

## Cover Page

| Property | Value |
|----------|-------|
| **Project** | QA Nexus PM1 (MVP / v1 GA) |
| **Milestone** | M0 — Infrastructure & Setup |
| **Version** | v8.0 (locked free-OSS, replaces v1.0) |
| **Date Created** | 2026-04-25 |
| **Status** | Approved — ready for kickoff |
| **Owner** | DevOps + Backend Lead |
| **Duration** | **2 weeks** (2026-04-27 → 2026-05-10) |
| **Team Size** | 3 FTE (1 DevOps/Backend Lead, 2 Backend) — reduced from 3 dedicated due to simpler stack |
| **Estimated Effort** | **~290 hours** (33 tasks: 31 v8.0 + 1 R3 mitigation T032 + 1 hook-hardening T033) — down from v1.0's 480 hours / 35 tasks |

---

## 1. Overview

**Mission:** Stand up the QA Nexus PM1 platform on entirely free-tier hosting so every later milestone (M1–M6) has a working baseline. **No GPU provisioning, no Oracle VM, no Ollama — all LLM via Groq free API.**

**Outcome at M0 exit:** End-to-end deployment pipeline runs on push to `main`. Frontend at `https://*.cloudflare-pages.dev`, API at `https://*.onrender.com`, Postgres on Neon, R2 bucket created, Resend sending emails, Grafana Cloud receiving traces, UptimeRobot pinging health endpoint. BetterAuth magic link + RBAC working. F06 Sign In + F06b Set Password + F07 Founder Onboarding shells render. **Pilot users cannot use the system yet** — only infrastructure is ready.

**Primary Deliverables (v8.0):**
- Monorepo scaffold (**Next.js 15 frontend + NestJS 10 API**, managed by Turborepo or pnpm workspaces — **no FastAPI**, **no Python service**)
- GitHub Actions CI/CD pipeline (lint, test, type-check, build; deploy on push to main)
- **Cloudflare Pages** project for the frontend (auto-deploy from GitHub)
- **Render free** Hobby web service for the NestJS API + WebSocket gateway (single dyno, 512 MB RAM)
- **Neon free** Postgres project with **pgvector** extension enabled (NOT pgvectorscale — not on free tier)
- **Cloudflare R2** bucket created with CORS policy + presigned URL workflow tested
- **Resend** account configured with verified domain (or default sender for pilot)
- **Grafana Cloud free** stack with OpenTelemetry exporter from NestJS
- **Better Stack** alerting setup with Slack integration
- **UptimeRobot free** keep-alive monitor pinging `/health` every 5 minutes
- **Groq + Gemini API keys** stored in Render env vars; LLM gateway module wired up
- **`@xenova/transformers`** loaded in NestJS with Qwen3-Embedding-0.6B model warmed in memory

**Explicitly DROPPED from M0 (deferred to PM2+ if ever needed):**
- ❌ Oracle Always Free VM provisioning
- ❌ Ollama install + Gemma 4 26B MoE model pull (~16 GB)
- ❌ FastAPI inference service scaffold + Docker image
- ❌ Redis 7 install (Upstash or on-VM)
- ❌ Neo4j Community install
- ❌ BullMQ workers
- ❌ Self-hosted Vault / OpenBao for secrets (using Render env vars in PM1)
- ❌ Prometheus / SigNoz self-host (using Grafana Cloud free)
- ❌ PagerDuty integration (using Better Stack free for pilot)
- ❌ Vercel for frontend (using Cloudflare Pages — better free tier)
- ❌ Hetzner / AWS GPU VM

---

## 2. Tech Stack (binding for M0)

### 2.1 Languages and runtimes

| Component | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | Both frontend and backend |
| TypeScript | 5.x | Strict mode |
| pnpm | latest | Workspace management |
| Python | n/a in PM1 | (Used only for engineering DeepEval batches on Colab Free) |

### 2.2 Frontend

| Component | Version | Source |
|---|---|---|
| **Next.js** | **15** | App Router, React 19, RSC |
| **React** | **19** | useActionState, useFormStatus |
| **Tailwind CSS** | **4** | CSS-first config |
| **shadcn/ui** | latest | Copy-paste, MIT |
| **Sonner** | latest | Replaces deprecated toast |
| **lucide-react** | latest | Icons |
| **react-hook-form** | 7.x | + Zod resolver |
| **Zod** | 3.x | Shared schemas with NestJS |
| **Framer Motion** | latest | Live-state animations (F19, F26) |
| **TanStack Query** | 5.x | Server-state cache |
| **TipTap** | latest | Rich text in F15, F22 |

### 2.3 Backend

| Component | Version | Source |
|---|---|---|
| **NestJS** | 10.x | REST + WebSocket in one service |
| **Prisma** | 5.x | Type-safe migrations + queries |
| **BetterAuth** | latest | Magic link + Jira OAuth 3LO |
| **`@xenova/transformers`** | latest | Qwen3-Embedding-0.6B in-process |
| **`@nestjs/websockets`** | 10.x | WebSocket gateway |
| **Groq SDK** | latest | LLM API client |
| **`@google/generative-ai`** | latest | Gemini fallback client |

### 2.4 Hosting (all free)

| Layer | Provider | Free tier spec |
|---|---|---|
| Frontend | Cloudflare Pages | Unlimited bandwidth, 500 builds/month, 100K function reqs/day |
| API + WebSocket | Render free Hobby | 750 hr/month, 512 MB RAM, 0.5 CPU, sleeps 15min idle |
| Postgres + pgvector | Neon free | 0.5 GB, 100 CU-hr/month, scale-to-zero |
| Object storage | Cloudflare R2 free | 10 GB, 1M Class A, 10M Class B ops |
| Email | Resend free | 100/day, 3,000/month |
| Keep-alive | UptimeRobot free | 50 monitors, 5-min ping |
| Observability | Grafana Cloud free | 50 GB logs, 10K series metrics, 50 GB traces |
| Alerting | Better Stack free | Slack integration, on-call schedule |
| Source / CI/CD | GitHub + Actions | Free private repos, 2,000 min/month |

### 2.5 LLM (free APIs)

| Use case | Model | Free tier |
|---|---|---|
| A1 primary | `openai/gpt-oss-120b` (Groq) | 1,000 RPD |
| A1 long-context | `meta-llama/llama-4-scout-17b-16e-instruct` (Groq, preview) | varies |
| A4 RCA primary | `openai/gpt-oss-120b` (Groq) | shares 1,000 RPD pool |
| A4 fast layers | `openai/gpt-oss-20b` (Groq) | 14,400 RPD |
| Fallback | Gemini 2.5 Flash (Google AI Studio) | 1,500 RPD |

### 2.6 Embedding

| Component | Spec |
|---|---|
| Model | Qwen3-Embedding-0.6B (Apache 2.0, 1024-dim) |
| Runtime | `@xenova/transformers` ONNX runtime, in-process WASM |
| Footprint | ~200 MB RAM, ~50 ms per embedding on Render's 0.5 vCPU |
| No separate service | Runs as TS module inside NestJS |

---

## 3. M0 Task List (v8.0 — 33 tasks, ~290 hours; +1 R3 add-on T032 + 1 hook-hardening T033, both patched 2026-04-26)

### Phase 1: Bootstrapping (Days 1–3) — ~70 hours

| ID | Task | Description | Pri | Hours | Owner |
|---|---|---|---|---|---|
| **MS0-T001** | Repo + monorepo setup | `git init` private repo on GitHub. pnpm workspaces with `apps/web`, `apps/api`, `packages/shared`. `.gitignore`, `.editorconfig`, `.prettierrc`, `.eslintrc`. Conventional commits via husky + commitlint. | P0 | 8 | DevOps |
| **MS0-T002** | Next.js 15 web scaffold | `pnpm create next-app apps/web --typescript --tailwind --app`. Add Tailwind 4 config, shadcn/ui CLI init (`npx shadcn@latest init`), install Sonner, lucide-react, react-hook-form, Zod, Framer Motion, TanStack Query. Verify `pnpm dev` runs. | P0 | 12 | Backend 1 (FE) |
| **MS0-T003** | NestJS 10 API scaffold | `pnpm dlx @nestjs/cli new apps/api`. Add Prisma 5, Zod, BetterAuth, `@nestjs/websockets`, `@xenova/transformers`, Groq SDK, `@google/generative-ai`. Verify `pnpm start:dev` runs. | P0 | 12 | Backend 2 |
| **MS0-T004** | Shared package | `packages/shared` for Zod schemas reused FE+BE. Set up TypeScript path aliases. | P0 | 6 | Backend 1 |
| **MS0-T005** | GitHub Actions CI | `.github/workflows/ci.yml`: install pnpm → typecheck → lint → test → build for both apps. Run on PR + main. | P0 | 8 | DevOps |
| **MS0-T006** | Pre-commit hooks | husky pre-commit (lint-staged for prettier + eslint), pre-push (typecheck). | P1 | 4 | DevOps |
| **MS0-T007** | README + onboarding doc | Local setup runbook, env var checklist, common commands. | P1 | 8 | DevOps |
| **MS0-T008** | `.env.example` files | Template for all required env vars (DATABASE_URL, GROQ_API_KEY, GEMINI_API_KEY, RESEND_API_KEY, R2_*, BETTER_AUTH_*, etc.). Document each. | P0 | 4 | DevOps |
| **MS0-T009** | Local dev with Docker Compose (optional) | Postgres 15 + pgvector container for offline dev. NOT used in production (Neon hosts prod). | P1 | 8 | DevOps |

### Phase 2: Hosting setup (Days 4–6) — ~60 hours

| ID | Task | Description | Pri | Hours | Owner |
|---|---|---|---|---|---|
| **MS0-T010** | Cloudflare Pages project | Connect GitHub repo, configure build command (`pnpm install && pnpm build --filter=web`), output dir, env vars. Enable preview deploys per branch. Verify auto-deploy on push. | P0 | 6 | DevOps |
| **MS0-T011** | Render free service for API | Create web service from GitHub repo. Build command, start command, env vars. **Critical: select free Hobby plan.** Configure auto-deploy from main. Test deploy. | P0 | 6 | DevOps |
| **MS0-T012** | Neon Postgres project + pgvector | Create Neon project (free tier). Run `CREATE EXTENSION pgvector;`. Create database. Set connection string in Render env vars. Verify NestJS connects via Prisma. | P0 | 6 | DevOps |
| **MS0-T013** | Cloudflare R2 bucket + CORS | Create bucket `qa-nexus-evidence-pm1`. Configure CORS for frontend uploads (allow Cloudflare Pages domain). Generate API tokens (read + write). Store in Render env vars. | P0 | 6 | DevOps |
| **MS0-T014** | Resend email config | Sign up, add domain or use default sender. Generate API key. Test send via curl. Store in Render env vars. | P0 | 4 | DevOps |
| **MS0-T015** | UptimeRobot keep-alive | Add HTTP monitor on `https://[render-url]/health`, 5-min interval. Slack alert on downtime. | P0 | 2 | DevOps |
| **MS0-T016** | Custom domain — **DEFERRED to PM2** | Decision 2026-04-26 (Yogesh): use free `*.cloudflare-pages.dev` for the entire PM1 pilot. Custom domain purchase + DNS configuration deferred to PM2. | P3 | 0 | DevOps |
| **MS0-T017** | Groq + Gemini API keys | Sign up Groq + Google AI Studio (both free, no credit card). Generate keys, test via curl. Store in Render env vars (NOT in repo). | P0 | 4 | Backend 1 |
| **MS0-T018** | Backup automation | GitHub Actions cron weekly: `pg_dump` from Neon → upload to R2 with timestamp. Verify restore once. | P1 | 8 | DevOps |
| **MS0-T019** | Grafana Cloud + Better Stack | Sign up Grafana Cloud free tier. Install OTel collector in NestJS. Sign up Better Stack free; configure log/trace forwarding + Slack alerts. | P1 | 14 | DevOps |

### Phase 3: Core API skeleton (Days 7–10) — ~140 hours

| ID | Task | Description | Pri | Hours | Owner |
|---|---|---|---|---|---|
| **MS0-T020** | Prisma schema + migrations | Define TB-001 through TB-021 in `prisma/schema.prisma` (includes TB-019 `llm_provider`, TB-020 `llm_provider_model`, TB-021 `agent_model_assignment` for Day-0 LLM config flow). Run `prisma migrate dev`. Verify Postgres has tables. Add HNSW indexes for vector columns via raw SQL migration. | P0 | 16 | Backend 2 |
| **MS0-T021** | BetterAuth integration | Configure BetterAuth Postgres adapter (sessions in DB, no Redis). Magic link via Resend. Implement /auth/sign-up, /auth/sign-in, /auth/callback. Test E2E. | P0 | 16 | Backend 1 |
| **MS0-T022** | RBAC guard | NestJS guard reading user role from session. 4 roles: Admin, Lead, QA Engineer, Stakeholder. Decorator `@Roles(Role.Admin)` on endpoints. Test positive + negative paths. | P0 | 12 | Backend 1 |
| **MS0-T023** | LLM gateway module | TS module with primary→fallback retry logic. `LLMGateway.complete(prompt, options)` returns text. Detects 429/503 from Groq, falls back to Gemini. Logs every call to OTel. | P0 | 16 | Backend 2 |
| **MS0-T024** | Embedding service | Load Qwen3-Embedding-0.6B via `@xenova/transformers` at startup (lazy or eager). `EmbeddingService.embed(text)` returns 1024-dim vector. Cache model in memory. | P0 | 8 | Backend 2 |
| **MS0-T025** | Health endpoint | `/health` returns DB ping + LLM gateway ping + R2 ping + free-tier quota status. UptimeRobot pings this. | P0 | 4 | Backend 1 |
| **MS0-T026** | WebSocket gateway scaffold | `@nestjs/websockets` setup. Auth check on connection. Test echo handler. Will be used by F19 in M4. | P1 | 8 | Backend 1 |
| **MS0-T027** | Audit log service | NestJS module that writes HMAC-SHA256 chained rows to `audit_log` table. Used by every state-changing operation. Verifies chain integrity on read. | P0 | 12 | Backend 2 |
| **MS0-T028** | F06 Sign In page | First UI rendering: F06 from `PM1_UI_v2/frame  html view/F06 Sign In.html` → React component using shadcn/ui. Wire up to BetterAuth. Visual parity check vs locked frame. | P0 | 16 | Backend 1 (FE) |
| **MS0-T029** | F06b Set Password page | F06b from `PM1_UI_v2/frames - claude code build/F06b Set Reset Password.html` → React component. Magic-link landing flow. | P0 | 12 | Backend 1 (FE) |
| **MS0-T030** | F07 Founder Onboarding scaffold | F07 from `PM1_UI_v2/frame  html view/F07 First-Run Onboarding.html` → React component (UI shell only; backend wiring in M1). | P1 | 12 | Backend 1 (FE) |
| **MS0-T031** | E2E smoke test | Playwright test: visit Cloudflare Pages URL → click Sign In → magic link in Resend mailbox → click → redirected to F07. Runs in CI on every PR. | P0 | 8 | DevOps |
| **MS0-T032** | A1/A2/A4 golden-set seed (R3 mitigation add-on, parallel to T020–T031) | Build evaluation seed for the 3 PM1 agents. Deliverables: (a) 20 RET requirements with hand-graded "expected test cases" → A1 golden set; (b) 50 known-duplicate defect pairs from prior CART/RET sprints → A2 golden set; (c) 50 historical defects with manually-classified root-cause layers (L1 Stack / L2 Env / L3 Config / L4 Code / L5 Data) → A4 golden set. Storage: `apps/api/test/golden-sets/{a1,a2,a4}/*.json` + `apps/api/test/golden-sets/README.md`. Drives weekly DeepEval runs starting M3. Patched into v8.0 on 2026-04-26 per Phase 0.5 R3 mitigation; cheap insurance against late eval-failure surprises that would risk PM1_ERD §10 acceptance gates 2/3/4. | P1 | 16 | Yogesh + Akshay |
| **MS0-T033** | Hook hardening — version-pin enforcement on locked deps | Upgrade `.claude/hooks/pre-tool-use/enforce-pm1-stack.sh` to enforce major-version constraints (not just package names) on the PM1 locked stack. Block Edit|Write to package.json / pnpm-lock.yaml when: (a) `next` major != 15, (b) `react` major != 19, (c) `tailwindcss` major != 4, (d) `@nestjs/core` major != 10, (e) `prisma` major != 5, (f) `engines.node` not matching `>=20`. Use `jq` + minimal semver compare. Rationale: original hook caught the **Next.js 16 scaffold slip on 2026-04-26 only at the dry-run stage** (post-scaffold, pre-install) — version-pin enforcement would have blocked at scaffold time. Patched into v8.0 on 2026-04-26 per the post-MS0-T002 finding. | P0 | 4 | DevOps |

---

## 4. Acceptance Criteria (M0 exit gates — binding)

M0 cannot close unless ALL of these pass:

- [ ] **MS0-AC001** Frontend live at Cloudflare Pages URL with HTTPS; F06 Sign In renders
- [ ] **MS0-AC002** API live at Render URL; `/health` returns 200 with all subsystem pings green
- [ ] **MS0-AC003** Postgres on Neon has all 21 PM1 tables (TB-001 through TB-021, including TB-019/020/021 LLM provider tables) with HNSW indexes
- [ ] **MS0-AC004** Cloudflare R2 bucket exists with CORS configured; presigned upload tested from frontend
- [ ] **MS0-AC005** BetterAuth magic-link flow works end-to-end (Resend → email → click → session)
- [ ] **MS0-AC006** RBAC guard rejects unauthorized requests (positive + negative tests pass)
- [ ] **MS0-AC007** LLM gateway successfully calls Groq `gpt-oss-120b` and falls back to Gemini on simulated 429
- [ ] **MS0-AC008** Embedding service produces 1024-dim vector for sample test case in <200 ms
- [ ] **MS0-AC009** UptimeRobot ping every 5 min keeps Render dyno warm during business hours
- [ ] **MS0-AC010** GitHub Actions CI passes (lint + typecheck + test + build) on PR
- [ ] **MS0-AC011** GitHub Actions deploy pipeline auto-deploys to Cloudflare Pages + Render on push to main
- [ ] **MS0-AC012** Weekly backup cron runs once successfully; pg_dump uploaded to R2; restore drill verified
- [ ] **MS0-AC013** OpenTelemetry traces appear in Grafana Cloud dashboard
- [ ] **MS0-AC014** Better Stack receives logs and fires test alert to Slack; **ALSO: ping-miss >10 min alert wired** (per R1 mitigation, patched 2026-04-26 — fires when UptimeRobot detects the Render free dyno sleeping during pilot hours)
- [ ] **MS0-AC015** **No service is paid** — all free tiers. Engineering Lead sign-off on cost: $0/month
- [ ] **MS0-AC016** Documentation complete: README, onboarding runbook, env var checklist, deployment runbook
- [ ] **MS0-AC017** All API keys stored in Render env vars; `.env.example` updated; nothing in repo
- [ ] **MS0-AC018** Audit log service writes HMAC-chained rows on every test write; chain integrity verified
- [ ] **MS0-AC019** Playwright smoke test passes in CI: load FE → sign in → land on F07

---

## 5. Risk Register (M0)

| Risk | Severity | Mitigation |
|---|---|---|
| Render free dyno sleeps during demo | 🟠 Medium | UptimeRobot 5-min ping; Slack alert if missing |
| Neon free 0.5 GB storage runs out | 🟢 Low | PM1 schema + pilot data ~50 MB; >500 MB headroom |
| Groq free tier rate limits | 🟢 Low | Gemini fallback; 1,000 RPD vs ~140 expected |
| Cloudflare Pages cold builds slow | 🟢 Low | Build time ~2 min; CI cache enabled |
| Free tier policy changes mid-pilot | 🟡 Medium | OSS migration paths documented in PM1_ERD §8.8 |
| Engineer unfamiliar with stack | 🟡 Medium | Onboarding doc; pair-program M0 W1 |
| Magic link emails caught in spam | 🟡 Medium | Verify domain in Resend; test deliverability with team |

---

## 6. Sign-off

M0 closes when all 19 acceptance criteria pass and:
- Engineering Lead has signed off on free-tier cost = $0/month
- DevOps confirms 4-hour RTO restore drill completed
- Pilot users (8) can attempt to sign in via magic link (even if they get F07 stub)

**Next milestone:** M1 — Users & Roles (kickoff 2026-05-11). Detailed task list in `M1/Milestone_M1_Users_Roles.md` (will be redrafted to v8.0 before M1 start).

---

**End of Milestone M0 v8.0 — locked free-OSS infrastructure for QA Nexus PM1 pilot.**
