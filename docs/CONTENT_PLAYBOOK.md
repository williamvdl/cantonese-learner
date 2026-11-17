# CONTENT PLAYBOOK — how a lesson gets made and checked

*The step-by-step procedure for authoring new content or retrofitting existing
content, **at any tier**. The **specs** say what good content is at each tier;
**this file says what to do, in what order, and who does it.** The scripts
the author uses along the way are in `tools/content-batch/`.*

| Tier | Path | Its spec |
|---|---|---|
| 1 | Beginner | `CONTENT_SPEC_TIER1.md` |
| 2 | Intermediate | `CONTENT_SPEC_TIER2.md` |
| 3 | Advanced | None yet — one has to be written before any Advanced content is |

The four lesson rules, the same at every tier, are in `CONTENT.md` §3. The
reasoning behind this design is in `PROPOSAL-content-playbook.md`.

Last updated: 2026-11-17 · sw.js at v171

> **Status: CONFIRMED by William, 2026-11-14.** This is the process for all
> content from here on; he expects it to change in small ways as it is used,
> and changes are made in this file. Run
> twice: retrofit batch 1 (v169) and batch 2 (v170). §6 records what each run
> found and how it changed this document — most recently the **second-model
> pass**, added 2026-11-17 on trial. **There is no native-speaker review in
> this process** (William, 2026-11-14): the people who could do it do not have
> the time, and a review step nobody can staff only blocks content. The
> independent AI review in steps 6–8 is the check on naturalness, William
> approves every batch, and §7 says plainly what that does and does not cover.

---

## 1. Who does what

| Role | Who | Does |
|---|---|---|
| **Owner** | William | Picks the batch, runs the second-model pass by hand, reviews and approves the batch, generates audio, commits, and listens to it in the app |
| **Author** | An AI session in this project | Reads the lesson against its spec, checks the word list, writes the draft, runs the checks, compiles and settles the flags |
| **Reviewer** | A *separate* AI session, started fresh for each pass, given only that pass's packet | Reviews the draft. Flags; never edits |

The author and the reviewer must never be the same session. An author checking
its own draft agrees with itself.

---

## 2. The steps

The same eleven steps serve a new topic and a retrofit, at any tier.

### Authoring

**1. Scope the lesson.** *(Author)* Open the spec for the lesson's tier.
- *New topic:* take it through that spec's entry gate and choose the word list.
- *Retrofit:* run `node tools/content-report.js --worklist` for what the lesson
  lacks, then **read every existing sentence and chat line against the spec**
  and mark each *keep* or *rewrite*. The worklist counts; it does not judge. A
  retrofit is finished when the lesson would pass if authored new today.

**2. Check the word list.** *(Author, with two reviewer sessions)* Before a
sentence is written, the lesson's words are checked for the one fault no other
check can see: **a written-style word where people say a different one.** The
app teaches people to speak. Two fresh sessions — one given only each word's
meaning and asked for the spoken word, one given the app's word and asked to
flag it — plus the spoken corpus. Settle each flag by the rule in §4, and never
use a word on the house list (§5). *Skip this step for a lesson whose words
were covered by the 2026-11-13 audit and have not changed since.*

**3. Write the scene card.** *(Author)* Five lines, before any Cantonese: who
the two speakers are to each other, where they are, what the learner wants, one
small hitch or choice, how it ends. Add the setting: home and family, everyday
life, travel, or work.

**4. Draft the lesson.** *(Author)* Compose in Cantonese; write the English
second, as a gloss. Reuse a frame the app already has before inventing one.
Sentences first — each new one aimed at a word not yet used — then the chat.
For each line, also write its **purpose** in a few plain words ("the friend
asks who is in the photo"); pass A is given that, not the gloss. **A purpose
must not hand over the wording**: say what the line does, and avoid any English
word whose obvious translation is the very thing being checked ("says it has
not come yet", not "says it has not been *delivered*"). §6 has why.

**5. Run the scripted checks on the draft.** *(Author)* The draft goes into a
working copy of the data so the scripts can read it: `validate.js`,
`jyutping-check.js`, `gap-opts-check.js` and `content-report.js --check`, then
read the **Lesson rules** table and the tier's shape table for the lesson.
Check every line against the house list. **Rebuild `data/char-jyutping.json`
here too** (`build-char-jyutping.js`) before `jyutping-check.js` — new content
can change a character's default reading, and at v170 that surfaced only at
release. Fix everything before going on — a reviewer's attention is not spent
on what a script can find.

### Independent AI review

**6. Run the review passes.** *(Reviewer — three fresh sessions, and William
for the second-model pass.)* Each sees a different, deliberately limited
packet. **Every line of the lesson goes in, kept ones included and unmarked.**
§3 has the detail. The author hands William the A2 packet when the Claude
passes start, so the two run side by side.

| Pass | The reviewer sees | The reviewer is asked | It catches |
|---|---|---|---|
| **A. Say it yourself** | Scene card, the lesson's words, each line's purpose. **Not the draft, in Cantonese or English** | "How would a Hong Kong speaker say each line?" Two versions each | Stiff or translated phrasing |
| **A2. Say it yourself — a second model** *(on trial)* | The same packet as pass A, pasted by William into a fresh chat with an AI from a different company | The same question | What pass A cannot: phrasing the author and its own reviewers all find natural |
| **B. What does it say** | The Cantonese only | "Translate each line into English" | The Cantonese not meaning what the lesson claims |
| **C. Rubric read** | Everything, plus the spec's rules and the house list | "Check each line against this list. Flag or pass" | Named faults: register, particles, classifiers, too hard for the tier, a reply that does not follow |

**7. Compile the flags.** *(Author)* Compare pass A's and pass A2's versions
and pass B's translations with the draft, add pass C's flags, and record every flag in the
review document and the log — including the ones that look wrong.

**8. Settle the flags — once.** *(Author)* By the rule in §4. Record before and
after for every line changed. **No second round:** revised lines are not sent
back for another AI review. Looping until the reviewer stops flagging produces
a draft that satisfies the reviewer, which is not the same as a good one.

### Approval and release

**9. Write the review document; William approves.** *(Author, then William)*
One file per batch in `docs/review/`: for each lesson the scene card; every
line (Chinese, jyutping, English) marked *kept*, *rewritten* or *new*; every
flag and how it was settled; and a short list of anything the author could not
settle and wants William's eye on. **Nothing goes into the app's data until he
approves.** This comes after the AI review, not before, so he sees the draft
and what the review made of it in one read.

**10. Generate the audio and release.** *(William, with the author's package)*
The author delivers the changed files with the batch's lessons deleted from
`RETROFIT_PENDING`, `sw.js` bumped, docs updated, and the exact audio commands.
William unzips over the repo, runs the commands, then commits and pushes — in
that order, so data and audio go live together. New lines generate on a plain
run; rewritten sentences and any changed chat need `--force` and an
`AUDIO_CACHE` bump (tier-1 spec §10.6). **Once it is pushed, the author checks
the audio against the data** with `tools/content-batch/audio_release_check.py`:
a missed `--force` run fails silently, leaving new text over an old clip, and
v170 had one.

**11. Listen to it in the app.** *(William)* Go through the batch's lessons
once. Anything that sounds or reads wrong comes back as a correction — and if
it is a kind of fault that could recur, onto the house list, so the next batch
cannot repeat it.

---

## 3. The independent AI review, in detail

### What "independent" means here, and what it does not

Each pass is run by an AI session that starts with **nothing but its packet**:
no view of the authoring conversation, the author's reasoning, or the other
passes. In practice the author session starts a separate reviewer agent for
each pass and hands it the packet as a file in a folder of its own. That
independence is real — pass A cannot be led by a draft it has never seen.

It is **not** independence of judgement. The reviewer is the same kind of model
as the author and shares its blind spots about Cantonese. So the passes lean on
what a model does reliably — translating, comparing two English sentences,
checking a line against a stated list — and the rule in §4 only acts on a
question of naturalness when more than one signal points the same way.

**Pass A2 is the one pass with a different judgement behind it.** It is run on
a model from another company, which learned Cantonese from different material.
It is still not a native speaker, and it can be wrong in its own ways — so it
counts as one signal, never as a verdict.

### The packets and the fixed instructions

The instructions are fixed text, used unchanged every time, so that one
batch's review can be compared with the next. Changing them is a change to the
playbook, made here.

**Pass A — Say it yourself.**
*Packet:* the scene card; the lesson's word list with meanings; each sentence's
and chat line's **purpose**, numbered; who speaks each chat line. *Not the
lesson's English glosses* — in the pilot those led the reviewer straight to the
draft's phrasing, and it agreed on 41 lines of 57.
*Instruction:*
> You are writing Cantonese lesson content as spoken in Hong Kong, for the
> level stated. For each numbered line, write how a Hong Kong speaker would
> naturally say it in everyday speech, in traditional characters with
> jyutping. Give two versions where there are two natural ways. Use the
> lesson's words where the line calls for them. Keep each line as short and
> simple as the level needs. Do not explain.

*Comparing (author, step 7):* a draft line **agrees** if it matches either
version once punctuation and a sentence-final particle are set aside. Anything
else is a **phrasing flag**, carrying the reviewer's nearest version.

**Pass A2 — Say it yourself, on a second model.** *On trial since batch 2.*
*Packet:* pass A's packet, unchanged, with a short section at the end fixing
the answer format (one line per id: characters, jyutping, an optional second
version). The author delivers it as a text file.
*How it is run:* William opens a **new, empty chat** with an AI that is not
Claude, pastes or uploads the file, and brings the reply back as text or a
file, saying which AI and model it was. About two minutes a batch. The reply is
saved in `docs/review/` beside the batch's review document.
*Comparing:* as for pass A, with three guards learned in batch 2:
- **Its characters are a signal; its jyutping never is.** It made about four
  reading slips in 95 lines, including one the house list already settles.
- **It is wordier than the tier allows.** Three in four of its differences were
  a longer line. A version that breaks the tier's length limit is not taken as
  written — take the point it makes, inside the limit, or leave it.
- **It ignores "use the lesson's words" more often.** A version that drops the
  lesson word is not a flag against the lesson word.

**Pass B — What does it say.**
*Packet:* the Cantonese of each line, numbered, with chat speakers marked.
Nothing else — no English, no topic name.
*Instruction:*
> Translate each numbered Cantonese line into plain English, as literally as
> stays natural. If a line is ambiguous, odd, or reads as written Chinese
> rather than speech, say so after the translation in one short note.

*Comparing:* the author sets each translation beside the lesson's English. If
they mean different things, that is a **meaning flag**. A note about a line
reading as written Chinese is a **written-form flag**. A note about ambiguity
is recorded and not acted on — in the pilot all eight were noise.

**Pass C — Rubric read.**
*Packet:* the scene card; every line with Chinese, jyutping and English; the
tier's length and difficulty limits from its spec; the house list; the codes
below.
*Instruction:*
> Check each numbered line against the list. For each line answer PASS, or
> FLAG with one code and one sentence of reason. Do not rewrite any line. Only
> flag a real fault; do not flag to be safe. Then answer the three chat
> questions.

| Code | Fault |
|---|---|
| W | A written-Chinese or Mandarin-style word where speech uses another |
| P | A sentence-final particle missing, or the wrong one for the tone |
| C | The wrong classifier |
| S | Stiff — a full textbook sentence where a speaker would drop words |
| R | Wrong register for the scene |
| T | An English idiom translated word for word |
| H | Too hard for the tier: over length, two ideas, an uncommon surrounding word |
| J | Jyutping does not match the characters |
| E | The English does not match the Cantonese |

*Chat questions:* Does every reply follow from the line before it? Does the
chat have the goal, hitch and ending its scene card promises? Is any lesson
word there only to be there?

**The word-list check (step 2)** uses two more fixed instructions, as run on
all 585 words on 2026-11-13; they are recorded in
`docs/review/2026-11-13-word-list-audit.md` §1.

---

## 4. How a flag is settled

With no native speaker to ask, the author decides — by rule, not by taste. The
rule comes from what the native-speaker checks of November 2026 showed about
when an AI's judgement of Cantonese can be trusted.

| The flag | What the author does | Why |
|---|---|---|
| **Meaning** — pass B's translation differs from the lesson's English | Fix the line | A model compares two English sentences reliably |
| **Flow or scene** — a "no" to any of pass C's chat questions | Fix the chat, changing the scene if that is the honest fix | Pass C caught two real faults this way in the pilot |
| **Too hard, or breaks a spec rule** | Fix the line | Countable against the spec |
| **On the house list** | Fix the line | A native speaker has already ruled on it |
| **Written-style word, or a phrasing difference — new content, two or more signals agree** | **Take the reviewer's version** | See below |
| **The same, in a kept line or a word already in the app** | Take the reviewer's version on **three** or more signals; on two, keep and record | Changing it costs audio and drills, so the bar is higher |
| **Written-style word, or a phrasing difference — one signal only** | **Keep the draft.** Record the flag | A single AI flag of this kind was right 3 times in 14 |
| **Reading — the reviewer and a dictionary both disagree with the draft** | Take their reading, and list it for William | Right 6 times in 7 — good, not certain |
| **Reading — the reviewer alone** | Keep the draft's reading; list it for William | Wrong the one time it was tested |
| **Ambiguity note** | Record only | Noise in the pilot |

**What counts as a signal:** pass A wrote it differently; pass A2 wrote it
differently; pass B noted it; pass C flagged it; the spoken corpus has none of
the draft's word and some of the alternative. Each counts once, and two signals
agree only when they make **the same point** about the line — not merely when
both differ from the draft.

**Passes A and A2 share a packet, so their agreement can be the packet
talking.** When both write the same thing, check the line's purpose first: if a
word in it leads straight to that wording, it is one signal, not two. In batch
2 both models wrote 送到 (sung3 dou3) "delivered" because the purpose said
"delivered".

**Why two signals are enough in new content.** When two signals said a more
everyday word existed, a native speaker was asked 18 times. Taking the
reviewer's word would have been right or harmless 16 times; keeping the app's
word, 13 times. That is a modest edge, not a proof — but in new content the
change is free, because no learner has met the line and no audio exists.

**Why three in existing content.** Eleven of those 18 times both words were
fine, so a change would have bought nothing and cost a regenerated clip and a
drill update. Most of batch 1's word flags had three or four signals behind
them, and all six were confirmed.

**A native speaker's past answer outranks any number of signals.** If the house
list says a form is fine, it is not re-flagged.

---

## 5. The house list

What a native speaker has ruled on. It grows whenever a real fault is found
(step 11), and every entry binds all future content. *Kept here for now; it
should become a list a script reads — §8.*

**Never use → use instead**

| Not this | This |
|---|---|
| 好的 (hou2 dik1), as an agreeing reply | 好呀 (hou2 aa3) |
| 兒子 (ji4 zi2) | 仔 (zai2) |
| 女兒 (neoi5 ji4) | 女 (neoi2) |
| 嬰兒 (jing1 ji4) | BB (bi4 bi1) |
| 鳥 (niu5) | 雀仔 (zoek3 zai2) |
| 外公 (ngoi6 gung1), 外婆 (ngoi6 po4) | 公公 (gung4 gung1), 婆婆 (po4 po2) |
| 激動 (gik1 dung6), for "excited" | 興奮 (hing1 fan5) |
| 派對 (paai3 deoi3) | party (paa1 ti4) |
| 圍巾 (wai4 gan1) | 頸巾 (geng2 gan1) |
| 棕色 (zung1 sik1) | 啡色 (fe1 sik1) |
| 找換 (zaau2 wun6), for "change money" — *still in Shopping; see BACKLOG* | 唱錢 (coeng3 cin2) |

**Readings, as said**

弟弟 (dai4 dai2) · 嫲嫲 (maa4 maa4) · 藥房 (joek6 fong4) · 餐牌 (caan1 paai2)
· 扮 (baan6) · 散紙 (saan2 zi2) · 聽歌 (teng1 go1) · 囉 (lo1), the "obviously"
particle · 鴨 (aap3) · 凍檸茶 (dung3 ning4 caa4)

**Fine as they are — do not flag**

A question ending in 嗎 (maa3) · 想要 (soeng2 jiu3) · 提款機 (tai4 fun2 gei1)
· 晚上好 (maan5 soeng6 hou2), said sometimes · and the eleven word pairs marked
"both fine" in `docs/review/2026-11-13-word-list-audit.md` §8, where either
word may be used.

---

## 6. The pilot — retrofit batch 1, v169

Family, Body Parts and Animals & Pets, tier 1, 2026-11-12 to 2026-11-13. The
full record is `docs/review/2026-11-12-batch-1-review.md`.

**What it produced.** Each lesson went from 5 sentences to 10–12 and from 5–7
of its 18 words in use to all 18. All three chats were rebuilt on a scene card.
William's verdict on reading and using it: better sentences and chats than
before, and a good starting position.

**What the AI review caught**, across 57 lines:

- **Written-style words in the word lists themselves** — the largest finding,
  and one no step of the draft playbook looked for. A native speaker confirmed
  all of them.
- **Two chat faults the author had missed** (pass C): a reply that ignored the
  line before it, and a lesson word forced into a scene to reach the count.
- **One meaning gap** (pass B): an "and" in the English that the Cantonese
  lacked.
- **Two wrong readings in the app's existing word list** (pass C), both later
  confirmed.

**How it changed this playbook:**

1. **The word-list check became step 2.**
2. **Approval moved after the AI review** — one read for William, not two.
3. **Pass A no longer sees the English gloss**, only each line's purpose.
4. **Kept lines go to the reviewers too** — three of batch 1's drew flags.
5. **The rule in §4 replaced "ask a native speaker"** for phrasing flags.
6. **Pass B's ambiguity notes are recorded, not acted on.**

**Two practical notes from the run:**

- `mint-sentence-ids.js` rewrites nine unrelated topic files, stripping a
  trailing newline. Revert them before packaging.
- `content-report.js` counts a one-character word as used when a longer word
  contains it — 貓 (maau1) inside 熊貓 (hung4 maau1). Count the chat's lesson
  words by eye before trusting the table.

**Still worth watching:** the rule that a chat carries 40% of an 18-word
lesson's words pulls against a natural scene. It was recoverable in batch 1 by
changing the scene. *It bit again in batch 2:* when 坐地板 (co5 dei6 baan2)
gave way to 坐地下 (co5 dei6 haa2), Home's chat fell one word short and its
last line had to change to carry another.

**Batch 1's ten open phrasing pairs, settled by the §4 rule.** They had been
waiting for a native speaker. Eight kept the draft — six rested on pass A
alone, one was ruled "both fine", and one existing line had two signals where
three are needed. Two changed, both in Body Parts, approved by William and
shipped at v170. Sentence 5 became 佢隻腳受咗傷。
(keoi5 zek3 goek3 sau6 zo2 soeng1.) on three signals, and chat line 3 became
點解呀？你琴日做咗啲咩呀？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 zo2 di1 me1 aa3?)
on two.

### The second run — retrofit batch 2, v170

Home & Rooms, Common Adjectives, Clothing, Fruit & Vegetables, Location &
Position, tier 1, 2026-11-14 to 2026-11-17. The full record is
`docs/review/2026-11-14-batch-2-review.md`.

**What it produced.** 37 new sentences, 2 changed, five chats rebuilt; every
word of all five lessons now in use.

**What the three Claude passes caught**, across 95 lines: one chat fault (a
lesson word there only for the count), one existing sentence built on English
grammar — 喺 (hai2) "in" before a time word, which every pass pointed at — and
two English glosses in the wrong tense. Four lines changed. **Pass A agreed
with the draft on 65 of 95 lines even without the English**, so the packet
change made after the pilot did not do what was hoped.

**What a second model added.** William ran pass A's packet through ChatGPT by
hand. Its first choice differed from the draft on 56 lines where Claude's
differed on 43, and its differences were more often a real choice of word. It
landed on all three questions the Claude passes had left open, and wrote the
changed sentence exactly as the review had changed it. Seven more lines
changed on the strength of it. **This shows the two models differ, not which
is right** — there were no native-speaker answers to score against.

**How it changed this playbook:**

1. **Pass A2, the second-model pass, was added to step 6** — on trial, run by
   hand, its usefulness to be watched batch by batch.
2. **"The same point" was written into the signal rule**, with the guard that
   passes A and A2 share a packet.
3. **A purpose must not hand over the wording** (step 4).

**Two practical notes from the run:**

- **`char-jyutping.json` is built by majority vote, and new content can flip
  it.** A sentence with 樓梯 (lau4 tai1) tipped the lone character 樓 (lau2, the
  colloquial reading `jyutping-check.js` asserts) over to lau4. Rebuild the dictionary and
  run the check *before* the review, not at release.
- **A length quoted in a review document is counted in Chinese characters, not
  with punctuation.** Two were quoted wrongly in batch 2's document and
  corrected.

**Open after batch 2:** both models, unprompted, wrote the classifier where two
existing lines have 嘅 (ge3) for "my" and "your" — 我間房 (ngo5 gaan1 fong2)
for 我嘅房 (ngo5 ge3 fong2), 你個銀包 (nei5 go3 ngan4 baau1) for 你嘅銀包
(nei5 ge3 ngan4 baau1). Two signals on existing lines, so by the rule they
stay; the pattern is with William (BACKLOG, Content).

---

## 7. What this process covers, and what it does not

**No fluent speaker hears new content before it ships.** That is a decision,
taken with open eyes (William, 2026-11-14), and it is the right one for a
project where the alternative is no new content at all.

**What still protects quality:**

- The specs and the lesson rules, held by script.
- Three review passes built around what a model does well, and a fourth on a
  different company's model.
- The signal rule in §4, which keeps a single AI opinion from changing a line.
- The house list — every fault a native speaker ever found, never repeated.
- William's approval of every batch, and his ear as it improves.

**What can still get through:** a line that is grammatical, on-topic, meets
every rule, and is simply not how people say it — where the author and all
three reviewers share the same wrong instinct. The November checks suggest
this is a small share of lines: 14 lines drawn at random from the existing
corpus were all marked fine. Fourteen is a small sample — it rules out a
problem in every other line, not one in every ten. The rate cannot be measured
from inside this process, and this document does not claim otherwise.

**When to revisit.** If lines that sound off start turning up in use; before
the app is sold to people who will not report them; or if a fluent speaker has
five minutes — playing ten new lines aloud in the app needs no reading and no
sheet, and anything it finds goes on the house list.

---

## 8. What exists and what does not

| Piece | State |
|---|---|
| Lesson rules, and the check that holds them | **Built**, in use — `content-report.js` |
| The author's batch scripts | **Built**, in the repo since v171 — `tools/content-batch/`, with a README |
| The check that a release's audio matches its data | **Built** — `tools/content-batch/audio_release_check.py` |
| Tier-1 shape report | **Built**, in use |
| Tier-1 and tier-2 specs | **Written and approved** |
| This procedure | **Run twice; confirmed 2026-11-14** |
| The three review passes | **Run twice.** Nothing to build — fixed instructions, run by reviewer sessions |
| The word-list check | **Run once, over all 585 words** |
| The review log, `docs/review/review-log.jsonl` | **Exists** — kept as the record of each line's flags and what was done |
| The house list | **Exists, in §5** |
| Tappable native-review sheets, the pass bar, the script to score the AI review, a branch for unreviewed audio | **Dropped** with the native review |
| Curriculum vocabulary index | **Dropped** — the rule it served became a judgement (tier-1 spec §4.7) |
| House list as a scripted check | **Not built. Worth doing** — small, and it is how a past finding protects a future lesson without anyone remembering it |
| Pass A2, a second model family | **In use by hand, on trial** since batch 2. Not scored against native-speaker answers; not automated |
| Scene-setting field in the data | **Not built.** Optional; the scene card carries it |
| An Advanced (tier 3) spec | **Not written.** Needed before Advanced content, not before |

Nothing in the "not built" rows stops the playbook being used.

---

## 9. Batch size

Three to five lessons. Three while a new tier or a new kind of lesson is being
tried; five once it has run.
