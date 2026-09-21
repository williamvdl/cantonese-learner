# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-20 · sw.js at v152

## Nothing in progress

**v152 shipped — a second correction, awaiting device QA.** On a target under
four characters the edit allowance is 0, and `fuzzyMatch()` returned false before
the homophone fold could apply, while the grid applied it anyway — so 唔該晒！
(m4 goi1 saai3!) heard as 唔該曬 (m4 goi1 saai3) showed a red panel over three
green ticks. The floor governs edits; a fold is not an edit. 11 corpus
conversation lines sit under the floor.

**v151 shipped — a same-day correction to v150, device QA not separately done.** DES-57
resolved each character's reading in isolation, which threw away the word context
the dictionary needs: 蕃茄 (faan1 ke2) for 番茄 (faan1 ke2) was marked wrong
because 蕃 reads faan1 in that word but faan4 alone. Readings are now resolved
per string and compared by position. **The v150 harness section passed while this
was broken** — it tested isolated character pairs, the same assumption as the
bug. Rewritten at sentence level. See STATUS.md for both notes.

**v150 shipped and its device QA is done.** Two threads landed in one deploy, at
William's request, since v149 was never pushed:

- **Same-sound equality on the speak matcher (DES-57)** — the recogniser's
  homophone substitutions no longer count as learner errors, while tone
  differences still do. Confirmed on the Pixel 2026-09-19, including a
  substitution the build never saw (祝 for 粥, both zuk1), which is the rule
  generalising rather than matching the cases it was built against. The 我 (ngo5)
  for 餓 (ngo6) flag on that run is a real learner slip and correctly marked.
- **Cross-rule duplicate-declaration script** — `tools/dup-css.js` built, and 47
  of 51 same-selector duplicates swept out of `styles.css`. Invisible by design;
  every value removed was already overridden.

**Two standing checks were found dead during this work** —
`asr-replay-harness.js` and `sentence-review-harness.js` had both been failing to
load since v144. Repaired here, and the pattern is in STATUS.md's carry-forward
notes because the shape will recur.

This file is cleared down. **Next candidate work:** the 164 Check B structural
candidates from `dup-css.js` (needs William's judgement, several look
deliberate), the 4 remaining Check A cases that need a shared rule split, an
aggregating runner for the standing checks, the open question about extending the
particle rule beyond the final position, and the `char-jyutping.json` coverage
measurement. All are in BACKLOG.md.

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
