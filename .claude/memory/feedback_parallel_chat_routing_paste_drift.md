# feedback — parallel-chat routing paste drift (Day-22 retro candidate, 2026-05-19)

**Status:** **M5 retro candidate.** Failure mode of single-human × multi-window coordination. Observed 7 misroutes Day-22.

## TL;DR

When a single human (Yogesh) operates 3 chat windows in parallel (MAIN + BE+1 + FE+1) and pastes between them, **paste drift** occurs: text intended for one window gets pasted into another. Day-22 observed **7 misroutes** even with explicit destination labels at the top of every paste-target block (e.g., `╔══ PASTE TARGET: MAIN ══╗`).

This isn't a Yogesh-discipline issue; it's a **single-human × N-windows** failure mode. The destination label IS the right shape — it just can't 100% prevent muscle-memory paste into the wrong window.

## The 7 Day-22 misroutes (pattern)

(Anonymized; observed by MAIN as "incoming text that doesn't match my chat's state")

1. ADR-020 ratification context pasted into BE+1 chat (BE+1 had no idea what I was talking about; redirected to MAIN)
2. F22 spec.json validation question pasted into FE+1 chat (FE+1 didn't have the spec; redirected)
3. PR #178 merge-button confirmation pasted into MAIN (was intended for BE+1's review window)
4. BE+1 typecheck failure ping pasted into MAIN (was intended for BE+1 chat itself, but typed in the wrong window)
5. FE+1 F19 deferral message landed in BE+1 chat (redirected)
6. ADR-021 draft preview pasted into FE+1 chat (FE+1 doesn't yet need the report kinds list)
7. Day-22 EOD priority update pasted into BE+1 chat (intended for MAIN)

**Frequency:** 7 misroutes / ~150 pastes Day-22 ≈ 4.7% paste error rate. With 3 active windows the binomial expectation for "everything goes to right window" is `(1 - 0.047)^150 ≈ 0.0008` — i.e., ~99.92% chance of at least one misroute per day.

## Why the destination-label shape is correct but insufficient

The `╔══ PASTE TARGET: X ══╗` label works for **the next paste action**. It fails at:

- **Pre-loaded paste buffers** — Yogesh copies text → switches windows → pastes. The label gates the paste action, but at paste time the FOCUS is already in the wrong window. Visual signal arrives too late.
- **Quick-tab pastes** — Cmd-Tab + Cmd-V is a 200ms sequence. The label is parsed by Yogesh AFTER the paste lands (autoresume eye-track). 200ms < parse-then-redirect cycle.
- **Voice / hotkey workflow drift** — if Yogesh uses any non-visual paste trigger (text expander, macro, voice), the label is bypassed entirely.

## Proposed mitigations (cheap → expensive)

### Cheapest: window-color-coded titles

Set the chat-window title bar OR a top-of-window banner to a unique color per role (MAIN = teal, BE+1 = violet, FE+1 = info-blue per design canon). Color is parsed in <50ms vs the ~500ms it takes to read a text label. Bypasses muscle-memory paste cost.

**Implementation:** Claude Code CLI configurable per-session OR an OS-level window-rename script.

### Medium: paste-target validation in chat session

Each chat session validates incoming pastes against an "expected paste prefix" anchor. If the paste doesn't carry the right anchor (e.g., MAIN expects pastes to start with `╔══ PASTE TARGET: MAIN`), warn before processing: "This paste appears to be addressed to a different window."

**Implementation:** a startup hook that registers the expected anchor.

### Most ergonomic: paste-pin per window

Each chat window has a "pin" — a fixed string that paste-target labels must match. When Yogesh pastes, the window checks the label prefix against its pin; mismatch → warn. Less invasive than full validation; lets Yogesh override with a single keystroke if intentional.

## Day-22 cost tally

| Misroute                                                 | Cost         |
| -------------------------------------------------------- | ------------ |
| Detection time (MAIN reads incoming + realizes mismatch) | ~30 sec each |
| Redirect message + handoff back                          | ~1 min each  |
| Re-paste in correct window                               | ~30 sec each |
| Lost focus context                                       | ~2 min each  |
| **Total per misroute**                                   | **~4 min**   |
| **Day-22 total (7 misroutes)**                           | **~28 min**  |

Combined with branch-lineage drama (~30 min) + commitlint subject-case retries (~10 min), Day-22 lost ~70 min to **multi-agent coordination friction** alone — 18% of a 6.5hr session.

## Cross-references

- `feedback_branch_lineage_drama.md` — sibling cost; multi-agent coord is the umbrella problem
- `feedback_session_resume_state_verification.md` — sibling pulse pattern; helps surface "I'm in the wrong window" via state mismatch
- M5 retro consolidated theme: "single-human × N-window coordination friction" — file all 3 memories under the same retro section
- Day-23 brief — no immediate action item for the brief; this is a pure M5 retro candidate for now

## M5 retro talking points

1. The destination-label pattern IS working — without it, the misroute rate would likely be 2-3× higher
2. The residual ~5% misroute rate is structural; can't be 100% eliminated by labels alone
3. Window-color-coding is the cheapest mitigation; experiment with it Day-23+
4. Paste-pin validation is the most ergonomic; defer to post-M5 since it requires hook plumbing

---

_Entry Day-22 2026-05-19 ~17:30 IST. Promote to RETROS.md at M5 close. The 3 Day-22 retro candidates (this + branch-lineage + resume-state) all share the umbrella theme "multi-agent coordination friction" — surface together._
