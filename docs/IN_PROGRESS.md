# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-11-06 · sw.js at v164

## v164 — Body's doctor chat line reads 係咪 (hai6 mai6) — delivered, not yet deployed

The learner line 要唔要食藥？係咪要去醫院？ (jiu3 m4 jiu3 sik6 joek6? hai6 mai6 jiu3 heoi3 ji1 jyun2?) in Body's *At the doctor* chat had jyutping for 係唔係 (hai6 m4 hai6). Fixed in its line, its first answer option and its word breakdown. Data only: `body.json` and the `sw.js` bump. No audio — the recording was made from the characters and already says 係咪.

**QA, screens that changed:** Body's Chat, *At the doctor*, line 6 — the jyutping under the line, under its first answer option in Fill the Gap, and in its word breakdown all read hai6 mai6.
**Screens sharing the changed code, to confirm only:** none; data only.

**Next candidate work:** saving every audio clip for offline ahead of time and, once a few real failures have been read, removing v161's temporary speech-failure line (both new at v161); writing in the characters for
the 16 jyutping-only phrases in topic intro notes (BACKLOG § Content), styling the styleguide's speak demos, an aggregating runner
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
