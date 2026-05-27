// ===================================================================
// app.js — state, logic, helpers
// Loaded SECOND (after data.js). Word Review storage, helpers, state, patterns,
// audio, translation, speech recognition.
// ===================================================================

// ── Word Review storage layer ─────────────────────────────────────────────────
// ALL persistent access for the Word Review bin goes through these functions.
// They now sit on top of the storage module (storage.getWordReview / setWordReview)
// rather than touching localStorage directly. Public functions below keep their
// signatures unchanged, so no caller needed updating.
//
// Stored payload shape (under STORAGE_KEYS.wordReview, versioned envelope):
//   { everUsed: bool, entries: [ {topicKey, round, wordC, missCount, correctCount, addedAt} ] }
// Entry identity = topicKey | round | wordC  (same word in two topics = two entries).
const REVIEW_GRADUATE_AT = 3;   // consecutive correct (in review) to clear a word

function _reviewEntryKey(topicKey, round, wordC) {
  return topicKey + '|' + round + '|' + wordC;
}

// Internal: read the bin payload. Sync under the hood (storage cache) but kept
// async so the public API and all callers stay unchanged.
async function _readReviewStore() {
  const data = storage.getWordReview() || { everUsed: false, entries: [] };
  return {
    everUsed: !!data.everUsed,
    entries: Array.isArray(data.entries) ? data.entries : [],
  };
}

// Internal: persist the bin payload via the storage module.
async function _writeReviewStore(data) {
  await storage.setWordReview(data);
}

// Return all bin entries (array).
async function getBin() {
  return (await _readReviewStore()).entries;
}

// Record a missed word. New word → new entry. Already-binned word → missCount++,
// correctCount reset to 0 (a fresh miss undoes review progress).
async function addMiss(topicKey, round, wordC) {
  const data = await _readReviewStore();
  data.everUsed = true;
  const key = _reviewEntryKey(topicKey, round, wordC);
  const existing = data.entries.find(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) === key);
  if (existing) {
    existing.missCount += 1;
    existing.correctCount = 0;
  } else {
    data.entries.push({
      topicKey, round, wordC,
      missCount: 1,
      correctCount: 0,
      addedAt: Date.now(),
    });
  }
  await _writeReviewStore(data);
}

// Record a review-session result for one entry. Correct → correctCount++, and if
// it reaches REVIEW_GRADUATE_AT the entry is removed (graduated). Wrong → reset to 0.
// Returns { graduated: bool } so the caller can show feedback.
async function recordReviewResult(topicKey, round, wordC, wasCorrect) {
  const data = await _readReviewStore();
  const key = _reviewEntryKey(topicKey, round, wordC);
  const entry = data.entries.find(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) === key);
  if (!entry) { return { graduated: false }; }
  let graduated = false;
  if (wasCorrect) {
    entry.correctCount += 1;
    if (entry.correctCount >= REVIEW_GRADUATE_AT) {
      data.entries = data.entries.filter(e => e !== entry);
      graduated = true;
    }
  } else {
    entry.correctCount = 0;
  }
  await _writeReviewStore(data);
  return { graduated };
}

// Remove an entry outright — used to silently drop words that can no longer be
// resolved (their topic/round/word no longer exists in the topic JSON).
async function dropBinEntry(topicKey, round, wordC) {
  const data = await _readReviewStore();
  const key = _reviewEntryKey(topicKey, round, wordC);
  data.entries = data.entries.filter(e => _reviewEntryKey(e.topicKey, e.round, e.wordC) !== key);
  await _writeReviewStore(data);
}

// Stats for the menu badge and empty-state logic.
// liveCount = words currently in the bin; everUsed = bin has been used at least once.
async function getReviewStats() {
  const data = await _readReviewStore();
  return { liveCount: data.entries.length, everUsed: data.everUsed };
}

// ── Round accessors — single point of truth for "what content is in topic+round" ──
// These assume the topic has been loaded; return safe defaults otherwise.
function getAvailableRounds(topic) {
  return store.availableRounds(topic);
}
function getRoundWords(topic, round) {
  return store.roundData(topic, round)?.words || [];
}
function getRoundSentences(topic, round) {
  return store.roundData(topic, round)?.sentences || [];
}
function getRoundConvo(topic, round) {
  return store.roundData(topic, round)?.convo || null;
}
function getRoundNote(topic, round) {
  return store.roundData(topic, round)?.note || null;
}
function getTopicsByCategory(categoryKey) {
  return store.topicsByCategory(categoryKey);
}

// ── Lesson shape helper ──
// Synthesises the legacy { label, icon, color, words, note } object that the
// existing render functions expect, drawn from the cached topic file.
// Falls back to index metadata if topic file isn't loaded yet.
function lessonShape(key) {
  const meta = store.topicMeta(key);
  if (!meta) return { label: '', icon: '', color: '#888', words: [], note: null };
  const r1 = store.roundData(key, 1) || {};
  return {
    label: meta.label,
    icon:  meta.icon,
    color: meta.color,
    words: r1.words || [],
    note:  r1.note  || null,
  };
}

const TONES = {
  "1":{"color":"#E74C3C","desc":"High level",  "ex":"詩 si1"},
  "2":{"color":"#E67E22","desc":"High rising", "ex":"史 si2"},
  "3":{"color":"#c8a200","desc":"Mid level",   "ex":"試 si3"},
  "4":{"color":"#27AE60","desc":"Low falling", "ex":"時 si4"},
  "5":{"color":"#2980B9","desc":"Low rising",  "ex":"市 si5"},
  "6":{"color":"#8E44AD","desc":"Low level",   "ex":"事 si6"},
};

// ── Patterns ──────────────────────────────────────────────────────────────────
const PATTERNS = [
  { label:"I want to…",              structure:"ngo5 soeng2 + [verb]",
    note:"The most useful starter — attach any verb to express what you want to do.",
    examples:[{c:"我想食",j:"ngo5 soeng2 sik6",e:"I want to eat"},{c:"我想飲茶",j:"ngo5 soeng2 jam2 caa4",e:"I want to drink tea"},{c:"我想去",j:"ngo5 soeng2 heoi3",e:"I want to go"}],
    drill:{ frameC:"我想 ▢", frameJ:"ngo5 soeng2 ▢", english:"I want to drink tea",
      answer:{c:"飲茶",j:"jam2 caa4",e:"drink tea"},
      distractors:[{c:"食飯",j:"sik6 faan6",e:"eat"},{c:"瞓覺",j:"fan3 gaau3",e:"sleep"},{c:"行街",j:"haang4 gaai1",e:"go shopping"}],
      topics:["food","restaurant","shopping","hobbies","transport"] }},
  { label:"I'll have / I need…",     structure:"ngo5 jiu3 + [noun]",
    note:"Use for ordering food, asking for things, or stating what you need.",
    examples:[{c:"我要水",j:"ngo5 jiu3 seoi2",e:"I need water"},{c:"我要三個",j:"ngo5 jiu3 saam1 go3",e:"I'll take three"},{c:"我要呢個",j:"ngo5 jiu3 ni1 go3",e:"I want this one"}],
    drill:{ frameC:"我要 ▢", frameJ:"ngo5 jiu3 ▢", english:"I'll have water",
      answer:{c:"水",j:"seoi2",e:"water"},
      distractors:[{c:"茶",j:"caa4",e:"tea"},{c:"飯",j:"faan6",e:"rice"},{c:"咖啡",j:"gaa3 fe1",e:"coffee"}],
      topics:["restaurant","food","shopping","hotels"] }},
  { label:"Do you have…?",           structure:"jau5 mou5 + [noun]?",
    note:"A very natural way to ask about availability — literally 'have or not have?'",
    examples:[{c:"有冇茶？",j:"jau5 mou5 caa4?",e:"Do you have tea?"},{c:"有冇折？",j:"jau5 mou5 zit3?",e:"Is there a discount?"},{c:"有冇平啲？",j:"jau5 mou5 peng4 di1?",e:"Is there a cheaper one?"}],
    drill:{ frameC:"有冇 ▢ ？", frameJ:"jau5 mou5 ▢ ？", english:"Do you have tea?",
      answer:{c:"茶",j:"caa4",e:"tea"},
      distractors:[{c:"房",j:"fong2",e:"a room"},{c:"位",j:"wai2",e:"a seat"},{c:"散紙",j:"saan2 zi2",e:"change"}],
      topics:["restaurant","shopping","hotels","food"] }},
  { label:"Where is…?",              structure:"[noun] + hai2 bin1 dou6?",
    note:"Put the thing you're looking for at the start, then ask where it is.",
    examples:[{c:"洗手間喺邊度？",j:"sai2 sau2 gaan1 hai2 bin1 dou6?",e:"Where is the bathroom?"},{c:"地鐵站喺邊度？",j:"dei6 tit3 zaam6 hai2 bin1 dou6?",e:"Where is the MTR station?"},{c:"呢個喺邊度？",j:"ni1 go3 hai2 bin1 dou6?",e:"Where is this?"}],
    drill:{ frameC:"▢ 喺邊度？", frameJ:"▢ hai2 bin1 dou6?", english:"Where is the bathroom?",
      answer:{c:"洗手間",j:"sai2 sau2 gaan1",e:"the bathroom"},
      distractors:[{c:"地鐵站",j:"dei6 tit3 zaam6",e:"the MTR station"},{c:"酒店",j:"zau2 dim3",e:"the hotel"},{c:"出口",j:"ceot1 hau2",e:"the exit"}],
      topics:["directions","transport","hotels","attractions"] }},
  { label:"How much?",               structure:"gei2 cin2?",
    note:"Works alone or after pointing at something. Add ni1 go3 (this one) for clarity.",
    examples:[{c:"幾錢？",j:"gei2 cin2?",e:"How much?"},{c:"呢個幾錢？",j:"ni1 go3 gei2 cin2?",e:"How much is this one?"},{c:"大概幾錢？",j:"daai6 koi3 gei2 cin2?",e:"Approximately how much?"}]},
  { label:"Please give me…",         structure:"m4 goi1 bei2 + [noun] + ngo5",
    note:"Very common in restaurants and shops. Note how 'me' comes at the end.",
    examples:[{c:"唔該俾杯茶我",j:"m4 goi1 bei2 bui1 caa4 ngo5",e:"Please give me a cup of tea"},{c:"唔該俾個袋我",j:"m4 goi1 bei2 go3 doi2 ngo5",e:"Please give me a bag"},{c:"唔該俾筷子我",j:"m4 goi1 bei2 faai3 zi2 ngo5",e:"Please give me chopsticks"}]},
  { label:"Very…",                   structure:"hou2 + [adjective]",
    note:"hou2 intensifies any adjective. Stack it for extra emphasis — hou2 hou2 means 'very very good'.",
    examples:[{c:"好熱",j:"hou2 jit6",e:"Very hot"},{c:"好味",j:"hou2 mei6",e:"Very delicious"},{c:"好貴",j:"hou2 gwai3",e:"Very expensive"},{c:"好好",j:"hou2 hou2",e:"Very good"}],
    drill:{ frameC:"好 ▢", frameJ:"hou2 ▢", english:"Very hot",
      answer:{c:"熱",j:"jit6",e:"hot"},
      distractors:[{c:"凍",j:"dung3",e:"cold"},{c:"貴",j:"gwai3",e:"expensive"},{c:"攰",j:"gui6",e:"tired"}],
      topics:["weather","feelings","shopping","food"] }},
  { label:"Not / Don't…",            structure:"m4 + [verb or adjective]",
    note:"m4 is the general negation particle. Place it directly before the verb or adjective.",
    examples:[{c:"我唔明",j:"ngo5 m4 ming4",e:"I don't understand"},{c:"唔貴",j:"m4 gwai3",e:"Not expensive"},{c:"我唔要",j:"ngo5 m4 jiu3",e:"I don't want it"},{c:"唔係",j:"m4 hai6",e:"That's not right"}]},
  { label:"Yes/no question",         structure:"[statement] + maa3?",
    note:"Add maa3 to the end of any statement to turn it into a yes/no question.",
    examples:[{c:"你好嗎？",j:"nei5 hou2 maa3?",e:"Are you well?"},{c:"貴嗎？",j:"gwai3 maa3?",e:"Is it expensive?"},{c:"你識講廣東話嗎？",j:"nei5 sik1 gong2 gwong2 dung1 waa6 maa3?",e:"Do you speak Cantonese?"}]},
  { label:"What would you like to…?",structure:"soeng2 + [verb] + di1 me1?",
    note:"A polite way to ask what someone wants — common in service situations.",
    examples:[{c:"想食啲咩？",j:"soeng2 sik6 di1 me1?",e:"What would you like to eat?"},{c:"想飲啲咩？",j:"soeng2 jam2 di1 me1?",e:"What would you like to drink?"},{c:"想買啲咩？",j:"soeng2 maai5 di1 me1?",e:"What would you like to buy?"}]},
  { label:"I feel…",                 structure:"ngo5 gok3 dak1 + [adjective]",
    note:"Use this to describe how you're feeling physically or emotionally.",
    examples:[{c:"我覺得好攰",j:"ngo5 gok3 dak1 hou2 gui6",e:"I feel very tired"},{c:"我覺得好凍",j:"ngo5 gok3 dak1 hou2 dung3",e:"I feel very cold"},{c:"我覺得唔舒服",j:"ngo5 gok3 dak1 m4 syu1 fuk6",e:"I feel unwell"}],
    drill:{ frameC:"我覺得 ▢", frameJ:"ngo5 gok3 dak1 ▢", english:"I feel very tired",
      answer:{c:"好攰",j:"hou2 gui6",e:"very tired"},
      distractors:[{c:"好凍",j:"hou2 dung3",e:"very cold"},{c:"開心",j:"hoi1 sam1",e:"happy"},{c:"肚餓",j:"tou5 ngo6",e:"hungry"}],
      topics:["feelings","body","weather"] }},
  { label:"Going to…",               structure:"heoi3 + [place]",
    note:"Simple and direct. Works for saying where you're going or asking where to go.",
    examples:[{c:"去中環",j:"heoi3 zung1 waan4",e:"Going to Central"},{c:"去邊度？",j:"heoi3 bin1 dou6?",e:"Where are you going?"},{c:"我去超市",j:"ngo5 heoi3 ciu1 si5",e:"I'm going to the supermarket"}],
    drill:{ frameC:"去 ▢", frameJ:"heoi3 ▢", english:"Going to Central",
      answer:{c:"中環",j:"zung1 waan4",e:"Central"},
      distractors:[{c:"超市",j:"ciu1 si5",e:"the supermarket"},{c:"酒店",j:"zau2 dim3",e:"the hotel"},{c:"學校",j:"hok6 haau6",e:"school"}],
      topics:["transport","directions","attractions","shopping"] }},
  { label:"See you at / on…",        structure:"[time] + gin3",
    note:"Put any time word before gin3 to arrange when to meet.",
    examples:[{c:"聽日見",j:"ting1 jat6 gin3",e:"See you tomorrow"},{c:"朝早見",j:"ziu1 zou2 gin3",e:"See you in the morning"},{c:"星期六見",j:"sing1 kei4 luk6 gin3",e:"See you Saturday"}]},
  { label:"Is that ok / Can I?",     structure:"dak1 m4 dak1?",
    note:"Literally 'ok or not ok?' — use to seek permission or check if something works.",
    examples:[{c:"咁得唔得？",j:"gam2 dak1 m4 dak1?",e:"Is this ok?"},{c:"我坐喺呢度得唔得？",j:"ngo5 co5 hai2 ni1 dou6 dak1 m4 dak1?",e:"Can I sit here?"},{c:"而家去得唔得？",j:"ji4 gaa1 heoi3 dak1 m4 dak1?",e:"Can we go now?"}]},
  { label:"Too…!",                   structure:"taai3 + [adjective] + laa3",
    note:"Express that something is excessive. laa3 adds a sense of finality or mild complaint.",
    examples:[{c:"太貴喇",j:"taai3 gwai3 laa3",e:"Too expensive!"},{c:"太熱喇",j:"taai3 jit6 laa3",e:"Too hot!"},{c:"太多喇",j:"taai3 do1 laa3",e:"Too much!"}],
    drill:{ frameC:"太 ▢ 喇", frameJ:"taai3 ▢ laa3", english:"Too expensive!",
      answer:{c:"貴",j:"gwai3",e:"expensive"},
      distractors:[{c:"熱",j:"jit6",e:"hot"},{c:"多",j:"do1",e:"much"},{c:"遠",j:"jyun5",e:"far"}],
      topics:["shopping","weather","food","directions"] }},
  { label:"Can I / May I…?",         structure:"ho2 m4 ho2 ji5 + [verb]?",
    note:"A polite way to ask permission — more formal than dak1 m4 dak1.",
    examples:[{c:"可唔可以講慢啲？",j:"ho2 m4 ho2 ji5 gong2 maan6 di1?",e:"Can you speak more slowly?"},{c:"可唔可以睇吓？",j:"ho2 m4 ho2 ji5 tai2 haa5?",e:"Can I take a look?"},{c:"可唔可以等我？",j:"ho2 m4 ho2 ji5 dang2 ngo5?",e:"Can you wait for me?"}]},
  { label:"What is…?",               structure:"[noun] + hai6 mat1 je5?",
    note:"Use when you want to know what something is called or what something means.",
    examples:[{c:"呢個係咩嘢？",j:"ni1 go3 hai6 mat1 je5?",e:"What is this?"},{c:"呢個字係咩嘢？",j:"ni1 go3 zi6 hai6 mat1 je5?",e:"What does this word mean?"},{c:"果個係咩嘢？",j:"go2 go3 hai6 mat1 je5?",e:"What is that?"}]},
  { label:"Why…?",                   structure:"dim2 gaai3 + [statement]?",
    note:"Place dim2 gaai3 at the start of any statement to turn it into a 'why' question.",
    examples:[{c:"點解咁貴？",j:"dim2 gaai3 gam3 gwai3?",e:"Why is it so expensive?"},{c:"點解唔去？",j:"dim2 gaai3 m4 heoi3?",e:"Why aren't you going?"},{c:"點解咁熱？",j:"dim2 gaai3 gam3 jit6?",e:"Why is it so hot?"}]},
  { label:"There's also… / And also…",structure:"zung6 jau5 + [noun/verb]",
    note:"Use to add something on top of what's already been said — great for ordering.",
    examples:[{c:"仲有茶",j:"zung6 jau5 caa4",e:"And also tea"},{c:"仲有一個",j:"zung6 jau5 jat1 go3",e:"One more"},{c:"仲有咩嘢？",j:"zung6 jau5 mat1 je5?",e:"What else is there?"}],
    drill:{ frameC:"仲有 ▢", frameJ:"zung6 jau5 ▢", english:"There's also tea",
      answer:{c:"茶",j:"caa4",e:"tea"},
      distractors:[{c:"一個",j:"jat1 go3",e:"one more"},{c:"時間",j:"si4 gaan3",e:"time"},{c:"問題",j:"man6 tai4",e:"a question"}],
      topics:["restaurant","food","shopping"] }},
  { label:"A bit more / less…",      structure:"[adjective] + di1",
    note:"Adding di1 after an adjective softens it — useful for polite requests.",
    examples:[{c:"慢啲",j:"maan6 di1",e:"A bit slower"},{c:"平啲",j:"peng4 di1",e:"A bit cheaper"},{c:"多啲",j:"do1 di1",e:"A bit more"},{c:"少啲",j:"siu2 di1",e:"A bit less"}]},
  { label:"I like…",                 structure:"ngo5 zung1 ji3 + [noun/verb]",
    note:"Express preferences for things, food, activities or people.",
    examples:[{c:"我鍾意食",j:"ngo5 zung1 ji3 sik6",e:"I like eating"},{c:"我鍾意茶",j:"ngo5 zung1 ji3 caa4",e:"I like tea"},{c:"我鍾意呢個",j:"ngo5 zung1 ji3 ni1 go3",e:"I like this one"}],
    drill:{ frameC:"我鍾意 ▢", frameJ:"ngo5 zung1 ji3 ▢", english:"I like tea",
      answer:{c:"茶",j:"caa4",e:"tea"},
      distractors:[{c:"跑步",j:"paau2 bou6",e:"running"},{c:"音樂",j:"jam1 ngok6",e:"music"},{c:"狗",j:"gau2",e:"dogs"}],
      topics:["food","hobbies","sports","animals"] }},
  { label:"Give [someone] [something]",structure:"bei2 + [thing] + [person]",
    note:"bei2 means 'give' or 'let'. The person receiving comes at the end — opposite to English.",
    examples:[{c:"俾我",j:"bei2 ngo5",e:"Give me / let me"},{c:"俾佢睇",j:"bei2 keoi5 tai2",e:"Let him see it"},{c:"我俾你",j:"ngo5 bei2 nei5",e:"I'll give you"}]},
  { label:"I will…",                 structure:"ngo5 wui5 + [verb]",
    note:"Use wui5 to talk about future intentions or promises.",
    examples:[{c:"我會去",j:"ngo5 wui5 heoi3",e:"I will go"},{c:"我會記得",j:"ngo5 wui5 gei3 dak1",e:"I will remember"},{c:"我會打俾你",j:"ngo5 wui5 daa2 bei2 nei5",e:"I will call you"}]},
  { label:"Have never / Not yet done",structure:"mei6 + [verb] + gwo",
    note:"mei6...gwo expresses something you haven't experienced yet. Very useful for travel.",
    examples:[{c:"我未食過",j:"ngo5 mei6 sik6 gwo",e:"I've never eaten it"},{c:"我未去過",j:"ngo5 mei6 heoi3 gwo",e:"I've never been there"},{c:"我未見過",j:"ngo5 mei6 gin3 gwo",e:"I've never seen it"}]},
  { label:"Already done…",           structure:"[verb] + zo2 laa3",
    note:"zo2 marks completion — something has already happened. laa3 adds a sense of 'just now'.",
    examples:[{c:"食咗喇",j:"sik6 zo2 laa3",e:"Already eaten"},{c:"去咗喇",j:"heoi3 zo2 laa3",e:"Already gone"},{c:"買咗喇",j:"maai5 zo2 laa3",e:"Already bought it"}]},
  { label:"How long?",               structure:"gei2 noi6?",
    note:"Use to ask about duration — how long something takes or lasts.",
    examples:[{c:"幾耐？",j:"gei2 noi6?",e:"How long?"},{c:"要等幾耐？",j:"jiu3 dang2 gei2 noi6?",e:"How long do I have to wait?"},{c:"去幾耐？",j:"heoi3 gei2 noi6?",e:"How long does it take to get there?"}]},
  { label:"Together / Let's…",       structure:"jat1 cai4 + [verb]",
    note:"jat1 cai4 means 'together' — add it before any verb to suggest doing something jointly.",
    examples:[{c:"一齊去",j:"jat1 cai4 heoi3",e:"Let's go together"},{c:"一齊食",j:"jat1 cai4 sik6",e:"Let's eat together"},{c:"一齊啦",j:"jat1 cai4 laa1",e:"Come on, let's do it together"}]},
  { label:"First… then…",            structure:"sin1 + [verb]… zoi3 + [verb]",
    note:"sin1 means 'first' and zoi3 means 'then/again' — use them to sequence actions.",
    examples:[{c:"先食，再去",j:"sin1 sik6, zoi3 heoi3",e:"First eat, then go"},{c:"先講，再做",j:"sin1 gong2, zoi3 zou6",e:"First talk, then act"},{c:"先等我",j:"sin1 dang2 ngo5",e:"Wait for me first"}]},
  { label:"I think…",                structure:"ngo5 lam2 + [statement]",
    note:"ngo5 lam2 softly expresses an opinion or guess — less certain than stating a fact.",
    examples:[{c:"我諗係",j:"ngo5 lam2 hai6",e:"I think so"},{c:"我諗唔係",j:"ngo5 lam2 m4 hai6",e:"I don't think so"},{c:"我諗佢唔嚟",j:"ngo5 lam2 keoi5 m4 lai4",e:"I think he's not coming"}]},
  { label:"Wait a moment / Wait for…",structure:"dang2 + [person/time]",
    note:"dang2 means 'wait'. Use alone for 'wait a moment' or add who/how long to wait.",
    examples:[{c:"等我",j:"dang2 ngo5",e:"Wait for me"},{c:"等吓",j:"dang2 haa5",e:"Wait a moment"},{c:"等一陣",j:"dang2 jat1 zan6",e:"Wait a little while"}]},
];
// ── Audio ─────────────────────────────────────────────────────────────────────
let _voices = null;

function loadVoices() {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { _voices = v; resolve(v); return; }
    const handler = () => {
      _voices = window.speechSynthesis.getVoices();
      resolve(_voices);
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => { _voices = window.speechSynthesis.getVoices(); resolve(_voices); }, 2500);
  });
}

function pickVoicePair(voices) {
  const zh = voices.filter(v => v.lang === 'zh-HK' || v.lang === 'zh-TW' || v.lang.startsWith('zh'));
  if (zh.length === 0) return { a: null, b: null };
  // Primary voice: prefer Cantonese (zh-HK), then any other zh.
  // Without this, systems that list zh-CN first (e.g. Chrome on Windows) would
  // play Mandarin audio even though a perfectly good zh-HK voice exists.
  const a = zh.find(v => v.lang === 'zh-HK')
          || zh.find(v => v.lang === 'zh-TW')
          || zh[0];
  // Secondary voice for the second speaker: prefer another zh-HK voice if
  // there's more than one, otherwise any other zh voice, otherwise reuse `a`.
  const sameLang = zh.filter(v => v.lang === a.lang && v !== a);
  const b = sameLang[0] || zh.find(v => v !== a) || null;
  return { a, b };
}

async function speak(text, onEnd, voiceOverride, pitchOverride, langOverride) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const voices = _voices || await loadVoices();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langOverride || 'zh-HK';
  const rates = { slow: 0.6, normal: 0.8, fast: 1.1 };
  utt.rate  = rates[state.speed] || 0.8;
  utt.pitch = pitchOverride !== undefined ? pitchOverride : 1.0;
  const { a } = pickVoicePair(voices);
  if (voiceOverride) utt.voice = voiceOverride;
  else if (a) utt.voice = a;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// Speak as a specific conversation speaker — uses subtle pitch variation
async function speakAs(text, isUser, onEnd) {
  const voices = _voices || await loadVoices();
  const { a } = pickVoicePair(voices);
  const pitch = isUser ? 0.85 : 1.1;
  speak(text, onEnd, a, pitch, 'zh-HK');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function colorJyutping(text) {
  return text.split(' ').map(syl => {
    const tone = syl.match(/[1-6]/);
    const color = tone ? TONES[tone[0]].color : '#777';
    return `<span style="color:${color};font-weight:700">${syl}</span>`;
  }).join(' ');
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  speed: 'normal',
  nav: 'topics',
  drawerOpen: false,
  homeView: true,                 // true = show home screen, false = inside a topic
  selectedCategory: 'all',        // 'all' or a category key
  currentRound: 1,
  pathView: 'list',               // 'list' = paths list, 'timeline' = inside a path
  activePath: 'beginner',         // which path is being viewed
  pathProgress: {},               // { beginner: { greetings:true, ... }, ... } — loaded from localStorage
  fromPath: false,                // true when user entered a topic via the Learning Path
  fromPathTier: null,             // the tier of the path step they entered — preserved if they switch tier mid-study
  pathToast: null,
  headerDetailsOpen: false,             // ⓘ in header expands tone legend + speed settings
  voiceBannerDismissed: false,          // user has tapped × on the voice banner                // { text, kind } — transient completion overlay; cleared after timeout
  translate: {
    direction:   'en-yue',     // 'en-yue' | 'yue-en'
    inputText:   '',
    result:      null,
    loading:     false,
    error:       null,
    showApiKey:  false,
    listening:   false,
  },
  topic: 'greetings',
  mode:  'study',
  tab:   'words',          // 'words' | 'convo'
  flipped: {},
  speaking: null,
  sentenceBreakdownOpen: {},
  sentenceRevealed: {},
  patternRevealed: {},
  voiceInfo: null,
  quiz: null,
  // Word Review session — null when not in a session. Shape set by startWordReview().
  wordReview: null,
  // Pattern Drill session — null when not in a session. Shape set by startPatternDrill().
  patternDrill: null,
  // Which tab the Patterns page shows: 'browse' (reference) or 'drill'.
  patternsTab: 'browse',
  // Cached {liveCount, everUsed} for the menu badge — refreshed by refreshReviewBadge().
  reviewBadge: { liveCount: 0, everUsed: false },
  convo: {
    convMode: 'read',
    playingLine: null,
    gapAnswers: {},
    bubbleRevealed: {},
    breakdownOpen: {},
    speakStep: 0,
    speakStatus: 'idle',     // 'idle' | 'listening' | 'matched' | 'mismatch'
    speakHeard: '',
    speakAutoPlayed: false,
    speakRevealed: {},
  },
};

// ── Navigation history ────────────────────────────────────────────────────────
// Makes the phone/browser BACK button step back through in-app screens instead
// of exiting the whole app. The app is a single-page app, so the browser only
// knows about one page unless we tell it otherwise.
//
// How it works:
//  - NAV_FIELDS lists the state fields that together define "which screen".
//  - navSnapshot() captures those fields into a plain object.
//  - pushNav() is called AFTER a navigation handler has mutated state; it pushes
//    the new snapshot onto the browser history stack via history.pushState.
//  - the popstate listener (in render.js) fires when BACK is pressed; it reads
//    the snapshot the browser hands back and restores those fields, then renders.
//
// Design note: navigation handlers keep their existing mutation logic untouched.
// pushNav() only OBSERVES the resulting state and records it — it does not change
// how navigation works, only makes the browser aware of it. Low-risk by design.
const NAV_FIELDS = [
  'nav', 'drawerOpen', 'homeView', 'pathView', 'activePath',
  'topic', 'currentRound', 'fromPath', 'fromPathTier',
  'mode', 'tab', 'selectedCategory',
];

// Capture the current navigation-relevant state into a plain snapshot object.
function navSnapshot() {
  const snap = {};
  NAV_FIELDS.forEach(f => { snap[f] = state[f]; });
  return snap;
}

// Apply a snapshot back onto state (used by the popstate/back handler).
function applyNavSnapshot(snap) {
  if (!snap) return;
  NAV_FIELDS.forEach(f => {
    if (f in snap) state[f] = snap[f];
  });
}

// True once the initial history entry has been seeded by init().
let _navReady = false;

// Push the current screen onto the browser history stack. Call this AFTER a
// navigation handler has finished mutating state. Safe to call before init has
// seeded history (it simply no-ops until then).
function pushNav() {
  if (!_navReady) return;
  try {
    history.pushState(navSnapshot(), '');
  } catch (e) {
    // pushState can throw in rare sandboxed contexts — navigation still works,
    // only the back-button integration is unavailable.
  }
}

// Seed the very first history entry. Called once by init(). Uses replaceState so
// the app's starting screen IS the bottom of the history stack — pressing back
// from there exits the app, which is correct.
function initNavHistory() {
  try {
    history.replaceState(navSnapshot(), '');
  } catch (e) { /* see pushNav */ }
  _navReady = true;
}

// Replace the current history entry with the current screen, instead of pushing
// a new one. Used when navigating FROM the drawer: the drawer-open entry should
// be overwritten by the destination, so BACK doesn't reopen the drawer.
function navReplace() {
  if (!_navReady) return;
  try {
    history.replaceState(navSnapshot(), '');
  } catch (e) { /* see pushNav */ }
}

// Close the drawer. If the drawer-open pushed a history entry we step back
// through it (keeps the stack honest); otherwise just close directly.
function closeDrawer() {
  if (!state.drawerOpen) return;
  if (_navReady) {
    history.back();          // triggers popstate → restores pre-drawer snapshot
  } else {
    state.drawerOpen = false;
    render();
  }
}

function getQuizInitState(words) {
  // One question per word — no artificial cap. Shuffle so order varies each run.
  const queue = shuffle(words);
  return {
    queue,
    idx: 0,
    score: 0,
    selected: null,
    done: false,
    choices: buildChoices(queue[0], words),
    wrongAnswers: [],   // [{ word: <wordObj>, chosen: <chosen option obj> }]
    direction: loadQuizDirection(),   // 'zh-en' | 'en-zh' | 'listen-en'
  };
}

// Persistence for the user's preferred quiz direction — via the storage module.
function loadQuizDirection() {
  return storage.getQuizDirection() || 'zh-en';
}
function saveQuizDirection(dir) {
  storage.setQuizDirection(dir);
}

function buildChoices(answer, all) {
  const others = shuffle(all.filter(w => w.c !== answer.c)).slice(0, 3);
  return shuffle([...others, answer]);
}

// Move to the next quiz question, or mark done.
function advanceQuiz() {
  const q = state.quiz;
  if (!q) return;
  const next = q.idx + 1;
  if (next >= q.queue.length) {
    q.done = true;
  } else {
    q.idx = next;
    q.selected = null;
    q.choices = buildChoices(q.queue[next], getRoundWords(state.topic, state.currentRound));
  }
  render();
}

// ── Word Review session ───────────────────────────────────────────────────────
const REVIEW_SESSION_CAP = 20;   // max words per review session; oldest-missed first
                                 // BACKLOG: make this user-configurable in Settings

// Refresh the cached menu badge counts. Call after any bin mutation that the user
// should see reflected (e.g. finishing a quiz, finishing a review session).
async function refreshReviewBadge() {
  state.reviewBadge = await getReviewStats();
}

// Build and start a Word Review session. Pulls the bin, takes the oldest-missed
// REVIEW_SESSION_CAP words, loads their topics, rehydrates each word from its
// topic JSON, and silently drops any entry that can no longer be resolved.
async function startWordReview() {
  const bin = await getBin();
  // Oldest-missed first so long-standing misses surface before recent ones.
  const ordered = bin.slice().sort((a, b) => a.addedAt - b.addedAt);
  const picked = ordered.slice(0, REVIEW_SESSION_CAP);

  // Load every topic referenced by the picked entries (parallel, cached).
  const topicKeys = [...new Set(picked.map(e => e.topicKey))];
  try {
    await store.loadTopics(topicKeys);
  } catch (e) {
    // A topic failed to load — individual rehydration below will skip what it must.
  }

  // Rehydrate: pair each bin entry with its live word object from the topic JSON.
  // If the topic/round/word no longer exists, silently drop the entry from the bin.
  const items = [];
  for (const entry of picked) {
    const words = getRoundWords(entry.topicKey, entry.round);
    const word = words.find(w => w.c === entry.wordC);
    if (!word) {
      await dropBinEntry(entry.topicKey, entry.round, entry.wordC);
      continue;
    }
    items.push({ entry, word, pool: words });
  }

  if (!items.length) {
    // Everything we picked was unresolvable (or the bin was empty) — show the
    // appropriate empty state rather than an empty session.
    state.wordReview = null;
    await refreshReviewBadge();
    render();
    return;
  }

  const queue = shuffle(items);
  state.wordReview = {
    queue,
    idx: 0,
    selected: null,
    done: false,
    correctThisSession: 0,
    graduatedThisSession: 0,
    direction: loadQuizDirection(),               // shares the quiz's saved preference
    choices: buildReviewChoices(queue[0]),
  };
  // A review session is one "screen" for history. Pushing here means the phone
  // BACK button (and the on-screen Done button, which calls history.back) exits
  // the session back to the landing screen. The popstate handler clears
  // state.wordReview whenever it lands on the review screen via back.
  pushNav();
  render();
}

// Build the 4 choice options for a review item — 3 distractors drawn from the
// word's OWN topic round pool, plus the answer, shuffled. Mirrors buildChoices.
function buildReviewChoices(item) {
  const others = shuffle(item.pool.filter(w => w.c !== item.word.c)).slice(0, 3);
  return shuffle([...others, item.word]);
}

// Advance the review session to the next word, or mark it done.
function advanceWordReview() {
  const wr = state.wordReview;
  if (!wr) return;
  const next = wr.idx + 1;
  if (next >= wr.queue.length) {
    wr.done = true;
    refreshReviewBadge().then(render);
    return;
  }
  wr.idx = next;
  wr.selected = null;
  wr.choices = buildReviewChoices(wr.queue[next]);
  render();
}

// ── Pattern Drill session ─────────────────────────────────────────────────────
// A drill quizzes sentence patterns: a pattern frame with one slot blanked, the
// learner picks the vocab that fills it. One question per pattern. Only patterns
// that carry a `drill` object are included. Built on renderQuizCore, same as the
// quiz and Word Review.
//
// state.patternDrill shape (null when not in a drill):
//   { queue: [pattern,…], idx, selected (choice index|null), done,
//     score, choices: [option,…] }
// A drill option is a plain { c, j, e } word object; the answer object is
// pattern.drill.answer, the distractors are pattern.drill.distractors.

// Build the 4 shuffled choices for one drill pattern: the answer + its 3 distractors.
function buildDrillChoices(pattern) {
  const d = pattern.drill;
  return shuffle([d.answer, ...d.distractors]);
}

// Patterns relevant to a topic = those whose drill.topics array includes the
// topic key. Single source of truth for "which patterns belong to this topic" —
// used by the Learn-tab patterns section and the topic-scoped drill.
function getTopicPatterns(topicKey) {
  return PATTERNS.filter(p => p.drill && Array.isArray(p.drill.topics)
    && p.drill.topics.includes(topicKey));
}

// Start a pattern drill session.
//  - No argument  → drills every pattern that has a drill object (legacy / library).
//  - topicKey     → drills only that topic's patterns (the Learn-tab drill).
// state.patternDrill.topicKey records the scope (null = all) so the drill view
// can show "← <Topic>" and return there.
function startPatternDrill(topicKey) {
  const drillable = topicKey
    ? getTopicPatterns(topicKey)
    : PATTERNS.filter(p => p.drill);
  if (!drillable.length) { state.patternDrill = null; render(); return; }
  const queue = shuffle(drillable);
  state.patternDrill = {
    queue,
    idx: 0,
    selected: null,
    done: false,
    score: 0,
    topicKey: topicKey || null,
    choices: buildDrillChoices(queue[0]),
  };
  // A drill session is one "screen" for the back button — entering it pushes a
  // history entry, so phone BACK (and the on-screen exit) leaves the session.
  pushNav();
  render();
}

// Advance the drill to the next pattern, or mark the session done.
function advancePatternDrill() {
  const pd = state.patternDrill;
  if (!pd) return;
  const next = pd.idx + 1;
  if (next >= pd.queue.length) {
    pd.done = true;
    render();
    return;
  }
  pd.idx = next;
  pd.selected = null;
  pd.choices = buildDrillChoices(pd.queue[next]);
  render();
}

function playAllConvo(lines, idx) {
  if (idx >= lines.length) { state.convo.playingLine = null; render(); return; }
  state.convo.playingLine = idx;
  render();
  const line = lines[idx];
  speakAs(line.c, line.u, () => setTimeout(() => playAllConvo(lines, idx + 1), 500));
}

// ── Translation (provider-abstracted) ─────────────────────────────────────────
// Configuration — change provider here to swap. Each provider implementation
// returns the same standardised shape: { zh, jp, en, bd, pattern? }
const TRANSLATION_PROVIDER = 'gemini';   // 'gemini' | 'claude' | 'openai'

function getApiKey() {
  return storage.getApiKey() || '';
}
function setApiKey(key) {
  storage.setApiKey(key);
}

// Path progress persistence — via the storage module.

// Composite lesson key: 'greetings-t1', 'greetings-t2' etc.
// Allows the same topic at multiple tiers within a single path.
function lessonKey(topicKey, tier) {
  return topicKey + '-t' + tier;
}

function loadPathProgress() {
  const p = storage.getPathProgress();
  return (p && typeof p === 'object') ? p : {};
}
function savePathProgress() {
  storage.setPathProgress(state.pathProgress);
}

// One-time migration: convert legacy progress keys (no tier suffix) to composite keys.
// Pre-refactor data was stored as pathProgress.beginner.greetings = true.
// Post-refactor it should be pathProgress.beginner['greetings-t1'] = true.
// Legacy entries are assumed to be tier 1 since that's all the previous build referenced.
function migratePathProgressIfNeeded() {
  let changed = false;
  Object.keys(state.pathProgress).forEach(pathKey => {
    const bucket = state.pathProgress[pathKey];
    if (!bucket || typeof bucket !== 'object') return;
    Object.keys(bucket).forEach(key => {
      // Composite keys end with -t<number>. Anything else is legacy.
      if (!/-t\d+$/.test(key)) {
        bucket[lessonKey(key, 1)] = bucket[key];
        delete bucket[key];
        changed = true;
      }
    });
  });
  if (changed) savePathProgress();
}

function isLessonComplete(pathKey, topicKey, tier) {
  const bucket = state.pathProgress[pathKey];
  return !!(bucket && bucket[lessonKey(topicKey, tier)]);
}
function toggleLessonComplete(pathKey, topicKey, tier) {
  if (!state.pathProgress[pathKey]) state.pathProgress[pathKey] = {};
  const k = lessonKey(topicKey, tier);
  if (state.pathProgress[pathKey][k]) {
    delete state.pathProgress[pathKey][k];
  } else {
    state.pathProgress[pathKey][k] = true;
  }
  savePathProgress();
}
function pathCompleteCount(pathKey) {
  const p = state.pathProgress[pathKey];
  if (!p) return 0;
  const path = store.paths.find(x => x.key === pathKey);
  if (!path) return 0;
  return path.lessons.filter(l => p[lessonKey(l.topic, l.round)]).length;
}
// Returns the first incomplete lesson as { topic, tier }, or null if all done.
function nextIncompleteLesson(pathKey) {
  const path = store.paths.find(x => x.key === pathKey);
  if (!path) return null;
  const p = state.pathProgress[pathKey] || {};
  const next = path.lessons.find(l => !p[lessonKey(l.topic, l.round)]);
  return next ? { topic: next.topic, tier: next.round } : null;
}

// Return { path, step, total, isLast, nextStep, nextTopic } for the current path-mode state,
// or null if the user isn't currently studying inside a path. `step` is 1-indexed.
function getPathContext() {
  if (!state.fromPath) return null;
  const path = (store.paths || []).find(p => p.key === state.activePath);
  if (!path) return null;
  const tier = state.fromPathTier || state.currentRound;
  const stepIdx = path.lessons.findIndex(l => l.topic === state.topic && l.round === tier);
  if (stepIdx < 0) return null;
  const total = path.lessons.length;
  const isLast = stepIdx === total - 1;
  const nextLesson = isLast ? null : path.lessons[stepIdx + 1];
  const nextTopicMeta = nextLesson ? store.topicMeta(nextLesson.topic) : null;
  return {
    path,
    step: stepIdx + 1,
    total,
    isLast,
    nextStep: nextLesson,                          // { topic, round } | null
    nextTopicLabel: nextTopicMeta ? nextTopicMeta.label : null,
    nextTopicIcon:  nextTopicMeta ? nextTopicMeta.icon  : null,
    isComplete: isLessonComplete(state.activePath, state.topic, tier),
  };
}

function buildPrompt(text, direction) {
  const isToYue = direction === 'en-yue';
  const sourceLabel = isToYue ? 'English' : 'Cantonese (in characters or jyutping)';
  const targetLabel = isToYue ? 'Cantonese' : 'English';
  return `You are a Cantonese language learning assistant. Translate the following ${sourceLabel} text to ${targetLabel}.

Important rules:
- Use COLLOQUIAL Cantonese (HK style), not Mandarin/Standard Written Chinese
- Use Cantonese-specific characters where appropriate (e.g. 嘅, 咗, 嚟, 喺, 唔, 啲, 咁, 嗰)
- Use jyutping romanization (with tone numbers 1-6)
- Provide a word-by-word breakdown grouping characters into meaningful chunks

Input: "${text}"

Respond ONLY with valid JSON in this exact format (no markdown, no code fences, no commentary):
{
  "zh": "Cantonese characters here",
  "jp": "jyutping with tone numbers here",
  "en": "English meaning here",
  "bd": [
    {"c": "chunk in Chinese", "j": "chunk in jyutping", "e": "chunk meaning in English"}
  ]
}`;
}

function parseAiResponse(text) {
  // Strip code fences if present, find first { ... } block
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  const obj = JSON.parse(match[0]);
  if (!obj.zh || !obj.jp || !obj.en || !Array.isArray(obj.bd)) {
    throw new Error('Response missing required fields');
  }
  return obj;
}

// ── Provider implementations ──
async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });

  // Retry up to 3 times on transient errors (503, 502, 429-with-retry)
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini returned empty response');
      return text;
    }
    const errText = await res.text();
    const isTransient = res.status === 503 || res.status === 502 || res.status === 504;
    lastErr = `Gemini error ${res.status}: ${errText.slice(0, 200)}`;
    if (!isTransient || attempt === maxAttempts) {
      throw new Error(lastErr);
    }
    // Exponential backoff: 1s, then 2s
    await new Promise(r => setTimeout(r, attempt * 1000));
  }
  throw new Error(lastErr);
}

async function callClaude(prompt, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned empty response');
  return text;
}

async function callOpenAI(prompt, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return text;
}

// Single entry point — rest of app calls only this
async function translateText(text, direction = 'en-yue') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Missing API key');
  const prompt = buildPrompt(text, direction);
  let raw;
  switch (TRANSLATION_PROVIDER) {
    case 'gemini': raw = await callGemini(prompt, apiKey); break;
    case 'claude': raw = await callClaude(prompt, apiKey); break;
    case 'openai': raw = await callOpenAI(prompt, apiKey); break;
    default: throw new Error('Unknown provider: ' + TRANSLATION_PROVIDER);
  }
  return parseAiResponse(raw);
}

// ── Speech recognition ───────────────────────────────────────────────────────
let _recognition = null;

function normalizeChinese(text) {
  // Strip whitespace and Chinese punctuation for comparison
  return (text || '').replace(/[\s，。！？、,!?.\-]/g, '');
}

// Edit-distance (Levenshtein) between two strings. Order-sensitive.
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // Use a rolling row of size b.length+1
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // insertion
        prev[j]   + 1,         // deletion
        prev[j - 1] + cost     // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Collapse consecutive duplicate substrings of length >= minLen. Defends against
// speech-recognition glitches where the recogniser emits "星期六得星期六得…" instead of
// "星期六得…" for a single utterance. minLen=4 is safe against legitimate Cantonese
// reduplications (好好, 慢慢, 馬馬虎虎 etc. are all 1–2 char base patterns).
function deduplicateRepeats(s, minLen) {
  minLen = minLen || 4;
  let changed = true;
  // Cap iterations defensively in case of pathological input
  for (let safety = 0; changed && safety < 20; safety++) {
    changed = false;
    for (let len = Math.floor(s.length / 2); len >= minLen; len--) {
      for (let i = 0; i + 2 * len <= s.length; i++) {
        if (s.substring(i, i + len) === s.substring(i + len, i + 2 * len)) {
          s = s.substring(0, i + len) + s.substring(i + 2 * len);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return s;
}

function fuzzyMatch(heard, target) {
  // Strict: exact character match after normalization. Any difference → mismatch,
  // which surfaces the per-character breakdown so the user can self-judge whether
  // a recogniser homophone glitch is really an error or not.
  const h = normalizeChinese(heard);
  const t = normalizeChinese(target);
  if (!h || !t) return false;
  return h === t;
}

// Align heard text against target text and return per-target-char status:
//   { status: 'match' }                            — target[j] was said correctly
//   { status: 'wrong', heardChar: '<char>' }       — target[j] was said as a different char
//   { status: 'missing' }                          — target[j] was skipped/not heard
//
// Standard Needleman-Wunsch / Levenshtein DP, then backtrack the optimal path.
// Both inputs should be normalized (punctuation/whitespace stripped) before calling.
function alignChars(heard, target) {
  const m = heard.length, n = target.length;
  if (!n) return [];
  // DP matrix: dp[i][j] = min edits to turn heard[0..i] into target[0..j]
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = heard[i - 1] === target[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,         // deletion from heard
        dp[i][j - 1] + 1,         // insertion (= target char missing)
        dp[i - 1][j - 1] + cost   // substitution or match
      );
    }
  }
  // Backtrack from (m,n) to (0,0) — prefer diagonal moves on ties (more intuitive alignment)
  const marks = new Array(n);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    const same = heard[i - 1] === target[j - 1];
    const diag = dp[i - 1][j - 1] + (same ? 0 : 1);
    if (dp[i][j] === diag) {
      marks[j - 1] = same ? { status: 'match' } : { status: 'wrong', heardChar: heard[i - 1] };
      i--; j--;
    } else if (dp[i][j] === dp[i][j - 1] + 1) {
      marks[j - 1] = { status: 'missing' };
      j--;
    } else {
      // up: extra heard char — no corresponding target slot
      i--;
    }
  }
  while (j > 0) { marks[j - 1] = { status: 'missing' }; j--; }
  return marks;
}

// Build the visual per-syllable breakdown grid for the Speak mismatch panel.
// Returns '' when char↔syllable alignment can't be cleanly established (e.g. a
// foreign word like 'William' embedded in Chinese), so the caller can fall back.
function renderSpeakBreakdown(heard, targetC, targetJ) {
  const punct = /[\s，。！？、,!?.\-]/;
  const charArr = Array.from(targetC).filter(c => !punct.test(c));
  // Split by whitespace, then strip any trailing punctuation that came with the syllable
  const jpArr   = (targetJ || '').split(/\s+/)
    .map(s => s.replace(/[，。！？、,!?.\-]+$/, ''))
    .filter(Boolean);
  if (!charArr.length || charArr.length !== jpArr.length) return '';   // alignment-impossible — caller handles fallback

  const heardClean = normalizeChinese(heard);
  const marks = alignChars(heardClean, charArr.join(''));

  const cols = charArr.map((c, idx) => {
    const m = marks[idx] || { status: 'missing' };
    const bad = m.status !== 'match';
    const tone = jpArr[idx].match(/[1-6]/);
    const toneColor = tone ? TONES[tone[0]].color : '#777';
    const charColor = bad ? '#8B3A4E' : '#2A2422';
    const jpColor   = bad ? '#8B3A4E' : toneColor;
    const mark = m.status === 'match'   ? '✓'
               : m.status === 'wrong'   ? m.heardChar
               : '·';   // missing
    const markStyle = m.status === 'match' ? 'color:#27AE60;font-weight:700;'
                    : m.status === 'wrong' ? 'color:#8B3A4E;font-weight:700;font-size:14px;'
                    : 'color:#E74C3C;font-weight:700;';
    return `<div class="bd-col">
      <div class="bd-char" style="color:${charColor}">${c}</div>
      <div class="bd-status" style="${markStyle}">${mark}</div>
      <div class="bd-jp" style="color:${jpColor};font-weight:700">${jpArr[idx]}</div>
    </div>`;
  }).join('');

  return `<div class="speak-breakdown">${cols}</div>`;
}

function startListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  if (_recognition) { try { _recognition.abort(); } catch(e){} }

  const rec = new SpeechRec();
  rec.lang = 'yue-Hant-HK';
  rec.continuous = true;        // keep listening until user stops
  rec.interimResults = true;    // capture words as they're heard
  rec.maxAlternatives = 3;

  let finalTranscript = '';
  let interimTranscript = '';

  rec.onresult = (e) => {
    interimTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        // Three rules to defend against recogniser quirks:
        //  1) Skip exact duplicate — recogniser emitted the same segment twice
        //  2) Replace on cumulative-and-extending — segment is full transcript so far
        //  3) Otherwise treat as a true delta and append
        if (finalTranscript && transcript === finalTranscript) {
          // rule 1 — skip
        } else if (finalTranscript && transcript.length > finalTranscript.length && transcript.startsWith(finalTranscript)) {
          finalTranscript = transcript;  // rule 2
        } else {
          finalTranscript += transcript; // rule 3
        }
        // Post-pass: collapse any consecutive-duplicate substring of length >= 4.
        // Safety net for delivery patterns that slip past rules 1–3.
        finalTranscript = deduplicateRepeats(finalTranscript);
      } else {
        interimTranscript += transcript;
      }
    }
    state.convo.speakHeard = (finalTranscript + interimTranscript).trim() || '…';
    render();
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;  // user-initiated stop
    state.convo.speakStatus = 'mismatch';
    state.convo.speakHeard = '(error: ' + e.error + ')';
    render();
  };
  rec.onend = () => {
    // Recognition session ended — if user is still in 'listening' mode, evaluate result
    if (state.convo.speakStatus === 'listening') {
      const heard = finalTranscript.trim();
      if (!heard) {
        state.convo.speakStatus = 'idle';
        state.convo.speakHeard  = '';
      } else {
        const target = getRoundConvo(state.topic, state.currentRound).lines[state.convo.speakStep].c;
        const matched = fuzzyMatch(heard, target);
        state.convo.speakHeard  = heard;
        state.convo.speakStatus = matched ? 'matched' : 'mismatch';
        if (matched) speak(target);
      }
      render();
    }
  };

  state.convo.speakStatus = 'listening';
  state.convo.speakHeard = '';
  render();
  try { rec.start(); } catch(e) {
    state.convo.speakStatus = 'idle';
    render();
  }
  _recognition = rec;
}

function stopListening() {
  if (_recognition) { try { _recognition.abort(); } catch(e){} _recognition = null; }
}

// User pressed stop — gracefully end so onend fires and processes result
function finishListening() {
  if (_recognition) { try { _recognition.stop(); } catch(e){} }
}

// ── Translate speech input ───────────────────────────────────────────────────
let _translateRec = null;

function startTranslateListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    state.translate.error = 'Speech recognition not supported on this browser';
    render();
    return;
  }
  if (_translateRec) { try { _translateRec.abort(); } catch(e){} }

  const isToYue = state.translate.direction === 'en-yue';
  const rec = new SpeechRec();
  // For en-yue mode: input is English. For yue-en mode: input is Cantonese.
  rec.lang = isToYue ? 'en-US' : 'yue-Hant-HK';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalTranscript = '';

  rec.onresult = (e) => {
    // Process results from e.resultIndex onwards with a persistent finalTranscript.
    // Some Android Chrome builds deliver each final result as the CUMULATIVE transcript
    // rather than a delta — detect that and replace, so we don't end up with
    // "II haveI have green pants" style triplication.
    let interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const seg = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        if (finalTranscript && seg === finalTranscript) {
          // rule 1 — skip exact duplicate
        } else if (finalTranscript && seg.length > finalTranscript.length && seg.startsWith(finalTranscript)) {
          finalTranscript = seg;
        } else {
          finalTranscript += seg;
        }
        finalTranscript = deduplicateRepeats(finalTranscript);
      } else {
        interimText += seg;
      }
    }
    state.translate.inputText = (finalTranscript + interimText).trim();
    // Update textarea directly without full re-render to avoid focus loss
    const ta = document.getElementById('translate-input');
    if (ta) ta.value = state.translate.inputText;
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    state.translate.error = 'Speech error: ' + e.error;
    state.translate.listening = false;
    render();
  };
  rec.onend = () => {
    if (state.translate.listening) {
      state.translate.listening = false;
      state.translate.inputText = finalTranscript.trim() || state.translate.inputText;
      render();
    }
  };

  state.translate.listening = true;
  state.translate.error = null;
  render();
  try { rec.start(); } catch(e) {
    state.translate.listening = false;
    state.translate.error = 'Could not start microphone';
    render();
  }
  _translateRec = rec;
}

function stopTranslateListening() {
  if (_translateRec) { try { _translateRec.stop(); } catch(e){} }
}

