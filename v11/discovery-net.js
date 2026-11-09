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
      G.projects.forEach(function (p) {
        const n = Object.assign({}, p, { vx: 0, vy: 0, x: 0, y: 0, r: p.state === 'live' ? 12.5 : (p.state === 'out' ? 8.5 : 7), pin: false, spawn: 1 });
        nodes.push(n);
        links.push({ a: core, b: n, kind: 'proj', far: !p.town, color: p.color, tag: p.val, stageName: p.stageName, state: p.state });
      });
      /* 同镇之间的淡线：只说明这些现场在同一个镇，不是业务往来 */
      const byTown = {};
      nodes.forEach(function (n) {
        if (n.kind === 'proj' && n.town) { (byTown[n.town] = byTown[n.town] || []).push(n); }
      });
      Object.keys(byTown).forEach(function (k) {
        const list = byTown[k];
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) links.push({ a: list[i], b: list[j], kind: 'sib' });
        }
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
      rebuild(); seed();
      draw();
      canvas.__nodes = nodes;
    }

    /* 静态环布：同一个镇的项目占一个扇区，一内一外错开，再做轻避让。
       图上不出现镇——镇只决定谁挨着谁，不落成节点。 */
    function seed() {
      const cx = W / 2, cy = H * 0.50;
      const projs = nodes.filter(function (n) { return n.kind === 'proj'; });
      const order = [], byTown = {};
      projs.forEach(function (p) {
        const k = p.town || '_';
        if (!byTown[k]) { byTown[k] = []; order.push(k); }
        byTown[k].push(p);
      });
      const rx = W * (mob ? 0.325 : 0.365), ry = H * (mob ? 0.43 : 0.40);
      let totalW = 0;
      order.forEach(function (k) { totalW += 1 + 0.55 * (byTown[k].length - 1); });
      let acc = -Math.PI / 2 - Math.PI * 2 * 0.5;
      order.forEach(function (k) {
        const sib = byTown[k], n = sib.length;
        const span = Math.PI * 2 * (1 + 0.55 * (n - 1)) / totalW;
        const base = acc + span * 0.5;
        const gap = Math.min(mob ? 0.52 : 0.42, (span / Math.max(n, 1)) * (mob ? 1.15 : 0.92));
        sib.forEach(function (p, j) {
          const a = base + (j - (n - 1) / 2) * gap;
          const k2 = (n > 2 && j % 2 === 1) ? 1.07 : 0.92;
          p.labUp = n > 1 && j % 2 === 1;
          p.x = cx + Math.cos(a) * rx * k2;
          p.y = cy + Math.sin(a) * ry * k2;
        });
        acc += span;
      });
      core.x = cx; core.y = cy;
      nodes.forEach(function (n) { n.vx = 0; n.vy = 0; });
      /* 轻避让，只防标签压住 */
      for (let it = 0; it < 80; it++) {
        for (let i = 0; i < projs.length; i++) {
          for (let j = i + 1; j < projs.length; j++) {
            const a = projs[i], b = projs[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const need = Math.max(a.r, b.r) * 3.05;
            if (d < need) {
              const push = (need - d) / 2, ux = dx / d, uy = dy / d;
              a.x -= ux * push; a.y -= uy * push;
              b.x += ux * push; b.y += uy * push;
            }
          }
        }
        projs.forEach(function (n) {
          n.x = Math.max(n.r + 26, Math.min(W - n.r - 26, n.x));
          n.y = Math.max(n.r + 26, Math.min(H - n.r - 34, n.y));
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

      links.forEach(function (l, li) {
        const a = l.a, b = l.b;
        if (!a || !b) return;
        const dim = isDim(a) || isDim(b);
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
        ctx.globalAlpha = dim ? .08 : (onSel ? 1 : (l.kind === 'town' ? 1 : (st === 'live' ? .7 : .42)));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(ctl.x, ctl.y, b.x, b.y);
        ctx.strokeStyle = l.kind === 'town' ? 'rgba(120,145,175,.34)' : l.color;
        ctx.lineWidth = l.kind === 'town' ? 1.2 : (onSel ? 2.6 : (st === 'live' ? 1.8 : 1.2));
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
          if (LIVE && !mob && st === 'live') {
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
        const cut = mob ? 5 : 8;
        const nm = n.name.length > cut ? n.name.slice(0, cut) + '…' : n.name;
        const wip = (n.state || 'live') === 'wip';
        const outn = (n.state || 'live') === 'out';
        ctx.font = '600 ' + (mob ? 9 : 10.5) + 'px ' + FONT;
        const mw = Math.max(ctx.measureText(nm).width, (function () {
          ctx.save(); ctx.font = '700 ' + (mob ? 8.5 : 9.5) + 'px ' + FONT;
          const w2 = wip ? ctx.measureText('在途').width : ctx.measureText(n.val).width; ctx.restore(); return w2;
        })());
        /* 标签一律沿径向朝外，不往中心方向压别的点 */
        const ctr = { x: W / 2, y: H * 0.50 };
        const ang = Math.atan2(n.y - ctr.y, n.x - ctr.x);
        const dx0 = Math.cos(ang), dy0 = Math.sin(ang);
        let lx = n.x + dx0 * (r + 11);
        let ly = n.y + dy0 * (r + 11);
        ctx.textAlign = dx0 > 0.35 ? 'left' : (dx0 < -0.35 ? 'right' : 'center');
        if (ctx.textAlign === 'left') lx = Math.max(6, Math.min(W - 6 - mw, lx));
        else if (ctx.textAlign === 'right') lx = Math.max(6 + mw, Math.min(W - 6, lx));
        else lx = Math.max(6 + mw / 2, Math.min(W - 6 - mw / 2, lx));
        ctx.textBaseline = 'middle';
        const below = dy0 >= 0;
        const y1 = mob ? ly : (below ? ly + 6 : ly - 6);
        const y2 = below ? y1 + 12 : y1 - 12;
        ctx.fillStyle = outn ? '#6f7d8f' : (wip ? '#93a3b5' : '#1e2b3a');
        ctx.fillText(nm, lx, y1);
        if (!mob) {
          ctx.font = '700 9.5px ' + FONT;
          ctx.fillStyle = wip ? '#b3c0cf' : n.color;
          ctx.fillText(wip ? '在途' : n.val, lx, y2);
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
