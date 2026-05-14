# Skill Audit Cadence

> Tracks when MAIN runs the skill alignment audit (`docs/audits/YYYY-MM-DD-skill-alignment-audit-day-N.md`) and when the next one is due.

## Cadence policy

- **Trigger:** post-milestone close ceremony (M0, M1, M2, M3, M4...) AND on-demand if drift is suspected
- **Effort:** ~30 min — inventory hooks, subagents, memory, MCP, frame inventory, deny block
- **Output:** dated audit file in `docs/audits/`

## History

| Date       | Trigger                | Audit file                                               | Notes                                                                                                                           |
| ---------- | ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-06 | Day-11 / M2 kickoff    | `docs/audits/2026-05-06-skill-alignment-audit-day-11.md` | 13 hooks; followup (ae) embedding-spec drift filed                                                                              |
| 2026-05-08 | Day-13 / post-M2 close | `docs/audits/2026-05-08-skill-alignment-audit-day-13.md` | 15 hooks; Hard Rule 15 codified; 64 compound learnings; 18 v2 frames                                                            |
| 2026-05-13 | Day-17 / post-M3 close | `docs/audits/2026-05-13-skill-alignment-audit.md`        | 16 hooks (+enforce-no-playwright-mcp); Hard Rule 14 amended + Rule 16 NEW; ~76 compound learnings; design rules imported (#134) |

## Next due

- **Date:** ~2026-05-16 (post-M4 close ceremony, Sat)
- **Trigger:** M4 close tag push
- **Owner:** MAIN

---

_Last updated: 2026-05-08 14:30 IST by MAIN (Day-13 audit run)._
