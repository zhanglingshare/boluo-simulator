/* 博罗 3.0 预览 · 三个内容世界的内容渲染（第一阶段验证用）。
 * 页面 <body data-world="today|towns|relations">，所有卡片的"加入"调用全局 WS。
 * 卡片来自内容库 pool.json，由 ws-layer 统一加载，本页不重复 fetch。 */
(function () {
  const GRAD = {
    tourism: 'linear-gradient(135deg,#0d9488,#14b8a6)',
    food: 'linear-gradient(135deg,#d97706,#f59e0b)',
    agri: 'linear-gradient(135deg,#65a30d,#84cc16)',
    industry: 'linear-gradient(135deg,#334155,#475569)',
    livelihood: 'linear-gradient(135deg,#e11d48,#f472b6)',
    city: 'linear-gradient(135deg,#4f46e5,#818cf8)'
  };
  const CAT_NAME = { industry: '产业经济', livelihood: '民生', city: '城市', tourism: '文旅', food: '美食', agri: '农产' };
  const CAT_EMOJI = { industry: '🏭', livelihood: '🧸', city: '🏙️', tourism: '⛰️', food: '🍲', agri: '🌾' };
  const TYPE_EMOJI = { news: '📰', town: '🏘️', module: '✨', indicator: '📉', veg: '🥬', event: '📅' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  function visual(c) {
    const cat = (c.tags && c.tags.category) || 'city';
    if (c.type === 'town') return { g: GRAD.tourism, tag: '🏘️ 镇街' };
    if (c.type === 'indicator') return { g: GRAD.industry, tag: '📊 指标' };
    if (c.type === 'veg') return { g: GRAD.agri, tag: '🥬 当季农品' };
    if (c.type === 'module') return { g: GRAD[cat] || GRAD.tourism, tag: '✨ ' + (CAT_NAME[cat] || '富模块') };
    return { g: GRAD[cat] || GRAD.city, tag: (CAT_EMOJI[cat] || '📌') + ' ' + (CAT_NAME[cat] || '资讯') };
  }
  function locOf(c) { return ((c.tags && c.tags.locations) || [])[0] || ''; }

  function cardHtml(c) {
    const v = visual(c);
    return `<div class="card" draggable="true" data-card="${c.id}">
      <div class="c-thumb" style="background:${v.g}">
        <span class="ctag">${v.tag}</span><span>${TYPE_EMOJI[c.type] || '📌'}</span>
      </div>
      <div class="c-body">
        <div class="ct">${esc(c.title)}</div>
        <div class="cs">${locOf(c) ? '📍' + esc(locOf(c)) + ' · ' : ''}${esc(c.subtitle || '')}</div>
        <div class="c-foot">
          <span class="src-mini">${esc(c.source || (c.type === 'town' ? '博罗行政区划' : '内容库'))}</span>
          <button class="add-btn" data-add="${c.id}">${window.WS && WS.has(c.id) ? '✓ 已加入' : '＋ 加入'}</button>
        </div>
      </div>
    </div>`;
  }
  function featureHtml(c) {
    const v = visual(c);
    return `<div class="feature" draggable="true" data-card="${c.id}">
      <div class="f-visual" style="background:${v.g}">
        <span class="note">🎨 主题示意 · 实拍图待授权</span><span>${TYPE_EMOJI[c.type] || '📌'}</span>
      </div>
      <div class="f-body">
        <div class="f-tag">${v.tag}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.summary || c.subtitle || '')}</p>
        <div class="c-foot">
          <span class="src-mini">${locOf(c) ? '📍' + esc(locOf(c)) + ' · ' : ''}${esc(c.source || '内容库')}</span>
          <button class="add-btn" data-add="${c.id}" style="padding:10px 22px">${window.WS && WS.has(c.id) ? '✓ 已加入' : '＋ 加入工作区'}</button>
        </div>
      </div>
    </div>`;
  }

  function refreshButtons() {
    document.querySelectorAll('[data-add]').forEach(b => {
      const id = b.dataset.add;
      const inWs = window.WS && WS.has(id);
      b.classList.toggle('in', !!inWs);
      b.textContent = inWs ? '✓ 已加入' : (b.classList.contains('add-btn') && b.style.padding ? '＋ 加入工作区' : '＋ 加入');
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
    const grid = cards.filter(c => gridTypes.includes(c.type) && c.id !== featureId);
    document.getElementById('feature').innerHTML = f ? featureHtml(f) : '';
    document.getElementById('gridTitle').textContent = gridTitle;
    document.getElementById('grid').innerHTML = grid.map(cardHtml).join('');
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
