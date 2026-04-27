# Tech-project-forge Skill ROI Analysis — Day 1

**Question:** Is the Tech-project-forge-skill v1.4 actually paying back the investment?
**Audience:** Yogesh's Iksula leadership story (decision: keep skill for PM2/3/4 or drop)
**Method:** Two-column compare of with-skill (actual today) vs without-skill (estimated hand-built equivalent), rolled up over the 90-day PM1 build.

---

## 1. What the skill provided OUT OF THE BOX

These artifacts arrived prebuilt the moment the skill was installed. We didn't write them — we adopted them (with minor patches where needed).

| Artifact                                                                                                                                  | What it is                                                                                                    | Build-from-scratch estimate (hand-coded)                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **`block-dangerous.sh`** template                                                                                                         | Pre-tool-use Bash hook that blocks rm -rf, force push, DROP TABLE, etc.                                       | ~1 hr (pattern design + STDIN parsing + jq integration + test scenarios)                |
| **`audit-log.sh`** template                                                                                                               | Post-tool-use hook that JSONL-logs every tool call                                                            | ~1 hr                                                                                   |
| **`inject-memory.sh`** template                                                                                                           | Pre-tool-use hook that auto-prepends repo memory to every tool call                                           | ~1.5 hr (Connelly + Huryn pattern, hard-guard against `${...}`, memory.md index design) |
| **`update-docs-check.sh`** template                                                                                                       | Stop hook that nudges doc updates when src changed without CHANGELOG bump                                     | ~1.5 hr (git diff parsing + path filters + non-blocking nudge UX)                       |
| **`check-secrets.sh`** template                                                                                                           | Pre-commit gitleaks wrapper                                                                                   | ~1 hr                                                                                   |
| **`pre-push.sh`** template                                                                                                                | Git hook for CHANGELOG-aware push gate                                                                        | ~1 hr                                                                                   |
| **`changelog-updater` subagent**                                                                                                          | Curated agent definition with 4-tool allow list, model=sonnet, mission + process + hard rules + output format | ~1.5 hr per agent (3 = ~4.5 hr)                                                         |
| **`frontend-tester` subagent**                                                                                                            | Same shape, conditional on HAS_FRONTEND                                                                       | (counted above)                                                                         |
| **`retro-agent` subagent**                                                                                                                | Same shape, model=opus for deeper reasoning                                                                   | (counted above)                                                                         |
| **`/commit` slash command** template                                                                                                      | Stage-classify-commit workflow with conventional-commits typing                                               | ~1 hr                                                                                   |
| **`/commit-push-pr` template**                                                                                                            | Composes /commit + push + auto PR title/body via gh                                                           | ~1.5 hr                                                                                 |
| **`/compound-learnings` template**                                                                                                        | End-of-feature memory append workflow                                                                         | ~1 hr                                                                                   |
| **`/reorganize-memory` template**                                                                                                         | Huryn's 7 cleanup rules for memory hygiene                                                                    | ~1.5 hr                                                                                 |
| **Memory system seed** (memory.md + general.md + 4 domain/tools)                                                                          | Bootstrapped repo-layer memory architecture with ${PLACEHOLDER} substitution discipline                       | ~3 hr (file structure + index pattern + hard-guard pattern + Connelly/Huryn synthesis)  |
| **Settings.json template**                                                                                                                | Hooks block + 180+ allow rules + deny block + subAgents config + model selection                              | ~3 hr (curating the full allowlist alone is non-trivial; we got 180 patterns for free)  |
| **eval.json (32 binary assertions)**                                                                                                      | Self-validating skill quality bar with conditional N/A logic                                                  | ~3 hr (designing the 32 assertions + testing each + writing the conditional skip rules) |
| **6 Claude Code plugin recommendations** (context-mode, superpowers, code-simplifier, feature-dev, compound-engineering, commit-commands) | Curated plugin install list with order + fallback templates                                                   | ~2 hr research + selection                                                              |
| **GitHub Actions CI templates** (nextjs-ci.yml, node-ci.yml, python-ci.yml)                                                               | Stack-specific lint+typecheck+test+build matrices with pnpm cache                                             | ~3 hr per template (one used = ~3 hr saved)                                             |
| **MCP server config recommendations** (sequential-thinking + context7 + github + playwright + stack-specific)                             | Curated MCP install order with rationale                                                                      | ~1 hr                                                                                   |
| **Status line config + token-optimization guide**                                                                                         | ccstatusline integration + 7 token strategies + < 50% Ctx rule                                                | ~2 hr                                                                                   |
| **DESIGN.md awesome-design-md catalog (66+ brand systems)**                                                                               | Pre-curated design reference selection                                                                        | ~5 hr to curate from scratch                                                            |
| **CLAUDE.md 11-section template**                                                                                                         | Battle-tested IDE-context-loader format with @import discipline                                               | ~3 hr (we'd have invented our own version that's probably worse)                        |
| **PROJECT_SPEC.md template**                                                                                                              | 12-section Part A (product) + Part B (engineering) skeleton                                                   | ~2 hr                                                                                   |
| **Phase orchestration** (DISCOVER → PLAN → SETUP × 19 sub-steps → DX → VALIDATION → BUILD GUIDANCE)                                       | The choreography of "what to build, in what order, with what gates"                                           | ~10 hr (this is the hardest thing to design; the skill's biggest value)                 |

**Total OOB value (build-from-scratch):** **~50 hours of skilled engineering work**

---

## 2. What we ADDED on top of the skill (PM1-specific)

These are the artifacts the skill couldn't have known about because they require domain knowledge of PM1.

| Artifact                                                                                 | What it does                                                                                                                                               | Time spent today                                                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `enforce-design-tokens.sh`                                                               | Block non-whitelisted hex / Tailwind classes / MD3 tokens in apps/web                                                                                      | ~1 hr (Day 0)                                                                         |
| `enforce-pm1-stack.sh`                                                                   | Block ban-list deps + major-version drift on locked-deps.json                                                                                              | ~2 hr (Day 0 + T033 hardening)                                                        |
| `enforce-rwd.sh`                                                                         | Block fixed-pixel widths on apps/web layout containers                                                                                                     | ~45 min (FE chat P1.1)                                                                |
| `load-binding-context.sh`                                                                | Auto-prepend PM1 binding spec versions to every prompt                                                                                                     | ~30 min (Day 0)                                                                       |
| `report-token-savings.sh` + `cumulative-savings-report.sh`                               | Quantify memory ROI per session                                                                                                                            | ~1 hr (BE chat P1.11)                                                                 |
| `.claude/locked-deps.json`                                                               | Source of truth for major versions enforced by hooks                                                                                                       | ~10 min                                                                               |
| `.claude/memory/` content                                                                | 7 files seeded with PM1 blueprint values (8-user roster, locked stack, R1-R4 risks, RWD pattern, frame-port protocol, auth-surface decisions, Bug entries) | ~30 min populating (vs ~3 hr to design the architecture, which we got from the skill) |
| 4 path-filtered rules (`api`, `database`, `frontend`, `security`)                        | PM1 coding standards                                                                                                                                       | ~2 hr (BE + FE chats)                                                                 |
| 8 slash commands (5 main + 2 FE + 1 permission-triage)                                   | PM1 workflow shortcuts                                                                                                                                     | ~2 hr                                                                                 |
| 3 hooks-enforced PM1 hard rules (Rules 12 RWD + 13 visual gate + locked-deps T033)       | Codified review gates that aren't in the skill defaults                                                                                                    | ~1 hr                                                                                 |
| `docs/PROJECT_SPEC.md` content (PM1)                                                     | 12 sections filled with PM1 reality                                                                                                                        | ~2 hr (Day 0)                                                                         |
| `docs/ARCHITECTURE.md` content (PM1)                                                     | 10 sections including text-art topology + Backend layout                                                                                                   | ~25 min (P0.4)                                                                        |
| `docs/MILESTONES.md` content (PM1)                                                       | M0-M6 + 35 task breakdown for M0 + drift sync                                                                                                              | ~1 hr (Day 0 + P1.9)                                                                  |
| `docs/SECURITY.md` content (PM1)                                                         | Disclosure policy + per-provider rotation + IR timeline                                                                                                    | ~1 hr (BE chat P1.5)                                                                  |
| `docs/CHANGELOG.md` content                                                              | Retroactive `[Unreleased]` covering 12+ commits with SHAs and categorized entries                                                                          | ~15 min (P0.3)                                                                        |
| `docs/eod-reports/` convention + Day 0 + Day 1 backfills                                 | Build journal at day-level altitude                                                                                                                        | ~25 min (P1.10) + ~15 min (Day 1 EOD)                                                 |
| `docs/deploy/cloudflare-pages.md` runbook                                                | CF Pages-specific deploy procedure                                                                                                                         | ~30 min (Day 0 MS0-T010)                                                              |
| 3 GitHub Actions workflows (ci.yml, deploy.yml, memory-reorg.yml)                        | PM1-specific CI matrix + deploy automation                                                                                                                 | ~1.5 hr (BE chat P1.7)                                                                |
| `.gitleaks.toml` content (PM1 keys)                                                      | Custom rules for Groq/Gemini/Cloudflare/BetterAuth/Resend                                                                                                  | ~30 min (BE chat P1.5 + P1.14 followup)                                               |
| `.env.example` content (PM1 vars, 8 categories)                                          | 100 lines, source-URLs + provisioning task refs                                                                                                            | ~10 min (P0.5)                                                                        |
| `README.md` content (PM1)                                                                | Tech stack table + Quick Start + Roadmap + 8-user roster + 10 doc cross-refs                                                                               | ~20 min (P0.6)                                                                        |
| 3 subagent customizations (PM1-specific guidance + DI complications + locked Rules 1-13) | Adapted skill templates for PM1 reality                                                                                                                    | ~20 min (P1.2)                                                                        |
| 47-pattern permission allowlist consolidated to settings.json                            | Cross-worktree inheritance for the 3-chat workflow                                                                                                         | ~30 min (P1.12, including 31-screenshot triage)                                       |
| F06 + F06b + F06c React ports (3 frame ports)                                            | The actual product — Day 0 work                                                                                                                            | ~6 hr (Day 0)                                                                         |

**Total PM1-specific work today:** **~7 hours wall-clock + ~6 hr Day 0 overlap = ~10 hr distinct effort**
**Plus ~20 hr of Day 0 frame-port + scaffold work that pre-dates today.**

---

## 3. What we OVERRODE from the skill defaults

| Override                                                                                      | Why                                                                                                              | Time-cost                                                                              |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **`CLAUDE.md`** — wrote PM1-specific 13-rule version instead of skill's 11-section template   | PM1 has stricter binding-spec discipline + locked stack + 8-user roster that the skill template can't anticipate | 0 (saved the template's 3hr; spent ~3hr on PM1 version, net 0)                         |
| **Step 2.1 GitHub repo** — used existing `yogeshmohite-iksula/QA-Nexus`, NOT `gh repo create` | Repo was already provisioned; skill's `gh repo create` flow would have made a duplicate                          | -10 min saved                                                                          |
| **Husky** convention vs skill's `.githooks/`                                                  | JS-ecosystem standard; pnpm + husky handles this idiomatically                                                   | 0 (both work; we picked husky)                                                         |
| **3 hooks patched to read STDIN** (block-dangerous, audit-log, also inject-memory inherit)    | Skill's `$1` invocation pattern doesn't fire under Claude Code's actual hook contract                            | -30 min saved (caught the bug at Day 0; would have lost 1+ hr if discovered later)     |
| **commitlint extended** to allow `ops` type                                                   | Deployment commits deserve their own type; skill's default 11-type list doesn't include it                       | +10 min                                                                                |
| **Settings.local.json convention dropped** in favor of committed settings.json                | Solo-dev / 3-worktree pragmatism; 47 patterns inherited cross-worktree                                           | +20 min (Option A→B switch)                                                            |
| **Phase 4 — partial only** (no DESIGN.md selection from awesome-design-md)                    | We use `01_SYSTEM.md` which is more comprehensive than any DESIGN.md template                                    | -5 hr saved (would have been time spent customizing a generic DESIGN.md to PM1 anyway) |

**Net override cost: ~+30 min, saved ~6 hr.**

---

## 4. Time math — with skill vs without

### WITH skill (actual today)

| Phase                                                        | Time                       |
| ------------------------------------------------------------ | -------------------------- |
| Skill install (Day 0)                                        | 5 min                      |
| Phase 0 DISCOVER + PLAN (Day 0 morning)                      | 30 min                     |
| Phase 2 SETUP partial (Day 0 — hooks, MCPs, scaffold)        | ~3 hr                      |
| Day 0 frame-port work (F06, F06b, F06c) + CF Pages           | ~6 hr                      |
| Day 1 morning audit (read-only)                              | 1 hr                       |
| Day 1 P0 batch (memory + docs)                               | ~2 hr                      |
| Day 1 P1 main session (agents + commands + milestones + EOD) | ~1.5 hr                    |
| Day 1 BE chat (parallel)                                     | ~3 hr (overlapped with FE) |
| Day 1 FE chat (parallel)                                     | ~2 hr (overlapped with BE) |
| Day 1 hotfix recovery (P1.13-16 + P1.14b)                    | ~1 hr                      |
| Day 1 permission triage (P1.12)                              | ~30 min                    |
| Day 1 EOD coordination + reports                             | ~30 min                    |

**Total wall-clock Day 0 + Day 1: ~21 hr**
**Total effort hours (parallel chats counted separately): ~25 hr**

### WITHOUT skill (estimated, hand-build)

| Item                                                                   | Hand-build estimate                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Hand-build hooks system (5 hooks × 1-1.5 hr each)                      | ~6 hr                                                                |
| Hand-build memory system architecture                                  | ~4 hr                                                                |
| Hand-build slash command framework + 8 commands                        | ~4 hr                                                                |
| Hand-build subagent definitions (3 × 1.5 hr each)                      | ~4.5 hr                                                              |
| Hand-build eval.json framework (32 assertions)                         | ~3 hr                                                                |
| Hand-build security scaffold (gitleaks + check-secrets + SECURITY.md)  | ~3 hr                                                                |
| Hand-build CI workflows from scratch (no templates)                    | ~4 hr                                                                |
| Hand-build update-docs-check + audit-log + check-secrets hook patterns | ~3 hr                                                                |
| Hand-research + select 6 Claude Code plugins                           | ~2 hr                                                                |
| Hand-build CLAUDE.md template + figure out what 11 sections to include | ~3 hr                                                                |
| Hand-build PROJECT_SPEC.md 12-section template                         | ~2 hr                                                                |
| Phase orchestration design (in what order to do all of this)           | ~5 hr (this is the hardest part — figuring out the dependency graph) |
| Plus ALL the PM1-custom work we still did on top                       | ~10 hr                                                               |

**Total hand-build estimate: ~53 hr**

### Net savings Day 0 + Day 1

**~53 hr (hand-build) − ~25 hr (with skill) = ~28 hr saved in 2 days**
**= 3.5 working days at 8 hr/day**

---

## 5. Compounding savings projection (Days 2-90)

Each future session benefits from artifacts the skill brought:

| Compounding mechanism                                                                                                                 | Per-session saving                                                | Sessions remaining (est.) | 90-day total                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------- | ----------------------------------- |
| **47 permission patterns** (saves ~80% of prompts that would otherwise interrupt flow)                                                | ~15 min per session                                               | ~100 sessions             | ~25 hr                              |
| **5 PreToolUse hooks** (catch errors at edit time → less re-work)                                                                     | ~10 min per session avg (more for early sessions, less later)     | ~100                      | ~17 hr                              |
| **inject-memory.sh** (no need to re-paste binding context every session)                                                              | ~5 min per session                                                | ~100                      | ~8 hr                               |
| **3 subagents** (changelog-updater + frontend-tester + retro-agent — one-shot tasks that would otherwise be 15-30 min hand-jobs each) | ~3 invocations / week × 20 min                                    | ~13 weeks × 3             | ~13 hr                              |
| **/commit-push-pr automation** (skip manually crafting PR title/body each time)                                                       | ~5 min per PR                                                     | ~50 PRs over 90 days      | ~4 hr                               |
| **eval.json self-validation** (auto-detects when conformance regresses)                                                               | ~30 min per audit cycle (we'd have to manually inspect 28+ items) | ~6 audits                 | ~3 hr                               |
| **CI workflows** (already wired, no time to design)                                                                                   | ~0 (just runs)                                                    | n/a                       | 0 (already counted in Day 1 saving) |

**Compounding 90-day savings estimate: ~70 hr**

**Plus the Day 1 26-hour saving = ~96 total hours saved by skill across 90-day build.**

**At 8 hrs/day: ~12 working days saved.**

---

## 6. Verdict — IS THE SKILL WORTH IT?

### ✅ KEEP for PM2/3/4

**Justification (3 lines):**

1. **Day 1 saved ~28 hr (3.5 working days)** by providing the hooks/memory/subagents/slash-commands/eval scaffolding we'd otherwise have hand-built — and we still customized everything to PM1 specifics on top.
2. **90-day projected savings ~96 hr (12 working days)** through compounding effects (permission patterns reduce prompts, hooks catch errors at edit time, subagents replace one-shot manual work, /commit-push-pr eliminates per-PR boilerplate).
3. **Conformance hit 89% in one day** — the skill defines a clear quality bar (32 binary assertions in eval.json) that's the difference between "we have a project" and "we have a production-grade Claude Code project". Without the skill we'd never have known we needed those 32 things.

### Recommendations for PM2/3/4 reuse

- **PM2 (next quarter):** install the skill on Day 0, copy PM1's `.claude/memory/` + hooks + rules + commands + agents as the seed (saves another ~5 hr of customization). The skill provides the framework; we provide the PM2-specific content.
- **PM3/4 (year 2+):** consider contributing PM1's hardening patterns back to the skill as a v1.5 patch — specifically the `--force(\s|$|[^-])` regex fix (P1.13), the path-vs-regex gitleaks allowlist learning (P1.14), the apps/api ESLint v9 alignment pattern (P1.15), the visual-confirmation Rule 13, the RWD Rule 12, and the version-pin enforcement hook pattern (T033). All upstream-able.

### Caveats (for honest leadership story)

- **Skill is opinionated** — the choices it makes (Husky vs `.githooks/`, settings.json vs settings.local.json) require active overrides for some workflows. Budget 1-2 hr on Day 0 for friction with strong opinions you don't share.
- **Skill is single-session-design** — the parallel-chat / worktree workflow we used today isn't part of the skill's mental model. It worked but required hand-coordination (FE/BE chats halt, MAIN coordinates merges, hotfix triage when CI surfaces baseline issues). That's manual orchestration on top of the skill, not from it.
- **Skill is Day-0-shaped** — Phase 0 (DISCOVER) + Phase 1 (PLAN) + Phase 2 (SETUP) compress weeks of decisions into one session. Past Day 1, the skill mostly stops contributing — Days 2-90 are the user's job (with the artifacts the skill seeded). This is fine; just sets expectations.

---

## Cross-references

- Companion conformance audit: `docs/audits/2026-04-27-eod-skill-conformance-audit.md`
- Morning baseline audit: `docs/audits/2026-04-27-skill-alignment-audit.md`
- Permission triage audit: `docs/audits/2026-04-27-permission-triage.md`
- Day 1 EOD: `docs/eod-reports/2026-04-27-day-1.md`
- Skill repo: https://github.com/yogeshcodeshare/Tech-project-forge-skill (yogeshcodeshare's personal account; QA Nexus = corporate yogeshmohite-iksula)
- All 17 commits today: `git log --since='2026-04-27 00:00' --oneline`
