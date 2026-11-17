"""After an audio release — did every clip the release needed actually change?

    python3 tools/content-batch/audio_release_check.py --base <commit before the release> [--head origin/main] [--repo .]

Works out, from the data alone, which clips a release should have generated or
regenerated — every word, sentence or chat line whose Chinese text is new or
different between the two commits — and sets that beside the audio files the
commits actually changed. generate-audio.js cannot notice a missed --force run:
a clip that exists is, to it, a clip that is done. v170 missed one of nine this way.
Chat clips are named by line position, so a changed line anywhere is that position's clip.
"""
import argparse, json, subprocess

ap = argparse.ArgumentParser(); ap.add_argument('--base', required=True); ap.add_argument('--head', default='origin/main'); ap.add_argument('--repo', default='.')
a = ap.parse_args()
def git(*x): return subprocess.check_output(['git', '-C', a.repo, *x], text=True)
def clips(ref):
    out = {}
    for f in git('ls-tree', '-r', '--name-only', ref, 'data/topics').split():
        key = f.split('/')[-1][:-5]
        for rk, r in json.loads(git('show', f'{ref}:{f}'))['rounds'].items():
            for w in r.get('words', []): out[f"audio/words/{w['id']}.mp3"] = w['c']
            for s in r.get('sentences', []): out[f"audio/sentences/{s['sid']}.mp3"] = s['c']
            for i, l in enumerate(r.get('convo', {}).get('lines', []), 1): out[f"audio/convos/topic-{key}-r{rk}-line{i:02d}.mp3"] = l['c']
    return out
old, new = clips(a.base), clips(a.head)
expected = {p for p, c in new.items() if old.get(p) != c}
changed = set(git('diff', '--name-only', a.base, a.head, '--', 'audio').split())
missed = sorted(expected - changed); extra = sorted(changed - expected)
print(f'expected {len(expected)} clips to change, {len(changed)} did')
for p in missed: print('NOT REGENERATED:', p, '—', new[p])
for p in extra: print('changed, text unchanged (a deliberate re-voice?):', p)
print('audio matches the data' if not missed else f'{len(missed)} clip(s) still carry old audio')
raise SystemExit(1 if missed else 0)
