# Sun Day-5 — Fresh-session deep audit + Yogesh smoke testing

> **Date:** Sun 2026-06-07 · **Mode:** Audit-then-smoke · **Agents:** fresh sessions Sun AM, on-call Sun PM.

## Sun timeline (locked Sat 22:00 IST after 28th reality-check)

| Window      | Activity                                                                    | Owner  |
| ----------- | --------------------------------------------------------------------------- | ------ |
| 09:00-12:00 | **FRESH BE+1 session** — 4-bucket deep audit with execution traces required | BE+1   |
| 12:00-15:00 | **FRESH MAIN session** — 3-bucket audit + write 4 missing runbooks          | MAIN   |
| 15:00-19:00 | Yogesh manual MVP smoke testing on verified foundation                      | Yogesh |
| 19:00-21:00 | Sun EOD + Mon launch final go/no-go decision                                | Yogesh |

## Why fresh sessions

Sat ~22:00 IST 28th reality-check: both audit PRs (#242 BE + #243 MAIN) presented as comprehensive when actual work was ~30 min BE + ~15 min MAIN with 6+ buckets deferred. Broad-scope briefs trigger surface-level shortcuts. Fix: tight 3-4 bucket scope per fresh session + execution traces mandatory.

## BE+1 Sun AM (09:00-12:00) — 4 buckets

Yogesh will paste a tight brief Sun 09:00. Expected scope:

1. HMAC audit log chain integrity (`scripts/verify-audit-chain.ts` run + result captured)
2. RBAC endpoint guard verification (`@Roles(...)` decorator coverage matrix across all state-changing endpoints)
3. Cross-site cookie persistence (Cloudflare Pages → Render API with `BETTER_AUTH_COOKIE_DOMAIN` set correctly)
4. Render env vars match `process.env.*` source list (Bucket 1.1 carryover from Sat MAIN audit)

Each bucket → execution trace + PASS/FAIL verdict in `docs/pilot-prep/2026-06-07-sun-am-be-audit.md`.

## MAIN Sun PM (12:00-15:00) — 3 buckets + 4 runbooks

1. Free-tier quota baseline (Bucket 6 carryover) — 6 dashboards via Yogesh-paired session
2. Observability verification (Bucket 8 carryover) — OTel trace ingestion + Better Stack + Slack alert dry-run
3. Backup + DR (Bucket 9 carryover) — verify latest weekly-backup ran + document restore procedure

Plus write 4 missing runbooks (P1 cleanup from Sat audit):

- `docs/runbooks/db-migration-rollback.md`
- `docs/runbooks/env-reset-secret-rotation.md`
- `docs/runbooks/magic-link-debug.md`
- `docs/runbooks/backup-restore.md`

Result → `docs/pilot-prep/2026-06-07-sun-pm-main-audit.md`.

## Yogesh smoke testing posture (15:00-19:00)

- **Yogesh leads.** Drive through onboarding flow + happy paths + admin flows. No agent autonomous polish work in this window.
- **Agents respond to bugs only.** If Yogesh reports a bug or blocker → fix-first workflow. Otherwise silent.
- **No proactive PRs from agents Sun afternoon.** EOD reports OK. Memory file updates if Sun discovery surfaces a new pattern.

## Smoke flows to exercise

### Onboarding (P0 for Mon)

1. Magic-link sign-in via Apps Script bridge → confirm email arrives in `yogesh.mohite@iksula.com` inbox within ~30s
2. Click link → verify F07 verify page renders + session establishes
3. First-time onboarding modal → name + avatar + preferences
4. F08 Home landing → project switcher defaulting to Iksula Returns (RET)

### Daily-use happy paths (P1)

1. F14 Requirements → see seeded RET-### data
2. F16a Test Cases list → drill to F16b detail → run F16c
3. F19 Run Console → trigger a run → F20 Run Results
4. F21 Defects Hub → drill to F22 Defect Detail
5. F23 Reports Studio → load a saved report
6. F25 Executive Dashboard → verify KPI tiles

### Admin flows (P1)

1. F26 Agents page → verify 3 agent cards (Composer / Curator / Sherlock) render
2. F26m1 LLM Provider Setup modal → fresh setup flow + edit existing flow
3. F28m1 LLM Provider Config modal → config flow
4. F27 Users & Roles page → 8-user roster
5. F27m1 Invite User modal → exercise the form (do not actually send invites Sun)
6. F28 Settings & Audit page → review audit log chain visualization

## Fix-first workflow (if P0 surfaces)

1. **Identify** — Yogesh triages: P0 (Mon-blocker) vs P1 (Mon-tolerable) vs P2 (post-pilot)
2. **Route**:
   - P0 UI bug → FE+1 chat
   - P0 backend bug → BE+1 chat
   - P0 infra/deploy → MAIN chat
3. **Workflow** — branch from main → fix → flat-base PR → Rule 13 visual gate → squash-merge
4. **Verify** — Yogesh confirms fix on live URL after Cloudflare/Render auto-deploy (~2-5 min)

## P1+P2 disposition

- **P1:** file in `docs/pilot/sun-smoke-findings.md` (create if needed). Decide Mon AM whether to fix before pilot or defer to Day-29.
- **P2:** add to `docs/followups.md` for Day-29+ work.

## Quota watchpoints

- **Neon CU-hr** — was 87/100 Wed; Apps Script bridge deploy + Render activity added ~1-3 CU-hr Sat. If approaches 95/100 Sun → throttle backend smoke testing (skip repeated NFR runs).
- **Apps Script bridge** — only 1 email needed Sun (sign-in self-test). Quota 1,500/day, untouched headroom.

## Sun 19:00 EOD — Mon launch go/no-go gate

**Mon Jun 8 unconditional GREEN requires ALL of:**

1. ✅ BE+1 Sun AM fresh audit returns GREEN on all 4 buckets (HMAC chain, RBAC guards, cookie persistence, env vars)
2. ✅ MAIN Sun PM fresh audit returns GREEN on all 3 buckets (quota, observability, backup/DR)
3. ✅ All 4 missing runbooks written + landed
4. ✅ Yogesh smoke testing surfaced 0 P0 bugs (P1 with fix plan acceptable)

If any gate FAILS → file `docs/pilot/sun-blockers.md` Sun 21:00 + decide Mon AM whether to delay pilot 24h.

## Stand-down trigger

If all 4 gates PASS by 19:00 IST Sun → Mon Jun 8 launch confirmed unconditional GREEN. Stand-down 21:00 IST Sun. Mon brief activates at 08:00 IST Mon per `2026-06-08-mon-pilot-launch.md`.

---

_Authored Sat Day-3+4 2026-06-06 evening. Sun is Yogesh-led; agents reactive only._
