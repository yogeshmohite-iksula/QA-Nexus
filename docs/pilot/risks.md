# Pilot risks register — M5 MVP launch Mon Jun 8

> Accepted-with-mitigation risks carried into the 8-user Iksula pilot. Each
> entry: the risk, why it's accepted, the mitigation, and the post-pilot owner.

## Accepted-with-mitigation risks

### R-001 — Client-side admin guard (BUG-003)

- **Risk:** `/admin/*` routes can briefly show admin UI to non-admin users before the client-side JS redirect fires (~100ms flash).
- **Why accepted:** Pilot is 8 trusted internal Iksula users (vetted team). Risk surface is the known team, not external attackers.
- **Mitigation:** Pilot training doc instructs users to report any unexpected admin-UI exposure. Server-side enforcement scheduled for MS0-T021 (M6 scope, ~6 weeks post-pilot).
- **Owner:** BE+1 (post-pilot, M6).

_(Add more as they surface across Day 1-4.)_

---

_Established Day-1 2026-06-02 per Yogesh ruling on BUG-003. Reviewed at the Day-4 Go/No-Go gate (`docs/pilot-prep/2026-06-05-day-4-readiness.md`)._
