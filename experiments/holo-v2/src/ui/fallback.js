/* fallback.js —— WebGL 不可用时的 2D 简化关系图
 * 复用同一套确定性布局（俯视 x-z）与数据；可点击、随观察层/证据筛选重绘。
 * 不提供 3D 旋转，但能查看全部节点与已验证关系、配合搜索与信息卡。 */
import { NODES, EDGES, TYPE_META, KIND_META } from "../data/index.js";
import { computeLayouts } from "../core/layout.js";

const hex = c => "#" + c.toString(16).padStart(6, "0");

export function mountFallback(canvas, store) {
  const ctx = canvas.getContext("2d");
  const layouts = computeLayouts();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function project(p, w, h, scale) {
    return { x: w / 2 + p.x * scale, y: h / 2 + p.z * scale };
  }

  function draw() {
    const { w, h } = resize();
    ctx.fillStyle = "#04060a";
    ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w, h) / 70;
    const { nodeState, edgeState } = store.computeDisplay();
    const pos = new Map();
    for (const n of NODES) {
      const p = layouts.overview.get(n.id);
      pos.set(n.id, project(p, w, h, scale));
    }

    // 边
    for (const e of EDGES) {
      const st = edgeState.get([e.source, e.target].sort().join("|"));
      if (st === "hidden") continue;
      const a = pos.get(e.source), b = pos.get(e.target);
      const color = hex(KIND_META[e.relationType].color);
      ctx.strokeStyle = color;
      ctx.globalAlpha = st === "active" ? 0.9 : st === "dim" ? 0.06 : e.evidenceLevel === "A" ? 0.7 : e.evidenceLevel === "B" ? 0.3 : 0.5;
      ctx.lineWidth = 0.5 + e.weight * 0.4;
      if (e.evidenceLevel === "C") ctx.setLineDash([3, 3]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // 节点
    for (const n of NODES) {
      const st = nodeState.get(n.id);
      if (st === "hidden") continue;
      const p = pos.get(n.id);
      const r = TYPE_META[n.type].r * 1.5;
      ctx.globalAlpha = st === "dim" ? 0.12 : st === "active" ? 1 : 0.9;
      ctx.fillStyle = hex(TYPE_META[n.type].color);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = st === "dim" ? 0.18 : 0.92;
      ctx.fillStyle = "#dfe9f5";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(n.name, p.x, p.y - r - 3);
    }
    ctx.globalAlpha = 1;
  }

  canvas.addEventListener("click", e => {
    const { w, h } = resize();
    const scale = Math.min(w, h) / 70;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    let best = null, bd = 18;
    for (const n of NODES) {
      const p = project(layouts.overview.get(n.id), w, h, scale);
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d < bd) { bd = d; best = n.id; }
    }
    if (best) store.selectNode(best);
  });

  store.subscribe(draw);
  window.addEventListener("resize", draw);
  draw();
}
