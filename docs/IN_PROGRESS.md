# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-10-15 · sw.js at v157

## v157 — an Adjectives sentence and the Modal Verbs chat — awaiting audio, deploy and device QA

Two content corrections, one deploy. `adjectives-t1-s04` is now 佢哋好高 (keoi5
dei6 hou2 gou1), "They're very tall", replacing 今日人好多 (gam1 jat6 jan4 hou2
do1), which a native speaker flagged as a phrasing nobody uses. The Modal Verbs
chat, *Learning to swim*, has lines 2, 4, 5 and 6 rewritten: the learner now
accepts the friend's offer instead of being surprised that they can swim. Detail
is in the STATUS row.

**Deploy steps, in this order:**

1. Delete these five files. The generator skips files that already exist, so
   without this the old recordings stay:
   - `audio/sentences/adjectives-t1-s04.mp3`
   - `audio/convos/topic-modals-r1-line02.mp3`
   - `audio/convos/topic-modals-r1-line04.mp3`
   - `audio/convos/topic-modals-r1-line05.mp3`
   - `audio/convos/topic-modals-r1-line06.mp3`
2. Run `node tools/generate-audio.js --topic=adjectives`, then
   `node tools/generate-audio.js --topic=modals`. Only the five missing files are
   generated; the chat lines take the DES-51 voices automatically.
3. Commit the five new MP3s together with `adjectives.json`, `modals.json` and
   `sw.js`. The version bump must land with or after the audio, never before it
   (DES-51).

**QA, screens that changed:** the Adjectives lesson's sentence 4, its text, play
button and note; the Modal Verbs Chat, played through in Listen and in Fill the
Gap, checking lines 2, 4, 5 and 6 and their voices.
**Screens sharing the changed code, to confirm only:** the Saying More
checkpoint's sentence review.

## v156 — Saying More moved ahead of Food & Drink — awaiting deploy and device QA

The Beginner path now walks First Words → Building Sentences → **Saying More** →
Food & Drink → Eating Out & Shopping → the rest unchanged. Data only:
`learning_paths.json`, plus the `sw.js` bump. Ids are kept, so `beginner-s5` walks
third and no progress moves. The reasoning and the measurement are in CONTENT.md
§2 *Paths*; the row is in STATUS.md. **Verified against the lifted sequencing
functions, not yet on the Pixel.**

**Watch in use:** the first food lesson is now 14th rather than 11th, after eight
function-word topics in a row. That is the cost the counts can't see.

**Follow-up in BACKLOG:** re-set the Saying More checkpoint conversation, whose
coat-shop scene uses clothing nouns from five stages later.

## v155 — larger tabs and labels — awaiting deploy and device QA

The Learn / Chat / Quiz switch at 17px with 19px icons and a semibold active
tab, a 3px active rule on it and on the bottom tab bar, and the small-caps label
family at 12px (mockup 39). `--tabbar-h` corrected to the bar's measured 51px.
The detail is in the STATUS row. **Built and measured in a browser, not yet on
the Pixel.**

**v154 shipped and device QA is done (2026-09-23)** — the replay buttons, and the
new icon after an uninstall and reinstall. Its close-out docs were delivered but
never committed, so they ride in this commit.

**Next candidate work:** reordering the topic intros' reversed jyutping (new, in
BACKLOG § Content), styling the styleguide's speak demos, an aggregating runner
for the standing checks, the 169 Check B structural candidates from
`dup-css.js` (needs William's judgement), the 4 remaining Check A rule-splits,
the open particle-rule question, and the `char-jyutping.json` coverage
measurement. All in BACKLOG.md.

### Standing checks — twelve: eleven exit 0, `dup-css.js` exits 1 on four known

`validate.js` (now also asserting the chrome colours), `jyutping-check.js`,
`wiring-check.js`, `nav-harness.js`, `tier-harness.js`, `dead-css.js`,
`sentence-pool-harness.js`, `sentence-review-harness.js`, `snapshot-harness.js`,
`gap-opts-check.js` and `asr-replay-harness.js` all exit 0 at v155. **`dup-css.js`
exits 1**, and did at v152 too: its Check A gates on any same-selector duplicate,
and the four it finds are the known rule-splits in BACKLOG. The count is still 4
at v155; Check B structural is 169 — up from 164 with v154's four contextual
`.cp-convo` recolours and v155's `.lesson-note > .eyebrow`, all the same shape
as rules already accepted. This section used to say *"all green"*, which was wrong; see
STATUS § Notes worth carrying forward. Check B is informational and never gates.

## Previously

**v153 shipped (2026-09-23)** — the product named *Jyut*, its nameplate, icon and
status bar. Confirmed on the device; the icon needed v154 and a reinstall.

**v152 shipped and device QA is done (2026-09-20).** The DES-57 same-sound rule
is closed out across three deploys, all confirmed on the Pixel: v150 the rule
itself, v151 readings resolved per whole string, v152 a fold no longer blocked by
the four-character floor. The notes are in STATUS.md. If a fourth defect surfaces
on this rule, instrument the matcher end to end rather than patch the next symptom.

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
