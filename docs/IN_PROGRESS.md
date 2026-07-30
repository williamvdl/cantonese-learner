# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-07-30 · sw.js at v112

## Nothing actively in progress

Phase 4 shipped across v108–v112 and is folded into STATUS.md. Every approved
design decision is now built — `DESIGN_DECISIONS.md` has no *Not built* rows left
except the two belonging to phase 5.

QA on phase 4 was an initial pass rather than exhaustive, by choice: the app is
being used organically from here, and anything the rollout left will surface that
way. Findings go to BACKLOG.md.

### Remaining rollout

Deploys are **not** numbered in advance — see STATUS.md § Deploy labelling. A phase
records its deploys ordinally with the reason they group, and the `sw.js` number is
assigned when each is cut.

| Phase | Scope | Notes |
|---|---|---|
| ~~1~~ | ~~Tokens.~~ | ~~v95~~ · done 2026-07-25 |
| ~~2~~ | ~~Convergence.~~ | ~~v96–v103~~ · done 2026-07-28 |
| ~~3~~ | ~~Primitive adoption.~~ | ~~v104–v107~~ · done 2026-07-29 |
| ~~4~~ | ~~The unbuilt path decisions, path context, diamond progress.~~ | ~~v108–v112~~ · done 2026-07-30 |
| **5** | **Docked action bar.** Tab suppression and the active-quiz-question exception. | Builds DES-12, via MOCK-11-bar and MOCK-12-quizbar. `--bar-h` is declared and unused, waiting for it. **Settle first:** the continuation card (MOCK-10-cont) now occupies the foot of a lesson, so decide how it and the bar relate before building — DES-12 forbids two competing "what now" zones just as firmly as it forbids bar-plus-tabs. |
| 6 | **Nav.** Tab bar replacing `renderDrawer()`, settings sheet behind the cog, nameplate-as-home. | Needs `pushNav()` care so tab switches behave with browser back. Keep the `activeNav` resolution logic. Rename `state.homeView` → `state.topicsView` here. **MOCK-13 has two panel options and no record of which was chosen — settle before starting.** Retires `.hamburger` and `.drawer-speed-btn`, the two remaining sub-44px controls waiting on it. |

**Read before starting either:** `DESIGN_SYSTEM.md` §2 for the primitives and
§3.9–3.10 for the nav rules, and `DESIGN_DECISIONS.md` for what is already settled.

---

## Standing checks for any CSS work

All five have caught real bugs. Run before shipping. Baseline verified clean at
v112 on 2026-07-30.

**1 · Duplicate declarations inside one rule** — this is how `.word-card` acquired
a near-black border:

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

**This check only looks inside a single rule.** The same selector can also appear
twice in the *file* at equal specificity, where the later one silently wins — which
happened to `.cp-done .cp-card .path-step-title` in v108. When a change appears not
to take effect, grep for the selector across the whole file before anything else.

**2 · Controls under the tap minimum.** The previous version of this check read only
`min-height`, so a target built from padding was invisible to it — which is how the
stage stepper shipped at 42px and reported clean. This version also flags declared
heights and padding-built targets:

```python
import re
s = open('styles.css', encoding='utf-8').read()
for m in re.finditer(r'\n\s*([^{}\n]+)\{([^{}]*)\}', s):
    sel, body = m.group(1).strip(), m.group(2)
    if 'cursor' not in body:
        continue
    mh = re.search(r'min-height:\s*(\d+)px', body)
    if mh:
        if int(mh.group(1)) < 44:
            print(f'{sel}: min-height {mh.group(1)}px')
        continue
    if 'var(--tap-min)' in body:
        continue
    h = re.search(r'(?<!min-)(?<!max-)height:\s*(\d+)px', body)
    pad = re.search(r'padding:\s*(\d+)px', body)
    if h and int(h.group(1)) < 44:
        print(f'{sel}: height {h.group(1)}px, no tap-min')
    elif pad and not h:
        print(f'{sel}: padding-built target ({pad.group(1)}px each side) — VERIFY')
```
Expected: three `min-height` misses (`.hamburger`, `.drawer-speed-btn`,
`.subtab-btn`), two declared-height misses (`.path-complete-btn` at 28px and
`.translate-dir-swap` at 38px), and around fourteen padding-built targets to judge
individually. All are logged in BACKLOG.md; **the list should not grow.**

The lesson generalises: declare `min-height: var(--tap-min)` explicitly even where
padding would already reach 44px, so the check can see it.

**3 · Undeclared token references** — `.cp-missed-c` once referenced `--font-cjk`,
which never existed, so it silently fell back to a generic serif:

```python
import re
s = open('styles.css', encoding='utf-8').read()
declared = set(re.findall(r'(--[a-z0-9-]+)\s*:', s))
used = set(re.findall(r'var\((--[a-z0-9-]+)', s))
print(sorted(used - declared))
```
Expected output: `['--token']` only — that one is inside a comment.

**4 · Out-of-scope identifiers.** After changing any function signature, confirm no
function body references a variable it does not receive *or does not have in that
scope*. `node --check` catches neither; both are valid syntax and a runtime
`ReferenceError`. This has bitten three times now — `renderQuiz` and
`renderRoundSelector` in phase 2 (a dead `${color}`), and `renderCheckpointHub` in
v112, which referenced `cp` where the function destructures `cpId`.

**5 · Run the render functions.** Reading them is not enough. A short Node harness
that pulls a function's source out of `render.js`, stubs its globals and calls it
against the real `data/learning_paths.json` caught three defects in phase 4 that all
four checks above passed: the out-of-scope `cp`, a forward node numbering by
whole-path instead of stage position, and a component class overriding a primitive
modifier. Worth rebuilding for any non-trivial render change — and worth pointing at
the awkward data, particularly the Intermediate path's `numbers` topic, which sits
in `path.lessons` but in no stage.

**And after any data change:** `node tools/validate.js`.

---

## Open questions carried forward

All are also in `DESIGN_DECISIONS.md` § Open or BACKLOG.md. These are the ones
phase 4 left directly.

- **Row-type icons on the path timeline.** Now judgeable — deferred until MOCK-06-C
  and MOCK-07-Asoft landed, and they have. Does a lesson row want a `bookOpen`
  glyph and a checkpoint the diamond, or does the rail carry enough weight already?
- **Landscape stepper.** More chrome than when this was raised: the stepper is 28px
  rather than 20px and now appears on the checkpoint hub as well as in topics.
  Candidate is hiding it under `(max-height: 450px)`. Needs a real device.
- **The checkpoint hub's back target.** Labelled with the stage name and routed
  through `history.back()`, which is what that button already did. Reaching the hub
  from a topic's stepper diamond therefore lands back on that topic rather than the
  timeline — inside the same stage either way. Making it deterministic would put the
  on-screen back and the hardware back out of step, so it was left alone.
- **`.cp-optional`.** A full sentence styled as a green chip with a 🔓 emoji. Green
  reads as *done* per §4 but the content is informational. Pulled from the phase 3
  migration deliberately; still needs its own small decision.
- **Quiz direction-toggle labels** (`漢→EN` / `EN→漢` / `🔊→EN`, where 漢 (hon3)
  means Chinese) inherited unchanged — compact but cryptic, and permanently above
  every question.
- **Dashboard density.** The converged Home reads quieter than its predecessor.
  Deliberately not adjusted. **Revisit after phase 6.**
