/* 柏塘山茶 · 7 屏叙事主逻辑
   原则：Δ 是主角；每屏只演一次变化（数字 600ms 冲上去，条 400ms 到位即停）。
   前端只读静态 JSON，不做在线调用；所有数字可回指来源。 */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = { svg: 1, rect: 1, circle: 1, path: 1, g: 1, text: 1, line: 1, polyline: 1, polygon: 1, ellipse: 1 };

  /* ---------- 通用 DOM/SVG 构造 ---------- */
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
  const f2 = n => (Math.round(n * 100) / 100).toFixed(2);

  /* ---------- 线性图标 ---------- */
  const ICONS = {
    leaf: '<path d="M6 19c0-8 6-14 15-15-1 9-7 15-15 15Z" fill="currentColor" stroke="none" opacity=".9"/><path d="M6 19c4-4 8-7 12-9" />',
    sprout: '<path d="M12 21v-8"/><path d="M12 13c-3.2 0-5.5-2.2-5.5-5.5C9.8 7.5 12 9.7 12 13Z"/><path d="M12 13c3.2 0 5.5-2.2 5.5-5.5C14.2 7.5 12 9.7 12 13Z"/>',
    fire: '<path d="M12 3c1.2 3.2-3 4.4-3 8.4a3 3 0 0 0 6 0c0-1.6-1.2-2.2-1.2-2.2 2.2 1.2 3.2 3.2 3.2 5.2a5 5 0 0 1-10 0c0-5 5-6.4 5-11.4Z"/>',
    cup: '<path d="M7 8h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 7 13.5V8Z"/><path d="M18 9.5h1.6a2 2 0 0 1 0 4H18"/><path d="M9.5 4.5c0 1.2 1 1.2 1 2.6M13 4.5c0 1.2 1 1.2 1 2.6"/>',
    box: '<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/>',
    mountain: '<path d="M3 19 9 9.5 13 16l3-4 5 7H3Z"/><path d="M9 9.5 13 16"/>'
  };
  function icon(name, size) {
    return h('svg', { width: size || 22, height: size || 22, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', html: ICONS[name] });
  }

  let DATA = null;
  const fact = id => TeaData.flatFacts(DATA).find(f => f.id === id);

  /* ---------- 数字计数动画（一次性，600ms） ---------- */
  function countEl(target, opts) {
    opts = opts || {};
    const dec = opts.decimals || 0;
    const node = h('span', { class: 'count tnum' }, '0' + (dec ? '.' + '0'.repeat(dec) : ''));
    node.dataset.target = target; node.dataset.dec = dec;
    node.dataset.pre = opts.prefix || ''; node.dataset.suf = opts.suffix || '';
    return node;
  }
  function runCount(node) {
    const target = parseFloat(node.dataset.target);
    const dec = parseInt(node.dataset.dec, 10);
    const pre = node.dataset.pre, suf = node.dataset.suf;
    const dur = 600, t0 = performance.now(), e = t => 1 - Math.pow(1 - t, 3);
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const v = target * e(p);
      node.textContent = pre + v.toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(frame);
      else node.textContent = pre + target.toFixed(dec) + suf;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 一次性激活：reveal + 计数 + 条 ---------- */
  function arm(section) {
    section._activated = false;
    section._activate = function () {
      if (section._activated) return;
      section._activated = true;
      section.querySelectorAll('.reveal').forEach(n => n.classList.add('in'));
      section.querySelectorAll('.count').forEach(runCount);
      section.querySelectorAll('[data-width]').forEach(b => { b.style.width = b.dataset.width; });
    };
  }
  let io;
  function observe() {
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target._activate && en.target._activate();
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('section.screen').forEach(s => io.observe(s));
  }

  /* ---------- 顶栏 ---------- */
  function topbar(idx, title, withRes) {
    const center = withRes
      ? h('div', { class: 'top-res' },
          res(fact('F07'), '12', '亿', '综合产值'),
          res(fact('F02'), '2449', '', '吨 年产量'),
          res(fact('F23'), '130', '', '万 游客'),
          res(fact('F09'), '20', '', '亿 2030目标', true))
      : h('div', { class: 'screen-pill' }, '第 ' + idx + ' 屏 · ' + title);
    return h('header', { class: 'topbar' },
      h('div', { class: 'brand' },
        h('span', { class: 'logo' }, icon('leaf', 18)),
        h('span', null, h('span', { class: 'b-name' }, '柏塘山茶 · 产业情报'),
          h('span', { class: 'b-sub' }, 'BAITANG TEA INTEL'))),
      center,
      h('div', { class: 'clock' }, '更新于', h('br'), h('b', { text: DATA.meta.updated }))
    );
  }
  function res(f, v, unit, label, coral) {
    return h('div', { class: 'r' },
      h('span', { class: 'v' + (coral ? ' coral' : ''), text: v + unit }),
      h('span', { class: 'l', text: label }));
  }

  function foot(verifyHint, nextLabel) {
    return h('div', { class: 'screen-foot' },
      h('div', { class: 'mini-legend' },
        h('span', null, h('i', { style: 'background:var(--grade-a)' }), 'A'),
        h('span', null, h('i', { style: 'background:var(--grade-b)' }), 'B'),
        h('span', null, h('i', { style: 'background:var(--grade-c)' }), 'C'),
        h('span', null, h('i', { style: 'background:var(--grade-d)' }), 'D')),
      h('a', { class: 'scroll-cue', href: '#s' + (verifyHint) },
        h('span', { text: nextLabel }),
        h('span', { class: 'chev' }, h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', html: '<path d="m6 9 6 6 6-6"/>' })))
    );
  }

  /* ============================================================
     第 1 屏 · 结论钩子
     ============================================================ */
  function screen1() {
    const sec = h('section', { class: 'screen', id: 's1' });
    const chart = h('div', { class: 'hook-chart reveal' },
      h('svg', { viewBox: '0 0 460 260', fill: 'none' },
        h('line', { x1: 30, y1: 220, x2: 430, y2: 220, stroke: 'rgba(255,255,255,.12)' }),
        h('line', { x1: 30, y1: 30, x2: 30, y2: 220, stroke: 'rgba(255,255,255,.12)' }),
        // 实际线（茶绿，停在中右）
        h('polyline', { points: '40,200 140,160 240,132 320,118',
          stroke: 'var(--neon)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
        // 预期线（琥珀虚线，继续到右上）
        h('polyline', { points: '320,118 380,80 425,52',
          stroke: 'var(--amber)', 'stroke-width': 2.4, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }),
        // 断裂缺口
        h('line', { x1: 320, y1: 108, x2: 320, y2: 128, stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
        h('circle', { cx: 320, cy: 118, r: 5, fill: 'var(--coral)' }),
        h('text', { x: 330, y: 70, 'font-size': 12, fill: 'var(--amber)' }, '预期 +34.3%'),
        h('text', { x: 250, y: 150, 'font-size': 12, fill: 'var(--neon)' }, '实际 +18.3%'))
    );
    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'hook-layout' },
        h('div', null,
          h('div', { class: 'kicker reveal' }, 'Δ 核心命题'),
          h('h1', { class: 'hero-title reveal d1', html: '数字都在涨。<br>关系，<span class="coral">对不上。</span>' }),
          h('p', { class: 'hero-sub reveal d2' }, '我们不替你下结论，只把变化、缺口和口径，摆到你面前。')),
        chart));
    sec.append(topbar(1, '', true),
      h('div', { class: 'stage-wrap' }, stage),
      foot(2, '向下，先看三个对不上的涨幅'));
    arm(sec);
    return sec;
  }

  /* ============================================================
     第 2 屏 · 冲突（严谨口径）
     ============================================================ */
  function screen2() {
    const sec = h('section', { class: 'screen', id: 's2' });
    const priceGrowth = (300 / 250 - 1) * 100;
    const expected = (1.119 * 1.20 - 1) * 100;
    const gap = expected - 18.3;

    const triple = h('div', { class: 'triple' },
      bigCol('green', '+', 11.9, '%', '产量', '2188 → 2449 吨'),
      bigCol('amber', '+', 20.0, '%', '均价', '250 → 300 元/斤'),
      bigCol('white', '+', 18.3, '%', '产值', '严谨口径 · 官方报告'));

    const formula = h('div', { class: 'formula-bar reveal' },
      h('span', { class: 'formula tnum' }, '1.119 × 1.20 = 1.343'),
      h('div', { class: 'formula-result' },
        h('span', { class: 'ghost-tag' }, '直觉：应该 +34.3%'),
        h('span', { class: 'coral-tag' }, '但实际只 +18.3%')));

    const gapAxis = h('div', { class: 'reveal' },
      h('div', { class: 'gap-label' }, '缺口 ', h('span', { class: 'v tnum' }, '16.0 个百分点')),
      h('div', { class: 'gap-axis' },
        h('div', { class: 'gap-track' },
          h('div', { class: 'gap-fill coral', 'data-width': '46.6%' })),
        h('div', { class: 'gap-ticks' },
          h('span', { class: 'end' }, '实际 ', h('b', { class: 'tnum' }, '18.3%')),
          h('span', { class: 'end' }, '应该 ', h('b', { class: 'tnum' }, '34.3%')))));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'kicker reveal' }, '冲突 · 三个涨幅对不上'),
      triple, formula, gapAxis,
      h('hr', { class: 'divider' }),
      h('p', { class: 'note-line reveal' },
        h('b', null, '250 是 2024 毛茶价、300 是 2025 春茶价（春茶≠全年）；'),
        h('b', null, '12 亿是综合产值，含衍生品与文旅，≠毛茶销售额。')),
      h('p', { class: 'note-line reveal' }, 'C 级粗算 · 只用于暴露口径差，不当作结论。'));

    sec.append(topbar(2, '冲突'),
      h('div', { class: 'stage-wrap' }, stage),
      foot(3, '向下，第 3 屏拆开价值链找答案'));
    arm(sec);
    return sec;
  }
  function bigCol(color, pre, val, suf, name, lab) {
    return h('div', { class: 'col reveal' },
      h('div', { class: 'big ' + color + ' tnum' },
        countEl(val, { prefix: pre, suffix: suf, decimals: 1 })),
      h('div', { class: 'lab' }, h('b', null, name), ' · ' + lab));
  }

  /* ============================================================
     第 3 屏 · 价值链
     ============================================================ */
  function screen3() {
    const sec = h('section', { class: 'screen', id: 's3' });
    const nodes = [
      { ic: 'leaf', t: '茶园', v: '4.32 万亩' },
      { ic: 'sprout', t: '采摘 · 春茶季', v: '1.5 万人' },
      { ic: 'fire', t: '加工 · 非遗', v: '市级非遗' },
      { ic: 'cup', t: '毛茶', v: '250→300 元/斤', hot: true, warn: '春茶≠全年' },
      { ic: 'box', t: '衍生品', v: '3000 万+' },
      { ic: 'mountain', t: '茶旅', v: '130 万游客' }
    ];
    const chain = h('div', { class: 'chain reveal' });
    nodes.forEach((n, i) => {
      chain.appendChild(h('div', { class: 'chain-node' + (n.hot ? ' hot' : '') },
        h('span', { class: 'dot' }, icon(n.ic)),
        h('span', { class: 'cn-body' }, n.t, h('span', { class: 'cn-val' }, n.v)),
        n.warn ? h('span', { class: 'cn-warn' }, n.warn) : null));
      if (i < nodes.length - 1) chain.appendChild(h('div', { class: 'chain-link' }));
    });
    chain.appendChild(h('div', { class: 'chain-hub' },
      h('span', { class: 'hub-v tnum' }, '12 亿'),
      h('span', { class: 'hub-l' }, '综合产值')));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'chain-flag' },
        h('span', { class: 'coral-tag reveal' }, '你的乘法停在这里'),
        h('span', { class: 'ghost-tag reveal' }, '而 12 亿是整条链')),
      h('h2', { class: 'answer-line reveal' }, '你乘的是一个环节，它报的是', h('span', { class: 'accent' }, '整条链。')),
      h('div', { style: 'height:24px' }),
      chain,
      h('div', { class: 'chain-hint' }, '← 左右滑动，看完整条链 →'),
      h('hr', { class: 'divider' }),
      h('p', { class: 'note-line reveal' }, '毛茶销售额只是中间一环；综合产值含加工、衍生品与文旅，口径不同，不能直接相乘。'));

    sec.append(topbar(3, '价值链'),
      h('div', { class: 'stage-wrap' }, stage),
      foot(4, '向下，第 4 屏看目标缺口'));
    arm(sec);
    return sec;
  }

  /* ============================================================
     第 4 屏 · 目标缺口
     ============================================================ */
  function screen4() {
    const sec = h('section', { class: 'screen', id: 's4' });
    const duo = h('div', { class: 'duo reveal' },
      h('div', { class: 'dnum' }, h('span', { class: 'v gray tnum' }, '12'), h('span', { class: 'unit' }, '亿'),
        h('div', { class: 'lab' }, '现状 · 2025 · B 级约数')),
      h('div', { class: 'arrow' }, '→'),
      h('div', { class: 'dnum' }, h('span', { class: 'v green tnum' }, '20'), h('span', { class: 'unit' }, '亿'),
        h('div', { class: 'lab' }, '目标 · 2030 · 官方目标')));

    const collision = h('div', { class: 'gap-collision reveal' },
      h('div', { class: 'seg now' }, h('div', { class: 'sv tnum' }, '12 亿'), h('div', { class: 'sl' }, '现状')),
      h('div', { class: 'seg miss' }, h('div', { class: 'sv tnum' }, '还差 8 亿'), h('div', { class: 'sl' }, '缺口')));

    const stats = h('div', { class: 'stat-cards reveal' },
      h('div', { class: 'sc' }, h('div', { class: 'v tnum' }, '66.7%'), h('div', { class: 'l' }, '还要再涨')),
      h('div', { class: 'sc' }, h('div', { class: 'v tnum' }, '+10.8%'), h('div', { class: 'l' }, '年均需 · 5 年复合')));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'kicker reveal' }, '目标缺口'),
      duo, collision, stats,
      h('div', { class: 'warning-line reveal' }, '目标不是预测，缺口不会自己长出来。'),
      h('hr', { class: 'divider' }),
      h('p', { class: 'note-line reveal' }, '20 亿为官方目标（A 级），不是预测；12 亿为现状约数（B 级），是否含上下游未完全核实；10.8% 为达成目标所需隐含增速，非承诺。'));

    sec.append(topbar(4, '目标缺口'),
      h('div', { class: 'stage-wrap' }, stage),
      foot(5, '向下，第 5 屏看数据空白'));
    arm(sec);
    return sec;
  }

  /* ============================================================
     第 5 屏 · 空白悬念
     ============================================================ */
  function screen5() {
    const sec = h('section', { class: 'screen', id: 's5' });
    const blanks = [
      { t: '全年毛茶均价', d: '只有春茶 300，缺夏秋与全年' },
      { t: '12 亿产值构成拆分', d: '毛茶 / 加工 / 衍生品 / 文旅各占多少' },
      { t: '标准执行覆盖率', d: '标准存在，多少主体真正执行未知' },
      { t: '用工缺口原始人数', d: '只知减少 70%，基数未提供' }
    ];
    const grid = h('div', { class: 'blank-grid' },
      ...blanks.map(b => h('div', { class: 'blank-card reveal' },
        h('span', { class: 'bk-flag' }, '公开资料缺失'),
        h('div', { class: 'q' }, '？'),
        h('div', { class: 'skel' }),
        h('div', { class: 'bk-title' }, b.t),
        h('div', { class: 'bk-desc' }, b.d))));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'kicker reveal' }, '空白悬念'),
      h('h2', { class: 'answer-line reveal' }, '不是对不上，是', h('span', { class: 'accent' }, '查不到。')),
      h('p', { class: 'note-line reveal', style: 'margin:10px 0 22px' }, '第 2 屏是口径谜题（有答案），这一屏是数据空白（公开资料里没答案）。'),
      grid,
      h('hr', { class: 'divider' }),
      h('p', { class: 'note-line reveal' }, '这些空白需靠进一步采集、内部底表与实地调研填入，不臆测、不硬凑。'));

    sec.append(topbar(5, '空白悬念'),
      h('div', { class: 'stage-wrap' }, stage),
      foot(6, '向下，第 6 屏自己拨一下'));
    arm(sec);
    return sec;
  }

  /* ============================================================
     第 6 屏 · 自己拨一下（滑块沙盘）
     ============================================================ */
  function screen6() {
    const sec = h('section', { class: 'screen', id: 's6' });

    const state = { area: 3.5, price: 250, yield: 140, downstream: 0 };
    const big = h('div', { class: 'rb-big tnum' }, '0', h('span', { class: 'u' }, '亿'));
    const fill = h('div', { class: 'fill' });
    const statusPill = h('span', { class: 'status-pill bad' }, '未达标');
    const gapText = h('span', { class: 'tnum' }, '还差 0 亿');

    function calc() {
      const total = (state.area * 10000 * state.yield * state.price) / 1e8 + state.downstream;
      big.firstChild.textContent = f1(total);
      const pct = Math.min(100, total / 20 * 100);
      fill.style.width = pct + '%';
      const gap = 20 - total;
      if (gap > 0) {
        statusPill.className = 'status-pill bad';
        statusPill.textContent = '未达标';
        gapText.textContent = '还差 ' + f1(gap) + ' 亿';
      } else {
        statusPill.className = 'status-pill good';
        statusPill.textContent = '够到 20 亿';
        gapText.textContent = '已补上缺口';
      }
    }

    function slider(label, key, min, max, unit, fmt) {
      const cur = h('span', { class: 'cur' }, fmt(state[key]));
      const input = h('input', { type: 'range', min: min, max: max, step: '0.01', value: state[key] });
      input.addEventListener('input', () => {
        state[key] = parseFloat(input.value);
        cur.textContent = fmt(state[key]);
        calc();
      });
      return h('div', { class: 'slider-field' },
        h('div', { class: 'sf-top' }, h('span', null, label), cur),
        input,
        h('div', { class: 'sf-range' }, h('span', null, fmt(min)), h('span', null, fmt(max) + ' ' + unit)));
    }

    const controls = h('div', { class: 'sand-box' },
      h('h4', null, '拨这几个变量'),
      slider('可采摘面积', 'area', 3.5, 4.32, '万亩', v => f1(v)),
      slider('毛茶均价', 'price', 250, 350, '元/斤', v => String(Math.round(v))),
      slider('亩均单产', 'yield', 140, 180, '斤/亩', v => String(Math.round(v))),
      slider('下游增量', 'downstream', 0, 3, '亿', v => f1(v)),
      h('button', {
        class: 'btn-reset', onclick: () => {
          Object.assign(state, { area: 3.5, price: 250, yield: 140, downstream: 0 });
          controls.querySelectorAll('input').forEach((el, i) => { el.value = [3.5, 250, 140, 0][i]; });
          controls.querySelectorAll('.cur').forEach((el, i) => { el.textContent = ['3.5', '250', '140', '0.0'][i]; });
          calc();
        }
      }, '重置'));

    const result = h('div', { class: 'sand-box result-box' },
      h('div', { class: 'rb-label' }, '推算综合盘子（随滑块实时变化）'),
      big,
      h('div', { class: 'target-meter' },
        h('div', { class: 'track' }, fill,
          h('div', { class: 'target-line', style: 'left:100%' }, h('span', null, '20 亿目标'))),
      h('div', { class: 'meter-status' }, gapText, statusPill)));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'kicker reveal' }, '自己拨一下'),
      h('div', { class: 'sandbox reveal' }, controls, result),
      h('hr', { class: 'divider' }),
      h('p', { class: 'note-line reveal' }, '假设推演沙盘 · 公式透明（面积×单产×均价 + 下游增量）· 情景非预测；官方 12 亿构成未公开，本沙盘不替代官方核算。'));

    sec.append(topbar(6, '自己拨一下'),
      h('div', { class: 'stage-wrap' }, stage),
      foot(7, '向下，第 7 屏看证据库'));
    arm(sec);
    sec._activate = (function (orig) {
      return function () { orig.call(sec); calc(); };
    })(sec._activate);
    return sec;
  }

  /* ============================================================
     第 7 屏 · 证据库
     ============================================================ */
  function screen7() {
    const sec = h('section', { class: 'screen', id: 's7' });
    const srcs = DATA.sources.sources;
    const rows = srcs.map(s => h('tr', null,
      h('td', null, h('span', { class: 'badge ' + s.grade }, s.grade)),
      h('td', null, h('div', { class: 't-title' }, s.title),
        h('div', { class: 't-meta' }, s.publisher, ' · ', s.date || '编目')),
      h('td', null, h('a', { class: 'verify-link', href: s.url, target: '_blank', rel: 'noopener' }, '核验 ↗'))));

    const table = h('div', { class: 'evidence-table reveal' },
      h('table', null,
        h('thead', null, h('tr', null,
          h('th', { style: 'width:64px' }, '等级'), h('th', null, '来源'), h('th', { style: 'width:80px' }, '核验'))),
        h('tbody', null, ...rows)));

    const legend = h('div', { class: 'grade-legend reveal' },
      gradeGl('var(--grade-a)', 'A 直接观测 · 官方/标准'),
      gradeGl('var(--grade-b)', 'B 具名报道 · 媒体转述'),
      gradeGl('var(--grade-c)', 'C 证据派生 · 计算/情景'),
      gradeGl('var(--grade-d)', 'D 证据不足 · 关键空白'));

    const stats = h('div', { class: 'evidence-stats reveal' },
      h('span', { class: 'es' }, h('b', { class: 'tnum' }, '23'), '个来源'),
      h('span', { class: 'es' }, h('b', { class: 'tnum' }, '12'), '条 A 级'),
      h('span', { class: 'es' }, h('b', { class: 'tnum' }, '11'), '条 B 级'),
      h('span', { class: 'es' }, h('b', { class: 'tnum' }, '34'), '项事实'));

    const stage = h('div', { class: 'stage-card' },
      h('div', { class: 'kicker reveal' }, '证据库'),
      h('h2', { class: 'answer-line reveal', style: 'margin-bottom:18px' }, '每个数，都能翻到', h('span', { class: 'accent' }, '出处。')),
      stats, table, legend,
      h('p', { class: 'note-line reveal', style: 'margin-top:14px' }, '数据更新时间 ', h('b', null, DATA.meta.updated), ' · 无真实可访问 URL 的数字一律不收录。'));

    sec.append(topbar(7, '证据库'),
      h('div', { class: 'stage-wrap' }, stage),
      h('div', { class: 'screen-foot' },
        h('span', { class: 'note-line' }, '公开信息 · 分级证据'),
        h('a', { class: 'scroll-cue', href: '#s1' }, h('span', null, '回到开头，再看一遍'),
          h('span', { class: 'chev' }, h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', html: '<path d="m18 15-6-6-6 6"/>' })))));
    arm(sec);
    return sec;
  }
  function gradeGl(color, text) {
    return h('span', { class: 'gl' }, h('i', { style: 'background:' + color }), text);
  }

  /* ---------- 星星 ---------- */
  function makeStars() {
    const wrap = document.getElementById('stars');
    wrap.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const st = h('i', { style: 'left:' + Math.random() * 100 + '%;top:' + Math.random() * 52 + '%;animation-delay:' + (Math.random() * 4).toFixed(2) + 's' });
      wrap.appendChild(st);
    }
  }

  /* ---------- 初始化（可重试） ---------- */
  async function boot() {
    const deck = document.getElementById('deck');
    deck.innerHTML = '';
    DATA = await TeaData.loadAll();
    makeStars();
    [screen1, screen2, screen3, screen4, screen5, screen6, screen7].forEach(fn => deck.appendChild(fn()));
    observe();
    if (location.hash) {
      const t = document.querySelector(location.hash);
      if (t) t.scrollIntoView();
    }
  }

  function showError(err) {
    const deck = document.getElementById('deck');
    deck.innerHTML = '';
    const retry = h('button', { class: 'btn-reset', style: 'margin:18px auto 0;' }, '重新加载');
    retry.addEventListener('click', () => {
      deck.innerHTML = '<div class="stage-wrap"><div class="note-line">正在重试…</div></div>';
      boot().catch(showError);
    });
    const card = h('div', { class: 'stage-card narrow', style: 'max-width:520px;text-align:center;' },
      h('div', { class: 'kicker', style: 'justify-content:center;' }, '加载遇到问题'),
      h('div', { style: 'font-size:18px;font-weight:800;margin-bottom:8px;' }, '数据暂时没取到'),
      h('p', { class: 'note-line' }, err.message || '网络或服务波动，请稍后重试。'),
      retry);
    deck.appendChild(h('div', { class: 'stage-wrap' }, card));
  }

  boot().catch(showError);
})();
