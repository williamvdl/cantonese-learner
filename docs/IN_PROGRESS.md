# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-08-31 · sw.js at v137

## Nothing in progress

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
