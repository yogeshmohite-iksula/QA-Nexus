# Skill Audit — Day-20 M4 close (2026-05-17)

> **Trigger:** Milestone close (per `feedback_skill_audit_cadence.md` — the audit cadence rule).
> **Scope:** `.claude/skills/frame-port/` v1 → v2.1.2 production usage across Day-18 PM → Day-20.
> **Author:** MAIN (Yogesh in coordinator role)
> **Predecessor audit:** `docs/audits/2026-05-13-skill-alignment-audit.md` (Day-17, M3 close).

---

## 1. Frame-port skill iteration arc summary

Six iterations across the M4 close week. Each caught a real production failure mode through actual FE+1 validation runs. Close-and-redo loop applied at TOOL layer (not PR layer) — same canonical pattern as Hard Rule 17's stub-data invented-content close-and-redo from Day-17.

| Iter                 | Date         | Failure mode caught                                                       | Time   | Closes                           |
| -------------------- | ------------ | ------------------------------------------------------------------------- | ------ | -------------------------------- |
| **v1 polish**        | Day-19 09:45 | extract-spec docstring schema drift + missing jsdom prereq                | 15 min | minor docs drift                 |
| **v2**               | Day-19 10:00 | Finding A — Tailwind class-only structural false-positive on React ports  | 60 min | structural false-positive        |
| **v2.1**             | Day-19 11:00 | Finding B — shell-substitution pixel floor (38-40% on desktop)            | 60 min | shell pixels counted as drift    |
| **v2.1.1**           | Day-19 11:30 | Bug A + Bug B — asymmetric crop + v1-spec class-match dropped             | 30 min | crop alignment + backward-compat |
| **v2.1.2**           | Day-19 12:00 | Case C + Bug D — pixelmatch AA inflation (3-4x) + report.json undefined   | 30 min | AA noise + serialization         |
| **Amendment Part 3** | Day-19 16:30 | Case AMBER — renderer-noise floor codified as GREEN/AMBER/RED band system | 15 min | binary-gate false-positive       |

**Day-20 iterations:** zero. Skill v2.1.2 + AdminShell `data-canonical-section` attrs (PR #163) held across F20 same as F21 with no new failure modes surfacing. The close-and-redo loop at TOOL layer is now one-shot per close week, not per-frame.

## 2. Skill production usage — Day-19 + Day-20

Two frames shipped via the skill workflow:

- **F21 Defects Hub (PR #160)** — Day-19. First production use. AMBER (5.2-6.6% pixel diff across viewports). Visual gate PASSED round-2 after FE+1 caught coordinator inversion via Rule 11 escalation.
- **F20 Run Results (PR #169)** — Day-20. Second production use. 5-round visual gate within skill workflow's expected iterate-after-probe loop. Visual gate PASSED. No close-and-redo precedent triggered.

**Pattern is stable** for the 6 remaining authenticated frame ports: **F19, F22, F23, F25, F26, F28.** Day-21 priority is to ship skill v2.2 (extract-spec gap fix + nested-section-count inverse probe) before FE+1 starts F19 / F22 to lock the stable production pattern further.

## 3. Skill v2.2 candidate items (deferred from Day-20)

Both items surfaced Day-19 + Day-20 but were not blocking; deferred to Day-21 hardening per Day-19 EOD plan.

### 3a. `extract-spec.mjs` gap — 5 sections missed on F21

The extract-spec heuristic skips `<div>` / `<section>` elements with BEM-style class only (no role, no heading text). FE+1's F21 spec.json missed:

| Section                   | F21 v2.html lines   | Why skipped          |
| ------------------------- | ------------------- | -------------------- |
| `.sd-tabs`                | L490-499            | div with class only  |
| `.PEOPLE` block           | L1180-1186          | div with class only  |
| `.sr-layers` RCA bars     | L1199-1204          | div with class only  |
| P0/P1/P2 group separators | L819 + L944 + L1063 | divs with class only |
| Assignee filter           | L778                | div with class only  |

**Fix candidate (v2.2):** Expand `isSectionLike()` heuristic in `extract-spec.mjs` to additionally detect `<div>` / `<section>` where `classList[0]` matches `/^[a-z]+(-[a-z]+)+$/` (BEM-style hyphenated) AND the element has either (a) a heading child (h1-h6) OR (b) ≥3 text-bearing children. 60-90 min. Bundle with Item 3b.

### 3b. Nested-section-count inverse probe — FE+1 EOD ask

Current diff-probe is one-directional (canonical → port). Add inverse direction:

- Count nested sections in canonical via spec.json
- Count nested sections in React port DOM
- Flag MISSING (port < canonical = structural incomplete)
- Flag POTENTIAL INVERSION (port > canonical = unverified extras, Rule 17 spirit violation)

Bundle with Item 3a in skill v2.2. Estimated +30-45 min on top of 3a's 60-90 min.

**Total skill v2.2 budget:** 90-135 min Day-21 morning before FE+1 starts F19 (P0 + P1 from Day-20 EOD §4).

## 4. Hard Rule 18 amendment Parts 1+2+3 — all live

Codified Day-19 + Day-20 in CLAUDE.md:

- **Part 1 (Day-19 v2)** — ARIA-primary structural probe with three-tier OR-semantics matching (PRIMARY role+aria-label / SECONDARY class-substring / TERTIARY `data-canonical-section`).
- **Part 2 (Day-19 v2.1.1)** — Content-region pixel crop via UNION shell-bounds measurement on both canonical + port pages. Two-canonical model: SHELL canonicalized via F19 React per Rule 14; CONTENT canonicalized via v2 HTML per Rule 15.
- **Part 3 (Day-19 v2.1.2)** — GREEN/AMBER/RED band system (industry-standard tri-band replaces binary 5% gate). Visual gate (Rule 13) remains authoritative for AMBER + GREEN.

**Possible Day-21 Part 4 amendment** if skill v2.2 ships: codify the nested-section-count inverse probe contract + the BEM-class section-detection heuristic.

## 5. Audit of skill production usage gaps

| Risk                                                                    | Surfaced when           | Mitigation                                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cross-renderer noise floor (5-7% pixel diff on perfectly-aligned ports) | Day-19 F21 AMBER result | Codified as GREEN/AMBER/RED band system (Part 3 amendment)                                                                                                               |
| Extract-spec misses BEM-class-only sections                             | Day-19 F21 spec         | Day-21 P0 skill v2.2 fix                                                                                                                                                 |
| Probe is one-directional (canonical → port only)                        | Day-19 FE+1 EOD ask     | Day-21 P1 skill v2.2 nested-section-count inverse                                                                                                                        |
| Skill workflow takes ~5 visual-gate rounds for novel frames             | Day-20 F20 (5 rounds)   | Acceptable — within expected iterate-after-probe loop; not a skill gap. Designer-precision validation pre-visual-gate could reduce rounds. Future enhancement candidate. |

None of these are M4-blocking. All on Day-21 hardening or M5 enhancement queue.

## 6. Recommendation: ship skill v2.2 Day-21 morning before F19 re-port

**Sequence:**

1. Day-21 08:30-10:00 IST — MAIN ships skill v2.2 (Items 3a + 3b)
2. Day-21 10:00 IST — FE+1 starts F19 re-port via skill v2.2 (canonical-shell exemplar; minimal expected drift)
3. Day-21 PM — FE+1 starts F22 re-port (largest port: Defect Detail with RCA accordion + needs-human-review affordance per M4 v2 §4.6)
4. Day-21 EOD — Hard Rule 18 Part 4 amendment if skill v2.2 introduces new contract surface

## 7. Cross-references

- Frame-port skill v2.1.2: `.claude/skills/frame-port/{SKILL.md, extract-spec.mjs, diff-probe.mjs, README.md}`
- CLAUDE.md Hard Rule 18 + Day-19 amendments Parts 1+2+3
- M4 v2 plan §4.5 (AC042) + §4.6 (needs-human-review) + §4.7 (WebSocket event taxonomy)
- M4 close report: `docs/m4/m4-close-release-notes.md`
- Day-19 EOD: `docs/eod-reports/2026-05-15-day-19-main.md` (PR #164)
- Day-20 EOD: `docs/eod-reports/2026-05-17-day-20-main.md` (PR #170)
- Predecessor skill alignment audit: `docs/audits/2026-05-13-skill-alignment-audit.md`
- Memory: `feedback_skill_audit_cadence.md` (audit cadence rule that triggered this audit), `feedback_chained_base_squash_gotcha.md` (Day-20 cascade learning)

---

_Filed Day-20 ~21:00 IST post-cascade, per `feedback_skill_audit_cadence.md` milestone-close trigger._
