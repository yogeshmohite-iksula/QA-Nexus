# feedback — skill v2.2 first-use observations (F22 spec validation, Day-22 2026-05-19 PM)

**Status:** PARTIAL. Updated as FE+1 surfaces F22 + F19 re-port PRs. Initial snapshot taken from F22.spec.json on disk + smoke validation against canonical F22 v2 HTML.

## Snapshot: F22 spec coverage at v2.2 + depth-cap 7

- **72 total / 66 sectionLike** nodes; schemaVersion 3; 33 tokens used; 10 aria_exemplars.
- **Depth distribution:** d1=3, d2=6, d3=7, d4=12, d5=14, d6=16, d7=8. Depth-7 sections (8 of them) prove the v2.2 depth-cap-7 amendment is paying off — under v2 (depth-cap 5) those 8 BEM sections would have been dropped silently.
- **RCA accordion structure captured at depth 5-7:**
  - `rca-cards` (d5) parent → 5× `rca-card` children (d6) → `rca-head` (d7)
  - `cur-panel` (d4) → `cur-list` (d5) → 3× `cur-row` (d6)
  - `fix-banner` (d5) sibling under `def-center`
  - `disc-list` (d5) → `disc-card`s (d6) → `disc-head` (d7)
- **PRIMARY-tier aria_exemplars (10):** Open navigation · Quick create · Notifications · Theme · Primary navigation · Collapse navigation · Breadcrumb · More actions · **Layer breakdown** · **Defect metadata** — last two are F22-specific and confirm Sherlock RCA + meta-row sections have ARIA-primary signal.

## v2.2 false-positive watch (TBD until FE+1 ports F22)

No false positives observed in spec EXTRACTION (the BEM heuristic is conservative — only matches `(div|section)` with BEM-style first class AND structural content). The actual false-positive question lives at the diff-probe layer when comparing canonical DOM to React port DOM. To be filled in when FE+1 publishes the F22 React TSX and we can run `diff-probe.mjs`.

## POTENTIAL_INVERSION watch list (F22-specific)

The nested-count inverse probe is most likely to flag POTENTIAL_INVERSION (port > canonical) at these spots — wrapper divs FE+1 may introduce for React state management:

- `rca-cards` parent: 5 `rca-card` children in canonical. If FE+1 wraps each in an `<AccordionItem>` (Radix or shadcn), the nested count could become 5 + 5 = 10 (false alarm).
- `disc-list` parent: similar Accordion wrap risk.
- `def-meta` / `meta-row` parent: tooltip/popover wrappers could inflate count.

**Pre-position:** treat these as WARN-only outcomes; don't block. They're expected React-pattern divergences from raw HTML.

## MISSING_NESTED watch list (F22-specific)

These are the **real-drift catch targets** for the inverse probe:

- `rca-cards` parent: canonical = 5 `rca-card` children. If FE+1 hard-codes 3-4 instead of mapping canonical canned-data, MISSING_NESTED fires.
- `cur-list` parent: canonical = 3 `cur-row` children. Same hard-code risk.
- `disc-list` parent: similar.

These are the genuine Rule 17 violation targets that v2.2 was designed to catch.

## v2.2.1 candidate triggers (file follow-up if observed)

If F22 port surfaces any of:

1. **PRIMARY tier misses on RCA sections** — e.g., `Layer breakdown` aria_exemplar doesn't match the React port because FE+1 used a different aria-label
2. **`rca-card` 5-sibling count discrepancy** that ISN'T explained by Accordion wrapping (i.e., it's a real defect)
3. **BEM heuristic catches a NON-section element** (e.g., a button styled as `btn-secondary` getting flagged as section because it has 3+ children)

File `feedback_skill_v2.2.1_candidate_<topic>.md` in `.claude/memory/` + create a GH issue tagged `skill-v2.2` for the patch sprint.

## Hard Rule 18 Part 5 candidacy

If POTENTIAL_INVERSION fires PREDICTABLY on Radix/shadcn Accordion wrappers (and it's not a Rule 17 violation, just a React-pattern divergence), the Hard Rule 18 stack may need a Part 5 that codifies: "Accordion/Dialog/Popover wrapper divs are SECONDARY-tier matches by convention; the inverse probe MUST exempt them from POTENTIAL_INVERSION warnings IF the wrapper carries a known `data-radix-*` or `data-shadcn-*` attribute."

**Trigger:** observe 2+ frames where the same wrapper pattern fires POTENTIAL_INVERSION incorrectly. Until then, treat as a one-frame curiosity, not a contract gap.

## Cross-references

- ADR-020 (Jira sync, ratified Day-22) — Sherlock async-write pattern means RCA cards fill async via WebSocket `defect.sherlock_ready`. F22 React port must handle the empty-then-fill state without confusing the diff-probe (initial render = 0 cards, post-fill = 5 cards).
- Hard Rule 18 Day-21 Part 4 (BEM heuristic + nested-count inverse probe) — this memory is the first production-use journal of those amendments.
- `.claude/skills/frame-port/specs/F22.spec.json` — the spec under test.
- F21 + F19 prior data points — log them here as FE+1 publishes (F19 re-port DEFERRED Day-21 → Day-22; outcome TBD).

---

_Initial entry Day-22 ~14:30 IST. Update as F19 + F22 PRs land. Promote to a session retro entry in RETROS.md once 3+ frames have been ported via v2.2._
