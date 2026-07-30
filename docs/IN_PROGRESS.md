# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-07-30 · sw.js at v113

## Nothing actively in progress

Phase 5 shipped at v113 and is folded into STATUS.md. Phase 6 is the last phase of
the rollout and has not started.

`DESIGN_DECISIONS.md` has three *Not built* rows, all phase 6: MOCK-11-bar (docking
the completion action), MOCK-17-fill (the subtab treatment) and DES-18 (the nameplate
as a route home).

QA is organic from here rather than exhaustive, by choice — the app is being used and
anything the rollout left will surface that way. Findings go to BACKLOG.md. Phase 5's
own QA was done on device and passed.

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
| ~~5~~ | ~~Completion on the Quiz subtab (MOCK-11-matrix, MOCK-12-quizbar).~~ | ~~v113~~ · done 2026-07-30 |
| **6** | **The bottom edge, and the last of the chrome.** | The final phase. Named work items below — no A/B/C, which is what made the phase 4 brief unreadable. |

### Phase 6 — work items

Everything that touches the bottom edge of the viewport, plus the chrome that
depends on it. These are one phase because the open questions inside it answer each
other and nothing else: whether hiding the tabs feels like a dead end cannot be
judged without both the tabs and the bar, and the subtabs and the tab bar are meant
to be one primitive.

| ID | Item | Notes |
|---|---|---|
| P6-1 | **Subtab + tab bar primitive** (MOCK-17-fill) | Do this first. One primitive, two consumers: `--top` is the only difference. Building the subtabs alone would write the emphasis language twice. Retires `.subtab-btn`'s border, background, radius and solid-fill active state. Declare `min-height: var(--tap-min)` explicitly — mockup 04's own drawing computes to ~27px and would pass standing check 2 unseen. |
| P6-2 | **Tab bar replacing `renderDrawer()`** | Needs `pushNav()` care so tab switches behave with browser back. Keep the `activeNav` resolution logic. Retires `.hamburger` and `.drawer-speed-btn` — the two remaining sub-44px controls waiting on it. `.bottom-nav` / `.nav-btn` / `.placeholder-screen` already sit in `styles.css` with **zero call sites** — dead CSS from an earlier era; retire or reuse deliberately, don't inherit. |
| P6-3 | **Nameplate as a route home** (DES-18) | A handler plus a tap target; `renderHeader()` already renders the nameplate on every screen and it is inert. Structurally part of P6-2: with tabs hidden in a topic this is the only visible route to a top-level destination. |
| P6-4 | **Settings sheet behind the cog** | **Blocked:** MOCK-13's panel colour was never recorded (A parchment / B oxblood). Settle before starting. |
| P6-5 | **Docked bar, or not** (MOCK-11-bar) | The decision, then the build. The bar and the continuation card do the same job in two positions and only one can ship. Judge with the tab bar present, since DES-12's collision is the whole reason the bar has a suppression rule. `--bar-h` and `--tabbar-h` are declared and unused, waiting on this. Whichever wins also settles fill-versus-tint for the forward action. |
| P6-6 | **`state.homeView` → `state.topicsView`** | It sits in `NAV_FIELDS`, so the rename touches history snapshots. `renderTopicsScreen()` renders Topics; `renderDashboard()` is Home. Do it last — it is a pure rename and shouldn't be entangled with behaviour changes. |

**Judge after shipping, not before:** whether the hidden tab bar reads as a dead end.
The documented fallback is the ~34px icons-only strip (§3.10). Recorded as a
post-deploy judgement precisely because it has no answer on paper.

**Read before starting:** `DESIGN_SYSTEM.md` §2 for the primitives — including the
new Subtabs & tab bar entry — and §3.9–3.10 for the nav rules, plus
`DESIGN_DECISIONS.md` for what is already settled and what is approved-but-unbuilt.

---

## Standing checks for any CSS work

All five have caught real bugs. Run before shipping. Baseline verified clean at
v113 on 2026-07-30 — check 1 gives `.nav-item -> ['transition']` only, check 3 gives
`['--token']` only, and check 2 gives five declared misses plus 15 padding-built
targets.

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
`.translate-dir-swap` at 38px), and 15 padding-built targets to judge individually.
All are logged in BACKLOG.md; **the list should not grow.** Phase 6 clears three of
the five declared misses: `.subtab-btn` via P6-1, `.hamburger` and
`.drawer-speed-btn` via P6-2.

**Compare against the previous commit rather than against this list.** The
authoritative test is that the count did not *change* — run the check against
`git show HEAD:styles.css` as well as the working copy and diff the two. A remembered
expected figure drifts; the delta does not.

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
  **Related:** MOCK-17-fill keeps mockup 04's per-tab subtab glyphs, so phase 6 will
  settle a near-identical judgement one screen along. Worth deciding together.
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
- **"Got it — next" was left unchanged** when the correct-answer button became "Next
  question" in v113. Mockup 12 specified only the one relabel; "Got it" already marks
  it as an acknowledgement rather than a plain forward, and it shares a row with
  "Hear it again" that would wrap at 360px. Confirm or match.
- **The mark-complete auto-return is now gated on not being mid-question.** Marking
  the *final* lesson of a path complete auto-returns to the timeline after 3s; from
  the Quiz subtab that would have discarded a half-finished quiz. Added in v113
  because the change made that path newly reachable. Worth a look on device — it is
  a one-line revert.
- **Dashboard density.** The converged Home reads quieter than its predecessor.
  Deliberately not adjusted. **Revisit after phase 6.**
