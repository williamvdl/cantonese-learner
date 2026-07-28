# BACKLOG — Tea House Cantonese Learner

*Everything not yet done, unsequenced. William's call on order. Move an item to
IN_PROGRESS.md when it's picked up; delete it from here once it's shipped and
folded into STATUS.md.*

Last updated: 2026-07-28

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

*Phase 2 of the rollout is complete; these are the loose ends it left or surfaced.*

- **Dashboard density.** The converged Home reads quieter than the old one — the
  hero lost its filled per-topic band. Deliberately not adjusted: Home is the only
  fully converged screen in a half-converged app, so the comparison is unfair.
  **Revisit after phase 6**, when everything else has caught up.
- **Path button press effect.** `.path-btn-mark` / `.path-btn-next` keep a chunky
  `0 3px 0` solid-offset shadow with a coloured blur. Colours are tokenised;
  geometry untouched. It is now the least converged thing left visually. Decide:
  flatten onto the elevation scale, or keep as a deliberate primary-action
  affordance.
- **`.bubble--gap` dashed border** kept at 2px where everything else went to 1px,
  as a deliberate "blank to fill" affordance. Confirm or normalise.
- **Speak diagnostic — the `missing` status** now renders `--muted-dark` rather
  than a red. Reasoning: a syllable you didn't say is absent, not incorrect, and
  §4 has no fifth state. Confirm on device.
- **`--muted-light`** is a byte-identical duplicate of `--muted` with one call
  site. Retire it.
- **`#fff` × 16 in `styles.css`.** The only raw hex left outside `:root`. All are
  text-on-coloured-ground. `--parchment` is the same value but means *surface*,
  so reusing it would be semantically wrong. Either accept `#fff` as idiomatic or
  add an on-fill text token.
- **`styleguide.html` is behind the code** — it predates the dashboard entry, the
  watermark checkpoint rule and the `.quiz-ms` / `.cp-convo` variant mechanism.
  Scheduled in phase 3; noted here so it isn't lost if phase 3 slips.
- **Mockup files aren't in the repo.** `03-`–`13-*.html` from the original design
  session plus `14-dashboard.html` from the dashboard pass. DESIGN_SYSTEM §8 cites
  them as the detail behind each decision. `docs/design/` no longer exists — it was
  deleted in `b3ed814` — so it needs recreating.
- **`DESIGN_SYSTEM.md` isn't in the repo either.** It lives only in project
  knowledge. Commit it beside `styleguide.html`.
- **Landscape stepper decision.** Header + contextual row + stepper + docked bar
  ≈ 160px of chrome against a 390px-tall landscape viewport — about 40% of the
  screen before any content. Candidate fix: hide the stepper under
  `@media (max-height: 450px)`. Needs a real device to judge, and the stepper
  doesn't exist until phase 4.
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
