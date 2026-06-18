# BINDING RULE — Verify a constraint's EXACT scope before recommending an expensive workaround

**Type:** feedback · **Filed:** Thu 2026-06-18 (~3 PM IST) · **Trigger:** Yogesh's "why Supabase?" question on my (MAIN's) Supabase hot-standby plan (#285) → re-reading Neon docs revealed the Neon Free 100 CU-hr cap is **per project**, not per account, and Neon Free allows ~100 projects per org. **Path C = a 2nd Neon project (`qa-nexus-2`) is $0 + ~1 hr**, vs the Supabase migration's 3-4 hr.

## Rule

When an external constraint blocks your plan (a quota, a rate limit, a permission, a feature-gate, a tier cutoff), **verify the constraint's EXACT scope** before recommending an expensive workaround. The cap may be **narrower than assumed** — per-project vs per-account, per-region vs global, per-resource vs per-tier, per-call vs per-day. The cheap fix often lives in the unread next paragraph of the vendor's own docs.

**The discipline:** before proposing a workaround that costs >1 hr or introduces a new dependency, write down (a) the exact constraint as quoted from primary docs, (b) the scope you're assuming, (c) one explicit cheaper alternative within the same vendor. If you can't, the workaround is premature.

## Why this exists (the case)

Thu 2026-06-18 ~3 PM IST. The Neon Free Postgres for QA Nexus had auto-suspended on a quota cap — the **single remaining gate on the Yogesh deep test** (dashboard §10.3). My recommendation: stand up a **Supabase Free hot-standby** as a ~5-minute failover, plan = `docs/plans/supabase-hot-standby-setup.md` (PR #285), execution ~3-4 hr (sign-up + migrate + seed + flip Render env). The plan was sound — Supabase Free supports pgvector, the Prisma datasource was already two-URL-ready, and the failover restored DB access without waiting for Neon's Jul 1 auto-reset.

But it was **the wrong primary fix** for the specific constraint at hand. Yogesh's question — "why Supabase?" — was the prompt to re-read the constraint. The Neon Free terms specify the **100 CU-hr/month compute cap is per PROJECT**, and Neon Free permits ~100 projects per organization. **A second Neon project (`qa-nexus-2`) in the same org, same region, same `gh auth` identity, with the migrations replayed + seed re-run, is $0, ~1 hr, and uses the same vendor + same Prisma datasource.** Path C — qa-nexus-2 active tonight, qa-nexus auto-resumes Jul 1, then switch back and keep qa-nexus-2 as a same-vendor hot-standby — gives us **what Supabase would have given us, cheaper, with one fewer vendor in the topology.**

The expensive workaround was not wrong — Supabase Free is genuinely a free hot-standby. It was **premature**: I jumped to the cross-vendor migration without first verifying the cap's scope inside the existing vendor. The 3-4 hr cost was the cost of the assumed scope, not the actual scope.

## How to apply

1. **When a vendor constraint bites,** quote the exact constraint from the vendor's primary docs (not from memory, not from a Stack Overflow paraphrase). Pin the URL + the section.
2. **Write the assumed scope explicitly** — "I am assuming this cap applies to \_\_\_ (per-account / per-project / per-region / per-call / per-day)." The act of writing it down often surfaces the wrong assumption.
3. **Look for the cheaper same-vendor alternative FIRST.** Multi-project, multi-region, multi-resource within the same account is almost always cheaper than cross-vendor migration.
4. **Estimate both costs honestly** — cheap same-vendor path (X minutes) vs expensive cross-vendor workaround (Y hours). If the cheap path doesn't exist, say so explicitly + cite the doc that rules it out.
5. **Surface the alternatives to the user** rather than picking the expensive one silently (Rule 11). My #285 Supabase plan failed this test — it presented a workaround without naming the same-vendor option.
6. **Apply to every blocker class** — quotas (RPD/CU-hr/storage), rate limits, feature gates, region availability, account-scoped caps. The rule generalizes; it's not Neon-specific.

## Cross-references

- `feedback_stale_deploy_diagnosis_pattern.md` (41st RC) — sibling: "is this stale-deploy?" gets asked FIRST in FE triage. Same shape: ask the cheap question before the expensive investigation.
- `feedback_metadata_audit_reveals_artifact_issues.md` — sibling pattern: a metadata fix that needs invention is a signal of an integrity gap. Here, a workaround that needs cross-vendor migration is a signal that the constraint scope wasn't read.
- `feedback_independent_diagnosis_convergence.md` — counterpoint: when two agents converge on a root cause, trust the convergence. Here, only ONE plan (mine, Supabase) was on the table; Yogesh's "why?" was the second perspective that surfaced the alternative.
- `feedback_verify_api_paths_before_consumer_wiring.md` — sibling discipline of verify-before-prescribe against primary source (controller code → Zod). 49th-RC applies the same discipline to vendor constraints (vendor docs).
- `docs/plans/supabase-hot-standby-setup.md` (PR #285) — NOT obsolete; reframed as the **same-vendor-fails fallback**. Path C keeps it as a viable plan B.

## Ordinal note — Yogesh ruling Thu 2026-06-18 evening

**This is the canonical 49th RC** (Yogesh ruling Thu Jun 18 evening after the two-candidates surfacing). Sibling file `feedback_institutional_memory_survives_in_vcs.md` is the **50th RC** (institutional-memory-survives-in-VCS — same day, different lesson). Both files content-named per the metadata-audit precedent; the ordinal collision is **resolved**, not deferred. Full Phase-D 1-N reconciliation across all 50 still pending (see `feedback_metadata_audit_reveals_artifact_issues.md` "Numbering note").

_Authored Thu 2026-06-18. The constraint Yogesh's question surfaced wasn't a bug — it was a missing question I hadn't asked. Adding the question to the discipline so the next blocker class gets it for free._
