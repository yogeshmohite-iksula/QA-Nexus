# F22 polish iterations — Day-23 (2026-05-20)

> Typical Step 4 refinement loop after canonical re-port lands AMBER on diff-probe. 4 successive polish iterations addressed header layout + font config + Curator inline-button layout + button sizing + Sherlock backgrounds. ~40 min total.

## Iteration log

| #   | Issue area                  | Trigger                                                                                                    | Fix                                                                                                                                                                                                                                                                                                                                                                                                                      | Files                                                                                                                       | Time    |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Header layout               | Yogesh screenshot annotation — title overlapping tr-meta                                                   | Restructured outer flex from `md:flex-row` (title-block next to tr-actions) to siblings-in-flex-col (tr-meta+tr-actions row, title row, description row, meta-row) with `gap-6`                                                                                                                                                                                                                                          | `DefectHeader.tsx`                                                                                                          | ~10 min |
| 2   | Font config                 | Generic system sans rendering instead of DM Sans display                                                   | Confirmed `next/font/google` imports + Tailwind v4 `@theme` already wired. Replaced 7 inline `style={{ fontFamily: 'var(--font-dm-sans, var(--font-sans))' }}` with `font-display` utility across 5 components                                                                                                                                                                                                           | `DefectHeader.tsx`, `SherlockRca.tsx` (3 sites), `EvidenceSection.tsx`, `CuratorSimilarDefects.tsx`, `DiscussionThread.tsx` | ~10 min |
| 3   | Curator layout              | Buttons stacking below row instead of inline-right                                                         | Converted `.cur-row` from `flex flex-wrap` to CSS grid: mobile 2-col `[auto_1fr]`, desktop 5-col `[auto_auto_auto_minmax(0,1fr)_auto]`. Added `md:overflow-hidden md:text-ellipsis md:whitespace-nowrap` to text + `md:flex-nowrap md:justify-end` to actions                                                                                                                                                            | `CuratorSimilarDefects.tsx`                                                                                                 | ~10 min |
| 4   | Button sizing + section bgs | Canonical compact h-7/h-8 vs FE+1 generous h-11; Sherlock summary too saturated; Discussion using --raised | Audited 12 button instances → h-7 (btn-sm) / h-8 (btn default). Sherlock summary bg: `bg-[color:var(--ai-soft)]` (12% violet) → `color-mix(in srgb, var(--secondary) 6%, transparent)` per canonical L313. Discussion cards: `--raised` → `--base` per canonical L414. Discussion lead border: `--ai-line` → `--primary-line` per canonical L422. Curator panel: added 4% violet bg + 3px left stripe per canonical L399 | `SherlockRca.tsx`, `EvidenceSection.tsx`, `DiscussionThread.tsx`, `CuratorSimilarDefects.tsx`                               | ~15 min |

## Tap-target deviation noted

Hard Rule 12 mandates 44px tap targets (WCAG 2.5.5). Canonical F22 v2 HTML uses 28-32px buttons. **Rule 15 (canonical fidelity) wins per Yogesh visual-gate verdict** — logged the deviation in PR #192 description for future Rule 12 amendment consideration.

## Key learning

**After canonical re-port lands AMBER, plan for ~30-45 min of polish iteration.** This is the Step 4 refinement loop where:

- Iteration 1 = layout structure (whatever Yogesh annotates first)
- Iteration 2 = typography (font family + sizes + weights)
- Iteration 3 = component-specific layout (rows, grids, alignment)
- Iteration 4 = micro-details (bg colors, button sizes, borders, spacing)

Typical cadence: ~10-15 min per iteration. Diff-probe band stays in AMBER throughout (renderer-noise floor) — visual gate at 320 + 1440 is the binding sign-off.

## Workflow per iteration

1. Yogesh posts screenshot annotation with red-box areas
2. Read canonical CSS for affected sections (`grep -nE 'class-name' v2.html` then `sed -n` for the block)
3. Edit affected components (use `Edit` for surgical changes, not `Write`)
4. `pnpm exec tsc --noEmit` — must exit 0
5. Capture screenshots at 320 + 1440 (`node scripts/m5-f22-visual-gate-sweep.js`)
6. Post screenshots back to Yogesh chat with summary of changes
7. Repeat until visual gate APPROVED

## Cross-references

- `feedback_claude_design_bundle_first_use.md` — why we needed the re-port in the first place
- `feedback_skill_v2.2_first_use.md` — diff-probe behavior across iterations (stayed AMBER throughout)
- PR #192 — F22 canonical port + polish iterations
