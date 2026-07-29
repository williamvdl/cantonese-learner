# DECISIONS — Tea House Cantonese Learner

*One row per approved design decision. This exists because three decisions
(MOCK-06-C, MOCK-06-K2's completed state, MOCK-07-Asoft) were settled in mockups,
never transcribed anywhere, and so nothing detected that the code had never
implemented them. A row saying "approved, not built" is visible in a way that a
paragraph inside a mockup is not.*

Last updated: 2026-07-29 · sw.js at v107

---

## How to reference a decision

Every option gets an ID of the form **`MOCK-NN-X`** — the mockup file number, then
the option label as it appears inside that file. `MOCK-06-K2` is the option
labelled K2 in `06-nextup-checkpoint-progress.html`. Nothing needs renaming: the
prefix just makes an otherwise-ambiguous label unique.

This matters because five mockups (06, 07, 10, 13, 15) each have an option
labelled **B**, meaning five different things. The mockups that prefixed their
labels from the start — K1–K4, P1–P4, W1–W6 — have never caused confusion. This
extends that to everything.

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
| **Reference** | A design pass with no competing options — nothing was "chosen". |
| **Superseded** | A later decision replaced it. Kept so the trail survives. |

---

## Register

### Identity and colour

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-03-oxblood | Header colour — Oxblood `#6E2639`, chosen from 8 candidates | Built | `--header-bg`. Deliberately equal to `--milestone`; see DESIGN_SYSTEM §1.4. |
| MOCK-09-W2 | Wrong-answer red — `#B42318` | Built | `--feedback-bad`. Warmer and brighter than `--milestone` on purpose, so the two reds never read alike. |

### Path timeline and checkpoints

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-05-path | Path timeline, checkpoint hub and the four-state system | Reference | The base design the 06/07 options refine. |
| MOCK-05-retreat | A completed checkpoint drops milestone colour and goes quiet white with a green mark | **Not built** | Title is jade not muted, badge stays filled oxblood in both states, rail node is a solid jade fill, card keeps its oxblood edge. Phase 4. |
| MOCK-06-C | Next-up emphasis — solid `--brand` node with white glyph; card gets `--brand-edge` border plus a 3px `--brand` left edge | **Not built** | A 4px glow and a 12px tinted drop shadow shipped instead, which also contradicts DESIGN_SYSTEM §3.2 (emphasis is an edge, not a shadow). Phase 4. |
| MOCK-06-K2 | Checkpoint card — white with a 3px oxblood left edge, not a tint wash | Partial | Open state built via `.card--milestone`. Completed state not built — see MOCK-05-retreat. |
| MOCK-06-P1 | Checkpoint progress — segment pips in the card, one per activity | **Not built** | Approved together with P2. Shown only once started. |
| MOCK-06-P2 | Checkpoint progress — a progress ring wrapping the rail diamond | **Not built** | Superseded in geometry only by MOCK-07-Asoft; the decision to put the ring on the diamond stands. |
| MOCK-07-Asoft | Diamond progress geometry — the diamond itself is the progress track, 3px corner radius | **Not built** | Confirmed to scale to three activities. `.mk` and the `getTotalLength()` dash technique exist in `styleguide.html` and nowhere in `styles.css` or `render.js`. Phase 4. |

### Topic, quiz and path context

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-04-topiclearn | Topic/Learn reference page | Reference | The page the design system was derived from. |
| MOCK-08-quiz | Quiz states and result screen | Reference | |
| MOCK-10-B | Path context in a topic — contextual row plus stage stepper | **Not built** | Needs `getPathContext()` to return stage name and position-within-stage; it currently returns position against the flat 41-lesson list. Phase 4. |

### Navigation and chrome

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-11-bar | Docked action bar and the tab-behaviour matrix | Not built | Phase 5. |
| MOCK-12-quizbar | Docked bar on the quiz; the one-fill exception during an active question | Not built | Phase 5. |
| MOCK-13-? | Settings sheet panel — A parchment, B oxblood | **Choice not recorded** | Both options exist in the mockup; no doc records which was picked. Needs deciding before phase 6. |
| MOCK-15-B | Circular control vocabulary — two painted sizes (32 / 44px), painted size decoupled from touch target | Built | Shipped v106. |

### Dashboard

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-14-C | Dashboard hero — a card with a 3px left rule carrying the state, not a filled band | Built | A milestone-filled band directly under the header merges with it; see DESIGN_SYSTEM §1.4. |
| MOCK-14-zaam | Checkpoint watermark character — 站 (zaam6), a stop on a journey | Built | Chosen over 關 (gwaan1), which also means barrier, and DESIGN_SYSTEM §3.8 is explicit that a checkpoint is not a gate. Per-stage watermarks remain in BACKLOG.md. |

---

## Open — approved in principle, specifics undecided

| Subject | Question | Blocks |
|---|---|---|
| Emoji on path step rows | DESIGN_SYSTEM §3.6 bars emoji from path step rows; lesson steps still render the topic emoji (🌟, 🍜, 🛍️ …) from `categories.json`. Delete, or reopen §3.6? | Phase 4 |
| Settings sheet panel | MOCK-13-A or MOCK-13-B — never recorded. | Phase 6 |
| Path button press effect | `.path-btn-mark` / `.path-btn-next` keep a chunky `0 3px 0` solid-offset shadow — now the least converged thing left visually. Flatten, or keep as a deliberate affordance? | — |
| `.cp-optional` | A full sentence styled as a green chip with a 🔓 emoji. Green reads as *done* per §4, but the content is informational. | — |
| Direction-toggle labels | `漢→EN` / `EN→漢` / `🔊→EN` (漢 = hon3, Chinese) — compact but cryptic, and permanently above every question. | — |
| Landscape stepper | ~160px of chrome on a 390px-tall viewport. Candidate: hide the stepper under `(max-height: 450px)`. Needs a real device. | After phase 4 |
| Dashboard density | The converged Home reads quieter than its predecessor. Deliberately not adjusted. | After phase 6 |
| Product name and logo | `廣東話 (gwong2 dung1 waa2) / Cantonese Learner` is placeholder. The name gates the logo, which gates the final header treatment. | — |
