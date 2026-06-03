# Pilot risks register — M5 MVP launch Mon Jun 8

> Accepted-with-mitigation risks carried into the 8-user Iksula pilot. Each
> entry: the risk, why it's accepted, the mitigation, and the post-pilot owner.

## Accepted-with-mitigation risks

### R-001 — Client-side admin guard (BUG-003)

- **Risk:** `/admin/*` routes can briefly show admin UI to non-admin users before the client-side JS redirect fires (~100ms flash).
- **Why accepted:** Pilot is 8 trusted internal Iksula users (vetted team). Risk surface is the known team, not external attackers.
- **Mitigation:** Pilot training doc instructs users to report any unexpected admin-UI exposure. Server-side enforcement scheduled for MS0-T021 (M6 scope, ~6 weeks post-pilot).
- **Owner:** BE+1 (post-pilot, M6).

### R-002 — Sherlock A4 RCA latency over gate (Day-2 baseline)

- **Risk:** BE+1 baseline measured Sherlock A4 p95 = **18.2s > 15s** gate (NFR-003). RCA kickoff feels slow for a daily-use tool.
- **Why accepted:** Pilot is internal QA team; A4 RCA is an async background action (202 + WS emit per ADR-019), not a blocking page-load. Sub-20s is tolerable for the 8-user pilot while the pipeline is optimized.
- **Mitigation:** **ADR-024 RATIFIED** (PR #225 merged `efeda2f`) — pilot-tier gate **<20s p95**, GA gate stays **<15s p95**. BE+1 owns Option B (agent pipeline parallelization) for GA optimization in M6.
- **Status:** ✅ **CLOSED-for-pilot (M5)** · ⏳ OPEN-for-GA (M6, <15s target per ADR-024 §Consequences).
- **Owner:** BE+1 (M6 GA optimization); risk accepted for pilot per Yogesh ratification Wed Day-2.

_(Add more as they surface across Day 1-4.)_

---

_Established Day-1 2026-06-02 per Yogesh ruling on BUG-003. R-002 added Day-2 2026-06-03. Reviewed at the Day-4 Go/No-Go gate (`docs/pilot-prep/2026-06-05-day-4-readiness.md`)._
