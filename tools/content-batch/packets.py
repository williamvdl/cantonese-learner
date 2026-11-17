"""Playbook step 6 — build the review packets. Run after the draft is injected and
sentence IDs are minted, because line order and IDs are read back from the data.

    python3 tools/content-batch/packets.py --draft <draft.py> --out <dir> [--repo .] [--round 1]

Writes into <dir>:
  items.json        every line of every lesson in the batch, kept ones included, with its line id
  A/packet.txt      pass A  — scene card, words, each line's purpose. No draft, no English.
  A2/prompt.txt     pass A2 — pass A's packet plus the answer format, for William to paste
                    into a fresh chat with a non-Claude AI
  B/packet.txt      pass B  — the Cantonese only
  C/packet.txt      pass C  — everything, plus the tier's limits and the house list

Each pass goes to a separate, fresh reviewer session that is told to read only its
own packet. The instruction texts below are the fixed texts of CONTENT_PLAYBOOK.md §3:
change them there first, then here.

THE TIER LIMITS AND HOUSE LIST BELOW ARE TIER 1'S, AND A COPY of CONTENT_SPEC_TIER1.md §4-5
and CONTENT_PLAYBOOK.md §5. Update this file whenever either changes, and write a
tier-2 block before using it on tier-2 content.
"""
import argparse, json, os
from _common import load_draft, read_topic

IA = """You are writing Cantonese lesson content as spoken in Hong Kong, for the
level stated. For each numbered line, write how a Hong Kong speaker would
naturally say it in everyday speech, in traditional characters with
jyutping. Give two versions where there are two natural ways. Use the
lesson's words where the line calls for them. Keep each line as short and
simple as the level needs. Do not explain."""
IB = """Translate each numbered Cantonese line into plain English, as literally as
stays natural. If a line is ambiguous, odd, or reads as written Chinese
rather than speech, say so after the translation in one short note."""
IC = """Check each numbered line against the list. For each line answer PASS, or
FLAG with one code and one sentence of reason. Do not rewrite any line. Only
flag a real fault; do not flag to be safe. Then answer the three chat
questions."""
A2_FORMAT = """
## How to answer

Answer every numbered line ({n} in all), in order, one line each, in this exact form and nothing else:

ID | first version in traditional characters | its jyutping | second version (or leave blank) | its jyutping

Example:
X-S0 | 早晨！ | zou2 san4 | |   (an example of the form only; X-S0 is not one of the lines)

Do not add explanations, headings or comments.
"""
LIMITS = """THE LIST

Level limits (beginner tier):
- A sentence aims for 4-8 Chinese characters. Up to 12 is allowed when it carries two of the lesson's words. Over 12 is a fault.
- A chat line aims for up to 9 characters. Over 12 is a fault.
- One idea per sentence. A short pair of clauses (a set phrase and a request, or two very short clauses side by side) is allowed sparingly.
- No connective words in a stand-alone sentence. In a chat, a plain connective may appear in at most two lines.
- The words around the lesson word must be common, everyday and plain.
- Register: neutral, everyday, spoken Hong Kong Cantonese. No written-Chinese forms, no slang, no formal register.

House list (already ruled on by a native speaker):
- Never use -> use instead: 好的 as an agreeing reply -> 好呀; 兒子 -> 仔; 女兒 -> 女; 嬰兒 -> BB; 鳥 -> 雀仔; 外公/外婆 -> 公公/婆婆; 激動 for "excited" -> 興奮; 派對 -> party; 圍巾 -> 頸巾; 棕色 -> 啡色; 找換 for "change money" -> 唱錢.
- Readings, as said: 弟弟 dai4 dai2; 嫲嫲 maa4 maa4; 藥房 joek6 fong4; 餐牌 caan1 paai2; 扮 baan6; 散紙 saan2 zi2; 聽歌 teng1 go1; 囉 lo1; 鴨 aap3; 凍檸茶 dung3 ning4 caa4.
- Fine as they are, do not flag: a question ending in 嗎; 想要; 提款機; 晚上好; and either word of these pairs: 旁邊/側邊 (beside), 椅/櫈 (chair), 蔬菜/菜 (vegetables).

Codes:
W  A written-Chinese or Mandarin-style word where speech uses another
P  A sentence-final particle missing, or the wrong one for the tone
C  The wrong classifier
S  Stiff: a full textbook sentence where a speaker would drop words
R  Wrong register for the scene
T  An English idiom translated word for word
H  Too hard for the tier: over length, two ideas, an uncommon surrounding word
J  Jyutping does not match the characters
E  The English does not match the Cantonese

The three chat questions (answer for each lesson's chat):
Q1  Does every reply follow from the line before it?
Q2  Does the chat have the goal, hitch and ending its scene card promises?
Q3  Is any lesson word there only to be there?"""

ap = argparse.ArgumentParser()
ap.add_argument('--draft', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--repo', default='.'); ap.add_argument('--round', default='1')
a = ap.parse_args()
DRAFT = load_draft(a.draft)
items, words = [], {}
for k, D in DRAFT.items():
    r = read_topic(a.repo, k)[1]['rounds'][a.round]
    words[k] = r['words']
    newp = {l['c']: l['p'] for l in D['new']}
    rwp = {v[0]['c']: v[0]['p'] for v in D['rewrite'].values()}
    for i, s in enumerate(r['sentences'], 1):
        status = 'new' if s['c'] in newp else 'rewritten' if s['c'] in rwp else 'kept'
        p = newp.get(s['c']) or rwp.get(s['c']) or D['keepP'][s['sid']]     # every kept line needs a purpose too
        items.append(dict(id=f"{D['pre']}-S{i}", lesson=k, kind='sent', status=status, sp=None, c=s['c'], j=s['j'], e=s['e'], p=p, sid=s['sid']))
    for i, (l, dl) in enumerate(zip(r['convo']['lines'], D['chat']), 1):
        assert l['c'] == dl['c'], f'{k} chat line {i}: the data is not this draft — inject first'
        items.append(dict(id=f"{D['pre']}-C{i}", lesson=k, kind='chat', status='new', sp='You' if l.get('u') else D['speakers'][0], c=l['c'], j=l['j'], e=l['e'], p=dl['p']))
def card(k):
    c = DRAFT[k]['card']
    return f"Scene for the chat — Who: {c['who']} Where: {c['where']} The learner wants: {c['goal']} Hitch: {c['hitch']} Ending: {c['end']}"
def wl(k): return '; '.join(f"{w['c']} ({w['j']}) {w['e']}" for w in words[k])
A, B, C = [], [], []
for k, D in DRAFT.items():
    it = [x for x in items if x['lesson'] == k]
    S = [x for x in it if x['kind'] == 'sent']; H = [x for x in it if x['kind'] == 'chat']
    A.append(f"## Lesson: {D['name']}\nLevel: beginner (the first tier of a Cantonese course).\nLesson words: {wl(k)}\n{card(k)}\n\n"
             "Sentences (each stands alone; what each one has to do):\n" + '\n'.join(f"{x['id']}. {x['p']}" for x in S) +
             "\n\nChat (in order; speaker in brackets; what each line has to do):\n" + '\n'.join(f"{x['id']}. [{x['sp']}] {x['p']}" for x in H))
    B.append(f"## Set {D['pre']}\nSentences (each stands alone):\n" + '\n'.join(f"{x['id']}. {x['c']}" for x in S) +
             "\n\nA conversation (in order; speaker in brackets):\n" + '\n'.join(f"{x['id']}. [{'B' if x['sp'] == 'You' else 'A'}] {x['c']}" for x in H))
    C.append(f"## Lesson: {D['name']}\nLesson words: {wl(k)}\n{card(k)}\n\nSentences (each stands alone):\n" +
             '\n'.join(f"{x['id']}. {x['c']} ({x['j']}) — \"{x['e']}\"" for x in S) + "\n\nChat (in order):\n" +
             '\n'.join(f"{x['id']}. [{x['sp']}] {x['c']} ({x['j']}) — \"{x['e']}\"" for x in H))
def put(sub, name, text):
    os.makedirs(os.path.join(a.out, sub), exist_ok=True)
    open(os.path.join(a.out, sub, name), 'w', encoding='utf-8').write(text)
pa = IA + "\n\n" + '\n\n'.join(A) + "\n"
put('A', 'packet.txt', pa)
put('A2', 'prompt.txt', pa + A2_FORMAT.format(n=len(items)))
put('B', 'packet.txt', IB + "\n\n" + '\n\n'.join(B) + "\n")
put('C', 'packet.txt', IC + "\n\n" + LIMITS + "\n\n" + '\n\n'.join(C) + "\n")
put('', 'items.json', json.dumps(items, ensure_ascii=False, indent=1))
print(len(items), 'lines →', a.out)
