# DESIGN SYSTEM — Tea House Cantonese Learner

*The written spec. `styleguide.html` is the live companion — open it in a browser
(and on a phone) to see every primitive rendered. This file is the reasoning and
the rules; the styleguide is the evidence.*

**Read this before touching `styles.css`, `render.js`, or designing a new screen.**

Established: 2026-07-25 · Phases 1–3 applied as at sw.js v107 (2026-07-29)

---

## How to use this

1. **Adding a screen or component?** Find the primitive here first. If something
   close exists, use it. The system is deliberately small — most new UI is a
   composition of existing primitives, not a new primitive.
2. **Think you need a new primitive?** Check §3 Rules first. Most "new" needs
   turn out to be one of the four states (§4) wearing a different name.
3. **Reaching for a colour?** Only the tokens in §1 exist. There is no fifth
   state colour, and no colour is ever passed into a render function (§3.5).
4. **Changed something here?** Update `docs/design/styleguide.html` in the same
   commit — it has drifted behind the code before. Three gaps remain, tracked in
   BACKLOG.md: the dashboard entry, the 站 (zaam6) watermark rule, and the
   `.quiz-ms` / `.cp-convo` variant mechanism.
5. **Settled a design decision?** Add a row to `docs/DESIGN_DECISIONS.md` in the
   same session. That file is the register of what was approved and whether it
   was ever built.

---

## 1. Foundations

As of phase 2 this section is not aspirational — it is what the code contains.
`styles.css` holds no raw hex outside `:root` except `#fff`, no radius outside
the scale, and no border width outside 1px/2px/`--edge-emph`.

### 1.1 Type

| Token | Value | Job |
|---|---|---|
| `--font-display` | Fraunces | Page and section titles, score values, English reveals |
| `--font-serif` | Noto Serif TC | All Chinese text, the nameplate, watermarks |
| `--font-ui` | Inter | Everything else — labels, body, buttons, jyutping |

Scale: `--fs-micro 11` · `--fs-meta 12` · `--fs-small 13` · `--fs-body 15` ·
`--fs-lead 17` · `--fs-h3 22` · `--fs-h2 28` · `--fs-h1 36` · `--fs-display 56`.
Line heights: `--lh-display 1.1` · `--lh-heading 1.25` · `--lh-body 1.5`.
Weights: 400 / 500 / 600 / 700. **Never mix families within a line**, except
jyutping (UI) sitting under Chinese (serif).

### 1.2 Space, radius, motion

- Space: `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 ·
  `--sp-6` 32 · `--sp-7` 48 · `--sp-8` 64
- Radius: `--r-sm` 8 · `--r-md` 12 · `--r-lg` 16 · `--r-pill` 999
- Motion: `--dur-fast` 120ms for state flips, `--dur-base` 200ms for
  enter/leave, both on `--ease`
- `--tap-min: 44px` — minimum smaller dimension of anything interactive,
  **including header icons**

> **Radius mapping rule.** When converting a raw value, prefer an exact token
> match, then the nearest smaller one — *except* where the element is already
> pill-shaped in situ, meaning its radius is at least half its computed height.
> Nine buttons at 20px and one at 16px were pills, not rounded rectangles;
> mapping them by value would have visibly flattened them. Three decorative
> values are deliberately left off the scale: the 2px hamburger bars and the two
> 4px asymmetric chat-bubble tails.

### 1.3 Elevation

`--elev-1` covers nearly everything. `--elev-2/3/4` exist for modals and the
drawer only.

> **Elevation is the exception, not the default.** Surfaces separate by hairline
> border and space. If a card needs a shadow to be legible, the spacing is wrong.

Coloured shadows exist only where a control has a deliberate press affordance;
they are expressed as `color-mix()` against a state token, never a raw rgba.

### 1.4 Colour

**Ink & surface** — `--ink` `#1C1917` · `--ink-soft` `#292524` ·
`--parchment` `#FFFFFF` · `--parchment-warm` `#FAF8F5` ·
`--parchment-deep` `#F0EBE4` · `--parchment-border` `#EAE4DC` ·
`--muted` `#A8A29E` · `--muted-dark` `#78716C`

> **Three text levels, not eight.** Body and secondary text collapse onto
> `--ink-soft`, `--muted-dark` and `--muted`. Phase 2c retired 67 cold greys
> (`#333` through `#eee`) that had accumulated alongside them — neutral greys on a
> warm parchment ground. If a fourth level seems necessary, the hierarchy is wrong.

**Brand** — `--brand` `#C2410C` · `--brand-dark` `#9A3412` ·
`--brand-tint` `#FEF0E9` · `--brand-edge` `#F5D9C9`

**State** — see §4 for meanings.

| Token | Value |
|---|---|
| `--jade` | `#15803D` |
| `--feedback-good` | `#16A34A` |
| `--feedback-good-tint` | `#DCFCE7` |
| `--jade-edge` | `#C9E7D3` |
| `--feedback-bad` | `#B42318` |
| `--feedback-bad-tint` | `#FEF3F2` |
| `--feedback-bad-edge` | `#F5CFCB` |
| `--milestone` | `#6E2639` |
| `--milestone-tint` | `#FBF0F2` |
| `--milestone-edge` | `#EBD3D9` |

**Header block** — swap as a unit to retheme the top bar and drawer.
`--header-bg` `#6E2639` · `--header-text` `#F7EEE8` · `--header-icon` (= header text)

> `--milestone` deliberately equals `--header-bg`. That shared value is what
> makes a checkpoint read as an event: it is the only place in the body of the
> app where the header colour reappears. If the header is rethemed, milestone
> follows it on purpose.
>
> **Consequence, learned the hard way:** a milestone-*filled* band placed
> directly under the header merges with it and stops reading as an event at all.
> Milestone is therefore carried by an edge, a tint or a glyph in body content —
> never by a full fill adjacent to the header. See §2 Dashboard.

**Tone colours are not theme.** The six tone colours live in the `TONES` object
in `app.js` and are applied per-syllable by `colorJyutping()`. They are content,
not identity, and are deliberately excluded from the token block so a palette
swap never changes them. Do not tokenise them. They are the *only* remaining
colour interpolations in `render.js`, and that is correct.

### 1.5 Layout

- `--measure: 680px` — the content column. One value; there is no second.
- `--measure-text: 68ch` — prose line-length cap.
- `--bar-h: 60px` — docked action bar. `--tabbar-h: 58px` — tab bar.
- `--edge-emph: 3px` — the emphasis rule width.
- `--border` 1px `--parchment-border` · `--border-soft` 1px `--parchment-deep`

---

## 2. Primitives

Each entry: what it is, its classes, and the rule that governs it. See
`styleguide.html` for the rendered version of every one.

**Primitives are declared once, above the component rules**, so `styles.css`
reads foundations → primitives → components. Never adjust a primitive for one
screen's benefit — scope the adjustment to a component class instead. A
`margin-bottom` briefly added to `.track` for the quiz applied to the dashboard
too, which is how this rule was earned.

### Header — `.header` › `.header-title` + `.header-actions`
Solid `--header-bg` band, centred nameplate, an icon in each corner so the bar
never reads as empty. Sticky. Inner content capped to `--measure`; background
spans full width. Header controls use `--header-text` / `--header-bg`, never a
body state colour.

### Contextual row — `.ctx` › `.ctx-inner` › `.ctx-row` + `.ctx-track`
Sits under the header, on canvas. Carries back target, position, progress
hairline. **Back is labelled with its destination** — the stage you came from,
not the path. **Meta carries stage position ("3 of 5"), never whole-path
position.** Scrolls away; only the header band stays pinned. *(Phase 4.)*

### Stage stepper — `.stepper` › `.sx` › `.node--sm` + `.sline`
The sibling topics of the current stage, plus the stage checkpoint as a diamond
at the end. Tappable. Present only when a topic was entered from a path. *(Phase 4.)*

### Nodes — `.node` + `--sm` `--done` `--current` `--cp`
One shape family for all position markers. Circles for lessons, rotated rounded
square for checkpoints. **The diamond keeps its shape when complete** — it is
the landmark you scan for when reviewing a finished stage.

### Diamond progress — `.mk`
Progress strokes the diamond itself rather than a borrowed circle, so shape and
indicator are one object. Dash length from `getTotalLength()`, never hardcoded.

### Card — `.card` + `--interactive` `--emph` `--milestone`
**One base for every surface in the app.** Modifiers add interaction and
emphasis; nothing else redefines radius, border or shadow.

### Divided list — `.card.list` › `.list-row`
**Sibling items of the same kind go in one card as hairline rows**, not a stack
of cards. Same primitive, wrapping instead of repeating. Three or more is the
normal case; two is acceptable where the alternative is two separately-styled
cards competing (see §2 Dashboard).

### Labels — `.section-label` / `.eyebrow` (+ `--milestone`)
Same metrics, different colour. Muted for section labels, brand for eyebrows,
milestone in checkpoint contexts.

### Note — `.lesson-note` › `.lesson-note-title` + `.lesson-note-body`
Teaching notes only. 2px brand left rule, not a tinted card and not a shadow.

### Pills & tags — `.pill` `.pill--on` / `.tag` / `.pill-solid`
Pills are interactive (tier selectors). Tags are not (metadata, status). Only
`.pill-solid` fills — reserved for the single most important thing on a screen.

### Buttons — `.btn` + `--primary` `--milestone` `--good` `--disabled`, `.btn-icon`
See §3.1. Disabled state uses muted colour, never opacity.

### Progress — `.track` / `.segs` / `.ring` / `.mk`
Four forms, each for a different shape of fact: hairline for continuous
position, segments for a small countable set, ring for a score, diamond ring for
checkpoint activities.

### Word card — `.word-grid` › `.word-card` (+ `.flipped`)
Grid is `repeat(auto-fill, minmax(145px, 1fr))` — two up on a phone, more as the
column widens, no media query. **Reveal is a tint wash** (`--brand-tint` ground,
`--brand-edge` border) with the English gloss in the display serif — not a solid
colour fill.

### Choice — `.choice-btn` + `.correct` `.wrong`
**A vertical stack, not a grid** — answer text is variable-length. The card tints
but never changes shape; unchosen options fade rather than restyle.

### Prompt — `.quiz-card`
Three quiz directions, one card. Subject centred and large; the label above
states the task.

### Bubble — `.bubble-row.left/.right` › `.bubble` (+ `--gap` `--correct` `--wrong` `--tappable` `.is-playing`)
**The side carries the colour.** A user bubble is brand with white text and
inverted controls; the other speaker is parchment with a hairline. No colour is
computed per line.

### Docked bar — `.bar` › `.bar-inner`
Fixed to the viewport bottom, contents capped to `--measure`. One slot, three
states. **Drops its continuation during an active quiz question.** *(Phase 5.)*

### Watermark — `.wm`
The oversized character behind a band is **the word being studied, not
decoration**. `clamp()` against viewport width, 3.5% opacity, `pointer-events:none`.

> **One exception.** Where a band spans a whole *stage* rather than a single
> word — a checkpoint — there is no word to carry, and the band looks bare
> without one. It carries a fixed character instead: **站 (zaam6)**, a stop on a
> journey, chosen over 關 (gwaan1) because 關 (gwaan1) also means barrier and §3.8 is
> explicit that a checkpoint is not a gate you must pass. On a milestone surface
> the watermark tints `--milestone` at 7.5% rather than `--ink` at 3.5%, so it
> belongs to the state rather than sitting on it as a stray grey glyph.
>
> Naming this exception is what stops the next hardcoded character appearing
> somewhere else. The hero shipped a hardcoded 字 (zi6) for months — which is in
> fact *correct* for exactly one stage, `beginner-s1` "First Words", and is very
> likely how it ended up applied to all of them.

### Dashboard — `.dash-wrap`
Home. Composed entirely from the primitives above; it introduces no new
primitive. Block order, each preceded by a `.section-label`:

**hero → path progress → review → jump-to**

- **Hero** is `.card` plus `--emph` (a lesson) or `--milestone` (a checkpoint),
  carrying `.wm`, `.eyebrow`, a stage line, a title and one `.btn--primary` /
  `.btn--milestone`. **The 3px left rule carries the state**; the hero is
  deliberately not a filled band. See the note under §1.4 for why milestone
  cannot fill here, and `14-dashboard.html` for the rejected option.
- **Path progress** is one `.card.list` with a `.list-row` per path, each with a
  `.track`. Two paths measured identically are a set, not two things — they
  previously had a separately tinted card each, built on two hues outside the
  palette.
- **Review** is a `.card--interactive` row with a count badge.
- **Jump-to** is `.card--interactive` tiles in an `auto-fill` grid.

One fill on the screen: the hero's action. Tab bar at the bottom, because Home
is a top-level destination (§3.10).

### Variants — `.quiz-ms`, `.cp-convo`
`renderQuizCore` and `renderConversation` are reused by checkpoint activities.
Milestone chrome is applied by **one class on the wrapper**, with CSS deriving
the treatment. **Do not reintroduce a colour or variant argument to a render
function to achieve this** — that is the exact mechanism §3.5 exists to prevent.

---

## 3. Rules

These are the laws. Breaking one is how the app drifted the first time.

### 3.1 One filled button per screen
Exactly one filled button visible at any moment; ghost everything else. The fill
marks the single next action. If two things are filled, one of them is wrong.

This is why the quiz's big listen button is a tint wash rather than a fill —
once a question is answered, "Next" appears — and why the speak-mode stop button
is a ghost rather than a filled red.

### 3.2 Emphasis is a 3px left rule
When something must be louder than its neighbours it gets `--edge-emph` on the
left — not a bigger shadow, not a brighter fill. Used identically by next-up
steps, checkpoint cards, the dashboard hero and the quiz teaching panel.

### 3.3 Repeating content is a list, not cards
Cards are for distinct things. Sets go in one card as rows.

### 3.4 One progress indicator per fact
The contextual hairline tracks **stage** progress, not whole-path progress — so
it moves visibly across five topics rather than creeping 2% per lesson across 41.
Two bars measuring *different things* a centimetre apart was the single biggest
source of incoherence in the previous build.

> **Clarified 2026-07-28.** The rule is one indicator *per fact*, and sibling
> facts share one form. The dashboard shows a `.track` per path; those are two
> instances of one fact in one list, not two competing indicators. What remains
> forbidden is the original defect: two bars measuring different quantities on
> the same screen.

### 3.5 No colour passed into render functions
No `render*(…, color)` parameters, no `style="background:${color}"`. Category
accents were switched off as a decision; the wiring outlived it. Everything is
class-driven.

**As of phase 2 this is fully enforced: zero injection sites, zero render
functions taking a colour.** The only remaining colour interpolations are the six
`TONES` values, which are content (§1.4).

Note that removing a colour parameter can leave a live `${color}` in the body.
`node --check` will pass it — it is valid syntax and a runtime `ReferenceError`.
Scan every function body after changing a signature.

### 3.6 Emoji
Not in titles, section headers, result screens, or path step rows. Kept where
they are genuine wayfinding — **the Topics category grid**, where one icon per
topic aids scanning a large set. Everywhere else they undercut the typography.

> **Corrected 2026-07-28.** This previously read "the dashboard topic grid".
> There is no topic grid on the dashboard: `renderHomeScreen()` renders the
> **Topics** destination, and `renderDashboard()` renders Home. The exception
> belongs to Topics. The dashboard's own emoji — two tile badges, the review
> icon, the path icons and a 🎉 in a title — fell outside it and were removed.
> The misleading function name is scheduled for rename in phase 3.

### 3.7 Jyutping
Every Chinese string is immediately followed by jyutping in brackets. Tone
colouring is applied by `colorJyutping()` and never by hand.

### 3.8 Completion is a deliberate act
Passing a quiz does not mark a lesson complete. A learner may run the quiz
twice before the conversation and once after; a quiz run is not a completion
event. The user decides when they have learned it.

### 3.9 Tabs hold destinations, not features
This is the rule that stops five tabs becoming eight. A tab is somewhere you
*switch to* mid-session. Settings, account, profile and subscription are
occasional, so they live behind the header corner regardless of how many features
the app grows. Most new features also land *inside* an existing destination
rather than beside it. **Feature count and tab count are not the same axis.**

If genuine pressure comes, the headroom is **Translate** — a utility, not a
learning destination; you don't study in it. The likely future shape is
Home / Path / Topics / Review / You. **Never add a "More" tab** — that
reinstates the hidden-menu problem the tab bar exists to solve.

### 3.10 Bottom chrome is exclusive
The tab bar and the docked action bar never coexist. Tab bar at top-level
destinations; action bar inside topics and checkpoints, with the tab bar hidden.
Together they are 118px on an 812px screen — 15% of the viewport and two
competing "what now" zones stacked.

| Screen | Bottom |
|---|---|
| Home, Path, Topics, Review, Translate | Tab bar |
| Topic (Learn / Chat / Quiz) | Action bar — tab bar hidden |
| Checkpoint hub and activities | Action bar — tab bar hidden |
| Path timeline | Tab bar — it *is* a top-level destination |

Hiding tabs in detail screens is an Android/Material habit; iOS convention keeps
them visible. We hide them for one specific reason — the collision above — not
because it is universal. **Documented fallback if the hidden state feels like a
dead end in use:** collapse the tab bar to a slim icons-only strip (~34px, no
labels) when the action bar appears, totalling 94px.

---

## 4. State semantics

Four states. Each means exactly one thing anywhere in the app.

| State | Token | Means | Used by |
|---|---|---|---|
| **Current** | `--brand` | The thing to do next | Next-up step, active tier, active subtab, primary button, progress fill |
| **Done** | `--jade` / `--feedback-good` | Finished | Completed steps, correct answers, ticks |
| **Milestone** | `--milestone` | A checkpoint — an event, not a lesson | Checkpoint nodes, cards, hub, diamond progress |
| **Error** | `--feedback-bad` | A wrong answer | Quiz choices, gap answers, quiz review rows |

Nothing else gets a colour. **If a new element seems to need a fifth state, it is
almost certainly one of these four under a different name.**

Things that are *not* states, and what they resolve to instead:

- **Availability** — a path being unlocked is not "current". Neutral border; the
  locked state already carries the difference.
- **Header chrome** — header controls use `--header-text`, not a body state.
- **A destructive control** — speak mode's Stop is a ghost with `--feedback-bad`
  text, not a filled red. A filled red would read as an error and break §3.1.
- **Absence** — the speak diagnostic's `missing` status is `--muted-dark`. A
  syllable you did not say is absent, not incorrect.
- **Category** — Topics, paths and tiles get no accent hue at all (§3.5).

Note on milestone vs error: both are deep reds, and they must never meet.
`renderCheckpointWords` reuses `renderQuizCore` with checkpoint chrome, so during
a checkpoint quiz `--milestone` is already on the furniture — which is exactly
why the error colour is a separate, warmer, brighter red and not a reuse of
milestone.

---

## 5. Responsive

**Centred single column, not desktop layouts.** Deliberate: maintaining two or
three arrangements per screen costs more than it returns for an app studied
mostly on a phone. A well-executed centred column reads as intentional; a
stretched phone layout reads as broken.

| Concern | Rule |
|---|---|
| Column | One token — `--measure`. |
| Grids | `repeat(auto-fill, minmax(145px, 1fr))`. No fixed `1fr 1fr`. |
| Prose | Capped at `--measure-text`. |
| Full-bleed bands | Background spans viewport; inner content capped to `--measure`. |
| Watermark | `clamp()` against viewport width. |
| Media queries | Avoid. Prefer intrinsic sizing; container queries where a component genuinely must respond to its container. |

**Open:** phone landscape. Header + contextual row + stepper + bar ≈ 160px of
chrome against a 390px-tall viewport. Candidate fix: hide the stepper under
`@media (max-height: 450px)`. Blocked until phases 4–5 exist.

---

## 6. Migration — complete

Phase 2 retired everything in the original migration table, plus a good deal the
table had missed. Kept as a record of what the drift looked like, so it is
recognisable if it starts again.

| What | Replaced with |
|---|---|
| `CP_GOLD`, `GOLD_HERO` (both `#B7861E`), `#e4d4ad`, `#8a6716` | `--milestone` and its tint/edge |
| `BRAND_ACCENT = '#C2410C'` in `data.js` | `--brand` |
| `THEME` (three `#FFFFFF` tokens) in `data.js` | `--parchment` / class-driven |
| `--gold` `#0369A1` across 28 sites — two states at once | Split per site into milestone / current / header chrome / neutral, then retired with `--gold-tint` and `--gold-text` |
| 78 hardcoded px radii + 19 `border-radius: 50%` | `--r-sm/md/lg/pill` |
| 67 cold greys `#333`–`#eee` | `--ink-soft` / `--muted-dark` / `--muted` / `--parchment-border` |
| Six invalid `var(--token)XX` values (hex alpha on a `var()`, so the whole declaration was dropped) | `color-mix()` or a real edge token. **The next-up step's glow and card shadow had never rendered.** |
| Five competing columns incl. `.path-timeline-wrap` | `--measure` |
| Three fixed `1fr 1fr` grids | `auto-fill minmax()`; `.choices` became a vertical stack |
| 8 render functions taking a `color` param, 37 injection sites | Class-driven; wrapper variants for checkpoints |
| 12 colourless `border: Npx solid;` relying on injection | Real token borders |
| Border widths 1.5 / 2 / 2.5px | 1px hairline + `--edge-emph` |
| Raw and cold-black `box-shadow` | `--elev-*`, or `color-mix()` for deliberate coloured press effects |
| `--topic-accent` and the `.topic-card::before` accent bar | Nothing — category accents were already switched off |
| `--font-cjk` (never declared) | `--font-serif` |
| `--brand-tint` as an error background | `--feedback-bad-tint` |
| `.path-bar` second progress bar, top-of-screen "Next step" | Phases 4–5 |
| `renderDrawer()`, `--drawer-*`, emoji nav icons | Phase 6 |

**Still outstanding:** `getPathContext()` returns `step`/`total` against the flat
41-lesson list with no stage. It needs stage name and position-within-stage —
scheduled as phase 4, a few lines in the context builder rather than new data
(`learning_paths.json` already has stages and `getStage()` exists).

---

## 7. Open decisions

- **Product name and nameplate.** `廣東話 (gwong2 dung1 waa2) / Cantonese
  Learner` is placeholder. The name gates the logo, which gates the final header
  treatment.
- **Logo.** No mark exists.
- **Dashboard density.** The converged Home reads quieter than its predecessor.
  Not adjusted: it is the only fully converged screen in a half-converged app.
  Revisit after phase 6.
- **Path button press effect.** `.path-btn-mark` / `.path-btn-next` keep a chunky
  `0 3px 0` solid-offset shadow. Colours tokenised, geometry untouched — now the
  least converged thing left visually.
- **Direction toggle labels** (`漢→EN` / `EN→漢` / `🔊→EN` (hon3 = Chinese)) inherited unchanged.
- **Landscape stepper** — see §5.
- **Tab bar, on trial.** Shipping to be lived with. Fallbacks in §3.10 and §3.9.
- **Per-stage checkpoint watermark** — see BACKLOG.md. The fixed 站 (zaam6) is
  the deliberate default.

---

## 8. Provenance

Derived from a design pass over three key screens (Topic/Learn, Path +
Checkpoint, Quiz) plus the path-context and completion patterns, and a later
pass over the dashboard. The mockup files behind each decision:

| File | Decides |
|---|---|
| `04-topic-learn-v3-oxblood.html` | Topic/Learn reference page |
| `03-header-solid-options.html` | Header colour — Oxblood chosen from 8 |
| `05-path-and-checkpoint.html` | Path timeline, checkpoint hub, state system |
| `06-nextup-checkpoint-progress.html` | Next-up emphasis (C), checkpoint card (K2), progress (P1 + P2) |
| `07-diamond-progress.html` | Diamond progress geometry (A-soft) |
| `08-quiz.html` | Quiz states, result screen |
| `09-wrong-answer-options.html` | Error colour (W2, `#B42318`) |
| `10-path-context-in-topic-1.html` | Stage stepper (B), continuation card |
| `11-sticky-action-bar-1.html` | Docked bar, tab behaviour matrix |
| `12-quiz-docked-bar-2.html` | Bar on quiz, one-fill exception |
| `13-application-nav-1.html` | Tab bar and settings sheet |
| `14-dashboard.html` | Dashboard composition, hero option C, 站 (zaam6) watermark |
| `15-control-vocabulary.html` | Circular control sizes (B), painted size vs touch target |
| `../styleguide.html` | Live reference for everything above |

**Paths:** the mockups live in `docs/design/mockups/`, and `styleguide.html`
alongside them in `docs/design/`. All fifteen mockups are committed as at
2026-07-30.

**A mockup is the argument; the styleguide is the record.** Three approved path
decisions were lost because they were settled in mockups 05–07 and never
transcribed, so nothing detected that the code had never implemented them and a
later session re-opened a closed question. When a mockup settles something, write
it into `styleguide.html` **and add a row to `docs/DESIGN_DECISIONS.md`** in the
same session. The register carries a built/not-built column precisely so this
failure is visible rather than silent.

**Referencing:** mockup options are `MOCK-NN-X` — the file number plus the option
label inside that file (`MOCK-06-K2`, `MOCK-07-Asoft`). Five of these mockups each
have an option labelled "B", so the prefix is what makes a reference unique.
Decisions settled without a mockup are `DES-NN`.
