# BACKLOG — Tea House Cantonese Learner

*Everything not yet done, unsequenced. William's call on order. Move an item to
IN_PROGRESS.md when it's picked up; delete it from here once it's shipped and
folded into STATUS.md.*

Last updated: 2026-08-01 · sw.js at v118

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

- **Full Stage 2 QA walkthrough** — a dedicated pass across every screen type
  (topic Learn/Chat/Quiz, Word Review, both conversation types, all speed
  settings, a checkpoint hub) hasn't happened as one deliberate pass; fixes so
  far came from organic testing. Worth doing **after** the design rollout rather
  than before, so it isn't run twice.
- **Conversation voice pairing reconfirmation** — You=Kore/Other=Puck was never
  revisited after the words/sentences default flipped to Puck; worth a quick
  confirm with William.

## Design follow-ups

*Phases 2, 3 and 4 of the rollout are complete; these are the loose ends they left
or surfaced.*

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
- **15 padding-built tap targets need judging individually.** Listed by
  standing check 2 in IN_PROGRESS.md. Most are probably fine — 12px padding around a
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
- **Two controls remain under `--tap-min`, and P6-2 clears both.** `.hamburger` and
  `.drawer-speed-btn` at 36px retire with the drawer. The third, `.subtab-btn` at
  42px, went at v114 with the subtab rebuild — as predicted, the tap minimum came
  free with MOCK-17-fill rather than needing its own fix.

- **Dead nav CSS with zero call sites.** `.bottom-nav`, `.nav-btn` and
  `.placeholder-screen` sit in `styles.css` and are referenced from nowhere in
  `render.js` or `app.js` — leftovers from an earlier era, *not* phase 6's tab bar.
  Retire or deliberately reuse them in P6-2; the risk is inheriting them by accident
  and assuming they are the tab bar's starting point.
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
- **`--elev-4` is down to two call sites** — the toast and the quiz listen button's
  hover. The drawer panel was its third. Not a problem, but a token serving two
  incidental uses is worth a look when the elevation scale is next revisited.
- **82 selectors are redeclared across `styles.css` with overlapping properties.**
  Found while removing one confirmed-dead declaration in the header at v115
  (`letter-spacing` on `.header-title .en`, overridden 586 lines later by the grouped
  meta-label rule). **Most of the 82 are almost certainly deliberate** — the grouped
  "consistent treatment" blocks that set a shared font-size or transition across a
  family after the individual rules. Some are dead. The raw count is not the finding;
  classifying it is, and per the standing lesson that has to be done by declaration
  rather than by shape. Worth one pass with the cross-file audit before the rollout
  closes, since a dead declaration reads as a live one to anyone editing later.
- **Path row-type icons — the paired question has resolved itself.** The subtabs
  shipped at v114 keeping mockup 04's per-tab glyphs, so "does a line glyph earn its
  place on a row of text labels" now has one answer in the app. The path timeline's
  row-type icons are still open above; the subtab precedent is evidence, not a
  binding answer, since a three-item switch and a long scrolling rail are not the
  same problem.
- **`styleguide.html` draws two different tab bars and only one can ship.** The
  `.tabbar` / `.tb` block predates the shared primitive and differs from
  `.tabs--top` in substance: its active rule is a `::before` inset 22% from each
  side rather than a full-width border, and its resting colour is `--muted` rather
  than `--muted-dark`. P6-2 should build `.tabs--top` and retire the older block —
  but `.tb-badge` (Review's count) and `.tabbar--slim` (the §3.10 dead-end fallback)
  have no primitive equivalent yet and need porting rather than dropping. Warning is
  written into the styleguide's Tab bar section as of v114.
- **Six icons the tab bar needs do not exist.** `ICON_PATHS` in `data.js` has 16
  entries; home, path, topics, review, translate and cog are absent, and the drawer
  uses emoji for the five destinations today. All six are already drawn in mockup 13,
  so this is transcription rather than design — but it is unnamed work inside P6-2
  and it touches a cached shell asset.
- **`.speed-btn` and `.speed-btns` are dead CSS.** Seven rules for a header audio-speed
  control that `render.js` no longer emits; the `#speed-slow` handler is a no-op
  guarded by `if (btn)`. The drawer's `.drawer-speed-btn` is the only live speed
  control, which is why P6-2 is gated on the settings sheet. Retire in the same pass —
  note `.speed-btn` shares a grouped rule with the live `.quiz-next`, so the selector
  needs editing rather than the rule deleting.
- **Dashboard density.** The converged Home reads quieter than the old one — the
  hero lost its filled per-topic band. Deliberately not adjusted: Home is the only
  fully converged screen in a half-converged app, so the comparison is unfair.
  **Revisit after phase 6**, when everything else has caught up.
- **`styleguide.html` still lags in three places.** Phase 3 brought its control
  vocabulary up to date; phase 4 corrected the node and stepper sections in the same
  deploy as the code; **v113 added the `.cont` continuation section**, which had no
  entry at all. Still missing: the dashboard entry, the `站 (zaam6)` watermark rule,
  and the `.quiz-ms` / `.cp-convo` variant mechanism. It lives at
  `docs/design/styleguide.html`.
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
