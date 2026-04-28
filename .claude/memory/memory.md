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

## Maintenance

Run `/reorganize-memory` when any file exceeds 200 lines.

Run `/compound-learnings` at the end of every feature to append a one-line entry to `general.md` (the lightweight, every-session capture).

The 4 v1.3 files (CLAUDE_DECISIONS, STACK_LEARNINGS, IKSULA_CONTEXT, PM1_PATTERNS) are **maintained manually** — they're curated decision/pattern logs, not auto-appended. New entries land via direct edit when an ADR is accepted, a gotcha is diagnosed, the pilot team changes, or a new pattern is codified. The retro-agent can propose entries; Yogesh approves before they land.

Established 2026-04-27 per skill alignment audit P0.1. Expanded 2026-04-28 (Day 2 Block 3) per Tech-project-forge skill v1.3 memory-system spec.
