/* 博罗全息关系网络：持续力模拟 + 可拖动节点 + 连线标签 + 流向点 */
(function () {
  'use strict';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

  const RELC = { supply: '#2563eb', invest: '#0e9ba5', coop: '#7c3aed', road: '#dc2626', tour: '#d97706', agri: '#d97706' };
  function colorOf(e) { return RELC[e.rel] || '#0e9ba5'; }
  function shortTown(n) { return String(n || '').replace(/街道|镇/g, ''); }
  function stageNameOf(e) {
    if (e.state === 'out') return '停摆 / 关停';
    if (e.state === 'wip') return e.stage === 2 ? '开工' : '签约';
    if (e.visual === 'copper') return '点火';
    if (e.rel === 'coop') return '开园';
    if (e.rel === 'road') return '通车';
    if (e.rel === 'tour') return '开业';
    return '投产';
  }

  /* 中间层的五个关系类目，和图左侧的图层按钮一一对应 */
  const CATS = [
    { key: 'supply', label: '供应链配套', short: '供应链', color: '#2563eb' },
    { key: 'invest', label: '投资建设', short: '投资', color: '#0e9ba5' },
    { key: 'coop', label: '区域协作', short: '协作', color: '#7c3aed' },
    { key: 'road', label: '交通物流', short: '交通', color: '#dc2626' },
    { key: 'tour', label: '消费文旅', short: '文旅', color: '#d97706' }
  ];

  function build(events) {
    const towns = [];
    const projects = [];
    const seen = {};
    events.forEach(function (e) {
      if (e.state === 'stat' || e.state === 'wip') return;
      if (e.town && !seen[e.town]) { seen[e.town] = { id: 't_' + e.town, kind: 'town', label: shortTown(e.town), town: e.town, w: 0 }; towns.push(seen[e.town]); }
      if (e.town) seen[e.town].w += 1;
      projects.push({
        id: 'p_' + e.id, kind: 'proj', ev: e, town: e.town,
        val: e.big + e.unit,
        name: e.title.replace(/^[^·]*·\s*/, ''),
        color: e.state === 'out' ? '#e2544a' : (e.state === 'wip' ? '#9fb0c4' : colorOf(e)),
        state: e.state || 'live',
        stalled: e.state === 'out',
        stageName: stageNameOf(e)
      });
    });
    return { towns: towns, projects: projects };
  }

  function mount(host, events, opts) {
    if (!host) return;
    const LIVE = !!(opts && opts.live);
    host.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const G = build(events);
    G.allProjects = G.projects.slice();
    const nodes = [];
    const links = [];
    const core = { id: 'core', kind: 'core', label: '博罗', x: 0, y: 0, vx: 0, vy: 0, r: 26, pin: true, spawn: 1 };

    function rebuild() {
      nodes.length = 0; links.length = 0;
      nodes.push(core);
      /* 第二层：五个关系类目 */
      const cats = [];
      const catOf = {};
      CATS.forEach(function (c) {
        const n = { id: 'c_' + c.key, kind: 'cat', key: c.key, label: c.label, short: c.short, color: c.color, r: 13, x: 0, y: 0, vx: 0, vy: 0, count: 0, spawn: 1 };
        cats.push(n); catOf[c.key] = n; nodes.push(n);
        links.push({ a: core, b: n, kind: 'cat', color: c.color, state: 'live' });
      });
      G.cats = cats;
      /* 第三层：具体现场，挂在各自的关系类目下 */
      G.projects.forEach(function (p) {
        const n = Object.assign({}, p, { vx: 0, vy: 0, x: 0, y: 0, r: p.state === 'live' ? 12.5 : (p.state === 'out' ? 8.5 : 7), pin: false, spawn: 1 });
        nodes.push(n);
        const c = catOf[(p.ev && p.ev.rel) || 'invest'] || catOf.invest;
        c.count += 1;
        links.push({ a: c, b: n, kind: 'proj', color: p.color, tag: p.val, stageName: p.stageName, state: p.state });
      });
      /* 流向：已经进去的现场沿着产业链、园区、公路流向谁 */
      if (opts && opts.flows && opts.flows.length) {
        const byId = {};
        nodes.forEach(function (n) { if (n.kind === 'proj' && n.ev) byId[n.ev.id] = n; });
        const pairs = [];
        opts.flows.forEach(function (f) {
          const a = byId[f.from], b = byId[f.to];
          if (a && b) {
            pairs.push([a.id, b.id]);
            links.push({ a: a, b: b, kind: 'flow', flow: f, color: a.color, label: f.label, val: f.val, basis: f.basis, ti: pairs.length });
            /* 数字写在“被带动的那个点”下面：读者一眼看到谁给它送了量 */
            b.inflow = { from: a.name, fromVal: a.val, val: f.val, label: f.label, color: a.color };
          }
        });
        G.flowPairs = pairs;
      }
    }

    let W = 0, H = 0, mob = false;
    const view = { s: 1, x: 0, y: 0 };
    let R1 = 150;

    function resize() {
      const rect = host.getBoundingClientRect();
      W = Math.max(rect.width, 280);
      mob = W < 560;
      H = rect.height > 200 ? Math.round(rect.height) : (mob ? 500 : 548);
      R1 = Math.min(W, H) * (mob ? 0.27 : 0.285);
      G.projects = G.allProjects.slice(); G.towns.forEach(function (t) { t.drop = false; });
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild(); seed();
      draw();
      canvas.__nodes = nodes;
    }

    /* 三层布局：中心博罗 → 关系类目 → 具体现场。
       同一类目下的现场落在同一扇区，线短、数字才看得清。 */
    function seed() {
      const cx = W / 2, cy = H * 0.50;
      const cats = G.cats || [];
      const projs = nodes.filter(function (n) { return n.kind === 'proj'; });
      const byCat = {};
      projs.forEach(function (p) {
        const k = (p.ev && p.ev.rel) || 'invest';
        (byCat[k] = byCat[k] || []).push(p);
      });
      const RX = mob ? W * 0.405 : Math.min(W, H) * 0.435;
      const RY = mob ? H * 0.345 : Math.min(W, H) * 0.400;
      const CRX = mob ? W * 0.185 : Math.min(W, H) * 0.185;
      const CRY = mob ? H * 0.150 : Math.min(W, H) * 0.172;
      const groups = cats.map(function (c) { return { cat: c, list: byCat[c.key] || [] }; })
        .filter(function (g) { return g.list.length > 0; });
      const total = groups.reduce(function (s, g) { return s + 1 + 0.42 * (g.list.length - 1); }, 0) || 1;
      let acc = -Math.PI / 2 - Math.PI * 2 * 0.5;
      groups.forEach(function (g) {
        const n = g.list.length;
        const span = Math.PI * 2 * (1 + 0.42 * (n - 1)) / total;
        const mid = acc + span * 0.5;
        g.cat.x = cx + Math.cos(mid) * CRX;
        g.cat.y = cy + Math.sin(mid) * CRY;
        const gap = Math.min(span / Math.max(n, 1), mob ? 0.55 : 0.46);
        g.list.forEach(function (p, j) {
          const a = mid + (j - (n - 1) / 2) * gap;
          const k2 = (n > 2 && j % 2 === 1) ? 1.055 : 0.945;
          p.x = cx + Math.cos(a) * RX * k2;
          p.y = cy + Math.sin(a) * RY * k2;
        });
        acc += span;
      });
      core.x = cx; core.y = cy;
      nodes.forEach(function (n) { n.vx = 0; n.vy = 0; });
      /* 轻避让：只防标签互相压住 */
      for (let it = 0; it < 60; it++) {
        for (let i = 0; i < projs.length; i++) {
          for (let j = i + 1; j < projs.length; j++) {
            const a = projs[i], b = projs[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const need = Math.max(a.r, b.r) * 3.0;
            if (d < need) {
              const push = (need - d) / 2, ux = dx / d, uy = dy / d;
              a.x -= ux * push; a.y -= uy * push;
              b.x += ux * push; b.y += uy * push;
            }
          }
        }
        projs.forEach(function (n) {
          n.x = Math.max(n.r + 34, Math.min(W - n.r - 34, n.x));
          n.y = Math.max(n.r + 26, Math.min(H - n.r - 36, n.y));
        });
        cats.forEach(function (c) {
          c.x = Math.max(26, Math.min(W - 26, c.x));
          c.y = Math.max(22, Math.min(H - 22, c.y));
        });
      }
    }

    function simulate() {
      const REP = mob ? 3400 : 5400;
      const SPRING = 0.012, DAMP = 0.86, CENTER = 0.0025;
      const cx = W / 2, cy = H * 0.47;

      nodes.forEach(function (n) { n.fx = 0; n.fy = 0; });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { d2 = 1; dx = (Math.random() - .5) * 2; dy = (Math.random() - .5) * 2; }
          const d = Math.sqrt(d2);
          const f = REP / d2;
          const fx = f * dx / d, fy = f * dy / d;
          a.fx += fx; a.fy += fy;
          b.fx -= fx; b.fy -= fy;
        }
      }
      links.forEach(function (l) {
        const a = l.a, b = l.b;
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = l.kind === 'town' ? R1 : (l.far ? R1 * 1.34 : (l.state === 'wip' ? R1 * 0.95 : R1 * 0.56));
        const f = (d - target) * SPRING;
        const fx = f * dx / d, fy = f * dy / d;
        a.fx += fx; a.fy += fy;
        b.fx -= fx; b.fy -= fy;
      });
      nodes.forEach(function (n) {
        if (n.pin) { n.vx = 0; n.vy = 0; return; }
        n.vx = (n.vx + n.fx + (cx - n.x) * CENTER) * DAMP;
        n.vy = (n.vy + n.fy + (cy - n.y) * CENTER) * DAMP;
        const v = Math.hypot(n.vx, n.vy);
        if (v > 9) { n.vx *= 9 / v; n.vy *= 9 / v; }
        n.x += n.vx; n.y += n.vy;
        const pad = n.kind === 'core' ? 40 : (n.r + 26);
        n.x = Math.max(pad, Math.min(W - pad, n.x));
        n.y = Math.max(pad, Math.min(H - 46, n.y));
      });
    }

    function warm(n) { for (let i = 0; i < n; i++) simulate(); }

    function bez(a, b, t) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.sqrt(nx * nx + ny * ny) || 1;
      const cxp = mx + nx / nl * 9, cyp = my + ny / nl * 9;
      const u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * cxp + t * t * b.x, y: u * u * a.y + 2 * u * t * cyp + t * t * b.y };
    }

    let hoverId = null, selId = null, filterType = null;
    function focusId() { return selId; }
    function nearMap() {
      const id = focusId();
      if (!id) return null;
      const m = {}; m[id] = 1;
      links.forEach(function (l) { if (l.a.id === id) m[l.b.id] = 1; if (l.b.id === id) m[l.a.id] = 1; });
      return m;
    }
    function isDim(n) {
      return filterType !== null && n.ev && n.ev.rel !== filterType;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W / 2, H * .44, 10, W / 2, H * .44, Math.max(W, H) * .72);
      bg.addColorStop(0, '#fbfcfe'); bg.addColorStop(1, '#f2f6fb');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(view.x, view.y); ctx.scale(view.s, view.s);
      ctx.strokeStyle = 'rgba(150,170,195,.13)'; ctx.lineWidth = 1;
      const g = mob ? 28 : 34;
      for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const t = performance.now();
      const placed = [];
      /* 先把外圈每个现场的标签位置估出来，流向的数字要避开它们 */
      nodes.forEach(function (nd) {
        if (nd.kind !== 'proj' || !nd.ev) return;
        const vx = nd.x - W / 2, vy = nd.y - H * 0.50, dd = Math.hypot(vx, vy) || 1;
        const dx0 = vx / dd, dy0 = vy / dd, rr = mob ? 11 : 13.5;
        const lx = dx0 > 0.35 ? nd.x + rr + 34 : (dx0 < -0.35 ? nd.x - rr - 34 : nd.x);
        const ly = nd.y + (dy0 >= 0 ? rr + 13 : -(rr + 13));
        placed.push({ x: lx, y: ly });
      });
      /* 每条“类目—现场”关系线上的数字，也要算进去 */
      links.forEach(function (l2) {
        if (l2.kind !== 'proj' || !l2.a || !l2.b) return;
        if ((l2.state || 'live') !== 'live') return;
        placed.push({ x: (l2.a.x + l2.b.x) / 2, y: (l2.a.y + l2.b.y) / 2 });
      });

      links.forEach(function (l, li) {
        const a = l.a, b = l.b;
        if (!a || !b) return;
        const dim = isDim(a) || isDim(b);
        if (l.kind === 'flow') {
          const fsel = !!(selId && (a.id === selId || b.id === selId));
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const cx0 = W / 2, cy0 = H * 0.50;
          const nx = -(b.y - a.y), ny = (b.x - a.x), nl = Math.sqrt(nx * nx + ny * ny) || 1;
          const off = Math.min(96, Math.max(46, Math.hypot(b.x - a.x, b.y - a.y) * 0.30));
          const s1 = Math.hypot(mx + nx / nl * off - cx0, my + ny / nl * off - cy0);
          const s2 = Math.hypot(mx - nx / nl * off - cx0, my - ny / nl * off - cy0);
          const sg = s1 > s2 ? 1 : -1;
          let px = mx + nx / nl * off * sg, py = my + ny / nl * off * sg;
          const pdx = mob ? 26 : 72;
          px = Math.max(pdx, Math.min(W - pdx, px));
          py = Math.max(mob ? 40 : 60, Math.min(H - (mob ? 30 : 46), py));
          if (mob) {
            /* 竖着的一条链，往旁边鼓出去，别从中间的圆点上穿过 */
            if (Math.abs(b.x - a.x) < 60) px = Math.min(W - 26, Math.max(a.x, b.x) + 92);
          }
          const pt = function (t) {
            const u = 1 - t;
            return { x: u * u * a.x + 2 * u * t * px + t * t * b.x, y: u * u * a.y + 2 * u * t * py + t * t * b.y };
          };
          ctx.save();
          ctx.globalAlpha = dim ? .1 : 1;
          ctx.strokeStyle = l.color;
          ctx.lineWidth = fsel ? 3 : 2.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(px, py, b.x, b.y);
          ctx.stroke();
          /* 箭头 */
          const q1 = pt(0.90), q2 = pt(1);
          const ang = Math.atan2(q2.y - q1.y, q2.x - q1.x);
          const ar = 7;
          ctx.beginPath();
          ctx.moveTo(q2.x - Math.cos(ang) * ar * 0.6, q2.y - Math.sin(ang) * ar * 0.6);
          ctx.lineTo(q2.x - Math.cos(ang - 0.42) * ar, q2.y - Math.sin(ang - 0.42) * ar);
          ctx.lineTo(q2.x - Math.cos(ang + 0.42) * ar, q2.y - Math.sin(ang + 0.42) * ar);
          ctx.closePath();
          ctx.fillStyle = l.color;
          ctx.fill();
          /* 数字不挂在线上：挂到被带动的那个节点下面，既不打架也读得懂 */
          ctx.restore();
          return;
        }
        if (l.kind === 'sib') {
          ctx.save();
          ctx.globalAlpha = dim ? .06 : .30;
          ctx.strokeStyle = '#8ba0b8';
          ctx.lineWidth = 1.1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          return;
        }
        const onSel = !!(selId && (a.id === selId || b.id === selId));
        const st = l.state || 'live';
        const ctl = bez(a, b, 0);
        ctx.save();
        ctx.globalAlpha = l.kind === 'cat' ? .95 : (dim ? .08 : (onSel ? 1 : (l.kind === 'town' ? 1 : (st === 'live' ? .7 : .42))));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(ctl.x, ctl.y, b.x, b.y);
        ctx.strokeStyle = l.kind === 'town' ? 'rgba(120,145,175,.34)' : l.color;
        ctx.lineWidth = l.kind === 'cat' ? 2.8 : (l.kind === 'town' ? 1.2 : (onSel ? 2.6 : (st === 'live' ? 1.8 : 1.2)));
        if (l.kind === 'proj' && st === 'out') ctx.setLineDash([3, 3]);
        else if (l.kind === 'proj' && st === 'wip') ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        if (l.kind === 'proj') {
          if (LIVE && st === 'live') {
            const speed = 3000;
            for (let k = 0; k < 2; k++) {
              const ph = ((t / speed) + li * 0.16 + k * 0.5) % 1;
              const p = bez(a, b, ph);
              ctx.save();
              ctx.globalAlpha = dim ? .05 : (l.b.stalled ? .3 : .9);
              ctx.fillStyle = l.color;
              ctx.beginPath(); ctx.arc(p.x, p.y, l.b.stalled ? 2 : 2.6, 0, 7); ctx.fill();
              ctx.restore();
            }
          }
          /* 线上挂字：数字大字，阶段小字。手机上只留数字。 */
          if (LIVE && !mob && st === 'live' && l.tag) {
            const p = bez(a, b, 0.60);
            const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
            const ox = -dy / dl * 7, oy = dx / dl * 7;
            ctx.save();
            ctx.globalAlpha = dim ? .06 : .96;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (mob) {
              ctx.font = '800 9.5px ' + FONT;
              const bw = ctx.measureText(l.tag).width + 9, bh = 15;
              ctx.fillStyle = 'rgba(255,255,255,.95)';
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(p.x + ox - bw / 2, p.y + oy - bh / 2, bw, bh, 7.5);
              else ctx.rect(p.x + ox - bw / 2, p.y + oy - bh / 2, bw, bh);
              ctx.fill();
              ctx.strokeStyle = l.color + '33'; ctx.lineWidth = 1; ctx.stroke();
              ctx.fillStyle = l.color;
              ctx.fillText(l.tag, p.x + ox, p.y + oy);
            } else {
              ctx.font = '800 12px ' + FONT;
              const wv = ctx.measureText(l.tag).width;
              ctx.font = '600 9px ' + FONT;
              const ws = ctx.measureText(l.stageName).width;
              const bw = Math.max(wv, ws) + 12, bh = 28;
              ctx.fillStyle = 'rgba(255,255,255,.96)';
              ctx.beginPath();
              if (ctx.roundRect) ctx.roundRect(p.x + ox - bw / 2, p.y + oy - bh / 2, bw, bh, 8);
              else ctx.rect(p.x + ox - bw / 2, p.y + oy - bh / 2, bw, bh);
              ctx.fill();
              ctx.strokeStyle = l.color + '44'; ctx.lineWidth = 1; ctx.stroke();
              ctx.font = '800 12px ' + FONT; ctx.fillStyle = l.color;
              ctx.fillText(l.tag, p.x + ox, p.y + oy - 5.5);
              ctx.font = '600 9px ' + FONT; ctx.fillStyle = '#8296ab';
              ctx.fillText(l.stageName, p.x + ox, p.y + oy + 7);
            }
            ctx.restore();
          }
        }
      });

      nodes.forEach(function (n) {
        const dim = isDim(n);
        const hot = n.id === selId || n.id === hoverId;
        if (n.kind === 'core') {
          const glow = ctx.createRadialGradient(n.x, n.y, 4, n.x, n.y, 64);
          glow.addColorStop(0, 'rgba(23,33,47,.28)'); glow.addColorStop(1, 'rgba(23,33,47,0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, 64, 0, 7); ctx.fill();
          ctx.fillStyle = '#17212f'; ctx.beginPath(); ctx.arc(n.x, n.y, 26, 0, 7); ctx.fill();
          ctx.fillStyle = '#2b3d57'; ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '700 15px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('博罗', n.x, n.y + .5);
          return;
        }
        if (n.kind === 'cat') {
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill();
          ctx.strokeStyle = n.color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.stroke();
          ctx.fillStyle = n.color;
          ctx.beginPath(); ctx.arc(n.x, n.y, 4.2, 0, 7); ctx.fill();
          const txt = (mob ? n.short : n.label) + '  ' + n.count;
          ctx.font = '700 ' + (mob ? 9.5 : 10.5) + 'px ' + FONT;
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = 'rgba(255,255,255,.97)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(n.x - tw / 2 - 6, n.y + n.r + 3, tw + 12, 15, 7.5);
          else ctx.rect(n.x - tw / 2 - 6, n.y + n.r + 3, tw + 12, 15);
          ctx.fill();
          ctx.strokeStyle = n.color + '44'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = n.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(txt, n.x, n.y + n.r + 10.5);
          ctx.restore();
          return;
        }
        if (n.kind === 'town') {
          ctx.save();
          ctx.globalAlpha = dim ? .16 : 1;
          const rr = 6.5 * (hot ? 1.25 : 1);
          ctx.strokeStyle = hot ? 'rgba(217,134,47,.9)' : 'rgba(110,135,165,.55)';
          ctx.lineWidth = hot ? 1.8 : 1.4;
          ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, 7); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(110,135,165,.9)'; ctx.beginPath(); ctx.arc(n.x, n.y, 2.6, 0, 7); ctx.fill();
          if (hot) {
            ctx.fillStyle = '#5d6f82'; ctx.font = '600 ' + (mob ? 9.5 : 10) + 'px ' + FONT;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(n.label, n.x, n.y + 9);
          }
          ctx.restore();
          return;
        }
        const st = n.state || 'live';
        const r = n.r * (mob ? 0.84 : 1) * (hot ? 1.14 : 1);
        ctx.save();
        ctx.globalAlpha = dim ? .14 : (st === 'live' ? 1 : .78);
        if (hot) {
          ctx.strokeStyle = 'rgba(217,134,47,.85)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, 7); ctx.stroke();
        }
        const rc = st === 'out' ? '#6f7d8f' : n.color;
        if (st === 'live') {
          const glow = ctx.createRadialGradient(n.x, n.y, r * .7, n.x, n.y, r * 2.6);
          glow.addColorStop(0, rc + '38'); glow.addColorStop(1, rc + '00');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.6, 0, 7); ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = rc; ctx.lineWidth = st === 'live' ? 2.2 : 1.3;
        if (st !== 'live') ctx.setLineDash([2.6, 2.2]);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke();
        ctx.setLineDash([]);
        if (st === 'live') {
          ctx.fillStyle = rc; ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(2.6, r * .3), 0, 7); ctx.fill();
        }
        if (st === 'out') {
          ctx.strokeStyle = '#e2544a'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(n.x - 3.2, n.y - 3.2); ctx.lineTo(n.x + 3.2, n.y + 3.2);
          ctx.moveTo(n.x + 3.2, n.y - 3.2); ctx.lineTo(n.x - 3.2, n.y + 3.2); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = dim ? .14 : 1;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const cut = mob ? 7 : 8;
        const nm = n.name.length > cut ? n.name.slice(0, cut) + '…' : n.name;
        const wip = (n.state || 'live') === 'wip';
        const outn = (n.state || 'live') === 'out';
        ctx.font = '600 ' + (mob ? 9 : 10.5) + 'px ' + FONT;
        const mw = ctx.measureText(nm).width;
        /* 标签一律沿径向朝外，不往中心方向压别的点 */
        const ctr = { x: W / 2, y: H * 0.50 };
        const ang = Math.atan2(n.y - ctr.y, n.x - ctr.x);
        const dx0 = Math.cos(ang), dy0 = Math.sin(ang);
        let lx = n.x + dx0 * (r + 11);
        let ly = n.y + dy0 * (r + 11);
        ctx.textAlign = dx0 > 0.35 ? 'left' : (dx0 < -0.35 ? 'right' : 'center');
        ctx.textBaseline = 'middle';
        let below = dy0 >= 0;
        /* 贴边放不下时，退回节点正下方居中，避免文字压回圆点 */
        if (ctx.textAlign === 'left' && lx + mw > W - 8) {
          ctx.textAlign = 'center'; lx = Math.max(8 + mw / 2, Math.min(W - 8 - mw / 2, n.x)); ly = n.y + r + 13; below = true;
        } else if (ctx.textAlign === 'right' && lx - mw < 8) {
          ctx.textAlign = 'center'; lx = Math.max(8 + mw / 2, Math.min(W - 8 - mw / 2, n.x)); ly = n.y + r + 13; below = true;
        } else if (ctx.textAlign === 'center' && (lx - mw / 2 < 8 || lx + mw / 2 > W - 8)) {
          lx = Math.max(8 + mw / 2, Math.min(W - 8 - mw / 2, n.x));
        }
        const y1 = mob ? ly : (below ? ly + 6 : ly - 6);
        const y2 = below ? y1 + 12 : y1 - 12;
        ctx.fillStyle = outn ? '#6f7d8f' : '#1e2b3a';
        ctx.fillText(nm, lx, y1);
        /* 名字下面只留一个「新」：这两个月才进网的现场。数字都挂在线上。 */
        if (mob) {
          const da = String(n.val).replace(/[^0-9.]/g, '');
          const showVal = !(da && n.name.indexOf(da) >= 0);
          if (showVal) {
            ctx.save();
            ctx.font = '700 9px ' + FONT;
            ctx.fillStyle = n.color;
            ctx.fillText(n.val, lx, y2);
            ctx.restore();
          }
        }
        /* 有上游给它送量的，名字下面直接写“← 100 亿”，一眼看出谁被带动 */
        if (!mob && n.inflow && !outn) {
          ctx.save();
          ctx.font = '700 10px ' + FONT;
          ctx.fillStyle = n.inflow.color;
          ctx.fillText('← ' + n.inflow.val, lx, y2);
          ctx.restore();
        }
        if (!mob && n.ev && !outn && n.ev.month >= 10) {
          ctx.save();
          ctx.font = '700 9.5px ' + FONT;
          const wl = ctx.measureText(nm).width;
          const nx0 = ctx.textAlign === 'left' ? lx : (ctx.textAlign === 'right' ? lx - wl - 18 : lx - wl / 2 - 13);
          ctx.fillStyle = '#1f9d63';
          ctx.beginPath(); ctx.arc(nx0 + 3, y2, 2.6, 0, 7); ctx.fill();
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('新', nx0 + 8, y2);
          ctx.restore();
        }
        ctx.restore();
      });

      ctx.restore();
    }

    let raf = 0, lastT = 0;
    function loop(ts) {
      if (document.hidden) { raf = requestAnimationFrame(loop); return; }
      if (ts - lastT < 30) { raf = requestAnimationFrame(loop); return; }
      lastT = ts;
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); } }

    let drag = null, panning = null, moved = false;
    function toWorld(e) {
      const rect = canvas.getBoundingClientRect();
      return { wx: (e.clientX - rect.left - view.x) / view.s, wy: (e.clientY - rect.top - view.y) / view.s };
    }
    function hit(p) {
      let best = null, bd = 0;
      nodes.forEach(function (n) {
        if (n.kind === 'core') return;
        const d = Math.hypot(n.x - p.wx, n.y - p.wy);
        if (d < n.r + 12 && d > bd) { best = n; bd = d; }
      });
      return best;
    }
    canvas.addEventListener('pointerdown', function (e) {
      const p = toWorld(e);
      const n = hit(p);
      moved = false;
      if (n) { drag = n; n.pin = true; canvas.style.cursor = 'grabbing'; }
      else panning = { x: e.clientX - view.x, y: e.clientY - view.y };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = toWorld(e);
      if (drag) {
        drag.x = Math.max(24, Math.min(W - 24, p.wx));
        drag.y = Math.max(24, Math.min(H - 30, p.wy));
        drag.vx = 0; drag.vy = 0;
        moved = true;
      } else if (panning) {
        view.x = e.clientX - panning.x; view.y = e.clientY - panning.y;
      } else {
        const n = hit(p);
        hoverId = n ? n.id : null;
        canvas.style.cursor = n ? 'pointer' : 'grab';
      }
    });
    canvas.addEventListener('pointerup', function (e) {
      const p = toWorld(e);
      const n = hit(p);
      if (drag) {
        drag.pin = false;
        if (!moved && n) {
          selId = n.id;
          if (opts && typeof opts.onSelect === 'function') opts.onSelect(n, { x: n.x, y: n.y, w: W, h: H });
        }
      } else if (!moved && !n) {
        selId = null;
        if (opts && typeof opts.onBlank === 'function') opts.onBlank();
      }
      drag = null; panning = null; moved = false;
      canvas.style.cursor = 'grab';
    });
    canvas.addEventListener('pointercancel', function () {
      if (drag) drag.pin = false;
      drag = null; panning = null; moved = false;
    });
    canvas.addEventListener('pointerleave', function () { hoverId = null; });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const ns = Math.max(.55, Math.min(2.6, view.s * (1 - e.deltaY * .0012)));
      view.x = sx - (sx - view.x) * (ns / view.s);
      view.y = sy - (sy - view.y) * (ns / view.s);
      view.s = ns;
    }, { passive: false });

    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });

    resize();
    if (window.ResizeObserver) { const ro = new ResizeObserver(function () { resize(); }); ro.observe(host); }
    else window.addEventListener('resize', resize);
    if (LIVE) start();
    return {
      setFilter: function (v) { filterType = v; draw(); },
      select: function (id) { selId = id; draw(); },
      clear: function () { selId = null; draw(); }
    };
  }

  window.BoluoNet = { mount: mount };
})();
