# Day 2 Morning Prompts — paste-ready

**Pre-written 2026-04-27 EOD** so Yogesh doesn't lose 15-20 min tomorrow re-deriving them. Each section is one chat — copy the body verbatim into the corresponding Claude Code session.

**Day 2 morning workflow (Yogesh, ~2 min):**

1. From repo root: `./scripts/refresh-worktrees.sh` — refreshes all 3 worktrees + reinstalls deps
2. Open 3 Claude Code sessions (one per worktree)
3. Paste the matching prompt below into each
4. Walk away — chats run in parallel; merge coordination handled per `docs/parallel-work/follow-ups.md`

---

## CHAT 1 (MAIN) — Day 2 prompt

**Worktree:** `~/AI_Tester_Project/Project10-QA_Nexus`
**Branch:** `main`
**Goal:** M0 acceptance gate verification (AC001–AC019) — surface gaps before they bite us at M0 close on Day 10.

```
Day 2 morning, MAIN session. Tonight's BE T020 + FE T030 PRs may have landed
already (or not — check first).

Sequence:

1. Run /sync-worktree to confirm clean main. If anything off, halt and tell me.

2. gh pr list --state open --base main
   - If FE PR (feature/f07-founder-onboarding) is open + green: merge per the
     follow-ups.md playbook (squash, delete branch).
   - If BE PR (feature/prisma-schema-tb001-021) is open + green: merge same way.
   - If either is red: surface the failure; do NOT auto-fix.

3. Read QA Nexus/PM1/PM1_milestone/M0/Milestone_M0_Setup_v8.md focusing on
   the 19 acceptance criteria (AC001–AC019). Cross-reference each AC against
   the actual repo state (commits, files, deployed URLs, hook output, etc.).

4. Write docs/audits/2026-04-28-m0-acceptance-gate-verification.md with
   one row per AC:
     - ID + verbatim criterion text
     - Status: ✅ DONE / 🟡 PARTIAL / 🔴 BLOCKED / ⏳ PENDING
     - Evidence: commit SHA, file path, URL, screenshot, or "(deferred to <task>)"
     - Gap: what's still needed to flip 🟡 or 🔴 to ✅
     - Owner: MAIN / BE / FE / Yogesh

5. Identify the top 3-5 ACs that need explicit work to close — these become
   the prioritized list for Days 3-10 of M0.

6. Update docs/parallel-work/follow-ups.md with the AC closure plan added
   under §"Open follow-ups" §"P1 within Days 2-7".

7. HALT and present the audit summary inline. Format:
     📊 M0 Acceptance Gates — Day 2 verification
       ✅ DONE: N
       🟡 PARTIAL: N
       🔴 BLOCKED: N
       ⏳ PENDING: N
       Top 3 closure-blockers (ordered by criticality):
         1. <AC>: <gap> → <owner> + <est effort>
         2. ...
         3. ...

DO NOT proceed past the audit without my approval. Several ACs will be
PENDING (e.g., AC003 needs T020 schema + T012 Neon, AC005 needs T021
BetterAuth wiring) — that's expected. The audit just confirms we're on
track for Day 10 close.
```

---

## CHAT 2 (FE) — Day 2 prompt

**Worktree:** `~/AI_Tester_Project/Project10-QA_Nexus-frontend`
**Branch:** new (`feature/f07-invited-onboarding`)
**Goal:** Port the 3 invited-team onboarding frames (F07b/c/d) — branches off F07 founder pattern.

```
Day 2 morning, FE session. F07 founder (MS0-T030) was your tonight task —
confirm it merged via `gh pr view` first. If still open: finish + merge per
follow-ups.md playbook before starting this batch.

Sequence:

1. /sync-worktree to pull main fresh. If conflict on .claude/settings.json:
   keep BOTH halves (main added Ctx patterns + sync-worktree command).

2. New branch: git checkout -b feature/f07-invited-onboarding

3. Port 3 invited-team onboarding frames sequentially. Each follows the
   F07 founder pattern + role-specific deviations.

   ─── MS0-T030.5: F07b Invited QA Engineer First-Run ───
   Source:  QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07b Invited QA Engineer First-Run.html
   Target:  apps/web/app/(onboarding)/invited/qa/page.tsx
   Role-specific deviations (document inline in header):
     - Skip the "create your first project" step (QA Engineers join existing projects)
     - Show the role badge: "QA Engineer · 4 permissions enabled"
     - First task hint: "Open Iksula Returns → Test Cases → New"
   Visual gate per Rule 13 → halt for "looks good, commit"
   Commit: feat(web): port f07b invited qa engineer first-run (MS0-T030.5)

   ─── MS0-T030.6: F07c Invited Stakeholder First-Run ───
   Source:  QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07c Invited Stakeholder First-Run.html
   Target:  apps/web/app/(onboarding)/invited/stakeholder/page.tsx
   Role-specific deviations (CRITICAL):
     - **NO AI tour panel** per PM1_PRD §F07c — Stakeholders are read-only,
       no AI surface exposure. Skip the violet AI-confidence callouts entirely.
     - Show only Reports + Dashboards as starting destinations
     - Role badge: "Stakeholder · read-only access"
   Visual gate per Rule 13
   Commit: feat(web): port f07c invited stakeholder first-run (MS0-T030.6)

   ─── MS0-T030.7: F07d Invited Lead-Admin First-Run ───
   Source:  QA Nexus/PM1/PM1_UI_v2/frames - claude code build (PM1 v2.6-v2.8)/F07d Invited Lead-Admin First-Run.html
   Target:  apps/web/app/(onboarding)/invited/lead/page.tsx
   Role-specific deviations:
     - Show admin-tier links: F26 Agents, F26m1 Model Assignment, F28 Settings
     - Role badge: "Lead · 12 permissions enabled (incl. admin)"
     - First task hint: "Configure your team in F27 Users & Roles"
   Visual gate per Rule 13
   Commit: feat(web): port f07d invited lead-admin first-run (MS0-T030.7)

4. After all 3 commits: open one PR with title:
   "feat(web): port f07b/c/d invited-team onboarding frames"
   Body should reference the 3 commit SHAs + role-specific deviation summary.

5. Watch CI (6 jobs); if green, halt and tell me to merge. If red: surface
   the failure.

Hard rules to remember (still binding):
  - Rule 12 RWD: 5-viewport test (320/768/1024/1440/1920) before each commit
  - Rule 13 visual gate: post URL + 320/1440 screenshots before each commit
  - All CTAs teal #2DD4BF (system action) — NO violet on auth/onboarding surfaces
  - enforce-rwd.sh hook will block any w-[≥200px] / max-w-[1600px] you forget
```

---

## CHAT 3 (BE) — Day 2 prompt

**Worktree:** `~/AI_Tester_Project/Project10-QA_Nexus-backend`
**Branch:** new (`feature/auth-rbac-llm-embeddings`)
**Goal:** MS0-T021 → T024 sequential dependency chain (BetterAuth + RBAC + LLM gateway + embeddings).

```
Day 2 morning, BE session. T020 Prisma schema (your tonight work) should be
merged. Confirm via `gh pr view` first. If still open: finish + merge per
follow-ups.md playbook before starting this chain.

Sequence:

1. /sync-worktree to pull main fresh. Likely conflict point:
   .claude/settings.json (main added Ctx patterns). Keep BOTH halves.

2. New branch: git checkout -b feature/auth-rbac-llm-embeddings

3. PARALLEL TASK FOR YOGESH (HALT after writing branch, ask Yogesh first):
   Before T021 can be wired, Yogesh needs to:
     a. Create Neon account at https://console.neon.tech (free, no card)
     b. Create Resend account at https://resend.com (free 3K emails/mo)
     c. Get DATABASE_URL from Neon + RESEND_API_KEY from Resend
     d. Export both in ~/.zprofile (alongside CLOUDFLARE_API_TOKEN)
     e. Tell BE chat "DB + email ready"
   STATUS BLOCK: post "BE branch created. Awaiting Yogesh's Neon + Resend
   provisioning before T021 can land. Other tasks (T023/T024) don't depend
   on these — should I start there in parallel? [yes / no — wait]"

4. Once Yogesh greenlights:

   ─── MS0-T021: BetterAuth Postgres adapter + magic link ───
   - Install: pnpm --filter api add better-auth @better-auth/prisma
   - Configure adapter to use Prisma client + Postgres
   - Magic link transport: Resend HTTP API (not nodemailer SMTP)
   - Endpoints in apps/api/src/auth/auth.controller.ts:
       POST /auth/sign-up        (email-only; sends magic link)
       POST /auth/sign-in        (email-only; sends magic link)
       GET  /auth/callback       (consumes magic-link token; sets cookie)
       POST /auth/sign-out       (clears cookie)
   - Jest tests at apps/api/src/auth/auth.controller.spec.ts:
       - Happy path: sign-up → magic-link callback → session cookie set
       - Negative 1: callback with expired token → 401
       - Negative 2: callback with already-used token → 401
   - Commit: feat(api): wire BetterAuth Postgres adapter + magic link (MS0-T021)

   ─── MS0-T022: RBAC NestJS guard + RLS policies ───
   - Create @Roles() decorator at apps/api/src/auth/roles.decorator.ts
     accepting Admin | Lead | QA Engineer | Stakeholder
   - Create RolesGuard at apps/api/src/auth/roles.guard.ts
     reading session role + comparing against decorator metadata
   - Apply guard globally via APP_GUARD provider (with @Public()
     escape hatch for /health, /auth/*)
   - Postgres RLS policies via raw SQL migration:
       CREATE POLICY rls_workspace_scope ON <every project-scoped table>
         USING (workspace_id = current_setting('app.workspace_id')::uuid)
   - Set app.workspace_id from session cookie on every request
   - Jest tests at apps/api/src/auth/roles.guard.spec.ts:
       - Positive: Admin can access /v1/admin/users
       - Negative: QA Engineer hits /v1/admin/users → 403
       - Same matrix for Lead vs Stakeholder
   - Commit: feat(api): wire RBAC guard + Postgres RLS policies (MS0-T022)

   ─── MS0-T023: LLM gateway with primary→fallback retry ───
   - apps/api/src/llm/llm-gateway.service.ts:
       complete(prompt: string, options: { model?: 'fast'|'long'|'best', maxTokens?: number })
   - Primary models (Groq):
       'best' → openai/gpt-oss-120b (500 tok/s, 131K ctx, 1k RPD)
       'long' → meta-llama/llama-4-scout-17b-16e-instruct (10M tokens, preview)
       'fast' → openai/gpt-oss-20b (14.4k RPD)
   - Fallback (Gemini): gemini-2.5-flash (1.5k RPD)
   - Retry contract: catch 429 + 503 from Groq → exponential backoff once
     (200ms) → if still fails, switch provider to Gemini → if Gemini also
     fails: throw LLMUnavailableException (5xx upstream).
   - Every call emits OTel span 'llm.complete' with: provider, model,
     prompt_tokens, completion_tokens, latency_ms, fallback_triggered
   - Jest tests:
       - Happy: Groq returns 200 → span emitted → response returned
       - Fallback: mock Groq 429 → Gemini 200 → span shows fallback_triggered: true
       - Both down: mock Groq 429 + Gemini 503 → throws LLMUnavailableException
   - Commit: feat(api): wire LLM gateway with Groq+Gemini fallback (MS0-T023)

   ─── MS0-T024: Embedding service ───
   - apps/api/src/embeddings/embedding.service.ts:
       embed(text: string): Promise<Float32Array>
   - Load Qwen3-Embedding-0.6B once at module init via @xenova/transformers
   - Verify: 1024-dim output, ~50ms/embed on M1/M2 Mac (Render dyno may be
     2-3x slower; document the actual measurement in commit message)
   - Jest tests:
       - Returns Float32Array of length 1024
       - Same input → identical output (idempotent)
       - Empty string → throws ValidationException
   - Commit: feat(api): wire embedding service with Qwen3-0.6B WASM (MS0-T024)

5. After all 4 commits: open one PR with title:
   "feat(api): T021/T022/T023/T024 — auth + RBAC + LLM + embeddings"
   Body should reference all 4 commit SHAs + status of:
     - AC005 (BetterAuth working)
     - AC006 (RBAC 4 roles gated)
     - AC007 (Groq → Gemini fallback)
     - AC008 (embedding <200ms)

6. Watch CI; if green, halt and tell MAIN to merge.

Hard rules to remember:
  - .claude/rules/api.md is binding (api.md from BE chat P1.4)
  - Every endpoint needs a Zod schema in packages/shared (lands MS0-T004)
    — if T004 hasn't landed yet, surface that as a blocker and propose
    inline-schema interim
  - Every state-changing op writes to audit_log (HMAC-SHA256 chained,
    PM1_ERD §3.13) — synchronous, before response returns
  - LLM calls ONLY via LLMGateway, never direct Groq/Gemini SDK
```

---

## Quick reference for tomorrow morning

**Today's main SHA:** `f3143ff` (or whatever is latest after FE+BE PRs land tonight)

**Conformance lift target by EOD Day 2:** 89% → 96% (closes #13 cosmetic + lands T020/T030 + drains M0 acceptance gates that are achievable)

**Live URL:** https://qa-nexus-web.pages.dev/sign-in/ (will gain `/onboarding/invited/{qa,stakeholder,lead}/` + `/onboarding/founder/` after FE chat lands tonight + tomorrow's batch)

**Pending Yogesh actions (do during BE chat halt):**

1. Create Neon account → get `DATABASE_URL`
2. Create Resend account → get `RESEND_API_KEY`
3. Export both in `~/.zprofile`
4. Tell BE chat "DB + email ready"
