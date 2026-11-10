/* 07 · 关键作用路径图 + 影响权重排序
   数据来源：model.js（HT 统一内核）+ wind.js 暴露的 BoluoWindCore / BoluoWind。
   前台不出现统计方法名；系数为「情景设定下的传导强度」，页面内明示。 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fmt = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('zh-CN') : '—');
  const w2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—');
  const pc = (v) => (Number.isFinite(v) ? (v * 100).toFixed(0) + '%' : '—');
  const HTm = () => (typeof HT !== 'undefined' ? HT : window.HT); // model.js 是经典脚本，HT 为全局词法绑定，不挂在 window 上
  const COREm = () => window.BoluoWindCore;
  const WINDm = () => window.BoluoWind;

  const CH_LABEL = ['新项目兑现', '存量企业扩能', '本地价值链延伸', '外部连接与城市承载', '一产·特色农业'];
  const MIDDLES = [
    { id: 'newproj', label: '新项目兑现', sub: '新产能形成', ch: 0,
      chain: ['项目延期', '新产线推迟', '2030总量少一块', '达标概率整体下移'] },
    { id: 'expand', label: '存量企业扩能', sub: '既有产能利用', ch: 1,
      chain: ['投资接续走弱', '在建项目节奏放慢', '存量产线顶上来', '总量缺口被部分补回'] },
    { id: 'talent', label: '人才流动', sub: '招聘与留人', ch: 3,
      chain: ['通勤压力上升', '招聘与留人变难', '服务协同跟不上', '对达标长期拖拽'] },
    { id: 'service', label: '生产性服务协同', sub: '服务配套与协作', ch: 2,
      chain: ['订单外流 / 通勤变难', '配套服务需求下降', '本地协作变薄', '三产贡献被压住'] },
    { id: 'support', label: '本地配套深度', sub: '本地供应与工程配套', ch: 1,
      chain: ['订单外流', '本地配套订单减少', '供应关系变浅', '增加值与工资受影响'] },
    { id: 'innov', label: '创新效率', sub: '技术与生产率', ch: 1,
      chain: ['投资接续走弱', '设备与研发投入放缓', '效率提升变慢', '同样投入产出更少'] }
  ];
  const OUTCOMES = [
    { id: 'total', label: '2030总量', sub: '中位结果' },
    { id: 'hit', label: '达标概率', sub: '达到1600亿的模拟占比' },
    { id: 'spread', label: '区间宽度', sub: '偏高与偏低之间' },
    { id: 'risk', label: '风险暴露', sub: '偏低一档的结果' }
  ];

  const state = { dim: 'total', view: 'stress', focus: null, data: null, timer: 0, pending: false };

  /* ---------- 取数：三种结构 + 每个通道的影响 ---------- */
  function params() {
    const p = window.BoluoExperimentBaseline && window.BoluoExperimentBaseline.getParams
      ? window.BoluoExperimentBaseline.getParams() || {} : {};
    return p;
  }
  function pathSets() {
    const core = COREm(), HT = HTm(), W = WINDm();
    if (!core || !HT || !W) return null;
    const s = W.getState();
    const p = params();
    const scale = clamp(Number(p.baseScale != null ? p.baseScale : 1), .6, 1.4);
    const vol = clamp(Number(p.volScale != null ? p.volScale : 1), .5, 1.8);
    const pf = Array.isArray(p.paths) ? p.paths : HT.DEFAULT_PATHS.map(() => 1);
    const baseline = HT.DEFAULT_PATHS.map((it, i) => ({
      ...it, mu: it.mu * scale * clamp(Number(pf[i] != null ? pf[i] : 1), .5, 1.5), sd: it.sd * vol
    }));
    const meta = core.MODELS[s.shock];
    const channelSet = s.paths.length && s.scope === 'selected' ? core.selectedChannels() : null;
    const stress = core.testPaths(meta, s.strength, false, baseline, channelSet);
    const buffer = core.testPaths(meta, s.strength, true, baseline, channelSet);
    const count = clamp(Number(p.count != null ? p.count : s.count), 2000, 12000);
    return { s, meta, baseline, stress, buffer, count, vol, channelSet };
  }

  function analyse() {
    const HT = HTm();
    const sets = pathSets();
    if (!HT || !sets) return null;
    const args = { base: HT.BASE, target: HT.TARGET, noise: HT.NOISE_SD * sets.vol };
    const seed = sets.s.seed || 42;
    const out = {};
    ['baseline', 'stress', 'buffer'].forEach((k) => {
      const paths = sets[k];
      const r = HT.run(seed, sets.count, paths.map((x) => ({ ...x })), args);
      const sumMu = paths.reduce((a, b) => a + Math.max(0, b.mu), 0) || 1;
      const sumVar = paths.reduce((a, b) => a + b.sd * b.sd, 0) || 1;
      const rows = paths.map((pp, i) => {
        const cut = paths.map((q, j) => (j === i ? { ...q, mu: Math.max(0, q.mu * .8) } : { ...q }));
        const rc = HT.run(seed, sets.count, cut, args);
        return {
          i, name: CH_LABEL[i], mu: pp.mu, sd: pp.sd,
          share: Math.max(0, pp.mu) / sumMu, varShare: (pp.sd * pp.sd) / sumVar,
          dP50: rc.p50 - r.p50, dHit: rc.hit - r.hit
        };
      });
      out[k] = {
        rows, p10: r.p10, p50: r.p50, p90: r.p90, hit: r.hit,
        spread: r.p90 - r.p10
      };
    });
    out.sets = sets;
    return out;
  }

  /* ---------- 路径图 ---------- */
  function nodePos(container, node) {
    const cr = container.getBoundingClientRect(), nr = node.getBoundingClientRect();
    return { x: nr.left - cr.left + nr.width / 2, y: nr.top - cr.top + nr.height / 2, top: nr.top - cr.top, bottom: nr.bottom - cr.top, left: nr.left - cr.left, right: nr.right - cr.left, h: nr.height };
  }
  function strengthLabel(v) { return v >= .8 ? '强' : v >= .55 ? '中强' : v >= .32 ? '中' : '弱'; }

  function renderMap() {
    const canvas = $('wkpCanvas');
    if (!canvas || !state.data) return;
    const d = state.data, sets = d.sets;
    const meta = sets.meta;
    const view = state.view;
    const viewKey = view === 'origin' ? 'baseline' : view;
    const factor = view === 'origin' ? 1 : (view === 'buffer' ? .45 : 1);
    const s = sets.s;

    // 左列触发
    const trigBox = $('wkpTrig'), midBox = $('wkpMid'), outBox = $('wkpOut');
    const core = COREm();
    const trigs = ['delay', 'invest', 'orders', 'traffic'].map((k) => ({ id: k, label: core.MODELS[k].label }));
    trigBox.innerHTML = trigs.map((t) =>
      '<div class="wkp-node trig" data-t="' + t.id + '"><strong>' + t.label + '</strong><small>' + (t.id === s.shock ? '本轮已选中' : '未选中') + '</small></div>'
    ).join('');
    midBox.innerHTML = MIDDLES.map((m) =>
      '<div class="wkp-node mid" data-m="' + m.id + '"><strong>' + m.label + '</strong><small>' + m.sub + '</small></div>'
    ).join('');
    const out = (id) => {
      if (id === 'total') return { v: fmt(d[viewKey].p50), u: '亿元' };
      if (id === 'hit') return { v: (d[viewKey].hit).toFixed(1) + '%', u: '' };
      if (id === 'spread') return { v: fmt(d[viewKey].spread), u: '亿元' };
      return { v: fmt(d[viewKey].p10), u: '亿元' };
    };
    outBox.innerHTML = OUTCOMES.map((o) => {
      const v = out(o.id);
      return '<div class="wkp-node out" data-o="' + o.id + '"><strong>' + o.label + '</strong><b>' + v.v + (v.u ? ' <small>' + v.u + '</small>' : '') + '</b><span class="wkp-out-sub">' + o.sub + '</span></div>';
    }).join('');

    // 定位与连线
    const anchorTrig = {}, anchorMid = {}, anchorOut = {};
    qa('#wkpTrig .wkp-node').forEach((n) => { anchorTrig[n.dataset.t] = nodePos(canvas, n); });
    qa('#wkpMid .wkp-node').forEach((n) => { anchorMid[n.dataset.m] = nodePos(canvas, n); });
    qa('#wkpOut .wkp-node').forEach((n) => { anchorOut[n.dataset.o] = nodePos(canvas, n); });

    const maxBottom = Math.max(
      ...Object.values(anchorTrig).map((a) => a.bottom),
      ...Object.values(anchorMid).map((a) => a.bottom),
      ...Object.values(anchorOut).map((a) => a.bottom)
    );
    canvas.style.height = Math.round(maxBottom + 20) + 'px';
    const svg = $('wkpSvg');
    const W = canvas.clientWidth, H = canvas.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    let paths = '', labels = '';
    const edges = [];

    // 触发 → 中间层：强度来自模型的通道效应
    trigs.forEach((t) => {
      const m = core.MODELS[t.id];
      const live = t.id === s.shock;
      MIDDLES.forEach((mid) => {
        const eff = Math.abs(m.effect[mid.ch] || 0) / 36;
        if (!eff) return;
        const pos = (m.effect[mid.ch] || 0) > 0;
        const val = live ? eff * (view === 'origin' ? 1 : (view === 'buffer' && !pos ? s.strength * factor : s.strength)) : eff * .16;
        const a = anchorTrig[t.id], b = anchorMid[mid.id];
        const x1 = a.right - 2, y1 = a.y, x2 = b.left + 2, y2 = b.y;
        const cx = (x1 + x2) / 2;
        edges.push({ kind: 'mid', val, pos, live, a: { x: x1, y: y1 }, b: { x: x2, y: y2 }, d: 'M' + x1 + ',' + y1 + ' C' + (cx) + ',' + y1 + ' ' + (cx) + ',' + y2 + ' ' + x2 + ',' + y2, ch: mid.ch, trig: t.id, mid: mid.id });
      });
    });
    // 中间层 → 结果层：强度来自该通道在结果中的份额
    const ASSUME = { delay: ['support'], invest: ['innov'], orders: [], traffic: [] };
    ASSUME[s.shock].forEach((midId) => {
      const a = anchorTrig[s.shock], b = anchorMid[midId];
      if (!a || !b) return;
      const x1 = a.right - 2, y1 = a.y, x2 = b.left + 2, y2 = b.y, cx = (x1 + x2) / 2;
      edges.push({ kind: 'mid', val: .3, pos: false, live: false, assume: true, a: { x: x1, y: y1 }, b: { x: x2, y: y2 }, d: 'M' + x1 + ',' + y1 + ' C' + cx + ',' + y1 + ' ' + cx + ',' + y2 + ' ' + x2 + ',' + y2, ch: MIDDLES.find((m) => m.id === midId).ch, trig: s.shock, mid: midId });
    });

    const TARGETS = { newproj: ['total', 'hit'], expand: ['total'], talent: ['hit', 'risk'], service: ['spread'], support: ['hit'], innov: ['total'] };
    const incoming = {};
    MIDDLES.forEach((mid) => {
      const row = d.stress.rows[mid.ch];
      (TARGETS[mid.id] || ['total']).forEach((tid) => {
        const val = tid === 'total' ? row.share : row.varShare;
        incoming[tid] = incoming[tid] || [];
        incoming[tid].push({ mid, val });
      });
    });
    Object.keys(incoming).forEach((tid) => {
      const list = incoming[tid].slice().sort((a, b) => anchorMid[a.mid.id].y - anchorMid[b.mid.id].y);
      const out = anchorOut[tid], n = list.length;
      list.forEach((item, k) => {
        const a = anchorMid[item.mid.id];
        const y2 = n === 1 ? out.y : out.top + out.h * (.3 + .4 * (k / (n - 1)));
        const x1 = a.right - 2, y1 = a.y, x2 = out.left + 2;
        const cx = (x1 + x2) / 2;
        edges.push({ kind: 'out', val: item.val, pos: false, live: true, a: { x: x1, y: y1 }, b: { x: x2, y: y2 }, d: 'M' + x1 + ',' + y1 + ' C' + (cx) + ',' + y1 + ' ' + (cx) + ',' + y2 + ' ' + x2 + ',' + y2, ch: item.mid.ch, mid: item.mid.id, out: tid });
      });
    });

    const focus = state.focus;
    const maxMid = Math.max.apply(null, edges.filter((e) => e.kind === 'mid').map((e) => e.val).concat([.001]));
    const maxOut = Math.max.apply(null, edges.filter((e) => e.kind === 'out').map((e) => e.val).concat([.001]));
    edges.forEach((e) => {
      const norm = e.val / (e.kind === 'mid' ? maxMid : maxOut);
      const width = (1.1 + Math.pow(norm, .7) * 4.8).toFixed(2);
      const color = e.pos ? '#1396df' : (e.kind === 'mid' ? '#ef8a5c' : '#f2704a');
      const dim = focus && !(focus.mid === e.mid || focus.out === e.out || focus.trig === e.trig || focus.ch === e.ch);
      const op = e.assume ? .34 : e.live ? (e.val < .3 ? .5 : .92) : .08;
      paths += '<path class="wkp-edge' + (dim ? ' dim' : '') + '" d="' + e.d + '" stroke="' + color + '" stroke-width="' + width + '" opacity="' + op + '"' + (e.assume ? ' stroke-dasharray="4 3"' : '') + '></path>';
      if (e.live && e.kind === 'mid' && norm >= .55) {
        labels += '<text x="' + (e.a.x + 34) + '" y="' + (e.a.y - 7) + '" font-size="9.5" font-weight="800" fill="#b3572f" opacity=".75">' + strengthLabel(e.val) + '</text>';
      }
    });
    svg.innerHTML = paths + labels;

    // 流动光点：只给较强的边，控制数量
    startFlow(svg, edges.filter((e) => e.val >= .35).slice(0, 14));

    // 节点高亮
    const isDim = (kind, id) => {
      if (!focus) return false;
      if (kind === 'trig') return focus.trig && focus.trig !== id && !focus.mid && !focus.ch;
      if (kind === 'mid') return (focus.mid && focus.mid !== id) || (focus.trig && !(COREm().MODELS[focus.trig].effect[MIDDLES.find((m) => m.id === id).ch] > 0)) || (focus.ch != null && MIDDLES.find((m) => m.id === id).ch !== focus.ch);
      if (kind === 'out') return (focus.out && focus.out !== id) || (focus.mid && !(MIDDLES.find((m) => m.id === focus.mid).ch <= 3));
      return false;
    };
    qa('#wkpTrig .wkp-node').forEach((n) => { n.classList.toggle('on', !!focus && focus.trig === n.dataset.t); n.classList.toggle('dim', !!isDim('trig', n.dataset.t)); });
    qa('#wkpMid .wkp-node').forEach((n) => { n.classList.toggle('on', !!focus && (focus.mid === n.dataset.m || focus.ch === MIDDLES.find((m) => m.id === n.dataset.m).ch)); n.classList.toggle('dim', !!isDim('mid', n.dataset.m)); });
    qa('#wkpOut .wkp-node').forEach((n) => { n.classList.toggle('on', !!focus && focus.out === n.dataset.o); n.classList.toggle('dim', false); });

    renderCard();
  }

  let flowRAF = 0;
  function startFlow(svg, edges) {
    cancelAnimationFrame(flowRAF);
    if (!edges.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const pick = Array.from(svg.querySelectorAll('path.wkp-edge'))
      .filter((p) => parseFloat(p.getAttribute('stroke-width')) >= 3.2)
      .slice(0, 16);
    if (!pick.length) return;
    const dots = pick.map((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 0;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'wkp-flow');
      c.setAttribute('r', '2.6');
      c.setAttribute('fill', p.getAttribute('stroke'));
      c.setAttribute('opacity', '.75');
      svg.appendChild(c);
      return { c, p, len, off: Math.random() };
    });
    let last = 0;
    const step = (t) => {
      if (document.hidden) { flowRAF = requestAnimationFrame(step); return; }
      if (t - last > 42) {
        last = t;
        dots.forEach((d) => {
          if (!d.len) return;
          d.off = (d.off + .0075) % 1;
          const pt = d.p.getPointAtLength(d.off * d.len);
          d.c.setAttribute('cx', pt.x); d.c.setAttribute('cy', pt.y);
        });
      }
      flowRAF = requestAnimationFrame(step);
    };
    flowRAF = requestAnimationFrame(step);
  }

  /* ---------- 解释卡 ---------- */
  function renderCard() {
    const box = $('wkpCard');
    if (!box || !state.data) return;
    const f = state.focus;
    const d = state.data, rows = d.stress.rows;
    const meta = (state.data.sets && state.data.sets.meta) || {};
    const qs = Array.isArray(meta.questions) ? meta.questions : [];
    const check = qs[2] || qs[1] || '';
    if (!f) {
      box.innerHTML = '<span class="k">怎么读这张图</span><strong>线越粗，这一环对结果的作用越强；橙红往下压，蓝青往上托。</strong>' +
        '<p>点任意一条线或一个环节，看它在这一轮里通过哪几段链条，最后落到哪个结果上。</p>' +
        (check ? '<p class="wkp-check">这条传导链现在最该核的是「' + check.replace(/？$/,'') + '」</p>' : '');
      return;
    }
    let title = '', chain = [], explain = '';
    if (f.mid) {
      const m = MIDDLES.find((x) => x.id === f.mid);
      const r = rows[m.ch];
      title = m.label + ' · ' + m.sub;
      chain = m.chain;
      explain = '这条通道当前承担 ' + pc(r.share) + ' 的新增贡献，波动占全部不确定性的 ' + pc(r.varShare) + '；若它少 20%，2030 中位会 ' + (r.dP50 < 0 ? '下降 ' + fmt(Math.abs(r.dP50)) : '变化 ' + fmt(r.dP50)) + ' 亿，达标占比 ' + (r.dHit < 0 ? '下降 ' + Math.abs(r.dHit).toFixed(1) + ' 个点' : '上升 ' + r.dHit.toFixed(1) + ' 个点') + '。';
    } else if (f.trig) {
      const m = COREm().MODELS[f.trig];
      const list = MIDDLES.filter((x) => (m.effect[x.ch] || 0) < 0).map((x) => x.label);
      title = m.label;
      chain = m.nodes;
      explain = '这一轮它主要压到：' + (list.join('、') || '暂未落到可量化通道') + '。' + m.unknown;
    } else if (f.out) {
      const o = OUTCOMES.find((x) => x.id === f.out);
      const v = f.out === 'total' ? fmt(d.stress.p50) : f.out === 'hit' ? d.stress.hit.toFixed(1) + '%' : f.out === 'spread' ? fmt(d.stress.spread) : fmt(d.stress.p10);
      title = o.label + ' · ' + o.sub;
      chain = ['冲击', '通道', o.label];
      explain = '当前设定下结果是 ' + v + '。它由五条通道共同决定，不是某一条线的单独结果；换一条通道，结果会跟着动。';
    } else if (f.ch != null) {
      const r = rows[f.ch];
      title = CH_LABEL[f.ch];
      chain = MIDDLES.filter((m) => m.ch === f.ch).map((m) => m.label);
      explain = '权重 ' + w2(r.share) + '，波动占比 ' + pc(r.varShare) + '，少 20% 会让中位 ' + (r.dP50 < 0 ? '−' + fmt(Math.abs(r.dP50)) : '+' + fmt(r.dP50)) + ' 亿。';
    }
    box.innerHTML = '<span class="k">人话解释</span><strong>' + title + '</strong>' +
      '<div class="chain">' + chain.map((c, i) => '<b>' + c + '</b>' + (i < chain.length - 1 ? '<i>→</i>' : '')).join('') + '</div>' +
      '<p>' + explain + '</p>';
  }

  /* ---------- 权重排序 ---------- */
  function renderRank() {
    const list = $('kwrList');
    if (!list || !state.data) return;
    const d = state.data;
    const key = { direct: 'share', total: 'dP50', sens: 'varShare' }[state.dim];
    const vk = state.view === 'baseline' || state.view === 'origin' ? 'baseline' : state.view;
    const cur = (d[vk] || d.stress).rows;
    const base = d.baseline.rows;
    const sorted = cur.map((r) => ({ ...r })).sort((a, b) => {
      const av = key === 'dP50' ? Math.abs(a.dP50) : a[key];
      const bv = key === 'dP50' ? Math.abs(b.dP50) : b[key];
      return bv - av;
    });
    const max = Math.max.apply(null, sorted.map((r) => (key === 'dP50' ? Math.abs(r.dP50) : r[key])).concat([.0001]));
    const baseSorted = base.slice().sort((a, b) => {
      const av = key === 'dP50' ? Math.abs(a.dP50) : a[key];
      const bv = key === 'dP50' ? Math.abs(b.dP50) : b[key];
      return bv - av;
    });
    const baseRank = {};
    baseSorted.forEach((r, i) => { baseRank[r.i] = i + 1; });
    const baseByCh = {};
    base.forEach((r) => { baseByCh[r.i] = r; });
    list.innerHTML = sorted.map((r, idx) => {
      const raw = key === 'dP50' ? Math.abs(r.dP50) : r[key];
      const w = Math.max(3, raw / max * 100);
      const valTxt = state.dim === 'direct' ? w2(r.share)
        : state.dim === 'total' ? (r.dP50 < 0 ? '−' + fmt(Math.abs(r.dP50)) : '+' + fmt(r.dP50)) + ' 亿'
        : pc(r.varShare);
      const drag = r.mu < (baseByCh[r.i] ? baseByCh[r.i].mu : r.mu) - .5;
      const lift = r.mu > (baseByCh[r.i] ? baseByCh[r.i].mu : r.mu) + .5;
      const moving = drag ? '拖拽' : lift ? '支撑' : '中性';
      const b0 = baseByCh[r.i];
      const delta = (() => {
        if (state.view === 'baseline' || !b0) return { t: '—', c: '' };
        const d0 = baseRank[r.i] - (idx + 1);
        if (d0 !== 0) return { t: d0 > 0 ? '↑' + d0 + '位' : '↓' + Math.abs(d0) + '位', c: d0 > 0 ? 'up' : 'down' };
        let dv = 0;
        if (state.dim === 'total') dv = Math.round(Math.abs(r.dP50) - Math.abs(b0.dP50));
        else if (state.dim === 'direct') dv = Math.round((r.share - b0.share) * 100);
        else dv = Math.round((r.varShare - b0.varShare) * 100);
        if (!dv) return { t: '—', c: '' };
        const unit = state.dim === 'total' ? '亿' : 'pt';
        return { t: (dv > 0 ? '↑' : '↓') + Math.abs(dv) + unit, c: dv > 0 ? 'up' : 'down' };
      })();
      return '<div class="kwr-row' + (idx === 0 ? ' top' : '') + (state.focus && state.focus.ch === r.i ? ' sel' : '') + '" data-ch="' + r.i + '">' +
        '<span class="kwr-rank">' + (idx + 1) + '</span>' +
        '<span class="kwr-name">' + r.name + '<small>' + moving + ' · 情景设定</small></span>' +
        '<span class="kwr-track"><i class="kwr-bar ' + (drag ? 'neg' : lift ? 'pos' : '') + '" style="width:' + w.toFixed(1) + '%"></i></span>' +
        '<span class="kwr-val">' + valTxt + '</span>' +
        '<span class="kwr-delta ' + delta.c + '" title="较基准">' + delta.t + '</span>' +
        '</div>';
    }).join('');
    const note = $('kwrNote');
    if (note) {
      const top = sorted[0];
      note.innerHTML = '<span>本轮排第一的是 <b>' + top.name + '</b>，' + (top.dP50 < 0 ? '它一松，结果最先掉' : '它是当前最稳的支撑') + '。</span>' +
        '<span>箭头 = 较基准更重 / 更轻 · 权重来自情景设定下的实际重算，不是拟合出来的因果数字 · 证据级别 C（假设）</span>';
    }
    list.querySelectorAll('.kwr-row').forEach((row) => {
      row.addEventListener('click', () => {
        const ch = Number(row.dataset.ch);
        state.focus = { ch };
        renderMap(); renderRank();
      });
    });
  }

  const bufferOn = () => !!(state.data && state.data.sets && state.data.sets.s.buffer);
  function guardBuffer() {
    if (state.view === 'buffer' && state.data && !bufferOn()) {
      state.view = 'stress';
      qa('[data-wkp-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.wkpView === 'stress')));
      qa('[data-kwr-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.kwrView === 'stress')));
      const box = $('wkpCard');
      if (box) box.innerHTML = '<span class="k">还差一步</span><strong>缓冲项还没打开</strong><p>先在下面「换一种压力重算」里勾上缓冲，再看这一版。</p>';
      return false;
    }
    return true;
  }

  /* ---------- 总装 ---------- */
  function refresh(force) {
    const d = analyse();
    if (!d) return;
    state.data = d;
    if (!guardBuffer()) { renderRank(); return; }
    if (!state.focus) state.focus = null;
    renderMap(); renderRank();
  }

  function schedule() {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => refresh(), 180);
  }

  function bind() {
    $('wkpTrig') && $('wkpTrig').addEventListener('click', (e) => {
      const n = e.target.closest('.wkp-node'); if (!n) return;
      state.focus = { trig: n.dataset.t }; renderMap(); renderRank();
    });
    $('wkpMid') && $('wkpMid').addEventListener('click', (e) => {
      const n = e.target.closest('.wkp-node'); if (!n) return;
      const m = MIDDLES.find((x) => x.id === n.dataset.m);
      state.focus = { mid: n.dataset.m, ch: m.ch }; renderMap(); renderRank();
    });
    $('wkpOut') && $('wkpOut').addEventListener('click', (e) => {
      const n = e.target.closest('.wkp-node'); if (!n) return;
      state.focus = { out: n.dataset.o }; renderMap(); renderRank();
    });
    qa('[data-wkp-view]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.wkpView === 'buffer' && state.data && !bufferOn()) { guardBuffer(); return; }
      state.view = b.dataset.wkpView;
      qa('[data-wkp-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      refresh();
    }));
    qa('[data-kwr-dim]').forEach((b) => b.addEventListener('click', () => {
      state.dim = b.dataset.kwrDim;
      qa('[data-kwr-dim]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      renderRank();
    }));
    qa('[data-kwr-view]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.kwrView === 'buffer' && state.data && !bufferOn()) { guardBuffer(); return; }
      state.view = b.dataset.kwrView;
      qa('[data-kwr-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      qa('[data-wkp-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.wkpView === state.view)));
      refresh();
    }));
    window.addEventListener('boluo:wind-run', schedule);
    window.addEventListener('resize', () => { if (state.data) { renderMap(); } });
  }

  function boot() {
    if (!HTm() || !WINDm() || !COREm()) { setTimeout(boot, 220); return; }
    bind();
    refresh();
    // 首次若 wind.js 还没跑过，等它的 run 事件；再兜底刷新一次
    setTimeout(() => { if (!state.data) refresh(); }, 600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
