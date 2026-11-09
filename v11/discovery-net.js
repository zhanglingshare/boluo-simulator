/* 博罗全息关系网络：持续力模拟 + 可拖动节点 + 连线标签 + 流向点 */
(function () {
  'use strict';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

  const RELC = { supply: '#2563eb', invest: '#0e9ba5', coop: '#7c3aed', agri: '#d97706' };
  function colorOf(e) { return RELC[e.rel] || '#0e9ba5'; }
  function shortTown(n) { return String(n || '').replace(/街道|镇/g, ''); }
  function stageNameOf(e) {
    if (e.visual === 'closure' || e.visual === 'stalled') return '关停 / 停摆';
    if (e.visual === 'copper') return '点火';
    if (e.visual === 'food' || e.visual === 'agriculture' || e.visual === 'tea') return '统计';
    return e.stage === 3 ? '投产' : (e.stage === 2 ? '开工' : '签约');
  }

  function build(events) {
    const towns = [];
    const projects = [];
    const seen = {};
    events.forEach(function (e) {
      if (e.town && !seen[e.town]) { seen[e.town] = { id: 't_' + e.town, kind: 'town', label: shortTown(e.town), town: e.town, w: 0 }; towns.push(seen[e.town]); }
      if (e.town) seen[e.town].w += 1;
      projects.push({
        id: 'p_' + e.id, kind: 'proj', ev: e, town: e.town,
        val: e.big + e.unit,
        name: e.title.replace(/^[^·]*·\s*/, ''),
        color: colorOf(e), stalled: e.visual === 'stalled' || e.visual === 'closure',
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
      G.towns.forEach(function (t) {
        if (t.drop) return;
        const tn = Object.assign({}, t, { vx: 0, vy: 0, r: 6.5, pin: false, spawn: 1 });
        nodes.push(tn);
        links.push({ a: core, b: tn, kind: 'town' });
      });
      G.projects.forEach(function (p) {
        const n = Object.assign({}, p, { vx: 0, vy: 0, x: 0, y: 0, r: p.stalled ? 8.5 : (p.ev.stage === 3 ? 13 : (p.ev.stage === 2 ? 10 : 8.5)), pin: false, spawn: 1 });
        nodes.push(n);
        const t = p.town ? nodes.find(function (x) { return x.id === 't_' + p.town; }) : null;
        links.push({ a: t || core, b: n, kind: 'proj', far: !p.town, color: p.stalled ? '#e2544a' : p.color, tag: p.val, stageName: p.stageName });
      });
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
      rebuild(); seed(); warm(300);
      draw();
      canvas.__nodes = nodes;
    }

    /* 起始摆放：一环镇街、外一环项目，然后交给力场收敛 */
    function seed() {
      const cx = W / 2, cy = H * 0.47;
      const towns = nodes.filter(function (n) { return n.kind === 'town'; });
      towns.forEach(function (t, i) {
        const a = -Math.PI / 2 + i / towns.length * Math.PI * 2;
        t.x = cx + Math.cos(a) * R1; t.y = cy + Math.sin(a) * R1;
        const sib = nodes.filter(function (n) { return n.kind === 'proj' && n.town === t.town; });
        sib.forEach(function (p, j) {
          const pa = a + (j - (sib.length - 1) / 2) * 0.26;
          p.x = cx + Math.cos(pa) * R1 * 1.45;
          p.y = cy + Math.sin(pa) * R1 * 1.45;
        });
      });
      // 没有镇街可挂的全县条目，单独铺在环外
      const orphan = nodes.filter(function (n) { return n.kind === 'proj' && !n.town; });
      orphan.forEach(function (p, i) {
        const a = Math.PI * 0.35 + i * 0.55;
        p.x = cx + Math.cos(a) * R1 * 1.2;
        p.y = cy + Math.sin(a) * R1 * 1.2;
      });
      core.x = cx; core.y = cy;
      nodes.forEach(function (n) { n.vx = 0; n.vy = 0; });
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
        const target = l.kind === 'town' ? R1 : (l.far ? R1 * 1.28 : R1 * 0.56);
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

      links.forEach(function (l, li) {
        const a = l.a, b = l.b;
        if (!a || !b) return;
        const dim = isDim(a) || isDim(b);
        const onSel = !!(selId && (a.id === selId || b.id === selId));
        const ctl = bez(a, b, 0);
        ctx.save();
        ctx.globalAlpha = dim ? .1 : (onSel ? 1 : (l.kind === 'town' ? 1 : .68));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(ctl.x, ctl.y, b.x, b.y);
        ctx.strokeStyle = l.kind === 'town' ? 'rgba(120,145,175,.34)' : l.color;
        ctx.lineWidth = l.kind === 'town' ? 1.2 : (onSel ? 2.6 : 1.7);
        if (l.kind === 'proj' && l.b.stalled) ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        if (l.kind === 'proj') {
          if (LIVE) {
            const speed = l.b.stalled ? 5200 : 3000;
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
          if (LIVE && !mob && l.stageName) {
            const p = bez(a, b, 0.55);
            const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
            const ox = -dy / dl * 9, oy = dx / dl * 9;
            ctx.save();
            ctx.globalAlpha = dim ? .08 : .95;
            ctx.font = '600 9px ' + FONT;
            const tw = ctx.measureText(l.stageName).width;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255,255,255,.94)';
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(p.x + ox - tw / 2 - 5, p.y + oy - 7.5, tw + 10, 15, 7.5);
            else ctx.rect(p.x + ox - tw / 2 - 5, p.y + oy - 7.5, tw + 10, 15);
            ctx.fill();
            ctx.strokeStyle = l.color + '33'; ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = l.color;
            ctx.fillText(l.stageName, p.x + ox, p.y + oy);
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
        const r = n.r * (mob ? 0.84 : 1) * (hot ? 1.14 : 1);
        ctx.save();
        ctx.globalAlpha = dim ? .16 : 1;
        if (hot) {
          ctx.strokeStyle = 'rgba(217,134,47,.85)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, 7); ctx.stroke();
        }
        const gcol = n.stalled ? '#e2544a' : n.color;
        const glow = ctx.createRadialGradient(n.x, n.y, r * .7, n.x, n.y, r * 2.8);
        glow.addColorStop(0, gcol + '3a'); glow.addColorStop(1, gcol + '00');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.8, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        const rc = n.stalled ? '#e2544a' : n.color;
        ctx.strokeStyle = rc; ctx.lineWidth = n.stalled ? 1.5 : 2.1;
        if (n.stalled) ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rc; ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(2.4, r * .3), 0, 7); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = dim ? .14 : 1;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const cut = mob ? 5 : 8;
        const nm = n.name.length > cut ? n.name.slice(0, cut) + '…' : n.name;
        ctx.font = '600 ' + (mob ? 9 : 10.5) + 'px ' + FONT;
        const mw = Math.max(ctx.measureText(nm).width, (function () {
          ctx.save(); ctx.font = '700 ' + (mob ? 8.5 : 9.5) + 'px ' + FONT;
          const w2 = ctx.measureText(n.val).width; ctx.restore(); return w2;
        })());
        const tx = Math.max(6 + mw / 2, Math.min(W - 6 - mw / 2, n.x));
        ctx.fillStyle = '#1e2b3a';
        ctx.fillText(nm, tx, n.y + r + 4);
        ctx.font = '700 ' + (mob ? 8.5 : 9.5) + 'px ' + FONT;
        ctx.fillStyle = n.color;
        ctx.fillText(n.val, tx, n.y + r + (mob ? 15 : 17));
        ctx.restore();
      });

      ctx.restore();
    }

    let raf = 0, lastT = 0;
    function loop(ts) {
      if (document.hidden) { raf = requestAnimationFrame(loop); return; }
      if (ts - lastT < 30) { raf = requestAnimationFrame(loop); return; }
      lastT = ts;
      simulate();
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
