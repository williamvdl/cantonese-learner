# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-08-09 · sw.js at v126

## Nothing in progress

**The design-system rollout is complete and this file is cleared down.** Phases 1–6
ran from v95 to v120; phase 6's last work item, the `state.homeView` →
`state.topicsView` rename, shipped at v119, and the dead-CSS sweep followed at
v120. Every approved decision in `DESIGN_DECISIONS.md` is built and no *Not built*
rows remain. The phase-by-phase record now lives in STATUS.md, which is where it
belongs — this file kept a running phase 6 narrative alongside it for six deploys,
and by the end the two disagreed.

v121 shipped after this file was cleared and does not reopen it. It carried two
bodies of work in a single deploy — a convergence pass off device QA (mockup 21,
DES-23 to DES-27) and the tier ladder (mockups 22–24, DES-28 to DES-30), the
latter also closing a live defect where a tier change wrote completion to the
wrong lesson. Both are folded into STATUS.md and DESIGN_DECISIONS.md.
**`tools/tier-harness.js` joins the standing checks** — it asserts the data
invariant the ladder rests on, not just the rendering. The one item still
deliberately parked is the 41 cross-rule duplicate declarations, which want a
script before a sweep; it is in BACKLOG.md.

> **Two work packages, one version number.** The convergence pass was built and
> delivered first and was labelled v121 at the time, but it was never deployed, so
> a second number would have recorded a release that never existed. Numbers track
> **deploys**, not delivery turns.

**v122 to v126 shipped after this file was cleared and do not reopen it.**
v125 closed the last two device-QA issues from mockups 25 and 26 (DES-33 to
DES-36), and v126 swept DES-33's rule across the three further controls that
still broke it. That closes the whole eleven-issue QA batch. Nothing is in
progress. All
three came from a device QA pass rather than a plan: v122 carried six defect
fixes with no design decisions, v123 migrated TTS from Google to Azure and
regenerated all 1,376 audio files, and v124 was the emoji sweep (DES-31, DES-32).
All three are folded into STATUS.md, and the two new decisions into
DESIGN_DECISIONS.md.

> **Three deploys, three version numbers — and that is correct.** The rule is one
> number per *deploy*, not per delivery turn. These were deployed separately and
> each cleared a service-worker cache on its own, so collapsing them would have
> recorded two releases that never existed. Compare v121, where two work packages
> shared one number because they went out together.

`tools/tts-probe.js` was added at v123 and is deliberately **not** a ninth
standing check. It answers a question — which voices a provider offers and how
they handle a given sound — rather than asserting an invariant, and there is
nothing for it to regress against between runs. It is recorded in BACKLOG.md so
it is found rather than rewritten.

Everything not yet done is unsequenced in BACKLOG.md. The standing checks below are
permanent and stay here regardless of what is in progress.

> **Cleared 2026-08-01 after a full doc-vs-code audit.** The audit ran every
> standing check against a fresh clone rather than trusting their recorded
> expectations, and the recorded expectations were the thing that had drifted. What
> the file said before this rewrite is worth one line as a warning: it carried the
> heading *"Phase 6 under way"* nine lines above the sentence *"Phase 6 is
> complete."* A short-lived file that is not actually cleared becomes the least
> trustworthy document in the set, because it is the one written in the present
> tense.

## What the audit changed

No code changed. The corrections were to the documents, and they clustered in one
shape: **a forward-looking sentence that was true when written and was never
revisited.** DESIGN_SYSTEM.md described the tab bar as not yet built (v117),
`.tabs--top` as phase 6 work (v117), MOCK-11-bar as unbuilt (v118) and the
`renderHomeScreen()` rename as scheduled for phase 3 (v105). STATUS.md and
BACKLOG.md both still listed `.hamburger` and `.drawer-speed-btn` as live sub-44px
controls (v117). DESIGN_DECISIONS.md's Open table still showed the settings sheet
as needing a mockup and blocking phase 6 (v117).

None of these were wrong when written and none was caught by any check, because no
check reads prose. The one durable safeguard is the rule the register already
states: **update the row in the session the thing ships, not at the end of the
phase.** Everything corrected here was written by a session that shipped a deploy
and updated only the deploy table.

The audit also found the first thing in this project that is genuinely code rather
than documentation: two dead `state.speed` writers in `render.js`. See BACKLOG.md.

---

## Standing checks for any CSS work

There are seven. Checks 1–5 below are run by hand; 6 and 7 are scripts.

**6 · `tools/nav-harness.js`** executes `goToDestination()` across 26 navigation
scenarios. It has caught two real bugs in two deploys, and it is the only check
that tests *behaviour* rather than declarations — this part of the app fails by
transition, not by syntax. `tools/snapshot-harness.js` sits alongside it and
covers `migrateNavSnapshot()`.

**7 · `tools/dead-css.js`** (added v120) enumerates every class declared in
`styles.css` and reports any with no emitter in the JS. It exists because two
retirement passes driven by remembered names each missed about a third of their
target. Expected output is the two known interpolation artefacts
(`bubble--correct`, `bubble--wrong`) and nothing else; it exits non-zero on
anything unexpected.

> **Check 7's blind spot, found 2026-08-01.** It reads *declared classes*, so it
> catches CSS with no JS and is structurally incapable of catching JS with no CSS
> — a handler bound to a selector nothing emits. Two of those are live in
> `render.js` right now (see BACKLOG.md). Growing the tool in that direction, or
> writing a sibling, is a backlog item. Until then, check 7 passing does not mean
> the dead code is gone; it means the dead *CSS* is gone.

**8 · `tools/tier-harness.js`** (added v121) lifts `pathOwningTier()`,
`getTierLadder()`, `renderTierLine()` and `renderTierXref()` out of `app.js` and
`render.js` **by name rather than by copy**, so it cannot drift from what ships,
and runs them against the real data files. It checks two different things. First
the **data invariant** the ladder rests on: every `(topic, tier)` pair must belong
to exactly one path, and no topic may appear twice in one path. Nothing in the app
enforces that — it is a property of how the path files happen to be authored, and
breaking it would not fail any other check; the cross-reference would simply name
the wrong path. Second the **rendering** across every state, including a
**simulated three-tier topic**, because none exists yet and the middle rung is the
state the design was chosen for. Run it after any change to `data/learning_paths.json`
or `data/topics_index.json`, not just after touching the tier code.

**Re-verified at v124, 2026-08-07** — unchanged from the v121 baseline below,
which is the point: the emoji sweep touched 33 call sites and two CSS rules and
moved none of these figures. `dead-css.js` still reports 436 declared classes
because `.result-emoji` and `.review-empty-emoji` left as `.result-mark` and
`.result-mark--good` arrived. Check 2's delta against `git show HEAD:styles.css`
is zero.

**Baseline re-verified at v121, 2026-08-02.** All eight pass:
check 1 clean, check 2 gives **zero** `min-height` misses, two declared-height
misses and **11** padding-built targets, check 3 gives `['--token']` only,
`dead-css.js` reports **436** declared classes with only the two known artefacts,
`tier-harness.js` reports 0 unowned and 0 multiply-owned tier pairs, and
`validate.js`, `nav-harness.js` and `snapshot-harness.js` all pass.

> **Every figure in the previous version of this paragraph was stale**, and it is
> worth seeing how: it cited a v117 baseline three deploys after v117, announced
> check 1 clean "for the first time" as though that were news, and gave the
> padding-built count as 12 here and 15 four paragraphs below. This is the decay
> that check 2's own footnote warns about, in the document that contains the
> footnote. **Run the checks; do not read their expected outputs.** The delta
> against `git show HEAD:styles.css` is the part that holds its value.

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
Expected output: **nothing**. `.nav-item`'s duplicate `transition` was the last
known offender and went with the drawer at v117.

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
Expected as at v120: **no** `min-height` misses, two declared-height misses
(`.path-complete-btn` at 28px, `.translate-dir-swap` at 38px) and 11
padding-built targets to judge individually. Both misses are logged in
BACKLOG.md; **the list should not grow.** `.subtab-btn` left it at v114 with the
subtab rebuild, and `.hamburger` and `.drawer-speed-btn` at v117 with the drawer —
in both cases the tap-target fix came free with a design change rather than
needing its own deploy, which is the argument for fixing the remaining two the
same way rather than in isolation.

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

**And after any data change:** `node tools/validate.js`, plus
`node tools/tier-harness.js` if the change touched paths or topic tiers.

---

## Open questions

**None here — they live in BACKLOG.md and `DESIGN_DECISIONS.md` § Open.** This
file used to keep a third copy under *"Open questions carried forward"*, and two of
its eight entries existed in no other document: the checkpoint hub's back target
and the mark-complete auto-return. Both are now in BACKLOG.md. A short-lived file
is the wrong home for a long-lived question, and the duplication is how the two
came to be held only by the file meant to be emptied.
