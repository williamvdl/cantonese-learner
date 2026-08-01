# STATUS — Tea House Cantonese Learner

*Edit this file in place as things ship. It reflects the app as it stands today —
not a history log (that's what the repo's commit history is for). Approved design
decisions and whether they were built live in `DESIGN_DECISIONS.md`.*

Last updated: 2026-08-01 · sw.js at v120

## Confirmed live and working
- **Patterns/Drills removed** from the app entirely (not soft-hidden). Checkpoints
  flow Words → Conversation only.
- **TTS replaces the browser's Web Speech API** for all pre-generatable content
  (words, sentences, topic Chat conversations, checkpoint conversations). Full
  audio generation run complete, not just a test batch.
  - Google Cloud Chirp3-HD, `yue-HK` voice. Default voice is **Puck** (male) for
    words/sentences. Conversations use two voices picked per line by speaker —
    currently You=Kore, Other=Puck.
  - Generated via `tools/generate-audio.js` (vanilla Node, no npm deps, auth via
    `gcloud auth print-access-token`). Incremental — safe to re-run.
  - Playback goes through `speakItem()` / `speakConvoLine()`. Web Speech API is
    kept, deliberately, only for the Translate tab (no stable ID to pre-generate).
  - No fallback on missing audio by design — a toast shows instead of a silent
    synthetic-voice substitute.
- **Stable IDs** fully in place — 600/600 words, 307/307 sentences, 150/150
  dialogues. Validator passes clean.

## Design system — phases 1–5 complete, phase 6 under way

**The app now renders entirely from the token and primitive layers.** No colour
is injected from JavaScript anywhere. Established 2026-07-25, applying from
sw.js v95 onward; phase 2 shipped across v96–v103, phase 3 across v104–v107,
phase 4 across v108–v112, phase 5 at v113, phase 6 from v114.

**Every approved decision in the register is now built.** MOCK-11-bar, the last
one, shipped at v118 after four phases — and building it brought DES-12's
collision into existence for the first time, answered by slimming the bar rather
than hiding the tabs. The remaining phase 6 work is P6-6, the `state.homeView`
rename, which is a refactor rather than a decision. DES-18 (the
nameplate as a route home) shipped at v116, and DES-20 (the centred header) — a
third that nobody had noticed was unbuilt at all — at v115. MOCK-17-fill, the
subtab treatment, was the third and shipped at v114. Phase 6 is the last phase of
the rollout.

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
| `styles.css` | 1292 lines | **1318 lines** (1160 after phase 3; phase 4 added the path-context components, phase 5 three, phase 6 the subtab primitive and its rationale comment) |
| Rules redeclaring the card surface | 12 | **0 (`.card` only)** |
| Painted sizes of the circular play control | 7 (28–44px) | **2 (32 / 44px)** |
| Interactive controls declaring `min-height` under `--tap-min` | 9 | **2** |

All 390 classes emitted anywhere in `render.js` resolve against `styles.css`.

**The tap-target figure above is narrower than it looks.** It counts rules that
*declare* `min-height` below 44px. A target built from padding alone is invisible
to that check — which is how the stage stepper shipped at 42px in v109 and read
clean. A stricter check (in IN_PROGRESS.md) finds two further definite misses,
`.path-complete-btn` at 28px and `.translate-dir-swap` at 38px, plus 15
padding-built targets that need judging individually. All are in
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
| — | v120 | **Dead-CSS sweep, driven by measurement rather than memory.** Removed 16 classes with no emitter (`.mode-btn`, `.conv-mode-pill(s)`, `.mode-row`, `.home-header/title/subtitle`, `.translate-header` + descendants, `.translate-dir-label.muted`, `.speed-row`, `.speed-label`, `.choices-zh`, `.convo-meta`, `.nav-subitem`, `.btn--disabled`, `.tag--brand`, `.tag--milestone`) and the `--ink-drawer` token, whose own comment said *legacy*. Nine hardcoded greys in `render.js` replaced: four by existing primitives (`.section-label`, `.boot-msg` ×3), five by tokens. **No hardcoded colour remains in the JS.** Invisible except one loading state, which gains 20px of padding by adopting `.boot-msg`. |
| 6 · 6 | v119 | **`state.homeView` → `state.topicsView`** — the last item in phase 6, and invisible: no screen changes. The name predated the Dashboard, when Topics *was* Home; since v105 it has pointed at the wrong screen. 16 call sites. The real work was the migration: `history.state` outlives a deploy, so entries written by v118 arrive carrying the old key, and `applyNavSnapshot()`'s `f in snap` guard skips absent fields **silently** — backing out of a topic into a pre-deploy entry would have restored `nav: 'topics'` while leaving `topicsView` false, showing the topic you just left and making BACK look broken. `migrateNavSnapshot()` maps the old key forward at the read boundary. |

### Notes worth carrying forward

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
  siblings of the `.speed-btn` pocket retired in that very deploy. **Twice** now
  the second half of a pocket has survived the first. Retire by sweep, not by
  recall — and note that grouped selectors hide the survivors: four of the
  remnants sat inside comma-separated rules whose other members were live, so
  deleting whole rules would have taken working code with them.
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
- **Four tokens have no call sites** and are deliberately retained: `--sp-8`,
  `--bar-h` and `--tabbar-h` (both land in phase 6), and
  `--feedback-good`. Re-measured 2026-07-30 — an earlier count of nine was wrong:
  `--edge-emph` has 3 call sites, `--measure-text` 1, `--jade-edge` 5,
  `--feedback-bad-tint` 4 and `--feedback-bad-edge` 5.

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
- Two separate, non-interchangeable API keys: Gemini (Google AI Studio) for
  Translate; Google Cloud (gcloud CLI auth) for TTS generation.
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
- `intermediate-s3` checkpoint is missing the `id` field the other 14 checkpoints
  have (checkpoint-completion tracking for it would save under a malformed key).
  Low priority — Intermediate checkpoints aren't in active use yet. Bundle the fix
  into the Intermediate checkpoint hub expansion when that's picked up.
- `.nav-item` declares `transition` twice. Harmless, and the drawer retires in
  phase 6.
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
- **Two controls remain under `--tap-min`**: `.hamburger` (36px) and
  `.drawer-speed-btn` (36px), both retiring with the drawer in P6-2. The third,
  `.subtab-btn` at 42px, went with the subtab rebuild at v114.
- `.cp-optional` is a full sentence styled as a green chip, carrying a 🔓 emoji.
  Green reads as *done* per §4 but the content is informational. Left alone in
  phase 3 rather than forced into `.tag`.
