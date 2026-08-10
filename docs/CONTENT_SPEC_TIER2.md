# CONTENT SPEC — Tier 2 (Intermediate)

*The authoring rules for a tier-2 round, so every one delivers a consistently
harder experience. Read this before authoring or retrofitting a tier-2 lesson.
`CONTENT.md` records what exists and what is planned; this file records how to
build one.*

Last updated: 2026-08-10 · sw.js at v127

> **Provenance.** This is spec v2, previously held outside the repo as
> `intermediate-tier2-content-spec-v1.md` — a filename that said v1 while the
> content said v2, which is worth one line as a warning. Brought into `docs/` on
> 2026-08-02 so it has version history like everything else. The rules are
> unchanged; the *status* sections (§9, §10) are reconciled against what is
> actually built, and the checkable targets in §8 now name the script that
> checks them. Two things the spec asserted have since been overtaken by
> reality and are marked inline.

---

## 0. Philosophy

The point of tier 2 is **not more vocabulary** — it is teaching how words combine
into longer, more natural, more situationally real Cantonese. Tier 1 gives the
bricks; tier 2 teaches building. Every rule below serves that shift.

---

## 1. The tier-1 ↔ tier-2 contract

Tier 2 deliberately **inverts** tier 1's balance: fewer new words, more and
longer sentences, a richer conversation.

| Dimension | Tier 1 | Tier 2 |
|---|---|---|
| New words | 10–18 | **8–10** (stretch to 12 only if the domain genuinely warrants it) |
| Sentences | 5 | **7–8** |
| Sentence length | ~4–8 characters | **~8–16 characters** |
| Sentences with a connective or 2-clause structure | rare | **at least half** |
| Known-vocab reuse per sentence | n/a | **≥1 already-known word** |
| Sentence notes | sparse | **content-driven, topic-specific** (see §5) |
| Conversation lines | 6–7 | **8–10** |
| Register | neutral | **flag formal/casual where it matters** |

The vocab count *dropping* is intentional. It signals that formation, not
breadth, is the tier-2 work.

---

## 2. Entry gate — does the topic earn a tier 2 at all?

A tier-2 round is justified only if it adds at least one of:

- **Grammar depth** — a structure harder than tier 1 (aspect contrasts, layered
  particles, comparatives, multi-clause).
- **Situational depth** — real scenarios beyond naming things: complaining,
  negotiating, explaining a problem, making or declining plans.
- **Register range** — a formal/polite or slang register distinct from tier 1's
  neutral.

**If the only thing tier 2 would add is more nouns in the same register, do not
author one.** The topic is complete at tier 1. This gate is the reason
`CONTENT.md` §5 lists thirteen topics as likely to stay tier-1 permanently.

---

## 3. Vocabulary rules

1. **8–10 new words**; up to 12 only when the domain warrants it.
2. **Escalation, not parallel nouns.** Tier-2 vocab is the same domain at higher
   complexity, specificity or register — 身體 (san1 tai2) goes anatomy → symptoms
   → 睇醫生 (tai2 ji1 sang1) "seeing a doctor"; feelings goes emotional states →
   personality traits such as 善良 (sin6 loeng4) "kind".
3. **Teach chunks, not just words.** Include multi-syllable expressions learned
   as single units — verb-object collocations like 睇醫生 (tai2 ji1 sang1) "see a
   doctor" and 講價 (gong2 gaa3) "haggle", set phrases like 唔好意思
   (m4 hou2 ji3 si3) "excuse me". A word's `c` field holds multi-character
   strings, so the data model already supports this.
4. **No tier-1 repeats.** A tier-2 word must not already be in the topic's tier-1
   list.
5. **Connectives are not topic vocab.** They live in the connectives lesson
   (§6). Keep each topic's word list specific to its own domain.

---

## 4. Sentence and conversation rules

**Sentences — 7–8 per round.**

1. Target **8–16 characters** — visibly longer than tier 1's short frames.
2. **At least half carry a connective or a genuine two-clause structure.**
3. **Every sentence reuses at least one already-known word** — tier 1 of this
   topic, or vocab from an earlier topic. This is what makes the sentences sound
   natural rather than a string of new terms, and it is spaced retrieval for
   free.
4. **A `bd` breakdown on every sentence**, covering all tokens. Group a
   multi-syllable word as **one** item — 善良 (sin6 loeng4) is one breakdown
   item, not 善 (sin6) + 良 (loeng4).
5. Each new word appears in at least one sentence, ideally recurring in the
   conversation.

**Conversation — 8–10 lines.** This is the centrepiece of a tier-2 round;
dialogue is where connectives and register live most naturally.

1. Some turns should be **multi-clause**, not one-liners.
2. **Recycle the round's new vocab and deliberately fold in tier-1 words**, so
   it consolidates rather than introducing yet more.
3. **Register-true** — a doctor's visit, a formal greeting and haggling with a
   vendor should not sound alike.
4. **Every user turn (`u: true`) needs `opts` and `optsJ`, three each, first =
   canonical.** Without them the Fill-the-Gap activity is hidden for the whole
   conversation. See `CONTENT.md` §4 for the 19 conversations this already
   affects.

---

## 5. Notes rules

A tier-2 sentence note explains the **topic-specific** formation point in that
sentence — not the connective.

1. **Cover the topic-specific thing:** classifiers (味 (mei6) / 碟 (dip6) for
   dishes), vocab escalation (肚餓 (tou5 ngo6) from 餓 (ngo6)), chunk usage
   (食飽 (sik6 baau2)), collocations, register, word order, cultural points.
   These are unique to each topic, so notes never run dry.
2. **Do not teach connectives here.** A note may mention one in passing if it
   genuinely clarifies the sentence, but must not explain it — that happens once,
   in the connectives lesson. **If a sentence's only teaching point is a
   connective, it gets no note.** This is why a spec-compliant round can sit at
   5/8 notes and still be complete.
3. **Content-driven density.** Note wherever there is a real topic point.
   Not forced one-per-sentence.
4. **Skip true repetition** — omit a note when an earlier note in the same round
   made the identical point.
5. **House style:** plain language; every Chinese character immediately followed
   by jyutping in brackets; `<strong>` reserved for the single key concept term.

---

## 6. The connectives lesson

Connectives are the backbone that makes Intermediate harder, and they are taught
**once**, in a dedicated lesson placed first in the Intermediate path. Every
later tier-2 topic then *uses* them freely and *assumes* them. This is what keeps
topic notes focused and stops them drying up.

The lesson deliberately breaks the standard shape: it is a **tier-1 round that is
sentence-led rather than vocab-led**, because a connective is meaningless alone.
As built it carries 16 words and 20 sentences — four times the normal tier-1
sentence count — grouped by function, with notes grouped one per function cluster
plus near-synonym distinctions (但係 (daan6 hai6) vs 不過 (bat1 gwo3); 同埋
(tung4 maai4) vs 而且 (ji4 ce2) vs 仲 (zung6)) rather than one per word. It
includes combination sentences that stack two or more connectives — the real
Intermediate target.

The core set:

- 因為…所以 (jan1 wai6…so2 ji5) "because…so"
- 如果…就 (jyu4 gwo2…zau6) "if…then"
- 雖然…但係 (seoi1 jin4…daan6 hai6) "although…but"
- 不過 (bat1 gwo3) "however"
- 而且 (ji4 ce2) / 仲 (zung6) "moreover / also"
- 同埋 (tung4 maai4) "and"
- 先…然後 (sin1…jin4 hau6) / 跟住 (gan1 zyu6) "first…then / next"
- 之後 (zi1 hau6) / 之前 (zi1 cin4) "after / before"
- 一…就 (jat1…zau6) "as soon as…"
- 或者 (waak6 ze2) / 不如 (bat1 jyu4) "or / how about"

A second band — 反而 (faan2 ji4), 結果 (git3 gwo2), 即係 (zik1 hai6), 為咗
(wai6 zo2), 除咗…仲 (ceoi4 zo2…zung6) — is added as it surfaces in later topics.

**Parked for Advanced:** a tier-2 round of complex and written connectives —
無論…都 (mou4 leon4…dou1), 既然 (gei3 jin4), 否則 (fau2 zak1), 與其…不如
(jyu5 kei4…bat1 jyu4). Noted, not built.

---

## 7. Register

Tier 2 is where formal/polite and casual diverge. Where a topic has a clear
register — medical, workplace, formal greeting, market haggling — pick one
consistently for the round and call it out in a note.

---

## 8. Checkable targets

`node tools/content-report.js` prints a **Tier-2 spec compliance** table
measuring the countable half of this spec: word count, sentence count,
connective density, average sentence length, conversation length, notes present.
A round scoring clean on all six is marked *spec v2*; one miss is *review*; two
or more is *PRE-SPEC*.

**The connective figure is a floor, not a measurement.** It is a substring test
against the §6 list, so a two-clause sentence built without one of those words
counts as a miss. That is why one miss reads as *review* rather than a verdict —
`greetings` tier 2 sits there, and wants a human read rather than a rewrite.

Three targets are **not** machine-checkable and stay a human job:

- **≥1 already-known word per sentence** — needs a global vocab index at the
  point in the curriculum where the sentence sits.
- **Escalation rather than parallel nouns** — the §2 gate is a judgement.
- **Register consistency.**

Also run `node tools/validate.js` after any data change, for ID and reference
integrity.

> **Overtaken by reality (1 of 2).** The original spec listed "a jsdom
> render-check on notes" as a required step, run via `render-check-all.js`.
> **That script is not in the repo** — it lived at a path in an old working copy
> and has not been carried forward. Either rebuild it as a `tools/` script or
> drop the requirement; what is not acceptable is a spec that names a check
> nobody can run.

---

## 9. Sense-check status

- **Notes** → topic-specific only, content-driven density; connectives moved to
  their own lesson. *Resolved by the food sense-check.*
- **Word count** → 8–10 (stretch 12) confirmed comfortable. *Resolved.*
- **Sentence count 7–8 and conversation length 8–10** → the original spec left
  these to "confirm by feel once food is built". **Nine rounds have now been
  built to them and none has been flagged**, so treat them as confirmed unless
  device testing says otherwise.
- **A harder, negotiation-heavy topic** → the second sense-check was to be
  `shopping`. It was built (bargaining, payment, returns) and scores clean on all
  six countable targets, so the spec holds on that shape.

---

## 10. Retrofitting pre-spec tier-2 rounds

Six tier-2 rounds predate this spec: `greetings`, `numbers` (sou3 zi6), `food`,
`shopping`, `body` (san1 tai2), `feelings`. Retrofitting them is **part of
Intermediate v1 scope**, not a separate cleanup.

**Five are done.** `food` and `shopping` were retrofitted with I-4, `greetings`,
`feelings` and `body` with I-5, and all five score clean.

**`numbers` tier 2 is the one survivor** — 5 sentences averaging 5.8 characters,
no connectives, no notes, a 6-line conversation. It is the only round in the app
scoring *PRE-SPEC*, and it retrofits when I-2 Sentence Grammar is built, which is
the chapter it belongs to.

Two other reconciliations came out of the same audit and are done: `food` tier 2
overlapped the Beginner drinks topic, and `shopping` tier 2 was carrying clothing
content. `shopping` was refocused onto bargaining and payment, which displaced
its sizing vocabulary — 試吓 (si3 haa5), 尺碼 (cek3 maa5), 緊 (gan2), 鬆 (sung1),
大碼 (daai6 maa5), 細碼 (sai3 maa5). **That vocabulary belongs in a
`clothing` tier 2** and is queued in `CONTENT.md` §5.

> **Overtaken by reality (2 of 2).** The original spec and build plan both
> describe a checkpoint as *Words / Patterns / Conversation*. **Patterns were
> removed from the app entirely**, so a checkpoint is Words / Conversation and
> the third slot is an open design question — see `CONTENT.md` §5.4. Nothing in
> the authoring rules depends on this; only the checkpoint description was stale.

---

## 11. Workflow

1. **Author into a proposal `.md` first** — it doubles as the review document.
   Ask before building.
2. Parse and inject into `data/topics/<key>.json`.
3. Mint IDs with `tools/mint-ids.js` / `tools/mint-sentence-ids.js`. Never by
   hand, never reuse a retired ID.
4. Update `data/topics_index.json` — tier list **and** word count. This is
   derived data maintained by hand and it has drifted before; check 7 in
   `content-report.js` exists because of it.
5. `node tools/validate.js` and `node tools/content-report.js --check`.
6. Generate audio with `tools/generate-audio.js` — **Azure AI Speech, `zh-HK`
   Neural** (the default since v123; `SPEECH_KEY` + `SPEECH_REGION`) — and commit
   the files. **Content without audio is a silent lesson.** Do not fall back to
   `--provider=google`: Chirp3-HD cannot say a bare syllabic nasal, so any new
   sentence containing 唔 (m4) or 五 (ng5) would come back with a vowel inserted.
7. Wire the stage in `learning_paths.json` and its checkpoint conversation in
   `path_convos.json`.
8. **If the topic is new**, add its key to `TOPIC_KEYS` in `sw.js`.
9. Bump `CACHE_VERSION` in `sw.js`. Data files are precached, so a content
   change needs a bump exactly like a shell change does.
