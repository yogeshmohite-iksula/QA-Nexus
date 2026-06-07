# Project Memory Index

Auto-loaded by `.claude/hooks/pre-tool-use/inject-memory.sh` before every tool
call. This file is the single source of truth for what's worth remembering
across sessions, machines, and contributors. It travels with the repo.

Distinct from user-session memory at `~/.claude/projects/<repo>/memory/` which
is private to a specific machine and Claude Code install.

## Files

**Top-level (loaded by `inject-memory.sh` for every tool call):**

- @.claude/memory/general.md — project identity, 8-user roster, $0 cost gate, locked stack, M0–M6 plan, risky assumptions to watch

**Decision + learnings (added 2026-04-28, skill v1.3 memory system batch):**

- @.claude/memory/CLAUDE_DECISIONS.md — architectural decisions tied to ADRs (loaded when editing related code paths)
- @.claude/memory/STACK_LEARNINGS.md — gotchas like the zod/resolvers v3 lockstep, hook flag-boundary regex, Next.js static-export root redirect
- @.claude/memory/IKSULA_CONTEXT.md — pilot team (8 named users), anchor project (RET), ID patterns, sample files — loaded before seed/fixture/demo writes
- @.claude/memory/PM1_PATTERNS.md — Pattern A deferred routing, Rule 13 visual confirmation gate, Rule 12 RWD enforcement, audit log requirement, shared-schema discipline

**Domain (per-area deep dives):**

- @.claude/memory/domain/architecture.md — RWD rule, two-panel auth pattern, static-export trade-offs, design-token discipline, frame-port protocol
- @.claude/memory/domain/bugs.md — bug patterns + fixes (Next 16 slip, Grammarly hydration, Bash sub-shell PATH, commitlint type-enum)
- @.claude/memory/domain/api.md — API design decisions (stub until MS0-T020 lands the first endpoints)

**Tools (per-tool gotchas):**

- @.claude/memory/tools/database.md — Postgres 15 + pgvector on Neon free, Prisma 5, HNSW indexes
- @.claude/memory/tools/stack.md — Homebrew at non-standard path, two GitHub accounts, husky 9, pnpm 10.33.2, Node v24

**Feedback — first-use + session-lesson journals (referenced on demand, not auto-loaded):**

- @.claude/memory/feedback_ac042_provenance_llm_assist.md — AC042 corpus used Codex-labeled + human-spot-checked ground truth (ADR-022 §5.9 reserve precedent); M6 corpus-governance follow-up (Day-28)
- @.claude/memory/feedback_eval_gate_smoke_first.md — run a 1-defect smoke before the full binding eval; schema-bridge failures present as a zero-hypothesis degraded state (Day-28)
- @.claude/memory/feedback_skill_v2.2_first_use.md — frame-port skill v2.2 first-use journal (FE F22 Day-22/23 + BE M5-close footnote Day-28)
- @.claude/memory/feedback_worktree_locked_merge_pattern.md — merging a PR whose branch is checked out in a sibling worktree: temp-branch + --force-with-lease to the remote ref; union-resolve add/add conflicts (pilot Day-2 AM)
- @.claude/memory/feedback_multi_worktree_env_discipline.md — BINDING: .env edits MUST target the correct worktree (-backend/-frontend/root); verify with pwd + awk before assuming landed (Day-2 PM, 18th reality-check)
- @.claude/memory/feedback_chained_base_cascade_resolution.md — BINDING: when squash-merge causes downstream PRs to go DIRTY, use temp-branch + rebase + take-ours for upstream content + force-push (Day-3 AM, 4-PR merge wave)
- @.claude/memory/feedback_dns_authority_verify_day_1.md — BINDING: Day-1 of any project, verify DNS edit access on the production domain explicitly. Domain ownership ≠ email account ownership ≠ DNS edit access. Drove ADR-025 Apps Script pivot (Sat Day-3+4 AM, Iksula IT blocker discovery)
- @.claude/memory/feedback_multi_worktree_chat_misroute.md — BINDING: agents MUST verify-before-edit when an incoming brief looks outside their worktree's role (check pwd + file paths + intent). Sat Day-3+4 ~12:15 IST, BE+1 25th reality-check, F26m1 brief misroute caught clean
- @.claude/memory/feedback_multi_worktree_git_working_tree_drift.md — BINDING: cross-worktree .git sharing causes locked-frame `D` status drift. Mitigation: explicit-path `git add` + `git restore` + branch creation with `origin/main` explicit. Sat Day-3+4 BE+1 26th reality-check + MAIN replay + branch-creation drift
- @.claude/memory/feedback_stale_deploy_diagnosis_pattern.md — BINDING: before classifying any UI bug as P0/P1 against a deployed environment, verify which commit/PR the deploy is built from. Cloudflare Pages auto-deploys on `main` only; pending PRs are NOT in the bundle. Grep current main + read source before code surgery. Sun Day-5 ~16:35 IST after FE+1's 32nd reality-check caught P0-001 as stale-deploy, not code bug. Includes stacked-PR cascade caveat (#250 auto-closed on parent merge → #251 re-open)

## Maintenance

Run `/reorganize-memory` when any file exceeds 200 lines.

Run `/compound-learnings` at the end of every feature to append a one-line entry to `general.md` (the lightweight, every-session capture).

The 4 v1.3 files (CLAUDE_DECISIONS, STACK_LEARNINGS, IKSULA_CONTEXT, PM1_PATTERNS) are **maintained manually** — they're curated decision/pattern logs, not auto-appended. New entries land via direct edit when an ADR is accepted, a gotcha is diagnosed, the pilot team changes, or a new pattern is codified. The retro-agent can propose entries; Yogesh approves before they land.

Established 2026-04-27 per skill alignment audit P0.1. Expanded 2026-04-28 (Day 2 Block 3) per Tech-project-forge skill v1.3 memory-system spec.
