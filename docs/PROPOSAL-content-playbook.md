# Proposal — a content playbook that needs minimal native review

**Status: PARTLY BUILT — 2026-11-11.** The four lesson rules (H1–H3 in §4) are
decided and built into `tools/content-report.js`; their canonical statement is
now CONTENT.md §3, *Lesson rules*, and where this file and that one differ,
that one wins. Everything else here is still a proposal. Three of the six
decisions in §7 are answered and recorded there; §6.4 carries the result of the
history count. Written against v166. Every number below was measured on the corpus
at v166; how each was derived is stated beside it.

**The objective, as William set it:** create new topics that are natural and
relevant, can be QA'd by a set of rules, and need minimal human review.

**The short answer:** achievable in three layers — hard rules a script enforces,
a risk tier that says which lines are safe by construction, and grey checks run
by an independent AI reviewer **whose accuracy is measured before it is
trusted**. Human review does not go to zero. It shrinks to a queue of flagged
lines plus a small audit sample, and the sample steps down as evidence builds.

---

## 1. What was measured first

| Question | Result | How derived |
|---|---|---|
| Lessons meeting "8 sentences for 10–12 words, 10 for 13+" | **Tier 1: 1 of 42. Tier 2: 7 of 10** | Count of `sentences` against count of `words`, per round |
| Sentences needed to bring every lesson up to that rule | **135 sentences across 44 rounds** | Sum of the shortfalls |
| Conversations containing at least 50% of the lesson's words | **Tier 1: 10 of 42 (median 30%). Tier 2: 9 of 10 (median 67%)** | Substring match of each word's first written form in the conversation lines — a floor, since a split verb-object word can be missed |
| Words never used in any sentence or conversation in their own lesson | **196 of 585 (34%)** | Same match, over sentences and conversation together |
| The five 17–18 word lessons: words appearing in their 6-line conversation | **2 to 4 each** | Same match |
| Naive character scan for written-Chinese forms | **42 hits, 28 of them false alarms** | 41 character and word markers over the 646 topic sentences and conversation lines |
| Approved lines whose every word appears in a spoken-Cantonese corpus | **338 of 646 (52%)**; 58% of adjacent word pairs unseen | PyCantonese segmentation against HKCanCor's 153,656 tokens |
| Written forms in that corpus, against their spoken equivalents | 他 (taa1) 0, 沒有 (mut6 jau5) 0, 吃 (hek3) 0, 看 (hon3) 0 — against 佢 (keoi5) 2,259, 冇 (mou5) 781, 食 (sik6) 190, 睇 (tai2) 553 | Token counts in HKCanCor |

Three things follow, and they shape the rest of this proposal.

**William's two example rules describe tier 2 as built, not tier 1.** Tier 2
already nearly passes both. Tier 1 was authored to a different shape — 5
sentences, a 6–7 line conversation — so adopting the rules for tier 1 is a
retrofit decision, not a tidy-up. It is in §7 as an open decision.

**A third of the vocabulary is flashcard-only.** 196 words are taught as a card
and never heard in use inside their own lesson. That is a stronger argument for
the sentence rule than any I could have made, and it suggests the more useful
coverage rule is "every word is used at least once", with the conversation
share as a secondary target.

**A spoken corpus works as a "this is written Chinese" detector, not as a "this
is natural" detector.** It cleanly separates written from spoken forms. But it
only recognises half of the lines already approved, because it is small and from
1997–98, so it cannot gate anything by itself.

---

## 2. The shape of the solution

Prevention comes before detection. Most unnatural AI-written Cantonese has one
of three causes, and each is cheaper to prevent than to catch:

1. **Translated from English** rather than composed in Cantonese.
2. **Vocabulary-stuffed** — a conversation bent to fit a word list.
3. **Novel phrasing** where an approved pattern already existed.

So the playbook has four parts, in the order they run:

| Part | What it is | Who or what does it |
|---|---|---|
| **Authoring method** (§3) | How a lesson is drafted so the three causes are avoided | AI author, following the playbook |
| **Hard rules** (§4) | Black-and-white, pass or fail | A script |
| **Risk tier** (§5) | Each line marked *frame reuse* or *novel* | A script |
| **Grey checks** (§6) | Flow, naturalness, relevance | An independent AI reviewer, then a human on flagged lines only |

---

## 3. Authoring method

- **Scene card first, before any Cantonese.** Five lines: who the two speakers
  are to each other, where they are, what the learner wants, one small hitch or
  choice, how it ends. A conversation with a goal and a hitch is engaging almost
  by construction; a conversation without one is a vocabulary quiz in turns.
  The card also fixes register before a line is written.
- **Compose in Cantonese, translate to English second.** The English is a gloss
  of the Cantonese, never the source.
- **Reach for an approved frame before inventing one.** The 646 lines already in
  the corpus are a phrasebook of approved sentence shapes. A new sentence that
  is an approved frame with a new word in the slot carries far less risk than a
  new shape. The author records which it is (§5).
- **Words earn their place in the scene.** If a word cannot be used naturally in
  the conversation, it goes in a sentence instead — never forced into the scene.

---

## 4. Hard rules — proposed

Values are proposals for William to set. *Exists* means a check already
enforces it today.

| # | Rule | Proposed value | Status |
|---|---|---|---|
| H1 | Sentences per lesson | At least 8 for up to 12 words; at least 10 for 13+. A minimum, not a target — more is fine, marked *long* past 12 (or 14). Applies to both tiers | **Built 2026-11-11** |
| H2 | Every word is used at least once | Up to 12 words: in a sentence. 13+: in a sentence or the conversation | **Built 2026-11-11** — 217 of 585 words fail today |
| H2b | Every sentence contains at least one of its lesson's words | 100%; for tier 2 the topic's tier-1 words count | **Built 2026-11-11** — 6 sentences fail today |
| H3 | Share of the lesson's words in the conversation | Up to 12 words: 50%. 13 or more: 40%, in a conversation of 8 lines | **Built 2026-11-11** |
| H4 | Conversation length and turn balance | Tier 1: 6–8 lines, and 8 where the lesson has 13+ words. Tier 2: 8–10. Learner speaks roughly half | Convention today, unenforced |
| H5 | Sentence length band | Tier 1: 4–8 characters. Tier 2: 8–16 | Tier 2 reported; tier 1 new |
| H6 | No untaught vocabulary beyond a budget | At most one glossed new word per line that is not in this lesson or an earlier one on the path | New — needs the vocabulary index below |
| H7 | Register: no written-Chinese forms in spoken lines | Zero, against a word-level list with an allowlist | New |
| H8 | One word, one spelling | Zero variants against a variants table | Rule exists in CONTENT.md §3; not yet a check |
| H9 | Every reading agrees with the dictionary; characters with more than one reading are listed for review | Zero disagreements | Partly exists (`jyutping-check.js` §9) |
| H10 | Characters-then-jyutping in every note | Zero | Exists (§8, §10) |
| H11 | Fill-the-Gap option rules | The four rules in CONTENT.md §3 | Exists as a report |
| H12 | A named speaker matches the voice casting | Zero mismatches | Convention today |
| H13 | Scene is not a repeat | Conversation title and setting unique across the corpus | New — three title pairs repeat today |
| H13b | Every scene declares its setting | One of a fixed list — home and family, everyday life, travel, work | New — see §6.3 |
| H14 | Audio exists, and reads back as written | Every line voiced; recogniser transcript matches | `azure-corpus-check.js` already does the read-back for sentences |

**Note on H3.** A flat 50% breaks on big word lists. The five 17–18 word lessons
would need nine words inside a six-line conversation, which is exactly the
stuffing that makes dialogue unnatural. William's steer (2026-11-11): a check is
needed, and bigger lessons may take a slightly lower share or a longer
conversation. The proposal uses both. What it holds constant is **lesson words
per line**: 50% of a 10-word lesson in 6–7 lines is about 0.8 a line, and 40% of
an 18-word lesson in 8 lines is 8 words, 1.0 a line — the same order of density,
where a flat 50% in six lines would be 1.5. H2 guarantees every word is heard
in use somewhere; H3 keeps the conversation itself on the topic.

**Note on H6.** This is the rule that would have caught the open defect in
CONTENT.md §4 — the Saying More checkpoint set in a clothes shop the learner has
not reached. It needs a **curriculum vocabulary index**: for any point on a
path, the set of words taught so far. The tier-2 spec already names this index
as the reason "one known word per sentence" cannot be checked. Sentences carry
a word breakdown, so their tokens are free; conversation lines would need the
same or a segmenter.

**Note on H7.** The naive version does not work — 42 hits, 28 false, because
不過 (bat1 gwo3), 不如 (bat1 jyu4), 的士 (dik1 si2) and 找錢 (zaau2 cin2) all
contain a "written" character inside an ordinary spoken word. It has to match
whole words. The 14 real candidates it left are in §8.

**Where these live.** Not a new tool. H1–H5 and H13 extend
`content-report.js --check`; H7–H9 extend `jyutping-check.js`. Each new section
carries planted right and wrong fixtures, as §8–§10 of that script already do.

---

## 5. Risk tier — which lines need a human at all

Every new line is classed by a script, not by judgement:

- **Frame reuse** — matches an approved line's shape with one content word
  swapped. Low risk.
- **Novel** — any other line. Higher risk.

This is what makes "minimal human review" concrete: review effort goes to novel
lines and flagged lines, and frame-reuse lines are sampled only. It also gives
the author a measurable target — the share of a lesson built on approved
frames.

The class must be derived by declaration, not by resemblance: the author names
the approved line it was built from, and the script verifies the difference is
one slot. A line that merely looks similar is novel.

---

## 6. Grey checks — how each of the three can be done

The reviewer is a **separate AI pass that did not write the lesson**, ideally a
different model family from the author, so the two do not share blind spots. It
**flags and never edits**, and every flag names a category from a fixed list.

### 6.1 Does the conversation flow, and does the English make sense?

The most tractable of the three, because it can be judged in English.

- **English-only read.** The reviewer sees only the English lines and the scene
  card. Does each reply answer the line before it? Does the exchange reach the
  ending the card promised? Would a reader know who wants what?
- **Blind back-translation.** A second pass sees only the Cantonese and
  translates it. Its English is compared with the authored English. A mismatch
  means the Cantonese does not say what the lesson claims — a meaning error,
  which is high severity.

### 6.2 Does it sound like natural spoken Cantonese?

Five signals. None is sufficient alone; they are useful because they fail in
different ways.

| Signal | What it catches | What it misses |
|---|---|---|
| **Register list** (H7) and **spoken-corpus lookup** | Written and Mandarin-style words — the most common AI failure | Anything built from correct spoken words in an odd way |
| **Independent re-authoring** — the reviewer gets the scene card and the English, *not* the draft, and writes how a Hong Kong speaker would say each line, three ways | Stiff or translated phrasing: if none of three independent versions resembles the draft, the draft is suspect | Errors both models share |
| **Rubric pass** — the reviewer reads the draft against a fixed list: written form; missing or odd sentence-final particle; wrong classifier; full sentence where a speaker would drop words; register wrong for the scene; English idiom translated literally | Named, countable failure types | Whatever is not on the list |
| **Back-translation** (6.1) | Meaning drift | Naturalness |
| **Audio read-back** (H14) | A character voiced with the wrong reading | Naturalness |

**Independent re-authoring is the one worth most.** It turns "is this natural?"
— which a model answers "yes" to far too readily — into "what would you say?",
which it answers without being led. It also makes the human step fast: a
flagged line arrives with an alternative beside it, so the reviewer's job is
"which of these two sounds right?", an ear judgement that takes seconds.

**The honest limit.** Published benchmarks still report that general AI models
handle colloquial Cantonese worse than major languages. The reviewer therefore
shares some of the author's weaknesses, and its verdicts cannot be assumed
reliable. That is what §6.4 is for.

### 6.3 Is the conversation engaging and relevant to the topic?

Mostly settled before the check, by the scene card (§3). What remains:

- **Checkable:** H3 (on topic), H13 (not a repeat), and whether the learner's
  turns include at least one question and one statement, so the learner is not
  only answering.
- **Reviewer-judged against the card:** is there a goal, a hitch and an ending;
  would this exchange plausibly happen to the app's learner; does anything in
  it exist only to carry a word.

"Relevant" needs something to be judged against. **Decided 2026-11-11: the app
is for all learners** — family and everyday talk, and travel. So relevance is
not judged against one audience. Each scene declares its setting (H13b) and is
judged against that: a travel scene should be what a traveller meets, a family
scene what is said at home. Balance then becomes a property of the library, not
of any one conversation — `content-report.js` reports the mix of settings, so a
path that drifts to all-travel or all-family is visible.

### 6.4 Calibrating the reviewer — the step that makes the rest trustworthy

This is an investigation, so `PROBE_METHOD.md` applies in full. In outline:

- **Known-good lines:** the approved corpus.
- **Known-bad lines, derived not hand-typed:** every line a native review has
  already rejected. **Counted 2026-11-11, and there are too few: 5 lines, in 3
  patterns.** Method: every commit touching `data/topics/` or
  `data/path_convos.json` (52 of 334), each changed file compared with its
  parent, and every existing word, sentence or conversation line whose Chinese
  changed listed — matched by word id, or by position where the list kept its
  length. That gave 72 changed lines:

  | What the change was | Lines |
  |---|---|
  | Whole scenes or sentence sets rewritten (Food tier 1 at v81; four checkpoint conversations at v45 and v64) | 51 |
  | Spelling standardised, 俾 (bei2) to 畀 (bei2), v148 | 12 |
  | Modal Verbs chat rewritten at v157 — recorded as a reply-logic fix | 4 |
  | **A phrasing replaced by a more natural one** | **5** |

  The five: 你叫乜嘢名？ (nei5 giu3 mat1 je5 meng2?) and its two variants became
  你叫咩名？ (nei5 giu3 me1 meng2?) at v53; 我坐地鐵去。 (ngo5 co5 dei6 tit3 heoi3.)
  became 我搭地鐵去。 (ngo5 daap3 dei6 tit3 heoi3.) at v69; 今日人好多。
  (gam1 jat6 jan4 hou2 do1.) was replaced at v157. Only the last is recorded as
  a native speaker's report; the history does not say who prompted the others,
  because every commit message is "Add files via upload".

  **What this does and does not show.** It does not show the corpus is clean —
  corrections made in chat before a commit leave no trace, and a line changed in
  the same commit that resized its list is not matched. It shows the history
  cannot supply a calibration set. That set has to be built: from the review
  sheet in §8, and from a correction log kept from now on.
- **Planted errors, right answer known by construction:** approved lines with a
  spoken word swapped for its written form, a classifier swapped, a particle
  removed.
- **Which error is worse:** a missed error ships to learners; a false flag costs
  a reviewer a few seconds. So the reviewer is tuned to over-flag, bounded only
  by the size of the queue it creates.
- **Proposed pass bar, to be confirmed before any data exists:** catches at
  least 90% of known-bad and planted lines; flags no more than 15% of
  known-good lines. I found no existing probe that declares a bar for this
  class of question — worth a second look before fixing one.
- **If it fails the bar:** native review stays as it is, and the hard rules and
  authoring method are still worth having.

### 6.5 What the human still does

- **A review queue, not a read-through.** Flagged lines only — each with its
  audio, its English, the flag category and the alternative. Judged by ear.
- **An audit sample of un-flagged lines.** This is what measures the misses.
  Proposed step-down: every line for the first three lessons; then 20% once
  three lessons in a row show no correction to an un-flagged line; then 10%.
  Any high-severity miss resets it.
- **Every correction is logged** with the line before and after. The log is the
  calibration set growing, and the review queue shrinking, with each lesson.
- **After launch,** a "report this line" control in the app adds learners to the
  same loop (PRODUCTISATION_REVIEW B8).

---

## 7. Decisions

**Answered by William, 2026-11-11:**

1. **H1 applies to tier 1.** The retrofit is approved: 135 sentences across 44
   rounds, plus audio. Sentence coverage has looked slim in use.
2. **Coverage needs a check, and big lessons may flex.** A slightly lower share
   or a conversation of about 8 lines is acceptable for lessons with more
   vocabulary. H2, H2b and H3 in §4 were built on that and **confirmed the same
   day**, with two refinements from William: up to 12 words, a word must be in
   a *sentence*; and the sentence count is a minimum, so a lesson may run
   longer where its vocabulary needs it.
3. **The app is for all learners.** See §6.3 for what that does to "relevant".

**Still open:**
4. **The severity bar.** Proposed: no high-severity error (wrong reading, wrong
   meaning, wrong audio) and at most one low-severity one (stiff but correct)
   per lesson.
5. **The reviewer's pass bar** in §6.4.
6. **Which second model.** There is already a Gemini key for Translate, and
   `tools/translate-model-judge.html` is a precedent for judging models against
   each other. Chosen by its score on the calibration set, not by reputation.

---

## 8. A first calibration — sheet issued 2026-11-11, marked 2026-11-12

> **Result.** All 28 lines marked. The 14 random lines: all fine. The 14
> flagged lines: 3 off. 好的 (hou2 dik1) was off both times and stays on the
> register list; 想要 (soeng2 jiu3) and questions ending in 嗎 (maa3) were
> fine and come off it. So H7's list was mostly wrong as first drawn — it was
> an AI's expectation of what sounds written, and about one flag in five held
> up. That is the clearest evidence yet for §6.4: the reviewer has to be
> measured before it is trusted. Full write-up and the three corrections:
> `docs/review/2026-11-11-native-ear-sheet-RESULTS.md`. The rest of this
> section is as written before the marks came in.


`docs/review/2026-11-11-native-ear-sheet.md` is the sheet, and
`…-sheet-KEY.md` says which lines are which and how the marks will be read. It
is 28 lines, not 14: the 14 flagged lines shuffled with 14 drawn at random from
the rest of the corpus, unlabelled. Without the random lines a result such as
"8 of 14 sound off" has nothing to be compared with — and since the history
count in §6.4 came back nearly empty, how natural the *unflagged* corpus is has
become a question in its own right.

The word-level register scan left 14 lines in the live corpus. They are
**candidates for a native ear, not verdicts** — and what comes back calibrates
the rule itself. If most are fine as they stand, H7's list is too strict.

- **Eight lines ending in 嗎 (maa3)**, where spoken Cantonese more often uses a
  verb-not-verb question or a different particle — for example 要幫手嗎？
  (jiu3 bong1 sau2 maa3?) in Cooking and 你今晚得閒嗎？
  (nei5 gam1 maan5 dak1 haan4 maa3?) in Friends. Two of the eight are 你好嗎？
  (nei5 hou2 maa3?) in Greetings, a set phrase that may well be fine.
- **Four lines using 想要 (soeng2 jiu3)** — Classifiers (two), Colors,
  Meatseafood.
- **Two lines using 好的 (hou2 dik1)** — Numbers and Time. HKCanCor has no
  instance of it or of 想要 (soeng2 jiu3).

---

## 9. Suggested sequence

Named work items, no order implied beyond what is stated.

- **PB-1 — Settle the decisions in §7.** William.
- **PB-2 — The cheapest question that could kill the AI-reviewer idea.** Count
  the native corrections in the repo's history, and take the 14 lines in §8 to
  a native ear. If there are too few recorded corrections to calibrate against,
  that is known before anything is built.
- **PB-3 — Hard rules into the existing checks** (§4), starting with H1, H2, H3
  and H7, which need no new data.
- **PB-4 — The curriculum vocabulary index**, which unlocks H6 and the tier-2
  spec's uncheckable "known word" target.
- **PB-5 — Reviewer calibration** (§6.4), as a probe under `PROBE_METHOD.md`.
- **PB-6 — Write the playbook itself** *(drafted 2026-11-12 as
  `CONTENT_PLAYBOOK.md`, with tier 1's spec as `CONTENT_SPEC_TIER1.md`)* — one document covering tier 1 as a
  proper spec, the authoring method, and the workflow end to end.
- **PB-7 — The tier-1 retrofit, as the trial.** 135 sentences, authored by the
  playbook in batches of about five lessons. Most will be an approved frame with
  a lesson word in the slot (§5), which is the lowest-risk content there is.
  Each batch gets the hard rules and a **full** native review, with every
  correction logged. That log is the calibration set the history could not
  supply, so the retrofit pays for PB-5 as it goes. Tier 1's 192 flashcard-only
  words set the order: lessons with the most unused words first.

**One correction to an earlier suggestion.** I proposed trialling this on I-2
Sentence Grammar. That is the wrong place: I-2 is particle nuance, the hardest
content in the app for an AI to get right, so a trial there measures the worst
case and says little about ordinary topics. I-2 should keep full native review,
and the trial should be an ordinary topic.

---

## 10. Sources and licences

- **HKCanCor** — about 230,000 words of transcribed Hong Kong speech from
  1997–98, CC BY. Bundled in PyCantonese, which is Python; the repo's tools are
  Node, so the practical route is a one-off export of a word-frequency file.
- **rime-cantonese** — word and reading data, CC BY 4.0, also bundled in
  PyCantonese.
- **words.hk** — the richest dictionary, with usage labels and example
  sentences, but under a non-commercial open data licence. **Not to be built
  on for a paid product without checking**; this belongs with
  PRODUCTISATION_REVIEW A11.
- The 1997–98 date matters: recent vocabulary such as 碌卡 (luk1 kaat1) is
  absent, so "not in the corpus" is weak evidence and "written form with zero
  hits" is strong evidence.
