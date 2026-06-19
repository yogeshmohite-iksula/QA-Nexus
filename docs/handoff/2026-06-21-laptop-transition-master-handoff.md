# 🔴 MASTER HANDOFF — Laptop / Account Transition (target Sun 2026-06-21)

> **Author:** MAIN · **Started:** Thu 2026-06-18 ~3 PM IST · **Finish by:** Fri 2026-06-20 EOD · **Status:** v3 (Fri 2026-06-19 ~4:00 PM IST — §1 snapshot advanced to `d0ba367`, §8 work-list updated with Fri PM completions, Option C: E2E→Sat AM).
> **Why this doc exists (49th RC):** when a team member rotates off a laptop/account/email, **institutional memory must live in version control + off-device backup — never only in agent process state.** Nothing in any Claude Code / Cowork _session_ survives the transition. This doc + the repo + the off-device backups ARE the surviving brain. If you are a fresh Claude on a new laptop reading this: **start here.**
> **Verify-before-assert:** every state claim below was confirmed against `origin/main` + live curl on Thu 2026-06-18 ~3 PM IST. Re-verify before acting — deploys drift (see §1 stale-Render finding).

---

## §1 — Project state snapshot (Fri 2026-06-19 ~4:00 PM IST, verified)

### Repo / git

- **main HEAD = `d0ba367`** (advanced from `9059a39` after #288 + #289 merged Fri ~3:10 PM IST). Re-fetch before acting; this snapshot drifts hourly during active merge waves.
- **Open PRs against main** (snapshot Fri 2026-06-19 ~3:45 PM IST — re-run `gh pr list --state open --base main` for current truth):
  | PR | Title | Type | Status |
  | --- | --- | --- | --- |
  | #291 | FE WIRE sweep — 4 wires + ComingSoon + HERO de-fiction | feat/web | OPEN (FE+1 — batch 1 of 2; expanding tonight) |
  | #290 | BE handoff doc — architecture/contracts/infra/bootstrap | docs/handoff | OPEN (BE+1 finalizing) |
  | #287 | laptop transition master handoff + Path C | docs/handoff | OPEN (this doc — MAIN's branch) |
  | #286 | FE canned-data inventory (STEP 1) | docs/audit | OPEN (FE+1 inventory, historical) |
- **Merged Fri PM:** #288 (`4c1a7aa` — jira_webhook_events migration, Path B), #289 (`d0ba367` — clean-DB schema drift corrective, 3 tables + 17 cols + 6 enum + 21 FK).
- **Merged Fri AM (stale-PR triage):** #279 (46th RC docs), #281 (BE EOD Day 32), #282 (MAIN Fri evening EOD) — all squash-merged, branches deleted.
- **Closed:** #285 (Supabase hot-standby) — closed Thu per 49th-RC ruling; Path C supersedes; recoverable from git history.
- **Previously merged (Thu+earlier):** #277 (prod-baseURL fix), #278 (sweep B), #280 (FE EOD), #283 (sweep C), #284 (cron-gate fix).

### Live deploys (the critical truth — merged ≠ deployed)

- **Render API** (`qa-nexus-api.onrender.com`): `/health` → 200; `/health/lite` → 200 (uptime ~248s — **fresh auto-deploy from #288+#289 merge**, verified Fri ~3:45 PM IST). Includes Path B migration (#288) + full drift corrective (#289). **The 41st-RC stale-deploy pattern still applies on every laptop bring-up** — always confirm the deployed SHA against `gh pr view` for the most recent code PR before believing the running instance is current.
- **Cloudflare Pages FE** (`qa-nexus-web.pages.dev`): last known good = `cb1ed3a` (#277, the 46th-RC prod-baseURL fix). ⟦Pending: FE+1 WIRE sweep #291 merge → auto-deploy → re-verify Pages bundle SHA⟧
- **Neon Postgres DB — Path C ACTIVE + VERIFIED:** `qa-nexus-2` is live with full migration chain (#288 + #289 applied), base seed (5/30/63/5/25/~158) + pilot seed complete, RLS + HNSW + audit-trigger verified. Original `qa-nexus` auto-resumes Jul 1 → flip Render back → `qa-nexus-2` stays as warm hot-standby. **53rd-RC lesson** (`feedback_migrate_status_vs_schema_drift.md`): `prisma migrate status` "up to date" does NOT mean DB matches `schema.prisma` — always run `prisma migrate diff --exit-code` on fresh DBs. **49th-RC lesson** (`feedback_verify_constraint_scope_before_expensive_workaround.md`): Neon cap is per-project not per-account; same-vendor multi-project beats cross-vendor migration.

### Conformance verdict (dashboard §12.7, as of Fri ~4:00 PM IST)

- **BE ✅ GREEN** — anon battery live; #288 (Path B) + #289 (drift corrective) merged; Render auto-deployed and verified (`/health` + `/health/lite` both 200).
- **DB ✅ GREEN** — qa-nexus-2 fully seeded (5/30/63/5/25/~158), RLS + HNSW + audit-trigger verified, migration chain clean.
- **FE 🟡 WIRE SWEEP IN-FLIGHT** — PR #291 batch 1 (4 wires + ComingSoon + HERO de-fiction) open; batch 2 (F14, F17, ACTIVE_RUNS, RECENT_RUNS, F26m1) ships tonight/Sat AM.
- **E2E reframed Fri PM (Option C):** pushed to Sat AM clean 3-workflow E2E after all wires land. Tonight = ship everything + handoff polish. **Revised pilot-ready ETA: Sat PM after E2E.**

### Reality-check ledger

- **~53 RCs** accumulated (full 1-N reconciliation deferred Phase D). Source of truth = the `feedback_*.md` files in `.claude/memory/` + the per-day EOD/triage docs. **Do NOT trust any single ordinal count** until the Phase-D reconciliation runs (count files, rebuild 1-N from source). Latest banked:
  - **46th** — `feedback_deployed_bundle_baseurl_verification.md` (PR #279 — Pages bundle prod-baseURL gate).
  - **47th/48th** — BE+1's cron-gate + verify-before-ship (in BE+1's per-machine memory — backed up in BE handoff PR #290).
  - **49th (canonical, Yogesh ruling Thu Jun 18 PM)** — `feedback_verify_constraint_scope_before_expensive_workaround.md` — verify constraint EXACT scope before recommending an expensive workaround.
  - **50th** — `feedback_institutional_memory_survives_in_vcs.md` — institutional memory survives in VCS + off-device backup.
  - **51st (banked by BE+1 Thu Jun 18 evening)** — `feedback_env_no_stale_no_duplicates_before_migration.md` — audit `.env` for stale references AND duplicate keys before same-vendor env migration.
  - **53rd (banked Fri Jun 19)** — `feedback_migrate_status_vs_schema_drift.md` — `prisma migrate status` "up to date" ≠ DB matches `schema.prisma`. Run `prisma migrate diff --exit-code` on fresh DBs. Day-32 qa-nexus-2: chain was 3 tables + 17 cols behind.

---

## §2 — New-laptop bootstrap sequence

1. **Install Claude Code** (desktop app or `npm i -g @anthropic-ai/claude-code`; this project runs via the Cowork desktop app + local `claude` CLI). Sign in with the **project identity** (`claudecode-2@iksula.com` was the working email — ⟦confirm the post-transition email⟧).
2. **Install toolchain:** Node ≥20 (v24 fine), `pnpm` (10.x — **pnpm only, never npm/yarn**, Hard Rule 8), `gh` CLI, git. On a non-admin Mac, Homebrew lives at `~/homebrew/bin` — prefix sub-shells with `export PATH="$HOME/homebrew/bin:$PATH"`.
3. **Clone the repo:** `gh auth login` as **`yogeshmohite-iksula`** (corporate account — NOT `yogeshcodeshare`). `git clone https://github.com/yogeshmohite-iksula/QA-Nexus.git` → the repo is **`QA-Nexus`** (capital, hyphen — NOT `qa-nexus`).
4. **Worktrees (3-agent model):** the workflow uses 3 parallel worktrees — root (`Project10-QA_Nexus`, MAIN), `-backend` (BE+1, `apps/api`), `-frontend` (FE+1, `apps/web`). Recreate via `git worktree add ../Project10-QA_Nexus-backend main` etc., or clone three times. Each agent's chat is scoped to its worktree.
5. **Install deps:** `pnpm install` at root (workspace).
6. **Env files** (gitignored — restore from the password manager / Render, NEVER from git): `apps/api/.env` (`DATABASE_URL`, `DIRECT_URL`, `BETTERAUTH_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, R2 keys), `apps/web/.env.local` (`NEXT_PUBLIC_API_BASE_URL`). **Live secret values live ONLY in Render env vars + GitHub Secrets** (Hard Rule 6 + `.claude/rules/security.md`).
7. **Mount Cowork folders** (see §4) — they are OUTSIDE the repo and do NOT come with the clone.
8. **Verify:** `pnpm --filter @qa-nexus/api typecheck` + `pnpm --filter web typecheck` green → environment is sound.

---

## §3 — Agent re-establishment templates (BE+1 / FE+1 / MAIN)

The 3-agent orchestration is a **workflow convention, not code** — it lives in the briefs + CLAUDE.md + the per-agent handoff docs, so it reconstitutes from version control. **Each persona is defined by (a) which worktree it owns, (b) which docs it reads, (c) which paths it writes — re-establish by re-pointing, not by re-explaining.** Per-agent handoff docs:

- **MAIN:** this file (`docs/handoff/2026-06-21-laptop-transition-master-handoff.md`).
- **BE+1:** `docs/handoff/be-handoff-for-new-laptop.md` — **TO BE FILLED BE+1 Fri AM** on the existing `docs/be-laptop-transition-handoff` branch (which is already in flight in the `-backend` worktree). BE+1 owns the content; MAIN does not write into BE+1's lane.
- **FE+1:** `docs/handoff/fe-handoff-for-new-laptop.md` — **TO BE FILLED FE+1 Fri AM** on a new branch (FE+1 currently on `docs/fe-canned-inventory`, not a handoff branch). FE+1 owns the content; MAIN does not write into FE+1's lane.

The per-agent docs cover what the master handoff (this doc) does **not**: per-worktree env recipes, in-flight feature branches, agent-specific tooling state, agent's own per-machine `~/.claude/projects/.../memory/` inventory.

### §3.1 — BE+1 first-message template (paste at first Claude session in `-backend` worktree)

```
You are BE+1, the backend agent for the QA Nexus PM1 build. You own the `-backend`
worktree, scoped to `apps/api` (NestJS 10 + Prisma 5 + BetterAuth + pgvector on Neon).

Bootstrap reading list (in order):
1. CLAUDE.md (auto-loaded; project-wide hard rules)
2. .claude/memory/MEMORY.md + the feedback_*.md files referenced there (esp. 41st/46th/49th/50th/51st RCs)
3. .claude/rules/security.md + .claude/rules/ (any backend rules)
4. docs/handoff/2026-06-21-laptop-transition-master-handoff.md (master handoff; this is the surviving brain)
5. docs/handoff/be-handoff-for-new-laptop.md (YOUR per-agent handoff — BE+1 lane state)
6. QA Nexus/PM1/PM1_ERD/PM1_ERD.md v2.1 (binding engineering spec)
7. The most-recent `docs/audits/*be*` + `docs/eod-reports/*be*` files
8. The pre-handoff baseline EOD: docs/eod-reports/2026-06-18-thu-migration-fix-eod.md

Verify-before-assert FIRST (do not trust handoff state blindly):
- git fetch && git log origin/main --oneline -5
- gh pr list --state open --base main
- curl -s https://qa-nexus-api.onrender.com/health/lite (expect 200; if 404, Render predates #284 — escalate)
- DB connectivity: which Neon project is qa-nexus-api on (qa-nexus vs qa-nexus-2 vs post-Jul-1)?
- Apply 51st RC: audit your .env for stale references AND duplicate keys BEFORE any prisma migrate

Hard rules you must honor: $0 cost gate (Rule 1) · no ban-list deps (Rule 5) · no secrets in repo (Rule 6) ·
all state-changes → HMAC audit_log (Rule 7) · pnpm only (Rule 8) · TS strict (Rule 9) ·
Zod schemas in packages/shared (Rule 10) · surface-don't-resolve (Rule 11) · NO merges to apps/api/src/**
without Yogesh approval (auth security-sensitive).

Report the reconciled truth-state, then await Yogesh's direction.
```

### §3.2 — FE+1 first-message template (paste at first Claude session in `-frontend` worktree)

```
You are FE+1, the frontend agent for the QA Nexus PM1 build. You own the `-frontend`
worktree, scoped to `apps/web` (Next.js 15 App Router + React 19 + Tailwind 4 + shadcn/ui +
TanStack Query v5 on Cloudflare Pages).

Bootstrap reading list (in order):
1. CLAUDE.md (auto-loaded; project-wide hard rules — especially Rules 12-18 RWD/visual-gate/AdminShell/
   v2-HTML-source/canonical-first/canned-data/frame-port-skill)
2. .claude/memory/MEMORY.md + the feedback_*.md files referenced there (esp. 41st/43rd/46th RCs which
   are FE-bundle/wire-verification rules)
3. .claude/rules/frontend.md + .claude/rules/ (FE design-token + responsive enforcement)
4. docs/handoff/2026-06-21-laptop-transition-master-handoff.md (master handoff; this is the surviving brain)
5. docs/handoff/fe-handoff-for-new-laptop.md (YOUR per-agent handoff — FE+1 lane state, WIRE-sweep status)
6. QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md (locked design system)
7. QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/_DESIGN_RULES.md (17 rules, binding for ports)
8. .claude/skills/frame-port/SKILL.md (Rule 18 — skill-mandatory frame ports)
9. The most-recent `docs/audits/*fe*` + `docs/eod-reports/*fe*` files

Verify-before-assert FIRST (do not trust handoff state blindly):
- git fetch && git log origin/main --oneline -5
- Open https://qa-nexus-web.pages.dev in browser → DevTools Network → confirm bundle SHA + that XHR
  requests hit qa-nexus-api.onrender.com NOT localhost:3001 (46th-RC gate)
- Stale-deploy check FIRST on any UI bug triage (41st RC, now 4-for-4): is this in the CURRENT
  deployed bundle? grep main HEAD + probe live bundle BEFORE any code dig

Hard rules you must honor: locked design tokens (no MD3/tertiary) · 46 locked HTML frames untouched
(Rule 3) · RWD mobile-first 320→1920 with no horizontal scroll (Rule 12) · visual confirmation gate
before commit (Rule 13 — /ui-check screenshots at 320+1440) · AdminShell parity on every (app) route
(Rule 14) · canonical-first port workflow + canned-data verbatim (Rules 16-17) · surface-don't-resolve
(Rule 11).

Report the reconciled truth-state, then await Yogesh's direction.
```

### §3.3 — MAIN first-message template (paste at first Claude session in root worktree)

```
You are MAIN, the orchestrator for the QA Nexus PM1 build. You own the root worktree
(Project10-QA_Nexus). Your role: coordination, merge-wave execution, ADR ratification,
memory/doc filing, cross-domain conflict surfacing (Rule 11 — surface, don't resolve),
EOD reports, the conformance dashboard, and this handoff.

Bootstrap reading list (in order):
1. CLAUDE.md (auto-loaded; project-wide hard rules)
2. .claude/memory/MEMORY.md + ALL feedback_*.md files (you orchestrate; you need the full RC ledger)
3. docs/handoff/2026-06-21-laptop-transition-master-handoff.md (THIS file — the surviving brain you steward)
4. docs/audits/2026-06-12-fri-main-master-conformance-dashboard.md (Phase B/C/D conformance state)
5. docs/triage/*  + docs/briefs/yogesh-deep-test-cycle.md (decision lineage + launch playbook)
6. QA Nexus/PM1/PM1_PRD/PM1_PRD.md v8.1 + PM1_ERD/PM1_ERD.md v2.1 (binding specs)
7. The most-recent `docs/eod-reports/*main*` files

Verify-before-assert FIRST (do not trust this doc's state blindly):
- git fetch && git log origin/main --oneline -5  (re-confirm main HEAD)
- gh pr list --state open --base main  (current open-PR set, drifts hourly during merge waves)
- curl -s https://qa-nexus-api.onrender.com/health and /health/lite
- DB: which Neon project is qa-nexus-api on? (qa-nexus / qa-nexus-2 / post-Jul-1)
- Restore user auto-memory + Cowork folders from off-device backup (handoff §4) if not mounted

Discipline that defines this project:
- Verify (grep + curl + network-tab) before asserting; merged ≠ live (39th/41st/43rd/46th RC)
- 41st-RC stale-deploy check FIRST on any FE bug (4-for-4 lineage)
- 49th-RC verify constraint scope before recommending expensive workaround
- 50th-RC institutional memory survives in VCS only — keep this doc current
- 51st-RC audit .env for stale + duplicates before any same-vendor env migration
- $0 cost gate (Rule 1); no secrets in repo (Rule 6); surface-don't-resolve (Rule 11)
- Merges are Yogesh-driven; you prepare + recommend order, you don't merge auth-sensitive code
  (apps/api/src/**) without explicit approval

Report the reconciled truth-state, then await Yogesh's direction.
```

---

## §4 — Memory restoration (the 50th-RC critical path — formerly 49th-RC candidate; renumbered per Yogesh Thu PM ordinal ruling)

**Two memory systems — only ONE travels with the clone:**

| System                   | Location                                                                                                               | Travels with git?              | Action                                                                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Repo memory**          | `.claude/memory/` (25 `feedback_*.md` + `MEMORY.md` + domain/tools dirs)                                               | ✅ YES (committed)             | survives the clone automatically                                                                                                                                                                             |
| **User auto-memory**     | `~/.claude/projects/-Users-yogeshmohite-AI-Tester-Project-Project10-QA-Nexus/memory/` (**26 files** incl. `MEMORY.md`) | ❌ NO (per-machine)            | **COPY OFF-DEVICE before wipe** → restore to the same relative path on the new laptop (the dir-name encodes the project path; if the new laptop's home/path differs, the dir name changes — rename to match) |
| **Cowork workspace**     | `~/Claude Cowork Workspace /AI Based QA Platform/QA nexus Project/...` (work-log xlsx, token-tracking, hours log)      | ❌ NO (outside repo)           | **COPY OFF-DEVICE** (it holds the 17-sheet work-log workbook + token tracking)                                                                                                                               |
| **chat-history archive** | `chat-history/raw-transcripts/` (if used)                                                                              | ❌ NO (gitignored, local-only) | **COPY OFF-DEVICE** if you want the raw session transcripts                                                                                                                                                  |

**Backup procedure (run BEFORE the laptop is wiped):**

```bash
# ═══ STEP 1: Create backup directory ═══
BK=~/qa-nexus-transition-backup-2026-06-21
mkdir -p "$BK"

# ═══ STEP 2: Copy local-only stores ═══
# User auto-memory (26 files — all RC lessons, dev-env notes, pilot-team context)
cp -R ~/.claude/projects/-Users-yogeshmohite-AI-Tester-Project-Project10-QA-Nexus/memory "$BK/user-auto-memory"

# Cowork workspace (work-log xlsx, chat-history, token tracking)
cp -R "$HOME/Claude Cowork Workspace " "$BK/cowork-workspace"   # note trailing space in folder name

# Claude Code session transcripts (large — 100+ MB; optional but valuable for auditing)
mkdir -p "$BK/session-transcripts"
cp ~/.claude/projects/-Users-yogeshmohite-AI-Tester-Project-Project10-QA-Nexus/*.jsonl "$BK/session-transcripts/" 2>/dev/null || true

# ═══ STEP 3: Verify counts BEFORE trusting the backup ═══
echo "=== Verification ==="
echo "User memory files: $(ls "$BK/user-auto-memory" | wc -l | tr -d ' ')  (expect ~26)"
echo "Cowork files: $(find "$BK/cowork-workspace" -type f | wc -l | tr -d ' ')"
echo "Session transcripts: $(ls "$BK/session-transcripts"/*.jsonl 2>/dev/null | wc -l | tr -d ' ')"

# ═══ STEP 4: Create compressed archive for USB + iCloud ═══
tar -czf ~/qa-nexus-handoff-backup-$(date +%Y%m%d).tar.gz -C ~ qa-nexus-transition-backup-2026-06-21/
echo "Archive: ~/qa-nexus-handoff-backup-$(date +%Y%m%d).tar.gz"
echo "Size: $(du -sh ~/qa-nexus-handoff-backup-*.tar.gz | cut -f1)"
```

**Dual-medium backup (51st RC discipline — verify before destructive op):**

1. **USB drive:** copy `~/qa-nexus-handoff-backup-*.tar.gz` to USB root. Eject safely.
2. **iCloud Drive:** copy the same `.tar.gz` to `~/Library/Mobile Documents/com~apple~CloudDocs/QA-Nexus-Backup/`. Confirm upload completes (check iCloud status icon). If no iCloud, use Google Drive via browser upload.
3. **Verify BOTH copies** before clearing the laptop: `shasum -a 256` on the original, USB copy, and iCloud copy must match.

**New-laptop restore procedure:**

```bash
# ═══ On the NEW laptop, after cloning the repo ═══

# 1. Extract backup (from USB or iCloud)
tar -xzf /Volumes/USB/qa-nexus-handoff-backup-*.tar.gz -C ~/

# 2. Restore user auto-memory to the Claude Code project path
#    IMPORTANT: the dir name encodes the absolute project path on disk.
#    If the new laptop's project path differs, create the new dir first:
NEW_PROJ_DIR=$(echo "$HOME/AI_Tester_Project/Project10-QA_Nexus" | sed 's|/|-|g; s|^-||')
mkdir -p "$HOME/.claude/projects/-$NEW_PROJ_DIR/memory"
cp -R ~/qa-nexus-transition-backup-2026-06-21/user-auto-memory/* \
      "$HOME/.claude/projects/-$NEW_PROJ_DIR/memory/"

# 3. Restore Cowork workspace (if continuing Cowork sessions)
cp -R ~/qa-nexus-transition-backup-2026-06-21/cowork-workspace/* \
      "$HOME/Claude Cowork Workspace /"   # trailing space

# 4. Verify restoration
echo "User memory restored: $(ls "$HOME/.claude/projects/-$NEW_PROJ_DIR/memory/" | wc -l | tr -d ' ') files (expect ~26)"
echo "MEMORY.md lines: $(wc -l < "$HOME/.claude/projects/-$NEW_PROJ_DIR/memory/MEMORY.md")"
```

**Do NOT rely on the repo clone for the user auto-memory or Cowork stores — they are local-only by design.** This is the entire reason the 50th RC exists. The repo's `.claude/memory/` (committed, 25+ files) survives automatically; the user-session memory (per-machine, 26+ files) does NOT.

---

## §5 — First message to the new Cowork Claude (copy-paste template)

```
You are MAIN, the orchestrator for the QA Nexus PM1 build. Context after a laptop transition.

1. Read CLAUDE.md (auto-loaded) + .claude/memory/MEMORY.md + this handoff:
   docs/handoff/2026-06-21-laptop-transition-master-handoff.md
2. Verify-before-assert FIRST (do not trust this doc's state blindly — it may be stale):
   - git fetch && git log origin/main --oneline -1   (expect 04c73ea or later)
   - gh pr list --state open --base main             (expect the §1 open-PR set, minus any merged since)
   - curl -s https://qa-nexus-api.onrender.com/health and /health/lite  (lite 404 = Render still stale → redeploy)
   - DB: is Neon resumed or did we fail over to Supabase (PR #285)?
3. Restore user auto-memory + Cowork folders from the off-device backup (handoff §4) if not already mounted.
4. Report the reconciled truth-state, then await my direction. Hard Rule 11: surface conflicts, don't resolve.
Discipline that defines this project: verify (grep+curl+network-tab) before asserting; merged ≠ live (41st/43rd/46th RC);
$0 cost gate (Rule 1); no secrets in repo (Rule 6); surface-don't-resolve (Rule 11).
```

---

## §6 — Hard Rules, binding decisions, workflow, known issues

### Hard Rules (full text in `CLAUDE.md` — the binding source)

1. **$0/month cost gate** (any paid component needs Yogesh's written approval + ADR). 3. Never modify the 46 locked HTML frames. 5. No ban-list deps (FastAPI, Redis, MUI, etc.). 6. No secrets in repo. 7. All state-changes → HMAC audit_log. 8. pnpm only. 9. TS strict. 10. Zod schemas in `packages/shared`. 11. **When in doubt ask Yogesh — surface, don't resolve.** 12 RWD · 13 visual gate · 14 AdminShell parity · 15 v2-HTML source · 16 canonical-first · 17 canned-data verbatim · 18 frame-port skill mandatory.

### Binding decisions A–F (conformance scope)

- **A** invite flow = M1-mandated (must work). **B(a)** TipTap doc authoring = SKIP. **B(b)** F18 Test Suites = DEFERRED-from-pilot (Sat-optional / M6). **C** F24 QA-Value dashboard = DROPPED. **D** Jira = seed-only for pilot (outbound sync → M5). **E** P0-C fictional names = canned-data override (no Rule-3 frame edits). **F** (Fri shake-down) H sign-out 405 + I F28 audit-count + J RSC-404s. Plus: **W2-R defects API STAYS**, **F21 STAYS**, **Yogesh test = deep-test cycle, launch on test feedback (no fixed date).**
- **Option A (Fri Jun 19)** — disciplined PM1 scope. No new features. Focus: wire sweep + E2E + handoff. Supersedes any prior scope expansion.

### $0/month cost gate — operational details

- **Rule 1 is absolute.** Even $5/mo upgrades need an ADR + Yogesh sign-off. The 49th RC showed how this discipline works in practice: Supabase Free is genuinely free, but the migration effort (3-4 hr + new vendor in topology) was premature — same-vendor Path C ($0, ~1 hr) existed.
- **Indian RBI e-Mandate gotcha:** Stripe/Paddle/Lemon Squeezy auto-billing may fail for Indian-issued cards (RBI two-factor mandate on recurring > ₹5,000). If PM1 ever moves to a paid tier, test the payment flow with Yogesh's card specifically. Manual billing (invoice → one-time payment) is the safe fallback.
- **Free-tier caps to watch:** Neon 100 CU-hr/project/mo + 0.5 GB storage, Render 750 hr/mo + 512 MB RAM + 15-min cold start, Cloudflare Pages 500 builds/mo, Resend 3,000 emails/mo, Groq 1k RPD on gpt-oss-120b, GitHub Actions 2k min/mo.
- **UptimeRobot 5-min keep-alive** must cover the 7-day 10 AM–10 PM pilot window. The 47th RC showed a `*/15 updateMany` cron keeping Neon compute awake 24/7 → burned the CU-hr cap with zero users.

### 51+ reality-check lessons distilled (binding patterns — see `.claude/memory/feedback_*.md` for full write-ups)

**Pattern family 1 — Verify before assert:**

- **Merged ≠ live.** Always confirm the deployed SHA, not the assumed one (41st RC — 5-for-5 stale-deploy pattern). `gh pr view` → compare SHA to Render/Pages deploy.
- **Two-axis aggregation:** merged-on-main AND live-verified must be independently confirmed (43rd RC). A code PR squash-merged on main can still be running a stale bundle.
- **Live-verified = network-tab check** — human watches DevTools Network on the live URL, outgoing host = production API origin + 2xx + real data, not canned fallback. Playwright-pass / page-renders ≠ verified (46th RC).
- **Constraint scope before expensive workaround** — when a quota/limit blocks you, verify its exact scope (per-project vs per-account vs per-region) from primary vendor docs BEFORE proposing a cross-vendor migration (49th RC).
- **Audit .env for stale refs AND duplicate keys** before any same-vendor env migration (51st RC). Same-vendor URLs look "right enough" that grep-by-vendor misses stale values.

**Pattern family 2 — Infrastructure economics:**

- **Serverless DB cron-gate** — any unconditional cron/poll/DB-touching healthcheck on <5-min interval keeps Neon compute awake 24/7 → burns the CU-hr cap (47th RC). Gate crons to the operating window; keep healthchecks memory-only.
- **Pattern A canned fallback masks broken wires** — FE renders fixtures when API calls fail, so a page that "looks fine" may not be hitting the API at all. Network-tab is the only proof (46th RC).

**Pattern family 3 — Agent coordination:**

- **Verify API paths from producer source** before prescribing to consumer agents — never assume REST conventions (33rd RC). Source from `*.controller.ts` + shared Zod schemas.
- **Independent diagnosis convergence** = high confidence — when two agents converge on the same root cause via different layers, trust the convergence (35th RC). But still verify the FIX empirically.
- **Cross-worktree .env discipline** — edits MUST target the correct worktree; verify with `pwd` before assuming landed (18th RC).
- **Chat misroute** — agents MUST verify-before-edit when an incoming brief looks outside their worktree's role (25th RC).
- **Cascade discipline** — when squash-merge flips sibling PRs DIRTY, hold+surface, don't force-merge (40th RC).

**Pattern family 4 — Build / test / deploy:**

- **ts-jest mock factory completeness** — `jest.mock(module, factory)` factory must export EVERY symbol the unit imports; omitted export = `undefined` → "X is not a function" (36th/P0-001 RC).
- **Nest DI module-import** — adding a controller dep or `@UseGuards` requires the `.module.ts` to import the exporting module; unit tests useValue-provide → false green; only runtime boot catches it (Day-29 RC).
- **Prettier pre-push gate** honors `.prettierignore` not `.gitignore` — gitignored spec.json + untracked sessions/\*.md trip it. Fix: `prettier --write` on target paths directly; never `--no-verify` (frame-port RC).
- **Stale-deploy diagnosis pattern** — before classifying ANY UI bug as P0/P1, confirm which commit the deploy is built from. Cloudflare Pages auto-deploys on `main` only; pending PRs are NOT in the bundle (32nd RC).

**Pattern family 5 — Institutional discipline:**

- **Institutional memory = VCS + off-device backup**, never agent process state (50th RC). "The next session will remember" = lost.
- **Metadata audit reveals artifact issues** — when the user questions metadata (stale tracking, odd counts), treat it as a trigger for focused artifact audit, not bookkeeping (Day-32 RC).
- **"LIVE" over-claim** — a ledger claiming "X LIVE/N rows" is NOT proof; verify wired via grep @Controller route + AppModule import + live curl (39th RC).
- **Bank the blocked window** — when blocked on an external gate, pre-produce the stable ~70% of a downstream deliverable, DRAFT-marked (45th RC).

### Cowork hang patterns + known workarounds

- **VM bundle nuke:** Cowork (Mac desktop app) occasionally hangs on "Connecting…" after sleep/wake. Fix: `rm -rf ~/Library/Application\ Support/Cowork/Bundle/` then relaunch. The bundle re-downloads (~30s).
- **File-bridge timeout:** Cowork's file-system bridge sometimes stops syncing after 2+ hours of continuous use. Symptoms: tool calls return stale file contents, edits silently fail. Fix: restart the Cowork app (not just the session). Save any in-flight work to clipboard first.
- **Session token expiry:** Cowork sessions expire after ~4 hours of inactivity. The session appears live but tool calls start failing with auth errors. Fix: start a new session; the old one's context is lost (reinforces 50th RC — don't rely on session state).

### Yogesh's workflow (how to work with the operator)

- Concise + concrete (file paths, line numbers, exact commands). Surface risks early. Cite sources (PM1_PRD §X). Decide-act-summarize, no think-out-loud. Run the validation gate after each task, report before moving on. EOD at 17:00 IST (5 sections). **Visual confirmation gate before commit** (Rule 13). **No merges to `apps/api/src/**` without Yogesh approval** (auth security-sensitive). **Never improvise tracking data — flag the gap.\*\* Merges are Yogesh-driven; MAIN prepares + recommends order.

### Known issues / watch-items (Thu Jun 18 evening — re-verify all)

- **DB — Path B in flight Thu eve.** `qa-nexus` Neon project capped (per-project 100 CU-hr). `qa-nexus-2` standing up via BE+1's Path B (clean-DB migration interleave fix that also serves the Jul-1 switchback). PR #285 (Supabase cross-vendor plan) **CLOSED** Thu PM per the 49th-RC ruling — recoverable from git history if needed; Path C qa-nexus-2 is the active strategy.
- **Render is LIVE on `04c73ea`+** (`/health/lite` 200 Thu 3:15 PM) — the earlier "Render stale" finding resolved between probes. The 41st-RC stale-deploy discipline still applies on every new laptop bring-up: confirm the running SHA, not the assumed one.
- **PRs in flight** — re-run `gh pr list --state open --base main`; the set drifts hourly during merge waves. Recommend BE-first then FE then docs; re-poll between code PRs for CHANGELOG cascade (40th RC).
- **RC ordinal reconciliation** — partially resolved Thu (49th/50th by Yogesh's ruling, 51st sequential). Full 1-N rebuild deferred Phase D — count `.claude/memory/feedback_*.md`, sort by file date, rebuild against the EOD ledger.
- **BE+1's 47th/48th RC memory files** still in BE+1's per-machine memory, **not on main** — back them up off-device per §4 or they're lost. Sat task: BE+1 PR them into the repo.
- **52nd-RC candidate** (Day-29 clean-DB migration interleave) — bank when BE+1's Path B PR lands.
- **Work-log backfill** (Days 9-31) parked on 6 schema acks; token in/out never captured (hook gap) — don't invent.
- **WIRE sweep ships Fri AM** (FE+1, 6-8 hr) — full FE wire-up of canned-data surfaces before E2E. The 73% canned-route inventory FE+1 produced is the work-list.

---

## §7 — Known gotchas + workarounds (one-liner quick-reference)

> These are the _actionable warnings_ from 51+ reality-checks. Each is a specific situation → specific fix. The thematic patterns behind them live in §6's RC distillation above. This section is the "when you hit THIS, do THIS" cheat sheet.

**Git + CI:**

1. **Chained-base squash cascade** — when you squash-merge a PR and a downstream PR shares its base, the downstream goes DIRTY. Fix: temp-branch + rebase + take-ours for upstream content + force-with-lease push. Never force-merge.
2. **Prettier pre-push gate scans gitignored files** — the pre-push hook honors `.prettierignore` not `.gitignore`. Gitignored `spec.json` + untracked `sessions/*.md` trip it. Fix: `prettier --write` on the specific paths; do NOT use `--no-verify`.
3. **git-mv-then-add footgun** — after `git mv`, the renamed file's changes need `git add` on the NEW path, not the old one.
4. **commitlint type-enum** — only the types in `.commitlintrc.yml` are allowed. `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `style`. No `build`, no `wip`.

**Infrastructure:** 5. **Neon Free per-project 100 CU-hr cap** — the cap is per-project, NOT per-account. A second project in the same org resets the counter to 0. Path C (qa-nexus-2) exploits this. 6. **Neon cron-gate** — any DB-touching cron or healthcheck on <5-min interval keeps Neon compute awake 24/7. Gate crons to pilot operating window (10 AM–10 PM IST, 7 days/week). `/health` must be memory-only. 7. **Render Free 15-min cold start** — first request after 15 min idle takes 30-60s. UptimeRobot 5-min keep-alive prevents this during the pilot window. Outside the window, cold starts are expected. 8. **Render Free blocks outbound SMTP** — since Sept 2025. Use Resend HTTP API (ADR-018), not nodemailer/Gmail SMTP. 9. **Better Stack syslog port** — use port 6514 (TLS), not 514 (plaintext). The token goes in the syslog structured-data, not a header. 10. **Cloudflare Pages auto-deploys on main only** — pending PRs are NOT in the deployed bundle. Stale-deploy triage: always confirm the deployed SHA first (41st RC, 5-for-5).

**Backend / NestJS:** 11. **ts-jest mock factory completeness** — `jest.mock(module, factory)` factory must re-export EVERY symbol the test file imports. Omitted export → `undefined` → "X is not a function" (looks like ESM/CJS interop but isn't). 12. **Nest DI module-import vs unit-mock false-green** — adding a controller dep or `@UseGuards` requires the `.module.ts` to `imports: [ExportingModule]`. Unit tests `useValue`-provide it → false green. Only runtime boot (or bogus-DB E2E) catches the missing import. 13. **Prisma two-URL pattern** — `DATABASE_URL` = pooler `:6543` (runtime queries); `DIRECT_URL` = direct `:5432` (migrations only). Mixing them up = silent connection pool exhaustion or migration timeouts. 14. **HMAC audit_log chain** — all state-changing operations must write to the chained audit table (PM1_ERD §3.13). The chain is immutable; a break in the chain = corrupted data. Seed-time secret drift causes a benign row-25 break (documented exception). 15. **BetterAuth session cookies** — cross-site (different registrable domains) needs `SameSite=None` + `Secure` + `Partitioned` + host-only (no `Domain`). The P0-001 root cause was exactly this. `resolveCookieConfig` topology fix in #256.

**Frontend / Next.js:** 16. **Pattern A canned fallback** — FE renders fixtures when API calls fail. A page that "looks fine" may not be hitting the API at all. DevTools Network tab is the only proof of real data. 17. **getApiBaseURL()** — defaults to `localhost:3001` when `NEXT_PUBLIC_API_BASE_URL` is missing from Cloudflare Pages BUILD env. This is the 46th RC root cause. Verify the env var is set in Pages Settings → Environment Variables → Production. 18. **AdminShell canonical reference** — F19's React implementation is canonical for shell internals (Day-17 amendment), NOT the v2 HTML. Lucide-react icons retained over HTML's custom SVGs.

**Data / testing:** 19. **Pilot team names** — always the 8 real Iksula users (Akshay, Yogesh, Kishor, Nitin, Nadim, Govind, Mohanraj, Sagar). Never "Priya Tiwari" or "Ravi Sharma" (fictional). Canned data in React ports must trace back to canonical v2 HTML verbatim. 20. **ID patterns** — Jira `RET-###`, uploaded reqs `REQ-###`, test cases `TC-RET-###`, defects `DEF-###`, imports `#242`. Anything else = invented data violation (Rule 17). 21. **P0-001 identity regression** — fresh incognito sign-in MUST show "Yogesh M. · ADMIN" in the user pill. Wrong identity (e.g., "Kishor K.") = P0 STOP + escalate. Cross-layer root cause: cookie infra + persona embed + customSession app-fields.

**Cost / billing:** 22. **Indian RBI e-Mandate** — auto-billing may fail for Indian cards on recurring > ₹5,000 (RBI two-factor mandate). Manual billing (invoice → one-time payment) is the fallback if PM1 ever moves to paid.

---

## §8 — Work-list (Fri-Sat-Sun)

### Fri Jun 19 (today)

- [x] **12:00** — Ground-truth check: main HEAD `9059a39` (advanced from `ed18027` after 3 stale-PR merges)
- [x] **12:00** — Stale PR triage: #279, #281, #282 squash-merged (all docs-only, historical record)
- [x] **12:00-2:00** — Handoff §4 expanded + §6 expanded + §7 added (22 gotchas)
- [x] **1:00-2:00** — 53rd RC banked (`feedback_migrate_status_vs_schema_drift.md`) + dashboard §12.6 written
- [x] **2:00-3:00** — Phase D verdict skeleton created (`docs/audits/2026-06-19-fri-main-prd-conformance-final.md`)
- [x] **3:30-4:00** — PRs #288 + #289 merged to main → `d0ba367`. Render auto-deployed, verified. Dashboard §12.7 written. DB + Render gates CLEARED.
- [x] **4:00** — Handoff §1 snapshot advanced to `d0ba367`; §8 work-list updated; version bumped to v3
- [ ] **4:00-7:00** — Monitor FE+1 WIRE sweep #291 expansion + BE+1 handoff #290; aggregate
- [ ] **7:00-8:00** — Pre-Sat-E2E state aggregation: full merged state, Render+Pages SHAs, all systems green
- [ ] **8:00-9:30** — Handoff final polish (cross-link #288/#289/#290/#291) + Phase D skeleton Sat-ready
- [ ] **9:30** — Fri EOD report

**Option C (Yogesh, ~3:30 PM IST):** E2E pushed to Sat AM. Tonight = ship everything + handoff polish. Sat AM = clean full 3-workflow E2E.

### Sat Jun 20

- [ ] **9:00-1:00** — Yogesh E2E orchestration: 3 full workflows (W1 sign-in→project; W2 defect→Sherlock; W3 invite→set-password). MAIN aggregates real-time.
- [ ] **1:00-2:00** — Yogesh lunch
- [ ] **2:00-5:00** — Aggregate P0 fixes from morning E2E + Phase D verdict fill with real data + handoff polish (§6-§7 with E2E findings)
- [ ] **5:00-7:00** — Final close-out: verify all branches pushed, Yogesh signs off Phase D
- [ ] Off-device backup procedure REHEARSED
- [ ] Jul 1 qa-nexus switchback checklist drafted

### Sun Jun 21 — transition day

- [ ] Final `gh pr list --state open --base main` → 0 open PRs that matter, or each named with a disposition
- [ ] All chat-history files committed (or off-device-backed)
- [ ] Off-device backup VERIFIED on a second medium (USB + iCloud, not just one)
- [ ] All credentials accessible on the new laptop (all on `yogeshmohite-iksula` identity: GitHub, Neon, Render, Cloudflare, Resend, Groq, UptimeRobot, Better Stack, Grafana Cloud)
- [ ] This handoff doc linked from `CLAUDE.md` (one-line pointer at the top — the new agent reads CLAUDE.md automatically)
- [ ] `docs/eod-reports/2026-06-21-sun-laptop-handoff-sign-off.md` written (final EOD)
- [ ] Confirm post-transition email + GitHub account continuity (yogeshmohite-iksula survives; yogeshcodeshare is personal + unaffected)

_v3 authored Fri 2026-06-19 ~4:00 PM IST by MAIN. Changes from v2: §1 snapshot advanced to `d0ba367` (#288+#289 merged, Render verified, DB gate CLEARED); RC ledger updated to 53; conformance verdict updated (BE ✅, DB ✅, FE 🟡 WIRE in-flight); §8 work-list updated with Fri PM completions + Option C reframe (E2E→Sat AM). Prior v2 changes preserved: §4 backup paths, §6 RC distillation, §7 gotchas. Re-verify all §1 state before acting on it._
