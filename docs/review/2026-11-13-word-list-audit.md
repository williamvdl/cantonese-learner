# Word-list audit — are the app's words the ones people say?

*Run 2026-11-13 against v167, over all 585 words in all 42 lessons, both tiers.
Prompted by batch 1's review, which found written-style words in the Family and
Animals word lists, and by the native speaker's rule that followed: **always
the spoken word, never the written one — the app teaches people to speak.***

> **Status: ANSWERED 2026-11-13 — results in §8, applied at v168.** A native
> speaker answered 31 of the 32 questions the same evening. §1–§7 are as
> written before her answers.

---

## 1. How it was done

Three independent signals for each word:

1. **Say the word.** A fresh AI session saw only each word's English meaning
   and its lesson, and was asked for the word a Hong Kong speaker would say.
   It never saw the app's word.
2. **Check the word.** A second fresh session saw the app's word, jyutping and
   meaning, and was asked to flag a written-style word (with the spoken one) or
   a reading that does not match speech. It was told not to flag to be safe.
3. **The spoken corpus.** How often the app's word and the proposed one appear
   in HKCanCor's 153,656 words of transcribed Hong Kong speech.

**The rule for a candidate, set before the results were read:** the second
pass flags the word, **and** at least one other signal agrees — the first pass
chose a different word, or the corpus has none of the app's word and some of
the alternative. One signal alone is recorded and not asked.

**Why two signals.** On 2026-11-11 a single AI signal flagged 14 lines and a
native speaker confirmed 3. On 2026-11-13 seven flags that had two or more
signals behind them were confirmed 7 of 7. This audit uses the stricter test.

---

## 2. What came back

| Measure | Count |
|---|---|
| Words checked | 585 |
| First pass chose the app's own word | 495 first choice; 535 as either choice |
| Second pass flagged as written-style | 27 |
| Second pass flagged the reading | 10 |
| Of the 27, candidates under the rule | 25 |
| Already answered by the native speaker on 2026-11-13 | 6 words and 2 readings |
| **New word questions** | **19** |
| **New reading questions** | **8** |
| Asked on weaker evidence (§5) | 5 |

**The rule dropped two flags, and it was right to.** Both were 嗎 (maa3), the
question particle, in Particles and in Question Words. Only the second pass
objected; the first pass offered 嗎 (maa3) itself; the corpus has it 650 times.
The native speaker had already marked questions ending in 嗎 (maa3) as fine.

---

## 3. Word candidates


| Lesson | Meaning | The app's word | Proposed spoken word | In the spoken corpus |
|---|---|---|---|---|
| Body Parts | Ears | 耳 (ji5) | 耳仔 (ji5 zai2) | 0 against 1 |
| Clothing | Scarf | 圍巾 (wai4 gan1) | 頸巾 (geng2 gan1) | 0 against 0 |
| Colors | Brown | 棕色 (zung1 sik1) | 啡色 (fe1 sik1) | 0 against 8 |
| Cooking & Kitchen | Soy sauce | 醬油 (zoeng3 jau4) | 豉油 (si6 jau4) | 0 against 0 |
| Feelings & Emotions | Excited | 激動 (gik1 dung6) | 興奮 (hing1 fan5) | 2 against 1 |
| Friends & Social | Party | 派對 (paai3 deoi3) | party (paa1 ti4) | 0 against 7 |
| Friends & Social | cancel on someone | 爽約 (song2 joek3) | 放飛機 (fong3 fei1 gei1) | 0 against 0 |
| Home & Rooms | Chair | 椅 (ji2) | 櫈 (dang3) | 0 against 0 |
| Hotels & Accommodation | Service staff | 服務員 (fuk6 mou6 jyun4) | 職員 (zik1 jyun4) | 0 against 2 |
| Hotels & Accommodation | Room | 房間 (fong4 gaan1) | 房 (fong2) | 0 against 13 |
| Location & Position | Beside | 旁邊 (pong4 bin1) | 側邊 (zak1 bin1) | 1 against 2 |
| Money & Banking | ATM | 提款機 (tai4 fun2 gei1) | 櫃員機 (gwai6 jyun4 gei1) | 0 against 0 |
| Office & Work | Work / job | 工作 (gung1 zok3) | 做嘢 (zou6 je5) | 25 against 24 |
| Shopping | Change money | 找換 (zaau2 wun6) | 唱錢 (coeng3 cin2) | 0 against 0 |
| Technology | Screen | 屏幕 (ping4 mok6) | 螢幕 (jing4 mok6) | 0 against 0 |
| Tourist Attractions | Take photos | 拍照 (paak3 ziu3) | 影相 (jing2 soeng2) | 0 against 6 |
| Useful Phrases | Please speak slowly | 請講慢啲 (cing2 gong2 maan6 di1) | 唔該講慢啲 (m4 goi1 gong2 maan6 di1) | 0 against 0 |
| Verb Tense | just now | 剛剛 (gong1 gong1) | 啱啱 (ngaam1 ngaam1) | 0 against 40 |

**One more, of a different kind.** 晚上好 (maan5 soeng6 hou2) "Good evening", in Greetings: the
second pass says it is a Mandarin-style greeting not used in Hong Kong speech
at all, and the first pass did not produce it. The sheet asks whether people
say it, rather than offering a replacement.

**Read these with care.** Several are not a straight swap:

- 派對 (paai3 deoi3) against the English word "party", and 截止日期
  (zit6 zi2 jat6 kei4) against "deadline": the claim is that speakers use the
  English. If so, the app has to decide how to write and voice an English word
  — the same question BB raises.
- 工作 (gung1 zok3) against 做嘢 (zou6 je5): one is a noun, the other a verb.
  The lesson's sentences decide which it needs.
- 激動 (gik1 dung6) against 興奮 (hing1 fan5): the claim is about meaning —
  that the app's word means "agitated", not "excited".
- 椅 (ji2) against 櫈 (dang3): the app already writes 櫈 (dang3) in the
  Location lesson.

---

## 4. Reading candidates

The audio is not at issue here — it is made from the characters. What may be
wrong is the jyutping a learner reads.

| Lesson | Word | The app's reading | Proposed | A dictionary says |
|---|---|---|---|---|
| Body Parts | 藥房 "Pharmacy" | joek6 fong2 | joek6 fong4 | joek6 fong4 |
| Drinks | 凍檸茶 "Iced lemon tea" | dung3 ning4 caa4 | dung3 ning2 caa4 | dung3 ning2 caa4 |
| Hobbies & Free Time | 聽歌 "Listen to music" | ting1 go1 | teng1 go1 | teng1 go1 |
| Meat & Seafood | 鴨 "Duck" | aap3 | aap2 | aap3 |
| Modal Verbs | 扮 "To pretend / to act as" | ban6 | baan6 | baan6 |
| Money & Banking | 散紙 "Coins / small change" | saan3 zi2 | saan2 zi2 | saan2 zi2 |
| Restaurant & Ordering | 餐牌 "Menu" | caan1 paai4 | caan1 paai2 | caan1 paai2 |
| Sentence Particles | 囉 "(obviously / exasperation)" | lo3 | lo1 | lo1 |

The dictionary is rime-cantonese, through PyCantonese. It agrees with the
proposed reading on seven of the eight; on 鴨 "duck" it gives aap3, the app's
reading. It gives formal readings and does not always show the changed tones of
speech — it had 弟弟 as dai6 dai6, where the native speaker said dai4 dai2 —
so it supports a candidate but does not settle one.

**扮 "to pretend" is the likeliest plain error:** the app has ban6, which is
not a reading of the character at all.

---

## 5. Asked on weaker evidence

These did not meet the rule: the second pass let each one through. They are on
the sheet because something else pointed at them.

| Lesson | Meaning | The app's word | Alternative | Why it is asked |
|---|---|---|---|---|
| Office & Work | Deadline | 截止日期 (zit6 zi2 jat6 kei4) | deadline (det1 laai1) | First pass chose otherwise; corpus 0 against 2 |
| Feelings & Emotions | Kind | 善良 (sin6 loeng4) | 好人 (hou2 jan4) | First pass chose otherwise; corpus 0 against 9 |
| Friends & Social | Invite | 邀請 (jiu1 cing2) | 請 (ceng2) | First pass chose otherwise; corpus 0 against 71 |
| Fruit & Vegetables | Vegetables | 蔬菜 (so1 coi3) | 菜 (coi3) | Flagged twice at sentence level in batch 1, in the Animals lesson |
| Body Parts | Back | 背 (bui3) | 背脊 (bui3 zek3) | First pass chose otherwise; also the batch 1 author's doubt |

---

## 6. What this audit cannot see

- **It is one kind of model checking another.** Two sessions agreeing is better
  than one, and the corpus is a different sort of evidence, but a word all
  three miss stays missed. The 28 words where the first pass chose differently
  and nothing else agreed were recorded and not asked.
- **The corpus is small and from 1997–98.** 184 of the 585 words do not appear
  in it at all, most of them ordinary — 馬騮 (maa5 lau1) "monkey", 蘋果
  (ping4 gwo2) "apple". Absence alone means little; it counts only beside
  another signal.
- **It checked words, not sentences.** A written-style word inside a sentence
  or chat line, where it is not a lesson word, is not covered. The retrofit
  reads those lesson by lesson.
- **Grammar words were checked from a description.** For particles and
  classifiers the first pass had only a gloss to go on, so its disagreement
  there carries little weight.

---

## 7. What happens with the answers

Each word the native speaker changes is a change to that lesson's word list,
and it ripples: the word's audio, every drill that copies the word, any note
that names it, and any sentence or chat line that uses it. Batch 1 showed the
size of it — six words and two readings touched two topic files, 11 drill
entries, one pattern note and two sentence notes.

So the confirmed changes are best made **lesson by lesson, as each lesson is
retrofitted**, with one exception: a confirmed wrong **reading** is a small,
safe fix that can go out at once.

---

## 8. Results — answered 2026-11-13

31 of 32 answered, on the tappable sheet.

### Words

| Outcome | Count | Which |
|---|---|---|
| **Replace the app's word** | 5 | 興奮 (hing1 fan5) for "excited"; the English word "party"; 唱錢 (coeng3 cin2) for "change money"; 頸巾 (geng2 gan1) for "scarf"; 啡色 (fe1 sik1) for "brown" |
| **Both fine — no change** | 11 | Beside, chair, just now, take photos, work, soy sauce, service staff, please speak slowly, ears, screen, room |
| **The app's word is the right one** | 1 | 提款機 (tai4 fun2 gei1) "ATM" — she chose it over the proposed word |
| **Said sometimes — no change** | 1 | 晚上好 (maan5 soeng6 hou2) "good evening" |
| Not answered | 1 | 爽約 (song2 joek3) "cancel on someone" |
| **Weaker-evidence group** | 5 of 5 both fine | No change to any |

### Readings

| Word | Outcome |
|---|---|
| 藥房 "pharmacy" | **Fixed:** joek6 fong4 |
| 餐牌 "menu" | **Fixed:** caan1 paai2 |
| 扮 "to pretend" | **Fixed:** baan6 |
| 散紙 "small change" | **Fixed:** saan2 zi2 |
| 聽歌 "listen to music" | **Fixed:** teng1 go1 |
| 囉, the "obviously" particle | **Fixed:** lo1 |
| 鴨 "duck" | The app was right: aap3 |
| 凍檸茶 "iced lemon tea" | The app was right: dung3 ning4 caa4 — against both the reviewer and the dictionary |

### What the results say about the method

- **"Is the proposed word said?" — almost always yes.** 16 of 18.
- **"Is the app's word wrong?" — much less often.** 5 of 18. The reviewers
  were right that a more everyday word exists, and wrong, eleven times, that
  the app's word is not also said. A two-signal flag on a *word* is a good
  reason to ask and a poor reason to change.
- **Readings did better: 6 of 8**, and 8 of 10 counting the two from batch 1.
  One of the two misses had the dictionary on the reviewer's side, so the
  dictionary does not settle a reading either.
- **The weaker-evidence group produced nothing**, 0 of 5. The rule that kept
  them off the main list was drawing the line in about the right place.
- **Counting batch 1's six**, two-signal word flags were confirmed as
  replacements 11 times in 24. Batch 1's were 6 of 6 because they also had the
  sentence-level passes behind them — the more signals, the better the odds.

### Applied at v168

Six readings here and two from batch 1, everywhere each appears; and ten word
replacements — four from this audit and six from batch 1.

**Held back:** 找換 (zaau2 wun6) to 唱錢 (coeng3 cin2). The Money lesson
already teaches 唱錢 (coeng3 cin2), so the swap would make Shopping teach a
word twice. That is a decision about the Shopping word list, not a correction.

**A consequence to check by ear:** 係囉 (hai6 lo1) "exactly" appears in three
other lessons' chats — Comparisons, Weather and Particles — and one option in
Friends. They follow the particle's confirmed reading. The confirmation was of
the particle on its own, so one of these lines is worth a listen.
