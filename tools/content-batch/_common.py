"""Shared helpers for the content-batch scripts. Run by the authoring AI session,
not by the app and not on William's PC. See README.md."""
import importlib.util, json, re, os

HAN = re.compile(r'[㐀-鿿]')

def han(s):
    return [c for c in s if HAN.match(c)]

def syllables(j):
    return re.sub(r'[,.!?]', ' ', j).split()

def load_draft(path):
    spec = importlib.util.spec_from_file_location('draft', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.DRAFT

def topic_path(repo, key):
    return os.path.join(repo, 'data', 'topics', key + '.json')

def read_topic(repo, key):
    raw = open(topic_path(repo, key), encoding='utf-8').read()
    return raw, json.loads(raw)

def write_topic(repo, key, raw, data):
    # Keep the file's own indent and trailing newline, so the diff is only the content.
    m = re.search(r'\n( +)"', raw)
    out = json.dumps(data, ensure_ascii=False, indent=len(m.group(1)) if m else None)
    open(topic_path(repo, key), 'w', encoding='utf-8').write(out + ('\n' if raw.endswith('\n') else ''))

# The matching rule of CONTENT_PLAYBOOK.md §3: a reviewer's version agrees with the
# draft once punctuation, spelling variants and a sentence-final particle are set aside.
FINAL_PARTICLES = '呀啊啦喇喎㗎嘅呢吖囉咋噃添'
VARIANTS = (('凳', '櫈'), ('噉', '咁'), ('俾', '畀'), ('檯', '枱'), ('着', '著'), ('吓', '下'))

def norm(s):
    s = re.sub(r'[，。！？、,.!?\s～~…—\-]', '', s)
    for a, b in VARIANTS:
        s = s.replace(a, b)
    while s and s[-1] in FINAL_PARTICLES:
        s = s[:-1]
    return s
