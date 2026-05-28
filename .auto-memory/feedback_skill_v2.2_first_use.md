# Skill v2.2 first-use retro — FE perspective (Day-28, 2026-05-27)

Frame-port skill v2.2 (`.claude/skills/frame-port/`) production outcomes from FE+1,
who ported **5 frames** across M3→M5: F22 Defect Detail, F25 Executive Dashboard,
F19 Run Console, F23 Reports Studio, F28 Settings & Audit. Captured per Hard Rule 18
Day-21 amendment (first-production-use must be recorded).

## What worked

- **7-step workflow held discipline.** The mandatory order (extract-canned-data →
  extract-spec → Yogesh spec approval → scaffold from spec+canned-data NOT HTML →
  diff-probe → visual gate → commit/PR) prevented the #145-class invention drift on
  all 5 frames. Step 3 (spec approval) caught scope before any TSX was written.
- **ADR-022 §5.9 PRE-STEP-3 sanity check** correctly PASSED F28 (44 structural
  sections, 90% token adoption) — no false-reject. The F22 precedent (degenerate
  bundle → reject) did not recur; the threshold discriminates real simplification
  from rich captures.
- **extract-spec v2.2 BEM-class section detection** worked on F28 — captured the
  div-based sections (`q-head`, `tablayout`, `ret-row`, `integ-grid`, `bill-grid`,
  etc.) that pre-v2.2 would have silently dropped.
- **AMBER pixel band (Day-19 Part 3)** is now a confirmed 3-frame pattern
  (F19/F23/F28 all 4–10% pixel). It's the Tailwind-vs-BEM + cross-context renderer
  floor, NOT port quality. Yogesh visual gate (Rule 13) is the real product gate.
- **No POTENTIAL_INVERSION false-positives seen on F28** (Day-19 Part-1 nested-count
  inverse probe behaved).

## Gaps / fix candidates

1. **extract-canned-data slugifies `Fxx` → bare `fxx/` dir** (F28 → `apps/web/components/f28/`),
   not a semantic `f28-settings-audit/`. Handled with `mv` + `rmdir`. FIX: honor a
   `--out` path or a frame→dir map in `scripts/extract-canned-data.mjs`.
2. **extract-canned-data captures text nodes ONLY — not `value=` / `<option>` text.**
   Form-dense frames (F28 General/Branding) needed tool-assisted grep/JS extraction of
   input/select values, then manual add to canned-data with a traceability comment.
   FIX: add an `inputs`/`selectOptions` bucket to the extractor.
3. **diff-probe AMBER band doesn't catch fine per-element drift** (badge sizes, focus
   rings, header/body bg distinctions, colored sub-cells). F28 took ~15 drift items
   across 7 Yogesh visual-gate rounds. LESSON: for content-dense admin frames, extract
   the canonical CSS for EVERY sub-component up front (`.act.*`, `.tn-lock`,
   `.imm-banner`, `.audit-tbl`, `.f28-btn`, `.filter-pill`, etc.) and match verbatim in
   the FIRST scaffold pass — don't approximate then iterate. (F23 was one-shot because
   it's chart-dense not control-dense; F28's many small controls each carry drift.)

## Cross-cutting lessons (non-skill, project-wide)

- **Unlayered global `:focus-visible` in globals.css beats layered Tailwind utilities.**
  Suppressing a per-input focus ring needs the `!` important modifier
  (`focus-visible:outline-none!`); plain `focus-visible:outline-none` loses.
- **Canonical HTML > MAIN brief on conflict.** MAIN's F28 brief specified actor "role
  pills"; the canonical had none (color-coded actors instead). Followed Rule 15
  (canonical = content source-of-truth) + Yogesh Rule 13.
- **commitlint requires lowercase subject after `feat(web):`** (start-case rejected).
  Recurring; keep subjects lowercase.
- **Playwright screenshot/extraction scripts must live inside the repo tree**, not
  `/tmp` (Node resolves `playwright`/`node:fs` from repo node_modules; `/tmp` →
  ERR_MODULE_NOT_FOUND). ctx_execute runs from a temp dir → use ABSOLUTE paths.
- **Background dev server** via `Bash run_in_background:true` survives across tool
  calls; `pnpm dev &` inside ctx_execute dies with the shell. (Note: task-notifications
  can still kill it — restart on demand.)

## Net

Skill v2.2 is production-ready. The workflow + sanity gate are sound; the two extractor
gaps (slug + input-values) and the "up-front per-component CSS for dense frames"
discipline are the actionable follow-ups for v2.3.
