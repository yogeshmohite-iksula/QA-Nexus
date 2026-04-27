# QA Nexus PM1 — Architecture

Last updated: 2026-04-27 (P0.4 in `docs/audits/2026-04-27-skill-alignment-audit.md`).

This document is the engineering map of QA Nexus PM1 — what's built, what
ships where, and how the pieces talk. Source of truth for FE/BE separation,
deploy targets, and runtime contracts. Cross-link from `docs/PROJECT_SPEC.md`
Part B (Engineering Requirements) and `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` for
the canonical entity inventory.

---

## 1. System overview

QA Nexus PM1 is an **AI-native QA management platform** for Iksula Services'
internal pilot (8 named users, 7 days/week, 10 AM – 10 PM local). It ships
41 React-ported frames spanning auth → dashboards → docs → test cases →
defects → reports, backed by a single NestJS API service, Postgres + pgvector
on Neon, and Groq + Gemini for LLM workloads.

The architecture is deliberately **two-tier and free-tier**:

```
                 ┌─────────────────────────────────────────────┐
                 │  USER (browser)                              │
                 │  Chrome / Safari / Edge — desktop + mobile   │
                 │  Static HTML + React 19 client hydration     │
                 └────────────────┬─────────────────────────────┘
                                  │ HTTPS
                                  │
   ┌──────────────────────────────┴──────────────────────────────────┐
   │  CLOUDFLARE PAGES — qa-nexus-web (free tier)                    │
   │  apps/web/out/ static export served from CF edge globally       │
   │    /sign-in/ /set-password/ /sign-in/forgot/ + 38 future routes │
   │    Next.js 15 App Router, output: 'export', trailingSlash: true │
   │    No Node runtime, no API routes, no middleware                │
   └────────────────┬────────────────────────────────────────────────┘
                    │ fetch + WebSocket (cross-origin, CORS allow)
                    ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  RENDER FREE HOBBY — qa-nexus-api (single dyno)                 │
   │  apps/api/ NestJS 10 (REST + WebSocket via @nestjs/websockets)  │
   │    /auth/*    BetterAuth (Postgres adapter, magic link / email) │
   │    /v1/*      RBAC-guarded resource routes (4 roles)            │
   │    /llm/*     Groq + Gemini gateway (primary→fallback retry)    │
   │    /embed     @xenova/transformers Qwen3-0.6B in-process WASM   │
   │    /health    DB + LLM + R2 ping + free-tier quota status       │
   │    /ws        WebSocket gateway (Run Console live updates)      │
   │  Cold start ~30s after 15-min idle (UptimeRobot keep-alive)     │
   └────┬─────────────────┬────────────────────┬─────────────────────┘
        │                 │                    │
        │ Prisma 5        │ presigned URL      │ HTTPS
        │ (HNSW)          │ direct upload      │
        ▼                 ▼                    ▼
   ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐
   │ NEON     │   │ CF R2 free   │   │ EXTERNAL APIs       │
   │ Postgres │   │ object       │   │  - Groq (LLM)       │
   │  15 +    │   │ storage      │   │  - Gemini (fallback)│
   │ pgvector │   │ (uploads,    │   │  - Resend (email)   │
   │ 0.5 GB   │   │  exports,    │   │  - Jira OAuth (M4)  │
   │ free     │   │  pg_dump)    │   │                     │
   └──────────┘   └──────────────┘   └─────────────────────┘

         Observability (OTel SDK in NestJS):
         ┌────────────────────────────────────────────┐
         │  Grafana Cloud free  ←  traces + metrics   │
         │  Better Stack free   ←  logs + Slack alerts│
         │  UptimeRobot         ←  /health every 5min │
         └────────────────────────────────────────────┘
```

**Cost:** $0/month total at 8-user pilot scale. Hard cost gate per CLAUDE.md.

---

## 2. Frontend Architecture (apps/web)

### Stack

| Layer             | Technology                              | Purpose                                               |
| ----------------- | --------------------------------------- | ----------------------------------------------------- |
| Framework         | Next.js 15 (App Router)                 | File-system routing, RSC, static prerender            |
| UI library        | React 19                                | Component model                                       |
| Styling           | Tailwind CSS 4 (CSS-first config)       | Utility classes; `@theme inline` in `globals.css`     |
| Component pattern | shadcn/ui (CVA + clsx + tailwind-merge) | Per-app component copies in `apps/web/components/ui/` |
| Forms             | react-hook-form + Zod (shared schemas)  | Type-safe form state; same Zod schema as BE           |
| Icons             | lucide-react                            | Outline-only icon set                                 |
| Animation         | Framer Motion                           | Page transitions, micro-interactions                  |
| Toasts            | Sonner                                  | Success / fail notifications                          |
| Server state      | TanStack Query v5                       | API cache, optimistic updates, retry                  |
| Editor            | TipTap                                  | M3 test-case editor (BDD + traditional)               |

### Layout

```
apps/web/
├── app/
│   ├── layout.tsx              Root layout (next/font, suppressHydrationWarning on body)
│   ├── globals.css             PM1 design tokens + Tailwind 4 @theme inline
│   ├── page.tsx                Client-side redirect → /sign-in/
│   └── (auth)/
│       ├── sign-in/page.tsx           F06 Sign In
│       ├── sign-in/forgot/page.tsx    F06c Reset Password (Mode B)
│       └── set-password/page.tsx      F06b Set Password (Mode A)
├── components/
│   ├── ui/                     shadcn-pattern (button, input)
│   └── auth/                   brand-mark, evidence-mesh, password-input,
│                               password-strength-card, pulse-dot
├── lib/
│   └── utils.ts                cn() helper
├── next.config.ts              output: 'export' + trailingSlash: true
├── wrangler.toml               CF Pages config (Direct Upload mode)
└── out/                        Static build output (gitignored)
```

### Routing model

**100% static prerender** (output: 'export'). All routes resolve to
`out/<route>/index.html`. CF Pages serves from edge with HTTPS automatic.

| Route              | Component                                   | Static? |
| ------------------ | ------------------------------------------- | ------- |
| `/`                | `app/page.tsx` (client-side redirect)       | ✅      |
| `/sign-in/`        | `app/(auth)/sign-in/page.tsx` (F06)         | ✅      |
| `/sign-in/forgot/` | `app/(auth)/sign-in/forgot/page.tsx` (F06c) | ✅      |
| `/set-password/`   | `app/(auth)/set-password/page.tsx` (F06b)   | ✅      |
| `/_not-found`      | Next default 404                            | ✅      |

The 38 remaining frames (F07 → F28m1) follow the same App Router pattern.

### Responsive Web Design (CLAUDE.md Rule 12, BINDING)

Every ported frame is mobile-first. Breakpoints `sm: 640 / md: 768 / lg: 1024 / xl: 1280 / 2xl: 1536`. NO horizontal scroll at any viewport ≥ 320 px. See `.claude/memory/domain/architecture.md` for the full pattern (two-panel auth layout, hidden brand panel below `lg`, mobile-only BrandMark, hero typography scale `40px → 56px (xl:)`).

---

## 3. Backend Architecture (apps/api)

### Stack

| Layer         | Technology                                              | Purpose                                                                        |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Framework     | NestJS 10 (Express engine)                              | DI, modules, guards, interceptors                                              |
| Transport     | REST + WebSocket via `@nestjs/websockets` + `ws`        | F19 Run Console live updates need WS                                           |
| Validation    | Zod (shared with FE via `packages/shared`)              | Single source of truth for schemas                                             |
| ORM           | Prisma 5                                                | Type-safe DB access; raw SQL escape for HNSW                                   |
| Auth          | BetterAuth (Postgres adapter; **NOT Redis**)            | Magic-link via Resend; sessions in Postgres                                    |
| RBAC          | NestJS guards + `@Roles()` decorator                    | 4 roles: Admin / Lead / QA Engineer / Stakeholder                              |
| LLM           | Groq SDK (primary) + `@google/generative-ai` (fallback) | Single `LLMGateway.complete(prompt, options)` interface; auto-retry on 429/503 |
| Embeddings    | `@xenova/transformers` (Qwen3-Embedding-0.6B WASM)      | In-process; 1024-dim vectors; ~50ms/embed                                      |
| Audit         | HMAC-SHA256 chained Postgres rows (PM1_ERD §3.13)       | Every state-changing op                                                        |
| Observability | OpenTelemetry SDK                                       | Per-request traces → Grafana Cloud + Better Stack                              |

### Layout (planned, lands MS0-T020+)

```
apps/api/
├── src/
│   ├── main.ts                       NestFactory bootstrap
│   ├── app.module.ts                 Root module
│   ├── prisma/
│   │   ├── schema.prisma             21 tables: TB-001 → TB-021
│   │   └── migrations/               Prisma migrations + raw-SQL HNSW indexes
│   ├── auth/                         BetterAuth integration (T021)
│   ├── rbac/                         @Roles() decorator + guard (T022)
│   ├── llm/                          LLMGateway service (T023)
│   ├── embeddings/                   EmbeddingService (T024)
│   ├── health/                       /health endpoint (T025)
│   ├── ws/                           WebSocket gateway (T026)
│   ├── audit/                        HMAC-SHA256 audit log (T027)
│   └── modules/
│       ├── projects/                 F09 Projects List + project mgmt
│       ├── docs/                     M2 Document Catalog
│       ├── kb/                       M2 KB with embeddings
│       ├── test-cases/               M3 (BDD + traditional)
│       ├── runs/                     M4 Run Console + WS live updates
│       ├── defects/                  M4 + A4 5-Layer RCA
│       ├── jira/                     M4 OAuth 2.0 3LO sync
│       ├── reports/                  M5 Reports Studio
│       └── agents/                   F26 + F26m1 model assignment
├── test/
│   └── golden-sets/                  T032 — A1/A2/A4 eval seeds
├── package.json                      NestJS 10 + Prisma 5 + ...
└── prisma/                           (above; symlinked from src/prisma/)
```

### API surface (planned)

Real endpoints land in MS0-T020+ (M1). Endpoint table will live in
`docs/PROJECT_SPEC.md` Part B as routes ship. Examples:

| Method | Endpoint             | Auth required? | Notes                           |
| ------ | -------------------- | -------------- | ------------------------------- |
| POST   | `/auth/sign-up`      | no             | BetterAuth (T021)               |
| POST   | `/auth/sign-in`      | no             | Magic-link via Resend           |
| POST   | `/auth/set-password` | reset-token    | F06b/F06c backend               |
| GET    | `/health`            | no             | Public; UptimeRobot ping target |
| GET    | `/v1/projects`       | yes (RBAC)     | F09 Projects List               |
| WS     | `/ws/runs/:runId`    | yes (RBAC)     | F19 live updates                |

---

## 4. Database (Postgres 15 + pgvector on Neon free)

- **21 tables:** TB-001 through TB-021. Inventory in `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` §3.
- **TB-019 / TB-020 / TB-021** are LLM provider configuration tables (provider keys, agent-model assignments, prompt templates).
- **HNSW indexes** on vector columns (1024-dim, Qwen3-0.6B output) — created via raw-SQL migration alongside Prisma migrations (`prisma migrate dev` + manual `migration.sql` for `CREATE INDEX ... USING hnsw (...)`).
- **Connection:** `$NEON_DATABASE_URL` in Render env vars; local `.env` for dev (gitignored).
- **Backups:** weekly `pg_dump` cron (GitHub Actions) → CF R2 with 30-day retention. Restore drill executed in MS0-T018 acceptance.

Detailed notes in `.claude/memory/tools/database.md`.

---

## 5. LLM gateway (apps/api/src/llm)

Single `LLMGateway.complete(prompt, options)` interface backed by:

| Provider | Model                                       | Daily limit    | Use case                                                |
| -------- | ------------------------------------------- | -------------- | ------------------------------------------------------- |
| Groq     | `openai/gpt-oss-120b`                       | 1,000 req/day  | **Primary** — most A1/A2/A4 calls (500 tok/s, 131K ctx) |
| Groq     | `meta-llama/llama-4-scout-17b-16e-instruct` | preview        | Long-context fallback (10M tokens)                      |
| Groq     | `openai/gpt-oss-20b`                        | 14,400 req/day | Fast layers (low-latency utility calls)                 |
| Gemini   | `gemini-2.5-flash`                          | 1,500 req/day  | Fallback on Groq 429/503 (R3 mitigation)                |

**Retry contract:** primary → fallback on 429/503 with exponential backoff. Every call logs prompt hash + model + tokens + latency + cost via OTel.

**Eval:** weekly DeepEval on Colab Free starting M3, using golden-set seeds in `apps/api/test/golden-sets/` (MS0-T032).

---

## 6. Storage (Cloudflare R2 free)

- **User uploads** (test artifacts, defect attachments): presigned URL flow — FE requests presigned PUT URL from API, then uploads directly to R2 (bypasses 512 MB Render dyno memory limit).
- **Exports** (PDF reports, CSV exports): API generates → uploads to R2 → returns signed download URL with 24h TTL.
- **Backups** (weekly `pg_dump`): GitHub Actions cron → R2 with timestamp + 30-day retention.
- **CORS:** restricted to `*.qa-nexus-web.pages.dev`.

---

## 7. Deployment topology

| Component     | Host                         | Mode                                                           | Cost                                          |
| ------------- | ---------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| FE static     | Cloudflare Pages             | Direct Upload (`pnpm deploy:web`); GitHub auto-deploy deferred | $0 (free tier; 500 builds/mo limit)           |
| API           | Render free Hobby            | Auto-deploy from `main` branch (planned, MS0-T011)             | $0 (free dyno; cold starts after 15-min idle) |
| DB            | Neon free                    | Scale-to-zero on idle                                          | $0 (0.5 GB cap)                               |
| Storage       | Cloudflare R2 free           | Presigned URLs from FE                                         | $0 (10 GB / month transfer)                   |
| Email         | Resend free                  | API key in Render env vars                                     | $0 (3,000 emails/mo)                          |
| Monitor       | UptimeRobot                  | 5-min HTTP ping `/health`                                      | $0 (50 monitors free)                         |
| Observability | Grafana Cloud + Better Stack | OTel from NestJS                                               | $0 (free tiers)                               |
| CI            | GitHub Actions               | On PR + main (MS0-T005, queued)                                | $0 (2,000 min/mo)                             |

**Total: $0/month confirmed for the 8-user × 12-hr/day pilot.**

Detailed deploy notes per service:

- **CF Pages:** `docs/deploy/cloudflare-pages.md` (live)
- **Render API:** `docs/deploy/render.md` (lands with MS0-T011)
- **Neon:** `docs/deploy/neon.md` (lands with MS0-T012)
- **R2:** `docs/deploy/cloudflare-r2.md` (lands with MS0-T013)

---

## 8. Audit + observability

- **Audit log** (PM1_ERD §3.13): every state-changing operation appends an HMAC-SHA256-chained row to the `audit_log` Postgres table. Visible in F28 Settings & Audit.
- **OTel traces** (every API request): NestJS interceptor → OTLP exporter → Grafana Cloud. Per-request trace ID in response header for support escalations.
- **Logs** (errors, integration failures): NestJS logger → Better Stack → Slack alert on P0 errors.
- **Uptime** (R1 mitigation): UptimeRobot pings `/health` every 5 min during 10 AM – 10 PM IST. Better Stack alert if >10 min ping miss → Slack.

---

## 9. Hooks + dev safety net

`.claude/hooks/` — 6 custom hooks (5 PM1-specific + 1 skill-spec):

| Hook                                    | When            | Purpose                                                                          |
| --------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `pre-tool-use/inject-memory.sh`         | every tool call | Auto-prepend `.claude/memory/memory.md` so Claude sees binding context           |
| `pre-tool-use/block-dangerous.sh`       | Bash            | Block `rm -rf`, `DROP TABLE`, `--force`, etc.                                    |
| `pre-tool-use/enforce-design-tokens.sh` | Edit/Write      | Block non-whitelisted hex / Tailwind color classes / MD3 tokens in `apps/web/**` |
| `pre-tool-use/enforce-pm1-stack.sh`     | Edit/Write      | Block ban-list deps + major-version drift on locked-deps.json (T033)             |
| `post-tool-use/audit-log.sh`            | every tool call | Append JSONL line to `.claude/audit.jsonl`                                       |
| `prompt-submit/load-binding-context.sh` | every prompt    | Prepend 7-line binding context note                                              |

**Planned:** `enforce-rwd.sh` (MS0-T034, P1) — block `w-[≥200px]` and `max-w-[1600px]` in `apps/web/**`.

---

## 10. Tech debt + known constraints

- **GitHub auto-deploy on CF Pages** — currently Direct Upload; GitHub integration deferred.
- **Sentry / error tracking** — using Better Stack for now; reconsider Sentry free at M5 if needed.
- **prisma schema hot-reload** — Prisma 5 doesn't watch schema changes; manual `prisma generate` after edits.
- **Render cold-start** — ~30s after 15-min idle; UptimeRobot mitigates during pilot hours but new visitors outside 10 AM – 10 PM may hit it. Acceptable per pilot scope.
- **0.5 GB Neon cap** — at 8-user pilot, 30-day retention, embedding vectors at 1024-dim × 1k chunks ≈ 4 MB/user/month. Plenty of headroom but watch at M5.

---

## Cross-references

- `docs/PROJECT_SPEC.md` — Product + Engineering requirements (Part A + Part B)
- `docs/MILESTONES.md` — M0–M6 plan with success criteria
- `docs/CHANGELOG.md` — build journal, every commit logged
- `docs/deploy/cloudflare-pages.md` — CF Pages runbook
- `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` — binding product spec (v8.1)
- `QA Nexus/PM1/PM1_ERD/PM1_ERD.md` — binding engineering spec (v2.1)
- `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` — M0 backlog (34 tasks)
- `.claude/memory/` — repo memory (general, architecture, bugs, api, database, stack)
- `CLAUDE.md` — 13 hard rules (binding for every Claude session)
