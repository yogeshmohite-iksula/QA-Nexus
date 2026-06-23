# BINDING RULE — Institutional memory must live in version control + off-device backup, never only in agent process state

**Type:** feedback · **Filed:** Thu 2026-06-18 (~3 PM IST) · **Trigger:** the master laptop/account transition (target Sun 2026-06-21) — a team-member rotation that wipes all local session/process state.

## Rule

When a team member (or their laptop / account / email) rotates off, **everything that matters must already be in a place that survives the rotation:** the git repo (travels with `clone`) and an **off-device backup** of the local-only artifacts. **Agent process state — open Claude/Cowork sessions, in-memory context, conversation history — does NOT survive and must never be the sole home of any decision, rule, or state fact.**

Concretely, before any rotation: the project's binding knowledge must be reconstructable by a fresh agent on a new machine from **(a)** the cloned repo (`CLAUDE.md`, `.claude/memory/`, `.claude/rules/`, `docs/`) and **(b)** an off-device copy of the three local-only stores (user auto-memory, Cowork workspace, chat-history). If a fact lives only in a running session, it is already lost.

## Why this exists (the case)

Thu 2026-06-18, prepping a Sun laptop transition. Two memory systems exist, and **only one travels with the clone:**

- **Repo memory** (`.claude/memory/`, 25 `feedback_*.md` + index) — committed → survives `git clone` automatically. ✅
- **User auto-memory** (`~/.claude/projects/<proj-path-encoded>/memory/`, ~26 files) — **per-machine, NOT in git** → lost on wipe unless copied off-device. ❌
- **Cowork workspace** (`~/Claude Cowork Workspace /…`, the work-log xlsx + token tracking) — outside repo → lost unless copied. ❌
- **chat-history/raw-transcripts** — gitignored, local-only → lost unless copied. ❌

A naïve handoff ("the next session will remember") would have silently dropped 3 of the 4 stores. The fix: a **master handoff doc committed to the repo** (`docs/handoff/2026-06-21-laptop-transition-master-handoff.md`) that (1) snapshots verified state, (2) gives the new-laptop bootstrap sequence, (3) tells the operator exactly which local-only stores to back up off-device + how to verify the copy, and (4) carries a first-message template so a fresh agent re-establishes the personas from version control alone.

## How to apply

1. **Treat `docs/handoff/` as the surviving brain.** Anything a future agent must know after a rotation goes there, in the repo, in git.
2. **Inventory the local-only stores explicitly** (user auto-memory, Cowork folders, chat-history) and back them up **off-device** before any wipe — verify counts match the handoff doc.
3. **Never let a decision/rule/state-fact live only in session context.** If it matters, commit it (memory file, ADR, doc) the moment it's decided — don't defer to "the session remembers."
4. **Write the handoff while you still hold the context** — comprehensive v1 now beats a thin skeleton later, because the later session may have _less_ context, not more (this rule applied to itself: the handoff was written comprehensively on day-1 of prep, not deferred).
5. **A fresh agent must verify-before-assert** off the handoff — deploy/PR state drifts; the handoff is a starting point to re-confirm (`git fetch`, `gh pr list`, live `curl`), not gospel.

## Cross-references

- `docs/handoff/2026-06-21-laptop-transition-master-handoff.md` — the artifact this rule produced (the surviving brain).
- `feedback_metadata_audit_reveals_artifact_issues.md` — sibling: drifted metadata is the visible tip of an integrity gap; here, "the next session will remember" is the integrity gap.
- `feedback_stale_deploy_diagnosis_pattern.md` (41st RC) + the 43rd/46th two-axis/live-verified rules — the handoff's §1 "merged ≠ deployed" snapshot applies them (Render was found stale: #284 merged, not live).
- `feedback_audit_immutability_and_seed_drift.md` — the kind of hard-won, non-obvious fact that would be lost if it lived only in a session.

_Authored Thu 2026-06-18 as a 49th-RC candidate, **renumbered to 50th RC per Yogesh ruling Thu evening** (49th = `feedback_verify_constraint_scope_before_expensive_workaround.md`, the Path C lesson, which Yogesh deemed temporally first + structurally the trigger for tonight's work; this file is a sibling lesson from the same day, banked one ordinal later). The rotation forces the discipline the whole project already practices for code (everything in git) onto memory itself: if it's not in version control or an off-device backup, it doesn't survive Sun._
