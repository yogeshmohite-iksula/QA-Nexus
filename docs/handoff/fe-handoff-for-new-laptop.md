# FE Handoff — New Laptop (Sun 2026-06-22)

**Audience:** FE+1 (Yogesh) on the new MacBook.
**Companion doc:** `2026-06-21-laptop-transition-master-handoff.md` (whole project; this file is the FE-only path).
**Cut date:** Fri 2026-06-19, 5:30 PM IST. State below is what's on `feat/web-fri-wire-sweep-batch-1` after PR #291 (Option C + Option B post-#292 runs wire — 9 surfaces live, no `<ComingSoon>` for any data-backed surface).

---

## 1. Clone + install

```bash
# Personal workspace (FE+1's worktree)
cd ~/AI_Tester_Project
git clone https://github.com/yogeshmohite-iksula/QA-Nexus.git Project10-QA_Nexus-frontend
cd Project10-QA_Nexus-frontend

# Node + pnpm (Homebrew, non-admin Mac per env memory)
export PATH="$HOME/homebrew/bin:$PATH"   # add to ~/.zshrc
brew install node@20                      # only if not present
npm i -g pnpm@10.33.2                     # match repo's pnpm version

# Install (workspace install; ~3-4 min cold)
pnpm install --frozen-lockfile
```

If `engine-strict` warns about Node 24 vs 20: the repo has `"engines.node": "20.x"` declared but Node 24 works fine for everything we touch (Next.js 15, NestJS 10, Prisma 5). No action needed — the WARN is cosmetic.

---

## 2. Env vars + secrets

### Local `.env` (do NOT commit; `.env` is gitignored at the root)

```bash
# apps/web/.env.local — required for local dev (FE)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

That's it for FE local. Everything else (BetterAuth secret, DB URL, R2 keys) is BE concern.

### Production secrets (already provisioned on Render + Cloudflare Pages)

You don't need to touch these — they're set on the dashboards:

- **Cloudflare Pages** (`apps/web`): `NEXT_PUBLIC_API_BASE_URL=https://qa-nexus-2.onrender.com`
- **Render** (`apps/api`): `DATABASE_URL`, `BETTERAUTH_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `CORS_ORIGINS`.

Rotation is documented in `docs/SECURITY.md`. Do NOT paste any of these into the repo, into Claude chat, or into Slack — the security rule (`.claude/rules/security.md`) is binding.

---

## 3. Dev server boot

```bash
# 1) Build shared types first (Prisma + Zod schemas; ~5 sec)
pnpm --filter @qa-nexus/shared build

# 2) FE dev server (Next.js 15 turbopack on :3000)
pnpm --filter web dev
# OR with persistent log:
pnpm --filter web dev > /tmp/dev.log 2>&1 &
tail -f /tmp/dev.log

# 3) Verify
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/home/   # → 200

# 4) Playwright (needed for visual gate + diff-probe + handoff scripts)
pnpm --filter web exec playwright install chromium

# 5) Confirm env var resolved
node -e "console.log(process.env.NEXT_PUBLIC_API_BASE_URL || '(unset — dev defaults to localhost:3001)')"
```

Common boot issues:

| Symptom                                             | Cause                              | Fix                                           |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| `Cannot find module '@qa-nexus/shared'`             | shared build not run               | `pnpm --filter @qa-nexus/shared build`        |
| `CRITICAL: failed to resolve API base URL` warning  | missing `NEXT_PUBLIC_API_BASE_URL` | env file step above (or 3001 fallback in dev) |
| Hydration mismatch on `<html>` (browser extensions) | known; ignore                      | suppressHydrationWarning is set at root       |
| Type errors in `apps/web` after pull                | shared dist stale                  | `pnpm --filter @qa-nexus/shared build` again  |

---

## 4. Frame-port skill setup

The skill lives at `.claude/skills/frame-port/SKILL.md` and orchestrates the 7-step workflow (Hard Rule 18). It's session-scoped — every new Claude Code session starts with the skill loaded.

**Trigger phrases that activate it:**

- "port frame F26m2"
- "build F22 React port"
- "port F18 from v2 HTML"

**Tools the skill calls:**

- `scripts/extract-canned-data.mjs --frame <Fxx> --html <path>` (Step 1)
- `.claude/skills/frame-port/extract-spec.mjs --html <path>` (Step 2)
- `.claude/skills/frame-port/diff-probe.mjs --port <react-route> --canonical <html>` (Step 5)

Each tool prints a one-page report. Run them in the FE-worktree directory; they assume `apps/web` is the React root.

**Status of in-flight frame ports:**

- F26m1 LLM Provider Setup Modal — shipped (PR #145 closed for Rule 17, redone in #150)
- F27 Users & Roles — shipped (#150-ish, then live-wired in this WIRE sweep)
- F27m1 Invite User Modal — shipped + live-wired
- F26m2 Agent Model Assignment Modal — shipped (Day 3-4)
- F28m1 LLM Provider Configuration — shipped + live-wired tonight
- F18 Test Suites — **not started** (M5 candidate, BE still incomplete)
- F22 Defect Detail v2 — **deferred to M5**
- F23/F25/F26 page surfaces — **labels-only via `<ComingSoon>`** per Fri WIRE batch 5

---

## 5. WIRE inventory — what's live, what's next

### Live as of 2026-06-19 17:30 IST (post-Option C bundle + Option B runs wire)

| Surface                      | Endpoint                                            | File                                                               |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| /home HERO greeting          | `useCurrentUser` + `useActiveProject` contexts      | `apps/web/components/home/qa-engineer-home.tsx`                    |
| /home QUEUE defect-triage    | `GET /api/defects`                                  | `apps/web/components/home/queue.tsx`                               |
| /home EVIDENCE_THREAD        | `GET /api/audit?limit=50`                           | `apps/web/components/home/right-rail.tsx`                          |
| /home Active runs            | `GET /api/test-runs?status=running`                 | `apps/web/components/home/outcome-board.tsx` (ActiveRunsCard)      |
| /home Recent runs            | `GET /api/test-runs` (default sort=started_at_desc) | `apps/web/components/home/outcome-board.tsx` (RecentRunsSection)   |
| F27 team roster              | `useAdminUsersList` hook                            | `apps/web/components/admin/users-roles-page.tsx`                   |
| F27 Recent activity          | `GET /api/audit?limit=50`                           | same                                                               |
| F27 Pending invites          | `GET /api/invitations`                              | same                                                               |
| F14 Requirements list        | `GET /api/projects/:projectId/requirements`         | `apps/web/components/requirements/requirements-list-page.tsx`      |
| F17 Test Cases count         | `GET /api/projects/:projectId/test-cases`           | `apps/web/components/test-cases/test-case-library-placeholder.tsx` |
| F26m1/F28m1 LLM config count | `GET /api/admin/config/llm-providers`               | `apps/web/components/admin/llm-provider-config-modal.tsx`          |

**Total live wires:** 11 surfaces. **No data-backed surface is `<ComingSoon>`.**

### `<ComingSoon>` (honest deferred — no BE endpoint exists)

- /home Outcome Board · Release risk (no release-tracking endpoint)
- /home Outcome Board · AI narrative (no agent-narrative endpoint)
- /home Right Rail · Suggested next + Pinned references (no recommender + no pin endpoint)
- F25 Executive Dashboard (banner over full page)
- F23 Reports Studio (banner over full page)
- F26 Agents · Recent Activity + Recent Decisions sections

### Next BE asks (for next-cycle WIRE work)

1. **`GET /api/test-runs/:id`** detail in `{ ok, run }` envelope (currently the controller returns un-enveloped `{ id, status, startedAt }` from PATCH handlers only). Would unblock the F19 Run Console drill-in path.
2. **`POST /api/admin/config/llm-providers/:id/test-connection`** — unblocks F26m1 "Test connection" wire (today: Pattern A wizard).
3. **Sprint metadata on `Project`** — unblocks the /home HERO "Sprint 42 · Day 9 of 14" canonical chip (today: dropped).

### Discipline pattern banked tonight — 54th RC (Hard Rule 11 contract verification)

Before wiring any of the 5 Option C surfaces, I greped each BE controller for its actual `@Get` / `@Post` / `@Patch` decorators (not the file-tree path, not the design doc — the real source). Catch: `test-runs.controller.ts` had **only `@Patch(:id/start|result|abort)`** — no list endpoint, no detail-by-id. That prevented 30+ min of dead-end wiring against a non-existent route. Honest `<ComingSoon>` stubs shipped instead.

Yogesh ratified the pattern: it caught the gap → Option B was chosen → BE+1 shipped `GET /api/test-runs` in #292 (~5:30 PM) → wires landed the same evening (`/home` Active runs + Recent runs are live as of 17:30 IST). **The Rule 11 pattern stands either way — verify before wire, every time. The scope-add round trip cost ~30 min total; the cost of wiring blind against an imagined endpoint would have been a half-shipped PR with broken paths.**

---

## 6. Known gotchas + workarounds

### Discipline rules (the ones that actually matter day-to-day)

- **Hard Rule 11** — read `@Controller(...)` decorator + the `@Get()/@Post()/@Patch()` paths in the BE source. File-tree location ≠ route prefix (33rd RC). For each endpoint, read its OWN response envelope — don't assume the workspace pattern (44th RC).
- **Hard Rule 13** — visual gate is binding; screenshots at 320 + 1440 for every UI change. Use the `_vg_*.mjs` Playwright pattern (template at `_vg_option_c.mjs` in the last commit before push). Output to `docs/audits/screenshots/<date>-<topic>/`.
- **Hard Rule 14** — every authenticated page wraps in `AdminShell` from `apps/web/components/admin/admin-shell.tsx`. Non-shell pages: `(auth)/*` only.
- **Hard Rule 17** — extracted canned-data lives in `apps/web/components/<frame>/<frame>.canned-data.ts`. NEVER hardcode user-visible strings in `.tsx`.

### Commitlint

- Subject MUST be lowercase after the colon. `feat(web): option C ...` ✓ — `feat(web): Option C ...` ✗.
- Bullet body lines are fine in any case.

### Pre-push gates (`.husky/pre-push`, 4 stages)

1. `pnpm typecheck` — full workspace. ~30 sec.
2. `pnpm exec prettier --check .` — honors `.prettierignore` **NOT `.gitignore`**. If a gitignored file like `spec.json` trips it, run `pnpm exec prettier --write <file>` directly. **Do NOT `--no-verify`** — it skips ALL 4 gates.
3. Frozen-lockfile check.
4. CHANGELOG guard — only fails if `apps/**/src/` or `packages/**/src/` files changed without a CHANGELOG bump.

### Stale-deploy lineage

Default debugging instinct: "is this a stale deploy?" Check before anything else. 4-for-5 catches this year (#418, J, D, K, …). Cloudflare Pages preview URL → check timestamp matches the latest commit SHA on the branch.

### Cross-site cookies (P0-001 root cause)

- `qa-nexus-2.onrender.com` ↔ `qa-nexus-frontend-*.pages.dev` are DIFFERENT registrable domains. Cookies need `SameSite=None; Secure; Partitioned; host-only` (no `Domain=`). Wired in `apps/api/src/auth/auth.config.ts → resolveCookieConfig`. Do NOT add a `Domain=` attribute thinking it will "fix CORS" — it breaks the cross-site path.

### `getApiBaseURL()` is the ONLY way to build API URLs (46th RC)

- Defined in `apps/web/lib/env.ts`. 3-tier resolution: `NEXT_PUBLIC_API_BASE_URL` env → `https://qa-nexus-2.onrender.com` (prod hint) → `http://localhost:3001` (dev).
- Every `lib/api/*.ts` adapter goes through `fetchWithFallback()` which calls `getApiBaseURL()` internally. Do not call `fetch('/api/...')` directly from page code.

### `serverless DB background-cron cost` (47th RC)

- Neon free has a 5-min autosuspend on the compute. Any cron/poll/healthcheck that touches the DB on a `<5min` interval keeps it awake 24/7 → burns the CU-hr cap. /health on the BE is DB-free (memory-only). Don't add a DB-touching cron without a 10-AM-to-10-PM operating-window gate.

### Verify ticket premises before fixing (48th RC)

- Before writing code from a ticket that says "add X to solve Y" — code-verify Y is actually the cause. The proposed fix may target the wrong root.

### New-laptop bootstrap sanity (~5 min total)

After the dev server boots clean, run this smoke sequence to confirm the new machine is wire-equivalent to the previous one:

```bash
# 1) FE typecheck (the whole workspace)
pnpm typecheck         # expect "Done" on apps/web, apps/api, and shared

# 2) Lint guard
pnpm --filter web exec eslint apps/web/lib apps/web/components 2>&1 | tail -5

# 3) Visual gate dry-run (Playwright must be installed per §3 step 4)
node -e "import('playwright').then(p => p.chromium.launch().then(b => { console.log('playwright OK'); b.close(); }))"

# 4) Live API reachability (signed-in cookie-bearing curl is overkill here;
#    a plain GET /health proves DNS + Render is awake)
curl -s https://qa-nexus-2.onrender.com/health | head -c 200

# 5) Build the production bundle once (catches static-export gotchas the
#    dev server hides)
pnpm --filter web build
```

If `pnpm --filter web build` succeeds, you're done bootstrapping. If it fails on a `next/cache` filesystem error, delete `apps/web/.next` and retry — the cache directory is dev-server scoped and doesn't survive a clone.

---

## Open branches as of cut

| Branch                                          | PR            | State                                                  |
| ----------------------------------------------- | ------------- | ------------------------------------------------------ |
| `feat/web-fri-wire-sweep-batch-1`               | #291          | open · Option C bundle pushed · awaiting Yogesh review |
| `docs/2026-06-18-thu-laptop-transition-handoff` | (this branch) | open · this doc + master handoff                       |
| `main`                                          | —             | base — Cloudflare Pages auto-deploys                   |

If the new laptop is up before #291 merges, **don't rebase #291 onto main while the sweep is in review** — merge it first via the GitHub UI, then `git fetch && git checkout main && git pull` on the new machine.

---

## Sat AM E2E checklist (Yogesh runs; FE+1 watches console + network)

1. Workflow 1 — Admin walks F27 → F26m1 → F28: live roster + live LLM `Connected · N`.
2. Workflow 2 — Admin invites + role-switches: `Pending invites` row appears + `Recent activity` shows the row.
3. Workflow 3 — QA Engineer signs in + walks /home → /requirements → /test-cases: live HERO greeting, live queue defect-triage count, live evidence thread, F14 live row list (or canned fallback if pilot DB empty), F17 live "N cases" header.

Anything that shows canned data on production is the Option-B fallback — verify the fetch hit (DevTools Network) and check for 401/403/5xx. **First triage step is always:** is this a stale deploy?

— end —
