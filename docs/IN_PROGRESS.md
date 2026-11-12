# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-11-12 · sw.js at v167

## Now — the content playbook and the lesson rules

**The aim (William, 2026-11-06 and 2026-11-11):** new topics that are natural
and relevant, QA'd by rules, needing minimal native review — content as the
app's point of difference. The plan is `PROPOSAL-content-playbook.md`.

**Built, tools only — no deploy, no `sw.js` bump:** the four lesson rules in
`tools/content-report.js`, held by `--check` as a ratchet, with `--worklist` for
what each lesson lacks. 8 of 52 lessons meet them; 44 are pending. The rules
are stated in CONTENT.md §3, *Lesson rules*.

**Decided:** the sentence minimum applies to tier 1 and the retrofit is
approved; tier 2 is "8 or more"; the word-use and conversation values; the app
is for all learners. **And on 2026-11-12:** the tier-1 spec
(`CONTENT_SPEC_TIER1.md`) is approved, with three changes recorded in its §9;
and the retrofit is quality-first — content that does not meet the spec is
rewritten, not worked around.

**The review sheet is back** (2026-11-12,
`docs/review/2026-11-11-native-ear-sheet-RESULTS.md`). All 14 random lines were
marked fine. Of the 14 the register scan flagged, 3 were confirmed: 好的
(hou2 dik1) as a reply is out, twice; 想要 (soeng2 jiu3) and questions ending
in 嗎 (maa3) are fine and come off the list. The scan's markers had been an
AI's guess at what sounds written, and four in five of its flags were wrong —
the measurement that an AI reviewer must be calibrated before it is trusted.

**v167 — the three lines the sheet marked off are fixed** in the data
(Days & Time chat lines 4 and 6, Numbers chat line 6). **Their audio is not
regenerated yet** — that is William's step, three commands in STATUS's v167
row — and the characters for the first were written from the reviewer's
jyutping and want her glance.

**Next, in order:**
- **William reviews `CONTENT_PLAYBOOK.md`** — the procedure, drafted
  2026-11-12, and the four open questions in its §6. The independent AI review
  in it has been defined but never run.
- **Retrofit batch 1, as the playbook's pilot** — Family, Body Parts, Animals &
  Pets, the three lessons with the most unused words. Not before the playbook
  is agreed.

**Open questions:**
- A rewritten sentence keeps its ID, so a learner's saved progress follows it
  onto a different sentence. Accepted before; the retrofit will do it at scale.

- The history count found only five recorded native corrections, so there is
  nothing yet to test an AI reviewer against. The retrofit's correction log is
  meant to build it (CONTENT.md §5.9).

**Next candidate work (everything else):** saving every audio clip for offline ahead of time and, once a few real failures have been read, removing v161's temporary speech-failure line (both new at v161); styling the styleguide's speak demos, an aggregating runner
for the standing checks, the 169 Check B structural candidates from
`dup-css.js` (needs William's judgement), the 4 remaining Check A rule-splits,
the open particle-rule question, and the `char-jyutping.json` coverage
measurement. All in BACKLOG.md.

### Standing checks — thirteen: twelve exit 0, `dup-css.js` exits 1 on four known

`validate.js` (now also asserting the chrome colours), `jyutping-check.js`,
`wiring-check.js`, `nav-harness.js`, `tier-harness.js`, `dead-css.js`,
`sentence-pool-harness.js`, `sentence-review-harness.js`, `snapshot-harness.js`,
`gap-opts-check.js` and `asr-replay-harness.js` all exit 0 at v155, and all
of them plus `tools/speech-silence-harness.js` (new at v160: the silence guard,
pinned against eleven real recordings) exit 0 at v160. **`dup-css.js`
exits 1**, and did at v152 too: its Check A gates on any same-selector duplicate,
and the four it finds are the known rule-splits in BACKLOG. The count is still 4
at v155; Check B structural is 169 — up from 164 with v154's four contextual
`.cp-convo` recolours and v155's `.lesson-note > .eyebrow`, all the same shape
as rules already accepted. **At v160 Check A is still 4; Check B structural is
179**: the ten new ones are `.mic-btn.checking` refining `.mic-btn`, the same
state-modifier shape as `.mic-btn.listening`, and `.key-row .apikey-input`, one
contextual margin. **At v161 all thirteen were re-run: twelve exit 0, Check A
4, Check B structural 179 — unchanged. At v163 the same: all thirteen re-run,
twelve exit 0, `dup-css.js` output identical to v161.** This section used to say *"all green"*, which was wrong; see
STATUS § Notes worth carrying forward. Check B is informational and never gates.

## Previously

**v164, v165 and v166 shipped and device QA is done (2026-11-06).** Body's doctor chat line reads 係咪 (hai6 mai6) (v164); every term in the topic intro notes has its characters and its reading (v165); every sentence note does too, the two notes v148's find-and-replace broke are mended, and `jyutping-check.js` §10 holds intro and sentence notes at zero (v166). CONTENT.md §3 now states the character-and-reading rule in full. `tools/note-pairs-measure.js` is a **closed diagnostic**: it answered its question and stays in `tools/` for `patterns.json` before any revival. Confirmed on the Pixel. Outcomes and bug-pattern notes are in STATUS.md; the open follow-ups — the Attractions sign wording, multi-bold intro notes, the dormant patterns file — are in BACKLOG.md and CONTENT.md §4.

**v155 to v159 device QA is done (confirmed 2026-11-06).** Larger tabs and labels (v155), Saying More moved ahead of Food & Drink on the Beginner path (v156), the Adjectives sentence 佢哋好高 (keoi5 dei6 hou2 gou1) and the rewritten Modal Verbs chat (v157), the checkpoint Words quiz playing its own listen prompts (v158), and the full word under "You chose" in quiz results (DES-60, v159). All confirmed on the Pixel. v156's "watch in use" note, on the first food lesson now coming 14th, moved to BACKLOG § Content beside the Saying More follow-up.

**v154 shipped and device QA is done (2026-09-23)** — the replay buttons, and the new icon after an uninstall and reinstall.

**v162 and v163 shipped together and device QA is done (2026-11-06).** Topic intro notes put the character first — 80 reversals across 15 topics, now caught by `jyutping-check.js` §8 (DES-64) — and a correctly said sentence reads back exactly as its lesson on every "You said" line, 哥哥 (go4 go1) included, with one shared punctuation list that now covers ； (DES-65). Confirmed on the Pixel, including the screens sharing the changed code. Outcomes and four bug-pattern notes are in STATUS.md; the follow-ups found on the way are in BACKLOG.md.

**v160 and v161 shipped and device QA is done (2026-11-04).** Speaking keeps
listening through pauses, via Azure, on all four speak surfaces (DES-61, DES-62,
MOCK-40-B), then the two follow-ups from QA: a retry with a temporary failure
line, and audio failure messages plus offline audio (DES-63). Outcomes, the
probe results and two new bug-pattern notes are in STATUS.md. The three
listening probes are closed and stay in `tools/` with the other diagnostics.

**v153 shipped (2026-09-23)** — the product named *Jyut*, its nameplate, icon and
status bar. Confirmed on the device; the icon needed v154 and a reinstall.

**v152 shipped and device QA is done (2026-09-20).** The DES-57 same-sound rule
is closed out across three deploys, all confirmed on the Pixel: v150 the rule
itself, v151 readings resolved per whole string, v152 a fold no longer blocked by
the four-character floor. The notes are in STATUS.md. If a fourth defect surfaces
on this rule, instrument the matcher end to end rather than patch the next symptom.

**v138 and v139 shipped and this file is cleared down again.** A
commercial-readiness review was written up as `docs/PRODUCTISATION_REVIEW.md` —
standalone, deliberately not yet referenced from BACKLOG.md — and its Part C
work is complete: `tools/wiring-check.js` (v138), the four dead controls it
found, the `snapshot-harness.js` `NAV_FIELDS` drift, and then the delegation
refactor itself with DES-47 (v139). Nothing from that arc is open.

**v139 device QA is done** — confirmed on the Pixel, nothing to carry.

**v140 shipped and its device QA is done.**

**v141 shipped and device QA is done** — speak-back on the Translate screen
(DES-49, MOCK-30-A) plus the CJK Extension A jyutping fix that building it
uncovered. Confirmed on the Pixel, including the three screens sharing the
changed code.

**The Gemini model trial ran and is closed.** Result and reasoning are in
STATUS.md; the follow-up candidate is in BACKLOG.md. Nothing from it is open.

## Nothing in progress

**v144, v145 and v146 shipped and device QA is done** — the forgiven-particle
display fix and the 架 (gaa3) variant (DES-53), the sentence-review summary row
(DES-54, MOCK-31-B), and Fill-the-Gap options for the last nine topic
conversations. All three confirmed on the Pixel 2026-09-12. Nothing from them is
open; the reasoning, and the one limit on what the v144 tick actually proves,
are in the STATUS rows.

This file is cleared down. **Next candidate work:** the cross-rule
duplicate-declaration script, and the open question about extending the particle
rule beyond the final position. Both are in BACKLOG.md with their measurements.

**Two things carried in BACKLOG.md rather than here, because nothing waits on
them:** a clean rerun of the Translate false-reject probe with the disposition
asked before the verdict is shown (DES-50), and the orthographic variant fold
(`docs/PROPOSAL-variant-fold.md`), deferred pending recurrence in ordinary use.
