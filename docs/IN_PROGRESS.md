# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-07-30 · sw.js at v107

## Design system rollout — phases 1–3 done, phase 4 next

Phase 3 shipped across v104–v107 and is folded into STATUS.md. Every card
surface, circular control and labelled control in the app now comes from the
primitive layer rather than from a component's own declarations.

### Remaining rollout

| Phase | Scope | sw.js | Notes |
|---|---|---|---|
| ~~1~~ | ~~Tokens.~~ | ~~v95~~ | Done 2026-07-25 |
| ~~2~~ | ~~Convergence.~~ | ~~v96–v103~~ | Done 2026-07-28 |
| ~~3~~ | ~~Primitive adoption.~~ | ~~v104–v107~~ | Done 2026-07-29 |
| **4** | **The unbuilt path decisions + path context.** Full brief below. | **v108–v110** | Run `node tools/validate.js` after — touches path data reads. |
| 5 | Docked action bar. Tab suppression and the active-quiz-question exception. | v111 | Builds DES-12, via MOCK-11-bar and MOCK-12-quizbar. |
| 6 | Nav. Tab bar replacing `renderDrawer()`, settings sheet behind the cog, nameplate-as-home. | v112 | Needs `pushNav()` care so tab switches behave with browser back. Keep the `activeNav` resolution logic. Rename `state.homeView` → `state.topicsView` here. **MOCK-13 has two panel options and no record of which was chosen — settle before starting.** |

---

## Phase 4 — full brief

**Read these three mockups before starting:**
`docs/design/mockups/05-path-and-checkpoint.html`,
`06-nextup-checkpoint-progress.html`, `07-diamond-progress.html`.

Phase 4 is mostly not new design. Four decisions were approved against those
mockups and never built. `docs/DESIGN_DECISIONS.md` is the register — every item
below has a row there, and each should flip to *Built* as it ships.

**Identifier convention:** mockup options are `MOCK-NN-X`; decisions settled
without a mockup are `DES-NN`. Work items below are named, not lettered — a brief
that invents its own A/B/C collides with the mockup labels it is describing, which
is what made the previous version of this brief unreadable.

### Work items

#### P4-1 · Completed checkpoint — the milestone retreat (MOCK-05-retreat)

Approved in mockup 05: *"Completed checkpoints drop the Oxblood tint and go quiet
white with a green mark. Milestone colour signals 'this is ahead of you'; once
done, it stops competing."* Transcribed in `styleguide.html` § Nodes → Checkpoint
step states.

| Element | Should be | Is today |
|---|---|---|
| Title | `--muted-dark` | jade |
| Badge (`.path-cp-badge`) | outline, jade | filled oxblood, in **both** states |
| Card | plain hairline, no left edge | keeps `card--milestone` |
| Rail node | jade tint + jade edge | solid jade fill |
| `.path-step-icon` `◆` in the card | **should not exist** | present, and black — it declares no `color` |

That last row is the black diamond seen in QA. It is not a missing declaration:
mockup 05 puts the diamond in the rail only, and says the checkpoint diamond is
*"a rotated square with the border language rather than a text glyph — crisper at
small sizes"*. Delete the span rather than colouring it.

**The card's left edge is settled** — a completed checkpoint drops to a plain
hairline. MOCK-06-K2's 3px oxblood edge applies to the open state only. William
approved mockup 05's completed state (plain white, hairline, green mark) directly;
his reservation was about oxblood in the *open* state, which is what produced K2.

#### P4-2 · Next-up emphasis (MOCK-06-C)

Approved in mockup 06. William's note on mockup 05 was that the orange call-out
*"feels a bit too passive still"* and wanted it punchier; MOCK-06-C is the answer,
and it is not what shipped.

| | MOCK-06-C (approved) | Built today |
|---|---|---|
| Node | solid `--brand` fill, white glyph | `--brand` border + 4px glow, ink glyph |
| Card | `--brand-edge` border + **3px `--brand` left edge**, `padding-left: calc(var(--sp-4) - 2px)` | `--brand` border + 12px brand-tinted drop shadow |

The built version leans on glows, which also contradicts DESIGN_SYSTEM §3.2 —
emphasis is an edge, not a shadow. The left-edge treatment matches MOCK-06-K2's
checkpoint card rule, so next-up and checkpoint become one visual language.

#### P4-3 · Emoji off the path step rows (DES-09)

`renderPathStep()` renders the topic's category icon (🌟, 🍜, 🛍️ …) from
`categories.json` in `.path-step-icon`. DESIGN_SYSTEM §3.6 bars emoji from path
step rows, and mockup 05 drew those rows with no icon slot at all. Delete.
**The Topics category grid keeps its icons** — that is the one place §3.6 permits
them.

Deliberately *not* replacing them with a line icon. Per-topic line glyphs would
need 42 of them and they converge in monochrome at 16px; and a per-topic identity
mark re-establishes what §3.5 removed when category accents were switched off. A
one-per-*row-type* glyph (`bookOpen` for a lesson, the diamond for a checkpoint,
both already in the 15-icon `ICON_PATHS` set) is the fallback if the row reads
flat — deferred until P4-2 and P4-5 land, since both add weight to the rail.

#### P4-4 · Stage context in a topic (MOCK-10-B)

1. **`getPathContext()` returns no stage.** It gives `step`/`total` against the
   flat 41-lesson list, which is why the UI can only say "step 8 of 41". Stage
   name and position-within-stage are what the contextual row and stepper need.
   `getPathStages()` and `getStage()` already exist to build on.
2. **Build the contextual row** — `.ctx` › `.ctx-inner` › `.ctx-row` +
   `.ctx-track`. Does not exist in `styles.css`.
3. **Build the stage stepper** — MOCK-10-B, `.stepper` › `.sx` › `.node--sm` +
   `.sline`. Does not exist in `styles.css`.
4. **Retire `renderPathBanner`'s top action and second progress bar** (`.path-bar`).

**Scope note, measured 2026-07-30:** this is larger than "build the stepper". The
`.node` family (`.node` + `--sm` `--done` `--current` `--cp`) that DESIGN_SYSTEM §2
specifies as the shared shape for all position markers does not exist either.
Build it as a real primitive and migrate `.path-step-node` / `.cp-node` onto it —
P4-1 rewrites those node states and P4-5 replaces the checkpoint node anyway, so
one migration is cheaper than three ad-hoc edits.

#### P4-5 · Diamond progress (MOCK-07-Asoft)

William asked on mockup 05 for a way to show a part-finished checkpoint, approved
MOCK-06-P1 and MOCK-06-P2 together, and confirmed the diamond shape must be kept
for a milestone — which mockup 07 then solved. **Build MOCK-07-Asoft exactly as
drawn, all three states** (not started / part done / complete). That gives:

- **Ring on the diamond** — the diamond itself is the progress track, 3px corner
  radius. Dash length from `getTotalLength()`, never hardcoded.
- **Segment pips in the card**, one per activity, shown only once started.
- **The count line** — `Complete` / `N of M done` / `M activities · tap to open`.
- **A three-state badge** — `Checkpoint` → `Resume` → ✓. The code has two today
  (`'✓'` or the literal `'CHECKPOINT'`), with no partial state.

Confirmed to scale to three activities, which matters for the future third
checkpoint activity in BACKLOG.md.

`.mk` and the `getTotalLength()` dash technique exist in `styleguide.html` and
nowhere in `styles.css` or `render.js`.

**Mockup 07's stated knock-on does not apply.** Its lede says the rail widens from
28px to 32px, shifting every step card 4px right. Measured 2026-07-30:
`.path-step-rail` and `.path-step-node` are *already* 32px, so the ring drops into
a box that is already the right size and no card moves. This makes P4-5 smaller
and lower-risk than the mockup implies.

### Deploy order

| sw.js | Contents | Why together |
|---|---|---|
| **v108** | P4-1, P4-2, P4-3 | All three touch the same rules in `styles.css` and the same two render functions, and all three are visible on the path timeline for QA in one pass. |
| **v109** | P4-4 — the `.node` primitive, contextual row, stepper, `getPathContext()` stage data | The primitive lands before anything depends on it. |
| **v110** | P4-5 | Judged last, once the rail around it has settled. |

### Also worth deciding alongside P4-2

**Path button press effect.** `.path-btn-mark` / `.path-btn-next` keep a chunky
`0 3px 0` solid-offset shadow — the last thing not converged with DES-06
(elevation is the exception). Both this and P4-2 are about how a primary path
action is emphasised, so they are cheaper to settle together. Not a blocker.

---

### Standing checks for any CSS work

All four have caught real bugs. Run before shipping. Baseline verified clean at
v107 on 2026-07-30.

**Duplicate declarations inside one rule** — this is how `.word-card` acquired a
near-black border:

```python
import re
from collections import Counter
s = open('styles.css', encoding='utf-8').read()
for m in re.finditer(r'([^{}]*)\{([^{}]*)\}', s):
    sel = m.group(1).strip().split('\n')[-1].strip()
    props = [d.split(':')[0].strip() for d in m.group(2).split(';') if ':' in d]
    dup = [p for p, n in Counter(props).items() if n > 1 and p and not p.startswith('--')]
    if dup:
        print(sel, '->', dup)
```
Expected output: `.nav-item -> ['transition']` and nothing else.

**Controls under the tap minimum** — a base rule can declare `--tap-min` and a
later layout rule can quietly reset it, which is how `.quiz-next` shipped at 36px:

```python
import re
s = open('styles.css', encoding='utf-8').read()
for m in re.finditer(r'\n\s*([^{}\n]+)\{([^{}]*)\}', s):
    sel, body = m.group(1).strip(), m.group(2)
    h = re.search(r'min-height:\s*(\d+)px', body)
    if h and int(h.group(1)) < 44 and 'cursor' in body:
        print(sel, h.group(1) + 'px')
```
Expected output: `.hamburger`, `.drawer-speed-btn`, `.subtab-btn` and nothing else.

**Undeclared token references** — `.cp-missed-c` once referenced `--font-cjk`,
which never existed, so it silently fell back to a generic serif:

```python
import re
s = open('styles.css', encoding='utf-8').read()
declared = set(re.findall(r'(--[a-z0-9-]+)\s*:', s))
used = set(re.findall(r'var\((--[a-z0-9-]+)', s))
print(sorted(used - declared))
```
Expected output: `['--token']` only — that one is inside a comment.

**Out-of-scope `${color}`** — after changing any function signature, confirm no
function body references a variable it no longer receives. `node --check` will
not catch it; it is valid syntax and a runtime `ReferenceError`.

### Open questions carried forward

These are also in `DESIGN_DECISIONS.md` § Open. Listed here because they touch
phase 4 work.

- **Landscape stepper.** Header + contextual + stepper + bar ≈ 160px of chrome on
  a 390px-tall viewport. Candidate fix: hide the stepper under
  `(max-height: 450px)`. Needs a real device; the stepper doesn't exist until
  P4-4 lands.
- **Row-type icons on the path timeline.** See P4-3. Deferred until after phase 4.
- **Path button press effect.** See above — decide alongside P4-2.
- **Dashboard density.** The converged Home reads quieter than the old one.
  Deliberately not adjusted. **Revisit after phase 6.**
- **Quiz direction-toggle labels** (`漢→EN` / `EN→漢` / `🔊→EN`, where 漢 (hon3)
  means Chinese) inherited unchanged — compact but cryptic, and permanently above
  every question.
- **`.cp-optional`.** A full sentence styled as a green chip with a 🔓 emoji.
  Green reads as *done* per §4, but the content is informational. Pulled from the
  phase 3 migration deliberately; needs its own small decision.
