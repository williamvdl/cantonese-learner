# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-11-05 · sw.js at v163

## v163 — a correctly said sentence reads back as its lesson — delivered, not yet deployed

The "You said" jyutping no longer contradicts the lesson on a correct attempt: 哥哥 (go4 go1) reads go4 go1, not go1 go1 (DES-65). Characters said exactly as taught take the lesson's syllable; anything said differently is worked out as before. Also: one shared punctuation list, which now includes ；. Code only: `app.js`, `render.js`, `sw.js`, `tools/jyutping-check.js`, and five harnesses and probes that lift the changed functions. Detail is in the STATUS row. **Verified by the real functions against all 776 lines and a rendered line, not yet on the Pixel.** v163 sits on top of v162, which is also uncommitted: both can go in one commit and one deploy, and `sw.js` already reads v163.

**QA, screens that changed:** the Learn *Say it back* sheet on Family's 我有一個哥哥 (ngo5 jau5 jat1 go3 go4 go1) said correctly — *You said* reads go4 go1, nothing dotted; the same sheet on Greetings' 麻煩你幫我介紹下；失禮喇 said correctly — the grid now draws; a sentence said with one wrong word — that word keeps its own reading.
**Screens sharing the changed code, to confirm only:** Chat's Speak mode and the checkpoint sentence review (same *You said* line, should read as the lesson); Translate's speak-back, which should look exactly as before.

## v162 — topic intro notes put the character first — delivered, not yet deployed

Every reading-first term in the *About this lesson* notes — 80 of them across 15 topics — now reads 煮 (zyu2) rather than zyu2 (煮), with any gloss inside the same bracket. Bold key terms keep their bold, now on the character; the italic on the old leading jyutping is gone (DES-64). `jyutping-check.js` now asserts the order. Content and a check only: 15 topic files, `tools/jyutping-check.js`, and the `sw.js` bump (topic files are pre-cached, so without it the old notes would stay). No audio. Detail is in the STATUS row.

**QA, screens that changed:** the Learn screen's *About this lesson* panel in round 1 of Cooking (the three bold verbs, and "The wok, 鑊 (wok6), is…"), Money (four bold terms), Animals (glosses inside brackets) and round 2 of Numbers — the character leads every pair, bold sits on the character, nothing is slanted.
**Screens sharing the changed code, to confirm only:** the same panel on any topic not in the list (Adjectives, Classifiers), which should look exactly as before.

## v159 — quiz results show the whole word you chose — deployed, awaiting device QA confirmation

The topic Quiz's "You chose" line now shows the picked word's Chinese, jyutping
and English in every direction (DES-60), where it showed the character alone, or
the English alone. Found on the way: the checkpoint Words summary's play buttons
had never worked, and now play. Code only: `render.js` and the `sw.js` bump.
Detail is in the STATUS row. **Verified by a lifted test and a rendered preview,
not yet on the Pixel.**

**QA, screens that changed:** a topic Quiz finished with at least one miss, in
each of the three directions — the "You chose" line; a checkpoint's Words
activity finished with a miss — the play buttons under *Worth another look*.
**Screens sharing the changed code, to confirm only:** the topic Quiz's play and
*Retry missed words* buttons on the same screen.

## v158 — checkpoint Words quiz plays its listen prompts — deployed, awaiting device QA confirmation

Reported by William: in the audio-only quiz direction, a topic's quiz plays each
new word by itself, but the checkpoint's Words activity waited for a tap every
time. The checkpoint quiz is the third quiz drawn by `renderQuizCore()`, and
auto-play was wired per quiz, so it never got a copy. All three now share one
rule in `autoPlayListenPrompts()`. Code only: `render.js` and the `sw.js` bump.
Detail is in the STATUS row. **Verified by a lifted test, not yet on the Pixel.**

**QA, screens that changed:** a checkpoint's Words activity in the listen
direction — the first word plays by itself, each Next plays the next word, and
switching to listen mid-question plays once.
**Screens sharing the changed code, to confirm only:** a topic's Quiz and Word
Review in the listen direction, which should behave exactly as before.

## v157 — an Adjectives sentence and the Modal Verbs chat — deployed, awaiting device QA confirmation

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

## v156 — Saying More moved ahead of Food & Drink — deployed, awaiting device QA confirmation

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

## v155 — larger tabs and labels — deployed, awaiting device QA confirmation

The Learn / Chat / Quiz switch at 17px with 19px icons and a semibold active
tab, a 3px active rule on it and on the bottom tab bar, and the small-caps label
family at 12px (mockup 39). `--tabbar-h` corrected to the bar's measured 51px.
The detail is in the STATUS row. **Built and measured in a browser, not yet on
the Pixel.**

**v154 shipped and device QA is done (2026-09-23)** — the replay buttons, and the
new icon after an uninstall and reinstall. Its close-out docs were delivered but
never committed, so they ride in this commit.

**Next candidate work:** saving every audio clip for offline ahead of time and, once a few real failures have been read, removing v161's temporary speech-failure line (both new at v161); reordering
the topic intros' reversed jyutping (in BACKLOG § Content), styling the styleguide's speak demos, an aggregating runner
for the standing checks, the 169 Check B structural candidates from
`dup-css.js` (needs William's judgement), the 4 remaining Check A rule-splits,
the open particle-rule question, and the `char-jyutping.json` coverage
measurement. All in BACKLOG.md.

### Standing checks — thirteen: twelve exit 0, `dup-css.js` exits 1 on four known

`validate.js` (now also asserting the chrome colours), `jyutping-check.js`,
`wiring-check.js`, `nav-harness.js`, `tier-harness.js`, `dead-css.js`,
`sentence-pool-harness.js`, `sentence-review-harness.js`, `snapshot-harness.js`,
`gap-opts-check.js` and `asr-replay-harness.js` all exit 0 at v155, and all
of them plus `tools/speech-silence-harness.js` (new at v160: the silence guard,
pinned against eleven real recordings) exit 0 at v160. **`dup-css.js`
exits 1**, and did at v152 too: its Check A gates on any same-selector duplicate,
and the four it finds are the known rule-splits in BACKLOG. The count is still 4
at v155; Check B structural is 169 — up from 164 with v154's four contextual
`.cp-convo` recolours and v155's `.lesson-note > .eyebrow`, all the same shape
as rules already accepted. **At v160 Check A is still 4; Check B structural is
179**: the ten new ones are `.mic-btn.checking` refining `.mic-btn`, the same
state-modifier shape as `.mic-btn.listening`, and `.key-row .apikey-input`, one
contextual margin. **At v161 all thirteen were re-run: twelve exit 0, Check A
4, Check B structural 179 — unchanged.** This section used to say *"all green"*, which was wrong; see
STATUS § Notes worth carrying forward. Check B is informational and never gates.

## Previously

**v160 and v161 shipped and device QA is done (2026-11-04).** Speaking keeps
listening through pauses, via Azure, on all four speak surfaces (DES-61, DES-62,
MOCK-40-B), then the two follow-ups from QA: a retry with a temporary failure
line, and audio failure messages plus offline audio (DES-63). Outcomes, the
probe results and two new bug-pattern notes are in STATUS.md. The three
listening probes are closed and stay in `tools/` with the other diagnostics.

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
