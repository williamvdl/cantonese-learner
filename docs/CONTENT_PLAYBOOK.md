# CONTENT PLAYBOOK — how a lesson gets made and checked

*The step-by-step procedure for authoring a new tier-1 topic or retrofitting an
existing one. The **specs** say what good content is (`CONTENT_SPEC_TIER1.md`,
`CONTENT_SPEC_TIER2.md`, and the lesson rules in `CONTENT.md` §3). **This file
says what to do, in what order, and who does it.** The reasoning behind the
design is in `PROPOSAL-content-playbook.md`.*

Last updated: 2026-11-13 · sw.js at v169

> **Status: DRAFT FOR WILLIAM'S REVIEW — and not yet run once.** Steps 1–5 and
> 9–12 use things that exist today. **Steps 6–8, the independent AI review, are
> defined here for the first time and have never been run.** The first retrofit
> batch is their pilot. Until the AI review has been measured against a native
> speaker's marks (§4), it is an extra pair of eyes, not a gate, and every new
> or rewritten line still gets a native review.

---

## 1. Who does what

| Role | Who | Does |
|---|---|---|
| **Owner** | William | Picks the batch, approves the draft, generates audio, gets the sheet marked, commits |
| **Author** | An AI session in this project | Reads the lesson against the spec, writes the draft, runs the checks, compiles the flags |
| **Reviewer** | A *separate* AI session, started fresh for each pass, given only that pass's packet | Reviews the draft. Flags; never edits |
| **Native ear** | A fluent Cantonese speaker | Marks the review sheet by ear |

The author and the reviewer must never be the same session. An author checking
its own draft agrees with itself.

---

## 2. The steps

The same twelve steps serve a new topic and a retrofit. They differ only at
step 1.

### Authoring

**1. Scope the lesson.** *(Author)*
- *New topic:* take it through the entry gate (tier-1 spec §2) and choose the
  word list (§3).
- *Retrofit:* run `node tools/content-report.js --worklist` for what the lesson
  lacks, then **read every existing sentence and chat line against the spec**
  and mark each *keep* or *rewrite* (tier-1 spec §10). The worklist counts;
  it does not judge.

**2. Write the scene card.** *(Author)* Five lines, before any Cantonese: who
the two speakers are to each other, where they are, what the learner wants, one
small hitch or choice, how it ends. Add the setting: home and family, everyday
life, travel, or work.

**3. Draft the lesson.** *(Author)* Compose in Cantonese; write the English
second, as a gloss. Reuse a frame the app already has before inventing one.
Sentences first — each new one aimed at a word not yet used — then the chat.

**4. Run the scripted checks on the draft.** *(Author)* The draft goes into a
working copy of the data so the scripts can read it:
`validate.js`, `jyutping-check.js`, `gap-opts-check.js` and
`content-report.js --check`, then read the **Lesson rules** and **Tier-1
shape** tables for the lesson. Fix everything they report before going on. A
reviewer's time is not spent on what a script can find.

**5. Write the review document.** *(Author)* One file per batch in
`docs/review/`: for each lesson the scene card, every line (Chinese, jyutping,
English), which lines are *kept*, *rewritten* or *new*, and what each new
sentence is there to cover. **William approves this before anything else
happens.** It is the point to say "wrong scene" or "too hard" cheaply.

### Independent AI review

**6. Run the three review passes.** *(Reviewer — three fresh sessions.)* Each
pass sees a different, deliberately limited packet. §3 has the detail.

| Pass | The reviewer sees | The reviewer is asked | It catches |
|---|---|---|---|
| **A. Say it yourself** | Scene card, the lesson's words, the English of each line. **Not the draft Cantonese** | "How would a Hong Kong speaker say each line?" Two versions each | Stiff or translated phrasing |
| **B. What does it say** | The Cantonese only | "Translate each line into English" | The Cantonese not meaning what the lesson claims |
| **C. Rubric read** | Everything, plus the spec's rules | "Check each line against this list. Flag or pass" | Named faults: register, particles, classifiers, too hard for a beginner, a reply that does not follow |

**7. Compile the flags.** *(Author)* Compare pass A's versions and pass B's
translations with the draft, add pass C's flags, and record every flag in the
review document and the log — including the ones that look wrong. A flag that
is argued away and not recorded teaches nothing.

**8. Act on the flags — once.** *(Author)*
- **Meaning, written-form and spec-rule flags:** fix the line. Record before
  and after.
- **Phrasing flags** — the draft and the reviewer disagree on how to say it:
  **do not choose.** Both versions go to the native ear as a pair.
- **No second round.** Revised lines are not sent back for another AI review.
  Looping until the reviewer stops flagging hides exactly what the native
  review is there to measure.

### Native review and release

**9. Generate the audio.** *(William)* For the batch's lessons. New lines
generate on a plain run; rewritten sentences and any changed chat need
`--force`, and then an `AUDIO_CACHE` bump (tier-1 spec §10.6). See the open
question in §6 on where this audio lives until the review is done.

**10. Native review, on a tappable sheet.** *(Native ear)* The author builds a
review sheet page — play, then *Fine*, *Off* or *I'd say…* — holding:
- every **new** and **rewritten** line;
- every **phrasing pair** from step 8, as "which sounds right?", unlabelled;
- about one **kept** line in five, mixed in, as a baseline.

The sheet never shows which lines were flagged or which version was the draft.

**11. Apply the corrections and log them.** *(Author)* Every line marked *Off*
or *I'd say…* is fixed as the native speaker gave it and logged before and
after. Changed lines get their audio regenerated; a correction that changes a
line is played back to the native ear once before release.

**12. Release.** *(Author, then William)* Final run of all standing checks,
the lessons deleted from `RETROFIT_PENDING`, `sw.js` bumped, docs updated,
William commits.

---

## 3. The independent AI review, in detail

### What "independent" means here, and what it does not

Each pass is run by an AI session that starts with **nothing but its packet**:
no view of the authoring conversation, the author's reasoning, or the other
passes. In practice the author session starts a separate reviewer agent for
each pass and hands it the packet as a file. That independence is real — pass A
cannot be led by a draft it has never seen.

It is **not** independence of judgement. The reviewer is the same kind of model
as the author and shares its blind spots about Cantonese. The first measurement
of that is in `docs/review/2026-11-11-native-ear-sheet-RESULTS.md`: of 14 lines
an AI flagged as sounding written, a native speaker confirmed 3. So the passes
are built to lean on what a model does reliably — translating, comparing two
English sentences, checking a line against a stated list — and to hand the
question it does badly, *which of two phrasings is natural*, to a person.

### The packets and the fixed instructions

The instructions are fixed text, used unchanged every time, so that one
batch's review can be compared with the next. Changing them is a change to the
playbook, made here.

**Pass A — Say it yourself.**
*Packet:* the scene card; the lesson's word list with meanings; the English of
each sentence and chat line, numbered; who speaks each chat line.
*Instruction:*
> You are writing beginner Cantonese lesson content as spoken in Hong Kong.
> For each numbered English line, write how a Hong Kong speaker would naturally
> say it in everyday speech, in traditional characters with jyutping. Give two
> versions where there are two natural ways. Use the lesson's words where the
> line calls for them. Keep each line short and simple enough for a beginner.
> Do not explain.

*Comparing (author, step 7):* a draft line **agrees** if it matches either
version once punctuation and a sentence-final particle are set aside. Anything
else is a **phrasing flag**, and the reviewer's nearest version becomes the
other half of the pair in step 8.

**Pass B — What does it say.**
*Packet:* the Cantonese of each line, numbered, with chat speakers marked.
Nothing else — no English, no topic name.
*Instruction:*
> Translate each numbered Cantonese line into plain English, as literally as
> stays natural. If a line is ambiguous, odd, or reads as written Chinese
> rather than speech, say so after the translation in one short note.

*Comparing:* the author sets each translation beside the lesson's English. If
they mean different things, that is a **meaning flag**. A note about a line
reading as written Chinese is a **written-form flag**.

**Pass C — Rubric read.**
*Packet:* the scene card; every line with Chinese, jyutping and English; the
rules below.
*Instruction:*
> Check each numbered line against the list. For each line answer PASS, or
> FLAG with one code and one sentence of reason. Do not rewrite any line. Then
> answer the three chat questions.

*Line codes:*

| Code | Fault |
|---|---|
| W | A written-Chinese or Mandarin-style word where speech uses another |
| P | A sentence-final particle missing, or the wrong one for the tone |
| C | The wrong classifier |
| S | Stiff — a full textbook sentence where a speaker would drop words |
| R | Wrong register for the scene |
| T | An English idiom translated word for word |
| H | Too hard for a beginner: over length, two ideas, an uncommon surrounding word |
| J | Jyutping does not match the characters |
| E | The English does not match the Cantonese |

*House rules, added as native reviews teach them:* an agreeing reply is 好呀
(hou2 aa3), never 好的 (hou2 dik1).

*Chat questions:* Does every reply follow from the line before it? Does the
chat have the goal, hitch and ending its scene card promises? Is any lesson
word there only to be there?

### What comes out

One table per lesson in the review document: every line, its flags by pass and
code, what the author did about each (fixed, paired for the native ear, or
left with a reason), and the line as it goes forward.

---

## 4. Measuring the AI review — and when native review can step down

**The log.** `docs/review/review-log.jsonl`, one row per line reviewed: batch,
lesson, line, whether it was new, rewritten or a kept baseline line, the draft
text, each AI flag with its pass and code, the text sent to the native ear, the
native verdict, and the final text. *Not built; it starts with the first
batch.* It opens with the eight known-bad lines already on record.

**What it measures.** For each pass and each code: of the lines the native ear
marked *Off*, how many had the AI flagged (the catch rate); of the lines marked
*Fine*, how many had the AI flagged (the false-flag rate).

**Which error is worse.** A missed fault ships to learners; a false flag costs
a few seconds. So the reviewer is allowed to over-flag.

**Proposed pass bar — to be confirmed before any batch is logged:** the three
passes together catch at least 90% of the lines the native ear marks off, and
flag no more than 15% of the lines it marks fine — the bar first proposed in
`PROPOSAL-content-playbook.md` §6.4, carried over unchanged. Judged on no fewer than 30
native-marked-off lines.

**That will take a while, and may need help.** The first sheet found 3 off
lines in 28. At that rate the retrofit alone may not produce 30. If it does
not, the set is topped up with planted faults — approved lines with a known
fault put in by rule, such as 好呀 (hou2 aa3) swapped for 好的 (hou2 dik1) —
which the reviewer either catches or does not.

**Stepping down.** Until the bar is met: every new and rewritten line is
natively reviewed. Once it is met: the native ear sees only the flagged lines,
the phrasing pairs, and a random 20% of the rest; then 10% after three batches
in a row with no correction to an unflagged line. Any missed wrong reading,
wrong meaning or wrong audio resets it to every line.

**If the bar is never met**, native review stays on every line, and the passes
stay as a cheap first filter. That is a real possible outcome.

---

## 5. What exists and what does not

| Piece | State |
|---|---|
| Lesson rules, and the check that holds them | **Built** — `content-report.js` |
| Tier-1 shape report | **Built** |
| Tier-1 and tier-2 specs | **Written and approved** |
| Tappable review sheet with audio | **Built once**, for the 2026-11-11 sheet; rebuilt per batch |
| This procedure | **Draft** |
| The three review passes | **Defined here; never run** |
| The review log, and the script that scores it | **Not built** |
| Register scan for written-style words | **Not built.** Its list holds one confirmed entry |
| Scene-setting field in the data | **Not built.** The scene card carries it meanwhile |
| A second model family as reviewer | **Not built, not decided** — §6 |

---

## 6. Open questions for William

1. **The pass bar in §4** — 90% caught, 15% false flags, 30 lines.
2. **Where unreviewed audio lives. — Decided 2026-11-13: live first, for
   now.** William is the app's only user and short of time, so a batch is
   committed to `main` with its audio, and the native review follows from the
   live content, with corrections in a later release. **This has to change
   before anyone else uses the app** — a branch is the route then. The options
   as first set out: Step 9 needs audio before the native
   review, and the generator reads the data files, so the draft has to be in
   them. Committing that to `main` puts unreviewed lines live. Two ways:
   - **A branch** — commit the batch's data and audio to a branch such as
     `retrofit-batch-1`; nothing goes live; the author reads the branch to build
     the sheet; it merges once the corrections are in. Cleanest, one extra step.
   - **Live first, while the app has no outside users** — commit to `main`,
     review from the live content, fix in a follow-up. Simpler, and only
     acceptable before launch.
3. **A second model for pass A.** Disagreement between two different models is
   stronger evidence than between two sessions of one. There is a Gemini key in
   the project already, but it is the Translate feature's and must not be
   reused casually; this would need its own small tool and its own decision.
   Worth deciding after the first batch shows how much pass A flags.
4. **Batch size.** Three lessons for the pilot — Family, Body Parts, Animals &
   Pets — then five once the procedure has run once.
