# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-23 · sw.js at v154

## v154 — replay while speaking, and the icon file rename — awaiting deploy and device QA

A play button top-right of the speak card in the checkpoint's sentence review
and in Chat's Speak mode (MOCK-38-corner). In the checkpoint it appears only
after an attempt or *Show me the answer* (DES-59). The detail is in the STATUS
row. **Built and checked in a browser, not yet on the Pixel.**

**The v153 icon should arrive with this deploy.** The PNGs are renamed, so
Chrome sees an icon URL it hasn't fetched before. Open the installed app once
after deploying, then close it; Chrome may ask you to confirm the new icon. If
the old icon is still there a day later with the phone charged on Wi-Fi, remove
and reinstall. **v153 is otherwise confirmed on the device** — nameplate, status
bar and the *Jyut* label, from William's screenshots and report on 2026-09-23.

**Blocked on nothing.**

**Next candidate work after QA:** styling the styleguide's speak demos (new, in
BACKLOG), an aggregating runner for the standing checks, the 168 Check B
structural candidates from `dup-css.js` (needs William's judgement), the 4
remaining Check A rule-splits, the open particle-rule question, and the
`char-jyutping.json` coverage measurement. All in BACKLOG.md.

### Standing checks — twelve: eleven exit 0, `dup-css.js` exits 1 on four known

`validate.js` (now also asserting the chrome colours), `jyutping-check.js`,
`wiring-check.js`, `nav-harness.js`, `tier-harness.js`, `dead-css.js`,
`sentence-pool-harness.js`, `sentence-review-harness.js`, `snapshot-harness.js`,
`gap-opts-check.js` and `asr-replay-harness.js` all exit 0 at v154. **`dup-css.js`
exits 1**, and did at v152 too: its Check A gates on any same-selector duplicate,
and the four it finds are the known rule-splits in BACKLOG. The count is still 4
at v154; Check B structural rose from 164 to 168 with v154's four contextual
`.cp-convo` recolours, the same shape as the group they joined. This section used to say *"all green"*, which was wrong; see
STATUS § Notes worth carrying forward. Check B is informational and never gates.

## Previously

**v153 shipped (2026-09-23)** — the product named *Jyut*, its nameplate, icon and
status bar. Confirmed on the device except the icon, which v154 re-delivers.

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
