"""Playbook step 5 — put a draft into a working copy of the data so the scripts can read it.

    python3 tools/content-batch/inject.py --draft <draft.py> [--repo .] [--round 1]

Then: node tools/mint-sentence-ids.js   (and revert any topic file it touched that
is not in the batch — it rewrites unrelated files), node tools/build-char-jyutping.js,
and the checks. Re-running needs a clean copy first: git checkout -- data/topics/<key>.json
"""
import argparse
from _common import load_draft, read_topic, write_topic

def sent(l, sid=None):
    o = {}
    if sid: o['sid'] = sid
    o.update(c=l['c'], j=l['j'], e=l['e'])
    if l.get('note'): o['note'] = l['note']
    o['bd'] = l['bd']
    return o

def line(l):
    o = {}
    if l.get('u'): o['u'] = True
    o.update(c=l['c'], j=l['j'], e=l['e'])
    if l.get('opts'):
        o['opts'] = l['opts']; o['optsJ'] = l['optsJ']
    o['bd'] = l['bd']
    return o

ap = argparse.ArgumentParser()
ap.add_argument('--draft', required=True); ap.add_argument('--repo', default='.'); ap.add_argument('--round', default='1')
a = ap.parse_args()
for key, D in load_draft(a.draft).items():
    raw, d = read_topic(a.repo, key)
    r = d['rounds'][a.round]
    for i, s in enumerate(r['sentences']):
        if s.get('sid') in D['rewrite']:
            r['sentences'][i] = sent(D['rewrite'][s['sid']][0], s['sid'])   # a rewrite keeps its ID
    r['sentences'] += [sent(l) for l in D['new']]
    if D.get('chat'):
        r['convo'] = dict(title=D['title'], speakers=D['speakers'], lines=[line(l) for l in D['chat']])
    write_topic(a.repo, key, raw, d)
    print('injected', key)
