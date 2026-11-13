# Retrofit batch 1 — review document

*Family, Body Parts, Animals & Pets, tier 1. The first run of
`CONTENT_PLAYBOOK.md`, steps 1 to 8: scoped, drafted, checked by script,
reviewed by three independent AI passes, and the flags acted on once.
Written 2026-11-12 against v167.*

> **Status: FOR WILLIAM'S APPROVAL. Nothing here is in the app.** The draft
> sits in a working copy only. Still to come: your approval, audio (step 9),
> the native review (step 10), corrections (step 11) and release (step 12).

**How this differs from the playbook as written, and why.** Step 5 says you
approve the draft before the AI review runs. For the pilot the two were run
together so you can see what the review picks up in one read. And the reviewers
were given the 14 kept sentences as well as the new lines, unmarked — it costs
nothing and shows how often the reviewer flags a line that has already been in
the app.

---

## Update, 2026-11-13 — the seven questions are answered

A native speaker answered all seven questions in §3. **Every one went the
reviewers' way**, and she gave the rule behind them: always the spoken word,
never the written one, because the app teaches people to speak.

| | Was | Now |
|---|---|---|
| Son | 兒子 (ji4 zi2) | 仔 (zai2) |
| Daughter | 女兒 (neoi5 ji4) | 女 (neoi2) |
| Baby | 嬰兒 (jing1 ji4) | BB (bi4 bi1) |
| Bird | 鳥 (niu5) | 雀仔 (zoek3 zai2) |
| Mum's father | 外公 (ngoi6 gung1) | 公公 (gung4 gung1) |
| Mum's mother | 外婆 (ngoi6 po4) | 婆婆 (po4 po2) |
| 弟弟, reading | dai6 dai2 | dai4 dai2 |
| 嫲嫲, reading | maa4 maa2 | maa4 maa4 |

**Folded into the working draft**, which passes every check again:

- **Word lists:** six words and two readings, in Family and Animals.
- **Draft lines:** F-S6 and F-C5 take the new readings. F-S7 is now 公公同婆婆好錫我。
  (gung4 gung1 tung4 po4 po2 hou2 sek3 ngo5.) F-S11 is BB瞓緊覺。
  (bi4 bi1 fan3 gan2 gaau3.) F-C7 is 呢個一定係你個仔！
  (ni1 go3 jat1 ding6 hai6 nei5 go3 zai2!) F-C8 is 係呀！仲有，呢個係我個女。
  (hai6 aa3! zung6 jau5, ni1 go3 hai6 ngo5 go3 neoi2.) A-S6 is 隻雀仔喺樹上面。
  (zek3 zoek3 zai2 hai2 syu6 soeng6 min6.)
- **Two kept notes** in Family, which named the old words and readings.
- **Drills:** 11 drill answers and options that copy these words, and the
  *Family relationships* pattern's note, structure line and one example.

**These word and reading changes shipped on their own as v168**, with new word
audio for the six replaced words, so the batch itself is now only the new
sentences and the rebuilt chats. The three scenes were approved on 2026-11-13. **One thing to test then:** BB is written in English letters. The checks
accept it; whether the speaking practice can score it is not known until it is
tried on a phone.

The tables below are left as they were reviewed, so the record of what each
pass saw stays true.

**It also prompted an audit of every word list** —
`2026-11-13-word-list-audit.md`.

---

## 1. What changed in the three lessons

| | Family | Body Parts | Animals & Pets |
|---|---|---|---|
| Sentences before → after | 5 → 11 | 5 → 12 | 5 → 10 |
| Kept as they were | 5 | 4 | 5 |
| Rewritten | 0 | 1 | 0 |
| New | 6 | 7 | 5 |
| Chat | Rebuilt, 6 → 8 lines | Rebuilt, 6 → 8 lines | Rebuilt, 6 → 8 lines |
| Lesson words used, before → after | 5 of 18 → 18 of 18 | 6 of 18 → 18 of 18 | 7 of 18 → 18 of 18 |
| Lesson rules | Meets all | Meets all | Meets all |

**All three chats were rebuilt rather than extended.** Each old chat was one
speaker asking three questions and the learner answering — an interview — and
none had a goal or a hitch. Body Parts' was also "At the doctor", the same
scene as its own tier 2. Animals' had the learner say two pet names in English
letters, which the speaking feature cannot score.

All scripted checks pass on the draft: `validate.js`, `jyutping-check.js`,
`gap-opts-check.js` (no rule-3 or rule-4 misses on the new options), and the
three lessons read *meets rules* in `content-report.js`.

---

## 2. What the AI review picked up

57 lines went to each pass: 43 new or rewritten, 14 kept.

| Pass | What it returned | Of which acted on |
|---|---|---|
| **A — Say it yourself** | Its own version differed from the draft on **16 of 57** lines | 10 paired for the native ear |
| **B — What does it say** | A note on **15** lines: 7 written-style (one of them also a meaning fault), 8 ambiguity | 1 line fixed |
| **C — Rubric read** | **9** line flags (6 written-style, 2 jyutping, 1 particle) and **4** remarks on the chats | 4 lines rewritten |

**Five lines were changed** as a result, all in chats: one for meaning, four
for flow. **Ten phrasing differences** go to the native ear as pairs, because
the playbook does not let the author pick. **Seven questions** go to the
native ear about words and readings.

### The biggest finding is not about any line

**The word lists themselves hold written-style words.** Passes B and C both
flagged them, pass A chose the spoken word first every time, and the
spoken-Cantonese corpus agrees:

| Lesson word | Spoken alternative | Times in the spoken corpus |
|---|---|---|
| 兒子 (ji4 zi2) "son" | 仔 (zai2) | 0 against 60 |
| 女兒 (neoi5 ji4) "daughter" | 女 (neoi2) | 0 against 24 |
| 嬰兒 (jing1 ji4) "baby" | BB | 0 against 8 |
| 鳥 (niu5) "bird" | 雀 (zoek3), 雀仔 (zoek3 zai2) | 0 against 28 |
| 外公 (ngoi6 gung1), 外婆 (ngoi6 po4) | 公公 (gung4 gung1), 婆婆 (po4 po2) | 0 against 1 |
| 蔬菜 (so1 coi3) "vegetables" — a Fruit & Vegetables word, used here | 菜 (coi3) | 1 against 3 |

**This is not yet a verdict.** The same corpus has no 想要 (soeng2 jiu3)
either, and the native review marked that fine. But it is the same pattern as
好的 (hou2 dik1), which she marked off twice. Only a native ear settles it —
and if she agrees, the fix is to the **word list**, which touches word audio
and the drills, not just these sentences. The playbook has no step for
checking a lesson's word list; it should.

### What else it found

- **Two real chat faults I had missed** (pass C). In Animals, the friend
  answered "I want to see pandas and elephants" by pointing at lions. In Body
  Parts, sore arms had been bolted onto a hiking scene to reach the word count
  — exactly what the spec forbids. Fixed by changing the scene to the morning
  after moving house, where everything hurts for a reason.
- **One meaning gap** (pass B). The English said "Yes! *And* this is my
  daughter"; the Cantonese had no "and", so it read as a contradiction.
- **Two readings questioned** (pass C): 弟弟 (dai6 dai2) and 嫲嫲 (maa4 maa2),
  both as the app's word list has them today. A dictionary gives the formal
  readings, dai6 dai6 and maa4 maa4, and does not settle how they are said. To
  the native ear.
- **Three kept sentences drew flags from more than one pass** — B-S5, A-S3
  and A-S5. B-S5 was called "clipped, like a headline", and all three passes
  flagged it. Four more kept lines drew a single remark each.

### What it did not do well

- **Pass A mostly agreed with me, and that proves little.** Its packet gave it
  the lesson's words and my English, which lead straight to my phrasing. Where
  it differed, the differences were small and of two kinds — a classifier
  added (對 (deoi3), 隻 (zek3)) or a finished action marked with 咗 (zo2).
  Whether those matter is unknown until the native marks come back.
- **Pass A's one large difference was the packet's fault.** "Grandpa and
  Grandma" did not say which side, so it wrote the father's parents.
- **Eight of pass B's notes were about ambiguity**, none worth acting on.
- **No pass can check a reading.** They flagged two; they cannot confirm them.

---

## 3. For the native ear

**These need no audio and could be asked now**, since the answers may change
the draft before any audio is made:

1. Son: 兒子 (ji4 zi2), or 仔 (zai2)?
2. Daughter: 女兒 (neoi5 ji4), or 女 (neoi2)?
3. Baby: 嬰兒 (jing1 ji4), or BB?
4. Bird: 鳥 (niu5), or 雀仔 (zoek3 zai2)?
5. Mum's parents: 外公 (ngoi6 gung1) and 外婆 (ngoi6 po4), or 公公 (gung4 gung1)
   and 婆婆 (po4 po2)?
6. How do you say 弟弟 — dai6 dai2, or dai4 dai2?
7. How do you say 嫲嫲 — maa4 maa2, or maa4 maa4?

**These go on the tappable sheet, with audio:** all 43 new and rewritten
lines; the ten pairs in the tables below as "which sounds right?"; and the
three kept sentences that drew flags.

---

## 4. What the pilot says about the playbook

1. **Add a word-list check to step 1.** The largest finding fell outside every
   step.
2. **Pass C earns its place**, mostly through its three chat questions.
3. **Pass B is cheap and caught one real fault.** Its ambiguity notes are noise.
4. **Pass A needs a better packet** — the scene and the English in looser
   words, so it is not led to the draft — or it will keep agreeing.
5. **The 40% chat rule pulls against natural scenes in an 18-word lesson.**
   Eight lesson words in eight short lines is what led me to force one in. It
   was recoverable here; worth watching in the next batch.
6. **The check that counts a word as used is fooled by short words.** It
   counts 貓 (maau1) as used in the Animals chat because 熊貓 (hung4 maau1)
   contains it, and 馬 (maa5) because 馬騮 (maa5 lau1) does. The honest count
   is 8 of 18, which still passes.
7. **`mint-sentence-ids.js` rewrites nine unrelated topic files**, stripping a
   trailing newline from each. Harmless, but they should not be committed.
8. **Cost:** the three passes took about two minutes each. The authoring is
   the work.

---

## 5. Decisions for you

1. **Approve, change or reject each scene** — the three scene cards below.
2. **Ask the seven questions in §3**, ideally before audio.
3. **Where the unreviewed audio lives** — a branch, or live first
   (`CONTENT_PLAYBOOK.md` §6, question 2). Nothing can move to step 9 until
   this is settled.

---

## Family

**Scene card — "Who's in the photo?".** *Who:* You and a friend who has not met your family. *Where:* At your place, looking at a family photo on your phone. *The learner wants:* To tell your friend who everyone in the photo is. *Hitch:* Your friend keeps guessing wrong — takes your wife for your sister, your older brother for your younger one. *Ending:* The last guess is right, and you point out your daughter too. *Setting:* Home and family.

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| F-S1 | kept | 我爸爸好高。 (ngo5 baa4 baa1 hou2 gou1.) | My father is very tall. | — | — |
| F-S2 | kept | 我媽媽係老師。 (ngo5 maa4 maa1 hai6 lou5 si1.) | My mother is a teacher. | — | — |
| F-S3 | kept | 我有一個哥哥。 (ngo5 jau5 jat1 go3 go4 go1.) | I have one older brother. | — | — |
| F-S4 | kept | 妹妹好細個。 (mui4 mui2 hou2 sai3 go3.) | Younger sister is very young. | **B·note** 細個 (sai3 go3) can mean young or small. | None — kept line. |
| F-S5 | kept | 爺爺住喺香港。 (je4 je2 zyu6 hai2 hoeng1 gong2.) | Grandfather lives in Hong Kong. | — | — |
| F-S6 | new | 嫲嫲今年八十歲。 (maa4 maa2 gam1 nin4 baat3 sap6 seoi3.) | Grandma is eighty this year. | **C·J** Reads 嫲嫲 as maa4 maa4; the draft has (maa4 maa2), which is the lesson's own word entry. | Not changed. **Reading question for the native ear.** |
| F-S7 | new | 外公同外婆好錫我。 (ngoi6 gung1 tung4 ngoi6 po4 hou2 sek3 ngo5.) | Grandpa and Grandma love me dearly. | **A·differs** Wrote the father's parents — the English in its packet did not say which side. A fault in the packet, not the line.<br>**B·W** 外公 (ngoi6 gung1) and 外婆 (ngoi6 po4) "lean written"; says speech uses 公公 (gung4 gung1) and 婆婆 (po4 po2). | Line kept. **Word question for the native ear.** |
| F-S8 | new | 我老公係醫生。 (ngo5 lou5 gung1 hai6 ji1 sang1.) | My husband is a doctor. | — | — |
| F-S9 | new | 叔叔同姨姨今晚嚟食飯。 (suk1 suk1 tung4 ji4 ji1 gam1 maan5 lai4 sik6 faan6.) | Uncle and Auntie are coming for dinner tonight. | **B·note** An uncle from the father's side with an aunt from the mother's: an odd pair, or the general "uncle and auntie" for family friends. | Kept: "uncle and auntie" for family friends is the intended sense. |
| F-S10 | new | 我同表哥去打波。 (ngo5 tung4 biu2 go1 heoi3 daa2 bo1.) | I'm going to play ball with my cousin. | **B·note** Does not say which ball game, or when. | None. |
| F-S11 | new | 嬰兒瞓緊覺。 (jing1 ji4 fan3 gan2 gaau3.) | The baby is sleeping. | **B·W** 嬰兒 (jing1 ji4) is the formal word; speech says BB.<br>**C·W** Same.<br>**A·first choice** Wrote BB first, 嬰兒 (jing1 ji4) second. | Line kept. **Word question for the native ear.** |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| F-C1 | Friend | 呢張相有邊個呀？ (ni1 zoeng1 soeng2 jau5 bin1 go3 aa3?) | Who's in this photo? | — | — |
| F-C2 | You | 呢兩個係我爸爸媽媽。 (ni1 loeng5 go3 hai6 ngo5 baa4 baa1 maa4 maa1.) | These two are my mum and dad. | — | — |
| F-C3 | Friend | 呢個係咪你姐姐呀？ (ni1 go3 hai6 mai6 nei5 ze4 ze1 aa3?) | Is this your older sister? | — | — |
| F-C4 | You | 唔係，佢係我老婆！ (m4 hai6, keoi5 hai6 ngo5 lou5 po4!) | No, she's my wife! | — | — |
| F-C5 | Friend | 唔好意思！呢個係咪你弟弟？ (m4 hou2 ji3 si3! ni1 go3 hai6 mai6 nei5 dai6 dai2?) | Sorry! Is this your younger brother? | **C·J** Reads 弟弟 as dai4 dai2; the draft has (dai6 dai2), the lesson's own word entry. | Not changed. **Reading question for the native ear.** |
| F-C6 | You | 唔係，佢係我哥哥。 (m4 hai6, keoi5 hai6 ngo5 go4 go1.) | No, he's my older brother. | — | — |
| F-C7 | Friend | 呢個一定係你兒子！ (ni1 go3 jat1 ding6 hai6 nei5 ji4 zi2!) | This one must be your son! | **B·W** 兒子 (ji4 zi2) is written Chinese; speech says 仔 (zai2).<br>**C·W** Same.<br>**A·first choice** Wrote 你個仔 (nei5 go3 zai2) first. | Line kept. **Word question for the native ear.** |
| F-C8 | You | 係呀！仲有，呢個係我女兒。 (hai6 aa3! zung6 jau5, ni1 go3 hai6 ngo5 neoi5 ji4.) | Yes! And this is my daughter. | **B·M** "Yes" to "this must be your son", then "this is my daughter" — a contradiction unless a second person is being pointed at. The English said "And"; the Cantonese did not.<br>**B·W** 女兒 (neoi5 ji4) is written Chinese; speech says 女 (neoi2).<br>**C·W** Same.<br>**A·first choice** Wrote 我個女 (ngo5 go3 neoi2) first. | **Fixed** for the meaning flag — 仲有 (zung6 jau5) "and also" added. Word question for the native ear. Before: 係呀！呢個係我女兒。 (hai6 aa3! ni1 go3 hai6 ngo5 neoi5 ji4.) |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **F-C2** — 我今日唔得閒，對唔住。 (ngo5 gam1 jat6 m4 dak1 haan4, deoi3 m4 zyu6.) "I'm not free today, sorry."; 我哋住喺香港。 (ngo5 dei6 zyu6 hai2 hoeng1 gong2.) "We live in Hong Kong."
- **F-C4** — 唔係，我唔鍾意食魚。 (m4 hai6, ngo5 m4 zung1 ji3 sik6 jyu2.) "No, I don't like eating fish."; 多謝，我食飽喇。 (do1 ze6, ngo5 sik6 baau2 laa3.) "Thanks, I'm full."
- **F-C6** — 唔係，我今日要返工。 (m4 hai6, ngo5 gam1 jat6 jiu3 faan1 gung1.) "No, I have to work today."; 唔該，我要呢個。 (m4 goi1, ngo5 jiu3 ni1 go3.) "Please, I want this one."
- **F-C8** — 係呀，我哋聽日朝早十點見。 (hai6 aa3, ngo5 dei6 ting1 jat6 ziu1 zou2 sap6 dim2 gin3.) "Yes, see you at ten tomorrow morning."; 唔係，呢度好近。 (m4 hai6, ni1 dou6 hou2 kan5.) "No, it's very close."

## Body Parts

**Scene card — "Sore after moving house".** *Who:* You and a friend you exercise with. *Where:* Meeting up the morning after you moved house. *The learner wants:* To explain why you are in pain today. *Hitch:* Your friend guesses a headache — it is not your head, it is nearly everything else. *Ending:* Your friend suggests a massage, and you gladly agree. *Setting:* Everyday life.

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| B-S1 | kept | 我頭好痛。 (ngo5 tau4 hou2 tung3.) | My head really hurts. | **A·differs** 我個頭好痛 (ngo5 go3 tau4 hou2 tung3) or 我好頭痛 (ngo5 hou2 tau4 tung3). | Recorded only — a kept line, one pass. |
| B-S2 | kept | 我眼好攰。 (ngo5 ngaan5 hou2 gui6.) | My eyes are very tired. | — | — |
| B-S3 | rewritten | 食飯前要洗手。 (sik6 faan6 cin4 jiu3 sai2 sau2.) | Wash your hands before eating. | — | — |
| B-S4 | kept | 我心好痛。 (ngo5 sam1 hou2 tung3.) | My heart hurts (sad). | **A·differs** 我好心痛 (ngo5 hou2 sam1 tung3).<br>**B·note** Reads as heartache, not chest pain — which is what the lesson intends. | Recorded only — a kept line, one pass. |
| B-S5 | kept | 佢腳受傷。 (keoi5 goek3 sau6 soeng1.) | His leg is injured. | **A·differs** See the pair.<br>**B·W** "Clipped, like a headline": no classifier, no completed-action marker.<br>**C·W** Same. | **Paired for the native ear** — kept line, three passes. Other version: 佢隻腳受咗傷。 (keoi5 zek3 goek3 sau6 zo2 soeng1.) |
| B-S6 | new | 我肚餓喇。 (ngo5 tou5 ngo6 laa3.) | I'm hungry. | — | — |
| B-S7 | new | 記得刷牙。 (gei3 dak1 caat3 ngaa4.) | Remember to brush your teeth. | — | — |
| B-S8 | new | 佢頭髮好長。 (keoi5 tau4 faat3 hou2 coeng4.) | Her hair is very long. | — | — |
| B-S9 | new | 用眼睇，用耳仔聽。 (jung6 ngaan5 tai2, jung6 ji5 zai2 teng1.) | Look with your eyes, listen with your ears. | — | — |
| B-S10 | new | 我鼻塞。 (ngo5 bei6 sak1.) | My nose is blocked. | — | — |
| B-S11 | new | 抹下個嘴啦。 (maat3 haa5 go3 zeoi2 laa1.) | Wipe your mouth. | **A·differs** See the pair. | **Paired.** Other version: 抹嘴啦。 (maat3 zeoi2 laa1.) |
| B-S12 | new | 我手指好凍。 (ngo5 sau2 zi2 hou2 dung3.) | My fingers are freezing. | — | — |

**Rewritten in step 1, before any review:** 洗手要用水。 (sai2 sau2 jiu3 jung6 seoi2.) "Washing hands requires water." became the line above. The old line — "washing hands requires water" — is correct but not something anyone needs to say. This one is said at every family table.

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| B-C1 | Friend | 你做咩呀？係咪頭痛？ (nei5 zou6 me1 aa3? hai6 mai6 tau4 tung3?) | What's wrong? Do you have a headache? | **B·note** 你做咩呀 (nei5 zou6 me1 aa3) alone can mean "what are you doing?"; the second question settles it. | None. |
| B-C2 | You | 唔係，我腳好痛呀。 (m4 hai6, ngo5 goek3 hou2 tung3 aa3.) | No, my legs really hurt. | **A·differs** See the pair. | **Paired.** Other version: 唔係，我對腳好痛。 (m4 hai6, ngo5 deoi3 goek3 hou2 tung3.) |
| B-C3 | Friend | 點解呀？你琴日做咩？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 me1?) | Why? What did you do yesterday? | **A·differs** See the pair.<br>**C·P** Ends bare on 做咩 (zou6 me1), with no particle and nothing marking a finished action — "abrupt". | **Paired.** Other version: 點解呀？你琴日做咗啲咩呀？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 zo2 di1 me1 aa3?) |
| B-C4 | You | 琴日搬屋，膝頭好痛。 (kam4 jat6 bun1 uk1, sat1 tau4 hou2 tung3.) | I moved house yesterday — my knees really hurt. | **C·flow** Chat question 3: the arms in line 8 have little to do with a hike.<br>**A·differs** Marked the hiking as done, with 咗 (zo2). | **Rewritten** — the scene is now the morning after moving house, where sore arms belong. **Paired** on 咗 (zo2). Other version: 我琴日搬咗屋，膝頭好痛。 (ngo5 kam4 jat6 bun1 zo2 uk1, sat1 tau4 hou2 tung3.) Before: 琴日行山，膝頭同腰都痛。 (kam4 jat6 haang4 saan1, sat1 tau4 tung4 jiu1 dou1 tung3.) |
| B-C5 | Friend | 你個背同腰痛唔痛呀？ (nei5 go3 bui3 tung4 jiu1 tung3 m4 tung3 aa3?) | Do your back and waist hurt? | **C·flow** Chat question 1: asks about the back just after the lower back was named. | **Rewritten** — asks about back and waist together. Before: 你個背痛唔痛呀？ (nei5 go3 bui3 tung3 m4 tung3 aa3?) |
| B-C6 | You | 痛呀，膊頭同頸都痛。 (tung3 aa3, bok3 tau4 tung4 geng2 dou1 tung3.) | They do — my shoulders and neck hurt too. | — | — |
| B-C7 | Friend | 不如去按摩啦。 (bat1 jyu4 heoi3 on3 mo1 laa1.) | How about getting a massage? | — | — |
| B-C8 | You | 好呀！我手臂都好攰。 (hou2 aa3! ngo5 sau2 bei3 dou1 hou2 gui6.) | Sure! My arms are tired too. | **C·flow** Chat question 3: 手臂 (sau2 bei3) "tacked on".<br>**A·differs** See the pair. | Line unchanged; the new scene answers the flag. **Paired.** Other version: 好呀！我對手臂都好攰。 (hou2 aa3! ngo5 deoi3 sau2 bei3 dou1 hou2 gui6.) |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **B-C2** — 唔係，我唔識游水。 (m4 hai6, ngo5 m4 sik1 jau4 seoi2.) "No, I can't swim."; 係呀，今日好熱。 (hai6 aa3, gam1 jat6 hou2 jit6.) "Yes, it's hot today."
- **B-C4** — 聽日朝早十點，喺呢度見。 (ting1 jat6 ziu1 zou2 sap6 dim2, hai2 ni1 dou6 gin3.) "Tomorrow at 10am, meet here."; 唔該，我要一杯水。 (m4 goi1, ngo5 jiu3 jat1 bui1 seoi2.) "A glass of water, please."
- **B-C6** — 好呀，我哋一齊去啦。 (hou2 aa3, ngo5 dei6 jat1 cai4 heoi3 laa1.) "OK, let's go together."; 多謝，我唔使喇。 (do1 ze6, ngo5 m4 sai2 laa3.) "Thanks, I don't need it."
- **B-C8** — 唔係，呢個唔係我嘅。 (m4 hai6, ni1 go3 m4 hai6 ngo5 ge3.) "No, this isn't mine."; 係呀，佢係我朋友。 (hai6 aa3, keoi5 hai6 ngo5 pang4 jau5.) "Yes, he's my friend."

## Animals & Pets

**Scene card — "A day at the zoo".** *Who:* You and a friend on a day out. *Where:* At the zoo. *The learner wants:* To see the pandas and the elephants. *Hitch:* The way on leads past the snakes and mice — and you are scared of snakes. *Ending:* You go to the monkeys instead, and everyone is happy. *Setting:* Everyday life.

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| A-S1 | kept | 我屋企有一隻貓。 (ngo5 uk1 kei2 jau5 jat1 zek3 maau1.) | I have a cat at home. | **A·differs** 我屋企有隻貓 (ngo5 uk1 kei2 jau5 zek3 maau1) — no 一 (jat1). | Recorded only — a kept line, one pass. |
| A-S2 | kept | 呢隻狗好可愛！ (ni1 zek3 gau2 hou2 ho2 oi3!) | This dog is so cute! | — | — |
| A-S3 | kept | 你養唔養寵物？ (nei5 joeng5 m4 joeng5 cung2 mat6?) | Do you keep pets? | **A·differs** See the pair.<br>**B·note** Can read as "will you keep a pet"; says the usual question is the one in the pair. | **Paired** — kept line, two passes. Other version: 你有冇養寵物呀？ (nei5 jau5 mou5 joeng5 cung2 mat6 aa3?) |
| A-S4 | kept | 我鍾意馬。 (ngo5 zung1 ji3 maa5.) | I like horses. | — | — |
| A-S5 | kept | 兔仔食蔬菜。 (tou3 zai2 sik6 so1 coi3.) | Rabbits eat vegetables. | **A·differs** See the pair.<br>**B·W** 蔬菜 (so1 coi3) is formal; speech says 菜 (coi3).<br>**C·W** Same. | **Paired** — kept line, three passes. Other version: 兔仔食菜。 (tou3 zai2 sik6 coi3.) |
| A-S6 | new | 隻鳥喺樹上面。 (zek3 niu5 hai2 syu6 soeng6 min6.) | The bird is up in the tree. | **B·W** 鳥 (niu5) is the written word; speech says 雀 (zoek3) or 雀仔 (zoek3 zai2).<br>**C·W** Same.<br>**A·first choice** Wrote 隻雀仔 (zek3 zoek3 zai2) first. | Line kept. **Word question for the native ear.** |
| A-S7 | new | 農場有牛同羊。 (nung4 coeng4 jau5 ngau4 tung4 joeng4.) | The farm has cows and sheep. | **B·note** 羊 (joeng4) covers sheep and goats. | None. |
| A-S8 | new | 豬好鍾意食嘢。 (zyu1 hou2 zung1 ji3 sik6 je5.) | Pigs love to eat. | — | — |
| A-S9 | new | 我想養一隻狗。 (ngo5 soeng2 joeng5 jat1 zek3 gau2.) | I want to get a dog. | **A·differs** See the pair. | **Paired.** Other version: 我想養隻狗。 (ngo5 soeng2 joeng5 zek3 gau2.) |
| A-S10 | new | 大象好大，老鼠好細。 (daai6 zoeng6 hou2 daai6, lou5 syu2 hou2 sai3.) | Elephants are big, mice are small. | — | — |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| A-C1 | Friend | 你想睇咩動物呀？ (nei5 soeng2 tai2 me1 dung6 mat6 aa3?) | What animals do you want to see? | — | — |
| A-C2 | You | 我想睇熊貓同大象。 (ngo5 soeng2 tai2 hung4 maau1 tung4 daai6 zoeng6.) | I want to see the pandas and the elephants. | — | — |
| A-C3 | Friend | 好呀！不過先睇獅子同老虎。 (hou2 aa3! bat1 gwo3 sin1 tai2 si1 zi2 tung4 lou5 fu2.) | OK! But let's see the lions and tigers first. | **C·flow** Chat question 1: ignores the request for pandas and elephants. Question 3: lions and tigers are a detour. | **Rewritten** — the reply now answers the request. Before: 嗰度有獅子同老虎。 (go2 dou6 jau5 si1 zi2 tung4 lou5 fu2.) |
| A-C4 | You | 嘩，隻老虎好大呀！ (waa3, zek3 lou5 fu2 hou2 daai6 aa3!) | Wow, that tiger is huge! | **A·differs** See the pair. | **Paired.** Other version: 嘩，嗰隻老虎好大隻呀！ (waa3, go2 zek3 lou5 fu2 hou2 daai6 zek3 aa3!) |
| A-C5 | Friend | 前面有蛇同老鼠，你驚唔驚呀？ (cin4 min6 jau5 se4 tung4 lou5 syu2, nei5 geng1 m4 geng1 aa3?) | There are snakes and mice ahead — are you scared? | **C·flow** Chat question 1: jumps from the tiger to snakes and mice with no lead-in. | **Rewritten** — given a lead-in. Before: 你驚唔驚蛇同老鼠呀？ (nei5 geng1 m4 geng1 se4 tung4 lou5 syu2 aa3?) |
| A-C6 | You | 驚呀！我唔想睇蛇。 (geng1 aa3! ngo5 m4 soeng2 tai2 se4.) | I am! I don't want to see the snakes. | — | — |
| A-C7 | Friend | 咁我哋去睇馬騮啦。 (gam2 ngo5 dei6 heoi3 tai2 maa5 lau1 laa1.) | Then let's go and see the monkeys. | **A·differs** Spelt the first word 噉 (gam2). The app's spelling is 咁 (gam2). | None — house spelling kept. |
| A-C8 | You | 好呀！馬騮同熊貓都好可愛。 (hou2 aa3! maa5 lau1 tung4 hung4 maau1 dou1 hou2 ho2 oi3.) | OK! Monkeys and pandas are both so cute. | — | — |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **A-C2** — 我今晚想早啲瞓覺。 (ngo5 gam1 maan5 soeng2 zou2 di1 fan3 gaau3.) "I want to go to bed early tonight."; 我唔鍾意食魚。 (ngo5 m4 zung1 ji3 sik6 jyu2.) "I don't like eating fish."
- **A-C4** — 嘩，呢碗麵好好食！ (waa3, ni1 wun2 min6 hou2 hou2 sik6!) "Wow, these noodles are delicious!"; 唔該，幾多錢呀？ (m4 goi1, gei2 do1 cin2 aa3?) "Excuse me, how much is it?"
- **A-C6** — 唔係，我哥哥係老師。 (m4 hai6, ngo5 go4 go1 hai6 lou5 si1.) "No, my older brother is a teacher."; 係呀！我住喺呢度。 (hai6 aa3! ngo5 zyu6 hai2 ni1 dou6.) "Yes! I live here."
- **A-C8** — 好呀！我哋聽日朝早十點見。 (hou2 aa3! ngo5 dei6 ting1 jat6 ziu1 zou2 sap6 dim2 gin3.) "OK! See you at ten tomorrow morning."; 唔好意思，我唔明。 (m4 hou2 ji3 si3, ngo5 m4 ming4.) "Sorry, I don't understand."
