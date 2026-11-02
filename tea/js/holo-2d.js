/* 柏塘山茶 · 2D Canvas 降级渲染器（无第三方依赖）
   不支持 WebGL / 低端设备时使用。自写相机空间透视投影，与 WebGL 视角一致，
   消费同一数据模型，支持节点/连线/粒子/环/地形等高线/标签与点击拾取。 */
(function (global) {
  'use strict';

  const FOV = 55 * Math.PI / 180;
  const FOCAL = 1 / Math.tan(FOV / 2);

  function create(container, orbit, shared) {
    const canvas = document.createElement('canvas');
    canvas.className = 'holo-canvas holo-canvas-2d';
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, dpr = 1;
    let model = null;

    /* ---------- 向量工具 ---------- */
    const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
    const cross = (a, b) => ({
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    });
    const norm = a => {
      const l = Math.hypot(a.x, a.y, a.z) || 1;
      return { x: a.x / l, y: a.y / l, z: a.z / l };
    };

    /* ---------- 相机基向量与投影 ---------- */
    let basis = null;
    function updateBasis() {
      const cp = orbit.cameraPosition();
      const fwd = norm(sub(orbit.target, cp));
      const right = norm(cross(fwd, { x: 0, y: 1, z: 0 }));
      const upCam = cross(right, fwd);
      basis = { cp, fwd, right, upCam };
    }
    function project(p) {
      const r = sub(p, basis.cp);
      const xc = dot(r, basis.right);
      const yc = dot(r, basis.upCam);
      const zc = dot(r, basis.fwd);
      if (zc <= 0.15) return null;
      const persp = FOCAL / zc;
      return {
        x: W / 2 + xc * persp * (H / 2),
        y: H / 2 - yc * persp * (H / 2),
        z: zc,
        s: persp * (H / 2)
      };
    }

    /* ---------- 颜色与辉光 sprite ---------- */
    function hexRgb(hex) {
      return { r: (hex >> 16) & 255, g: (hex >> 8) & 255, b: hex & 255 };
    }
    const glowCache = new Map();
    function glowSprite(hex) {
      if (glowCache.has(hex)) return glowCache.get(hex);
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const gctx = c.getContext('2d');
      const rgb = hexRgb(hex);
      const g = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)');
      g.addColorStop(0.4, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.45)');
      g.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
      gctx.fillStyle = g;
      gctx.fillRect(0, 0, 64, 64);
      glowCache.set(hex, c);
      return c;
    }
    const css = hex => {
      const c = hexRgb(hex);
      return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    };

    /* ---------- 绘制项收集 ---------- */
    function buildItems() {
      const items = [];
      const nodeScreen = {};

      /* 地形等高线（静态） */
      if (model.terrain && model.terrain.contours) {
        model.terrain.contours.forEach(cl => {
          const pts = cl.points.map(project).filter(Boolean);
          if (pts.length > 1) {
            items.push({
              z: pts.reduce((m, p) => Math.min(m, p.z), 999),
              kind: 'polyline', pts,
              color: cl.color || 0x34d399, opacity: cl.opacity != null ? cl.opacity : 0.5,
              dashed: false
            });
          }
        });
      }

      /* 通用 3D 折线（茶山动态垄线） */
      (model.polylines || []).forEach(pl => {
        const pts = pl.points.map(project).filter(Boolean);
        if (pts.length > 1) {
          items.push({
            z: pts.reduce((m, p) => Math.min(m, p.z), 999),
            kind: 'polyline', pts,
            color: pl.color, opacity: pl.opacity != null ? pl.opacity : 0.6,
            dashed: !!pl.dashed
          });
        }
      });

      /* 连线 */
      const posById = {};
      (model.nodes || []).forEach(n => { posById[n.id] = n.pos; });
      (model.edges || []).forEach(e => {
        const pa = project(posById[e.from]), pb = project(posById[e.to]);
        if (pa && pb) {
          items.push({
            z: Math.min(pa.z, pb.z), kind: 'edge',
            pa, pb, dashed: !!e.dashed, color: e.color || 0x34d399,
            opacity: e.state === 'dim' ? 0.08 : (e.state === 'lit' ? 1 : 0.55)
          });
        }
      });

      /* 粒子 */
      ctx.globalCompositeOperation = 'lighter';
      (model.particles || []).forEach(p => {
        const arr = p.positions;
        const pts = [];
        for (let i = 0; i < arr.length; i += 3) {
          const sp = project({ x: arr[i], y: arr[i + 1], z: arr[i + 2] });
          if (sp) pts.push(sp);
        }
        items.push({
          z: 0, kind: 'particles', pts,
          color: p.color, opacity: p.opacity != null ? p.opacity : 0.9,
          size: (p.size || 0.18) * (H / 2) * 0.5
        });
      });

      /* 环：采样 64 点投影成闭合线 */
      (model.rings || []).forEach(r => {
        const pts = [];
        for (let i = 0; i < 64; i++) {
          const a = i / 64 * Math.PI * 2;
          const sp = project({
            x: r.pos.x + Math.cos(a) * r.radius,
            y: r.pos.y,
            z: r.pos.z + Math.sin(a) * r.radius
          });
          if (sp) pts.push(sp);
        }
        if (pts.length > 2) {
          items.push({
            z: r.pos.z, kind: 'ring', pts, color: r.color,
            opacity: r.opacity != null ? r.opacity : 0.9
          });
        }
      });

      /* 节点 */
      (model.nodes || []).forEach(n => {
        const sp = project(n.pos);
        if (sp) {
          nodeScreen[n.id] = sp;
          items.push({
            z: sp.z, kind: 'node', sp, node: n,
            opacity: n.state === 'dim' ? 0.16 : 1
          });
        }
      });

      return { items, nodeScreen };
    }

    function drawPolyline(pts, color, opacity, dashed, width) {
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = css(color);
      ctx.lineWidth = width || 1.4;
      ctx.setLineDash(dashed ? [6, 5] : []);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* ---------- 主绘制 ---------- */
    function frame(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      updateBasis();
      const built = buildItems();

      /* 远 → 近 */
      built.items.sort((a, b) => b.z - a.z);
      const t = now / 1000;

      built.items.forEach(it => {
        if (it.kind === 'polyline') {
          drawPolyline(it.pts, it.color, it.opacity, it.dashed, 1.3);
        } else if (it.kind === 'edge') {
          drawPolyline([it.pa, it.pb], it.color, it.opacity, it.dashed, 1.7);
        } else if (it.kind === 'particles') {
          ctx.globalCompositeOperation = 'lighter';
          const rgb = hexRgb(it.color);
          ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + it.opacity + ')';
          const sz = Math.max(1.6, it.size * 0.12);
          it.pts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalCompositeOperation = 'source-over';
        } else if (it.kind === 'ring') {
          drawPolyline(it.pts, it.color, it.opacity, false, 2);
        } else if (it.kind === 'node') {
          const n = it.node, sp = it.sp;
          ctx.globalAlpha = it.opacity;
          const radiusPx = (n.radius || 0.34) * sp.s;
          const glowPx = Math.max(14, radiusPx * 4.2);
          ctx.drawImage(glowSprite(n.color), sp.x - glowPx / 2, sp.y - glowPx / 2, glowPx, glowPx);
          /* 堵点脉冲环 */
          if (n.gap) {
            const c = (t * 1.3) % 1;
            ctx.globalAlpha = (1 - c) * 0.85 * it.opacity;
            ctx.strokeStyle = css(n.pulseColor || 0xfb7185);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, radiusPx * (1.6 + c * 2), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = it.opacity;
          }
          /* 实心核心 */
          const rgb = hexRgb(n.color);
          ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.95)';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2.4, radiusPx), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      /* 标签（最上层） */
      ctx.font = '600 15px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      (model.labels || []).forEach(l => {
        const sp = project(l.pos);
        if (!sp) return;
        ctx.globalAlpha = l.opacity != null ? l.opacity : 1;
        ctx.fillStyle = css(l.color);
        ctx.shadowColor = css(l.color);
        ctx.shadowBlur = 10;
        ctx.fillText(l.text, sp.x, sp.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
      ctx.textAlign = 'start';
    }

    /* ---------- 拾取 ---------- */
    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left, my = event.clientY - rect.top;
      updateBasis();
      let best = null, bestD = 22;
      (model.nodes || []).forEach(n => {
        const sp = project(n.pos);
        if (!sp) return;
        const d = Math.hypot(sp.x - mx, sp.y - my);
        if (d < bestD) { bestD = d; best = n.id; }
      });
      return best;
    }

    function setModel(m) {
      model = m;
      /* 粒子流动更新（2D 每帧重绘，只需在 model 上调用 update） */
    }

    function resize() {
      dpr = Math.min(global.devicePixelRatio || 1, shared.pixelRatioCap || 2);
      W = container.clientWidth || 1;
      H = container.clientHeight || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }

    function destroy() { glowCache.clear(); }

    /* 粒子流动：在 frame 前推进 model 粒子的 update */
    const origFrame = frame;
    function frameWithFlow(now, dt) {
      if (model && model.particles) {
        model.particles.forEach(p => {
          if (typeof p.update === 'function') {
            p.update(p.positions, dt);
          }
        });
      }
      origFrame(now);
    }

    resize();
    return { name: '2d', canvas, setModel, pick, resize, frame: frameWithFlow, destroy };
  }

  global.TeaHolo2D = { create };
})(window);
