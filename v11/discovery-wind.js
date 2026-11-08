/* 首页深色风洞主视觉：canvas 伪 3D（透视投影 + 绕轴微旋） */
(function () {
  const COLOR = {
    bad:   'rgba(255,150,128,ALPHA)',
    good:  'rgba(170,236,255,ALPHA)',
    money: 'rgba(255,214,130,ALPHA)'
  };
  const DEFAULT_WORDS = [
    { v: '−44.7%',     t: '前三季工业投资', d: 'Q1–Q3', k: 'bad' },
    { v: '2027 下半',  t: '缺口就到这几个月', d: '',     k: 'bad' },
    { v: '6 个',       t: '湖镇项目未动工', d: '至今',   k: 'bad' },
    { v: '100 亿',     t: '铜来顺明年目标', d: '10-13', k: 'money' },
    { v: '超 2000 亿', t: '规上工业总产值', d: '2025',   k: 'good' },
    { v: '19 个现场',  t: '今年落地的节点', d: '',       k: 'good' },
    { v: '11 个镇街',  t: '挂在这张网上',   d: '',       k: 'good' },
    { v: '+8.9%',      t: '规上增加值还在涨', d: 'Q1–Q3', k: 'good' }
  ];
  'use strict';
  const CY = '#7fd4ff', CY2 = '#2ea8e6', DIM = 'rgba(127,212,255,.55)';

  function rotY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }
  function rotX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  const R_PROFILE = [
    [0.00, 0.34], [0.10, 0.30], [0.22, 0.20], [0.30, 0.165],
    [0.42, 0.20], [0.60, 0.34], [0.80, 0.50], [1.00, 0.60]
  ];
  function radiusAt(t) {
    for (let i = 1; i < R_PROFILE.length; i++) {
      if (t <= R_PROFILE[i][0]) {
        const a = R_PROFILE[i - 1], b = R_PROFILE[i];
        const k = (t - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return 0.6;
  }

  function buildWords(list) {
    const lane = [-.78, .74, -.44, .40, -.10, .62, -.66, .16];
    const n = Math.min(list.length, 7);
    return list.slice(0, n).map(function (x, i) {
      return {
        v: x.v, t: x.t || '', d: x.d || '',
        c: COLOR[x.k] || COLOR.good,
        row: i - (n - 1) / 2,
        z: 1.0 - i * (0.62 / Math.max(1, n - 1)),
        sp: 0.0046
      };
    });
  }

  function mount(canvas, items) {
    if (items && items.length) words = buildWords(items);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, t0 = performance.now();
    const parts = [];
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.55;
      parts.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, z: Math.random(), sp: 0.045 + Math.random() * 0.07 });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now) {
      if (!W) resize();
      const t = (now - t0) / 1000;
      const breathe = 1 + Math.sin(t * 0.5) * 0.012;
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(W * 0.42, H * 0.46, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
      bg.addColorStop(0, 'rgba(16,38,64,.85)');
      bg.addColorStop(.5, 'rgba(6,13,24,.94)');
      bg.addColorStop(1, '#04080f');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      const A0 = { x: W * 0.05, y: H * 0.38 }, A1 = { x: W * 0.96, y: H * 0.55 };
      const R0 = Math.min(H * 0.54, W * 0.26) * breathe;
      function ell(k) {
        const x = A0.x + (A1.x - A0.x) * k;
        const y = A0.y + (A1.y - A0.y) * k + Math.sin(k * Math.PI) * H * 0.03;
        const r = R0 * radiusAt(k);
        return { x: x, y: y, rx: r, ry: r * 0.60, rot: -0.13 };
      }
      function ringPath(e) { ctx.ellipse(e.x, e.y, e.rx, e.ry, e.rot, 0, Math.PI * 2); }

      // 地面网格（透视：向远处收）
      ctx.lineWidth = 1;
      for (let g = 0; g <= 12; g++) {
        const k = g / 12;
        const e = ell(k);
        ctx.beginPath();
        ctx.moveTo(e.x - W * 0.5, e.y + e.ry * 1.65);
        ctx.lineTo(e.x + W * 0.5, e.y + e.ry * 1.65);
        ctx.strokeStyle = 'rgba(64,132,180,' + Math.max(.015, .16 - k * .013) + ')';
        ctx.stroke();
      }
      for (let g = -6; g <= 6; g++) {
        const off = g * W * 0.075;
        ctx.beginPath();
        let f = true;
        for (let k = 0; k <= 1; k += .06) {
          const e = ell(k);
          const px = e.x + off * (1 - k * .0) * .9, py = e.y + e.ry * 1.65 + off * .16;
          if (f) { ctx.moveTo(px, py); f = false; } else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(64,132,180,.07)'; ctx.stroke();
      }

      // 城市剪影
      ctx.save();
      for (let i = 0; i < 34; i++) {
        const bx = W * 0.03 + i * W * 0.029;
        const bh = (8 + (i * 41 % 30)) * (H / 420);
        ctx.fillStyle = 'rgba(8,17,29,.85)';
        ctx.fillRect(bx, A1.y + R0 * 0.52, W * 0.023, bh + 30);
        ctx.fillStyle = 'rgba(120,200,255,.10)';
        ctx.fillRect(bx + 2, A1.y + R0 * 0.52 + 6, 2, 2);
      }
      const fog = ctx.createLinearGradient(0, A1.y + R0 * 0.3, 0, H);
      fog.addColorStop(0, 'rgba(4,8,15,0)'); fog.addColorStop(1, 'rgba(4,8,15,.85)');
      ctx.fillStyle = fog; ctx.fillRect(0, A1.y + R0 * 0.3, W, H);
      ctx.restore();

      // 环（远→近）
      const steps = 30;
      for (let i = steps; i >= 0; i--) {
        const k = i / steps;
        const e = ell(k);
        ctx.beginPath(); ringPath(e);
        ctx.fillStyle = 'rgba(52,120,180,.055)';
        ctx.fill();
        const al = k < .3 ? .9 : (k > .72 ? .45 : .66);
        ctx.strokeStyle = 'rgba(127,212,255,' + al * .58 + ')';
        ctx.lineWidth = k < .3 ? 1.8 : 1.15;
        ctx.stroke();
      }

      // 四条纵筋，撑出体积
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(function (a, ai) {
        ctx.beginPath();
        let f = true;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps, e = ell(k);
          const px = e.x + Math.cos(a) * e.rx * Math.cos(e.rot) - Math.sin(a) * e.ry * Math.sin(e.rot);
          const py = e.y + Math.cos(a) * e.rx * Math.sin(e.rot) + Math.sin(a) * e.ry * Math.cos(e.rot);
          if (f) { ctx.moveTo(px, py); f = false; } else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(127,212,255,' + (ai % 2 ? .22 : .34) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 喉部扇叶
      const th = ell(0.30);
      ctx.strokeStyle = 'rgba(150,225,255,.9)'; ctx.lineWidth = 2.2;
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + t * 0.45;
        const px = th.x + Math.cos(a) * th.rx * 1.02, py = th.y + Math.sin(a) * th.ry * 1.02;
        ctx.beginPath(); ctx.moveTo(th.x, th.y); ctx.lineTo(px, py); ctx.stroke();
      }
      ctx.fillStyle = '#d8f2ff';
      ctx.beginPath(); ctx.arc(th.x, th.y, 3.6, 0, 7); ctx.fill();
      const halo = ctx.createRadialGradient(th.x, th.y, 1, th.x, th.y, 26);
      halo.addColorStop(0, 'rgba(160,225,255,.5)'); halo.addColorStop(1, 'rgba(160,225,255,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(th.x, th.y, 26, 0, 7); ctx.fill();

      // 粒子与文字同速向前，文字到喉部被吸入
      words.forEach(function (w) {
        w.z -= w.sp;
        if (w.z < .252) { w.z = 1.02; w.u = (Math.random() * 2 - 1) * .62; }
      });
      parts.forEach(function (p) {
        p.z += p.sp * 0.016;
        if (p.z > 1) p.z = 0;
        const e = ell(p.z);
        const px = e.x + p.u * e.rx * 1.05, py = e.y + p.v * e.ry * 1.05;
        ctx.fillStyle = 'rgba(160,225,255,' + (.12 + p.z * .55) + ')';
        ctx.beginPath(); ctx.arc(px, py, 1.3 + p.z * 1.2, 0, 7); ctx.fill();
      });

      // 关键数字飞进洞口
      words.forEach(function (w) {
        const e = ell(w.z);
        const sz = 10 + Math.min(w.z,1) * 22;
        let a = .96;
        if (w.z > .94) a = (1 - w.z) / .06;
        else if (w.z < .42) a = (w.z - .255) / .165;
        a = Math.max(0, Math.min(1, a));
        const cy = H * 0.44 + w.row * (H < 460 ? 34 : 42);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(5,14,22,.95)'; ctx.shadowBlur = 14;
        ctx.font = '800 ' + sz.toFixed(1) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillStyle = w.c.replace('ALPHA', a.toFixed(2));
        ctx.fillText(w.v, Math.max(W*0.08, Math.min(W*0.92, e.x)), cy);
        if (w.t) {
          ctx.font = '500 ' + (sz * 0.44).toFixed(1) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
          ctx.fillStyle = 'rgba(196,216,230,' + (a * 0.82).toFixed(2) + ')';
          ctx.fillText(w.t, Math.max(W*0.08, Math.min(W*0.92, e.x)), cy + sz * 0.64);
        }
        ctx.shadowBlur = 0;
      });

      // 出口辉光
      const out = ell(1);
      const glow = ctx.createRadialGradient(out.x, out.y, 4, out.x, out.y, out.rx * 1.5);
      glow.addColorStop(0, 'rgba(127,212,255,.16)'); glow.addColorStop(1, 'rgba(127,212,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(out.x, out.y, out.rx * 1.5, 0, 7); ctx.fill();

      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    let words = buildWords(DEFAULT_WORDS);
    const ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { t0 = performance.now() - 1; raf = requestAnimationFrame(frame); }
    });
  }

  window.BoluoWind = { mount: mount };
})();
