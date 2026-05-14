# Day-17 Skill Alignment Audit (Wed 2026-05-13)

> **Trigger:** Post-M3 close ceremony (M3 closed Wed 2026-05-13).
> Scheduled per audit cadence (next due ~M4 close = ~Sat 2026-05-16).
> Author: MAIN session. Time: ~22:30 IST (during M3 close PR draft).
> Predecessor: `docs/audits/2026-05-08-skill-alignment-audit-day-13.md`.

---

## A. Hooks firing correctly (15 hooks active)

All 15 hooks unchanged from Day-13 audit:

- 6 PreToolUse hooks (inject-memory + Bash block-dangerous + Edit/Write block-secrets/design-tokens/pm1-stack/rwd)
- 3 PostToolUse hooks (audit-log + report-token-savings + nudge-context-mode)
- 1 UserPromptSubmit hook (load-binding-context)
- 4 Stop hooks (update-docs-check + cumulative-savings-report + log-token-savings + log-session-summary)
- 1 SessionStart hook (sync-hooks)

**New since Day-13 (1 hook):** `pre-tool-use/enforce-no-playwright-mcp.sh` shipped in PR #108 (Day-14) — blocks `mcp__playwright__*` tool calls with stderr message pointing to Playwright CLI. Saves ~85K tokens per E2E session.

**Total: 16 hooks** (was 15 at Day-13; +1).

## B. Compound-learnings count

`.claude/memory/general.md ## Compound learnings` — **~76 entries** projected after Day-17 append (was 64 at Day-13).

- +12 Day-17 entries appended this audit run (see STEP 5 of close ceremony)
- +8 Day-12 M2 close cascade (carried since Day-13)

## C. Followups state

- **Closed during M3:** `(am)` `(aq)` `(bb)` `(bc)` `(ap)` `(bh)` — 6 closed
- **Filed during M3:** `(ar)` `(at)` `(au)` `(av)` `(aw)` `(ax)` `(ay)` `(az)` `(bd)` `(be)` `(bj)` `(bk)` `(bm)` `(bn)` — 14 new
- **Carry-over to M4+:** `(ae)` `(ac)` (both since Day-12), plus M3-filed P2/P3 items

## D. Hard Rules added today

- **Rule 14 amendment (Day-17)** — AdminShell canonical reference = F19's current React implementation for shell internals. Lucide-react icons retained over HTML's custom SVG paths. F19 React DOM is the diff-probe target for future port work.
- **Rule 16 NEW (Day-17)** — Canonical-first port workflow (8 mandatory steps before any frame port).

**Hard Rules total:** **16** (was 15 at Day-13; +1).

## E. Design rules file imported

- **PR #134** imported `_DESIGN_RULES.md` (17 rules) + `_README.md` to `PM1_UI_v2/Redesign Frame by claude design/`. Previously FE+1 was porting without binding spec for weeks; this PR closes that gap.
- All future ports must read `_DESIGN_RULES.md` per Hard Rule 16 step (1).

## F. Memory file additions today

- `.claude/memory/feedback_adminshell_f19_canonical.md` — locks AdminShell canonical = F19 React per Day-17 Round-4 ruling
- (potential) `.claude/memory/feedback_canonical_first_workflow.md` — locks Hard Rule 16 8-step diff-probe workflow as feedback file (recommendation for M4 — file if not yet)
- (potential) `.claude/memory/feedback_zod_scoped_override.md` — locks pnpm override family-member-check lesson (#138 catch)

## G. Skill drift items spotted

| Item                                                                                                                                                   | Severity | Followup                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| Pre-push prod-boot smoke gate is insufficient — boot smoke passes but request-handler crashes (e.g., z.ipv4 TypeError in #138) caught only post-deploy | P1       | `(bo)` filed — add request-level smoke (POST /auth/sign-in/magic-link) to pre-push gate     |
| Ink tokens (`--pass-ink` / `--fail-ink` / `--warn-ink`) used in F19 not yet in formal `01_SYSTEM.md` spec                                              | P2       | `(bk)` filed by Yogesh — retrofit ink tokens into 01_SYSTEM.md (action-button inks variant) |
| M1-M3 React ports likely have silent drift against `_DESIGN_RULES.md` 17 rules (file imported only Day-17)                                             | P2       | `(bm)` filed — audit all M1-M3 ports retroactively against the 17 rules                     |
| F08 Home user-pill shows seeded "Kishor K." stub instead of authenticated user                                                                         | P3       | `(bn)` filed — wire user-pill to authClient.getSession() for M5 polish                      |

## H. M3 close ceremony skill compliance

- ✅ **Hard Rule 11** invoked 3+ times today (BE+1 caught brief-vs-source mismatch on #138 + #139; FE+1 caught hook-vs-canonical conflict on #136 + lint pattern on #135). Rule is paying off — orchestrator caught making 3 different non-trivial assumptions.
- ✅ **Pre-draft-during-wait pattern** demonstrated this ceremony (`.claude/scratch/m3-close/` workflow); `.gitignore` + `.prettierignore` locks added via PR #131.
- ✅ **Visual-gate flag protocol** (`[VISUAL GATE PENDING]` in PR title) — unchanged from M2.

## I. MCP servers state

- `github` (PAT — yogeshmohite-iksula via `gh`)
- `sequential-thinking`
- `context7`
- `filesystem` (project-root scoped)
- `playwright` — **disconnected per Hard Rule (enforce-no-playwright-mcp.sh hook)**; replaced by CLI
- `context-mode` (plugin marketplace)

`postgres` MCP still deferred (Neon staging not yet provisioned — Yogesh's carryover task to Day-18).

## J. Skill stack health summary

| Surface              | State                              | Δ vs Day-13                    |
| -------------------- | ---------------------------------- | ------------------------------ |
| Hooks                | 16 firing correctly                | +1 (enforce-no-playwright-mcp) |
| Subagents            | 3 valid (unused this milestone)    | unchanged                      |
| Compound learnings   | ~76 (after Day-17 append)          | +12 since Day-13               |
| PM1 v2 frames        | 18 HTML + 1 design rules file      | +1 (#134 design rules import)  |
| CLAUDE.md hard rules | 16 (Rule 14 amended + Rule 16 NEW) | +1 + amendment                 |
| MCP servers          | 5 active + 1 deferred (postgres)   | -1 (playwright now CLI-only)   |
| Tags                 | `m1-` `m2-` `m3-closed-2026-05-13` | +1 (M3)                        |

**Headline:** Skill stack healthy. Day-17 added Rule 16 + Rule 14 amendment to close a real drift class (silent token-fallback breakage). M4 readiness clear pending Yogesh's AC042 decision + Atlassian sandbox setup.

---

## Cross-references

- `docs/audits/2026-05-08-skill-alignment-audit-day-13.md` — predecessor (Day-13)
- `docs/milestones/m3-close-report.md` — M3 close report (Day-17)
- `docs/retros/2026-05-13-m3-retro.md` — M2+M3 retro
- `.claude/memory/general.md` — Compound learnings index
- `.claude/memory/feedback_skill_audit_cadence.md` — cadence tracker
- `CLAUDE.md` — Hard Rule 14 amendment + Hard Rule 16 codification

---

_Audit complete. Skill stack healthy. M4 kickoff blocked on Yogesh's 2 carryover decisions._
