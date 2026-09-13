# Proposal — folding orthographic variants in speech matching

**Status: DEFERRED — considered 2026-09-05, not approved, not rejected.**
Watched organically rather than probed; see the revision note below for the
counter-evidence that halved it. Tracked from `BACKLOG.md` under Quality.
Do not re-derive this from the probe data — that is what this file prevents.
**Written against:** v139 · still accurate at v144

> ### Revision note — 2026-09-05, added after counter-evidence
>
> William produced two screenshots of the live Learn sentence sheet in which the
> recogniser returned **嘅 (ge3) correctly**, on 呢個係我嘅 (ni1 go3 hai6 ngo5 ge3) and 佢係我嘅朋友 (keoi5 hai6 ngo5 ge3 pang4 jau5) —
> the second containing the exact collocation 我嘅朋友 (ngo5 ge3 pang4 jau5) that came back as 我的朋友 (ngo5 dik1 pang4 jau5)
> in probe item tp-24. The app displays the raw recogniser output with no
> correction applied (`render.js` line 109 renders `sp.heard` verbatim), so this
> is genuine counter-evidence and not a display artefact.
>
> **This materially weakens §3's 的 (dik1) → 嘅 (ge3) entry and the recommendation in §5.1.**
> The behaviour is now known to be intermittent rather than systematic: the same
> phrase decodes both ways in different sessions. A fold is a permanent
> concession of detection; justifying one with intermittent behaviour is a worse
> trade than the one argued below, because the false rejection it prevents is
> itself intermittent.
>
> The 係 (hai6) → 喺 (hai2) entry is **not** affected. The screenshots have 係 (hai6) as the target,
> correctly heard, which is consistent with rather than contrary to the probe.
>
> The original text below is left unedited. §3 should now be read as proposing
> **係 (hai6) → 喺 (hai2) only**, with 的 (dik1) → 嘅 (ge3) demoted to the §2 watch list alongside 都 (dou1) → 度 (dou6)
> pending evidence that the behaviour is stable.
**Decides:** whether `normalizeChinese()` should treat a small set of character
pairs as equal when comparing what the learner said to the target.

> If approved this becomes a `DES-49` row in `DESIGN_DECISIONS.md` (the display
> half is UX) plus a note in `STATUS.md`. If declined, this file is deleted and
> a line goes in `BACKLOG.md` recording that it was considered and rejected, so
> it does not get re-proposed from scratch in six months.

---

## 1. The problem, in one paragraph

Android's speech recogniser sometimes transcribes a spoken Cantonese word using
the standard written-Chinese character rather than the colloquial Cantonese one.
You say 嘅 (ge3); it writes 的 (dik1). You say 喺 (hai2); it writes 係 (hai6).
The word is right, the pronunciation is right, only the character on screen
differs. `normalizeChinese()` folds digits and strips punctuation but knows
nothing about these pairs, so each one is counted as a character you got wrong.

## 2. Evidence

From the Translate false-reject probe run on 2026-09-04 (30 targets, Pixel,
v139). Every substitution the recogniser produced, derived by running the
shipped `alignChars()` over each attempt rather than by reading the transcripts:

| Heard → target | Times | Same sound? | Reading |
|---|---|---|---|
| 的 (dik1) → 嘅 (ge3) | 2 | **No** | orthographic variant |
| 係 (hai6) → 喺 (hai2) | 2 | Yes, different tone | orthographic variant |
| 都 (dou1) → 度 (dou6) | 1 | Yes, different tone | possible variant — watch |
| 咩 (me1) → 未 (mei6) | 1 | Near | genuine mishearing |
| 阿 (aa3) → 嗌 (aai3) | 1 | Near | genuine mishearing |
| 為 (wai6) → 壞 (waai6) | 1 | Near | genuine mishearing |
| 晚 (maan5) → 慢 (maan6) | 1 | Yes, different tone | genuine mishearing |
| 支 (zi1) → 遮 (ze1) | 1 | Near | genuine mishearing |
| 我 (ngo5) → 你 (nei5) | 1 | No | genuine mishearing |
| 想 (soeng2) → 上 (soeng5) | 1 | Yes, different tone | genuine mishearing |
| 知 (zi1) → 次 (ci3) | 1 | Near | genuine mishearing |

Only two pairs recur, and they are the two where the recogniser is choosing a
different *spelling* of the same spoken word rather than hearing a different
word. Everything else is a one-off genuine mis-hear.

**What it cost.** On tp-20 我嘅電話壞咗 (ngo5 ge3 din6 waa2 waai6 zo2) the
recogniser returned 我的電話為咗 (ngo5 dik1 din6 waa2 wai6 zo2). Two edits against an allowance of one, so:
rejected. One of those two edits was 的 (dik1)/嘅 (ge3) — not a mistake at all. On tp-24
我嘅朋友聽朝喺機場嚟 (ngo5 ge3 pang4 jau5 ting1 ziu1 hai2 gei1 coeng4 lai4) the recogniser produced *both* variants, consuming the
entire edit allowance; it passed only because a ten-character sentence buys two
edits, leaving no room for a genuine error anywhere else in the sentence.

That is the real cost, and it is bigger than the one flipped verdict: the fold
does not just rescue rejected attempts, it stops variants **eating the allowance
that genuine leniency is supposed to provide.**

### Sightings after the probe — 2026-09-11

The probe ran on 30 Translate targets. **It was never the whole corpus**, and the
first sighting from ordinary use is a pair the table above does not contain.

| Heard → target | Times | Same sound? | Reading | Where |
|---|---|---|---|---|
| 架 (gaa3) → 㗎 (gaa3) | 1 | **Yes, same tone** | orthographic variant — watch | Learn sentence sheet, 嗰隻狗係邊個㗎？ (go2 zek3 gau2 hai6 bin1 go3 gaa3?), Pixel, v143 |

Six of seven characters matched and the attempt scored as close, so nothing was
rejected — but the substitution is the cleanest example in this file of the
shape the fold exists for: **identical syllable, identical tone, different
character**, with no phonetic difference for the recogniser to have got wrong.
The 的 (dik1)/嘅 (ge3) pair is not even that — those differ in sound.

**Its corpus exposure is larger than anything in the probe table.** 㗎 (gaa3)
appears **119 times** across `data/`, and 架 (gaa3) appears **zero** times, so
every one of those 119 lines can take this substitution and none can produce it
legitimately. Counted with `grep -ro` over `data/`, not estimated.

> **Resolved 2026-09-11, and not by this proposal.** 㗎 (gaa3) was already in
> `SPEAK_FINAL_PARTICLES`, the sentence-final particle rule inside
> `fuzzyMatch()`; 架 (gaa3) simply was not in the list. Adding one character to
> that set closes it (DES-53, v144). **The entry below is left standing because
> the mistake in it is instructive**: the sighting was filed here on the strength
> of its shape — two characters, same sound, one substituted for the other —
> without checking whether an existing mechanism already covered that shape. It
> did. Before adding a pair to this file, check `SPEAK_FINAL_PARTICLES` first;
> anything sentence-final probably belongs there instead, and a fold in
> `normalizeChinese()` is the heavier instrument of the two because it applies
> everywhere rather than to one slot.

**It stays on the watch list, and one sighting is the reason.** The same bar that
demoted 的 (dik1) → 嘅 (ge3) applies here: the counter-evidence that halved this
proposal was the discovery that a substitution seen twice in a probe decoded
correctly in ordinary use, and a fold justified by intermittent behaviour is a
worse trade than the false rejection it prevents. One sighting on one sentence
cannot distinguish systematic from intermittent. **What would move it:** the same
substitution on a *different* sentence, which is what makes it a property of the
character rather than of one recording.

## 3. The proposal

Fold exactly two pairs, in `normalizeChinese()`, applied to both sides of the
comparison:

    的 (dik1) → 嘅 (ge3)
    係 (hai6) → 喺 (hai2)

Nothing else. 都 (dou1)/度 (dou6) is on the watch list with one observation and
is **not** included — one occurrence is not evidence, and see §6. 架 (gaa3)/㗎 (gaa3)
was briefly listed here and has been handled by `SPEAK_FINAL_PARTICLES` instead;
see the sightings section above.

## 4. What changes, measured

Re-running the probe's 29 decodable attempts through the shipped `fuzzyMatch()`
with and without the fold:

- **1 verdict changes**: tp-20 flips from rejected to accepted.
- **0 verdicts change in the other direction.** Folding can only reduce edit
  distance, so it can only ever turn a rejection into an acceptance. It can
  never cause a correct answer to be rejected.

One flip in 29 sounds small. It is small *in this sample* — the sample contained
one short sentence where a variant landed on a tight allowance. The frequency
depends entirely on how often the target contains 嘅 (ge3) or 喺 (hai2), which in colloquial
Cantonese is very often.

## 5. The case against — read this before approving

**5.1 The 的 (dik1)/嘅 (ge3) fold masks a real learner error.** These are not homophones.
dik1 and ge3 are completely different sounds. A learner reading 嘅 (ge3) and saying
"dik1" has made exactly the Mandarin-interference mistake this app exists to
correct, and after this change the app will tick it.

The counter-argument is that we cannot see that error anyway. The transcript
said 的 (dik1) when you had said ge3 correctly, so the character on screen does not tell
us which sound was produced. We would be trading a detection we do not reliably
have for a false rejection we demonstrably do have. **That is a judgement call,
not a fact, and it is the crux of this proposal.**

**5.2 The 係 (hai6)/喺 (hai2) fold makes two different words compare equal.** hai6 "to be" and
hai2 "at/in" are distinct words, and confusing them is a normal learner error.
After this change the app stops noticing. Mitigating: prior work established
that wrong Cantonese tones usually snap back to the correct word in the
recogniser output, so this detection was largely notional already.

**5.3 It is a list, and lists grow.** 佢 (keoi5)/他 (taa1), 冇 (mou5)/沒 (mut6), 唔 (m4)/不 (bat1), 哋 (dei6)/們 (mun4), 嗰 (go2)/那 (naa5) are all
plausible next entries, and each one is another place a wrong answer earns a
tick. The discipline proposed is: **a pair goes in only with two or more
observed occurrences in probe data, recorded in this table with its evidence.**
No pair is added because it seems reasonable.

**5.4 It touches every speak surface**, not just the proposed Translate feature:
the Learn sentence sheet, Chat speak mode, and the checkpoint sentence review
all share `normalizeChinese()`. That is mostly the point — the bug is affecting
them today — but it means the blast radius is the whole app, and all three need
QA rather than one screen.

**5.5 Doing nothing is a real option.** The false-reject rate is currently
unmeasured, not known-bad. If the eventual answer is to ship the ungraded
"here's what I heard" panel with no pass or fail at all, the matcher's leniency
stops mattering for the new feature — though it would still matter for the three
existing surfaces.

## 6. The display question — this is not just a matching change

`renderSpeakBreakdown()` builds the per-character grid by comparing the raw
heard text to the target. If the fold is applied only where the verdict is
decided, the learner sees **"matched" at the top and a red 嘅 (ge3) in the grid
below** — a visible self-contradiction, worse than either verdict alone.

Three ways to resolve it, and one must be chosen as part of approving this:

- **D1 — fold in the breakdown too.** The character shows a tick. Simplest and
  consistent. Cost: the learner is never told the recogniser wrote something
  different, which is arguably information they might want.
- **D2 — mark it as a distinct third state**, neither tick nor cross: the
  character shows a tick with the heard variant in muted text beneath. Honest
  and informative. Cost: a new visual state in the design system, and a concept
  the learner has to understand.
- **D3 — rewrite the heard text before display**, so 的 (dik1) is shown as 嘅 (ge3)
  throughout. Fully consistent. Cost: the app shows the learner a character the
  recogniser did not produce, which is a small lie and the sort of thing that
  becomes confusing when someone screenshots it.

**Recommended: D1.** D2 is more honest but spends a new design-system state on a
distinction that only matters to someone debugging the recogniser, which is me,
not the learner. D3 is the one to avoid — showing text that was never produced
will eventually mislead.

## 7. Scope of work if approved

- `normalizeChinese()` in `app.js` — a two-entry fold, alongside the existing
  digit folding, with the evidence table referenced in a comment.
- `renderSpeakBreakdown()` — apply the same fold so §6 cannot arise.
- `docs/DESIGN_DECISIONS.md` — DES-49 row covering the display choice.
- `docs/STATUS.md` — the change, plus a *notes worth carrying forward* entry for
  the pattern: *a normalisation used for both the verdict and the display must
  be applied to both, or they contradict each other on screen.*
- `sw.js` version bump — `app.js` is a cached shell asset.
- QA: Learn sentence sheet, Chat speak mode, checkpoint sentence review. All
  three share the changed code; none of them changed visually.

Half a session's work. The uncertainty is in §5, not in the build.

## 8. What is being asked

1. Approve or decline the fold in principle, having read §5.
2. If approved, choose D1, D2 or D3 from §6.
3. Confirm the two-observations rule in §5.3 for any future additions.
