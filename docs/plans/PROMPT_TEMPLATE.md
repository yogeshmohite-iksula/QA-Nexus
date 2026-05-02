# Plan-mode prompt template — reusable

Reusable prompt for handing a plan-authoring task to MAIN (or any Claude Code chat with full repo context). Saves Yogesh from re-typing the structure each time a new plan-mode activity comes up.

---

## When to use this template

Use this template whenever you want to author a structured plan that summarizes binding specs, identifies drift, and produces a tracking artifact. Examples:

- **First-time setup** — scaffolding `docs/plans/` from scratch (the original use case, May 2026)
- **PM2 plan kickoff** — once PM1 closes (~3-5 weeks), re-run for PM2's milestone block
- **Mid-PM milestone re-plan** — when a milestone closes and the next one needs re-planning with lessons learned
- **Annual replan** — after a year of build, refresh `00-project-overview.md` against actual delivery
- **Acquisition / pivot** — if scope changes materially, redo plans with the new direction

Do NOT use this for:

- Quick task lists (use TodoWrite or a chat-only ad-hoc plan)
- Spec changes (those go in PRD / ERD / milestone files directly with version bumps)
- Code changes (this template is doc-only)

---

## How to use

1. Switch the receiving chat to **Plan mode** (Claude Code: `Shift+Tab` or `/plan`)
2. Adjust the 5 PARAMETERS at the top of the template below for your scenario
3. Paste the entire prompt as one message
4. Wait for the chat to complete Phase 1 (Discovery) and report back BEFORE proceeding — drift discovery is critical
5. After Phase 4 (Commit), review the output files for accuracy
6. Update `docs/plans/04-plan-vs-actual.md` at the next milestone close

---

## Template

The template has 5 parameters at the top that you customize per use:

```
PARAMETER 1 — OUTPUT FOLDER:
  e.g., docs/plans/         (first-time scaffold — RECOMMENDED PATH)
  e.g., docs/plans/pm2/     (PM2 plans)
  e.g., docs/plans/refresh-2026-12/  (annual replan)

PARAMETER 2 — SCOPE NAME:
  e.g., "PM1 (M0–M5)"       (first-time scaffold)
  e.g., "PM2 (M6–M11)"      (PM2 plans)
  e.g., "M2 only"            (single-milestone re-plan)

PARAMETER 3 — PHASE 1 READING LIST:
  Update with the canonical specs that govern THIS scope.
  Always include: PRD, ERD, ROADMAP, MILESTONE_REGISTRY, brainstorm,
                  current actual state (CHANGELOG + recent EOD reports + audits)
  Add per-PM:     PM{N}_PRD, PM{N}_ERD, all PM{N} milestone files

PARAMETER 4 — PHASE 2 RESEARCH TOPICS:
  Web search topics where 2024/2025 knowledge could mislead.
  Refresh based on the time of replan.

PARAMETER 5 — PHASE 3 OUTPUT FILES:
  Adjust the file list for the scope.
  First-time scaffold creates ALL 11 files.
  Single-milestone re-plan only creates 1 file.
```

---

## Full prompt body (paste this after parameter customization)

```
Plan-mode activity. Standing down from current work. New scope:
build out [PARAMETER 1: OUTPUT FOLDER]. ~4-5 hrs estimated for full
scaffold; ~30-60 min for single-milestone re-plan. Doc-only — NO code
changes. Use Plan mode if available; otherwise sequential authoring.

OUTPUT FOLDER: [PARAMETER 1]

OUTPUT FILES (in this order, Phase 3):
[PARAMETER 5: List the files to create]

PHASE 1 — Discovery (~30-60 min)

Read these canonical specs in this order:
[PARAMETER 3: Reading list — at minimum:]
- QA Nexus/PRD/PRD.md
- QA Nexus/ERD/ERD.md
- QA Nexus/Brainstorm.md
- QA Nexus/project_analysis.md
- QA Nexus/PROJECT_ROADMAP.md
- QA Nexus/MILESTONE_REGISTRY.md
- (Add per-PM specs)
- docs/CHANGELOG.md
- docs/eod-reports/*.md (recent ones for current state)
- docs/audits/*.md (most recent acceptance audits)
- docs/architecture/adr-*.md

While reading, build an internal map of:
- Milestone scope (what each Mn delivers)
- Milestone dependencies (M0 → M1 → M2, etc.)
- Acceptance criteria (already crisp in milestone files)
- Tasks per milestone (T### list)
- Free-tier constraints (Hard Rule 1 — $0/month)
- Tech stack drift from canonical

Identify and surface (do NOT silently fix):
- Drift between PRD and current actual state
- Drift between milestone files and CHANGELOG
- Internal contradictions (e.g., PM1_PRD says X, M2 milestone says Y)
- Gaps where no milestone owns a binding requirement
- Anything that has changed in the past 7 days that hasn't propagated

Output of Phase 1: a short analysis at .discovery-notes.md
(scratchpad in the OUTPUT FOLDER, removed before commit). Send a brief
summary to chat: "Discovery done. Found N drift items + M open
questions." DO NOT proceed to Phase 2 if critical drift is found —
flag it back to Yogesh first.

PHASE 2 — Research (~30-60 min)

Web search ANY topic where prior-year knowledge could mislead current
planning. Specifically check current state for:

[PARAMETER 4: Research topics — examples:]
- Render Free tier limits (CPU/RAM/dyno hours, build time, regions,
  log stream forwarding rules — note: Org+ for stdout forwarding)
- Neon Free tier (storage cap, scale-to-zero, branch limit, latency)
- Cloudflare R2 Free tier (storage, reads, writes, regions)
- Groq API (free-tier RPD/RPM, model availability, context windows)
- Gemini API (free-tier RPD, model availability)
- Resend (free tier, sandbox sender behavior)
- UptimeRobot (free tier limits)
- Better Stack (OpenTelemetry source ingest paths, free-tier alert
  rule limit + retention)
- BetterAuth (current auth pattern, magic-link, Postgres adapter)
- @xenova/transformers (latest models, ONNX availability)
- Prisma + pgvector (HNSW best practices, raw SQL split pattern)
- Frontend libs (Next.js / React / Tailwind / shadcn-ui — current
  stable state)
- NestJS (current state, OTel integration)
- (Add domain-specific topics for the scope)

For each topic, ONE WebSearch is usually enough. If results are
ambiguous, fetch the official docs page via WebFetch. Capture findings
in .research-notes.md (scratchpad, removed before commit).

DO NOT change tech stack decisions silently — if research shows a
better choice, surface it as a "Plan recommendation: consider X"
note in the plan file, NOT a unilateral swap.

PHASE 3 — Authoring (~2-3 hrs for full scaffold)

For EACH file in OUTPUT FILES, write per the spec below. Each file
should be self-contained but cross-linked.

(a) README.md — ~80 lines

Sections:
- Purpose (Plans = execution view, NOT binding specs; specs win in
  conflict)
- Folder structure with one-line description per file
- Cadence — when to update each file (one-time / per-milestone)
- How to use during development (run drift checklist at every Mn close)
- Cross-references to canonical specs
- Last updated banner

(b) 00-project-overview.md — ~150-200 lines

Whole-project view from PRD + ROADMAP. Sections:
- 1-paragraph elevator pitch
- Project phases with dates and 1-line scope each
- Tech stack at a glance (current locked stack)
- Iksula data canon (8-user pilot team, anchor project, ID patterns)
- Free-tier compliance ($0/month; Hard Rule 1)
- Key decisions log (top 10 architectural decisions to date)
- Cross-references

(c) 01-{phase}-execution-plan.md — ~250-350 lines

Phase-specific. Sections:
- Scope summary (IN vs deferred)
- Milestone timeline with target close dates
- Status tracker table (one row per Mn, columns: scope / target /
  actual / status / notes)
- Acceptance criteria summary (count + current PASS rate)
- Risks and dependencies (3-5 bullet risks, dependency graph)
- Launch readiness criteria
- Cross-references

(d-i) 02-milestones/M{N}-*.md — ~150-250 lines each

Per-milestone plan. NOT a copy of the binding spec — execution view.
Sections:
- 1-paragraph milestone goal
- Task list (T### with one-line description, owner, status)
- Acceptance criteria checklist (PASS/FAIL/AUTO/DEFERRED, evidence)
- Dependencies (what this milestone needs from prior milestones)
- Risks identified at start vs current state
- Notes (what changed during the milestone)
- Cross-references

For closed/in-progress milestones: pre-fill with current status.
For not-started milestones: pre-fill with task + AC list from spec;
status = NOT STARTED.

(j) 03-drift-checklist.md — ~80 lines

Generic checklist used at every Mn close. Sections:
- "Did we deliver every task in the plan?"
- "What got cut, deferred, or expanded mid-flight?"
- "Why?" (drives one-line entry in 04-plan-vs-actual.md)
- "Should the next milestone plan be revised?"
- "Tech stack drift since the last close?"
- "Free-tier quota burn rate — on track?"
- "New followups filed?"
- "Any ADRs needed retroactively?"

(k) 04-plan-vs-actual.md — ~50 lines initial

Living log, append-only. Sections:
- Header (purpose, format)
- Per-milestone baseline entries: planned vs actual
- Empty placeholder rows for upcoming milestones

PHASE 4 — Cross-link + commit (~30 min)

- Verify all cross-references point at correct files (relative paths)
- Delete .discovery-notes.md and .research-notes.md scratchpads
- git add [OUTPUT FOLDER]
- Commit message format: "docs(plans): scaffold [SCOPE NAME] plans"
  OR "docs(plans): refresh [SCOPE NAME] post-{milestone} close"
- Push (CHANGELOG-guard fires; add an [Unreleased] entry if needed)

DELIVERABLES TO REPORT BACK
1. List of files created (count + total lines)
2. List of drift items found in Phase 1 (if any) and how each was
   handled (flagged to Yogesh, fixed in plan, or noted for later)
3. List of research findings in Phase 2 that affected the plan
4. Commit SHA + push result

If any phase blocks (e.g., critical drift, ambiguous spec), pause
and ping Yogesh — DO NOT make unilateral spec changes. Plans
summarize specs; specs are authoritative.
```

---

## First-use parameter values (May 2026 scaffold)

Reference for the original use of this template:

```
PARAMETER 1: docs/plans/
PARAMETER 2: PM1 (M0–M5)
PARAMETER 3: (full canonical reading list — see paste message used 2026-05-02)
PARAMETER 4: 14 research topics — Render / Neon / R2 / Groq / Gemini /
             Resend / UptimeRobot / Better Stack / BetterAuth /
             @xenova/transformers / Prisma+pgvector / Next.js+React+
             Tailwind / NestJS / shadcn/ui
PARAMETER 5: 11 files (README, 00, 01, 02/M0-M5, 03, 04)
```

---

## Common reuse scenarios

### Scenario A — PM2 plan kickoff (after PM1 closes, ~July 2026)

```
PARAMETER 1: docs/plans/pm2/
PARAMETER 2: PM2 (M6–M11)
PARAMETER 3: PM2_PRD, PM2_ERD, all PM2 milestone files + project-level
             roadmap + PM1 lessons-learned (latest plan-vs-actual)
PARAMETER 4: Refresh tech stack research for what's changed in 2-3
             months. Add PM2-specific topics (e.g., new agent types,
             Jira API current state, CI/CD platform if migrated)
PARAMETER 5: Same 11-file structure but in pm2/ subfolder
```

### Scenario B — Single-milestone re-plan (e.g., M3 after M2 closes)

```
PARAMETER 1: docs/plans/
PARAMETER 2: M3 only — refresh after M2 close
PARAMETER 3: M2 close report + M3 binding spec + M3 plan file (current)
PARAMETER 4: Targeted research on M3-specific topics (e.g., LLM gateway
             current state, retrieval embedding model evolution)
PARAMETER 5: 1 file — overwrite docs/plans/02-milestones/M3-*.md +
             append entry to 04-plan-vs-actual.md
```

### Scenario C — Annual replan (mid-2027 if project still going)

```
PARAMETER 1: docs/plans/refresh-2027-05/
PARAMETER 2: Full project replan — capture year-1 lessons
PARAMETER 3: All canonical specs + every plan-vs-actual entry from
             year 1 + every milestone close report
PARAMETER 4: Full tech stack research refresh (1 year of platform
             changes can be substantial)
PARAMETER 5: Same 11-file structure in refresh-2027-05/ subfolder.
             Original docs/plans/ stays as the year-1 archive.
```

---

## Cross-references

- `docs/plans/README.md` — created Day 6 (2026-05-02) by MAIN's plan-mode activity
- `docs/plans/00-project-overview.md` — first authored Day 6
- `QA Nexus/PRD/PRD.md` — project-level PRD
- `QA Nexus/PM1/PM1_PRD/PM1_PRD.md` — binding PM1 spec (v8.1)
- `CLAUDE.md` — communication preferences and binding rules

---

## Maintenance

- Update PARAMETER 4 (research topics) every 6 months — platform documentation evolves
- Update common reuse scenarios as new patterns emerge
- If a phase consistently blocks, refine the phase instructions
- Keep the file under 400 lines — if it grows past, split into TEMPLATE + EXAMPLES
