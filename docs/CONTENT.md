# CONTENT — Tea House Cantonese Learner

*The register of the teaching corpus: what has been authored, how it is shaped,
and what is planned. Content only — the app that renders it lives in STATUS.md,
the visual rules in DESIGN_SYSTEM.md, the UX decisions in DESIGN_DECISIONS.md,
the tier-2 authoring rules in CONTENT_SPEC_TIER2.md.*

Last updated: 2026-08-10 · sw.js at v127 · inventory derived from
`node tools/content-report.js`

---

## 0. What belongs here, and what does not

This file exists because the corpus had no register. Content state was scattered
across BACKLOG.md (three items), STATUS.md (one line about the removed Patterns
slot), two session handover documents held outside the repo, and the data files
themselves — so *"is Intermediate half built or nearly done?"* could only be
answered by reading JSON and hoping the handovers were current. They were not.

| Question | Lives in |
|---|---|
| What words, sentences and conversations exist? | **Here** (§2) |
| What is the Intermediate path's full planned shape? | **Here** (§5) |
| How do I author a tier-2 round? | CONTENT_SPEC_TIER2.md |
| Is a feature built? Did a deploy ship? | STATUS.md |
| Was a visual/UX decision approved, and is it built? | DESIGN_DECISIONS.md |
| What does a component look like? | DESIGN_SYSTEM.md |
| Everything else not yet done | BACKLOG.md |

**BACKLOG.md keeps a one-line pointer per content item; the detail lives here.**
Detail in both is how the doc set drifted before.

**The numbers in §2 are generated, not typed.** `tools/content-report.js` prints
them and `--md` prints them as pasteable tables. Re-run and re-paste rather than
hand-editing a table, and update the date line above. A hand-maintained inventory
is stale the moment a word is authored, and a stale count reads as authoritative
— the exact failure the 2026-08-01 doc audit found in four places.

---

## 1. The content model

Five nouns, two of which share a name with something else in the codebase.

**Topic** — a themed vocabulary unit, one file at `data/topics/<key>.json`.
42 exist.

**Tier** — a difficulty level *within* a topic. **In the data this is a `round`;
in the UI and in every document since v121 it is a tier.** The rename never
reached the JSON keys or `state.currentRound`, so both words are live and mean
the same thing. Tier 1 is the beginner treatment; tier 2 revisits the topic with
harder vocabulary, longer sentences and a longer conversation — see
CONTENT_SPEC_TIER2.md for what "harder" means precisely.

**Lesson** — one (topic, tier) pair. This is what a learner opens and what
completion is recorded against. 52 exist.

**Stage** (learner-facing: *chapter*) — a themed group of 1–5 lessons ending in
a checkpoint. Declared in `learning_paths.json`. Intermediate stages are also
referred to as **I-1** … **I-6** in the plan (§5); `I-2` is `intermediate-s2`.

**Path** — an ordered curriculum: Beginner, Intermediate, Advanced. A path
declares both a flat `lessons` array (the timeline) and a `stages` array (the
grouping). **These are two descriptions of the same thing and nothing enforces
that they agree.**

> **Flat vs staged rendering.** A path with an empty `stages` array renders
> flat — every lesson in `lessons`, no checkpoints. As soon as one stage exists
> it renders **staged**, and *only lessons inside a stage are visible*. This is
> not a bug and it is the reason `numbers` (sou3 zi6) tier 2 is currently
> invisible (§4). It also means a stage must never be wired ahead of its
> content: there is no locked or coming-soon step state, so a stage pointing at
> content that does not exist renders a broken step.

### File layout

```
data/
  topics_index.json     42 entries: key, label, icon, which tiers exist, word counts
  categories.json       7 categories + a topic → category map (Topics screen grouping)
  learning_paths.json   3 paths, their stages, their checkpoints
  path_convos.json      15 checkpoint conversations
  topics/<key>.json     the corpus — words, sentences, per-tier conversation
  patterns.json         66 patterns, 150 drills — DORMANT, see §4
audio/
  words/ 585    sentences/ 307    convos/ 484
```

`topics_index.json` is a **hand-maintained summary** of the topic files, loaded
at boot so the Topics grid and the tier ladder render without fetching 42 files.
Derived data maintained by hand can disagree with its source, and it currently
does in four places (§4).

### Topic JSON schema

```
{ meta: {label, icon, color},
  _idSeq, _sidSeq,
  rounds: { "1": { note,
                   words:     [{id, c, j, e}],
                   sentences: [{sid, c, j, e, note?, bd:[{c,j,e}]}],
                   convo:     {title, speakers:[], lines:[{u, c, j, e, bd, opts?, optsJ?}]} } } }
```

- Word IDs `topickey-NNN`; sentence IDs `topickey-tROUND-sNN`; drill IDs
  `drill-NNN`. Mint with `tools/mint-ids.js` / `tools/mint-sentence-ids.js`.
  Never by hand, never reuse a retired ID.
- **User conversation turns (`u: true`) must carry `opts` and `optsJ`** — three
  strings each, first is canonical. Without them the Fill-the-Gap activity is
  hidden for that whole conversation.

---

## 2. What exists today

*Generated 2026-08-02 by `node tools/content-report.js --md`.*

### Corpus totals

| Measure | Count |
|---|---|
| Topics | 42 |
| Topic-tiers (a topic at one tier = one lesson) | 52 |
| Words | 585 |
| Sentences | 307 |
| Sentences with a teaching note | 246 (80%) |
| Sentences with a word breakdown | 307 (100%) |
| Topic conversations | 52 |
| Topic conversation lines | 339 |
| Checkpoint conversations | 15 |
| Checkpoint conversation lines | 145 |

> **585 words, not 600.** The project instructions record "600/600 words" from
> the ID-minting work. That is the count of `wid` references inside
> `patterns.json`'s 150 drills — 600 drill *items*, four per drill. The word
> corpus is 585, which is what the validator reports on its `ids assigned` line
> and what `audio/words/` holds. Two correct numbers about two different things.

### Paths

| Path | Stages | Lessons | Checkpoints | Checkpoint convos |
|---|---|---|---|---|
| Beginner | 11 | 41 | 11 | 11 |
| Intermediate | 4 | 11 | 4 | 4 |
| Advanced (shell only) | 0 | 0 | 0 | 0 |

**Beginner is complete.** 41 lessons across 11 stages, every stage with a
checkpoint and conversation, every topic at tier 1.

| Stage | Name | Topics |
|---|---|---|
| beginner-s1 | First Words | pronouns, greetings, yesno, numbers, phrases |
| beginner-s2 | Building Sentences | questions, particles, tense, time, classifiers |
| beginner-s3 | Food & Drink | food, meatseafood, fruitveg, drinks |
| beginner-s4 | Eating Out & Shopping | restaurant, cooking, shopping |
| beginner-s5 | Saying More | modals, adjectives, comparisons |
| beginner-s6 | Describing the World | colors, animals, weather |
| beginner-s7 | Me & My People | family, friends, feelings, body |
| beginner-s8 | Home & Surroundings | home, clothing, location |
| beginner-s9 | Out & About | directions, transport, attractions, hotels |
| beginner-s10 | Daily Life & Work | work, school, tech, money |
| beginner-s11 | Activity & Safety | hobbies, sports, emergencies |

**Intermediate is four chapters of six**, tracked against the plan in §5.

| Chapter | Stage | Name | Status |
|---|---|---|---|
| I-1 | intermediate-s1 | Connectives | ✅ Built |
| I-2 | *(unbuilt)* | Sentence Grammar | Not started — 4 lessons |
| I-3 | intermediate-s3 | Saying More | ✅ Built |
| I-4 | intermediate-s4 | Food, Dining & Shopping | ✅ Built |
| I-5 | intermediate-s5 | Me & My People | ✅ Built |
| I-6 | *(unbuilt)* | Out, Work & Safety | Not started — 3 lessons |

Ten of the seventeen planned v1 lessons are built: `connectives` at tier 1, plus
tier 2 of `greetings`, `feelings`, `body` (san1 tai2), `friends`, `food`,
`restaurant`, `shopping`, `modals` (mou4 taai3 dung6 ci4) and `comparisons`.
`numbers` (sou3 zi6) tier 2 exists but is pre-spec and unstaged (§4).

**Advanced is a shell** — `comingSoon: true`, a description committing to natural
register, idioms and family-context conversation, and an empty `lessons` array.

### Tier-2 spec compliance

Measured against CONTENT_SPEC_TIER2.md. Full per-target table in the script
output; the summary:

| Verdict | Rounds |
|---|---|
| **spec v2** — clean on all six countable targets | body, comparisons, feelings, food, friends, modals, restaurant, shopping (8) |
| **review** — one miss, likely the connective floor under-reporting | greetings (1) |
| **PRE-SPEC** — two or more misses | numbers (1) |

`greetings` misses only on connective density at 43% against a 50% target, and
that test is a substring match against a fixed list — it cannot see a two-clause
sentence built without one of those words. It wants a read, not a rewrite.

`numbers` (sou3 zi6) tier 2 misses on four of six: 5 sentences against 7–8,
averaging 5.8 characters against 8–16, no connectives, a 6-line conversation
against 8–10, and no notes at all. It is the last un-retrofitted survivor of the
six pre-spec tier-2 rounds.

### Note coverage

246 of 307 sentences (80%), well past the original 15–25% target. Worst first:

| Topic | Tier | Notes | Coverage |
|---|---|---|---|
| numbers | 2 | 0/5 | 0% |
| connectives | 1 | 9/20 | 45% |
| animals, attractions, colors, home, location, work | 1 | 3/5 each | 60% |
| body, food, friends, restaurant, shopping | 2 | 5/8 each | 63% |
| pronouns | 1 | 5/8 | 63% |
| feelings | 2 | 5/7 | 71% |
| body, family, friends, hotels, modals, money, restaurant, school, shopping, tech, transport | 1 | 4/5 each | 80% |
| greetings | 2 | 6/7 | 86% |
| time | 1 | 8/9 | 89% |

> **Two of these are not gaps.** Under spec §5.2, a tier-2 sentence whose only
> teaching point is a connective **gets no note by design** — that is why six
> spec-compliant rounds sit at 5/8 and it would be wrong to "fix" them. Likewise
> `connectives` at 9/20 is correct: its notes are deliberately **grouped**, one
> per function cluster plus near-synonym distinctions, rather than one per
> sentence. The genuine gaps are the tier-1 rounds at 60–80% and `numbers` tier 2
> at zero.

### Fill-the-Gap coverage

The activity is hidden for any conversation whose user turns lack `opts`.

| Set | With opts | Without |
|---|---|---|
| Topic conversations | 43 | 9 |
| Checkpoint conversations | 5 | 10 |

Topic conversations without: `adjectives`, `classifiers`, `clothing`,
`comparisons` tier 1, `drinks`, `fruitveg`, `location`, `meatseafood`, `modals`
tier 1 — all tier 1, all pre-spec.

**Checkpoint conversations without: every Beginner checkpoint except s1.** That
is ten of the eleven Beginner checkpoints, and it is a larger gap than the old
handovers recorded — they logged only the nine topic conversations. Every
Intermediate checkpoint has opts, so the shape is chronological: the practice was
established after Beginner's checkpoints were authored.

---

## 3. Authoring conventions

Tier 2 has a written spec — **CONTENT_SPEC_TIER2.md**. Tier 1 does not; what
follows is descriptive, derived from what 42 tier-1 lessons look like, recorded
so a new one matches the ones beside it.

**A tier-1 lesson:** 10–18 words (median 10; the 17–18 outliers are `time`,
`family`, `body`, `animals` and `home`, where a smaller set would be arbitrary —
you cannot teach half the days of the week). 5 sentences, each with `sid`,
Chinese, jyutping, English, a `bd` breakdown and ideally a `note`. Three run
longer: `connectives` (20 — a deliberate exception, see below), `time` (9),
`pronouns` (8). A 6–7 line conversation embedded at `rounds.1.convo`. A tier note
at `rounds.1.note` giving the grammar framing — present on 27 of 42, and the 15
without are a soft gap rather than a defect.

**`connectives` breaks the shape on purpose.** A connective is meaningless
alone, so it is sentence-led rather than vocab-led: 16 words, 20 sentences,
grouped notes. Spec §6 explains why, and why it must be authored first.

**A checkpoint** lives at `stage.checkpoint` with its conversation in
`path_convos.json`: an `id` (`<path>-s<n>-cp`, without which completion cannot be
recorded), a `wordCap` for how many stage words the quiz draws (25 throughout
Beginner; Intermediate escalates 25 → 30 → 35 as stages grow), and a `convo` key.
Checkpoint conversations run 8–10 lines with roughly half the turns the
learner's.

**Audio is pre-generated, never synthesised live.** Any new word, sentence or
conversation line needs a `tools/generate-audio.js` run and the files committed.
Authoring without generating ships a silent lesson. The provider is **Azure AI
Speech, `zh-HK` Neural**, since v123 — `zh-HK-WanLungNeural` for words, sentences
and the non-learner speaker, `zh-HK-HiuGaaiNeural` for the learner's own lines.
Google Chirp3-HD (`yue-HK`) remains selectable as `--provider=google` but only as
a labelled reference: it cannot produce a bare syllabic nasal, so 唔 (m4) and
五 (ng5) come back with a vowel inserted. **That is a content-facing constraint,
not just a pipeline one** — it affected 207 of 1,376 files and would silently
mispronounce any new sentence containing either character.

**Every Chinese character is immediately followed by jyutping in brackets** —
in sentences, breakdowns, notes, conversations and chat. No exceptions. Notes may
carry `<strong>` and `<em>`, with `<strong>` reserved for the single key term.

**Conversation titles are not unique.** `beginner-s2` and `intermediate-s1` are
both "Making weekend plans"; `body` tier 1 and tier 2 are both "At the doctor";
`colors` and `clothing` are both "Shopping for clothes". Harmless while titles
are never listed side by side — worth knowing before a screen does.

---

## 4. Content defects

Measured by `node tools/content-report.js --check`. **All eight checks pass as of
v127.** What follows is the record of what was found and closed, kept because the
*shapes* recur — plus the two findings that remain open by design.

### Closed

**`connectives` and `pronouns` were missing from `sw.js`'s `TOPIC_KEYS` precache
list** — 40 keys listed against 42 topic files. Both were added during the
Intermediate expansion and neither reached the list. They still worked online,
because the runtime handler caches a topic on first fetch, so the omission was
invisible on a connected device and showed only as a broken lesson offline from a
fresh install — and `pronouns` is Beginner lesson #1. **Fixed at v122**, found by
device QA rather than by any check; check 8 exists so it cannot recur silently.
This is the only content invariant that lives in a code file rather than a data
file, which is exactly why authoring a topic misses it.

**`topics_index.json` disagreed with the topic files in four places.** Fixed at
v127.

| Drift | Effect |
|---|---|
| `comparisons` listed tiers `[1]`, file has `[1,2]` | Live defect — below |
| `modals` listed tiers `[1]`, file has `[1,2]` | Live defect — below |
| `shopping` r2 said 10 words, file has 9 | Wrong count on a ladder rung |
| `modals` r1 said 12 words, file has 13 | Same |

> **The tier ladder could not see `modals` (mou4 taai3 dung6 ci4) tier 2 or
> `comparisons` tier 2.** `getTierLadder()` calls `getAvailableRounds()`, which
> reads the index, not the topic file. For these two it returned `[1]`, so
> `total <= 1` and the function returned no rungs. Opening either from Topics
> offered no tier 2; opening it inside the Intermediate path rendered no
> cross-reference row. Both are spec-compliant, fully authored, audio-generated
> lessons — the whole of chapter I-3 — and for five deploys they were reachable
> only by walking the path to `intermediate-s3`.

**`intermediate-s3` had no checkpoint `id` and no `wordCap`** — the only one of
15 missing either, so its completion could not be recorded and its quiz had no
cap. Fixed at v127 with `intermediate-s3-cp` and a cap of 25, which is where the
Intermediate ladder starts (25 → 30 → 35 as stages grow) and comfortably above
the stage's 19 words.

All three of the above were authored in the same session that shipped I-3, and
all three are the *last* step of a sequence. See §7.

### Open by design

**`numbers` (sou3 zi6) tier 2 is unstaged.** It sits in the Intermediate
`lessons` array but in no stage, so under staged rendering it is invisible. This
is the documented consequence of flipping the path from flat to staged: the
pre-spec tier-2 rounds dropped off the visible path until their chapters were
built. Five have since been staged with I-4 and I-5; `numbers` belongs to I-2,
which is not built. **It resolves when I-2 lands**, and needs a spec retrofit at
the same time.

**`intermediate-s2` does not exist** — I-2 Sentence Grammar is a reserved slot,
not an accident. This answers the question BACKLOG.md carried open from
2026-07-25.

Both sit in an `EXPECTED` allowlist in the script, printed as *expected* rather
than hidden, each with a comment naming what removes it.

### Not a defect, but worth knowing

**`data/patterns.json` is dormant.** 66 patterns in 25 groups (48 tier-1, 18
tier-2), 150 drills, 600 drill items, 198 KB, fully ID-minted, still validated on
every `validate.js` run. **Nothing loads it** — not fetched by `data.js`, not in
`sw.js`'s precache, not referenced outside the validator. Patterns/Drills were
removed from the app entirely rather than soft-hidden; the file survived. It is a
real asset: if the Stage 3 checkpoint activity (§5.5) ever wants drills, this is a
large head start, and the spec already flags connectives as a natural fit for it.
Keep it and keep validating it, but **it is not part of the live corpus and should
not be counted as content a learner can reach.**

**Topic and category icons are live data.** `meta.icon` in each topic file and
the icons in `categories.json` are still emitted — on the Topics grid, its
category headers and its filter. The v124 emoji sweep counted pictographic
codepoints in strings emitted *by `render.js`*, and DESIGN_SYSTEM §3.6 grants the
Topics category grid its exception, so these were correctly out of scope. **A new
topic still needs an icon chosen.** `meta.color` is a different story — it is
overridden by `BRAND_ACCENT` in `data.js` and is dead data kept for reference.

---

## 5. The plan

The Intermediate path's shape is **decided, not open**. Six theme-stable chapters,
built and wired one at a time. Learner-facing order is fixed by the table below;
build order is free.

### 5.1 The six chapters

**v1** = build in the first pass. **v2 reserved** = a permanent home kept in the
same chapter, built *only if* that topic later passes the genuine-depth gate
(spec §2) — otherwise it stays tier-1 forever. The point of reserving homes now
is that adding a topic later never forces a re-grouping.

| Ch | Stage | Name | v1 lessons | v2 reserved |
|---|---|---|---|---|
| I-1 | `intermediate-s1` | Connectives | connectives ✅ | — |
| I-2 | *unbuilt* | Sentence Grammar | particles R2, questions R2, tense R2, numbers R2 | classifiers R2 |
| I-3 | `intermediate-s3` | Saying More | modals R2 ✅, comparisons R2 ✅ | adjectives R2, time R2 |
| I-4 | `intermediate-s4` | Food, Dining & Shopping | food R2 ✅, restaurant R2 ✅, shopping R2 ✅ | cooking R2, clothing R2, money R2 |
| I-5 | `intermediate-s5` | Me & My People | greetings R2 ✅, feelings R2 ✅, body R2 ✅, friends R2 ✅ | family R2 |
| I-6 | *unbuilt* | Out, Work & Safety | transport R2, work R2, emergencies R2 | directions R2, hotels R2, tech R2, school R2 |

**v1 is 17 lessons** — connectives plus 16 tier-2 rounds, roughly half the depth
of Beginner's 41. Ten are built. Seven remain: six fresh (`particles`,
`questions`, `tense`, `transport`, `work`, `emergencies`) and one retrofit
(`numbers`).

`greetings` tier 2 sits in I-5 as the social-register piece rather than with the
grammar chapters. `modals` and `comparisons` were promoted out of the v2 pool
into v1, which is what keeps I-2 and I-3 sized right instead of forcing a
re-group later.

**Likely to stay tier-1 permanently, no slot reserved:** `yesno`, `phrases`,
`meatseafood`, `fruitveg`, `drinks`, `colors`, `animals`, `weather`, `hobbies`,
`home`, `location`, `attractions`, `sports`. Vocabulary sets already complete in
one register — the "ten more nouns" trap.

> **The v2 reservations are homes, not a backlog.** If every one were built,
> Intermediate would balloon to ~29 lessons and stop being distinct from
> Beginner. Each must pass the genuine-depth gate on its own merits, and most are
> expected to stay tier-1.

### 5.2 Building a chapter

Three pieces, in order: **content** (author or retrofit each topic's tier-2 round
to spec, proposed as a review `.md` first), **checkpoint conversation** in
`path_convos.json`, then **wire the stage** into `learning_paths.json` with its
topics in `lessons` at the right tier. Full step list in spec §11 — and note
steps 4, 8 and 9, which are the three that have been missed before.

**One chapter is roughly:** 2–4 × (10 words + 8 sentences + notes + a 9-line
conversation) + a checkpoint conversation + an audio run + the wiring. That is
the unit to estimate against.

### 5.3 Remaining v1 work

**I-2 Sentence Grammar** — four lessons, three fresh and one retrofit. Directions
already sketched: `particles` R2 takes 喇 (laa3) / 㗎 (gaa3) / 囉 (lo3) / 咋
(zaa3) / 添 (tim1) / 喎 (wo3) in nuanced use; `questions` R2 takes indirect
questions, tag questions (係咪 hai6 mai6) and softened requests; `tense` R2 takes
aspect stacking (食緊 (sik6 gan2) + 喇 (laa3)), experiential 過 (gwo3) and
reversive 返 (faan1); `numbers` R2 takes hundreds and thousands, fractions and
approximate counts (幾 (gei2), 成 (sing4)). **Building I-2 also clears both
allowlisted findings in §4** — it stages `numbers` tier 2 and closes the
numbering gap.

**I-6 Out, Work & Safety** — three lessons, all fresh: `transport`, `work`,
`emergencies` at tier 2.

> **`transport` has no tier-2 round.** One handover recorded it as "already has a
> pre-spec R2 draft, needs retrofit"; the build plan recorded it as fresh. The
> repo settles it — `transport` has tier 1 only. Treat it as a fresh build. This
> is worth keeping as a shape: two handover documents disagreed and neither
> flagged it, because neither was checked against the data.

### 5.4 Queued behind the chapters

**`clothing` tier 2** — the sizing vocabulary displaced when `shopping` tier 2
was refocused onto bargaining: 試吓 (si3 haa5), 尺碼 (cek3 maa5), 緊 (gan2), 鬆
(sung1), 大碼 (daai6 maa5), 細碼 (sai3 maa5). It has a reserved home in I-4.

**Fill-the-Gap `opts`** — 19 conversations, listed in §2. The nine topic ones were
already known; the ten Beginner checkpoints were not. Authoring three options per
user turn is mechanical work with no design question attached.

**Note-authoring** — the genuine gaps from §2, once the design-by-omission cases
are excluded. `numbers` tier 2 (0/5) resolves with its I-2 retrofit; the tier-1
rounds at 60% are the rest.

### 5.5 Stage 3 checkpoint activity

A third checkpoint activity alongside Words and Conversation, replacing the
removed Patterns slot. The hub already accommodates it without layout changes —
the activities are numbered and the diamond progress ring scales to three
segments. **If it is designed as a sentence-recall activity it needs no new
authoring and is a pure feature; if it is designed as pattern drills it revives
`patterns.json` and becomes a content decision.** That fork is why it appears
here as well as in BACKLOG.md. Sentence audio is now pre-generated, which opens
listening-based designs that were not available when the slot was emptied.

### 5.6 Advanced path

A shell committing to three things — natural register, idioms, family-context
conversation — none of which the tier model supports well: a tier 3 of an
existing topic is a different proposition from an idiom lesson with no topic
parent. **The model question comes before any authoring.** One piece is already
specified: spec §6 parks a tier-2 connectives round of written and formal forms —
無論…都 (mou4 leon4…dou1), 既然 (gei3 jin4), 否則 (fau2 zak1), 與其…不如
(jyu5 kei4…bat1 jyu4) — at the start of Advanced. The tier ladder and
`tier-harness.js` already handle three tiers, so rendering is not the constraint.

### 5.7 Immersion / Pimsleur-style audio dialogues

The largest unbuilt content idea and the least specified. Two candidate shapes —
pure immersion (native-speed scripted Cantonese, 2–4 distinct voices) or
structured drill (English cues alternating with Cantonese, response pauses,
spaced revisits). **They need different script formats, so the direction must be
chosen before a line is authored** — the one item here where starting early is
actively wasteful. Technically unblocked either way: fixed scripts fit the
existing offline audio pipeline exactly as checkpoint conversations do. Playback
and nav placement stay in BACKLOG.md as feature questions.

### 5.8 Per-stage checkpoint watermark

15 authored characters plus a field in `learning_paths.json` — 句 (geoi3) for
Building Sentences, 家 (gaa1) for Home & Surroundings, 人 (jan4) for Me & My
People. Authored content, but the decision is a design one and lives in
BACKLOG.md against DESIGN_SYSTEM §Watermark. **Adopt only if checkpoint heroes
start feeling samey** — the fixed 站 (zaam6) is the deliberate default.

---

## 6. Checks

`node tools/content-report.js --check` asserts eight properties and exits 1 on
failure. It is **standing check 9**, joining the eight in IN_PROGRESS.md, and is
the first of them that reads content rather than CSS, JS or navigation. Run it
with `tools/validate.js` after any data change; the two do not overlap.
`validate.js` checks IDs, references and file integrity — whether the data is
well-formed. `content-report.js` checks whether the curriculum the data describes
is coherent.

1. **Every lesson in `lessons[]` belongs to one of the path's stages.** The two
   arrays describe the same curriculum and nothing else makes them agree.
2. **Every (topic, tier) pair belongs to at most one path.** The ladder's
   cross-reference names a path; two owners makes it name the wrong one. Also
   asserted by `tier-harness.js` — duplicated deliberately, because a content
   author is likelier to run this script than that one.
3. **Every lesson's (topic, tier) exists in the topic file.**
4. **Every checkpoint has an `id`, and any conversation it names exists.**
5. **Stage numbering is contiguous.**
6. **Every topic is mapped to a category and every mapping points at a topic.**
7. **`topics_index.json`'s tier lists and word counts match the topic files.**
8. **Every topic file is in `sw.js`'s `TOPIC_KEYS`.**

Checks 1 and 5 currently report against I-2's reserved slot. Rather than let them
report a known-benign finding on every run — which trains you to skim the output,
the lesson STATUS.md already records about standing check 3 — both sit in an
`EXPECTED` allowlist at the top of the script, printed as *expected* rather than
hidden, each with a comment naming what removes it. **Delete the entries when I-2
is built and the checks start failing again.**

The script also prints two things it does **not** enforce: tier-2 spec compliance
and Fill-the-Gap coverage. Both are content debt rather than data defects, and
only a person can say whether a seventh sentence would earn its place.

---

## 7. Notes worth carrying forward

**Derived data maintained by hand will drift, and the drift is invisible.**
`topics_index.json` summarises the topic files so the app can boot without 42
fetches. Nothing regenerated it when `modals` and `comparisons` gained a tier 2,
so the app has been unable to see chapter I-3's content ever since. Every check
passed throughout, because each file was individually valid. **The long-term fix
is to generate `topics_index.json` from the topic files rather than edit it** —
check 7 closes the hole; a build step would remove it.

**The same session authored the content, missed the index, and missed the
checkpoint `id`.** Three omissions, one session, all of them the *last* step of a
sequence. That is not carelessness so much as a workflow with no terminal check,
which is what spec §11 and `--check` now provide.

**A handover is a snapshot, and two snapshots will disagree.** The recovered
handovers said `transport` had a pre-spec tier-2 draft; the build plan said it
was fresh; the repo has neither. Nobody noticed because handovers were written
from memory of the session, not measured against the data. **This file replaces
them — and it earns that only if its numbers stay generated.**

**A count can be correct about the wrong thing.** "600/600 words" was carried in
the project instructions for months. It was never wrong — it was the drill-item
count, correctly reported by a validator line about drill items, read as a word
count. **When a number is quoted in a doc, quote what produced it.**

**Content and code defects hide in each other's blind spots.** The `modals` tier
ladder defect is a content defect with a code symptom: the JS is correct, the CSS
is correct, every file parses, and a learner never sees a lesson that exists. The
`sw.js` precache omission is the mirror image — a content change whose only
evidence is in a code file, and whose symptom appears only offline.
