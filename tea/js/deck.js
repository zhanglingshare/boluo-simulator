/* 柏塘山茶 · 数据探索台
   独立工作台：多类型图表 + 下拉/搜索筛选 + 事件流，全部基于可核验公开数据。
   前端只读，不做在线调用；派生口径透明标注，目标与事实分开。 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = { svg: 1, rect: 1, circle: 1, path: 1, g: 1, text: 1, line: 1, polyline: 1, polygon: 1, ellipse: 1 };

  function h(tag, attrs) {
    const isSvg = !!SVG_TAGS[tag];
    const node = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'class') { isSvg ? node.setAttribute('class', attrs[k]) : node.className = attrs[k]; }
      else if (k === 'text') node.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1);

  /* ---------- 线性图标 ---------- */
  const ICONS = {
    leaf: '<path d="M6 19c0-8 6-14 15-15-1 9-7 15-15 15Z" fill="currentColor" stroke="none" opacity=".9"/><path d="M6 19c4-4 8-7 12-9"/>',
    line: '<path d="M4 18 9 11l4 3 7-8"/><path d="M17 6h3v3"/>',
    bars: '<path d="M7 20v-9"/><path d="M12 20V4"/><path d="M17 20v-6"/>',
    radar: '<path d="M12 3 20 8v8l-8 5-8-5V8Z"/><path d="M12 3v18M4 8l8 5 8-5"/>',
    tag: '<path d="M3 12 12 3h6v6l-9 9Z"/><circle cx="15.5" cy="8.5" r="1.3"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    table: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M9 10v9M15 10v9"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
    reset: '<path d="M4 12a8 8 0 1 1 2.5 5.8"/><path d="M4 19v-5h5"/>',
    print: '<path d="M7 8V4h10v4"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    back: '<path d="M15 5 8 12l7 7"/><path d="M20 5l-7 7 7 7"/>'
  };
  function icon(name, size) {
    return h('svg', { width: size || 18, height: size || 18, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', html: ICONS[name] });
  }

  /* ---------- toast（轻量，非弹窗） ---------- */
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('dkToast');
    if (!t) {
      t = h('div', { class: 'dk-toast', id: 'dkToast' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1900);
  }

  let DATA = null, FLAT = [];
  const fact = id => FLAT.find(f => f.id === id);

  /* ============================================================
     1) KPI 卡
     ============================================================ */
  function kpiCard(label, value, unit, note, accent) {
    return h('article', { class: 'dk-card dk-kpi' },
      h('div', { class: 'dk-kpi-label' }, label),
      h('div', { class: 'dk-kpi-val' + (accent ? ' accent-' + accent : '') },
        h('b', { class: 'tnum', text: value },
          h('span', { class: 'dk-kpi-unit', text: unit }))),
      h('div', { class: 'dk-kpi-note note-line', text: note }));
  }

  /* ============================================================
     2) 折线/面积趋势（下拉切换指标，事实实心、目标空心）
     ============================================================ */
  const SERIES = {
    output: {
      name: '茶叶产量', unit: '吨',
      points: [['2024', 'F01', 'fact'], ['2025', 'F02', 'fact']]
    },
    value: {
      name: '产业产值', unit: '亿元',
      points: [['2024', 'F06', 'fact'], ['2025', 'F07', 'fact'], ['2030', 'F09', 'plan']]
    },
    price: {
      name: '茶叶均价', unit: '元/斤',
      points: [['2024', 'F19', 'fact'], ['2025春', 'F20', 'fact']]
    },
    visitors: {
      name: '游客规模', unit: '万人次',
      points: [['2025', 'F23', 'fact'], ['2030', 'F26', 'plan']]
    },
    gdp: {
      name: '全镇GDP', unit: '亿元',
      points: [['2021', '__gdp21', 'fact'], ['2025', 'F31', 'fact'], ['2030', 'F32', 'plan']]
    }
  };
  function resolvePoint(p) {
    const [label, fid, kind] = p;
    let v, note = '';
    if (fid === '__gdp21') { v = 15.15; note = '2021 年口径（F31 备注）'; }
    else {
      const f = fact(fid);
      v = f.value; note = f.qualifier || '';
    }
    return { label, value: v, kind, note };
  }
  function lineChart(key) {
    const cfg = SERIES[key];
    const pts = cfg.points.map(resolvePoint);
    const W = 640, H = 260, L = 46, R = 24, T = 24, B = 40;
    const vals = pts.map(p => p.value);
    const vmax = Math.max(...vals), vmin = Math.min(...vals);
    const pad = (vmax - vmin) * 0.25 || vmax * 0.2;
    const top = vmax + pad, bot = Math.max(0, vmin - pad);
    const x = i => L + i * (W - L - R) / (pts.length - 1);
    const y = v => H - B - (v - bot) / (top - bot || 1) * (H - T - B);

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(k => {
      const gy = T + k * (H - T - B), gv = top - k * (top - bot);
      return [
        h('line', { class: 'dk-grid-line', x1: L, y1: gy, x2: W - R, y2: gy }),
        h('text', { class: 'dk-axis-text', x: L - 8, y: gy + 4, 'text-anchor': 'end', text: f1(gv) })
      ];
    });

    const linePts = pts.map((p, i) => [x(i), y(p.value)]);
    const dPath = linePts.map((q, i) => (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1])).join(' ');
    const areaPath = dPath + ' L' + f1(x(pts.length - 1)) + ' ' + (H - B) + ' L' + f1(x(0)) + ' ' + (H - B) + ' Z';

    const nodes = pts.map((p, i) => {
      const c = h('circle', {
        class: 'dk-lc-node' + (p.kind === 'plan' ? ' plan' : ''),
        cx: x(i), cy: y(p.value), r: p.kind === 'plan' ? 6 : 5,
        onclick: () => toast(p.label + ' · ' + p.value + ' ' + cfg.unit + (p.kind === 'plan' ? '（目标，非预测）' : ''))
      });
      return [c, h('text', { class: 'dk-lc-label', x: x(i), y: H - B + 20, 'text-anchor': 'middle', text: p.label })];
    });

    return h('svg', { class: 'dk-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.name + '趋势' },
      h('defs', {},
        h('linearGradient', { id: 'lcFill-' + key, x1: 0, x2: 0, y1: 0, y2: 1 },
          h('stop', { 'stop-color': 'var(--neon)', 'stop-opacity': 0.28 }),
          h('stop', { offset: 1, 'stop-color': 'var(--neon)', 'stop-opacity': 0 }))),
      ...gridLines.flat(),
      h('path', { d: areaPath, fill: 'url(#lcFill-' + key + ')' }),
      h('path', { class: 'dk-lc-line', d: dPath }),
      ...nodes.flat());
  }

  /* changes 最终仍不可用时的降级（不阻塞其余模块） */
  function changesUnavailable() {
    return h('div', { class: 'dk-empty' }, '事件数据暂未加载',
      h('button', { class: 'dk-btn', style: 'margin-top:12px;', onclick: () => location.reload() }, '重试'));
  }

  /* ============================================================
     3) 分段堆叠条（事件三大类）
     ============================================================ */
  function stackedBar() {
    if (!DATA.changes) return changesUnavailable();
    const officialTypes = ['官方报告', '官方综述', '官方发布', '官方报道'];
    const b = { 官方类: 0, 媒体类: 0, 产业协作类: 0 };
    DATA.changes.changes.forEach(c => {
      if (officialTypes.includes(c.type)) b.官方类++;
      else if (c.type === '媒体报道') b.媒体类++;
      else b.产业协作类++;
    });
    const total = DATA.changes.changes.length;
    const colors = { 官方类: 'var(--neon)', 媒体类: 'var(--amber)', 产业协作类: 'var(--cyan)' };
    const segs = Object.keys(b).map(k =>
      h('div', { class: 'dk-stack-seg', style: 'width:' + (b[k] / total * 100) + '%;background:' + colors[k],
        onclick: () => toast(k + ' ' + b[k] + ' 件，占 ' + f1(b[k] / total * 100) + '%') }));
    const legend = Object.keys(b).map(k =>
      h('span', { class: 'dk-mini-legend' }, h('i', { style: 'background:' + colors[k] }), k + ' ' + b[k]));
    return h('div', {},
      h('div', { class: 'dk-stack' }, ...segs),
      h('div', { class: 'dk-legend-row' }, ...legend));
  }

  /* ============================================================
     4) 横向条形排行（经营主体，单位：家）
     ============================================================ */
  function rankBars() {
    const rows = [
      ['协会整合成员', fact('F15').value],
      ['合作社及企业', fact('F13').value],
      ['酒店民宿', fact('F28').value]
    ];
    const max = Math.max(...rows.map(r => r[1]));
    return h('div', { class: 'dk-rank' }, ...rows.map(r =>
      h('div', { class: 'dk-rank-row' },
        h('span', { class: 'dk-rank-name', text: r[0] }),
        h('div', { class: 'dk-rank-track' },
          h('div', { class: 'dk-rank-fill', style: 'width:' + (r[1] / max * 100) + '%' })),
        h('b', { class: 'tnum dk-rank-val', text: String(r[1]) }))));
  }

  /* ============================================================
     5) 雷达（证据覆盖，求和归一；反映证据多寡，非产业成熟度）
     ============================================================ */
  const RADAR_DIM = {
    种植与产量: ['F01', 'F02', 'F03', 'F04', 'F05', 'F10', 'F11', 'F12'],
    加工与衍生: ['F21', 'F22'],
    品牌与标准: ['F29', 'F30'],
    渠道与市场: ['F19', 'F20'],
    文旅茶旅: ['F23', 'F24', 'F25', 'F26', 'F27', 'F28'],
    组织与协作: ['F06', 'F07', 'F08', 'F09', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F31', 'F32', 'F33', 'F34']
  };
  function radarVals() {
    const W = { A: 10, B: 7, C: 4 };
    const raw = {};
    Object.keys(RADAR_DIM).forEach(d => {
      let s = 0;
      RADAR_DIM[d].forEach(id => {
        const f = fact(id);
        if (!f) return;
        let w = W[f.grade] || 4;
        if (f.kind === 'conflict') w = w / 2;
        s += w;
      });
      raw[d] = s;
    });
    const mx = Math.max(...Object.values(raw));
    const out = {};
    Object.keys(raw).forEach(d => out[d] = raw[d] / mx * 100);
    return out;
  }
  function radarChart() {
    const vals = radarVals();
    const keys = Object.keys(vals);
    const N = keys.length, CX = 160, CY = 150, R = 108;
    const ang = i => -Math.PI / 2 + i * 2 * Math.PI / N;
    const pt = (i, r) => [CX + Math.cos(ang(i)) * r, CY + Math.sin(ang(i)) * r];
    const rings = [0.25, 0.5, 0.75, 1].map(k => {
      const d = keys.map((_, i) => { const q = pt(i, R * k); return (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); }).join(' ') + ' Z';
      return h('path', { class: 'dk-radar-ring', d });
    });
    const axes = keys.map((k, i) => {
      const q = pt(i, R);
      return [h('line', { class: 'dk-radar-axis', x1: CX, y1: CY, x2: q[0], y2: q[1] }),
        h('text', {
          class: 'dk-radar-label', x: CX + Math.cos(ang(i)) * (R + 22), y: CY + Math.sin(ang(i)) * (R + 22) + 4,
          'text-anchor': 'middle', text: k, onclick: () => toast(k + ' · 证据覆盖 ' + f1(vals[k]))
        })];
    });
    const polyD = keys.map((k, i) => { const q = pt(i, R * vals[k] / 100); return (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); }).join(' ') + ' Z';
    const dots = keys.map((k, i) => { const q = pt(i, R * vals[k] / 100); return h('circle', { class: 'dk-radar-dot', cx: q[0], cy: q[1], r: 3.5 }); });
    return h('svg', { class: 'dk-svg dk-radar-svg', viewBox: '0 0 320 300' }, ...rings, ...axes.flat(),
      h('path', { class: 'dk-radar-poly', d: polyD }), ...dots);
  }

  /* ============================================================
     6) 标签云（关键实体，不编造词频）
     ============================================================ */
  function tagCloud() {
    const tags = [
      ['茶产业协会', '65 家'], ['合作社企业', '58 家'], ['中央茶厂', '150 吨/年'],
      ['茶咖店', '20 万游客'], ['逸山海', 'IP 百强'], ['采茶机器人', '已投用'],
      ['地方标准', 'DB4413/T6'], ['地理标志', '已核准'], ['制茶技艺', '市级非遗'],
      ['茶衍生品', '3000 万+'], ['福博合茗', '战略签约'], ['茶产业综合体', '广东首个']
    ];
    return h('div', { class: 'dk-tagcloud' }, ...tags.map(t =>
      h('span', { class: 'dk-tag', onclick: () => toast(t[0] + ' · ' + t[1]) }, t[0], h('b', { text: t[1] }))));
  }

  /* ============================================================
     7) 事件流时间线（下拉 + 搜索）
     ============================================================ */
  function feedPanel() {
    if (!DATA.changes) return changesUnavailable();
    const officialTypes = ['官方报告', '官方综述', '官方发布', '官方报道'];
    const list = h('div', { class: 'dk-feed' });
    const search = h('input', { class: 'dk-input', placeholder: '搜索事件标题…' });
    const sel = h('select', { class: 'dk-select' },
      h('option', { value: '全部', text: '全部类型' }),
      h('option', { value: '官方类', text: '官方类' }),
      h('option', { value: '媒体类', text: '媒体类' }),
      h('option', { value: '产业协作类', text: '产业协作类' }));

    function catOf(c) {
      if (officialTypes.includes(c.type)) return '官方类';
      if (c.type === '媒体报道') return '媒体类';
      return '产业协作类';
    }
    function render() {
      const q = search.value.trim().toLowerCase(), cat = sel.value;
      const rows = DATA.changes.changes.filter(c =>
        (cat === '全部' || catOf(c) === cat) &&
        (!q || (c.title + c.type + c.summary).toLowerCase().includes(q)));
      list.innerHTML = '';
      if (!rows.length) { list.appendChild(h('div', { class: 'dk-empty' }, '没有匹配的事件')); return; }
      rows.forEach(c => list.appendChild(h('div', { class: 'dk-feed-item dk-feed-' + catOf(c) },
        h('b', { text: c.date + ' · ' + c.type }),
        h('p', { text: c.title }))));
    }
    search.addEventListener('input', render);
    sel.addEventListener('change', render);
    render();
    return h('div', {},
      h('div', { class: 'dk-filter-bar' },
        h('div', { class: 'dk-field' }, icon('search', 15), search),
        h('div', { class: 'dk-field dk-field-narrow' }, sel)),
      list);
  }

  /* ============================================================
     8) 可筛选事实表（搜索 + 等级/分组下拉）
     ============================================================ */
  function factTable() {
    const search = h('input', { class: 'dk-input', placeholder: '搜索指标名称…' });
    const gradeSel = h('select', { class: 'dk-select' },
      h('option', { value: '全部', text: '全部等级' }),
      h('option', { text: 'A' }), h('option', { text: 'B' }), h('option', { text: 'C' }));
    const groups = [...new Set(FLAT.map(f => f.group))];
    const groupSel = h('select', { class: 'dk-select' },
      h('option', { value: '全部', text: '全部分组' }),
      ...groups.map(g => h('option', { text: g })));
    const body = h('tbody', {});
    const empty = h('div', { class: 'dk-empty', hidden: true }, '没有匹配的指标');

    function render() {
      const q = search.value.trim().toLowerCase();
      const rows = FLAT.filter(f =>
        (!q || (f.name + f.id).toLowerCase().includes(q)) &&
        (gradeSel.value === '全部' || f.grade === gradeSel.value) &&
        (groupSel.value === '全部' || f.group === groupSel.value));
      body.innerHTML = '';
      empty.hidden = rows.length > 0;
      rows.forEach(f => body.appendChild(h('tr', {},
        h('td', { class: 'tnum', text: f.id }),
        h('td', { text: f.name }),
        h('td', { class: 'tnum', text: (typeof f.value === 'number' ? f.value : f.value) + (f.unit ? ' ' + f.unit : '') }),
        h('td', {}, h('span', { class: 'dk-badge grade-' + f.grade, text: f.grade })),
        h('td', { class: 'note-line dk-cell-note', text: f.kind === 'plan' ? '目标，非预测' : (f.qualifier || '') }))));
    }
    search.addEventListener('input', render);
    gradeSel.addEventListener('change', render);
    groupSel.addEventListener('change', render);
    render();

    return h('div', {},
      h('div', { class: 'dk-filter-bar' },
        h('div', { class: 'dk-field' }, icon('search', 15), search),
        h('div', { class: 'dk-field dk-field-narrow' }, gradeSel),
        h('div', { class: 'dk-field' }, groupSel)),
      h('div', { class: 'dk-table-wrap' },
        h('table', { class: 'dk-table' },
          h('thead', {}, h('tr', {},
            h('th', { text: 'ID' }), h('th', { text: '指标' }), h('th', { text: '数值' }),
            h('th', { text: '等级' }), h('th', { text: '口径' }))),
          body)),
      empty);
  }

  /* ============================================================
     卡片容器
     ============================================================ */
  function panel(title, iconName, content) {
    return h('section', { class: 'dk-card' },
      h('div', { class: 'dk-panel-head' },
        h('span', { class: 'dk-panel-icon' }, icon(iconName)),
        h('h3', { text: title })),
      content);
  }

  /* 本台自行带退避加载 changes，避免平台波动时可选后台加载静默为 null */
  async function loadChanges() {
    const BACK = [300, 500, 750, 1000, 1300, 1600, 2000];
    for (let k = 0; k <= BACK.length; k++) {
      try {
        const res = await fetch('data/changes.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        if (k === BACK.length) return null;
        await new Promise(r => setTimeout(r, BACK[k]));
      }
    }
    return null;
  }

  /* ============================================================
     组装
     ============================================================ */
  async function boot() {
    DATA = await TeaData.loadAll();
    FLAT = TeaData.flatFacts(DATA);
    // changes 为可选后台加载；先给它一点时间，未就绪则本台自行带重试加载
    for (let i = 0; i < 8 && !DATA.changes; i++) await new Promise(r => setTimeout(r, 250));
    if (!DATA.changes) DATA.changes = await loadChanges();

    /* 指标切换下拉（折线） */
    const metricSel = h('select', { class: 'dk-select' },
      ...Object.keys(SERIES).map(k => h('option', { value: k, text: SERIES[k].name })));
    const chartHost = h('div', { class: 'dk-chart-host' }, lineChart('output'));
    metricSel.addEventListener('change', () => {
      chartHost.innerHTML = '';
      chartHost.appendChild(lineChart(metricSel.value));
    });

    const header = h('header', { class: 'dk-header' },
      h('div', { class: 'dk-brand' },
        h('span', { class: 'dk-logo' }, icon('leaf', 20)),
        h('div', {},
          h('h1', { text: '柏塘山茶 · 数据探索台' }),
          h('div', { class: 'dk-header-sub note-line' }, 'BAITANG TEA DATA DECK · 更新于 ' + DATA.meta.updated))),
      h('div', { class: 'dk-header-actions' },
        h('button', { class: 'dk-btn', onclick: () => window.print() }, icon('print', 16), '导出 / 打印'),
        h('button', { class: 'dk-btn primary', onclick: () => location.href = 'index.html' }, icon('back', 16), '回到 9 屏')));

    const kpis = h('section', { class: 'dk-kpi-grid' },
      kpiCard('综合产值', '12', '亿', 'F07 · 2025 约数'),
      kpiCard('年产量', '2449', '吨', 'F02 · 镇级口径'),
      kpiCard('年游客', '130', '万+', 'F23 · 建模下限'),
      kpiCard('2030 目标', '20', '亿', 'F09 · 目标非预测', 'coral'));

    const trendPanel = panel('指标趋势（下拉切换）', 'line',
      h('div', {},
        h('div', { class: 'dk-trend-top' },
          h('div', { class: 'dk-field dk-field-narrow' }, metricSel),
          h('span', { class: 'note-line' }, '实心=已观测事实，空心=规划目标')),
        chartHost));

    const root = h('div', {},
      header,
      kpis,
      h('div', { class: 'dk-grid dk-grid-2' },
        trendPanel,
        panel('事件类型构成（共 16 件）', 'bars', stackedBar())),
      h('div', { class: 'dk-grid dk-grid-2' },
        panel('经营主体规模（家）', 'bars', rankBars()),
        panel('证据覆盖雷达', 'radar',
          h('div', {}, radarChart(),
            h('p', { class: 'note-line dk-radar-note' }, 'C 级派生：反映各环节可核验证据的多寡，不代表产业成熟度；下游环节证据稀薄，与第 6 屏堵点互相印证。')))),
      panel('关键实体标签', 'tag', tagCloud()),
      h('div', { class: 'dk-grid dk-grid-2' },
        panel('产业变化事件流', 'clock', feedPanel()),
        panel('事实指标库（34 项可筛选）', 'table', factTable())),
      h('footer', { class: 'dk-foot note-line' },
        '数据均来自可核验公开来源（A/B/C 分级）；目标与事实分开、冲突口径不取平均；本台为决策支持工具，不替代官方核算。'));

    const rootEl = document.getElementById('dkRoot');
    rootEl.innerHTML = '';
    rootEl.appendChild(root);
    // 补星星（与主页面一致的场景细节）
    if (typeof window.TeaStars === 'function') window.TeaStars();
  }

  boot().catch(err => {
    const el = document.getElementById('dkRoot');
    if (el) el.innerHTML = '<div class="dk-boot"><div class="note-line">数据加载失败：' + err.message + '</div><button class="dk-btn" onclick="location.reload()">重新加载</button></div>';
  });
})();
