# Project Memory Index

Auto-loaded by `.claude/hooks/pre-tool-use/inject-memory.sh` before every tool
call. This file is the single source of truth for what's worth remembering
across sessions, machines, and contributors. It travels with the repo.

Distinct from user-session memory at `~/.claude/projects/<repo>/memory/` which
is private to a specific machine and Claude Code install.

## Files

- @.claude/memory/general.md — project identity, 8-user roster, $0 cost gate, locked stack, M0–M6 plan, risky assumptions to watch
- @.claude/memory/domain/architecture.md — RWD rule, two-panel auth pattern, static-export trade-offs, design-token discipline, frame-port protocol
- @.claude/memory/domain/bugs.md — bug patterns + fixes (Next 16 slip, Grammarly hydration, Bash sub-shell PATH, commitlint type-enum)
- @.claude/memory/domain/api.md — API design decisions (stub until MS0-T020 lands the first endpoints)
- @.claude/memory/tools/database.md — Postgres 15 + pgvector on Neon free, Prisma 5, HNSW indexes
- @.claude/memory/tools/stack.md — Homebrew at non-standard path, two GitHub accounts, husky 9, pnpm 10.33.2, Node v24

## Maintenance

Run `/reorganize-memory` when any file exceeds 200 lines.
Run `/compound-learnings` at the end of every feature to append date-stamped entries.

Established 2026-04-27 per skill alignment audit P0.1.
