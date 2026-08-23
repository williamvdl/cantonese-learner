# PROBE METHOD — Tea House Cantonese Learner

*A checklist for investigations — probes, prototypes and one-off diagnostics under
`tools/`. Work through it in order before and during a probe. Not for app code or
the standing checks.*

*Written after two investigations (pitch-based tone feedback, ASR tone detection)
whose findings did not justify their cost. The full accounts are in `STATUS.md`
§ Notes worth carrying forward — this file is the guards only.*

Last updated: 2026-08-22 · sw.js at v129

---

## Before writing the probe

- [ ] **Ask the cheapest question that could kill the idea, and ask only that
      first.** For ASR it was "does a wrong tone ever produce a different word" —
      a dozen items on one bank. A 64-item grid across three banks got built
      before that had been answered at all.

- [ ] **Check whether the thing already exists.** `renderSpeakBreakdown()` already
      did what the probe was meant to justify building. Same failure as
      `.btn-icon` sitting unused for a whole phase.

- [ ] **Read the shipped handler the probe mirrors, not just its settings — then
      name it in the probe's header comment.** Copying `lang`, `continuous` and
      `maxAlternatives` out of `startListening()` looked like matching Speak mode.
      Forty lines below sat three rules for Android's final-result delivery plus a
      dedupe pass, each written because the app had already hit that behaviour.
      Reimplementing them from the spec cost three builds. **Defensive-looking
      code is a record of what the platform actually does.**

- [ ] **Derive the test set from the corpus; never hand-type it.** Hand-maintained
      derived data drifts, and textbook examples measure content the app does not
      teach. `tools/asr-testset.js` built its syllable inventory from the corpus,
      so a promising result would have converted straight into a feature.

- [ ] **Include inputs whose right answer is known by construction.** Every ASR
      item was spoken twice — once correctly, once with a *named* wrong tone. A
      probe collecting only correct readings cannot answer whether errors are
      detectable.

- [ ] **Write the pass bar into the probe page itself, before any data exists.**
      This is what made "held in zero of seven runs" read as *stop* rather than an
      invitation to try an eighth setting.

- [ ] **State which error type is worse, and let it set the threshold.** For speak
      feedback a false reject costs trust and a missed error costs nothing, so the
      false-reject rate binds and detection is whatever it turns out to be.

- [ ] **If a threshold cannot honestly be guessed, declare run 1 as calibration.**
      A calibration run may conclude *stop*, or *set thresholds from these numbers
      and run again*. It may not conclude *build it*.

- [ ] **Note in the header that probes need no `sw.js` bump** — not precached, not
      linked from the app, no shared CSS.

## While running

- [ ] **Version-stamp anything run on a phone** — on screen, on every stored
      attempt, in the export. Flag a run that mixes builds. A stale cached page
      wastes a whole session and nothing afterwards can tell which build produced
      the data.

- [ ] **Give the operator a discard control, and count the discards.** Separates
      "I performed it wrong" from "the system failed". If wrong-tone reads get
      discarded far more often than correct ones, producing the error on demand is
      the hard part and detection has to be read in that light.

- [ ] **Exclude absent signals from both sides.** An attempt that decoded nothing
      is not evidence either way; counting it as a detection inflates the headline
      with silence.

- [ ] **Keep negative results in the run.** 22 of 24 single-syllable attempts
      returning nothing *is* the finding that scoped speak feedback to sentences.

## Stop rule

- [ ] **At the second consecutive fault in the probe itself, stop and instrument.**
      Not "fix and continue" — the third fault means the mental model is wrong, and
      symptom-fixing from a wrong model produces plausible fixes that each fail
      differently. The ASR probe reached five before the raw event trace was
      recorded; once it was, the cause fell out in one step and matched three
      earlier corrupted transcripts exactly.

- [ ] **Instrument means recording the raw inputs per attempt in the export** —
      event sequence, indices, flags, timings. Not a summary, not a derived
      verdict. Costs one build. Not doing it cost three.

## After

- [ ] **Fold findings into `STATUS.md` § Notes worth carrying forward, including
      the bug patterns**, not just the outcome. Delete the probe or mark it closed
      in `IN_PROGRESS.md` — the run files and the findings carry forward, the page
      does not.

- [ ] **Distinguish standing checks from diagnostics** in `IN_PROGRESS.md`. A
      standing check asserts an invariant and runs before every deploy. A probe
      answers one question and is then dead.
