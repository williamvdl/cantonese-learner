# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-07-28 · sw.js at v103

## Design system rollout — phases 1 and 2 done, phase 3 next

Phase 2 shipped across v96–v103 and is folded into STATUS.md. The app now
renders entirely from the token and primitive layers; no colour is injected from
JavaScript anywhere.

### Remaining rollout

| Phase | Scope | sw.js | Notes |
|---|---|---|---|
| ~~1~~ | ~~Tokens.~~ | ~~v95~~ | Done 2026-07-25 |
| ~~2~~ | ~~Convergence.~~ | ~~v96–v103~~ | Done 2026-07-28 |
| **3** | **`render.js` builders.** Shared `card()` / `pill()` / `node()` / `btn()`; route the 33 render functions through them. | v104 | The phase that stops re-drift. Worth `xhigh` effort. |
| **4** | **Path context.** Add stage name + position-within-stage to `getPathContext()`. Build the stage stepper. Retire `renderPathBanner`'s top action and second progress bar. | v105 | Run `node tools/validate.js` after — touches path data reads. |
| **5** | **Docked action bar.** Including tab suppression and the active-quiz-question exception. | v106 | |
| **6** | **Nav.** Tab bar replacing `renderDrawer()`, settings sheet behind the cog, nameplate-as-home. | v107 | Needs `pushNav()` care so tab switches behave with browser back. Keep the `activeNav` resolution logic. |

Phase 3 is pure refactor with no behaviour change — verify by comparing
screenshots before and after. Phases 4–6 change behaviour and want real use
between them.

### Phase 3 — what changed about its premise

The original plan assumed builders would be inventing markup conventions as they
went. They no longer need to: **phase 2e introduced a real CSS primitive layer**
(`.card` + modifiers, `.list` / `.list-row`, `.section-label`, `.eyebrow`,
`.track`, `.btn` + modifiers, `.btn-icon`, `.wm`), and every screen already emits
those classes by hand. Phase 3 is therefore narrower and safer than it looked:
the builders wrap class strings that already exist and are already correct.

Concretely, phase 3 should:

1. Add `card()`, `btn()`, `pill()`, `node()`, `sectionLabel()`, `track()` to
   `render.js`, emitting exactly the primitive classes in DESIGN_SYSTEM §2.
2. Route the 33 render functions through them, screen by screen — same sequence
   that worked for phase 2 (dashboard → quiz core → topic → conversation → path
   and checkpoint → header and topics).
3. **Rename `renderHomeScreen()` → `renderTopicsScreen()`.** It renders the
   Topics destination, not Home; `renderDashboard()` is Home. This naming trap is
   what caused DESIGN_SYSTEM §3.6 to grant its emoji exception to the wrong
   screen for three months. Rename `.home-wrap` → `.topics-wrap` with it.
4. Keep the variant mechanism intact: checkpoint chrome is `.quiz-ms` /
   `.cp-convo` on a wrapper, never a colour or variant argument threaded through
   a render function.

### Standing checks for any CSS work

Both of these caught real bugs during phase 2. Run before shipping.

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

**Out-of-scope `${color}`** — after changing any function signature, confirm no
function body references a variable it no longer receives. `node --check` will
not catch it; it is valid syntax and a runtime `ReferenceError`.

### Open questions

- **Dashboard density.** The converged Home reads quieter than the old one.
  Deliberately not adjusted — it is the only fully converged screen in a
  half-converged app, so the comparison is unfair until the rollout finishes.
  **Revisit after phase 6.**
- **Path button press effect.** `.path-btn-mark` / `.path-btn-next` keep a chunky
  `0 3px 0` solid-offset shadow. Colours are tokenised; geometry untouched. It is
  now the least converged thing left visually. Flatten to the elevation scale, or
  keep as a deliberate primary-action affordance?
- **`styleguide.html` is behind the code.** It documents the primitives correctly
  but predates the dashboard entry, the `站 (zaam6)` watermark rule, and the
  `.quiz-ms` / `.cp-convo` variant mechanism. DESIGN_SYSTEM §"How to use this"
  requires it to move in the same commit — it did not. Bring it up to date during
  phase 3.
- **Landscape stepper.** Header + contextual + stepper + bar ≈ 160px of chrome on
  a 390px-tall viewport. Candidate fix: hide the stepper under `(max-height: 450px)`.
  Needs a real device; blocked until phases 4–5 exist.
- **Quiz direction-toggle labels** (`漢→EN` / `EN→漢` / `🔊→EN` (hon3 = Chinese)) inherited unchanged —
  compact but cryptic, and permanently above every question.

### Repo housekeeping found during phase 2

- **`DESIGN_SYSTEM.md` is not in the repo.** It exists only in the project
  knowledge base, which means the repo's sole design-system artefact is
  `styleguide.html`. Commit it alongside.
- **`styleguide.html` lives at the repo root**, not `docs/design/` — commit
  `b3ed814` deleted the duplicate. The "two copies" question is closed. Note that
  the copy in project knowledge went stale (missing `--tabbar-h`); re-upload from
  the repo.
- **Mockup files `03-`–`13-*.html` are still not in the repo.** `14-dashboard.html`
  is new from this session and should land with them under `docs/design/`.
