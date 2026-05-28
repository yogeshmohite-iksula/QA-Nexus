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

---

# Frame-port skill v2.2 — first F22 use (Day-23 2026-05-20)

> First production use of skill v2.2 (Day-21 amendment: BEM-class section detection + nested-section-count inverse probe) on F22 Defect Detail v2 HTML. Probe behavior confirmed expected; AMBER band stable across iterations; known Tailwind-vs-BEM SECONDARY-tier limitation persists per F20/F21 precedent.

## Probe configuration

```
node .claude/skills/frame-port/diff-probe.mjs \
  --frame F22 \
  --canonical "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html" \
  --port http://localhost:3000/projects/iksula-returns/defects/DEF-RET-2104/ \
  --spec .claude/skills/frame-port/specs/F22.spec.json \
  --out .claude/skills/frame-port/diffs/F22/
```

- Scope: `content` (default, 5% threshold, blocks)
- Spec source: `.claude/skills/frame-port/specs/F22.spec.json` — regenerated via `extract-spec.mjs` (bundle's own spec.json was schemaVersion 3, flat — incompatible with probe v2.2 tree walker; first crash was `TypeError: nodes is not iterable` on bundle spec)

## Final band breakdown (after polish iterations)

| Viewport | PRIMARY ARIA   | SECONDARY class | Pixel | Band  |
| -------- | -------------- | --------------- | ----- | ----- |
| 320      | **9/9 (100%)** | 0/27            | 9.30% | AMBER |
| 768      | **9/9 (100%)** | 0/27            | 6.20% | AMBER |
| 1024     | **9/9 (100%)** | 0/27            | 5.10% | AMBER |
| 1440     | **9/9 (100%)** | 0/27            | 5.88% | AMBER |

## Interpretation

### PRIMARY ARIA tier (Hard Rule 18 Part 1 binding contract)

**100% PASS on every viewport.** The role+aria-label match across:

- `banner` (role="banner")
- `proj-pill` (role="button", aria-label="Project switcher")
- `tablist` (role="tablist")
- `rail` (role="navigation", aria-label="Primary navigation")
- `railCollapseToggle` (aria-label="Collapse navigation")
- `main` (role="main")
- `Breadcrumb` (role="navigation", aria-label="Breadcrumb")
- `section` (role="region" × 5 — Sherlock/Evidence/Curator/Discussion + per-layer)
- `cur-panel` (role="region", aria-label="Curator similar defects detected")
- `Defect metadata` (role="complementary", aria-label="Defect metadata")

### SECONDARY class-token tier (known Tailwind-vs-BEM limitation)

**0/27 PASS.** Per F20 Day-20 + F21 Day-19 precedent, this is the documented limitation:

> "Probe SECONDARY class-match fails on Tailwind ports because canonical uses BEM class names but ports use Tailwind utilities."

Accepted as known per Hard Rule 18 Day-19 Part 3 band system.

### Nested-count inverse probe (Day-21 amendment Part 4)

POTENTIAL_INVERSION (WARN only) on 6 parents:

- `section`: 16 canonical vs 27 port (React component wrappers)
- `cur-panel`: 5 canonical vs 27 port
- `Defect metadata`: 11 canonical vs 19 port
- `banner`: 2 canonical vs 1 port (MISSING — accepted, AdminShell renders 1 banner)
- `main`: 53 canonical vs 0 port (MISSING — Tailwind class detection limitation)
- `rail`: 8 canonical vs 4 port (MISSING — AdminShell-internal, accepted per F21 Day-19)

No blocking MISSING flags after polish — all caught via Yogesh visual gate at 320 + 1440.

## Pixel diff stability across iterations

The pixel diff held in the AMBER range (5-10%) across ALL 4 polish iterations:

- After initial re-port: 5.5-7.9%
- After header layout fix: 5.5-7.9%
- After font polish: 5.5-7.9%
- After 5-issue polish (Sherlock bg + button sizes + tabs + Curator + Discussion): 5.1-9.3%

**Implication:** AMBER band reflects renderer-noise floor (Chrome HTML vs Chrome React with different anti-aliasing on different DOM tree depth). Polish iterations that materially change the layout don't move the band — they refine within it. The band ALONE cannot signal "done" — Yogesh visual gate is authoritative for AMBER per Hard Rule 18 Day-19 Part 3.

## Bundle spec schemaVersion mismatch

The Claude Design bundle ships its own `spec.json` (schemaVersion 3, flat sections list). Skill v2.2 `diff-probe.mjs` expects schemaVersion 2 (tree with `children`). On first probe run, crashed with:

```
TypeError: nodes is not iterable
  at walk (.claude/skills/frame-port/diff-probe.mjs:168:21)
```

**Recovery:** Re-run `extract-spec.mjs` against the canonical v2 HTML to get a schemaVersion 2 spec:

```
node .claude/skills/frame-port/extract-spec.mjs \
  --frame F22 \
  --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F22 Defect Detail v2.html" \
  --out .claude/skills/frame-port/specs/F22.spec.json
```

Result: 72 sections, 66 structural — works as probe input.

## Codified going forward

When Claude Design bundle ships, **ALWAYS regenerate spec.json via skill v2.2's extract-spec.mjs** before running diff-probe. Bundle's own spec.json is NOT a substitute. Add to ADR-022 §5.10 candidate.

## Cross-references

- `feedback_claude_design_bundle_first_use.md` — bundle workflow rejection that triggered the re-port
- `feedback_f22_polish_iteration.md` — polish iterations during which the band held AMBER stable
- Day-19/20 lessons: F20 + F21 SECONDARY class-token limitation documented earlier
- PR #192 — F22 canonical port shipping AMBER on all viewports

---

# Frame-port skill v2.2 — backend (BE+1) perspective (Day-28 2026-05-27, M5 CORE close)

> Skill v2.2 is a **frontend frame-port** tool. Day-28's backend work (AC042 Sherlock
> eval gate — the M5 CORE close gate) didn't exercise the skill's diff-probe or
> BEM-section machinery at all. Logging the BE-side observations anyway, because two
> skill-adjacent patterns DID prove out and one M6 gap surfaced.

## What did NOT apply (and why that's fine)

- **BEM-class section detection + nested-count inverse probe** (the v2.2 headline
  features) are about HTML→React DOM fidelity. Backend agent work has no
  canonical-HTML-to-port comparison, so none of it applied. The skill is correctly
  FE-scoped; there's no backend drift to flag.

## Skill-design patterns that generalized to the backend

1. **ADR-driven contracts held up under a real gate.** ADR-019 §6 (Sherlock JSON
   output contract + never-throws) and the per-agent confidence-calibration prompt
   design were validated by AC042 PASS (top-2 64.0% / cal 1.00). The "spec the
   contract in an ADR → enforce in code (Zod) → measure with a gate" loop is the
   backend analogue of the skill's "spec.json → diff-probe → visual gate" loop.
2. **Plan A2 calibration-nudge is a generalizable LLM-overconfidence remedy.**
   Replacing a single `0.9+ only when…` line with an explicit 4-band rubric
   (0.90–1.00 / 0.75–0.89 / 0.60–0.74 / 0.50–0.59 + "DO NOT default to 0.8+") moved
   calibration 0.57 → 1.00 with no code change. Reusable for ANY LLM feature that
   emits a confidence (Composer, Curator). Promote to PM1_PATTERNS.md as a
   prompt-engineering pattern.
3. **Smoke-before-binding-eval mirrors diff-probe-before-visual-gate.** See
   `feedback_eval_gate_smoke_first.md`. Cheap structural check first, expensive
   authoritative gate second — same shape as the skill's probe → Rule-13 ordering.

## M6 gap surfaced

The frame-port skill makes the FE port workflow **executable + auditable**
(extract-spec → diff-probe → bands). The backend has **no equivalent skill** for the
analogous workflow — "stand up / modify an LLM agent → smoke → binding eval →
calibration check." Day-28's AC042 work was done by hand with throwaway env flags.
**M6 candidate: an `agent-eval` skill** that scaffolds the eval harness (with a
permanent `--limit`/`--debug` smoke mode), runs the smoke, then the binding eval, and
emits a GREEN/AMBER/RED-style band on the gate thresholds — the backend mirror of
`frame-port`.

## Cross-references

- `feedback_eval_gate_smoke_first.md` — the smoke-first pattern (Day-28).
- `feedback_ac042_provenance_llm_assist.md` — corpus provenance (Day-28).
- ADR-019 (Sherlock RCA design) · ADR-022 §5.9 (LLM-assist reserve allowance).
- PR #213 — the Day-28 schema-bridge + Plan A2 calibration fix that closed AC042.

---

_BE+1 entry Day-28 2026-05-27. The FE-perspective entries above (F22 Day-22/23) remain
the primary skill-v2.2 journal; this is the backend footnote._
