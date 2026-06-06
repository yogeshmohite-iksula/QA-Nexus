# Sun Day-5 — Yogesh smoke testing · agents on-call

> **Date:** Sun 2026-06-07 · **Mode:** Yogesh-driven smoke testing · **Agents:** on-call, reactive only.

## Posture

- **Yogesh leads.** Drive through onboarding flow + happy paths + admin flows. No agent autonomous polish work today.
- **Agents respond to bugs only.** If Yogesh reports a bug or blocker → fix-first workflow. Otherwise silent.
- **No proactive PRs from agents Sun.** EOD reports, optional. Memory file updates if Sun discovery surfaces a new pattern.

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

## Stand-down trigger

If no bugs surface by 18:00 IST Sun → close Sun without EOD report. Confidence holds for Mon Jun 8.

If 1+ P0 bugs surface and remain unresolved by 22:00 IST Sun → file `docs/pilot/sun-blockers.md` and decide Mon AM whether to delay pilot.

---

_Authored Sat Day-3+4 2026-06-06 evening. Sun is Yogesh-led; agents reactive only._
