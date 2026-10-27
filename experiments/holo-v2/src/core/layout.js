/* ============================================================
 * layout.js —— 确定性 3D 两阶段布局（无 three 依赖，可在 node 测试）
 *
 * 两阶段（社区保持）：
 *  1) 每个星群内部独立跑力导向（斥力 + 群内边 + 趋向目标半径的径向力），
 *     簇中心锁在原点；
 *  2) 把整簇平移到全局锚点。
 *  跨群边【不参与节点布局】，只在渲染时连接——这样星群紧凑、可预测，
 *  绝不会被跨群连线拉出本群，也不会出现同节点每次随机漂移。
 *
 *  overview：五群立体五方位、紧凑；
 *  industry：产业簇在中心放大展开，外部环绕、其他退远。
 *  两套坐标固定种子预计算，运行时仅插值（进入/返回不重排）。
 * ============================================================ */

import { NODES, EDGES, GROUPS, TYPE_META } from "../data/index.js";
import { mulberry32, randInBall } from "./prng.js";

export const LAYOUT_SEED = 42;

/* 全景锚点：产业居中略靠前，其余四群在后方环上均衡环绕（等距，避免透视失衡） */
const OVERVIEW_POS = {
  industry: [0, 1, 6],
  tourism: [13, 8, -4],
  agri: [13, -7, -4],
  living: [-13, 8, -4],
  external: [-13, -8, -4]
};

function radial(p, r) {
  const len = Math.hypot(p[0], p[1], p[2]) || 1;
  const k = r / len;
  return { x: p[0] * k, y: p[1] * k, z: p[2] * k };
}

function anchorsFor(mode) {
  const out = {};
  for (const g of GROUPS) {
    const p = OVERVIEW_POS[g.id];
    if (mode === "industry") {
      if (g.id === "industry") out[g.id] = { x: 0, y: 0, z: 0 };
      else if (g.id === "external") out[g.id] = radial(p, 20);
      else out[g.id] = radial(p, 34);
    } else {
      out[g.id] = { x: p[0], y: p[1], z: p[2] };
    }
  }
  return out;
}

/* 簇的目标半径（产业在展开模式放大） */
function clusterTargetRadius(group, count, mode) {
  if (mode === "industry" && group === "industry") return 9;
  if (mode === "overview" && group === "industry") return 4.4; // 全景只显示产业"团"，展开才放大
  return 1.8 + Math.sqrt(count) * 0.7;
}

/* 单个星群的局部布局（簇中心在原点）。返回 Map(id->{x,y,z}) */
function clusterLayout(group, mode, seed) {
  const nodes = NODES.filter(n => n.group === group);
  const idSet = new Set(nodes.map(n => n.id));
  const intra = EDGES.filter(e => idSet.has(e.source) && idSet.has(e.target));
  const target = clusterTargetRadius(group, nodes.length, mode);
  const expand = mode === "industry" && group === "industry";
  const hardTarget = expand ? 9 : target;

  const rng = mulberry32(seed);
  const n = nodes.length;
  const index = Object.fromEntries(nodes.map((nd, i) => [nd.id, i]));
  const pos = nodes.map(() => randInBall(rng, Math.max(target * 0.6, 1.2)));
  const vel = nodes.map(() => ({ x: 0, y: 0, z: 0 }));

  const REP = 22;
  const K = 0.055;
  const RADIAL_IN = 0.08;   // r<target：弱推出，避免全挤中心
  const RADIAL_OUT = 1.3;   // r>target：强力拉回，保证簇不超目标半径
  const DAMP = 0.85, DT = 0.9;

  const wantFor = e => expand ? (3.8 + e.weight * 0.6) : (3.2 + e.weight * 0.4);
  const links = intra.map(e => ({ a: index[e.source], b: index[e.target], want: wantFor(e) }));

  for (let it = 0; it < 700; it++) {
    const fx = new Array(n).fill(0), fy = new Array(n).fill(0), fz = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y, dz = pos[j].z - pos[i].z;
        let d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.0001) { dx = rng() - 0.5; dy = rng() - 0.5; dz = rng() - 0.5; d2 = 0.01; }
        const dist = Math.sqrt(d2);
        const minDist = (TYPE_META[nodes[i].type].r + TYPE_META[nodes[j].type].r) * 1.3;
        let f = REP / d2;
        if (dist < minDist) f += (minDist - dist) * 0.9;
        const ux = dx / dist, uy = dy / dist, uz = dz / dist;
        fx[i] -= ux * f; fy[i] -= uy * f; fz[i] -= uz * f;
        fx[j] += ux * f; fy[j] += uy * f; fz[j] += uz * f;
      }
    }

    for (const L of links) {
      let dx = pos[L.b].x - pos[L.a].x, dy = pos[L.b].y - pos[L.a].y, dz = pos[L.b].z - pos[L.a].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
      const f = K * (dist - L.want);
      const ux = dx / dist, uy = dy / dist, uz = dz / dist;
      fx[L.a] += ux * f; fy[L.a] += uy * f; fz[L.a] += uz * f;
      fx[L.b] -= ux * f; fy[L.b] -= uy * f; fz[L.b] -= uz * f;
    }

    for (let i = 0; i < n; i++) {
      const r = Math.hypot(pos[i].x, pos[i].y, pos[i].z) || 0.0001;
      const k = r > hardTarget ? RADIAL_OUT : RADIAL_IN;
      const fr = k * (r - hardTarget);
      fx[i] -= (pos[i].x / r) * fr;
      fy[i] -= (pos[i].y / r) * fr;
      fz[i] -= (pos[i].z / r) * fr;
    }

    for (let i = 0; i < n; i++) {
      vel[i].x = (vel[i].x + fx[i] * DT) * DAMP;
      vel[i].y = (vel[i].y + fy[i] * DT) * DAMP;
      vel[i].z = (vel[i].z + fz[i] * DT) * DAMP;
      pos[i].x += vel[i].x * DT;
      pos[i].y += vel[i].y * DT;
      pos[i].z += vel[i].z * DT;
    }
  }

  const out = new Map();
  nodes.forEach((nd, i) => out.set(nd.id, { x: pos[i].x, y: pos[i].y, z: pos[i].z }));
  return out;
}

/* 组装全局布局：各簇局部坐标 + 全局锚点；同时给出簇标签位置（簇正上方之外） */
function solve(mode, seed) {
  const anchors = anchorsFor(mode);
  const out = new Map();
  const labels = {};
  GROUPS.forEach((g, gi) => {
    const local = clusterLayout(g.id, mode, seed + gi * 137);
    const a = anchors[g.id];
    let maxR = 0;
    for (const [id, p] of local) {
      out.set(id, { x: p.x + a.x, y: p.y + a.y, z: p.z + a.z });
      maxR = Math.max(maxR, Math.hypot(p.x, p.y, p.z));
    }
    labels[g.id] = { x: a.x, y: a.y + maxR + 1.9, z: a.z };
  });
  return { positions: out, labels };
}

export function computeLayouts(opts = {}) {
  const seed = opts.seed ?? LAYOUT_SEED;
  const ov = solve("overview", seed);
  const ind = solve("industry", seed + 1);
  return {
    seed,
    overview: ov.positions,
    industry: ind.positions,
    labels: ov.labels,
    labelsIndustry: ind.labels,
    anchors: anchorsFor("overview"),
    anchorsIndustry: anchorsFor("industry")
  };
}

export function lerpPoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}
