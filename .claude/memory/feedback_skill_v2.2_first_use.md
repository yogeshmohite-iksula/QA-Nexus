---
name: Skill v2.2 first-use lessons from F26 port (Day-2 pilot-prep, 2026-06-03)
description: F26 Agents page was the first production use of skill v2.2 7-step workflow against canonical v2 HTML source-of-truth (not bundle). Captures the diff-probe false-positive class, canonical CSS extraction gotchas, mobile grid-column override pattern, and the trend-vs-score modifier rule for EvalHarness.
type: feedback
date: 2026-06-03
---

# Skill v2.2 first-use lessons — F26 Agents (Day-2 pilot-prep)

## Context

PR #229 `feat/web-f26-agents-port`, commits `aa177c1` (Phase-1) + `4241555` (Phase-2 final). First skill v2.2 production use on v2 HTML port path (F22 had used bundle path Day-22 of M5).

## Findings worth carrying to F27 + modals + future v2 HTML ports

### F1. Diff-probe RED at 40% sections-PASS was a false-positive

**What happened:** Phase-2 diff-probe returned RED on F26: pixel diff 4.9-9.4% AMBER across viewports, but sections-PASS at 21/53 = 40% (below 60% RED threshold).

**Root cause:** 32 of 53 SECONDARY tier probes were either AdminShell BEM tokens (`rail-content`, `nav-items`, `rail-foot`) — AdminShell uses Tailwind so canonical BEM never matches — or modal/drawer content (`cfgScrim`, `drawer-body`, etc.) which is Phase-3 scope.

**Per Hard Rule 18 Day-19 amendment Part 1:** ARIA-PRIMARY is the binding contract; SECONDARY (class-token) divergence is expected for Tailwind ports. The probe correctly reported these as MISSING SECONDARY but the 40% PASS aggregate triggered RED.

**Per Day-19 amendment Part 3:** "Visual gate (Hard Rule 13) is authoritative for AMBER and GREEN. The diff-probe is a STRUCTURAL sanity check + drift early-warning, not the product gate." Same principle should apply when probe RED is driven by known-divergence categories.

**v2.2.1 candidate:** sections-PASS threshold for "RED" should distinguish:

- AdminShell BEM internals (Tailwind divergence, expected)
- Modal/drawer overlay content (Phase-3, deferred)
- Per-frame BEM tokens (real port drift)

Two paths to fix:

- Tag probes by category in spec.json; weight differently in aggregate gate
- OR: add a CLI flag `--exclude-shell-bem` / `--exclude-overlay-content` to skip the divergence categories

Discussion needed with MAIN on which path is better.

### F2. Canonical `:root` token block CANNOT be stripped from extracted CSS

**Anti-pattern (what I did wrong):** Extracted canonical `<style>` block → stripped `:root {...}` → wrote to `agents-page.css` → imported in agents-page.tsx. Assumed globals.css had all tokens.

**Reality:** globals.css has the color tokens (`--canvas`, `--primary`, `--pass`, etc.) but NOT the structural tokens (`--r-lg`, `--rail-w`, `--topbar-h`, `--tap`, `--r-sm`, `--r-md`, `--r-ai`, `--admin-soft`, `--admin-line`, `--admin-red`). All `border-radius: var(--r-lg)` rules silently fell back to 0.

**Visible symptom:** Section panels rendered with flat corners. User flagged "section box corners are not rounded".

**Fix:** restore canonical `:root` block as a SCOPED rule: `.main { --r-lg: 12px; --rail-w: 240px; ... }`. Scoping to `.main` confines tokens to the page so other admin routes don't get clobbered.

**Carry to F27 + modals:** when extracting canonical CSS for those frames, COPY the entire canonical `:root` block scoped to the page wrapper. Don't strip.

### F3. Canonical mobile `grid-column: 1/-1` overrides require EXPLICIT reset

**Anti-pattern:** Tried to force 5-column row layout at mobile via `grid-template-columns: auto minmax(220px,1fr) auto auto auto !important` thinking that would beat canonical's mobile rule.

**Reality:** Canonical `@media (max-width: 767px) { .dec-row .conf { grid-column: 1/-1; } .dec-row .ts { grid-column: 1/-1; } }` is more specific (`.dec-row .conf` = 0,2,0 specificity vs my `.dec-list .dec-row` = 0,2,0 + `!important`). The `1/-1` grid-column directive survived and made `.conf` span the entire row, wrapping `.outcome` and `.ts` to additional rows.

**Visible symptom:** Items overlapping at narrow viewports despite horizontal scrollbar.

**Fix:** explicit `.dec-list .dec-row .conf, .dec-list .dec-row .outcome, .dec-list .dec-row .ts { grid-column: auto !important; grid-row: auto !important; }` reset BEFORE applying new template + `grid-auto-flow: column !important` to force single-row.

**Verification via Playwright DOM probe:** before fix `rowCols: "84px 480px 0px 0px 0px"` (cols 3-5 collapsed); after fix `rowCols: "67px 395px 59px 84px 37px"` (all cols sized to content).

**Carry to F27 + F23:** any list-layout component that uses canonical mobile media rules needs explicit reset of `grid-column: 1/-1` on items that should stay inline at mobile.

### F4. EvalHarness modifier classes gate on TREND, not score

**Anti-pattern:** Wrote `pctClass(pct: number)` returning `pct < 90 ? 'pct med' : 'pct'`. For AC042 at 64% score, this gave `.pct .med` = amber. Wrong.

**Reality:** Canonical `.eval-tile .pct { color: var(--pass) }` is green default. `.eval-tile .pct.med { color: var(--warn) }` is amber. The `.med` modifier is applied ONLY when trend says `Declined`. AC042 trend is `✓ PASS · +10pp vs baseline` → no `.med` → green.

**Visible symptom:** AC042 64% rendered amber instead of canonical's green.

**Fix:** `pctClass(trend: string)` and `tileClass(trend: string)` — both gate on `trend.includes('Declined')`. Score is NOT the gate.

**Carry to any eval / KPI tile component:** modifier classes follow CANONICAL contract, not intuitive numeric thresholds. Read canonical CSS for `.pct.med`, `.pct.lo`, `.tile.med`, etc. and trace what each modifier means in canonical's design language.

### F5. Canned-data extension authority during port iteration

**Pattern:** mid-port, found `F26_GUARDRAIL_EVENTS` was missing the canonical sentence suffix. Each canned-data entry had `description: '...'` + `target: '...'` but canonical HTML rendered `description + " for {target} — {outcome continuation}."`.

**Two choices:**

- (A) Hardcode suffix in component via lookup map → Hard Rule 17 violation (string not in canned-data)
- (B) Extend canned-data with `suffix: '...' as const` field, verbatim from canonical HTML

**Picked (B)** because the file's own comment invites adding semantic exports. The extension is RULE 17 compliant (verbatim from canonical HTML = Rule 15 source-of-truth).

**Carry:** any mid-port canned-data gap → extend canned-data, not the TSX.

### F6. Visual gate iteration cadence (5 rounds @ ~15 min each = 75 min total)

Faster than a close-and-redo (PR #145 precedent on M3 took hours). Pattern that worked:

- Yogesh circled specific drift in screenshot
- I read canonical CSS/HTML for that specific class/section
- Fixed root cause (not symptom)
- Re-screenshot via Playwright
- Re-submit with side-by-side description

The Playwright DOM probe (computed style + bounding rect) was the key debugging tool — let me find `grid-column: 1/-1` on `.conf` in ~3 minutes when CSS inspection alone wouldn't have surfaced it.

## When NOT to apply these lessons

- F25 + F23 + F26m1/m2 + F27m1 + F28m1 ports if using BUNDLE workflow (not v2 HTML extraction) — F2 doesn't apply because bundle provides spec + canned-data + CSS as separate artifacts, not embedded in HTML.
- Pure layout-only frames (no data rendering) — F4, F5 don't apply.

## Cross-references

- PR #229 commits `aa177c1` + `4241555`
- Day-2 brief at `-frontend/.claude/scratch/day-2-wed-fe-kickoff-brief-2026-06-03.md`
- Day-2 FE EOD at `docs/eod-reports/2026-06-03-day-2-wed-fe.md` (this EOD)
- Hard Rule 18 Day-19 amendment Parts 1+3 (binding contract clarifications)
- Memory: `feedback_prettier_prepush_gitignored.md` (Day-21 — recurred on this push)
