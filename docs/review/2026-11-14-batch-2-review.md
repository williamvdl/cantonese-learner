# Retrofit batch 2 — review document

*Home & Rooms, Common Adjectives, Clothing, Fruit & Vegetables, Location &
Position — tier 1. The first batch run by `CONTENT_PLAYBOOK.md` as confirmed
on 2026-11-14, steps 1 to 9: scoped, drafted, checked by script, reviewed by
three independent AI passes, flags settled once by the playbook's §4 rule.
Written 2026-11-14 against v169.*

> **Status: APPROVED by William 2026-11-17 and released at v170.** Sections 1
> to 5 are left as they were reviewed, so the record of what each pass saw
> stays true. **The update below says what changed between that review and the
> release.**

---

## Update, 2026-11-17 — a second model, the six items, and what shipped

**A second model was tried on pass A.** William pasted pass A's packet into a
fresh ChatGPT chat (free tier; William gives the model as GPT-6) and brought back 95
lines — saved as `2026-11-17-batch-2-pass-a2-chatgpt.txt`. Three things were
named in advance to look at:

| Looked at | Result |
|---|---|
| How many lines differ from the draft | **56 of 95** on its first choice; Claude's pass A differed on **43** on first choice. (The 30 in §2 counts a match on either of Claude's two versions; it offered two on 70 lines, ChatGPT on 6.) |
| What kind of difference | More real choices of word, fewer fillers. Also wordier: 42 of the 56 are a longer line, and three break the 12-character limit |
| Whether it lands on the open items | **All three**, and it wrote Fruit & Vegetables sentence 5 exactly as §2 had changed it |

**Two cautions, both now in the playbook.** Where the two models agreed, the
cause was sometimes a word in my own line descriptions — "delivered" led both
to 送到 (sung3 dou3) — and those agreements were not counted. And ChatGPT's
jyutping slipped about four times, so only its characters are a signal.
**This shows the models differ, not which is right.**

**The six items of §3, as decided:**

| # | Item | Outcome |
|---|---|---|
| 1 | Fruit & Vegetables sentence 5 loses 喺 (hai2) | **Confirmed** — a fourth signal from ChatGPT |
| 2 | Home chat line 7, "sit on the floor" | **Changed** to 坐地下 (co5 dei6 haa2) — pass B and ChatGPT. 地板 (dei6 baan2) gets a sentence of its own |
| 3 | 嘅 (ge3) against a classifier, two existing lines | **Not decided — both lines stay.** Both models wrote the classifier; that is two signals where an existing line needs three. With William (BACKLOG) |
| 4 | Clothing chat line 1 | **Changed** to 著咩衫 (zoek3 me1 saam1) — pass A and ChatGPT |
| 5 | 閂 (saan1) and 戴 (daai3), new to the app | **Kept** — ChatGPT used both unprompted |
| 6 | The two Body Parts lines from batch 1 | **Both changed**, on William's word |

**Lines that shipped differently from the tables below:**

| Line | In the tables | As released | Why |
|---|---|---|---|
| Home chat 7 | 咁我哋坐地板睇電視啦。 (gam2 ngo5 dei6 co5 dei6 baan2 tai2 din6 si6 laa1.) | 咁我哋坐地下睇電視啦。 (gam2 ngo5 dei6 co5 dei6 haa2 tai2 din6 si6 laa1.) | Item 2 |
| Home chat 8 | 好呀！雪櫃有汽水。 (hou2 aa3! syut3 gwai6 jau5 hei3 seoi2.) | 好呀！廚房有汽水。 (hou2 aa3! cyu4 fong2 jau5 hei3 seoi2.) "Great! There's soda in the kitchen." | With 地板 (dei6 baan2) gone the chat was one lesson word short of the seven it needs |
| Home sentence 14 | — | 地板好濕，小心！ (dei6 baan2 hou2 sap1, siu2 sam1!) "The floor is wet — careful!" | New, so that 地板 (dei6 baan2) is still used. **Not seen by any review pass** |
| Home sentence 12 | 行樓梯上去啦。 (haang4 lau4 tai1 soeng5 heoi3 laa1.) | 行樓梯上二樓啦。 (haang4 lau4 tai1 soeng5 ji6 lau2 laa1.) "Take the stairs up to the second floor." | **Not a review change — a check failed at release.** See below |
| Clothing chat 1 | 你今晚著咩呀？ (nei5 gam1 maan5 zoek3 me1 aa3?) | 你今晚著咩衫呀？ (nei5 gam1 maan5 zoek3 me1 saam1 aa3?) | Item 4 |
| Clothing chat 2 | 我著西裝同白恤衫。 (ngo5 zoek3 sai1 zong1 tung4 baak6 seot1 saam1.) | 我著西裝同白色恤衫。 (ngo5 zoek3 sai1 zong1 tung4 baak6 sik1 seot1 saam1.) | Both models wrote 白色 (baak6 sik1) |
| Fruit & Vegetables chat 6 | 咁我要提子啦。 (gam2 ngo5 jiu3 tai4 zi2 laa1.) | 咁我食提子啦。 (gam2 ngo5 sik6 tai4 zi2 laa1.) | Both models wrote 食 (sik6) "eat" |
| Fruit & Vegetables chat 7 | 好甜㗎。帶啲橙返屋企啦。 (hou2 tim4 gaa3. daai3 di1 caang2 faan1 uk1 kei2 laa1.) | 好甜㗎。攞啲橙返屋企啦。 (hou2 tim4 gaa3. lo2 di1 caang2 faan1 uk1 kei2 laa1.) | Both models wrote 攞 (lo2) "take". Both also named the grapes, which would take the line past 12 characters, so only the verb changed |
| Location chat 4 | 我喺巴士站前面呀。 (ngo5 hai2 baa1 si2 zaam6 cin4 min6 aa3.) | 我企喺巴士站前面。 (ngo5 kei5 hai2 baa1 si2 zaam6 cin4 min6.) "I'm standing in front of the bus stop." | Both models added 企 (kei5) "standing" |
| Location chat 5 | 巴士站？我喺隔籬喎！ (baa1 si2 zaam6? ngo5 hai2 gaak3 lei4 wo3!) | 我就喺巴士站隔籬喎！ (ngo5 zau6 hai2 baa1 si2 zaam6 gaak3 lei4 wo3!) "I'm right next to the bus stop!" | Both models wrote it this way |
| Body Parts sentence 5 | 佢腳受傷。 (keoi5 goek3 sau6 soeng1.) | 佢隻腳受咗傷。 (keoi5 zek3 goek3 sau6 zo2 soeng1.) "His leg got injured." | Item 6 |
| Body Parts chat 3 | 點解呀？你琴日做咩？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 me1?) | 點解呀？你琴日做咗啲咩呀？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 zo2 di1 me1 aa3?) | Item 6 |

**The stairs sentence, Home sentence 12.** The app keeps a one-character
dictionary, built from the lessons by majority vote, to show what the learner
said. The new sentence gave 樓梯 (lau4 tai1) one more vote, which flipped the
lone character 樓 (lau2) to lau4. Lau2 is the reading people use for a floor
of a building, and one `jyutping-check.js` holds on purpose. Putting 二樓 (ji6 lau2)
"the second floor" in the same sentence restores the balance and teaches both
readings side by side. It was the smaller change next to altering the tool.

**Final count for the batch:** 37 new sentences, 2 changed, five chats rebuilt
(34 lines), plus the two Body Parts lines.

**Two corrections to §1.** The old Fruit & Vegetables chat's long line was 11
characters, not 13, and the old Home chat's two-clause line was 9, not 10 — I
had counted punctuation. Neither was over a limit; both chats were rebuilt for
the reasons that stand: too few lesson words, and a scene shared with another
lesson or no hitch.

---

## 1. What changes in the five lessons

| | Home & Rooms | Common Adjectives | Clothing | Fruit & Vegetables | Location & Position |
|---|---|---|---|---|---|
| Words | 17 | 12 | 12 | 12 | 12 |
| Sentences before → after | 5 → 13 | 5 → 12 | 5 → 12 | 5 → 12 | 5 → 12 |
| Kept as they were | 5 | 5 | 5 | 3 | 5 |
| Changed | 0 | 0 | 0 | 2 | 0 |
| New | 8 | 7 | 7 | 7 | 7 |
| Chat | Rebuilt, 6 → 8 lines | Rebuilt, 6 lines | Rebuilt, 6 lines | Rebuilt, 6 → 8 lines | Rebuilt, 6 lines |
| Lesson words in use, before → after | 6 of 17 → 17 of 17 | 5 of 12 → 12 of 12 | 5 of 12 → 12 of 12 | 5 of 12 → 12 of 12 | 5 of 12 → 12 of 12 |
| Lesson words in the chat (counted by eye) | 7, needs 7 | 6, needs 6 | 6, needs 6 | 6, needs 6 | 6, needs 6 |
| Lesson rules | Meets all | Meets all | Meets all | Meets all | Meets all |

**36 new sentences, 2 changed, and five chats rebuilt — 34 chat lines.**

**Why every chat was rebuilt rather than extended.** None of the five old
chats used enough of its lesson's words, and each had a second problem:

- **Home & Rooms** — a tour with no hitch, and a two-clause line for the
  learner. *(Corrected: 9 characters — see the update.)*
- **Common Adjectives** — "Looking at a flat", the same scene as Home's, with a
  connective in three lines where the spec allows two.
- **Clothing** — "Shopping for clothes", the same title and scene as the
  Colors lesson, and it used one of its twelve words.
- **Fruit & Vegetables** — a market stall, which Numbers and Meat & Seafood
  already are, and a long line for the learner. *(Corrected: 11 characters —
  see the update.)*
- **Location & Position** — the learner's last turn was a single two-character
  word, and the chat used four lesson words of the six it needs.

The new scenes are all different from each other and from the rest of tier 1:
a new flat with no sofa, choosing a lunch queue, dressing for a wedding dinner,
fruit after dinner at a friend's, and finding each other outside a station.

**Step 2, the word-list check, was skipped** as the playbook allows: all five
word lists went through the 2026-11-13 audit and have not changed since.

**All scripted checks pass on the draft:** `validate.js`, `jyutping-check.js`,
`gap-opts-check.js` (no rule-3 or rule-4 misses on the new options),
`content-report.js` reads *meets rules* for all five, and the tier-1 shape
report lists nothing new. No line uses anything on the house list.

---

## 2. What the AI review picked up

95 lines went to each pass, kept ones included and unmarked: 70 new, 24 kept,
1 rewritten at scoping.

| Pass | What it returned | Of which acted on |
|---|---|---|
| **A — Say it yourself** | Its own version differed from the draft on **30 of 95** lines | None on its own — one signal each |
| **B — What does it say** | Every translation matched in meaning except **2** differences of tense. **9** notes: 3 written-style, 2 "odd", 4 ambiguity | 2 English lines corrected; 1 note counted towards a change |
| **C — Rubric read** | **2** line flags (1 stiff, 1 too hard) and **1** chat question answered against a chat | 1 chat rewritten in two lines; 1 flag counted towards a change |

**Three things changed as a result:**

1. **Home & Rooms, chat lines 5 and 6 — rewritten.** Pass C said the bed was
   "there only to be there": asked about, answered in a word, and no part of
   the story. It was right — I had put it in for the word count. The friend now
   asks what *has* arrived, which sets up the ending. The bed keeps its own
   sentence.
2. **Fruit & Vegetables, sentence 5 — an existing line changed.** 西瓜喺夏天最好食。
   (sai1 gwaa1 hai2 haa6 tin1 zeoi3 hou2 sik6.) becomes 西瓜夏天最好食。
   (sai1 gwaa1 haa6 tin1 zeoi3 hou2 sik6.) All three passes, independently,
   pointed at the same word: 喺 (hai2) "in" before a time word is English
   grammar, and a speaker would not say it. Three signals is the playbook's bar
   for changing a line already in the app. **Its note taught that pattern as a
   rule**, so the note is rewritten too.
3. **Location & Position, sentences 8 and 9 — English corrected.** The
   Cantonese says "I'm sitting beside you" and "I'm standing in the middle";
   the draft's English had "I'll sit" and "I'll stand". The Cantonese stays.

**What the review did not find, and how to read that.** It changed four
lines in 95 and found no written-style word. Batch 1's changed five lines in
57 and found six written-style words sitting in the word lists. Two readings
of the quieter result are possible, and this process cannot tell them apart:

- **The draft is cleaner.** The word lists have been audited since, the house
  list exists, and most new sentences reuse a frame the app already has.
- **The reviewers share my blind spots.** Pass C passed 93 of 95 lines.

**Pass A's new packet did not do what was hoped.** Without the English it
still agreed with the draft on 65 of 95 lines (68%; it was 72% in batch 1 with
the English). Where it differed it mostly *added* a word — 不如 (bat1 jyu4)
"how about", 咦 (ji2) "huh", 就 (zau6), a pronoun — which makes a beginner's
line longer, not more natural. **No new line drew two signals on the same
point**, so by the rule no new line changed on phrasing.

**One pattern is worth more than its count.** In both existing sentences that
have 嘅 (ge3) for "my" or "your" — Home sentence 4 and Location sentence 3 —
pass A wrote the classifier form unprompted. Batch 1's pass A did the same
kind of thing, adding 隻 (zek3) and 對 (deoi3). Each line has one signal, so
neither changes; the pattern is item 3 below.

---

## 3. For William — six items

**The batch as a whole:** approve, change or reject.

| # | Item | What I did | Your call |
|---|---|---|---|
| 1 | **Fruit & Vegetables sentence 5** loses 喺 (hai2) — an existing line changed on three signals | Changed, with its note | Confirm, or keep the old line |
| 2 | **Home chat line 7**, 坐地板 (co5 dei6 baan2) "sit on the floor". Pass B says people say 坐地下 (co5 dei6 haa2). One signal | Kept — 地板 (dei6 baan2) is the lesson's word | If your ear agrees with pass B, the chat line changes and 地板 (dei6 baan2) gets a sentence of its own |
| 3 | **嘅 (ge3) against a classifier** — 我嘅房 (ngo5 ge3 fong2) "my room" or 我間房 (ngo5 gaan1 fong2); 你嘅銀包 (nei5 ge3 ngan4 baau1) or 你個銀包 (nei5 go3 ngan4 baau1). Two existing lines, one signal each, the same pattern as batch 1 | Kept both | If you know the classifier form is how it is said, it goes on the house list and both lines change |
| 4 | **Clothing chat line 1**, 你今晚著咩呀？ (nei5 gam1 maan5 zoek3 me1 aa3?) Pass A wrote 你今晚著咩衫呀？ (nei5 gam1 maan5 zoek3 me1 saam1 aa3?), which also brings in a lesson word. One signal | Kept | Your preference |
| 5 | **Two everyday words new to the app**, each with a note: 閂 (saan1) "to close", in 唔該閂門。 (m4 goi1 saan1 mun4.); and 戴 (daai3) "to wear" a hat or watch, in 出街記得戴帽。 (ceot1 gaai1 gei3 dak1 daai3 mou2.) | Used — they are the plain words for it | Say if either is more than a beginner should meet here |
| 6 | **The two Body Parts lines from batch 1** (below) | Proposed, not applied | Yes or no to each |

**The two Body Parts lines**, explained in chat on 2026-11-14:

| Line | Now | Proposed | Signals |
|---|---|---|---|
| Sentence 5, an existing line | 佢腳受傷。 (keoi5 goek3 sau6 soeng1.) | 佢隻腳受咗傷。 (keoi5 zek3 goek3 sau6 zo2 soeng1.) | Three — the strong case |
| Chat line 3, new in batch 1 | 點解呀？你琴日做咩？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 me1?) | 點解呀？你琴日做咗啲咩呀？ (dim2 gaai2 aa3? nei5 kam4 jat6 zou6 zo2 di1 me1 aa3?) | Two — the weaker case; it is live now, and grows from 9 characters to 11 |

---

## 4. What this run says about the playbook

1. **Five lessons in one batch worked.** The authoring is the work; the three
   passes took one to two and a half minutes each.
2. **Pass C's chat questions earned their place again** — the one real
   structural fault was theirs.
3. **Pass B found the tense slips** by plain comparison, and its "odd" notes
   were the most useful single-signal flags. Its ambiguity notes were noise
   again, four of four.
4. **Pass A is the weak pass.** Changing its packet did not make it disagree
   more usefully. It is the pass a second model family would help most
   (BACKLOG, Content).
5. **The three-signal bar did its job once**: it changed the one existing line
   that every pass pointed at, and left alone the five other existing lines
   that drew a single flag.
6. **A repeated single-signal pattern has nowhere to go** in the §4 rule
   except to William — item 3 above. Worth a line in the playbook if it
   recurs.

---

## 5. At release

*Written before approval; the release itself is in the update at the top and
in `docs/STATUS.md`, v170.*

After approval the package is the five topic files, `content-report.js` with
the five lessons deleted from `RETROFIT_PENDING`, `sw.js` at v170 with
`AUDIO_CACHE` bumped, and the docs. Audio: 36 new sentence clips on a plain
run; the 2 changed sentences and all five chats with `--force`; plus the two
Body Parts clips if item 6 is a yes. The exact commands come with the package.

---

## Home & Rooms

**Scene card — "The sofa hasn't arrived".** *Who:* You and a friend who is seeing your new flat for the first time. *Where:* In your new flat, just after moving in. *The learner wants:* To show your friend around. *Hitch:* The sofa has not been delivered yet — there is one chair and nowhere for two people to sit. *Ending:* The TV and fridge have arrived, so you sit on the floor and watch TV with a cold drink. *Setting:* Home and family.

*The chat it replaces was "Showing someone your new place", 6 lines.*

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| H-S1 | kept | 我返屋企。 (ngo5 faan1 uk1 kei2.) | I'm going home. | — | — |
| H-S2 | kept | 廁所喺邊度？ (ci3 so2 hai2 bin1 dou6?) | Where is the toilet? | — | — |
| H-S3 | kept | 我喺廚房煮飯。 (ngo5 hai2 cyu4 fong2 zyu2 faan6.) | I'm cooking in the kitchen. | **A·differs** Marked the cooking as in progress: 我喺廚房煮緊飯。 (ngo5 hai2 cyu4 fong2 zyu2 gan2 faan6.) | Kept — an existing line, one signal; needs three. |
| H-S4 | kept | 我嘅房好細。 (ngo5 ge3 fong2 hou2 sai3.) | My room is very small. | **A·differs** Used the classifier where the draft has 嘅 (ge3): 我間房好細。 (ngo5 gaan1 fong2 hou2 sai3.) | Kept — an existing line, one signal; needs three. **Listed for William.** |
| H-S5 | kept | 開窗，唔該。 (hoi1 coeng1, m4 goi1.) | Open the window, please. | **A·differs** Put the request first: 唔該開窗吖。 (m4 goi1 hoi1 coeng1 aa1.) | Kept — an existing line, one signal; needs three. |
| H-S6 | new | 我張床好舒服。 (ngo5 zoeng1 cong4 hou2 syu1 fuk6.) | My bed is very comfortable. | — | — |
| H-S7 | new | 鎖匙喺枱上面。 (so2 si4 hai2 toi2 soeng6 min6.) | The keys are on the table. | — | — |
| H-S8 | new | 唔該閂門。 (m4 goi1 saan1 mun4.) | Please close the door. | — | — |
| H-S9 | new | 雪櫃入面冇嘢食。 (syut3 gwai6 jap6 min6 mou5 je5 sik6.) | There's nothing to eat in the fridge. | — | — |
| H-S10 | new | 熄燈瞓覺喇。 (sik1 dang1 fan3 gaau3 laa3.) | Lights off, time for bed. | — | — |
| H-S11 | new | 牆上面有個鐘。 (coeng4 soeng6 min6 jau5 go3 zung1.) | There's a clock on the wall. | — | — |
| H-S12 | new | 行樓梯上去啦。 (haang4 lau4 tai1 soeng5 heoi3 laa1.) | Take the stairs up. | **A·differs** Opened with 不如 (bat1 jyu4) "how about", or with 我哋 (ngo5 dei6) "we". | Kept — one signal. 不如 (bat1 jyu4) is also a connective, which a tier-1 sentence may not carry. |
| H-S13 | new | 客廳有張大梳化。 (haak3 teng1 jau5 zoeng1 daai6 so1 faa2.) | There's a big sofa in the living room. | — | — |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| H-C1 | Friend | 嘩，你屋企好靚呀！ (waa3, nei5 uk1 kei2 hou2 leng3 aa3!) | Wow, your place is lovely! | — | — |
| H-C2 | You | 多謝！呢度係客廳。 (do1 ze6! ni1 dou6 hai6 haak3 teng1.) | Thanks! This is the living room. | — | — |
| H-C3 | Friend | 梳化喺邊度呀？ (so1 faa2 hai2 bin1 dou6 aa3?) | Where's the sofa? | **A·differs** 咦，梳化呢？ (ji2, so1 faa2 ne1?) | Kept — one signal. |
| H-C4 | You | 未到呀，得一張椅。 (mei6 dou3 aa3, dak1 jat1 zoeng1 ji2.) | It hasn't arrived — there's only one chair. | **A·differs** Named the sofa and said "delivered": 梳化未送到，得一張椅咋。 (so1 faa2 mei6 sung3 dou3, dak1 jat1 zoeng1 ji2 zaa3.)<br>**B·W** 椅 (ji2) on its own "leans written"; says speech uses 櫈 (dang3). | Kept. Pass A is one signal; pass B's point is already on the house list — 椅 (ji2) and 櫈 (dang3) were both ruled fine. |
| H-C5 | Friend | 咁有咩到咗呀？ (gam2 jau5 me1 dou3 zo2 aa3?) | So what has arrived? | **C·flow** Chat question 3: 床 (cong4) "is there only to be there" — asked about, answered in a word, and no part of the hitch or the ending.<br>**A·differs** Added 咁 (gam2) "so" at the start. | **Rewritten, with line 6** — the bed is gone and the question now sets up the ending. Before: 你間房有冇床呀？ (nei5 gaan1 fong2 jau5 mou5 cong4 aa3?) "Does your room have a bed?" |
| H-C6 | You | 電視同雪櫃都到咗。 (din6 si6 tung4 syut3 gwai6 dou1 dou3 zo2.) | The TV and the fridge have both arrived. | **A·differs** Added a closing particle: 有呀！電視同雪櫃都到咗喇。 (jau5 aa3! din6 si6 tung4 syut3 gwai6 dou1 dou3 zo2 laa3.) | **Rewritten, with line 5.** Before: 有！電視同雪櫃都到咗。 (jau5! din6 si6 tung4 syut3 gwai6 dou1 dou3 zo2.) "Yes! The TV and the fridge have arrived too." |
| H-C7 | Friend | 咁我哋坐地板睇電視啦。 (gam2 ngo5 dei6 co5 dei6 baan2 tai2 din6 si6 laa1.) | Then let's sit on the floor and watch TV. | **A·differs** Opened with 不如 (bat1 jyu4), or wrote 坐喺地板 (co5 hai2 dei6 baan2).<br>**B·note** 坐地板 (co5 dei6 baan2) "slightly unusual"; says the everyday phrase is 坐地下 (co5 dei6 haa2). | Kept — two different points, one signal each. **Listed for William.** |
| H-C8 | You | 好呀！雪櫃有汽水。 (hou2 aa3! syut3 gwai6 jau5 hei3 seoi2.) | Great! There's soda in the fridge. | — | — |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **H-C2** — 多謝，我食飽喇。 (do1 ze6, ngo5 sik6 baau2 laa3.) "Thanks, I'm full."; 我下次再嚟啦，唔該。 (ngo5 haa6 ci3 zoi3 lai4 laa1, m4 goi1.) "I'll come back next time, thanks."
- **H-C4** — 今日天氣好熱呀。 (gam1 jat6 tin1 hei3 hou2 jit6 aa3.) "The weather is very hot today."; 唔係，呢度好近。 (m4 hai6, ni1 dou6 hou2 kan5.) "No, it's very close."
- **H-C6** — 我今日唔得閒，對唔住。 (ngo5 gam1 jat6 m4 dak1 haan4, deoi3 m4 zyu6.) "I'm not free today, sorry."; 唔係，我唔鍾意食魚。 (m4 hai6, ngo5 m4 zung1 ji3 sik6 jyu2.) "No, I don't like eating fish."
- **H-C8** — 我聽日再嚟買啦。 (ngo5 ting1 jat6 zoi3 lai4 maai5 laa1.) "I'll come and buy it tomorrow."; 唔該，我要呢個。 (m4 goi1, ngo5 jiu3 ni1 go3.) "Please, I want this one."

## Common Adjectives

**Scene card — "Which queue?".** *Who:* You and a colleague. *Where:* On the street at lunchtime, outside two lunch places next to each other. *The learner wants:* To pick somewhere to eat before the lunch hour runs out. *Hitch:* One place is packed with a long queue; the other has a short queue but is known to be slow. *Ending:* The busy place serves fast, so you join its queue. *Setting:* Work.

*The chat it replaces was "Looking at a flat", 6 lines.*

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| J-S1 | kept | 呢間屋好大。 (ni1 gaan1 uk1 hou2 daai6.) | This house is very big. | — | — |
| J-S2 | kept | 我部電話太舊喇。 (ngo5 bou6 din6 waa2 taai3 gau6 laa3.) | My phone is too old. | — | — |
| J-S3 | kept | 佢行得好快。 (keoi5 haang4 dak1 hou2 faai3.) | He walks very fast. | — | — |
| J-S4 | kept | 佢哋好高。 (keoi5 dei6 hou2 gou1.) | They're very tall. | — | — |
| J-S5 | kept | 呢條裙太長喇。 (ni1 tiu4 kwan4 taai3 coeng4 laa3.) | This skirt is too long. | **B·note** 裙 (kwan4) can be a skirt or a dress. | None — ambiguity note, a kept line. |
| J-S6 | new | 呢對鞋太細喇。 (ni1 deoi3 haai4 taai3 sai3 laa3.) | These shoes are too small. | — | — |
| J-S7 | new | 今日好多人。 (gam1 jat6 hou2 do1 jan4.) | There are lots of people today. | — | — |
| J-S8 | new | 夜晚好少車。 (je6 maan5 hou2 siu2 ce1.) | There are few cars at night. | — | — |
| J-S9 | new | 行慢啲啦。 (haang4 maan6 di1 laa1.) | Walk a bit slower. | **A·differs** Added the person: 你行慢啲啦。 (nei5 haang4 maan6 di1 laa1.) | Kept — one signal. |
| J-S10 | new | 我想買部新電話。 (ngo5 soeng2 maai5 bou6 san1 din6 waa2.) | I want to buy a new phone. | — | — |
| J-S11 | new | 佢啲頭髮好短。 (keoi5 di1 tau4 faat3 hou2 dyun2.) | Her hair is very short. | — | — |
| J-S12 | new | 哥哥好高，我好矮。 (go4 go1 hou2 gou1, ngo5 hou2 ai2.) | My brother is tall; I'm short. | **A·differs** 我哥哥好高，我唔高。 (ngo5 go4 go1 hou2 gou1, ngo5 m4 gou1.) — which does not use the lesson word. | Kept — one signal. |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| J-C1 | Colleague | 嘩，呢間好多人呀！ (waa3, ni1 gaan1 hou2 do1 jan4 aa3!) | Wow, this place is packed! | **B·note** 呢間 (ni1 gaan1) says "this place" without saying what kind of place. | None — ambiguity note; the scene makes it clear. |
| J-C2 | You | 係呀，條隊好長。 (hai6 aa3, tiu4 deoi2 hou2 coeng4.) | Yeah, the queue is really long. | — | — |
| J-C3 | Colleague | 嗰間少人啲，條隊短啲。 (go2 gaan1 siu2 jan4 di1, tiu4 deoi2 dyun2 di1.) | That one has fewer people, and a shorter queue. | **A·differs** Word order: 嗰間少啲人 (go2 gaan1 siu2 di1 jan4). | Kept — one signal. |
| J-C4 | You | 不過嗰間好慢喎。 (bat1 gwo3 go2 gaan1 hou2 maan6 wo3.) | But that place is really slow. | — | — |
| J-C5 | Colleague | 咁呢間快唔快呀？ (gam2 ni1 gaan1 faai3 m4 faai3 aa3?) | So is this one fast? | — | — |
| J-C6 | You | 好快㗎！我哋排呢間啦。 (hou2 faai3 gaa3! ngo5 dei6 paai4 ni1 gaan1 laa1.) | Very fast! Let's queue here. | — | — |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **J-C2** — 我哋住喺香港。 (ngo5 dei6 zyu6 hai2 hoeng1 gong2.) "We live in Hong Kong."; 唔啱呀，太細喇。 (m4 ngaam1 aa3, taai3 sai3 laa3.) "It doesn't fit — too small."
- **J-C4** — 租金貴唔貴呀？ (zou1 gam1 gwai3 m4 gwai3 aa3?) "Is the rent expensive?"; 我聽日再睇過啦。 (ngo5 ting1 jat6 zoi3 tai2 gwo3 laa1.) "I'll have another look tomorrow."
- **J-C6** — 我今日唔得閒，對唔住。 (ngo5 gam1 jat6 m4 dak1 haan4, deoi3 m4 zyu6.) "I'm not free today, sorry."; 好貴喎，平啲得唔得？ (hou2 gwai3 wo3, peng4 di1 dak1 m4 dak1?) "That's pricey — can it be cheaper?"

## Clothing

**Scene card — "Dressing for a wedding dinner".** *Who:* You and a friend who is going to the same wedding dinner. *Where:* At your place in the evening, getting ready to leave. *The learner wants:* To get dressed and out of the door. *Hitch:* You cannot find your watch — and it is cold out tonight. *Ending:* The watch is on the table, and you take a coat and a scarf as well. *Setting:* Everyday life.

*The chat it replaces was "Shopping for clothes", 6 lines.*

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| C-S1 | kept | 我想買件新衫。 (ngo5 soeng2 maai5 gin6 san1 saam1.) | I want to buy a new top. | — | — |
| C-S2 | kept | 呢對鞋幾錢呀？ (ni1 deoi3 haai4 gei2 cin2 aa3?) | How much are these shoes? | — | — |
| C-S3 | kept | 今日好凍，記得著外套。 (gam1 jat6 hou2 dung3, gei3 dak1 zoek3 ngoi6 tou3.) | It's cold today, remember to wear a coat. | **C·H** Nine characters with one lesson word, and a statement plus a reminder in two clauses. | Kept. The spec lists a sentence of 9–12 with one lesson word; it does not fail it (tier-1 spec §4.3, §4.6). An existing line, one signal. |
| C-S4 | kept | 你條裙好靚！ (nei5 tiu4 kwan4 hou2 leng3!) | Your dress is so pretty! | **B·note** 裙 (kwan4) can be a skirt or a dress. | None — ambiguity note, a kept line. |
| C-S5 | kept | 我搵唔到對襪。 (ngo5 wan2 m4 dou2 deoi3 mat6.) | I can't find my socks. | — | — |
| C-S6 | new | 呢條褲太長喇。 (ni1 tiu4 fu3 taai3 coeng4 laa3.) | These trousers are too long. | — | — |
| C-S7 | new | 出街記得戴帽。 (ceot1 gaai1 gei3 dak1 daai3 mou2.) | Remember to wear a hat when you go out. | — | — |
| C-S8 | new | 返工要著恤衫。 (faan1 gung1 jiu3 zoek3 seot1 saam1.) | You have to wear a shirt to work. | — | — |
| C-S9 | new | 佢著西裝好靚仔。 (keoi5 zoek3 sai1 zong1 hou2 leng3 zai2.) | He looks handsome in a suit. | — | — |
| C-S10 | new | 夏天我著短褲。 (haa6 tin1 ngo5 zoek3 dyun2 fu3.) | In summer I wear shorts. | — | — |
| C-S11 | new | 呢條頸巾係邊個㗎？ (ni1 tiu4 geng2 gan1 hai6 bin1 go3 gaa3?) | Whose scarf is this? | — | — |
| C-S12 | new | 呢隻手錶好貴。 (ni1 zek3 sau2 biu1 hou2 gwai3.) | This watch is very expensive. | — | — |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| C-C1 | Friend | 你今晚著咩呀？ (nei5 gam1 maan5 zoek3 me1 aa3?) | What are you wearing tonight? | **A·differs** Named the thing worn: 你今晚著咩衫呀？ (nei5 gam1 maan5 zoek3 me1 saam1 aa3?) | Kept — one signal. **Listed for William.** |
| C-C2 | You | 我著西裝同白恤衫。 (ngo5 zoek3 sai1 zong1 tung4 baak6 seot1 saam1.) | A suit and a white shirt. | **A·differs** Dropped the subject, or wrote 白色恤衫 (baak6 sik1 seot1 saam1). | Kept — one signal. |
| C-C3 | Friend | 好靚喎！著邊對鞋呀？ (hou2 leng3 wo3! zoek3 bin1 deoi3 haai4 aa3?) | Nice! Which shoes? | **A·differs** 幾好喎！你著邊對鞋呀？ (gei2 hou2 wo3! nei5 zoek3 bin1 deoi3 haai4 aa3?) | Kept — one signal. |
| C-C4 | You | 黑色嗰對。我隻手錶呢？ (hak1 sik1 go2 deoi3. ngo5 zek3 sau2 biu1 ne1?) | The black ones. Where's my watch? | **A·differs** Added 咦 (ji2) "huh" before the question. | Kept — one signal. |
| C-C5 | Friend | 喺枱上面。今晚好凍㗎。 (hai2 toi2 soeng6 min6. gam1 maan5 hou2 dung3 gaa3.) | On the table. It's cold tonight, you know. | **A·differs** 喺張枱度呀。 (hai2 zoeng1 toi2 dou6 aa3.) for the first half. | Kept — one signal. |
| C-C6 | You | 咁我帶埋外套同頸巾。 (gam2 ngo5 daai3 maai4 ngoi6 tou3 tung4 geng2 gan1.) | Then I'll bring a coat and a scarf too. | — | — |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **C-C2** — 我想買對鞋。 (ngo5 soeng2 maai5 deoi3 haai4.) "I want to buy a pair of shoes."; 唔係，我唔鍾意食魚。 (m4 hai6, ngo5 m4 zung1 ji3 sik6 jyu2.) "No, I don't like eating fish."
- **C-C4** — 我今日唔得閒，對唔住。 (ngo5 gam1 jat6 m4 dak1 haan4, deoi3 m4 zyu6.) "I'm not free today, sorry."; 有冇大啲嘅碼？ (jau5 mou5 daai6 di1 ge3 maa5?) "Do you have a bigger size?"
- **C-C6** — 係呀，我哋聽日朝早十點見。 (hai6 aa3, ngo5 dei6 ting1 jat6 ziu1 zou2 sap6 dim2 gin3.) "Yes, see you at ten tomorrow morning."; 咁你自己搵下啦。 (gam2 nei5 zi6 gei2 wan2 haa5 laa1.) "Then look for it yourself."

## Fruit & Vegetables

**Scene card — "Fruit after dinner".** *Who:* You and a friend who has just cooked you dinner. *Where:* At their flat, at the table after the meal. *The learner wants:* To have some fruit — strawberries, ideally. *Hitch:* Their daughter has eaten every strawberry. *Ending:* You have grapes instead, and your friend sends you home with oranges. *Setting:* Home and family.

*The chat it replaces was "At the fruit stall", 6 lines.*

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| V-S1 | kept | 我每日食一個蘋果。 (ngo5 mui5 jat6 sik6 jat1 go3 ping4 gwo2.) | I eat an apple every day. | — | — |
| V-S2 | kept | 呢啲生果好甜。 (ni1 di1 saang1 gwo2 hou2 tim4.) | These fruits are very sweet. | — | — |
| V-S3 | rewritten | 你鍾意食邊種生果？ (nei5 zung1 ji3 sik6 bin1 zung2 saang1 gwo2?) | Which fruit do you like? | — | — |
| V-S4 | kept | 我想買啲薯仔同番茄。 (ngo5 soeng2 maai5 di1 syu4 zai2 tung4 faan1 ke2.) | I want to buy some potatoes and tomatoes. | — | — |
| V-S5 | kept | 西瓜夏天最好食。 (sai1 gwaa1 haa6 tin1 zeoi3 hou2 sik6.) | Watermelon is best in summer. | **A·differs** Wrote it without 喺 (hai2): 夏天嘅西瓜最好食。 (haa6 tin1 ge3 sai1 gwaa1 zeoi3 hou2 sik6.)<br>**B·note** 喺 (hai2) before the time word "feels a little translated"; says speech has 西瓜夏天最好食 (sai1 gwaa1 haa6 tin1 zeoi3 hou2 sik6).<br>**C·S** "A speaker would drop 喺 (hai2) before 夏天 (haa6 tin1)" — a textbook rendering of the English "in summer". | **Changed** — an existing line, three signals. Before: 西瓜喺夏天最好食。 (sai1 gwaa1 hai2 haa6 tin1 zeoi3 hou2 sik6.) "Watermelon is best in summer." |
| V-S6 | new | 食多啲蔬菜啦。 (sik6 do1 di1 so1 coi3 laa1.) | Eat more vegetables. | **B·W** 蔬菜 (so1 coi3) is the formal word; says speech has 食多啲菜啦 (sik6 do1 di1 coi3 laa1). | Kept. 蔬菜 (so1 coi3) is the lesson's word, and on the house list as fine beside 菜 (coi3). |
| V-S7 | new | 馬騮鍾意食香蕉。 (maa5 lau1 zung1 ji3 sik6 hoeng1 ziu1.) | Monkeys like eating bananas. | — | — |
| V-S8 | new | 呢個橙好多汁。 (ni1 go3 caang2 hou2 do1 zap1.) | This orange is very juicy. | — | — |
| V-S9 | new | 啲提子好新鮮。 (di1 tai4 zi2 hou2 san1 sin1.) | The grapes are very fresh. | — | — |
| V-S10 | new | 士多啤梨好貴呀！ (si6 do1 be1 lei2 hou2 gwai3 aa3!) | Strawberries are so expensive! | **A·differs** 嘩，啲士多啤梨好貴呀！ (waa3, di1 si6 do1 be1 lei2 hou2 gwai3 aa3!) | Kept — one signal. |
| V-S11 | new | 今晚炒菜心啦。 (gam1 maan5 caau2 coi3 sam1 laa1.) | Let's stir-fry choy sum tonight. | **A·differs** 今晚不如炒菜心啦。 (gam1 maan5 bat1 jyu4 caau2 coi3 sam1 laa1.) | Kept — one signal. 不如 (bat1 jyu4) is also a connective. |
| V-S12 | new | 我唔食紅蘿蔔。 (ngo5 m4 sik6 hung4 lo4 baak6.) | I don't eat carrots. | — | — |

**Rewritten in step 1, before any review:** 你鍾意食邊種菜？ (nei5 zung1 ji3 sik6 bin1 zung2 coi3?) "Which vegetables do you like?" became 你鍾意食邊種生果？ (nei5 zung1 ji3 sik6 bin1 zung2 saang1 gwo2?). The old line asked about 菜 (coi3), which is not one of this lesson's words, so the sentence practised none of them. The frame is kept and the last word changed to a lesson word.

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| V-C1 | Friend | 食飽未？食啲生果啦。 (sik6 baau2 mei6? sik6 di1 saang1 gwo2 laa1.) | Had enough? Have some fruit. | **A·differs** Asked where the draft urges: 食飽未呀？食唔食生果？ (sik6 baau2 mei6 aa3? sik6 m4 sik6 saang1 gwo2?) | Kept — one signal. |
| V-C2 | You | 好呀！有咩生果呀？ (hou2 aa3! jau5 me1 saang1 gwo2 aa3?) | Lovely! What fruit is there? | — | — |
| V-C3 | Friend | 有西瓜，蘋果同提子。 (jau5 sai1 gwaa1, ping4 gwo2 tung4 tai4 zi2.) | There's watermelon, apples and grapes. | — | — |
| V-C4 | You | 有冇士多啤梨呀？ (jau5 mou5 si6 do1 be1 lei2 aa3?) | Are there any strawberries? | — | — |
| V-C5 | Friend | 冇喇，我個女食晒喇。 (mou5 laa3, ngo5 go3 neoi2 sik6 saai3 laa3.) | None left — my daughter ate them all. | — | — |
| V-C6 | You | 咁我要提子啦。 (gam2 ngo5 jiu3 tai4 zi2 laa1.) | Then I'll have grapes. | **A·differs** 咁我食提子啦。 (gam2 ngo5 sik6 tai4 zi2 laa1.) — "eat" where the draft has "want". | Kept — one signal. |
| V-C7 | Friend | 好甜㗎。帶啲橙返屋企啦。 (hou2 tim4 gaa3. daai3 di1 caang2 faan1 uk1 kei2 laa1.) | They're really sweet. Take some oranges home. | **A·differs** Named the grapes: 啲提子好甜㗎。 (di1 tai4 zi2 hou2 tim4 gaa3.) | Kept — one signal. |
| V-C8 | You | 多謝！我最鍾意食橙。 (do1 ze6! ngo5 zeoi3 zung1 ji3 sik6 caang2.) | Thanks! Oranges are my favourite. | — | — |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **V-C2** — 今日天氣好熱呀。 (gam1 jat6 tin1 hei3 hou2 jit6 aa3.) "The weather is very hot today."; 唔係，呢度好近。 (m4 hai6, ni1 dou6 hou2 kan5.) "No, it's very close."
- **V-C4** — 租金貴唔貴呀？ (zou1 gam1 gwai3 m4 gwai3 aa3?) "Is the rent expensive?"; 我唔記得放咗邊。 (ngo5 m4 gei3 dak1 fong3 zo2 bin1.) "I can't remember where I put it."
- **V-C6** — 我幫你搵過啦。 (ngo5 bong1 nei5 wan2 gwo3 laa1.) "I'll look again for you."; 我哋住喺香港。 (ngo5 dei6 zyu6 hai2 hoeng1 gong2.) "We live in Hong Kong."
- **V-C8** — 唔係，我今日要返工。 (m4 hai6, ngo5 gam1 jat6 jiu3 faan1 gung1.) "No, I have to work today."; 唔啱呀，太細喇。 (m4 ngaam1 aa3, taai3 sai3 laa3.) "It doesn't fit — too small."

## Location & Position

**Scene card — "Where are you?".** *Who:* You and a friend you have arranged to meet. *Where:* On the phone, both of you somewhere outside an MTR station. *The learner wants:* To find each other in the crowd. *Hitch:* You are both 'outside' and neither can see the other. *Ending:* Your friend turns out to be standing right next to the bus stop you are at — you are behind them. *Setting:* Everyday life.

*The chat it replaces was "Where is it?", 6 lines.*

### Sentences

| # | Status | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| L-S1 | kept | 我喺屋企。 (ngo5 hai2 uk1 kei2.) | I'm at home. | — | — |
| L-S2 | kept | 隻貓喺枱下面。 (zek3 maau1 hai2 toi2 haa6 min6.) | The cat is under the table. | — | — |
| L-S3 | kept | 你嘅銀包喺袋入面。 (nei5 ge3 ngan4 baau1 hai2 doi2 jap6 min6.) | Your wallet is inside the bag. | **A·differs** Used the classifier where the draft has 嘅 (ge3): 你個銀包喺袋入面。 (nei5 go3 ngan4 baau1 hai2 doi2 jap6 min6.)<br>**B·note** 袋 (doi2) can be a bag or a pocket. | Kept — an existing line, one signal; needs three. |
| L-S4 | kept | 銀行喺郵局隔籬。 (ngan4 hong4 hai2 jau4 guk2 gaak3 lei4.) | The bank is next to the post office. | — | — |
| L-S5 | kept | 我哋喺呢度等你。 (ngo5 dei6 hai2 ni1 dou6 dang2 nei5.) | We'll wait for you here. | — | — |
| L-S6 | new | 部電話喺床上面。 (bou6 din6 waa2 hai2 cong4 soeng6 min6.) | The phone is on the bed. | — | — |
| L-S7 | new | 出面落緊雨。 (ceot1 min6 lok6 gan2 jyu5.) | It's raining outside. | **A·differs** Added 而家 (ji4 gaa1) "now". | Kept — one signal. |
| L-S8 | new | 我坐喺你旁邊。 (ngo5 co5 hai2 nei5 pong4 bin1.) | I'm sitting beside you. | **B·M** Translated it "I'm sitting next to you"; the lesson's English said "I'll sit beside you".<br>**B·W** 旁邊 (pong4 bin1) "leans written"; says the usual spoken word is 隔籬 (gaak3 lei4). | **English corrected** to "I'm sitting beside you." The Cantonese is unchanged: 旁邊 (pong4 bin1) is the lesson's word and was ruled fine. |
| L-S9 | new | 我企喺中間。 (ngo5 kei5 hai2 zung1 gaan1.) | I'm standing in the middle. | **B·M** Translated it "I'm standing in the middle"; the lesson's English said "I'll stand in the middle". | **English corrected** to "I'm standing in the middle." |
| L-S10 | new | 廁所喺嗰度。 (ci3 so2 hai2 go2 dou6.) | The toilet is over there. | — | — |
| L-S11 | new | 餐廳喺前面。 (caan1 teng1 hai2 cin4 min6.) | The restaurant is up ahead. | **A·differs** 餐廳就喺前面。 (caan1 teng1 zau6 hai2 cin4 min6.) | Kept — one signal. |
| L-S12 | new | 小心，後面有車！ (siu2 sam1, hau6 min6 jau5 ce1!) | Careful, there's a car behind you! | — | — |

### Chat

| # | Who | Line | English | Flags | What was done |
|---|---|---|---|---|---|
| L-C1 | Friend | 喂，你喺邊度呀？ (wai2, nei5 hai2 bin1 dou6 aa3?) | Hello, where are you? | — | — |
| L-C2 | You | 我喺地鐵站出面。 (ngo5 hai2 dei6 tit3 zaam6 ceot1 min6.) | I'm outside the MTR station. | — | — |
| L-C3 | Friend | 我都喺出面，見唔到你喎。 (ngo5 dou1 hai2 ceot1 min6, gin3 m4 dou2 nei5 wo3.) | I'm outside too — I can't see you. | **A·differs** Joined the halves with 但係 (daan6 hai6) "but". | Kept — one signal. It would also add a connective. |
| L-C4 | You | 我喺巴士站前面呀。 (ngo5 hai2 baa1 si2 zaam6 cin4 min6 aa3.) | I'm in front of the bus stop. | **A·differs** 我企喺巴士站前面。 (ngo5 kei5 hai2 baa1 si2 zaam6 cin4 min6.) | Kept — one signal. |
| L-C5 | Friend | 巴士站？我喺隔籬喎！ (baa1 si2 zaam6? ngo5 hai2 gaak3 lei4 wo3!) | The bus stop? I'm right next to it! | **A·differs** 吓？我就喺巴士站隔籬喎！ (haa2? ngo5 zau6 hai2 baa1 si2 zaam6 gaak3 lei4 wo3!) | Kept — one signal. |
| L-C6 | You | 睇下後面，我喺呢度呀！ (tai2 haa5 hau6 min6, ngo5 hai2 ni1 dou6 aa3!) | Look behind you — I'm right here! | **A·differs** Opened with 見到你喇！ (gin3 dou2 nei5 laa3!) "I can see you!" | Kept — one signal. |

**Fill-the-Gap options for the learner's lines** (the first is the line itself):

- **L-C2** — 今日天氣好熱呀。 (gam1 jat6 tin1 hei3 hou2 jit6 aa3.) "The weather is very hot today."; 唔該，我要呢個。 (m4 goi1, ngo5 jiu3 ni1 go3.) "Please, I want this one."
- **L-C4** — 好貴喎，平啲得唔得？ (hou2 gwai3 wo3, peng4 di1 dak1 m4 dak1?) "That's pricey — can it be cheaper?"; 我聽日再嚟買啦。 (ngo5 ting1 jat6 zoi3 lai4 maai5 laa1.) "I'll come and buy it tomorrow."
- **L-C6** — 我今日唔得閒，對唔住。 (ngo5 gam1 jat6 m4 dak1 haan4, deoi3 m4 zyu6.) "I'm not free today, sorry."; 我聽日再睇過啦。 (ngo5 ting1 jat6 zoi3 tai2 gwo3 laa1.) "I'll have another look tomorrow."
