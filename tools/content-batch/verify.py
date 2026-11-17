"""Playbook step 4/5 — check a draft's readings and breakdowns before it is injected.

    python3 tools/content-batch/verify.py --draft <draft.py> [--repo .]

Prints one line per finding:
  COUNT        characters and jyutping syllables do not line up — always a fault
  BD-TEXT/BD-J the breakdown does not add up to the line — always a fault
  OPT-LEN      Fill-the-Gap rule 3 or 4: no option as long as the answer, or one under half
  DIFF         a reading differs from the corpus dictionary — check it
  AMB          the character has more than one reading in the corpus — check it is the right one
  NOT-IN-DICT  a character the app has not used before — a new surrounding word; is it plain enough?
"""
import argparse, json, os
from _common import load_draft, han, syllables

ap = argparse.ArgumentParser(); ap.add_argument('--draft', required=True); ap.add_argument('--repo', default='.')
a = ap.parse_args()
d = json.load(open(os.path.join(a.repo, 'data', 'char-jyutping.json'), encoding='utf-8'))
issues = []
def chk(tag, c, j):
    h, s = han(c), syllables(j)
    if len(h) != len(s): issues.append((tag, 'COUNT', c, j)); return
    for ch, r in zip(h, s):
        e = d.get(ch)
        if not e: issues.append((tag, 'NOT-IN-DICT', ch, r))
        elif e['j'] != r: issues.append((tag, 'AMB' if e.get('amb') else 'DIFF', ch, r, e['j']))
for key, D in load_draft(a.draft).items():
    lines = D['new'] + [v[0] for v in D['rewrite'].values()] + D.get('chat', [])
    for i, l in enumerate(lines):
        tag = f'{key}:{i}'
        chk(tag, l['c'], l['j'])
        if ''.join(b['c'] for b in l['bd']) != ''.join(han(l['c'])): issues.append((tag, 'BD-TEXT', l['c']))
        if ' '.join(b['j'] for b in l['bd']).split() != syllables(l['j']): issues.append((tag, 'BD-J', l['c']))
        for b in l['bd']: chk(tag + ':bd', b['c'], b['j'])
        for o, oj in zip(l.get('opts', [])[1:], l.get('optsJ', [])[1:]): chk(tag + ':opt', o, oj)
        if l.get('opts'):
            n = len(han(l['c'])); ds = [len(han(o)) for o in l['opts'][1:]]
            if max(ds) < n or min(ds) < n / 2: issues.append((tag, 'OPT-LEN', n, ds))
for x in issues: print(x)
hard = [x for x in issues if x[1] in ('COUNT', 'BD-TEXT', 'BD-J', 'OPT-LEN')]
print(f'{len(issues)} findings, {len(hard)} of them faults')
raise SystemExit(1 if hard else 0)
