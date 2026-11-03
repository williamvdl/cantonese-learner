# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-11-03 · sw.js at v159

## In progress — the listening cut-off: Azure record-then-transcribe

Picked up 2026-11-03. The brief moved here from BACKLOG.md § Features and is kept
in full below the progress log. Nothing in the app has changed yet; both pieces
so far are diagnostics under `tools/`, not standing checks, and neither needs an
`sw.js` bump.

**Step 1, the gate: done 2026-11-03. Azure passes.** `tools/azure-pause-check.js`
asked the question that could have killed the idea before any recording code
was built: does Azure stop at a pause, the way Chrome does? It took four
two-clause corpus sentences, voiced each clause with Azure TTS, and joined them
with exact silences of 0 to 8 seconds. **Both Azure endpoints returned both
clauses at every pause, 24 of 24 each.** Fast transcription answered in a median
0.5s, flat with clip length; the short-audio REST endpoint took 1.5s, rising to
2.5s on the longest clips. Raw responses: `tools/runs/azure-pause-check-2026-11-03.json`.
- The script printed INCONCLUSIVE for REST, and reading the raw responses
  resolved it: REST's `Offset` and `Duration` were identical at 0ms and 8000ms
  (and so was its confidence, 0.85115457), so they do not describe the clip's
  timeline. The transcripts carried clause 2 every time, and those characters
  can only have come from the audio. The bug pattern is in STATUS § Notes.
- **Fast transcription works on the free (F0) tier.** The setup notes said it
  was probably paid-only; that was wrong.
- A Gemini arm (`--only=gemini`) is built and mock-tested but was not run:
  Azure passed, so Gemini stays the named fallback. See BACKLOG.
- Every gate transcript, from both endpoints, passes the app's real matcher
  (`resolveHeard()`), including 攪笑 (gaau2 siu3) for 搞笑 (gaau2 siu3) and 吖 (aa1)
  for 呀 (aa3). That is a preview from a synthetic voice, not a verdict.

**Azure account: a free (F0) Speech resource was created 2026-11-03** in
Australia East and is now `SPEECH_KEY`. Its 500,000 characters of TTS a month
also cover audio generation (a whole-corpus run is about 7,110). The old paid
(S0) resource is kept, unused, until William decides to delete it; it costs
nothing idle.

**Step 2, the phone probe: built 2026-11-03, awaiting a run on the Pixel.**
`tools/listen-probe.html`. 32 corpus sentences, 16 with a comma to pause at and
16 without, interleaved. Tap Start, speak, tap Stop; answer "did you say it
correctly?" before anything is shown; the same WAV then goes to both Azure
endpoints and is graded by `resolveHeard()` lifted from `app.js` at load.
**Pass bar, inherited:** per endpoint, false rejects ≤10% of valid attempts
overall AND on the paused items. Wait time is recorded as calibration, with no
bar. Whether fast transcription is reachable from a browser (CORS) is answered
as a side effect. Verified headless with a fake mic and scripted Azure: every
outcome path, disposition-before-result, reload-resume, export with audio, and
matcher parity with the standing harness on 19 pairs.
- **To run:** commit it, open `.../tools/listen-probe.html` on the Pixel from the
  deployed site, paste the free resource's key, work through the 32 items, and
  export. The export goes in `tools/runs/` (not `tools/fixtures/` — see STATUS §
  Notes).
- **It may conclude:** BUILD ON fast (preferred if both pass, for the shorter
  wait), BUILD ON rest, FALLBACK to the Continue button, or STOP. It may not
  conclude "loosen the matcher until it passes".

**When built** (unchanged from the brief): correct the `// keep listening until
user stops` comment on `continuous` in `app.js`; mock up the tap-to-stop control
and the wait before writing code.

### The brief, as moved from BACKLOG.md

**Listening cuts out at a pause: probe Azure record-then-transcribe.**
Reported by William 2026-11-02 and researched the same day; this item is the
brief for the session that runs the probe. On every speak surface the mic stops
when he pauses mid-sentence, which forces sentences to be rushed.
**The app sets no limit.** `startSpeechRecognition()` and
`startTranslateListening()` both set `continuous = true`, which by design keeps
listening through pauses. **Chrome on Android does not honour it.** Our own data
shows it: in `tools/fixtures/tail-probe-numbers-t1-s03.json` the two 6000ms
control attempts, which nothing stopped before six seconds, ended by themselves
at 4,644ms and 4,935ms, each within 1ms of its last final result. Others report
roughly 3–4 seconds of silence (WebAudio/web-speech-api issue #99). The exact
silence length on the Pixel has not been measured.

*Ruled out (searched 2026-11-02):*
- **No Web Speech setting controls silence.** The full property list on MDN
  has none, including the newest additions, `phrases` and `processLocally`.
- **Chrome's on-device recognition has no Cantonese.** It lists 18 locales;
  the only Chinese ones are zh-CN and zh-TW, both Mandarin.
- **Android's own silence settings are for native apps only.** Repackaging
  Jyut as one is out of proportion to this problem.
- **Auto-restart on `onend`**, the usual workaround, works on desktop, but on
  Android each restart plays a connect/disconnect sound (issue #99): a chime at
  every pause. Worth testing only if the Pixel turns out not to chime.
- **A "Continue" button** that resumes and appends is simple and safe, but it
  still interrupts at every pause. **It is the fallback if the probe fails.**

*The candidate.* The learner taps to start; `getUserMedia` holds the mic open
with no endpointer; the learner taps to stop; the clip goes to Azure's
short-audio REST recognition with `language=zh-HK`. Nothing ends the recording
but the learner. Already established, in STATUS § Notes (the Azure
pronunciation investigation): the REST endpoint **is reachable from a browser
origin** (CORS permits it; no SDK or CDN), and zh-HK is a supported
speech-to-text locale. **A trap already paid for:** the endpoint accepts
WAV/PCM and OGG/OPUS only, and Chrome's default WebM comes back as **HTTP 200
with an empty recognition**. Encode WAV from PCM, and judge success on the
payload, never the status code. Free tier: 5 audio hours of real-time speech
to text a month. **Key:** entered in Settings and held in local storage exactly
as the Gemini key is, never in the repo; the A2 proxy in
`PRODUCTISATION_REVIEW.md` replaces it if other learners use the app. The other
Azure route, the Speech SDK's continuous recognition with a configurable
`Speech_SegmentationSilenceTimeoutMs`, gives live text but adds the SDK as a
dependency; consider it only if live text turns out to matter.

*Costs to weigh.* There is no live text while speaking; the result arrives
after stop. A different engine also means different spellings, so every
matching rule tuned on Google's output is untested against Azure:
`fuzzyMatch()`, the particle swaps (DES-53), the same-sound fold (DES-57) and
the numeral fold (DES-46, DES-48).

*The probe.* **The question:** on the Pixel, do correct readings of corpus
sentences, spoken with natural pauses and transcribed by Azure, pass the app's
real matcher? **Pass bar, inherited from `tools/translate-reject-probe.html`
(which took it from `tools/asr-probe.html`), not invented:** false rejects ≤10%
of valid attempts. Read `docs/PROBE_METHOD.md` and work its checklist first. In
particular:
- Derive the sentences from the corpus, and include two-clause sentences with
  a comma to pause at, such as 冇問題，我今晚會早啲瞓 (mou5 man6 tai4, ngo5
  gam1 maan5 wui5 zou2 di1 fan3).
- Lift `normalizeChinese()`, `fuzzyMatch()` and `resolveHeard()` verbatim.
- Ask "did you say it correctly?" **before** showing any result (the DES-50
  lesson).
- Count no-decodes apart from rejects.
- Version-stamp every attempt.
- Keep raw responses in the export, and log round-trip time, since it replaces
  live feedback.

The probe may conclude BUILD (the bar holds), FALLBACK to the Continue button
(it fails), or STOP. It may not conclude "loosen the matcher until it passes":
the matcher is shared with four live surfaces. **When built:** correct the
`// keep listening until user stops` comment on `continuous` in `app.js`,
which is not true on Android.

*Relationship to the Gemini item in BACKLOG.md § Features:* both candidates record then upload, so
the recording front end (tap to start and stop, WAV capture) is shared and only
the back end differs. Azure goes first because the key, the account and the
browser reachability are already proven.

**Deployed and awaiting device QA confirmation: v155 to v159**, below. Each
keeps its QA list until William confirms it on the Pixel; then it folds into
STATUS.md and leaves this file.

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

**Next candidate work, after the listening cut-off at the top of this file:** reordering
the topic intros' reversed jyutping (in BACKLOG § Content), styling the styleguide's speak demos, an aggregating runner
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
