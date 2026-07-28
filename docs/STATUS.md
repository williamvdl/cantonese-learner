# STATUS — Tea House Cantonese Learner

*Edit this file in place as things ship. It reflects the app as it stands today —
not a history log (that's what the repo's commit history and dated HANDOVER_*.md
files are for).*

Last updated: 2026-07-28 · sw.js at v103

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
- **Stable IDs** fully in place — 585/585 words, 307/307 sentences. Validator
  passes clean.

## Design system — phases 1 and 2 complete

**The app now renders entirely from the token and primitive layers.** No colour
is injected from JavaScript anywhere. Established 2026-07-25, applying from
sw.js v95 onward; phase 2 shipped across v96–v103.

`DESIGN_SYSTEM.md` and `styleguide.html` are the source of truth. Read
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
| `styles.css` | 1292 lines | **1194 lines** |

All 378 classes emitted anywhere in `render.js` resolve against `styles.css`.

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
- **Tone colours stayed data.** The six `TONES` values are still applied
  per-syllable by `colorJyutping()` and are deliberately outside the token block.
  The only remaining `${...}` colour interpolations in `render.js` are these.
- `--muted-light` is a byte-identical duplicate of `--muted` with one call site.
- Nine tokens have no call sites but are deliberately retained: `--sp-8`, and the
  layout tokens `--measure-text`, `--bar-h`, `--tabbar-h`, `--edge-emph` (phases
  5–6), plus `--feedback-good`, `--jade-edge`, `--feedback-bad-tint` and
  `--feedback-bad-edge`, which now do have call sites after 2e.

## Architecture worth knowing
- Persistence routes through an async storage abstraction layer, built ahead of
  an eventual Supabase migration.
- Two separate, non-interchangeable API keys: Gemini (Google AI Studio) for
  Translate; Google Cloud (gcloud CLI auth) for TTS generation.
- Service worker caches audio automatically via the existing generic runtime
  fetch handler — no dedicated audio-caching code was needed.
- `renderHomeScreen()` renders the **Topics** screen, not Home. `renderDashboard()`
  is Home. Renaming is scheduled in phase 3.

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
