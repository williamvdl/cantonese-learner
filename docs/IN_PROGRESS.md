# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-12 · sw.js at v146

## Nothing in progress

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

## Delivered this session — v144, v145, v146

**Delivered and awaiting deploy: v144, v145, v146.** Three pieces built in one
session, each recorded in STATUS.md: the forgiven-particle display fix and the
架 (gaa3) variant (DES-53), the sentence-review summary row (DES-54, MOCK-31-B),
and the Fill-the-Gap authoring pass. **They share one cache version, v146** — if
the earlier zips have not been pushed yet, commit them together and only v146
matters; if v145 is already live, v146 supersedes it cleanly.

QA still outstanding on all three; the lists are in the chat handover and the
STATUS rows. Nothing is blocked.

**Next candidate work:** the cross-rule duplicate-declaration script, and the
open question about extending the particle rule beyond the final position. Both
are in BACKLOG.md with their measurements.

**Two things carried in BACKLOG.md rather than here, because nothing waits on
them:** a clean rerun of the Translate false-reject probe with the disposition
asked before the verdict is shown (DES-50), and the orthographic variant fold
(`docs/PROPOSAL-variant-fold.md`), deferred pending recurrence in ordinary use.
