# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-17 · sw.js at v148

## v147 and v148 — delivered, awaiting device QA

**v148 — 畀 (bei2) standardisation.** Data only, no code. One version number
covers both: if v147 has not been pushed yet, commit them together and only v148
matters. Nothing to QA beyond confirming a lesson that used to read 俾 now reads
畀 — Food, Modals and Shopping are the heaviest users — and that speak-back on
唔該畀個湯同甜品我 (m4 goi1 bei2 go3 tong1 tung4 tim4 ban2 ngo5.) no longer marks
the third character.

## v147 — the tier run

**The tier run (DES-55, MOCK-35-F-1) and the suppressed upward cross-reference
(DES-56).** Both built, all six standing checks pass, styleguide updated in the
same commit. The thing to judge on device is whether the run reads as a
statement or as a chooser — MOCK-33-E is the recorded fallback if it is the
latter. Second thing to look at: with brand cut back to a small arrow, check the
other tiers still read as tappable at all; that is the opposite failure to the
one reported and it is easy to overshoot.

Note that on a tier-1 path lesson with nothing else started, the foot
cross-reference card is now absent entirely. That is DES-56 working, not a
render failure.

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
