/* 博罗第一页主视觉：产业关系网络（canvas，预计算力导向） */
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
        color: colorOf(e), stalled: e.visual === 'stalled' || e.visual === 'closure'
      });
    });
    return { towns: towns, projects: projects };
  }

  function weight(e){return (parseFloat(String(e.big).replace(/[^0-9.]/g,''))||0)*(e.unit==='亿'?100:e.unit==='万㎡'?10:1);}
  function mount(host, events) {
    if (!host) return;
    host.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const G = build(events);
    G.allProjects = G.projects.slice();
    let mobileNow = false;
    const nodes = [];
    const links = [];
    const core = { id: 'core', kind: 'core', label: '博罗', x: 0, y: 0, vx: 0, vy: 0, r: 26 };
    function rebuild() {
      nodes.length = 0; links.length = 0;
      nodes.push(core);
      G.towns.forEach(function (t) {
        if (t.drop) return;
        const tn = Object.assign({}, t, { vx: 0, vy: 0, r: 5 });
        nodes.push(tn);
        links.push({ a: core, b: tn, kind: 'town' });
      });
      G.projects.forEach(function (p) {
        const n = Object.assign({}, p, { vx: 0, vy: 0, r: p.stalled ? 8 : (p.ev.stage === 3 ? 13 : p.ev.stage === 2 ? 10 : 8.5) });
        nodes.push(n);
        const t = nodes.find(function (x) { return x.id === 't_' + p.town; });
        links.push({ a: t || core, b: n, kind: 'proj', color: p.color });
      });
    }

    let W = 0, H = 0, mob = false;
    const view = { s: 1, x: 0, y: 0 };
    function resize() {
      const rect = host.getBoundingClientRect();
      W = Math.max(rect.width, 280);
      mob = W < 560;
      H = mob ? Math.round(W * 1.62) : 500;
      G.projects = G.allProjects.slice(); G.towns.forEach(function(t){t.drop=false;});
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild(); layout();
      draw();
    }

    function layout() {
      const cx = W / 2, cy = H * 0.49;
      const R1 = Math.min(W, H) * (mob ? 0.30 : 0.31);
      const R2 = R1 * (mob ? 1.5 : 1.62);
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
      // 力导向收敛
      const K = mob ? 300 : 250;
      for (let it = 0; it < 320; it++) {
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
          const cx0 = W / 2, cy0 = H * .49;
          n.fx += (cx0 - n.x) * 0.0018; n.fy += (cy0 - n.y) * 0.0018;
          n.x += Math.max(-14, Math.min(14, n.fx)) * 0.9;
          n.y += Math.max(-14, Math.min(14, n.fy)) * 0.9;
          n.x = Math.max(28, Math.min(W - 28, n.x));
          n.y = Math.max(30, Math.min(H - 34, n.y));
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 底：极浅径向 + 网格
      const bg = ctx.createRadialGradient(W / 2, H * .46, 10, W / 2, H * .46, Math.max(W, H) * .72);
      bg.addColorStop(0, '#fbfcfe'); bg.addColorStop(1, '#f2f6fb');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(view.x, view.y); ctx.scale(view.s, view.s);
      ctx.strokeStyle = 'rgba(150,170,195,.13)'; ctx.lineWidth = 1;
      const g = mob ? 28 : 34;
      for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // 边
      links.forEach(function (l) {
        const a = l.a, b = l.b;
        ctx.beginPath();
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.sqrt(nx * nx + ny * ny) || 1;
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx + nx / nl * 8, my + ny / nl * 8, b.x, b.y);
        ctx.strokeStyle = l.kind === 'town' ? 'rgba(120,145,175,.34)' : l.color;
        ctx.globalAlpha = l.kind === 'town' ? 1 : .55;
        ctx.lineWidth = l.kind === 'town' ? 1.2 : 1.6;
        if (l.kind === 'proj' && l.b.stalled) ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
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
        // 项目节点
        const r = n.r;
        const glow = ctx.createRadialGradient(n.x, n.y, r * .6, n.x, n.y, r * 2.6);
        glow.addColorStop(0, n.color + '44'); glow.addColorStop(1, n.color + '00');
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
        const tx = n.x + Math.cos(ang) * (r + 9);
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const ty = n.y + Math.sin(ang) * (r + 9);
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1b2636'; ctx.font = '700 ' + (mob ? 11 : 11.5) + 'px ' + FONT;
        ctx.fillText(n.label, tx, ty - 6);
        ctx.fillStyle = '#8a99ac'; ctx.font = '400 ' + (mob ? 9 : 9.5) + 'px ' + FONT;
        ctx.fillText(n.sub.length > 7 ? n.sub.slice(0, 7) + '…' : n.sub, tx, ty + 6);
      });

      ctx.restore();
      // 图例
      const lgd = [['签约', '#d9862f'], ['开工', '#1e9aa0'], ['投产', '#1369eb'], ['关停', '#e2544a']];
      let lx = 12;
      ctx.textBaseline = 'middle'; ctx.font = '500 9.5px ' + FONT;
      lgd.forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.beginPath(); ctx.arc(lx + 4, H - 14, 3.6, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a99ac'; ctx.textAlign = 'left'; ctx.fillText(it[0], lx + 11, H - 13.5);
        lx += 46;
      });
    }

    let drag = null, panning = null;
    function toWorld(e) {
      const rect = canvas.getBoundingClientRect();
      return { wx: (e.clientX - rect.left - view.x) / view.s, wy: (e.clientY - rect.top - view.y) / view.s };
    }
    canvas.addEventListener('pointerdown', function (e) {
      const p = toWorld(e);
      let best = null, bd = 0;
      nodes.forEach(function (n) { const d = Math.hypot(n.x - p.wx, n.y - p.wy); if (d < n.r + 10 && d > bd) { best = n; bd = d; } });
      if (best) drag = best; else panning = { x: e.clientX - view.x, y: e.clientY - view.y };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (drag) {
        const p = toWorld(e);
        drag.x = p.wx; drag.y = p.wy; draw();
      } else if (panning) {
        view.x = e.clientX - panning.x; view.y = e.clientY - panning.y; draw();
      }
    });
    canvas.addEventListener('pointerup', function () { drag = null; panning = null; });
    canvas.addEventListener('pointercancel', function () { drag = null; panning = null; });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const ns = Math.max(.55, Math.min(2.6, view.s * (1 - e.deltaY * .0012)));
      view.x = sx - (sx - view.x) * (ns / view.s);
      view.y = sy - (sy - view.y) * (ns / view.s);
      view.s = ns; draw();
    }, { passive: false });

    resize();
    if (window.ResizeObserver) { const ro = new ResizeObserver(function () { resize(); }); ro.observe(host); }
    else window.addEventListener('resize', resize);
  }

  window.BoluoNet = { mount: mount };
})();
