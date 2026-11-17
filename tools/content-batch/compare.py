"""Playbook step 7 — set pass A's and pass A2's versions beside the draft.

    python3 tools/content-batch/compare.py --items <dir>/items.json [--a <A answers.json>] [--a2 <A2 reply.txt>]

--a   pass A's answers as JSON: {"H-S1": [{"c": "...", "j": "..."}, ...], ...}
--a2  the second model's reply as pasted: one "ID | characters | jyutping | ..." line each

A line AGREES when any version matches the draft once punctuation, spelling variants
and a sentence-final particle are set aside. Everything else is listed as a phrasing
flag — ONE signal, and only where it makes a point about the line. Before counting
two passes that agree with each other as two signals, read the line's purpose: if a
word in it leads straight to that wording, it is one signal (CONTENT_PLAYBOOK.md §4).
A second model's jyutping is never a signal.
"""
import argparse, json
from _common import norm, han

ap = argparse.ArgumentParser(); ap.add_argument('--items', required=True); ap.add_argument('--a'); ap.add_argument('--a2')
a = ap.parse_args()
items = json.load(open(a.items, encoding='utf-8'))
V = {}
if a.a:
    V['A'] = {k: [v['c'] for v in vs] for k, vs in json.load(open(a.a, encoding='utf-8')).items()}
if a.a2:
    g = {}
    for l in open(a.a2, encoding='utf-8'):
        p = [x.strip() for x in l.strip().split('|')]
        if len(p) >= 3:
            g[p[0]] = [p[1]] + ([p[3]] if len(p) > 4 and p[3] else [])
    V['A2'] = g
for name, ans in V.items():
    missing = [x['id'] for x in items if x['id'] not in ans]
    diff = [x for x in items if x['id'] in ans and not any(norm(v) == norm(x['c']) for v in ans[x['id']])]
    first = sum(1 for x in items if x['id'] in ans and norm(ans[x['id']][0]) != norm(x['c']))
    over = [x['id'] for x in items if x['id'] in ans and len(han(ans[x['id']][0])) > 12]
    print(f"== pass {name}: differs on {len(diff)} of {len(items)} (first choice only: {first}); missing {missing}; over 12 characters: {over}")
    for x in diff:
        print(f"{x['id']:7} {x['status'][:4]:4} DRAFT {x['c']}  ||  {name}: " + '  /  '.join(ans[x['id']]))
if len(V) == 2:
    both = [x['id'] for x in items if all(x['id'] in V[n] and not any(norm(v) == norm(x['c']) for v in V[n][x['id']]) for n in V)]
    print(f"== both passes differ from the draft on {len(both)} lines — read each: same point, or two different ones?\n{' '.join(both)}")
