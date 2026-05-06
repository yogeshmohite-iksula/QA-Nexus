# General Project Memory

## Project: QA Nexus PM1

AI-native QA management platform for **Iksula Services** — internal pilot on 2–3 Iksula projects (Iksula Returns / Commerce / Mobile App) before wider rollout.

**Goal type:** MVP (PM1 pilot, 8 users) → Production (PM2+).
**Primary deliverable:** 41 React-ported frames spanning auth → dashboards → docs → test cases → defects → reports.
**Repo:** https://github.com/yogeshmohite-iksula/QA-Nexus (private).
**Live URL:** https://qa-nexus-web.pages.dev/ (Cloudflare Pages, Direct Upload mode).

## Pilot team (8 named users — final, no placeholders)

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

## Locked stack (PM1) — no alternatives accepted

- **Frontend:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 (CSS-first config) · shadcn/ui · Sonner · lucide-react · react-hook-form · Zod · Framer Motion · TanStack Query v5 · TipTap
- **Backend:** single NestJS 10 service (REST + WebSocket via `@nestjs/websockets` + `ws`) · Prisma 5 · BetterAuth (Postgres adapter) · Zod · `@xenova/transformers` (Qwen3-Embedding-0.6B in-process WASM) · Groq SDK · `@google/generative-ai`
- **Database:** Postgres 15 + pgvector (HNSW indexes) on Neon free 0.5 GB · scale-to-zero
- **Storage:** Cloudflare R2 free (presigned-URL direct upload from FE)
- **LLM:** Groq free (gpt-oss-120b primary 1k RPD, llama-4-scout long-ctx, gpt-oss-20b 14.4k RPD) + Gemini 2.5 Flash fallback (1.5k RPD)
- **Email:** Resend free
- **Hosting:** Cloudflare Pages free (FE) + Render free Hobby (API) + Neon free (DB) + UptimeRobot 5-min keep-alive on `/health`
- **Observability:** OpenTelemetry SDK + Grafana Cloud free + Better Stack free
- **CI:** GitHub Actions free (2k min/mo)

## Database (overview)

21 tables (TB-001 through TB-021, including TB-019/020/021 LLM provider tables). HNSW indexes on vector columns. Migration tool: Prisma 5 with raw-SQL migration for HNSW indexes. Schema lands in MS0-T020.

## Goal: MVP → Production

- M0 (Days 1–10): Infrastructure + auth shell — currently in progress, ~Day 1 of 10.
- M1: Users & Roles (4-role RBAC, magic link invites)
- M2: Docs + KB (Qwen3 embeddings)
- M3: Test Cases + A1 (Groq-backed generation) + A2 (dedup)
- M4: Runs + Defects + Jira OAuth + A4 (5-Layer RCA)
- M5: Reports + Pilot launch (8 users go live)
- M6: GA (target 2026-09-21)

## Key decisions made at setup

- **2026-04-26:** Chose Next.js 15 (NOT 16) per locked stack. Next 16 slip caught at hook dry-run; T033 hardened version-pin enforcement so this can never silently happen again.
- **2026-04-26:** Database is Postgres 15 + pgvector on Neon free 0.5 GB scale-to-zero. **NOT pgvectorscale** (banned).
- **2026-04-26:** Auth strategy is BetterAuth Postgres adapter + magic link via Resend. **NOT Redis adapter**. Lands in MS0-T021.
- **2026-04-26:** Deployment target is Cloudflare Pages (FE static export, Direct Upload) + Render free Hobby (NestJS API). **GitHub auto-deploy deferred** — currently `pnpm deploy:web` from local.
- **2026-04-26:** **Rule 12 (RWD)** added to CLAUDE.md after F06 + F06b initial ports horizontal-scrolled on Yogesh's 1440×900 MacBook. Locked HTML frames are **design references** at 1600×1024, NOT mandated React widths.
- **2026-04-26:** **Rule 13 (visual confirmation gate)** added — every new screen requires URL + 320/1440 screenshots BEFORE local commit, awaiting Yogesh's "looks good".
- **2026-04-26:** Auth-surface duplicate brand mark removed from F06b/F06c right panel (deviation from locked HTML — left brand panel handles brand identity on desktop; mobile-only BrandMark above form on < lg).
- **2026-04-26:** `#003732` added to design-token whitelist for `--primary-ink` (button text on teal bg).

## Constraints (binding)

- **$0/month total infra cost.** Any decision forcing a paid component (even $5/mo) requires Yogesh's written approval + ADR.
- **Free / OSI-approved OSS only.** Hosted services OK if their free tier matches pilot scale.
- **Never modify the 41 locked HTML frames** in `QA Nexus/PM1/PM1_UI_v2/`. Translate to React in `apps/web/app/**`.
- **Never add MD3 tokens, tertiary colors, or extend `tailwind.config.ts`** beyond the locked palette. Hooks block this.
- **Never add ban-list deps** (FastAPI, Ollama, Gemma 4 self-host, Redis, Valkey, BullMQ, ioredis, Neo4j, Graphiti, Keycloak, Vault, pgvectorscale, LangSmith, langchain, MUI, Chakra UI, Mantine, daisyui, material-tailwind). Hooks block.
- **Use pnpm only** — never npm or yarn.
- **TypeScript strict mode** in both `apps/web` and `apps/api`. No `any` without `// FIXME` + ticket ref.
- **All API endpoints have Zod schemas in `packages/shared`.** FE imports the same schemas for client validation.

## Risky assumptions to validate early

- **R1:** Render free dyno cold-start (~30s after 15-min idle) ≤ tolerable for pilot. **Mitigation:** UptimeRobot 5-min keep-alive on `/health` during 10 AM – 10 PM window. **Verify by:** measuring p95 cold-start at MS0-T015 acceptance.
- **R2:** Neon free 0.5 GB cap holds for 8-user pilot data. **Mitigation:** weekly `pg_dump` cron to R2; alerts at 80% utilization. **Verify by:** measuring DB size weekly post-pilot launch (M5).
- **R3:** Groq 1k RPD on gpt-oss-120b sufficient for A1/A2/A4 agent volume. **Mitigation:** fallback to Gemini 2.5 Flash (1.5k RPD); A1/A2/A4 golden-set seed (T032) gives early eval signal. **Verify by:** weekly DeepEval starting M3.
- **R4:** Cloudflare Pages static-export constraint compatible with Next 15 App Router auth flow. **Mitigation:** API surface lives in apps/api on Render; FE is purely static + client-side state. `/` redirect implemented client-side. **Verify by:** every frame port maintaining 100% static prerender.

## Cost gate verified (current snapshot, 2026-04-27)

- Cloudflare Pages: 2 deploys / 500 mo limit ✓
- GitHub Actions: 0 min / 2k mo limit ✓ (CI not yet wired — MS0-T005)
- Neon, Render, Resend, R2, Grafana, Better Stack: not yet provisioned (Days 4–6)
- **Total infra cost: $0/month confirmed.**

## Compound learnings

> One-liner journal of non-obvious gotchas. Newest first. Long-form analysis goes to `docs/lessons-learned/` only when the lesson generalizes beyond a single bug.

- **2026-05-06 (Day-11 TASK 3):** RAG citation drift is solved by making the citation MARKER identical to the input chunk HEADER — `[chunk: <UUID>]` appears in BOTH input chunk header AND output citation, so the model trivially mirrors it (no hallucinated `[chunk-1]` / `[1]` / `Source: doc.pdf p.3` variants). Pair this with a UUID-anchored regex parser (rejects `[chunk: 1]`/`[chunk: abc]`) + intersect cited IDs with retrieved set (catches model-hallucinated UUIDs). See ADR-012 §1+§2.
- **2026-05-06 (Day-11 TASK 3):** When BE service composes ANOTHER BE service that already audits (e.g. `KbAnswerService` calls `KbSearchService.search()` which writes `kb_search_performed`), the wrapping service does NOT need to re-audit the search — workspace isolation + per-call audit row come for free. Wrapping service audits its OWN domain event (`kb_answer_generated`). Avoids audit duplication + keeps the chain readable.
- **2026-05-06 (Day-11 TASK 2):** PII guard for search/RAG audit payloads is non-negotiable — search queries can leak business intent ("customer X return reason") + answers can leak source material. Audit payload carries query LENGTH + token COUNT + result COUNT + provider/tokens ONLY, NEVER the text. Pinned by negative `expect(payloadStr).not.toContain('sensitive'/'customer'/'$50000')` assertions.
- **2026-05-06 · F13 visual-gate shell-regression (PR #63)** — `AdminShell` wrapper has now been forgotten on F12 + F13 + F15 (M1) — three frames in a row. Visual gate catches it but each catch costs ~45 min rework + a fix PR. Cheaper to block at author time. Filed as followup (ak) for `enforce-app-shell.sh` PreToolUse hook.
- **2026-05-06 · F12 KB upload Pattern A (PR #52)** — Playwright `setInputFiles()` on the sr-only `<input type="file">` is more reliable than synthesising a `DragEvent` with a `DataTransfer` payload (some browsers make `dataTransfer` read-only); use the file-input path for state-machine sweeps.
- **2026-05-05 · Visual gate copy catch (PR #42)** — automated checks (typecheck/lint/CI) cannot catch tonal contradictions ("wait 30 seconds" copy vs 60-second lockout); Rule 13's user gate is the only line of defense against semantic drift in user-facing strings.
- **2026-05-05 · Next.js 15 + `output: 'export'` + `useSearchParams()`** — bails the static prerender (`missing-suspense-with-csr-bailout`) unless wrapped in `<Suspense>`. Pattern: thin default export = `<Suspense fallback={null}><Inner /></Suspense>`; all real logic lives in `Inner`.
- **2026-05-05 · BetterAuth package name** — `@better-auth/react` and `@better-auth/client` both 404 on npm; the real package is single `better-auth` with subpath exports. Always verify package names against `npm view <pkg>` before committing a brief that references them.
- [2026-05-05] CHANGELOG cascade — single `[Unreleased]` section is a hot lock during parallel PRs; mitigation: per-PR `docs/changelog-fragments/<PR#>.md` concatenated at merge time. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §1.
- [2026-05-05] pnpm 10 hoist for subpath exports — `better-auth/react` etc. need `public-hoist-pattern[]=better-auth` in `.npmrc` AND a re-`pnpm install` to materialise the symlink to workspace root `node_modules/`; `tsc` won't traverse `.pnpm/`. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §2.
- [2026-05-05] BetterAuth Result pattern — `authClient.signIn.magicLink()` returns `{ data, error }` and never throws; `try/catch` silently eats API errors. Always destructure and branch on `error.code`. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §3.
- [2026-05-05] BetterAuth `errorCallbackURL` asymmetry — server-side plugin config only; the client `signIn.magicLink()` only takes `{ email, callbackURL, fetchOptions? }`. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §4.
- [2026-05-05] FE absolute-URL discipline — `apps/web/lib/api/*.ts` fetchers MUST prefix `${process.env.NEXT_PUBLIC_API_BASE_URL}` (same pattern as `lib/auth/client.ts`). Relative `/api/*` URLs hit Next.js dev server (port 3000), not NestJS (port 3001). Caused F27 404. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §5.
- [2026-05-05] Pre-handoff `pnpm build` gate — full static-export build catches Suspense + `useSearchParams` + dynamic-import errors that `tsc --noEmit` misses. Mandatory for FE+1 before signalling MAIN. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §6.
- [2026-05-05] Sonnet/Opus model routing — Sonnet for procedural/ceremony work (rebase, template fills, EOD reports); Opus for adversarial root-cause hunts + ADR decisions. Sonnet hesitates when given hypothesis is wrong. See `docs/lessons-learned/2026-05-05-m1-close-day-learnings.md` §7.
