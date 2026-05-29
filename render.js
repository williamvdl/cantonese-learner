// ===================================================================
// render.js — rendering, events, init
// Loaded THIRD (after data.js, app.js). All render* functions, event wiring,
// and the init() bootstrap.
// ===================================================================

// ── Render ────────────────────────────────────────────────────────────────────
function renderDrawer() {
  const rc = state.reviewBadge.liveCount;
  const items = [
    { key:'topics',    icon:'📖', label:'Topics',         desc:'Vocabulary, sentences & conversations' },
    { key:'path',      icon:'🛤️', label:'Learning Path',  desc:'Curated curriculum, ordered & tracked'  },
    { key:'patterns',  icon:'🔨', label:'Patterns',        desc:'Sentence building blocks'              },
    { key:'review',    icon:'🗂️', label:'Word Review',     desc:'Practise words you\'ve missed',        badge: rc },
    { key:'translate', icon:'🌐', label:'Translate',       desc:'AI-powered translation & breakdown'    },
  ];
  const open = state.drawerOpen ? 'open' : '';
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
            <button class="nav-item${state.nav===item.key?' active':''}" data-nav="${item.key}">
              <span class="ni-icon">${item.icon}</span>
              <span class="ni-text">
                <span class="ni-label">${item.label}</span>
                <span class="ni-desc">${item.desc}</span>
              </span>
              ${item.badge > 0 ? `<span class="ni-badge">${item.badge}</span>` : ''}
              <span class="ni-tick">✓</span>
            </button>`).join('')}
          ${settingsSection}
        </div>
      </div>
    </div>`;
}

function renderPatterns() {
  const tab = state.patternsTab || 'browse';
  const libFrames = store.patterns.filter(p => p.tier === 1);
  const drillCount = libFrames.filter(p => Array.isArray(p.drills) && p.drills.length).length;

  // Browse / Drill segmented control (same component family as topic subtabs).
  const tabs = `
    <div class="subtabs patterns-subtabs">
      <button class="subtab-btn${tab==='browse'?' active':''}" id="patterns-tab-browse"
        style="${tab==='browse'?'background:#8B3A4E':''}">
        <span class="icon-label">${icon('bookOpen',14)} Browse</span>
      </button>
      <button class="subtab-btn${tab==='drill'?' active':''}" id="patterns-tab-drill"
        style="${tab==='drill'?'background:#8B3A4E':''}">
        <span class="icon-label">${icon('quiz',14)} Drill</span>
      </button>
    </div>`;

  const body = tab === 'drill'
    ? renderPatternDrill(drillCount)
    : renderPatternBrowse();

  return `
    <div class="patterns-wrap">
      ${renderPageHeader('🔨', 'Sentence Patterns', `${libFrames.length} building blocks`)}
      ${tabs}
      ${body}
    </div>`;
}

// The reference list — browse the Tier-1 library frames and their examples.
// Tier-2 patterns are topic-local (they live only in a topic's Learn tab), so
// the standalone library shows Tier-1 frames only.
function renderPatternBrowse() {
  const lib = store.patterns.filter(p => p.tier === 1);
  const cards = lib.map((p, pi) => {
    const examples = p.examples.map((ex, ei) => {
      const key = `p${pi}-e${ei}`;
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
      <div class="pattern-card">
        <div class="pattern-head">
          <div class="pattern-number">Pattern ${pi+1} of ${lib.length}</div>
          <div class="pattern-label">${p.label}</div>
          <span class="pattern-structure">${colorJyutping(p.structure)}</span>
        </div>
        <div class="pattern-body">
          <div class="pattern-note">${p.note}</div>
          <div class="pattern-examples">${examples}</div>
        </div>
      </div>`;
  }).join('');
  return cards;
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
  const color = '#8B3A4E';   // drill uses the brand cinnabar, like Word Review

  // --- Done summary ---
  if (pd.done) {
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
  const color = topicColor || '#8B3A4E';
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

  const color = '#8B3A4E';   // review uses the brand cinnabar as its accent

  // --- Done state: session summary ---
  if (wr.done) {
    const total = wr.queue.length;
    return `
      <div class="content">
        ${renderPageHeader('🗂️', 'Word Review', '')}
        <div class="result">
          <div class="result-emoji">${wr.graduatedThisSession > 0 ? '🌟' : '✅'}</div>
          <div class="result-score" style="color:${color}">${wr.correctThisSession} / ${total} correct</div>
          <div class="result-msg">
            ${wr.graduatedThisSession > 0
              ? `${wr.graduatedThisSession} word${wr.graduatedThisSession === 1 ? '' : 's'} cleared from your review list.`
              : `Keep going — get a word right 3 times to clear it.`}
          </div>
          ${state.reviewBadge.liveCount > 0
            ? `<button class="review-start-btn" id="review-again">Review ${Math.min(state.reviewBadge.liveCount, REVIEW_SESSION_CAP)} more</button>`
            : `<div class="review-allclear-note">No words left to review — nicely done.</div>`}
          <button class="back-btn" id="review-exit" style="background:${color}"><span class="icon-label">${icon('arrowLeft',15)} Done</span></button>
        </div>
      </div>`;
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
  const nextLesson = nextIncompleteLesson(pathKey);

  const steps = path.lessons.map((l, i) => {
    const lesson = lessonShape(l.topic);
    if (!lesson) return ''; // Defensive — skip if topic doesn't exist
    const tier = l.round;
    const complete = isLessonComplete(pathKey, l.topic, tier);
    const isNext = !complete && nextLesson && l.topic === nextLesson.topic && tier === nextLesson.tier;
    const stepCls = 'path-step' + (complete ? ' done' : '') + (isNext ? ' next' : '');
    const nextBadge = isNext ? `<span class="path-next-badge">Next up</span>` : '';
    const wordCount = (getRoundWords(l.topic, tier) || []).length;
    // Show tier in meta only when above 1, to keep Tier 1 displays clean
    const tierLabel = tier > 1 ? `Tier ${tier} · ` : '';
    return `
      <div class="${stepCls}">
        <div class="path-step-rail">
          <div class="path-step-node">${complete ? '✓' : (i + 1)}</div>
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
  }).join('');

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
      <div class="path-timeline">${steps}</div>
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

  const lesson = needsTopic ? lessonShape(state.topic) : null;
  const color  = lesson ? lesson.color : null;

  let mainContent = '';
  // A topic-scoped pattern drill takes over the screen regardless of nav — it's
  // launched from a topic's Learn tab and is its own focused view. (The Patterns
  // page's own Browse/Drill drill is handled inside renderPatterns as before.)
  if (state.patternDrill && state.patternDrill.topicKey) {
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
          ${state.mode === 'quiz' ? renderQuiz(lesson, color) : state.tab === 'convo' ? renderConversation(color) : renderStudy(lesson, color)}
        </div>
        ${toastEl}`;
    }
  } else if (state.nav === 'patterns') {
    mainContent = renderPatterns();
  } else if (state.nav === 'review') {
    mainContent = renderWordReview();
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
      ? `background:${l.color};color:#fff;border-color:${l.color}`
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
  const convo = getRoundConvo(state.topic, state.currentRound);
  if (!convo) return '<p style="color:#aaa;padding:20px 0">No conversation for this topic yet.</p>';
  const cv = state.convo;
  const lines = convo.lines;

  // ── Control bar ──
  const playAllStyle = cv.playingLine !== null
    ? `background:${color};color:#fff;border-color:${color}`
    : '';
  const gapOn    = cv.convMode === 'gap';
  const speakOn  = cv.convMode === 'speak';
  const controls = `
    <div class="convo-controls">
      <button class="convo-ctrl-btn${cv.playingLine!==null?' on':''}" id="play-all-btn"
        style="${cv.playingLine!==null?'background:'+color+';color:#fff;border-color:'+color:'border-color:'+color+';color:'+color}">
        <span class="icon-label">${cv.playingLine!==null ? icon('stop',15) : iconPlay(14)} ${cv.playingLine!==null ? 'Stop' : 'Play All'}</span>
      </button>
      <button class="convo-ctrl-btn${gapOn?' on':''}" id="gap-mode-btn"
        style="${gapOn?'background:'+color+';color:#fff;border-color:'+color:''}">
        🧩 Fill-the-Gap
      </button>
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
            style="color:${status==='listening'?'#8B3A4E':color};border:3px solid ${status==='listening'?'#8B3A4E':color}">
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

    // Gap mode: hide user lines until answered
    if (gapOn && isUser) {
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
        const hlBorder = correct ? '#2D5040' : '#8B3A4E';
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
    const bdPanel = (bdOpen && s.bd) ? `
      <div class="breakdown-panel" style="margin:8px 0 4px">
        ${s.bd.map(w => `
          <div class="breakdown-row">
            <span class="breakdown-zh">${w.c}</span>
            <span class="breakdown-jp">${colorJyutping(w.j)}</span>
            <span class="breakdown-en">${w.e}</span>
          </div>`).join('')}
      </div>` : '';
    const bdBtn = s.bd ? `
      <button class="breakdown-btn" data-sent-bd="${i}" style="color:${color};margin-top:6px">
        ${bdOpen ? '▲ hide breakdown' : '🔍 word breakdown'}
      </button>` : '';
    const englishEl = revealed
      ? `<div class="sentence-english">${s.e}</div>`
      : `<div class="sentence-eng-hint" style="font-size:11px;color:#aaa;font-style:italic;margin-top:2px;pointer-events:none">tap card to see English</div>`;
    return `
      <div class="sentence-wrap" style="margin-bottom:10px">
        <div class="sentence-card" data-sent-reveal="${i}" style="margin-bottom:0;cursor:pointer">
          <div class="sentence-body">
            <div class="sentence-chinese">${s.c}</div>
            <div class="sentence-jyutping">${colorJyutping(s.j)}</div>
            ${englishEl}
            ${bdBtn}
          </div>
          <button class="sentence-play${speaking ? ' speaking' : ''}" data-sent="${i}"
            style="border-color:${color};color:${speaking ? THEME.cardInverseText : color};background:${speaking ? color : 'transparent'}"
            title="Listen to sentence">
            ${speaking ? icon('volume',20) : iconPlay(18)}
          </button>
        </div>
        ${bdPanel}
      </div>`;
  }).join('');
  return `
    <div class="sentences">
      <h3>💬 Simple Sentences</h3>
      ${items}
    </div>`;
}

// The "Patterns with these words" section shown in the Learn tab, below the
// vocabulary. Only renders if the topic has associated patterns — a topic with
// none simply shows nothing here (correct: not every topic is pattern-shaped).
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
    ${renderTopicPatterns(state.topic, color)}
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
      // Tapping Topics from the drawer always returns to home view
      if (target === 'topics') state.homeView = true;
      // Tapping Learning Path from the drawer always returns to the path list
      if (target === 'path') state.pathView = 'list';
      // Entering Word Review always starts at the landing screen, not a stale session
      if (target === 'review') {
        state.wordReview = null;
        refreshReviewBadge().then(render);
      }
      // Entering Patterns always starts on Browse with no stale drill session
      if (target === 'patterns') {
        state.patternsTab = 'browse';
        state.patternDrill = null;
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

  // Category quick-jump (drawer sublinks)
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

  // ── Pattern drill events ──
  // Browse / Drill tab switch (in-screen control — not history-tracked)
  const ptBrowse = document.getElementById('patterns-tab-browse');
  if (ptBrowse) ptBrowse.addEventListener('click', () => { state.patternsTab = 'browse'; render(); });
  const ptDrill = document.getElementById('patterns-tab-drill');
  if (ptDrill) ptDrill.addEventListener('click', () => { state.patternsTab = 'drill'; render(); });

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
      const lines = getRoundConvo(state.topic, state.currentRound).lines;
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
    const line = getRoundConvo(state.topic, state.currentRound).lines[state.convo.speakStep];
    state.convo.playingLine = state.convo.speakStep;
    render();
    speakAs(line.c, line.u, () => { state.convo.playingLine = null; render(); });
  });

  // Speak: next button
  const speakNext = document.getElementById('speak-next');
  if (speakNext) speakNext.addEventListener('click', () => {
    const lines = getRoundConvo(state.topic, state.currentRound).lines;
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
    const lines = getRoundConvo(state.topic, state.currentRound).lines;
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
      const line = getRoundConvo(state.topic, state.currentRound).lines[i];
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
      const correct = chosen === getRoundConvo(state.topic, state.currentRound).lines[lineIdx].c;
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

  // Sentence English reveal — whole card clickable, toggles, skips play & breakdown buttons
  document.querySelectorAll('[data-sent-reveal]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-sent]') || e.target.closest('[data-sent-bd]')) return;
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
          addMiss(state.topic, state.currentRound, cw.c)
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

  // Done screen: start another session, or exit to landing
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
        if (correct) wr.correctThisSession++;
        // Persist the result to the bin. recordReviewResult resolves the graduation;
        // we capture whether this word graduated so the session tally is accurate.
        recordReviewResult(item.entry.topicKey, item.entry.round, item.entry.wordC, correct)
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
      state.topic        = ctx.nextStep.topic;
      state.currentRound = ctx.nextStep.round;
      state.fromPathTier = ctx.nextStep.round;
      state.mode         = 'study';
      state.tab          = 'words';
      state.flipped      = {};
      state.speaking     = null;
      state.sentenceBreakdownOpen = {};
      state.sentenceRevealed = {};
      state.patternRevealed = {};
      state.convo        = { convMode:'read', playingLine:null, gapAnswers:{}, bubbleRevealed:{}, breakdownOpen:{}, speakStep:0, speakStatus:'idle', speakHeard:'', speakAutoPlayed:false, speakRevealed:{} };
      pushNav();                 // path next-step → next lesson: BACK returns to previous lesson
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
      // No snapshot (we're at the very first entry) — treat as the home screen.
      state.nav = 'topics';
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

    // A quiz in progress is likewise not a nav screen. If back has moved us out
    // of the in-topic view, discard any running quiz.
    if (state.quiz && (state.homeView || state.nav !== 'topics')) {
      state.quiz = null;
    }

    render();
  });
})();
