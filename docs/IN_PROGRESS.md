# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-03 · sw.js at v139

## Nothing in progress

**v138 and v139 shipped and this file is cleared down again.** A
commercial-readiness review was written up as `docs/PRODUCTISATION_REVIEW.md` —
standalone, deliberately not yet referenced from BACKLOG.md — and its Part C
work is complete: `tools/wiring-check.js` (v138), the four dead controls it
found, the `snapshot-harness.js` `NAV_FIELDS` drift, and then the delegation
refactor itself with DES-47 (v139). Nothing from that arc is open.

**v139 wants device QA before anything else is built on top of it.** It touched
every interactive control in the app, and while every check passes and every
control was verified preserved one-for-one, no automated check proves a handler
does the right thing — only that it is reachable. The QA list is in the deploy
notes.

---

*Below: the previous clear-down, kept for its warning.*

## Nothing in progress (v137)

**The speak-feedback and checkpoint-sentence arc is complete and this file is
cleared down.** It ran from v130 to v137 and is recorded in full in STATUS.md and
DESIGN_DECISIONS.md (DES-38 to DES-46). In outline: speak feedback on sentences
behind a bottom sheet, Chat keeping its own screen, offline jyutping for
recognised speech, the forgiven-near-miss "Close" panel, the checkpoint sentence
review with its seeded-ring sampler, and two evidence-led ASR matching fixes.

Nothing is open from it. The near-miss treatment, the mode picker, the sampling
rule and the grading language were all settled and built rather than left
approved-but-unbuilt.

> **This file was not touched between v128 and v137.** Nine deploys ran while it
> claimed to be current as at v128 — which is the failure mode it was cleared
> down to avoid the first time, when it kept a running narrative that ended up
> disagreeing with STATUS.md. It stayed *substantively* right by accident
> (nothing was in progress), but that is luck, not upkeep. **If a chat ships
> anything, this file's header is stale by definition** — either it names what is
> in flight or it says nothing is, and either way the version stamp moves.

## Backlog, not in progress

Everything else lives in BACKLOG.md — the extended immersion audio dialogues, the
screen smoke harness, the agreement-pairs audit, the nameplate decision, and the
mockup 18–26 provenance backfill raised while auditing DESIGN_SYSTEM.md §8.
