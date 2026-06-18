# 🔴 MASTER HANDOFF — Laptop / Account Transition (target Sun 2026-06-21)

> **Author:** MAIN · **Started:** Thu 2026-06-18 ~3 PM IST · **Finish by:** Fri 2026-06-20 EOD · **Status:** v1 comprehensive (sections marked `⟦TODO-FRI⟧` finish Fri after the deep test + final PR dispositions).
> **Why this doc exists (49th RC):** when a team member rotates off a laptop/account/email, **institutional memory must live in version control + off-device backup — never only in agent process state.** Nothing in any Claude Code / Cowork _session_ survives the transition. This doc + the repo + the off-device backups ARE the surviving brain. If you are a fresh Claude on a new laptop reading this: **start here.**
> **Verify-before-assert:** every state claim below was confirmed against `origin/main` + live curl on Thu 2026-06-18 ~3 PM IST. Re-verify before acting — deploys drift (see §1 stale-Render finding).

---

## §1 — Project state snapshot (Thu 2026-06-18 ~15:00 IST, verified)

### Repo / git

- **main HEAD = `04c73ea`** (`fix(cron): gate report-aggregate crons to pilot window + /health/lite (#284)`).
- **7 PRs OPEN against main** (none merged in the 6-day gap since #284):
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

- **Render API** (`qa-nexus-api.onrender.com`): `/health` → **200, `version: 0.0.1`**; **`/health/lite` → 404**. ⇒ **#284 is merged to main but NOT deployed.** The running instance predates #284 (stale). **ACTION: trigger a Render redeploy of `04c73ea`** (Render dashboard → Manual Deploy → deploy latest commit; confirm `/health/lite` → 200 after). This is the **41st RC stale-deploy pattern, 5th instance** — always confirm the deployed SHA, never assume merge = live.
- **Cloudflare Pages FE** (`qa-nexus-web.pages.dev`): last known good = `cb1ed3a` (#277, the 46th-RC prod-baseURL fix; FE+1 live-probed `apiHosts:[onrender.com]`, `callsLocalhost:false`). ⟦TODO-FRI: re-confirm Pages bundle SHA on the new laptop⟧
- **Neon Postgres DB: SUSPENDED** (quota-cap autosuspend). Manual mid-month resume unlikely; **Jul 1 auto-reset** OR **Supabase hot-standby failover** (plan: `docs/plans/supabase-hot-standby-setup.md`, PR #285). **This is the single remaining gate on the Yogesh deep test** (dashboard §10.3). While suspended, FE renders Pattern A canned fallback (wires are correct; DB is down).

### Conformance verdict (dashboard §10.3, as of Fri night)

- **BE 🟢 GREEN** (anon battery live; cron-gate + /health/lite structurally closed via #284). **FE 🟢 structural / 🟡 visible-pending-DB** (#277 URL fix live, wires correct). **DB 🔴 SUSPENDED.** **Sun deep test = 🟡 AMBER — single gate = DB.**

### Reality-check ledger

- **~48-49 RCs** accumulated (ordinal reconciliation still PENDING — see §6 known-issues). Source of truth = the `feedback_*.md` files in `.claude/memory/` (**25 files, travels with git**) + the per-day EOD/triage docs. **Do NOT trust any single ordinal count** until the Phase-D reconciliation runs (count files, rebuild 1-N from source). Latest in flight: 46th (deployed-bundle baseURL), 47th/48th (BE+1's cron-gate + verify-before-ship — banked in BE+1's per-machine memory, **not yet on main**), 49th (this doc's rule).

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

## §3 — Re-establishing the BE+1 / FE+1 / MAIN personas

The 3-agent orchestration is a **workflow convention, not code** — it lives in the briefs + CLAUDE.md, so it reconstitutes from version control:

- **MAIN (orchestrator):** root worktree. Role: coordination, merge-wave execution, ADR ratification, memory/doc filing, cross-domain conflict surfacing (Rule 11 — surface, don't resolve), EOD reports, the conformance dashboard. Reads `CLAUDE.md` + `.claude/memory/MEMORY.md` + the latest `docs/audits/*conformance*` + `docs/triage/*` on start.
- **BE+1 (backend):** `-backend` worktree, scoped to `apps/api`. Reads `.claude/rules/` + `docs/audits/*be*` + PM1_ERD.
- **FE+1 (frontend):** `-frontend` worktree, scoped to `apps/web`. Reads `.claude/rules/frontend.md` + the `frame-port` skill + PM1_UI_v2 v2 frames.
- **Bootstrapping a persona:** open a Claude session in that worktree, point it at `CLAUDE.md` (auto-loads) + the role's audit docs. The `load-binding-context` hook prepends the binding spec to every prompt. **The personas are defined by which docs they read + which paths they own — re-establish by re-pointing, not by re-explaining.**

---

## §4 — Memory restoration (the 49th-RC critical path)

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

### Known issues / watch-items

- **Render stale** (#284 merged, not deployed — §1). Redeploy + confirm `/health/lite`.
- **Neon SUSPENDED** — the deep-test gate; Supabase failover ready (#285).
- **7 open PRs** to disposition (§1) — recommend BE-first then FE then docs; re-poll between code PRs for CHANGELOG cascade (40th RC).
- **RC ordinal reconciliation** pending — count `.claude/memory/feedback_*.md`, rebuild 1-N from source (the "17th"-vs-actual drift is documented in `feedback_metadata_audit_reveals_artifact_issues.md`).
- **BE+1's 47th/48th RC memory files** are in BE+1's per-machine memory, **not on main** — back them up (§4) or they're lost.
- **Work-log backfill** (Days 9-31) parked on 6 schema acks; token in/out never captured (hook gap) — don't invent.

---

## §7 — ⟦TODO-FRI⟧ (finish before Sun)

- [ ] Re-confirm Pages bundle SHA + Render redeploy done (`/health/lite` 200).
- [ ] Final disposition of the 7 open PRs (merged / closed).
- [ ] DB resolution: Neon resumed OR Supabase failover executed (#285).
- [ ] Deep-test results + P0/P1/P2 log (§ test-prep doc).
- [ ] Off-device backup VERIFIED (counts match §4).
- [ ] RC ordinal reconciliation (rebuild the ledger 1-N).
- [ ] Confirm post-transition email + GitHub account continuity.

_v1 authored Thu 2026-06-18 by MAIN while the context was still in-session — deliberately comprehensive rather than a thin skeleton, because the 49th RC's whole point is that this doc, not any session, is what survives Sun. Re-verify all §1 state before acting on it._
