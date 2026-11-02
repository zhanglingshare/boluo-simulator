/* 五个视图渲染：总览 / 关系网络 / 情报证据 / 情景推演 / 我的记录。 */
(function (global) {
  'use strict';

  const SVG_TAGS = { svg: 1, rect: 1, circle: 1, path: 1, g: 1, text: 1, line: 1, polyline: 1, polygon: 1, ellipse: 1, defs: 1, use: 1 };

  function h(tag, attrs) {
    const svgTag = !!SVG_TAGS[tag];
    const node = svgTag
      ? document.createElementNS('http://www.w3.org/2000/svg', tag)
      : document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'class') { if (svgTag) node.setAttribute('class', attrs[k]); else node.className = attrs[k]; }
      else if (k === 'text') node.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    for (let i = 2; i < arguments.length; i++) {
      const child = arguments[i];
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  function badge(grade) {
    return h('span', { class: 'badge ' + grade }, grade + ' 级');
  }

  function findFact(data, id) {
    return TeaData.flatFacts(data).find(f => f.id === id);
  }

  /* ============ 1. 总览 ============ */
  function renderOverview(ctx) {
    const data = ctx.data;
    const kpiIds = ['F02', 'F07', 'F10', 'F23'];
    const kpiCards = kpiIds.map(id => {
      const f = findFact(data, id);
      return h('div', { class: 'card kpi' },
        h('div', { class: 'k-label' }, badge(f.grade), f.name),
        h('div', { class: 'k-value' }, String(f.value), h('span', { class: 'k-unit' }, f.unit)),
        h('div', { class: 'k-note' }, f.qualifier)
      );
    });

    const recent = data.changes.changes.slice(0, 7).map(ch =>
      h('div', { class: 'tl-item' },
        h('div', { class: 'tl-date' }, ch.date),
        h('div', { class: 'tl-title' }, ch.title),
        h('div', { class: 'tl-summary' }, ch.summary)
      )
    );

    const gaps = data.meta.data_gaps.map(g =>
      h('div', { class: 'tl-item' },
        h('div', { class: 'tl-title' }, g.name),
        h('div', { class: 'tl-summary' }, '需要：' + g.need)
      )
    );

    return h('div', { class: 'view' },
      h('div', { class: 'view-head' },
        h('div', { class: 'view-kicker' }, 'OVERVIEW · 总览'),
        h('h1', { class: 'view-title' }, '柏塘山茶，一门正在被看见的生意'),
        h('p', { class: 'view-desc' }, '基于公开政务、标准与媒体信息分级整理。所有数字可回指来源，规划目标与已实现事实分开呈现，冲突口径并列不取平均。')
      ),
      h('div', { class: 'grid', style: 'grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin-bottom:22px;' }, ...kpiCards),
      h('div', { class: 'grid', style: 'grid-template-columns:1.5fr 1fr;align-items:start;' },
        h('div', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, '最新变化'), h('span', { class: 'hint' }, '近 7 条')),
          h('div', { class: 'timeline' }, ...recent),
          h('button', { class: 'btn ghost', onclick: () => ctx.navigate('evidence') }, '查看全部情报证据 →')
        ),
        h('div', { class: 'card' },
          h('div', { class: 'card-h' }, h('h3', null, '关键空白')),
          h('div', { class: 'timeline' }, ...gaps),
          h('button', { class: 'btn', style: 'width:100%;justify-content:center;margin-top:6px;', onclick: () => ctx.navigate('network') }, '进入关系网络')
        )
      )
    );
  }

  /* ============ 2. 关系网络 ============ */
  function renderNetwork(ctx) {
    const data = ctx.data;
    const srcMap = TeaData.sourceMap(data);

    const stage = h('div', { class: 'network-stage', id: 'network-stage' });
    const inspectorSlot = h('div');

    const groupLegend = data.network.group_legend.map(g =>
      h('div', { class: 'legend-row' },
        h('span', { class: 'swatch', style: 'background:' + (g.color === 'amber' ? 'var(--amber)' : g.color === 'neutral' ? 'var(--grade-d)' : 'var(--tea)') }),
        g.name)
    );
    const edgeLegend = data.network.edge_status_legend;

    const legend = h('div', { class: 'net-legend' },
      h('div', { class: 'legend-box' }, h('h4', null, '节点分组'), ...groupLegend),
      h('div', { class: 'legend-box' }, h('h4', null, '关系类型'),
        h('div', { class: 'legend-line' }, h('span', { class: 'ln' }), '已核实/报道'),
        h('div', { class: 'legend-line' }, h('span', { class: 'ln dash' }), '待验证（不进结论）')
      )
    );

    const wrap = h('div', { class: 'network-wrap' }, stage, legend);

    const view = h('div', { class: 'view' },
      h('div', { class: 'view-head' },
        h('div', { class: 'view-kicker' }, 'NETWORK · 关系网络'),
        h('h1', { class: 'view-title' }, '谁与谁有关，哪里正在变'),
        h('p', { class: 'view-desc' }, '拖动节点可调整布局，点击节点查看详情与来源；虚线为待验证关系，不作为结论依据。')
      ),
      wrap,
      inspectorSlot
    );

    global.setTimeout(() => {
      global.TeaNetwork.create(stage, data.network, {
        onSelect: n => showInspector(n),
        onBackground: () => { inspectorSlot.innerHTML = ''; }
      });
    }, 0);

    function showInspector(n) {
      const sourceLinks = n.sources.map(sid => {
        const s = srcMap[sid];
        return h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.publisher + ' · ' + s.title);
      });
      inspectorSlot.innerHTML = '';
      const box = h('div', { class: 'node-inspector', style: 'position:static;width:100%;box-shadow:none;margin-top:16px;' },
        h('div', { class: 'ni-title' }, n.name),
        h('div', { class: 'ni-sub' }, n.sub + (n.gap ? ' · 关键空白' : '')),
        h('div', { class: 'ni-detail' }, n.detail),
        h('div', { class: 'ni-sources' }, ...sourceLinks)
      );
      inspectorSlot.appendChild(box);
    }

    return view;
  }

  /* ============ 3. 情报证据 ============ */
  function renderEvidence(ctx) {
    const data = ctx.data;
    let filter = 'ALL';

    const listSlot = h('div');

    function drawList() {
      listSlot.innerHTML = '';
      const rows = data.sources.sources
        .filter(s => filter === 'ALL' || s.grade === filter)
        .map(s =>
          h('div', { class: 'source-row' },
            badge(s.grade),
            h('div', { class: 'sr-main' },
              h('div', { class: 'sr-title' }, s.title),
              h('div', { class: 'sr-meta' }, h('span', null, s.publisher), h('span', null, s.date || '编目')),
              h('a', { class: 'sr-link', href: s.url, target: '_blank', rel: 'noopener' }, s.url),
              h('div', { class: 'sr-limit' }, '口径限制：' + s.limit)
            )
          )
        );
      listSlot.appendChild(rows.length ? h('div', null, ...rows) : h('div', { class: 'empty' }, '该等级暂无来源'));
    }

    const filters = ['ALL', 'A', 'B', 'C', 'D'].map(g =>
      h('button', {
        class: 'btn' + (filter === g ? ' primary' : ''),
        onclick: function () {
          filter = g;
          updateFilterBtns();
          drawList();
        }
      }, g === 'ALL' ? '全部' : g + ' 级')
    );
    const filterBar = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;', id: 'filter-bar' }, ...filters);

    function updateFilterBtns() {
      const btns = filterBar.querySelectorAll('button');
      btns.forEach((b, i) => {
        b.className = 'btn' + (filter === ['ALL', 'A', 'B', 'C', 'D'][i] ? ' primary' : '');
      });
    }

    const conflictCards = data.conflicts.conflicts.map(c =>
      h('div', { class: 'card conflict', style: 'margin-bottom:14px;' },
        h('div', { class: 'card-h' }, h('h3', null, c.title)),
        h('div', { class: 'cf-versions' },
          ...c.versions.map(v =>
            h('div', { class: 'cf-ver' }, h('b', null, v.label), h('span', null, v.note))
          )
        ),
        h('div', { class: 'cf-rule' }, '处理纪律：' + c.rule),
        h('div', { class: 'cf-next' }, '下一步：' + c.next)
      )
    );

    drawList();

    return h('div', { class: 'view' },
      h('div', { class: 'view-head' },
        h('div', { class: 'view-kicker' }, 'EVIDENCE · 情报证据'),
        h('h1', { class: 'view-title' }, '每条数字，都能回到一个真实来源'),
        h('p', { class: 'view-desc' }, '共 ' + data.sources.sources.length + ' 个登记来源，按证据等级分级；每条标注口径限制，冲突口径单独呈现。')
      ),
      h('div', { class: 'grid', style: 'grid-template-columns:1.4fr 1fr;align-items:start;' },
        h('div', { class: 'card' }, filterBar, listSlot),
        h('div', null, ...conflictCards)
      )
    );
  }

  /* ============ 4. 情景推演（蒙特卡洛） ============ */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function runSimulation(params, seed) {
    const rnd = mulberry32(seed);
    const N = 2000;
    const base = 100; // 2025 综合产值指数 = 100
    const results = [];
    for (let i = 0; i < N; i++) {
      const visitGrowth = params.visitMin + rnd() * (params.visitMax - params.visitMin);
      const b2b = params.b2bMin + rnd() * (params.b2bMax - params.b2bMin);
      const useRate = params.useMin + rnd() * (params.useMax - params.useMin);
      // 情景指数：文旅拉动 + B端原料 + 加工利用，均为相对贡献，非真实产值
      const travelPart = visitGrowth * 0.55 * 5;
      const b2bPart = b2b * 40 * useRate;
      const idx = base + travelPart + b2bPart;
      results.push(idx);
    }
    results.sort((a, b) => a - b);
    const q = p => results[Math.min(results.length - 1, Math.floor(p * results.length))];
    return {
      p10: q(0.10), p50: q(0.50), p90: q(0.90),
      mean: results.reduce((a, b) => a + b, 0) / results.length,
      results
    };
  }

  function histogram(results, bins) {
    const min = results[0], max = results[results.length - 1];
    const width = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    results.forEach(r => {
      const i = Math.min(bins - 1, Math.floor((r - min) / width));
      counts[i]++;
    });
    return { counts, min, max, width };
  }

  function renderSimulate(ctx) {
    const data = ctx.data;
    const params = {
      visitMin: 0.04, visitMax: 0.30,
      b2bMin: 0.08, b2bMax: 0.38,
      useMin: 0.20, useMax: 0.90
    };

    const outSlot = h('div', { class: 'sim-output' });

    function slider(label, keyLo, keyHi, unit, fmt) {
      const loVal = h('b', null, fmt(params[keyLo]));
      const hiVal = h('b', null, fmt(params[keyHi]));
      const lo = h('input', { type: 'range', min: 0, max: 100, value: 0 });
      const hi = h('input', { type: 'range', min: 0, max: 100, value: 100 });
      function sync() {
        const span = defaultRanges[keyHi] - defaultRanges[keyLo];
        params[keyLo] = defaultRanges[keyLo] + Number(lo.value) / 100 * span;
        params[keyHi] = defaultRanges[keyLo] + Number(hi.value) / 100 * span;
        if (params[keyHi] < params[keyLo]) params[keyHi] = params[keyLo];
        loVal.textContent = fmt(params[keyLo]);
        hiVal.textContent = fmt(params[keyHi]);
        draw();
      }
      lo.addEventListener('input', sync);
      hi.addEventListener('input', sync);
      return h('div', { class: 'slider-field' },
        h('div', { class: 'sf-label' }, h('span', null, label), h('span', null)),
        h('div', null, h('span', { style: 'font-size:11px;color:var(--ink-faint);' }, '下限 '), loVal, lo),
        h('div', null, h('span', { style: 'font-size:11px;color:var(--ink-faint);' }, '上限 '), hiVal, hi),
        h('div', { class: 'sf-range' }, unit)
      );
    }

    const defaultRanges = {
      visitMin: 0.04, visitMax: 0.30, b2bMin: 0.08, b2bMax: 0.38, useMin: 0.20, useMax: 0.90
    };
    const pct = v => (v * 100).toFixed(0) + '%';

    const controls = h('div', { class: 'sim-controls' },
      slider('游客年增速区间', 'visitMin', 'visitMax', '情景压力区间，非统计置信区间', pct),
      slider('B端原料茶份额', 'b2bMin', 'b2bMax', 'D 级假设，需采购台账验证', pct),
      slider('综合体实际使用率', 'useMin', 'useMax', '设计产能利用比例', pct)
    );

    function draw() {
      const out = runSimulation(params, 42);
      const hist = histogram(out.results, 26);
      const maxCount = Math.max(...hist.counts);

      const binCount = hist.counts.length;
      const bars = hist.counts.map((c, i) => {
        const hh2 = 150 * c / maxCount;
        const x = i * (520 / binCount);
        return h('rect', {
          x: x, y: 170 - hh2, width: 520 / binCount - 2, height: hh2,
          fill: '#b9d0c3', rx: 2
        });
      });
      const svg = h('svg', { viewBox: '0 0 540 185', style: 'width:100%;height:185px;display:block;' }, ...bars);

      outSlot.innerHTML = '';
      outSlot.appendChild(
        h('div', null,
          h('div', { class: 'sim-stat-row' },
            stat('P10', out.p10), stat('P50 中位', out.p50), stat('P90', out.p90), stat('均值', out.mean)),
          svg,
          h('div', { class: 'disclaimer' },
            '结果为 2025=100 的情景指数，不是经过校准的产值预测，也不是真实金额。输入区间含 C/D 级假设，已在上方显式披露；抽样可复现（固定随机种子 42，2000 条路径）。规划目标不等于预测，冲突口径未取平均。')
        )
      );
    }

    function stat(label, val) {
      return h('div', { class: 'sim-stat' },
        h('span', { class: 'ss-label' }, label),
        h('span', { class: 'ss-val' }, val.toFixed(1)));
    }

    draw();

    return h('div', { class: 'view' },
      h('div', { class: 'view-head' },
        h('div', { class: 'view-kicker' }, 'SIMULATION · 情景推演'),
        h('h1', { class: 'view-title' }, '2030 年，可能出现怎样的分化'),
        h('p', { class: 'view-desc' }, '调整压力区间，观察 2000 条模拟路径的分布；这里给的是情景指数而非预测，所有假设均可被后续实测覆盖。')
      ),
      h('div', { class: 'card', style: 'margin-bottom:18px;' },
        h('div', { class: 'card-h' }, h('h3', null, '压力输入（C/D 级假设）')), controls),
      h('div', { class: 'card' },
        h('div', { class: 'card-h' }, h('h3', null, '情景分布 · 2025=100'), h('span', { class: 'hint' }, '2000 条路径')),
        outSlot)
    );
  }

  /* ============ 5. 我的记录 ============ */
  const STORE_KEY = 'baitang-tea-notes';
  function loadNotes() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveNotes(notes) { localStorage.setItem(STORE_KEY, JSON.stringify(notes)); }

  function renderRecords(ctx) {
    let notes = loadNotes();
    const listSlot = h('div');
    const input = h('textarea', { class: 'note-input', placeholder: '记下你的观察、疑问或待核实的线索…' });

    function draw() {
      listSlot.innerHTML = '';
      if (!notes.length) {
        listSlot.appendChild(h('div', { class: 'empty' }, '还没有记录，先写一条吧。'));
        return;
      }
      notes.forEach((n, i) => {
        listSlot.appendChild(
          h('div', { class: 'note-item' },
            h('div', { class: 'nt-body' },
              h('div', null, n.text),
              h('div', { class: 'nt-time' }, n.time)),
            h('button', {
              class: 'nt-del', title: '删除',
              onclick: () => { notes.splice(i, 1); saveNotes(notes); draw(); }
            },
              h('span', null, '删除'))
          )
        );
      });
    }

    function add() {
      const text = input.value.trim();
      if (!text) return;
      notes.unshift({ text: text, time: new Date().toLocaleString('zh-CN') });
      saveNotes(notes);
      input.value = '';
      draw();
    }

    draw();

    return h('div', { class: 'view' },
      h('div', { class: 'view-head' },
        h('div', { class: 'view-kicker' }, 'RECORDS · 我的记录'),
        h('h1', { class: 'view-title' }, '我的观察与待核实线索'),
        h('p', { class: 'view-desc' }, '记录保存在本机浏览器，不会上传；可用于追踪待核实的口径与线索。')
      ),
      h('div', { class: 'card', style: 'margin-bottom:18px;' },
        input,
        h('div', { style: 'margin-top:12px;display:flex;gap:10px;' },
          h('button', { class: 'btn primary', onclick: add }, '保存记录'))),
      h('div', { class: 'card' }, listSlot)
    );
  }

  global.TeaViews = {
    overview: renderOverview,
    network: renderNetwork,
    evidence: renderEvidence,
    simulate: renderSimulate,
    records: renderRecords
  };
})(window);
