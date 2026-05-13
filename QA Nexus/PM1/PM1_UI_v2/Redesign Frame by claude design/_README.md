# Redesign Frame by claude design

**Before editing or adding any `F##.html` file in this folder, read `../\_DESIGN_RULES.md` first.**

## Canonical references
- **Shell** (topbar + rail + scrollbar + collapse JS): copy verbatim from `F15 Knowledge Base v2.html`.
- **Primitives** (chips, cards, scrollbar SB-1, focus ring): `primitives-playground.html`.
- **Tokens**: `../uploads/01_SYSTEM.md` and `../uploads/PROJECT_UI_DESIGN_TOKENS.json`.

## Active frames
| File | Section | Notes |
|---|---|---|
| F15 Knowledge Base v2 | AUTHOR | **Canonical shell reference** |
| F16a Test Case Method Chooser v2 | AUTHOR · Test Cases | |
| F16b A1 Generate from Requirement v2 | AUTHOR · Test Cases | Composer + Curator surface |
| F16c Bulk Import Test Cases v2 | AUTHOR · Test Cases | |

## Naming
- `Composer` (= internal A1) — drafting agent, user-facing name
- `Curator` (= internal A2) — dedup/governance agent, user-facing name
- Internal provider IDs (`A1-Groq`, etc.) stay as system identifiers — not renamed.

## Persistence keys (per-frame namespacing — Rule 14)
- `f15.rail` — F15 rail state
- `f16b.rail`, `f16b.right` — F16b rail + activity-panel state
- `f16c.rail` — F16c rail state
- (use `<frame>.<thing>` going forward)
