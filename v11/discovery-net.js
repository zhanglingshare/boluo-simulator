/* 博罗全息关系网络：持续力模拟 + 可拖动节点 + 连线标签 + 流向点 */
(function () {
  'use strict';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

  function colorOf(e) {
    if (e.visual === 'closure' || e.visual === 'stalled') return '#e2544a';
    if (e.stage === 3) return '#1369eb';
    if (e.stage === 2) return '#1e9aa0';
    return '#d9862f';
  }
  function shortTown(n) { return String(n || '').replace(/街道|镇/g, ''); }

  function build(events) {
    const towns = [];
    const projects = [];
    const seen = {};
    events.forEach(function (e) {
      if (!e.town) return;
      if (!seen[e.town]) { seen[e.town] = { id: 't_' + e.town, kind: 'town', label: shortTown(e.town), town: e.town, w: 0 }; towns.push(seen[e.town]); }
      seen[e.town].w += 1;
      projects.push({
        id: 'p_' + e.id, kind: 'proj', ev: e, town: e.town,
        label: e.big + e.unit, sub: e.title.replace(/^[^·]*·\s*/, ''),
        tag: e.big + e.unit,
        stageName: (e.visual === 'closure' || e.visual === 'stalled') ? '关停 / 停摆' : (e.stage === 3 ? '投产' : (e.stage === 2 ? '开工' : '签约')),
        color: colorOf(e), stalled: e.visual === 'stalled' || e.visual === 'closure'
      });
    });
    return { towns: towns, projects: projects };
  }

  function mount(host, events, opts) {
    if (!host) return;
    host.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const LIVE = !!(opts && opts.live);
    const G = build(events);
    G.allProjects = G.projects.slice();
    const nodes = [];
    const links = [];
    const core = { id: 'core', kind: 'core', label: '博罗', x: 0, y: 0, vx: 0, vy: 0, r: 26, pin: true };
    function rebuild() {
      nodes.length = 0; links.length = 0;
      nodes.push(core);
      G.towns.forEach(function (t) {
        if (t.drop) return;
        const tn = Object.assign({}, t, { vx: 0, vy: 0, r: 5, pin: false });
        nodes.push(tn);
        links.push({ a: core, b: tn, kind: 'town' });
      });
      G.projects.forEach(function (p, i) {
        const n = Object.assign({}, p, { vx: 0, vy: 0, r: p.stalled ? 8 : (p.ev.stage === 3 ? 13 : p.ev.stage === 2 ? 10 : 8.5), pin: false, ph: i });
        nodes.push(n);
        const t = nodes.find(function (x) { return x.id === 't_' + p.town; });
        links.push({ a: t || core, b: n, kind: 'proj', color: p.color, tag: p.tag, stageName: p.stageName });
      });
    }

    let W = 0, H = 0, mob = false;
    const view = { s: 1, x: 0, y: 0 };
    function resize() {
      const rect = host.getBoundingClientRect();
      W = Math.max(rect.width, 280);
      mob = W < 560;
      H = mob ? Math.round(W * 1.62) : 500;
      G.projects = G.allProjects.slice(); G.towns.forEach(function (t) { t.drop = false; });
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild(); layout();
      nodes.forEach(function (n, i) { n.bx = n.x; n.by = n.y; n.ph = i * 1.13; });
      draw();
      canvas.__nodes = nodes;
    }

    function layout() {
      const cx = W / 2, cy = H * 0.49;
      const R1 = Math.min(W, H) * (mob ? 0.30 : 0.31);
      const R2 = R1 * (mob ? (LIVE ? 1.42 : 1.5) : (LIVE ? 1.3 : 1.62));
      const towns = nodes.filter(function (n) { return n.kind === 'town'; });
      towns.forEach(function (t, i) {
        const a = -Math.PI / 2 + i / towns.length * Math.PI * 2;
        t.x = cx + Math.cos(a) * R1; t.y = cy + Math.sin(a) * R1;
        const sib = nodes.filter(function (n) { return n.kind === 'proj' && n.town === t.town; });
        sib.forEach(function (p, j) {
          const pa = a + (j - (sib.length - 1) / 2) * 0.22;
          p.x = cx + Math.cos(pa) * R2; p.y = cy + Math.sin(pa) * R2;
        });
      });
      core.x = cx; core.y = cy;
      const K = mob ? 300 : 250;
      for (let it = 0; it < 180; it++) {
        nodes.forEach(function (n) { n.fx = 0; n.fy = 0; });
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 < 1) { dx = (Math.random() - .5) * 2; dy = (Math.random() - .5) * 2; d2 = 2; }
            const d = Math.sqrt(d2), f = K * (a.kind === 'core' || b.kind === 'core' ? 2.2 : 1) / d2;
            const fx = dx / d * f, fy = dy / d * f;
            a.fx -= fx; a.fy -= fy; b.fx += fx; b.fy += fy;
          }
        }
        links.forEach(function (l) {
          const a = l.a, b = l.b;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = l.kind === 'town' ? R1 : R1 * 0.55;
          const f = (d - target) * (l.kind === 'town' ? 0.05 : 0.075);
          const fx = dx / d * f, fy = dy / d * f;
          a.fx += fx; a.fy += fy; b.fx -= fx; b.fy -= fy;
        });
        nodes.forEach(function (n) {
          if (n === core) return;
          const fx0 = W / 2, fy0 = H * .49;
          n.fx += (fx0 - n.x) * 0.0018; n.fy += (fy0 - n.y) * 0.0018;
          n.x += Math.max(-14, Math.min(14, n.fx)) * 0.9;
          n.y += Math.max(-14, Math.min(14, n.fy)) * 0.9;
          n.x = Math.max(64, Math.min(W - 64, n.x));
          n.y = Math.max(34, Math.min(H - 40, n.y));
        });
      }
    }

    /* 位置更新：布局收敛后只做轻微浮动；拖动过的地方定格在那 */
    function updatePos(ts) {
      if (!LIVE) return;
      nodes.forEach(function (n) {
        if (n.kind === 'core') return;
        if (n.pin) { n.x = n.bx; n.y = n.by; return; }
        const amp = n.kind === 'town' ? 1.6 : 2.4;
        n.x = n.bx + Math.sin(ts / 2600 + n.ph) * amp;
        n.y = n.by + Math.cos(ts / 3100 + n.ph * 1.7) * amp * .8;
      });
    }

    function bez(a, b, t) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.sqrt(nx * nx + ny * ny) || 1;
      const cxp = mx + nx / nl * 8, cyp = my + ny / nl * 8;
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * cxp + t * t * b.x,
        y: u * u * a.y + 2 * u * t * cyp + t * t * b.y,
        cx: cxp, cy: cyp
      };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W / 2, H * .46, 10, W / 2, H * .46, Math.max(W, H) * .72);
      bg.addColorStop(0, '#fbfcfe'); bg.addColorStop(1, '#f2f6fb');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(view.x, view.y); ctx.scale(view.s, view.s);
      ctx.strokeStyle = 'rgba(150,170,195,.13)'; ctx.lineWidth = 1;
      const g = mob ? 28 : 34;
      for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const t = performance.now();
      const dimOf = function (n) {
        if (filterStage !== null && n.ev && n.ev.stage !== filterStage) return true;
        if (selId && n.kind === 'proj' && n.id !== selId) {
          return !links.some(function (l) { return (l.b === n && l.a === nodes.find(function (x) { return x.id === selId; })); });
        }
        return false;
      };

      // 边 + 流向点 + 边标签
      links.forEach(function (l, li) {
        const a = l.a, b = l.b;
        if (!a || !b) return;
        const pt = bez(a, b, 1);
        const dim = dimOf(a) || dimOf(b);
        ctx.save();
        ctx.globalAlpha = dim ? .12 : (l.kind === 'town' ? 1 : .62);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(pt.cx, pt.cy, b.x, b.y);
        ctx.strokeStyle = l.kind === 'town' ? 'rgba(120,145,175,.34)' : l.color;
        ctx.lineWidth = l.kind === 'town' ? 1.2 : 1.6;
        if (l.kind === 'proj' && l.b.stalled) ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (l.kind === 'proj') {
          // 流向：从镇往项目流，两颗粒子错相位
          if (LIVE) {
          const speed = l.b.stalled ? 5200 : 3200;
          for (let k = 0; k < 2; k++) {
            const ph = ((t / speed) + li * 0.17 + k * 0.5) % 1;
            const p = bez(a, b, ph);
            ctx.globalAlpha = dim ? .06 : (l.b.stalled ? .35 : .85);
            ctx.fillStyle = l.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, l.b.stalled ? 2.1 : 2.7, 0, 7); ctx.fill();
          }
          }
          // 连线标签：这条关系现在走到哪一步（白描边，不压线）
          if (LIVE && !mob && l.stageName) {
            const p = bez(a, b, 0.54);
            const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
            const ox = -dy / dl * 7, oy = dx / dl * 7;
            ctx.globalAlpha = dim ? .08 : .9;
            ctx.font = '600 9px ' + FONT;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.92)';
            ctx.strokeText(l.stageName, p.x + ox, p.y + oy);
            ctx.fillStyle = l.color;
            ctx.fillText(l.stageName, p.x + ox, p.y + oy);
          }
        }
        ctx.restore();
      });

      // 节点
      nodes.forEach(function (n) {
        if (n.kind === 'core') {
          const glow = ctx.createRadialGradient(n.x, n.y, 4, n.x, n.y, 62);
          glow.addColorStop(0, 'rgba(23,33,47,.30)'); glow.addColorStop(1, 'rgba(23,33,47,0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, 62, 0, 7); ctx.fill();
          ctx.fillStyle = '#17212f'; ctx.beginPath(); ctx.arc(n.x, n.y, 27, 0, 7); ctx.fill();
          ctx.fillStyle = '#2b3d57'; ctx.beginPath(); ctx.arc(n.x, n.y, 21, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '700 15px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('博罗', n.x, n.y + .5);
          return;
        }
        if (n.kind === 'town') {
          ctx.strokeStyle = 'rgba(110,135,165,.55)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(n.x, n.y, 6.5, 0, 7); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, 6.5, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(110,135,165,.9)'; ctx.beginPath(); ctx.arc(n.x, n.y, 2.6, 0, 7); ctx.fill();
          ctx.fillStyle = '#7b8ca3'; ctx.font = (mob ? 600 : 500) + ' ' + (mob ? 10 : 10.5) + 'px ' + FONT;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(n.w > 1 ? n.label + n.w : n.label, n.x, n.y + 10);
          return;
        }
        const r = n.r;
        const glow = ctx.createRadialGradient(n.x, n.y, r * .6, n.x, n.y, r * 2.6);
        glow.addColorStop(0, n.color + '44'); glow.addColorStop(1, n.color + '00');
        const miss = filterStage !== null && n.ev && (n.ev.stage !== filterStage);
        ctx.globalAlpha = miss ? .16 : 1;
        if (n.id === selId) {
          ctx.strokeStyle = 'rgba(217,134,47,.95)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, 7); ctx.stroke();
        }
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.6, 0, 7); ctx.fill();
        if (n.stalled) {
          ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
          ctx.strokeStyle = n.color; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        } else {
          ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(n.x - r * .28, n.y - r * .32, r * .34, 0, 7); ctx.fill();
        }
        const ax = n.x - W / 2, ay = n.y - H * 0.49;
        const ang = Math.atan2(ay, ax);
        const side = Math.cos(ang) >= 0 ? 1 : -1;
        const tx0 = n.x + Math.cos(ang) * (r + 9);
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const ty = n.y + Math.sin(ang) * (r + 9);
        const lb = n.label, sb = n.sub.length > 7 ? n.sub.slice(0, 7) + '…' : n.sub;
        ctx.font = '700 ' + (mob ? 11 : 11.5) + 'px ' + FONT;
        const w1 = ctx.measureText(lb).width;
        ctx.font = '400 ' + (mob ? 9 : 9.5) + 'px ' + FONT;
        const w2 = ctx.measureText(sb).width;
        const mw = Math.max(w1, w2) + 4;
        const tx = side > 0 ? Math.min(tx0, W - 8 - mw) : Math.max(tx0, 8 + mw);
        ctx.fillStyle = '#1b2636'; ctx.font = '700 ' + (mob ? 11 : 11.5) + 'px ' + FONT;
        ctx.fillText(lb, tx, ty - 6);
        ctx.fillStyle = '#8a99ac'; ctx.font = '400 ' + (mob ? 9 : 9.5) + 'px ' + FONT;
        ctx.fillText(sb, tx, ty + 6);
      });

      ctx.restore();
      const lgd = [['签约', '#d9862f'], ['开工', '#1e9aa0'], ['投产', '#1369eb'], ['关停', '#e2544a']];
      let lx = 12;
      ctx.textBaseline = 'middle'; ctx.font = '500 9.5px ' + FONT;
      lgd.forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.beginPath(); ctx.arc(lx + 4, H - 14, 3.6, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#8a99ac'; ctx.textAlign = 'left'; ctx.fillText(it[0], lx + 11, H - 13.5);
        lx += 46;
      });
      ctx.globalAlpha = 1;
    }

    /* 常驻动画 */
    let raf = 0, lastT = 0;
    function loop(ts) {
      if (document.hidden) { raf = requestAnimationFrame(loop); return; }
      if (ts - lastT < 30) { raf = requestAnimationFrame(loop); return; }
      lastT = ts;
      updatePos(ts);
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf) lastT = 0, raf = requestAnimationFrame(loop); }
    canvas.__netRaf = function () { return raf; };

    const onSelect = opts && opts.onSelect;
    let filterStage = null;
    let drag = null, panning = null, downAt = null, selId = null;
    function toWorld(e) {
      const rect = canvas.getBoundingClientRect();
      return { wx: (e.clientX - rect.left - view.x) / view.s, wy: (e.clientY - rect.top - view.y) / view.s };
    }
    canvas.addEventListener('pointerdown', function (e) {
      const p = toWorld(e);
      let best = null, bd = 0;
      nodes.forEach(function (n) {
        if (n.kind === 'core') return;
        const d = Math.hypot(n.x - p.wx, n.y - p.wy);
        if (d < n.r + 10 && d > bd) { best = n; bd = d; }
      });
      downAt = { x: e.clientX, y: e.clientY };
      if (best) { drag = best; best.pin = true; canvas.style.cursor = 'grabbing'; }
      else panning = { x: e.clientX - view.x, y: e.clientY - view.y };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = toWorld(e);
      if (drag) {
        drag.bx = Math.max(20, Math.min(W - 20, p.wx));
        drag.by = Math.max(20, Math.min(H - 20, p.wy));
        drag.x = drag.bx; drag.y = drag.by;
        drag.vx = 0; drag.vy = 0;
      } else if (panning) {
        view.x = e.clientX - panning.x; view.y = e.clientY - panning.y;
      } else {
        let hit = false;
        nodes.forEach(function (n) {
          if (n.kind === 'core') return;
          if (Math.hypot(n.x - p.wx, n.y - p.wy) < n.r + 10) hit = true;
        });
        canvas.style.cursor = hit ? 'grab' : 'default';
      }
    });
    canvas.addEventListener('pointerup', function (e) {
      const moved = downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 4;
      const p = toWorld(e);
      let best = null, bd = 0;
      nodes.forEach(function (n) {
        const d = Math.hypot(n.x - p.wx, n.y - p.wy);
        if (d < n.r + 12 && d > bd) { best = n; bd = d; }
      });
      if (drag) drag.pin = false;
      if (best && !moved) {
        selId = best.id;
        if (typeof onSelect === 'function') onSelect(best);
      }
      drag = null; panning = null; downAt = null;
      canvas.style.cursor = 'default';
    });
    canvas.addEventListener('pointercancel', function () {
      if (drag) drag.pin = false;
      drag = null; panning = null; downAt = null;
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const ns = Math.max(.55, Math.min(2.6, view.s * (1 - e.deltaY * .0012)));
      view.x = sx - (sx - view.x) * (ns / view.s);
      view.y = sy - (sy - view.y) * (ns / view.s);
      view.s = ns;
    }, { passive: false });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) start();
    });

    resize();
    if (window.ResizeObserver) { const ro = new ResizeObserver(function () { resize(); }); ro.observe(host); }
    else window.addEventListener('resize', resize);
    if (LIVE) start();
    return {
      setFilter: function (v) { filterStage = v; draw(); },
      select: function (id) { selId = id; draw(); },
      clear: function () { selId = null; draw(); }
    };
  }

  window.BoluoNet = { mount: mount };
})();
