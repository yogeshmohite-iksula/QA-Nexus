---
name: frame-port
description: Port a canonical v2 HTML frame to a React component in apps/web, enforcing CLAUDE.md Hard Rules 12 (RWD) + 13 (visual gate) + 14 (shell parity) + 15 (v2 HTML source-of-truth) + 16 (canonical-first workflow) + 17 (canned-data extraction) + 18 (skill-mandatory workflow). Use this skill any time someone asks to "port frame Fxx", "build the Fxx React port", "convert F18 HTML to React", "scaffold F22 page", "implement Defect Detail page from HTML", or similar requests that translate a v2 HTML frame in PM1_UI_v2/Redesign Frame by claude design/ into a React component under apps/web/src/app/(app)/**/. Also triggers on "frame-port", "/frame-port", "redo F19 with verbatim re-port", "fix-forward Fxx port", or any request to start, retry, or rebuild a React port of a canonical PM1 frame. This skill orchestrates a mandatory 7-step workflow that catches the three drift classes that bit M3 close week (stub-data invention, undefined-token fallback, RWD breakpoint divergence) before they reach the manual visual gate.
---

# frame-port skill — canonical-first port workflow

> **STATUS:** v1 (Day-18 PM 2026-05-14 — codified after #145 was closed as a Hard Rule 17 violation precedent).
> **Binding:** CLAUDE.md Hard Rules 12-18.
> **Owner:** MAIN orchestrates the steps; FE+1 executes the implementation work.
> **Anti-goal:** Never let the close-and-redo loop run more than once per frame. Catch drift at the diff-probe step, not at the visual gate.

---

## Trigger phrases

This skill activates when the user says any of:

- "port frame Fxx" / "port F19"
- "build the Fxx React port" / "build F19 page"
- "convert F18 HTML to React"
- "scaffold F22 page" / "scaffold F22 from HTML"
- "implement Defect Detail page from HTML"
- "frame-port" / "/frame-port"
- "redo F19 with verbatim re-port"
- "fix-forward Fxx port"
- "rebuild F20 page" / "retry F20 port"

If the user says any of these, the orchestrator MUST execute the 7-step workflow below in order. Skipping ANY step = Hard Rule 18 violation = visual gate FAIL regardless of output quality.

## Inputs the orchestrator collects up front

Before starting, confirm with the user:

1. **Frame ID** — e.g. `F19`, `F22`. Used everywhere as the slug.
2. **Canonical HTML path** — typically `QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/<frame name> v2.html`. If no v2 exists, the skill HALTS and the orchestrator asks Yogesh to commission a Claude Design pass (Rule 15).
3. **Target React route** — where the React component will live, e.g. `apps/web/src/app/(app)/runs/[runId]/page.tsx`.
4. **Localhost URL after build** — where the port will run, e.g. `http://localhost:3000/runs/abc`.

If any input is missing or ambiguous, ASK before proceeding.

---

## The 7-step workflow (mandatory order)

### Step 1 — Extract canned data (Hard Rule 17)

```bash
node scripts/extract-canned-data.mjs \
  --frame F19 \
  --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html" \
  --out apps/web/components/f19-run-console/canned-data.ts
```

Produces `apps/web/components/<frame>/canned-data.ts` — the verbatim text extract.

**Hard Rule 17:** ALL user-visible strings in the React port MUST come from this file. Any string in a `*.tsx` that doesn't trace back here = Rule 17 violation.

### Step 2 — Extract structural spec (Hard Rule 18, new)

```bash
node .claude/skills/frame-port/extract-spec.mjs \
  --frame F19 \
  --html "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html"
```

Produces `.claude/skills/frame-port/specs/<frame>.spec.json` — the section tree, token list, asset references, and canned-data key candidates.

The spec is the **contract** for what the React port must contain structurally.

### Step 3 — Show spec.json to Yogesh, WAIT for approval

The orchestrator displays the generated `spec.json` to Yogesh and **WAITS** for explicit "spec approved, proceed" before continuing. This is a hard pause — do not skip.

Yogesh may amend the spec:

- Mark sections as optional (e.g. "no right rail on mobile-only routes")
- Add missing tokens that the HTML omitted
- Remove tokens that are stale aliases
- Approve as-is

Once approved, the spec is the binding contract for Steps 4-6.

### Step 4 — Scaffold TSX from spec.json + canned-data.ts (NOT from HTML)

FE+1 writes the React component reading EXCLUSIVELY from:

- `spec.json` for structure (which sections exist, what classes / tokens / roles each uses)
- `canned-data.ts` for text content (Rule 17)

**Forbidden in Step 4:**

- Opening the HTML in an editor and reading it to write TSX (this is what produced the #145 invention drift)
- Inventing class names not in `spec.json.tokens_used` or `spec.json.sections[].classes`
- Inventing strings not in `canned-data.ts`
- "Improving" the canonical example data

The orchestrator coaches FE+1 to keep `spec.json` open in one pane, `canned-data.ts` in another, and write the TSX with both as the only references.

### Step 5 — Run diff-probe.mjs against running localhost (Hard Rule 18 gate)

After FE+1 starts the dev server and the route is rendering:

```bash
node .claude/skills/frame-port/diff-probe.mjs \
  --frame F19 \
  --canonical "QA Nexus/PM1/PM1_UI_v2/Redesign Frame by claude design/F19 Run Console v2.html" \
  --port http://localhost:3000/runs/abc
```

Probes at viewports 320 / 768 / 1024 / 1440. For each:

- **Section-by-section three-tier OR-semantics match (v2, Day-19):**
  1. **PRIMARY** — `role` + `aria-label` selector match
  2. **SECONDARY** — class-name substring match (v1 fallback)
  3. **TERTIARY** — `data-canonical-section="..."` attribute match (escape hatch)

  Section is PRESENT on a page if ANY tier returns >0 matches. The output table shows which tier matched for each side (`C-tier` / `P-tier` columns) for diagnostic transparency. FAIL if a section is MISSING (present in canonical, absent in port) or EXTRA (in port but absent in canonical).

- Pixel diff under sharp-based raw RGBA comparison. FAIL if >5% pixel diff at any viewport.

**Exit 0 = clean; Exit 1 = drift.**

**Tailwind React port note (Day-19 amendment):** Tailwind utility classes (`className="flex shrink-0 flex-col"`) do NOT map to canonical BEM-style class tokens (`def-shell`, `rail`). This is by design per Hard Rule 5 + Tailwind convention. The probe matches via ARIA (PRIMARY tier) for this reason; class-name match is a SECONDARY fallback. If your React port has correct ARIA but Tailwind classes, the probe will pass via PRIMARY. If you find yourself reaching for `data-canonical-section` to patch a probe failure, STOP — fix the missing ARIA first; the data-attribute is a true escape hatch for decorative wrappers without semantic meaning.

If drift detected: orchestrator does NOT proceed to Step 6. Instead it returns the diff table to FE+1, who fixes the root cause and re-probes. NEVER patch the diff symptom (e.g. don't add `data-canonical-section` to "make the probe pass"; understand WHY ARIA was missing in the React tree first).

### Step 6 — Submit screenshots for Rule 13 visual gate (only after Step 5 clean)

Once diff-probe is exit 0, FE+1 captures the 320 + 1440 screenshots per Rule 13 and posts the local URL to Yogesh. This is the MANUAL gate — Yogesh confirms "looks good, commit?"

Diff-probe replaces NEITHER the visual gate NOR the manual review. It catches automated drift BEFORE Yogesh's eyes have to. The visual gate then catches the subjective polish.

### Step 7 — Commit + push + open PR

Standard commit message format:

```
feat(web): fxx-page-name pattern a scaffold (m4 task n)

- canned-data.ts extracted via scripts/extract-canned-data.mjs
- spec.json approved by yogesh day-NN
- diff-probe clean at 320/768/1024/1440 (sections + pixel)
- visual gate green at 1440

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

The PR description includes:

- Link to the spec.json approval (commit SHA + timestamp from Step 3)
- Diff-probe report.json attached or referenced
- Visual gate screenshot timestamp

---

## What this skill REPLACES (do not run the old workflow)

Before this skill, the port workflow was Hard Rule 16's "canonical-first" 8-step. That rule is still binding — this skill is the AUTOMATED enforcement of it. You should NOT manually run Playwright diff-probes or screenshot rituals if this skill is available. It's strictly better.

The skill ALSO codifies the "close-and-redo for Rule 17 violations" precedent from #145 → #150. If diff-probe shows a section was implemented with invented data (e.g. cluster titles that don't appear in canned-data.ts), the PR is CLOSED, not patched. FE+1 returns to Step 4 with the canonical references and re-scaffolds.

## When to ESCALATE rather than continue

The skill HALTS and the orchestrator asks Yogesh when:

- The canonical v2 HTML doesn't exist for the requested frame → ask for a Claude Design pass
- The canonical v2 HTML has a structural bug that the React port can't faithfully reproduce (e.g. 320px horizontal-scroll like F20 v2's STAGING-V3 chip cluster) → fix in React per Rule 12, file a `(letter)` followup for the canonical HTML fix
- diff-probe FAILs after 2 fix attempts on the same root cause → likely the spec is wrong; revisit Step 3
- Yogesh rejects the visual gate after diff-probe passes → there's a polish issue not captured by automated probes; iterate Step 6 only (not Steps 1-5)

## Cross-references

- CLAUDE.md Hard Rule 12 — RWD on every port
- CLAUDE.md Hard Rule 13 — manual visual gate
- CLAUDE.md Hard Rule 14 — shell parity + F19 React canonical for shell internals
- CLAUDE.md Hard Rule 15 — v2 HTML source-of-truth
- CLAUDE.md Hard Rule 16 — canonical-first workflow (replaced by this skill)
- CLAUDE.md Hard Rule 17 — canned-data verbatim extraction
- CLAUDE.md Hard Rule 18 — skill-mandatory workflow (this file enforces it)
- `scripts/extract-canned-data.mjs` — Step 1 tool
- `.claude/skills/frame-port/extract-spec.mjs` — Step 2 tool
- `.claude/skills/frame-port/diff-probe.mjs` — Step 5 tool
- PR #145 → #150 precedent (Rule 17 close-and-redo)
- M4 v2 plan §4.5 / §4.6 / §4.7 (where this skill's outputs feed downstream)
