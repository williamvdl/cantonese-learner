// ===================================================================
// render.js — rendering, events, init
// Loaded THIRD (after data.js, app.js). All render* functions, event wiring,
// and the init() bootstrap.
// ===================================================================

// The persistent chrome below the content, mounted identically by all five of
// render()'s exit points — the main one and the four loading/error shells.
// One helper rather than five copies of the pair, so a screen can never end up
// with the tab bar but no settings sheet (the drawer had this shape and got away
// with it only because it was a single call).
// The tab bar shows on the loading shells deliberately: a stuck load is exactly
// when you want a route out.
function renderChrome() {
  return renderTabBar() + renderSettingsSheet();
}

// ── Render ────────────────────────────────────────────────────────────────────
// The five top-level destinations. Fixed to the viewport bottom and shown on
// EVERY screen — including topics and checkpoints. §3.10 originally hid it in
// detail screens to avoid colliding with a docked action bar; that bar was never
// built (MOCK-11-bar is still unbuilt, and MOCK-10-cont's continuation card is
// in-flow), so there was nothing to collide with, and hiding the main menu would
// only have made detail screens feel like dead ends. Amended 2026-08-01 — see
// DESIGN_SYSTEM §3.10.
function renderTabBar() {
  const rc = state.reviewBadge.liveCount;
  const items = [
    { key:'dashboard', icon:'home',      label:'Home'      },
    { key:'path',      icon:'path',      label:'Path'      },
    { key:'topics',    icon:'topics',    label:'Topics'    },
    { key:'review',    icon:'review',    label:'Review',   badge: rc },
    { key:'translate', icon:'translate', label:'Translate' },
  ];
  // A topic opened via the path, or an open checkpoint, both belong to "Path" —
  // otherwise a path lesson wrongly lights "Topics". Carried over unchanged from
  // the drawer; it was correct there and the same reasoning holds here.
  const activeNav = (state.checkpoint || state.fromPath) ? 'path' : state.nav;
  return `
    <nav class="tabs tabs--top" id="tabbar" aria-label="Main">
      ${items.map(item => {
        const on = activeNav === item.key;
        return `
        <button class="tab${on ? ' tab--on' : ''}" data-nav="${item.key}"${on ? ' aria-current="page"' : ''}>
          <span class="tab-ic">${icon(item.icon, 19)}${item.badge > 0 ? `<span class="tab-badge">${item.badge}</span>` : ''}</span>
          <span>${item.label}</span>
        </button>`;
      }).join('')}
    </nav>`;
}

// Settings, behind the header cog (DES-11: settings live in the header corner,
// never as a tab — a tab is a destination and settings is not one). MOCK-19-sheet:
// a bottom sheet sized to its contents rather than a fixed height, so two rows do
// not sit in a half-empty full-height surface.
function renderSettingsSheet() {
  if (!state.settingsOpen) return '';
  const speeds = [
    { key:'slow',   label:'Slow'   },
    { key:'normal', label:'Normal' },
    { key:'fast',   label:'Fast'   },
  ];
  const speedBtns = speeds.map(s =>
    `<button class="seg-btn${state.speed === s.key ? ' on' : ''}" data-speed="${s.key}"${state.speed === s.key ? ' aria-current="true"' : ''}>${s.label}</button>`
  ).join('');
  return `
    <div class="sheet-wrap" id="settings-sheet">
      <div class="sheet-scrim" id="settings-scrim"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="sheet-grab"></div>
        <div class="sheet-head">
          <h2 class="sheet-title">Settings</h2>
          <button class="btn-icon sheet-close" id="settings-close" aria-label="Close settings">${icon('close', 17)}</button>
        </div>
        <div class="set-row">
          <div class="set-label">Audio speed</div>
          <div class="set-help">Applies to every word and sentence.</div>
          <div class="seg">${speedBtns}</div>
        </div>
      </div>
    </div>`;
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
          <button class="btn-icon btn-icon--brand translate-mic ${listening?'listening':''}" id="translate-mic" title="${listening?'Stop listening':'Speak instead of typing'}">
            ${icon('mic', 18)}
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
            <div class="tone-guide-foot">
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
// The active-question UI is identical between the topic Quiz and Word Review.
// This function renders that shared middle:
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
//   variant     - optional; 'milestone' for checkpoint chrome (§4)
//   idx, total  - question number / queue length (for the progress bar)
//   ariaLabel   - aria-label for the direction toggle
//   dirAttr     - data-attribute name for direction buttons (e.g. 'data-quiz-dir')
//   choiceAttr  - data-attribute name for choice buttons (e.g. 'data-choice')
//   listenId    - element id for the listen button(s)
//   replayId    - element id for the wrong-panel replay button
//   nextId      - element id for the wrong-panel "next" button
function renderQuizCore(opts) {
  const { word: cw, choices, selected, direction, idx, total,
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
        return `<button class="pill${active ? ' pill--on' : ''}" ${dirAttr}="${d.key}" title="${d.title}"
>${d.label}</button>`;
      }).join('')}
    </div>`;

  // --- Prompt card (varies by direction) ---
  let promptCard;
  if (direction === 'en-zh') {
    promptCard = `
      <div class="card quiz-card">
        <div class="quiz-label">Pick the Cantonese for:</div>
        <div class="quiz-prompt-en">${cw.e}</div>
      </div>`;
  } else if (direction === 'listen-en') {
    promptCard = `
      <div class="card quiz-card quiz-card-listen">
        <div class="quiz-label">Listen — what does it mean?</div>
        <button class="quiz-listen-big" id="${listenId}" aria-label="Play audio">${icon('volume',38)}</button>
        <div class="quiz-listen-hint">Tap to replay</div>
      </div>`;
  } else {
    promptCard = `
      <div class="card quiz-card">
        <div class="quiz-label">What does this mean?</div>
        <div class="quiz-chinese">${cw.c}</div>
        <div class="quiz-jyutping">${colorJyutping(cw.j)}</div>
        <button class="btn-listen quiz-listen" id="${listenId}"><span class="icon-label">${iconPlay(13)} Listen</span></button>
      </div>`;
  }

  // --- Choice buttons ---
  // Keyed by ARRAY INDEX, not by c.c: a round can contain homographs (same
  // Chinese, different meaning), so the Chinese string is not a unique id.
  const choiceBtns = choices.map((c, i) => {
    const isCorrect = c === cw;                 // object identity — exact option
    const isChosen  = selected === i;
    let cls = 'card choice-btn';
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
  // Either way the question now STOPS and waits for a tap (no auto-advance).
  // The label is "Next question", not "Next" (MOCK-12): the continuation card is
  // on screen during the quiz and carries its own forward action, so a bare
  // "Next" would read as two forwards a thumb apart meaning different things.
  const wasWrong = answered && choices[selected] !== cw;
  let answerPanel = '';
  if (answered && wasWrong) {
    answerPanel = `<div class="quiz-wrong-panel">
        <div class="quiz-wrong-heading">Not quite — the answer was:</div>
        <div class="quiz-wrong-chinese">${cw.c}</div>
        <div class="quiz-wrong-jp">${colorJyutping(cw.j)}</div>
        <div class="quiz-wrong-en">${cw.e}</div>
        <div class="quiz-wrong-actions">
          <button class="quiz-replay" id="${replayId}"><span class="icon-label">${iconPlay(13)} Hear it again</span></button>
          <button class="quiz-next" id="${nextId}"><span class="icon-label">Got it — next ${icon('arrowRight',14)}</span></button>
        </div>
      </div>`;
  } else if (answered) {
    answerPanel = `<div class="quiz-correct-row">
        <span class="quiz-correct-msg"><span class="quiz-correct-tick">${icon('check',14)}</span>Correct!</span>
        <button class="quiz-next" id="${nextId}"><span class="icon-label">Next question ${icon('arrowRight',14)}</span></button>
      </div>`;
  }

  return {
    progressBar: `<div class="track quiz-progress"><i style="width:${pct}%"></i></div>`,
    dirToggle,
    promptCard,
    choiceGrid: `<div class="choices">${choiceBtns}</div>`,
    answerPanel,
  };
}

// Word Review's "session complete" screen. Shows three stats — reviewed /
// graduated / still learning — plus a "review N more" (or all-clear) and a
// Done button. `still learning = reviewed - graduated`.
function renderReviewDone(o) {

  const stillLearning = Math.max(0, o.reviewed - o.graduated);
  const moreOrClear = o.liveCount > 0
    ? `<button class="btn btn--primary" id="${o.againId}">Review ${Math.min(o.liveCount, REVIEW_SESSION_CAP)} more</button>`
    : `<div class="review-allclear-note">${o.allClearNote}</div>`;
  return `
    <div class="content">
      ${renderPageHeader(o.icon, o.title, '')}
      <div class="result">
        <div class="result-emoji">${o.graduated > 0 ? '🌟' : '✅'}</div>
        <div class="review-done-stats">
          <div class="rd-stat"><b>${o.reviewed}</b><span>reviewed</span></div>
          <div class="rd-stat"><b style="color:var(--jade-bright)">${o.graduated}</b><span>graduated</span></div>
          <div class="rd-stat"><b style="color:var(--muted)">${stillLearning}</b><span>still learning</span></div>
        </div>
        <div class="result-msg">
          ${o.graduated > 0
            ? `${o.graduated} ${o.noun}${o.graduated === 1 ? '' : 's'} cleared from your review list.`
            : `Keep going — get a ${o.noun} right 3 times to clear it.`}
        </div>
        ${moreOrClear}
        <button class="back-btn" id="${o.exitId}"><span class="icon-label">${icon('arrowLeft',15)} Done</span></button>
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
          <button class="btn btn--primary" id="review-start">Start review</button>
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

  // --- Done state: session summary (shared stat screen) ---
  if (wr.done) {
    return renderReviewDone({
      icon: '🗂️', title: 'Word Review',
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

function renderDashboard() {
  const next = dashboardNextUp();
  const heroHtml = renderDashboardHero(next);

  // Path progress — Beginner + Intermediate only for now (Advanced has no
  // content yet; this list picks it up automatically once it does, because it
  // walks store.paths rather than a hardcoded pair).
  const progressPaths = (store.paths || []).filter(p => !p.comingSoon && (p.key === 'beginner' || p.key === 'intermediate'));
  const pathRowsHtml = progressPaths.map(p => renderDashboardPathRow(p)).join('');

  const rc = state.reviewBadge.liveCount;
  const reviewHtml = `
    <div class="section-label">To review</div>
    <div class="card card--interactive">
      <button class="dash-row-link" id="dash-review-open">
        <span class="dash-row-body">
          <span class="dash-row-title">Word Review</span>
          <span class="dash-row-sub">${rc > 0 ? `${rc} word${rc === 1 ? '' : 's'} flagged for practice` : 'Nothing flagged right now'}</span>
        </span>
        ${rc > 0 ? `<span class="dash-badge">${rc}</span>`
                 : `<span class="dash-row-chev">${icon('arrowRight', 16)}</span>`}
      </button>
    </div>`;

  const tilesHtml = `
    <div class="section-label">Jump to</div>
    <div class="dash-tile-grid">
      <button class="card card--interactive dash-tile" id="dash-tile-topics">
        <span class="dash-tile-label">Topics</span>
        <span class="dash-tile-desc">Vocabulary, sentences and conversations</span>
      </button>
      <button class="card card--interactive dash-tile" id="dash-tile-translate">
        <span class="dash-tile-label">Translate</span>
        <span class="dash-tile-desc">Translation and word breakdown</span>
      </button>
    </div>`;

  return `
    <div class="dash-wrap">
      ${heroHtml}
      ${pathRowsHtml ? `<div class="section-label">Path progress</div><div class="card list">${pathRowsHtml}</div>` : ''}
      ${reviewHtml}
      ${tilesHtml}
    </div>`;
}

// The watermark character for a lesson hero: the first character of the
// topic's first word — the word being studied, per the watermark rule. Returns
// '' when the topic file isn't cached yet, so the hero degrades to no
// watermark rather than to a placeholder.
function dashHeroWatermark(topicKey) {
  const r1 = (typeof store.roundData === 'function' && store.roundData(topicKey, 1)) || null;
  const first = r1 && r1.words && r1.words[0];
  const c = first && first.c ? String(first.c).trim() : '';
  return c ? c[0] : '';
}

// The hero card. `next` is dashboardNextUp()'s return value (or null when every
// path is complete, in which case a quiet completion state is shown instead).
// No colour is passed in or injected: the 3px left rule carries the state, and
// its colour comes from the modifier class.
function renderDashboardHero(next) {
  if (!next) {
    return `
      <div class="card dash-hero">
        <div class="eyebrow">All caught up</div>
        <div class="dash-hero-title">Every path is complete</div>
        <p class="dash-hero-sub">Check back as new chapters are added, or revisit Review to keep things fresh.</p>
      </div>`;
  }
  const { pathKey, path, item } = next;

  if (item.kind === 'checkpoint') {
    return `
      <div class="card card--milestone dash-hero dash-hero--cp"
           data-dash-hero-cp="${pathKey}" data-dash-hero-stage="${item.stageId}">
        <div class="wm">站</div>
        <div class="eyebrow eyebrow--milestone">Next up</div>
        <div class="dash-hero-stage">${path.label} · Checkpoint</div>
        <div class="dash-hero-title">${item.stageName}</div>
        <button class="btn btn--milestone">Open checkpoint ${icon('arrowRight', 15)}</button>
      </div>`;
  }

  const meta = store.topicMeta(item.topic);
  const tierLabel = item.tier > 1 ? `Tier ${item.tier}` : null;
  const wm = dashHeroWatermark(item.topic);
  return `
    <div class="card card--emph dash-hero"
         data-dash-hero-topic="${item.topic}" data-dash-hero-tier="${item.tier}">
      ${wm ? `<div class="wm">${wm}</div>` : ''}
      <div class="eyebrow">Next up</div>
      <div class="dash-hero-stage">${path.label}</div>
      <div class="dash-hero-title">${meta ? meta.label : item.topic}${tierLabel ? `<span class="dash-hero-tier">${tierLabel}</span>` : ''}</div>
      <button class="btn btn--primary">Resume lesson ${icon('arrowRight', 15)}</button>
    </div>`;
}

// One path's progress, as a row of the shared list card. Two paths measured
// identically are a set, so they share one form rather than getting a tinted
// card each.
function renderDashboardPathRow(p) {
  const total = p.lessons.length;
  const done = pathCompleteCount(p.key);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const sub = complete
    ? `Complete — all ${countPathChapters(p)} chapters`
    : `${total - done} lesson${(total - done) === 1 ? '' : 's'} to go`;
  return `
    <div class="list-row" data-dash-path-open="${p.key}">
      <div class="dash-path-row">
        <span class="dash-path-name">${p.label}${complete ? ` <span class="dash-path-check">${icon('check', 13)}</span>` : ''}</span>
        <span class="dash-path-frac">${done}/${total}</span>
      </div>
      <div class="track"><i style="width:${pct}%"></i></div>
      <div class="dash-path-sub">${sub}</div>
    </div>`;
}

// Counts distinct chapter/stage groupings for a path's "complete" subtitle.
// Falls back to lesson count if the path has no stage structure.
function countPathChapters(p) {
  const stages = getPathStages(p.key);
  return stages.length || p.lessons.length;
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
      const cardCls = 'card path-card' + (locked ? ' locked' : '');
      const dataAttr = locked ? '' : `data-path-open="${p.key}"`;
      const badge = locked
        ? `<span class="tag">Coming Soon</span>`
        : (total > 0 && done === total ? `<span class="tag tag--done">Complete</span>` : '');
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
        <div class="node${complete ? ' node--done' : ''}${isNext ? ' node--current' : ''}">${complete ? icon('check', 13) : displayNum}</div>
        <div class="path-step-line"></div>
      </div>
      <div class="path-step-body">
        <div class="card path-step-card" data-path-lesson="${l.topic}" data-path-tier="${tier}">
          ${nextBadge}
          <div class="path-step-row">
            <div class="path-step-text">
              <div class="path-step-title">${lesson.label}</div>
              <div class="path-step-meta">${tierLabel}${wordCount} word${wordCount !== 1 ? 's' : ''}</div>
            </div>
            <button class="path-complete-btn" data-path-toggle="${l.topic}" data-path-tier="${tier}" aria-label="${complete ? 'Mark incomplete' : 'Mark complete'}">✓</button>
          </div>
        </div>
      </div>
    </div>`;
}

// The diamond path every .mk instance draws. 3px corner radius keeps the stroke
// ends clean at small sizes (MOCK-07-Asoft). Drawn in a 0 0 32 32 viewBox and
// scaled by the host, so one path serves every size.
const MK_DIAMOND = 'M13.9 6.9 a3 3 0 0 1 4.2 0 l7 7 a3 3 0 0 1 0 4.2 l-7 7 a3 3 0 0 1 -4.2 0 l-7 -7 a3 3 0 0 1 0 -4.2 Z';

// A diamond carrying its own progress: the shape IS the track. `pct` is 0–1; the
// dash length is resolved from getTotalLength() by paintDiamondRings() after
// render, never hardcoded. Carries no colour — .mk / .mk.is-done own that, so
// this stays inside §3.5 (the styleguide's demo inlines fill/stroke attributes,
// which would have put colour back into a render function).
function renderDiamondProgress(pct, done, glyph) {
  const cls = 'mk' + (done ? ' is-done' : '') + (pct <= 0 ? ' is-empty' : '');
  // Rounded so the attribute doesn't carry a 17-digit float into the DOM.
  const p = Math.round(Math.min(Math.max(pct, 0), 1) * 1e4) / 1e4;
  return `
    <div class="${cls}" data-pct="${p}">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path class="mk-fill"  d="${MK_DIAMOND}"/>
        <path class="mk-track" d="${MK_DIAMOND}"/>
        <path class="mk-prog"  d="${MK_DIAMOND}"/>
      </svg>
      <span class="glyph">${glyph}</span>
    </div>`;
}

// Resolve every ring's dash length from its own geometry. Runs after each render
// because the paths only exist once the markup is in the DOM. getTotalLength()
// reads the path data, so it does not depend on layout having settled.
function paintDiamondRings() {
  document.querySelectorAll('.mk[data-pct]').forEach(mk => {
    const el = mk.querySelector('.mk-prog');
    if (!el) return;
    const pct = parseFloat(mk.dataset.pct) || 0;
    const L = el.getTotalLength();
    el.setAttribute('stroke-dasharray', L);
    el.setAttribute('stroke-dashoffset', L * (1 - pct));
  });
}

// The checkpoint node + card for a stage. The rail diamond and the card's
// milestone edge both retreat once complete (MOCK-05-retreat).
function renderCheckpointNode(pathKey, stage, nextPos) {
  const prog = checkpointProgress(pathKey, stage.id);
  if (!prog.total) return '';  // no offerable activities → no node
  const isNext = !prog.complete && nextPos && nextPos.kind === 'checkpoint' && nextPos.stageId === stage.id;
  const started = prog.done > 0 && !prog.complete;

  // Three states, where the code had two and no partial at all (MOCK-07-Asoft).
  const progText = prog.complete
    ? 'Complete'
    : started
      ? `${prog.done} of ${prog.total} done`
      : `${prog.total} activit${prog.total === 1 ? 'y' : 'ies'} · tap to open`;
  const badgeText = prog.complete ? '✓' : started ? 'Resume' : 'Checkpoint';

  // Pips only once started, and never on a completed row: .segs is a milestone
  // form, and a completed checkpoint has dropped milestone colour entirely.
  const cpId = stage.checkpoint && stage.checkpoint.id;
  const pips = (started && cpId)
    ? `<div class="segs">${prog.available.map(a =>
        `<i class="${checkpointActivityDone(pathKey, cpId, a) ? 'on' : ''}"></i>`).join('')}</div>`
    : '';

  const nextBadge = isNext ? `<span class="path-next-badge">Next up</span>` : '';
  const ring = renderDiamondProgress(
    prog.total ? prog.done / prog.total : 0,
    prog.complete,
    prog.complete ? icon('check', 12) : '◆'
  );
  return `
    <div class="path-step path-step-cp${prog.complete ? ' cp-done' : ''}${isNext ? ' next' : ''}">
      <div class="path-step-rail">
        ${ring}
        <div class="path-step-line"></div>
      </div>
      <div class="path-step-body">
        <div class="card ${prog.complete ? '' : 'card--milestone '}path-step-card cp-card" data-cp-open="${stage.id}">
          ${nextBadge}
          <div class="path-step-row">
            <div class="path-step-text">
              <div class="path-step-title">Checkpoint · ${stage.name}</div>
              <div class="path-step-cp-prog">${progText}</div>
              ${pips}
            </div>
            <span class="path-cp-badge">${badgeText}</span>
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

// The hub: two independent activities. Reuses no learning engine itself — it
// routes into the Words / Conversation activities.
function renderCheckpointHub() {
  const cpState = state.checkpoint;
  if (!cpState) return '';
  const { pathKey, stageId, cpId } = cpState;
  const stage = getStage(pathKey, stageId);
  if (!stage) return '';
  const prog = checkpointProgress(pathKey, stageId);

  const meta = {
    words:    { icon:'📖', name:'Words',        tag:'RECALL',  desc:'Vocabulary from all topics in this stage' },
    convo:    { icon:'💬', name:'Conversation', tag:'PRODUCE', desc:'A longer scene — read & speak' },
  };
  const cards = prog.available.map(act => {
    const m = meta[act];
    const done = checkpointActivityDone(pathKey, cpId, act);
    const right = done
      ? `<span class="cp-act-done">✓ Done</span>`
      : `<span class="cp-act-go">›</span>`;
    return `
      <button class="card cp-act-card" data-cp-act="${act}">
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

  // MOCK-16-H2. The hub is the last member of its stage, so it carries the same
  // contextual row and stepper — which is also its only lateral navigation. The
  // hairline keeps measuring stage TOPICS everywhere, and activity progress is
  // carried by .segs: a different fact, told apart by form rather than position
  // (§3.4). The row's back replaces the standalone button that used to sit here.
  const stageCtx = getCheckpointStageContext();
  const aboveEl = stageCtx
    ? renderContextRow(stageCtx, { meta: `Checkpoint · ${stageCtx.path.label}`, backAttr: 'data-cp-back' })
      + renderStageStepper(stageCtx, true)
    : `<button class="back-home-btn" data-cp-back><span class="icon-label">${icon('arrowLeft',15)} ${stage.name}</span></button>`;

  const pips = `<div class="segs cp-segs">${prog.available.map(a =>
    `<i class="${checkpointActivityDone(pathKey, cpId, a) ? 'on' : ''}"></i>`).join('')}</div>`;

  return `
    ${aboveEl}
    <div class="content cp-hub">
      <div class="cp-hero">
        <div class="cp-diamond"><span>◆</span></div>
        <div class="cp-hero-h">Checkpoint</div>
        <div class="cp-hero-stage">${stage.name}</div>
        <div class="cp-hero-prog">${prog.done} of ${prog.total} reviewed</div>
        <div class="cp-optional">🔓 Optional — do any, in any order</div>
      </div>
      <div class="cp-flow-hint">Suggested flow: recall → produce</div>
      ${cards}
      ${pips}
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
    <div class="content quiz-ms">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="cp-activity-heading">📖 Words review</div>
      <div class="quiz-meta">
        <span class="quiz-count">Word ${q.idx+1} / ${q.pool.length}</span>
        <span class="quiz-score">Score: ${q.score}</span>
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
    <div class="card cp-missed">
      <div class="cp-missed-lbl">Worth another look</div>
      ${missedItems.map(m => `
        <div class="cp-missed-item">
          <button class="btn-icon btn-icon--brand btn-icon--compact" data-cp-say="${m.id}" aria-label="Listen">${iconPlay(14)}</button>
          <div><div class="cp-missed-c">${m.c}</div><div class="cp-missed-j">${colorJyutping(m.j)}</div></div>
          <span class="cp-missed-e">${m.e}</span>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="content cp-done">
      <button class="back-home-btn" data-cp-act-back><span class="icon-label">${icon('arrowLeft',15)} Checkpoint</span></button>
      <div class="cp-done-wrap">
        <div class="cp-done-ring" style="background:conic-gradient(var(--milestone) ${pct}%, var(--milestone-edge) 0)">
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

// Conversation activity wrapper — the existing chat engine over the checkpoint
// consolidation convo (sourced via activeConvoSource), read + speak only.
function renderCheckpointConvo() {
  const cpState = state.checkpoint;
  if (!cpState) return '';
  const stage = getStage(cpState.pathKey, cpState.stageId);
  const convo = activeConvoSource();
  const body = convo
    ? renderConversation()
    : '<p class="convo-empty">No conversation authored for this stage yet.</p>';
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
      <div class="ph-title">${title}</div>
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
      ${renderHeader()}
      <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading topic…</div></div>
      ${renderChrome()}
    `;
    attachEvents(null);
    store.loadTopic(state.topic).then(render).catch(err => {
      console.error('[topic load]', err);
      app.innerHTML = `
        ${renderHeader()}
        <div class="content"><div class="fatal-msg">Couldn't load topic. Check console.</div></div>
        ${renderChrome()}
      `;
      attachEvents(null);
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
          ${renderHeader()}
          <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading path…</div></div>
          ${renderChrome()}
        `;
        attachEvents(null);
        store.loadTopics(missing).then(render).catch(err => {
          console.error('[path load]', err);
        });
        return;
      }
    }
  }

  // If a checkpoint is open, ensure its stage's topics are loaded (word pools
  // depend on cached topic data). Normally the timeline pre-warm above has
  // already cached them, but this guards direct/restored entry into a checkpoint.
  if (state.checkpoint) {
    const stage = getStage(state.checkpoint.pathKey, state.checkpoint.stageId);
    if (stage) {
      const missing = (stage.topics || []).filter(k => !store.isTopicLoaded(k));
      if (missing.length) {
        app.innerHTML = `
          ${renderHeader()}
          <div class="content"><div style="padding:40px 20px;text-align:center;color:#888;font-size:14px;">Loading checkpoint…</div></div>
          ${renderChrome()}
        `;
        attachEvents(null);
        store.loadTopics(missing).then(render).catch(err => console.error('[checkpoint load]', err));
        return;
      }
    }
  }

  const lesson = needsTopic ? lessonShape(state.topic) : null;

  let mainContent = '';
  // A checkpoint hub or activity takes over the screen (launched from the path
  // timeline). Checked before other nav so it's a focused full-screen view.
  if (state.checkpoint && state.checkpointAct === 'words') {
    mainContent = renderCheckpointWords();
  } else if (state.checkpoint && state.checkpointAct === 'convo') {
    mainContent = renderCheckpointConvo();
  } else if (state.checkpoint) {
    mainContent = renderCheckpointHub();
  } else if (state.nav === 'topics') {
    if (state.homeView) {
      mainContent = `${renderTopicsScreen()}`;
    } else {
      const ctx = getPathContext();
      // Path context is orientation and belongs above the lesson; the path
      // ACTION belongs at the foot, where a lesson actually ends (MOCK-10).
      // The contextual row is full-bleed with its inner content capped, so it
      // sits outside .content.
      const aboveEl = ctx
        ? `${renderContextRow(ctx)}${renderStageStepper(ctx)}`
        : '';
      const backEl = ctx
        ? ''
        : `<button class="back-home-btn" id="back-home-btn"><span class="icon-label">${icon('arrowLeft',15)} Back to topics</span></button>`;
      // MOCK-11's subtab matrix as MOCK-12 revised it: the continuation is
      // present on Learn, Chat AND Quiz. While a quiz question is live it drops
      // its forward action only — "Next in <stage>" a thumb under the quiz's own
      // "Next question" is two forwards meaning different things. On the result
      // screen nothing competes, so the forward action returns; the result screen
      // keeps its own "Back to Lesson" / "Retry missed words" and does not absorb
      // completion (DES-10 — a quiz run is not a completion event).
      // Standalone topics have no `ctx` and so no continuation: it is a path concept.
      const contEl = ctx
        ? renderContinuation(ctx, { completionOnly: isQuizQuestionLive() })
        : '';
      mainContent = `
        ${aboveEl}
        <div class="content">
          ${backEl}
          ${renderRoundSelector(state.topic)}
          ${renderLessonHeader(lesson)}
          ${state.mode === 'quiz' ? renderQuiz(lesson) : state.tab === 'convo' ? renderConversation() : renderStudy(lesson)}
          ${contEl}
        </div>`;
    }
  } else if (state.nav === 'dashboard') {
    mainContent = `${renderDashboard()}`;
  } else if (state.nav === 'review') {
    mainContent = renderWordReview();
  } else if (state.nav === 'translate') {
    mainContent = renderTranslate();
  } else if (state.nav === 'path') {
    mainContent = `${renderLearningPath()}`;
  }

  app.innerHTML = `
    ${renderHeader()}
    ${mainContent}
    ${state.toast ? renderToast(state.toast) : ''}
    ${renderChrome()}
  `;

  attachEvents(lesson);
}

// Unified page-section header — used by Topics, Learning Path, Review, Translate
// so they read consistently. icon = emoji string, title + subtitle text.
function renderPageHeader(emoji, title, subtitle) {
  return `
    <div class="page-header">
      <h2 class="page-header-title">${emoji ? `<span class="page-header-emoji">${emoji}</span>` : ''}${title}</h2>
      ${subtitle ? `<p class="page-header-sub">${subtitle}</p>` : ''}
    </div>`;
}

function renderHeader() {
  const toneKeys = Object.entries(TONES).map(([t,d]) =>
    `<span style="color:${d.color}">● T${t}</span>`
  ).join('');
  const detailsOpen = state.headerDetailsOpen;
  return `
    <div class="header">
      <div class="header-row">
        <div class="header-slot">
          <button class="btn-icon btn-icon--header header-info-btn${detailsOpen ? ' open' : ''}" id="header-info-toggle" aria-label="Show tone reference" aria-expanded="${detailsOpen}">
            <span class="header-info-icon">${detailsOpen ? icon('close', 17) : icon('info', 17)}</span>
          </button>
        </div>
        <div class="header-title">
          <button class="nameplate" id="nameplate-home" aria-label="Go to Home">
            <span class="zh">廣東話</span>
            <span class="en">Cantonese Learner</span>
          </button>
        </div>
        <div class="header-slot">
          <button class="btn-icon btn-icon--header" id="settings-btn" aria-label="Settings" aria-expanded="${!!state.settingsOpen}">${icon('cog', 17)}</button>
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
// Path context is split by job (MOCK-10). Orientation goes above the lesson as
// a contextual row plus a stage stepper; the ACTION goes to the foot of the
// lesson as a continuation card, because that is where a lesson ends. This
// replaces renderPathBanner, which put "Next step" at the top of the screen
// before the lesson had been done, and carried a second progress bar measuring
// whole-path progress a centimetre from the stage one (§3.4).

// Contextual row — back target, stage position, stage progress hairline.
// Back is labelled with its DESTINATION: the stage you came from, not the path.
// `opts.meta` overrides the position text (the hub says "Checkpoint · Beginner"
// rather than a step number) and `opts.backAttr` swaps the back handler.
function renderContextRow(ctx, opts) {
  const o = opts || {};
  const st = ctx.stage;
  // No stage (a topic in path.lessons but in no stage) degrades to the path as
  // the back target. Same shell, less information — never a different shape.
  const backLabel = st ? st.name : `${ctx.path.label} Path`;
  const meta = o.meta || (st
    ? `${st.step} of ${st.total} · ${ctx.path.label}`
    : ctx.path.label);
  const pct = st && st.total ? Math.round((st.done / st.total) * 100) : 0;
  // No stage means no stage progress to report. An empty hairline would read as
  // 0% rather than "not applicable", so the track is omitted entirely.
  const trackEl = st
    ? `<div class="ctx-track"><div class="ctx-fill" style="width:${pct}%"></div></div>`
    : '';
  const backAttr = o.backAttr || 'id="back-home-btn"';
  return `
    <div class="ctx">
      <div class="ctx-inner">
        <div class="ctx-row">
          <button class="ctx-back" ${backAttr}>${icon('arrowLeft',15)} ${backLabel}</button>
          <span class="ctx-meta">${meta}</span>
        </div>
      </div>
      ${trackEl}
    </div>`;
}

// Stage stepper — the sibling topics of this stage, plus the stage checkpoint as
// a diamond at the end. Tappable, so you can move between siblings without going
// back to the timeline. Absent entirely when there is no stage.
// Nodes run at the base .node size (MOCK-16-S28): the strip is the primary
// lateral navigation on the screen, and at 20px it read as decoration.
// `cpCurrent` marks the end diamond as where you are — the hub passes it.
function renderStageStepper(ctx, cpCurrent) {
  const st = ctx.stage;
  if (!st || !st.topics.length) return '';
  const cells = st.topics.map((t, i) => {
    const cls = 'node'
      + (t.complete ? ' node--done' : '')
      + (t.isCurrent ? ' node--current' : '');
    const inner = t.complete ? icon('check', 13) : String(i + 1);
    // The current topic is where you already are, so it is not a link.
    const marker = t.isCurrent
      ? `<span class="${cls}">${inner}</span>`
      : `<button class="sx-btn" data-stage-topic="${t.topic}" data-stage-tier="${t.tier}" aria-label="${t.label}"><span class="${cls}">${inner}</span></button>`;
    return `<div class="sx">${marker}<span class="sline${t.complete ? ' done' : ''}"></span></div>`;
  }).join('');
  if (!st.checkpoint || !st.checkpoint.total) return `<div class="stepper">${cells}</div>`;
  const cpCls = 'node node--cp'
    + (st.checkpoint.complete ? ' node--done' : '')
    + (cpCurrent ? ' node--current' : '');
  const cpInner = `<span class="${cpCls}"><span>◆</span></span>`;
  const cp = cpCurrent
    ? `<div class="sx"><span class="sx-btn">${cpInner}</span></div>`
    : `<div class="sx"><button class="sx-btn" data-stage-cp="${st.id}" aria-label="Checkpoint · ${st.name}">${cpInner}</button></div>`;
  return `<div class="stepper">${cells}${cp}</div>`;
}

// Continuation — the foot of the lesson. Four states: not yet complete (mark),
// complete with another topic ahead, complete with the stage checkpoint ahead,
// and the end of the path.
// True only while a quiz QUESTION is on screen — the result screen is not a live
// question. Mockup 12's exception hinges on this distinction and two callers need
// it (the continuation, and the mark-complete handler's auto-return), so it lives
// in one place rather than being re-derived.
function isQuizQuestionLive() {
  return state.mode === 'quiz' && !!state.quiz && !state.quiz.done;
}

// `opts.completionOnly` renders the card's completion state and stops there —
// no forward action, no end-of-path block. Used while a quiz question is live.
// This is a structural reduction, not a variant: no colour or theme is passed in
// (§3.5), and the treatment of every state that does render is unchanged.
function renderContinuation(ctx, opts) {
  const o = opts || {};

  if (!ctx.isComplete) {
    // The mark button IS the completion confirmation, so it renders in both
    // forms. It is a ghost (`btn--good`), so it never competes with the quiz's
    // own filled action — which is what made mockup 12's exception workable.
    return `
      <div class="card cont">
        <div class="section-label cont-h">When you're done</div>
        <button class="btn btn--good cont-mark" id="path-mark-complete">${icon('check',14)} Mark this lesson complete</button>
      </div>`;
  }

  const doneRow = `<div class="cont-done"><span class="tick">${icon('check',11)}</span> Lesson complete</div>`;

  if (o.completionOnly) {
    // `.cont-done:last-child` drops its hairline so the card can't end on a
    // divider with nothing beneath it.
    return `<div class="card cont">${doneRow}</div>`;
  }

  if (ctx.isLast) {
    return `
      <div class="card cont">
        ${doneRow}
        <div class="cont-end">
          <div class="cont-end-t">${ctx.path.label} path complete</div>
          <div class="cont-end-s">Every lesson on this path is done.</div>
        </div>
      </div>`;
  }

  const toCp = ctx.nextStep && ctx.nextStep.kind === 'checkpoint';
  // Number and label the forward step by ITS stage, not the current one — the
  // next lesson can be the first topic of the following stage.
  const nextStage = (!toCp && ctx.nextStep)
    ? getStageForTopic(state.activePath, ctx.nextStep.topic)
    : null;
  const nextNum = nextStage
    ? (nextStage.topics || []).indexOf(ctx.nextStep.topic) + 1
    : ctx.step + 1;
  const nodeMarkup = toCp
    ? `<span class="node node--cp cont-next-node--cp"><span>◆</span></span>`
    : `<span class="node cont-next-node">${nextNum}</span>`;
  const label = toCp
    ? 'Stage complete'
    : (nextStage ? `Next in ${nextStage.name}` : 'Next step');
  return `
    <div class="card cont">
      ${doneRow}
      <button class="cont-next${toCp ? ' cp' : ''}" id="path-next-step">
        ${nodeMarkup}
        <span class="cont-next-body">
          <span class="section-label">${label}</span>
          <span class="cont-next-name">${ctx.nextTopicLabel || 'Continue'}</span>
        </span>
        <span class="cont-next-go">${icon('arrowRight',16)}</span>
      </button>
    </div>`;
}

// Transient overlay shown after marking complete. Auto-dissolves via setTimeout
// scheduled in the click handler.
function renderToast(t) {
  const cls = t.kind === 'final' ? 'toast-final' : t.kind === 'audio-missing' ? 'toast-audio-missing' : 'toast-step';
  return `<div class="toast ${cls}">${t.text}</div>`;
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
  const pips = rounds.map(r => `<span class="topic-card-pip"></span>`).join('') +
               (rounds.length < 3 ? `<span class="topic-card-pip empty"></span>`.repeat(3 - rounds.length) : '');
  return `
    <div class="card topic-card" data-topic-card="${topicKey}" tabindex="0">
      <div class="topic-card-icon">${lesson.icon}</div>
      <div class="topic-card-label">${lesson.label}</div>
      <div class="topic-card-meta">${rounds.length} tier${rounds.length>1?'s':''} · ${wordCount} words</div>
      <div class="topic-card-rounds">${pips}</div>
    </div>`;
}

function renderTopicsScreen() {
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
    <div class="topics-wrap">
      ${renderPageHeader('📖', 'Topics', 'Choose a category and topic to start learning')}
      ${renderCategoryFilter()}
      ${sections}
    </div>`;
}

function renderRoundSelector(topicKey) {
  const rounds = getAvailableRounds(topicKey);
  if (rounds.length <= 1) return '';   // Hide selector if only one round
  const btns = rounds.map(r => {
    const active = state.currentRound === r;
    return `<button class="pill${active?' pill--on':''}" data-round="${r}">Tier ${r}</button>`;
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
    return `<button class="topic-btn${active?' active':''}" data-topic="${key}">${l.icon} ${l.label}</button>`;
  }).join('');
  return `<div class="topics">${btns}</div>`;
}

function renderLessonHeader(lesson) {
  const isQuiz = state.mode === 'quiz';
  // Three mutually-exclusive views: Words, Conversation, Quiz.
  // 'words' and 'convo' are state.tab values (with mode='study'); 'quiz' is mode='quiz'.
  const wordsActive = !isQuiz && state.tab === 'words';
  const convoActive = !isQuiz && state.tab === 'convo';
  // The `.tabs` / `.tab` primitive (MOCK-17-fill), shared with the phase 6 tab
  // bar. No `.icon-label` wrapper: `.tab` centres its own icon and label with a
  // 7px gap, so the wrapper would only re-declare what the primitive already
  // does. The label is a <span> to match the tab bar's markup shape — one
  // primitive should not need two markup shapes — and so the gap has a real
  // element to work against rather than an anonymous text node.
  const segTabs = `
    <div class="tabs">
      <button class="tab${wordsActive?' tab--on':''}" id="tab-words">${icon('bookOpen',15)}<span>Learn</span></button>
      <button class="tab${convoActive?' tab--on':''}" id="tab-convo">${icon('messageCircle',15)}<span>Chat</span></button>
      <button class="tab${isQuiz?' tab--on':''}" id="tab-quiz">${icon('quiz',15)}<span>Quiz</span></button>
    </div>`;
  return `
    <div class="lesson-header">
      <h2 class="lesson-title">${lesson.label}</h2>
      <div class="lesson-count">${getRoundWords(state.topic, state.currentRound).length} words</div>
    </div>
    ${segTabs}`;
}

function renderConversation() {
  const convo = activeConvoSource();
  if (!convo) return '<p class="convo-empty">No conversation for this topic yet.</p>';
  const cv = state.convo;
  const lines = convo.lines;

  // ── Control bar ──
  const gapOn    = cv.convMode === 'gap';
  const speakOn  = cv.convMode === 'speak';
  // Checkpoint consolidation convo is read + speak only (no Fill-the-Gap), to
  // keep it feeling distinct from the recall-focused Words activity.
  const inCheckpointConvo = !!(state.checkpoint && state.checkpointAct === 'convo');
  // Only show Fill-the-Gap if at least one user turn has authored opts — pre-spec
  // convos have u:true lines but no opts array, and trying to render choices for them
  // throws a TypeError that corrupts the event-listener state for the whole page.
  const hasGapLines = lines.some(l => l.u && Array.isArray(l.opts) && l.opts.length > 0);
  const gapBtnHtml = (inCheckpointConvo || !hasGapLines) ? '' : `
      <button class="convo-ctrl-btn${gapOn?' on':''}" id="gap-mode-btn">
        🧩 Fill-the-Gap
      </button>`;
  const controls = `
    <div class="convo-controls">
      <button class="convo-ctrl-btn${cv.playingLine!==null?' on':''}" id="play-all-btn">
        <span class="icon-label">${cv.playingLine!==null ? icon('stop',15) : iconPlay(14)} ${cv.playingLine!==null ? 'Stop' : 'Play All'}</span>
      </button>
      ${gapBtnHtml}
      <button class="convo-ctrl-btn${speakOn?' on':''}" id="speak-mode-btn">
        🎙 Speak
      </button>
    </div>`;

  // ── Speak mode ──
  if (speakOn) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      return `
        <div class="convo-scenario">${convo.title}</div>
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
              : `<div class="speak-heard-jp">${colorJyutping(line.j)}</div>`}
          </div>`;
        })()
      : '';

    const heard = cv.speakHeard
      ? `<div class="speak-heard">You said: <strong>${cv.speakHeard}</strong></div>`
      : '';

    const englishEl = cv.speakRevealed[step]
      ? `<div class="speak-target-en">${line.e}</div>`
      : `<div class="speak-target-en speak-eng-hint" data-speak-reveal="${step}">tap to see English</div>`;

    return `
      <div class="convo-scenario">${convo.title}</div>
      ${controls}
      <div class="speak-nav">
        <span>Line ${step+1} of ${lines.length}</span>
        <span class="speak-turn">${isUser?'🗣 Your turn':'👂 Listen'}</span>
      </div>
      <div class="speak-card">
        <div class="speak-prompt">${spkName}</div>
        <div class="speak-target-zh">${line.c}</div>
        <div class="speak-target-jp">${colorJyutping(line.j)}</div>
        ${englishEl}
        ${isUser ? `
          <button class="mic-btn ${status==='listening'?'listening':'idle'}" id="mic-btn">
            ${status==='listening'?'🔴':'🎙'}
          </button>
          <div class="speak-status">${statusText}</div>
          ${status==='listening' ? `
            <button class="speak-action-btn stop" id="speak-stop-btn">
              ⏹ Stop & Check
            </button>
          ` : ''}
          ${heard}
          ${result}
        ` : `
          <div class="speak-actions">
            <button class="speak-action-btn primary${playing?' playing':''}" id="speak-listen-btn">
              <span class="icon-label">${playing ? icon('volume',16) : iconPlay(14)} ${playing ? 'Playing…' : 'Listen'}</span>
            </button>
          </div>
        `}
        ${(isUser && (status === 'mismatch' || status === 'matched')) || !isUser ? `
        <div class="speak-actions">
          ${isUser && status === 'mismatch' ? `
            <button class="speak-action-btn secondary" id="speak-retry"><span class="icon-label">${icon('refresh',14)} Try Again</span></button>
            <button class="speak-action-btn primary" id="speak-skip"><span class="icon-label">Skip ${icon('arrowRight',14)}</span></button>
          ` : ''}
          ${(isUser && status === 'matched') || !isUser ? `
            <button class="speak-action-btn primary" id="speak-next">
              ${isLast ? "<span class=\"icon-label\">" + icon('refresh',14) + " Restart</span>" : "<span class=\"icon-label\">Next " + icon('arrowRight',14) + "</span>"}
            </button>
          ` : ''}
        </div>
        ` : ''}
      </div>
      ${isUser && status === 'idle' ? `<p class="speak-mic-note">Allow microphone access if prompted</p>` : ''}`;
  }

  // ── Read / Gap mode ──
  const bubbles = lines.map((line, i) => {
    const isUser   = line.u;
    const side     = isUser ? 'right' : 'left';
    const spkName  = isUser ? convo.speakers[1] : convo.speakers[0];
    const playing  = cv.playingLine === i;

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
              <div class="bubble bubble--gap">
                <div class="gap-prompt">👆 What would you say?</div>
                <div class="gap-options">${opts}</div>
              </div>
            </div>
          </div>`;
      } else {
        // Show answered line with result highlight
        const correct = answered === line.c;
        return `
          <div class="bubble-row ${side}">
            <div class="bubble-wrap">
              <div class="bubble-name">${spkName} ${correct?'✓':'✗'}</div>
              <div class="bubble bubble--${correct?'correct':'wrong'}">
                <div class="bubble-chinese">${line.c}</div>
                <div class="bubble-jyutping">${colorJyutping(line.j)}</div>
                <div class="bubble-english">${line.e}</div>
              </div>
            </div>
          </div>`;
      }
    }

    // Normal bubble
    const revealed = cv.bubbleRevealed[i];
    const bdOpen   = cv.breakdownOpen[i];
    const engHtml  = revealed
      ? `<div class="bubble-english">${line.e}</div>`
      : `<div class="bubble-eng-hint">tap to see English</div>`;
    const bdPanel  = (bdOpen && line.bd) ? `
      <div class="breakdown-panel">
        ${line.bd.map(w => `
          <div class="breakdown-row">
            <span class="breakdown-zh">${w.c}</span>
            <span class="breakdown-jp">${colorJyutping(w.j)}</span>
            <span class="breakdown-en">${w.e}</span>
          </div>`).join('')}
      </div>` : '';
    const bdBtn = line.bd ? `
      <button class="breakdown-btn" data-breakdown="${i}">
        ${bdOpen ? '▲ hide breakdown' : '🔍 word breakdown'}
      </button>` : '';
    return `
      <div class="bubble-row ${side}">
        <div class="bubble-wrap">
          <div class="bubble-name">${spkName}</div>
          <div class="bubble bubble--tappable${playing?' is-playing':''}" data-reveal="${i}">
            <div class="bubble-chinese">${line.c}</div>
            <div class="bubble-jyutping">${colorJyutping(line.j)}</div>
            ${engHtml}
            <div class="bubble-play-row">
              ${bdBtn}
              <button class="btn-icon btn-icon--brand btn-icon--compact bubble-play${playing?' is-playing':''}" data-bubble="${i}">
                ${playing ? icon('volume',16) : iconPlay(14)}
              </button>
            </div>
          </div>
          ${bdPanel}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="convo-scenario">${convo.title}</div>
    ${controls}
    ${bubbles}`;
}

function renderSentences(topic) {
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
      <div class="sentence-wrap">
        <div class="card sentence-card" style="margin-bottom:0">
          <div class="sentence-body">
            <div class="sentence-chinese">${s.c}</div>
            <div class="sentence-jyutping">${colorJyutping(s.j)}</div>
            <div class="sentence-reveal-line" data-sent-reveal="${i}" style="cursor:pointer">${englishEl}</div>
            ${chips}
          </div>
          <button class="btn-icon btn-icon--brand sentence-play${speaking ? ' speaking' : ''}" data-sent="${i}"
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

function renderStudy(lesson) {
  const words = getRoundWords(state.topic, state.currentRound);
  const cards = words.map((w, i) => {
    const flipped = state.flipped[i];
    const speaking = state.speaking === i;
    const inner = flipped
      ? `<div class="card-english">${w.e}</div>`
      : `<div class="card-study-inner">
           <div class="card-chinese">${w.c}</div>
           <div class="card-jyutping">${colorJyutping(w.j)}</div>
           <div class="card-hint">tap to reveal</div>
         </div>`;
    return `
      <div class="card word-card${flipped?' flipped':''}" data-card="${i}">
        ${inner}
        <button class="btn-icon btn-icon--brand speak-btn${speaking?' speaking':''}" data-speak="${i}" title="Listen">
          ${speaking ? icon('volume',20) : iconPlay(18)}
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
        ? `<div class="lesson-note">
             <div class="lesson-note-title">About this lesson</div>
             <div class="lesson-note-body">${note}</div>
           </div>`
        : '';
    })()}
    <div class="word-grid">${cards}</div>
    ${renderSentences(state.topic)}
    <div class="tone-guide">
      <h3>📖 Jyutping Tone Guide</h3>
      <div class="tone-grid">${toneRows}</div>
      <p class="tone-note">The number at the end of each syllable tells you which tone to use. Colours match throughout the app.</p>
    </div>`;
}

function renderQuiz(lesson) {
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
            <div class="card quiz-review-item">
              <button class="btn-icon btn-icon--brand quiz-review-play" data-quiz-review-play="${w.word.id}" aria-label="Listen">${iconPlay(18)}</button>
              <div class="quiz-review-body">
                <div class="quiz-review-chinese">${w.word.c}</div>
                <div class="quiz-review-jp">${colorJyutping(w.word.j)}</div>
                <div class="quiz-review-en"><span class="qr-correct">${w.word.e}</span></div>
                <div class="quiz-review-chose">You chose: <span class="qr-chosen">${chosenLabel}</span></div>
              </div>
            </div>`;
          }).join('')}
          <button class="quiz-retry-btn" id="quiz-retry-missed"><span class="icon-label">${icon('refresh',15)} Retry missed words</span></button>
        </div>`
      : '';

    return `
      <div class="result">
        <div class="result-emoji">${emoji}</div>
        <div class="result-score">${q.score} / ${q.queue.length} correct</div>
        <div class="result-msg">${msg}</div>
        <button class="back-btn" id="quiz-back"><span class="icon-label">${icon('arrowLeft',15)} Back to Lesson</span></button>
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
      <span class="quiz-count">Question ${q.idx+1} / ${q.queue.length}</span>
      <span class="quiz-score">Score: ${q.score}</span>
    </div>
    ${core.progressBar}
    ${core.dirToggle}
    ${core.promptCard}
    ${core.choiceGrid}
    ${core.answerPanel}`;
}

// ── Events ────────────────────────────────────────────────────────────────────
function attachEvents(lesson) {
  // Rings resolve their own dash length from path geometry, so they can only be
  // measured once the markup is in the DOM. Done here rather than in render():
  // render() has five separate exits and attachEvents() has early returns of its
  // own, so the top of this function is the single point every path passes.
  paintDiamondRings();

  // Nameplate → Home (DES-18). The header's only route to a top-level destination
  // when the tab bar is hidden inside a topic (§3.10), which is why it is
  // structural rather than a convenience. `replace` is false: this is a genuine
  // forward move, not an overwrite of an open drawer, so BACK returns to where
  // you were. goToDestination() no-ops when already on Home, so repeat taps
  // cannot stack identical history entries.
  const nameplate = document.getElementById('nameplate-home');
  if (nameplate) nameplate.addEventListener('click', () => {
    if (goToDestination('dashboard')) { window.scrollTo(0, 0); render(); }
  });

  // Header info ⓘ toggle — expands/collapses tone legend + speed settings
  const headerInfo = document.getElementById('header-info-toggle');
  if (headerInfo) headerInfo.addEventListener('click', () => { state.headerDetailsOpen = !state.headerDetailsOpen; render(); });

  // Settings cog → sheet. Pushes a history entry so phone BACK closes the sheet
  // rather than leaving the screen underneath — the pattern the drawer used, and
  // the reason closing routes through history rather than setting state directly.
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', () => {
    state.settingsOpen = true; pushNav(); render();
  });
  const settingsClose = document.getElementById('settings-close');
  const settingsScrim = document.getElementById('settings-scrim');
  if (settingsClose) settingsClose.addEventListener('click', () => closeSettings());
  if (settingsScrim) settingsScrim.addEventListener('click', () => closeSettings());

  // Audio speed — the sheet is now the only route to it, so this is the sole
  // writer of state.speed.
  document.querySelectorAll('[data-speed]').forEach(btn => {
    btn.addEventListener('click', () => { state.speed = btn.dataset.speed; render(); });
  });

  // Tab bar — the five top-level destinations. The reset lives in
  // goToDestination() so this and the header nameplate cannot drift.
  // `replace` is FALSE here, unlike the drawer it replaces: the drawer had its
  // own history entry to overwrite, a tab tap has nothing to overwrite and is a
  // genuine forward move, so BACK steps back through the tabs you visited.
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Tapping the tab you are already on is a no-op — no re-render, no history
      // entry. goToDestination() reports that so repeat taps cannot stack
      // identical entries and make BACK look broken.
      if (goToDestination(btn.dataset.nav)) { window.scrollTo(0, 0); render(); }
    });
  });

  document.querySelectorAll('[data-cat-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.nav = 'topics';
      state.homeView = true;
      state.selectedCategory = btn.dataset.catJump;
      state.fromPath = false;
      state.fromPathTier = null;
      pushNav();                 // a forward move, same as a tab tap
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
    stopAudioFile();
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
      stopAudioFile();
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
    stopAudioFile();
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
    state.convo.playingLine = state.convo.speakStep;
    render();
    speakConvoLine(state.convo.speakStep, () => { state.convo.playingLine = null; render(); });
  });

  // Speak: next button
  const speakNext = document.getElementById('speak-next');
  if (speakNext) speakNext.addEventListener('click', () => {
    const lines = activeConvoSource().lines;
    stopListening();
    window.speechSynthesis.cancel();
    stopAudioFile();
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
      state.convo.playingLine = i;
      render();
      speakConvoLine(i, () => { state.convo.playingLine = null; render(); });
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
      if (correct) speakConvoLine(lineIdx);
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
      speakItem('word', word.id, () => { state.speaking = null; render(); });
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
      speakItem('sentence', sentence.sid, () => { state.speaking = null; render(); });
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
    ql.addEventListener('click', () => speakItem('word', state.quiz.queue[state.quiz.idx].id));
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
        speakItem('word', cw.id);
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
          speakItem('word', state.quiz.queue[state.quiz.idx].id);
        }
      }, 900);
    }
  }

  // Replay-correct button on the wrong-answer pause panel
  const qReplay = document.getElementById('quiz-replay');
  if (qReplay && state.quiz) {
    qReplay.addEventListener('click', () => speakItem('word', state.quiz.queue[state.quiz.idx].id));
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

  // Active review question
  if (state.wordReview && !state.wordReview.done) {
    const wr = state.wordReview;
    const item = wr.queue[wr.idx];

    // Listen button (audio prompt / replay)
    const rListen = document.getElementById('review-listen');
    if (rListen) rListen.addEventListener('click', () => speakItem('word', item.word.id));

    // Choice buttons
    document.querySelectorAll('[data-review-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (wr.selected !== null && wr.selected !== undefined) return;
        const idx = parseInt(btn.dataset.reviewChoice, 10);
        const chosenOpt = wr.choices[idx];
        const cw = item.word;
        const correct = chosenOpt === cw;          // object identity, not string
        speakItem('word', cw.id);
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
    if (rReplay) rReplay.addEventListener('click', () => speakItem('word', item.word.id));

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
            speakItem('word', state.wordReview.queue[state.wordReview.idx].word.id);
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
    btn.addEventListener('click', () => speakItem('word', btn.dataset.quizReviewPlay));
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
      // The mark button is now reachable from the Quiz subtab (MOCK-12), so the
      // final-step auto-return below can fire mid-question and discard quiz
      // progress. Captured at click time because the 3s timer resolves later.
      const midQuestion = isQuizQuestionLive();
      const tier = state.fromPathTier || state.currentRound;
      // Only act if it's not already complete (defensive — the button shouldn't be visible otherwise)
      if (!isLessonComplete(state.activePath, state.topic, tier)) {
        toggleLessonComplete(state.activePath, state.topic, tier);
      }
      state.toast = ctx.isLast
        ? { text: '🎉 Path complete!', kind: 'final' }
        : { text: '✓ Step complete!',  kind: 'step'  };
      render();
      // Dissolve the toast after a beat. If it was the final step, also auto-return to the timeline.
      setTimeout(() => {
        state.toast = null;
        if (ctx.isLast && !midQuestion) {
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
      stopAudioFile();
      // Checkpoint comes next → open its hub (openCheckpoint self-pushes nav).
      if (ctx.nextStep.kind === 'checkpoint') {
        openCheckpoint(state.activePath, ctx.nextStep.stageId);
        window.scrollTo(0, 0);
        return;
      }
      state.fromPathTier = ctx.nextStep.tier;
      openPathLesson(ctx.nextStep.topic, ctx.nextStep.tier);
    });
  }

  // ── Dashboard events ──────────────────────────────────────────────
  // Hero CTA / card → opens the actual next-up item. Still carries its own copy
  // of the state reset that openPathLesson() now owns; consolidating it is a
  // dashboard change, so it is logged in BACKLOG.md rather than done here.
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
      state.wordReview = null;
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
      openPathLesson(card.dataset.pathLesson, parseInt(card.dataset.pathTier, 10) || 1);
    });
  });

  // Stage stepper — jump to a sibling topic of this stage without going back to
  // the timeline. Same opener as the timeline card, so nothing can drift.
  document.querySelectorAll('[data-stage-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      stopAudioFile();
      openPathLesson(btn.dataset.stageTopic, parseInt(btn.dataset.stageTier, 10) || 1);
    });
  });

  // Stage stepper — the checkpoint diamond at the end of the strip.
  document.querySelectorAll('[data-stage-cp]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      stopAudioFile();
      openCheckpoint(state.activePath, btn.dataset.stageCp);
      window.scrollTo(0, 0);
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
      state.checkpointAct = null; state.checkpointQuiz = null;
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
      state.checkpointAct = null; state.checkpointQuiz = null;
      window.scrollTo(0, 0);
      render();
    });
  });

  // Diagnostic "revisit topic" → open that topic's Learn tab.
  document.querySelectorAll('[data-cp-revisit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const topicKey = btn.dataset.cpRevisit;
      state.checkpoint = null; state.checkpointAct = null;
      state.checkpointQuiz = null;
      state.topic = topicKey;
      state.currentRound = 1;
      state.nav = 'topics';
      state.homeView = false;
      state.fromPath = false; state.fromPathTier = null;
      state.mode = 'study'; state.tab = 'words';
      state.flipped = {}; state.sentenceRevealed = {};
      state.sentenceNoteClosed = {};
      pushNav();
      window.scrollTo(0, 0);
      render();
    });
  });

  // Play a missed item's audio on the done screen.
  document.querySelectorAll('[data-cp-say]').forEach(btn => {
    btn.addEventListener('click', () => speakItem('word', btn.dataset.cpSay));
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
        speakItem('word', cw.id);
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
    if (cpwListen) cpwListen.addEventListener('click', () => speakItem('word', cw.id));
    const cpwReplay = document.getElementById('cpw-replay');
    if (cpwReplay) cpwReplay.addEventListener('click', () => speakItem('word', cw.id));
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
  app.innerHTML = `<div class="boot-msg">Loading…</div>`;

  try {
    await Promise.all([
      store.loadIndex(),
      store.loadCategories(),
      store.loadPaths(),
      store.loadPathConvos(),
    ]);
  } catch (err) {
    console.error('[init] reference data load failed', err);
    app.innerHTML = `<div class="boot-msg error">Couldn't load app data. Check console and reload.</div>`;
    return;
  }

  render(); // first paint with index/categories/paths available

  await refreshReviewBadge();   // populate the Word Review menu count
  render();                     // re-render so the badge shows

  // ── Back-button integration ──
  // Seed the initial history entry (the starting screen) and register the
  // popstate handler. Done once, here — NOT in attachEvents (which re-runs every
  // render and would stack duplicate listeners).
  initNavHistory();
  window.addEventListener('popstate', (e) => {
    // BACK was pressed. The browser hands back the snapshot stored for the
    // entry we moved to. Restore it and re-render.
    window.speechSynthesis.cancel();   // stop any audio when leaving a screen
    stopAudioFile();

    const snap = e.state;
    if (snap) {
      applyNavSnapshot(snap);
    } else {
      // No snapshot (we're at the very first entry) — treat as the homepage,
      // which is now the Dashboard.
      state.nav = 'dashboard';
      state.pathView = 'list';
      state.homeView = true;
      state.settingsOpen = false;
    }

    // A review session is not part of the nav snapshot, so backing out of a
    // session produces a popstate that lands on the review screen. Whenever back
    // lands on review, clear any session — back should show the LANDING screen.
    if (state.wordReview) {
      state.wordReview = null;
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
