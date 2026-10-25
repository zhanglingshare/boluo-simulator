/* ============================================================
 * 博罗3.0 · 城市读心术 · 判断闭环（experience/play）
 * 数据只读 intelligence/intel-data.js（由 JSON 编译）；前台不调用任何在线 AI。
 * 状态仅存本机 localStorage（boluo-judgments-v1），不进云端、不冒充互动。
 * ============================================================ */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  const D = window.BOLUO_INTEL;
  if (!D) {
    document.body.innerHTML = '<div style="padding:40px;color:#fff;font-family:sans-serif">情报数据未加载（intel-data.js 缺失）。请确认 intelligence/ 目录完整。</div>';
    return;
  }

  const TOPIC_ID = 'boluo-investment-decline-2025';
  const EMAIL = '68588368@qq.com';
  const LS_KEY = 'boluo-judgments-v1';
  const REAL_FAI = -18.8;

  const topic = D.topics.topics.find(t => t.topic_id === TOPIC_ID);
  const evById = {};
  D.evidence.evidence.forEach(e => { evById[e.evidence_id] = e; });
  // 叙事顺序：先看当期（乐观）→ 再看前瞻（谨慎）→ 结构拆解 → 审慎证据（元判断收尾）
  const POS_ORDER = ['vp-prod-current', 'vp-pipeline-ahead', 'vp-structure-split', 'vp-evidence-thin'];
  const positions = D.viewpoints.viewpoints
    .filter(v => v.topic_id === TOPIC_ID)
    .sort((a, b) => POS_ORDER.indexOf(a.viewpoint_id) - POS_ORDER.indexOf(b.viewpoint_id));
  const watch = D.watchlist.watchlist.filter(w => w.topic_id === TOPIC_ID);

  const INSTINCT_LABEL = {
    cycle: '投资有起伏，问题不大',
    realestate: '主要是房地产在拖累',
    gap: '新动能没接上，要警惕',
    unknown: '我没概念，想看分析'
  };
  const VERDICT_LABEL = { hold: '坚持原来的看法', adjust: '部分修正', change: '改判了' };

  const state = {
    guess: 0, instinct: null, confidence: null,
    nowPos: null, verdict: null, reason: '',
    createdAt: new Date().toISOString()
  };

  /* ---------- 判断挑战：URL 只编码选择题选项，绝不编码理由/姓名/联系方式 ----------
   * 码格式 g.n.k.p.d：猜测值 / 直觉 / 信心 / 最终立场序号 / 最终动作。
   * 全部为枚举或区间整数，白名单校验，非法一律丢弃。 */
  const INSTINCT_CODE = { cycle: 'C', realestate: 'R', gap: 'G', unknown: 'U' };
  const INSTINCT_FROM = { C: 'cycle', R: 'realestate', G: 'gap', U: 'unknown' };
  const VERDICT_CODE = { hold: 'H', adjust: 'A', change: 'X' };
  const VERDICT_FROM = { H: 'hold', A: 'adjust', X: 'change' };
  function encodeChallenge() {
    const pi = POS_ORDER.indexOf(state.nowPos);
    if (pi < 0 || !state.verdict) return null;
    const g = Number.isFinite(state.guess) ? Math.round(state.guess) : '';
    const n = state.instinct ? INSTINCT_CODE[state.instinct] : '';
    const k = state.confidence ? String(state.confidence) : '';
    return [g, n, k, pi, VERDICT_CODE[state.verdict]].join('.');
  }
  function decodeChallenge(s) {
    if (!s) return null;
    const parts = String(s).split('.');
    if (parts.length !== 5) return null;
    try {
      const g = parts[0] === '' ? null : Number(parts[0]);
      if (g === null || !Number.isInteger(g) || g < -50 || g > 10) return null;
      const n = parts[1] ? (INSTINCT_FROM[parts[1]] || null) : null;
      if (parts[1] && !n) return null;
      const k = parts[2] ? Number(parts[2]) : null;
      if (k !== null && (!Number.isInteger(k) || k < 1 || k > 5)) return null;
      const p = Number(parts[3]);
      if (!Number.isInteger(p) || p < 0 || p >= POS_ORDER.length) return null;
      const dv = VERDICT_FROM[parts[4]];
      if (!dv) return null;
      return { guess: g, instinct: n, confidence: k, position_id: POS_ORDER[p], verdict: dv };
    } catch (e) { return null; }
  }
  const CHALLENGE = decodeChallenge(new URLSearchParams(location.search).get('c'));

  /* ---------- 屏幕切换与进度 ---------- */
  const TOTAL = 5;
  function go(n) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    $$('.screen').forEach(s => s.classList.toggle('on', +s.dataset.screen === n));
    $$('.step').forEach(st => {
      const idx = +st.dataset.s;
      st.classList.toggle('on', idx === n);
      st.classList.toggle('done', idx < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (n === 3) renderReveal();
    if (n === 4) renderJudgmentCard();
  }
  document.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) go(+goBtn.dataset.go);
  });

  /* ---------- 第1步：先猜 ---------- */
  const range = $('#faiRange'), guessNum = $('#guessNum');
  function fmtPct(n) { return (n > 0 ? '+' : '') + n + '%'; }
  function paintGuess() {
    guessNum.textContent = fmtPct(state.guess);
    guessNum.style.color = state.guess < 0 ? 'var(--red)' : state.guess > 0 ? 'var(--green)' : 'var(--gold)';
  }
  range.addEventListener('input', () => { state.guess = +range.value; paintGuess(); });

  function bindSingle(containerSel, key, after) {
    const box = $(containerSel);
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      box.querySelectorAll('button').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      state[key] = b.dataset.v || +b.dataset.c;
      if (after) after();
    });
  }
  bindSingle('#instinctChoices', 'instinct');
  bindSingle('#confidence', 'confidence');
  bindSingle('#verdict', 'verdict', renderJudgmentCard);

  $('#toPositions').addEventListener('click', () => {
    if (!state.instinct) { alert('先选一个你的第一反应（哪怕选“我没概念”）。'); return; }
    if (!state.confidence) { alert('点一下你的信心分值（1–5）。'); return; }
    state.frozenAt = new Date().toISOString();
    go(2);
  });

  /* ---------- 第2步：立场研判 ---------- */
  const REL_LABEL = { A: '统计公报', B: '部门发布', C: '媒体', D: '推测' };
  function evLine(id, dir) {
    const e = evById[id];
    if (!e) return '';
    const dot = dir === 'up' ? 'up' : 'down';
    const src = e.url
      ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.source)} ↗</a>`
      : esc(e.source);
    return `<li class="ev"><span class="ev-dot ${dot}"></span>
      <span>${esc(e.statement)}<br><span class="ev-rel">${REL_LABEL[e.reliability] || '来源'}</span>&nbsp;${src}</span></li>`;
  }
  function posCard(v) {
    const sup = v.support_evidence_ids.map(id => evLine(id, 'up')).join('');
    const con = v.contradict_evidence_ids.map(id => evLine(id, 'down')).join('');
    const tests = (v.discriminating_tests || []).map(wid => {
      const w = D.watchlist.watchlist.find(x => x.watch_id === wid);
      return w ? `<div class="wl"><span class="wl-dot"></span><span><b>${esc(w.metric)}</b>（${esc(w.next_release)}揭晓）</span></div>` : '';
    }).join('');
    const confPct = { '高': 92, '中高': 72, '中': 52, '低': 28 }[v.confidence] || 50;
    return `<article class="pos" data-id="${v.viewpoint_id}">
      <div class="pos-head">
        <div class="pos-bar" style="background:${v.color}"></div>
        <div class="pos-main">
          <div class="pos-name">${esc(v.position_archetype)}</div>
          <div class="pos-headline">${esc(v.archetype_headline)}</div>
        </div>
        <span class="pos-badge">置信度 ${esc(v.confidence)}</span>
        <span class="pos-chev"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
      </div>
      <div class="pos-body">
        <div class="conf-row"><span class="conf-txt" style="margin:0">置信度</span><div class="conf-meter"><i style="width:${confPct}%"></i></div><span class="conf-txt">${esc(v.confidence)}</span></div>
        <div class="pos-block"><div class="pos-block-t">结构位置</div><p>${esc(v.structural_position)}</p></div>
        <div class="pos-block"><div class="pos-block-t">他能看到的信息</div><p>${esc(v.information_environment)}</p></div>
        <div class="pos-block"><div class="pos-block-t">核心主张</div><p>${esc(v.claim)}</p></div>
        ${sup ? `<div class="pos-block"><div class="pos-block-t">支持依据</div><ul class="ev-list">${sup}</ul></div>` : ''}
        ${con ? `<div class="pos-block"><div class="pos-block-t">削弱它的证据</div><ul class="ev-list">${con}</ul></div>` : ''}
        <div class="pos-block"><div class="pos-block-t">认知盲区</div><p>${esc(v.blind_spot)}</p></div>
        ${tests ? `<div class="pos-block"><div class="pos-block-t">什么会让他改变</div><div class="jc-watch">${tests}</div></div>` : ''}
      </div>
    </article>`;
  }
  $('#positions').innerHTML = positions.map(posCard).join('');
  $('#positions').addEventListener('click', e => {
    const head = e.target.closest('.pos-head');
    if (!head) return;
    head.parentElement.classList.toggle('open');
  });

  /* 第4步“现在立场”选项 */
  $('#nowPositions').innerHTML = positions.map(v =>
    `<button class="choice" data-v="${v.viewpoint_id}">${esc(v.position_archetype)}：${esc(v.archetype_headline)}</button>`
  ).join('');
  $('#nowPositions').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $('#nowPositions').querySelectorAll('button').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    state.nowPos = b.dataset.v;
    renderJudgmentCard();
  });

  /* ---------- 第3步：数据揭晓 ---------- */
  function renderReveal() {
    $('#youNum').textContent = fmtPct(state.guess);
    const gap = +(state.guess - REAL_FAI).toFixed(1);
    const banner = $('#gapBanner');
    if (Math.abs(gap) <= 3) {
      banner.textContent = `几乎命中！你猜${fmtPct(state.guess)}，真实−18.8%，只差 ${Math.abs(gap)} 个百分点。`;
    } else if (gap > 0) {
      banner.textContent = `你把投资想浅了——真实降幅比你猜的深 ${gap} 个百分点。（猜 ${fmtPct(state.guess)}，真实 −18.8%）`;
    } else {
      banner.textContent = `你把投资想深了——真实降幅比你猜的浅 ${Math.abs(gap)} 个百分点。（猜 ${fmtPct(state.guess)}，真实 −18.8%）`;
    }
    const pickIds = ['ev-fai-2025', 'ev-realestate-2025', 'ev-industrial-invest-scale', 'ev-ind-value-2025'];
    const tone = {
      'ev-fai-2025': ['down', '▼'],
      'ev-realestate-2025': ['down', '▼'],
      'ev-industrial-invest-scale': ['up', '●'],
      'ev-ind-value-2025': ['up', '▲']
    };
    $('#revealFacts').innerHTML = pickIds.map(id => {
      const e = evById[id];
      const [t, ic] = tone[id];
      return `<li><span class="fi ${t}">${ic}</span>
        <span>${esc(e.statement)}<br><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.source)} ↗</a></span></li>`;
    }).join('');
  }

  /* ---------- 第4步：判断卡 ---------- */
  $('#myReason').addEventListener('input', e => { state.reason = e.target.value; renderJudgmentCard(); });
  function posName(id) { const v = positions.find(x => x.viewpoint_id === id); return v ? v.position_archetype : null; }

  function renderJudgmentCard() {
    $('#jcTopic').textContent = topic ? topic.title : '';
    $('#jcGuess').textContent =
      `固投 ${fmtPct(state.guess)} · 信心 ${state.confidence || '?'}/5${state.instinct ? ' · “' + INSTINCT_LABEL[state.instinct] + '”' : ''}`;
    const pn = posName(state.nowPos);
    $('#jcPos').textContent = pn || '（待选）';
    $('#jcVerdict').textContent = state.verdict ? VERDICT_LABEL[state.verdict] : '（待选）';
    $('#jcReason').textContent = state.reason.trim() || '—';
    $('#jcWatch').innerHTML = watch.slice(0, 2).map(w =>
      `<div class="wl"><span class="wl-dot"></span><span>${esc(w.metric)}（${esc(w.next_release)}）</span></div>`
    ).join('');
    renderVS();
  }

  /* ---------- 挑战对比：挑战者答完后与发起者逐项对照（只比较选项，不评判谁对） ---------- */
  function renderVS() {
    const box = $('#vsBox');
    if (!CHALLENGE || !state.nowPos || !state.verdict) { box.hidden = true; return; }
    const ta = CHALLENGE;
    const taInstinct = ta.instinct ? INSTINCT_LABEL[ta.instinct] : '没标';
    const meInstinct = state.instinct ? INSTINCT_LABEL[state.instinct] : '没标';
    const taConf = ta.confidence ? ta.confidence + '/5' : '没标';
    const meConf = state.confidence ? state.confidence + '/5' : '没标';
    const rows = [
      { lbl: '对固投的第一猜测', tv: fmtPct(ta.guess), mv: fmtPct(state.guess), same: ta.guess === state.guess },
      { lbl: '最初的直觉', tv: taInstinct, mv: meInstinct, same: (ta.instinct || '') === (state.instinct || '') },
      { lbl: '当时的把握', tv: taConf, mv: meConf, same: (ta.confidence || 0) === (state.confidence || 0) },
      { lbl: '最终更接近', tv: posName(ta.position_id) || '—', mv: posName(state.nowPos) || '—', same: ta.position_id === state.nowPos },
      { lbl: '最终动作', tv: VERDICT_LABEL[ta.verdict], mv: VERDICT_LABEL[state.verdict], same: ta.verdict === state.verdict }
    ];
    const posSame = ta.position_id === state.nowPos;
    const actSame = ta.verdict === state.verdict;
    const head = posSame && actSame ? '你们最终落在了同一个判断上'
      : posSame ? '视角相同，但你们修正的程度不一样'
      : actSame ? '动作相近，但你们看问题的视角不同'
      : `你们的分歧，主要在「${posName(ta.position_id)}」与「${posName(state.nowPos)}」之间`;
    box.innerHTML = `
      <div class="vs-head">
        <div class="vs-title">你和发起者的判断</div>
        <div class="vs-cols"><span>TA</span><span>你</span></div>
      </div>
      ${rows.map(r => `
        <div class="vs-row ${r.same ? 'same' : 'diff'}">
          <div class="vs-lbl">${r.lbl}</div>
          <div class="vs-ta">${esc(r.tv)}</div>
          <div class="vs-me"><span>${esc(r.mv)}</span><i class="vs-mark ${r.same ? 'm-same' : 'm-diff'}">${r.same ? '一致' : '不同'}</i></div>
        </div>`).join('')}
      <div class="vs-concl">
        <b>${esc(head)}</b>
        <p>现在还没有标准答案——2026 年一季度数据发布后，再看谁的判断更接近。想把回合打回去？勾选下方“让朋友答完后和我对比”，再点「生成挑战链接」。</p>
      </div>`;
    box.hidden = false;
  }

  function cardText() {
    const pn = posName(state.nowPos) || '（未选）';
    const lines = [
      '【博罗 · 城市读心术｜我的判断卡】',
      '议题：' + (topic ? topic.title : ''),
      '我最初猜：固定资产投资 ' + fmtPct(state.guess) + '，倾向“' + (INSTINCT_LABEL[state.instinct] || '未选') + '”，信心 ' + (state.confidence || '?') + '/5',
      '真实公报：固定资产投资 −18.8%（房地产 −47.6%，工业投资仍超230亿、占比约60%，同期规上工业增加值 +8.7%）',
      '我现在更接近：' + pn,
      '我的判断：' + (state.verdict ? VERDICT_LABEL[state.verdict] : '未选'),
      '我的理由：' + (state.reason.trim() || '—'),
      '什么会让我重新判断：2026年一季度工业增加值与工业投资增速（2026年4月发布）',
      '——基于公开统计的分析估计，非民意调查、非真人发言'
    ];
    return lines.join('\n');
  }

  function save() {
    const rec = {
      v: 1,
      judgment_id: 'jud-' + Date.now().toString(36),
      topic_id: TOPIC_ID,
      created_at: state.createdAt,
      saved_at: new Date().toISOString(),
      initial: { guess: state.guess, instinct: state.instinct, confidence: state.confidence },
      current: { position_id: state.nowPos, verdict: state.verdict, reason: state.reason.trim() }
    };
    try {
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || 'null') || { v: 1, history: [] };
      prev.history = prev.history || [];
      prev.history.push(rec);
      prev.current = rec;
      localStorage.setItem(LS_KEY, JSON.stringify(prev));
      return true;
    } catch (e) { return false; }
  }

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#0E7C70;color:#fff;padding:12px 22px;border-radius:12px;font-size:14px;font-weight:600;z-index:99;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:88vw;text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._t); t._t = setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2400);
  }

  $('#saveCard').addEventListener('click', () => {
    if (!state.nowPos || !state.verdict) { alert('先在上方选一个“现在最接近的立场”和“我的判断”，判断卡才完整。'); return; }
    const ok = save();
    const includeMe = $('#includeMe').checked;
    let shareUrl = location.origin + location.pathname + '?topic=' + TOPIC_ID;
    if (includeMe) {
      const code = encodeChallenge();
      if (code) shareUrl += '&c=' + encodeURIComponent(code);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => fallbackCopy(shareUrl));
    } else fallbackCopy(shareUrl);
    const tip = includeMe
      ? '已保存，含你选择的挑战链接已复制：朋友答完会和你对比'
      : '已保存，空白挑战题链接已复制：朋友将先独立作答';
    toast(ok ? tip : '保存失败（可能禁用了本地存储），但链接已复制，可直接发给朋友。');
  });

  /* ---------- 导出海报（原生 Canvas，零外部依赖） ---------- */
  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function wrapText(c, text, x, y, maxW, lh, maxLines) {
    let line = '', lines = [];
    for (const ch of String(text == null ? '' : text)) {
      if (c.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
    }
    lines.forEach((l, i) => c.fillText(l, x, y + i * lh));
    return lines.length;
  }

  function exportCardImage() {
    if (!state.nowPos || !state.verdict) {
      alert('先在上方选一个“现在最接近的立场”和“我的判断”，卡片才完整。');
      return;
    }
    const W = 750, pad = 46, inner = W - pad * 2;
    const FONT = "'PingFang SC','Microsoft YaHei','Hiragino Sans GB',sans-serif";
    const GOLD = '#E8B454', RED = '#E5544B', TEAL = '#10a08f', INK = '#EAF2F0', INK2 = '#A8BBB6', INK3 = '#7E928C';
    const cv = document.createElement('canvas');
    const c = cv.getContext('2d');
    cv.width = W;
    const font = (w, s) => { c.font = `${w} ${s}px ${FONT}`; };
    const countLines = (t, maxW) => {
      let line = '', n = 0;
      for (const ch of String(t == null ? '' : t)) {
        if (c.measureText(line + ch).width > maxW && line) { n++; line = ch; }
        else line += ch;
      }
      if (line) n++;
      return n;
    };

    const rows = [
      { k: '我最初猜', v: `固投 ${fmtPct(state.guess)} · 信心 ${state.confidence || '?'}/5${state.instinct ? ' · “' + INSTINCT_LABEL[state.instinct] + '”' : ''}`, col: INK, max: 2 },
      { k: '真实公报', v: '固投 −18.8%（房地产 −47.6%，工业投资仍超230亿、占比约60%）', col: RED, max: 2 },
      { k: '我现在更接近', v: posName(state.nowPos) || '（未选）', col: INK, max: 2 },
      { k: '我的判断', v: state.verdict ? VERDICT_LABEL[state.verdict] : '未选', col: TEAL, max: 1 },
      { k: '我的理由', v: state.reason.trim() || '—', col: INK2, max: 4 }
    ];
    const witems = watch.slice(0, 2);

    // —— 布局（测量与绘制共用同一组坐标，保证不重叠）——
    font('700', 22);
    const nRows = rows.map(r => Math.max(1, Math.min(r.max, countLines(r.v, inner - 60))));
    font('800', 27);
    const tl = Math.max(1, Math.min(2, countLines(topic.title, inner)));
    const brandY = 66;
    const titleY = brandY + 58;
    const subY = titleY + tl * 40 + 34;
    const cardTop = subY + 42;
    const cardH = 30 + nRows.reduce((s, n) => s + (26 + n * 30 + 20), 0) + 8;
    const watchTitleY = cardTop + cardH + 46;
    let wy0 = watchTitleY + 32;
    font('500', 16);
    const nW = witems.map(w => Math.max(1, Math.min(2, countLines(`${w.metric}（${w.next_release}）`, inner - 18))));
    wy0 += nW.reduce((s, n) => s + n * 24 + 10, 0);
    const footY = wy0 + 26, foot2Y = footY + 26;
    const H = Math.ceil(foot2Y + 42);

    // —— 高 DPI 渲染 ——
    const DPR = 2;
    cv.width = W * DPR; cv.height = H * DPR;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#14303c'); bg.addColorStop(.42, '#0E1E28'); bg.addColorStop(1, '#0A1620');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W / 2, 10, 10, W / 2, 10, 380);
    glow.addColorStop(0, 'rgba(232,180,84,.20)'); glow.addColorStop(.5, 'rgba(14,124,112,.08)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, 460);
    c.strokeStyle = 'rgba(232,180,84,.28)'; c.lineWidth = 1.5;
    roundRect(c, 12, 12, W - 24, H - 24, 24); c.stroke();

    c.textAlign = 'center';
    font('700', 21); c.fillStyle = GOLD;
    c.fillText('博罗 · 城市读心术', W / 2, brandY);
    const lg = c.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
    lg.addColorStop(0, 'rgba(232,180,84,0)'); lg.addColorStop(.5, 'rgba(232,180,84,.7)'); lg.addColorStop(1, 'rgba(232,180,84,0)');
    c.strokeStyle = lg; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(W / 2 - 110, brandY + 22); c.lineTo(W / 2 + 110, brandY + 22); c.stroke();
    font('800', 27); c.fillStyle = INK;
    wrapText(c, topic.title, W / 2, titleY, inner, 40, 2);
    font('500', 17); c.fillStyle = INK2;
    c.fillText(CHALLENGE ? '我的判断卡 · 回应一次判断挑战' : '我的判断卡 · 2025年固投议题', W / 2, subY);

    c.fillStyle = 'rgba(255,255,255,.045)';
    roundRect(c, pad, cardTop, inner, cardH, 18); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 1;
    roundRect(c, pad, cardTop, inner, cardH, 18); c.stroke();
    let ry = cardTop + 30;
    c.textAlign = 'left';
    rows.forEach((r, i) => {
      if (i > 0) { c.strokeStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(pad + 30, ry - 6); c.lineTo(pad + inner - 30, ry - 6); c.stroke(); }
      font('700', 15); c.fillStyle = GOLD;
      c.fillText(r.k, pad + 30, ry + 14);
      ry += 26;
      font('700', 22); c.fillStyle = r.col;
      ry += wrapText(c, r.v, pad + 30, ry + 14, inner - 60, 30, nRows[i]) * 30;
      ry += 20;
    });

    font('700', 17); c.fillStyle = GOLD;
    c.fillText('什么会让我重新判断', pad, watchTitleY);
    let wy = watchTitleY + 32;
    font('500', 16);
    witems.forEach((w, i) => {
      c.beginPath(); c.arc(pad + 4, wy - 6, 4, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill();
      c.fillStyle = INK2;
      wy += wrapText(c, `${w.metric}（${w.next_release}）`, pad + 18, wy, inner - 18, 24, nW[i]) * 24;
      wy += 10;
    });

    c.textAlign = 'center';
    font('500', 14); c.fillStyle = INK3;
    c.fillText('基于公开统计的分析估计 · 非民意调查 · 非真人发言', W / 2, footY);
    font('500', 13);
    c.fillText('2026年4月一季度数据发布后，回来验证', W / 2, foot2Y);

    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'boluo-card-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast('卡片图已生成，正在下载');
    }, 'image/png');
  }
  $('#downloadCard').addEventListener('click', exportCardImage);

  $('#copyCard').addEventListener('click', () => {
    const text = cardText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('判断卡文字已复制，可直接粘贴分享')).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  });
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('判断卡文字已复制'); }
    catch (e) { prompt('复制以下内容：', text); }
    document.body.removeChild(ta);
  }

  $('#submitCard').addEventListener('click', () => {
    const subject = '【博罗观点投稿】GDP破千亿投资却下降18.8%｜' + TOPIC_ID;
    const body = [
      '议题：' + (topic ? topic.title : ''),
      '我的观点（现在更接近：' + (posName(state.nowPos) || '待补充') + '）：',
      '我为什么这样认为：' + (state.reason.trim() || '（请补充）'),
      '我最初的判断：' + fmtPct(state.guess) + '，' + (INSTINCT_LABEL[state.instinct] || ''),
      '相关事实或数据来源（可附网页链接）：',
      '是否愿意公开展示（愿意/不愿意）：',
      '希望匿名还是署名（匿名/署名）：',
      '联系方式（可选，仅用于联系，不公开）：',
      '',
      '——本邮件由本人在“博罗·城市读心术”生成后主动确认发送。'
    ].join('\n');
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  $('#fifthBtn').addEventListener('click', () => {
    const subject = '【博罗观点投稿】第五种观点｜' + TOPIC_ID;
    const body = '议题：' + (topic ? topic.title : '') + '\n我的第五种解释：\n我为什么这样认为：\n相关事实或网页来源：\n是否愿意公开展示：\n希望匿名还是署名：\n联系方式（可选）：';
    window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  $('#restart').addEventListener('click', () => {
    if (!confirm('重新开始？当前页上未保存的判断会清空（已保存的历史仍在本机）。')) return;
    state.guess = 0; state.instinct = null; state.confidence = null;
    state.nowPos = null; state.verdict = null; state.reason = '';
    state.createdAt = new Date().toISOString();
    range.value = 0; paintGuess();
    $('#myReason').value = '';
    ['#instinctChoices', '#confidence', '#nowPositions', '#verdict'].forEach(s =>
      $$(s + ' button').forEach(b => b.classList.remove('sel')));
    go(0);
  });

  /* 初始化：挑战模式开场提示（不剧透发起者答案） */
  if (CHALLENGE) $('#challengeBanner').hidden = false;
  paintGuess();
  go(0);
})();
