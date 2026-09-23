# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-20 · sw.js at v152

## Nothing in progress

**v152 shipped and device QA is done (2026-09-20).** The DES-57 same-sound rule
is closed out across three deploys, all confirmed on the Pixel:

- **v150** — the rule itself: a recogniser homophone with identical sound and
  tone counts as a match, shown as a plain tick; tone differences still fail.
  Shipped together with the `dup-css.js` script and the 47-declaration CSS sweep.
- **v151** — readings resolved per whole string rather than per character, so a
  character is read in its word's context (蕃 is faan1 in 蕃茄, faan4 alone).
- **v152** — a fold is not an edit, so the four-character floor no longer blocks
  it on short targets like 唔該晒 (m4 goi1 saai3).

Three defects in three deploys, each from a premise not measured before building
on it. The notes are in STATUS.md. If a fourth surfaces on this rule, the right
move is to instrument the matcher end to end rather than patch the next symptom.

This file is cleared down. **Next candidate work:** an aggregating runner for the
standing checks (the cheapest, and it guards against the silent load failures
found at v150), the 164 Check B structural candidates from `dup-css.js` (needs
William's judgement), the 4 remaining Check A rule-splits, the open question
about extending the particle rule beyond the final position, and the
`char-jyutping.json` coverage measurement. All are in BACKLOG.md.

### Standing checks — twelve, all green

`validate.js`, `jyutping-check.js`, `wiring-check.js`, `nav-harness.js`,
`tier-harness.js`, `dead-css.js`, `sentence-pool-harness.js`,
`sentence-review-harness.js`, `snapshot-harness.js`, `gap-opts-check.js`,
`asr-replay-harness.js`, and **`dup-css.js` (new at v150)**. `dup-css.js` is a
standing check, not a probe — it asserts an invariant and is meant to run before
every deploy, rather than answering one question and dying. Its Check A gates
(exit 1 on any same-selector duplicate); its Check B is informational and
deliberately never gates, because it is a heuristic that cannot reach zero.

## Previously

**v138 and v139 shipped and this file is cleared down again.** A
commercial-readiness review was written up as `docs/PRODUCTISATION_REVIEW.md` —
standalone, deliberately not yet referenced from BACKLOG.md — and its Part C
work is complete: `tools/wiring-check.js` (v138), the four dead controls it
found, the `snapshot-harness.js` `NAV_FIELDS` drift, and then the delegation
refactor itself with DES-47 (v139). Nothing from that arc is open.

**v139 device QA is done** — confirmed on the Pixel, nothing to carry.

**v140 shipped and its device QA is done.**

**v141 shipped and device QA is done** — speak-back on the Translate screen
(DES-49, MOCK-30-A) plus the CJK Extension A jyutping fix that building it
uncovered. Confirmed on the Pixel, including the three screens sharing the
changed code.

**The Gemini model trial ran and is closed.** Result and reasoning are in
STATUS.md; the follow-up candidate is in BACKLOG.md. Nothing from it is open.

## Nothing in progress

**v144, v145 and v146 shipped and device QA is done** — the forgiven-particle
display fix and the 架 (gaa3) variant (DES-53), the sentence-review summary row
(DES-54, MOCK-31-B), and Fill-the-Gap options for the last nine topic
conversations. All three confirmed on the Pixel 2026-09-12. Nothing from them is
open; the reasoning, and the one limit on what the v144 tick actually proves,
are in the STATUS rows.

This file is cleared down. **Next candidate work:** the cross-rule
duplicate-declaration script, and the open question about extending the particle
rule beyond the final position. Both are in BACKLOG.md with their measurements.

**Two things carried in BACKLOG.md rather than here, because nothing waits on
them:** a clean rerun of the Translate false-reject probe with the disposition
asked before the verdict is shown (DES-50), and the orthographic variant fold
(`docs/PROPOSAL-variant-fold.md`), deferred pending recurrence in ordinary use.
