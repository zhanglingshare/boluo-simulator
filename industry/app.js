(function () {
  'use strict';
  const D = window.IndustryData, E = window.IndustryEngine;
  const main = document.getElementById('main');
  const STORE = 'boluo-industry-state-v1', RECORDS = 'boluo-industry-records-v1';
  const ORIGINAL = 'https://zhanglingshare.github.io/boluo-simulator/';
  const VIEWS = [['home','进入产业','grid'],['graph','看关系','network'],['changes','找变化','activity'],['trial','试条件','flask'],['bridges','可选连接','link'],['records','我的记录','bookmark']];
  const PATHS = {
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    leaf:'M20 3C10 2 3 6 5 13c2 7 14 5 15-10ZM4 21 16 8',
    sprout:'M12 21V10M12 14C2 14 2 5 3 4c7-1 10 4 9 10Zm0-4c0-6 5-9 10-8 0 6-4 10-10 8Z',
    chip:'M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
    bolt:'m13 2-9 12h7l-1 8 10-13h-8z',
    mountain:'m2 20 7-15 5 9 3-5 5 11H2Zm4-9 3 2 3-2',
    network:'M9 6 5 15m10-9 4 9M7 18h10M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM4 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm16 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    activity:'M3 20V9m6 11V4m6 16v-8m6 8V2',
    flask:'M9 2h6M10 2v7L4 19q-1 3 2 3h12q3 0 2-3L14 9V2M8 14h8',
    link:'m10 14 4-4M9 7l2-2a5 5 0 0 1 7 7l-2 2M8 10l-2 2a5 5 0 0 0 7 7l2-2',
    bookmark:'M6 3h12v19l-6-4-6 4z',
    globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2c-5 5-5 15 0 20M12 2c5 5 5 15 0 20',
    search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',
    factory:'M3 21V9l6 4V8l6 4V3h4v9l2 2v7H3Zm3-5v2m5-2v2m5-2v2',
    box:'m12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10v10M2 7l10 5 10-5M7 4.5l10 5V15',
    store:'M3 9 5 3h14l2 6M3 9v3q2 3 4 0 2 3 5 0 3 3 5 0 2 3 4 0V9H3Zm2 5v8h14v-8M9 22v-7h6v7',
    users:'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM2 22v-4q0-5 7-5t7 5v4M17 4q6 0 4 6m-2 4q4 0 4 5v3',
    tag:'M2 3h9l11 11-9 8L2 11V3Zm5 4h.01',
    truck:'M2 6h12v12H2zM14 10h4l4 5v3h-8M5 18a2 2 0 1 0 4 0m8 0a2 2 0 1 0 4 0',
    school:'m2 8 10-6 10 6-10 6L2 8Zm4 3v7q6 5 12 0v-7M22 8v10',
    shield:'m12 2 9 4v7q-1 6-9 9-8-3-9-9V6l9-4Zm-5 10 3 3 7-7',
    arrow:'M4 12h16m-6-6 6 6-6 6',
    check:'m4 12 5 5L21 5',
    save:'M3 3h15l3 3v15H3V3Zm4 0v7h10V3M7 21v-7h10v7',
    document:'M5 2h10l5 5v15H5V2Zm10 0v6h5M8 12h9m-9 4h9',
    clock:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4v7l5 3'
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[name] || PATHS.network}"/></svg>`;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL = value => { try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch (_) { return '#'; } };
  const get = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const put = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const defaults = () => ({ v: 1, view: 'home', industry: 'tea', node: 'packing', focus: false, event: null, params: { ...E.DEFAULTS }, bridge: 'none', candidate: 'packaging', checks: {}, question: '从订单到交付' });
  function normalize(value) {
    if (!value || value.v !== 1) return defaults();
    const s = defaults();
    if (VIEWS.some(x => x[0] === value.view)) s.view = value.view;
    if (D.industries.some(x => x.id === value.industry)) s.industry = value.industry;
    if (typeof value.node === 'string' && /^[a-z0-9_-]{1,40}$/.test(value.node)) s.node = value.node;
    s.focus = value.focus === true;
    if (typeof value.event === 'string' && /^C\d{3}$/.test(value.event)) s.event = value.event;
    s.params = E.clean(value.params); s.bridge = E.BRIDGES[value.bridge] ? value.bridge : 'none'; s.candidate = D.candidates.some(c => c.id === value.candidate) ? value.candidate : 'packaging';
    if (typeof value.question === 'string') s.question = value.question.slice(0, 150);
    if (value.checks && typeof value.checks === 'object') Object.keys(value.checks).filter(k => /^(packaging|coordination|process)-[0-3]$/.test(k)).forEach(k => { s.checks[k] = value.checks[k] === true; });
    return s;
  }
  const encode = s => btoa(unescape(encodeURIComponent(JSON.stringify(normalize(s))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function decode(hash) { try { const raw = new URLSearchParams(hash.replace(/^#/, '')).get('s'); if (!raw || raw.length > 7000) return null; return normalize(JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/')))))); } catch (_) { return null; } }
  let state = decode(location.hash) || normalize(get(STORE));
  let registry = { ...D.fallback }, sourceMode = 'snapshot', positions = {}, zoom = 1, toastTimer;
  let records = get(RECORDS); if (!Array.isArray(records)) records = []; records = records.filter(r => r && typeof r.id === 'string' && r.state?.v === 1).slice(0, 24);
  const current = () => D.industries.find(i => i.id === state.industry) || D.industries[0];
  const candidate = () => D.candidates.find(c => c.id === state.candidate) || D.candidates[0];
  function persist() { put(STORE, state); try { history.replaceState(null, '', `${location.pathname}${location.search}#s=${encode(state)}`); } catch (_) {} }
  function toast(message) { const t = document.getElementById('toast'); t.textContent = message; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500); }
  function modal(title, html) { document.getElementById('modalTitle').textContent = title; document.getElementById('modalContent').innerHTML = html; const d = document.getElementById('modal'); if (!d.open) d.showModal(); }
  function setView(view, scroll = true) { state.view = view; persist(); render(); if (scroll) { window.scrollTo({ top: 0, behavior: 'instant' }); main.focus({ preventScroll: true }); } }
  function selectIndustry(id, view = 'graph') { if (!D.industries.some(x => x.id === id)) return; state.industry = id; state.node = id === 'tea' ? 'packing' : current().nodes[0]; state.event = null; state.question = id === 'tea' ? '从订单到交付' : current().questions[0]; positions = {}; zoom = 1; setView(view); }
  function heading(number, title, description, tea = false) { return `<div class="page-heading ${tea ? 'tea-heading' : ''}"><div class="eyebrow">${number} / ${esc(current().title)}工作区</div><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>`; }
  function context() { const p = state.params; return `<div class="context-strip"><strong>${icon('leaf')} ${esc(current().title)}${state.industry === 'tea' ? ' · 柏塘山茶' : ''}</strong><span class="sep"></span><span class="context-question">当前关注：${esc(state.question)}</span><span class="context-end">${state.industry === 'tea' ? `假设订单 ${p.demand} · 加工 ${p.processing} · 包装 ${p.packing}` : '公开关系与事件'}</span></div>`; }
  function sourceList(ids) {
    const list = registry.sources.filter(s => ids.includes(s.source_id));
    return list.length ? `<ul class="source-list">${list.map(s => `<li><a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.publisher)} · ${esc(s.published_at || '原资料未注明日期')}</small></li>`).join('')}</ul>` : '<p>具体主体与关系的公开依据尚待补充。</p>';
  }
  function relatedEvents() { const ids = new Set(current().nodes); return registry.changes.filter(c => (c.involved_node_ids || []).some(id => ids.has(id))).sort((a, b) => String(b.event_date).localeCompare(String(a.event_date))); }
  function renderNavigation() {
    document.getElementById('navigation').innerHTML = VIEWS.map(([id, title, name]) => `<button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(name)}<span>${title}</span></button>`).join('');
    document.getElementById('mobileNavigation').innerHTML = VIEWS.map(([id, title, name]) => `<button class="${state.view === id ? 'active' : ''}" data-view="${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(name)}<span>${title}</span></button>`).join('');
    document.getElementById('currentIndustry').textContent = state.view === 'home' ? '博罗 / 选择一个产业' : `博罗 / ${current().title}${state.industry === 'tea' ? ' / 柏塘山茶' : ''}`;
    const status = document.getElementById('dataStatus'); const stamp = String(registry.generated_at || '').slice(0, 10);
    status.textContent = sourceMode === 'connected' ? `资料 ${stamp}` : '资料快照'; status.classList.toggle('snapshot', sourceMode !== 'connected'); status.title = `原项目资料登记时间：${registry.generated_at}；不代表刚刚重新核验。`;
  }
  function previewChain(industry) {
    const tea = industry.id === 'tea'; const labels = tea ? ['茶园','加工','品牌','渠道','消费者'] : industry.id === 'tourism' ? ['到达','停留','住宿','消费','反馈'] : ['项目','主体','配套','交付','市场'];
    return `<svg class="preview-chain" viewBox="0 0 540 210" role="img" aria-label="${esc(industry.title)}关系机制示意，不代表已确认交易"><path d="M50 112Q105 68 160 112T270 112T380 112T490 112" fill="none" stroke="#9fbb8666" stroke-width="2"/>${labels.map((n, i) => `<g transform="translate(${50 + 110 * i},112)"><circle r="34" fill="${i === 1 || i === 2 ? '#5b462b' : '#16362f'}" stroke="${i === 1 || i === 2 ? '#e3b477' : '#78a98e'}" stroke-width="1.3"/><text text-anchor="middle" y="5">${n}</text></g>`).join('')}<path d="M160 77 160 28M270 77l30-49M380 146l22 40" stroke="#6a918688" stroke-dasharray="3 4"/><text class="small" x="160" y="20" text-anchor="middle">相关支持</text><text class="small" x="308" y="20" text-anchor="middle">待核实连接</text><text class="small" x="400" y="203" text-anchor="middle">机制示意</text></svg>`;
  }
  function renderHome() {
    const c = current();
    return `<div class="page-heading"><div class="eyebrow">01 / 从一门产业开始</div><h1>你想看懂博罗的哪门生意？</h1><p>选一个产业，看看谁与谁有关，哪里正在变。</p></div><div class="home-layout"><div class="industry-grid">${D.industries.map(i => `<button class="industry-card ${i.class} ${i.id === 'tea' ? 'featured' : ''} ${i.id === state.industry ? 'selected' : ''}" data-preview-industry="${i.id}" aria-pressed="${i.id === state.industry}"><span class="sector-watermark">${icon(i.icon)}</span><div>${icon(i.icon)}<h2>${i.title}</h2><small>${i.subtitle}</small></div><span class="card-arrow">↗</span></button>`).join('')}</div><section class="industry-preview"><div class="eyebrow">${c.capability}</div><h2>${c.question}</h2><p class="preview-caption">${c.note}</p>${previewChain(c)}<div class="preview-questions">${c.questions.map((q, i) => `<button data-enter-question="${i}">${q}<span>↗</span></button>`).join('')}</div><button class="primary wide" data-action="enter">进入${c.title}工作区 ${icon('arrow')}</button><div class="home-footer"><span>也可以从一件事进入</span><button class="chip" data-view="changes">${icon('activity')}看看相关变化</button><button class="chip" data-action="library">${icon('globe')}全县与完整报告</button></div></section></div>`;
  }
  function graphData() {
    if (state.industry === 'tea') return { nodes: D.teaNodes.map(n => ({ ...n, ...(positions[n.id] || {}) })), edges: D.teaEdges.map(([from, to, grade], i) => ({ id: `tea-${i}`, from, to, recorded: grade === 'registered', label: grade === 'registered' ? '已登记茶旅关联' : '', source_ids: grade === 'registered' ? ['S047','S054'] : [] })) };
    const selected = registry.nodes.filter(n => current().nodes.includes(n.node_id));
    const nodes = selected.map((n, i) => { const angle = i * Math.PI * 2 / Math.max(selected.length, 1) - Math.PI / 2; const r = selected.length > 5 ? 220 : 190; return { id: n.node_id, name: n.name, sub: n.town || n.layer, registered: true, icon: n.node_type === 'external' ? 'globe' : n.node_type === 'eco' ? 'mountain' : n.node_type === 'agriculture' ? 'leaf' : 'factory', detail: n.description, question: '它与哪些主体有已登记的联系？', sources: n.source_ids || [], x: 580 + Math.cos(angle) * r * 1.6, y: 295 + Math.sin(angle) * r, ...(positions[n.node_id] || {}) }; });
    const ids = new Set(nodes.map(n => n.id)); const edges = registry.edges.filter(e => ids.has(e.source_node_id) && ids.has(e.target_node_id)).map(e => ({ id: e.edge_id, from: e.source_node_id, to: e.target_node_id, recorded: e.evidence_grade === 'A', label: '', source_ids: e.source_ids }));
    return { nodes, edges };
  }
  function renderGraphSVG() {
    const data = graphData(); if (!data.nodes.length) return `<div class="empty-state">${icon('network')}<h2>这条产业线索还没有连接</h2><p>可以查看原版资料，或先进入茶产业样板。</p><button class="secondary" data-select-industry="tea">进入茶产业</button></div>`;
    const active = new Set([state.node]); data.edges.filter(e => e.from === state.node || e.to === state.node).forEach(e => { active.add(e.from); active.add(e.to); });
    const event = registry.changes.find(c => c.change_id === state.event); const eventNodes = new Set(event?.involved_node_ids || []);
    let svg = `<svg id="industryGraph" class="network-svg" viewBox="${580 - 580 / zoom} ${290 - 290 / zoom} ${1160 / zoom} ${580 / zoom}" aria-label="${esc(current().title)}关系图，可拖动节点，按回车查看详情" role="group"><defs><radialGradient id="nodeGlow"><stop stop-color="#637e4b" stop-opacity=".16"/><stop offset="1" stop-color="#284b38" stop-opacity=".01"/></radialGradient><marker id="arrowTip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="#9bb49a"/></marker></defs>`;
    if (state.industry === 'tea') svg += `<ellipse cx="240" cy="280" rx="225" ry="230" fill="url(#nodeGlow)" stroke="#37513b44"/><ellipse cx="610" cy="280" rx="230" ry="245" fill="url(#nodeGlow)" stroke="#37513b44"/><ellipse cx="925" cy="280" rx="210" ry="205" fill="url(#nodeGlow)" stroke="#37513b44"/><text class="group-label" x="85" y="37">产品与生产</text><text class="group-label" x="480" y="37">品牌与渠道</text><text class="group-label" x="900" y="37">消费者与服务</text>`;
    for (const e of data.edges) {
      const a = data.nodes.find(n => n.id === e.from), b = data.nodes.find(n => n.id === e.to); if (!a || !b) continue;
      const selected = e.from === state.node || e.to === state.node; const dim = state.focus && !selected; const connected = state.bridge === 'packaging' && ((e.from === 'packing' && e.to === 'support') || (e.from === 'processing' && e.to === 'packing'));
      const angle = Math.atan2(b.y - a.y, b.x - a.x), r = 40; const ax = a.x + Math.cos(angle) * r, ay = a.y + Math.sin(angle) * r, bx = b.x - Math.cos(angle) * r, by = b.y - Math.sin(angle) * r;
      svg += `<path class="graph-edge ${e.recorded ? 'recorded' : ''} ${selected ? 'selected' : ''} ${dim ? 'dim' : ''} ${connected ? 'connected' : ''}" data-edge="${e.id}" d="M${ax} ${ay}Q${(ax + bx) / 2} ${(ay + by) / 2 - (Math.abs(a.x - b.x) > 350 ? 65 : 12)} ${bx} ${by}" marker-end="url(#arrowTip)"/>`;
    }
    for (const n of data.nodes) {
      const dim = state.focus && !active.has(n.id); const selected = n.id === state.node; const visibleLabel = n.name.length > 12 ? n.name.slice(0, 11) + '…' : n.name;
      svg += `<g class="graph-node ${n.registered ? 'registered' : 'role'} ${selected ? 'selected' : ''} ${dim ? 'dim' : ''}" data-node="${n.id}" transform="translate(${n.x},${n.y})" tabindex="0" role="button" aria-label="查看${esc(n.name)}，${esc(n.sub)}"><title>${esc(n.name)} · ${esc(n.sub)}</title>${selected ? '<circle r="52" fill="none" stroke="#c3a26366" stroke-dasharray="2 5"/>' : ''}<circle class="node-ring" r="39"/>${eventNodes.has(n.id) ? '<circle r="46" fill="none" stroke="#b0d7a0" stroke-width="1"/>' : ''}<svg x="-14" y="-14" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${PATHS[n.icon] || PATHS.network}"/></svg><text class="node-title" text-anchor="middle" y="64">${esc(visibleLabel)}</text><text class="node-sub" text-anchor="middle" y="82">${esc(n.sub)}</text></g>`;
    }
    return svg + '</svg>';
  }
  function inspector() {
    const data = graphData(); const n = data.nodes.find(n => n.id === state.node) || data.nodes[0]; if (!n) return '';
    return `<aside class="panel inspector"><span class="pill ${n.registered ? '' : 'amber'}">${n.registered ? '原资料已登记' : '机制角色 · 主体待填'}</span><h2>${esc(n.name)}</h2><div class="info-block"><h3>值得追问</h3><p>${esc(n.question)}</p></div><div class="info-block"><h3>${n.registered ? '原资料登记说明' : '沿着这一环看看'}</h3><p>${esc(n.detail)}</p></div><div class="info-block"><h3>还要确认</h3><p>${n.id === 'packing' ? '产品批次、承接余量、交期与责任。' : '具体主体、关系是否持续，以及实际业务范围。'}</p></div><button class="primary wide" data-view="${state.industry === 'tea' ? 'trial' : 'changes'}">${icon(state.industry === 'tea' ? 'flask' : 'activity')}${state.industry === 'tea' ? '放进一个情景试试' : '查看相关变化'}</button><button class="secondary wide" data-view="${state.industry === 'tea' ? 'bridges' : 'records'}">${state.industry === 'tea' ? '看看可选的连接' : '留下这次观察'}</button><details class="source-disclosure"><summary>查看资料依据与缺口</summary>${sourceList(n.sources || [])}<p>原库登记不等于本版已重新逐条核验；机制角色不代表真实企业或交易。</p></details></aside>`;
  }
  function eventPreview() {
    const events = relatedEvents().slice(0, 2);
    return `<section class="panel event-preview"><header><h2>与这个产业有关的变化线索</h2><button class="text-button" data-view="changes">展开记录 ↗</button></header><div class="event-mini-grid">${events.length ? events.map(c => `<button class="event-mini" data-select-event="${c.change_id}"><small>${esc(c.event_date)} · 原库登记</small><strong>${esc(c.title)}</strong><small>${esc(c.uncertainty)}</small></button>`).join('') : '<div class="event-mini"><strong>现有快照未取得相关事件</strong><small>可以继续沿关系查看依据，或打开原版完整资料。</small></div>'}</div></section>`;
  }
  function renderGraph() { return `${heading('02', state.industry === 'tea' ? '茶从哪里来，又经过谁卖出去？' : current().question, state.industry === 'tea' ? '从一条关系往下看：已登记线索、机制角色与待核实连接分别呈现。' : current().note, state.industry === 'tea')}${context()}<div class="graph-layout"><div><section class="panel graph-panel"><div class="panel-toolbar"><span>${state.industry === 'tea' ? '行业机制图 · 具体企业与交易待填' : '原项目已登记的公开关系'}</span><div class="segmented"><button data-focus="on" class="${state.focus ? 'active' : ''}" aria-pressed="${state.focus}">只看这条线</button><button data-focus="off" class="${!state.focus ? 'active' : ''}" aria-pressed="${!state.focus}">看整个产业</button></div></div><div class="graph-scroll" id="graphScroll">${renderGraphSVG()}</div><div class="graph-bottom"><div class="graph-legend"><span class="recorded">已登记关系</span><span>机制或待核实连接</span></div><div class="graph-controls"><span class="graph-hint">可拖节点 · 小屏可左右滑动</span><button data-zoom="out" aria-label="缩小关系图">−</button><button data-zoom="fit" aria-label="重置关系图">⌂</button><button data-zoom="in" aria-label="放大关系图">＋</button></div></div></section>${eventPreview()}</div>${inspector()}</div>`; }
  function renderChanges() {
    const events = relatedEvents(); const c = events.find(x => x.change_id === state.event) || events[0];
    return `${heading('03', '哪件事，值得沿着产业追下去？', '读变化前后的记录，再决定是否调整你的假设。')}${context()}${!c ? `<div class="panel empty-state">${icon('activity')}<h2>当前资料里还没有相关事件</h2><p>保留这处空白，继续查关系与公开来源。没有把其他产业新闻当成这条产业的新变化。</p><button class="secondary" data-view="graph">返回关系现场</button></div>` : `<div class="change-layout"><div class="panel event-list">${events.map(e => `<button class="event-card ${e.change_id === c.change_id ? 'active' : ''}" data-event-detail="${e.change_id}" aria-pressed="${e.change_id === c.change_id}"><time>${esc(e.event_date)}</time><strong>${esc(e.title)}</strong><small>已登记事件 · 点开读前后</small></button>`).join('')}</div><article class="panel change-detail"><span class="pill">${esc(c.event_date)} · 资料记录</span><h2>${esc(c.title)}</h2><div class="before-after"><section><span class="small-label">变化记录</span><p>${esc(c.before_after)}</p></section><section><span class="small-label">涉及哪些主体</span><p>${(c.involved_node_ids || []).map(id => esc(registry.nodes.find(n => n.node_id === id)?.name || id)).join('、')}</p></section></div><div class="attention"><strong>还有什么不能直接下结论？</strong><p>${esc(c.uncertainty || '具体传导与业务影响还需要进一步核实。')}</p></div><div class="inline-actions"><button class="primary" data-event-graph="${c.change_id}">在关系图中查看 ${icon('arrow')}</button>${state.industry === 'tea' ? '<button class="secondary" data-action="event-trial">带着问题试条件</button>' : ''}<button class="secondary" data-action="save">保存观察</button></div><details class="source-disclosure" open><summary>打开原资料登记的来源</summary>${sourceList(c.source_ids || [])}<p>事件不会自动改写试验参数。登记时间：${esc(c.last_verified_at || registry.generated_at)}。</p></details></article></div>`}`;
  }
  function miniFlow(currentRun) {
    const b = E.run(E.DEFAULTS, 'none', 40); const r = currentRun; const labels = ['渠道订单','加工','包装','交付']; const points = [[145,55],[65,135],[225,135],[145,220]];
    const draw = (run, offset, title, now) => `<g transform="translate(${offset},0)"><text x="145" y="15" text-anchor="middle">${title}</text>${[[0,1],[1,2],[2,3]].map(([a,z]) => `<path class="flow-line ${now && run.bottleneck === (z === 1 ? 'processing' : z === 2 ? 'packing' : 'shipping') ? 'bad' : ''}" d="M${points[a][0]} ${points[a][1]+20}L${points[z][0]} ${points[z][1]-20}"/>`).join('')}${points.map(([x,y],i) => { const k = ['demand','processing','packing','shipping'][i]; const warn = now && run.bottleneck === k; return `<circle cx="${x}" cy="${y}" r="28" class="${warn ? 'warm' : ''}"/><text x="${x}" y="${y+4}" text-anchor="middle">${labels[i]}</text>${i === 0 && now && state.params.demand > 100 ? Array.from({length:7},(_,t)=>`<circle cx="${x+(t-3)*10}" cy="${y-44-Math.abs(t-3)*2}" r="2.5"/>`).join('') : ''}`; }).join('')}<text class="${now && run.bottleneck ? 'critical-label' : 'dim-text'}" x="145" y="270" text-anchor="middle">${now ? esc(run.bottleneck ? run.bottleneckLabel + '可能承压' : '当前假设可以承接') : '原有假设 · 非实测基线'}</text></g>`;
    return `<svg class="mini-flow" viewBox="0 0 640 285" role="img" aria-label="原有条件与当前假设的承接关系对比">${draw(b,0,'原有条件',false)}<path d="m303 125 9 9-9 9" stroke="#bbd1bd" fill="none"/>${draw(r,330,'当前假设',true)}</svg>`;
  }
  const n0 = n => Math.round(n).toLocaleString('zh-CN');
  function trialOutputs() {
    const r = E.run(state.params, state.bridge), base = E.run(E.DEFAULTS, 'none');
    const change = r.delivery.middle - base.delivery.middle;
    return `<section class="panel trial-comparison"><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><h2>哪里可能先卡住？</h2><span class="pill amber">假设试验 · 非经营预测</span></div>${miniFlow(r)}<div class="metric-grid"><div class="metric"><span class="label">${state.params.periods}期内完成交付的假设订单</span><b>${Math.round(r.delivery.middle)}%</b><div class="band"><span style="left:${r.delivery.low}%;width:${Math.max(1,r.delivery.high-r.delivery.low)}%"></span></div><small>条件波动下约 ${Math.round(r.delivery.low)}%–${Math.round(r.delivery.high)}%</small></div><div class="metric amber"><span class="label">${state.params.periods}期末仍在等待的假设订单</span><b>${n0(r.backlog.middle)}<span style="font-size:13px"> 份</span></b><small>不是损失订单；含加工、包装与发货等待</small></div><div class="metric"><span class="label">承接上限最紧的一环</span><b style="font-size:21px">${esc(r.bottleneckLabel)}</b><small>按本次输入比较，不是行业现实诊断</small></div></div><p class="results-foot">与原有假设相比，完成比例${change >= 0 ? '增加' : '减少'}约 ${Math.abs(change).toFixed(0)} 个百分点。${state.bridge !== 'none' ? '已计入你选择的增补支持假设。' : ''}这些数值来自本次输入，不能外推茶企真实经营。</p></section><div class="trial-followup"><section class="panel"><h3>沿着等待环节继续看</h3><p>补一环之后，也可能把压力转移到另一环。</p><div class="queue-list">${[['processing','加工等待'],['packing','包装等待'],['shipping','发货等待']].map(([k,label])=>`<div class="queue-item ${r.bottleneck === k ? 'warn' : ''}"><span>${label}</span><span class="queue-bar"><span style="width:${Math.min(100,r.nominal.queues[k]/Math.max(1,r.nominal.incoming)*100)}%"></span></span><span>${n0(r.nominal.queues[k])}份</span></div>`).join('')}</div></section><section class="panel"><h3>下一步值得确认什么？</h3><p>真实订单批次、各环节可用余量、交期与服务范围。扩大流量或增加销售，不一定能补上交付能力。</p><div class="inline-actions"><button class="primary" data-view="bridges">看看可选连接 ${icon('arrow')}</button></div></section></div>`;
  }
  function rangeControl(key, label, min, max, hint) { return `<div class="control"><header><label for="param-${key}">${label}</label><output id="value-${key}" for="param-${key}">${state.params[key]}份 / 期</output></header><input id="param-${key}" type="range" min="${min}" max="${max}" step="5" value="${Math.min(max,Math.max(min,state.params[key]))}" data-param="${key}"><div class="range-limits"><span>${min}份</span><span>${hint}</span><span>${max}份</span></div></div>`; }
  function renderTrial() {
    if (state.industry !== 'tea') return `${heading('04', '这个产业，先从真实关系继续研究', '当前版本先完成茶产业的独立条件试验；其他产业没有借用全县GDP冒充行业结果。')}${context()}<div class="panel empty-state">${icon('flask')}<h2>行业推演仍需建立对应的条件</h2><p>${esc(current().question)} 你可以先看已登记的关系和事件，保存值得继续查的变量，也可以进入现有全县风洞。</p><div class="inline-actions"><button class="primary" data-view="graph">继续看这个产业的关系</button><a class="secondary" href="${ORIGINAL}windtunnel.html">打开全县风洞 ↗</a><button class="secondary" data-select-industry="tea">体验茶产业条件试验</button></div></div>`;
    return `${heading('04','订单多了，交付一定跟得上吗？','只改几项条件，把原有安排和当前假设并排看。',true)}${context()}<div class="trial-layout"><section class="panel trial-controls"><h2>调整这次安排</h2>${state.bridge!=='none'?`<div class="attention"><strong>已计入：${E.BRIDGES[state.bridge].label}</strong><p>在输入量级上增加对应环节30份／期。</p><button class="text-button" data-action="remove-bridge">撤销这项假设支持</button></div>`:''}<div class="presets"><button data-preset="base">原有安排</button><button data-preset="orders">订单增加</button><button data-preset="process">加工先扩</button><button data-preset="packing">补包装支持</button></div>${rangeControl('demand','每期进入的订单',50,200,'需求')}${rangeControl('processing','每期加工承接',50,200,'假设上限')}${rangeControl('packing','每期包装承接',50,200,'假设上限')}<button class="primary wide" data-action="run">比较这组条件 ${icon('arrow')}</button><p class="assumption-note">以每期100份订单作演示起点，观察${state.params.periods}个连续交付周期。份数是可替换的假设量级，不是柏塘山茶实测销量或产能。</p><details class="advanced-controls"><summary>替换量级、波动与发货假设</summary><div class="advanced-grid">${[['demand','每期订单'],['processing','加工上限'],['packing','包装上限'],['shipping','发货上限'],['uncertainty','各项波动±%']].map(([k,l])=>`<label>${l}<input type="number" data-numeric-param="${k}" min="${k==='uncertainty'?0:1}" max="${k==='uncertainty'?30:100000}" value="${state.params[k]}"></label>`).join('')}</div><p class="results-foot">相同条件可复算。范围来自假设波动，不是现实发生概率。</p></details></section><div><div id="trialOutputs">${trialOutputs()}</div><div class="panel compare-strip"><div><strong>这次的条件会继续保留</strong><small>进入关系、连接或记录页面，都沿用同一组假设。</small></div><button class="secondary" data-action="share">分享这个情景</button><button class="primary" data-action="save">${icon('save')}保存这次推演</button></div></div></div>`;
  }
  function renderBridges() {
    if (state.industry !== 'tea') return `${heading('05','先拆清任务，再找相关支持','真实业务关系需要逐项核实。')}${context()}<div class="panel empty-state">${icon('link')}<h2>先留下你关注的具体连接</h2><p>本版不为其他产业编造服务商名单。可以在关系图中选一个主体，保存观察，并查原资料里的相关来源。</p><div class="inline-actions"><button class="primary" data-view="graph">查看产业关系</button><button class="secondary" data-action="save">保存这次观察</button></div></div>`;
    const c = candidate(), plain = E.run(state.params,'none'), connected = E.run(state.params,c.id), diff = connected.delivery.middle-plain.delivery.middle;
    return `${heading('05','这一环，谁可能接得上？','把缺口拆清楚，再核实可选择的支持。',true)}${context()}<div class="bridge-layout"><section class="panel need-panel"><div class="need-photo" role="img" aria-label="茶叶示意图片"></div><h2>示例需求<br>交付承接支持</h2><div class="need-row"><small>想解决什么</small><strong>${esc(plain.bottleneck ? plain.bottleneckLabel + '可能承压' : '比较可用的替代支持')}</strong></div><div class="need-row"><small>需要确认</small><strong>批次、余量、交期与责任</strong></div><div class="need-row"><small>当前状态</small><strong style="color:var(--amber)">待需求方核实</strong></div></section><section class="panel bridge-center"><h2>可选的三条支持方向</h2><p>以下是待查找的角色方向，尚无已确认的合作主体或报价。</p>${D.candidates.map(b => `<button class="bridge-card ${b.id === c.id ? 'active' : ''}" data-bridge="${b.id}" aria-pressed="${b.id === c.id}">${icon(b.icon)}<div><strong>${b.name}</strong><p>${b.line}</p><small>${b.kind}</small></div><span class="chevron">↗</span></button>`).join('')}<div class="attention"><strong>为什么这条方向可能相关？</strong><p>${esc(c.why)}</p></div><button class="text-button" data-view="graph">返回产业关系，继续找依据 ↗</button></section><section class="panel bridge-inspector"><h2>先把这几件事问清楚</h2><p>勾选代表你已记录核实进度，不会让系统自动确认合作。</p><div class="check-list">${c.checks.map((q,i) => `<label><input type="checkbox" data-check="${c.id}-${i}" ${state.checks[c.id+'-'+i] ? 'checked' : ''}><span>${q}</span></label>`).join('')}</div><div class="comparison-result"><strong>假设补上支持后，再比较一次</strong><p>${esc(c.adjustment)}</p><p>在同一组输入下，完成比例变化约 ${diff >= 0 ? '+' : ''}${diff.toFixed(0)} 个百分点；承接上限最紧的一环：${esc(connected.bottleneckLabel)}。</p></div><p class="bridge-caution">增补幅度只是演示假设。具体服务范围、能力、费用与是否合作，由参与者核实。</p><button class="primary wide" data-action="apply-bridge">放进情景比较 ${icon('arrow')}</button><button class="secondary wide" data-action="save">保存待核实事项</button></section></div><div class="panel compare-strip"><div><strong>这次观察：茶产业 → 交付承接 → 可选支持</strong><small>系统给出可核实的桥，是否合作由你决定。</small></div><button class="secondary" data-action="share">分享这个问题</button></div>`;
  }
  function renderRecords() {
    return `${heading('06','把这次判断留下，再回来核对','保存行业、关注对象、条件与待核实事项，下一次从这里继续。')}<div class="records-toolbar"><p>记录保存在当前浏览器，可导出备份。没有公开发布你的记录。</p><div class="inline-actions"><button class="secondary" data-action="export">${icon('document')}导出记录</button><button class="secondary" data-action="import">导入备份</button><input class="hidden-file" type="file" id="importFile" accept="application/json,.json"></div></div>${records.length ? `<div class="record-grid">${records.map(r => { const s = normalize(r.state), ind = D.industries.find(i => i.id === s.industry); const result = s.industry === 'tea' ? E.run(s.params, s.bridge) : null; return `<article class="panel record-card"><header><span class="pill">${ind.title}</span><time>${esc(new Date(r.created).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}))}</time></header><h2>${esc(s.question)}</h2><p>${s.industry === 'tea' ? `假设每期订单 ${s.params.demand}，加工 ${s.params.processing}，包装 ${s.params.packing}，发货 ${s.params.shipping}。` : '沿原资料登记的关系与事件继续观察。'}</p><div class="record-facts">${result ? `<span>示意完成比例约 ${Math.round(result.delivery.middle)}%</span><span>增补支持：${E.BRIDGES[s.bridge].label}</span>` : ''}<span>已记录核实项 ${Object.values(s.checks).filter(Boolean).length}</span></div><div class="inline-actions"><button class="primary" data-restore="${esc(r.id)}">继续这次观察</button><button class="secondary" data-share-record="${esc(r.id)}">分享</button><button class="quiet" data-delete-record="${esc(r.id)}" aria-label="移除这条本地记录">×</button></div></article>`; }).join('')}</div>` : `<div class="panel empty-state">${icon('bookmark')}<h2>先留下一次自己的观察</h2><p>选一个产业，追一条关系，试一组条件。值得记下的，不只是结果，还有当时为什么这样想。</p><button class="primary" data-view="home">从一个产业开始 ${icon('arrow')}</button></div>`}`;
  }
  function render() {
    renderNavigation(); const views = { home:renderHome,graph:renderGraph,changes:renderChanges,trial:renderTrial,bridges:renderBridges,records:renderRecords };
    main.innerHTML = `<div class="fade-in">${views[state.view]()}</div>`;
    document.querySelectorAll('[data-icon]').forEach(n => { n.innerHTML = icon(n.dataset.icon); });
    document.title = `${state.view === 'home' ? '进入一个产业' : current().title + ' · ' + VIEWS.find(v => v[0] === state.view)[1]}｜博罗产业风洞`;
    if (state.view === 'graph') bindGraphDrag();
  }
  function refreshTrial() {
    persist(); const output = document.getElementById('trialOutputs'); if (output) output.innerHTML = trialOutputs();
    for (const k of ['demand','processing','packing']) { const n = document.getElementById('value-'+k); if (n) n.textContent = state.params[k]+'份 / 期'; const range = document.getElementById('param-'+k); if (range && document.activeElement !== range) range.value = state.params[k]; }
    const c = main.querySelector('.context-strip'); if (c) c.outerHTML = context();
  }
  function saveRecord() {
    const saved = { id: 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,7), created: new Date().toISOString(), state: normalize(state), registry_snapshot: registry.generated_at, engine: 'industry-flow-v1' };
    records.unshift(saved); records = records.slice(0,24);
    if (put(RECORDS,records)) toast('已保存。切换页面后仍可从“我的记录”继续。'); else toast('浏览器存储空间不足，请先导出记录。');
  }
  function share(value = state) {
    const snapshot = normalize(value); if (snapshot.view === 'records') snapshot.view = snapshot.industry === 'tea' ? 'trial' : 'graph';
    const link = `${location.origin}${location.pathname}#s=${encode(snapshot)}`;
    modal('分享同一次观察', `<p>打开链接会还原产业、关注节点、试验条件和待核实进度，不会回到默认方案。接收者能看到这些内容。</p><textarea class="share-field" id="shareLink" readonly aria-label="可复制的观察链接">${esc(link)}</textarea><div class="inline-actions"><button class="primary" data-action="copy-share">复制观察链接 ${icon('link')}</button><button class="secondary" data-action="close-modal">返回工作区</button></div>`);
  }
  const library = [['今日博罗','index.html'],['变化现场','holo-home-v10.html'],['关系图谱','holo-home-v9.html'],['产业网络','network.html'],['博罗基本面','who.html'],['五条发展路径','choices.html'],['2030未来推演','future.html'],['全县风洞测试','windtunnel.html'],['忽略了什么','blindspot.html'],['完整分析报告','report.html'],['结语','ending.html'],['各镇吃喝玩乐','town.html'],['角色体验','role.html'],['决策实验室','lab.html'],['既有完整通俗版','easy/'],['既有风洞2.0','v2/'],['既有V1031','v1031/']];
  document.addEventListener('click', async event => {
    const t = event.target.closest('button,a[data-view]'); if (!t) return;
    if (t.dataset.view) { event.preventDefault(); setView(t.dataset.view); return; }
    if (t.dataset.previewIndustry) { state.industry = t.dataset.previewIndustry; persist(); render(); if(window.innerWidth<900)main.querySelector('.industry-preview')?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if (t.dataset.selectIndustry) { selectIndustry(t.dataset.selectIndustry); return; }
    if (t.dataset.enterQuestion !== undefined) { state.question = current().questions[Number(t.dataset.enterQuestion)]; state.node = state.industry === 'tea' ? Number(t.dataset.enterQuestion) === 0 ? 'online' : 'packing' : current().nodes[0]; setView('graph'); return; }
    if (t.dataset.focus) { state.focus = t.dataset.focus === 'on'; persist(); render(); return; }
    if (t.dataset.zoom) { zoom = t.dataset.zoom === 'fit' ? 1 : Math.max(.7,Math.min(1.8,zoom+(t.dataset.zoom==='in'?.15:-.15))); if (t.dataset.zoom==='fit') positions={}; render(); return; }
    if (t.dataset.eventDetail) { state.event=t.dataset.eventDetail; persist(); render(); return; }
    if (t.dataset.selectEvent) { state.event=t.dataset.selectEvent; setView('changes'); return; }
    if (t.dataset.eventGraph) { state.event=t.dataset.eventGraph; const e=registry.changes.find(c=>c.change_id===state.event); state.node=(e?.involved_node_ids||[]).find(id=>current().nodes.includes(id))||state.node; state.question=e?.title||state.question; setView('graph'); return; }
    if (t.dataset.bridge) { state.candidate=t.dataset.bridge; persist(); render(); return; }
    if (t.dataset.preset) { state.bridge='none'; state.params={...E.DEFAULTS}; state.question='从订单到交付'; if(t.dataset.preset==='orders')state.params.demand=140; if(t.dataset.preset==='process'){state.params.demand=140;state.params.processing=165;} if(t.dataset.preset==='packing'){state.params.demand=140;state.params.packing=165;} persist(); render(); return; }
    if (t.dataset.restore) { const r=records.find(r=>r.id===t.dataset.restore); if(r){state=normalize(r.state);if(state.view==='records')state.view='graph';persist();render();toast('已还原这次观察与全部假设。');}return; }
    if (t.dataset.shareRecord) { const r=records.find(r=>r.id===t.dataset.shareRecord);if(r)share(r.state);return; }
    if (t.dataset.deleteRecord) { const previous=records.find(r=>r.id===t.dataset.deleteRecord);records=records.filter(r=>r.id!==t.dataset.deleteRecord);put(RECORDS,records);render();if(previous)modal('已移除本地记录',`<p>这条记录已从当前列表移除。关闭此窗口前仍可撤销。</p><button class="primary" id="undoDelete">撤销移除</button>`);const undo=document.getElementById('undoDelete');if(undo)undo.onclick=()=>{records.unshift(previous);put(RECORDS,records);document.getElementById('modal').close();render();};return; }
    const action=t.dataset.action;
    if(action==='enter'){selectIndustry(state.industry);return;}
    if(action==='library'){modal('全县视图与完整内容',`<p>原有页面、图表、模型与报告继续保留。下列链接在博罗原站打开。</p><div class="library-grid">${library.map(([n,p])=>`<a href="${ORIGINAL+p}" target="_blank" rel="noopener noreferrer">${n} ↗</a>`).join('')}</div>`);return;}
    if(action==='about'){modal('资料与试验说明',`<h3>关系从哪里来</h3><p>行业关系与事件优先读取原博罗项目的公开证据登记库。当前资料：${esc(registry.generated_at)}；连接状态：${sourceMode==='connected'?'已连接原库':'使用随版本提供的资料快照'}。登记不代表本版已重新核验每一条来源。</p><h3>图上的线怎样理解</h3><p>茶产业图含已登记条目，以及加工、包装、品牌、渠道等机制角色。待填角色不冒充具体企业，机制连线不冒充真实交易。其他产业展示原库对应的节点与关系。</p><h3>条件试验怎样理解</h3><p>茶产业采用独立的订单—加工—包装—发货承接试验。默认100份订单、加工125份、包装115份、发货130份，均为每期假设量级，连看4期。各项按你选择的±波动范围重复组合，显示结果范围，不给现实成功概率。</p><p>增加某环节支持不能自动补足其他环节。试验未计入全部品质、价格、库存、季节与行为因素，不能当成企业经营预测。</p><h3>原有内容与记录</h3><p>本工作区位于独立的 industry/ 目录，原有页面与全县模型未改。观察和核实清单保存在本浏览器，分享链接携带当前条件。可在“我的记录”导出备份。</p><button class="secondary" data-action="library">打开全县与完整资料</button>`);return;}
    if(action==='close-modal'){document.getElementById('modal').close();return;}
    if(action==='save'){saveRecord();return;}
    if(action==='share'){share();return;}
    if(action==='copy-share'){const field=document.getElementById('shareLink');try{await navigator.clipboard.writeText(field.value);toast('已复制，可分享同一次观察。');}catch(_){field.select();toast('未能自动复制，已选中链接，请手动复制。');}return;}
    if(action==='run'){refreshTrial();document.getElementById('trialOutputs')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(action==='remove-bridge'){state.bridge='none';persist();render();return;}
    if(action==='apply-bridge'){state.bridge=candidate().id;setView('trial');return;}
    if(action==='event-trial'){setView('trial');toast('事件已保留，试验参数仍由你选择。');return;}
    if(action==='export'){if(!records.length){toast('先保存一条观察，再导出备份。');return;}const blob=new Blob([JSON.stringify({format:'boluo-industry-records-v1',records},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='boluo-industry-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(action==='import'){document.getElementById('importFile')?.click();return;}
  });
  document.addEventListener('input',event=>{
    const t=event.target;if(t.dataset.param){state.params=E.clean({...state.params,[t.dataset.param]:t.value});refreshTrial();}
    if(t.dataset.numericParam&&t.value!==''){state.params=E.clean({...state.params,[t.dataset.numericParam]:t.value});refreshTrial();}
  });
  document.addEventListener('change',async event=>{
    const t=event.target;if(t.dataset.check){state.checks[t.dataset.check]=t.checked;persist();}
    if(t.id==='importFile'&&t.files[0]){try{const file=t.files[0];if(file.size>1000000)throw Error('文件过大');const d=JSON.parse(await file.text());if(d.format!=='boluo-industry-records-v1'||!Array.isArray(d.records))throw Error('备份格式不匹配');const incoming=d.records.filter(r=>r?.state?.v===1).map(r=>({id:'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),created:Number.isFinite(Date.parse(r.created))?r.created:new Date().toISOString(),state:normalize(r.state)}));records=[...incoming,...records].slice(0,24);put(RECORDS,records);render();toast(`已导入${Math.min(incoming.length,24)}条观察。`);}catch(e){toast('无法导入：'+e.message);}}
  });
  document.addEventListener('keydown',event=>{const n=event.target.closest('[data-node]');if(n&&(event.key==='Enter'||event.key===' ')){event.preventDefault();state.node=n.dataset.node;persist();render();main.querySelector(`[data-node="${state.node}"]`)?.focus();}});
  function bindGraphDrag(){
    const svg=document.getElementById('industryGraph');if(!svg)return;let drag=null;
    const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
    svg.addEventListener('pointerdown',e=>{const n=e.target.closest('[data-node]');if(!n)return;const item=graphData().nodes.find(x=>x.id===n.dataset.node);const p=point(e);drag={id:item.id,element:n,start:p,x:item.x,y:item.y,moved:false,pointer:e.pointerId};n.setPointerCapture(e.pointerId);});
    svg.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(!drag.moved)return;const pos={x:Math.min(1100,Math.max(50,drag.x+dx)),y:Math.min(495,Math.max(70,drag.y+dy))};positions[drag.id]=pos;drag.element.setAttribute('transform',`translate(${pos.x},${pos.y})`);const g=graphData();for(const edge of g.edges){if(edge.from!==drag.id&&edge.to!==drag.id)continue;const a=g.nodes.find(n=>n.id===edge.from),b=g.nodes.find(n=>n.id===edge.to),line=svg.querySelector(`[data-edge="${edge.id}"]`);if(!a||!b||!line)continue;const angle=Math.atan2(b.y-a.y,b.x-a.x),ax=a.x+Math.cos(angle)*40,ay=a.y+Math.sin(angle)*40,bx=b.x-Math.cos(angle)*40,by=b.y-Math.sin(angle)*40;line.setAttribute('d',`M${ax} ${ay}Q${(ax+bx)/2} ${(ay+by)/2-(Math.abs(a.x-b.x)>350?65:12)} ${bx} ${by}`);}});
    svg.addEventListener('pointerup',()=>{if(!drag)return;if(!drag.moved){state.node=drag.id;persist();}drag=null;render();});
    svg.addEventListener('pointercancel',()=>{drag=null;render();});
  }
  const search=document.getElementById('search'),searchResults=document.getElementById('searchResults');
  search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();if(!q){searchResults.hidden=true;return;}const industries=D.industries.filter(i=>(i.title+i.subtitle+i.question).toLowerCase().includes(q));const nodes=graphData().nodes.filter(n=>(n.name+n.sub+n.question).toLowerCase().includes(q));searchResults.innerHTML=industries.map(i=>`<button data-select-industry="${i.id}">${esc(i.title)}<small>${esc(i.question)}</small></button>`).join('')+nodes.slice(0,5).map(n=>`<button data-search-node="${n.id}">${esc(n.name)}<small>当前产业中的关系节点</small></button>`).join('')||'<p style="padding:10px;font-size:12px">没有找到相符的条目。</p>';searchResults.hidden=false;});
  searchResults.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.searchNode){state.node=b.dataset.searchNode;setView('graph');}searchResults.hidden=true;search.value='';});
  document.addEventListener('click',e=>{if(!e.target.closest('.top-search'))searchResults.hidden=true;});
  window.addEventListener('hashchange',()=>{const next=decode(location.hash);if(next){state=next;render();}});
  async function fetchJSON(path){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);try{const r=await fetch(path,{cache:'no-cache',signal:controller.signal});if(!r.ok)throw Error(String(r.status));return await r.json();}finally{clearTimeout(timer);}}
  async function connectRegistry(){
    const results=await Promise.allSettled([fetchJSON('../data/relationship-evidence-v1.json'),fetchJSON('../data/relationship-sources-v1.json'),fetchJSON('../data/relationship-changes-v1.json')]);
    const [network,sources,changes]=results;
    if(network.status==='fulfilled'&&Array.isArray(network.value.nodes)&&Array.isArray(network.value.edges)){registry.nodes=network.value.nodes;registry.edges=network.value.edges;registry.generated_at=network.value.generated_at;}
    if(sources.status==='fulfilled'&&Array.isArray(sources.value.sources))registry.sources=sources.value.sources;
    if(changes.status==='fulfilled'&&Array.isArray(changes.value.changes))registry.changes=changes.value.changes;
    sourceMode=network.status==='fulfilled'&&Array.isArray(network.value.nodes)&&Array.isArray(network.value.edges)&&sources.status==='fulfilled'&&Array.isArray(sources.value.sources)&&changes.status==='fulfilled'&&Array.isArray(changes.value.changes)?'connected':'snapshot';
    if(document.activeElement?.tagName==='INPUT')renderNavigation();else render();
  }
  persist();render();connectRegistry();
})();
