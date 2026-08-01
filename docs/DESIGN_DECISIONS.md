# DESIGN DECISIONS — Tea House Cantonese Learner

*One row per approved design decision. This exists because three decisions
(MOCK-06-C, MOCK-06-K2's completed state, MOCK-07-Asoft) were settled in mockups,
never transcribed anywhere, and so nothing detected that the code had never
implemented them. A row saying "approved, not built" is visible in a way that a
paragraph inside a mockup is not.*

*Two further failure modes have since shown up, both worth guarding against. A row
can be **wrong** rather than missing: MOCK-11-bar's row described two different
decisions as one and cited the wrong rule for one of them, which mis-scoped a whole
phase. And a decision can go unrecorded because the component was never treated as
part of the system at all: the topic subtabs kept their pre-system treatment through
four phases of convergence because they had no row here, no §2 primitive entry and no
styleguide section — the only trace anywhere was the words "active subtab" in §4's
state table.*

**Scope: UX and visual design only.** Architecture, tooling and data decisions
are not in here — they don't share this shape, since they have no mockup to point
at and no built/not-built axis. If they ever need a register they should get their
own file rather than being forced into this one. For now they live in the *Current
architecture* section of the project instructions.

Last updated: 2026-08-01 · sw.js at v119

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
| MOCK-05-retreat | A completed checkpoint drops milestone colour and goes quiet white with a green mark | Built | v108. Title and count line muted, badge outline jade, rail node jade tint, card drops `card--milestone`, in-card `◆` deleted. A stale `.cp-done .cp-card .path-step-title { color: var(--jade) }` sat *after* the new rule at equal specificity and would have silently kept the old colour. |
| MOCK-06-C | Next-up emphasis — solid `--brand` node with white glyph; card gets `--brand-edge` border plus a 3px `--brand` left edge | Built | v108, as `.node--current` plus the card edge. The glow and drop shadow are gone. Padding is trimmed 2px so text stays aligned with neighbouring rows. A next-up checkpoint takes the brand edge over the oxblood one, since `.path-step.next .path-step-card` outranks `.card--milestone`. |
| MOCK-06-K2 | Checkpoint card — white with a 3px oxblood left edge, not a tint wash | Built | Open state via `.card--milestone`; completed state completed in v108 (see MOCK-05-retreat). |
| MOCK-06-P1 | Checkpoint progress — segment pips in the card, one per activity | Built | v111, as the `.segs` primitive. Shown once started and **hidden again when complete** — `.segs` is a milestone form, and a completed checkpoint has dropped milestone colour, so filled pips would have quietly undone MOCK-05-retreat. |
| MOCK-06-P2 | Checkpoint progress — a progress ring wrapping the rail diamond | Built | v111, in MOCK-07-Asoft's geometry. The decision to put the ring on the diamond is what shipped. |
| MOCK-07-Asoft | Diamond progress geometry — the diamond itself is the progress track, 3px corner radius | Built | v111, all three states, as the `.mk` primitive. Ring, pips, the three-state count line and the three-state badge (`Checkpoint` → `Resume` → ✓). Verified against one, two and three activities. Mockup 07's stated knock-on — the rail widening 28→32px and shifting every card — did not apply: the rail was already 32px. |

### Topic, quiz and path context

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-04-topiclearn | Topic/Learn reference page | Reference | The page the design system was derived from. |
| MOCK-08-quiz | Quiz states and result screen | Reference | |
| MOCK-10-B | Path context in a topic — contextual row plus stage stepper | Built | v109. `getPathContext()` now returns stage name, position-within-stage, siblings and stage completion via `buildStageInfo()`. Retired `renderPathBanner` and its second progress bar. |
| MOCK-10-cont | The path action moves to a continuation card at the **foot** of the lesson, in four states | Built | v109. Recorded late: mockup 10 decided this alongside the stepper, DESIGN_SYSTEM §8's provenance table listed it, and it reached no register row, no styleguide entry and no phase brief — so retiring the top action zone was briefed with nothing replacing the only in-topic route to "mark complete". **A fifth instance of the failure this file exists to catch, and the first caught before shipping rather than after.** |
| MOCK-16-S28 | Stage stepper painted scale — the base 28px node, not the 20px `--sm` variant | Built | v112. Chosen on device after the strip read as decoration at 20px. Left `.node--sm` with zero call sites, so it was retired. |
| MOCK-16-H2 | Stage context on the checkpoint hub — contextual row and stepper, hairline keeps measuring stage topics, activity progress moves to `.segs` | Built | v112. Gives the hub the lateral navigation it had none of. Needed `.node--cp.node--current` (milestone fill, white glyph) so the end diamond reads as where you are while staying a diamond. The rejected option repointed the hairline at activities, which would have made one element mean two different things one tap apart. |

### Navigation and chrome

| ID | Decides | Status | Notes |
|---|---|---|---|
| MOCK-11-matrix | Which **subtabs** carry the completion action — Learn shown, Chat shown, Quiz reduced, standalone none | Built | v113. Mockup 11 §2's table is headed *Tab / state* and means the topic's Learn/Chat/Quiz switch, **not** the bottom tab bar. This row and the one below were a single row citing DES-12 for four phases, which scoped phase 5 as blocked on a tab bar it never needed. Two of the five rows were unbuilt: mockup 12 revised *Quiz · mid-question* from "hidden" to completion-only and *Quiz · result* from "merged" to continuation-returns, and neither revision shipped until v113. |
| MOCK-20-B2 | The docked bar is **52px and slim**, carrying three of the four continuation states; path-complete stays in flow | Built | v118. Re-mocked on v117 because the tab bar changed the question: the bar no longer sits on empty screen edge but on top of 46px of permanent navigation. Slimming saved 8px against mockup 11's 60px — worth having, but the honest comparison is 98px of bottom chrome against 46px, so the docked bar roughly doubles it inside path lessons. Accepted because an invisible completion action is the worse problem. **MOCK-20-D (drop the tab labels for a 34px icons-only bar, saving a further 12px) is held as a known lever, not rejected** — it costs five primary nav targets under `--tap-min` and makes the main menu change shape by screen, which is not worth spending before knowing the stack is a problem. |
| MOCK-11-bar | The completion action is **docked to the viewport** rather than in-flow at the foot of the lesson | Built | Phase 6. Approved explicitly ("this is good and what I was thinking"), but MOCK-10-cont later shipped the same four states as a card at the foot and DESIGN_SYSTEM §2 codified that position. They do not conflict in principle — mockup 10 moved the action out from *above* the lesson, which docking also satisfies — but only one can be implemented. **Also unresolved: the bar as drawn gives its forward action a fill; the built card deliberately uses a tint.** Merged into phase 6 because DES-12 is the reason the bar has a suppression rule at all, and DES-12 cannot be exercised without tabs. |
| MOCK-12-quizbar | The continuation is present on the Quiz subtab; it drops its forward action only while a question is live, and the per-question button is relabelled "Next question" | Built | v113. `isQuizQuestionLive()` is the single source of the live-question-versus-result distinction. Mockup 12's stated reason — a filled "Next topic" under a filled "Next question" — no longer applies, since MOCK-10-cont made the forward action a tint; the exception survives on **label** ambiguity instead, which makes the relabel load-bearing rather than cosmetic. The relabel also lands in Word Review and Checkpoint Words, which share `renderQuizCore`. The wrong-answer panel keeps "Got it — next" (see BACKLOG). |
| MOCK-13-A / MOCK-13-B | **Drawer** panel colour — A parchment, B oxblood | Moot | **This row was wrong until 2026-07-31 and is corrected here.** It described A and B as *settings sheet* options; read in `13-application-nav-1.html`, they are two variants of the **drawer**, offered conditionally — the mockup's own words are that A beats B *if the drawer is kept*. The mockup then recommends tabs, which retires the drawer (P6-2) and takes this choice with it. Nothing was ever unrecorded; the question simply does not arise. |
| MOCK-19-sheet | Settings is a **bottom sheet sized to its contents**, not a right panel or a full screen | Built | v117. S-panel was rejected as the drawer in a new coat — same geometry, same scrim — which would have meant retiring a right panel and reintroducing one in the same phase. S-screen is where this ends up once DES-11's account and subscription arrive, but with one setting in it a whole screen with its own back stack reads as a mistake. The `.set-row` markup is identical in all three, so the migration is a wrapper change, not a rebuild. |
| MOCK-13-tabs | Bottom tab bar replaces the drawer; the header's menu corner becomes a **settings** cog | Built | Phase 6 (P6-2, P6-3). The mockup draws the cog in the header but **never draws the sheet itself**, so the settings sheet has no approved design — it needs its own mockup rather than a decision. `renderHeader()`'s right corner is the hamburger today, so the cog replaces it rather than joining it. |
| MOCK-17-fill | Subtab treatment — one hairline rail, muted labels, brand label plus a 2px brand rule when active, **equal widths** | Built | v114 (P6-1), as `.tabs` / `.tab` / `.tab--on` in the primitive block. Chosen over MOCK-17-packed (mockup 04's left-packed geometry with an `--sp-6` gap) because the tab bar must be full-width across five destinations, and matching geometry is what makes them one primitive rather than two that resemble each other. Retired `.subtab-btn`'s border, background, radius and solid-fill active state, and took the sub-44px list from three declared misses to two. **`.tabs--top` is not built** — it lands with the tab bar in P6-2 and stays in `styleguide.html` until it has a consumer. Building this corrected a claim repeated in three places: `--top` is *not* only an edge swap (see DESIGN_SYSTEM §2). |
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
| DES-09 | Emoji removed from path step rows | Built | §3.6 | v108. `.path-step-icon` deleted along with the rule, which was left dead once both call sites went. The Topics grid keeps its icons. |
| DES-10 | Passing a quiz does not mark a lesson complete | Built | §3.8 | A learner may run the quiz twice before the conversation and once after. A quiz run is not a completion event; the user decides. |
| DES-11 | Tabs hold destinations, not features | Policy | §3.9 | Settings, account, profile, subscription live behind the header corner regardless of feature count. Headroom if pressure comes is **Translate** (a utility — you don't study in it). **Never a "More" tab.** |
| DES-12 | Tab bar and docked action bar never coexist | **Superseded** | §3.10 | Held while the docked action bar was expected. It never arrived — MOCK-11-bar is unbuilt and MOCK-10-cont's in-flow continuation card shipped instead — so at v117 there was no second bottom bar to be exclusive with, and applying the rule would have hidden the main menu to avoid a collision that does not exist. Superseded by DES-21. The 118px reasoning is still correct and DES-12 comes back into force if MOCK-11-bar is ever built; the ~34px icons-only fallback is kept for that case. |
| DES-22 | The completion action is **docked**, and there is only one of it | Built | §2 Docked bar | v118. Two halves, and the second matters as much: the in-flow card is *reduced*, not kept alongside. Two routes to the same action on one screen is precisely how the old top action zone and the continuation card came to coexist, which phase 4 spent a deploy cleaning up. DES-12's collision is now real again — a docked bar and a tab bar do coexist — so §3.10's exclusivity reasoning applies for the first time; it is answered by making the docked bar slim rather than by hiding the tabs (DES-21 stands). |
| DES-21 | **The tab bar is visible on every screen**, including topics and checkpoints | Built | §3.10 | v117. Settled 2026-08-01: it is the main menu, and hiding the main menu inside the screens you spend the most time in makes them dead ends. Reverses DES-12's screen matrix, not its reasoning. Consequence: every full-screen wrapper must carry `calc(var(--tabbar-h) + var(--sp-5) + env(safe-area-inset-bottom, 0px))` bottom padding — the bar is fixed and reserves no space, so a wrapper without it clips its own last element. Four carry it today. |
| DES-13 | The error red is a separate, warmer, brighter red — never a reuse of milestone | Built | §4 | `renderCheckpointWords` reuses `renderQuizCore` with checkpoint chrome, so `--milestone` is already on the furniture during a checkpoint quiz. The two deep reds must never meet. |
| DES-14 | Destructive controls are ghosts, not filled reds | Built | §4 | Speak mode's Stop is a ghost with `--feedback-bad` text. A filled red would read as an error and break §3.1's one-filled-button rule. |
| DES-15 | One content measure — `--measure: 680px` | Built | §1.5 | One value; there is no second. `--measure-text: 68ch` caps prose line length separately. |
| DES-16 | On a node carrying two states, **current outranks done** | Policy | §2 | Settled 2026-07-30 building the checkpoint hub. Orientation beats history: a completed topic you are viewing shows the current fill, and so does a completed checkpoint. Composite states are declared explicitly (`.node--cp.node--done`, `.node--cp.node--current`) because relying on declaration order to resolve them is what made the diamond look unvisited in the first place. |
| DES-17 | A component class layered on a primitive **wins**, because components sit below primitives in the file | Policy | §2 | Settled 2026-07-30. This is the documented "don't edit a primitive for one screen" rule read in the other direction, and it cuts both ways: `.cont-next-node`'s brand tint silently overrode `.node--cp`'s milestone on the checkpoint variant. Scope component colour to the case that needs it, and keep composite primitive states off elements that a component is already colouring. |
| MOCK-18-Thug | Nameplate tap zone **hugs its text** rather than filling the centre slot | Built | v116. The choice only came into existence at v115: a left-aligned shrink-to-fit plate hugged its text whether or not anyone decided it should, and centring gave the plate a slot wider than its contents. T-band (the whole centre region live, ~238×44px) was rejected because most of that area is blank oxblood on a header that is sticky on every screen — an invisible target that large catches stray thumbs mid-scroll. T-hug is ~128×44px and its bounds match what the eye reads as tappable, which is also what makes the press state legible. |
| MOCK-18-N1 + N2 | Nameplate carries **no affordance at rest**, and an opacity drop on press | Built | v116. Centring is what earns N1: a wordmark between two corner icons reads as a logo slot, where the old left-aligned plate read as a page heading and cued much less. N2 reuses `.btn-icon--header`'s existing opacity language rather than introducing one. **N3 (home glyph) was rejected partly because centring broke it** — the glyph joins the plate, so the group centres and the wordmark itself sits left of true centre, defeating the change it was drawn on. N4 (underlined subtitle) reads as a link. **Reopen rather than defend** if the hidden tab bar proves to be a dead end on device (§3.10): the whole point of DES-18 is that this is the escape hatch, and an escape hatch nobody can see may not be doing its job. |
| DES-18 | The header nameplate is a live route **home** | Built | §2 Header | Built v116. Settled 2026-07-30. Structurally required rather than a convenience: with the tab bar hidden inside a topic (§3.10), the nameplate is the only visible route to a top-level destination, so it is part of what makes the hidden state not a dead end. `renderHeader()` already renders the nameplate unconditionally on every screen and it is currently inert — no click handler — so this is a handler plus a tap target, not a redesign. Existed only as three words in a phase scope line until now. |
| DES-19 | An active tab is **never** a fill | Policy | §2 Subtabs | Settled 2026-07-30 with MOCK-17-fill; expressed in code from v114. A tab is a selector, not an action; the screen's one filled element belongs to the thing to do next (§3.1). The pre-system subtabs put a solid brand fill on the active tab, which made the view switch the loudest thing on the Learn screen. Applies to the phase 6 tab bar in advance. |
| DES-20 | The header is **three slots** — an icon in each corner, the nameplate centred between them | Built | §2 Header | v115. Not a new decision: §2 has specified it since the design system was written, and mockups 04, 10, 11, 12, 13 and 14 all draw it. The app never did — plate left, both icons right, left corner empty. Recorded now because it had no row, which is why four phases of convergence passed over it. **The gap was invisible for a specific reason worth keeping:** `styleguide.html`'s Header section described the centred plate correctly but drew it with styleguide-local classes (`.sg-header`, `.nameplate`, `.icon.left`) that exist nowhere in `styles.css`, so there was no shared vocabulary in which the doc and the code could be compared. Corner controls sit in fixed `--tap-min` slots so the plate centres on the row rather than on leftover space. |

---

## Open — approved in principle, specifics undecided

| Subject | Question | Blocks |
|---|---|---|
| Row-type icons on the path timeline | With emoji gone (DES-09), does a lesson row want a line glyph? Not per topic — 42 would be needed and they converge in monochrome at 16px. Candidate is one per *row type*: `bookOpen` for a lesson, the diamond for a checkpoint, both already in the 15-icon set. **Now judgeable** — MOCK-06-C and MOCK-07-Asoft have landed and the rail carries more weight than it did. | Nothing |
| Settings sheet design | Not a choice between recorded options — mockup 13 draws the cog but never the sheet, so there is nothing to pick between. Needs a mockup. **Sequencing constraint:** `renderDrawer()` holds the only live audio-speed control, so retiring the drawer (P6-2) before the sheet exists removes the only route to a live setting. | Phase 6 |
| ~~Docked bar vs continuation card~~ | Settled v118 (DES-22) — the bar, with the card reduced to path-complete. Fill vs tint settled the same way: tint. | Nothing |
| The fifth tab slot | Translate today; §3.9 once said "You", which contradicts DES-11 unless it means progress and stats — a destination that does not exist. Needs the tab bar in use to judge. | Nothing |
| Subtab icons | **Settled by default at v114** — MOCK-17-fill kept mockup 04's per-tab glyphs (`bookOpen`, chat, quiz) and P6-1 changed nothing there, so the built subtabs carry icons. The path row-type question above now stands alone rather than being half of a pair. | Nothing |
| "Got it — next" | The wrong-answer panel's forward button was left unchanged when the correct-answer one became "Next question". Already lexically distinct, and it shares a row with "Hear it again" that would wrap at 360px. Confirm or match. | Nothing |
| `.cp-optional` | A full sentence styled as a green chip with a 🔓 emoji. Green reads as *done* per §4, but the content is informational. | — |
| Direction-toggle labels | `漢→EN` / `EN→漢` / `🔊→EN` (漢 = hon3, Chinese) — compact but cryptic, and permanently above every question. | — |
| Landscape stepper | ~160px of chrome on a 390px-tall viewport, and the stepper is now 28px rather than 20px, so slightly more. Candidate: hide the stepper under `(max-height: 450px)`. The stepper now exists on two screens, so this is judgeable on a real device. | Nothing |
| Dashboard density | The converged Home reads quieter than its predecessor. Deliberately not adjusted. | After phase 6 |
| Product name and logo | `廣東話 (gwong2 dung1 waa2) / Cantonese Learner` is placeholder. The name gates the logo, which gates the final header treatment. | — |
