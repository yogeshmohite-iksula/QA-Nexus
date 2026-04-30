# QA Nexus

[![Live](https://img.shields.io/badge/live-qa--nexus--web.pages.dev-2dd4bf?style=flat-square)](https://qa-nexus-web.pages.dev/) &nbsp; [![Cost](https://img.shields.io/badge/infra-%240%2Fmonth-34d399?style=flat-square)]() &nbsp; [![Stack](https://img.shields.io/badge/stack-Next.js%2015%20%2B%20NestJS%2010%20%2B%20Postgres%20%2B%20pgvector-a78bfa?style=flat-square)]()

AI-native QA management platform for **Iksula Services** — internal pilot on 8 named QA users (Iksula Returns / Commerce / Mobile App), targeting GA on 2026-09-21.

Built with Next.js 15 (FE), NestJS 10 (API), Postgres + pgvector (DB), and Groq + Gemini (LLM). Free-tier-only infra: $0/month at 8-user pilot scale.

---

## Tech Stack

| Component          | Technology                                                                              | Version         | Purpose                                         |
| ------------------ | --------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| Frontend framework | [Next.js](https://nextjs.org)                                                           | 15 (App Router) | Static export to Cloudflare Pages               |
| UI runtime         | React                                                                                   | 19              | Component model                                 |
| Styling            | [Tailwind CSS](https://tailwindcss.com)                                                 | 4 (CSS-first)   | Locked design tokens via `@theme inline`        |
| Component pattern  | [shadcn/ui](https://ui.shadcn.com)                                                      | latest          | CVA + clsx + tailwind-merge                     |
| Forms              | react-hook-form + Zod                                                                   | latest          | Type-safe + schema validation                   |
| Backend framework  | [NestJS](https://nestjs.com)                                                            | 10              | REST + WebSocket + DI                           |
| ORM                | [Prisma](https://www.prisma.io)                                                         | 5               | Schema migrations + type-safe queries           |
| Auth               | [BetterAuth](https://www.better-auth.com)                                               | latest          | Postgres adapter + magic-link via Resend        |
| Database           | [PostgreSQL](https://postgresql.org) + [pgvector](https://github.com/pgvector/pgvector) | 15 / latest     | HNSW indexes for embedding similarity           |
| Embeddings         | [@xenova/transformers](https://huggingface.co/docs/transformers.js)                     | latest          | Qwen3-Embedding-0.6B in-process WASM (1024-dim) |
| LLM (primary)      | [Groq](https://console.groq.com) (`gpt-oss-120b`)                                       | n/a             | 500 tok/s, 131K ctx, 1k req/day                 |
| LLM (fallback)     | [Gemini](https://aistudio.google.com) (`gemini-2.5-flash`)                              | 2.5             | 1.5k req/day fallback on Groq 429               |
| Email              | [Resend](https://resend.com)                                                            | n/a             | Magic-link delivery (3k emails/mo free)         |
| Storage            | [Cloudflare R2](https://developers.cloudflare.com/r2/)                                  | n/a             | Presigned-URL direct upload from FE             |
| Hosting (FE)       | [Cloudflare Pages](https://pages.cloudflare.com)                                        | n/a             | Direct Upload via wrangler                      |
| Hosting (API)      | [Render](https://render.com) free Hobby                                                 | n/a             | Auto-deploy from `main` (MS0-T011)              |
| Observability      | [OpenTelemetry](https://opentelemetry.io) → Grafana Cloud + Better Stack                | latest          | Traces, logs, alerts                            |
| CI                 | [GitHub Actions](https://docs.github.com/actions)                                       | n/a             | Lint + typecheck + test + build (MS0-T005)      |
| Package manager    | [pnpm](https://pnpm.io)                                                                 | 10.33.2         | Workspaces                                      |

Detailed architecture in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Detailed product spec in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md).

---

## Prerequisites

- **Node.js** ≥ 20 (system Node 24 works too — `engines.node` is `>=20`)
- **pnpm** 10.33.2 (`corepack enable && corepack prepare pnpm@10.33.2 --activate`)
- **gh CLI** (`brew install gh` then `gh auth login`)
- **git** 2.x

Optional for deploys:

- **Cloudflare account** + API token (free tier, no card required) — see [`docs/deploy/cloudflare-pages.md`](docs/deploy/cloudflare-pages.md)
- **Render account** + linked GitHub (lands MS0-T011)

---

## Quick Start

```bash
# 1. Clone
gh repo clone yogeshmohite-iksula/QA-Nexus
cd QA-Nexus

# 2. Install
pnpm install

# 3. Configure
cp .env.example .env
# Then fill in real values from your provisioning dashboards.
# At minimum for `pnpm dev` you need: DATABASE_URL, BETTER_AUTH_SECRET.
# LLM + email + R2 keys can come later as you wire each integration.

# 4. Dev — runs FE (apps/web) + API (apps/api) in parallel
pnpm dev
# FE: http://localhost:3000   API: http://localhost:3001
```

Then open the auth surface:

- **F06 Sign In** → http://localhost:3000/sign-in/
- **F06b Set Password** → http://localhost:3000/set-password/
- **F06c Reset Password** → http://localhost:3000/sign-in/forgot/

---

## Project Structure

```
QA-Nexus/
├── apps/
│   ├── web/                    # Next.js 15 (FE) — static export to Cloudflare Pages
│   │   ├── app/                # App Router — pages + route handlers (per-feature)
│   │   ├── components/         # FE components: home, home-lead, home-empty, projects,
│   │   │                       # sources-jira, sign-in, set-password, ...
│   │   ├── lib/
│   │   │   ├── contexts/       # React context providers — useCurrentUser,
│   │   │   │                   # useActiveProject, useTeamRoster (ADR-006)
│   │   │   └── demo-seed.ts    # Demo seed (entity identity only — view fixtures
│   │   │                       # stay in per-component data.ts; ADR-006 refinement)
│   │   └── package.json
│   ├── api/                    # NestJS 10 (BE) — REST + WebSocket
│   │   ├── src/
│   │   │   ├── agents/a1-scribe/      # T036 A1 Scribe (test-case generator)
│   │   │   ├── audit/                 # HMAC-SHA256-chained audit log (PM1_ERD §3.13)
│   │   │   ├── auth/                  # BetterAuth Postgres adapter
│   │   │   ├── embedding/             # @xenova/transformers (BAAI/bge-large-en-v1.5)
│   │   │   ├── health/                # GET /health (UptimeRobot 5-min ping)
│   │   │   ├── llm/                   # T023 provider-agnostic LLM gateway
│   │   │   │   └── providers/         # Groq + Gemini adapters (ONLY place SDKs are imported)
│   │   │   ├── observability/         # T019 OTel pipeline (traces + logs + redaction)
│   │   │   ├── projects/              # T038 project CRUD + Jira OAuth stubs
│   │   │   ├── realtime/              # T026 WebSocket gateway (path: /realtime)
│   │   │   ├── storage/               # T013 R2 service (presigned-URL pattern)
│   │   │   └── main.ts                # Bootstrap (OTel init → BetterAuth → Nest)
│   │   ├── prisma/             # Prisma 5 schema + migrations + raw SQL (ADR-002)
│   │   └── package.json
│   └── e2e/                    # Playwright E2E (T031) — chromium-desktop + mobile-safari
├── packages/
│   └── shared/                 # @qa-nexus/shared — Zod schemas + seed types
│       └── src/
│           ├── schemas/        # Request/response Zod schemas — single source of truth
│           ├── seed-types.ts   # UI type contracts (TestCaseWithRelations, etc.)
│           └── index.ts        # Barrel
├── docs/
│   ├── architecture/           # ADR-002 → ADR-006 (decisions with alternatives)
│   ├── audits/                 # Living + archived audits (skill alignment, conformance)
│   ├── deploy/                 # 7 dashboard runbooks (Render, R2, Resend, etc.)
│   ├── eod-reports/            # Daily 5-section EOD reports
│   ├── observability/          # Token-tracking methodology + Excel rollup
│   ├── refactor/               # In-flight refactor runbooks (e.g. seed centralization)
│   ├── screenshots/            # Visual-confirmation gate PNGs (320 + 1440)
│   ├── ARCHITECTURE.md         # System diagram + data flow
│   ├── CHANGELOG.md            # Keep-a-Changelog build journal
│   ├── MILESTONES.md           # M0 → M6 plan with success criteria
│   ├── PROJECT_SPEC.md         # Product + engineering spec (Part A + Part B)
│   ├── SECURITY.md             # Secrets policy + incident response
│   ├── STATUS.md               # One-page "where are we right now"
│   └── followups.md            # Top-level engineering backlog (a-j)
├── .claude/
│   ├── hooks/                  # PreToolUse / PostToolUse / Stop / SessionStart enforcement
│   ├── memory/                 # Repo memory (general / architecture / bugs / api / db)
│   ├── rules/                  # Per-area binding rules (frontend / api / security)
│   ├── settings.json           # Permissions + hook wiring (committed, ~150 entries)
│   └── locked-deps.json        # Major-version lock (next=15, react=19, prisma=5, ...)
├── QA Nexus/                   # PRD / ERD / milestone files / 41 locked HTML frames
└── CLAUDE.md                   # 13 hard rules + locked stack + binding spec refs
```

---

## Environment Variables

See [`.env.example`](.env.example) for the canonical list with source URLs and provisioning task references. Categories:

- **Database** — `DATABASE_URL` (Neon Postgres + pgvector)
- **LLM** — `GROQ_API_KEY`, `GEMINI_API_KEY`
- **Email** — `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **Storage** — `R2_*` bundle (account ID, keys, bucket, endpoint, public URL)
- **Auth** — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Jira OAuth (M4)** — `JIRA_OAUTH_*` bundle
- **Observability** — `OTEL_*`, `BETTER_STACK_TOKEN`
- **Frontend exposed** — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`

**`.env` is gitignored.** Real production values live in Render env vars (API), Cloudflare Pages build-time env vars (FE), and GitHub Secrets (CI).

---

## Available Scripts

From the repo root:

| Command                   | What it does                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                | Run FE + API dev servers in parallel                               |
| `pnpm build`              | Build all workspace packages (`pnpm -r build`)                     |
| `pnpm --filter web build` | Build FE static export to `apps/web/out/`                          |
| `pnpm --filter api build` | Build NestJS to `apps/api/dist/`                                   |
| `pnpm typecheck`          | TypeScript strict-mode check across workspaces                     |
| `pnpm lint`               | ESLint across workspaces + Prettier check                          |
| `pnpm lint:fix`           | ESLint --fix + Prettier --write across workspaces                  |
| `pnpm test`               | Run all workspace test suites                                      |
| `pnpm test:e2e`           | Playwright E2E (apps/web only)                                     |
| `pnpm deploy:web`         | Build FE + deploy to Cloudflare Pages via wrangler (Direct Upload) |

---

## Project Roadmap

| Milestone                           | Scope                                                                                         | Target                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| **M0** — Infrastructure             | Auth shell + deploy pipeline + 34 setup tasks                                                 | Days 1–10 (in progress, ~Day 1) |
| **M1** — Users & Roles              | 4-role RBAC + Postgres RLS + magic-link invites + F06/F06b/F06c/F07/F27                       | M0+1 to M0+3 weeks              |
| **M2** — Docs + KB                  | Document Catalog (12 templates) + KB with Qwen3 embeddings + F12-F15                          | M1+1 to M1+3 weeks              |
| **M3** — Test Cases + A1 + A2       | TipTap editor (BDD + traditional) + A1 generation via Groq + A2 dedup + F16-F18               | M2+1 to M2+3 weeks              |
| **M4** — Runs + Defects + Jira + A4 | Test runs (live state via WS) + defects with A4 5-Layer RCA + Jira OAuth 2-way sync + F19-F22 | M3+1 to M3+3 weeks              |
| **M5** — Reports + Pilot Launch     | Reports Studio (4 templates) + F23-F28 + 8-user pilot Day-0                                   | M4+1 to M4+2 weeks              |
| **M6** — GA                         | All 41 frames + all 12 PM1_ERD §10 acceptance gates                                           | **Target: 2026-09-21**          |

Detailed milestones in [`docs/MILESTONES.md`](docs/MILESTONES.md). Full M0 task list (34 tasks, ~294h) in [`QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`](QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md).

---

## Pilot team

8 named QA users at Iksula:

| #   | Name           | Role        | RBAC                       |
| --- | -------------- | ----------- | -------------------------- |
| 1   | Akshay Panchal | QA Lead     | Lead                       |
| 2   | Yogesh Mohite  | Sr QA       | **Admin** (deployer-admin) |
| 3   | Kishor Kadam   | QA Engineer | QA Engineer                |
| 4   | Nitin Gomle    | QA Engineer | QA Engineer                |
| 5   | Nadim Siddiqui | QA Engineer | QA Engineer                |
| 6   | Govind Daware  | QA Engineer | QA Engineer                |
| 7   | Mohanraj K.    | QA Engineer | QA Engineer                |
| 8   | Sagar Todankar | QA Engineer | QA Engineer                |

Pilot operating window: **7 days/week, 10 AM – 10 PM local time.**

---

## Documentation

**At-a-glance**

- [`docs/STATUS.md`](docs/STATUS.md) — one-page snapshot (M0 progress, active PRs, free-tier quotas, health) — updated each EOD
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — build journal (Keep-a-Changelog format, every commit logged)
- [`docs/followups.md`](docs/followups.md) — top-level engineering backlog (open + closed; lettered a → j)
- [`docs/eod-reports/`](docs/eod-reports/) — daily 5-section EOD reports

**Specs (binding)**

- [`QA Nexus/PM1/PM1_PRD/PM1_PRD.md`](QA Nexus/PM1/PM1_PRD/PM1_PRD.md) — product spec (v8.1)
- [`QA Nexus/PM1/PM1_ERD/PM1_ERD.md`](QA Nexus/PM1/PM1_ERD/PM1_ERD.md) — engineering spec (v2.1)
- [`QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md`](QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md) — M0 task backlog (35 tasks, 19 acceptance gates)
- [`QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md`](QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md) — locked design system
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — generated product + engineering spec (Tech-project-forge skill)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram, FE / API / DB / LLM / R2 layers
- [`docs/MILESTONES.md`](docs/MILESTONES.md) — M0 → M6 plan with success criteria

**Architecture decisions**

- [`docs/architecture/adr-002-prisma-raw-split.md`](docs/architecture/adr-002-prisma-raw-split.md) — Prisma migrations vs raw/ split (RLS + HNSW + pgvector)
- [`docs/architecture/adr-003-embedding-model.md`](docs/architecture/adr-003-embedding-model.md) — BAAI/bge-large-en-v1.5 (Qwen3 future-target)
- [`docs/architecture/adr-004-render-deployment.md`](docs/architecture/adr-004-render-deployment.md) — Render Free Hobby Singapore (6 alternatives rejected)
- [`docs/architecture/adr-005-r2-storage.md`](docs/architecture/adr-005-r2-storage.md) — R2 with presigned-URL pattern (7 alternatives rejected)
- [`docs/architecture/adr-006-seed-data-centralization.md`](docs/architecture/adr-006-seed-data-centralization.md) — 3-layer seed architecture + view-fixtures-vs-identity refinement

**Deploy + ops runbooks**

- [`docs/deploy/render-runbook.md`](docs/deploy/render-runbook.md) — API hosting (T011)
- [`docs/deploy/r2-runbook.md`](docs/deploy/r2-runbook.md) — Cloudflare R2 storage (T013)
- [`docs/deploy/resend-runbook.md`](docs/deploy/resend-runbook.md) — magic-link email (T014)
- [`docs/deploy/uptimerobot-runbook.md`](docs/deploy/uptimerobot-runbook.md) — 5-min /health monitor (T015)
- [`docs/deploy/cloudflare-pages.md`](docs/deploy/cloudflare-pages.md) — FE hosting
- [`docs/deploy/better-stack-runbook.md`](docs/deploy/better-stack-runbook.md) — OTel logs (T019)
- [`docs/deploy/restore-runbook.md`](docs/deploy/restore-runbook.md) — disaster recovery from weekly Postgres backup (T018)

**Audits + observability**

- [`docs/audits/skill-alignment-audit.md`](docs/audits/skill-alignment-audit.md) — living document; periodic Tech-project-forge skill conformance check (89% → 96% → ?)
- [`docs/observability/`](docs/observability/) — token-tracking methodology, Excel rollup, methodology notes

**Repo conventions**

- [`CLAUDE.md`](CLAUDE.md) — 13 hard rules + locked stack + binding context (auto-loaded by Claude Code on every session)
- [`docs/SECURITY.md`](docs/SECURITY.md) — secrets policy + incident response
- [`.claude/memory/`](.claude/memory/) — repo memory (general / architecture / bugs / api / database / stack)
- [`.claude/rules/`](.claude/rules/) — per-area binding rules (frontend / api / security)

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the contribution workflow + repo conventions. The two most important conventions for newcomers:

1. **The 13 hard rules in [`CLAUDE.md`](CLAUDE.md) are binding** — locked design tokens, ban-list deps, RWD requirements, visual-confirmation gate before every commit, etc. PreToolUse hooks block violations at author-time; CI catches anything that slips through.
2. **Seed data architecture: [ADR-006](docs/architecture/adr-006-seed-data-centralization.md)** — context providers for entity identity (`useCurrentUser`, `useActiveProject`), per-component `data.ts` for view fixtures only. Don't put hardcoded user/project names in components.

---

## Live demo

The auth surface (F06 / F06b / F06c) is deployed to Cloudflare Pages:

- **https://qa-nexus-web.pages.dev/sign-in/** — Sign In
- **https://qa-nexus-web.pages.dev/set-password/** — Set Password (Mode A invite)
- **https://qa-nexus-web.pages.dev/sign-in/forgot/** — Reset Password (Mode B forgot-flow)

Backend (`/auth/*`, `/v1/*`, `/health`, `/ws`) lands at https://qa-nexus-api.onrender.com/ with MS0-T011 (queued).

---

## License

UNLICENSED. Internal Iksula Services project.
