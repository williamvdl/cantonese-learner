# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-07-29 · sw.js at v107

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
| **4** | **Path context + the unbuilt path decisions.** See the full brief below. | v108 | Run `node tools/validate.js` after — touches path data reads. |
| **5** | **Docked action bar.** Including tab suppression and the active-quiz-question exception. | v109 | |
| **6** | **Nav.** Tab bar replacing `renderDrawer()`, settings sheet behind the cog, nameplate-as-home. | v110 | Needs `pushNav()` care so tab switches behave with browser back. Keep the `activeNav` resolution logic. Rename `state.homeView` → `state.topicsView` here. |

---

## Phase 4 — full brief

**Read `docs/design/mockups/05-path-and-checkpoint.html`, `06-nextup-checkpoint-progress.html`
and `07-diamond-progress.html` before starting.** Phase 4 is mostly not new design.
Three decisions were taken against those mockups and approved, and none of them
were ever built. The gap existed because the decisions lived only in the mockups
and never reached `styleguide.html` — they are now transcribed there.

### A. Build the three approved-but-unbuilt decisions

**A1 · Next-up emphasis — option C.** Approved in mockup 06. William's note on
mockup 05 was that the orange call-out *"feels a bit too passive still"* and
wanted it punchier; option C is the answer to that, and it is not what shipped.

| | Option C (approved) | Built today |
|---|---|---|
| Node | solid `--brand` fill, white glyph | `--brand` border + 4px glow, ink glyph |
| Card | `--brand-edge` border + **3px `--brand` left edge**, `padding-left: calc(var(--sp-4) - 2px)` | `--brand` border + 12px brand-tinted drop shadow |

The built version leans on glows, which also sits badly with DESIGN_SYSTEM §3.2 —
emphasis is an edge, not a shadow. Note the left-edge treatment matches the
checkpoint card's K2 rule, so next-up and checkpoint become one visual language.

**A2 · Completed checkpoint step — the milestone retreat.** Approved in mockup 05
(*"Completed checkpoints drop the Oxblood tint and go quiet white with a green
mark. Milestone colour signals 'this is ahead of you'; once done, it stops
competing"*). Now specified in `styleguide.html` § Nodes → Checkpoint step states.

| Element | Should be | Is |
|---|---|---|
| Title | `--muted-dark` | jade |
| Badge (`.path-cp-badge`) | outline, jade | filled oxblood, in both states |
| Card | plain hairline, no left edge | keeps `card--milestone` |
| Rail node | jade tint + jade edge | solid jade fill |
| `.path-step-icon` `◆` in the card | **should not exist** | present, and black — it declares no `color` |

That last row is the black diamond seen in QA. It is not a missing declaration;
mockup 05 puts the diamond in the rail only and says explicitly that the
checkpoint diamond is *"a rotated square with the border language rather than a
text glyph — crisper at small sizes"*. Delete the span rather than colouring it.

**A3 · Partial checkpoint progress — P1 + P2 together, on the diamond.** Approved
across mockups 06 and 07. William asked on mockup 05 for a way to show a
part-finished checkpoint, chose **both** P1 (the mark becomes a tick as it
progresses) and P2 (the "1 of 2 done" count), and confirmed the diamond shape
must be kept for a milestone — which is what mockup 07 then solved, with **A-soft**
approved and confirmed to scale to three activities.

Built today: P2 exists as text (`N of M reviewed · tap to open`). P1 does not —
the badge is `'✓'` or the literal string `'CHECKPOINT'`, with no partial state.
The **diamond progress ring does not exist at all**: `.mk`, `getTotalLength()`
and the dash-array technique appear in `styleguide.html` and nowhere in
`styles.css` or `render.js`.

Mockup 07 also notes one knock-on: **the rail widens from 28px to 32px** to clear
the ring stroke, which shifts every step card 4px right.

### B. Path context — the original phase 4 scope

1. **`getPathContext()` returns no stage.** It gives `step`/`total` against the
   flat 41-lesson list, which is why the UI can only say "step 8 of 41". Stage
   name and position-within-stage are what the contextual row and stepper need.
2. **Build the stage stepper** — option B from
   `docs/design/mockups/10-path-context-in-topic-1.html`.
3. **Retire `renderPathBanner`'s top action and second progress bar.**

### C. Suggested order

A2 first — it is the smallest, it is fully specified, and it is the one visible
today as a bug. Then A1, which is a self-contained swap of glow for edge. Then B,
since the stepper wants the stage data. A3 last: it is the only genuinely new
build, and the 4px rail shift is easier to judge once everything around it has
settled.

### D. Open question for William

Mockup 06's checkpoint-card options were *"shown in its open state (not started,
not complete)"*, so K2 was chosen without a view of its completed form. Applying
mockup 05's retreat principle, a completed checkpoint should lose the 3px oxblood
left edge and drop to a plain hairline. That is inference, not something
approved — confirm before building A2.

---

### Standing checks for any CSS work

All three have caught real bugs. Run before shipping.

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

**Out-of-scope `${color}`** — after changing any function signature, confirm no
function body references a variable it no longer receives. `node --check` will
not catch it; it is valid syntax and a runtime `ReferenceError`.

### Open questions carried forward

- **Dashboard density.** The converged Home reads quieter than the old one.
  Deliberately not adjusted. **Revisit after phase 6.**
- **Path button press effect.** `.path-btn-mark` / `.path-btn-next` keep a chunky
  `0 3px 0` solid-offset shadow. Now the least converged thing left visually.
  Flatten onto the elevation scale, or keep as a deliberate affordance? Worth
  deciding alongside A1, since both are about how a primary path action is
  emphasised.
- **Landscape stepper.** Header + contextual + stepper + bar ≈ 160px of chrome on
  a 390px-tall viewport. Candidate fix: hide the stepper under
  `(max-height: 450px)`. Needs a real device; the stepper doesn't exist until
  phase 4 lands.
- **Quiz direction-toggle labels** (`漢→EN` / `EN→漢` / `🔊→EN`, where 漢 (hon3)
  means Chinese) inherited unchanged — compact but cryptic, and permanently above
  every question.
- **`.cp-optional`.** A full sentence styled as a green chip with a 🔓 emoji.
  Green reads as *done* per §4, but the content is informational. Pulled from the
  phase 3 migration deliberately; needs its own small decision.
