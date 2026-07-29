# STATUS — Tea House Cantonese Learner

*Edit this file in place as things ship. It reflects the app as it stands today —
not a history log (that's what the repo's commit history is for). Approved design
decisions and whether they were built live in `DESIGN_DECISIONS.md`.*

Last updated: 2026-07-30 · sw.js at v107

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

## Design system — phases 1, 2 and 3 complete

**The app now renders entirely from the token and primitive layers.** No colour
is injected from JavaScript anywhere. Established 2026-07-25, applying from
sw.js v95 onward; phase 2 shipped across v96–v103, phase 3 across v104–v107.

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
| `styles.css` | 1292 lines | **1160 lines** |
| Rules redeclaring the card surface | 12 | **0 (`.card` only)** |
| Painted sizes of the circular play control | 7 (28–44px) | **2 (32 / 44px)** |
| Interactive controls under `--tap-min` | 9 | **3 (all retire in phase 6)** |

All 379 classes emitted anywhere in `render.js` resolve against `styles.css`.

### Retired
`CP_GOLD`, `GOLD_HERO`, `BRAND_HERO`, `BRAND_ACCENT` (was in `data.js`), `THEME`
(was in `data.js`), `--gold`, `--gold-tint`, `--gold-text`, `--topic-accent`,
`--font-cjk` (never existed), `.progress-bar` / `.progress-fill`,
`.lesson-header-stacked`, and the orphan hues `#B7861E`, `#e4d4ad`, `#8a6716`,
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
- **Four tokens have no call sites** and are deliberately retained: `--sp-8`,
  `--bar-h` and `--tabbar-h` (the last two land in phases 5–6), and
  `--feedback-good`. Re-measured 2026-07-30 — an earlier count of nine was wrong:
  `--edge-emph` has 3 call sites, `--measure-text` 1, `--jade-edge` 5,
  `--feedback-bad-tint` 4 and `--feedback-bad-edge` 5.

## Architecture worth knowing
- Persistence routes through an async storage abstraction layer, built ahead of
  an eventual Supabase migration.
- Two separate, non-interchangeable API keys: Gemini (Google AI Studio) for
  Translate; Google Cloud (gcloud CLI auth) for TTS generation.
- Service worker caches audio automatically via the existing generic runtime
  fetch handler — no dedicated audio-caching code was needed.
- `renderTopicsScreen()` renders the Topics screen; `renderDashboard()` is Home.
  Renamed in v105. `state.homeView` is the same trap unrenamed — it is the Topics
  flag, and it sits in `NAV_FIELDS` feeding `pushNav()`, so renaming it changes
  back-button behaviour for history entries created before a deploy. Scheduled
  with phase 6's nav work.

## Known, deliberately unfixed
- `intermediate-s3` checkpoint is missing the `id` field the other 14 checkpoints
  have (checkpoint-completion tracking for it would save under a malformed key).
  Low priority — Intermediate checkpoints aren't in active use yet. Bundle the fix
  into the Intermediate checkpoint hub expansion when that's picked up.
- `getPathContext()` returns `step`/`total` against the flat 41-lesson list with no
  stage, which is why the UI can only say "step 8 of 41". Stage name and
  position-within-stage are needed for the redesigned contextual row — scheduled as
  rollout phase 4.
- The path screen's primary buttons keep a chunky `0 3px 0` solid-offset press
  effect. Colours are tokenised; the geometry is untouched pending a decision.
- `.nav-item` declares `transition` twice. Harmless, and the drawer retires in
  phase 6.
- **Three approved path decisions were never built.** MOCK-06-C (next-up
  emphasis), MOCK-05-retreat (the completed-checkpoint milestone retreat) and
  MOCK-07-Asoft (the diamond progress ring) were all settled against mockups 05–07
  and none reached the code. The completed-checkpoint row is the visible symptom:
  three colours at once and a black `◆` that the design never included. **All
  three are assigned to phase 4, shipping across v108–v110** alongside MOCK-10-B
  (path context) and DES-09 (emoji off the path step rows) — full brief in
  IN_PROGRESS.md.
- **The cause is worth remembering: a decision that lives only in a mockup does
  not survive.** None of the three reached `styleguide.html`, so nothing flagged
  the drift, and a later chat re-opened a settled question as if it were new.
  `docs/DESIGN_DECISIONS.md` now exists for exactly this — every approved decision
  gets a row with a built/not-built column, so an unbuilt one is visible instead
  of silent. Writing it also surfaced a fourth loss: **MOCK-13 offers two settings
  panel options and no document records which was chosen.**
- **Three controls remain under `--tap-min`**: `.hamburger` (36px) and
  `.drawer-speed-btn` (36px), both retiring with the drawer in phase 6, and
  `.subtab-btn` at 42px, close enough to leave.
- `.cp-optional` is a full sentence styled as a green chip, carrying a 🔓 emoji.
  Green reads as *done* per §4 but the content is informational. Left alone in
  phase 3 rather than forced into `.tag`.
