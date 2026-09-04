# STATUS — Tea House Cantonese Learner

*Edit this file in place as things ship. It reflects the app as it stands today —
not a history log. Approved design decisions and whether they were built live in
`DESIGN_DECISIONS.md`.*

> **This file used to say the commit history was the history log. It isn't.**
> Checked 2026-08-01: 22 of the last 25 commits are titled *"Add files via
> upload"*, GitHub Desktop's default. The **diffs** are intact, so *what* changed
> between any two deploys is fully recoverable — but nothing in the repo says
> *why*, which means the deploy table below is the only changelog there is. That
> raises the stakes on it being right, and it is worth adopting a one-line commit
> convention (`v121 — <what changed>`) so this file stops being load-bearing on
> its own.

Last updated: 2026-09-03 · sw.js at v140

## Confirmed live and working
- **Checkpoint sentence review** (v134, DES-44/45). Third checkpoint activity:
  8 sentences per run from a seeded ring over the stage's pool, in listen,
  produce, or mixed mode. Grades like Speak but never blocks — "Next" is always
  enabled, every item has an escape hatch that marks it revealed rather than
  failed, and "Mark sentences reviewed" completes the activity regardless. A
  produce mismatch states no verdict either way. Completing a full pass of the
  pool shows a milestone; the ring never exhausts.
- **Speak feedback on sentences — complete, DES-38 through DES-42** (v130–132).
  A mic button on a sentence card in Learn opens a "Say it back" sheet —
  reuses the `.sheet` host built for Settings, and the
  `.speak-card`/`renderSpeakBreakdown()` markup Chat's conversation Speak mode
  already had. Chat's own screen is unchanged (DES-40): the two are
  different-shaped problems, so reuse is at the content layer, not the
  surface. A listen-again control sits in the sheet head (disabled while the
  mic is live, to avoid the played-back audio feeding back into the
  recogniser), and "You said" carries jyutping derived from the corpus
  itself — no API call — via `tools/build-char-jyutping.js`, with honest
  markers for characters outside the corpus or with more than one reading in
  it. **A forgiven near-miss gets its own neutral "Close" panel** (DES-42),
  distinct from both a correct match and a genuine reject — the differing
  syllable is a `--brand` accent, not `--feedback-bad`, so an accepted attempt
  never looks like an error. Nothing from this line of work remains open.
- **Speak mode accepts near-misses** (v129). `fuzzyMatch()` was strict equality
  after punctuation stripping, which produced a **~25% false-reject rate on
  sentences** in the ASR probe — correct speech marked wrong. Two rules now, both
  sized from the probe's captured cases rather than picked: a **differing
  sentence-final particle is free** (喇 (laa3) / 啦 (laa1) are a real minimal pair,
  but particles are acoustically reduced and variable in running speech, so a swap
  is not evidence of an error — `tools/asr-testset.js` excludes them as probe
  targets for the same reason), and **one edit per four target characters, exact
  below four.** The scaling is the point: one substitution in an eight-character
  sentence is almost always a recogniser homophone, whereas one substitution in a
  two-character word *is* the word — 媽媽 (maa1 maa1) heard as 嫲嫲 (maa4 maa4) is a
  different word, not a glitch. Verified against all 13 cases from the probe runs:
  both real false rejects now pass, all six genuine detections still fail.
  **`SPEAK_FINAL_PARTICLES` in `app.js` is asserted against `particles.json` by
  `tools/validate.js`** — `app.js` cannot read a topic file at load time, so the
  set is a literal, and a hand-copied list that drifts silently is the root cause
  of several past defects. The check was verified to fail in both directions.
- **Patterns/Drills removed** from the app entirely (not soft-hidden). Checkpoints
  flow Words → Conversation only.
- **TTS replaces the browser's Web Speech API** for all pre-generatable content
  (words, sentences, topic Chat conversations, checkpoint conversations). Full
  audio generation run complete, not just a test batch.
  - **Azure AI Speech, `zh-HK` Neural** (v123 onward). `zh-HK-WanLungNeural`
    (male) narrates words and sentences and plays the non-user speaker;
    `zh-HK-HiuGaaiNeural` (female) plays the learner's own lines. Only three
    `zh-HK` voices exist — WanLung, HiuMaan, HiuGaai — confirmed against the live
    `voices/list` endpoint rather than the documentation.
  - *Was, until v123:* Google Cloud Chirp3-HD, `yue-HK` voice. Default **Puck** (male) for
    words/sentences. Conversations use two voices picked per line by speaker.
    **Superseded at v123 — see the Azure entry below.**
  - Generated via `tools/generate-audio.js` (vanilla Node, no npm deps, auth via
    the `SPEECH_KEY` / `SPEECH_REGION` environment variables). Incremental — safe
    to re-run. Carries a `--provider=google` backend as the A/B reference only;
    that path still authenticates through `gcloud auth print-access-token`.
  - **`docs/PROBE_METHOD.md`** (2026-08-22) carries how to run an investigation
    at a cost proportionate to the answer — read the shipped handler a probe
    mirrors, stop and instrument at the second consecutive fault, pre-register
    the pass bar, derive the test set, version-stamp anything run on a phone.
    Written after two investigations whose findings did not justify their cost.
  - `tools/tts-probe.js` (v123) answers "which voices does a provider offer, and
    how does each handle a given sound" by calling `voices/list` and synthesising
    a fixed six-phrase set through every one. Not a standing check — it asserts
    no invariant — but the thing to reach for before any future voice question.
  - Six diagnostics from the 2026-08-15 and 2026-08-17 pronunciation
    investigations, all non-standing, none in the `sw.js` precache list, and all
    kept because the questions will be asked again:
    `tools/pron-probe.html` (Azure Pronunciation Assessment — answered: browser
    transport works, zh-HK scoring is tone-blind), `tools/tone-probe.html`
    (two-speaker F0 contour probe — answered: tone is measurable in-browser
    *from deliberate citation forms*, and established the noise floor and the
    four confident classes), `tools/tone-reference.html` (builds tone references
    from the existing TTS corpus — answered: good height anchor, unusable shape
    anchor; build R2 downloads the result so it can be committed rather than
    pasted), `tools/segment-probe.html` (can a multi-syllable word be split from
    its pitch track — answered: no, across a pre-registered seven-run grid),
    `tools/align-check.html` (does Azure return usable syllable times for zh-HK —
    answered: yes, from word entries, if the reference text is sent with the
    characters spaced apart), and `tools/tone-prototype.html` (all three
    candidate feedback designs over one recording — answered: none of them is
    usable against a synthetic reference). See DES-37.
  - Playback goes through `speakItem()` / `speakConvoLine()`. Web Speech API is
    kept, deliberately, only for the Translate tab (no stable ID to pre-generate).
  - No fallback on missing audio by design — a toast shows instead of a silent
    synthetic-voice substitute.
- **Stable IDs** fully in place — 585/585 words, 307/307 sentences, 150/150
  drills. Validator passes clean. *(Corrected at v127: this line read "600/600
  words" from the ID-minting work. 600 is the count of `wid` references inside
  `patterns.json`'s 150 drills — four per drill — not the word corpus, which is
  585. Both numbers were right about different things; see CONTENT.md §2.)*

## Design system — phases 1–6 complete, rollout closed

**The app now renders entirely from the token and primitive layers.** No colour
is injected from JavaScript anywhere. Established 2026-07-25, applying from
sw.js v95 onward; phase 2 shipped across v96–v103, phase 3 across v104–v107,
phase 4 across v108–v112, phase 5 at v113, phase 6 across v114–v120.

**The rollout is complete.** Phase 6 was the last, and it closed at v119 with the
`state.homeView` → `state.topicsView` rename (P6-6), followed by the v120
dead-CSS sweep. Every approved decision in `DESIGN_DECISIONS.md` is built and
there are no *Not built* rows left.

> **v121 is post-rollout convergence, not a seventh phase.** It came from looking
> at the finished app on a device rather than from a plan, and everything it
> fixed was drift *from decisions already made* — mockup 10's separator that was
> never built, mockup 10's standalone shell that was never built, and §1's and
> §3.6's rules about type and emoji that eight and seven call sites respectively
> did not follow. **The rollout closing did not mean the app matched the spec; it
> meant every mockup had been through a phase.** Those are different claims, and
> only the second one was true at v120.

Phase 6 shipped four things that had been approved and silently never
implemented, which is more than any other phase: MOCK-17-fill, the subtab
treatment, at v114; DES-20, the centred header, at v115 — nobody had noticed it
was unbuilt at all; DES-18, the nameplate as a route home, at v116; and
MOCK-11-bar, the docked completion bar, at v118 after four phases of waiting.
Building the bar brought DES-12's collision into existence for the first time,
answered by slimming the bar rather than hiding the tabs (DES-21 stands).

`DESIGN_SYSTEM.md` and `docs/design/styleguide.html` are the source of truth. Read
`DESIGN_SYSTEM.md` before touching `styles.css`, `render.js`, or designing a new
screen.

### Measured state

| | Before phase 2 | Now |
|---|---|---|
| Colour-injection sites in `render.js` | 37 | **0** |
| Render functions taking a `color` param | 8 | **0** |
| Colourless borders (relying on injection) | 12 | **0** |
| Six-digit orphan hexes in `render.js` | 14 | **0** |
| Raw hex in `styles.css` outside `:root` | 68 | **`#fff` only** |
| Border widths in play | 1 / 1.5 / 2 / 2.5 / 3px | **1px + 2px** |
| `border-radius` values | 78 raw px + 19 `50%` | **all on the scale** |
| Competing content columns | 5 | **1 (`--measure`)** |
| `styles.css` | 1292 lines | **1403 lines** (1160 after phase 3; phase 4 added the path-context components, phase 5 three, phase 6 the subtab primitive, the tab bar, the settings sheet and the docked bar, less the v120 sweep) |
| Rules redeclaring the card surface | 12 | **0 (`.card` only)** |
| Painted sizes of the circular play control | 7 (28–44px) | **2 (32 / 44px)** |
| Interactive controls declaring `min-height` under `--tap-min` | 9 | **0** |

`styles.css` declares 428 classes and `tools/dead-css.js` finds an emitter for
every one bar the two known interpolation artefacts. *(This line used to assert
"all 390 classes emitted in `render.js` resolve" — a figure in the direction
nothing measures. `dead-css.js` checks declared → emitter, so that is the
direction the claim is now made in.)*

**The tap-target figure above is narrower than it looks.** It counts rules that
*declare* `min-height` below 44px, and it reached zero at v117 when the drawer
took `.hamburger` and `.drawer-speed-btn` with it. A target built from padding
alone is invisible to that check — which is how the stage stepper shipped at 42px
in v109 and read clean. The stricter check (in IN_PROGRESS.md) still finds two
definite misses, `.path-complete-btn` at 28px and `.translate-dir-swap` at 38px,
plus **11** padding-built targets that need judging individually. Both are in
BACKLOG.md.

### Retired
`CP_GOLD`, `GOLD_HERO`, `BRAND_HERO`, `BRAND_ACCENT` (was in `data.js`), `THEME`
(was in `data.js`), `--gold`, `--gold-tint`, `--gold-text`, `--topic-accent`,
`--font-cjk` (never existed), `.progress-bar` / `.progress-fill`,
`.lesson-header-stacked`, `--jade-shadow`, `.node--sm`, and the whole path banner —
`renderPathBanner()`, `.path-banner*`, `.path-bar*`, `.path-btn*`,
`.path-action-zone`, `.path-next-row`, `.path-tick-badge`, `.path-final-*`,
`.path-step-node`, `.cp-node`, `.path-step-icon`, `.path-banner-action` — and the
orphan hues `#B7861E`, `#e4d4ad`, `#8a6716`,
`#2D5040`, `#8B3A4E`, `#922B21`, `#2A2422`, `#f4f0eb`, `#f8d7da`, `#d4edda`,
`rgba(201,191,160,.6)`, `rgba(231,76,60,.6)`.

### What each phase did

| Phase | sw.js | Outcome |
|---|---|---|
| 1 | v95 | Token layer. `:root` holds every token in §1. |
| 2a | v96 | Six invalid `var(--token)XX` values fixed (five via `color-mix`, so 2d stayed a plain swap). `--font-cjk` → `--font-serif`. **Next-up step emphasis rendered for the first time** — its glow and card shadow had never displayed. |
| 2b | v96 | All radii onto the scale. Five columns → `--measure`. Two fixed grids → `auto-fill minmax()`. |
| 2c | v97 | 67 cold greys collapsed onto `--ink-soft` / `--muted-dark` / `--muted`; 15 border greys onto `--parchment-border`; two cold-black shadows warmed. |
| 2d | v97 | `--gold` split across 43 declarations into milestone / current / header-chrome / neutral, then retired. |
| 2e-i | v98 | **Primitive layer introduced** (`.card`, `.list`, `.section-label`, `.eyebrow`, `.track`, `.btn`, `.wm`). Dashboard converged onto it as its first consumer. |
| 2e-ii | v99 | Shared quiz core — quiz, Word Review and Checkpoint Words together. `.choices` → vertical stack. |
| 2e-iii | v100 | Topic/Learn. Word-card reveal became a tint wash. |
| — | v101 | Fix: duplicate `border` declarations on `.word-card` and `.sentence-play` (see below). |
| 2e-iv | v102 | Conversation and speak mode. Bubble colour is side-driven. `THEME` retired. |
| 2e-v/vi | v103 | Path, checkpoint, header, Topics grid, boot screens, border widths, shadow scale. |
| 3a | v104 | Card-surface collapse. 47 duplicate declarations removed from 12 rules; `.card` is the sole declarer. `.cp-card`'s hand-rolled left edge became `.card--milestone`. Retired `darkenHex()` and the dead `attachEvents(lesson, color)` chain. |
| 3b-i | v105 | `renderHomeScreen()` → `renderTopicsScreen()`, `.home-wrap` → `.topics-wrap`. |
| 3b-ii | v106 | Circular control vocabulary. `.btn-icon` gained `--compact` / `--brand` / `--header`; seven controls at seven sizes became two. Translate's mic emoji became an icon. |
| 3b-iii | v107 | `.pill`, `.tag`, `.btn-listen` ported from `styleguide.html`; five components migrated, four classes retired. Quiz tap-target fix. |
| 4 · 1 | v108 | The `.node` primitive, then the three path fixes expressed on it: the completed-checkpoint retreat (MOCK-05-retreat), next-up emphasis (MOCK-06-C), emoji off the step rows (DES-09). Completed lesson nodes went from a solid jade fill to the primitive's tint + edge, which is what mockup 05 always drew. |
| 4 · 2 | v109 | Path context split by job (MOCK-10-B + MOCK-10-cont). Contextual row and stage stepper above the lesson; the action moved to a continuation card at the foot. `renderPathBanner` and its second progress bar retired — 30 rules. `openPathLesson()` extracted from three copies of one state reset. |
| 4 · 3 | v110 | Fixes off device QA: the stepper's 42px tap target, and the checkpoint hub's hero `◆`, which declared no `color` and so painted near-black on oxblood. |
| 4 · 4 | v111 | Diamond progress (MOCK-07-Asoft) — the `.mk` and `.segs` primitives, ring on the rail diamond, pips, the three-state count line and three-state badge. |
| 4 · 5 | v112 | Stepper to the base 28px node (MOCK-16-S28) and stage context on the checkpoint hub (MOCK-16-H2), with `.node--cp.node--current` for the current diamond. `buildStageInfo()` extracted so the topic screen and hub share one path. `styleguide.html` updated in the same deploy. |
| 5 | v113 | Completion on the Quiz subtab. The continuation card is now present on all three subtabs; while a question is live it takes a reduced form (completion confirmed, forward action dropped) and on the result screen the forward action returns. `isQuizQuestionLive()` is the single source of that distinction. Per-question button relabelled "Next question" (MOCK-12). `.cont-done:last-child` added — the reduced form exposed a divider with nothing under it. Mark-complete's final-step auto-return gated so it can't fire mid-question. `styleguide.html` gained the Continuation section it never had. |
| 6 · 1 | v114 | The subtab treatment (MOCK-17-fill) as the `.tabs` / `.tab` primitive, shared in design with the phase 6 tab bar. Three bordered boxes with a solid brand fill on the active one became one hairline rail with muted labels and a 2px brand underline (DES-19). Retired the four `.subtabs` / `.subtab-btn` rules; `.subtab-btn`'s 42px tap target went with them. `.tabs--top` deliberately **not** ported while it has no consumer. The build corrected a claim that had propagated through three documents — see the note on docs drifting against themselves below. |
| 6 · 2 | v115 | The centred header (DES-20). Nameplate to the centre, info button to the left corner, hamburger stays right, each corner control in a fixed `--tap-min` slot. `.header-actions` retired. Builds a §2 paragraph that had been specified and unbuilt since the design system was written — found because a mockup frame in conversation did not match the app. A dead `letter-spacing: 0.22em` on `.header-title .en` went in the same rule; the grouped meta-label block 586 lines later sets 0.16em and had been winning on source order. |
| 6 · 3 | v116 | The nameplate as a route Home (DES-18, MOCK-18-Thug + N1/N2). `.header-title` gains a `.nameplate` button that hugs its text; nothing marks it at rest, pressing drops its opacity. The state reset behind it is extracted to `goToDestination()` in `app.js`, now shared with the drawer's five menu items so the two cannot drift — the same consolidation `openPathLesson()` got. The history call is the only difference between callers and is a parameter: the drawer replaces (overwriting its own open entry), the nameplate pushes. Repeat taps on Home no-op rather than stacking identical history entries. |
| 6 · 4 | v117 | **The tab bar replaces the drawer** (MOCK-13-tabs), and settings moves behind the header cog as a bottom sheet (MOCK-19-sheet). `renderDrawer()` is gone; `renderTabBar()` and `renderSettingsSheet()` replace it, mounted through one `renderChrome()` helper rather than five copies of the pair. Six navigation icons transcribed into `ICON_PATHS` — the drawer's emoji could not take `currentColor`, so an active destination could not have turned brand. §3.10 reversed: the bar shows on every screen (DES-21). Five dead-CSS pockets and the six `--drawer-*` tokens retired. `goToDestination()`'s `replace` option dropped to zero call sites with the drawer and was removed. |
| 6 · 5 | v118 | **The docked completion bar** (DES-22, MOCK-20-B2, and MOCK-11-bar built at last — approved in phase 4, unbuilt for four phases). `.bar` / `.bar-inner` existed as a §2 entry marked *Not built* since the design system was written; it now exists. Three of the continuation's four states dock; path-complete stays in flow. `--bar-h` gets its first call site since being declared. **`--tabbar-h` corrected from 58px to 46px** — it was taken from a mockup, while the built bar computes to `--tap-min` plus a 2px rule, so all four wrapper clearances had been over-reserving by 12px. |
| 6 · 6 | v119 | **`state.homeView` → `state.topicsView`** — the last item in phase 6, and invisible: no screen changes. The name predated the Dashboard, when Topics *was* Home; since v105 it has pointed at the wrong screen. 16 call sites. The real work was the migration: `history.state` outlives a deploy, so entries written by v118 arrive carrying the old key, and `applyNavSnapshot()`'s `f in snap` guard skips absent fields **silently** — backing out of a topic into a pre-deploy entry would have restored `nav: 'topics'` while leaving `topicsView` false, showing the topic you just left and making BACK look broken. `migrateNavSnapshot()` maps the old key forward at the read boundary. |
| — | v120 | **Dead-CSS sweep, driven by measurement rather than memory.** Removed 16 classes with no emitter (`.mode-btn`, `.conv-mode-pill(s)`, `.mode-row`, `.home-header/title/subtitle`, `.translate-header` + descendants, `.translate-dir-label.muted`, `.speed-row`, `.speed-label`, `.choices-zh`, `.convo-meta`, `.nav-subitem`, `.btn--disabled`, `.tag--brand`, `.tag--milestone`) and the `--ink-drawer` token, whose own comment said *legacy*. Nine hardcoded greys in `render.js` replaced: four by existing primitives (`.section-label`, `.boot-msg` ×3), five by tokens. **No hardcoded colour remains in the JS.** Invisible except one loading state, which gains 20px of padding by adopting `.boot-msg`. The sweep enumerated CSS classes only, so two dead JS handlers survived it — see the note on sweeps below. |

| — | v121 | **Post-rollout convergence, then the tier ladder — one deploy.** Two bodies of work, both off device QA, shipped together because v121 was never deployed on its own. *Convergence (mockups 21, DES-23 to DES-27):* the topic context block is closed with a hairline above and below the stepper and the stage progress hairline is retired; a standalone topic uses the same `.ctx` shell instead of `.back-home-btn`; eight Latin title sites and two score values move from `--font-serif` to `--font-display` at `--fw-semi`; `renderPageHeader()`'s emoji parameter is removed and the path landing loses its card icons. *Tier ladder (mockups 22–24, DES-28 to DES-30):* `.round-selector` retired for `.tierline` / `.ladder` / `.rung`, which state the tier and offer only the adjacent rungs; inside a path the rungs are absent and `.xref` offers the crossing at the foot, one row per adjacent tier, each naming its path; a tier change routes through `goToTier()` → `openPathLesson()`, fixing a defect where switching tier inside a path left the chrome describing the tier just left and wrote completion to the wrong lesson. Also swept: the dead duplicate declarations on the three path-title selectors, and `index.html`'s font comment, which credited Source Serif 4 while the stylesheet loaded Fraunces. New standing check: `tools/tier-harness.js`. |

| — | v122 | **QA fixes off device — six changes, no design decisions.** *Cold-start next-up:* `checkpointProgress()` decided whether a checkpoint offered a Words activity by counting `getCheckpointWords()`, which reads the lazy-loaded topic cache; on a cold start that is always 0, so a checkpoint whose Conversation was already done computed 1 of 1 and `complete: true`, and the dashboard's next-up skipped past it. Availability now comes from `learning_paths.json` — a stage offers Words when it has topics — which is answerable before any topic JSON loads. *Bubble action row* gains a gap; the two controls were flush. *The playing state on a user-side bubble inside a checkpoint conversation* got its own rule: `.bubble-row.right .bubble-play.is-playing` and `.cp-convo .bubble-row.right .bubble-play` tie at 0,4,0 and the later won on `color`, giving a white icon on a white circle. *Back to Lesson* from a quiz now clears `state.flipped` — every other route into a topic already did. *The audio-only quiz direction* reveals the characters and jyutping on a **correct** answer; it was the one path through a quiz where the learner never saw what they heard. *`sw.js` precaches 42 topics, not 40* — `connectives` and `pronouns` were missing, so neither worked offline, and `pronouns` is Beginner lesson one. |
| — | v123 | **TTS migrated from Google to Azure — all 1,376 audio files regenerated.** Not a design change; see the architecture note below and the header of `tools/generate-audio.js` for the full diagnosis. Google's Chirp3-HD `yue-HK` voice cannot produce a bare syllabic nasal, so 唔 (m4) and 五 (ng5) both came back with a vowel inserted, affecting 207 files. Azure's `zh-HK` Neural voices say both correctly at comparable naturalness. Casting mirrors what it replaced: `zh-HK-WanLungNeural` for words, sentences and the non-user speaker, `zh-HK-HiuGaaiNeural` for the learner's own lines. |
| — | v124 | **The emoji sweep (DES-31, DES-32).** 33 pictographic sites in `render.js` reduced to one. Roughly half were removed outright, the rest replaced with `ICON_PATHS` entries or a disclosure chevron. `.result-emoji` and `.review-empty-emoji` collapse into `.result-mark` / `.result-mark--good` (DES-32). The survivor is `📚 All Categories` inside the category filter's native `<select>`, which cannot hold an SVG. `renderCheckpointDone()`'s `emoji` parameter is removed rather than passed empty — the same move DES-27 made on `renderPageHeader()`. |
| MOCK-25-B, MOCK-26-C+ | v125 | **The last two device-QA issues (3, 4, 10a, 10b).** *Contextual row (DES-33, DES-34):* the back control becomes an up control — always to the path timeline, labelled with the path — and the meta slot names the stage beside its own stage-scoped count. Supersedes the backlog's `history.back()` note; the hardware-key divergence is accepted and documented. *Conversation (DES-35, DES-36):* the user bubble goes from a saturated fill to `--brand-tint` / `--milestone-tint`, the `!important` forcing user-side jyutping to white is retired, and a 3px outer edge plus a small-caps name carries the speaker distinction. Tone colour on the learner's own lines goes from absent to 2.19–5.27:1, level with the rest of the app. **Found while re-checking the bubble states against a light ground:** `.bubble--gap`, `.bubble--correct` and `.bubble--wrong` are emitted on the user side at 0,1,0 against `.bubble-row.right .bubble` at 0,2,0, so their background and border have never applied — pre-existing, exposed by the redesign, requalified to 0,3,0. |
| — | v126 | **DES-33 applied to the rest of the app — the sweep v125 should have been.** v125 changed only the contextual row, and the identical fault was live on three more controls, found on device: *Back to Learning Paths* on the path timeline (two emit sites) and both checkpoint-hub controls, including the one reading **"✓ Checkpoint complete — back to path"**, which from the dashboard went to the dashboard. They survived because each screen had grown its own back handler — four of them, three routing through `history.back()` — so there was no single place to enforce the rule. All four collapse into one `[data-up]` handler over a three-value vocabulary (`paths`, `path:<key>`, `topics`); an unrecognised value warns rather than guessing a default. **The activity screens are deliberately left on `history.back()`**: `state.checkpointAct` is only ever set from a hub card, so with one parent the label cannot lie, and converting them would push a third entry onto the stack and leave the hardware key pointing at a finished quiz. |
| — | v127 | **The content register, and the three data defects it found.** `docs/CONTENT.md` (corpus inventory, Intermediate chapter plan) and `docs/CONTENT_SPEC_TIER2.md` (tier-2 authoring rules, previously held outside the repo) join `docs/`; `tools/content-report.js` becomes **standing check 9**, the first that reads content rather than CSS, JS or navigation, and generates every count in the register so none is hand-typed. Its eight assertions found three defects on first run. *`topics_index.json` declared `modals` and `comparisons` as tier-1-only* while both topic files carry a tier 2 — and `getAvailableRounds()` reads the index, not the file, so `getTierLadder()` returned no rungs and the whole of chapter I-3 was reachable only by walking the Intermediate path. Two word counts on the same file were also wrong. *`intermediate-s3` had no checkpoint `id` or `wordCap`* — now `intermediate-s3-cp` at 25. All three, plus the `sw.js` precache omission fixed at v122, were the last step of the session that shipped I-3. |
| — | v129 | **Speak mode stopped marking correct speech wrong.** `fuzzyMatch()` gains two leniency rules sized from the ASR probe's captured near-misses (see *Confirmed live and working* above and the note below). Measured false rejects on sentences were ~25%: 我食咗飯，仲飲咗茶 (ngo5 sik6 zo2 faan6, zung6 jam2 zo2 caa4) came back with 中 (zung1) for 仲 (zung6), and 我部電話太舊喇 (ngo5 bou6 din6 waa2 taai3 gau6 laa3) with 夠 (gau3) for 舊 (gau6). `tools/validate.js` gains an agreement check tying `SPEAK_FINAL_PARTICLES` to `particles.json`. **One deliberate trade:** 要排幾耐隊 (jiu3 paai4 gei2 noi6 deoi2) said with 腰 (jiu1) for 要 (jiu3) now passes — a genuine tone error accepted, at one substitution in five characters. That follows from the stated asymmetry (a false reject costs trust; a missed error costs nothing the app was catching) and from tone detection being abandoned as a feature regardless. |
| MOCK-27-sheet | v130 | **Speak feedback on sentences (DES-38/40).** A sentence card's new mic button opens a "Say it back" sheet — the second consumer of the `.sheet-wrap`/`.sheet-scrim`/`.sheet` host built for Settings at v117, reusing it unchanged. Content is `.speak-card`, the same markup Chat's conversation Speak mode already renders — `renderSpeakBreakdown()` is untouched; this is placement and reuse. Chat's own dedicated screen is **not** replaced (DES-40): a standalone sentence is one bounded action a sheet suits, a Chat walk is sequential and already owns the shape for that. The Android speech-recognition handler (`startListening()`) is refactored into a shared `startSpeechRecognition()` core used by both Chat and the new sheet, rather than a second hand-written copy of the cumulative-finals/dedup handling that took five probe builds to get right the first time (see *Notes worth carrying forward*). Matched has one action, "Done" — no next line to advance into, unlike Chat's "Next"/"Restart"; mismatch's second action is "Close," not Chat's "Skip," for the same reason. `state.sentSpeakOpen` joins `NAV_FIELDS` (phone BACK closes the sheet, same as Settings); `goToDestination()` force-closes it and aborts any live recognition on navigation, mirroring the existing `settingsOpen` handling. Verified with a Node harness (`renderSentSpeakSheet()`/`renderSentences()` run against real corpus data across idle/listening/matched/mismatch/stale-index) rather than read alone. `DESIGN_SYSTEM.md` §2 and `docs/design/styleguide.html` gain the component in the same commit, per DES-38. **Not yet built:** the forgiven-near-miss "Close" colour state (§3 of MOCK-27) — still open, tracked in `BACKLOG.md`. |
| — | v131 | **Two additions to the sentence speak sheet (DES-41), raised while reviewing v130.** *Listen again:* a control in the sheet head, left of close, plays the target sentence without leaving the sheet — disabled while the mic is listening, since played-back audio would otherwise feed back into the live recogniser as a trivially "correct" match; `closeSentSpeak()` and `goToDestination()` both stop any in-flight playback the same way they already stopped in-flight recognition. *"You said" now shows jyutping, without an API call:* `tools/build-char-jyutping.js` derives a single-character lookup **from the corpus itself** — every word's and every sentence's `bd`-chunk's existing Chinese/jyutping pairing — rather than adding a dependency. **644 characters covered**, generated by the script and never hand-typed, so it can't drift; tested against six realistic heard strings including genuine mismatches, full coverage on all six. Two honesty markers, following DES-38's own "never overclaim" instinct: `.jp-unknown` (a boxed "?") for a character outside the corpus, `.jp-ambiguous` (dotted underline) for one of the **35 characters (5.4%) with more than one reading in the corpus** — majority reading shown, marked rather than presented as certain. `charsToJyutping()` in `app.js`; `data/char-jyutping.json` loads the same optional, resilient way as `path_convos.json` — missing or failed just means the sub-line doesn't render. Verified: 6 new smoke checks (all three honesty cases, plus the listen-button's enabled/disabled states) added to the existing harness, 16/16 pass; all nine standing checks re-run clean. |
| DES-42 | v132 | **The forgiven-near-miss "Close" state (MOCK-27 §3) — the last open item on speak feedback, confirmed by William.** `renderSpeakBreakdown()` gains a `variant` parameter ('bad', the existing default, or 'close') and now returns `{ html, hasDiff }` instead of a bare string — `hasDiff` comes off the same alignment pass already being done, so telling an exact match from a forgiven one costs nothing extra. **The mockup's own proposal needed correcting once checked against the live CSS, not just applied as drawn**: MOCK-27 §3 called for `--brand` on the whole result panel, assuming the colour was unclaimed — it wasn't. `.speak-result-bad` (genuine mismatch) already uses `--brand-tint`/`--brand`/`--brand-text-dark`, so reusing it for "Close" would have made an accepted near-miss look identical to a rejected one. New `.speak-result-close` uses `--parchment-warm`/`--parchment-border`/`--ink-soft` instead — neutral, and visually distinct from both siblings; `--brand`/`--brand-text-dark` still carry the fix, but scoped to just the differing syllable, a local accent rather than a full-panel claim. Applied at the content layer per DES-40, so both surfaces get it from one change — the sentence sheet and Chat's conversation Speak mode. Verified: 3 new smoke checks, including one asserting the fixed HTML never contains `var(--feedback-bad)` on a forgiven match — the specific bug this closes; 19/19 pass, all standing checks re-run clean. **This closes the Speak-feedback-on-sentences line of work — nothing from DES-38 through DES-42 remains open.** |
| DES-43 | v133 | **Jyutping is now available for any recognised speech, not just taught vocabulary.** Raised by William: the app's audience is assumed not to read Chinese, so recogniser output shown as bare characters is not degraded information but *no* information — and DES-41's corpus-derived table only covered the 644 characters the lessons teach. Measured against the three real ASR substitutions captured in the v129 probe, 夠 resolved to nothing. Vendored `to-jyutping` v3.1.1 (CanCLID, BSD-2-Clause) at `vendor/to-jyutping.js`: ~27,500 characters, UMD so it loads via a plain `<script>` with no build step, 273KB gzipped against an existing 24MB audio payload. Queried at word level so context disambiguates (三樓 → lau2). **The corpus stays authoritative and the dictionary is fallback only** — they disagree on 44 of 644 characters, almost all colloquial-vs-literary, and inverting the layering would print `maa1` beside a lesson teaching `maa3`. New standing check `tools/jyutping-check.js` asserts coverage, layering direction, and positional alignment. **Found and fixed while validating: 知 was glossed `ji1` instead of `zi1` in two files** (`modals.json`, `comparisons.json`) — a real content bug that had been invisible until a second source existed to disagree with it; the check now catches this whole class automatically (see *Notes worth carrying forward*). |
| DES-44/45 | v134 | **Checkpoint sentence review — the third activity.** One hub card (tag SAY, between Words and Conversation) opening a mode picker: listen-and-say-back, say-it-in-Cantonese, or a mix. 8 sentences per run drawn from a seeded ring over the stage's 4+ character pool, round-robin across topics so a run spans the stage. Built in two stages: the sampler first, with no UI, proved by `tools/sentence-pool-harness.js` — **which immediately found a real defect the design had recorded as an acceptable caveat**: a run straddling a cycle boundary could show the same sentence twice within one run of eight, on 10 of 15 stages. Fixed by deduping within the run and returning `consumed` (positions walked) separately from `items`; DES-45 corrected rather than quietly patched. Stage 2 added the three screens, reusing `renderSpeakBreakdown()`, the result panels and `startSpeechRecognition()` unchanged — B and C differ only in the prompt block, which is why they were built together rather than staged apart. `tools/sentence-review-harness.js` renders every screen in every state across all 15 stages (240 renders), asserts availability stays cache-independent (the v122 trap), that listen mode withholds the target, that a produce mismatch states no verdict while a listen mismatch still does, and that every emitted control has a handler. Five new primitives with `DESIGN_SYSTEM.md` §2 and styleguide entries in the same commit. |
| DES-46 | v135 | **Two speech-matching fixes, both evidence-led.** `resolveHeard()` accepts a recogniser *revision*: when the accumulation fails, individual final segments are tried, so a corrected reading that arrived as a separate segment is no longer destroyed by appending. Accumulation is still tried first, so long conversation lines are unaffected. `normalizeChinese()` folds Arabic digits to Chinese numerals, because the recogniser returns 3 where 三 (saam1) was said. Measured on a real 13-attempt probe run, now committed as `tools/fixtures/tail-probe-numbers-t1-s03.json` and replayed by the new `tools/asr-replay-harness.js` — the first harness here whose inputs are recorded device output rather than constructed. Pass rate 2/13 → 3/13. **Two other hypotheses were tested and falsified first** (stop timing, discarded interims); see DES-46 and *Notes worth carrying forward*. |
| — | v137 | **Two fixes on the speak surfaces, shipped together.** *Spacing:* the sentence review's run progress bar sat flush against the speak card, and the summary's "run more" sat 2px under the Mark-reviewed button. Both were inline margins in MOCK-28 that never got a modifier class in the build — `.segs` and `.sr-skip` are bare primitives carrying no margins by design. Added `.sr-segs` (bottom margin only; `.speak-nav` above already supplies the top gap) and `.cp-finish + .sr-skip`, scoped to that adjacency so the per-item escape hatch stays tight. *Chat's "You said" line:* it had been rendering bare characters since DES-41 landed at v131 — the Learn sheet and the checkpoint review got jyutping, Chat renders the same line from its own code a thousand lines away and was missed. For an audience assumed not to read Chinese, that line was carrying no information at all. `charsToJyutping()` applied, handling the recogniser's stray punctuation and embedded Latin (我*弟兄你呢 → ngo5 dai6 hing1 nei5 ni1) without markers. `tools/jyutping-check.js` gains a source-level assertion that all three "You said" renderers emit a `speak-heard-jp` sub-line, mutation-tested. Both patterns are in *Notes worth carrying forward*. |
| — | v128 | **The standalone tier ladder was a one-way door into a path.** Found on device after v127. `goToTier()` entered the destination tier's owning path whenever *any* path owned it — correct inside a path (DES-30), wrong from Topics. Opening `modals` standalone and tapping the Tier 2 rung produced the Intermediate lesson's chrome: an up control reading *Intermediate*, a Mark Complete button, and no rung back down, because `renderTierLine()` correctly degrades to a statement inside a path. The escape, the DES-29 cross-reference, routed back through the same function into the *Beginner* path — so once used, the standalone ladder could not return you to standalone. The path branch is now gated on `state.fromPath`; the standalone branch that already existed as a fallback becomes the standalone route. **Live for all ten two-tier topics since v121** — it only became reachable on `modals` and `comparisons` at v127, which is why it surfaced then. `tools/tier-harness.js` gains a section asserting what the rung *does* in all four origin/direction combinations, plus a sweep of every two-tier topic; verified to fail against the v127 file before being committed against the fix. |

| — | v138 | **Four pieces of dead code removed, and the check that should have found them years earlier.** New standing check `tools/wiring-check.js` asserts both directions of the markup-to-handler agreement — *no stranded handler* (bound to something no render function emits) and *no unwired control* (rendered but nothing binds it) — over `render.js`, `app.js` and `index.html`. It is the backlog item *"give `dead-css.js` a JS direction, or write it a sibling"*, built to the candidate approach that item specified. **Two of its four findings were already known and logged**: the `getElementById('speed-' + s)` loop and the `[data-drawer-speed]` handler, both retired-drawer remnants found by the 2026-08-01 doc audit and carried in BACKLOG.md ever since. **Two were not**: the `[data-cat-jump]` handler and the `id="cat-anchor-${cat.key}"` markup at `renderTopicsScreen()`, the two halves of a removed category-jump feature, each invisible to every existing check and to the audit that found the other pair. All four unreachable, so the deploy is behaviourally identical — the only source change with any effect is a corrected comment. Also fixed: `tools/snapshot-harness.js` held a hand-written copy of `NAV_FIELDS` with 14 entries against `app.js`'s 15, missing `sentSpeakOpen` since v130, so for seven deploys it passed while testing a stale list; it now reads the array out of `app.js` and throws if the extraction misses. **Ten standing checks, all green.** |

| DES-47 | v139 | **Event delegation — `attachEvents()` is gone.** One listener on `#app` instead of 100 re-bound on every render. `attachEvents()` was 1,188 lines, 36% of `render.js`, and its length was architectural rather than neglect: rendering sets `app.innerHTML`, destroying every listener, so the function had to be the union of every screen's wiring in one scope with all 52 lookups guarded by `if (el)`. **That guard is why a broken control was silent** — rename an id and the guard steps over it and the button does nothing, with no error and no failing check. `#app` is emptied but never replaced, so the three delegated listeners are attached once and survive every render. **No markup changed**: the dispatch table is keyed on the id and data-attribute names that already exist, rather than on a new `data-action` attribute, which was the design first proposed and dropped after measuring — rewriting 39 attributes across every screen would have been the larger and far less verifiable half of the job. **DES-47 (innermost tapped control wins) is the behavioural half**, and it retires twelve local defences; see the register row and the note below. Also folded in: `freshConvoState()` replaces four hand-written copies of the conversation reset literal, and the two listen-mode auto-play blocks move into `afterRender()`, which is where everything that must happen once per render but is not a handler now lives — the easiest thing to lose in this refactor, since they only ran before because `attachEvents()` did. Verified: every control preserved one-for-one (55 ids and 47 attributes before, 55 and 47 after, none lost, none added, checked by script against the pre-refactor file); a purpose-built dispatch test proved innermost-wins, one-action-per-tap, no-op on unregistered controls, and correct resolution of all four declared nested pairs against the real table. `wiring-check.js` now reads the dispatch table — the one function it was designed to have to change — and gained a fourth assertion that neither retired convention can reappear. `sentence-review-harness.js`'s wiring assertion was updated for the same reason and re-verified to fail on a removed dispatch entry. **Ten standing checks, all green.** **Confirmed on device 2026-09-03** (Pixel/Chrome): all four nested pairs resolve to the inner control, the re-derived closures in Quiz, Word Review and Checkpoint Words follow the current word, listen-mode prompts play once per question, the Translate field keeps its caret, and the path diamonds draw on first load. |
| DES-48 | v140 | **Two device-reported defects on the speak surfaces, one root each, shipped together.** *The Chat play button was invisible during playback, on the learner's own bubbles only.* Not missing — brand-orange drawn on a brand-orange circle; sampling the reported screenshot showed the circle a uniform `#C2410C` with no glyph in it at all. `.bubble-row.right .bubble-play` was 0,3,0 and `.bubble-play.is-playing` below it 0,2,0, so the right side took the playing *background* and kept the resting *colour*. The deleted rule set `border-color: var(--brand-edge); color: var(--brand)`, which is declaration-for-declaration what `.btn-icon--brand` already gives that button at its only call site — a duplicate whose sole effect was to outrank the state below it, so **resting appearance is unchanged and the fix is invisible until you press play**. The `.cp-convo` pair has the opposite specificity ordering and was never affected, checked rather than assumed. The v125 comment claiming this bug class was retired is corrected in place: it was not, it survived in the one rule v125 left behind. *A correctly spoken sentence was accused of an error* — see DES-48. The recogniser wrote spoken numbers as digits, the per-digit fold from DES-46 turned `10` into 一零 rather than 十 (sap6), and `charsToJyutping()` silently dropped the digits so six syllables printed under eight spoken ones. `foldAsrNumerals()` is now value-aware for 1–4 digit runs and shared by matching *and* display, and all three "You said" renderers fold before printing. Verified end-to-end on the reported sentence: 8 of 8 ticks, green panel, no red mark. **Ten standing checks green**; `asr-replay-harness.js` gains the 24-form fold table, the reported case pinned by value, and an assertion that the fold never alters an authored target; `jyutping-check.js` gains a source-level assertion that no renderer prints raw heard state. Both mutation-tested. Fixture pass rate unchanged at 3/13, as expected — the fold was never what those attempts failed on. |

### Notes worth carrying forward

- **A rule that duplicates a primitive is not harmless — it outranks the states
  below it.** The v140 play-button defect was `.bubble-row.right .bubble-play`
  restating `.btn-icon--brand`'s two declarations at higher specificity, so
  `.is-playing` could set a background but never the matching colour. Nothing
  looked wrong at rest, which is exactly why it survived: **the duplicate and the
  primitive agree until a state tries to override one of them.** Two things
  follow. Before adding a rule, check whether the element already carries a class
  that says the same thing (this is the *check whether a primitive already
  exists* rule arriving from the opposite direction — not an unused primitive,
  but a used one restated). And when a state rule appears not to apply, compare
  specificity against every rule touching the same property rather than reading
  the state rule alone. **The v125 comment asserting this bug class was retired
  was wrong for four releases**, and asserted it in the same file as the rule
  that kept it alive; a comment claiming a class of bug is closed should say
  which rules were counted.
- **`dead-css.js` cannot see this, and the overridden-declaration script still
  isn't built.** Reinstating the faulty rule as a mutation test passes every one
  of the ten standing checks. That backlog item now has a named cost rather than
  a hypothetical one: it would have caught the v140 defect at the point it was
  written.
- **A fold, a normalisation, or any repair applied before comparison must be
  applied before display too, or the two will disagree in front of the user.**
  DES-46's digit fold was scoped "for comparison only, never for display", and
  that scoping is what produced the v140 numeral defect: the breakdown grid
  compared against 十 while the "You said" line above it printed `10`, and the
  jyutping under that printed neither. **The heard string reaches the screen
  through more than one path, and a repair applied to one of them creates a
  contradiction rather than a partial fix.** Both now route through
  `foldAsrNumerals()`, asserted by `jyutping-check.js`.
- **A silent skip is worse than a marked gap.** `charsToJyutping()` returns `''`
  for anything outside `[\u4e00-\u9fff]`, so digits produced no syllable *and* no
  `jp-unknown` marker — the DES-41 honesty rule never fired, because the
  character was skipped before the lookup rather than failing it. A filter placed
  ahead of a check quietly removes things from that check's scope. Worth asking of
  any guard clause: does this skip something the check below was meant to catch?

- **A defence written from what the markup looks like is not a defence.** Twelve
  local measures guarded nested controls before v139 — eight `stopPropagation()`
  calls and four `e.target.closest()` parent guards. A structural walk of the
  real markup found **four** actual nested pairs. Two thirds of the defences
  guarded nothing, and the ones that mattered were covered inconsistently: one
  parent guard listed three siblings and omitted the one control genuinely
  adjacent to it, which was safe only because that control had picked the other
  convention. This is *classify by declaration, not by shape* arriving in a third
  place, after the 69-vs-12 CSS miscount and the dead-CSS sweep that could not
  see JavaScript. **Measuring the nesting was itself two false starts**: by
  source proximity it reported 22 pairs, nearly all siblings a few lines apart;
  scoped globally rather than per function it invented a fifth pair from two
  render functions that happened to share a variable name. If a number is going
  to drive a decision, the first method that produces a number is rarely the one
  to trust.

- **Work that only runs because something else runs is invisible until you move
  it.** `attachEvents()` did three things that were not event binding at all:
  `paintDiamondRings()`, and two listen-mode auto-play blocks for the quiz and
  Word Review. They lived there for no reason except that it ran on every render.
  Deleting the function would have silently stopped all three — no error, no
  failing check, just prompts that never play and rings that never draw. They now
  have a named home in `afterRender()`. **Before removing a function that runs on
  a schedule, list what is riding along inside it**; the riders are never in its
  name.

- **A capability added to one surface is not added to the app.** DES-41 gave the
  "You said" line jyutping, and it was applied to the Learn speak sheet. Chat's
  conversation Speak mode renders the same line from its own code a thousand
  lines away, and kept showing bare characters through v133–v136 — the exact
  failure the feature existed to prevent, on the oldest of the three surfaces.
  Nothing tied them together, so nothing noticed. `tools/jyutping-check.js` now
  asserts at source level that every renderer emitting "You said" also emits a
  `speak-heard-jp` sub-line. **When a feature has more than one renderer, the
  count is the thing to assert** — not that it works where you just built it.

- **Inline spacing in a mockup has no home in the code.** MOCK-28 positioned the
  run progress bar with `style="margin-bottom:14px"` and the summary's "run
  more" with `margin-top:10px`. Both were lost in the build, because `.segs` and
  `.sr-skip` are bare primitives that carry no margins by design — the hub
  positions `.segs` with a `.cp-segs` modifier, and nothing did the equivalent
  here. The result shipped with the card flush against the progress bar. **When
  a mockup uses an inline margin, that is an unwritten modifier class**: either
  give it one before building (`.sr-segs`, `.cp-finish + .sr-skip`) or it will
  silently not exist. Worth a scan for `style="margin` in any mockup before
  calling its build done.

- **A probe can falsify the fix you were about to build.** Investigating a failed
  sentence, two implementation causes looked compelling on a code read: an
  instant `stop()` truncating the tail, and interim results being discarded at
  `onend`. Both were wrong. The 6000ms no-early-stop control failed just as
  often, and Chrome on Android emitted **no interim results at all** across 13
  attempts — the `interimResults = true` branch that has been in the code since
  Speak mode shipped does nothing on the only device that matters. Either fix
  would have been shipped with a plausible rationale, changed the shared
  recognition core used by three surfaces, and helped nothing. The instrument
  cost one file and one evening.
- **Split the sample by speaker before blaming the code.** The same 13 attempts,
  same phone, same session: the learner's 二 (ji6) came back as ji1 in 7 of 10
  attempts, the fluent speaker's as ji6 in 3 of 3. That contrast — not the
  transcripts alone — is what identified a real tone difference rather than a
  recogniser fault, and it is why only 1 of the 11 remaining failures was
  actually fixable in code. When a feature "does not work", check whether it
  fails for everyone before changing it.

- **A caveat you write down is a bug you have not measured yet.** DES-45
  recorded, in good faith, that a reshuffle "can place an item late in one cycle
  and early in the next — a mild near-repeat, mitigation not worth the
  complexity". The first run of `tools/sentence-pool-harness.js` showed the same
  sentence appearing **twice inside a single run of eight**, on 10 of 15 stages.
  The caveat was not wrong about the mechanism; it was wrong about the
  magnitude, because it was reasoned about rather than exercised. The pattern to
  carry: when a design note says "mild" or "rare" about something that was never
  actually run, treat that as an untested claim rather than an accepted cost —
  and write the assertion that would distinguish the two.
- **A harness that reads a constant it cannot see will pass while testing
  nothing.** The same harness's first run reported the boundary case as failing
  for the wrong reason: `const` declarations inside a `vm` context do not attach
  to the context object, so `SENT_REVIEW_RUN` read as `undefined`, the run
  length fell back to a default, and the cursor was set to `NaN` — meaning the
  boundary test never straddled a boundary at all. It now publishes the
  constants explicitly and **aborts** if they are not finite, rather than
  asserting against `undefined`. Any harness that pulls values out of another
  file should fail loudly when the extraction misses, because the default
  failure mode is a green test that exercises nothing.

- **A second source is how you find errors in the first one.** The corpus's
  jyutping had been hand-authored and never cross-checked against anything,
  because there was nothing to check it against. Layering a dictionary under it
  (DES-43) immediately surfaced 知 glossed as `ji1` instead of `zi1` in two
  files — an error that had been sitting in shipped content and, worse, would
  have silently won over the correct dictionary reading once layering existed.
  The generalisable bit is the **signature**: of 44 corpus/dictionary
  disagreements, 43 were legitimate Cantonese variation (32 tone-only, the
  colloquial raised tone; 11 literary/colloquial doublets like 聽 ting1/teng1),
  and the one real typo was the only case where **the rime and tone matched and
  only the initial differed**. That is not a pattern Cantonese variation
  produces, so it is a reliable typo detector, and `tools/jyutping-check.js`
  now runs it. When adding any second source of truth, ask what shape a
  disagreement takes when it is a real error versus when it is a legitimate
  difference — the two are usually distinguishable, and that distinction is
  worth encoding as a check rather than eyeballing once.

**Tone feedback from speech recognition was investigated to a stop and not
built.** 2026-08-22, across six probe builds (`tools/asr-probe.html`,
`tools/asr-testset.js`). This closes the second and last candidate path to tone
feedback; the pitch note below closes the first. Together they mean the direction
is shut with evidence behind it rather than shelved on a hunch, which is what
stops it being reopened every few months.

The premise under test was the one the *Speak mode: show what the recogniser
heard* backlog item rested on and which had never been checked: **a wrong tone
lands on a different real syllable, so the recogniser's own output is indirect
tone feedback.** Method was a corpus-derived test set — every prompt a real
syllable attested in the app's own content, 327 syllable bases, 139 of them in
two or more tones — with every item spoken twice, once correctly and once with a
*named* wrong tone, because a probe collecting only correct readings cannot
answer whether errors are detectable at all.

1. **Wrong tones are not detectable. 29% on sentences, 31% on multi-syllable
   words.** The recogniser snaps to the target regardless: 醫院 (ji1 jyun2) said
   as ji1 jyun5, 手臂 (sau2 bei3) as sau2 bei6, 大象 (daai6 zoeng6) as daai3
   zoeng6 all returned the correct word. Web Speech has no tone classifier — tone
   is one acoustic pattern among many inside a general speech-to-text model, so a
   wrong tone producing a different character was always a side effect rather
   than a measurement.
2. **Sentence context makes detection worse, not better.** The opposite of what
   was predicted going in. The language model repairs the tone error from
   context, so 我鍾意馬 (ngo5 zung1 ji3 maa5) said with maa2 still came back
   correct. Context helps *recognition* and therefore actively hides tone errors.
3. **`maxAlternatives` is ignored by Chrome on Android. 0 of 48 attempts returned
   more than one alternative.** The setting in `app.js` is dead, and the N-best
   list — the main lever reserved for buying leniency without losing detection —
   does not exist on the target device. Any future design assuming an N-best on
   Android is assuming something that is not there.
4. **Isolated single syllables return nothing at all. 22 of 24 attempts decoded
   nothing**, 19 of them with zero result events — the recogniser never accepted
   the audio. Not a tone problem: bare syllables are too short to clear Android's
   endpointer. This is the finding that scopes speak feedback to sentences, and
   it is kept as a documented negative rather than dropped.

> **Process note, and the expensive half of this.** Five of the six probe builds
> had a fault, and every one traced to a single omission: **the probe copied
> Speak mode's configuration without reading its handler.** `lang`, `continuous`,
> `interimResults` and `maxAlternatives` were taken from `startListening()`, and
> `normalizeChinese()` / `fuzzyMatch()` were lifted verbatim so the policy
> measured was the one that ships — all correct, none of it sufficient. Forty
> lines below the settings, `startListening()` carries three explicit rules for
> Chrome on Android's final-result delivery plus a `deduplicateRepeats()` safety
> net, each written because the app had already hit that behaviour. The probe
> reimplemented that handling from the specification, got it wrong, and burned
> three builds converging on what was already in the codebase.
>
> **The bug pattern itself is worth carrying: Android emits CUMULATIVE finals at
> successive indices.** Each final restates the whole utterance so far rather
> than adding only the new words, so joining them stutters. Speaking
> 我好攰，所以想早啲瞓 (ngo5 hou2 gui6, so2 ji5 soeng2 zou2 di1 fan3) produced three
> finals — the first three characters, then the first five, then the whole line —
> and joining them yielded a transcript carrying the opening twice and the middle
> twice, character-for-character what appeared on screen. Storing finals by index does *not* help, because the
> restatements arrive at different indices; the fix is to fold (replace when a
> final restates and extends, append only when genuinely new). Two wrong fixes in
> a row came from reasoning about what the spec says rather than what the device
> sends. **The generalised guards are now in `docs/PROBE_METHOD.md`** — read the
> shipped handler a probe mirrors, and instrument the raw event stream at the
> second consecutive fault rather than the fifth.
>
> **A second omission, of the same shape.** The display feature this probe was
> meant to justify was proposed as new work; it already existed.
> `renderSpeakBreakdown()` aligns heard against target by edit distance and shows,
> per syllable, whether it matched and which character came back instead, coloured
> by tone. The remaining work is extending it to sentence practice, not inventing
> it. Same failure as `.btn-icon` sitting unused for a whole phase.

**Tone feedback from pitch measurement was investigated to a stop and not built.**
2026-08-17, across four probe builds and a working three-way prototype. DES-37's
grading model is not wrong; it was validated on the wrong thing, and nothing built
on top of it survived contact with real recordings. Four findings, each of which
cost a build to learn:

1. **Pitch-only syllable segmentation does not work.** A pre-registered grid of
   seven runs over all 395 multi-syllable words, one setting moved at a time,
   with the bar stated in advance: the classes had to rank LONG ≥ SHORT ≥ NONE,
   because that ordering is a claim about consonants rather than a fitted one.
   **It held in zero of seven runs.** SHORT beat LONG in every single one — best
   case LONG 60.2% against SHORT 87.1%. The modelling error was conflating
   *voiceless* with *silent*: a stop closure is genuine silence, whereas frication
   is **loud**, sailing through an energy gate and offering YIN spurious
   periodicity. So b, d, g, z segment well and s, c, f, h do not, exactly
   backwards from the story about interval length. See `tools/segment-probe.html`.
2. **Comparing a learner against synthetic citation forms is systematically
   biased, and the bias is unfixable within that design.** The prototype reported
   all four syllables of 好耐冇見 (hou2 noi6 mou5 gin3) as *flatter than it should
   be*. Four independent judgements do not fail identically — and the cause was
   already written three notes below this one: fluent speakers do not produce
   citation forms on demand, and the exaggerated version is the measurable one.
   The TTS clips are fully-exaggerated citation forms, so **"you were flatter than
   that" is a permanent verdict** against any human speaking normally. If tone
   feedback is ever revisited, the reference has to be the learner's own
   calibrated range, not a synthesiser's.
3. **The verdict and the picture fail together, so the picture cannot be salvaged
   as a consolation prize.** A pitch value pinned at the top of the tracker's
   search range — 500 Hz, about 27 semitones above a 106 Hz voice — draws as a
   flat-topped rectangle, and the vertical axis then stretches to fit it,
   squashing the real pitch movement into roughly a quarter of the picture height.
   Add the fragmentation from unvoiced gaps and a curve overlay is not merely
   imprecise, it is unreadable.
4. **Four faults, one shape: a confident answer resting on data too thin to carry
   it.** A model contour of 23 usable frames against a microphone's 49 for the
   same word; a microphone take at 23% coverage judged as if complete; a plot that
   deleted the silences and joined the pitch either side, inventing cliffs across
   half the picture width; and a time-warp that absorbed a real two-semitone error
   down to one, because on a slope a vertical shift and a horizontal shift are the
   same thing. None was an arithmetic slip. Each was a reasonable-looking step
   encoding an assumption nobody had checked. **On phone-recorded speech, pitch is
   far less trustworthy than a tidy curve makes it look, and any feature built on
   it needs a reliability gate that withholds rather than guesses.**

> **Process note, and the more useful half of this.** Each of the four faults was
> found, fixed, and followed by a proposal to continue — the accumulating *pattern*
> was the actual finding and it took being asked to step back to see it. Two
> guards earned their place: **pre-registering the whole parameter grid and the
> pass/fail bar before running any of it**, which is what made "zero of seven"
> interpretable rather than an invitation to try an eighth setting; and **testing
> the judgement against synthetic inputs whose right answer is known by
> construction**, which caught two silent failures before they reached a device,
> both flattering the learner. Neither would have been reached by reading code.

**A negative result is worth a version number's worth of documentation.** Nothing
shipped from the 2026-08-17 session — no `sw.js` bump, no deploy row — but the
`tools/` diagnostics and the four findings above are the output, and they are the
reason the backlog line no longer reads as though this were straightforward. The
one reusable positive: **Azure returns per-character syllable times for zh-HK if
the reference text is sent with the characters spaced apart.** 朋友 (pang4 jau5)
comes back as one lumped span as written and as 朋 (pang4) then 友 (jau5) when
spaced; 請多關照 (cing2 do1 gwaan1 ziu3) goes from 2 of 4 syllables resolved to
4 of 4. Everything
else in the response is unusable for this — the `Phoneme` field is present and
**always empty** for zh-HK across 11 runs, and `AccuracyScore` returned 100 on a
microphone take peaking at 6%. See `tools/align-check.html`.

**Azure Pronunciation Assessment cannot score Cantonese tone.** Confirmed by
measurement, not inference: 詩 (si1), 試 (si3) and 事 (si6) all returned 100 on
accuracy, fluency, completeness and overall, with ErrorType "None", *including*
when the decoded text differed from the reference. The score only moves when a
consonant or vowel is wrong. This is structural rather than a bug — the assessment
scores phonemes, and tone is suprasegmental; Azure's tone-and-intonation dimension
is **prosody**, which is en-US only. zh-HK *is* in the supported-locale list, so
the locale is not the issue. A market search found no alternative: Speechace is
English-centric, and SpeechSuper returns a separate tone score — exactly the
architecture wanted — but supports Mandarin, not Cantonese. **Do not re-propose
Azure scoring for tone.** Two things from that investigation are still useful:
Azure's REST endpoint **is reachable from a browser origin** (CORS permits it, no
SDK or CDN dependency needed), and its response carries **per-word and
per-phoneme `Offset` and `Duration`** for zh-HK — the time alignment the sentence
surface will need.

**An HTTP 200 is not an outcome.** The Azure pronunciation probe posted WebM
audio to an endpoint that accepts only WAV/PCM and OGG/OPUS. It did not answer
400. It answered **200 with an empty recognition** — and the probe's own log
printed "SUCCESS" on the status code, so three sessions were spent debugging
transport that was never broken. Then the same probe reported "no scores" six
times over responses that contained a full set of them, because the REST API
returns scores *flat* on `NBest[0]` while the SDK nests them under a
`PronunciationAssessment` object, and the code was written against the SDK shape.
It then printed a confident recommendation to abandon REST for the SDK. **Judge
success on the payload, never the status code**, and where two API shapes exist,
accept either rather than assuming which one is in play. This is the same failure
as the stale clone: the concrete-looking artefact was the wrong one to trust.

**A reference set can be the noisy side of a comparison.** Tone measurement was
validated against a native speaker's recordings and scored 2/8 — read at first as
"the learner's tones are wrong". The opposite was true. The learner's careful
citation forms measured 8/8 on shape, 8/8 on band, with 15/15 tone pairs clearing
the noise floor; the native speaker's natural, relaxed productions came out
compressed at 5/8 on band with a tightest pair *below* the noise floor. Fluent
speakers do not produce citation forms on demand, and the exaggerated version is
the measurable one. **Before concluding a signal is bad, check whether the thing
it is being measured against is worse** — and prefer a reference averaged over
many exemplars to one recorded in a single session.

**Generated audio carries utterance-level prosody that is not part of the word.**
Building tone references from the 189 single-syllable clips produced *every* tone
sloping downward, including tone 2, which must rise. Each clip is a complete
utterance, so the synthesiser applies a phrase-final fall — about −1.75 st,
shared by all six tones and belonging to none of them. It has to be estimated from
the data and subtracted. Two settings also needed retuning from their live-mic
values: at the mic threshold only 91 of 189 clips yielded enough voiced frames and
tone 4 collapsed to a single exemplar. **Pre-generated audio is not neutral test
data** — it carries the choices of whatever produced it.

**Measuring for a design question found a data-corrupting bug.** The tier work
started as "where should the pills sit". Counting which path owns which tier —
to answer that question, not to look for defects — is what surfaced DES-30, a
handler that had been writing completion to the wrong lesson since tiers existed.
No standing check could have caught it: every file parsed, every class was used,
every token was declared. **The bug lived in the gap between two pieces of state
that were each individually valid** (`state.currentRound` said 2,
`state.fromPathTier` said 1) and only wrong together. Where two state fields must
agree, something should assert that they do — which is what `tier-harness.js` now
does for the premise underneath them.

**A design decision can rest on a fact about the data, and that fact can rot.**
The ladder is only correct while every (topic, tier) pair belongs to exactly one
path. Nothing in the app enforces that; it is a property of how the path files
happen to be authored. Authoring a topic into two paths would break the
cross-reference silently — it would name a path, just the wrong one. **When a
design rests on a data invariant, the invariant needs a check, not a comment.**

**Optimising for the current data is a trap when the roadmap contradicts it.**
Mockup 23 recommended a control tuned for "8 of 42 topics have a second tier",
which was true and about to stop being true. The redraw at three tiers changed
the answer outright — two of the three options wrapped and grew the header from
one row to two. **Ask what the data will look like after the next backlog item,
not what it looks like now**, before letting a count drive a layout.


**A control can render correctly and navigate wrongly, and a rendering check
cannot tell.** `tier-harness.js` was written at v121 to protect the tier ladder.
It lifted four functions by name, asserted the data premise, simulated a
three-tier topic — and passed throughout the seven versions the v128 defect was
live, because every function it held draws the ladder and none of them is what
the button calls. The check verified the picture, not the behaviour. **When a
control is worth a standing check, the check has to include what happens after
it is pressed**, which is what the harness now does by stubbing `render()` and
`pushNav()` and reading the resulting state.

**A rule that is right in one context is a defect when applied to both.** DES-30
— a tier change moves `activePath` to the destination — is correct and closed a
real data-corrupting bug. It was simply scoped too widely: it is a rule about
what happens *inside a path*, and v121 wrote it as a rule about tier changes.
The comment above `goToTier()` even stated the over-general premise in plain
words — *"because every tier belongs to a path, a tier change is always a path
change too"* — and it read as a justification rather than the error it was.

**A closed rollout is not a conformant app.** Every v121 fix was drift from a
decision that already existed — two from mockup 10, one from §1, one from §3.6 —
and none was caught by any of the seven standing checks, because **no check reads
the spec.** The checks verify internal consistency (no duplicate declarations, no
undeclared tokens, no dead classes); they cannot tell you that
`.page-header-title` uses the wrong one of two declared fonts, because both are
declared and both are used. The gap is structural, and the only thing that closed
it was looking at the running app beside the written rule.

**A token that is declared, used, and wrong is invisible to tooling.**
`--font-serif` on a Latin title is valid CSS, passes every check, and renders
without warning — Noto Serif TC has Latin glyphs, so the string never falls
through to the fallback that would have exposed the mistake. This is the *inverse*
of the `--font-cjk` bug recorded below: that one referenced an undeclared token
and fell back to a generic serif, which at least looked wrong. **The failure that
degrades gracefully is the one that survives four phases.** Where two tokens
could both plausibly apply, the rule needs to be written at the call site, not
just in the spec — which is why DES-26 is stated as a prohibition ("never a Latin
title") rather than an assignment.

**Progress can be reported twice, and one of the two will be wrong.** The stage
hairline and the stage stepper measured the same fact. At 40% nobody noticed; at
100% the hairline filled the full width and became a divider, which is how it was
first reported. A redundant indicator is not merely redundant — it has states its
sibling does not, and those states are unreviewed. Before adding a second view of
one quantity, check whether the first already answers it more precisely.


**Fixing the instance is not fixing the rule.** DES-33 established that a control
whose label names a destination must go there — and the first pass changed only
the screen the bug was reported on. Three more controls had the identical fault,
including one reading *"✓ Checkpoint complete — back to path"* that went to the
dashboard. They survived because each screen had grown its **own** back handler:
four handlers, three of them `history.back()`, no single place where the rule
could be stated. The fix was to collapse them into one `[data-up]` handler over a
named vocabulary. **When a decision is a rule rather than a fix, the next step is
to find every site the rule governs** — and if there is no single place to enforce
it, making one is part of the work.

**The test for a back control is the number of parents, not the wording.**
`history.back()` is correct wherever a screen has exactly one way in — the label
cannot lie if there is only one place to return to. It is wrong the moment a
second entry point exists. So the audit question is not "does this say Back?" but
"how many things set the state this screen renders from?" — which is answerable
by grep, and was: one setter for the checkpoint activity (safe), four entry points
for the path timeline (not).

**A modifier that never outranks its context is invisible, not weak.**
`.bubble--gap`, `.bubble--correct` and `.bubble--wrong` are one class (0,1,0) and
are emitted on bubbles that `.bubble-row.right .bubble` (0,2,0) already styles.
Their `background` and `border` therefore never applied, and the answered states
have been rendering in the plain user-bubble skin for as long as they have
existed. Nobody reported it because the result still *looked* deliberate. Two
things generalise. **A BEM-style `--modifier` is not automatically stronger than
the rule it modifies** — it is weaker than any two-class contextual selector, and
component CSS is full of those. And this was found only because the redesign
forced a re-read of every bubble state; **a defect that produces a plausible
result has no reporter**, so the only way it surfaces is a deliberate audit.

**Ask what an `!important` is protecting before deleting it.** The rule forcing
user-side jyutping to white looked like over-caution and was load-bearing: every
tone colour measured between 1.13:1 and 2.13:1 on the saturated fill. Deleting it
alone would have replaced *absent* tone information with *illegible* tone
information, which is worse. What made it removable was changing the ground, not
the rule. **The fix for a defensive override is usually upstream of it.**

**An availability check that reads a lazy-loaded cache is a clock, not a fact.**
`checkpointProgress()` asked "does this checkpoint have Words to offer" by
counting the words, which meant reading `store.topicCache` — populated
per-topic, on demand, after the first paint. So the same question returned
different answers depending on *when* it was asked, and the dashboard asked it at
the only moment the answer was wrong. The tell in the bug report was that tapping
HOME appeared to fix it: nothing was fixed, the cache had merely warmed in
between. **Before writing a predicate, ask what it reads and whether that thing
is loaded yet** — and prefer the reference data, which `init()` has by the first
paint, over anything lazy.

**Two rules can tie on specificity and split a component between them.** The
blank play button was not one rule losing; it was `background` resolving from one
rule and `color` from another, at identical 0,4,0 specificity, decided by source
order. Neither rule was wrong alone. This is the cross-rule duplicate problem in
BACKLOG.md wearing a different face — there the later declaration silently wins
and the earlier is dead; here **both win, on different properties, and produce a
state neither author intended.** When a state rule and a resting rule can tie,
give the state its own rule at higher specificity rather than relying on order.

**A backlog count taken from memory was out by a factor of six.** BACKLOG.md
recorded *"emoji still in speak mode — five sites"* for two phases. Measured at
v124 by scanning for pictographic codepoints in emitted strings: **33**, across
Translate, the checkpoint, both result screens, the sentence chips, the quiz
toggle and the conversation controls, with speak mode contributing eight. The
entry was not wrong about speak mode; it was written from the place the problem
had last been noticed, and it fixed the scope of the problem at the scope of that
observation. **A backlog item that names a count should say how the count was
derived**, or the next person plans against the anecdote. Same shape as the
`.speed-btn` and drawer retirements, both of which missed about a third of their
target for the same reason — and this is the third time.

**A provider can be missing a phoneme, and the app has no way to know.** Google's
Chirp3-HD `yue-HK` voice cannot produce a bare syllabic nasal — Cantonese has two
(m̩ and ŋ̍) and both came back with a vowel inserted, across 207 of 1,376 files.
Nothing in the pipeline could detect it: every request returned 200, every file
was valid MP3 of a plausible length, and every other Cantonese-specific character
was fine. **The only detector was a human ear**, and it took a year to be noticed.
Two things generalise. First, the *variation* was the diagnosis: the inserted
vowel changed with the neighbouring syllables, which is what distinguished an
acoustic model improvising from a dictionary returning the wrong word — a
deterministic error would have been identical every time. Second, when the
diagnosis pointed at a fix, the useful move was to **ask the API what exists**
rather than read the docs: `voices:list` showed `yue-HK` has only two families,
where the documentation had implied WaveNet and Neural2 were available. Google's
own pages contradicted each other twice during the investigation, on SSML support
and on Preview status.

**Building on a Preview-tier dependency is a decision, not a default.** `yue-HK`
entered Preview on Chirp3-HD in December 2025 and was still Preview eight months
later with no published GA date. Missing an entire phoneme class of the target
language is the kind of defect Preview status exists to warn about, and the
warning was there to be read before a single file was generated. Azure's `zh-HK`
Neural voices are GA and have been since 2021.

- **Checkpoint chrome is a wrapper class, not an argument.** `renderQuizCore` and
  `renderConversation` are reused by checkpoint activities; milestone treatment
  comes from `.quiz-ms` / `.cp-convo` on the wrapper. Do not reintroduce a colour
  parameter to make a variant.
- **Removing a `color` parameter can leave a live `${color}` behind.**
  `node --check` passes it — it is valid syntax and a runtime `ReferenceError`.
  This bit twice during phase 2 (`renderQuiz`, `renderRoundSelector`). Scan every
  function body after changing a signature.
- **A component tweak written against a primitive selector leaks everywhere.**
  `.track { margin-bottom }` was briefly applied globally before being scoped to
  `.quiz-progress`. Scope component adjustments; never edit a primitive for one
  screen's benefit.
- **Splicing a declaration into an existing rule can be silently overridden.**
  `.word-card` ended up with `border: var(--border)` early and the original
  `border: 2px solid;` later; the later won, resolving to `currentColor` and
  painting a near-black frame. Replace whole rules, and run the duplicate-
  declaration audit before shipping (see IN_PROGRESS.md for the snippet).
- **A "consistent treatment" block can silently disable a primitive.** A rule
  named *Circular play buttons — consistent treatment* declared `transition` for
  six controls. Sitting after the primitive layer, it overrode `.btn-icon`'s own
  transition entirely. Grouping rules by comment heading is not the same as
  owning the property — check where a shared block sits relative to what it
  duplicates.
- **A tap minimum declared in a base rule can be undone by a layout rule.**
  `.quiz-replay` set `min-height: var(--tap-min)` and a later "more breathing
  room" rule reset it to 36px; `.quiz-next` never declared one at all. Both are
  fixed. Audit for `min-height` under 44px on anything with `cursor` before
  assuming the token is being honoured.
- **A tap target built from padding is invisible to a check that reads
  `min-height`.** The stage stepper shipped at 42px — 20px node plus 11px padding
  each side — and the standing check reported clean because no `min-height` was
  declared. Declare `min-height: var(--tap-min)` explicitly even when padding
  would already reach it, so the check can see it. The stricter version of the
  check is in IN_PROGRESS.md.
- **The same rule can exist twice in one *file*, not just twice in one block.**
  `.cp-done .cp-card .path-step-title` was declared with the new muted colour and
  again forty lines later with the old jade, at equal specificity — so the later
  one won and the change would have appeared not to work. The duplicate-declaration
  check only looks inside a single rule. Grep for the selector, not just the block.
- **Components sit below primitives, so a component class beats a primitive
  modifier.** `.cont-next-node`'s brand tint silently overrode `.node--cp`'s
  milestone. This is the "don't edit a primitive for one screen" rule read in the
  other direction, and it is easier to trip: the component looks like the narrower,
  safer thing to write. See DES-17.
- **A post-render hook belongs where every render path passes.** `paintDiamondRings()`
  was first called at the end of `render()`, which has five separate exits — a ring
  on any screen reached by another exit would silently never paint. It now runs at
  the top of `attachEvents()`.
- **A mockup carries its own bugs; it is an argument, not an implementation.**
  Mockup 10's continuation card had the label and topic name as inline spans with a
  `margin-top` that could not apply, so they would have collapsed onto one line, and
  its mark button computed to a 39px tap target. Re-derive metrics when porting
  rather than transcribing.
- **Executing a render function catches what reading it does not.** Running the new
  path functions against the real `learning_paths.json` with stubs caught a
  reference to a `cp` variable that does not exist in that scope, a forward node
  numbering by whole-path instead of stage position, and the specificity collision
  above. `node --check` passed all three.
- **Classify by declaration, not by shape.** A first pass counted 69 rules as
  "card-like" because they declared background + border + radius. Measured
  strictly against `.card`'s four declarations, only 12 matched — the rest were
  buttons and pills. The reverse also bit: `.cp-optional` looked like a chip in
  CSS and is actually a full sentence, so it was pulled from the migration.
- **Tone colours stayed data.** The six `TONES` values are still applied
  per-syllable by `colorJyutping()` and are deliberately outside the token block.
  The only remaining `${...}` colour interpolations in `render.js` are these.
- **Four byte-identical alias tokens** sit in `:root`, none of them in
  DESIGN_SYSTEM §1.4: `--muted-light` = `--muted`, `--feedback-good-text` =
  `--jade`, `--jade-bright` = `--feedback-good`, and `--brand-text-dark` =
  `--brand-dark`. Retire all four. (`--header-icon` = `--header-text` is also
  identical but is deliberate and documented.)
- **A styleguide can drift *ahead* of the code, not just behind it.** The usual
  assumption is that `styleguide.html` lags. It also ran ahead: it documented the
  unbuilt docked bar and tab bar in full sections while the `.cont` continuation card
  — shipped in v109 — had no entry at all. A reader would have concluded the bar was
  built and the card wasn't. Every section now carries a built / not-built tag, and
  the check is *bidirectional*: does each built component have an entry, **and** does
  each entry describe something that exists?
- **A component can survive a whole convergence by not being on anyone's list.** The
  topic subtabs kept their pre-system treatment — three bordered boxes with a solid
  brand fill on the active one — through four phases. They had no §2 primitive entry,
  no styleguide section and no register row; the only trace anywhere was the words
  "active subtab" in §4's state table. Nothing was ever *wrong*, so nothing flagged.
  When auditing, enumerate from the **screen** as rendered, not from the docs, or the
  gaps in the docs are invisible to the audit. *Closed at v114 — the subtabs now have
  all three: a primitive, a styleguide section and a register row.*
- **A retirement pass driven by remembered names misses roughly a third of the
  target.** v117 retired the drawer and searched for the names it knew. The v120
  sweep — which enumerated every declared class and asked whether any emitter
  existed — found a further eight drawer- and Home-era remnants, including
  `.nav-subitem` and the `--ink-drawer` token, plus `.speed-row` / `.speed-label`,
  siblings of the `.speed-btn` pocket retired in that very deploy. Retire by
  sweep, not by recall — and note that grouped selectors hide the survivors: four
  of the remnants sat inside comma-separated rules whose other members were live,
  so deleting whole rules would have taken working code with them.
- **A sweep only covers the language it enumerates.** `dead-css.js` closed the
  recall problem for CSS and immediately created a blind spot: it reads declared
  classes, so **dead JavaScript is invisible to it**. The 2026-08-01 doc audit
  found two `state.speed` writers in `render.js` (~line 2066) with no emitter
  anywhere — a `getElementById('speed-' + s)` loop for the retired header speed
  control, and a `[data-drawer-speed]` handler for the retired drawer. They sit
  140 lines below a comment correctly stating the settings sheet is the sole
  writer of `state.speed`. **Three times** now the second half of a pocket has
  survived the first, and this one survived the sweep built to stop it happening.
  The equivalent check for JS is *handler binds to a selector nothing emits*;
  `dead-css.js` should grow that direction, or a sibling tool should. Logged in
  BACKLOG.md. *Built at v138 as `tools/wiring-check.js`, to exactly the
  approach this note specified.* **Two things are worth carrying from how that
  went.** First, the sibling found a **fourth** pocket this note did not: the
  `[data-cat-jump]` handler and the `cat-anchor-${cat.key}` ids, the two halves
  of a removed category-jump feature. So *four* times, not three — and the
  extra pair was invisible to the very audit that found the speed writers,
  because a doc audit reads what it thinks to look at while a check enumerates.
  Second, and less comfortable: **the two speed writers sat in BACKLOG.md for a
  month with a six-line fix attached.** Knowing about dead code is not the same
  as the code being gone, and a defect with a written fix that nobody executes
  is indistinguishable from an undiscovered one. If a finding is cheap enough
  to fix, fix it in the session that finds it rather than logging it.
- **Renaming a field that persists outside the app is a data migration, not a
  refactor.** `state.homeView` lived in `NAV_FIELDS`, so it was serialised into
  `history.state` — which survives a deploy. After the rename, entries written by
  the previous build still carried the old key, and `applyNavSnapshot()`'s
  `if (f in snap)` guard skips anything absent **without complaint**, so the field
  would have kept whatever the current screen left it with rather than erroring.
  The symptom would have been a back button that appears not to work, on a subset
  of users, only for entries created before they updated — nearly impossible to
  reproduce deliberately. **Before renaming any field, ask what has already
  written it to storage or history**, and migrate at the read boundary.
- **A dimension token copied from a mockup will not match the component built
  from it, and the error is silent.** `--tabbar-h` said 58px because that is what
  the mockup drew; the built bar computes to 46px — `--tap-min` plus a 2px rule.
  Four wrapper clearances used the wrong figure for a whole deploy and nothing
  looked wrong, because over-reserving scroll clearance is indistinguishable from
  generous spacing. Under-reserving would have been caught in QA immediately.
  **Derive dimension tokens from the built rule, not the drawing**, and re-check
  them when the component changes.
- **A rule can be sound and still describe a layout that never arrived.** §3.10
  hid the tab bar inside topics to avoid colliding with the docked action bar. The
  118px arithmetic was right and the reasoning was right — but the action bar was
  never built, so for four phases the rule governed a collision between one real
  element and one imaginary one. Nothing flagged it, because a rule about two
  unbuilt things is not *wrong* until you build the first one. When implementing a
  rule, check that **both** sides of it exist; a conditional whose other branch was
  never built is indistinguishable from a live one in prose.
- **Dead CSS pockets cluster, and the count keeps rising.** v117 retired five:
  `.bottom-nav` / `.nav-btn` / `.placeholder-screen`, `.speed-btn` / `.speed-btns`,
  and `.nav-sub` / `.nav-sub-item` / `.ns-badge` — the last found only because it
  was the sole remaining consumer of the `--drawer-*` tokens, i.e. found by
  following tokens rather than selectors. Two of the five had descendants under a
  stale comment heading that survived the parent's removal. **Grep for the parent,
  then grep for its descendants separately**, and check token consumers as well as
  class call sites.
- **A private demo class can quietly squat on a real component's name.**
  `styleguide.html` used `.nameplate` for a local page demo. When the app's own
  nameplate became a real component at v116, the name was already taken by
  something unrelated in the one document meant to describe the app's components —
  so a reader comparing the two would have found a match that meant nothing. Renamed
  to `.sg-plate`. Styleguide-local classes should carry the `sg-` prefix precisely
  so they cannot collide with names the design system may later want.
- **A styleguide section written in private vocabulary cannot be diffed against
  the code.** The Header section described the centred nameplate correctly for four
  phases while the app shipped it left-aligned — and the reason nothing caught it is
  that the section's demo used `.sg-header`, `.nameplate` and `.icon.left`, none of
  which exist in `styles.css`. There was no shared name to compare on, so the
  bidirectional check ("does each entry describe something that exists?") had nothing
  to bite on: the entry described a *design*, not a *component*. Every styleguide
  section should name the real classes, and the class line is the part to trust.
- **A document can drift against *itself*, and the prose is what travels.** The
  styleguide's Subtabs note said the edge carrying the 2px rule was the only
  difference between the subtabs and the tab bar. The CSS four lines below it had
  always said otherwise — `.tabs--top` flips the axis, gap, padding, icon size and
  type scale as well. The sentence, not the code, was copied into DESIGN_SYSTEM §2
  and from there into the phase 6 brief, so one wrong clause reached three documents
  while the correct version sat untouched in the same file. Drift is usually assumed
  to be *between* artefacts; check a doc against its own examples too, and prefer
  copying the code.
- **A register row can be wrong rather than missing, which is worse.** MOCK-11-bar's
  row described two separate decisions as one — mockup 11's *subtab* matrix and
  §3.10's *tab bar* matrix — and cited DES-12 for the wrong one. That mis-scoped
  phase 5 as blocked on a tab bar it never needed, and hid two genuinely unbuilt
  rows. A row that reads plausibly gets trusted; name which artefact a row means.
- **A later mockup can revise an earlier one silently.** Mockup 12 changed two rows of
  mockup 11's matrix — *Quiz · mid-question* from "hidden" to completion-only, and
  *Quiz · result* from "merged" to continuation-returns — and neither revision was
  recorded anywhere, so both read as built when neither was. When a mockup supersedes
  part of an earlier one, say which rows.
- **A mockup's stated rationale can expire while its conclusion stays right.** Mockup
  12 justified dropping the forward action mid-question by pointing at two competing
  *fills*. MOCK-10-cont later made the forward action a tint, so the fills no longer
  compete — but the exception is still correct, now on **label** ambiguity, which also
  makes the "Next question" relabel load-bearing rather than cosmetic. Re-derive the
  reason before deciding a decision has lapsed.
- **Expected-output checks decay; deltas don't.** Standing check 2's documented figure
  drifted from "around fourteen" padding-built targets to a real 15, and an ad-hoc
  rewrite of the snippet briefly reported 20. Run the check against
  `git show HEAD:styles.css` as well as the working copy and compare the two counts —
  the delta is what the rule ("the list should not grow") actually asserts.
- **Two tokens have no call sites** and are deliberately retained: `--sp-8`,
  which completes the spacing scale, and `--feedback-good`, whose `-tint` and
  `-text` siblings are in use. A scale with a gap is worse than a scale with an
  unused step. Re-measured 2026-08-01: `--bar-h` has 1 call site and `--tabbar-h`
  has 6, both acquired when the docked bar and tab bar were built at v118 and
  v117 — this note said four tokens for as long as it took those two to land,
  which is the shape of every other stale figure in these documents. `--edge-emph`
  has 4, `--measure-text` 1, `--jade-edge` 10, `--feedback-bad` 9.

## How this app is tested

**QA is organic and fix-forward.** The app is tested by being used, and defects
are fixed as they surface rather than hunted in scheduled sweeps. Adopted
2026-08-10, closing the *Full Stage 2 QA walkthrough* item that had sat in
BACKLOG.md since the design-system rollout ended at v120.

That item proposed one deliberate pass across topic Learn/Chat/Quiz, Word Review,
both conversation types, the speed settings and a checkpoint hub. It is closed as
**done in substance** — those screens have been walked in ordinary use, and every
defect found since v120 came from exactly that. It was never a claim that the
screens were untested; it was a claim that the testing had not been formalised,
and the formalising is what has now been dropped. Two things had also gone stale:
the label — no *Stage 1* or *Stage 2* is defined anywhere in the repo, the
numbering came from a chat that never reached the docs — and the screen list,
written at v120 and missing the Home dashboard, the path timeline, the standalone
context row and the tier ladder, all of which shipped after it.

**This is recorded rather than simply deleted** because a removed backlog item
leaves no trace, and the next reader to notice that no formal QA sweep has ever
run will propose one. It has been considered and declined. What carries the load
instead:

- **The nine standing checks** (IN_PROGRESS.md), which cover what is mechanically
  checkable — CSS, navigation, storage migration, tier data and behaviour, and
  content coherence. `validate.js` gained an **agreement check** at v129 tying
  `SPEAK_FINAL_PARTICLES` in `app.js` to `particles.json` — the first of the
  agreement-pairs class in BACKLOG.md to be built, and the pattern the rest of
  that item should follow.
- **Change-scoped QA per deploy**, given as *screens that changed* and *screens
  sharing the changed code*, so each deploy is judged on its blast radius rather
  than the whole app.
- **A check written against each defect found in use**, which is what turns a
  one-off fix into cover. The v128 tier-ladder defect is the worked example.

The trade is deliberate and worth stating plainly: a defect on a screen that is
rarely opened will live longer here than under a scheduled sweep. That is
acceptable for a single-user study app and would not be for a paid product — so
**revisit this before any subscription launch**, not before.

## Deploy labelling

Future work is **not** given `sw.js` numbers in advance. A phase lists its deploys
ordinally (*phase 4 deploy 1, 2, 3*) with the reason they group; the absolute
version is assigned when a deploy is actually cut and recorded in the table above.
Adopted 2026-07-30 after phase 4 ran to five deploys against three planned, which
under the old scheme would have left stale numbers across four documents. The
forward numbers were never a safeguard — what carries the weight is the grouping
and its rationale, and the start-of-chat check needs only the *current* version,
which is still recorded in every doc header. *(This is a process convention, not a
design decision, so it is deliberately not in `DESIGN_DECISIONS.md`, whose scope is
UX and visual design. It may be worth a line in the project instructions.)*

## Architecture worth knowing
- Persistence routes through an async storage abstraction layer, built ahead of
  an eventual Supabase migration.
- Two separate, non-interchangeable credentials: a **Gemini** key (Google AI
  Studio) for the Translate feature, and **Azure AI Speech** (`SPEECH_KEY` +
  `SPEECH_REGION` environment variables) for TTS generation. The Azure key must
  never enter the repo — it is public, and git history keeps a key after the line
  is deleted. *Changed at v123: TTS generation was Google Cloud via `gcloud` CLI
  auth until then. `tools/generate-audio.js` keeps the Google backend behind
  `--provider=google` as the A/B reference, not as a fallback — for this corpus
  it produces known-defective audio.*
- Service worker caches audio automatically via the existing generic runtime
  fetch handler — no dedicated audio-caching code was needed.
- `renderTopicsScreen()` renders the Topics screen; `renderDashboard()` is Home.
  Renamed in v105, and `state.homeView` — the same trap, one layer down — was
  renamed to `state.topicsView` at v119. Both names dated from when Topics was the
  home screen. **`migrateNavSnapshot()` in `app.js` must stay** until pre-v119
  history is unreachable in practice: a browser tab can hold a history entry
  indefinitely, and without the mapping those entries restore a field that no
  longer exists.

## Known, deliberately unfixed
- **The cause of phase 4 is worth remembering: a decision that lives only in a
  mockup does not survive.** MOCK-06-C, MOCK-05-retreat and MOCK-07-Asoft were all
  settled against mockups 05–07 and none reached the code; the completed-checkpoint
  row was the visible symptom, showing three colours at once and a black `◆` the
  design never included. All are built as of v112. None of the three reached `styleguide.html`, so nothing flagged
  the drift, and a later chat re-opened a settled question as if it were new.
  `docs/DESIGN_DECISIONS.md` now exists for exactly this — every approved decision
  gets a row with a built/not-built column, so an unbuilt one is visible instead
  of silent. Writing it surfaced a fourth loss (**MOCK-13 offers two settings panel
  options and no document records which was chosen**) and phase 4 surfaced a fifth:
  mockup 10's continuation card, which had no register row, no styleguide entry and
  no line in the phase brief, so the brief retired the top action zone with nothing
  replacing the only in-topic route to "mark complete". That one was caught before
  shipping rather than after — the first time the register has paid for itself
  prospectively. *(The MOCK-13 half of that sentence was itself wrong, and is
  corrected in `DESIGN_DECISIONS.md` as of 2026-07-31: mockup 13's A and B are
  **drawer** panel variants offered only if the drawer is kept, not settings-sheet
  options, so no choice was ever lost. The settings sheet has no design at all —
  the mockup draws the cog and never the sheet. A row that reads plausibly gets
  trusted, including by the note warning about rows that read plausibly.)*
- **No control now declares `min-height` under `--tap-min`.** `.hamburger` and
  `.drawer-speed-btn` at 36px went with the drawer at v117; `.subtab-btn` at 42px
  went with the subtab rebuild at v114. What remains is two *declared-height*
  misses — `.path-complete-btn` at 28px and `.translate-dir-swap` at 38px — plus
  11 padding-built targets that no check can judge. Both in BACKLOG.md.
- `.cp-optional` is a full sentence styled as a green chip, carrying a 🔓 emoji.
  Green reads as *done* per §4 but the content is informational. Left alone in
  phase 3 rather than forced into `.tag`.
