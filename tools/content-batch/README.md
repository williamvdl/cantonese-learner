# tools/content-batch — helpers for authoring a content batch

*Scripts the authoring AI session runs while following `docs/CONTENT_PLAYBOOK.md`.
They are **not** part of the app, are not cached by the service worker, and are
never run on William's PC. Python 3, standard library only.*

They exist so that each new chat does not rebuild them — and build them
slightly differently. Batches 1 and 2 were made with scripts that lived only in
a chat's scratch space; these are those scripts, generalised and tested by
rebuilding batch 2 from its draft and getting the live data back byte for byte.

| Script | Playbook step | What it does |
|---|---|---|
| `verify.py` | 4–5 | Checks a draft's readings against `data/char-jyutping.json`, that every breakdown adds up to its line, and the Fill-the-Gap length rules |
| `inject.py` | 5 | Writes the draft into `data/topics/*.json` so the Node checks can read it |
| `packets.py` | 6 | Builds the packets for passes A, A2, B and C, with the fixed instruction texts |
| `compare.py` | 7 | Sets pass A's and pass A2's versions beside the draft, by the playbook's matching rule |
| `audio_release_check.py` | after 10 | Works out which clips a release should have changed and checks the commit changed them |
| `example-draft-batch-2.py` | — | Batch 2's draft as it shipped: the format to copy |

## The order, for one batch

```
# 1. Write the draft (format below), then:
python3 tools/content-batch/verify.py  --draft <draft.py>
python3 tools/content-batch/inject.py  --draft <draft.py>
node tools/mint-sentence-ids.js          # then revert any topic file it touched that is not in the batch
node tools/build-char-jyutping.js        # BEFORE the review, not at release (see STATUS, v170)
node tools/validate.js && node tools/jyutping-check.js && node tools/gap-opts-check.js
node tools/content-report.js --check     # then read the Lesson rules and Tier-1 shape tables

# 2. Review
python3 tools/content-batch/packets.py --draft <draft.py> --out <dir>
#    - A, B, C: one fresh reviewer session each, told to read only its own packet
#    - A2/prompt.txt: give it to William at the same time, to paste into a non-Claude AI
python3 tools/content-batch/compare.py --items <dir>/items.json --a <A answers> --a2 <A2 reply>

# 3. Nothing stays in data/ until William approves. Take the draft back out while waiting:
git checkout -- data/

# 4. After William has generated the audio and pushed:
python3 tools/content-batch/audio_release_check.py --base <commit before the release>
```

To re-inject after changing the draft, restore the batch's topic files first
(`git checkout -- data/topics/<key>.json`) — `inject.py` appends.

## The draft format

One Python file defining `DRAFT`, a dict keyed by topic file name. Copy
`example-draft-batch-2.py`. For each lesson:

| Key | What |
|---|---|
| `name` | The lesson's display name, for the packets |
| `pre` | A one-letter prefix for line ids — `H-S3` is sentence 3, `H-C5` chat line 5. Unique within the batch |
| `card` | The scene card: `who`, `where`, `goal`, `hitch`, `end`, `setting` |
| `title`, `speakers` | The chat's title and its two speaker labels. The learner is always `You` and is voiced male; the other speaker is voiced female |
| `keepP` | A **purpose** for every existing sentence that is kept, keyed by its `sid` — kept lines go to the reviewers too |
| `rewrite` | Existing sentences to replace, keyed by `sid`: `(line, reason)`. The line keeps its ID, so its audio must be forced |
| `new` | New sentences, appended in order |
| `chat` | The whole chat, in order. A learner's line is built with `U(...)` and carries two Fill-the-Gap distractors |

Each line is `L(chinese, jyutping, english, breakdown, purpose, note=...)`. The
breakdown is a list of `"characters|jyutping|gloss"` strings that must add up
to the line exactly.

**The purpose is what pass A is given instead of the English.** Say what the
line does; do not use an English word whose obvious translation is the thing
being checked. In batch 2, "delivered" in a purpose led two different models to
the same Cantonese word, and their agreement meant nothing.

## What is copied here from the docs, and must be kept in step

- `packets.py` holds the **fixed instruction texts** of the playbook's §3, the
  **tier-1 limits** of `CONTENT_SPEC_TIER1.md`, and the **house list** of the
  playbook's §5. Change the document first, then the script. It has no tier-2
  block yet.
- `_common.py` holds the **matching rule** — which spelling variants and final
  particles are set aside when deciding whether a reviewer agreed with the draft.
