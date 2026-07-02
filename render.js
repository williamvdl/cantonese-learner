// ===================================================================
// render.js — rendering, events, init
// Loaded THIRD (after data.js, app.js). All render* functions, event wiring,
// and the init() bootstrap.
// ===================================================================

// ── Render ────────────────────────────────────────────────────────────────────
function renderDrawer() {
  const rc = state.reviewBadge.liveCount;
  const pc = state.patternReviewBadge.liveCount;
  const items = [
    { key:'dashboard', icon:'🏠', label:'Home',            desc:'Your next step at a glance'             },
    { key:'path',      icon:'🛤️', label:'Learning Path',  desc:'Curated curriculum, ordered & tracked'  },
    { key:'topics',    icon:'📖', label:'Topics',         desc:'Vocabulary, sentences & conversations' },
    { key:'patterns',  icon:'🔨', label:'Patterns',        desc:'Sentence building blocks'              },
    { key:'review',    icon:'🗂️', label:'Review',          desc:'Words & patterns to practise',         badge: rc + pc },
    { key:'translate', icon:'🌐', label:'Translate',       desc:'AI-powered translation & breakdown'    },
  ];
  const open = state.drawerOpen ? 'open' : '';
  // Active highlight: a topic opened via the path, or an open checkpoint, both
  // belong to "Learning Path" — otherwise a path lesson wrongly lights "Topics".
  const activeNav = (state.checkpoint || state.fromPath) ? 'path' : state.nav;
  const speeds = [
    { key:'slow',   label:'🐢 Slow'   },
    { key:'normal', label:'🚶 Normal' },
    { key:'fast',   label:'🏃 Fast'   },
  ];
  const speedBtnsDrawer = speeds.map(s => {
    const active = state.speed === s.key;
    return `<button class="drawer-speed-btn${active ? ' active' : ''}" data-drawer-speed="${s.key}">${s.label}</button>`;
  }).join('');
  const settingsSection = `
    <div class="nav-settings">
      <div class="nav-settings-title">Settings</div>
      <div class="nav-settings-row">
        <div class="nav-settings-label">Audio speed</div>
        <div class="drawer-speed-btns">${speedBtnsDrawer}</div>
      </div>
    </div>`;
  return `
    <div class="nav-drawer ${open}" id="nav-drawer">
      <div class="nav-backdrop" id="nav-backdrop"></div>
      <div class="nav-panel">
        <div class="nav-panel-header">
          <span class="nav-panel-title">Menu</span>
          <button class="nav-close" id="nav-close">✕</button>
        </div>
        <div class="nav-panel-body">
          ${items.map(item => `
            <button class="nav-item${activeNav===item.key?' active':''}" data-nav="${item.key}">
              <span class="ni-icon">${item.icon}</span>
              <span class="ni-text">
                <span class="ni-label">${item.label}</span>
                <span class="ni-desc">${item.desc}</span>
              </span>
              ${item.badge > 0 ? `<span class="ni-badge">${item.badge}</span>` : ''}
              <span class="ni-tick">✓</span>
            </button>${item.key === 'review' ? `
            <div class="nav-sub">
              <button class="nav-sub-item${state.nav==='review'&&state.reviewView==='words'?' active':''}" data-review-sub="words">
                📖 Words ${rc > 0 ? `<span class="ns-badge">${rc}</span>` : ''}
              </button>
              <button class="nav-sub-item${state.nav==='review'&&state.reviewView==='patterns'?' active':''}" data-review-sub="patterns">
                🔨 Patterns ${pc > 0 ? `<span class="ns-badge">${pc}</span>` : ''}
              </button>
            </div>` : ''}`).join('')}
          ${settingsSection}
        </div>
      </div>
    </div>`;
}

// Stage 4: the Patterns page is a grouped reference library (no Drill sub-tab —
// drilling now lives in each topic's Learn tab). Tier-1 frames only; Tier-2 are
// topic-local. Two-level accordion: tap a group to open, tap a frame to reveal
// its note + examples. All collapsed by default.
const PATTERN_GROUP_ORDER = [
  ['Wants, needs & requests',    'asking for things, ordering, permission'],
  ['Likes, feelings & describing','preferences, emotions, adjectives'],
  ['Identifying, having & giving','naming, possessing, giving'],
  ['Place, direction & time',    'where and when'],
  ['Asking questions',           'the question words'],
  ['Grammar: tense & particles', 'time markers and sentence-final particles'],
  ['Numbers & sequencing',       'counting, quantity, doing things in order'],
  ['Everyday expressions',       'set social phrases'],
];

function renderPatterns() {
  const libFrames = store.patterns.filter(p => p.tier === 1);
  return `
    <div class="patterns-wrap">
      ${renderPageHeader('🔨', 'Sentence Patterns', `${libFrames.length} building blocks`)}
      ${renderPatternBrowse()}
    </div>`;
}

// Grouped, collapsible reference library.
function renderPatternBrowse() {
  const lib = store.patterns.filter(p => p.tier === 1);
  // Bucket frames by their group, preserving each frame's index within the group.
  const byGroup = {};
  lib.forEach(p => { (byGroup[p.group] = byGroup[p.group] || []).push(p); });

  const groups = PATTERN_GROUP_ORDER.map(([name, desc], gi) => {
    const frames = byGroup[name] || [];
    const groupOpen = !!state.patternGroupsOpen[name];

    const frameCards = frames.map((p, fi) => {
      const fKey = `${gi}-${fi}`;
      const frameOpen = !!state.patternFramesOpen[fKey];

      const examples = p.examples.map((ex, ei) => {
        const key = `p${gi}-${fi}-e${ei}`;          // unique reveal/play key
        const speaking = state.speaking === key;
        const revealed = state.patternRevealed[key];
        const englishEl = revealed
          ? `<div class="pattern-ex-en">${ex.e}</div>`
          : `<div class="pattern-ex-en pattern-ex-eng-hint" data-pat-reveal="${key}" style="font-style:italic;color:#bbb;cursor:pointer">tap to see English</div>`;
        return `
          <div class="pattern-example">
            <div class="pattern-ex-text">
              <div class="pattern-ex-zh">${ex.c}</div>
              <div class="pattern-ex-jp">${colorJyutping(ex.j)}</div>
              ${englishEl}
            </div>
            <button class="pattern-ex-play${speaking?' speaking':''}" data-pex="${key}" data-pex-chinese="${ex.c}">
              ${speaking ? icon('volume',20) : iconPlay(18)}
            </button>
          </div>`;
      }).join('');

      return `
        <div class="lib-frame${frameOpen ? ' open' : ''}">
          <div class="lib-frame-head" data-frame-toggle="${fKey}">
            <span class="lib-chev">▶</span>
            <div class="lib-frame-titles">
              <div class="lib-frame-label">${p.label}</div>
              <div class="lib-frame-struct">${colorJyutping(p.structure)}</div>
            </div>
          </div>
          ${frameOpen ? `
            <div class="lib-frame-body">
              <div class="pattern-note">${p.note}</div>
              <div class="pattern-examples">${examples}</div>
            </div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="lib-group${groupOpen ? ' open' : ''}">
        <div class="lib-group-head" data-group-toggle="${name}">
          <span class="lib-chev">▶</span>
          <div class="lib-group-title">${name}<span class="lib-group-desc">${desc}</span></div>
          <span class="lib-group-count">${frames.length}</span>
        </div>
        ${groupOpen ? `<div class="lib-group-body">${frameCards}</div>` : ''}
      </div>`;
  }).join('');

  return `<div class="pattern-library">${groups}</div>`;
}

// The drill — landing screen, active question, or done summary.
// Used by the Patterns page's Drill tab. The topic-scoped drill uses
// renderTopicDrillView, which shares renderDrillBody for the question/done parts.
function renderPatternDrill(drillCount) {
  const pd = state.patternDrill;

  // --- Landing (no active session) ---
  if (!pd) {
    return `
      <div class="review-landing">
        <div class="review-landing-count">${drillCount}</div>
        <div class="review-landing-label">pattern${drillCount===1?'':'s'} ready to drill</div>
        <p class="review-landing-note">
          Fill the blank in each sentence pattern with the word that fits.
          One question per pattern.
        </p>
        <button class="review-start-btn" id="drill-start">Start drill</button>
      </div>`;
  }
  return renderDrillBody(pd);
}

// Shared drill body — the done-summary or the active question. Caller-agnostic:
// works for the Patterns-page drill and the topic-scoped drill alike.
function renderDrillBody(pd) {
  const color = BRAND_ACCENT;   // drill uses the brand accent, like Word Review

  // --- Done summary ---
  if (pd.done) {
    // Checkpoint-scoped drills get the richer done screen (diagnostic + missed list).
    if (pd.scopeKind === 'checkpoint' && pd.checkpointStage) {
      const stage = pd.checkpointStage;
      const missedTopicKeys = [];
      pd.missed.forEach(pair => {
        // Attribute each missed drill to the stage topic(s) it's tagged to.
        (pair.drill.topics || []).forEach(tk => {
          if ((stage.topics || []).includes(tk)) missedTopicKeys.push(tk);
        });
      });
      return renderCheckpointDone({
        activityLabel: 'Patterns',
        emoji: '🔨',
        score: pd.score,
        total: pd.queue.length,
        stage,
        missedTopicKeys,
        missedItems: pd.missed.map(pair => ({ c: pair.drill.answer.c, j: pair.drill.answer.j, e: pair.drill.answer.e })),
        activity: 'patterns',
      });
    }
    const total = pd.queue.length;
    return `
      <div class="result">
        <div class="result-emoji">${pd.score === total ? '🌟' : '✅'}</div>
        <div class="result-score" style="color:${color}">${pd.score} / ${total} correct</div>
        <div class="result-msg">
          ${pd.score === total
            ? 'Perfect — every pattern filled correctly.'
            : 'Nice work. Drill again to sharpen the ones you missed.'}
        </div>
        <button class="review-start-btn" id="drill-again">Drill again</button>
        <button class="back-btn" id="drill-exit" style="background:${color}"><span class="icon-label">${icon('arrowLeft',15)} Done</span></button>
      </div>`;
  }

  // --- Active question ---
  const { pattern, drill: d } = pd.queue[pd.idx];
  const answered = pd.selected !== null && pd.selected !== undefined;

  const core = renderQuizCore({
    word:       d.answer,
    choices:    pd.choices,
    selected:   pd.selected,
    direction:  'en-zh',          // choices show Chinese + jyutping, like en-zh quiz
    color:      color,
    idx:        pd.idx,
    total:      pd.queue.length,
    ariaLabel:  'Pattern drill',
    dirAttr:    'data-drill-dir-unused',   // drill has no direction toggle
    choiceAttr: 'data-drill-choice',
    listenId:   'drill-listen',
    replayId:   'drill-replay',
    nextId:     'drill-next',
  });

  const chosenWord = answered ? pd.choices[pd.selected] : null;
  const slotZh = answered
    ? `<span class="drill-slot ${chosenWord===d.answer?'correct':'wrong'}">${chosenWord.c}</span>`
    : `<span class="drill-slot drill-slot-empty">▢</span>`;
  const frameDisplay = d.frameC.replace('▢', slotZh);

  const promptCard = `
    <div class="quiz-card drill-card" style="border:2px solid ${color}22">
      <div class="quiz-label">${pattern.label}</div>
      <div class="drill-target">${d.english}</div>
      <div class="drill-target-hint">Build this sentence — pick the missing word</div>
      <div class="drill-frame">${frameDisplay}</div>
      <div class="drill-frame-jp">${colorJyutping(d.frameJ).replace('▢','<span class="drill-slot-jp">▢</span>')}</div>
      ${answered
        ? `<button class="quiz-listen" id="drill-listen" style="border:1.5px solid ${color};color:${color}"><span class="icon-label">${iconPlay(13)} Hear full sentence</span></button>`
        : ''}
    </div>`;

  return `
    <div class="quiz-meta">
      <span style="color:#888">Pattern ${pd.idx+1} / ${pd.queue.length}</span>
      <span style="color:${color};font-weight:700">Score: ${pd.score}</span>
    </div>
    ${core.progressBar}
    ${promptCard}
    ${core.choiceGrid}
    ${core.answerPanel}`;
}

// The topic-scoped drill as its own full-screen view, with a "← <Topic>" header
// that returns to the topic. Reuses renderDrillBody for the question/done parts.
function renderTopicDrillView(topicColor) {
  const pd = state.patternDrill;
  if (!pd) return '';
  const color = topicColor || BRAND_ACCENT;
  const topicLabel = (lessonShape(pd.topicKey) || {}).label || 'Topic';
  return `
    <button class="back-home-btn" id="topic-drill-back">
      <span class="icon-label">${icon('arrowLeft',15)} ${topicLabel}</span>
    </button>
    <div class="topic-drill-heading">🔨 Pattern drill</div>
    ${renderDrillBody(pd)}`;
}

function renderTranslate() {
  const tr = state.translate;
  const hasKey = !!getApiKey();

  // API key setup screen if no key
  if (!hasKey) {
    return `
      <div class="translate-wrap">
        ${renderPageHeader('🌐', 'Translate', 'AI-powered translation with word-by-word breakdown')}
        <div class="apikey-setup">
          <h3>🔑 One-time setup</h3>
          <p>Paste your <strong>Google Gemini API key</strong> to enable translations. It's saved securely on your device only — never uploaded anywhere.</p>
          <input type="${tr.showApiKey ? 'text' : 'password'}" id="apikey-input" class="apikey-input" placeholder="AIza..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
          <button class="apikey-save" id="apikey-save">Save Key & Continue</button>
          <div class="apikey-toggle-row">
            <button class="apikey-toggle-btn" id="apikey-toggle">${tr.showApiKey ? 'Hide' : 'Show'} key</button>
          </div>
          <p style="margin-top:14px;font-size:11px;color:#aaa;line-height:1.5">
            Don't have one? Get a free key in 90 seconds at <strong>aistudio.google.com</strong> — no credit card needed.
          </p>
        </div>
      </div>`;
  }

  // Main translate UI
  const result = tr.result;
  const isToYue = tr.direction === 'en-yue';
  const fromLabel = isToYue ? '🇬🇧 English' : '🇭🇰 Cantonese';
  const toLabel   = isToYue ? '🇭🇰 Cantonese' : '🇬🇧 English';
  const placeholder = isToYue
    ? "Type or speak English, e.g. 'I want to drink tea'"
    : "Type or speak Cantonese characters, e.g. '我想飲茶'";
  const bdHtml = result?.bd ? result.bd.map(w => `
    <div class="breakdown-row">
      <span class="breakdown-zh">${w.c}</span>
      <span class="breakdown-jp">${colorJyutping(w.j)}</span>
      <span class="breakdown-en">${w.e}</span>
    </div>`).join('') : '';

  const speaking = state.speaking === 'translate-result';
  const listening = tr.listening;

  // Show result fields based on direction
  // For en-yue: zh + jp + en (English is the original input)
  // For yue-en: zh + jp + en (English is the translation)
  // Same shape works either way.

  return `
    <div class="translate-wrap">
      ${renderPageHeader('🌐', 'Translate', 'Type or speak · word-by-word breakdown · powered by Gemini')}

      <div class="translate-direction-row">
        <span class="translate-dir-label">${fromLabel}</span>
        <button class="translate-dir-swap" id="translate-swap" title="Swap direction">⇄</button>
        <span class="translate-dir-label">${toLabel}</span>
      </div>

      <div class="translate-input-wrap">
        <textarea class="translate-input" id="translate-input" placeholder="${placeholder}" rows="3">${tr.inputText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}</textarea>
        ${listening ? '<div class="translate-listening-hint">🎙 Listening… speak now, then tap mic to stop</div>' : ''}
        <div class="translate-input-actions">
          <button class="translate-mic ${listening?'listening':''}" id="translate-mic" title="${listening?'Stop listening':'Speak instead of typing'}">
            ${listening?'🔴':'🎙'}
          </button>
          ${tr.inputText ? '<button class="translate-clear" id="translate-clear">Clear</button>' : ''}
          <button class="translate-go" id="translate-go" ${tr.loading ? 'disabled' : ''}>
            ${tr.loading ? '⏳ Translating…' : '✨ Translate'}
          </button>
        </div>
      </div>

      ${tr.error ? `<div class="translate-error">⚠ ${tr.error}</div>` : ''}

      ${tr.loading ? `<div class="translate-loading">Translating with Gemini… <br><small style="color:#bbb">May retry automatically if the server is busy</small></div>` : ''}

      ${result ? `
        <div class="translate-result">
          <div class="translate-zh">${result.zh}</div>
          <div class="translate-jp">${colorJyutping(result.jp)}</div>
          <div class="bubble-english" style="font-size:12px;color:#888;margin-bottom:6px">${result.en}</div>
          <div class="translate-result-actions">
            <button class="translate-action-btn primary" id="translate-listen" data-tr-text="${result.zh}">
              <span class="icon-label">${speaking ? icon('volume',16) : iconPlay(14)} ${speaking ? 'Playing…' : 'Listen'}</span>
            </button>
          </div>
          ${bdHtml ? `
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f4f0eb">
              <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Word-by-word breakdown</div>
              ${bdHtml}
            </div>` : ''}
        </div>
      ` : ''}

      <div style="margin-top:20px;text-align:center">
        <button class="apikey-toggle-btn" id="translate-reset-key">Reset API key</button>
      </div>
    </div>`;
}

// ── Word Review view ──────────────────────────────────────────────────────────
// Standalone cross-topic review of words missed in any quiz. Reuses the quiz's
// CSS classes (quiz-card, choice-btn, quiz-dir-toggle, quiz-wrong-panel) so it
// reads as part of the same family without refactoring renderQuiz itself.
// ── Shared quiz UI core ───────────────────────────────────────────────────────
// The active-question UI is identical between the topic Quiz and Word Review (and
// will be reused by Pattern Drills). This function renders that shared middle:
// direction toggle, prompt card, choice grid, progress bar, wrong-answer panel.
//
// It generates MARKUP ONLY — it wires no events. Each caller keeps its own click
// handlers, bound to the data-/id- attribute names it passes in via opts. That
// keeps the quiz's behaviour and Word Review's behaviour fully independent.
//
// opts fields:
//   word        - the correct word object { c, j, e }
//   choices     - array of option word objects
//   selected    - chosen choice INDEX, or null/undefined if unanswered
//   direction   - 'zh-en' | 'en-zh' | 'listen-en'
//   color       - accent colour (hex)
//   idx, total  - question number / queue length (for the progress bar)
//   ariaLabel   - aria-label for the direction toggle
//   dirAttr     - data-attribute name for direction buttons (e.g. 'data-quiz-dir')
//   choiceAttr  - data-attribute name for choice buttons (e.g. 'data-choice')
//   listenId    - element id for the listen button(s)
//   replayId    - element id for the wrong-panel replay button
//   nextId      - element id for the wrong-panel "next" button
function renderQuizCore(opts) {
  const { word: cw, choices, selected, direction, color, idx, total,
          ariaLabel, dirAttr, choiceAttr, listenId, replayId, nextId } = opts;
  const answered = selected !== null && selected !== undefined;
  const pct = (idx / total * 100).toFixed(0);

  // --- Direction toggle ---
  const dirs = [
    { key:'zh-en',    label:'漢→EN', title:'See Chinese, pick English' },
    { key:'en-zh',    label:'EN→漢', title:'See English, pick Chinese' },
    { key:'listen-en',label:'🔊→EN', title:'Listen, pick English' },
  ];
  const dirToggle = `
    <div class="quiz-dir-toggle" role="tablist" aria-label="${ariaLabel}">
      ${dirs.map(d => {
        const active = direction === d.key;
        return `<button class="quiz-dir-btn${active ? ' active' : ''}" ${dirAttr}="${d.key}" title="${d.title}"
          style="${active ? `background:${color};color:#fff;border-color:${color}` : `color:${color};border-color:${color}66`}">${d.label}</button>`;
      }).join('')}
    </div>`;

  // --- Prompt card (varies by direction) ---
  let promptCard;
  if (direction === 'en-zh') {
    promptCard = `
      <div class="quiz-card" style="border:2px solid ${color}22">
        <div class="quiz-label">Pick the Cantonese for:</div>
        <div class="quiz-prompt-en">${cw.e}</div>
      </div>`;
  } else if (direction === 'listen-en') {
    promptCard = `
      <div class="quiz-card quiz-card-listen" style="border:2px solid ${color}22">
        <div class="quiz-label">Listen — what does it mean?</div>
        <button class="quiz-listen-big" id="${listenId}" style="background:${color}" aria-label="Play audio">${icon('volume',38)}</button>
        <div class="quiz-listen-hint" style="color:${color}">Tap to replay</div>
      </div>`;
  } else {
    promptCard = `
      <div class="quiz-card" style="border:2px solid ${color}22">
        <div class="quiz-label">What does this mean?</div>
        <div class="quiz-chinese">${cw.c}</div>
        <div class="quiz-jyutping">${colorJyutping(cw.j)}</div>
        <button class="quiz-listen" id="${listenId}" style="border:1.5px solid ${color};color:${color}"><span class="icon-label">${iconPlay(13)} Listen</span></button>
      </div>`;
  }

  // --- Choice buttons ---
  // Keyed by ARRAY INDEX, not by c.c: a round can contain homographs (same
  // Chinese, different meaning), so the Chinese string is not a unique id.
  const choiceBtns = choices.map((c, i) => {
    const isCorrect = c === cw;                 // object identity — exact option
    const isChosen  = selected === i;
    let cls = 'choice-btn';
    if (direction === 'en-zh') cls += ' choice-btn-zh';
    if (answered) {
      if (isCorrect) cls += ' correct'; else if (isChosen) cls += ' wrong';
    }
    const body = direction === 'en-zh'
      ? `<div class="choice-zh-chinese">${c.c}</div><div class="choice-zh-jp">${colorJyutping(c.j)}</div>`
      : c.e;
    return `<button class="${cls}" ${choiceAttr}="${i}" ${answered ? 'disabled' : ''}>${body}</button>`;
  }).join('');

  // --- Answer panel (shown once answered) ---
  // Wrong → the "Not quite…" teaching panel. Correct → a light "Correct!" line.
  // Either way the question now STOPS and waits for a Next tap (no auto-advance).
  const wasWrong = answered && choices[selected] !== cw;
  let answerPanel = '';
  if (answered && wasWrong) {
    answerPanel = `<div class="quiz-wrong-panel">
        <div class="quiz-wrong-heading">Not quite — the answer was:</div>
        <div class="quiz-wrong-chinese">${cw.c}</div>
        <div class="quiz-wrong-jp">${colorJyutping(cw.j)}</div>
        <div class="quiz-wrong-en">${cw.e}</div>
        <div class="quiz-wrong-actions">
          <button class="quiz-replay" id="${replayId}" style="border-color:${color};color:${color}"><span class="icon-label">${iconPlay(13)} Hear it again</span></button>
          <button class="quiz-next" id="${nextId}" style="background:${color}"><span class="icon-label">Got it — next ${icon('arrowRight',14)}</span></button>
        </div>
      </div>`;
  } else if (answered) {
    answerPanel = `<div class="quiz-correct-row">
        <span class="quiz-correct-msg"><span class="quiz-correct-tick">${icon('check',14)}</span>Correct!</span>
        <button class="quiz-next" id="${nextId}" style="background:${color}"><span class="icon-label">Next ${icon('arrowRight',14)}</span></button>
      </div>`;
  }

  return {
    progressBar: `<div class="progress-bar"><div class="progress-fill" style="background:${color};width:${pct}%"></div></div>`,
    dirToggle,
    promptCard,
    choiceGrid: `<div class="choices">${choiceBtns}</div>`,
    answerPanel,
  };
}

// Shared "session complete" screen for BOTH Word Review and Pattern Review.
// Shows three stats — reviewed / graduated / still learning — plus a "review N
// more" (or all-clear) and a Done button. `still learning = reviewed - graduated`.
function renderReviewDone(o) {
  const color = o.color || BRAND_ACCENT;
  const stillLearning = Math.max(0, o.reviewed - o.graduated);
  const moreOrClear = o.liveCount > 0
    ? `<button class="review-start-btn" id="${o.againId}">Review ${Math.min(o.liveCount, REVIEW_SESSION_CAP)} more</button>`
    : `<div class="review-allclear-note">${o.allClearNote}</div>`;
  return `
    <div class="content">
      ${renderPageHeader(o.icon, o.title, '')}
      <div class="result">
        <div class="result-emoji">${o.graduated > 0 ? '🌟' : '✅'}</div>
        <div class="review-done-stats">
          <div class="rd-stat"><b style="color:${color}">${o.reviewed}</b><span>reviewed</span></div>
          <div class="rd-stat"><b style="color:var(--jade-bright)">${o.graduated}</b><span>graduated</span></div>
          <div class="rd-stat"><b style="color:var(--muted)">${stillLearning}</b><span>still learning</span></div>
        </div>
        <div class="result-msg">
          ${o.graduated > 0
            ? `${o.graduated} ${o.noun}${o.graduated === 1 ? '' : 's'} cleared from your review list.`
            : `Keep going — get ${o.noun === 'word' ? 'a word' : 'a pattern'} right 3 times to clear it.`}
        </div>
        ${moreOrClear}
        <button class="back-btn" id="${o.exitId}" style="background:${color}"><span class="icon-label">${icon('arrowLeft',15)} Done</span></button>
      </div>
    </div>`;
}

function renderWordReview() {
  const wr = state.wordReview;

  // --- Landing state: no active session ---
  if (!wr) {
    const { liveCount, everUsed } = state.reviewBadge;
    let body;
    if (liveCount > 0) {
      body = `
        <div class="review-landing">
          <div class="review-landing-count">${liveCount}</div>
          <div class="review-landing-label">word${liveCount === 1 ? '' : 's'} ready to review</div>
          <p class="review-landing-note">
            ${liveCount > REVIEW_SESSION_CAP
              ? `This session will cover the ${REVIEW_SESSION_CAP} oldest. Get a word right 3 times to clear it.`
              : `Get a word right 3 times to clear it from your review list.`}
          </p>
          <button class="review-start-btn" id="review-start">Start review</button>
        </div>`;
    } else if (everUsed) {
      // All caught up — used before, bin now empty.
      body = `
        <div class="review-empty">
          <div class="review-empty-emoji">🎉</div>
          <div class="review-empty-title">All caught up — great work!</div>
          <p class="review-empty-text">You've reviewed every word. New ones will appear here as you do more quizzes.</p>
        </div>`;
    } else {
      // Never used — bin has never had anything in it.
      body = `
        <div class="review-empty">
          <div class="review-empty-emoji">📥</div>
          <div class="review-empty-title">No review words yet</div>
          <p class="review-empty-text">Words you miss in quizzes will collect here to practise later.</p>
        </div>`;
    }
    return `
      <div class="content">
        ${renderPageHeader('🗂️', 'Word Review', 'Practise the words you\'ve missed — from every topic')}
        ${body}
      </div>`;
  }

  const color = BRAND_ACCENT;   // review uses the brand accent

  // --- Done state: session summary (shared stat screen) ---
  if (wr.done) {
    return renderReviewDone({
      icon: '🗂️', title: 'Word Review', color,
      reviewed: wr.reviewedThisSession,
      graduated: wr.graduatedThisSession,
      liveCount: state.reviewBadge.liveCount,
      noun: 'word',
      allClearNote: 'No words left to review — nicely done.',
      againId: 'review-again', exitId: 'review-exit',
    });
  }

  // --- Active question ---
  const item = wr.queue[wr.idx];
  const cw = item.word;

  // Shared quiz UI (toggle, prompt, choices, progress, wrong panel).
  const core = renderQuizCore({
    word:       cw,
    choices:    wr.choices,
    selected:   wr.selected,
    direction:  wr.direction,
    color:      color,
    idx:        wr.idx,
    total:      wr.queue.length,
    ariaLabel:  'Review direction',
    dirAttr:    'data-review-dir',
    choiceAttr: 'data-review-choice',
    listenId:   'review-listen',
    replayId:   'review-replay',
    nextId:     'review-next',
  });

  // Progress pips: how close this word is to graduating (3 correct clears it).
  // This is Word-Review-specific — not part of the shared core.
  const progressDots = (() => {
    const got = item.entry.correctCount;
    let dots = '';
    for (let i = 0; i < REVIEW_GRADUATE_AT; i++) {
      dots += `<span class="review-pip${i < got ? ' filled' : ''}"></span>`;
    }
    return `<div class="review-progress" title="${got} of ${REVIEW_GRADUATE_AT} correct">${dots}</div>`;
  })();

  return `
    <div class="content">
      ${renderPageHeader('🗂️', 'Word Review', '')}
      <div class="quiz-meta">
        <span style="color:#888">Word ${wr.idx+1} / ${wr.queue.length}</span>
        ${progressDots}
      </div>
      ${core.progressBar}
      ${core.dirToggle}
      ${core.promptCard}
      ${core.choiceGrid}
      ${core.answerPanel}
    </div>`;
}

// ── Review hub (Option B): one Review destination with two cards ──────────────
function renderReviewHub() {
  const wc = state.reviewBadge.liveCount;
  const pc = state.patternReviewBadge.liveCount;
  const card = (cls, view, icon, name, desc, count, noun) => `
    <button class="review-hub-card ${cls}" data-review-go="${view}">
      <span class="rh-ic">${icon}</span>
      <span class="rh-body"><span class="rh-name">${name}</span><span class="rh-desc">${desc}</span></span>
      <span class="rh-count ${count === 0 ? 'zero' : ''}"><b>${count}</b><span>${noun}</span></span>
    </button>`;
  return `
    <div class="content">
      ${renderPageHeader('🗂️', 'Review', 'Practise what you\'ve missed — words and patterns are tracked separately')}
      ${card('words', 'words', '📖', 'Word Review', 'Vocabulary you got wrong in quizzes', wc, 'words')}
      ${card('patterns', 'patterns', '🔨', 'Pattern Review', 'Sentence patterns you got wrong in drills', pc, 'patterns')}
    </div>`;
}

// ── Pattern Review (parallel to Word Review; reuses the drill card) ───────────
function renderPatternReview() {
  const pr = state.patternReview;
  const color = '#B7861E';   // pattern review uses gold as its accent

  // Landing / empty when no active session.
  if (!pr) {
    const { liveCount, everUsed } = state.patternReviewBadge;
    let body;
    if (liveCount > 0) {
      body = `
        <div class="review-landing">
          <div class="review-landing-count" style="color:${color}">${liveCount}</div>
          <div class="review-landing-label">pattern${liveCount === 1 ? '' : 's'} ready to review</div>
          <p class="review-landing-note">
            ${liveCount > REVIEW_SESSION_CAP
              ? `This session will cover the ${REVIEW_SESSION_CAP} oldest. Get a pattern right 3 times to clear it.`
              : `Get a pattern right 3 times to clear it from your review list.`}
          </p>
          <button class="review-start-btn" id="pattern-review-start" style="background:${color}">Start review</button>
        </div>`;
    } else if (everUsed) {
      body = `
        <div class="review-empty">
          <div class="review-empty-emoji">🎉</div>
          <div class="review-empty-title">All caught up — great work!</div>
          <p class="review-empty-text">You've reviewed every pattern. New ones appear here as you do more drills.</p>
        </div>`;
    } else {
      body = `
        <div class="review-empty">
          <div class="review-empty-emoji">📥</div>
          <div class="review-empty-title">No review patterns yet</div>
          <p class="review-empty-text">Patterns you miss in drills will collect here to practise later.</p>
        </div>`;
    }
    return `
      <div class="content">
        ${renderPageHeader('🔨', 'Pattern Review', 'Practise the sentence patterns you\'ve missed')}
        ${body}
      </div>`;
  }

  // Done — shared stat screen.
  if (pr.done) {
    return renderReviewDone({
      icon: '🔨', title: 'Pattern Review', color,
      reviewed: pr.reviewedThisSession,
      graduated: pr.graduatedThisSession,
      liveCount: state.patternReviewBadge.liveCount,
      noun: 'pattern',
      allClearNote: 'No patterns left to review — nicely done.',
      againId: 'pattern-review-again', exitId: 'pattern-review-exit',
    });
  }

  // Active question — reuse the live drill card body (pr has the {pattern,drill} shape).
  return `<div class="content">${renderDrillBody(pr)}</div>`;
}

// ── Dashboard (new homepage) ──────────────────────────────────────────────────
// Replaces the path list as the app's default landing screen. Surfaces: the
// single next thing to do (hero, coloured by that lesson's own topic colour),
// path progress for Beginner/Intermediate (and Advanced once it exists), the
// Word Review count, and two secondary "Jump to" tiles (Topics, Translate).
// Deliberately does NOT include Pattern Review or a Patterns tile — patterns
// are heading toward deprecation per William's direction.
function renderDashboard() {
  const next = dashboardNextUp();
  const heroHtml = renderDashboardHero(next);

  // Path progress cards — Beginner + Intermediate only for now (Advanced has
  // no content yet; once it does, this list naturally picks it up because it
  // walks store.paths rather than a hardcoded pair).
  const progressPaths = (store.paths || []).filter(p => !p.comingSoon && (p.key === 'beginner' || p.key === 'intermediate'));
  const pathCardsHtml = progressPaths.map(p => renderDashboardPathCard(p)).join('');

  const rc = state.reviewBadge.liveCount;
  const reviewHtml = `
    <div class="section-label">To review</div>
    <button class="dash-review-pill" id="dash-review-open">
      <span class="dash-review-icon">📖</span>
      <span class="dash-review-text">
        <span class="dash-review-title">Word Review</span>
        <span class="dash-review-sub">${rc > 0 ? `${rc} word${rc === 1 ? '' : 's'} flagged for practice` : 'Nothing flagged right now'}</span>
      </span>
      ${rc > 0 ? `<span class="dash-review-badge">${rc}</span>` : ''}
    </button>`;

  const tilesHtml = `
    <div class="section-label">Jump to</div>
    <div class="dash-tile-grid">
      <button class="dash-tile dash-tile-topics" id="dash-tile-topics">
        <span class="dash-tile-arrow">→</span>
        <span class="dash-tile-icon-badge">📖</span>
        <span class="dash-tile-label">Topics</span>
        <span class="dash-tile-desc">Vocabulary, sentences & conversations</span>
      </button>
      <button class="dash-tile dash-tile-translate" id="dash-tile-translate">
        <span class="dash-tile-arrow">→</span>
        <span class="dash-tile-icon-badge">🌐</span>
        <span class="dash-tile-label">Translate</span>
        <span class="dash-tile-desc">AI-powered translation & breakdown</span>
      </button>
    </div>`;

  return `
    <div class="dash-wrap">
      ${heroHtml}
      ${pathCardsHtml ? `<div class="section-label">Path progress</div><div class="dash-path-stack">${pathCardsHtml}</div>` : ''}
      ${reviewHtml}
      ${tilesHtml}
    </div>`;
}

// The hero card. `next` is dashboardNextUp()'s return value (or null when every
// path is complete, in which case a quiet completion state is shown instead).
function renderDashboardHero(next) {
  if (!next) {
    return `
      <div class="dash-hero dash-hero-done">
        <div class="dash-hero-eyebrow">All caught up</div>
        <div class="dash-hero-title">Every path is complete 🎉</div>
        <div class="dash-hero-sub">Check back as new chapters are added, or revisit Review to keep things fresh.</div>
      </div>`;
  }
  const { pathKey, path, item } = next;
  const pathLabel = `${path.icon} ${path.label}`;

  if (item.kind === 'checkpoint') {
    return `
      <div class="dash-hero" style="--hero-c:${GOLD_HERO};--hero-c-deep:#8a6716" data-dash-hero-cp="${pathKey}" data-dash-hero-stage="${item.stageId}">
        <div class="dash-hero-bg-char">字</div>
        <div class="dash-hero-top-row">
          <div class="dash-hero-eyebrow">Next up</div>
          <div class="dash-hero-icon-badge">◆</div>
        </div>
        <div class="dash-hero-stage">${pathLabel} · Checkpoint</div>
        <div class="dash-hero-title">${item.stageName}</div>
        <button class="dash-hero-cta">▶ Open checkpoint</button>
      </div>`;
  }

  // Lesson item — colour the hero from the actual topic's own colour, so the
  // dashboard previews what's next rather than always looking the same.
  const meta = store.topicMeta(item.topic);
  const color = (meta && meta.color) || BRAND_HERO;
  const tierLabel = item.tier > 1 ? `Tier ${item.tier}` : null;
  return `
    <div class="dash-hero" style="--hero-c:${color};--hero-c-deep:${darkenHex(color, 0.22)}" data-dash-hero-topic="${item.topic}" data-dash-hero-tier="${item.tier}">
      <div class="dash-hero-bg-char">字</div>
      <div class="dash-hero-top-row">
        <div class="dash-hero-eyebrow">Next up</div>
        <div class="dash-hero-icon-badge">${meta ? meta.icon : '📖'}</div>
      </div>
      <div class="dash-hero-stage">${pathLabel}</div>
      <div class="dash-hero-title">${meta ? meta.label : item.topic}${tierLabel ? `<span class="dash-hero-tier">${tierLabel}</span>` : ''}</div>
      <button class="dash-hero-cta">▶ Resume lesson</button>
    </div>`;
}

// One path's progress card. Beginner and Intermediate get distinct tinted
// treatments (jade / gold) so they read as different paths, not duplicated cards.
function renderDashboardPathCard(p) {
  const total = p.lessons.length;
  const done = pathCompleteCount(p.key);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const tint = p.key === 'beginner' ? 'jade' : 'gold';
  const barColor = p.key === 'beginner' ? 'var(--jade)' : 'var(--gold)';
  const sub = complete
    ? `Complete — all ${countPathChapters(p)} chapters`
    : `${total - done} lesson${(total - done) === 1 ? '' : 's'} to go`;
  return `
    <div class="dash-path-card dash-path-card-${tint}" data-dash-path-open="${p.key}">
      <div class="dash-path-row">
        <div class="dash-path-name">${p.icon} ${p.label} ${complete ? '<span class="dash-path-check">✓</span>' : ''}</div>
        <div class="dash-path-frac dash-path-frac-${tint}">${done}/${total}</div>
      </div>
      <div class="dash-path-track"><div class="dash-path-fill" style="width:${pct}%;background:${barColor}"></div></div>
      <div class="dash-path-sub">${sub}</div>
    </div>`;
}

// Counts distinct chapter/stage groupings for a path's "complete" subtitle.
// Falls back to lesson count if the path has no stage structure.
function countPathChapters(p) {
  const stages = getPathStages(p.key);
  return stages.length || p.lessons.length;
}

// Brand-fallback colours for the hero when no topic colour is available.
const BRAND_HERO = BRAND_ACCENT;
const GOLD_HERO   = '#B7861E';

// Darkens a #RRGGBB hex colour by `amount` (0-1) for the hero's gradient end —
// mirrors what a CSS color-mix would do, kept dependency-free.
function darkenHex(hex, amount) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.round(parseInt(h.slice(0,2),16) * (1 - amount));
  const g = Math.round(parseInt(h.slice(2,4),16) * (1 - amount));
  const b = Math.round(parseInt(h.slice(4,6),16) * (1 - amount));
  const toHex = n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function renderLearningPath() {
  if (state.pathView === 'timeline') {
    return renderPathTimeline(state.activePath);
  }
  return renderPathList();
}

function renderPathList() {
  // Group paths by level
  const byLevel = {};
  store.paths.forEach(p => {
    if (!byLevel[p.level]) byLevel[p.level] = [];
    byLevel[p.level].push(p);
  });
  const levelOrder = ['Beginner', 'Intermediate', 'Advanced'];
  const sections = levelOrder.filter(l => byLevel[l]).map(level => {
    const cards = byLevel[level].map(p => {
      const total = p.lessons.length;
      const done = pathCompleteCount(p.key);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const locked = !!p.comingSoon;
      const cardCls = 'path-card' + (locked ? ' locked' : '');
      const dataAttr = locked ? '' : `data-path-open="${p.key}"`;
      const badge = locked
        ? `<span class="path-card-badge coming">Coming Soon</span>`
        : (total > 0 && done === total ? `<span class="path-card-badge" style="background:#2D5040;color:#fff">Complete</span>` : '');
      const progress = locked ? '' : `
        <div class="path-card-progress">
          <div class="path-progress-bar"><div class="path-progress-fill" style="width:${pct}%"></div></div>
          <span class="path-progress-count">${done} / ${total}</span>
        </div>`;
      return `
        <div class="${cardCls}" ${dataAttr}>
          <div class="path-card-top">
            <span class="path-card-icon">${p.icon}</span>
            <span class="path-card-title">${p.label}</span>
            ${badge}
          </div>
          <div class="path-card-desc">${p.desc}</div>
          ${progress}
        </div>`;
    }).join('');
    return `
      <div class="path-level-header">${level}</div>
      ${cards}`;
  }).join('');

  return `
    <div class="path-list">
      ${renderPageHeader('🛤️', 'Learning Path', 'Curated lessons in order. Tap any to jump in — nothing is locked.')}
      ${sections}
    </div>`;
}

// One topic step in the timeline. Extracted so both the flat and stage-grouped
// layouts render identical step markup.
function renderPathStep(pathKey, l, displayNum, nextPos) {
  const lesson = lessonShape(l.topic);
  if (!lesson) return ''; // Defensive — skip if topic doesn't exist
  const tier = l.round;
  const complete = isLessonComplete(pathKey, l.topic, tier);
  const isNext = !complete && nextPos && nextPos.kind === 'lesson' && l.topic === nextPos.topic && tier === nextPos.tier;
  const stepCls = 'path-step' + (complete ? ' done' : '') + (isNext ? ' next' : '');
  const nextBadge = isNext ? `<span class="path-next-badge">Next up</span>` : '';
  const wordCount = (getRoundWords(l.topic, tier) || []).length;
  const tierLabel = tier > 1 ? `Tier ${tier} · ` : '';
  return `
    <div class="${stepCls}">
      <div class="path-step-rail">
        <div class="path-step-node">${complete ? '✓' : displayNum}</div>
        <div class="path-step-line"></div>
      </div>
      <div class="path-step-body">
        <div class="path-step-card" data-path-lesson="${l.topic}" data-path-tier="${tier}">
          ${nextBadge}
          <div class="path-step-row">
            <span class="path-step-icon">${lesson.icon}</span>
            <div class="path-step-text">
              <div class="path-step-title">${lesson.label}</div>
              <div class="path-step-meta">${tierLabel}${wordCount} word${wordCount !== 1 ? 's' : ''}</div>
            </div>
            <button class="path-complete-btn" data-path-toggle="${l.topic}" data-path-tier="${tier}" aria-label="${complete ? 'Mark incomplete' : 'Mark complete'}">${complete ? '✓' : '✓'}</button>
          </div>
        </div>
      </div>
    </div>`;
}

// The checkpoint node + card for a stage (gold diamond, distinct from topic steps).
function renderCheckpointNode(pathKey, stage, nextPos) {
  const prog = checkpointProgress(pathKey, stage.id);
  if (!prog.total) return '';  // no offerable activities → no node
  const isNext = !prog.complete && nextPos && nextPos.kind === 'checkpoint' && nextPos.stageId === stage.id;
  const progText = prog.complete
    ? 'Complete'
    : `${prog.done} of ${prog.total} reviewed · tap to open`;
  const nextBadge = isNext ? `<span class="path-next-badge">Next up</span>` : '';
  return `
    <div class="path-step path-step-cp${prog.complete ? ' cp-done' : ''}${isNext ? ' next' : ''}">
      <div class="path-step-rail">
        <div class="path-step-node cp-node"><span>◆</span></div>
        <div class="path-step-line"></div>
      </div>
      <div class="path-step-body">
        <div class="path-step-card cp-card" data-cp-open="${stage.id}">
          ${nextBadge}
          <div class="path-step-row">
            <span class="path-step-icon">◆</span>
            <div class="path-step-text">
              <div class="path-step-title">Checkpoint · ${stage.name}</div>
              <div class="path-step-cp-prog">${progText}</div>
            </div>
            <span class="path-cp-badge">${prog.complete ? '✓' : 'CHECKPOINT'}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderPathTimeline(pathKey) {
  const path = store.paths.find(p => p.key === pathKey);
  if (!path) return `<div class="path-empty-msg">Path not found.</div>`;
  if (!path.lessons.length) {
    return `
      <div class="path-timeline-wrap">
        <button class="path-timeline-back" data-path-back><span class="icon-label">${icon('arrowLeft',15)} Back to Learning Paths</span></button>
        <div class="path-empty-msg">${path.icon} ${path.label} — coming soon.</div>
      </div>`;
  }
  const total = path.lessons.length;
  const done = pathCompleteCount(pathKey);
  const pct = Math.round((done / total) * 100);
  const nextPos = nextPathPosition(pathKey);
  const stages = getPathStages(pathKey);

  let body;
  if (stages.length) {
    // ── Stage-grouped layout ──
    // Each stage gets a header band, its topic steps, then (if present) its
    // checkpoint node. Step numbers stay continuous across the whole path so
    // they match the underlying lesson order.
    let stepNum = 0;
    body = stages.map((stage, si) => {
      const stageSteps = (stage.topics || []).map(topicKey => {
        // Find this topic's lesson entry (keeps tier/round correct).
        const l = path.lessons.find(x => x.topic === topicKey);
        if (!l) return '';
        stepNum += 1;
        return renderPathStep(pathKey, l, stepNum, nextPos);
      }).join('');
      const cpNode = stage.checkpoint ? renderCheckpointNode(pathKey, stage, nextPos) : '';
      return `
        <div class="path-stage-band">
          <span class="path-stage-num">${si + 1}</span>
          <span class="path-stage-name">${stage.name}</span>
          <span class="path-stage-rule"></span>
          <span class="path-stage-meta">${(stage.topics || []).length} topics</span>
        </div>
        ${stageSteps}
        ${cpNode}`;
    }).join('');
  } else {
    // ── Flat layout (unchanged behaviour for paths without stages) ──
    body = path.lessons.map((l, i) => renderPathStep(pathKey, l, i + 1, nextPos)).join('');
  }

  return `
    <div class="path-timeline-wrap">
      <button class="path-timeline-back" data-path-back><span class="icon-label">${icon('arrowLeft',15)} Back to Learning Paths</span></button>
      <div class="path-timeline-header">
        <div class="path-timeline-title">${path.icon} ${path.label}</div>
        <div class="path-timeline-sub">${path.desc}</div>
        <div class="path-timeline-progress">
          <div class="path-progress-bar"><div class="path-progress-fill" style="width:${pct}%"></div></div>
          <span class="path-progress-count">${done} / ${total} complete</span>
        </div>
      </div>
      <div class="path-timeline">${body}</div>
    </div>`;
}

// ── Checkpoint screens (Stage 3) ──────────────────────────────────────────────
const CP_GOLD = '#B7861E';

// The hub: three independent activities. Reuses no learning engine itself — it
// routes into the Words / Patterns / Conversation activities.
function renderCheckpointHub() {
  const cpState = state.checkpoint;
  if (!cpState) return '';
  const { pathKey, stageId, cpId } = cpState;
  const stage = getStage(pathKey, stageId);
  if (!stage) return '';
  const prog = checkpointProgress(pathKey, stageId);

  const meta = {
    words:    { icon:'📖', name:'Words',        tag:'RECALL',  desc:'Vocabulary from all topics in this stage' },
    patterns: { icon:'🔨', name:'Patterns',     tag:'APPLY',   desc:'Sentence-pattern drills, reshuffled each time' },
    convo:    { icon:'💬', name:'Conversation', tag:'PRODUCE', desc:'A longer scene — read & speak' },
  };
  const cards = prog.available.map(act => {
    const m = meta[act];
    const done = checkpointActivityDone(pathKey, cpId, act);
    const right = done
      ? `<span class="cp-act-done">✓ Done</span>`
      : `<span class="cp-act-go">›</span>`;
    return `
      <button class="cp-act-card" data-cp-act="${act}">
        <span class="cp-act-icon">${m.icon}</span>
        <span class="cp-act-body">
          <span class="cp-act-name">${m.name} <span class="cp-act-tag">${m.tag}</span></span>
          <span class="cp-act-desc">${m.desc}</span>
        </span>
        <span class="cp-act-right">${right}</span>
      </button>`;
  }).join('');

  const finishCls = prog.complete ? 'cp-finish' : 'cp-finish dim';
  const finishLabel = prog.complete
    ? '✓ Checkpoint complete — back to path'
    : (prog.total - prog.done === 1 ? 'Finish 1 more to complete' : `Finish ${prog.total - prog.done} more to complete`);

  return `
    <div class="content cp-hub">
      <button class="back-home-btn" data-cp-back><span class="icon-label">${icon('arrowLeft',15)} ${stage.name}</span></button>
      <div class="cp-hero">
        <div class="cp-diamond"><span>◆</span></div>
        <div class="cp-hero-h">Checkpoint</div>
        <div class="cp-hero-stage">${stage.name}</div>
        <div class="cp-hero-prog">${prog.done} of ${prog.total} reviewed</div>
        <div class="cp-optional">🔓 Optional — do any, in any order</div>
      </div>
      <div class="cp-flow-hint">Suggested flow: recall → apply → produce</div>
      ${cards}
      <button class="${finishCls}" data-cp-back>${finishLabel}</button>
    </div>`;
}

// Words activity — reuses renderQuizCore for the question, with checkpoint chrome.
function renderCheckpointWords() {
  const q = state.checkpointQuiz;
  const cpState = state.checkpoint;
  if (!q || !cpState) return '';
  const stage = getStage(cpState.pathKey, cpState.stageId);

  // Done summary + diagnostic
  if (q.done) {
    const total = q.pool.length;
    return renderCheckpointDone({
      activityLabel: 'Words',
      emoji: '📖',
      score: q.score,
      total,
      stage,
      missedTopicKeys: q.missed.map(w => wordTopicInStage(cpState.pathKey, stage, w)).filter(Boolean),
      missedItems: q.missed.map(w => ({ c:w.c, j:w.j, e:w.e })),
      activity: 'words',
    });
  }

  const cw = q.pool[q.idx];
  const core = renderQuizCore({
    word:       cw,
    choices:    q.choices,
    selected:   q.selected,
    direction:  q.direction,
    color:      CP_GOLD,
    idx:        q.idx,
    total:      q.pool.length,
    ariaLabel:  'Checkpoint words',
    dirAttr:    'data-cpw-dir',
    choiceAttr: 'data-cpw-choice',
    listenId:   'cpw-listen',
    replayId:   'cpw-replay',
    nextId:     'cpw-next',
  });
  return `
    <div class="content">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="topic-drill-heading">📖 Words review</div>
      <div class="quiz-meta">
        <span style="color:#888">Word ${q.idx+1} / ${q.pool.length}</span>
        <span style="color:${CP_GOLD};font-weight:700">Score: ${q.score}</span>
      </div>
      ${core.progressBar}
      ${core.dirToggle}
      ${core.promptCard}
      ${core.choiceGrid}
      ${core.answerPanel}
    </div>`;
}

// Shared done screen for checkpoint activities: score ring + session-based
// diagnostic ("Most misses were from <Topic> — revisit?") + missed list.
function renderCheckpointDone(opts) {
  const { activityLabel, emoji, score, total, stage, missedTopicKeys, missedItems, activity } = opts;
  const pct = total > 0 ? Math.round(score / total * 100) : 0;
  const diag = checkpointDiagnostic(stage, missedTopicKeys);

  const diagBlock = diag ? `
    <div class="cp-diag">
      <div class="cp-diag-lbl">💡 One thing to look at</div>
      <div class="cp-diag-text">Most of your misses were from <b>${diag.label}</b>. A quick revisit might help.</div>
      <button class="cp-diag-revisit" data-cp-revisit="${diag.topicKey}">↩ Revisit ${diag.label}</button>
    </div>` : '';

  const missedBlock = missedItems.length ? `
    <div class="cp-missed">
      <div class="cp-missed-lbl">Worth another look</div>
      ${missedItems.map(m => `
        <div class="cp-missed-item">
          <button class="play-mini" data-cp-say="${m.c}">${iconPlay(12)}</button>
          <div><div class="cp-missed-c">${m.c}</div><div class="cp-missed-j">${colorJyutping(m.j)}</div></div>
          <span class="cp-missed-e">${m.e}</span>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="content cp-done">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="cp-done-wrap">
        <div class="cp-done-ring" style="background:conic-gradient(${CP_GOLD} ${pct}%, #e4d4ad 0)">
          <div class="cp-done-inner"><div class="cp-done-pct">${pct}%</div><div class="cp-done-cap">${activityLabel.toUpperCase()}</div></div>
        </div>
        <div class="cp-done-h">${activityLabel} done ${emoji}</div>
        <div class="cp-done-sub">${score} of ${total} correct</div>
      </div>
      ${diagBlock}
      ${missedBlock}
      <button class="cp-finish" data-cp-act-done="${activity}">✓ Back to checkpoint</button>
    </div>`;
}

// Patterns activity wrapper — the drill engine with a "← Checkpoint" header.
function renderCheckpointPatterns() {
  const pd = state.patternDrill;
  if (!pd) return '';
  return `
    <div class="content">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="topic-drill-heading">🔨 Pattern drill</div>
      ${renderDrillBody(pd)}
    </div>`;
}

// Conversation activity wrapper — the existing chat engine over the checkpoint
// consolidation convo (sourced via activeConvoSource), read + speak only.
function renderCheckpointConvo() {
  const cpState = state.checkpoint;
  if (!cpState) return '';
  const stage = getStage(cpState.pathKey, cpState.stageId);
  const convo = activeConvoSource();
  const body = convo
    ? renderConversation(CP_GOLD)
    : '<p style="color:#aaa;padding:20px 0">No conversation authored for this stage yet.</p>';
  const doneFlag = checkpointActivityDone(cpState.pathKey, cpState.cpId, 'convo');
  return `
    <div class="content cp-convo">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="cp-convo-head">
        <div class="cp-convo-kick">◆ Consolidation · ${stage ? stage.name : ''}</div>
        <div class="cp-convo-title">${convo ? convo.title : ''}</div>
      </div>
      ${body}
      <button class="cp-finish" data-cp-act-done="convo">${doneFlag ? '✓ Reviewed — back to checkpoint' : '✓ Mark conversation reviewed'}</button>
    </div>`;
}

function renderPlaceholder(icon, title, subtitle) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 30px;text-align:center;min-height:300px;">
      <div style="font-size:52px;margin-bottom:16px;">${icon}</div>
      <div style="font-size:20px;font-weight:700;color:#2A2422;margin-bottom:8px;">${title}</div>
      <div style="font-size:13px;color:#aaa;line-height:1.6;max-width:260px;">${subtitle}</div>
    </div>`;
}

function render() {
  const app = document.getElementById('app');

  // ── Lazy-load gate ──────────────────────────────────────────────────────
  // If the current view requires content that hasn't been fetched yet,
  // show a loading shell and trigger a fetch. render() will be called
  // again once the fetch resolves.
  const needsTopic = state.nav === 'topics' && !state.homeView;
  if (needsTopic && !store.isTopicLoaded(state.topic)) {
    app.innerHTML = `
      ${renderHeader(null)}
      ${renderVoiceBanner()}
      <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading topic…</div></div>
      ${renderDrawer()}
    `;
    attachEvents(null, null);
    store.loadTopic(state.topic).then(render).catch(err => {
      console.error('[topic load]', err);
      app.innerHTML = `
        ${renderHeader(null)}
        <div class="content"><div style="padding:40px 20px;text-align:center;color:#922B21;font-size:14px;">Couldn't load topic. Check console.</div></div>
        ${renderDrawer()}
      `;
      attachEvents(null, null);
    });
    return;
  }

  // If the path timeline is open, pre-warm all of its topics so word counts render.
  if (state.nav === 'path' && state.pathView === 'timeline') {
    const path = (store.paths || []).find(p => p.key === state.activePath);
    if (path) {
      const missing = path.lessons.map(l => l.topic).filter(k => !store.isTopicLoaded(k));
      if (missing.length) {
        app.innerHTML = `
          ${renderHeader(null)}
          ${renderVoiceBanner()}
          <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading path…</div></div>
          ${renderDrawer()}
        `;
        attachEvents(null, null);
        store.loadTopics(missing).then(render).catch(err => {
          console.error('[path load]', err);
        });
        return;
      }
    }
  }

  // If a checkpoint is open, ensure its stage's topics are loaded (word pools and
  // drills depend on cached topic data). Normally the timeline pre-warm above has
  // already cached them, but this guards direct/restored entry into a checkpoint.
  if (state.checkpoint) {
    const stage = getStage(state.checkpoint.pathKey, state.checkpoint.stageId);
    if (stage) {
      const missing = (stage.topics || []).filter(k => !store.isTopicLoaded(k));
      if (missing.length) {
        app.innerHTML = `
          ${renderHeader(null)}
          ${renderVoiceBanner()}
          <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading checkpoint…</div></div>
          ${renderDrawer()}
        `;
        attachEvents(null, null);
        store.loadTopics(missing).then(render).catch(err => console.error('[checkpoint load]', err));
        return;
      }
    }
  }

  const lesson = needsTopic ? lessonShape(state.topic) : null;
  const color  = lesson ? lesson.color : null;

  let mainContent = '';
  // A checkpoint hub or activity takes over the screen (launched from the path
  // timeline). Checked before other nav so it's a focused full-screen view.
  if (state.checkpoint && state.checkpointAct === 'words') {
    mainContent = renderCheckpointWords();
  } else if (state.checkpoint && state.checkpointAct === 'patterns') {
    mainContent = renderCheckpointPatterns();
  } else if (state.checkpoint && state.checkpointAct === 'convo') {
    mainContent = renderCheckpointConvo();
  } else if (state.checkpoint) {
    mainContent = renderCheckpointHub();
  } else if (state.patternDrill && state.patternDrill.topicKey) {
    mainContent = `<div class="content">${renderTopicDrillView(color)}</div>`;
  } else if (state.nav === 'topics') {
    if (state.homeView) {
      mainContent = `
        ${renderVoiceBanner()}
        ${renderHomeScreen()}`;
    } else {
      const ctx = getPathContext();
      const headerEl = ctx
        ? renderPathBanner(ctx, color)
        : `<button class="back-home-btn" id="back-home-btn"><span class="icon-label">${icon('arrowLeft',15)} Back to topics</span></button>`;
      const toastEl  = state.pathToast ? renderPathToast(state.pathToast) : '';
      mainContent = `
        ${renderVoiceBanner()}
        <div class="content">
          ${headerEl}
          ${renderRoundSelector(state.topic, color)}
          ${renderLessonHeader(lesson, color)}
          ${state.mode === 'quiz' ? renderQuiz(lesson, color) : state.tab === 'convo' ? renderConversation(color) : state.tab === 'patterns' ? renderTopicPatternsTab(color) : renderStudy(lesson, color)}
        </div>
        ${toastEl}`;
    }
  } else if (state.nav === 'dashboard') {
    mainContent = `${renderVoiceBanner()}${renderDashboard()}`;
  } else if (state.nav === 'patterns') {
    mainContent = renderPatterns();
  } else if (state.nav === 'review') {
    if (state.reviewView === 'words')         mainContent = renderWordReview();
    else if (state.reviewView === 'patterns') mainContent = renderPatternReview();
    else                                      mainContent = renderReviewHub();
  } else if (state.nav === 'translate') {
    mainContent = renderTranslate();
  } else if (state.nav === 'path') {
    mainContent = `${renderVoiceBanner()}${renderLearningPath()}`;
  }

  app.innerHTML = `
    ${renderHeader(color)}
    ${mainContent}
    ${renderDrawer()}
  `;

  attachEvents(lesson, color);
}

// Unified page-section header — used by Topics, Learning Path, Patterns, Translate
// so all four read consistently. icon = emoji string, title + subtitle text.
function renderPageHeader(emoji, title, subtitle) {
  return `
    <div class="page-header">
      <h2 class="page-header-title">${emoji ? `<span class="page-header-emoji">${emoji}</span>` : ''}${title}</h2>
      ${subtitle ? `<p class="page-header-sub">${subtitle}</p>` : ''}
    </div>`;
}

function renderHeader(color) {
  const toneKeys = Object.entries(TONES).map(([t,d]) =>
    `<span style="color:${d.color}">● T${t}</span>`
  ).join('');
  const detailsOpen = state.headerDetailsOpen;
  return `
    <div class="header">
      <div class="header-row">
        <div class="header-title">
          <span class="zh">廣東話</span>
          <span class="en">Cantonese Learner</span>
        </div>
        <div class="header-actions">
          <button class="header-info-btn${detailsOpen ? ' open' : ''}" id="header-info-toggle" aria-label="Show tone reference" aria-expanded="${detailsOpen}">
            <span class="header-info-icon">${detailsOpen ? icon('close', 17) : icon('info', 17)}</span>
          </button>
          <button class="hamburger" id="hamburger-btn" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      ${detailsOpen ? `
        <div class="header-details">
          <div class="tone-key">
            ${toneKeys}
            <span class="label">jyutping tones</span>
          </div>
        </div>` : ''}
    </div>`;
}

// ── PATH-MODE UI ─────────────────────────────────────────────────────────────
// Combined banner shown at the top of a topic page when the user entered via a
// Learning Path. One card containing the path context AND the primary action
// (mark complete / next step / path complete).
function renderPathBanner(ctx, color) {
  // Progress: how many steps in this path are complete (for the bar fill)
  const prog = state.pathProgress[state.activePath] || {};
  const doneCount = ctx.path.lessons.filter(l => prog[lessonKey(l.topic, l.round)]).length;
  const pct = Math.round((doneCount / ctx.total) * 100);

  // Step count line — gets a green tick prefix once this step is complete
  const tickSmall = `<span class="path-banner-tick">${icon('check',13)}</span>`;
  let countLine;
  if (ctx.isComplete && ctx.isLast) {
    countLine = `${tickSmall}${ctx.total} / ${ctx.total}`;
  } else if (ctx.isComplete) {
    countLine = `${tickSmall}Step ${ctx.step} / ${ctx.total}`;
  } else {
    countLine = `Step ${ctx.step} / ${ctx.total}`;
  }

  // Progress bar turns green once the current step is done
  const barFillCls = ctx.isComplete ? 'path-bar-fill path-bar-fill-done' : 'path-bar-fill';

  // Action zone — depends on completion state
  let actionZone;
  if (ctx.isComplete && ctx.isLast) {
    // Whole path finished — celebratory message instead of an action
    actionZone = `
      <div class="path-final-msg">
        <div class="path-final-badge">🎉</div>
        <div class="path-final-text">
          <div class="path-final-title">Path complete!</div>
          <div class="path-final-sub">You've finished every step of ${ctx.path.label} Path.</div>
        </div>
      </div>`;
  } else if (ctx.isComplete) {
    // Step done — green tick badge + raised "Next step" button
    actionZone = `
      <div class="path-action-zone">
        <div class="path-next-row">
          <div class="path-tick-badge" aria-label="Step complete">${icon('check',19)}</div>
          <button class="path-btn path-btn-next" id="path-next-step">
            <span class="icon-label">Next step ${icon('arrowRight',16)} ${ctx.nextTopicIcon || ''} ${ctx.nextTopicLabel || 'continue'}</span>
          </button>
        </div>
      </div>`;
  } else {
    // Incomplete — raised green "Mark step complete" button
    actionZone = `
      <div class="path-action-zone">
        <button class="path-btn path-btn-mark" id="path-mark-complete">
          <span class="icon-label">${icon('check',18)} Mark step complete</span>
        </button>
      </div>`;
  }

  return `
    <div class="path-banner" style="border-color:${color}55">
      <div class="path-banner-row">
        <button class="path-banner-back" id="back-home-btn" aria-label="Back to Learning Path">${icon('arrowLeft',20)}</button>
        <div class="path-banner-text">
          <div class="path-banner-top">
            <span class="path-banner-name">${ctx.path.icon || '🛤️'} ${ctx.path.label} Path</span>
            <span class="path-banner-count">${countLine}</span>
          </div>
          <div class="path-bar"><div class="${barFillCls}" style="width:${Math.max(pct,3)}%"></div></div>
        </div>
      </div>
      ${actionZone}
    </div>`;
}

// Transient overlay shown after marking complete. Auto-dissolves via setTimeout
// scheduled in the click handler.
function renderPathToast(t) {
  return `<div class="path-toast ${t.kind === 'final' ? 'path-toast-final' : ''}">${t.text}</div>`;
}

function renderVoiceBanner() {
  if (!state.voiceInfo) return '';
  if (state.voiceBannerDismissed) return '';
  const v = state.voiceInfo;
  // Quiet success state: a single-line confirmation, dismissible.
  // Warning/error states: full message with details.
  if (v.status === 'hk') {
    return `<div class="voice-banner voice-ok voice-banner-compact">
      <span class="voice-banner-text"><span class="icon-label">${icon('volume',14)} Cantonese voice ready</span></span>
      <button class="voice-banner-dismiss" id="voice-banner-dismiss" aria-label="Dismiss">×</button>
    </div>`;
  }
  const cls = v.status === 'other' ? 'voice-warn' : 'voice-none';
  const statusIcon = v.status !== 'none' ? '🔊' : '⚠️';
  const extra = v.status === 'none'
    ? ' · Try Chrome, or go to Android Settings → General Management → Language → TTS → install Chinese (Hong Kong)'
    : '';
  return `<div class="voice-banner ${cls}">${statusIcon} ${v.label}${v.name ? ' — ' + v.name : ''}${extra}</div>`;
}

function renderCategoryFilter() {
  const allCount = Object.keys(store.topicCategories).length;
  const options = [
    { key:'all', label:`📚 All Categories (${allCount})` },
    ...store.categoryList.map(c => ({
      key:   c.key,
      label: `${c.icon} ${c.label} (${getTopicsByCategory(c.key).length})`,
    })),
  ];
  const opts = options.map(o =>
    `<option value="${o.key}"${state.selectedCategory === o.key ? ' selected' : ''}>${o.label}</option>`
  ).join('');
  return `
    <div class="cat-filter-wrap">
      <select class="cat-filter-select" id="cat-filter-select">${opts}</select>
    </div>`;
}

function renderTopicCard(topicKey) {
  const lesson = lessonShape(topicKey);
  if (!lesson) return '';
  const rounds = getAvailableRounds(topicKey);
  const entry = store.indexEntry(topicKey);
  // Word count for Round 1, pulled from the index so we don't need to load the topic file.
  const wordCount = entry?.wordCounts?.['1'] ?? lesson.words.length;
  const pips = rounds.map(r => `<span class="topic-card-pip" style="background:${lesson.color}"></span>`).join('') +
               (rounds.length < 3 ? `<span class="topic-card-pip" style="background:${lesson.color}33"></span>`.repeat(3 - rounds.length) : '');
  return `
    <div class="topic-card" data-topic-card="${topicKey}" tabindex="0" style="--topic-accent:${lesson.color}">
      <div class="topic-card-icon">${lesson.icon}</div>
      <div class="topic-card-label">${lesson.label}</div>
      <div class="topic-card-meta">${rounds.length} tier${rounds.length>1?'s':''} · ${wordCount} words</div>
      <div class="topic-card-rounds">${pips}</div>
    </div>`;
}

function renderHomeScreen() {
  const filter = state.selectedCategory;
  const sections = store.categoryList
    .filter(cat => filter === 'all' || filter === cat.key)
    .map(cat => {
      const topics = getTopicsByCategory(cat.key);
      if (topics.length === 0) return '';
      const cards = topics.map(t => renderTopicCard(t)).join('');
      return `
        <div class="cat-section" id="cat-anchor-${cat.key}">
          <div class="cat-section-header">
            <span class="cat-section-title">${cat.icon} ${cat.label}</span>
            <span class="cat-section-count">${topics.length} topic${topics.length>1?'s':''}</span>
          </div>
          <div class="topic-grid">${cards}</div>
        </div>`;
    }).join('');

  return `
    <div class="home-wrap">
      ${renderPageHeader('📖', 'Topics', 'Choose a category and topic to start learning')}
      ${renderCategoryFilter()}
      ${sections}
    </div>`;
}

function renderRoundSelector(topicKey, color) {
  const rounds = getAvailableRounds(topicKey);
  if (rounds.length <= 1) return '';   // Hide selector if only one round
  const btns = rounds.map(r => {
    const active = state.currentRound === r;
    const style = active ? `background:${color};border-color:${color};color:#fff` : `border-color:${color};color:${color}`;
    return `<button class="round-btn${active?' active':''}" data-round="${r}" style="${style}">Tier ${r}</button>`;
  }).join('');
  return `
    <div class="round-selector">
      <span class="round-label">Tier:</span>
      ${btns}
    </div>`;
}

function renderTopics() {
  const btns = (store.index || []).map(l => {
    const key = l.key;
    const active = state.topic === key;
    const style = active
      ? `background:${BRAND_ACCENT};color:#fff;border-color:${BRAND_ACCENT}`
      : `background:#fff;color:#555;border-color:#ddd`;
    return `<button class="topic-btn${active?' active':''}" style="${style}" data-topic="${key}">${l.icon} ${l.label}</button>`;
  }).join('');
  return `<div class="topics">${btns}</div>`;
}

function renderLessonHeader(lesson, color) {
  const isQuiz = state.mode === 'quiz';
  // Three mutually-exclusive views: Words, Conversation, Quiz.
  // 'words' and 'convo' are state.tab values (with mode='study'); 'quiz' is mode='quiz'.
  const wordsActive = !isQuiz && state.tab === 'words';
  const convoActive = !isQuiz && state.tab === 'convo';
  const patternsActive = !isQuiz && state.tab === 'patterns';
  const hasPatterns = getTopicDrills(state.topic).length > 0;
  const segTabs = `
    <div class="subtabs">
      <button class="subtab-btn${wordsActive?' active':''}" id="tab-words"
        style="${wordsActive?'background:'+color:''}">
        <span class="icon-label">${icon('bookOpen',14)} Learn</span>
      </button>
      <button class="subtab-btn${convoActive?' active':''}" id="tab-convo"
        style="${convoActive?'background:'+color:''}">
        <span class="icon-label">${icon('messageCircle',14)} Chat</span>
      </button>
      ${hasPatterns ? `<button class="subtab-btn${patternsActive?' active':''}" id="tab-patterns"
        style="${patternsActive?'background:'+color:''}">
        <span class="icon-label">🔨 Patterns</span>
      </button>` : ''}
      <button class="subtab-btn${isQuiz?' active':''}" id="tab-quiz"
        style="${isQuiz?'background:'+color:''}">
        <span class="icon-label">${icon('quiz',14)} Quiz</span>
      </button>
    </div>`;
  return `
    <div class="lesson-header lesson-header-stacked">
      <h2 class="lesson-title" style="color:${color}">${lesson.icon} ${lesson.label}</h2>
      <div class="lesson-count">${getRoundWords(state.topic, state.currentRound).length} words</div>
    </div>
    ${segTabs}`;
}

function renderConversation(color) {
  const convo = activeConvoSource();
  if (!convo) return '<p style="color:#aaa;padding:20px 0">No conversation for this topic yet.</p>';
  const cv = state.convo;
  const lines = convo.lines;

  // ── Control bar ──
  const playAllStyle = cv.playingLine !== null
    ? `background:${color};color:#fff;border-color:${color}`
    : '';
  const gapOn    = cv.convMode === 'gap';
  const speakOn  = cv.convMode === 'speak';
  // Checkpoint consolidation convo is read + speak only (no Fill-the-Gap), to
  // keep the three checkpoint activities on a deliberate recall→apply→produce
  // gradient rather than overlapping the pattern drill's MCQ feel.
  const inCheckpointConvo = !!(state.checkpoint && state.checkpointAct === 'convo');
  // Only show Fill-the-Gap if at least one user turn has authored opts — pre-spec
  // convos have u:true lines but no opts array, and trying to render choices for them
  // throws a TypeError that corrupts the event-listener state for the whole page.
  const hasGapLines = lines.some(l => l.u && Array.isArray(l.opts) && l.opts.length > 0);
  const gapBtnHtml = (inCheckpointConvo || !hasGapLines) ? '' : `
      <button class="convo-ctrl-btn${gapOn?' on':''}" id="gap-mode-btn"
        style="${gapOn?'background:'+color+';color:#fff;border-color:'+color:''}">
        🧩 Fill-the-Gap
      </button>`;
  const controls = `
    <div class="convo-controls">
      <button class="convo-ctrl-btn${cv.playingLine!==null?' on':''}" id="play-all-btn"
        style="${cv.playingLine!==null?'background:'+color+';color:#fff;border-color:'+color:'border-color:'+color+';color:'+color}">
        <span class="icon-label">${cv.playingLine!==null ? icon('stop',15) : iconPlay(14)} ${cv.playingLine!==null ? 'Stop' : 'Play All'}</span>
      </button>
      ${gapBtnHtml}
      <button class="convo-ctrl-btn${speakOn?' on':''}" id="speak-mode-btn"
        style="${speakOn?'background:'+color+';color:#fff;border-color:'+color:''}">
        🎙 Speak
      </button>
    </div>`;

  // ── Speak mode ──
  if (speakOn) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      return `
        <div class="convo-scenario">📍 ${convo.title}</div>
        ${controls}
        <div class="speak-unsupported">
          <div style="font-size:24px;margin-bottom:8px">🎙</div>
          <strong>Speech recognition not supported</strong><br>
          Your browser doesn't support voice input. Try Chrome on Android or desktop.
        </div>`;
    }
    const step = Math.min(cv.speakStep, lines.length - 1);
    const line = lines[step];
    const isUser = line.u;
    const spkName = isUser ? convo.speakers[1] : convo.speakers[0];
    const playing = cv.playingLine === step;
    const status  = cv.speakStatus;
    const isLast  = step >= lines.length - 1;

    const statusText = {
      idle:      isUser ? '👇 Press the mic and say the line above' : '👂 Listen, then continue',
      listening: '🎙 Listening… speak the line, then press Stop',
      matched:   '',
      mismatch:  '',
    }[status] || '';

    const result = status === 'matched'
      ? (() => {
          const breakdown = renderSpeakBreakdown(cv.speakHeard || line.c, line.c, line.j);
          return `<div class="speak-result-good">
            <div>✓ Great! You said it correctly.</div>
            ${breakdown ? breakdown : ''}
          </div>`;
        })()
      : status === 'mismatch'
      ? (() => {
          const breakdown = renderSpeakBreakdown(cv.speakHeard, line.c, line.j);
          return `<div class="speak-result-bad">
            <div style="font-weight:700;margin-bottom:4px">Hmm, that didn't quite match.</div>
            <div>Expected: <strong>${line.c}</strong></div>
            ${breakdown
              ? breakdown
              : `<div style="font-size:12px;color:#666;margin-top:2px">${colorJyutping(line.j)}</div>`}
          </div>`;
        })()
      : '';

    const heard = cv.speakHeard
      ? `<div class="speak-heard">You said: <strong>${cv.speakHeard}</strong></div>`
      : '';

    const englishEl = cv.speakRevealed[step]
      ? `<div class="speak-target-en">${line.e}</div>`
      : `<div class="speak-target-en speak-eng-hint" data-speak-reveal="${step}" style="font-style:italic;color:#bbb;cursor:pointer">tap to see English</div>`;

    return `
      <div class="convo-scenario">📍 ${convo.title}</div>
      ${controls}
      <div class="speak-nav">
        <span>Line ${step+1} of ${lines.length}</span>
        <span style="color:${color};font-weight:700">${isUser?'🗣 Your turn':'👂 Listen'}</span>
      </div>
      <div class="speak-card" style="border-color:${color}">
        <div class="speak-prompt">${spkName}</div>
        <div class="speak-target-zh">${line.c}</div>
        <div class="speak-target-jp">${colorJyutping(line.j)}</div>
        ${englishEl}
        ${isUser ? `
          <button class="mic-btn ${status==='listening'?'listening':'idle'}" id="mic-btn"
            style="color:${status==='listening'?BRAND_ACCENT:color};border:3px solid ${status==='listening'?BRAND_ACCENT:color}">
            ${status==='listening'?'🔴':'🎙'}
          </button>
          <div class="speak-status">${statusText}</div>
          ${status==='listening' ? `
            <button class="speak-action-btn primary" id="speak-stop-btn" style="background:#E74C3C;color:#fff;margin-bottom:14px">
              ⏹ Stop & Check
            </button>
          ` : ''}
          ${heard}
          ${result}
        ` : `
          <div class="speak-actions">
            <button class="speak-action-btn primary" id="speak-listen-btn"
              style="background:${playing?color+'cc':color};color:#fff">
              <span class="icon-label">${playing ? icon('volume',16) : iconPlay(14)} ${playing ? 'Playing…' : 'Listen'}</span>
            </button>
          </div>
        `}
        ${(isUser && (status === 'mismatch' || status === 'matched')) || !isUser ? `
        <div class="speak-actions">
          ${isUser && status === 'mismatch' ? `
            <button class="speak-action-btn secondary" id="speak-retry"><span class="icon-label">${icon('refresh',14)} Try Again</span></button>
            <button class="speak-action-btn primary" id="speak-skip"  style="background:${color};color:#fff"><span class="icon-label">Skip ${icon('arrowRight',14)}</span></button>
          ` : ''}
          ${(isUser && status === 'matched') || !isUser ? `
            <button class="speak-action-btn primary" id="speak-next" style="background:${color};color:#fff">
              ${isLast ? "<span class=\"icon-label\">" + icon('refresh',14) + " Restart</span>" : "<span class=\"icon-label\">Next " + icon('arrowRight',14) + "</span>"}
            </button>
          ` : ''}
        </div>
        ` : ''}
      </div>
      ${isUser && status === 'idle' ? `<p style="font-size:11px;color:#aaa;text-align:center;margin-top:6px">📱 Allow microphone access if prompted</p>` : ''}`;
  }

  // ── Read / Gap mode ──
  const bubbles = lines.map((line, i) => {
    const isUser   = line.u;
    const side     = isUser ? 'right' : 'left';
    const spkName  = isUser ? convo.speakers[1] : convo.speakers[0];
    const bubbleBg = isUser ? color : THEME.bubbleBg;
    const playing  = cv.playingLine === i;
    const playColor = isUser ? 'rgba(255,255,255,0.8)' : color;

    // Gap mode: hide user lines until answered. Guard against pre-spec convos
    // where u:true lines have no opts array — those render as normal bubbles.
    if (gapOn && isUser && Array.isArray(line.opts) && Array.isArray(line.optsJ)) {
      const answered = cv.gapAnswers[i];
      if (!answered) {
        // Show choices
        const paired = shuffle(line.opts.map((c, k) => ({ c, j: line.optsJ[k] })));
        const opts = paired.map(opt =>
            `<button class="gap-btn" data-gap-line="${i}" data-gap-ans="${opt.c}">${colorJyutping(opt.j)}</button>`
          ).join('');
        return `
          <div class="bubble-row ${side}">
            <div class="bubble-wrap">
              <div class="bubble-name">${spkName}</div>
              <div class="bubble" style="background:${bubbleBg}22;border:2px dashed ${color}88">
                <div class="gap-prompt">👆 What would you say?</div>
                <div class="gap-options">${opts}</div>
              </div>
            </div>
          </div>`;
      } else {
        // Show answered line with result highlight
        const correct = answered === line.c;
        const hlColor = correct ? '#d4edda' : '#f8d7da';
        const hlBorder = correct ? '#15803D' : BRAND_ACCENT;
        return `
          <div class="bubble-row ${side}">
            <div class="bubble-wrap">
              <div class="bubble-name">${spkName} ${correct?'✓':'✗'}</div>
              <div class="bubble" style="background:${hlColor};border:2px solid ${hlBorder}">
                <div class="bubble-chinese" style="color:#2A2422">${line.c}</div>
                <div class="bubble-jyutping">${colorJyutping(line.j)}</div>
                <div class="bubble-english" style="color:#555">${line.e}</div>
              </div>
            </div>
          </div>`;
      }
    }

    // Normal bubble
    const revealed = cv.bubbleRevealed[i];
    const bdOpen   = cv.breakdownOpen[i];
    const engHtml  = revealed
      ? `<div class="bubble-english" style="margin-top:4px">${line.e}</div>`
      : `<div class="bubble-eng-hint" style="font-size:11px;opacity:0.5;margin-top:4px;font-style:italic">tap to see English</div>`;
    const bdPanel  = (bdOpen && line.bd) ? `
      <div class="breakdown-panel">
        ${line.bd.map(w => `
          <div class="breakdown-row">
            <span class="breakdown-zh">${w.c}</span>
            <span class="breakdown-jp">${colorJyutping(w.j)}</span>
            <span class="breakdown-en">${w.e}</span>
          </div>`).join('')}
      </div>` : '';
    const bdBtnColor = isUser ? 'rgba(255,255,255,0.7)' : color;
    const bdBtn = line.bd ? `
      <button class="breakdown-btn" data-breakdown="${i}" style="color:${bdBtnColor}">
        ${bdOpen ? '▲ hide breakdown' : '🔍 word breakdown'}
      </button>` : '';
    return `
      <div class="bubble-row ${side}">
        <div class="bubble-wrap">
          <div class="bubble-name">${spkName}</div>
          <div class="bubble" data-reveal="${i}" style="cursor:pointer;background:${bubbleBg};${playing?'box-shadow:0 0 0 3px '+color+'66':''}">
            <div class="bubble-chinese" style="${isUser?'color:#fff':''}">${line.c}</div>
            <div class="bubble-jyutping">${colorJyutping(line.j)}</div>
            ${engHtml}
            <div class="bubble-play-row">
              ${bdBtn}
              <button class="bubble-play" data-bubble="${i}"
                style="border-color:${playColor};color:${playing?(isUser?color:THEME.bubbleBg):playColor};background:${playing?playColor:'transparent'}">
                ${playing ? icon('volume',20) : iconPlay(18)}
              </button>
            </div>
          </div>
          ${bdPanel}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="convo-scenario">📍 ${convo.title}</div>
    ${controls}
    ${bubbles}`;
}

function renderSentences(topic, color) {
  const sentences = getRoundSentences(topic, state.currentRound);
  if (!sentences.length) return '';
  const items = sentences.map((s, i) => {
    const speaking = state.speaking === 'sent-' + i;
    const bdOpen = state.sentenceBreakdownOpen[i];
    const revealed = state.sentenceRevealed[i];
    // Note is OPEN by default; state tracks only the explicit-close.
    const noteClosed = state.sentenceNoteClosed[i];
    const hasNote = !!s.note;

    const bdPanel = (bdOpen && s.bd) ? `
      <div class="breakdown-panel" style="margin:8px 0 4px">
        ${s.bd.map(w => `
          <div class="breakdown-row">
            <span class="breakdown-zh">${w.c}</span>
            <span class="breakdown-jp">${colorJyutping(w.j)}</span>
            <span class="breakdown-en">${w.e}</span>
          </div>`).join('')}
      </div>` : '';
    const notePanel = (hasNote && !noteClosed) ? `
      <div class="sentence-note">${s.note}</div>` : '';

    const englishEl = revealed
      ? `<div class="sentence-english">${s.e}</div>`
      : `<div class="sentence-eng-hint">👁 tap to reveal English</div>`;

    const chips = `
      <div class="sentence-chips">
        ${s.bd ? `<button class="s-chip s-chip-bd${bdOpen?' open':''}" data-sent-bd="${i}">
          <span class="s-chip-chev">▸</span>🔍 breakdown</button>` : ''}
        ${hasNote ? `<button class="s-chip s-chip-note${!noteClosed?' open':''}" data-sent-note="${i}">
          <span class="s-chip-chev">▸</span>💡 note</button>` : ''}
      </div>`;

    return `
      <div class="sentence-wrap" style="margin-bottom:10px">
        <div class="sentence-card" style="margin-bottom:0">
          <div class="sentence-body">
            <div class="sentence-chinese">${s.c}</div>
            <div class="sentence-jyutping">${colorJyutping(s.j)}</div>
            <div class="sentence-reveal-line" data-sent-reveal="${i}" style="cursor:pointer">${englishEl}</div>
            ${chips}
          </div>
          <button class="sentence-play${speaking ? ' speaking' : ''}" data-sent="${i}"
            style="border-color:${color};color:${speaking ? THEME.cardInverseText : color};background:${speaking ? color : 'transparent'}"
            title="Listen to sentence">
            ${speaking ? icon('volume',20) : iconPlay(18)}
          </button>
        </div>
        ${notePanel}
        ${bdPanel}
      </div>`;
  }).join('');
  return `
    <div class="sentences">
      <h3>💬 Sentences</h3>
      ${items}
    </div>`;
}

// The Patterns TAB (relocated from the Learn tab). Sentences are the reading
// spine in Learn; patterns are retrieval practice, in their own tab, in context
// with the topic's vocab. Frames the section, then reuses renderTopicPatterns.
function renderTopicPatternsTab(color) {
  const body = renderTopicPatterns(state.topic, color);
  if (!body) {
    return `<p style="color:#aaa;padding:20px 0">No patterns for this topic yet.</p>`;
  }
  return `
    <div class="patterns-tab-intro">
      Patterns are <b>practice</b> — reusable sentence frames built from this topic's words.
      Read the example sentences in <b>Learn</b>, then drill the structure here.
    </div>
    ${body}`;
}

// The "Patterns with these words" section. Used by the Patterns tab. Only renders
// if the topic has associated patterns — a topic with none shows nothing.
function renderTopicPatterns(topicKey, color) {
  const items = getTopicDrills(topicKey);
  if (!items.length) return '';

  // Group the topic's drills by their parent pattern, preserving first-seen order.
  // After consolidation a pattern (esp. a Tier-2 cluster) can own several of a
  // topic's drills, so one card shows the pattern's note once + each drill as a
  // stacked worked-example. A cross-topic frame usually contributes one.
  const groups = [];
  const seen = new Map();
  items.forEach(({ pattern, drill }) => {
    let g = seen.get(pattern);
    if (!g) { g = { pattern, drills: [] }; seen.set(pattern, g); groups.push(g); }
    g.drills.push(drill);
  });

  const cards = groups.map((g, gi) => {
    const p = g.pattern;

    // Each drill within the card gets its own stable key so reveal/play/breakdown
    // state is independent per worked-example.
    const worked = g.drills.map((d, di) => {
      const exC = d.frameC.replace('▢', d.answer.c);
      const exJ = d.frameJ.replace('▢', d.answer.j);
      const key = 'tp-' + topicKey + '-' + gi + '-' + di;
      const speaking = state.speaking === key;
      const revealed = state.patternRevealed[key];
      const bdOpen   = state.patternBreakdownOpen[key];

      const frameOnlyC = d.frameC.replace('▢', '').replace(/\s+/g, ' ').trim();
      const frameOnlyJ = d.frameJ.replace('▢', '').replace(/\s+/g, ' ').trim();
      const bdPanel = bdOpen ? `
        <div class="tp-bd-panel">
          <div class="tp-bd-piece">
            <div class="tp-bd-label">Frame</div>
            <div class="tp-bd-zh">${frameOnlyC}</div>
            <div class="tp-bd-jp">${colorJyutping(frameOnlyJ)}</div>
            <div class="tp-bd-en">${d.frameE}</div>
          </div>
          <div class="tp-bd-piece">
            <div class="tp-bd-label">Fills the blank</div>
            <div class="tp-bd-zh">${d.answer.c}</div>
            <div class="tp-bd-jp">${colorJyutping(d.answer.j)}</div>
            <div class="tp-bd-en">${d.answer.e}</div>
          </div>
        </div>` : '';

      const englishEl = revealed
        ? `<div class="sentence-english">${d.english}</div>`
        : `<div class="sentence-eng-hint" style="font-size:11px;color:#aaa;font-style:italic;margin-top:2px;pointer-events:none">tap to see English</div>`;

      return `
        <div class="tp-ex${di > 0 ? ' tp-ex-sep' : ''}">
          <div class="tp-worked">
            <div class="tp-card-main" data-pat-card-reveal="${key}">
              <div class="sentence-chinese">${exC}</div>
              <div class="sentence-jyutping">${colorJyutping(exJ)}</div>
              ${englishEl}
            </div>
            <button class="sentence-play${speaking ? ' speaking' : ''}" data-pat-card-play="${key}" data-pat-card-c="${exC}"
              style="border-color:${color};color:${speaking ? THEME.cardInverseText : color};background:${speaking ? color : 'transparent'}"
              title="Listen to example">
              ${speaking ? icon('volume',20) : iconPlay(18)}
            </button>
          </div>
          <button class="breakdown-btn" data-pat-card-bd="${key}" style="color:${color};margin-top:6px">
            ${bdOpen ? '▲ hide breakdown' : '🔍 word breakdown'}
          </button>
          ${bdPanel}
        </div>`;
    }).join('');

    return `
      <div class="topic-pattern-card" style="border-left-color:${color}">
        <div class="tp-head-band">
          <div class="tp-head-label" style="color:${color}">${p.label}</div>
          <div class="tp-head-struct">${colorJyutping(p.structure)}</div>
        </div>
        <div class="tp-body">
          <div class="tp-note">${p.note}</div>
          ${worked}
        </div>
      </div>`;
  }).join('');

  // The drill button — all topic patterns here are drillable by definition.
  const drillBtn = `
    <button class="topic-drill-btn" id="topic-drill-start" style="background:${color}">
      <span class="icon-label">${icon('quiz',15)} Drill ${items.length} pattern${items.length===1?'':'s'}</span>
    </button>`;

  return `
    <div class="topic-patterns">
      <h3>🔨 Patterns with these words</h3>
      ${cards}
      ${drillBtn}
    </div>`;
}

function renderStudy(lesson, color) {
  const words = getRoundWords(state.topic, state.currentRound);
  const cards = words.map((w, i) => {
    const flipped = state.flipped[i];
    const speaking = state.speaking === i;
    const cardBg  = flipped ? color : THEME.cardSurface;
    const cardShadow = flipped ? `0 4px 20px ${color}44` : '0 2px 6px rgba(0,0,0,0.06)';
    // Speak button: when playing, it fills with `color` so the icon must be light to stay visible.
    // When idle, it's a transparent button so the icon takes the topic colour.
    const btnBg     = speaking ? color : 'transparent';
    const btnBorder = flipped ? 'rgba(255,255,255,0.6)' : color;
    const btnColor  = speaking ? THEME.cardInverseText : (flipped ? THEME.cardInverseText : color);
    const inner = flipped
      ? `<div class="card-english">${w.e}</div>`
      : `<div class="card-study-inner">
           <div class="card-chinese">${w.c}</div>
           <div class="card-jyutping">${colorJyutping(w.j)}</div>
           <div class="card-hint">tap to reveal</div>
         </div>`;
    return `
      <div class="word-card${flipped?' flipped':''}" data-card="${i}"
        style="background:${cardBg};border-color:${color};box-shadow:${cardShadow}">
        ${inner}
        <button class="speak-btn${speaking?' speaking':''}" data-speak="${i}"
          style="background:${btnBg};border:1.5px solid ${btnBorder};color:${btnColor}" title="Listen">
          ${speaking ? icon('volume',18) : iconPlay(16)}
        </button>
      </div>`;
  }).join('');

  const toneRows = Object.entries(TONES).map(([t,d]) =>
    `<div class="tone-row">
      <span class="tone-dot" style="background:${d.color}"></span>
      <span class="tone-desc">${t} — ${d.desc}</span>
      <span class="tone-ex" style="color:${d.color}">${d.ex}</span>
    </div>`
  ).join('');

  return `
    <div class="hint">Tap a card to reveal English · ${iconPlay(11)} to hear pronunciation</div>
    ${(() => {
      const note = getRoundNote(state.topic, state.currentRound);
      return note
        ? `<div class="lesson-note" style="border-left-color:${color}">
             <div class="lesson-note-title" style="color:${color}">📌 About this lesson</div>
             <div class="lesson-note-body">${note}</div>
           </div>`
        : '';
    })()}
    <div class="word-grid">${cards}</div>
    ${renderSentences(state.topic, color)}
    <div class="tone-guide">
      <h3>📖 Jyutping Tone Guide</h3>
      <div class="tone-grid">${toneRows}</div>
      <p class="tone-note">The number at the end of each syllable tells you which tone to use. Colours match throughout the app.</p>
    </div>`;
}

function renderQuiz(lesson, color) {
  const q = state.quiz;
  if (!q) return '';

  if (q.done) {
    const pct = q.score / q.queue.length;
    const emoji = pct >= 0.75 ? '🏆' : pct >= 0.5 ? '⭐' : '💪';
    const msg   = pct >= 0.75 ? "Excellent! You're a natural!" : pct >= 0.5 ? "Good effort! Keep practising." : "Keep going — practice makes perfect!";

    // Build the missed-word review list (only when there were misses).
    // Direction-aware: "You chose" shows English or Chinese depending on what the choice buttons displayed.
    // w.chosen is the actual option object that was picked (not a string), so no lookup is needed.
    const reviewList = q.wrongAnswers.length
      ? `<div class="quiz-review-wrap">
          <div class="quiz-review-title">Words to review (${q.wrongAnswers.length})</div>
          ${q.wrongAnswers.map(w => {
            const chosenLabel = w.chosen
              ? (q.direction === 'en-zh' ? w.chosen.c : w.chosen.e)
              : '—';
            return `
            <div class="quiz-review-item">
              <button class="quiz-review-play" data-quiz-review-play="${w.word.c}" style="border-color:${color};color:${color}" aria-label="Listen">${iconPlay(15)}</button>
              <div class="quiz-review-body">
                <div class="quiz-review-chinese">${w.word.c}</div>
                <div class="quiz-review-jp">${colorJyutping(w.word.j)}</div>
                <div class="quiz-review-en"><span style="color:#27AE60">${w.word.e}</span></div>
                <div class="quiz-review-chose">You chose: <span style="color:#E74C3C">${chosenLabel}</span></div>
              </div>
            </div>`;
          }).join('')}
          <button class="quiz-retry-btn" id="quiz-retry-missed" style="background:${color}"><span class="icon-label">${icon('refresh',15)} Retry missed words</span></button>
        </div>`
      : '';

    return `
      <div class="result">
        <div class="result-emoji">${emoji}</div>
        <div class="result-score" style="color:${color}">${q.score} / ${q.queue.length} correct</div>
        <div class="result-msg">${msg}</div>
        <button class="back-btn" id="quiz-back" style="background:${color}"><span class="icon-label">${icon('arrowLeft',15)} Back to Lesson</span></button>
        ${reviewList}
      </div>`;
  }

  const cw = q.queue[q.idx];

  // Shared quiz UI (toggle, prompt, choices, progress, wrong panel).
  const core = renderQuizCore({
    word:       cw,
    choices:    q.choices,
    selected:   q.selected,
    direction:  q.direction,
    color:      color,
    idx:        q.idx,
    total:      q.queue.length,
    ariaLabel:  'Quiz direction',
    dirAttr:    'data-quiz-dir',
    choiceAttr: 'data-choice',
    listenId:   'quiz-listen',
    replayId:   'quiz-replay',
    nextId:     'quiz-next',
  });

  return `
    <div class="quiz-meta">
      <span style="color:#888">Question ${q.idx+1} / ${q.queue.length}</span>
      <span style="color:${color};font-weight:700">Score: ${q.score}</span>
    </div>
    ${core.progressBar}
    ${core.dirToggle}
    ${core.promptCard}
    ${core.choiceGrid}
    ${core.answerPanel}`;
}

// ── Events ────────────────────────────────────────────────────────────────────
function attachEvents(lesson, color) {
  // Hamburger open — pushes history so the BACK button closes the drawer first
  const hamburger = document.getElementById('hamburger-btn');
  if (hamburger) hamburger.addEventListener('click', () => { state.drawerOpen = true; pushNav(); render(); });

  // Header info ⓘ toggle — expands/collapses tone legend + speed settings
  const headerInfo = document.getElementById('header-info-toggle');
  if (headerInfo) headerInfo.addEventListener('click', () => { state.headerDetailsOpen = !state.headerDetailsOpen; render(); });

  // Voice banner dismiss
  const vbd = document.getElementById('voice-banner-dismiss');
  if (vbd) vbd.addEventListener('click', () => { state.voiceBannerDismissed = true; render(); });

  // Drawer close (X button and backdrop). The drawer-open pushed a history entry,
  // so closing steps back through history — keeping the stack consistent and
  // letting the popstate handler perform the actual close.
  const navClose    = document.getElementById('nav-close');
  const navBackdrop = document.getElementById('nav-backdrop');
  if (navClose)    navClose.addEventListener('click',    () => { closeDrawer(); });
  if (navBackdrop) navBackdrop.addEventListener('click', () => { closeDrawer(); });

  // Nav items
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      // Leaving via the menu must exit any open checkpoint or drill session first.
      // render() checks state.checkpoint/patternDrill BEFORE state.nav, so without
      // this the chosen destination never shows — the checkpoint hub just redraws.
      state.checkpoint = null;
      state.checkpointAct = null;
      state.checkpointQuiz = null;
      state.patternDrill = null;
      // Tapping Topics from the drawer always returns to home view
      if (target === 'topics') state.homeView = true;
      // Tapping Learning Path from the drawer always returns to the path list
      if (target === 'path') state.pathView = 'list';
      // Entering Review opens the hub (landing), never a stale session
      if (target === 'review') {
        state.reviewView = 'hub';
        state.wordReview = null;
        state.patternReview = null;
        refreshReviewBadge().then(render);
      }
      // Entering Patterns always starts with the library all-collapsed
      if (target === 'patterns') {
        state.patternGroupsOpen = {};
        state.patternFramesOpen = {};
      }
      state.nav = target;
      state.fromPath = false;          // any drawer navigation clears the path-return flag
      state.fromPathTier = null;
      state.drawerOpen = false;
      // Navigated from the (open) drawer: overwrite the drawer-open history entry
      // with this destination, so BACK goes to the pre-drawer screen, not the drawer.
      navReplace();
      render();
    });
  });

  // Review hub cards → open a sub-view (Words / Patterns). Pushes a history entry
  // so BACK returns to the hub.
  document.querySelectorAll('[data-review-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.reviewView = btn.dataset.reviewGo;
      state.wordReview = null;
      state.patternReview = null;
      pushNav();
      window.scrollTo(0, 0);
      refreshReviewBadge().then(render);
    });
  });

  // Menu sub-list (Words / Patterns under Review) → deep-link straight to a sub-view.
  document.querySelectorAll('[data-review-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.nav = 'review';
      state.reviewView = btn.dataset.reviewSub;
      state.wordReview = null;
      state.patternReview = null;
      state.checkpoint = null; state.checkpointAct = null;
      state.checkpointQuiz = null; state.patternDrill = null;
      state.fromPath = false; state.fromPathTier = null;
      state.drawerOpen = false;
      navReplace();
      window.scrollTo(0, 0);
      refreshReviewBadge().then(render);
    });
  });
  document.querySelectorAll('[data-cat-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.nav = 'topics';
      state.homeView = true;
      state.selectedCategory = btn.dataset.catJump;
      state.fromPath = false;
      state.fromPathTier = null;
      state.drawerOpen = false;
      navReplace();              // see nav-items above — replace the drawer entry
      window.scrollTo(0, 0);
      render();
    });
  });

  // ── Translate events ──────────────────────────────────────────
  // API key save
  const apikeySave = document.getElementById('apikey-save');
  if (apikeySave) apikeySave.addEventListener('click', () => {
    const input = document.getElementById('apikey-input');
    const key = (input?.value || '').trim();
    if (!key) {
      state.translate.error = 'Please paste your API key first';
      render();
      return;
    }
    setApiKey(key);
    state.translate.error = null;
    render();
  });

  // Show/hide API key toggle
  const apikeyToggle = document.getElementById('apikey-toggle');
  if (apikeyToggle) apikeyToggle.addEventListener('click', () => {
    state.translate.showApiKey = !state.translate.showApiKey;
    render();
  });

  // Reset API key
  const apikeyReset = document.getElementById('translate-reset-key');
  if (apikeyReset) apikeyReset.addEventListener('click', () => {
    if (confirm('Remove your saved API key? You\'ll need to re-enter it to translate.')) {
      storage.clearApiKey();
      state.translate.result = null;
      state.translate.error = null;
      state.translate.inputText = '';
      render();
    }
  });

  // Direction swap (en-yue ↔ yue-en)
  const trSwap = document.getElementById('translate-swap');
  if (trSwap) trSwap.addEventListener('click', () => {
    stopTranslateListening();
    state.translate.direction = state.translate.direction === 'en-yue' ? 'yue-en' : 'en-yue';
    state.translate.inputText = '';
    state.translate.result    = null;
    state.translate.error     = null;
    state.translate.listening = false;
    render();
  });

  // Mic button — toggles speech input
  const trMic = document.getElementById('translate-mic');
  if (trMic) trMic.addEventListener('click', () => {
    if (state.translate.listening) {
      stopTranslateListening();
    } else {
      startTranslateListening();
    }
  });

  // Translate input — keep state in sync
  const translateInput = document.getElementById('translate-input');
  if (translateInput) {
    translateInput.addEventListener('input', () => {
      state.translate.inputText = translateInput.value;
      // No re-render on every keystroke — would lose focus. Just sync state.
    });
  }

  // Clear input
  const translateClear = document.getElementById('translate-clear');
  if (translateClear) translateClear.addEventListener('click', () => {
    state.translate.inputText = '';
    state.translate.result = null;
    state.translate.error = null;
    render();
  });

  // Translate button
  const translateGo = document.getElementById('translate-go');
  if (translateGo) translateGo.addEventListener('click', async () => {
    const input = document.getElementById('translate-input');
    const text = (input?.value || '').trim();
    if (!text) return;
    state.translate.inputText = text;
    state.translate.loading = true;
    state.translate.error   = null;
    state.translate.result  = null;
    render();
    try {
      const result = await translateText(text, state.translate.direction);
      state.translate.result  = result;
      state.translate.loading = false;
      render();
    } catch (err) {
      state.translate.loading = false;
      state.translate.error   = err.message || 'Translation failed';
      render();
    }
  });

  // Listen button on translation result
  const translateListen = document.getElementById('translate-listen');
  if (translateListen) translateListen.addEventListener('click', () => {
    const text = translateListen.dataset.trText;
    state.speaking = 'translate-result';
    render();
    speak(text, () => { state.speaking = null; render(); });
    setTimeout(() => { if (state.speaking === 'translate-result') { state.speaking = null; render(); } }, 6000);
  });

  // Pattern example play buttons
  document.querySelectorAll('[data-pex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key     = btn.dataset.pex;
      const chinese = btn.dataset.pexChinese;
      state.speaking = key;
      render();
      speak(chinese, () => { state.speaking = null; render(); });
      setTimeout(() => { if (state.speaking === key) { state.speaking = null; render(); } }, 5000);
    });
  });

  // ── Patterns library (Stage 4): grouped accordion toggles ──
  document.querySelectorAll('[data-group-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.groupToggle;
      state.patternGroupsOpen[name] = !state.patternGroupsOpen[name];
      render();
    });
  });
  document.querySelectorAll('[data-frame-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.frameToggle;
      state.patternFramesOpen[k] = !state.patternFramesOpen[k];
      render();
    });
  });

  // Landing: start a drill (Patterns-page drill — all drillable patterns)
  const drillStart = document.getElementById('drill-start');
  if (drillStart) drillStart.addEventListener('click', () => startPatternDrill());

  // Topic Learn-tab: "Drill N patterns" — scoped to the current topic
  const topicDrillStart = document.getElementById('topic-drill-start');
  if (topicDrillStart) topicDrillStart.addEventListener('click', () => startPatternDrill(state.topic));

  // Learn-tab pattern cards: reveal English, play example, toggle breakdown
  document.querySelectorAll('[data-pat-card-reveal]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.patCardReveal;
      state.patternRevealed[key] = !state.patternRevealed[key];
      render();
    });
  });
  document.querySelectorAll('[data-pat-card-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.patCardPlay;
      const chinese = btn.dataset.patCardC;
      state.speaking = key;
      render();
      speak(chinese, () => { state.speaking = null; render(); });
      setTimeout(() => { if (state.speaking === key) { state.speaking = null; render(); } }, 5000);
    });
  });
  document.querySelectorAll('[data-pat-card-bd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.patCardBd;
      state.patternBreakdownOpen[key] = !state.patternBreakdownOpen[key];
      render();
    });
  });

  // Topic drill view: back to the topic (routed through history, like other backs)
  const topicDrillBack = document.getElementById('topic-drill-back');
  if (topicDrillBack) topicDrillBack.addEventListener('click', () => {
    if (_navReady) { history.back(); return; }
    state.patternDrill = null;
    render();
  });

  // Done screen: drill again (re-run the SAME scope), or exit
  const drillAgain = document.getElementById('drill-again');
  if (drillAgain) drillAgain.addEventListener('click', () => {
    // Preserve topic scope: a topic drill re-drills that topic, not all patterns.
    const scope = state.patternDrill && state.patternDrill.topicKey;
    startPatternDrill(scope || undefined);
  });
  const drillExit = document.getElementById('drill-exit');
  if (drillExit) drillExit.addEventListener('click', () => {
    // history.back() pops the drill-session entry; popstate clears state.patternDrill.
    if (_navReady) { history.back(); return; }
    state.patternDrill = null;
    render();
  });

  // Active drill question
  if (state.patternDrill && !state.patternDrill.done) {
    const pd = state.patternDrill;
    const d = pd.queue[pd.idx].drill;
    // The full assembled sentence — frame with the blank replaced by the answer.
    const fullSentence = d.frameC.replace('▢', d.answer.c);

    // Listen button (only present after answering) — plays the complete sentence
    const dListen = document.getElementById('drill-listen');
    if (dListen) dListen.addEventListener('click', () => speak(fullSentence));

    // Choice buttons
    document.querySelectorAll('[data-drill-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (pd.selected !== null && pd.selected !== undefined) return;
        const idx = parseInt(btn.dataset.drillChoice, 10);
        const chosenOpt = pd.choices[idx];
        const correct = chosenOpt === d.answer;     // object identity
        pd.selected = idx;
        if (correct) pd.score++;
        else if (pd.scopeKind === 'checkpoint') pd.missed.push(pd.queue[pd.idx]);  // for diagnostic
        else if (pd.scopeKind === 'topic') {
          // A missed pattern in a topic drill goes to the Pattern Review bin.
          addPatternMiss(pd.queue[pd.idx].drill.did).then(refreshReviewBadge);
        }
        // Play the full assembled sentence so the learner hears the result.
        speak(fullSentence);
        render();
        // Stop-and-confirm: both correct and wrong wait for the Next tap.
      });
    });

    // Answer-panel buttons (present once answered, correct or wrong)
    const dReplay = document.getElementById('drill-replay');
    if (dReplay) dReplay.addEventListener('click', () => speak(fullSentence));
    const dNext = document.getElementById('drill-next');
    if (dNext) dNext.addEventListener('click', () => advancePatternDrill());
  }

  // Speed toggle
  ['slow','normal','fast'].forEach(s => {
    const btn = document.getElementById('speed-' + s);
    if (btn) btn.addEventListener('click', () => { state.speed = s; render(); });
  });
  // Drawer speed toggle (Settings section)
  document.querySelectorAll('[data-drawer-speed]').forEach(btn => {
    btn.addEventListener('click', () => { state.speed = btn.dataset.drawerSpeed; render(); });
  });

  // Topic buttons (legacy pill bar — still works if shown elsewhere)
  document.querySelectorAll('[data-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.topic   = btn.dataset.topic;
      state.mode    = 'study';
      state.tab     = 'words';
      state.flipped = {};
      state.speaking= null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      state.patternRevealed = {};
      state.convo   = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      render();
    });
  });

  // Topic cards (home screen) — enter the topic
  document.querySelectorAll('[data-topic-card]').forEach(card => {
    card.addEventListener('click', () => {
      state.topic        = card.dataset.topicCard;
      state.homeView     = false;
      state.currentRound = 1;
      state.mode         = 'study';
      state.tab          = 'words';
      state.flipped      = {};
      state.speaking     = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      state.patternRevealed = {};
      state.convo        = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      pushNav();                 // home → topic: BACK returns to home
      window.scrollTo(0, 0);
      render();
    });
  });
  // Back to home button. Routed through history.back() so the on-screen back
  // button and the phone/browser BACK button behave identically — both pop the
  // same history entry, and the popstate handler restores the previous screen.
  const backHomeBtn = document.getElementById('back-home-btn');
  if (backHomeBtn) backHomeBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    if (_navReady) { history.back(); return; }
    // Fallback if history isn't available — replicate the original logic.
    if (state.fromPath) {
      state.nav = 'path'; state.pathView = 'timeline';
      state.fromPath = false; state.fromPathTier = null;
      state.mode = 'study'; state.tab = 'words';
    } else {
      state.homeView = true; state.mode = 'study'; state.tab = 'words';
    }
    window.scrollTo(0, 0);
    render();
  });

  // Category filter dropdown
  const catSelect = document.getElementById('cat-filter-select');
  if (catSelect) catSelect.addEventListener('change', () => {
    state.selectedCategory = catSelect.value;
    window.scrollTo(0, 0);
    render();
  });

  // Round selector inside topic
  document.querySelectorAll('[data-round]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = parseInt(btn.dataset.round);
      if (r === state.currentRound) return;
      state.currentRound = r;
      // Reset transient state for new round
      state.flipped  = {};
      state.speaking = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      state.patternRevealed = {};
      state.convo = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      window.scrollTo(0, 0);
      render();
    });
  });

  // Sub-tabs
  const tabWords = document.getElementById('tab-words');
  const tabConvo = document.getElementById('tab-convo');
  const tabQuiz  = document.getElementById('tab-quiz');
  if (tabWords) tabWords.addEventListener('click', () => {
    state.mode = 'study'; state.tab = 'words'; render();
  });
  if (tabConvo) tabConvo.addEventListener('click', () => {
    state.mode = 'study'; state.tab = 'convo'; render();
  });
  const tabPatterns = document.getElementById('tab-patterns');
  if (tabPatterns) tabPatterns.addEventListener('click', () => {
    state.mode = 'study'; state.tab = 'patterns'; render();
  });
  if (tabQuiz) tabQuiz.addEventListener('click', () => {
    if (state.mode !== 'quiz') {
      state.mode = 'quiz';
      state.quiz = getQuizInitState(getRoundWords(state.topic, state.currentRound));
    }
    render();
  });

  // Conversation: Play All / Stop
  const playAllBtn = document.getElementById('play-all-btn');
  if (playAllBtn) playAllBtn.addEventListener('click', () => {
    if (state.convo.playingLine !== null) {
      window.speechSynthesis.cancel();
      state.convo.playingLine = null;
      render();
    } else {
      const lines = activeConvoSource().lines;
      playAllConvo(lines, 0);
    }
  });

  // Conversation: Gap mode toggle
  const gapBtn = document.getElementById('gap-mode-btn');
  if (gapBtn) gapBtn.addEventListener('click', () => {
    state.convo.convMode   = state.convo.convMode === 'gap' ? 'read' : 'gap';
    state.convo.gapAnswers = {};
    state.convo.breakdownOpen = {};
    render();
  });

  // Conversation: Speak mode toggle
  const speakBtn = document.getElementById('speak-mode-btn');
  if (speakBtn) speakBtn.addEventListener('click', () => {
    stopListening();
    window.speechSynthesis.cancel();
    state.convo.convMode    = state.convo.convMode === 'speak' ? 'read' : 'speak';
    state.convo.speakStep   = 0;
    state.convo.speakStatus = 'idle';
    state.convo.speakHeard  = '';
    state.convo.playingLine = null;
    render();
  });

  // Speak: mic button — toggles start/stop
  const micBtn = document.getElementById('mic-btn');
  if (micBtn) micBtn.addEventListener('click', () => {
    if (state.convo.speakStatus === 'listening') {
      finishListening();   // gracefully stop and process
    } else {
      startListening();
    }
  });

  // Speak: dedicated stop button
  const speakStopBtn = document.getElementById('speak-stop-btn');
  if (speakStopBtn) speakStopBtn.addEventListener('click', () => {
    finishListening();
  });

  // Speak: listen button (other speaker's turn)
  const speakListenBtn = document.getElementById('speak-listen-btn');
  if (speakListenBtn) speakListenBtn.addEventListener('click', () => {
    const line = activeConvoSource().lines[state.convo.speakStep];
    state.convo.playingLine = state.convo.speakStep;
    render();
    speakAs(line.c, line.u, () => { state.convo.playingLine = null; render(); });
  });

  // Speak: next button
  const speakNext = document.getElementById('speak-next');
  if (speakNext) speakNext.addEventListener('click', () => {
    const lines = activeConvoSource().lines;
    stopListening();
    window.speechSynthesis.cancel();
    state.convo.playingLine = null;
    state.convo.speakStatus = 'idle';
    state.convo.speakHeard  = '';
    if (state.convo.speakStep >= lines.length - 1) {
      state.convo.speakStep = 0;
    } else {
      state.convo.speakStep++;
    }
    render();
  });

  // Speak: retry button
  const speakRetry = document.getElementById('speak-retry');
  if (speakRetry) speakRetry.addEventListener('click', () => {
    state.convo.speakStatus = 'idle';
    state.convo.speakHeard  = '';
    render();
  });

  // Speak: skip button
  const speakSkip = document.getElementById('speak-skip');
  if (speakSkip) speakSkip.addEventListener('click', () => {
    const lines = activeConvoSource().lines;
    state.convo.speakStatus = 'idle';
    state.convo.speakHeard  = '';
    if (state.convo.speakStep >= lines.length - 1) {
      state.convo.speakStep = 0;
    } else {
      state.convo.speakStep++;
    }
    render();
  });

  // Breakdown toggle
  document.querySelectorAll('[data-breakdown]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.breakdown);
      state.convo.breakdownOpen[i] = !state.convo.breakdownOpen[i];
      render();
    });
  });

  // Bubble English reveal (tap bubble)
  document.querySelectorAll('[data-reveal]').forEach(bubble => {
    bubble.addEventListener('click', e => {
      if (e.target.closest('[data-bubble]')) return; // don't fire when tapping play btn
      const i = parseInt(bubble.dataset.reveal);
      state.convo.bubbleRevealed[i] = !state.convo.bubbleRevealed[i];
      render();
    });
  });

  // Bubble play buttons
  document.querySelectorAll('[data-bubble]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.bubble);
      const line = activeConvoSource().lines[i];
      state.convo.playingLine = i;
      render();
      speakAs(line.c, line.u, () => { state.convo.playingLine = null; render(); });
      setTimeout(() => { if (state.convo.playingLine === i) { state.convo.playingLine = null; render(); } }, 6000);
    });
  });

  // Gap mode answer buttons
  document.querySelectorAll('[data-gap-line]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lineIdx = parseInt(btn.dataset.gapLine);
      const chosen  = btn.dataset.gapAns;
      state.convo.gapAnswers[lineIdx] = chosen;
      const correct = chosen === activeConvoSource().lines[lineIdx].c;
      if (correct) speak(chosen);
      render();
    });
  });

  // Mode toggle
  // Flip cards
  document.querySelectorAll('[data-card]').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('[data-speak]')) return;
      const i = parseInt(card.dataset.card);
      state.flipped[i] = !state.flipped[i];
      render();
    });
  });

  // Speak buttons
  document.querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.speak);
      const word = getRoundWords(state.topic, state.currentRound)[i];
      if (!word) return;
      state.speaking = i;
      render();
      speak(word.c, () => { state.speaking = null; render(); });
      setTimeout(() => { if (state.speaking === i) { state.speaking = null; render(); } }, 4000);
    });
  });

  // Sentence play buttons
  document.querySelectorAll('[data-sent]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.sent);
      const sentence = getRoundSentences(state.topic, state.currentRound)[i];
      state.speaking = 'sent-' + i;
      render();
      speak(sentence.c, () => { state.speaking = null; render(); });
      setTimeout(() => { if (state.speaking === 'sent-' + i) { state.speaking = null; render(); } }, 6000);
    });
  });

  // Sentence breakdown toggle
  document.querySelectorAll('[data-sent-bd]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.sentBd);
      state.sentenceBreakdownOpen[i] = !state.sentenceBreakdownOpen[i];
      render();
    });
  });

  // Per-sentence note toggle (open by default; this flips the explicit-close flag)
  document.querySelectorAll('[data-sent-note]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.sentNote);
      state.sentenceNoteClosed[i] = !state.sentenceNoteClosed[i];
      render();
    });
  });

  // Sentence English reveal — whole card clickable, toggles, skips play & breakdown buttons
  document.querySelectorAll('[data-sent-reveal]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-sent]') || e.target.closest('[data-sent-bd]') || e.target.closest('[data-sent-note]')) return;
      const i = parseInt(el.dataset.sentReveal);
      state.sentenceRevealed[i] = !state.sentenceRevealed[i];
      render();
    });
  });

  // Pattern example English reveal
  document.querySelectorAll('[data-pat-reveal]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const key = el.dataset.patReveal;
      state.patternRevealed[key] = true;
      render();
    });
  });

  // Speak target English reveal
  document.querySelectorAll('[data-speak-reveal]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(el.dataset.speakReveal);
      state.convo.speakRevealed[i] = true;
      render();
    });
  });

  // Quiz listen
  const ql = document.getElementById('quiz-listen');
  if (ql && state.quiz) {
    ql.addEventListener('click', () => speak(state.quiz.queue[state.quiz.idx].c));
  }

  // Quiz choices
  if (state.quiz && !state.quiz.done) {
    document.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.quiz.selected !== null && state.quiz.selected !== undefined) return;
        const idx = parseInt(btn.dataset.choice, 10);
        const chosenOpt = state.quiz.choices[idx];
        const cw = state.quiz.queue[state.quiz.idx];
        const correct = chosenOpt === cw;          // object identity, not string
        speak(cw.c);
        state.quiz.selected = idx;
        if (correct) {
          state.quiz.score++;
        } else {
          state.quiz.wrongAnswers.push({ word: cw, chosen: chosenOpt });
          // Capture into the cross-topic Word Review bin, then refresh the menu
          // badge so its count is current even before the user opens Word Review.
          // refreshReviewBadge re-reads the true entry count from storage, so a
          // re-missed (already-binned) word correctly leaves the count unchanged.
          addMiss(cw.id, state.topic, state.currentRound, cw.c)
            .then(refreshReviewBadge)
            .then(render);
        }
        render();
        // Both correct and wrong now STOP and wait for a Next tap — no
        // auto-advance. The answer panel (correct line / wrong panel) carries
        // the Next button; its handler is wired below.
      });
    });
  }

  // "Got it — next" button shown after wrong answers
  const qNext = document.getElementById('quiz-next');
  if (qNext) qNext.addEventListener('click', () => advanceQuiz());

  // Direction toggle — switching direction restarts the quiz from a clean state
  // (avoids confusion of half-quiz with mixed prompt types).
  document.querySelectorAll('[data-quiz-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newDir = btn.dataset.quizDir;
      if (state.quiz && state.quiz.direction === newDir) return;
      saveQuizDirection(newDir);
      // Reset the quiz with the new direction
      const words = getRoundWords(state.topic, state.currentRound);
      state.quiz = getQuizInitState(words);
      state.quiz.direction = newDir;   // override default from storage in case race
      state.quiz._listenAutoPlayed = null;
      render();
    });
  });

  // Listen mode: auto-play the audio on each new question (once, not on re-renders).
  // Longer delay so the previous question's feedback audio (the answer playback after
  // a correct/wrong tap) has time to finish before the new question starts.
  if (state.quiz && !state.quiz.done && state.quiz.direction === 'listen-en') {
    if (state.quiz._listenAutoPlayed !== state.quiz.idx) {
      state.quiz._listenAutoPlayed = state.quiz.idx;
      setTimeout(() => {
        if (state.quiz && !state.quiz.done && state.quiz.direction === 'listen-en' &&
            state.quiz._listenAutoPlayed === state.quiz.idx) {
          // Explicit cancel before speaking so there's no overlap with prior audio
          try { window.speechSynthesis.cancel(); } catch(e) {}
          speak(state.quiz.queue[state.quiz.idx].c);
        }
      }, 900);
    }
  }

  // Replay-correct button on the wrong-answer pause panel
  const qReplay = document.getElementById('quiz-replay');
  if (qReplay && state.quiz) {
    qReplay.addEventListener('click', () => speak(state.quiz.queue[state.quiz.idx].c));
  }

  // ── Word Review session handlers ──
  // Landing: start a session
  const reviewStart = document.getElementById('review-start');
  if (reviewStart) reviewStart.addEventListener('click', () => startWordReview());
  const reviewAgain = document.getElementById('review-again');
  if (reviewAgain) reviewAgain.addEventListener('click', () => startWordReview());
  const reviewExit = document.getElementById('review-exit');
  if (reviewExit) reviewExit.addEventListener('click', () => {
    // history.back() pops the session entry; popstate clears state.wordReview
    // and renders the landing. Falls back to a direct close if history is absent.
    if (_navReady) { history.back(); return; }
    state.wordReview = null;
    refreshReviewBadge().then(render);
  });

  // ── Pattern Review session handlers (mirror Word Review) ──
  const prStart = document.getElementById('pattern-review-start');
  if (prStart) prStart.addEventListener('click', () => startPatternReview());
  const prAgain = document.getElementById('pattern-review-again');
  if (prAgain) prAgain.addEventListener('click', () => startPatternReview());
  const prExit = document.getElementById('pattern-review-exit');
  if (prExit) prExit.addEventListener('click', () => {
    if (_navReady) { history.back(); return; }
    state.patternReview = null;
    refreshReviewBadge().then(render);
  });

  // Active Pattern Review question — reuses the drill card DOM (data-drill-choice,
  // drill-listen/replay/next). Only one of patternDrill/patternReview is ever active,
  // so binding the same selectors here is safe.
  if (state.patternReview && !state.patternReview.done) {
    const pr = state.patternReview;
    const d = pr.queue[pr.idx].drill;
    const fullSentence = d.frameC.replace('▢', d.answer.c);
    const pl = document.getElementById('drill-listen');
    if (pl) pl.addEventListener('click', () => speak(fullSentence));
    document.querySelectorAll('[data-drill-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (pr.selected !== null && pr.selected !== undefined) return;
        const idx = parseInt(btn.dataset.drillChoice, 10);
        const correct = pr.choices[idx] === d.answer;     // object identity
        pr.selected = idx;
        pr.reviewedThisSession++;
        if (correct) pr.score++;
        recordPatternReviewResult(d.did, correct).then(res => {
          if (res.graduated) pr.graduatedThisSession++;
          refreshReviewBadge();
        });
        speak(fullSentence);
        render();
      });
    });
    const prReplay = document.getElementById('drill-replay');
    if (prReplay) prReplay.addEventListener('click', () => speak(fullSentence));
    const prNext = document.getElementById('drill-next');
    if (prNext) prNext.addEventListener('click', () => advancePatternReview());
  }

  // Active review question
  if (state.wordReview && !state.wordReview.done) {
    const wr = state.wordReview;
    const item = wr.queue[wr.idx];

    // Listen button (audio prompt / replay)
    const rListen = document.getElementById('review-listen');
    if (rListen) rListen.addEventListener('click', () => speak(item.word.c));

    // Choice buttons
    document.querySelectorAll('[data-review-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (wr.selected !== null && wr.selected !== undefined) return;
        const idx = parseInt(btn.dataset.reviewChoice, 10);
        const chosenOpt = wr.choices[idx];
        const cw = item.word;
        const correct = chosenOpt === cw;          // object identity, not string
        speak(cw.c);
        wr.selected = idx;
        wr.reviewedThisSession++;
        if (correct) wr.correctThisSession++;
        // Persist the result to the bin. recordReviewResult resolves the graduation;
        // we capture whether this word graduated so the session tally is accurate.
        recordReviewResult(item.entry.wid, item.entry.topicKey, item.entry.round, item.entry.wordC, correct)
          .then(res => {
            if (res.graduated) wr.graduatedThisSession++;
            // Keep the in-memory entry's correctCount in sync so the progress pips
            // are right if the user lingers on the answered card.
            item.entry.correctCount = correct
              ? item.entry.correctCount + 1
              : 0;
            // A graduated word leaves the bin — refresh the badge so the menu
            // count is current even if the user opens the menu mid-session.
            if (res.graduated) return refreshReviewBadge().then(render);
          });
        render();
        // Stop-and-confirm: both correct and wrong wait for the Next tap.
      });
    });

    // "Got it — next" after a wrong answer
    const rNext = document.getElementById('review-next');
    if (rNext) rNext.addEventListener('click', () => advanceWordReview());

    // Replay on the wrong-answer panel
    const rReplay = document.getElementById('review-replay');
    if (rReplay) rReplay.addEventListener('click', () => speak(item.word.c));

    // Direction toggle — switching restarts the session cleanly with the new direction
    document.querySelectorAll('[data-review-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newDir = btn.dataset.reviewDir;
        if (wr.direction === newDir) return;
        saveQuizDirection(newDir);
        wr.direction = newDir;
        wr.selected = null;
        wr._listenAutoPlayed = null;
        render();
      });
    });

    // Listen mode: auto-play audio on each new word (once per index)
    if (wr.direction === 'listen-en') {
      if (wr._listenAutoPlayed !== wr.idx) {
        wr._listenAutoPlayed = wr.idx;
        setTimeout(() => {
          if (state.wordReview && !state.wordReview.done &&
              state.wordReview.direction === 'listen-en' &&
              state.wordReview._listenAutoPlayed === state.wordReview.idx) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
            speak(state.wordReview.queue[state.wordReview.idx].word.c);
          }
        }, 900);
      }
    }
  }

  // End-of-quiz: retry just the missed words
  const qRetry = document.getElementById('quiz-retry-missed');
  if (qRetry) {
    qRetry.addEventListener('click', () => {
      const missed   = state.quiz.wrongAnswers.map(w => w.word);
      const fullPool = getRoundWords(state.topic, state.currentRound);
      // Build a fresh quiz where the queue is just the missed words but the
      // wrong-answer choices are still drawn from the full topic word pool so
      // each question still has 4 options to pick from.
      state.quiz = {
        queue: shuffle(missed),
        idx: 0,
        score: 0,
        selected: null,
        done: false,
        choices: buildChoices(missed[0], fullPool),
        wrongAnswers: [],
      };
      render();
    });
  }

  // End-of-quiz: play a missed word from the review list
  document.querySelectorAll('[data-quiz-review-play]').forEach(btn => {
    btn.addEventListener('click', () => speak(btn.dataset.quizReviewPlay));
  });

  // Quiz back
  const qb = document.getElementById('quiz-back');
  if (qb) qb.addEventListener('click', () => { state.mode = 'study'; render(); });

  // ── Path-mode in-topic handlers ─────────────────────────────────────
  // Mark the current step complete + celebration toast + transition to "Next step" state
  const pathMark = document.getElementById('path-mark-complete');
  if (pathMark) {
    pathMark.addEventListener('click', () => {
      const ctx = getPathContext();
      if (!ctx) return;
      const tier = state.fromPathTier || state.currentRound;
      // Only act if it's not already complete (defensive — the button shouldn't be visible otherwise)
      if (!isLessonComplete(state.activePath, state.topic, tier)) {
        toggleLessonComplete(state.activePath, state.topic, tier);
      }
      state.pathToast = ctx.isLast
        ? { text: '🎉 Path complete!', kind: 'final' }
        : { text: '✓ Step complete!',  kind: 'step'  };
      render();
      // Dissolve the toast after a beat. If it was the final step, also auto-return to the timeline.
      setTimeout(() => {
        state.pathToast = null;
        if (ctx.isLast) {
          state.nav         = 'path';
          state.pathView    = 'timeline';
          state.fromPath    = false;
          state.fromPathTier = null;
          state.mode        = 'study';
          state.tab         = 'words';
          pushNav();               // auto-returned to timeline: record it in history
          window.scrollTo(0, 0);
        }
        render();
      }, 3000);
    });
  }

  // "Next step → Topic" button (visible after a step is complete and there's a next)
  const pathNext = document.getElementById('path-next-step');
  if (pathNext) {
    pathNext.addEventListener('click', () => {
      const ctx = getPathContext();
      if (!ctx || !ctx.nextStep) return;
      window.speechSynthesis.cancel();
      // Checkpoint comes next → open its hub (openCheckpoint self-pushes nav).
      if (ctx.nextStep.kind === 'checkpoint') {
        openCheckpoint(state.activePath, ctx.nextStep.stageId);
        window.scrollTo(0, 0);
        return;
      }
      state.topic        = ctx.nextStep.topic;
      state.currentRound = ctx.nextStep.tier;
      state.fromPathTier = ctx.nextStep.tier;
      state.mode         = 'study';
      state.tab          = 'words';
      state.flipped      = {};
      state.speaking     = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      state.patternRevealed = {};
      state.convo        = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      pushNav();                 // path next-step → next lesson: BACK returns to previous lesson
      window.scrollTo(0, 0);
      render();
    });
  }

  // ── Dashboard events ──────────────────────────────────────────────
  // Hero CTA / card → opens the actual next-up item. Mirrors data-path-lesson's
  // full state reset (so no stale flipped/speaking/sentence state leaks in from
  // wherever the user was before), and openCheckpoint() for the checkpoint case.
  document.querySelectorAll('[data-dash-hero-topic]').forEach(card => {
    card.addEventListener('click', () => {
      const topicKey = card.dataset.dashHeroTopic;
      const tier     = parseInt(card.dataset.dashHeroTier, 10) || 1;
      state.topic        = topicKey;
      state.currentRound = tier;
      state.nav          = 'topics';
      state.homeView     = false;
      state.fromPath      = true;
      state.fromPathTier  = tier;
      state.mode          = 'study';
      state.tab           = 'words';
      state.flipped        = {};
      state.speaking       = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed     = {};
      state.sentenceNoteClosed   = {};
      state.patternRevealed      = {};
      state.convo = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      // Find which path this lesson belongs to so the path-banner / "back to
      // timeline" context is correct if the user backs out of the lesson.
      const owningPath = (store.paths || []).find(p => (p.lessons || []).some(l => l.topic === topicKey && l.round === tier));
      if (owningPath) state.activePath = owningPath.key;
      pushNav();                 // dashboard → lesson: BACK returns to dashboard
      window.scrollTo(0, 0);
      render();
    });
  });
  document.querySelectorAll('[data-dash-hero-cp]').forEach(card => {
    card.addEventListener('click', () => {
      const pathKey = card.dataset.dashHeroCp;
      const stageId = card.dataset.dashHeroStage;
      state.activePath = pathKey;
      openCheckpoint(pathKey, stageId);   // openCheckpoint() itself calls pushNav() + render()
    });
  });

  // Path progress card → open that path's timeline directly
  document.querySelectorAll('[data-dash-path-open]').forEach(card => {
    card.addEventListener('click', () => {
      state.activePath = card.dataset.dashPathOpen;
      state.nav        = 'path';
      state.pathView   = 'timeline';
      pushNav();                 // dashboard → path timeline: BACK returns to dashboard
      window.scrollTo(0, 0);
      render();
    });
  });

  // Word Review pill → straight into the Words review screen
  const dashReviewOpen = document.getElementById('dash-review-open');
  if (dashReviewOpen) {
    dashReviewOpen.addEventListener('click', () => {
      state.nav = 'review';
      state.reviewView = 'words';
      state.wordReview = null;
      state.patternReview = null;
      pushNav();                 // dashboard → review: BACK returns to dashboard
      window.scrollTo(0, 0);
      refreshReviewBadge().then(render);
    });
  }

  // Jump-to tiles
  const dashTileTopics = document.getElementById('dash-tile-topics');
  if (dashTileTopics) {
    dashTileTopics.addEventListener('click', () => {
      state.nav = 'topics';
      state.homeView = true;
      state.fromPath = false;
      state.fromPathTier = null;
      pushNav();                 // dashboard → topics: BACK returns to dashboard
      window.scrollTo(0, 0);
      render();
    });
  }
  const dashTileTranslate = document.getElementById('dash-tile-translate');
  if (dashTileTranslate) {
    dashTileTranslate.addEventListener('click', () => {
      state.nav = 'translate';
      pushNav();                 // dashboard → translate: BACK returns to dashboard
      window.scrollTo(0, 0);
      render();
    });
  }

  // ── Learning Path events ──────────────────────────────────────────
  // Open a path from the list view → switch to that path's timeline
  document.querySelectorAll('[data-path-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activePath = btn.dataset.pathOpen;
      state.pathView   = 'timeline';
      pushNav();                 // path list → timeline: BACK returns to the list
      window.scrollTo(0, 0);
      render();
    });
  });

  // Back from timeline → path list. Routed through history.back() so it matches
  // the phone BACK button (both pop the entry that path-open pushed).
  document.querySelectorAll('[data-path-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_navReady) { history.back(); return; }
      state.pathView = 'list';
      window.scrollTo(0, 0);
      render();
    });
  });

  // Tap a lesson in the timeline → open the topic with fromPath flag
  document.querySelectorAll('[data-path-lesson]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignore taps on the mark-complete button (handled separately)
      if (e.target.closest('[data-path-toggle]')) return;
      const topicKey = card.dataset.pathLesson;
      const tier     = parseInt(card.dataset.pathTier, 10) || 1;
      state.topic        = topicKey;
      state.currentRound = tier;
      state.nav          = 'topics';
      state.homeView     = false;
      state.fromPath     = true;
      state.fromPathTier = tier;
      state.mode         = 'study';
      state.tab          = 'words';
      state.flipped      = {};
      state.speaking     = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      state.patternRevealed = {};
      state.convo        = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      pushNav();                 // path timeline → lesson: BACK returns to timeline
      window.scrollTo(0, 0);
      render();
    });
  });

  // Toggle complete on a timeline lesson (without navigating)
  document.querySelectorAll('[data-path-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tier = parseInt(btn.dataset.pathTier, 10) || 1;
      toggleLessonComplete(state.activePath, btn.dataset.pathToggle, tier);
      render();
    });
  });

  // ── Checkpoint handlers (Stage 3) ──
  // Open a checkpoint hub from its timeline node.
  document.querySelectorAll('[data-cp-open]').forEach(card => {
    card.addEventListener('click', () => {
      openCheckpoint(state.activePath, card.dataset.cpOpen);
      window.scrollTo(0, 0);
    });
  });

  // Back from hub → timeline (and from finish button). history.back() pops the
  // entry openCheckpoint pushed; popstate clears the checkpoint state.
  document.querySelectorAll('[data-cp-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_navReady) { history.back(); return; }
      state.checkpoint = null; state.checkpointAct = null;
      window.scrollTo(0, 0);
      render();
    });
  });

  // Launch an activity from a hub card.
  document.querySelectorAll('[data-cp-act]').forEach(card => {
    card.addEventListener('click', () => {
      const act = card.dataset.cpAct;
      const cpState = state.checkpoint;
      if (!cpState) return;
      const stage = getStage(cpState.pathKey, cpState.stageId);
      if (act === 'words') {
        startCheckpointWords();
      } else if (act === 'patterns') {
        state.checkpointAct = 'patterns';
        startPatternDrill({ kind: 'checkpoint', stage });
      } else if (act === 'convo') {
        state.checkpointAct = 'convo';
        state.convo = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
        pushNav();
        render();
      }
      window.scrollTo(0, 0);
    });
  });

  // Back from an activity → hub. Routed through history so it matches phone BACK.
  document.querySelectorAll('[data-cp-act-back]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (_navReady) { history.back(); return; }
      state.checkpointAct = null; state.patternDrill = null; state.checkpointQuiz = null;
      window.scrollTo(0, 0);
      render();
    });
  });

  // Mark an activity done + return to hub (the done-screen / convo finish button).
  document.querySelectorAll('[data-cp-act-done]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.cpActDone;
      const cpState = state.checkpoint;
      if (cpState) setCheckpointActivityDone(cpState.pathKey, cpState.cpId, act, true);
      // Clear the session and return to the hub via history (pops the activity entry).
      if (_navReady) { history.back(); return; }
      state.checkpointAct = null; state.patternDrill = null; state.checkpointQuiz = null;
      window.scrollTo(0, 0);
      render();
    });
  });

  // Diagnostic "revisit topic" → open that topic's Learn tab.
  document.querySelectorAll('[data-cp-revisit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const topicKey = btn.dataset.cpRevisit;
      state.checkpoint = null; state.checkpointAct = null;
      state.patternDrill = null; state.checkpointQuiz = null;
      state.topic = topicKey;
      state.currentRound = 1;
      state.nav = 'topics';
      state.homeView = false;
      state.fromPath = false; state.fromPathTier = null;
      state.mode = 'study'; state.tab = 'words';
      state.flipped = {}; state.sentenceRevealed = {};
      state.sentenceNoteClosed = {}; state.patternRevealed = {};
      pushNav();
      window.scrollTo(0, 0);
      render();
    });
  });

  // Play a missed item's audio on the done screen.
  document.querySelectorAll('[data-cp-say]').forEach(btn => {
    btn.addEventListener('click', () => speak(btn.dataset.cpSay));
  });

  // Checkpoint Words quiz — choices, direction toggle, next, listen/replay.
  const cpq = state.checkpointQuiz;
  if (cpq && state.checkpointAct === 'words' && !cpq.done) {
    const cw = cpq.pool[cpq.idx];
    document.querySelectorAll('[data-cpw-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (cpq.selected !== null && cpq.selected !== undefined) return;
        const idx = parseInt(btn.dataset.cpwChoice, 10);
        const chosen = cpq.choices[idx];
        cpq.selected = idx;
        if (chosen === cw) cpq.score++;
        else cpq.missed.push(cw);
        speak(cw.c);
        render();
      });
    });
    document.querySelectorAll('[data-cpw-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        cpq.direction = btn.dataset.cpwDir;
        storage.setQuizDirection(cpq.direction);
        render();
      });
    });
    const cpwListen = document.getElementById('cpw-listen');
    if (cpwListen) cpwListen.addEventListener('click', () => speak(cw.c));
    const cpwReplay = document.getElementById('cpw-replay');
    if (cpwReplay) cpwReplay.addEventListener('click', () => speak(cw.c));
    const cpwNext = document.getElementById('cpw-next');
    if (cpwNext) cpwNext.addEventListener('click', () => advanceCheckpointWords());
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  storage._hydrate();                        // load all persisted data into the storage cache
                                             // (also migrates any legacy keys) — must run first
  state.pathProgress = loadPathProgress();   // restore saved completion state
  migratePathProgressIfNeeded();             // convert any legacy lesson keys to composite form

  // Boot-loading shell while reference data fetches
  const app = document.getElementById('app');
  app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#888;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;">Loading…</div>`;

  try {
    await Promise.all([
      store.loadIndex(),
      store.loadCategories(),
      store.loadPaths(),
      store.loadPathConvos(),
      store.loadPatterns(),
    ]);
  } catch (err) {
    console.error('[init] reference data load failed', err);
    app.innerHTML = `<div style="padding:60px 20px;text-align:center;color:#922B21;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;">Couldn't load app data. Check console and reload.</div>`;
    return;
  }

  render(); // first paint with index/categories/paths/patterns available

  await refreshReviewBadge();   // populate the Word Review menu count
  render();                     // re-render so the badge shows

  const voices = await loadVoices();
  // Count Cantonese voices specifically — dual-speaker only makes sense if we
  // have 2+ zh-HK voices, since mixing in a Mandarin voice for speaker B would
  // make the conversation half-Mandarin.
  const hkVoices    = voices.filter(v => v.lang === 'zh-HK');
  const otherZh     = voices.filter(v => v.lang.startsWith('zh') && v.lang !== 'zh-HK');
  const hkCount     = hkVoices.length;
  if (hkCount >= 2) {
    state.voiceInfo = { status:'hk',    label:`Cantonese (zh-HK) ready ✓ · ${hkCount} voices found — dual speaker active`, name: hkVoices[0].name };
  } else if (hkCount === 1) {
    state.voiceInfo = { status:'hk',    label:'Cantonese (zh-HK) ready ✓ · 1 voice found — using pitch to differentiate speakers', name: hkVoices[0].name };
  } else if (otherZh.length) {
    state.voiceInfo = { status:'other', label:`No Cantonese voice — audio will sound like Mandarin (using ${otherZh[0].lang})`, name: otherZh[0].name };
  } else {
    state.voiceInfo = { status:'none',  label:'No Chinese voice found — install one via Android Settings → General Management → Language & Input → Text-to-Speech → Google TTS → Install voice data → Chinese (Hong Kong)', name: '' };
  }

  render(); // re-render with voice info

  // ── Back-button integration ──
  // Seed the initial history entry (the starting screen) and register the
  // popstate handler. Done once, here — NOT in attachEvents (which re-runs every
  // render and would stack duplicate listeners).
  initNavHistory();
  window.addEventListener('popstate', (e) => {
    // BACK was pressed. The browser hands back the snapshot stored for the
    // entry we moved to. Restore it and re-render.
    window.speechSynthesis.cancel();   // stop any audio when leaving a screen

    const snap = e.state;
    if (snap) {
      applyNavSnapshot(snap);
    } else {
      // No snapshot (we're at the very first entry) — treat as the homepage,
      // which is now the Dashboard.
      state.nav = 'dashboard';
      state.pathView = 'list';
      state.homeView = true;
      state.drawerOpen = false;
    }

    // A review session is not part of the nav snapshot, so backing out of a
    // session produces a popstate that lands on the review screen. Whenever back
    // lands on review, clear any session — back should show the LANDING screen.
    if (state.wordReview) {
      state.wordReview = null;
      refreshReviewBadge();
    }

    // Likewise a pattern drill session: backing out returns to the Patterns
    // page (Drill tab landing). Clear the session so it's not stale.
    if (state.patternDrill) {
      state.patternDrill = null;
    }

    // Pattern Review session: not part of the nav snapshot, so backing out lands
    // on the Pattern Review screen — clear the session to show the landing fresh.
    if (state.patternReview) {
      state.patternReview = null;
      refreshReviewBadge();
    }

    // Checkpoint sessions aren't part of the nav snapshot's session data. The
    // snapshot restores `checkpoint`/`checkpointAct` (they're in NAV_FIELDS), so
    // after applying it we just clear any live session objects that no longer
    // match the restored screen — back should show the hub/activity fresh.
    if (!state.checkpointAct) {
      state.checkpointQuiz = null;
    }

    // A quiz in progress is likewise not a nav screen. If back has moved us out
    // of the in-topic view, discard any running quiz.
    if (state.quiz && (state.homeView || state.nav !== 'topics')) {
      state.quiz = null;
    }

    render();
  });
})();
