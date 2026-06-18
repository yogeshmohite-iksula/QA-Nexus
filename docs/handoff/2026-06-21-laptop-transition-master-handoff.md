# 🔴 MASTER HANDOFF — Laptop / Account Transition (target Sun 2026-06-21)

> **Author:** MAIN · **Started:** Thu 2026-06-18 ~3 PM IST · **Finish by:** Fri 2026-06-20 EOD · **Status:** v1 comprehensive (sections marked `⟦TODO-FRI⟧` finish Fri after the deep test + final PR dispositions).
> **Why this doc exists (49th RC):** when a team member rotates off a laptop/account/email, **institutional memory must live in version control + off-device backup — never only in agent process state.** Nothing in any Claude Code / Cowork _session_ survives the transition. This doc + the repo + the off-device backups ARE the surviving brain. If you are a fresh Claude on a new laptop reading this: **start here.**
> **Verify-before-assert:** every state claim below was confirmed against `origin/main` + live curl on Thu 2026-06-18 ~3 PM IST. Re-verify before acting — deploys drift (see §1 stale-Render finding).

---

## §1 — Project state snapshot (Thu 2026-06-18 ~15:00 IST, verified)

### Repo / git

- **main HEAD = `ed18027`** (`docs(eod): post day-32 fri fe shakedown-sweep eod report (#280)`). ⟦Re-verified Thu 2026-06-18 ~3:15 PM IST — main advanced past `04c73ea`/#284 since the first §1 write earlier this turn. Re-fetch before acting; this snapshot drifts hourly during active merge waves.⟧
- **Open PRs against main** (snapshot Thu 2026-06-18 ~3:15 PM IST — re-run `gh pr list --state open --base main` for current truth):
  | PR | Title | Type | Disposition |
  | --- | --- | --- | --- |
  | #278 | sweep B — invite modal starts empty | FE code | review + merge |
  | #279 | 46th RC — deployed-bundle baseURL + dashboard §9/§10 | docs/memory | merge |
  | #280 | Day-32 Fri FE shakedown-sweep EOD | FE docs | merge |
  | #281 | Day-32 Fri BE EOD | BE docs | merge |
  | #282 | Fri evening EOD (12-PR batch) | docs | merge |
  | #283 | Sweep C — F27 pending-invites consume | FE code | review + merge |
  | #285 | Supabase hot-standby setup guide | docs | merge (BE+1 executes) |

### Live deploys (the critical truth — merged ≠ deployed)

- **Render API** (`qa-nexus-api.onrender.com`): `/health` → 200; **`/health/lite` → 200 (✅ #284 IS deployed)** — re-verified Thu ~3:15 PM IST. The earlier "stale Render" finding in this §1 was true at first probe and resolved between the two probes (Render redeployed automatically once #284 landed). **The 41st-RC stale-deploy pattern still applies on every laptop bring-up** — always confirm the deployed SHA against `gh pr view` for the most recent code PR before believing the running instance is current.
- **Cloudflare Pages FE** (`qa-nexus-web.pages.dev`): last known good = `cb1ed3a` (#277, the 46th-RC prod-baseURL fix; FE+1 live-probed `apiHosts:[onrender.com]`, `callsLocalhost:false`). ⟦TODO-FRI: re-confirm Pages bundle SHA on the new laptop⟧
- **Neon Postgres DB — Path C ACTIVE (Yogesh-approved Thu 2026-06-18 ~3 PM IST):** the original `qa-nexus` project is suspended on its per-project 100-CU-hr cap. **Tonight onward = `qa-nexus-2`, a 2nd Neon project in the same org** (cheap same-vendor failover — Neon Free allows ~100 projects/org, each with its own 100 CU-hr/mo cap; the cap is per-project, not per-account). **Plan:** create `qa-nexus-2` in AWS Singapore → replay migrations + seed Iksula canon (5/30/63/5/25/~158) → flip Render `DATABASE_URL`+`DIRECT_URL` to the new project's URIs → ~1 hr, $0. **Jul 1 switch-back:** `qa-nexus` auto-resumes Jul 1 → flip Render back → `qa-nexus-2` stays as a warm same-vendor hot-standby (keep it pinged so it doesn't idle-pause). **PR #285 (Supabase hot-standby plan) is NOT obsolete** — it remains as the cross-vendor fallback if Path C ever hits the same-vendor cap; reframed as plan B. **49th-RC lesson** (`feedback_verify_constraint_scope_before_expensive_workaround.md`): I had recommended Supabase 3-4 hr migration; Yogesh's "why Supabase?" prompted re-reading Neon docs → discovered the cap was per-project, not per-account. **Same-vendor multi-project beats cross-vendor migration** when the constraint scope is narrower than assumed.

### Conformance verdict (dashboard §10.3, as of Fri night)

- **BE 🟢 GREEN** (anon battery live; cron-gate + /health/lite **deployed live** via #284 — Render confirmed `/health/lite` 200 Thu 3:15 PM). **FE 🟢 structural / 🟡 visible-pending-DB** (#277 URL fix live, wires correct; full WIRE sweep ships Fri AM). **DB 🟡 PATH B IN-FLIGHT THU EVE** (qa-nexus-2 standing up; BE+1 closing Day-29 clean-DB migration interleave gap — also reused for Jul-1 switchback). **Sun deep test = 🟡 AMBER → flips to 🟢 GREEN if Fri WIRE sweep + Fri PM E2E pass.**
- **E2E reframed Thu evening:** moved from tonight (4:30-7:30) → Fri PM, **after** FE+1's WIRE sweep ships Fri AM. Yogesh's call (Path B over Path A): test against the actual pilot-ready state, not a half-wired state. Sat-Sun buffer preserved for fixes + handoff polish. **Revised pilot-ready ETA: Fri ~8 PM.**

### Reality-check ledger

- **~51 RCs** accumulated (full 1-N reconciliation deferred Phase D). Source of truth = the `feedback_*.md` files in `.claude/memory/` (**28 files on this branch, travels with git**) + the per-day EOD/triage docs. **Do NOT trust any single ordinal count** until the Phase-D reconciliation runs (count files, rebuild 1-N from source). Latest banked:
  - **46th** — `feedback_deployed_bundle_baseurl_verification.md` (PR #279 — Pages bundle prod-baseURL gate).
  - **47th/48th** — BE+1's cron-gate + verify-before-ship (in BE+1's per-machine memory, **not yet on main** — back them up off-device or they're lost).
  - **49th (canonical, Yogesh ruling Thu Jun 18 PM)** — `feedback_verify_constraint_scope_before_expensive_workaround.md` — verify constraint EXACT scope before recommending an expensive workaround. Case = Supabase 3-4 hr plan → Yogesh's "why Supabase?" → Neon cap is per-project → Path C = qa-nexus-2 ($0, ~1 hr). PR #285 (Supabase plan) **closed** Thu evening; reframed as cross-vendor fallback recoverable from git history.
  - **50th** — `feedback_institutional_memory_survives_in_vcs.md` — institutional memory survives in VCS + off-device backup, never in agent process state. This doc IS the artifact.
  - **51st (banked by BE+1 Thu Jun 18 evening, pre-E2E)** — `feedback_env_no_stale_no_duplicates_before_migration.md` — before any same-vendor env migration, audit `.env` for stale references **AND** duplicate keys. Caught stale OLD `qa-nexus` `DATABASE_URL` + duplicate `DIRECT_URL` BEFORE running `prisma migrate deploy` against `qa-nexus-2` (caught-not-shipped).
  - **52nd (candidate, surfacing Thu evening via Path B)** — Day-29 "clean-DB migration interleave" gap (cron + migration ordering at qa-nexus-2 switchover; also needed for Jul-1 switchback). Banked when BE+1's Path B PR lands.

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
# off-device target = an external drive or a private cloud folder you control
BK=~/qa-nexus-transition-backup-2026-06-21
mkdir -p "$BK"
cp -R ~/.claude/projects/-Users-yogeshmohite-AI-Tester-Project-Project10-QA-Nexus/memory "$BK/user-auto-memory"
cp -R "$HOME/Claude Cowork Workspace " "$BK/cowork-workspace"   # note trailing space in folder name
cp -R ~/AI_Tester_Project/Project10-QA_Nexus/chat-history "$BK/chat-history" 2>/dev/null || true
# verify counts match this doc's §1 before trusting the backup
ls "$BK/user-auto-memory" | wc -l   # expect ~26
```

**Do NOT rely on the repo clone for these three — they are local-only by design.** This is the entire reason the 49th RC exists.

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

## §7 — ⟦TODO-FRI⟧ (finish before Sun)

### Fri Jun 19

- [ ] **AM** — FE+1 ships WIRE sweep (~6-8 hr, ~73% canned-routes → live) → Pages redeploy → 46th-RC network-tab verify per surface
- [ ] **AM** — BE+1 fills `docs/handoff/be-handoff-for-new-laptop.md` on the existing `docs/be-laptop-transition-handoff` branch + PRs it
- [ ] **AM** — FE+1 creates `docs/handoff/fe-handoff-for-new-laptop.md` on a new branch + PRs it
- [ ] **Mid-day** — MAIN aggregates BE+1 + FE+1 progress; updates dashboard §11 as wires complete
- [ ] **Mid-day** — 52nd RC banked (Day-29 clean-DB migration interleave) once Path B PR lands
- [ ] **PM (5-7)** — Yogesh E2E + MAIN Phase-2 orchestration aggregation (BE+1 log tail + FE+1 console + P0/P1/P2 log)
- [ ] **Eve (7-9)** — MAIN writes `docs/audits/2026-06-19-fri-main-prd-conformance-final.md` (Phase D verdict — pilot-ready YES/CONDITIONAL/NO)
- [ ] **Eve** — MAIN polishes handoff §4-§7

### Sat Jun 20

- [ ] Buffer for Fri E2E fix-ups (whatever P0/P1 surfaces)
- [ ] Master handoff §7 known-gotchas distilled from all 51+ RCs (actionable warnings, not lessons — what each rule prevents)
- [ ] BE+1's 47th/48th RC memory files PR'd into `.claude/memory/` (currently per-machine only)
- [ ] Off-device backup procedure rehearsed (run §4's backup-procedure block once against actual data → verify counts → keep the backup)

### Sun Jun 21 — transition day

- [ ] Final `gh pr list --state open --base main` → 0 open PRs that matter, or each named with a disposition
- [ ] All chat-history files committed (or off-device-backed)
- [ ] Off-device backup VERIFIED on a second medium (USB + iCloud, not just one)
- [ ] All credentials accessible on the new laptop (all on `yogeshmohite-iksula` identity)
- [ ] This handoff doc linked from `CLAUDE.md` (one-line pointer at the top — the new agent reads CLAUDE.md automatically)
- [ ] `docs/eod-reports/2026-06-21-sun-laptop-handoff-sign-off.md` written (final EOD)
- [ ] Confirm post-transition email + GitHub account continuity (which account survives the corporate email change)

_v1 authored Thu 2026-06-18 by MAIN while the context was still in-session — deliberately comprehensive rather than a thin skeleton, because the 49th RC's whole point is that this doc, not any session, is what survives Sun. Re-verify all §1 state before acting on it._
