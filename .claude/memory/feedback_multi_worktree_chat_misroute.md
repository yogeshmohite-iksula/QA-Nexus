# BINDING RULE — Multi-worktree chat misroute hazard

**Type:** feedback · **Filed:** Sat Day-3+4 2026-06-06 · **First observed:** Sat Day-3+4 ~12:15 IST (BE+1 25th reality-check)

## Rule

In the QA Nexus multi-worktree setup (root MAIN + `-frontend` FE+1 + `-backend` BE+1), Yogesh manually relays agent briefs between Claude Code chat instances. **Misroute hazard:** pasting FE-intent work into BE chat (or vice versa) is easy because the chats look similar and the briefs use shared vocabulary.

**Agents MUST verify-before-edit when an incoming brief looks outside their worktree's role:** check `pwd`, file paths mentioned in the brief, and intent keywords. If mismatch → stop + flag + ask Yogesh to confirm routing.

## Why this exists

Sat Jun 6 ~12:15 IST. Yogesh pasted the F26m1 LLM Provider Setup modal spec — frontend React port work for FE+1's `-frontend` worktree — into the BE+1 chat in the `-backend` worktree. BE+1 read the first line, noticed the file paths pointed at `apps/web/components/admin/`, recognized the worktree role mismatch, and stopped without editing. Flagged the misroute. Yogesh re-routed to FE+1 chat. F26m1 (PR #236) shipped clean.

Counterfactual: had BE+1 not verified, edits would have landed on BE+1's worktree which doesn't normally touch `apps/web/**`. The misrouted commits would either get caught at the path-filter `review-changes` step (extra cycle) or, worse, land in a BE PR description that doesn't mention frontend work — a cross-domain bleed.

## How to apply

When you (any agent) receive a new brief from Yogesh:

1. **Read the first line + summary** before scrolling to the work plan.
2. **Verify worktree role:** `pwd` → confirm absolute path ends in the expected suffix (`-frontend` / `-backend` / root).
3. **Cross-check file paths:** does the brief mention `apps/web/**` (FE), `apps/api/**` (BE), or root-level `docs/**` / `.claude/**` (MAIN)?
4. **If mismatch** → STOP. Reply: "Brief reads like [other agent]'s work — current worktree is [my-role]. Confirm routing?" Do NOT edit before Yogesh confirms.
5. **If match** → proceed.

## Cross-references

- `feedback_multi_worktree_env_discipline.md` (sibling — `.env` file misroute hazard, same multi-worktree class)
- `feedback_multi_worktree_git_working_tree_drift.md` (sibling — shared `.git` resource hazard, same class)
- Sat 2026-06-06 BE+1 25th reality-check (the precedent)
