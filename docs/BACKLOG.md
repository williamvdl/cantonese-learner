# BACKLOG — Tea House Cantonese Learner

*Everything not yet done, unsequenced. William's call on order. Move an item to
IN_PROGRESS.md when it's picked up; delete it from here once it's shipped and
folded into STATUS.md.*

Last updated: 2026-07-30 · sw.js at v112

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
- **Around fourteen padding-built tap targets need judging individually.** Listed by
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
- **Three controls remain under `--tap-min`.** `.hamburger` and
  `.drawer-speed-btn` at 36px both retire with the drawer in phase 6.
  `.subtab-btn` at 42px is close enough to leave unless it annoys in use.

- **Dashboard density.** The converged Home reads quieter than the old one — the
  hero lost its filled per-topic band. Deliberately not adjusted: Home is the only
  fully converged screen in a half-converged app, so the comparison is unfair.
  **Revisit after phase 6**, when everything else has caught up.
- **`styleguide.html` still lags in four places.** Phase 3 brought its control
  vocabulary up to date; phase 4 corrected the node and stepper sections in the same
  deploy as the code. Still missing: the dashboard entry, the `站 (zaam6)` watermark
  rule, the `.quiz-ms` / `.cp-convo` variant mechanism, and **the `.cont`
  continuation card**, which has no entry at all — it was ported from mockup 10
  directly. It lives at `docs/design/styleguide.html`.
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
