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

Last updated: 2026-08-10 · sw.js at v127

## Confirmed live and working
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
  - `tools/tts-probe.js` (v123) answers "which voices does a provider offer, and
    how does each handle a given sound" by calling `voices/list` and synthesising
    a fixed six-phrase set through every one. Not a standing check — it asserts
    no invariant — but the thing to reach for before any future voice question.
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

### Notes worth carrying forward

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
  BACKLOG.md.
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
