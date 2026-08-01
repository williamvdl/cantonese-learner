# BACKLOG — Tea House Cantonese Learner

*Everything not yet done, unsequenced. William's call on order. Move an item to
IN_PROGRESS.md when it's picked up; delete it from here once it's shipped and
folded into STATUS.md.*

Last updated: 2026-08-01 · sw.js at v120

## Product

- **Product name and logo — decide before the header is finalised.** The nameplate
  in every mockup is a placeholder: `廣東話 (gwong2 dung1 waa2) / Cantonese Learner`.
  It's descriptive rather than ownable — hard to trademark, impossible to rank for,
  and it says what the app does rather than what it's like. The repo name "Tea
  House" is already a better instinct. Directions raised but not chosen: the
  tea-house / yum cha register (飲茶 (jam2 caa4) — warm, specific, memorable),
  茶記 (caa4 gei3) (very Hong Kong, needs explaining to anyone outside it), or the
  Scholar register the app is already themed around. **The name gates the logo,
  which gates the final header treatment** — the tone-contour glyph in
  `03-header-solid-options.html` was placeholder only. Matters more now that the
  long-term goal is a paid subscription product.

## Content

- **Vocabulary/content expansion — I-2 (Sentence Grammar).** Checked against the
  repo (2026-07-25): further along than this item implied. Intermediate stages
  s1 (Connectives), s3 (Saying More), s4 (Food/Dining/Shopping), and s5 (Me & My
  People) are all built, with full checkpoint conversations. `intermediate-s2`
  doesn't exist in the data — numbering jumps s1 → s3. Open question for
  William: was Sentence Grammar (s2) deliberately skipped/reserved, or is it a
  real gap to fill before extending past s5?
- **Note-authoring pass.** Checked against the repo (2026-07-25): 246/307
  sentences (80%) now have a teaching note — well past the original 15–25%
  target. 22 of 42 topics are at 100%. Remaining gaps, by topic:
  - Biggest: `connectives` 9/20 (45%), `numbers` 5/10 (50%)
  - ~60%: `animals`, `attractions`, `colors`, `home`, `location`, `work`, `pronouns`
  - ~70–89%: `body`, `friends`, `restaurant`, `shopping`, `food`, `family`,
    `hotels`, `money`, `school`, `tech`, `transport`, `feelings`, `time`
- **Per-stage checkpoint watermark.** The checkpoint hero currently carries a
  fixed 站 (zaam6). A per-stage character would keep the watermark rule fully
  intact — 句 (geoi3) for Building Sentences, 家 (gaa1) for Home & Surroundings,
  人 (jan4) for Me & My People, and so on across all 15 stages. That's 15 authored
  values plus a field in `learning_paths.json`, so it's a data change with a
  validator run rather than a one-line default. **Adopt only if checkpoint heroes
  start feeling samey** — the fixed character is the deliberate default, and the
  field would simply override it. See DESIGN_SYSTEM §Watermark.

## Features

- **Stage 3 — checkpoint activity using sentence data.** Replaces the removed
  Patterns slot. Not yet designed. Should reuse existing per-topic sentence data
  (no new authoring), fit into the checkpoint hub as a third activity alongside
  Words/Conversation. Sentence audio is now pre-generated, which opens up
  listening-based activity designs worth considering. **The redesigned checkpoint
  hub already accommodates a third activity** without layout changes — the
  activities are numbered and the diamond progress ring scales to three segments.
- **Intermediate checkpoint hub expansion** (data-only, after Beginner testing) —
  bundle in the `intermediate-s3` missing-`id` fix while touching this.
- **Male/female voice toggle** — discussed as a future idea, not built. Architecture
  (`speakItem`/`speakConvoLine` as the single audio-path resolvers) was kept
  simple specifically to make this cheap to add later. Lands in the new **settings
  sheet** behind the header cog, not in the tab bar.
- **Immersion/Pimsleur-style audio dialogues.** Early ideation, direction not
  chosen. Two candidate shapes: (a) pure immersion — native-speed scripted
  Cantonese, 2–4 distinct character voices, audio-drama register; (b)
  Pimsleur-style structured drill — alternates English narration/cues with
  Cantonese, response pauses, phrases likely revisited at spaced intervals. These
  need different script formats, so pick a direction before authoring starts.
  Technically unblocked either way: fixed scripts fit the existing offline
  `generate-audio.js`/Chirp3-HD pipeline exactly like checkpoint conversations
  do — no live API, no new architecture. Playback leans continuous/podcast-style
  with pause + skip-forward/back by line (cheap, since audio is already per-line
  files); read-along transcript still on the table. Nav placement (nested in a
  stage vs. standalone episode list) undecided.

## Quality

- **Full Stage 2 QA walkthrough — now unblocked.** A dedicated pass across every
  screen type (topic Learn/Chat/Quiz, Word Review, both conversation types, all
  speed settings, a checkpoint hub) has never happened as one deliberate pass;
  fixes so far came from organic testing. It was deferred until the rollout
  finished so it wouldn't be run twice. **The rollout finished at v120**, so this
  is now due.
- **Two dead `state.speed` writers in `render.js`** (~line 2066), found by the
  2026-08-01 doc audit. A `getElementById('speed-' + s)` loop over slow/normal/fast
  for the retired header speed control, and a `[data-drawer-speed]` handler for the
  retired drawer. Neither the IDs nor the attribute are emitted anywhere, and both
  sit about 140 lines below a comment in the settings-sheet block correctly stating
  that the sheet is the sole writer of `state.speed`. Deleting them is six lines and
  behaviour-identical — but it touches a cached shell asset, so it needs its own
  `sw.js` bump rather than riding along with a doc commit.
- **Give `tools/dead-css.js` a JS direction, or write it a sibling.** It enumerates
  declared CSS classes and asks whether the JS emits them; it cannot see the reverse
  — a handler bound to a selector, ID or data attribute that nothing emits. That is
  exactly the shape of the two dead speed writers above, and check 7 passes clean
  with them in the file. Candidate: collect every `getElementById`, `querySelector`
  and `querySelectorAll` argument in the JS and check each against what the JS
  actually emits.
- **Conversation voice pairing reconfirmation** — You=Kore/Other=Puck was never
  revisited after the words/sentences default flipped to Puck; worth a quick
  confirm with William.
- **Adopt a commit-message convention.** 22 of the last 25 commits are titled
  *"Add files via upload"*, GitHub Desktop's default, so the repo carries no
  changelog and STATUS.md's deploy table is the only record of what shipped when.
  The diffs are intact, so nothing is lost — but *why* a change was made exists
  only in the docs. One line per commit (`v121 — <what changed>`) would stop the
  deploy table being load-bearing on its own. Corrected in STATUS.md, which used to
  claim the commit history *was* the history log.

## Design follow-ups

*The rollout is complete — phases 1–6, v95 to v120. These are the loose ends it
left or surfaced.*

- **Row-type icons on the path timeline — now judgeable.** With emoji gone (DES-09)
  the lesson rows have no glyph at all. Not per topic: 42 would be needed and they
  converge in monochrome at 16px. Candidate is one per *row type* — `bookOpen` for a
  lesson, the diamond for a checkpoint, both already in the 15-icon `ICON_PATHS`
  set. This was deferred until MOCK-06-C and MOCK-07-Asoft landed, on the grounds
  that both add weight to the rail; they have, so the row can now be judged as it
  actually reads.
- **Two definite tap-target misses, found by the stricter check.**
  `.path-complete-btn` — the tick toggle on every path step row — is 28px, and
  `.translate-dir-swap` is 38px. Neither was in phase 4's scope. The fix for the
  first should follow MOCK-15-B and grow the touch target while keeping the painted
  28px, which makes it an invisible change.
- **11 padding-built tap targets need judging individually.** Listed by
  standing check 2 in IN_PROGRESS.md. *(The figure has been recorded as 12, 14 and
  15 at various points; 11 is the measured count at v120.)* Most are probably fine — 12px padding around a
  20px line reaches 44px — but none declares `min-height`, so none is verified and
  none is visible to the check. Worth one pass that either confirms each or adds the
  token.
- **The dashboard hero keeps its own copy of the path-lesson state reset.**
  `openPathLesson()` was extracted in v109 and now serves the path timeline, the
  stage stepper and the continuation card; the dashboard hero handler still has the
  fourth copy. Consolidating it is a dashboard change, so it was left out of phase 4
  rather than widening that deploy's QA. Behaviour-identical when done.
- **`.node--sm` was retired in v112** when MOCK-16-S28 left it with zero call sites.
  If a genuinely compact node is ever wanted, it is one line to restore — but check
  `styleguide.html` first, which no longer documents it either.
- **`.ring` is specified in DESIGN_SYSTEM §2 and does not exist in `styles.css`.**
  It is the score form of the four progress shapes. Deliberately not pre-built —
  build it when a score needs it, and remember `.ring` and `.ring-val` do exist in
  `styleguide.html` to port from.
- **Audit mockups 01–04, 08 and 09 for other untranscribed decisions.** Three
  approved path decisions turned out never to have been built, because they lived
  only in the mockups and never reached `styleguide.html`. Every mockup now has at
  least one row in `DESIGN_DECISIONS.md`, but 01–04, 08 and 09 were recorded from
  their summaries rather than read option-by-option, so a second untranscribed
  decision could still be hiding in them. *(The path ones were phase 4 and are
  built. Phase 4 also turned up a fifth loss that this kind of audit would have
  caught — mockup 10's continuation card, which had no register row and no line in
  the phase brief.)*
- **`.cp-optional` is a sentence dressed as a chip.** "Optional — do any, in any
  order" is styled with `--feedback-good-tint` and a 🔓 emoji. Green reads as
  *done* per §4 but the content is informational, and §3.6 arguably rules out the
  emoji. Deliberately pulled from the phase 3 migration — forcing it into `.tag`
  would have set a full sentence in 9.5px uppercase. Needs its own small decision.
- **`.sentence-note` carries a retired hue.** It uses `rgba(183,134,30,.09)` and
  `rgba(183,134,30,.25)` — that is `#B7861E`, the retired `CP_GOLD`. It survived
  every audit because they all grepped for six-digit hex and this is `rgba()`.
  The last orphan hue in the file, and it sits under sentences app-wide, so
  changing it is a visible colour decision rather than a swap.
- **Emoji still in speak mode.** Five sites: the listening hints, the "Speak"
  label, an empty-state glyph and the 76px hero mic. DESIGN_SYSTEM §3.6 grants
  its emoji exception to the Topics category grid only. The hero mic was
  deliberately excluded from the phase 3 control vocabulary as a one-off.
- **`"Got it — next"` was left unchanged** in v113 when the correct-answer button
  became "Next question". Mockup 12 specified only the one relabel, "Got it" already
  reads as an acknowledgement rather than a plain forward, and it shares
  `.quiz-wrong-actions` with "Hear it again" — the row wraps rather than overflows,
  but it would wrap at 360px. Confirm or match.
- **~~Judge the hidden tab bar's dead-end risk on device~~ — no longer arises.** §3.10
  was reversed at v117 (DES-21) and the bar is visible everywhere, so there is no
  hidden state. What survives of this item: the nameplate's no-affordance resting
  state (MOCK-18-N1) is now a convenience rather than the only escape hatch, which
  weakens the case for ever revisiting it — the tab bar is the route home now. Judge
  it on device anyway, but the stakes are lower than when it was written.
- **`--feedback-good` and `--sp-8` are declared with zero call sites**, found by
  the v120 sweep and deliberately kept. `--feedback-good` completes a semantic
  trio whose `-tint` and `-text` siblings have ten uses between them; `--sp-8`
  completes the spacing scale. A scale with a gap in it is worse than a scale with
  an unused step, so these are not drift — but they are the same shape as
  `--feedback-bad`, which has nine uses in CSS and none in JS. Worth one decision
  about whether unused scale steps stay, rather than three separate ones.
- **Remove `migrateNavSnapshot()` eventually.** It maps the pre-v119 `homeView`
  key forward and is dead weight once no browser holds a pre-v119 history entry.
  There is no way to know when that is — a tab can live for months — so this is a
  "next time you are in `app.js` and it has been a good while" item, not a task.
  Removing it early is a silent back-button bug for anyone with an old tab.
- **`--elev-4` is down to two call sites** — the toast and the quiz listen button's
  hover. The drawer panel was its third. Not a problem, but a token serving two
  incidental uses is worth a look when the elevation scale is next revisited.
- **Standing check 3 has a false positive and always has.** It reports an
  undeclared `--token`, which is the literal phrase *"use var(--token) instead of"*
  inside a comment in the token block. Stripping comments before the scan clears
  it, and with that fix the check reports **no undeclared tokens at all**. Fix the
  check rather than the comment — a check that always reports one known-benign hit
  trains you to skim its output.
- **82 selectors are redeclared across `styles.css` with overlapping properties.**
  Found while removing one confirmed-dead declaration in the header at v115
  (`letter-spacing` on `.header-title .en`, overridden 586 lines later by the grouped
  meta-label rule). **Most of the 82 are almost certainly deliberate** — the grouped
  "consistent treatment" blocks that set a shared font-size or transition across a
  family after the individual rules. Some are dead. The raw count is not the finding;
  classifying it is, and per the standing lesson that has to be done by declaration
  rather than by shape. Worth one pass with the cross-file audit before the rollout
  closes, since a dead declaration reads as a live one to anyone editing later.
- **The checkpoint hub's back target.** Labelled with the stage name and routed
  through `history.back()`, which is what that button already did. Reaching the hub
  from a topic's stepper diamond therefore lands back on that topic rather than the
  timeline — inside the same stage either way. Making it deterministic would put the
  on-screen back and the hardware back out of step, so it was left alone. *(Moved
  here 2026-08-01: it had lived only in IN_PROGRESS.md, which is cleared between
  phases.)*
- **The mark-complete auto-return is gated on not being mid-question.** Marking the
  *final* lesson of a path complete auto-returns to the timeline after 3s; from the
  Quiz subtab that would have discarded a half-finished quiz. Added in v113 because
  the change made that path newly reachable. Worth a look on device — it is a
  one-line revert. *(Moved here 2026-08-01, same reason as above.)*
- **Path row-type icons — the paired question has resolved itself.** The subtabs
  shipped at v114 keeping mockup 04's per-tab glyphs, so "does a line glyph earn its
  place on a row of text labels" now has one answer in the app. The path timeline's
  row-type icons are still open above; the subtab precedent is evidence, not a
  binding answer, since a three-item switch and a long scrolling rail are not the
  same problem.
- ~~**`styleguide.html` draws two different tab bars.**~~ Resolved at v117: the
  shared primitive won, the older `.tabbar` / `.tb` block is gone from the page's
  demo, and the styleguide's Tab bar section records why. `.tb-badge` was ported and
  is `.tab-badge` in `styles.css`. `.tabbar--slim` was deliberately **not** ported —
  it is the MOCK-20-D icons-only fallback, which is held as a lever rather than
  built, so it has no consumer.
- ~~**Six icons the tab bar needs do not exist.**~~ Transcribed from mockup 13 at
  v117. `ICON_PATHS` in `data.js` now has 21 entries — home, path, topics, review,
  translate and cog joined the original 15. The reason they were needed rather than
  optional is worth keeping: the drawer used **emoji**, which cannot take
  `currentColor`, so an active destination could not have turned brand.
- ~~**`.speed-btn` and `.speed-btns` are dead CSS.**~~ Retired at v117, and their
  siblings `.speed-row` / `.speed-label` at v120 — the second half of the pocket
  survived the first, which is one of the two cases that prompted `dead-css.js`.
  **What did not get retired is the JavaScript**: the `#speed-slow` handler this
  item describes is still in `render.js`, still a no-op guarded by `if (btn)`, and
  is one of the two dead `state.speed` writers logged under *Quality* above. The CSS
  half of a pocket being visible to a sweep while the JS half is not is the whole
  reason that item exists.
- **Dashboard density — the condition it was waiting on has been met.** The
  converged Home reads quieter than the old one; the hero lost its filled per-topic
  band. Deliberately not adjusted at the time because Home was the only fully
  converged screen in a half-converged app, making the comparison unfair. **Every
  other screen has now caught up as of v120**, so this is judgeable on its own terms
  rather than against a moving baseline. Mockup 14 is the last dashboard pass and
  predates the tab bar, the docked bar and the centred header, so it is likely to
  need re-mocking rather than re-reading.
- **The styleguide's token block carries pre-build mockup dimensions.** Its `:root`
  declares `--bar-h: 60px` and `--tabbar-h: 58px`; `styles.css` declares **52px** and
  **46px**, both derived from the rules as built. This is the hazard STATUS.md
  already documents — *a dimension token copied from a mockup will not match the
  component built from it* — except that it was found and corrected in `styles.css`
  at v118 and **the styleguide's copy was never updated with it**. It matters more
  here than in a prose doc: the styleguide is live HTML, so every bar and tab-bar
  demo on the page renders at the wrong height, and a reader comparing the page to
  the app sees a real mismatch with no way to tell which is authoritative. Fix by
  copying the values from `styles.css`, and check the rest of the styleguide's
  `:root` against the app's the same way — this is unlikely to be the only one.
- **`docs/design/styleguide.html` lags in six places now.** Three are long-standing:
  the dashboard entry, the `站 (zaam6)` watermark rule, and the `.quiz-ms` /
  `.cp-convo` variant mechanism. Three were added by the v120 sweep and found in the
  2026-08-01 audit — it still documents `.tag--brand`, `.tag--milestone` and
  `.btn--disabled` (CSS at lines 219–231, demos at 593–594 and 869), all three
  **removed from `styles.css` at v120**. That is the drift-ahead failure again: a
  reader would build against three classes that do not exist.
- **The styleguide's *Retire list* section is a completed to-do list presented as an
  open one.** Every row in it — `CP_GOLD`, the per-topic colour injection, the 74
  hardcoded radii, the two feedback hexes, `--brand-tint` as an error background,
  `--gold`, `.path-bar`, the top-of-screen "Next step" — has been retired, most of
  them in phase 2. It reads as outstanding work. Delete it, or retitle it *Retired*
  and mark the rows done; the second is more useful, since the section is a decent
  record of what phase 2 actually removed.
- **A duplicate `styleguide.html` sat in the repo root** — 963 lines, pre-phase-6,
  against 1017 in `docs/design/`. Deleted 2026-08-01. Worth remembering as a shape:
  two files with the same basename means every reference that omits the path is
  ambiguous, and the docs refer to "`styleguide.html`" unqualified in a dozen places.
  If a copy is ever wanted outside `docs/design/`, give it a different name.
- **The styleguide also drifted *ahead* of the code**, which no check was looking for.
  It carried full sections for the unbuilt docked bar and tab bar while omitting the
  continuation card that shipped in v109. Every section now carries a built /
  not-built tag. Worth one pass confirming each tag is honest — the audit that matters
  is bidirectional: does every built component have an entry, and does every entry
  describe something that exists?
- **`.bubble--gap` dashed border** kept at 2px where everything else went to 1px,
  as a deliberate "blank to fill" affordance. Confirm or normalise.
- **Speak diagnostic — the `missing` status** now renders `--muted-dark` rather
  than a red. Reasoning: a syllable you didn't say is absent, not incorrect, and
  §4 has no fifth state. Confirm on device.
- **Four byte-identical alias tokens.** `--muted-light` = `--muted`,
  `--feedback-good-text` = `--jade`, `--jade-bright` = `--feedback-good`,
  `--brand-text-dark` = `--brand-dark`. None appear in DESIGN_SYSTEM §1.4. Retire
  all four — but check call sites first rather than find/replacing, which is the
  mistake `--gold` taught. (`--header-icon` = `--header-text` is deliberate; leave it.)
- **`#fff` × 16 in `styles.css`.** The only raw hex left outside `:root`. All are
  text-on-coloured-ground. `--parchment` is the same value but means *surface*,
  so reusing it would be semantically wrong. Either accept `#fff` as idiomatic or
  add an on-fill text token.
- **MOCK-13 — settings panel choice was never recorded.** The mockup offers
  A (parchment panel) and B (oxblood panel); no document says which was picked.
  Surfaced while building `DESIGN_DECISIONS.md`. **Settle before phase 6 starts.**
- **Landscape stepper decision.** Header + contextual row + stepper + docked bar
  ≈ 160px of chrome against a 390px-tall landscape viewport — about 40% of the
  screen before any content, and slightly more now the stepper runs at 28px rather
  than 20px. Candidate fix: hide it under `@media (max-height: 450px)`. The stepper
  exists as of v109 and appears on two screens, so this is now judgeable on a real
  device.
- **Quiz direction-toggle labels.** `漢→EN` / `EN→漢` / `🔊→EN` (hon3 = Chinese) inherited unchanged
  and permanently present above every question. Compact but cryptic — may belong
  on a settings row instead of a three-way toggle.
- **Tab bar review after real use.** Two things to watch, with fallbacks already
  documented in DESIGN_SYSTEM.md: whether the hidden tab bar inside a topic feels
  like a dead end (§3.10 — slim 34px icons-only strip), and whether the drawer's
  destination *descriptions* were doing teaching work that tabs drop (§3.9).
- **Container queries.** Noted as the better long-term tool than media queries for
  a component-based system — primitives respond to their container rather than the
  viewport. Not needed for the centred-column strategy; revisit only if a real
  tablet or desktop layout is ever wanted.
