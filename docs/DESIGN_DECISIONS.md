# DESIGN DECISIONS — Tea House Cantonese Learner

*One row per approved design decision. This exists because three decisions
(MOCK-06-C, MOCK-06-K2's completed state, MOCK-07-Asoft) were settled in mockups,
never transcribed anywhere, and so nothing detected that the code had never
implemented them. A row saying "approved, not built" is visible in a way that a
paragraph inside a mockup is not.*

**Scope: UX and visual design only.** Architecture, tooling and data decisions
are not in here — they don't share this shape, since they have no mockup to point
at and no built/not-built axis. If they ever need a register they should get their
own file rather than being forced into this one. For now they live in the *Current
architecture* section of the project instructions.

Last updated: 2026-07-30 · sw.js at v107

---

## How to reference a decision

**`MOCK-NN-X`** — an option chosen from a mockup. The file number, then the option
label as it appears inside that file. `MOCK-06-K2` is the option labelled K2 in
`06-nextup-checkpoint-progress.html`. Nothing needs renaming: the prefix just
makes an otherwise-ambiguous label unique. Five mockups (06, 07, 10, 13, 15) each
have an option labelled **B**, meaning five different things — the mockups that
prefixed from the start (K1–K4, P1–P4, W1–W6) have never caused confusion, and
this extends that to everything.

**`DES-NN`** — a decision settled in conversation or directly in code, with no
mockup behind it. Sequential, never reused. These are the ones most at risk:
several below existed only as an aside in `DESIGN_SYSTEM.md` or a comment in
`styles.css`.

**Two rules for using these IDs:**

1. **Never write an ID without its subject in the same sentence.** "MOCK-06-K2,
   the white checkpoint card with the oxblood left edge" — not "K2".
2. **Phase briefs don't get their own letters.** Work items are named, not
   lettered, so a phase brief never introduces a second A/B/C that collides with
   a mockup's. If they need IDs, use `P4-1`, `P4-2`.

---

## Status values

| Status | Meaning |
|---|---|
| **Built** | In the code today, verified. |
| **Not built** | Approved, never implemented. The dangerous row. |
| **Partial** | Some of it shipped; the gap is named in Notes. |
| **Policy** | A standing rule that governs future work. Nothing to build. |
| **Reference** | A design pass with no competing options — nothing was "chosen". |
| **Superseded** | A later decision replaced it. Kept so the trail survives. |

---

## Register — chosen from a mockup

### Identity and colour

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-03-oxblood | Header colour — Oxblood `#6E2639`, chosen from 8 candidates | Built | `--header-bg`. See DES-02 for the consequence. |
| MOCK-09-W2 | Wrong-answer red — `#B42318` | Built | `--feedback-bad`. See DES-13 for why it isn't milestone red. |

### Path timeline and checkpoints

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-05-path | Path timeline, checkpoint hub and the four-state system | Reference | The base design the 06/07 options refine. |
| MOCK-05-retreat | A completed checkpoint drops milestone colour and goes quiet white with a green mark | **Not built** | Title is jade not muted, badge stays filled oxblood in both states, rail node is a solid jade fill, card keeps its oxblood edge. Phase 4. |
| MOCK-06-C | Next-up emphasis — solid `--brand` node with white glyph; card gets `--brand-edge` border plus a 3px `--brand` left edge | **Not built** | A 4px glow and a 12px tinted drop shadow shipped instead, which also contradicts DESIGN_SYSTEM §3.2 (emphasis is an edge, not a shadow). Phase 4. |
| MOCK-06-K2 | Checkpoint card — white with a 3px oxblood left edge, not a tint wash | Partial | Open state built via `.card--milestone`. Completed state not built — see MOCK-05-retreat. |
| MOCK-06-P1 | Checkpoint progress — segment pips in the card, one per activity | **Not built** | Approved together with P2. Shown only once started. Superseded in placement by MOCK-07-Asoft, which is the build target. |
| MOCK-06-P2 | Checkpoint progress — a progress ring wrapping the rail diamond | **Not built** | Superseded in geometry only by MOCK-07-Asoft; the decision to put the ring on the diamond stands. |
| MOCK-07-Asoft | Diamond progress geometry — the diamond itself is the progress track, 3px corner radius | **Not built** | **This is the build target for checkpoint progress, exactly as drawn, all three states.** Gives ring on the diamond, pips in the card once started, the count line, and a three-state badge (`Checkpoint` → `Resume` → ✓; the code has only two today). Confirmed to scale to three activities. `.mk` and the `getTotalLength()` dash technique exist in `styleguide.html` and nowhere in `styles.css` or `render.js`. Phase 4. |

### Topic, quiz and path context

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-04-topiclearn | Topic/Learn reference page | Reference | The page the design system was derived from. |
| MOCK-08-quiz | Quiz states and result screen | Reference | |
| MOCK-10-B | Path context in a topic — contextual row plus stage stepper | **Not built** | Needs `getPathContext()` to return stage name and position-within-stage; it currently returns position against the flat 41-lesson list. Phase 4. |

### Navigation and chrome

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-11-bar | Docked action bar and the tab-behaviour matrix | Not built | Phase 5. Implements DES-12. |
| MOCK-12-quizbar | Docked bar on the quiz; the one-fill exception during an active question | Not built | Phase 5. |
| MOCK-13-? | Settings sheet panel — A parchment, B oxblood | **Choice not recorded** | Both options exist in the mockup; no doc records which was picked. Needs deciding before phase 6. |
| MOCK-15-B | Circular control vocabulary — two painted sizes (32 / 44px), painted size decoupled from touch target | Built | Shipped v106. |

### Dashboard

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-14-C | Dashboard hero — a card with a 3px left rule carrying the state, not a filled band | Built | Direct consequence of DES-02. |
| MOCK-14-zaam | Checkpoint watermark character — 站 (zaam6), a stop on a journey | Built | Chosen over 關 (gwaan1), which also means barrier, and DESIGN_SYSTEM §3.8 is explicit that a checkpoint is not a gate. Per-stage watermarks remain in BACKLOG.md. |

---

## Register — settled without a mockup

*Detail and reasoning live in `DESIGN_SYSTEM.md` at the section referenced. These
rows record that the decision was made and whether it holds in code — they don't
restate the rule.*

| ID | Decides | Status | Ref | Notes |
|---|---|---|---|---|
| DES-01 | Tone colours stay in the `TONES` object as content, never tokenised | Built | §1.4 | So a palette swap can never change them. The only remaining colour interpolations in `render.js`, and that is correct. |
| DES-02 | `--milestone` deliberately equals `--header-bg` | Built | §1.4 | The shared value is what makes a checkpoint read as an event. **Trap:** a milestone-*filled* band directly under the header merges with it. Milestone is carried by edge, tint or glyph in body content — never a full fill adjacent to the header. |
| DES-03 | Drawer active state is a neutral white wash, not brand orange | Built | — | `--drawer-active-bg: rgba(255,255,255,0.14)`. Brand orange at 32% went muddy against oxblood. **Recorded only in a `styles.css` comment until now.** |
| DES-04 | Three text levels, not eight | Built | §1.4 | 67 cold greys (`#333`–`#eee`) retired in phase 2c. If a fourth level seems necessary, the hierarchy is wrong. |
| DES-05 | Radius conversion prefers exact token, then nearest *smaller* — except elements already pill-shaped in situ | Built | §1.2 | Nine buttons at 20px and one at 16px were pills; mapping by value would have flattened them. Three decorative values stay off-scale: the 2px hamburger bars, the two 4px chat-bubble tails. |
| DES-06 | Elevation is the exception; surfaces separate by hairline and space | Built | §1.3 | `--elev-1` covers nearly everything; 2/3/4 are modals and drawer only. Coloured shadows only where a control has a deliberate press affordance, expressed as `color-mix()`, never raw rgba. See open items — the path button is the last holdout. |
| DES-07 | One progress indicator *per fact*; sibling facts share one form | Built | §3.4 | Clarified 2026-07-28. The dashboard's `.track` per path is two instances of one fact, not two competing indicators. What stays forbidden is two bars measuring different quantities on one screen. |
| DES-08 | The emoji exception belongs to Topics, not the dashboard | Built | §3.6 | Corrected 2026-07-28. `renderHomeScreen()` renders Topics and `renderDashboard()` renders Home; the misleading name is a phase 6 rename. The dashboard's own emoji were removed. |
| DES-09 | Emoji removed from path step rows | **Not built** | §3.6 | Settled 2026-07-30. Lesson steps still render the category icon (🌟, 🍜, 🛍️ …) from `categories.json`; mockup 05 drew those rows with no icon slot at all. The Topics grid keeps its icons. Phase 4. |
| DES-10 | Passing a quiz does not mark a lesson complete | Built | §3.8 | A learner may run the quiz twice before the conversation and once after. A quiz run is not a completion event; the user decides. |
| DES-11 | Tabs hold destinations, not features | Policy | §3.9 | Settings, account, profile, subscription live behind the header corner regardless of feature count. Headroom if pressure comes is **Translate** (a utility — you don't study in it). **Never a "More" tab.** |
| DES-12 | Tab bar and docked action bar never coexist | Policy | §3.10 | Together they are 118px on an 812px screen and two competing "what now" zones. Fallback if the hidden state feels like a dead end: collapse tabs to a ~34px icons-only strip. Built by MOCK-11-bar. |
| DES-13 | The error red is a separate, warmer, brighter red — never a reuse of milestone | Built | §4 | `renderCheckpointWords` reuses `renderQuizCore` with checkpoint chrome, so `--milestone` is already on the furniture during a checkpoint quiz. The two deep reds must never meet. |
| DES-14 | Destructive controls are ghosts, not filled reds | Built | §4 | Speak mode's Stop is a ghost with `--feedback-bad` text. A filled red would read as an error and break §3.1's one-filled-button rule. |
| DES-15 | One content measure — `--measure: 680px` | Built | §1.5 | One value; there is no second. `--measure-text: 68ch` caps prose line length separately. |

---

## Open — approved in principle, specifics undecided

| Subject | Question | Blocks |
|---|---|---|
| Row-type icons on the path timeline | With emoji gone (DES-09), does a lesson row want a line glyph? Not per topic — 42 would be needed and they converge in monochrome at 16px. Candidate is one per *row type*: `bookOpen` for a lesson, the diamond for a checkpoint, both already in the 15-icon set. **Deferred until MOCK-06-C and MOCK-07-Asoft land**, since both add weight to the rail and the row will read differently. | After phase 4 |
| Settings sheet panel | MOCK-13-A or MOCK-13-B — never recorded. | Phase 6 |
| Path button press effect | `.path-btn-mark` / `.path-btn-next` keep a chunky `0 3px 0` solid-offset shadow — the last thing not converged with DES-06. Flatten, or keep as a deliberate affordance? | — |
| `.cp-optional` | A full sentence styled as a green chip with a 🔓 emoji. Green reads as *done* per §4, but the content is informational. | — |
| Direction-toggle labels | `漢→EN` / `EN→漢` / `🔊→EN` (漢 = hon3, Chinese) — compact but cryptic, and permanently above every question. | — |
| Landscape stepper | ~160px of chrome on a 390px-tall viewport. Candidate: hide the stepper under `(max-height: 450px)`. Needs a real device. | After phase 4 |
| Dashboard density | The converged Home reads quieter than its predecessor. Deliberately not adjusted. | After phase 6 |
| Product name and logo | `廣東話 (gwong2 dung1 waa2) / Cantonese Learner` is placeholder. The name gates the logo, which gates the final header treatment. | — |
