# M4 retro — FE perspective from Day-20 (2026-05-17)

**Author:** FE+1 (Claude Code)
**M4 close:** 19:00 IST Sun 2026-05-17 (per Yogesh ceremony brief)
**FE deliverables Day-20:** F20 Run Results re-port — PR #169 MERGED at `1970a8a`

---

## What worked

### Skill v2.1.2 + AdminShell data-canonical-section attrs validated across F21 + F20

The same `.claude/skills/frame-port/` workflow ran end-to-end on two consecutive frame ports (F21 Day-19, F20 Day-20) with **zero skill iterations Day-20**. F21 contributed 5 skill bug fixes (v1 → v2.1.2). F20 used v2.1.2 as-shipped — no MAIN escalation needed. Skill is now production-stable.

AdminShell TERTIARY anchors from PR #163 (rail-content, rail-foot, railCollapseToggle) appeared in both F21 and F20 rendered DOM verbatim. PR #163 ships value the moment it lands.

### Visual gate caught real drift not pre-listed by canonical CSS read-through

Two clean cases where the 5-round Yogesh feedback caught canonical fidelity that my own canonical CSS audit had missed at R1-R3:

- **Canonical L268-275 horizontal-scroll on `.rs-stats`** — `overflow-x:auto` + hidden `::-webkit-scrollbar{height:0}` + bordered `.stat` cells with right-border separators. My R3 used flex-wrap which wrapped stats to multiple rows. R5 implemented exact canonical.
- **Canonical L1099-1119 selected-case 3-row button layout** — inline-style `display:grid;grid-template-columns:1fr 1fr;gap:6px` block. My R4 used flex-wrap. R5 implemented `grid-cols-2` for guaranteed 50/50.

Both were canonical-CSS-line-specific fixes that diff-probe couldn't see and that my R1-R3 inspection of canonical structure missed. Yogesh visual gate is THE backstop.

### 7-step skill workflow stayed disciplined under time pressure

Day-20 had a context resume at 15:00 IST with 6 hours to M4 close. The temptation was to skip Step 3 (mandatory pause for spec.json approval) or Step 4 (scaffold from spec NOT HTML). Held the discipline — spec.json approved at 15:10, then scaffold from spec started. No invented strings. Day-18 10.1% Rule 17 violation rate became 0%.

---

## What hurt

### Visual gate took 7 rounds (vs F21's 5 rounds) — flat learning curve

F21 Day-19 = 5 rounds R1 → R5 PASSED.
F20 Day-20 = 7 rounds R1 → R7 PASSED.

Expected the learning from F21 to compress F20 to 3-4 rounds. Instead it got LONGER. Reasons:

- F20 has more sections (3 cluster cards × cl-conf colors, results table with 4 suites × counts, evidence rail with 5 sub-sections) → more surface area for drift.
- New drift classes surfaced (cl-conf color inversion R3-R4, horizontal-scroll R3-R5, mobile right-rail visibility R5-R6, filter pill position R6-R7) — none reusable from F21.

This means future ports won't necessarily benefit from F20's per-round fixes either. **5-7 rounds may be the steady-state cost of canonical-faithful porting** — Yogesh's eye is the only authority that catches per-frame-specific drift.

### Pre-existing main prettier drift on `diff-probe.mjs`

Both F20 R1 and Day-20 EOD pushes were blocked by the same pre-push prettier gate failure on `.claude/skills/frame-port/diff-probe.mjs`. Whitespace-only formatting that PR #158 introduced and never re-prettierred. Each new branch cut from origin/main has to carry a `chore(skill): prettier-fix` commit. Not blocking but noise.

**Action:** MAIN should re-apply prettier on `docs/main-skill-v1-polish` once and for all. Or the CI should run prettier --write on the skill files post-merge.

### Skill v2.2 nested-section-count amendment still pending

Both F21 and F20 hit the same SECONDARY-tier gap on AdminShell-internal sections (`rail-content`, `rail-foot`). Probe SECONDARY class-match fails on Tailwind ports because canonical uses BEM-like class names but ports use Tailwind utilities. `data-canonical-section` TERTIARY attrs are present (PR #163) but the probe SECONDARY check ignores them in this specific case.

**Accepted as known limitation** per Hard Rule 18 Part 3 band system — DOM probe 13/17 → 15/17 PASS through fix iterations, both ports passed Yogesh visual gate via Hard Rule 13. But this means every future frame port will report 2 false MISSING that need manual triage in the PR description.

**Action:** MAIN to ship v2.2 with `nested_section_count` field in spec.json + per-parent DOM count verification. Filed for Day-21+ skill maturity.

---

## What's next

### Day-21 (Mon 2026-05-18 — first post-M4-close day)

**09:00 AM — F19 Run Console Pattern B re-port** (fastest first per Day-18 audit — mostly false positives, expected 3-4 round visual gate). Pattern B means real wiring deferred — Pattern A scaffold sufficient for visual gate.

**After F19 — F22 Defect Detail Pattern A** (new ground — no Day-18 seed, clean scaffold via skill workflow). Pattern A pure scaffold; deferred real wiring per M4 plan.

**Stretch — Kimi HIGH FE triage** (4 items per Yogesh backlog).

### M4 post-close hygiene

- File Day-21+ followups for F23 Reports Studio, F25 Executive Dashboard, F26 Agents, F28 Settings & Audit ports (all M5 or post-pilot scope per current M4 plan).
- Visual gate workflow refinement: 5-7 round cycle may indicate the skill workflow needs a **designer-precision validation step** between Step 5 (diff-probe) and Step 6 (Yogesh gate). Candidate: run the v2 HTML side-by-side with rendered React port in headless Chrome with auto-screenshot at exact 1440 viewport, then diff per-pixel to find drifted regions. Pre-bake this for FE+1 to manually inspect BEFORE posting to Yogesh.

### Skill maturity targets

- **v2.2 (MAIN)** — nested_section_count probe (closes F21/F20 AdminShell SECONDARY-tier gap)
- **v2.3 (candidate)** — designer-precision pre-gate (per above)
- **v3.0 (Day-21+ exploration)** — auto-fix-suggest from canonical CSS line cross-references (e.g. probe finds wrong color → suggests "canonical L371 says --pass; port uses --fail")

---

End of FE Day-20 retro. M4 CLOSED at 19:00 IST. Day-21 09:00 IST start.
