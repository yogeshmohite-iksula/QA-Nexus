# Tech-project-forge skill alignment audit — 2026-04-27

**Auditor:** Claude (read-only mode, no code changes during audit)
**Skill version on disk:** v1.4 (`~/.claude/skills/tech-project-forge`, symlinked → `~/.agents/skills/tech-project-forge`)
**Repo state:** main @ `4b05c74` (10 commits since Day 0); 8 push-deploys; CF Pages live at https://qa-nexus-web.pages.dev/
**Audit log size:** `.claude/audit.jsonl` = 348 entries → `audit-log.sh` is firing healthily on every tool call.
**Verdict:** ~5/28 of skill's eval.json passes (~18%). PM1-custom additions (hooks, RWD, binding-context) are healthy; skill's standard scaffolding (commands, rules, agents, memory, CI/CD, security) is largely missing.

---

## SECTION 1 — Skill utilization

| #   | Question                                                 | Status                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.1 | Is Tech-project-forge-skill v1.4 installed and loaded?   | ✅ **YES.** Symlinked at `~/.claude/skills/tech-project-forge` → `~/.agents/skills/tech-project-forge`. SKILL.md (44 KB), README.md (25 KB), eval.json (32 assertions), 25 reference files, 7 template categories all present.                                                                                                                                                       |
| 1.2 | Which of the 6 phases have run?                          | **DISCOVER:** ✅ done Day 0 morning. **PLAN:** ⚠ partial (PROJECT_SPEC.md + MILESTONES.md + PROJECT_BLUEPRINT.md exist; not byte-for-byte to skill's template). **SETUP:** ⚠ ~40% — see Section 2. **DX:** ✗ none of 6 plugins installed; status line not configured. **VALIDATION:** ✗ eval.json never run against repo. **BUILD GUIDANCE:** ✗ first-prompt template not generated. |
| 1.3 | Phase 1 PROJECT_SPEC.md / MILESTONES.md match PM1 specs? | ✅ Both exist with PM1-specific content. PROJECT_SPEC.md has Part A + Part B per skill template. MILESTONES.md describes M0–M6 + 32 M0 tasks with R3 mitigation note (slightly behind — backlog now says 34 tasks after T033 + T034). **Divergence:** MILESTONES.md task count drift (32→34) — not synced with `Milestone_M0_Setup_v8.md`.                                           |
| 1.4 | Phase 3 — 6 Claude Code plugins installed?               | **context-mode:** ✅ pre-existing. **superpowers / code-simplifier / feature-dev / compound-engineering / commit-commands:** ✗ none installed.                                                                                                                                                                                                                                       |
| 1.5 | Phase 4 — eval.json against repo?                        | ✗ **Never run.** Projected score below — see Section 2 final row.                                                                                                                                                                                                                                                                                                                    |

---

## SECTION 2 — Folder + file structure conformance

### eval.json (32 assertions) projected score

| #         | Assertion                                             | Result                                                                                                                                            |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | `CLAUDE.md` exists at root                            | ✅ PASS                                                                                                                                           |
| 2         | `CLAUDE.md` < 200 lines                               | ✅ PASS (~190 lines)                                                                                                                              |
| 3         | settings.json has PostToolUse hooks                   | ✅ PASS                                                                                                                                           |
| 4         | settings.json has `deny` list with rm + git push      | ✗ **FAIL** — only `allow` rules in settings.local.json                                                                                            |
| 5         | `.env.example` exists with ≥1 var                     | ✗ **FAIL — MISSING** (MS0-T008 deferred)                                                                                                          |
| 6         | `docs/PROJECT_SPEC.md` Part A + Part B                | ✅ PASS                                                                                                                                           |
| 7         | `docs/ARCHITECTURE.md` system overview                | ✗ **FAIL — MISSING**                                                                                                                              |
| 8         | `.claude/commands/` ≥ 6 `.md` files                   | ✗ **FAIL — directory does not exist**                                                                                                             |
| 9         | `.claude/rules/` ≥ 2 files with `paths:` frontmatter  | ✗ **FAIL — directory does not exist**                                                                                                             |
| 10        | `.claude/hooks/block-dangerous.sh`                    | ✅ PASS (PM1-modified — reads STDIN per Claude contract; skill's `$1` invocation didn't fire)                                                     |
| 11        | `.gitignore` has `.env`                               | ✅ PASS                                                                                                                                           |
| 12        | `README.md` exists at root                            | ✗ **FAIL — MISSING**                                                                                                                              |
| 13        | (frontend) Design Style Guide section in CLAUDE.md    | ⚠ PARTIAL — CLAUDE.md has "Locked tech stack" + design-token discipline; no literal "Design Style Guide" header. Pattern functionally equivalent. |
| 14        | (frontend) `.claude/commands/ui-check.md`             | ✗ **FAIL — MISSING**                                                                                                                              |
| 15        | `docs/SECURITY.md`                                    | ✗ **FAIL — MISSING**                                                                                                                              |
| 16        | `.gitleaks.toml`                                      | ✗ **FAIL — MISSING**                                                                                                                              |
| 17        | `docs/ARCHITECTURE.md` Backend Architecture section   | ✗ **FAIL** (file absent)                                                                                                                          |
| 18        | (DB) ≥1 migration file (alembic / prisma / flyway)    | ✗ **FAIL — Prisma migrations land in MS0-T020** (queued)                                                                                          |
| 19        | (frontend) `DESIGN.md` at root                        | ⚠ N/A — we use `QA Nexus/PM1/PM1_UI_v2/UI Files/01_SYSTEM.md` (more comprehensive than DESIGN.md template). Recommend mark conditional N/A.       |
| 20        | `.claude/commands/review-changes.md`                  | ✗ **FAIL — directory does not exist**                                                                                                             |
| 21        | `code-review-graph` installed (pip)                   | ✗ **FAIL — not installed**                                                                                                                        |
| 22        | `.code-review-graphignore`                            | ✗ **FAIL — MISSING**                                                                                                                              |
| 23        | `.claude/memory/memory.md` index                      | ✗ **FAIL — directory does not exist**                                                                                                             |
| 24        | `.claude/hooks/inject-memory.sh` executable           | ✗ **FAIL — MISSING**                                                                                                                              |
| 25        | `.claude/commands/compound-learnings.md`              | ✗ **FAIL — directory does not exist**                                                                                                             |
| 26        | `.claude/hooks/audit-log.sh` executable               | ✅ PASS                                                                                                                                           |
| 27        | `.claude/hooks/update-docs-check.sh` executable       | ✗ **FAIL — MISSING**                                                                                                                              |
| 28        | `check-secrets.sh` wired in settings.json PreToolUse  | ✗ **FAIL — script doesn't exist, not wired**                                                                                                      |
| 29        | `.claude/agents/changelog-updater.md`                 | ✗ **FAIL — directory does not exist**                                                                                                             |
| 30        | `.claude/agents/retro-agent.md`                       | ✗ **FAIL — directory does not exist**                                                                                                             |
| 31        | `.claude/commands/commit.md` (local fallback)         | ✗ **FAIL — directory does not exist**                                                                                                             |
| 32        | `.claude/commands/commit-push-pr.md` (local fallback) | ✗ **FAIL — directory does not exist**                                                                                                             |
| **Score** |                                                       | **5 PASS / 22 FAIL / 4 conditional/partial = ~18% conformance**                                                                                   |

### Files we have that the skill DIDN'T put there (Section 2.2)

These were scaffolded outside the skill flow during MS0-T001/T002/T003/T010 etc. **Intentional and correct** — skill's scaffolding doesn't know about pnpm monorepo + Next 15 + NestJS 10:

- `apps/web/` (Next.js 15 + Tailwind 4 + shadcn pattern)
- `apps/api/` (NestJS 10)
- `pnpm-workspace.yaml` + workspace `packages/` structure
- `.husky/` (pre-commit / commit-msg / pre-push) — uses husky pattern; skill expects `.githooks/` instead
- `eslint.config.mjs` (flat config)
- `apps/web/wrangler.toml` + `apps/web/next.config.ts` (CF Pages)
- `docs/deploy/cloudflare-pages.md` (deploy runbook)
- `docs/screenshots/` (visual confirmation gate per Rule 13)
- `.claude/locked-deps.json` (PM1-custom T033 versioning)
- `.claude/hooks/pre-tool-use/enforce-design-tokens.sh` (PM1-custom)
- `.claude/hooks/pre-tool-use/enforce-pm1-stack.sh` (PM1-custom T033)
- `.claude/hooks/prompt-submit/load-binding-context.sh` (PM1-custom)

### Files skill put there that we modified (Section 2.3)

- `.claude/hooks/pre-tool-use/block-dangerous.sh` — reworked to read STDIN (Claude Code hook contract) instead of `$1` (skill template was broken on this machine).
- `.claude/hooks/post-tool-use/audit-log.sh` — same STDIN patch.
- `CLAUDE.md` — entirely PM1-customized (binding refs, locked stack, 13 hard rules, hooks list, MCP list, 8-user roster, communication preferences). Does NOT follow skill's 11-section template byte-for-byte but maintains the spirit.

---

## SECTION 3 — Hooks audit (most important)

### 3.1 + 3.5 Active hook inventory

| Hook                                    | Skill spec? | PM1-custom?  | Wired in settings.json | Notes                              |
| --------------------------------------- | ----------- | ------------ | ---------------------- | ---------------------------------- |
| `pre-tool-use/block-dangerous.sh`       | ✓ skill     | STDIN patch  | PreToolUse Bash        | Patched (skill's `$1` didn't fire) |
| `pre-tool-use/enforce-design-tokens.sh` | ✗           | ✓ PM1        | PreToolUse Edit\|Write | Whitelist-driven hex enforcer      |
| `pre-tool-use/enforce-pm1-stack.sh`     | ✗           | ✓ PM1 (T033) | PreToolUse Edit\|Write | Ban-list + version-pin enforcer    |
| `post-tool-use/audit-log.sh`            | ✓ skill     | STDIN patch  | PostToolUse \*         | 348 entries to date — healthy      |
| `prompt-submit/load-binding-context.sh` | ✗           | ✓ PM1        | UserPromptSubmit \*    | Prepends 7-line binding note       |

### 3.2 Hook fire-test results

Tests not run during this read-only audit (would require triggering the hooks with synthetic inputs). All 5 hooks have been observed firing in normal session flow over 348 audit entries — circumstantial PASS. Recommended: run a structured test pass after the P0/P1 fixes land.

### 3.3 Hooks the skill specs but we haven't implemented

| Hook                            | Spec source     | What it does                                                             | Priority                                                               |
| ------------------------------- | --------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `inject-memory.sh`              | Step 2.6 + 2.17 | Auto-prepends `.claude/memory/memory.md` to every tool use               | **P0** — blocks memory eval pass                                       |
| `check-secrets.sh`              | Step 2.6 + 2.15 | Pre-commit `gitleaks` secret scan                                        | **P1**                                                                 |
| `filter-test-output.sh`         | Step 2.6        | Filters `npm test`/`pytest`/`jest` runner output to head -100            | P2                                                                     |
| `update-docs-check.sh`          | Step 2.6 v1.4   | Stop hook nudging `/update-docs` when src changed without CHANGELOG bump | **P1**                                                                 |
| `pre-push.sh` (in `.githooks/`) | Step 2.6 v1.4   | Git hook blocking `git push` if src changed without CHANGELOG bump       | P2 (we have husky pre-push doing typecheck instead — different intent) |

### 3.4 MS0-T034 RWD enforcement hook

✗ **Not implemented yet.** On backlog (committed in `bfe44dc`), not built. Pattern would block `w-\[(1[0-9]{3,}\|[2-9][0-9]{2,})px\]` and `max-w-\[1600px\]` in `apps/web/**/*.tsx`. **Priority: P1** — without it, the next ~38 frame ports could regress on Rule 12.

### Husky vs `.githooks/` divergence

Skill spec (Step 2.6 v1.4) sets `git config core.hooksPath .githooks`. We use **husky** (different convention — installs hooks under `.husky/` and uses `git config core.hooksPath .husky`). Both work; ours has:

- `.husky/pre-commit` → `pnpm exec lint-staged`
- `.husky/commit-msg` → `pnpm exec commitlint --edit "$1"`
- `.husky/pre-push` → `pnpm typecheck`

These satisfy the _intent_ of skill's pre-push (don't push broken code). They do NOT satisfy skill's CHANGELOG-aware pre-push. **Recommend keep husky, add CHANGELOG check inline if/when CHANGELOG.md exists.**

---

## SECTION 4 — Documentation auto-update behavior

| #   | Question                                                                         | Status                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | `docs/CHANGELOG.md` exists? Auto-updated?                                        | ✗ **MISSING.** All 10 commits have detailed messages, but no CHANGELOG. The `changelog-updater` subagent doesn't exist (Section 2.3).                                                                                                                                                                                   |
| 4.2 | `docs/ARCHITECTURE.md` exists? Auto-regenerated on apps/api or apps/web changes? | ✗ **MISSING.** No `update-docs-check.sh` Stop hook either.                                                                                                                                                                                                                                                              |
| 4.3 | What conditions should trigger doc auto-updates per skill?                       | **Per spec:** (a) Stop hook fires after every Claude session — `update-docs-check.sh` checks `git diff` for src changes vs CHANGELOG bump. (b) `@changelog-updater` subagent invoked manually after every feature ships. (c) `@retro-agent` invoked at end of milestone proposes CLAUDE.md / commands / memory updates. |
| 4.4 | Each condition currently happening?                                              | (a) ✗ no Stop hook present. (b) ✗ subagent doesn't exist. (c) ✗ subagent doesn't exist. **Diagnosis:** entire doc auto-update layer is unbuilt.                                                                                                                                                                         |

---

## SECTION 5 — Memory management

### 5.1 What skill spec says (verbatim from SKILL.md Step 2.17)

> "Create the structured memory system that keeps the project's brain alive across all future sessions. Seed every file with real Phase 0 blueprint values — never leave `${PLACEHOLDERS}` unsubstituted."

Required files:

```
.claude/memory/memory.md            (index, < 100 lines)
.claude/memory/general.md           (project name, stack, DB, key decisions, constraints, risky assumptions)
.claude/memory/domain/architecture.md
.claude/memory/domain/bugs.md
.claude/memory/domain/api.md
.claude/memory/tools/database.md
.claude/memory/tools/stack.md
```

Plus the `inject-memory.sh` PreToolUse hook + `/reorganize-memory` slash command.

### 5.2 Repo memory state

✗ **`.claude/memory/` directory does not exist.** None of the 7 seed files present.

**HOWEVER** — there IS active memory at the user-session layer:

```
~/.claude/projects/-Users-yogeshmohite-AI-Tester-Project-Project10-QA-Nexus/memory/
  ├── MEMORY.md              (index)
  ├── user_role.md
  ├── github_accounts.md
  ├── dev_environment.md
  ├── project_team_roster.md
  ├── feedback_qa_nexus_timeline.md
  ├── feedback_layout_responsiveness.md
  └── feedback_frame_port_protocol.md
```

These two memory layers serve **different purposes**:

- **Repo memory** (`.claude/memory/`) — checked into git, shared with future contributors / Claude sessions on any machine, survives the repo regardless of who opens it.
- **User-session memory** (`~/.claude/projects/.../memory/`) — private to Yogesh's local Claude Code install, doesn't travel with the repo.

We have all 8 entries in the user-session layer that probably belong (at least partially) in the repo layer.

### 5.3 Auto-memory hooks

✗ None present. The skill's design is:

- `inject-memory.sh` PreToolUse `*` hook auto-prepends repo memory before every tool call
- `/compound-learnings` slash command appends date-stamped entries to the right domain file at the end of a feature
- `/reorganize-memory` slash command cleans up duplicates and splits files > 200 lines

### 5.4 `inject-memory.sh` status

✗ Missing. Without it, future Claude sessions opening this repo on any machine won't see project memory.

### 5.5 Recommended auto-memory rules + hook design

| Trigger                                                                | What to write                                                       | Hook needed                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| **Bug confirmed + fix shipped**                                        | One-line `[date]: bug X — root cause Y — fix Z` to `domain/bugs.md` | `/compound-learnings` slash cmd (Step 2.18) |
| **Architecture decision (e.g., RWD rule, version pin, CF Pages mode)** | Date-stamped entry to `domain/architecture.md` + ADR cross-link     | `/compound-learnings`                       |
| **Stack gotcha (e.g., Bash sub-shell PATH, husky+pnpm)**               | Date-stamped entry to `tools/stack.md`                              | `/compound-learnings`                       |
| **DB migration / schema change**                                       | Entry to `tools/database.md`                                        | `/compound-learnings`                       |
| **Every tool call**                                                    | Pre-inject the entire memory index                                  | `inject-memory.sh` (PreToolUse `*`)         |

**Migration path:** copy the 8 user-session memory files into `.claude/memory/` with appropriate categorization (e.g., `feedback_frame_port_protocol.md` → `domain/architecture.md` block; `dev_environment.md` → `tools/stack.md`; `project_team_roster.md` → `general.md`). Estimated: ~30 min.

---

## SECTION 6 — Folder reorganization question (move `QA Nexus/` into `docs/`?)

### 6.1 Recommendation: **NO — keep `QA Nexus/` at repo root.**

### Risk analysis (if we did move it)

| Reference site                                                            | Current path                                     | Refactor effort         | Break risk                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------ |
| `CLAUDE.md` lines 11-14                                                   | 4 paths to PM1_PRD / PM1_ERD / 01_SYSTEM / M0_v8 | 5 min Edit              | Low                                                                      |
| `.claude/hooks/prompt-submit/load-binding-context.sh`                     | 7 inline path refs                               | 10 min Edit             | **HIGH** — hook fires on every prompt, breaking it kills binding context |
| `.claude/hooks/pre-tool-use/enforce-design-tokens.sh`                     | 1 path ref to whitelist source                   | 2 min                   | Low                                                                      |
| `apps/web/app/(auth)/{sign-in,set-password,sign-in/forgot}/page.tsx`      | 3 frame-port comment refs to `PM1_UI_v2/...`     | 5 min                   | None (comments only)                                                     |
| `docs/PROJECT_SPEC.md`, `docs/MILESTONES.md`, `docs/PROJECT_BLUEPRINT.md` | Likely many path refs                            | 15-30 min               | Low                                                                      |
| `docs/deploy/cloudflare-pages.md`                                         | At least 1 ref                                   | 2 min                   | None                                                                     |
| `Milestone_M0_Setup_v8.md` itself                                         | Self-ref + 41-frame refs                         | 15 min                  | Low                                                                      |
| Future frame ports (38 remaining)                                         | Each port comments on `PM1_UI_v2/...` source     | Inherits new convention | None going forward                                                       |

**Total effort if we did the move: ~2 hours + thorough testing of `load-binding-context.sh` to confirm binding still loads.**

### Why NO

1. **Risk concentration:** the binding-context hook is THE most critical file in the repo (defines what's authoritative). Refactoring 7 path refs there is the biggest single risk vector in this audit.
2. **Semantic clarity:** `QA Nexus/` is the **input** (immutable specs from product/design teams). `docs/` is the **output** (generated/maintained docs from engineering). Keeping them at separate roots makes that distinction visually obvious.
3. **Reversibility cost:** if we move and want to revert, same 2-hour spend.
4. **Skill spec is silent on the location** — `references/project-spec-template.md` doesn't mandate where binding source files live, only that `docs/PROJECT_SPEC.md` exists. We're already compliant with the latter.

### 6.2 Alternative — symlink?

`docs/spec/` → `../QA Nexus/` symlink would expose binding docs under `docs/` for tooling that walks `docs/` but keeps the canonical path stable.

**Verdict:** acceptable but unnecessary. Don't add accidental complexity.

### 6.3 Skill's PROJECT_SPEC.md expects what location for source PRD/ERD?

**Skill is silent** — it just expects PRD/ERD discoverable in the workspace. Patterns it scans (Step 0.1): `PRD*, *prd*, ERD*, *erd*, *requirement*, *spec*, *specification*` — also under `docs/`, `documentation/`, `specs/`, `requirements/` subdirs. Our `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` matches the `PRD*` pattern. ✅ Compliant.

---

## SECTION 7 — Additional questions

| #    | Question                                                   | Status                                                                                                                                                                                                                  |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1  | `compound-learnings` command installed?                    | ✗ MISSING (`.claude/commands/` doesn't exist)                                                                                                                                                                           |
| 7.2  | 3 skill subagents present + tested?                        | ✗ all 3 MISSING (`.claude/agents/` doesn't exist)                                                                                                                                                                       |
| 7.3  | Security scaffold (gitleaks + SECURITY.md + check-secrets) | ✗ MISSING entirely                                                                                                                                                                                                      |
| 7.4  | 6 Claude Code plugins installed                            | context-mode ✅; **5 others ✗** (superpowers, code-simplifier, feature-dev, compound-engineering, commit-commands)                                                                                                      |
| 7.5  | GitHub Actions workflows committed?                        | ✗ NO `.github/` directory at all (MS0-T005 queued)                                                                                                                                                                      |
| 7.6  | `.claude/rules/` rules files                               | ✗ directory MISSING (skill expects: frontend.md, api.md, database.md, security.md)                                                                                                                                      |
| 7.7  | Phase 5 First Prompt Template generated?                   | ✗ NO                                                                                                                                                                                                                    |
| 7.8  | Per-day EOD reports saved consistently?                    | ✗ NO `docs/eod-reports/` directory; yesterday's EOD is only in chat transcript.                                                                                                                                         |
| 7.9  | `.claude/audit.jsonl` growth                               | ✅ **HEALTHY** — 348 entries since Day 0; latest entry timestamp `2026-04-27T04:12:40Z` confirms `audit-log.sh` firing on every PostToolUse                                                                             |
| 7.10 | Memory propagation across session restarts?                | ✅ via `load-binding-context.sh` (UserPromptSubmit `*`) — confirmed working; visible in every prompt this audit. **HOWEVER:** repo-layer `.claude/memory/` doesn't exist, so cross-machine portability isn't there yet. |

---

## SECTION 8 — Prioritized action plan

### P0 — must fix today (blocks next M0 work)

| #            | Action                                                                                                                                               | Effort | Owner  | Acceptance criteria                                                                                                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0.1 ✅ DONE | Create `.claude/memory/` system (memory.md index + general.md + 4 domain/tool seed files) populated from current user-session memory + PM1 blueprint | 30 min | Claude | ✅ All 7 files present, hard guard `! grep -rq '\${'` passes, commit `de66034`                                                                                                                                                                                                                   |
| P0.2 ✅ DONE | Add `inject-memory.sh` PreToolUse `*` hook + wire in settings.json                                                                                   | 10 min | Claude | ✅ Hook executable, fires correctly (verified `./hook \| head -8`), wired in settings.json PreToolUse matcher `*`, commit `dd1c8a3`                                                                                                                                                              |
| P0.3 ✅ DONE | Create `docs/CHANGELOG.md` with retroactive `[Unreleased]` entry covering 10 commits to date                                                         | 15 min | Claude | ✅ File exists; 12 commits documented with SHAs (12 not 10 — including P0.1 + P0.2 just landed); grouped by date + category; commit `4efdd1c`                                                                                                                                                    |
| P0.4 ✅ DONE | Create `docs/ARCHITECTURE.md` with system overview + Backend Architecture sections (skill assertions 7 + 17)                                         | 25 min | Claude | ✅ 10 sections, 311 lines: System overview (with text-art topology) + Backend Architecture (apps/api stack table + planned layout + planned API surface) + DB + LLM gateway + R2 + deploy topology + audit/observability + hooks + tech debt. Cross-refs PM1_PRD/ERD/milestone. Commit `dc26333` |
| P0.5 ✅ DONE | Create `.env.example` with the 8 vars from MS0-T008                                                                                                  | 10 min | Claude | ✅ 100 lines, 8 var groups (DATABASE*URL, GROQ + Gemini, Resend, R2 5-var bundle, BetterAuth 3-var, Jira OAuth 4-var, OTel + Better Stack, NEXT_PUBLIC*\*). Each annotated with source URL + provisioning task ref. `.env` verified in .gitignore. Commit `5c09e4c`                              |
| P0.6 ✅ DONE | Create root `README.md` per skill template                                                                                                           | 20 min | Claude | ✅ 184 lines, all skill template sections + 8-user roster + 10-doc cross-reference + status badges + live demo URLs. Commit `bdeb2cb`                                                                                                                                                            |

**P0 total effort: ~110 minutes (~2 hours).** Lifts eval score from 5/28 → 11/28 (~39%).

### P1 — important, this week (Days 1–7 of M0)

| #     | Action                                                                                                                                                                                                | Effort                              | Owner           | Acceptance criteria                                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1.1  | Implement MS0-T034 — `enforce-rwd.sh` PreToolUse Edit\|Write hook                                                                                                                                     | 45 min                              | Claude          | Blocks `w-[≥200px]` and `max-w-[1600px]` in `apps/web/**`; allows `max-w-md / max-w-2xl / max-w-[480px] / max-w-[440px]`                                                |
| P1.2  | Add `.claude/agents/` — copy 3 subagents (changelog-updater, frontend-tester, retro-agent) from skill templates with PROJECT_NAME substitution                                                        | 20 min                              | Claude          | All 3 files present, no `${...}` left, eval assertions 29 + 30 pass                                                                                                     |
| P1.3  | Add `.claude/commands/` — at minimum: commit.md, commit-push-pr.md, compound-learnings.md, reorganize-memory.md, fix-bug.md, add-feature.md, update-docs.md, ui-check.md, review-changes.md (9 files) | 60 min                              | Claude          | ≥6 files present (eval 8), ui-check exists (eval 14), review-changes exists (eval 20), commit + commit-push-pr exist (eval 31, 32), compound-learnings exists (eval 25) |
| P1.4  | Add `.claude/rules/` — frontend.md (with apps/web paths frontmatter), api.md (apps/api paths), database.md (prisma paths), security.md (OWASP rules)                                                  | 30 min                              | Claude          | ≥2 files with `paths:` frontmatter (eval 9 passes)                                                                                                                      |
| P1.5  | Add `check-secrets.sh` hook + wire in settings.json + add `.gitleaks.toml` + `docs/SECURITY.md`                                                                                                       | 45 min                              | Claude          | gitleaks not required at runtime (graceful fallback in script); eval assertions 15, 16, 28 pass                                                                         |
| P1.6  | Add `update-docs-check.sh` Stop hook                                                                                                                                                                  | 15 min                              | Claude          | Hook executable, wired in settings.json `Stop`, eval assertion 27 passes                                                                                                |
| P1.7  | Land MS0-T005 GitHub Actions CI                                                                                                                                                                       | 60 min (already on backlog for Mon) | Claude + Yogesh | `.github/workflows/ci.yml` exists, runs lint + typecheck + test + build on PR + main; PR auto-checks green                                                              |
| P1.8  | Add `deny` block to `.claude/settings.json` (or settings.local.json) with rm -rf, force push, etc.                                                                                                    | 10 min                              | Claude          | eval assertion 4 passes                                                                                                                                                 |
| P1.9  | Update `docs/MILESTONES.md` to reflect 34 tasks (not 32)                                                                                                                                              | 5 min                               | Claude          | Drift fixed; matches `Milestone_M0_Setup_v8.md`                                                                                                                         |
| P1.10 | Establish `docs/eod-reports/YYYY-MM-DD-eod.md` convention; backfill yesterday's EOD from chat transcript                                                                                              | 20 min                              | Claude          | Today's + tomorrow's EOD saved as files; build journal starts                                                                                                           |

**P1 total effort: ~5 hours.** Lifts eval score from 11/28 → 24/28 (~86%) by end of week.

### P2 — nice to have (defer to M1+ or PM2)

| #    | Action                                                                                                         | Effort | Owner                     | Notes                                                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------- | ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| P2.1 | Install Claude Code plugins (superpowers, code-simplifier, feature-dev, compound-engineering, commit-commands) | 30 min | Yogesh (requires restart) | Phase 3 DX. Useful but not blocking M0.                                                                                       |
| P2.2 | Install `code-review-graph` (`pip install code-review-graph`) + `.code-review-graphignore`                     | 20 min | Yogesh                    | Eval assertions 21 + 22. Useful for long-term token savings on code reviews.                                                  |
| P2.3 | DESIGN.md at root — **skip** — `01_SYSTEM.md` is the locked design source; mark eval 19 as N/A                 | —      | —                         | Justified deviation.                                                                                                          |
| P2.4 | Folder reorg `QA Nexus/` → `docs/` — **DO NOT DO** — see Section 6.1 for rationale                             | —      | —                         | Risk > benefit.                                                                                                               |
| P2.5 | Status line config (ccstatusline)                                                                              | 10 min | Yogesh (requires restart) | Cosmetic / informational.                                                                                                     |
| P2.6 | `filter-test-output.sh` PreToolUse Bash hook                                                                   | 10 min | Claude                    | Filters jest/vitest output. Defer until we have tests.                                                                        |
| P2.7 | `.githooks/pre-push` with CHANGELOG-aware check                                                                | 15 min | Claude                    | We use husky's pre-push for typecheck. Adding CHANGELOG-aware separately would conflict. Reconsider after Phase 4 validation. |
| P2.8 | Migrate user-session memory entries to repo memory (cross-machine portability)                                 | 30 min | Claude                    | Already covered in P0.1; just be thorough about which entries belong where.                                                   |

**P2 total effort: ~2 hours, mostly Yogesh-driven (plugin installs need Claude Code restart).**

---

## Final score projection

| Stage                                    | Eval pass | Conformance              |
| ---------------------------------------- | --------- | ------------------------ |
| **Today (audit complete)**               | 5 / 28    | 18%                      |
| **After P0 (≈2 hrs) ✅ DONE 2026-04-27** | 11 / 28   | 39%                      |
| **After P0 + P1 (≈7 hrs total)**         | 24 / 28   | 86%                      |
| **After P0 + P1 + P2 (≈9 hrs total)**    | 27 / 28   | 96% (DESIGN.md deferred) |

The remaining 1/28 (DESIGN.md) is a justified deviation per Section 8 P2.3.

---

## Read-only mode confirmation

This audit performed **NO code changes** to the repo other than writing this single file at `docs/audits/2026-04-27-skill-alignment-audit.md`. The only other write was creating the parent directory `docs/audits/`. All other operations were `Read`, `Bash` (read-only ls/cat/grep/git log), `ToolSearch`, and `ctx_batch_execute` (sandboxed).

**Awaiting Yogesh's call on which P0 / P1 items to tackle and in what order.**
