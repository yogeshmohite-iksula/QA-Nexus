# `.claude/skills/frame-port/` — README

> The frame-port skill enforces the canonical-first port workflow for every M4+ React component built from a v2 HTML frame in `PM1_UI_v2/Redesign Frame by claude design/`.
>
> **Binding:** CLAUDE.md Hard Rule 18.
> **Companion rules:** 12 (RWD), 13 (visual gate), 14 (shell parity), 15 (v2 HTML source-of-truth), 16 (canonical-first), 17 (canned-data extraction).

---

## Prerequisites (first-time setup)

Run once before the first port of the session:

```bash
pnpm install --frozen-lockfile
```

This ensures `jsdom@^29.1.1` + `playwright@^1.59.1` + `sharp@^0.33.5` are hoisted to the root `node_modules/` so the skill scripts can resolve them. All three are devDependencies of the repo root; they exist as transitive deps elsewhere, but the skill scripts run from `.claude/skills/frame-port/` and need them at root.

If you skip this and run `extract-spec.mjs` cold, you'll see:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'jsdom' imported from .claude/skills/frame-port/extract-spec.mjs
```

The fix is always `pnpm install --frozen-lockfile` — never `pnpm add jsdom` (that would mutate the lockfile + drift from CI).

---

## Quick start — port any frame in 7 steps

```bash
# Step 1: extract canned data (Hard Rule 17 — strings)
node scripts/extract-canned-data.mjs \
  --frame F19 \
  --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html"

# Step 2: extract structural spec (Hard Rule 18 — sections + tokens + assets)
node .claude/skills/frame-port/extract-spec.mjs \
  --frame F19 \
  --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html"

# Step 3: SHOW spec.json to Yogesh. WAIT for approval. (Manual.)

# Step 4: scaffold the React component reading EXCLUSIVELY from
#         spec.json + canned-data.ts (NOT from the HTML).

# Step 5: run diff-probe against your localhost
pnpm --filter web dev &  # start the dev server
node .claude/skills/frame-port/diff-probe.mjs \
  --frame F19 \
  --canonical "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html" \
  --port http://localhost:3000/runs/abc

# Step 6: ONLY after Step 5 returns exit 0, run Rule 13 visual gate
#         (320px + 1440px screenshots posted to Yogesh).

# Step 7: commit + push + open PR.
```

---

## Files in this skill

| File               | Purpose                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md`         | Orchestrator instructions. Triggered when the user says "port frame Fxx" or similar. Defines the 7-step workflow.      |
| `extract-spec.mjs` | Step 2 tool. HTML → spec.json (section tree + tokens used + assets + canned-data key candidates). Uses jsdom.          |
| `diff-probe.mjs`   | Step 5 tool. Playwright + sharp diff at 320/768/1024/1440. Exit 0 = clean; Exit 1 = drift (gate blocks visual review). |
| `README.md`        | This file.                                                                                                             |
| `specs/`           | Generated `<FRAME>.spec.json` files. Gitignored after first commit (regenerated per port).                             |
| `diffs/`           | Generated `<FRAME>/<viewport>/{canonical,port}.png` + `<FRAME>/report.json`. Gitignored (per-port artifacts).          |

---

## Why this skill exists

M3 close week shipped F19 / F20 / F21 visual-gate failures that all traced to the same drift class: FE+1 reading the canonical HTML and writing TSX freehand, inventing stub data along the way (cluster titles, ticket IDs, error messages, right-rail labels) that didn't match the canonical.

PR #145 was the breaking point — closed (NOT merged) as a Hard Rule 17 violation precedent. PR #150 re-ported F20 verbatim using `extract-canned-data.mjs` and passed visual gate cleanly.

This skill codifies the close-and-redo pattern into an enforced workflow. The spec.json + diff-probe steps catch drift BEFORE the visual gate, so the close-and-redo loop runs at most once per frame.

## What this skill is NOT

- ❌ Not a TSX generator. It produces a SPEC. FE+1 writes the TSX with the spec + canned-data as references.
- ❌ Not a Rule 13 replacement. It catches automated drift; Yogesh still confirms the visual gate manually.
- ❌ Not a CI gate. (Yet — see followup `(letter-TBD)`.) For Day-18, the orchestrator runs it locally before requesting visual gate.

## Dependencies

- `jsdom@^29.1.1` — added to root devDependencies in the same PR as this skill
- `playwright@^1.59.1` — added to root devDependencies (was already a transitive dep)
- `sharp@^0.33.5` — already in stack via `@xenova/transformers` + ADR-009 pin

Zero new infra. Zero new monthly cost. $0/mo gate (Hard Rule 1) retained.

## Compatibility

- Works on macOS arm64 + Linux x64 (CI). Tested against Node 24 and Node 20.x.
- Does NOT need a database or any service running — `diff-probe` only needs `localhost:<port>` + the canonical file path.
- Skill execution does NOT touch any production system.

## Cross-references

- `CLAUDE.md` Hard Rule 18 (this skill is mandatory for every port)
- `scripts/extract-canned-data.mjs` (Step 1 tool, sibling)
- M4 v2 plan §3 (which frames are in M4 scope)
- M4 v2 plan §4.7 (WebSocket event taxonomy — referenced by F19/F20/F21/F22 specs)
- PR #145 → #150 precedent (Rule 17 close-and-redo)
