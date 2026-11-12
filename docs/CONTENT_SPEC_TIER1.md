# CONTENT SPEC — Tier 1 (Beginner)

*The authoring rules for a tier-1 lesson, so every one is as simple as the last.
Read this before authoring a new topic or retrofitting an existing tier-1
lesson. `CONTENT.md` records what exists and what is planned; this file records
how to build one. Its sibling is `CONTENT_SPEC_TIER2.md`.*

Last updated: 2026-11-12 · sw.js at v167

> **Status: APPROVED by William, 2026-11-12.** Tier 1 had never had a written
> spec — CONTENT.md §3 only described what was built. This is the first one,
> drafted 2026-11-11 and approved the next day with three changes, recorded in
> §9. Every rule below carries one of two marks:
>
> - **Decided** — William has settled it, with the date.
> - **As built** — it describes how tier 1 already is, measured on the corpus at
>   v166. Writing it down changes nothing; it stops it drifting.

---

## 0. Philosophy

**Tier 1 gives the bricks.** A learner meets a small set of everyday words,
hears each one used in a short sentence, and then uses them in a simple chat.
Nothing in a tier-1 lesson should need a grammar explanation to get through.

**Simple is not the same as thin.** Until 2026-11-11 a tier-1 lesson had 5
sentences, and a third of the app's words were never heard in use inside their
own lesson. The lesson rules fix the thinness — more sentences, every word
used. This spec makes sure they do not fix it by making tier 1 *harder*. The
extra sentences are more of the same simple kind, not longer ones.

**The difference from tier 2 is what a sentence is, not how many there are.**
Both tiers now ask for 8 or more sentences. Tier 1 keeps every one short and
single-minded for the whole Beginner path; tier 2 belongs to the Intermediate
path and gets progressively longer and harder (William, 2026-11-11). The
side-by-side table is CONTENT_SPEC_TIER2.md §1.

---

## 1. The shape of a tier-1 lesson

| Part | Rule | Mark |
|---|---|---|
| Words | 10–12, or 13–18 for a naturally closed set | As built |
| Sentences | At least 8; at least 10 for 13+ words. A minimum — more is fine | Decided 2026-11-11 |
| Sentence length | Aim for 4–8 characters; up to 12 with two lesson words | Decided 2026-11-11 |
| Word use | Every word in a sentence (13+ words: a sentence or the chat) | Decided 2026-11-11 |
| Chat | 6–8 lines; 8 for 13+ words. The learner speaks half | Decided 2026-11-11 (8 lines); otherwise as built |
| Chat line length | Aim for up to 9 characters; over 12 is flagged | Decided 2026-11-12 |
| Connectives | None in a sentence; at most two lines of a chat | Decided 2026-11-12 |

The four **lesson rules** — sentence count, word use, on-topic sentences, the
chat's share of the words — are stated once, in CONTENT.md §3, and enforced by
`content-report.js --check`. They are not restated here, so the two cannot
drift. Everything else in this file is the part that is particular to tier 1.

---

## 2. Entry gate — does the topic earn a lesson?

*Decided 2026-11-12.* A new tier-1 topic should pass all three:

1. **A learner would want these words in the first months.** The app is for all
   learners (William, 2026-11-11) — family and everyday talk, travel, work — so
   a topic may serve any of them, but it should serve at least one plainly.
2. **The words belong together.** One domain, one situation. A list that needs
   two different chats to use its words is two topics.
3. **The words can be used in short sentences.** If most of them only make
   sense inside a longer structure, the topic belongs at tier 2.

---

## 3. Vocabulary rules

1. **10–12 words is the default.** *As built:* 34 of the 41 ordinary tier-1
   lessons have 10–12.
2. **13–18 only for a naturally closed set** — family members, body parts, days
   and months — where leaving some out would feel like a gap. *As built:* seven
   lessons. **Over 18, split the topic.** *Decided 2026-11-12.*
3. **Everyday spoken forms.** The word as people say it, not as it is written:
   係 (hai6), not 是 (si6); 食 (sik6), not 吃 (hek3). *As built.*
4. **One word, one spelling**, across the whole corpus. The rule and the
   variants table are in CONTENT.md §3. *As built.*
5. **A set phrase may be a word.** Where the thing a learner needs is a whole
   chunk — 埋單 (maai4 daan1) "ask for the bill" — teach the chunk. *As built.*
6. **No two words a beginner cannot tell apart.** Near-synonyms and register
   pairs wait for tier 2, which is where the difference can be explained.
   *Decided 2026-11-12.*

---

## 4. Sentence rules

**How many** is a lesson rule (CONTENT.md §3). **What kind** is this section.

1. **Aim for 4–8 Chinese characters.** *Decided 2026-11-11, as a guide with
   exceptions, not a hard cap. As built:* 204 of 212 tier-1 sentences (96%) are
   8 or under; the middle one is 5. Very short is fine — 轉左。 (zyun3 zo2.)
   "Turn left." is a complete, useful sentence.
2. **Up to 12 is allowed when the sentence carries two of the lesson's words.**
   我想買啲薯仔同番茄。 (ngo5 soeng2 maai5 di1 syu4 zai2 tung4 faan1 ke2.)
   "I want to buy some potatoes and tomatoes." is 9 characters and earns them:
   it puts two words to use in one familiar frame. *Decided 2026-11-11.*
3. **Over 8 without a second lesson word is listed; over 12 is flagged** for a
   rewrite or a split into two sentences. *Decided 2026-11-11. As built:* two
   are listed and one is flagged — a 19-character sentence in Days & Time that
   packs in four weekdays.
4. **One idea per sentence.** One thing said, asked or asked for. If the
   English needs "and", "but" or "because" to join two thoughts, it is two
   sentences. Joining two *lesson words* with 同 (tung4) "and" is the one
   exception, and it is what rule 2 is for. *Decided 2026-11-12.*
5. **No connective words in a sentence.** *As built:* none of the 212 carries
   one. Connectives have their own lesson, and it is the one tier-1 lesson
   exempt from this section.
6. **A short pair of clauses is fine, sparingly.** A set phrase and a request —
   唔該，埋單。 (m4 goi1, maai4 daan1.) "Excuse me, the bill please." — or two
   very short clauses side by side — 落雨喇，帶遮啦。
   (lok6 jyu5 laa3, daai3 ze1 laa1.) "It's raining, bring an umbrella." *As
   built:* 22 of 212 sentences (10%) have a comma, and all but four are 8
   characters or under. **Keep it near one in ten.** *Decided 2026-11-12.*
7. **The words around the lesson word are simple, and right for a beginner
   sentence.** They do not have to be words the learner has already been
   taught. A beginner cannot be given sentences built only from familiar words
   — words have to be introduced for there to be a sentence at all, most of all
   in the early lessons. What matters is that the surrounding words are common,
   everyday and plain, so the sentence is easy to take in and the lesson word
   stands out. **Reuse words the path has already taught wherever it is
   natural**, and expect to do so more as the path goes on, because there are
   more of them to reuse. A human judgement, not a check. *Decided 2026-11-12 —
   William's rewording of the draft, which had asked for the surrounding words
   to be already familiar.*
8. **Reach for a frame the app already uses before inventing one.** A new
   sentence that is an existing sentence's shape with a different word in the
   slot is the lowest-risk line there is, and repetition of a frame is how a
   beginner absorbs it. *Decided 2026-11-12.*
9. **A `bd` breakdown on every sentence**, covering every token. *As built:*
   every sentence has one.

---

## 5. Chat rules

1. **6–8 lines; 8 for a lesson of 13 or more words.** *As built:* 40 of 41 are
   6 lines. *Decided 2026-11-11:* the 13+ lessons go to 8 lines, and that is
   still simple enough.
2. **The learner speaks half the lines.** *As built:* 3 of 6 in all 40
   six-line chats.
3. **Aim for up to 9 characters a line; over 12 is flagged.** *As built:* 228
   of 247 lines (92%) are 9 or under, and one is over 12. *Decided 2026-11-12.*
4. **Keep a turn to one thing, as a rule — but let the chat flow.** Most turns
   ask, answer or react, and do only that. The natural exception is a quick
   answer followed by a question back: that is how real conversation keeps
   moving, and a chat made only of single-purpose turns stalls into an
   interview. Allow it wherever it is what a speaker would do, and keep both
   halves short. *Decided 2026-11-12 — William's change to the draft, which had
   allowed no exceptions.*
5. **A plain connective may appear in a chat, in at most two lines.** Speech
   needs them more than drill sentences do — 仲 (zung6) "also", 但係
   (daan6 hai6) "but", 不過 (bat1 gwo3) "but". *As built:* 21 of 247 lines (9%)
   carry one, never more than three in one chat. *Decided 2026-11-12.*
6. **A scene card before any Cantonese.** Five lines: who the two speakers are
   to each other, where they are, what the learner wants, one small hitch or
   choice, how it ends. It fixes the register before a line is written, and a
   chat with a goal and a hitch is engaging almost by construction; one without
   is a vocabulary quiz taken in turns. *Decided 2026-11-12.*
7. **Words earn their place in the scene.** The chat must use half the lesson's
   words (a lesson rule), but never by bending the scene. A word that will not
   fit naturally goes in a sentence instead. *Decided 2026-11-12.*
8. **Every learner turn has `opts` and `optsJ`**, three each, the first the
   canonical line. *As built:* all 41. The four Fill-the-Gap rules are in
   CONTENT.md §3.
9. **A named speaker matches the voice that reads the part.** CONTENT.md §3.
   *As built.*
10. **Each scene declares its setting** — home and family, everyday life,
    travel, or work — and no two lessons share a scene. *Decided 2026-11-12.
    Needs a field in the data and is not built yet; until it is, the setting is
    stated on the scene card.*

---

## 6. Notes rules

1. **A topic intro note** where there is something a learner should know before
   starting — a pattern the whole lesson shares, a cultural point. *As built:*
   23 of 41 have one. Not required.
2. **A sentence note says one thing**, about the lesson word or the frame, in
   plain language. *As built:* 185 of 212 sentences (87%) have one.
3. **No note for the sake of it.** A sentence with nothing to explain gets none.
4. **House style** — `<strong>` for the single key term, and every Chinese term
   as characters then jyutping in brackets — is CONTENT.md §3, *Writing Chinese
   in English text*. Not restated here.

---

## 7. Register

**Neutral, everyday, spoken.** What a Hong Kong speaker would say to a friend,
a relative or a shopkeeper. No written-Chinese forms, no slang, no formal
register — those are tier 2's to introduce and explain. *As built* in intent;
the written-form scan that would hold it is proposed, not built
(`PROPOSAL-content-playbook.md` §4, H7).

---

## 8. Checkable targets

`node tools/content-report.js` prints two tables for tier 1.

**Lesson rules — enforced.** Sentence count, word use, on-topic sentences and
the chat's share of the words. `--check` fails a new lesson that breaks one.

**Tier-1 shape — reported, never enforced.** Because the length rules are a
guide with exceptions, nothing in this table can fail a check. It counts, and
lists by name:

- sentences over 12 characters — the flag line;
- sentences of 9–12 with no second lesson word;
- sentences carrying a connective;
- chat lines over 12 characters;
- chats with a connective in more than two lines.

Length is counted in Chinese characters only. `connectives` is exempt.

**As of v166:** one sentence and one chat line are over the flag line, two
sentences are listed, no sentence carries a connective, and one chat —
Adjectives — carries a connective in three lines.

Not machine-checkable, and a human job:

- one idea per sentence, and whether a two-part turn is natural;
- whether the surrounding words are simple enough for a beginner;
- whether the scene is worth having;
- whether a line sounds natural — the subject of
  `PROPOSAL-content-playbook.md` §6.

---

## 9. Decision record

**2026-11-11.** Sentence length is a guide with exceptions, not a hard cap
(§4.1–§4.3). An 8-line chat is simple enough for a lesson of 13 or more words
(§5.1).

**2026-11-12.** William approved every proposed rule in the draft, with three
changes:

1. **Surrounding words (§4.7).** The draft asked for them to be already
   familiar. Changed: that is impossible for a beginner, since words have to be
   introduced to make a sentence. They need only be simple and right for a
   beginner sentence, with taught words reused where natural.
2. **One thing per turn (§5.4).** The draft allowed no exceptions. Changed: a
   quick answer and a question back is natural, and keeps a chat flowing.
3. **Retrofitting (§10).** The draft said to add and not rewrite, and to append
   to a chat rather than insert. Changed: quality comes first. Tier 1 is the
   beginner section and has to land well with any user, so content that does
   not meet this spec is rewritten, and a chat is rebuilt where that makes it
   better. The extra effort is accepted.

Approved as drafted: chat line length; the connective limits; short clause
pairs near one sentence in ten; one idea per sentence; reusing a frame before
inventing one; the scene card, and words never forced into a scene; the entry
gate, the 18-word ceiling and no near-synonym pairs; a declared setting for
each scene.

**2026-11-12, from the native-ear review sheet.** An agreeing reply is 好呀
(hou2 aa3), not 好的 (hou2 dik1) — marked off both times it appeared.
`docs/review/2026-11-11-native-ear-sheet-RESULTS.md`.

---

## 10. Retrofitting an existing tier-1 lesson

The plan is CONTENT.md §5.9; `content-report.js --worklist` is the list.

**The goal is that every tier-1 lesson meets this spec — not that the old
content is disturbed as little as possible.** *Decided 2026-11-12.* A retrofit
is finished when the lesson would pass if it were being authored new today.

1. **Read every existing sentence and chat line against this spec first** —
   not only the ones a script lists. Length and word use are counted for you;
   one idea per sentence, simple surrounding words, a natural register and a
   scene worth having are not.
2. **A sentence that meets the spec stays.** There is no merit in rewriting a
   good line, and it has already been heard in use.
3. **A sentence that does not meet the spec is rewritten**, not worked around.
   So is one that is within the rules but weak — a frame no beginner would
   need, a lesson word used awkwardly.
4. **Then add**, aiming each new sentence at a word the worklist says is unused,
   in a frame the lesson or another tier-1 lesson already has. Two unused words
   in one sentence is good where they sit together naturally; that is what the
   9–12 allowance is for, and it is how an 18-word lesson is covered in 10
   sentences.
5. **Rebuild a chat where that makes it better.** Write the scene card (§5.6)
   for the chat as it should be, then decide: if the existing lines serve that
   scene, extend them; if they do not, or if the best place for a new line is
   in the middle, rewrite or insert freely. Do not bend a chat to keep its old
   lines.
6. **Audio follows the text — and the file names will not remind you.**
   - *Chats* are filed by line position (`topic-<key>-r1-line03.mp3`). Insert,
     remove or reorder a line and every line after it sits on the wrong
     recording. **After any change to a chat other than adding lines at the
     end, regenerate the whole chat:** `generate-audio.js --force=<key>`.
   - *Sentences* are filed by ID (`<key>-t1-s03.mp3`), and by precedent a
     rewritten sentence keeps the ID of the slot it replaces (v69, v81). So the
     file name does not change, a plain run of the generator sees the file
     already there and skips it, and the old recording plays under the new
     text. **Regenerate with `--force` for every rewritten sentence.**
   - *Either way, bump `AUDIO_CACHE` in `sw.js`.* Since v161 the app keeps
     every clip it has played, in a cache that deploys do not clear. A clip
     regenerated under its old name is never fetched again until that cache's
     name changes. New files need no bump; replaced ones do.
7. **New sentences need new IDs** — `tools/mint-sentence-ids.js`, never by hand.
8. **Delete the lesson from `RETROFIT_PENDING`** in `content-report.js` in the
   same commit, once it passes.
9. **A full native review of each batch**, with every correction logged before
   and after (CONTENT.md §5.9). A rewrite is new content and is reviewed as
   such; it does not inherit the old line's standing.

**One thing not settled:** a learner's saved progress is keyed to a sentence's
ID. When a sentence is rewritten in place, that progress now points at a
different sentence. Past rewrites accepted this. If it should instead be reset
for rewritten sentences, that is an app change, not a content one.

---

## 11. Workflow

**`CONTENT_PLAYBOOK.md` is the procedure** — the twelve steps from scoping a
lesson to releasing it, including the independent AI review and the native
review. This spec says what a tier-1 lesson must be; the playbook says how one
gets made and checked. The mechanics of getting content into the data — IDs,
the topics index, audio, wiring — are CONTENT_SPEC_TIER2.md §11.
