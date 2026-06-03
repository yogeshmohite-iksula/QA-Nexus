# Day-2 Build Plan — Wed Jun 3, 2026 (SKELETON)

> 5-day pilot push, Day 2 of 5. Fills in as the day unfolds. Pre-staged Day-1.
> Depends on: F26 v2 design shipped Day-1 (Yogesh Claude Design session).

## FE+1

- [ ] **F26 Agents port** — v2 HTML/bundle → React via skill v2.2 7-step workflow. Pre-Step-3 sanity check if bundle present (ADR-022 §5.9). _[carry: started Day-1? design ready?]_
- [ ] Mobile RWD verification at 320px (Hard Rule 12)
- [ ] Visual gate at 320 + 1440 (Hard Rule 13)

## BE+1

- [ ] **Perf baseline** — capture p50/p95 latency for the top API routes (reports, defects, runs, RCA kickoff) under Render Free cold + warm
- [ ] Neon CU-hr projection for 8-user × 12hr/day pilot load
- [ ] AC042 smoke harness — bake permanent `--limit`/`--debug` flag (M6 carry from close retro)

## MAIN

- [ ] Shadow F26 Step 3 spec approval + Step 6 visual gate
- [ ] Draft pilot-training outline (8-user onboarding; F08 Home → F14 Requirements → F19 Run Console → F21 Defects happy path)
- [ ] Day-2 status report at EOD

## Yogesh

- [ ] Approve F26 Step 3 + Step 6
- [ ] F27 v2 design (if not finished Day-1)

## Risks

- _[fill as they surface]_

---

_Pre-staged Day-1 2026-06-02. Becomes a real EOD-style report Day-2._
