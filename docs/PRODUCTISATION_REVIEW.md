# PRODUCTISATION REVIEW — Tea House Cantonese Learner

*A code-led review of what must change before the app can be sold to people who
are not William. Written 2026-09-02 against the repo at **v137**
(`sw.js` CACHE_VERSION and `STATUS.md` agree — no stale-clone problem).*

*Revised 2026-09-03: **A8 corrected** — the original claim that speech
recognition does not work on iOS was wrong, see that section. Content ownership
answered and folded into A3 and A11; the staged content rollout answered and
folded into A3 and B9. **Part C added** — code health, file structure and
technical debt. **C1 corrected** — the claim that existing harnesses covered the
delegation refactor was also wrong. **C6 and C7 added**: `tools/wiring-check.js`
built, and the `NAV_FIELDS` drift it prompted was found and fixed. **C1 built at
v139** — the delegation refactor, with DES-47; see STATUS.md for the outcome.*

**Scope.** Product and engineering only. Marketing, pricing, onboarding email,
lifecycle tracking and app-store listing work are all real and all deliberately
out of scope here. So is the app's *content* quality — this review assumes the
corpus is good enough to sell and asks only what the software around it lacks.

**Method.** Every finding below is anchored to a specific file and line or to a
measured number, and says how the number was derived. Where something is a
judgement call rather than a fact in the code, it says so.

**Two framings worth holding separately**, because they have different answers:

- *What breaks if a stranger uses this?* — items 1, 7, 8, 9, 10.
- *What breaks if a stranger **pays** for this?* — items 2, 3, 4, 5, 6, 11.

The second set is larger and less familiar, and it is where a solo builder
usually under-scopes.

---

## Part A — MUST. These block taking money.

### A1. Progress lives on one device and can vanish without warning

`data.js` persists exactly **four areas** — `wordReview`, `quizDirection`,
`apiKey`, `pathProgress` — into `localStorage`. That is the whole durable state
of the app.

Three consequences, in increasing order of how badly they hurt:

1. **A new phone is a new account.** There is no export, no sync, no recovery.
2. **Clearing site data wipes everything**, with no warning and no undo.
3. **The browser can evict it unasked.** iOS Safari clears
   local storage for sites not visited in seven days unless the PWA is installed
   to the home screen. A subscriber who takes a fortnight off can come back to
   zero. This is not hypothetical, it is documented WebKit behaviour.

The storage module was built well for this moment — `_persist()` and `_hydrate()`
are genuinely the only two functions touching `localStorage`, and the read-once /
write-through shape does match how a server-backed app works. That claim in the
header comment holds up. **But the swap is the easy half.** The hard half is that
`pathProgress` is `{ pathKey: { lessonKey: true } }` — booleans, nothing else. No
timestamps, no attempt counts, no per-item history, no device or schema stamp.

That shape cannot answer any of the questions a paid product needs to answer:

- Which of two devices is more recent, when both have offline changes?
- What did the learner do last Tuesday? (Every retention feature — streaks,
  "resume where you left off", weekly summary emails — needs this.)
- Which words are actually weak, rather than merely once-missed?

**The progress schema has to be designed before auth, not after.** Retrofitting
timestamps onto a boolean map means either losing every existing user's history
or inventing fake timestamps for it. Right now there is exactly one user, so this
is the cheapest it will ever be.

### A2. The Translate feature asks the user for their own API key

`render.js:190` renders a password field and the copy *"Paste your Google Gemini
API key… Get a free key in 90 seconds at aistudio.google.com."* `app.js:1750`
then puts that key in a query string against `generativelanguage.googleapis.com`.

For personal use this is elegant — no backend, no bill. As a product it is
unsellable: you cannot ask a paying subscriber to create a Google Cloud account,
and you certainly cannot ask them to hold a billable credential for a feature
they already paid for.

This must become a **server-side proxy** holding your key, with per-user quota,
rate limiting, and an abuse cutoff. Note the size of what this drags in: it is
the first thing that requires a real backend *even if progress sync did not
exist*. Once that proxy is standing up, A1's sync endpoint is a small addition to
it rather than a separate project.

Two smaller things fall out of the same code. `callClaude()` at `app.js:1784`
and `callOpenAI()` at `app.js:1808` are dead alternate providers — decide whether
they survive the move or get deleted. And the on-screen copy *"saved securely on
your device only"* is not accurate: `localStorage` is readable by any script on
the origin. That sentence should not ship to a customer whatever else happens.

### A3. The entire product is public and copyable

The repo is public — this review cloned it with no credentials. Every one of the
**1,376 audio files** and all 42 topic JSONs are fetchable by direct URL from a
predictable path. There is **no `LICENSE` file**.

So today: anyone can fork the repo, change the name, and stand up an identical
product on their own GitHub Pages in under fifteen minutes. Nothing technical or
legal stops them.

A paywall in the client is not a fix — a client-side gate over publicly-fetchable
files is decoration. Whatever you decide to charge for has to be **served from an
authenticated endpoint with short-lived signed URLs**, and the repo either goes
private or splits into a public shell and a private content/audio store.

Related and often missed: decide *deliberately* how much is free. A generous free
tier is a good strategy. Free-because-you-cannot-stop-it is not a strategy.

**Copyright will not do this job for you.** Confirmed 2026-09-03: the corpus is
William's own, generated with Claude against his content guidelines, so no third
party has a claim on it and it can be sold freely. But the ability to stop
*someone else* copying it is thinner than it looks, for two independent reasons.
Purely AI-generated text sits in contested legal territory — the US Copyright
Office requires human authorship, and Australian case law has gone the same way
on works with no identifiable human author. And individual short sentences and
word glosses are generally too short and too functional to attract protection
regardless of who wrote them.

What *is* protectable is the **compilation** — the selection, the sequencing, the
tier structure, the rounds, the judgement about what belongs where. That is
William's editorial work, it is the genuinely valuable part, and it is what a
copier would be taking. But enforcing it means litigating, which is not a
business plan for a solo product. **The practical defence is access control and
brand, not copyright**, which is why this item is a MUST rather than a nice-to-
have.

**The staged content rollout depends on this too.** The launch plan (confirmed
2026-09-03) is to ship with Intermediate complete and release Advanced
progressively. That only means anything if unreleased content is not fetchable —
and today anything pushed to the repo is public the moment it lands. Under the
current setup, Advanced content would have to be kept out of the repo entirely
until each release date, which is an awkward way to author and a soft spot for
mistakes. So content access control is not only an anti-piracy measure; it is a
**precondition for the revenue model**, and that raises its priority above where
a pure piracy framing would put it.

### A4. GitHub Pages is the wrong host for a commercial service

Two independent reasons, either sufficient:

- **Fair-use limits.** GitHub Pages carries a soft bandwidth allowance of roughly
  100 GB/month and is explicitly documented as not intended for running a
  business. The audio directory is **24 MB** across 1,376 files. A user who works
  through most of the corpus pulls most of that. At around **4,000 fully-engaged
  users a month you are at the limit** — and you would hit friction from GitHub
  well before you hit the number, because the ToS question arrives before the
  bandwidth one does.
- **No control over headers.** You cannot set a Content-Security-Policy, cannot
  set cache-control per asset class, cannot sign a URL. A4 and A3 and A7 all
  resolve together by moving to a host that lets you send headers — Cloudflare
  Pages, Netlify, or a CDN in front of object storage.

This is not urgent in the sense of "next week", but it is a **must** because it
is a precondition for three other musts.

### A5. There is no payment, entitlement or subscription machinery at all

Nothing in the repo touches billing. This is expected — flagging it so it is
costed rather than assumed.

The engineering piece (Stripe Checkout or app-store billing, a webhook, an
entitlement flag checked server-side on every content request) is a known
quantity. The pieces that surprise solo builders:

- **Tax.** Selling subscriptions to consumers means GST/VAT obligations that vary
  by the *customer's* country, not yours. A merchant-of-record service —
  Paddle, Lemon Squeezy — absorbs this in exchange for a higher cut. Stripe alone
  does not. Worth pricing both before choosing.
- **Refunds, failed payments, cancellation, grace periods.** Each needs a defined
  behaviour in the app, and each is a state the entitlement check must handle.
- **App-store distribution changes the answer.** If the PWA ever wraps into a
  store listing, the store takes its cut of in-app subscriptions and forbids
  steering users to your own checkout in some jurisdictions.

### A6. No privacy policy, no terms, and an undisclosed microphone data flow

This one has real legal exposure, so it is stated plainly.

The app records the microphone and, on Chrome for Android — which is the target
device — the Web Speech API **transmits that audio to Google's servers** for
recognition. It is not on-device. Right now the app discloses none of this. There
is also no privacy policy, no terms of service, and no consent flow.

Required before charging anyone:

- A privacy policy naming every third party that receives user data — Google
  (speech recognition, fonts), Gemini, your own host, your payment processor.
- Terms of service, including the subscription terms.
- Explicit disclosure at the point the microphone is first used, not buried.
- **Data export and deletion.** If you sell to anyone in the EU or UK, right of
  erasure and data portability are legal obligations, not features. Australian
  Privacy Act obligations attach too once you hold identifiable user data.
- A named contact and a business entity behind the product.

Getting a lawyer's eye on this is cheap relative to the downside. It is also the
item most likely to be deferred indefinitely, so pin it to a date.

### A7. Untrusted text goes into `innerHTML` with no escaping primitive

There is **no `esc()` / `escapeHtml()` helper anywhere in the codebase** —
grep for it returns nothing. Escaping happens at exactly one site, hand-rolled
inline at `render.js:236`, on `state.translate.inputText`.

Everything else is interpolated raw. Specifically:

- `sp.heard` and `cv.speakHeard` — raw ASR transcript — at `render.js:109`,
  `1230`, `2000`.
- `result.zh`, `result.en`, and every `w.c` / `w.j` / `w.e` breakdown field —
  **all LLM output** — at `render.js:255-262`.
- `tr.error` at `render.js:250`.
- `data-tr-text="${result.zh}"` at `render.js:259` — an unescaped value inside a
  double-quoted **attribute**. A single quote character in a model response
  breaks out of the attribute. This is the most likely of the set to fire by
  accident rather than by attack.

**Today the honest risk is low** — one user, one device, nothing shared, so the
worst case is self-inflicted and the LLM is the only semi-untrusted input.
It becomes serious the moment any of three things is true: content is stored
server-side, content is shared between users, or a session token sits in
`localStorage` next to the API key. A2 and A1 make all three true.

Fix is small and should happen before the backend, not after: one `esc()` helper,
applied at every untrusted interpolation site, plus a CSP header once the host
allows one (see A4).

### A8. Speech recognition on iOS is unverified — and Speak is now a headline feature

> **Correction, 2026-09-03.** The first version of this section was headed
> *"Speech recognition does not work on iOS"*. **That was wrong.** Safari has
> supported the Speech Recognition API since 14.1 on macOS and 14.5 on
> iOS/iPadOS, exposed under the `webkitSpeechRecognition` prefix — which is
> exactly the feature-detect the app already performs. The code may well work as
> written. The finding is that this is **untested**, not that it is broken, and
> the section below is rewritten accordingly. Recorded rather than quietly
> edited, because the original claim was strong enough to have driven a decision.

`app.js:2105` and `2242` both do
`window.SpeechRecognition || window.webkitSpeechRecognition`, with no fallback
path when neither exists. Every speak-and-check surface built in v129–v137 — the
"Say it back" sheet, Chat's Speak mode, the checkpoint sentence review — depends
on it, and all of it has only ever been tested on a Pixel running Chrome.

The API being present on iOS Safari does not settle the question, because the
engine behind it is Apple's, not Google's, and the app's behaviour is tuned to
Google's. Four things need checking on a real device, in this order:

1. **Does `zh-HK` actually recognise?** Apple supports Cantonese for dictation,
   but a supported language tag and a usable transcript are different claims —
   this is the same *"status code is not outcome"* trap already recorded in
   `STATUS.md` from the Azure REST endpoint.
2. **Does the transcript arrive in the shape the matcher expects?** Interim
   results, the cumulative-restatement behaviour, and Arabic-digit normalisation
   were all tuned against Chrome on Android. `resolveHeard()` and
   `normalizeChinese()` encode assumptions that may not transfer.
3. **What do the non-Safari iOS browsers do?** They are WebKit underneath, but
   whether the API is exposed inside their web views is a separate question from
   whether Safari exposes it.
4. **Does the permission and prompt flow break the sheet?** Apple prompts before
   sending audio for recognition, which is an extra interaction the "Say it
   back" sheet was not designed around.

The commercial version of this problem: **iOS is roughly half the market in
Australia, the US and the UK, skewed towards people who pay for apps.** Selling a
subscription whose headline feature silently does not work for half your
customers produces refunds and one-star reviews, not churn you can measure.

Three possible answers, and the choice matters:

1. **Server-side ASR for iOS** — send the recording to Azure (already in use for
   TTS, `australiaeast`, so the account exists). Works everywhere, costs per
   request, needs the backend from A2 anyway.
2. **Server-side ASR everywhere** — one code path, one behaviour to support, no
   per-browser surprises. More cost, but removes a whole class of bug and would
   likely have prevented the Android cumulative-restatement and Arabic-digit
   issues recorded in `STATUS.md`.
3. **Degrade honestly on iOS** — detect, hide the mic, say why. Cheapest, but
   sells a lesser product to the more valuable half of the market.

**This is still the item to resolve first, because it is answerable cheaply and
its answer changes the size of the backend.** No iPhone is currently to hand
(confirmed 2026-09-03), so this needs a device. A secondhand handset is worth
buying regardless of how the speech question lands, because four other findings
in this review can only be checked on real iOS hardware:

- the seven-day storage eviction behind **A1**, which is the single worst-case
  data-loss scenario in this document;
- whether the media cache in **A10** survives iOS's storage pressure eviction;
- PWA install, standalone mode, and safe-area insets, none of which have ever
  been seen;
- audio playback gesture rules, which are stricter on iOS than on Android and
  which the auto-play in the speak sheets may fall foul of.

The cheapest device still receiving the current iOS is sufficient. Testing older
iOS versions is a separate question and can wait.

### A9. A thrown error shows a blank screen, and you will never hear about it

There is no `window.onerror` handler, no `unhandledrejection` handler, and no
render-level error boundary. `render.js:3565` catches boot failure only — an
exception thrown by any screen render after boot leaves whatever was on screen,
or nothing.

With one user, a white screen means William opens the console. With paying
strangers, it means a refund request that says "it stopped working" and no way to
find out what. Needed: a global handler, a recoverable error screen with a reload
affordance, and error reporting (Sentry's free tier is more than sufficient at
this scale). Version-stamp the reports with `CACHE_VERSION` so a report maps to a
deploy.

### A10. Every deploy makes every user re-download all their audio

`sw.js` activate deletes **every** cache whose key is not the current
`CACHE_VERSION`. Meanwhile the fetch handler caches any successful same-origin
response, which includes the MP3s — they are not in `PRECACHE`, they accumulate
as the learner uses them.

So a CSS tweak that bumps v137 to v138 discards every audio file every user has
ever cached. Up to 24 MB re-downloaded, on mobile data, for a change that touched
one line of CSS. This is invisible today because deploys and users are both
William. It gets worse rather than better, because a live product deploys *more*
often.

Fix: two caches. A versioned shell cache that behaves exactly as now, and a
separate unversioned media cache that survives version bumps and is trimmed
LRU-style against a size ceiling. The ceiling matters independently — right now
the media cache is unbounded, and iOS is the platform most likely to evict the
whole origin's storage when it grows.

### A11. Third-party licensing is unverified and unattributed

Four separate exposures, none currently addressed in the repo:

- **`vendor/to-jyutping.js`** (CanCLID) is BSD-2-Clause. That licence *requires*
  the copyright notice and licence text be reproduced in redistributions. There
  is no `LICENSE`, no `NOTICE`, and no attribution surface in the app. Cheap to
  fix, genuinely non-optional.
- **Azure Neural TTS output.** All 1,376 audio files are synthesised speech
  redistributed as part of a paid product. Microsoft's Speech terms need reading
  specifically on redistribution and on storing output — this is a *verify*, not
  an assertion that it is disallowed, but it must be verified before launch
  rather than after, because the remedy if it is disallowed is regenerating the
  entire corpus.
- **Google Fonts loaded from Google's CDN** (`index.html:12`). Every page load
  sends the user's IP to Google. German courts have ruled this a GDPR breach.
  Self-hosting the three families removes the issue and speeds up first paint.
- **Corpus provenance — answered 2026-09-03, closed.** All words, sentences and
  conversations are William's own, generated with Claude against his content
  guidelines. Nothing was drawn from another dictionary or textbook, so no third
  party has a claim. Anthropic's terms assign output rights to the customer.
  **This closes the licensing question but not the enforcement one** — how much
  of it is actually defensible against a copier is a separate matter and is
  covered in A3. The residual risk that a model reproduced protected text
  verbatim is low for short, common, functional phrases of this kind and is not
  practically manageable; noted and accepted rather than actioned.

---

## Part B — SHOULD. Not blocking, but these are the difference between selling once and keeping the customer.

### B1. There is no first-run experience
Grep for `onboard`, `firstRun`, `welcome` returns nothing. The app opens straight
onto the Dashboard. For William that is correct — he built it. A stranger who has
just paid arrives at a screen full of vocabulary and no idea where to start.
First session is where subscription products are won or lost.

### B2. No analytics of any kind
Nothing measures which screens are used, where people stop, or which lesson
precedes a cancellation. Without it, every product decision after launch is a
guess. A privacy-respecting option — Plausible, Fathom — avoids adding a
consent-banner obligation on top of A6.

### B3. Accessibility is thin
Measured: **25 `aria-*` attributes and 3 `role=` attributes** across 160 KB of
`render.js`; **3** `:focus-visible` rules in `styles.css`; **zero**
`prefers-reduced-motion` blocks. No skip link, no announced live regions for
speak results. Beyond the ethics, accessibility is a procurement requirement if
the product is ever sold to a school or employer, and an app-store review risk.

### B4. Payload is larger than it needs to be
Measured gzipped: `render.js` 42 KB, `app.js` 34 KB, `styles.css` 29 KB — and
`vendor/to-jyutping.js` at **274 KB gzipped**, by far the largest single asset.
It is correctly deferred (`index.html`, with a good comment explaining why) so it
does not block first paint, but it is still a quarter-megabyte fetched by every
user for a feature many will never open. Options: load it lazily on first speech
result, or check what fraction of it the corpus actually needs — the
corpus-derived table already covers 644 characters.

### B5. Manifest and branding are placeholders
`manifest.json` `theme_color` is `#1a1a2e`; `index.html` `theme-color` is
`#1A1815` — they disagree, so the installed app's chrome does not match the
design system. `description` reads *"Personal Cantonese learning app"*. `name` is
the placeholder nameplate. The product-name decision is already the first item in
`BACKLOG.md` § Product and it gates the logo, the header, the domain and the
store listing — it is now the longest-lead item on the list.

### B6. No tests run automatically
The harnesses in `tools/` are good and genuinely unusual for a solo project —
`validate.js`, `nav-harness.js`, `snapshot-harness.js`, `tier-harness.js`,
`jyutping-check.js`, plus the CSS checks. They are all hand-run. A GitHub Action
running them on push costs nothing and removes the failure mode where a deploy
ships because a check was skipped under time pressure. The screen smoke harness
already on the backlog is the highest-value addition.

### B7. Small state gaps that become support tickets
Tier selection is not persisted — it resets each session. `state.speed` is not
persisted. Neither matters for one user who knows the app; both read as bugs to
someone paying for it.

### B8. No support channel or feedback path
No in-app way to report a problem or ask a question, and no address to send it
to. The first paying customer will find something; decide now where that lands.

### B9. Content depth against price — answered 2026-09-03
This was raised as an open question and now has an answer. **The launch plan is
to ship with the Intermediate path and topics complete, and to roll Advanced out
progressively after launch.** That is the right shape: a subscription is
defensible when new content keeps arriving, and indefensible when a learner can
exhaust the corpus in a month and keep paying for nothing. The immersion-audio
dialogues already on the backlog fit the same slot.

Two consequences worth carrying rather than treating this as fully closed. The
rollout schedule becomes a **delivery commitment** — it is the thing being sold,
so slipping it is a churn event rather than an internal miss, and it should be
paced against what can actually be authored rather than against what would be
nice. And it makes content access control a precondition rather than a
protection, which is written up in A3 and is the reason that item's priority went
up.

Still open, and worth deciding before pricing is set: how much of the corpus sits
outside the paywall, and whether Advanced arrives as dated releases or as a
steady trickle. Those are marketing decisions, out of scope here, but both depend
on A3 being built.

---

## Part C — CODE HEALTH. Structure, size and technical debt.

*Added 2026-09-03. None of this blocks selling. It is here because the codebase
has roughly tripled since it was last looked at as a whole, and because C1 has a
sequencing argument against the backend work in Part A.*

**Headline: the codebase is in better shape than most solo projects of this age,
and three of the five files need nothing at all.** `render.js` has one real
problem. Everything else in this part is minor.

### The measurements

Derived by script, not by eye — line counts from `wc`, function boundaries by
parsing top-level `function` declarations and measuring to the next one, CSS
figures by counting rule blocks and declarations directly.

| File | Lines | Functions | Median fn | Longest fn |
|---|---|---|---|---|
| `app.js` | 2,314 | 116 | **11** | 138 (`charsToJyutping`) |
| `render.js` | 3,621 | 50 | 38 | **1,288** (`attachEvents`) |
| `styles.css` | 1,514 | — | — | — |
| `data.js` | 323 | 2 | — | — |
| `sw.js` | 85 | — | — | — |

`styles.css`: 625 rule blocks, 77 custom properties, **2 `!important`
declarations in the entire file**, no duplicate selectors, 1 media query.
`dead-css.js` reports 2 dead classes, both known interpolation artefacts.
`validate.js` passes clean.

**What those numbers say about `app.js`:** a median function of 11 lines, a
longest of 138, and nothing over 200 across 116 functions is a well-factored
file. Its size is a consequence of the app doing a lot, not of anything being
wrong. It does not want splitting and it does not want refactoring. **What they
say about `styles.css`:** two `!important` declarations in 625 rules is rare and
is direct evidence that the "consolidate, don't append, never add an override
layer" rule has actually held under pressure. Neither file is technical debt.

### C1. `attachEvents()` is 1,288 lines, and that is architectural — BUILT at v139

> **Done, 2026-09-03.** `attachEvents()` is gone; one delegated listener on
> `#app` replaces 100 re-bound per render. The dispatch table is keyed on the
> attribute and id names the markup already used rather than a new
> `data-action` attribute, which is a change from the design described below —
> measuring showed that rewriting 39 attributes across every screen was the
> larger and less verifiable half of the job for no gain. DES-47 (innermost
> tapped control wins) is the behavioural half and retired twelve local
> defences. The section below is kept as written, because the reasoning for
> doing it is what makes the outcome legible.

36% of `render.js` sits in one function. It holds all **104** `addEventListener`
calls, **58** `getElementById` lookups, and **52** `if (el)` guards.

The guards are the diagnosis. Every state change sets `app.innerHTML` and then
re-runs `attachEvents()` against a brand-new DOM, so that single function has to
be the union of every screen's wiring, and every lookup has to tolerate its
element not being present. The length is not sprawl or neglect — it is the direct
consequence of full re-render plus full rebind. Which means it cannot be fixed by
tidying; only by changing the binding model.

Three costs follow:

- **Nothing survives a render.** There is no `scrollTop`, `activeElement`,
  `selectionStart` or `requestAnimationFrame` anywhere in `render.js`, so scroll
  position, focus, text selection and in-flight CSS transitions are all discarded
  on every state change. This is currently invisible because renders are coarse —
  a tap changes screens — and the Translate textarea is deliberately read only on
  submit rather than on input. It blocks anything that must render *while* the
  user is interacting: a live-filtering search, an inline typed answer, autosave.
- **Failures are silent.** A mistyped or renamed id means the guard skips it and
  the control simply does nothing — no error, no console warning, no test
  failure. This is the same defect shape already recorded in `STATUS.md` from the
  tier harness, which passed for several versions while a live navigation bug
  existed because it asserted what a rung *drew* rather than what happened when
  it was *pressed*.
- **It is the hardest file in the repo to change safely**, which matters
  specifically because the Part A backend work has to change it.

**The fix: one delegated listener on `#app` dispatching on `data-action`.** The
codebase is already most of the way there — **43 of the binding sites already go
through `querySelectorAll('[data-…]')`**, so the majority of interactive elements
carry a data attribute already. The refactor collapses `attachEvents` into a
dispatch table, removes the guard-everything pattern, makes a missing handler a
loud failure rather than a silent one, and makes DOM preservation possible later
if it is ever wanted. It is mechanical, but not unassisted — see C6.

> **Correction, 2026-09-03.** This section originally claimed that
> `nav-harness.js`, `tier-harness.js` and `snapshot-harness.js` "already cover
> the behaviour it would touch." **That was wrong.** No harness calls
> `attachEvents()` at all; the two that read `render.js` lift named functions
> out of it and never execute the wiring. They test the state transitions
> handlers call *into*, not whether any control is bound to them. The refactor
> therefore had no automated safety net, which is why C6 was built before it
> rather than after. This is the second overstatement corrected in this document
> — see also A8 — and both have the same shape: asserting that coverage exists
> rather than checking that it does.

It is also **invisible to the user by design** — nothing should look or behave
differently afterwards, which is worth stating up front so nobody hunts for a
change that is not there.

### C2. `render.js` wants splitting, but after C1 rather than before

3,621 lines is past the point where the whole file can be held in mind at once.
The seams already exist as comment banners: shared primitives, learn/topic,
quiz and word review, conversation, checkpoint, translate, dashboard and path,
events. No build step makes splitting genuinely cheap — more `<script>` tags and
more `SHELL_ASSETS` entries in `sw.js`, subject to the load-order constraint
already documented in `index.html`.

Sequenced after C1 deliberately: delegation is what actually shrinks the file,
and splitting a 3,621-line file is easier once its largest function has become a
dispatch table.

### C3. Duplication is low, but three specific cases exist

Worth naming because they are the only ones found, which is itself the finding:

- The **"You said" markup block is triplicated verbatim** at `render.js:109`,
  `1230` and `2000` — the sentence sheet, the checkpoint review and Chat.
  `renderSpeakBreakdown()` was correctly extracted and is shared across all
  three; its wrapper was not. One helper closes it.
- The **loading-shell-plus-`attachEvents(null)`** block appears four times in the
  first 70 lines of `render()`, once per lazy-load gate.
- `renderQuizCore()` is a good precedent for how to fix both — markup-only, no
  event wiring, callers keep their own handlers. Follow that shape.

### C4. `NAV_FIELDS` is a hand-maintained agreement pair

`state` has 33 top-level keys; `NAV_FIELDS` names 15 of them, by hand. Adding a
nav-relevant field to `state` without adding it to `NAV_FIELDS` produces a
back-button bug that no check catches. This is exactly the class of defect
`STATUS.md` warns about under derived data, and the **agreement-pairs audit
already on the backlog is the right home for it** — it does not need separate
work, it needs to be on that audit's list when it happens.

### C5. One media query

`styles.css` contains a single `@media` block. The app is mobile-first by
deliberate design and that remains defensible, but paying customers will open it
on a laptop, and what they currently get is a phone layout stretched across a
wide viewport. This wants a **decision** — a max-width container and centred
layout is an hour's work, a genuine desktop experience is not — rather than
automatically becoming work.

### C6. `tools/wiring-check.js` — built 2026-09-03, precondition for C1

A standing check that asserts both directions of the agreement between rendered
markup and bound handlers: **no stranded handler** (bound to something no render
function emits) and **no unwired control** (rendered but nothing binds it). It is
static analysis over `render.js`, `app.js` and `index.html` — no DOM, no
dependencies, no fixtures.

It exists because the `if (el)` guard that C1 describes makes a broken control
*silent*, and because nothing else checks that half of the app. It was built
before the delegation refactor rather than after, so that refactor can be
verified rather than trusted. `readWiring()` is the only function the refactor
changes — the `getElementById`/`querySelectorAll` scan becomes a scan of the
dispatch table's keys, and the assertions, declarations and reporting stay put.

**It found four pieces of dead code on its first run**, in two clusters, both
surviving halves of removed features:

- *The legacy speed toggle*, replaced by the settings sheet at v117 —
  `getElementById('speed-' + s)` for three ids no render function emits, plus the
  `data-drawer-speed` handler at `render.js:2516`. The comment above the
  surviving `data-speed` handler calls it "the sole writer of `state.speed`";
  that is true, but only because the other writer is dead, which is not what the
  comment means.
- *The category jump chips* — the `data-cat-jump` handler at `render.js:2389`,
  and the `id="cat-anchor-${cat.key}"` markup at `render.js:1786` which nothing
  consumes (`scrollIntoView` appears nowhere in the codebase). Both halves of the
  same removed feature, each invisible to every existing check.

Three of the four were invisible to the check as first written, which is worth
recording because each miss was a *rule* problem rather than a typo:
scanning comments as if they were markup invented a phantom `data-attribute`
control out of prose; `querySelectorAll?` reads as "querySelectorAl" plus an
optional "l" and so missed the singular `querySelector` entirely, falsely
condemning all seven checkpoint-sentence-review controls; and anchoring
attribute extraction on `=` missed the valueless form (`data-cp-act-back`) and
the ternary-assigned form (`data-path-open`).

The fourth was a **blind spot rather than a bug**: lookups the scanner could not
resolve were being dropped silently, so `getElementById('speed-' + s)` simply did
not exist as far as the check was concerned. Unresolvable emissions were already
reported; unresolvable lookups were not. That asymmetry is exactly the shape of
defect the check was built to catch, occurring inside the check itself. Both are
now reported, and the report says to keep the list short — an unresolvable
reference is a gap in what the check can prove, not a free pass.

### C7. `NAV_FIELDS` had already drifted — fixed 2026-09-03

C4 described the hand-maintained `NAV_FIELDS` agreement pair as a risk. It was
not a risk; it had already happened. `tools/snapshot-harness.js` held its own
hand-written copy with **14 entries against `app.js`'s 15**, missing
`sentSpeakOpen`, which was added at v130. For seven deploys the harness reported
"all migration scenarios pass" while testing a field list the app no longer had.

Fixed by reading `NAV_FIELDS` out of `app.js` at run time rather than copying it,
throwing if the extraction fails rather than falling back to a literal — a silent
fallback would reintroduce the same drift. Verified in both directions by
temporarily adding a field to `app.js` and confirming the harness picked it up.

This does not close C4, which is about the `state`-to-`NAV_FIELDS` agreement
inside `app.js` itself. It closes the harness's copy of it.

### What is explicitly *not* technical debt

Stated because it would be easy to assume otherwise, and because reversing a
sound decision costs more than leaving it alone:

- **The no-build-step architecture is still the right call at this size.** It
  costs a `<script>` tag per file and buys a codebase that can be read, edited
  and deployed with no toolchain, no lockfile and no supply chain. Revisit only
  if a genuine need appears — TypeScript, or a dependency that ships only as a
  module — not on principle.
- **`app.js` and `styles.css` need nothing.**
- **The storage module is clean** and its swap-readiness claim survives
  inspection; see A1, where the problem is the data *shape*, not the layer.
- **The comment density is high and the comments explain *why*.** They are load-
  bearing documentation, several of them recording investigations that cost days.
  Any refactor must carry them across rather than dropping them as noise.

## Sequencing — what this suggests doing in what order

Not a plan, and not a commitment to any of it. A suggested order, with reasons.

1. **Buy an iPhone and answer A8.** Blocked on hardware, not on effort. Also
   unblocks the iOS half of A1 and A10.
2. **A11's Azure redistribution check and A6 legal scoping.** Both are lead-time
   items that can run in the background while engineering proceeds, and both can
   invalidate work if left until last. *(A11's corpus-provenance limb is now
   closed.)*
3. **A1's progress schema design.** Design only, no build. Cheapest now, and
   everything server-side depends on its shape.
4. **A7's `esc()` helper, A10's cache split, and C1's event delegation.** All
   three are self-contained, inside the existing codebase, need no new
   infrastructure, and are covered by the existing harnesses. Do them while the
   above are being answered. C1 belongs here rather than in Part B's ordering
   because A7 and the auth-aware rendering both touch the same surface — doing it
   after the backend means doing that work twice.
5. **The backend** — A2 proxy, A1 sync, A3 signed URLs, A5 entitlement. One
   project, not four. Choose the platform once.
6. **A4 host move**, alongside or just before the backend.
7. **A9 error reporting** before the first external user, not after.

Everything else in Part B follows launch readiness, except **B5's name decision**,
which has the longest lead time of anything on any of the three lists and should
start now.

---

## What this review did not cover

- Content and pedagogy quality — assumed sound, not assessed.
- Marketing, positioning, pricing level, acquisition, lifecycle email.
- App-store packaging specifics (Trusted Web Activity, Capacitor, or PWA-only).
- Competitive analysis.
- Any cost modelling for hosting, ASR, TTS or LLM calls at volume.
