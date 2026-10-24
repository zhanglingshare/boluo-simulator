/* 博罗 3.0 预览 · 三个内容世界的内容渲染（第一阶段验证用）。
 * 页面 <body data-world="today|towns|relations">，所有卡片的"加入"调用全局 WS。
 * 卡片来自内容库 pool.json，由 ws-layer 统一加载，本页不重复 fetch。
 * 图标统一走 WS.icon（线性 SVG），不再使用彩色 emoji。 */
(function () {
  const GRAD = {
    tourism: 'linear-gradient(135deg,#0d9488,#14b8a6)',
    food: 'linear-gradient(135deg,#d97706,#f59e0b)',
    agri: 'linear-gradient(135deg,#65a30d,#84cc16)',
    industry: 'linear-gradient(135deg,#334155,#475569)',
    livelihood: 'linear-gradient(135deg,#e11d48,#f472b6)',
    city: 'linear-gradient(135deg,#4f46e5,#818cf8)'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const I = (n, s) => (window.WS && WS.icon) ? WS.icon(n, s) : '';
  const cicon = c => (window.WS && WS.cardIcon) ? WS.cardIcon(c) : 'pin';
  function visual(c) {
    if (window.WS && WS.visual) { const v = WS.visual(c); return { g: v.grad, tag: v.tag, icon: v.icon }; }
    return { g: GRAD.city, tag: '', icon: 'pin' };
  }
  function locOf(c) { return ((c.tags && c.tags.locations) || [])[0] || ''; }
  function imgOf(c) { return (window.WS && WS.media) ? WS.media(c.id) : null; }
  function locLine(c) {
    const l = locOf(c);
    return l ? `<span class="loc-mini">${I('pin', 12)}${esc(l)}</span> · ` : '';
  }
  function addBtn(c, full) {
    const inWs = window.WS && WS.has(c.id);
    const cls = 'add-btn' + (full ? ' add-lg' : '');
    const label = inWs ? `${I('check', 15)} 已加入` : `${I('plus', 15)}${full ? ' 加入工作区' : ' 加入'}`;
    return `<button class="${cls}" data-add="${c.id}" data-full="${full ? 1 : 0}">${label}</button>`;
  }

  /* 关键指标卡：数字当主角 + 用真实数字做的迷你可视化（数字均来自博罗县2025统计公报/官方发布）。
     不再用大块灰底装饰图标。tone: up=teal / down=rose / flat=ink。 */
  const STAT_SPEC = {
    'ind-gdp': {
      icon: 'chart', value: '1005.45', unit: '亿元', tone: 'flat',
      sub: '地区生产总值 · 2025', badge: '广东首个千亿县',
      mini: { kind: 'mile', cur: 1005.45, scale: 1200, mark: 1000, markLabel: '千亿关口' }
    },
    'ind-gdp-growth': {
      icon: 'trendingUp', value: '5.5', unit: '%', tone: 'up',
      sub: '2025 按不变价同比', badge: '',
      mini: { kind: 'step', a: { v: '5.5%', l: '2025 实际' }, b: { v: '6.5–7%', l: '2026 计划' } }
    },
    'ind-fai': {
      icon: 'trendingDown', value: '-18.8', unit: '%', tone: 'down',
      sub: '2025 全社会固定资产投资', badge: '',
      mini: { kind: 'bars', cap: '降幅构成 · 2025', rows: [
        { k: '房地产开发', v: -47.6, t: 'strong' },
        { k: '工业投资', v: -12.7, t: 'mid' },
        { k: '基础设施', v: -0.3, t: 'flat' }
      ] }
    },
    'ind-visitors': {
      icon: 'mountain', value: '35.94', unit: '万人次', tone: 'up',
      sub: '2026 国庆假期 · 监测乡村旅游点', badge: '国庆同比 +10.51%',
      mini: null
    }
  };
  function statMini(m) {
    if (!m) return '';
    if (m.kind === 'bars') {
      return `<div class="mb-bars">${m.rows.map(r => {
        const w = Math.max(4, Math.abs(r.v) / 50 * 100);
        return `<div class="mb-row"><span class="mb-k">${esc(r.k)}</span><span class="mb-track"><span class="mb-fill ${r.t}" style="width:${w.toFixed(1)}%"></span></span><span class="mb-v ${r.t}">${r.v}%</span></div>`;
      }).join('')}<div class="mb-cap">${esc(m.cap || '')}</div></div>`;
    }
    if (m.kind === 'mile') {
      const w = (m.cur / m.scale * 100).toFixed(1), mp = (m.mark / m.scale * 100).toFixed(1);
      return `<div class="mb-mile"><div class="mile-track"><span class="mile-grad" style="width:${w}%"></span><span class="mile-mark" style="left:${mp}%"></span><span class="mile-dot" style="left:${w}%"></span></div><div class="mile-lbl"><span>0</span><span class="ml-k">${m.mark} · ${esc(m.markLabel)}</span></div></div>`;
    }
    if (m.kind === 'step') {
      return `<div class="mb-step"><div class="step-box real"><b>${esc(m.a.v)}</b><span>${esc(m.a.l)}</span></div><span class="step-arr">${I('arrowRight', 16)}</span><div class="step-box plan"><b>${esc(m.b.v)}</b><span>${esc(m.b.l)}</span></div></div>`;
    }
    return '';
  }
  function indicatorCardHtml(c) {
    const s = STAT_SPEC[c.id] || { icon: 'chart', value: (c.subtitle || '').replace(/^[^：:]*[：:]/, ''), unit: '', tone: 'flat', sub: '', badge: '', mini: null };
    const dir = s.tone === 'down' ? 'trendingDown' : (s.tone === 'up' ? 'trendingUp' : '');
    const yoy = (s.unit === '%' && dir) ? `<span class="stat-dir ${s.tone}">${I(dir, 14)}同比</span>` : '';
    return `<div class="stat-card tone-${s.tone}" draggable="true" data-card="${c.id}">
      <div class="stat-top"><span class="stat-ico">${I(s.icon, 19)}</span><span class="stat-name">${esc(c.title)}</span>${yoy}</div>
      <div class="stat-main"><span class="stat-value">${esc(s.value)}</span><span class="stat-unit">${esc(s.unit)}</span>
        ${s.badge ? `<span class="stat-badge">${esc(s.badge)}</span>` : ''}
        <div class="stat-sub">${esc(s.sub)}</div></div>
      <div class="stat-mini">${statMini(s.mini)}</div>
      <div class="stat-foot"><span class="src-mini">${esc(c.source)}</span>${addBtn(c, false)}</div>
    </div>`;
  }
  function indicatorFeatureHtml(c) {
    const s = STAT_SPEC[c.id] || STAT_SPEC['ind-fai'];
    return `<div class="stat-feature" draggable="true" data-card="${c.id}">
      <div class="sf-left">
        <div class="sf-name">${I(s.icon, 18)}${esc(c.title)}</div>
        <div class="sf-value tone-${s.tone}"><span class="sv">${esc(s.value)}</span><span class="su">${esc(s.unit)}</span></div>
        ${s.badge ? `<span class="stat-badge">${esc(s.badge)}</span>` : ''}
        <div class="sf-mini">${statMini(s.mini)}</div>
      </div>
      <div class="sf-right">
        <div class="f-tag">关键数据</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.summary)}</p>
        <div class="c-foot"><span class="src-mini">${esc(c.source)}</span>${addBtn(c, true)}</div>
      </div>
    </div>`;
  }

  function cardHtml(c) {
    const v = visual(c), img = imgOf(c);
    return `<div class="card" draggable="true" data-card="${c.id}">
      <div class="c-thumb"${img ? '' : ` style="background:${v.g}"`}>
        <span class="ctag">${v.tag}</span>${img
          ? `<img class="thumb-img" src="${img}" alt="${esc(c.title)}">`
          : `<span class="thumb-ico">${I(cicon(c), 42)}</span>`}
      </div>
      <div class="c-body">
        <div class="ct">${esc(c.title)}</div>
        <div class="cs">${locLine(c)}${esc(c.subtitle || '')}</div>
        <div class="c-foot">
          <span class="src-mini">${esc(c.source || (c.type === 'town' ? '博罗行政区划' : '内容库'))}</span>
          ${addBtn(c, false)}
        </div>
      </div>
    </div>`;
  }
  function featureHtml(c) {
    const v = visual(c), img = imgOf(c);
    return `<div class="feature" draggable="true" data-card="${c.id}">
      <div class="f-visual"${img ? '' : ` style="background:${v.g}"`}>
        <span class="note">${img ? `${I('sparkles', 11)} AI 概念插画` : '主题示意 · 实拍图待授权'}</span>${img
          ? `<img class="thumb-img" src="${img}" alt="${esc(c.title)}">`
          : `<span class="f-ico">${I(cicon(c), 64)}</span>`}
      </div>
      <div class="f-body">
        <div class="f-tag">${v.tag}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.summary || c.subtitle || '')}</p>
        <div class="c-foot">
          <span class="src-mini">${locLine(c)}${esc(c.source || '内容库')}</span>
          ${addBtn(c, true)}
        </div>
      </div>
    </div>`;
  }

  function refreshButtons() {
    document.querySelectorAll('.add-btn[data-add]').forEach(b => {
      const id = b.dataset.add;
      const inWs = window.WS && WS.has(id);
      const full = b.dataset.full === '1';
      b.classList.toggle('in', !!inWs);
      b.innerHTML = inWs ? `${I('check', 15)} 已加入` : `${I('plus', 15)}${full ? ' 加入工作区' : ' 加入'}`;
    });
  }

  function render(world, cards) {
    const has = id => cards.some(c => c.id === id);
    const card = id => cards.find(c => c.id === id);
    let featureId, gridTypes, gridTitle;
    if (world === 'today') {
      featureId = has('news-20261016-tuolai') ? 'news-20261016-tuolai' : (cards.find(c => c.type === 'news') || {}).id;
      gridTypes = ['news', 'indicator', 'veg'];
      gridTitle = '今天的博罗 · 新鲜事与关键数';
    } else if (world === 'towns') {
      featureId = 'mod-baitang-tea';
      gridTypes = ['module', 'town'];
      gridTitle = '16 个镇街 · 从一碗茶、一座山开始';
    } else {
      featureId = 'ind-fai';
      gridTypes = ['indicator', 'news'];
      gridTitle = '把这些放进工作区，看看它们之间的关系';
    }
    const f = card(featureId);
    const grid = cards
      .filter(c => gridTypes.includes(c.type) && c.id !== featureId)
      .sort((a, b) => (imgOf(b) ? 1 : 0) - (imgOf(a) ? 1 : 0));
    document.getElementById('feature').innerHTML = f
      ? (f.type === 'indicator' ? indicatorFeatureHtml(f) : featureHtml(f)) : '';
    document.getElementById('gridTitle').textContent = gridTitle;
    document.getElementById('grid').innerHTML = grid.map(c =>
      c.type === 'indicator' ? indicatorCardHtml(c) : cardHtml(c)).join('');
    bind();
  }

  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-add]');
      if (!b || !window.WS) return;
      e.preventDefault();
      WS.add(b.dataset.add);
    });
    document.addEventListener('dragstart', e => {
      const card = e.target.closest('[data-card]');
      if (card && e.dataTransfer) { e.dataTransfer.setData('text/ws-id', card.dataset.card); e.dataTransfer.effectAllowed = 'copy'; }
    });
    if (window.WS) WS.on('change', refreshButtons);
  }

  function boot() {
    if (!window.WS) { setTimeout(boot, 120); return; }
    WS.ready.then(() => {
      const world = document.body.dataset.world || 'today';
      render(world, WS.cards());
      WS.on('change', refreshButtons);
    });
  }
  boot();
})();
