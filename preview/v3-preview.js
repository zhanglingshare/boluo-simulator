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
