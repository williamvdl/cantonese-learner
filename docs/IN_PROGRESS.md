# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-11 · sw.js at v143

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

## v143 — audio pushed, awaiting device QA

**The conversation voice swap (DES-51).** v142 shipped the code and docs; the
484 regenerated conversation files follow as v143 with a fresh `CACHE_VERSION`.
The split was not planned — v142 went up before the audio was generated, which
is the one ordering the rule forbids, because runtime caching keys on
`CACHE_VERSION` and any device that played a conversation line in that window
cached the old audio under the new name. The v143 bump displaces it. Nothing is
lost; it cost one version number.

Device QA after deploy: any topic's Chat tab (the learner's bubbles should now
be the male voice), Greetings round 1 and Questions round 1 specifically, since
those are the four name-bearing lines this exists to fix, and one checkpoint
conversation, which is a separate data source running the same casting logic.

**Next after that:** re-assess priorities. The agreed order was the voice swap
first, then Fill-the-Gap `opts` (19 conversations with a hidden activity) and
the cross-rule duplicate-declaration script.

**Two things carried in BACKLOG.md rather than here, because nothing waits on
them:** a clean rerun of the Translate false-reject probe with the disposition
asked before the verdict is shown (DES-50), and the orthographic variant fold
(`docs/PROPOSAL-variant-fold.md`), deferred pending recurrence in ordinary use.
