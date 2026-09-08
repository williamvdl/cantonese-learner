# IN_PROGRESS — Tea House Cantonese Learner

*Only what's actively being worked on right now, with the reasoning and open
questions behind it. Meant to be short-lived — when a piece ships, fold its
outcome into STATUS.md and clear this file back down for the next thing.*

Last updated: 2026-09-05 · sw.js at v141

## Nothing in progress

**v138 and v139 shipped and this file is cleared down again.** A
commercial-readiness review was written up as `docs/PRODUCTISATION_REVIEW.md` —
standalone, deliberately not yet referenced from BACKLOG.md — and its Part C
work is complete: `tools/wiring-check.js` (v138), the four dead controls it
found, the `snapshot-harness.js` `NAV_FIELDS` drift, and then the delegation
refactor itself with DES-47 (v139). Nothing from that arc is open.

**v139 device QA is done** — confirmed on the Pixel, nothing to carry.

**v140 shipped and its device QA is done.**

**v141 is delivered and device QA is under way** — speak-back on the Translate
screen (DES-49, MOCK-30-A) plus the CJK Extension A jyutping fix that building
it uncovered. Confirmed good so far on the Pixel; the three screens sharing the
changed code (Learn sentence sheet, Chat speak mode, checkpoint sentence review)
are confirming absence of change rather than judging anything.

**One open item carried from v141, deliberately not blocking it.** The
false-reject probe behind this feature came back inconclusive through a flaw in
its own design (DES-50) — the graded panel ships anyway on an argument that does
not rest on the number. If it disappoints in use, the fallback is the ungraded
"here's what I heard" panel DES-38 already permits, and that needs no further
measurement. A clean rerun is in BACKLOG.md rather than here, because nothing is
waiting on it.

## Next up — Gemini model trial

Agreed sequence after v141: **trial newer Gemini models against the current
`gemini-2.5-flash-lite`, then replace the browser voice with a runtime Azure
call.** The second is gated on the A2 proxy and is not close.

Scope of the trial, as settled in conversation and not yet built:

- **Blind and side by side.** One English input, two models, results shown
  unlabelled. "Newer must be better" is exactly the expectation that would
  otherwise decide the result, and neither Claude nor William can judge natural
  colloquial Cantonese — **William's wife judges**, which also means the output
  must be readable without jyutping crutches.
- **Twenty inputs per session, two calls each.** Free-tier limits are per model
  and now tight — 15/min and 1,000/day on 2.5 Flash-Lite, but as low as 5/min
  and 20/day on some 3.x Flash models. Forty calls split across two models is
  inside every current limit; a script that hammers both is not. Pace at 5s.
- **Cost is not a factor and should not be treated as one.** Measured against
  the app's real prompt (~195 input tokens, ~80 output), a translation costs
  $0.000052 on the current model and $0.00034 on the dearest candidate — $1 to
  $6 a year at fifty a day. **Pick on quality.**
- **One key covers every model**; the model is a URL segment, not a credential.
  Enabling billing would *remove* the free tier on that project rather than
  extend it, so the trial stays on the free tier.

Open questions before building: which candidate models to include (the list has
moved twice in recent months and should be read from the API rather than a
pricing page), and whether the few-shot examples proposed in July are still
needed or whether a better model makes them redundant.

**Next, when picked up:** the Part A items in `docs/PRODUCTISATION_REVIEW.md`.
The two longest-lead ones are unchanged and neither is engineering: buying a
secondhand iPhone (which gates A8's speech question and the iOS half of A1 and
A10), and the product name (B5), which gates the logo, the header, the domain
and any store listing.
