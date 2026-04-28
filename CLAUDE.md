# QA Nexus PM1 — CLAUDE.md

Auto-loaded by Claude Code on every session start. Survives restarts. Defines the binding context for the QA Nexus PM1 build.

## Binding spec (HIGHEST authority)

| Doc                      | Path                                                     | Version  |
| ------------------------ | -------------------------------------------------------- | -------- |
| **PM1 product spec**     | `QA Nexus/PM1/PM1_PRD/PM1_PRD.md`                        | **v8.1** |
| **PM1 engineering spec** | `QA Nexus/PM1/PM1_ERD/PM1_ERD.md`                        | **v2.1** |
| **PM1 design system**    | `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md`           | locked   |
| **M0 backlog**           | `QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md` | v8.0     |

Project-level `QA Nexus/PRD/PRD.md` (v2.10) and `QA Nexus/ERD/ERD.md` (v2.6) describe the PM2-PM4 vision — **NOT binding for PM1**.

Conflict resolution priority: **PM1_PRD > PM1_ERD > M0_v8 > 01_SYSTEM > Tech-project-forge-skill > MCP suggestions > library defaults.**

## Hard rules (do not violate)

1. **$0/month cost gate is binding.** Any decision that would force a paid component requires Yogesh's explicit written approval first. Even $5/mo upgrades require an ADR and sign-off.
2. **Free / OSI-approved OSS only.** Hosted services may be used if they have a free tier matching pilot scale (Groq, Gemini, Cloudflare, Neon, Render, Resend, Grafana Cloud, UptimeRobot, GitHub Actions).
3. **Never modify the 41 locked HTML frames** in `QA Nexus/PM1/PM1_UI_v2/frame  html view/` (17 frames, TWO spaces in folder name) and `QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/` (24 frames). Translate them to React components in `apps/web/src/app/**` instead. Reference with `// Implements F06 Sign In · see PM1_UI_v2/frame  html view/F06 Sign In.html`.
4. **Never add Material Design 3 tokens, tertiary colors, or extend `tailwind.config.ts`** beyond the locked palette. The `enforce-design-tokens.sh` PreToolUse hook will block. Respect its decision.
5. **Never add anything on the ban list:** FastAPI, Ollama, Gemma 4 self-host, Redis, Valkey, BullMQ, ioredis, Neo4j, Graphiti, Keycloak, Vault, pgvectorscale, LangSmith, langchain, MUI, Chakra UI, Mantine, Material Design 3 tokens, daisyui, material-tailwind. The `enforce-pm1-stack.sh` PreToolUse hook will block.
6. **Never put API keys, OAuth secrets, or session tokens in the repo.** `.env` is in `.gitignore`. Provider keys go in Render env vars. CI keys go in GitHub Secrets.
7. **All state-changing operations write to the HMAC-SHA256 chained `audit_log` table** (PM1_ERD §3.13). Visible in F28 Settings & Audit.
8. **Use pnpm only** — never npm or yarn. All scripts assume pnpm.
9. **TypeScript strict mode** in both `apps/web` and `apps/api`. No `any` types without `// FIXME` + a Linear-style ticket reference.
10. **All API endpoints have Zod schemas in `packages/shared`.** Frontend imports the same schemas for client-side validation.
11. **When in doubt, ask Yogesh — never guess.** Confirm before any non-trivial architectural decision.
12. **Full responsive web design (RWD) on every ported frame.** The 41 locked HTML frames in `PM1_UI_v2/` are **design references at 1600×1024 canvas size — NOT mandated widths**. Every React port MUST be: (a) mobile-first — base styles target ~320 px (iPhone SE), progressively enhance via Tailwind breakpoints `sm: 640 / md: 768 / lg: 1024 / xl: 1280 / 2xl: 1536`; (b) NO fixed pixel widths on layout containers (no `w-[1600px]`, no `w-[800px]`) — use `w-full`, `max-w-*`, `flex-1`, grid; (c) component max-widths only where semantically correct (forms ≤ 480 px, reading content ≤ 768 px); (d) tap targets ≥ 44 × 44 px (WCAG 2.5.5); (e) NO horizontal scroll at any viewport ≥ 320 px wide — test at 320 / 768 / 1024 / 1440 / 1920 minimum before commit; (f) typography scales appropriately across breakpoints; (g) modals (Stage 1120×860, Edit 960×720, Picker 720×640, Confirm 480×360 per `01_SYSTEM.md`) become full-screen Drawer sheets on mobile, render at declared sizes on desktop. Backed by `PM1_PRD §10 NFR-001` ("acceptable responsiveness for daily use") + `PM1_PRD §10.2` ("responsive for mobile browsers") + `01_SYSTEM.md §4.4` ("Canvas 1600×1024 desktop **primary**" — explicitly leaves room for non-desktop). Enforced by `enforce-rwd.sh` PreToolUse hook (MS0-T034).
13. **User visual confirmation gate before local commit.** For every newly developed/refactored screen, post the local URL (`http://localhost:3000/<route>`) to Yogesh + screenshots at 320 px and 1440 px, and wait for explicit "looks good, commit" approval BEFORE running `git commit`. Established 2026-04-26 after F06 + F06b + RWD iterations where automated checks passed but real-screen rendering revealed slider overflow + browser-extension hydration noise + cramped form spacing that automation missed.

## Locked tech stack (PM1)

**Frontend:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 (CSS-first config) · shadcn/ui · Sonner · lucide-react · react-hook-form · Zod · Framer Motion · TanStack Query v5 · TipTap

**Backend:** single NestJS 10 service (REST + WebSocket via `@nestjs/websockets` + `ws`) · Prisma 5 · BetterAuth (Postgres adapter) · Zod (shared with FE) · `@xenova/transformers` (BAAI/bge-large-en-v1.5 in-process WASM — see ADR-003; Qwen3-Embedding-0.6B is the future target once Xenova ships an ONNX conversion) · Groq SDK · `@google/generative-ai`

**Database:** Postgres 15 + pgvector (HNSW indexes) on Neon free 0.5 GB · scale-to-zero

**Storage:** Cloudflare R2 free (presigned-URL direct upload from FE; bypasses 512 MB Render dyno)

**LLM:** Groq free API — `openai/gpt-oss-120b` primary (500 tok/s, 131K ctx, 1k RPD) · `meta-llama/llama-4-scout-17b-16e-instruct` long-context (10M tokens, preview tier) · `openai/gpt-oss-20b` fast layers (14.4k RPD) · Gemini 2.5 Flash fallback (1.5k RPD)

**Embeddings:** BAAI/bge-large-en-v1.5 in-process via `@xenova/transformers` (1024-dim, ~47ms/embed warm). Model selection: see `docs/architecture/adr-003-embedding-model.md`. Qwen3-Embedding-0.6B remains the future target once Xenova ships an ONNX conversion — env var `EMBEDDING_MODEL_ID` enables hot-swap without code change.

**Email:** Resend free

**Hosting:** Cloudflare Pages free (FE) + Render free Hobby (API) + Neon free (DB) + UptimeRobot 5-min keep-alive on `/health`

**Observability:** OpenTelemetry SDK in NestJS · Grafana Cloud free · Better Stack free → Slack alerts

**Dev tools:** pnpm workspaces · GitHub Actions free (2k min/mo, weekly pg_dump cron) · DeepEval on Colab Free (engineering-only, never blocks prod traffic) · Playwright (internal QA)

**Total cost: $0/month** for the 8-user × 12hr/day pilot.

## Iksula data canon (use verbatim in seeds, fixtures, demo data)

**Anchor project:** Iksula Returns (key: `RET`) · Sprint 42 Day 9 of 14 · Release `R-2026-04-PaymentV2`

**Pilot team (8 users, final — no placeholders):**

| #   | Name           | Org role    | RBAC role                                      |
| --- | -------------- | ----------- | ---------------------------------------------- |
| 1   | Akshay Panchal | QA Lead     | **Lead**                                       |
| 2   | Yogesh Mohite  | Sr QA       | **Admin** (deployer-admin per Day-0 bootstrap) |
| 3   | Kishor Kadam   | QA Engineer | **QA Engineer**                                |
| 4   | Nitin Gomle    | QA Engineer | **QA Engineer**                                |
| 5   | Nadim Siddiqui | QA Engineer | **QA Engineer**                                |
| 6   | Govind Daware  | QA Engineer | **QA Engineer**                                |
| 7   | Mohanraj K.    | QA Engineer | **QA Engineer**                                |
| 8   | Sagar Todankar | QA Engineer | **QA Engineer**                                |

**Pilot operating window:** 7 days/week, 10 AM – 10 PM local time. UptimeRobot keep-alive must cover the full 12-hour daily window including weekends.

**Other Iksula projects (background context for F09 Projects List + F08b Home):** Iksula Commerce (key: `CART`, main branch), Iksula Payments (key: `PAY`, staging amber), Iksula Mobile App (key: `AUTH`, main green), Iksula Internal Ops (key: `OPS`, available).

**Sample files for upload demos:** `return_policy_v2.xlsx`, `legacy_refund_test_cases.csv`, `customer_return_flow_recording.mp4`

**ID patterns:** Jira reqs `RET-###` · uploaded reqs `REQ-###` · test cases `TC-RET-###` · defects `DEF-###` · imports `#242`

**Jira instance:** `iksula.atlassian.net` (12 projects visible)

## Hooks active (`.claude/hooks/`)

- **PreToolUse Bash:** `block-dangerous.sh` — blocks `rm -rf`, `DROP TABLE`, `--force`, etc.
- **PreToolUse Edit|Write:** `enforce-design-tokens.sh` — blocks non-whitelisted hex / Tailwind color classes / MD3 tokens in `apps/web/**/*.{ts,tsx,css}`
- **PreToolUse Edit|Write:** `enforce-pm1-stack.sh` — blocks ban-list deps in `package.json` / `pnpm-lock.yaml`; ALSO (MS0-T033) blocks major-version drift on locked deps per `.claude/locked-deps.json` (next=15, react=19, tailwindcss=4, @nestjs/\*=10, prisma=5, node>=20)
- **PostToolUse \*:** `audit-log.sh` — appends one JSONL line per tool call to `.claude/audit.jsonl`
- **UserPromptSubmit \*:** `load-binding-context.sh` — prepends a 7-line binding-context note to every Claude session

Hook wiring: `.claude/settings.json`. Permission grants: `.claude/settings.local.json` (auto-managed).

## MCP servers configured

- `github` (PAT-authenticated; MCP currently uses `yogeshcodeshare` PAT for general queries; QA Nexus repo ops go through `gh` CLI which is logged in as `yogeshmohite-iksula`)
- `sequential-thinking` · `context7` · `filesystem` (scoped to project root) · `playwright`
- `postgres` — **deferred** until MS0-T012 (Neon URL not yet provisioned)
- `context-mode` (pre-existing, plugin marketplace)

## What Claude should NOT do without Yogesh's explicit approval

- Modify any of the 41 locked HTML frames
- Add any paid component (even $5/mo)
- Install anything on the ban list
- Add Material Design 3 tokens, tertiary colors, or extend `tailwind.config.ts`
- Commit secrets to the repo
- Push to GitHub `main` without confirming repo name + visibility (NOTE: repo `https://github.com/yogeshmohite-iksula/QA-Nexus.git` is already created, private; `git remote add origin ...` then push — do NOT `gh repo create`)
- Activate `Tech-project-forge-skill` until Step C completes (skill install + Claude Code restart) AND Yogesh re-issues the trigger phrase "Set up my project from PRD and ERD"

## Communication preferences (kickoff §5)

- Concise and concrete. File paths, line numbers, exact commands.
- Surface inconsistencies and risks early.
- Cite sources (cite §X of PM1_PRD or PM1_ERD when basing decisions on them).
- No "let me think out loud" detours. Decide, act, summarize.
- Run the relevant validation gate after each task, report result before moving on.
- **End-of-day status at 17:00 IST:** 5 sections per kickoff §5 (completed today, in flight, blockers, tomorrow, free-tier quota usage). **Canonical location: `docs/eod-reports/YYYY-MM-DD-day-N.md`** (filename convention + template in `docs/eod-reports/README.md`, established 2026-04-27 per audit P1.10). Commit + push every EOD as `docs(eod): post Day N EOD report`.

## Compact instructions

When compacting this conversation, preserve: PM1 binding spec versions, the 8-user roster, locked stack details, hook config, current step state in M0 backlog, any acceptance gate that has already passed. Discard: exploration output, raw `claude mcp list` output (already indexed in audit.jsonl), verbose logs.
