# `docs/plans/` — Execution view of the QA Nexus build

> **Last updated:** 2026-05-02 (Day 6 — initial scaffold)
> **Status:** Living. Updated at every milestone close.
> **Authority:** Plans **summarize** the binding specs. They never override them.

---

## Purpose

This folder is the **execution view** of QA Nexus. The binding specs (`QA Nexus/PRD/`,
`QA Nexus/ERD/`, `QA Nexus/PM1/`) describe **what** the product is and **why**. The plans
in here describe **how it is being delivered** — milestone-by-milestone status,
acceptance gate progress, drift items surfaced, risks tracked, dates revised.

Anyone joining the project mid-stream — Yogesh, Akshay, a future contributor, or a
fresh Claude Code session — should be able to read `00-project-overview.md` and
`01-pm1-execution-plan.md` and know **where we are right now** without having to
re-read 800 lines of binding spec.

---

## Conflict resolution

If a plan file disagrees with a binding spec, **the spec wins.**

The full priority chain (from `CLAUDE.md`):

```
PM1_PRD > PM1_ERD > M0_v8 > 01_SYSTEM > tech-project-forge skill
        > MCP suggestions > library defaults > docs/plans/*
```

Plans live below "library defaults" in this chain on purpose. They are the
_latest snapshot of intent_, not law. When a plan and a spec drift, file a
**drift item** (see `03-drift-checklist.md`) and recommend whichever side
should be amended — never silently fix one to match the other.

---

## Structure

```
docs/plans/
├── README.md                          ← you are here
├── PROMPT_TEMPLATE.md                 ← reusable plan-mode prompt (PM2 + future re-runs)
├── 00-project-overview.md             ← whole-project (PM1 → PM4) view
├── 01-pm1-execution-plan.md           ← PM1-specific (M0 → M6) execution plan
├── 02-milestones/                     ← per-milestone plans
│   ├── M0-setup-infra.md              ← CLOSED 2026-05-03 (15 PASS / 2 AUTO / 2 DEFERRED)
│   ├── M1-users-roles.md              ← IN PROGRESS (BE + FE branches active)
│   ├── M2-test-docs-kb.md             ← NOT STARTED
│   ├── M3-test-cases-ai.md            ← NOT STARTED
│   ├── M4-runs-defects-jira.md        ← NOT STARTED
│   ├── M5-automation-mvp-launch.md    ← NOT STARTED (pilot Day-0)
│   └── M6-reports-ga.md               ← NOT STARTED (GA target 2026-09-21)
├── 03-drift-checklist.md              ← generic Mn-close checklist template
└── 04-plan-vs-actual.md               ← living append-only log
```

---

## Cadence

- **Daily** — `../STATUS.md` snapshot (separate doc; not touched by this folder)
- **Per-milestone close** — update the relevant `02-milestones/Mn-*.md` to its final
  state (PASS/FAIL/AUTO/DEFERRED on every AC), append a new row to
  `04-plan-vs-actual.md`, and run the `03-drift-checklist.md` template
- **Per-PM close** — update `00-project-overview.md` and `01-pm1-execution-plan.md`
  with lessons learned and rebaseline the next-PM scope
- **Annually** — refresh `00-project-overview.md` against actual delivery

---

## Methodology (how to re-run this scaffold)

Reusable for PM2 plans (~3-5 weeks from M5 close) or any mid-PM re-plan. Full prompt
in `PROMPT_TEMPLATE.md`. Headline shape:

1. **Phase 1 — Discovery (~30 min, plan mode):** parallel Explore agents survey
   (a) canonical specs and (b) actual repo state. Output: drift items table +
   spec-vs-plan-scope mismatches.
2. **Phase 2 — Research (~45 min, plan mode):** WebSearch the 14 free-tier services
   - library versions to confirm 2026 currency. Findings surfaced as
     "Plan recommendation: consider X" notes — **never silently swap stack**.
3. **Phase 3 — Authoring (~3 hr):** 12 files in this folder, one pass. Each per-milestone
   file follows the same template (goal · tasks · ACs · deps · risks · notes · cross-refs).
4. **Phase 4 — Cross-link + commit (~30 min):** verify every relative path resolves,
   git add `docs/plans/`, single commit, push (CHANGELOG-guard auto-passes since
   `docs/` is excluded).

---

## Conventions

- **AC evidence format** — `✅ PASS` / `⏸ DEFERRED` / `⏳ AUTO (cron/external)` / `❌ FAIL`
  with one-line evidence sub-bullet (commit SHA, file path, or run URL).
- **Cross-references** — relative paths from `docs/plans/`, e.g.
  `../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` (binding) or `../audits/code-audit.md` (sibling).
- **Drift surfacing** — never silently "fix" a spec disagreement. File it under
  the milestone's "Drift items" section, recommend a path forward, and require
  Yogesh's explicit approval to amend the binding spec.
- **Living-doc protocol** — for files that are updated repeatedly (this README,
  `04-plan-vs-actual.md`, the per-milestone plans), use a `Revision history`
  table at the top + dated snapshots below. Modeled after
  `../audits/skill-alignment-audit.md`.

---

## Cross-references

- Project-level binding spec: `../../QA Nexus/PRD/PRD.md` (v2.10)
- Project-level binding ERD: `../../QA Nexus/ERD/ERD.md` (v2.6)
- Project roadmap: `../../QA Nexus/PROJECT_ROADMAP.md` (v1.1, 2026-04-22)
- PM1 binding product spec: `../../QA Nexus/PM1/PM1_PRD/PM1_PRD.md` (v8.1)
- PM1 binding engineering spec: `../../QA Nexus/PM1/PM1_ERD/PM1_ERD.md` (v2.1)
- Daily status: `../STATUS.md`
- Changelog: `../CHANGELOG.md`
- Followups: `../followups.md`
- Audits: `../audits/` (skill-alignment, code, AC dry-runs)
- ADRs: `../architecture/`
- EOD reports: `../eod-reports/`
